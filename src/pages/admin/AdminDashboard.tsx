import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";
import { Users, ShoppingBag, Store, IndianRupee, Package, Tag, CheckCircle, XCircle, Shield, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState({ buyers: 0, sellers: 0, products: 0, orders: 0, revenue: 0 });
  const [sellers, setSellers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Coupon form
  const [couponForm, setCouponForm] = useState({ code: "", description: "", discount_type: "percentage", discount_value: 0, min_order_value: 0, max_uses: 100, expires_at: "" });
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  // Category form
  const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "" });
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    const [sellersRes, productsRes, ordersRes, profilesRes, couponsRes, catsRes] = await Promise.all([
      supabase.from("sellers").select("*"),
      supabase.from("products").select("*, sellers(business_name)"),
      supabase.from("orders").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("coupons").select("*"),
      supabase.from("categories").select("*"),
    ]);
    setSellers(sellersRes.data || []);
    setProducts(productsRes.data || []);
    setCoupons(couponsRes.data || []);
    setCategories(catsRes.data || []);
    setBuyers(profilesRes.data || []);

    const orders = ordersRes.data || [];
    const revenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    setStats({
      buyers: (profilesRes.data || []).length,
      sellers: (sellersRes.data || []).length,
      products: (productsRes.data || []).length,
      orders: orders.length,
      revenue,
    });
  };

  const updateSellerStatus = async (sellerId: string, status: string, verified: boolean) => {
    await supabase.from("sellers").update({ status: status as any, verified }).eq("id", sellerId);
    toast({ title: `Seller ${status}` });
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product removed" });
    fetchAll();
  };

  const createCoupon = async () => {
    const { error } = await supabase.from("coupons").insert({
      ...couponForm,
      expires_at: couponForm.expires_at || null,
    });
    if (error) { toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); return; }
    toast({ title: "Coupon created" });
    setCouponDialogOpen(false);
    setCouponForm({ code: "", description: "", discount_type: "percentage", discount_value: 0, min_order_value: 0, max_uses: 100, expires_at: "" });
    fetchAll();
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    fetchAll();
  };

  const createCategory = async () => {
    const { error } = await supabase.from("categories").insert(catForm);
    if (error) { toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); return; }
    toast({ title: "Category created" });
    setCatDialogOpen(false);
    setCatForm({ name: "", slug: "", icon: "" });
    fetchAll();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Category deleted" });
    fetchAll();
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>;
  if (!isAdmin) return null;

  const statCards = [
    { label: "Total Buyers", value: stats.buyers, icon: Users, color: "text-primary" },
    { label: "Total Sellers", value: stats.sellers, icon: Store, color: "text-secondary" },
    { label: "Products", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "text-secondary" },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary" },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your marketplace</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sellers">
        <TabsList className="mb-4">
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="sellers">
          <Card>
            <CardHeader><CardTitle>Seller Management</CardTitle></CardHeader>
            <CardContent>
              {sellers.length === 0 ? <p className="text-muted-foreground">No sellers yet.</p> : (
                <div className="space-y-3">
                  {sellers.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">{s.business_name}</p>
                        <p className="text-sm text-muted-foreground">GSTIN: {s.gstin || "N/A"} • Status: <Badge variant={s.status === "approved" ? "default" : "secondary"}>{s.status}</Badge></p>
                      </div>
                      <div className="flex gap-2">
                        {s.status !== "approved" && (
                          <Button size="sm" onClick={() => updateSellerStatus(s.id, "approved", true)}>
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        )}
                        {s.status !== "rejected" && (
                          <Button size="sm" variant="destructive" onClick={() => updateSellerStatus(s.id, "rejected", false)}>
                            <XCircle className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers">
          <Card>
            <CardHeader><CardTitle>Buyer Management</CardTitle></CardHeader>
            <CardContent>
              {buyers.length === 0 ? <p className="text-muted-foreground">No buyers yet.</p> : (
                <div className="space-y-2">
                  {buyers.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">{b.full_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{b.phone || "No phone"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle>Product Moderation</CardTitle></CardHeader>
            <CardContent>
              {products.length === 0 ? <p className="text-muted-foreground">No products yet.</p> : (
                <div className="space-y-2">
                  {products.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">₹{p.base_price} • {p.sellers?.business_name || "Unknown"} • <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Coupon Management</CardTitle>
              <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Tag className="mr-1 h-4 w-4" /> Create Coupon</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Code</Label><Input value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" /></div>
                    <div><Label>Description</Label><Input value={couponForm.description} onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Type</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}>
                          <option value="percentage">Percentage</option><option value="flat">Flat ₹</option>
                        </select>
                      </div>
                      <div><Label>Value</Label><Input type="number" value={couponForm.discount_value} onChange={e => setCouponForm(f => ({ ...f, discount_value: Number(e.target.value) }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Min Order ₹</Label><Input type="number" value={couponForm.min_order_value} onChange={e => setCouponForm(f => ({ ...f, min_order_value: Number(e.target.value) }))} /></div>
                      <div><Label>Max Uses</Label><Input type="number" value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: Number(e.target.value) }))} /></div>
                    </div>
                    <div><Label>Expires At</Label><Input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
                    <Button className="w-full" onClick={createCoupon}>Create Coupon</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? <p className="text-muted-foreground">No coupons yet.</p> : (
                <div className="space-y-2">
                  {coupons.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-mono font-bold">{c.code}</p>
                        <p className="text-xs text-muted-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`} off • Min ₹{c.min_order_value} • Used {c.used_count}/{c.max_uses}</p>
                      </div>
                      <Button size="sm" variant={c.is_active ? "destructive" : "default"} onClick={() => toggleCoupon(c.id, c.is_active)}>
                        {c.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Category Management</CardTitle>
              <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogTrigger asChild><Button size="sm">Add Category</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} /></div>
                    <div><Label>Slug</Label><Input value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} /></div>
                    <div><Label>Icon (emoji)</Label><Input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} placeholder="🥬" /></div>
                    <Button className="w-full" onClick={createCategory}>Create Category</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? <p className="text-muted-foreground">No categories yet.</p> : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {categories.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span>{c.icon} {c.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteCategory(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
