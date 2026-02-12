-- Add departure/arrival location and cost columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS departure_location TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS arrival_location TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS parking_cost DECIMAL(10, 2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS toll_cost DECIMAL(10, 2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS fuel_cost DECIMAL(10, 2);
