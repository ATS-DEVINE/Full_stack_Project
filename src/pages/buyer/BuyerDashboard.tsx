import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { friendlyError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Heart, MapPin, User, Plus, Trash2 } from "lucide-react";

export default function BuyerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Address form
  const [addrForm, setAddrForm] = useState({ label: "Home", full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", is_default: false });
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [ordersRes, favsRes, addrsRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*, products(name, images)), sellers(business_name)").eq("buyer_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("favorites").select("*, products(name, base_price, images, unit)").eq("user_id", user!.id),
      supabase.from("addresses").select("*").eq("user_id", user!.id),
    ]);
    setOrders(ordersRes.data || []);
    setFavorites(favsRes.data || []);
    setAddresses(addrsRes.data || []);
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    toast({ title: "Removed from wishlist" });
    fetchData();
  };

  const saveAddress = async () => {
    const { error } = await supabase.from("addresses").insert({ ...addrForm, user_id: user!.id });
    if (error) { toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); return; }
    toast({ title: "Address saved" });
    setAddrDialogOpen(false);
    setAddrForm({ label: "Home", full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", is_default: false });
    fetchData();
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast({ title: "Address deleted" });
    fetchData();
  };

  const statusTimeline = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>;
  if (!user) return null;

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your orders, wishlist & addresses</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><ShoppingBag className="h-6 w-6 text-primary" /><div><p className="text-xs text-muted-foreground">Orders</p><p className="font-display text-lg font-bold">{orders.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Heart className="h-6 w-6 text-secondary" /><div><p className="text-xs text-muted-foreground">Wishlist</p><p className="font-display text-lg font-bold">{favorites.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><MapPin className="h-6 w-6 text-primary" /><div><p className="text-xs text-muted-foreground">Addresses</p><p className="font-display text-lg font-bold">{addresses.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? <p className="text-muted-foreground">No orders yet. Start shopping!</p> : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} • {o.sellers?.business_name} • ₹{o.total}</p>
                        </div>
                        <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" || o.status === "rejected" ? "destructive" : "secondary"}>
                          {o.status}
                        </Badge>
                      </div>
                      {/* Items */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {o.order_items?.map((item: any) => (
                          <Badge key={item.id} variant="outline" className="text-xs">{item.products?.name} x{item.quantity}</Badge>
                        ))}
                      </div>
                      {/* Timeline */}
                      {o.status !== "cancelled" && o.status !== "rejected" && (
                        <div className="mt-3 flex items-center gap-1">
                          {statusTimeline.map((step, i) => {
                            const currentIdx = statusTimeline.indexOf(o.status);
                            const active = i <= currentIdx;
                            return (
                              <div key={step} className="flex items-center">
                                <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                                {i < statusTimeline.length - 1 && <div className={`h-0.5 w-6 ${active && i < currentIdx ? "bg-primary" : "bg-muted"}`} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {o.tracking_id && (
                        <p className="mt-2 text-xs text-muted-foreground">📦 {o.courier_name} • Tracking: {o.tracking_id}{o.estimated_delivery && ` • Est: ${new Date(o.estimated_delivery).toLocaleDateString()}`}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist">
          <Card>
            <CardHeader><CardTitle>My Wishlist</CardTitle></CardHeader>
            <CardContent>
              {favorites.length === 0 ? <p className="text-muted-foreground">Your wishlist is empty.</p> : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {favorites.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">{f.products?.name}</p>
                        <p className="text-sm text-muted-foreground">₹{f.products?.base_price}/{f.products?.unit}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/products/${f.product_id}`)}>View</Button>
                        <Button size="icon" variant="ghost" onClick={() => removeFavorite(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Address Book</CardTitle>
              <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Address</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Address</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Label</Label><Input value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} /></div>
                      <div><Label>Full Name</Label><Input value={addrForm.full_name} onChange={e => setAddrForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                    </div>
                    <div><Label>Phone</Label><Input value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    <div><Label>Address Line 1</Label><Input value={addrForm.address_line1} onChange={e => setAddrForm(f => ({ ...f, address_line1: e.target.value }))} /></div>
                    <div><Label>Address Line 2</Label><Input value={addrForm.address_line2} onChange={e => setAddrForm(f => ({ ...f, address_line2: e.target.value }))} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>City</Label><Input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} /></div>
                      <div><Label>State</Label><Input value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} /></div>
                      <div><Label>Pincode</Label><Input value={addrForm.pincode} onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value }))} /></div>
                    </div>
                    <Button className="w-full" onClick={saveAddress}>Save Address</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? <p className="text-muted-foreground">No addresses saved.</p> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {addresses.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{a.label} {a.is_default && <Badge className="ml-1">Default</Badge>}</p>
                          <p className="text-sm">{a.full_name}</p>
                          <p className="text-sm text-muted-foreground">{a.address_line1}{a.address_line2 && `, ${a.address_line2}`}</p>
                          <p className="text-sm text-muted-foreground">{a.city}, {a.state} - {a.pincode}</p>
                          {a.phone && <p className="text-sm text-muted-foreground">📞 {a.phone}</p>}
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteAddress(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <ImageUpload
                  bucket="avatars"
                  folder={user!.id}
                  currentUrl={profile?.avatar_url}
                  label="Avatar"
                  onUploaded={async (url) => {
                    await supabase.from("profiles").update({ avatar_url: url || null }).eq("id", user!.id);
                    toast({ title: url ? "Avatar updated" : "Avatar removed" });
                  }}
                />
                <div className="space-y-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      defaultValue={profile?.full_name || ""}
                      onBlur={async (e) => {
                        await supabase.from("profiles").update({ full_name: e.target.value }).eq("id", user!.id);
                        toast({ title: "Name saved" });
                      }}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      defaultValue={profile?.phone || ""}
                      onBlur={async (e) => {
                        await supabase.from("profiles").update({ phone: e.target.value }).eq("id", user!.id);
                        toast({ title: "Phone saved" });
                      }}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
