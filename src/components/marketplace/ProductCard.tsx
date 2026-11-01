import { Star, Heart, ShoppingCart, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const basePrice = product.pricingTiers[0].price;
  const discountedPrice = product.discount > 0 ? basePrice * (1 - product.discount / 100) : basePrice;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
      {product.discount > 0 && (
        <Badge className="absolute left-3 top-3 z-10 bg-secondary text-secondary-foreground">{product.discount}% OFF</Badge>
      )}
      <button className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-destructive">
        <Heart className="h-4 w-4" />
      </button>

      <Link to={`/products/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">📦</div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{product.category}</span>
          {product.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="mb-1 font-display text-sm font-semibold leading-tight text-foreground line-clamp-2 hover:text-primary">{product.name}</h3>
        </Link>
        <Link to={`/store/${product.sellerId}`} className="mb-2 text-xs text-muted-foreground hover:text-primary">{product.sellerName}</Link>

        <div className="mb-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-foreground">{formatPrice(discountedPrice)}</span>
            {product.discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(basePrice)}</span>}
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          <div className="mb-3 text-xs text-muted-foreground">MOQ: {product.moq} {product.unit}</div>
          <Button size="sm" className="w-full gap-1.5" onClick={() => addToCart(product, product.moq)}>
            <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
