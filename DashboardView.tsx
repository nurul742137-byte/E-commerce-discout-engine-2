import { ArrowRight } from 'lucide-react';
import { NavView, OrderRecord, Product } from '../types/store';
import { formatINR } from '../utils/discountEngine';

interface DashboardViewProps {
  products: Product[];
  orders: OrderRecord[];
  onNavigate: (view: NavView) => void;
}

export function DashboardView({ products, orders, onNavigate }: DashboardViewProps) {
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
  const totalDiscount = orders.reduce((sum, order) => sum + order.discountAmount, 0);
  const recentOrders = [...orders].reverse().slice(0, 8);

  const metrics = [
    {
      label: 'Total Products',
      value: String(totalProducts),
      detail: `${products.filter((p) => p.stock > 0).length} currently in stock`,
    },
    {
      label: 'Total Orders',
      value: String(totalOrders),
      detail: 'Completed transactions',
    },
    {
      label: 'Total Revenue',
      value: formatINR(totalRevenue),
      detail: 'Net payable collected',
    },
    {
      label: 'Total Discount Provided',
      value: formatINR(totalDiscount),
      detail: 'Customer savings delivered',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview of catalog availability, cumulative sales, and smart discount savings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
              {metric.value}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">{metric.detail}</p>
          </div>
        ))}
      </div>

      {/* Discount Rules Matrix + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Smart Discount Rules
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Compares automatic slabs against coupons without unfair stacking, capped at 25%.
            </p>
          </div>

          <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Below ₹1,000</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">0% Auto</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">₹1,000 – ₹2,499</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">5% Auto</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">₹2,500 – ₹4,999</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">10% Auto</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">₹5,000 and above</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">15% Auto</span>
            </div>
          </div>

          <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500">Active Coupons</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-900">SAVE10</span>
              <span className="text-slate-600">10% · All tiers</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-900">STUDENT5</span>
              <span className="text-slate-600">5% · Student only</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-900">FESTIVE20</span>
              <span className="text-slate-600">20% · All tiers</span>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500">Customer Tier Bonuses</p>
            <p className="text-slate-600 text-xs leading-relaxed">
              Regular (+0%) · Student (+5%) · Premium (+10%). Final total discount is strictly capped at 25%.
            </p>
          </div>
        </section>

        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest completed purchases persisted locally.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              View Sales Analytics
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-500">No orders recorded yet.</p>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Order ID</th>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Tier</th>
                    <th className="py-3 pr-4 text-right">Subtotal</th>
                    <th className="py-3 pr-4 text-right">Saved</th>
                    <th className="py-3 text-right">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {order.orderId}
                      </td>
                      <td className="py-3 pr-4 text-slate-900 font-medium whitespace-nowrap">
                        {order.customerName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {order.customerCategory}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatINR(order.subtotal)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-emerald-700 whitespace-nowrap">
                        -{formatINR(order.discountAmount)}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatINR(order.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
