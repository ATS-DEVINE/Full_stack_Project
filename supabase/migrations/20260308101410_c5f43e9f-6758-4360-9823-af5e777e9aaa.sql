
-- Fix admin policies to be PERMISSIVE so they independently grant full access

-- Products
DROP POLICY IF EXISTS "Admin can manage all products" ON public.products;
CREATE POLICY "Admin can manage all products" ON public.products FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Categories
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Coupons
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Orders
DROP POLICY IF EXISTS "Admin can manage all orders" ON public.orders;
CREATE POLICY "Admin can manage all orders" ON public.orders FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Order items
DROP POLICY IF EXISTS "Admin can manage order items" ON public.order_items;
CREATE POLICY "Admin can manage order items" ON public.order_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sellers
DROP POLICY IF EXISTS "Admin can manage sellers" ON public.sellers;
CREATE POLICY "Admin can manage sellers" ON public.sellers FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Reviews
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;
CREATE POLICY "Admin can manage reviews" ON public.reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Messages
DROP POLICY IF EXISTS "Admin can view all messages" ON public.messages;
CREATE POLICY "Admin can manage all messages" ON public.messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
