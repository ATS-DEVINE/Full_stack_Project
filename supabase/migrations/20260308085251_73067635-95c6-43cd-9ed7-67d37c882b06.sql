
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT TO public USING (true);

-- coupons
DROP POLICY IF EXISTS "Active coupons viewable by authenticated" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
CREATE POLICY "Active coupons viewable by authenticated" ON public.coupons FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "Admin can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Admin can view all messages" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- order_items
DROP POLICY IF EXISTS "Admin can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Buyer can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items follow order access" ON public.order_items;
CREATE POLICY "Admin can manage order items" ON public.order_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyer can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY "Order items follow order access" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid()))));

-- orders
DROP POLICY IF EXISTS "Admin can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Buyer can create orders" ON public.orders;
DROP POLICY IF EXISTS "Buyer can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Seller can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Seller can view their orders" ON public.orders;
CREATE POLICY "Admin can manage all orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyer can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyer can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Seller can update their orders" ON public.orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid()));
CREATE POLICY "Seller can view their orders" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid()));

-- pricing_tiers
DROP POLICY IF EXISTS "Pricing tiers viewable by everyone" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Seller can manage own pricing" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers viewable by everyone" ON public.pricing_tiers FOR SELECT TO public USING (true);
CREATE POLICY "Seller can manage own pricing" ON public.pricing_tiers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM products p JOIN sellers s ON s.id = p.seller_id WHERE p.id = pricing_tiers.product_id AND s.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM products p JOIN sellers s ON s.id = p.seller_id WHERE p.id = pricing_tiers.product_id AND s.user_id = auth.uid()));

-- products
DROP POLICY IF EXISTS "Active products viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admin can manage all products" ON public.products;
DROP POLICY IF EXISTS "Seller can manage own products" ON public.products;
CREATE POLICY "Active products viewable by everyone" ON public.products FOR SELECT TO public USING (true);
CREATE POLICY "Admin can manage all products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Seller can manage own products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = products.seller_id AND sellers.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM sellers WHERE sellers.id = products.seller_id AND sellers.user_id = auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- reviews
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Buyer can create review" ON public.reviews;
DROP POLICY IF EXISTS "Buyer can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;
CREATE POLICY "Admin can manage reviews" ON public.reviews FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Buyer can create review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyer can update own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT TO public USING (true);

-- sellers
DROP POLICY IF EXISTS "Admin can manage sellers" ON public.sellers;
DROP POLICY IF EXISTS "Authenticated can insert seller" ON public.sellers;
DROP POLICY IF EXISTS "Seller can update own" ON public.sellers;
DROP POLICY IF EXISTS "Sellers viewable by everyone" ON public.sellers;
CREATE POLICY "Admin can manage sellers" ON public.sellers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert seller" ON public.sellers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Seller can update own" ON public.sellers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Sellers viewable by everyone" ON public.sellers FOR SELECT TO public USING (true);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
