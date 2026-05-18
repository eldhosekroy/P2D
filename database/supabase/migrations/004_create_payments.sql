-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    customer_id UUID REFERENCES public.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    method TEXT,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    status TEXT CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed')) DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Customers can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
