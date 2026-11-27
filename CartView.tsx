import { useState } from 'react';
import { ArrowRight, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { CartItem, CustomerCategory, DiscountResult, NavView, Product } from '../types/store';
import { COUPONS, CUSTOMER_CATEGORIES, formatINR, validateCoupon } from '../utils/discountEngine';

interface CartViewProps {
  cartItems: CartItem[];
  products: Product[];
  customerCategory: CustomerCategory;
  activeCoupon: string;
  discountResult: DiscountResult;
  onUpdateQuantity: (productId: string, nextQty: number) => string | null;
  onRemoveItem: (productId: string) => void;
  onResetCart: () => void;
  onChangeCustomerCategory: (category: CustomerCategory) => void;
  onApplyCoupon: (code: string) => void;
  onClearCoupon: () => void;
  onNavigate: (view: NavView) => void;
}

export function CartView({
  cartItems,
  products,
  customerCategory,
  activeCoupon,
  discountResult,
  onUpdateQuantity,
  onRemoveItem,
  onResetCart,
  onChangeCustomerCategory,
  onApplyCoupon,
  onClearCoupon,
  onNavigate,
}: CartViewProps) {
  const [couponInput, setCouponInput] = useState(activeCoupon);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  const getAvailableStock = (productId: string) =>
    products.find((p) => p.productId === productId)?.stock ?? 0;

  const handleQtyChange = (productId: string, nextQty: number) => {
    const err = onUpdateQuantity(productId, nextQty);
    if (err) {
      setCartError(err);
      return;
    }
    setCartError(null);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = couponInput.trim();
    if (!trimmed) {
      setCouponFeedback({
        type: 'error',
        text: 'Please enter a coupon code (e.g., SAVE10, STUDENT5, or FESTIVE20).',
      });
      return;
    }

    try {
      const { normalizedCode, discountPct } = validateCoupon(trimmed, customerCategory);
      onApplyCoupon(normalizedCode);
      setCouponInput(normalizedCode);
      setCouponFeedback({
        type: 'success',
        text: `Coupon ${normalizedCode} (${discountPct}%) applied and compared with automatic slab.`,
      });
    } catch (err) {
      setCouponFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid coupon code.',
      });
    }
  };

  const handleClearCouponClick = () => {
    setCouponInput('');
    setCouponFeedback(null);
    onClearCoupon();
  };

  const handleQuickFillCoupon = (code: string) => {
    setCouponInput(code);
    try {
      const { normalizedCode, discountPct } = validateCoupon(code, customerCategory);
      onApplyCoupon(normalizedCode);
      setCouponFeedback({
        type: 'success',
        text: `Coupon ${normalizedCode} (${discountPct}%) evaluated against your cart.`,
      });
    } catch (err) {
      setCouponFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Coupon not eligible for current tier.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Shopping Cart &amp; Smart Discounts
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Adjust item quantities, switch customer tier, or test coupons with anti-stacking protection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          + Add Products
        </button>
      </div>

      {cartError && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
          <span>{cartError}</span>
          <button
            type="button"
            onClick={() => setCartError(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Cart Items */}
        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Cart Items ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} units)
            </h3>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onResetCart}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cart</span>
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm text-slate-600">Your shopping cart is currently empty.</p>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Product Catalog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => {
                const maxStock = getAvailableStock(item.productId);
                const lineTotal = item.price * item.quantity;

                return (
                  <div
                    key={item.productId}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        {item.category} <span aria-hidden="true">·</span>{' '}
                        <span className="font-mono">{item.productId}</span>{' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="tabular-nums">{maxStock} max stock</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-600 font-mono tabular-nums">
                        {formatINR(item.price)} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                          className="p-2 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-mono tabular-nums font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={item.quantity >= maxStock}
                          onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                          className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-28 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                        {formatINR(lineTotal)}
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => onRemoveItem(item.productId)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Customer Category, Coupon Input, Smart Discount Breakdown */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Customer Tier &amp; Coupon
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select customer category and apply an optional promotional code.
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Customer Category
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {CUSTOMER_CATEGORIES.map((category) => {
                const active = customerCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      onChangeCustomerCategory(category);
                      setCouponFeedback(null);
                    }}
                    className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCouponSubmit} className="space-y-2.5">
            <label htmlFor="coupon-code-input" className="block text-xs font-semibold text-slate-700">
              Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-code-input"
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter SAVE10 / FESTIVE20"
                className="flex-1 min-w-0 px-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Apply Coupon
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-500">
                <span>Try:</span>
                {Object.keys(COUPONS).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleQuickFillCoupon(code)}
                    className="font-mono font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    {code}
                  </button>
                ))}
              </div>
              {activeCoupon && (
                <button
                  type="button"
                  onClick={handleClearCouponClick}
                  className="text-slate-500 hover:text-slate-900 underline"
                >
                  Clear Coupon
                </button>
              )}
            </div>
          </form>

          {couponFeedback && (
            <div
              className={`px-3 py-2.5 rounded-lg text-xs border ${
                couponFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {couponFeedback.text}
            </div>
          )}

          {/* Smart Discount Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formatINR(discountResult.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Automatic Slab Discount</span>
              <span className="font-mono tabular-nums text-slate-800">
                {discountResult.autoDiscountPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Coupon Discount {discountResult.couponCode ? `(${discountResult.couponCode})` : ''}
              </span>
              <span className="font-mono tabular-nums text-slate-800">
                {discountResult.couponDiscountPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Best Base (No Stacking)</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {discountResult.bestBasePct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {discountResult.customerCategory} Tier Bonus
              </span>
              <span className="font-mono tabular-nums text-slate-800">
                +{discountResult.categoryBonusPct}%
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-700 font-medium">
                Applied Discount {discountResult.wasCapped ? '(Capped 25%)' : ''}
              </span>
              <span className="font-mono tabular-nums font-bold text-emerald-700">
                {discountResult.finalDiscountPct}% (-{formatINR(discountResult.discountAmount)})
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-base font-semibold text-slate-900">Final Amount</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-600">
              {formatINR(discountResult.finalAmount)}
            </span>
          </div>

          <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 leading-relaxed">
            {discountResult.savingsMessage}
          </p>

          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => onNavigate('checkout')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  );
}
