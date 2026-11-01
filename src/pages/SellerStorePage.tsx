import { useParams } from "react-router-dom";
import { Star, BadgeCheck, MapPin, Package, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProductCard from "@/components/marketplace/ProductCard";
import { useSeller, useProducts } from "@/hooks/useMarketplaceData";

export default function SellerStorePage() {
  const { sellerId } = useParams();
  const { data: seller, isLoading } = useSeller(sellerId);
  const { data: allProducts = [] } = useProducts();
  const sellerProducts = allProducts.filter(p => p.sellerId === sellerId);

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  if (!seller) return <div className="container py-20 text-center text-muted-foreground">Store not found.</div>;

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Sellers", href: "/sellers" }, { label: seller.name }]} />

      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
        <div className="bg-gradient-primary p-8 text-center text-primary-foreground md:p-12">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20 overflow-hidden">
            {seller.logo ? (
              <img src={seller.logo} alt={seller.name} className="h-full w-full object-contain p-1" />
            ) : (
              <span className="font-display text-3xl font-bold">{seller.name.charAt(0)}</span>
            )}
          </div>
          <h1 className="mb-1 flex items-center justify-center gap-2 font-display text-2xl font-bold">
            {seller.name}
            {seller.isVerified && <BadgeCheck className="h-5 w-5" />}
          </h1>
          <p className="mx-auto max-w-lg text-sm opacity-80">{seller.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 px-6 py-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {seller.location}</span>
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> {seller.rating} ({seller.reviewCount} reviews)</span>
          <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {seller.totalProducts} products</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(seller.joinedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Products ({sellerProducts.length})</h2>
      {sellerProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sellerProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <p className="py-10 text-center text-muted-foreground">No products listed yet.</p>
      )}
    </div>
  );
}
