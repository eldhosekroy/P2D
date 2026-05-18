-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.users(id),
    driver_id UUID REFERENCES public.users(id),
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10,8) NOT NULL,
    pickup_lng DECIMAL(11,8) NOT NULL,
    drop_address TEXT NOT NULL,
    drop_lat DECIMAL(10,8) NOT NULL,
    drop_lng DECIMAL(11,8) NOT NULL,
    item_description TEXT,
    item_weight DECIMAL(5,2),
    status TEXT CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
    pickup_otp TEXT,
    delivery_otp TEXT,
    pickup_qr_token TEXT,
    delivery_qr_token TEXT,
    estimated_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    insurance_enabled BOOLEAN DEFAULT false,
    insurance_amount DECIMAL(10,2),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    razorpay_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can view assigned orders" ON public.orders
    FOR SELECT USING (auth.uid() = driver_id OR status = 'pending');

CREATE POLICY "Drivers can update their assigned orders" ON public.orders
    FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
