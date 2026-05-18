-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
    driver_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    license_number TEXT NOT NULL,
    is_available BOOLEAN DEFAULT false,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    rating DECIMAL(2,1) DEFAULT 5.0,
    total_deliveries INT DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can view their own profile" ON public.drivers
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own status/location" ON public.drivers
    FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Customers can view available drivers" ON public.drivers
    FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can view all drivers" ON public.drivers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
