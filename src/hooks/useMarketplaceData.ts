import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as mockProducts, sellers as mockSellers, categories as mockCategories } from "@/data/mockData";
import type { Product, Seller, Category } from "@/types/marketplace";

function mapDbProduct(p: any): Product {
  const basePrice = Number(p.base_price);
  const discount = Number(p.discount_percent ?? 0);
  return {
    id: p.id,
    name: p.name,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: p.description ?? "",
    category: p.categories?.name ?? "Uncategorized",
    images: p.images ?? [],
    unit: p.unit ?? "kg",
    pricingTiers: p.pricing_tiers?.length
      ? p.pricing_tiers
          .sort((a: any, b: any) => Number(a.min_qty) - Number(b.min_qty))
          .map((t: any) => ({
            minQty: Number(t.min_qty),
            maxQty: t.max_qty ? Number(t.max_qty) : null,
            price: Number(t.price_per_unit),
          }))
      : [{ minQty: 1, maxQty: null, price: basePrice }],
    moq: Number(p.min_order_qty ?? 1),
    stock: Number(p.stock_quantity ?? 0),
    rating: Number(p.avg_rating ?? 0),
    reviewCount: Number(p.total_reviews ?? 0),
    sellerId: p.seller_id,
    sellerName: p.sellers?.business_name ?? "Unknown Seller",
    isVerified: p.sellers?.verified ?? false,
    discount,
    status: p.status as Product["status"],
  };
}

function mapDbSeller(s: any): Seller {
  return {
    id: s.id,
    name: s.business_name,
    slug: s.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    logo: s.logo_url ?? "",
    description: s.description ?? "",
    rating: 0,
    reviewCount: 0,
    isVerified: s.verified,
    categories: s.category ? [s.category] : [],
    location: s.address ?? "",
    totalProducts: 0,
    joinedDate: s.created_at,
  };
}

function mapDbCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon ?? "📦",
    slug: c.slug,
    productCount: 0,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), sellers(business_name, verified), pricing_tiers(*)")
        .eq("status", "active");
      if (error || !data || data.length === 0) return mockProducts;
      return data.map(mapDbProduct);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), sellers(business_name, verified), pricing_tiers(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error || !data) {
        return mockProducts.find(p => p.id === id) ?? null;
      }
      return mapDbProduct(data);
    },
  });
}

export function useSellers() {
  return useQuery({
    queryKey: ["sellers"],
    queryFn: async (): Promise<Seller[]> => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("status", "approved");
      if (error || !data || data.length === 0) return mockSellers;
      return data.map(mapDbSeller);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSeller(id: string | undefined) {
  return useQuery({
    queryKey: ["seller", id],
    enabled: !!id,
    queryFn: async (): Promise<Seller | null> => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error || !data) {
        return mockSellers.find(s => s.id === id) ?? null;
      }
      return mapDbSeller(data);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*");
      if (error || !data || data.length === 0) return mockCategories;
      return data.map(mapDbCategory);
    },
    staleTime: 1000 * 60 * 5,
  });
}
