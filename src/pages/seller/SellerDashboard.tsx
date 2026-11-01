import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, ShoppingBag, IndianRupee, Plus, Edit, Trash2, CheckCircle, XCircle, Truck, Settings } from "lucide-react";
import ImageUpload, { MultiImageUpload } from "@/components/ImageUpload";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"] & { order_items?: any[]; profiles?: any };

export default function SellerDashboard() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, ordersToday: 0, pending: 0, totalProducts: 0 });

  // Product form
  const [productForm, setProductForm] = useState({ name: "", description: "", category_id: "", unit: "kg", stock_quantity: 0, min_order_qty: 1, base_price: 0, discount_percent: 0, status: "draft" as const, images: [] as string[] });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // Tracking form
  const [trackingForm, setTrackingForm] = useState({ courier_name: "", tracking_id: "", estimated_delivery: "" });
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isSeller) navigate("/");
  }, [authLoading, isSeller]);

  useEffect(() => {
    if (user && isSeller) fetchSellerData();
  }, [user, isSeller]);

  const fetchSellerData = async () => {
    const { data: sellerData } = await supabase.from("sellers").select("*").eq("user_id", user!.id).single();
    if (!sellerData) return;
    setSeller(sellerData);

    const [prodsRes, ordersRes, catsRes] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", sellerData.id),
      supabase.from("orders").select("*, order_items(*, products(name))").eq("seller_id", sellerData.id).order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);

    const prods = prodsRes.data || [];
    const ords = ordersRes.data || [];
    setProducts(prods);
    setOrders(ords);
    setCategories(catsRes.data || []);

    const today = new Date().toISOString().slice(0, 10);
    setStats({
      revenue: ords.reduce((s, o) => s + (o.total || 0), 0),
      ordersToday: ords.filter(o => o.created_at.slice(0, 10) === today).length,
      pending: ords.filter(o => o.status === "placed").length,
      totalProducts: prods.length,
    });
  };

  const saveProduct = async () => {
    if (!seller) return;
    const payload = { ...productForm, seller_id: seller.id, category_id: productForm.category_id || null, images: productForm.images.length > 0 ? productForm.images : null };
    let error;
    if (editingProduct) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingProduct));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    if (error) { toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); return; }
    toast({ title: editingProduct ? "Product updated" : "Product created" });
    setProductDialogOpen(false);
    setEditingProduct(null);
    setProductForm({ name: "", description: "", category_id: "", unit: "kg", stock_quantity: 0, min_order_qty: 1, base_price: 0, discount_percent: 0, status: "draft", images: [] });
    fetchSellerData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" });
    fetchSellerData();
  };

  const editProduct = (p: Product) => {
    setEditingProduct(p.id);
    setProductForm({
      name: p.name, description: p.description || "", category_id: p.category_id || "",
      unit: p.unit, stock_quantity: p.stock_quantity, min_order_qty: p.min_order_qty,
      base_price: p.base_price, discount_percent: p.discount_percent || 0, status: p.status as any,
      images: p.images || [],
    });
    setProductDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    toast({ title: `Order ${status}` });
    fetchSellerData();
  };

  const saveTracking = async () => {
    if (!trackingOrderId) return;
    await supabase.from("orders").update({
      courier_name: trackingForm.courier_name,
      tracking_id: trackingForm.tracking_id,
      estimated_delivery: trackingForm.estimated_delivery || null,
      status: "shipped",
    }).eq("id", trackingOrderId);
    toast({ title: "Tracking info saved, order marked as shipped" });
    setTrackingOrderId(null);
    setTrackingForm({ courier_name: "", tracking_id: "", estimated_delivery: "" });
    fetchSellerData();
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>;
  if (!isSeller) return null;

  if (seller?.status === "pending") {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-warning/20 p-4"><Package className="h-12 w-12 text-warning" /></div>
        <h2 className="font-display text-xl font-bold">Account Pending Approval</h2>
        <p className="text-muted-foreground">Your seller account is being reviewed by the admin team. You'll be able to list products once approved.</p>
      </div>
    );
  }

  if (seller?.status === "rejected") {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/20 p-4"><XCircle className="h-12 w-12 text-destructive" /></div>
        <h2 className="font-display text-xl font-bold">Account Rejected</h2>
        <p className="text-muted-foreground">Unfortunately, your seller application was not approved. Please contact support for more details.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Orders Today", value: stats.ordersToday, icon: ShoppingBag },
    { label: "Pending", value: stats.pending, icon: CheckCircle },
    { label: "Products", value: stats.totalProducts, icon: Package },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground">{seller?.business_name} {seller?.verified && <Badge className="ml-2">✓ Verified</Badge>}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-8 w-8 text-primary" />
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-display text-xl font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Products</CardTitle>
              <Dialog open={productDialogOpen} onOpenChange={(open) => { setProductDialogOpen(open); if (!open) { setEditingProduct(null); setProductForm({ name: "", description: "", category_id: "", unit: "kg", stock_quantity: 0, min_order_qty: 1, base_price: 0, discount_percent: 0, status: "draft", images: [] }); } }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Product</Button></DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} /></div>
                    <div><Label>Category</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={productForm.category_id} onChange={e => setProductForm(f => ({ ...f, category_id: e.target.value }))}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Unit</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))}>
                          <option value="kg">kg</option><option value="litre">litre</option><option value="piece">piece</option><option value="box">box</option><option value="dozen">dozen</option>
                        </select>
                      </div>
                      <div><Label>Stock Qty</Label><Input type="number" value={productForm.stock_quantity} onChange={e => setProductForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>Base Price ₹</Label><Input type="number" value={productForm.base_price} onChange={e => setProductForm(f => ({ ...f, base_price: Number(e.target.value) }))} /></div>
                      <div><Label>MOQ</Label><Input type="number" value={productForm.min_order_qty} onChange={e => setProductForm(f => ({ ...f, min_order_qty: Number(e.target.value) }))} /></div>
                      <div><Label>Discount %</Label><Input type="number" value={productForm.discount_percent} onChange={e => setProductForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} /></div>
                    </div>
                    <div><Label>Status</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={productForm.status} onChange={e => setProductForm(f => ({ ...f, status: e.target.value as any }))}>
                        <option value="draft">Draft</option><option value="active">Active</option><option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                    <div>
                      <Label>Product Images (up to 5)</Label>
                      <div className="mt-1">
                        <MultiImageUpload
                          bucket="product-images"
                          folder={user!.id}
                          images={productForm.images}
                          onChange={(urls) => setProductForm(f => ({ ...f, images: urls }))}
                          max={5}
                        />
                      </div>
                    </div>
                    <Button className="w-full" onClick={saveProduct}>{editingProduct ? "Update" : "Create"} Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? <p className="text-muted-foreground">No products yet. Add your first product!</p> : (
                <div className="space-y-2">
                   {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        {p.images && p.images.length > 0 ? (
                          <img src={p.images[0]} alt={p.name} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">No img</div>
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">₹{p.base_price}/{p.unit} • Stock: {p.stock_quantity} • <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => editProduct(p)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Order #{o.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} • ₹{o.total}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {o.order_items?.map((item: any) => (
                              <Badge key={item.id} variant="outline" className="text-xs">{item.products?.name} x{item.quantity}</Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant={o.status === "delivered" ? "default" : "secondary"}>{o.status}</Badge>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {o.status === "placed" && (
                          <>
                            <Button size="sm" onClick={() => updateOrderStatus(o.id, "confirmed")}><CheckCircle className="mr-1 h-4 w-4" /> Confirm</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(o.id, "rejected")}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                          </>
                        )}
                        {o.status === "confirmed" && (
                          <Button size="sm" onClick={() => updateOrderStatus(o.id, "processing")}>Mark Processing</Button>
                        )}
                        {(o.status === "processing" || o.status === "confirmed") && (
                          <Dialog open={trackingOrderId === o.id} onOpenChange={(open) => { if (!open) setTrackingOrderId(null); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setTrackingOrderId(o.id)}><Truck className="mr-1 h-4 w-4" /> Add Tracking</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Shipping Details</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                <div><Label>Courier</Label><Input value={trackingForm.courier_name} onChange={e => setTrackingForm(f => ({ ...f, courier_name: e.target.value }))} /></div>
                                <div><Label>Tracking ID</Label><Input value={trackingForm.tracking_id} onChange={e => setTrackingForm(f => ({ ...f, tracking_id: e.target.value }))} /></div>
                                <div><Label>Est. Delivery</Label><Input type="date" value={trackingForm.estimated_delivery} onChange={e => setTrackingForm(f => ({ ...f, estimated_delivery: e.target.value }))} /></div>
                                <Button className="w-full" onClick={saveTracking}>Save & Mark Shipped</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {o.status === "shipped" && (
                          <Button size="sm" onClick={() => updateOrderStatus(o.id, "delivered")}>Mark Delivered</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Store Logo</Label>
                  <ImageUpload
                    bucket="seller-assets"
                    folder={user!.id}
                    currentUrl={seller?.logo_url}
                    label="Logo"
                    onUploaded={async (url) => {
                      await supabase.from("sellers").update({ logo_url: url || null }).eq("id", seller.id);
                      fetchSellerData();
                      toast({ title: url ? "Logo updated" : "Logo removed" });
                    }}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Store Banner</Label>
                  <ImageUpload
                    bucket="seller-assets"
                    folder={user!.id}
                    currentUrl={seller?.banner_url}
                    label="Banner"
                    size="lg"
                    onUploaded={async (url) => {
                      await supabase.from("sellers").update({ banner_url: url || null }).eq("id", seller.id);
                      fetchSellerData();
                      toast({ title: url ? "Banner updated" : "Banner removed" });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Store Description</Label>
                <Textarea
                  defaultValue={seller?.description || ""}
                  onBlur={async (e) => {
                    await supabase.from("sellers").update({ description: e.target.value }).eq("id", seller.id);
                    toast({ title: "Description saved" });
                  }}
                  placeholder="Tell buyers about your store..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>GSTIN</Label>
                  <Input
                    defaultValue={seller?.gstin || ""}
                    onBlur={async (e) => {
                      await supabase.from("sellers").update({ gstin: e.target.value }).eq("id", seller.id);
                      toast({ title: "GSTIN saved" });
                    }}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    defaultValue={seller?.address || ""}
                    onBlur={async (e) => {
                      await supabase.from("sellers").update({ address: e.target.value }).eq("id", seller.id);
                      toast({ title: "Address saved" });
                    }}
                    placeholder="Store address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
