import { CustomerCategory, DiscountResult, OrderItemRecord } from '../types/store';

export const MAX_DISCOUNT_PERCENT = 25;

export const CUSTOMER_CATEGORIES: CustomerCategory[] = ['Regular', 'Student', 'Premium'];

export const CATEGORY_BONUS_RATES: Record<CustomerCategory, number> = {
  Regular: 0,
  Student: 5,
  Premium: 10,
};

export interface CouponConfig {
  code: string;
  percent: number;
  description: string;
  eligibleCategories: CustomerCategory[];
}

export const COUPONS: Record<string, CouponConfig> = {
  SAVE10: {
    code: 'SAVE10',
    percent: 10,
    description: '10% off on any order',
    eligibleCategories: ['Regular', 'Student', 'Premium'],
  },
  STUDENT5: {
    code: 'STUDENT5',
    percent: 5,
    description: '5% Student exclusive discount',
    eligibleCategories: ['Student'],
  },
  FESTIVE20: {
    code: 'FESTIVE20',
    percent: 20,
    description: '20% festive season discount',
    eligibleCategories: ['Regular', 'Student', 'Premium'],
  },
};

export function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getAutomaticDiscountPercent(subtotal: number): number {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative.');
  }
  if (subtotal < 1000) return 0;
  if (subtotal < 2500) return 5;
  if (subtotal < 5000) return 10;
  return 15;
}

export function validateCoupon(
  couponCode: string,
  customerCategory: CustomerCategory = 'Regular'
): { normalizedCode: string; discountPct: number } {
  const normalizedCode = couponCode.trim().toUpperCase();
  if (!normalizedCode) {
    return { normalizedCode: '', discountPct: 0 };
  }

  const coupon = COUPONS[normalizedCode];
  if (!coupon) {
    throw new Error(
      `Invalid coupon code "${normalizedCode}". Available codes: SAVE10, STUDENT5, FESTIVE20.`
    );
  }

  if (!coupon.eligibleCategories.includes(customerCategory)) {
    throw new Error(
      `Coupon "${normalizedCode}" is only valid for ${coupon.eligibleCategories.join(', ')} customers.`
    );
  }

  return { normalizedCode, discountPct: coupon.percent };
}

export function calculateSmartDiscount(
  subtotalInput: number,
  couponCode = '',
  customerCategory: CustomerCategory = 'Regular'
): DiscountResult {
  const subtotal = Math.round(Math.max(0, subtotalInput) * 100) / 100;
  const autoDiscountPct = getAutomaticDiscountPercent(subtotal);
  const { normalizedCode, discountPct: couponDiscountPct } = validateCoupon(
    couponCode,
    customerCategory
  );

  let bestBasePct = 0;
  let winningSource = 'None';

  if (couponDiscountPct > autoDiscountPct) {
    bestBasePct = couponDiscountPct;
    winningSource = `Coupon (${normalizedCode})`;
  } else if (autoDiscountPct > couponDiscountPct) {
    bestBasePct = autoDiscountPct;
    winningSource = 'Automatic Slab';
  } else if (autoDiscountPct > 0 && couponDiscountPct === autoDiscountPct) {
    bestBasePct = autoDiscountPct;
    winningSource = `Automatic / ${normalizedCode} (Tie)`;
  }

  const categoryBonusPct = subtotal > 0 ? CATEGORY_BONUS_RATES[customerCategory] : 0;
  if (categoryBonusPct > 0 && winningSource === 'None') {
    winningSource = `${customerCategory} Category Bonus`;
  } else if (categoryBonusPct > 0) {
    winningSource = `${winningSource} + ${customerCategory} Bonus`;
  }

  const rawTotalPct = bestBasePct + categoryBonusPct;
  const wasCapped = rawTotalPct > MAX_DISCOUNT_PERCENT;
  const finalDiscountPct = Math.min(rawTotalPct, MAX_DISCOUNT_PERCENT);

  const discountAmount = Math.round(subtotal * (finalDiscountPct / 100) * 100) / 100;
  const finalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

  let savingsMessage = 'Add items to your cart to calculate eligible discounts.';
  if (subtotal > 0 && discountAmount === 0) {
    const needed = Math.round((1000 - subtotal) * 100) / 100;
    savingsMessage = `Add ${formatINR(needed)} more to unlock the 5% automatic tier, or apply a coupon code.`;
  } else if (discountAmount > 0) {
    const capNote = wasCapped ? ' (capped at 25% max)' : '';
    savingsMessage = `You save ${formatINR(discountAmount)} (${finalDiscountPct}% off)${capNote} via ${winningSource}.`;
  }

  return {
    subtotal,
    customerCategory,
    autoDiscountPct,
    couponCode: normalizedCode,
    couponDiscountPct,
    bestBasePct,
    categoryBonusPct,
    rawTotalPct,
    finalDiscountPct,
    discountAmount,
    finalAmount,
    winningSource,
    wasCapped,
    savingsMessage,
  };
}

export function formatInvoiceText(params: {
  orderId: string;
  timestamp: string;
  customerName: string;
  items: OrderItemRecord[];
  discountResult: DiscountResult;
}): string {
  const { orderId, timestamp, customerName, items, discountResult } = params;
  const divider = '='.repeat(62);
  const subDivider = '-'.repeat(62);

  const lines = [
    divider,
    '               E-COMMERCE DISCOUNT ENGINE',
    '                    OFFICIAL INVOICE',
    divider,
    `Order ID          : ${orderId}`,
    `Date & Time       : ${timestamp}`,
    `Customer Name     : ${customerName}`,
    `Customer Category : ${discountResult.customerCategory}`,
    subDivider,
    `${'Item'.padEnd(28)} ${'Qty'.padStart(4)} ${'Price'.padStart(12)} ${'Total'.padStart(14)}`,
    subDivider,
  ];

  for (const item of items) {
    const label = item.name.length > 27 ? `${item.name.slice(0, 24)}...` : item.name;
    lines.push(
      `${label.padEnd(28)} ${String(item.quantity).padStart(4)} ${item.price.toFixed(2).padStart(12)} ${item.lineTotal.toFixed(2).padStart(14)}`
    );
  }

  lines.push(
    subDivider,
    `${'Subtotal'.padEnd(42)} ${formatINR(discountResult.subtotal).padStart(18)}`,
    `${'Automatic Slab Discount'.padEnd(42)} ${`${discountResult.autoDiscountPct}%`.padStart(18)}`,
    `${'Coupon Applied'.padEnd(42)} ${(discountResult.couponCode || 'NONE').padStart(18)}`,
    `${'Coupon Discount'.padEnd(42)} ${`${discountResult.couponDiscountPct}%`.padStart(18)}`,
    `${'Customer Category Bonus'.padEnd(42)} ${`+${discountResult.categoryBonusPct}%`.padStart(18)}`,
    `${'Final Discount Applied'.padEnd(42)} ${`${discountResult.finalDiscountPct}%`.padStart(18)}`,
    `Discount Source   : ${discountResult.winningSource}`,
    `${'Total Savings'.padEnd(42)} ${`-${formatINR(discountResult.discountAmount)}`.padStart(18)}`,
    divider,
    `${'FINAL PAYABLE AMOUNT'.padEnd(42)} ${formatINR(discountResult.finalAmount).padStart(18)}`,
    divider,
    'Thank you for shopping with E-Commerce Discount Engine!'
  );

  return lines.join('\n');
}
