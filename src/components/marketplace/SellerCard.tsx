import { Star, BadgeCheck, MapPin, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Seller } from "@/types/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SellerCard({ seller }: { seller: Seller }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className="bg-gradient-primary p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20 overflow-hidden">
          {seller.logo ? (
            <img src={seller.logo} alt={seller.name} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="font-display text-2xl font-bold text-primary-foreground">{seller.name.charAt(0)}</span>
          )}
        </div>
        <h3 className="flex items-center justify-center gap-1.5 font-display text-base font-semibold text-primary-foreground">
          {seller.name}
          {seller.isVerified && <BadgeCheck className="h-4 w-4" />}
        </h3>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {seller.location}
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {seller.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cat}</Badge>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium">{seller.rating}</span>
            <span className="text-muted-foreground">({seller.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> {seller.totalProducts} products
          </div>
        </div>
        <Link to={`/store/${seller.id}`} className="mt-auto">
          <Button variant="outline" size="sm" className="w-full">View Store</Button>
        </Link>
      </div>
    </div>
  );
}
