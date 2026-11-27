import { useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingBag } from 'lucide-react';
import { CartItem, NavView, Product } from '../types/store';
import { formatINR } from '../utils/discountEngine';

interface ProductsViewProps {
  products: Product[];
  cartItems: CartItem[];
  onAddToCart: (product: Product, quantity: number) => string | null;
  onNavigate: (view: NavView) => void;
}

export function ProductsView({
  products,
  cartItems,
  onAddToCart,
  onNavigate,
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).sort();
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        product.productId.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const getQty = (productId: string) => quantities[productId] ?? 1;

  const setQty = (productId: string, nextQty: number, maxStock: number) => {
    const safeMax = Math.max(1, maxStock);
    const clamped = Math.max(1, Math.min(nextQty, safeMax));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  };

  const getCartQuantity = (productId: string) =>
    cartItems.find((item) => item.productId === productId)?.quantity ?? 0;

  const handleAdd = (product: Product) => {
    const qty = getQty(product.productId);
    const errorMsg = onAddToCart(product, qty);
    if (errorMsg) {
      setFeedback({ type: 'error', text: errorMsg });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Added ${qty} × ${product.name} to your shopping cart.`,
    });
    setQuantities((prev) => ({ ...prev, [product.productId]: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Catalog
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} curated items · Live stock checks before adding to cart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('cart')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Go to Cart</span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, ID (e.g. P104), or category..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter by category">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm text-slate-600">
            No products matched &ldquo;{searchQuery}&rdquo; in {selectedCategory}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const inCartQty = getCartQuantity(product.productId);
            const remainingAvailable = Math.max(0, product.stock - inCartQty);
            const isOutOfStock = product.stock === 0;
            const currentQty = getQty(product.productId);

            return (
              <article
                key={product.productId}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {product.category} <span aria-hidden="true">·</span>{' '}
                      <span className="font-mono">{product.productId}</span>
                    </span>
                    <span
                      className={`font-medium tabular-nums ${
                        isOutOfStock
                          ? 'text-red-600'
                          : product.stock <= 5
                            ? 'text-amber-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {product.skuNote}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {formatINR(product.price)}
                    </span>
                    {inCartQty > 0 && (
                      <span className="text-xs font-medium text-blue-700 font-mono tabular-nums">
                        {inCartQty} in cart
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${product.name}`}
                        disabled={isOutOfStock || currentQty <= 1}
                        onClick={() => setQty(product.productId, currentQty - 1, remainingAvailable || 1)}
                        className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-mono tabular-nums font-medium text-slate-900">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${product.name}`}
                        disabled={isOutOfStock || currentQty >= remainingAvailable}
                        onClick={() => setQty(product.productId, currentQty + 1, remainingAvailable || 1)}
                        className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock || remainingAvailable === 0}
                      onClick={() => handleAdd(product)}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap"
                    >
                      {isOutOfStock
                        ? 'Unavailable'
                        : remainingAvailable === 0
                          ? 'Max in Cart'
                          : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
