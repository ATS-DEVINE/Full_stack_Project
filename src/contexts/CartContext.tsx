import React, { createContext, useContext, useState, useCallback } from "react";
import { CartItem, Product } from "@/types/marketplace";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getItemsBySeller: () => Record<string, CartItem[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getPriceForQuantity(product: Product, qty: number): number {
  for (const tier of product.pricingTiers) {
    if (qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)) {
      return tier.price;
    }
  }
  return product.pricingTiers[0].price;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = useCallback((product: Product, quantity: number) => {
    if (quantity < product.moq) {
      toast({ title: "Minimum order quantity not met", description: `MOQ for this product is ${product.moq} ${product.unit}`, variant: "destructive" });
      return;
    }
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty, appliedTierPrice: getPriceForQuantity(product, newQty) } : i);
      }
      return [...prev, { product, quantity, appliedTierPrice: getPriceForQuantity(product, quantity) }];
    });
    toast({ title: "Added to cart", description: `${product.name} × ${quantity} ${product.unit}` });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      if (quantity < i.product.moq) return i;
      return { ...i, quantity, appliedTierPrice: getPriceForQuantity(i.product, quantity) };
    }));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const price = i.appliedTierPrice;
    const discounted = i.product.discount > 0 ? price * (1 - i.product.discount / 100) : price;
    return sum + discounted * i.quantity;
  }, 0);

  const getItemsBySeller = useCallback(() => {
    return items.reduce<Record<string, CartItem[]>>((acc, item) => {
      const key = item.product.sellerName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, getItemsBySeller }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
