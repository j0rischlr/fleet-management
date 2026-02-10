-- Add user_notified column to reservations table
-- When an admin approves or rejects a reservation, this is set to false
-- When the user views their reservations, it is set back to true
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_notified BOOLEAN DEFAULT true;
