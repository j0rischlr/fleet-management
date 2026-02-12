-- Add assigned_user_id column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_user_id ON vehicles(assigned_user_id);
