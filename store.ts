export type CustomerCategory = 'Regular' | 'Student' | 'Premium';

export type NavView =
  | 'dashboard'
  | 'products'
  | 'cart'
  | 'analytics'
  | 'checkout';

export interface Product {
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  skuNote: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface DiscountResult {
  subtotal: number;
  customerCategory: CustomerCategory;
  autoDiscountPct: number;
  couponCode: string;
  couponDiscountPct: number;
  bestBasePct: number;
  categoryBonusPct: number;
  rawTotalPct: number;
  finalDiscountPct: number;
  discountAmount: number;
  finalAmount: number;
  winningSource: string;
  wasCapped: boolean;
  savingsMessage: string;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  orderId: string;
  timestamp: string;
  customerName: string;
  customerCategory: CustomerCategory;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  discountSource: string;
  couponCode: string;
  finalAmount: number;
  items: OrderItemRecord[];
  invoiceText: string;
}
