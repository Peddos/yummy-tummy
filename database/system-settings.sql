-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

-- Everyone can read settings
CREATE POLICY "Everyone can view system settings" ON system_settings
    FOR SELECT
    USING (true);

-- Initial settings
INSERT INTO system_settings (key, value, description)
VALUES 
    ('delivery_fee', '1.00'::jsonb, 'Standard delivery fee in KSH'),
    ('vendor_commission_percentage', '10'::jsonb, 'Platform commission percentage from vendor sales')
ON CONFLICT (key) DO NOTHING;
