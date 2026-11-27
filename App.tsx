/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { Sidebar } from './components/Sidebar';
import { INITIAL_ORDERS, INITIAL_PRODUCTS } from './data/initialCatalog';
import {
  CartItem,
  CustomerCategory,
  NavView,
  OrderItemRecord,
  OrderRecord,
  Product,
} from './types/store';
import {
  calculateSmartDiscount,
  formatInvoiceText,
  validateCoupon,
} from './utils/discountEngine';

const STORAGE_KEYS = {
  products: 'ede_products_v1',
  orders: 'ede_orders_v1',
  cart: 'ede_cart_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    readStorage<OrderRecord[]>(STORAGE_KEYS.orders, INITIAL_ORDERS)
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );

  const [customerCategory, setCustomerCategory] = useState<CustomerCategory>('Regular');
  const [activeCoupon, setActiveCoupon] = useState('');
  const [lastInvoice, setLastInvoice] = useState<OrderRecord | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    } catch {
      // Ignore storage quota errors
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  const subtotal = useMemo(
    () =>
      Math.round(
        cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
      ) / 100,
    [cartItems]
  );

  const discountResult = useMemo(() => {
    try {
      return calculateSmartDiscount(subtotal, activeCoupon, customerCategory);
    } catch {
      return calculateSmartDiscount(subtotal, '', customerCategory);
    }
  }, [subtotal, activeCoupon, customerCategory]);

  const cartUnits = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleAddToCart = (product: Product, quantity: number): string | null => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return 'Quantity must be a positive whole number.';
    }
    if (product.stock <= 0) {
      return `"${product.name}" is currently out of stock.`;
    }

    const existing = cartItems.find((item) => item.productId === product.productId);
    const existingQty = existing ? existing.quantity : 0;
    if (existingQty + quantity > product.stock) {
      return `Cannot add ${quantity} unit(s) of "${product.name}". In cart: ${existingQty}, Available stock: ${product.stock}.`;
    }

    setCartItems((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity,
        },
      ];
    });
    return null;
  };

  const handleUpdateQuantity = (productId: string, nextQty: number): string | null => {
    const targetProduct = products.find((p) => p.productId === productId);
    const availableStock = targetProduct ? targetProduct.stock : 0;

    if (nextQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.productId !== productId));
      return null;
    }

    if (nextQty > availableStock) {
      return `Insufficient stock for "${targetProduct?.name ?? productId}". Available: ${availableStock}.`;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQty } : item
      )
    );
    return null;
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleResetCart = () => {
    setCartItems([]);
    setActiveCoupon('');
  };

  const handleChangeCustomerCategory = (category: CustomerCategory) => {
    setCustomerCategory(category);
    if (activeCoupon) {
      try {
        validateCoupon(activeCoupon, category);
      } catch {
        setActiveCoupon('');
      }
    }
  };

  const handleConfirmOrder = (
    customerName: string
  ): { order?: OrderRecord; error?: string } => {
    if (cartItems.length === 0) {
      return { error: 'Cannot complete checkout with an empty cart.' };
    }

    // Verify stock availability across all items before deducting
    for (const item of cartItems) {
      const product = products.find((p) => p.productId === item.productId);
      if (!product || item.quantity > product.stock) {
        return {
          error: `Insufficient stock for "${item.name}". Available: ${product?.stock ?? 0}.`,
        };
      }
    }

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderId = `ORD-${datePart}-${String(orders.length + 1).padStart(4, '0')}`;
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const orderItems: OrderItemRecord[] = cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      lineTotal: Math.round(item.price * item.quantity * 100) / 100,
    }));

    const invoiceText = formatInvoiceText({
      orderId,
      timestamp,
      customerName,
      items: orderItems,
      discountResult,
    });

    const newOrder: OrderRecord = {
      orderId,
      timestamp,
      customerName,
      customerCategory: discountResult.customerCategory,
      subtotal: discountResult.subtotal,
      discountPercent: discountResult.finalDiscountPct,
      discountAmount: discountResult.discountAmount,
      discountSource: discountResult.winningSource,
      couponCode: discountResult.couponCode || 'NONE',
      finalAmount: discountResult.finalAmount,
      items: orderItems,
      invoiceText,
    };

    // Deduct product stock and persist order
    setProducts((prev) =>
      prev.map((product) => {
        const bought = cartItems.find((c) => c.productId === product.productId);
        return bought
          ? { ...product, stock: Math.max(0, product.stock - bought.quantity) }
          : product;
      })
    );
    setOrders((prev) => [...prev, newOrder]);
    setLastInvoice(newOrder);
    setCartItems([]);
    setActiveCoupon('');

    return { order: newOrder };
  };

  const handleResetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setCartItems([]);
    setActiveCoupon('');
    setCustomerCategory('Regular');
    setLastInvoice(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        cartUnits={cartUnits}
        mobileOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen((prev) => !prev)}
        onResetDemoData={handleResetDemoData}
      />

      <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'products' && (
            <ProductsView
              products={products}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'cart' && (
            <CartView
              cartItems={cartItems}
              products={products}
              customerCategory={customerCategory}
              activeCoupon={activeCoupon}
              discountResult={discountResult}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onResetCart={handleResetCart}
              onChangeCustomerCategory={handleChangeCustomerCategory}
              onApplyCoupon={setActiveCoupon}
              onClearCoupon={() => setActiveCoupon('')}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView orders={orders} onNavigate={setActiveView} />
          )}

          {activeView === 'checkout' && (
            <CheckoutView
              cartItems={cartItems}
              customerCategory={customerCategory}
              discountResult={discountResult}
              lastInvoice={lastInvoice}
              onChangeCustomerCategory={handleChangeCustomerCategory}
              onConfirmOrder={handleConfirmOrder}
              onNavigate={setActiveView}
            />
          )}
        </div>
      </main>
    </div>
  );
}
