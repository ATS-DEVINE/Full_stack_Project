import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { useCart } from "@/contexts/CartContext";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, getItemsBySeller } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
        <h2 className="mb-2 font-display text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mb-6 text-sm text-muted-foreground">Start adding products to your cart</p>
        <Link to="/products"><Button className="gap-2">Browse Products <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    );
  }

  const grouped = getItemsBySeller();

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Shopping Cart ({items.length} items)</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(grouped).map(([sellerName, sellerItems]) => (
            <div key={sellerName} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Sold by: {sellerName}</span>
              </div>
              <div className="divide-y divide-border">
                {sellerItems.map(item => {
                  const discountedPrice = item.product.discount > 0 ? item.appliedTierPrice * (1 - item.product.discount / 100) : item.appliedTierPrice;
                  return (
                    <div key={item.product.id} className="flex gap-4 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                        {item.product.category === "Vegetables" ? "🥬" : item.product.category === "Spices" ? "🌶️" : item.product.category === "Dairy" ? "🥛" : "📦"}
                      </div>
                      <div className="flex-1">
                        <Link to={`/products/${item.product.id}`} className="font-display text-sm font-semibold text-foreground hover:text-primary">{item.product.name}</Link>
                        <p className="text-xs text-muted-foreground">{formatPrice(discountedPrice)}/{item.product.unit}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center rounded border border-border">
                            <button className="flex h-7 w-7 items-center justify-center hover:bg-muted" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center text-xs">{item.quantity}</span>
                            <button className="flex h-7 w-7 items-center justify-center hover:bg-muted" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3" /></button>
                          </div>
                          <button className="text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-sm font-bold text-foreground">{formatPrice(discountedPrice * item.quantity)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border bg-muted/30 px-4 py-2 text-right text-sm">
                Subtotal: <span className="font-semibold text-foreground">{formatPrice(sellerItems.reduce((sum, i) => { const dp = i.product.discount > 0 ? i.appliedTierPrice * (1 - i.product.discount / 100) : i.appliedTierPrice; return sum + dp * i.quantity; }, 0))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-32 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Order Summary</h3>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="text-primary">Calculated at checkout</span></div>
            </div>
            <div className="mb-4 border-t border-border pt-3 flex justify-between">
              <span className="font-display font-semibold text-foreground">Total</span>
              <span className="font-display text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
            </div>

            <div className="mb-3">
              <input placeholder="Coupon code" className="mb-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              <Button variant="outline" size="sm" className="w-full">Apply Coupon</Button>
            </div>

            <Link to="/checkout">
              <Button size="lg" className="w-full gap-2">Proceed to Checkout <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
