import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Star, BadgeCheck, Heart, ShoppingCart, Minus, Plus, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProductCard from "@/components/marketplace/ProductCard";
import { useProduct, useProducts } from "@/hooks/useMarketplaceData";
import { useCart } from "@/contexts/CartContext";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) setQuantity(product.moq);
  }, [product]);

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!product) return <div className="container py-20 text-center text-muted-foreground">Product not found.</div>;

  const currentTier = product.pricingTiers.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)) || product.pricingTiers[0];
  const unitPrice = currentTier.price;
  const discountedPrice = product.discount > 0 ? unitPrice * (1 - product.discount / 100) : unitPrice;
  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: product.name }]} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
          {product.discount > 0 && <Badge className="absolute left-4 top-4 bg-secondary text-secondary-foreground text-sm">{product.discount}% OFF</Badge>}
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl">📦</div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted text-muted-foreground">{product.category}</Badge>
            {product.isVerified && <Badge className="gap-1 bg-primary/10 text-primary"><BadgeCheck className="h-3 w-3" /> Verified Seller</Badge>}
          </div>

          <h1 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>

          <Link to={`/store/${product.sellerId}`} className="mb-3 inline-block text-sm text-primary hover:underline">
            by {product.sellerName}
          </Link>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}`} />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-foreground">{formatPrice(discountedPrice)}</span>
              {product.discount > 0 && <span className="text-lg text-muted-foreground line-through">{formatPrice(unitPrice)}</span>}
              <span className="text-muted-foreground">/{product.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">Price varies by quantity — see pricing tiers below</p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Bulk Pricing (per {product.unit})</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-medium text-foreground">Quantity</th>
                    <th className="px-4 py-2 text-right font-medium text-foreground">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.pricingTiers.map((tier, i) => (
                    <tr key={i} className={`border-t border-border ${currentTier === tier ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-2 text-foreground">
                        {tier.minQty}–{tier.maxQty ?? "∞"} {product.unit}
                        {currentTier === tier && <Badge className="ml-2 bg-primary/10 text-primary text-[10px]">Selected</Badge>}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">{formatPrice(tier.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">Quantity ({product.unit})</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-border">
                <button className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted" onClick={() => setQuantity(Math.max(product.moq, quantity - 1))}><Minus className="h-4 w-4" /></button>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(product.moq, parseInt(e.target.value) || product.moq))} className="h-10 w-16 border-x border-border bg-background text-center text-sm text-foreground focus:outline-none" />
                <button className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground">MOQ: {product.moq} {product.unit}</span>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-primary" />
            <span className={product.stock > 0 ? "text-primary" : "text-destructive"}>
              {product.stock > 0 ? `${product.stock} ${product.unit} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="mb-6 flex gap-3">
            <Button size="lg" className="flex-1 gap-2" onClick={() => addToCart(product, quantity)}>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Heart className="h-4 w-4" /> Favorite
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Description</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold text-foreground">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
