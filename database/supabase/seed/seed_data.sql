-- Seed data for testing

-- Insert an admin user
-- NOTE: In a real app, users would be created via Cognito and synced to Supabase.
-- These seeds are for local development/testing of the DB structure.

-- INSERT INTO public.users (id, name, phone, email, role, kyc_status)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Admin User', '+919999999999', 'admin@p2d.com', 'admin', 'verified');

-- Insert a driver
-- INSERT INTO public.users (id, name, phone, email, role, kyc_status)
-- VALUES ('00000000-0000-0000-0000-000000000002', 'Driver One', '+918888888888', 'driver1@p2d.com', 'driver', 'verified');

-- INSERT INTO public.drivers (driver_id, vehicle_type, vehicle_number, license_number, is_available)
-- VALUES ('00000000-0000-0000-0000-000000000002', 'Bike', 'DL1S AA 1234', 'LIC123456', true);

-- Insert a customer
-- INSERT INTO public.users (id, name, phone, email, role, kyc_status)
-- VALUES ('00000000-0000-0000-0000-000000000003', 'Customer One', '+917777777777', 'customer1@p2d.com', 'customer', 'verified');
