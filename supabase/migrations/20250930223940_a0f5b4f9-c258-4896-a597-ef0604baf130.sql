-- Allow guest users to create orders (user_id can be null for guest orders)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create guest orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- Allow guest users to view their own orders by email
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view orders"
ON public.orders
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
);

-- Allow guest users to create order items
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE (orders.id = order_items.order_id) 
    AND ((orders.user_id = auth.uid()) OR (orders.user_id IS NULL))
  )
);

-- Allow guest users to view their order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE (orders.id = order_items.order_id) 
    AND ((orders.user_id = auth.uid()) OR (orders.user_id IS NULL))
  )
);