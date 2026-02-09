-- Add insurance and technical inspection fields to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_technical_inspection DATE;

-- Create fuel costs history table
CREATE TABLE IF NOT EXISTS fuel_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  liters DECIMAL(10, 2),
  mileage_at_fill INTEGER,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_costs_vehicle_id ON fuel_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_costs_reservation_id ON fuel_costs(reservation_id);

-- RLS for fuel_costs
ALTER TABLE fuel_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view fuel costs" ON fuel_costs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert fuel costs" ON fuel_costs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update fuel costs" ON fuel_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete fuel costs" ON fuel_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
