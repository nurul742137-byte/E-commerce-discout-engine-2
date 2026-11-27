import { Download } from 'lucide-react';
import { CustomerCategory, NavView, OrderRecord } from '../types/store';
import { CUSTOMER_CATEGORIES, formatINR } from '../utils/discountEngine';

interface AnalyticsViewProps {
  orders: OrderRecord[];
  onNavigate: (view: NavView) => void;
}

export function AnalyticsView({ orders, onNavigate }: AnalyticsViewProps) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalDiscounts = orders.reduce((sum, o) => sum + o.discountAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Aggregate best-selling products
  const productMap = new Map<
    string,
    { productId: string; name: string; unitsSold: number; grossSales: number }
  >();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.grossSales += item.lineTotal;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          unitsSold: item.quantity,
          grossSales: item.lineTotal,
        });
      }
    }
  }
  const bestSellers = Array.from(productMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.grossSales - a.grossSales)
    .slice(0, 6);

  const maxUnits = Math.max(1, ...bestSellers.map((p) => p.unitsSold));

  // Aggregate revenue vs discounts by customer category
  const tierStats = CUSTOMER_CATEGORIES.map((tier: CustomerCategory) => {
    const tierOrders = orders.filter((o) => o.customerCategory === tier);
    return {
      tier,
      ordersCount: tierOrders.length,
      revenue: tierOrders.reduce((s, o) => s + o.finalAmount, 0),
      discounts: tierOrders.reduce((s, o) => s + o.discountAmount, 0),
    };
  });
  const maxTierValue = Math.max(1, ...tierStats.map((t) => Math.max(t.revenue, t.discounts)));

  const handleDownloadCsv = () => {
    const headers = [
      'order_id',
      'timestamp',
      'customer_name',
      'customer_category',
      'subtotal',
      'discount_percent',
      'discount_amount',
      'discount_source',
      'coupon_code',
      'final_amount',
      'items_summary',
    ];
    const rows = orders.map((o) => [
      o.orderId,
      o.timestamp,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerCategory,
      o.subtotal.toFixed(2),
      o.discountPercent.toFixed(2),
      o.discountAmount.toFixed(2),
      `"${o.discountSource.replace(/"/g, '""')}"`,
      o.couponCode,
      o.finalAmount.toFixed(2),
      `"${o.items.map((i) => `${i.name} x${i.quantity}`).join('; ').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders_analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sales Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Order volume, average order value, best-selling products, and tier revenue breakdown.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={orders.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalOrders}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {formatINR(totalRevenue)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Discounts</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono tabular-nums">
            {formatINR(totalDiscounts)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Average Order Value</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {formatINR(averageOrderValue)}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm text-slate-600">No sales data available yet.</p>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Place an Order
          </button>
        </div>
      ) : (
        <>
          {/* Two Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Best-Selling Products Horizontal Bar Chart */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Best-Selling Products (Units Sold)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top products ranked by total unit quantity purchased.
                </p>
              </div>
              <div className="space-y-3.5">
                {bestSellers.map((item) => {
                  const widthPct = Math.round((item.unitsSold / maxUnits) * 100);
                  return (
                    <div key={item.productId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-medium text-slate-800 truncate">
                          {item.name}
                        </span>
                        <span className="font-mono tabular-nums text-slate-700 shrink-0">
                          {item.unitsSold} units · {formatINR(item.grossSales)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Chart 2: Revenue vs Discounts by Customer Category */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Revenue vs. Discounts by Customer Tier
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparison of collected revenue and applied savings per category.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 inline-block rounded-xs" />
                    Discount
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 items-end h-56 border-b border-slate-200 pb-2">
                {tierStats.map((stat) => {
                  const revHeight = Math.max(4, Math.round((stat.revenue / maxTierValue) * 100));
                  const discHeight = Math.max(4, Math.round((stat.discounts / maxTierValue) * 100));

                  return (
                    <div key={stat.tier} className="h-full flex flex-col justify-end items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-2 flex-1">
                        <div className="w-8 sm:w-10 h-full flex flex-col justify-end items-center">
                          <span className="text-[10px] font-mono tabular-nums text-slate-600 mb-1">
                            {Math.round(stat.revenue)}
                          </span>
                          <div
                            className="w-full bg-emerald-600 rounded-t-sm transition-all duration-300"
                            style={{ height: `${revHeight}%` }}
                            title={`${stat.tier} Revenue: ${formatINR(stat.revenue)}`}
                          />
                        </div>
                        <div className="w-8 sm:w-10 h-full flex flex-col justify-end items-center">
                          <span className="text-[10px] font-mono tabular-nums text-slate-600 mb-1">
                            {Math.round(stat.discounts)}
                          </span>
                          <div
                            className="w-full bg-amber-500 rounded-t-sm transition-all duration-300"
                            style={{ height: `${discHeight}%` }}
                            title={`${stat.tier} Discounts: ${formatINR(stat.discounts)}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                {tierStats.map((stat) => (
                  <div key={stat.tier}>
                    <p className="text-xs font-semibold text-slate-900">{stat.tier}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {stat.ordersCount} orders
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Best-Selling Products Table */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-900 pb-4 border-b border-slate-100">
              Product Performance Breakdown
            </h3>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Product ID</th>
                    <th className="py-3 pr-4">Product Name</th>
                    <th className="py-3 pr-4 text-right">Units Sold</th>
                    <th className="py-3 text-right">Gross Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {bestSellers.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                        {item.productId}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-800">
                        {item.unitsSold}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatINR(item.grossSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
