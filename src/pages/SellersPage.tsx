import Breadcrumbs from "@/components/layout/Breadcrumbs";
import SellerCard from "@/components/marketplace/SellerCard";
import { useSellers } from "@/hooks/useMarketplaceData";

export default function SellersPage() {
  const { data: sellers = [] } = useSellers();

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Sellers" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Verified Sellers & Suppliers</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sellers.map(s => <SellerCard key={s.id} seller={s} />)}
      </div>
    </div>
  );
}
