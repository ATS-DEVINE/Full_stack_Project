import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { MapPin, Tag, ShoppingBag, Plus, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, totalPrice, getItemsBySeller, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", label: "Home" });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
    setAddresses(data || []);
    if (data && data.length > 0 && !selectedAddress) {
      setSelectedAddress(data.find((a: any) => a.is_default)?.id || data[0].id);
    }
  };

  const addAddress = async () => {
    const { error } = await supabase.from("addresses").insert({ ...addrForm, user_id: user!.id });
    if (error) { toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); return; }
    toast({ title: "Address added" });
    setAddDialogOpen(false);
    setAddrForm({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", label: "Home" });
    fetchAddresses();
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase()).eq("is_active", true).single();
    if (!data) { toast({ title: "Invalid coupon", variant: "destructive" }); return; }
    if (data.min_order_value && totalPrice < data.min_order_value) {
      toast({ title: "Minimum order not met", description: `Min order: ${formatPrice(data.min_order_value)}`, variant: "destructive" });
      return;
    }
    if (data.max_uses && data.used_count && data.used_count >= data.max_uses) {
      toast({ title: "Coupon expired", variant: "destructive" });
      return;
    }
    const disc = data.discount_type === "percentage" ? totalPrice * (data.discount_value / 100) : data.discount_value;
    setDiscount(disc);
    setAppliedCoupon(data.code);
    toast({ title: "Coupon applied!", description: `You save ${formatPrice(disc)}` });
  };

  const placeOrder = async () => {
    if (!selectedAddress) { toast({ title: "Select an address", variant: "destructive" }); return; }
    if (items.length === 0) return;
    setPlacing(true);

    try {
      const grouped = getItemsBySeller();
      // We need seller IDs - fetch from products
      const productIds = items.map(i => i.product.id);
      const { data: dbProducts } = await supabase.from("products").select("id, seller_id").in("id", productIds);
      const sellerMap = new Map(dbProducts?.map(p => [p.id, p.seller_id]) || []);

      // Group items by seller_id
      const sellerGroups: Record<string, typeof items> = {};
      for (const item of items) {
        const sellerId = sellerMap.get(item.product.id) || "";
        if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
        sellerGroups[sellerId].push(item);
      }

      const discountPerOrder = discount / Object.keys(sellerGroups).length;

      for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
        const subtotal = sellerItems.reduce((sum, i) => {
          const price = i.product.discount > 0 ? i.appliedTierPrice * (1 - i.product.discount / 100) : i.appliedTierPrice;
          return sum + price * i.quantity;
        }, 0);

        const { data: order, error: orderErr } = await supabase.from("orders").insert({
          buyer_id: user!.id,
          seller_id: sellerId,
          address_id: selectedAddress,
          subtotal,
          discount: discountPerOrder,
          total: subtotal - discountPerOrder,
          coupon_code: appliedCoupon,
        }).select().single();

        if (orderErr) throw orderErr;

        const orderItems = sellerItems.map(i => ({
          order_id: order.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.appliedTierPrice,
          total_price: i.appliedTierPrice * i.quantity,
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw itemsErr;
      }

      // Update coupon used_count
      if (appliedCoupon) {
        await supabase.rpc("has_role", { _user_id: user!.id, _role: "buyer" }); // just to keep session alive
        await supabase.from("coupons").update({ used_count: (await supabase.from("coupons").select("used_count").eq("code", appliedCoupon).single()).data?.used_count! + 1 }).eq("code", appliedCoupon);
      }

      clearCart();
      toast({ title: "Order placed successfully! 🎉" });
      navigate("/buyer/dashboard");
    } catch (err: any) {
      toast({ title: "Order failed", description: friendlyError(err), variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>;
  if (items.length === 0) return (
    <div className="container py-20 text-center">
      <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
      <h2 className="font-display text-xl font-bold">Cart is empty</h2>
      <Button className="mt-4" onClick={() => navigate("/products")}>Browse Products</Button>
    </div>
  );

  const finalTotal = totalPrice - discount;

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Delivery Address</CardTitle>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Address</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Full Name</Label><Input value={addrForm.full_name} onChange={e => setAddrForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                      <div><Label>Phone</Label><Input value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    </div>
                    <div><Label>Address Line 1</Label><Input value={addrForm.address_line1} onChange={e => setAddrForm(f => ({ ...f, address_line1: e.target.value }))} /></div>
                    <div><Label>Address Line 2</Label><Input value={addrForm.address_line2} onChange={e => setAddrForm(f => ({ ...f, address_line2: e.target.value }))} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>City</Label><Input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} /></div>
                      <div><Label>State</Label><Input value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} /></div>
                      <div><Label>Pincode</Label><Input value={addrForm.pincode} onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value }))} /></div>
                    </div>
                    <Button className="w-full" onClick={addAddress}>Save Address</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No addresses. Add one to continue.</p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((a: any) => (
                    <div
                      key={a.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${selectedAddress === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setSelectedAddress(a.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedAddress === a.id && <CheckCircle className="h-4 w-4 text-primary" />}
                          <span className="text-sm font-medium">{a.full_name}</span>
                          <Badge variant="secondary" className="text-xs">{a.label}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.address_line1}, {a.city}, {a.state} - {a.pincode}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items Summary */}
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              {items.map(item => {
                const dp = item.product.discount > 0 ? item.appliedTierPrice * (1 - item.product.discount / 100) : item.appliedTierPrice;
                return (
                  <div key={item.product.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(dp)}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(dp * item.quantity)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div>
          <div className="sticky top-32 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Payment Summary</h3>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
              {discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-primary">Free</span></div>
            </div>

            {!appliedCoupon && (
              <div className="mb-4 flex gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1" />
                <Button variant="outline" size="sm" onClick={applyCoupon}><Tag className="mr-1 h-4 w-4" /> Apply</Button>
              </div>
            )}
            {appliedCoupon && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">{appliedCoupon} applied</span>
                <button className="ml-auto text-xs text-muted-foreground" onClick={() => { setAppliedCoupon(null); setDiscount(0); }}>Remove</button>
              </div>
            )}

            <div className="mb-4 border-t border-border pt-3 flex justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-xl font-bold">{formatPrice(finalTotal)}</span>
            </div>

            <Button size="lg" className="w-full" onClick={placeOrder} disabled={placing || !selectedAddress}>
              {placing ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
