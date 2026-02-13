-- Table to store secure tokens for garage booking links
CREATE TABLE IF NOT EXISTS garage_booking_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL,
  alert_rule_name TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_garage_booking_tokens_token ON garage_booking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_garage_booking_tokens_vehicle_id ON garage_booking_tokens(vehicle_id);

-- RPC function: insert a garage booking token
CREATE OR REPLACE FUNCTION insert_garage_token(
  p_token TEXT,
  p_vehicle_id UUID,
  p_alert_rule_name TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS void AS $$
BEGIN
  INSERT INTO garage_booking_tokens (token, vehicle_id, alert_rule_name, expires_at)
  VALUES (p_token, p_vehicle_id, p_alert_rule_name, p_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function: get a garage booking token by token string (with vehicle info)
CREATE OR REPLACE FUNCTION get_garage_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  token TEXT,
  vehicle_id UUID,
  alert_rule_name TEXT,
  expires_at TIMESTAMPTZ,
  used BOOLEAN,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  vehicle_year INTEGER,
  vehicle_fuel_type TEXT,
  vehicle_mileage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id, g.token, g.vehicle_id, g.alert_rule_name, g.expires_at, g.used,
    v.brand, v.model, v.license_plate, v.year, v.fuel_type, v.mileage
  FROM garage_booking_tokens g
  JOIN vehicles v ON v.id = g.vehicle_id
  WHERE g.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function: mark a garage booking token as used
CREATE OR REPLACE FUNCTION mark_garage_token_used(p_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE garage_booking_tokens SET used = true WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
