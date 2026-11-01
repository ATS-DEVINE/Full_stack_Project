export interface PricingTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  unit: string;
  pricingTiers: PricingTier[];
  moq: number;
  stock: number;
  rating: number;
  reviewCount: number;
  sellerId: string;
  sellerName: string;
  isVerified: boolean;
  discount: number;
  status: "active" | "draft" | "out_of_stock";
}

export interface Seller {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  categories: string[];
  location: string;
  totalProducts: number;
  joinedDate: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  productCount: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  minOrderValue: number;
  maxUses: number;
  expiryDate: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  appliedTierPrice: number;
}

export interface Review {
  id: string;
  productId: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
}
