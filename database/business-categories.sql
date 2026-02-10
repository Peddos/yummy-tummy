-- Create business_categories table
CREATE TABLE IF NOT EXISTS business_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'ShoppingBag', -- Lucide icon name
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS business_category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL;

-- Insert default categories
INSERT INTO business_categories (name, slug, icon_name) VALUES
('Fast Food', 'fast-food', 'Pizza'),
('Healthy Herbs', 'healthy-herbs', 'Leaf'),
('Groceries', 'groceries', 'ShoppingBasket'),
('Pharmacy', 'pharmacy', 'Pill'),
('Drinks', 'drinks', 'Wine'),
('Asian Fusion', 'asian-fusion', 'Utensils'),
('Sweet Treats', 'sweet-treats', 'Cookie')
ON CONFLICT (slug) DO NOTHING;
