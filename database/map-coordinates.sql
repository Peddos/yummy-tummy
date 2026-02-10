-- Add latitude and longitude columns to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update sample vendors with Nairobi coordinates (approximate areas)
UPDATE vendors SET latitude = -1.2921, longitude = 36.8219 WHERE business_name LIKE '%Tasty%';
UPDATE vendors SET latitude = -1.2821, longitude = 36.8119 WHERE business_name LIKE '%Burger%';
UPDATE vendors SET latitude = -1.3021, longitude = 36.8319 WHERE business_name LIKE '%Pizza%';
UPDATE vendors SET latitude = -1.2721, longitude = 36.8019 WHERE business_name LIKE '%Java%';
