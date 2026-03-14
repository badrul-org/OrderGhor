-- ============================================
-- OrderGhor Cloud Sync Tables
-- Run AFTER supabase-setup.sql
-- ============================================

-- 1. Customers table
CREATE TABLE public.cloud_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  alt_phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  area TEXT DEFAULT '',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  reliability_score TEXT DEFAULT 'new'
    CHECK (reliability_score IN ('excellent', 'good', 'average', 'risky', 'new')),
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'other'
    CHECK (source IN ('facebook', 'messenger', 'whatsapp', 'instagram', 'phone', 'other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_cloud_customers_user ON public.cloud_customers(user_id);
CREATE INDEX idx_cloud_customers_phone ON public.cloud_customers(user_id, phone);

-- 2. Products table
CREATE TABLE public.cloud_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  sku TEXT DEFAULT '',
  category TEXT DEFAULT '',
  variants JSONB DEFAULT '[]'::jsonb,
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_cloud_products_user ON public.cloud_products(user_id);

-- 3. Orders table
CREATE TABLE public.cloud_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.cloud_customers(id),
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cod'
    CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'cod', 'bank', 'partial', 'other')),
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'cod_pending', 'refunded')),
  paid_amount NUMERIC DEFAULT 0,
  order_status TEXT DEFAULT 'new'
    CHECK (order_status IN ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'returned', 'cancelled')),
  delivery_address TEXT DEFAULT '',
  delivery_area TEXT DEFAULT '',
  delivery_provider TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'other'
    CHECK (source IN ('facebook', 'messenger', 'whatsapp', 'instagram', 'phone', 'other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_cloud_orders_user ON public.cloud_orders(user_id);
CREATE INDEX idx_cloud_orders_customer ON public.cloud_orders(customer_id);
CREATE INDEX idx_cloud_orders_number ON public.cloud_orders(user_id, order_number);

-- 4. Expenses table
CREATE TABLE public.cloud_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'other'
    CHECK (category IN ('product_cost', 'delivery', 'packaging', 'ads', 'rent', 'salary', 'other')),
  description TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_cloud_expenses_user ON public.cloud_expenses(user_id);

-- 5. Auto-update triggers (reuse existing function)
CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON public.cloud_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.cloud_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.cloud_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Enable RLS
ALTER TABLE public.cloud_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_expenses ENABLE ROW LEVEL SECURITY;

-- 7. RLS: Users CRUD own data
CREATE POLICY "Users CRUD own customers"
  ON public.cloud_customers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own products"
  ON public.cloud_products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own orders"
  ON public.cloud_orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own expenses"
  ON public.cloud_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Admin read policies
CREATE POLICY "Admins read all customers"
  ON public.cloud_customers FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins read all products"
  ON public.cloud_products FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins read all orders"
  ON public.cloud_orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins read all expenses"
  ON public.cloud_expenses FOR SELECT
  USING (public.is_admin());
