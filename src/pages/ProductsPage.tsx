import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProductCard from "@/components/marketplace/ProductCard";
import { useProducts, useCategories } from "@/hooks/useMarketplaceData";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("rating");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.sellerName.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery)
      );
    }
    if (selectedCategory !== "all") {
      const cat = categories.find(c => c.slug === selectedCategory);
      if (cat) result = result.filter(p => p.category === cat.name);
    }
    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.pricingTiers[0].price - b.pricingTiers[0].price); break;
      case "price-high": result.sort((a, b) => b.pricingTiers[0].price - a.pricingTiers[0].price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "newest": result.reverse(); break;
    }
    return result;
  }, [products, categories, selectedCategory, sortBy, searchQuery]);

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Products" }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">{searchQuery ? `Results for "${searchQuery}"` : "All Products"}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price-low">Price: Low → High</SelectItem>
              <SelectItem value="price-high">Price: High → Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden gap-1 md:flex">
            <button onClick={() => setViewMode("grid")} className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`rounded-lg p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className={`${showFilters ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-56`}>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Categories</h3>
            <div className="flex flex-col gap-1">
              <button onClick={() => setSelectedCategory("all")} className={`rounded-lg px-3 py-1.5 text-left text-sm ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                All Categories
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} className={`rounded-lg px-3 py-1.5 text-left text-sm ${selectedCategory === cat.slug ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} products found</p>
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
