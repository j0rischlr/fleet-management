-- Migration: Add mileage_at_service column to maintenance table
-- This allows tracking vehicle mileage at the time of service for accurate alert calculations

ALTER TABLE maintenance 
ADD COLUMN IF NOT EXISTS mileage_at_service INTEGER;

-- Update existing completed maintenance records with current vehicle mileage
-- This is a best-effort backfill for existing data
UPDATE maintenance m
SET mileage_at_service = v.mileage
FROM vehicles v
WHERE m.vehicle_id = v.id 
AND m.status = 'completed'
AND m.mileage_at_service IS NULL;

COMMENT ON COLUMN maintenance.mileage_at_service IS 'Vehicle mileage at the time of service completion';
