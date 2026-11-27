import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import {
  CartItem,
  CustomerCategory,
  DiscountResult,
  NavView,
  OrderRecord,
} from '../types/store';
import { CUSTOMER_CATEGORIES, formatINR } from '../utils/discountEngine';

interface CheckoutViewProps {
  cartItems: CartItem[];
  customerCategory: CustomerCategory;
  discountResult: DiscountResult;
  lastInvoice: OrderRecord | null;
  onChangeCustomerCategory: (category: CustomerCategory) => void;
  onConfirmOrder: (customerName: string) => { order?: OrderRecord; error?: string };
  onNavigate: (view: NavView) => void;
}

export function CheckoutView({
  cartItems,
  customerCategory,
  discountResult,
  lastInvoice,
  onChangeCustomerCategory,
  onConfirmOrder,
  onNavigate,
}: CheckoutViewProps) {
  const [customerName, setCustomerName] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(lastInvoice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setCheckoutError('Please enter the customer full name before generating the invoice.');
      return;
    }

    const result = onConfirmOrder(trimmedName);
    if (result.error) {
      setCheckoutError(result.error);
      return;
    }

    if (result.order) {
      setCompletedOrder(result.order);
      setCustomerName('');
      setCheckoutError(null);
    }
  };

  const handleDownloadInvoice = () => {
    if (!completedOrder) return;
    const blob = new Blob([completedOrder.invoiceText], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${completedOrder.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Checkout &amp; Invoice Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Verify items, confirm customer details, deduct stock, and generate an official receipt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('cart')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Customer Form & Order Summary */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">
            Customer &amp; Order Details
          </h3>

          {checkoutError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
              {checkoutError}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-10 text-center space-y-3 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                {completedOrder
                  ? `Order ${completedOrder.orderId} has been placed and your cart is now clear.`
                  : 'Your cart is empty. Add products before checking out.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Shop More Products
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="customer-name-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Customer Full Name
                </label>
                <input
                  id="customer-name-input"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  Customer Category
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {CUSTOMER_CATEGORIES.map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => onChangeCustomerCategory(tier)}
                      className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                        customerCategory === tier
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Items in Order</p>
                <div className="divide-y divide-slate-100 text-sm">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="py-2 flex items-center justify-between gap-4"
                    >
                      <span className="text-slate-800">
                        {item.name}{' '}
                        <span className="text-xs font-mono text-slate-500">
                          ×{item.quantity}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {formatINR(discountResult.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Discount ({discountResult.finalDiscountPct}% · {discountResult.winningSource})
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-700">
                    -{formatINR(discountResult.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold">
                  <span className="text-slate-900">Final Payable</span>
                  <span className="font-mono tabular-nums text-blue-600">
                    {formatINR(discountResult.finalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Confirm Order &amp; Generate Invoice
              </button>
            </form>
          )}
        </section>

        {/* Right: Official Invoice Preview */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Official Invoice Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {completedOrder
                  ? `Generated for ${completedOrder.orderId} · ${completedOrder.timestamp}`
                  : 'Complete checkout to generate and download your receipt.'}
              </p>
            </div>
            {completedOrder && (
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            )}
          </div>

          {completedOrder ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Order {completedOrder.orderId} confirmed and recorded in Sales Analytics.
                </span>
              </div>
              <pre className="bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed p-5 rounded-xl overflow-x-auto">
                {completedOrder.invoiceText}
              </pre>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
              No invoice generated in this session yet. Confirm an order on the left to view the itemized receipt here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
