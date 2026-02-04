-- Script pour ajouter les règles de maintenance automatiques
-- À exécuter après schema.sql

-- Table pour les règles de maintenance
CREATE TABLE IF NOT EXISTS maintenance_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('mileage', 'time', 'both')),
  fuel_types TEXT[] NOT NULL,
  mileage_interval INTEGER,
  time_interval_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table pour suivre l'historique des maintenances et calculer les prochaines échéances
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES maintenance_rules(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  current_mileage INTEGER,
  next_due_mileage INTEGER,
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertion des règles de maintenance par défaut
INSERT INTO maintenance_rules (name, description, rule_type, fuel_types, mileage_interval, time_interval_months) VALUES
  ('Entretien essence/diesel', 'Maintenance obligatoire tous les 15 000 km pour les véhicules essence et diesel', 'mileage', ARRAY['gasoline', 'diesel'], 15000, NULL),
  ('Révision annuelle électrique', 'Révision annuelle obligatoire pour les véhicules électriques', 'time', ARRAY['electric'], NULL, 12),
  ('Contrôle pneumatiques', 'Rappel de contrôle des pneumatiques tous les 10 000 km', 'mileage', ARRAY['gasoline', 'diesel', 'electric', 'hybrid'], 10000, NULL),
  ('Entretien hybride', 'Maintenance obligatoire tous les 15 000 km pour les véhicules hybrides', 'mileage', ARRAY['hybrid'], 15000, NULL);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_vehicle_id ON maintenance_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_status ON maintenance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_rules_active ON maintenance_rules(is_active);

-- Trigger pour updated_at
CREATE TRIGGER update_maintenance_alerts_updated_at BEFORE UPDATE ON maintenance_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les alertes de maintenance pour un véhicule
CREATE OR REPLACE FUNCTION calculate_maintenance_alerts(vehicle_uuid UUID)
RETURNS TABLE (
  rule_name TEXT,
  alert_type TEXT,
  description TEXT,
  current_value INTEGER,
  next_due_value INTEGER,
  priority TEXT,
  days_until_due INTEGER
) AS $$
DECLARE
  v_record RECORD;
  r_record RECORD;
  last_maint_date TIMESTAMP WITH TIME ZONE;
  last_maint_mileage INTEGER;
  mileage_diff INTEGER;
  date_diff INTEGER;
  alert_priority TEXT;
BEGIN
  -- Récupérer les informations du véhicule
  SELECT * INTO v_record FROM vehicles WHERE id = vehicle_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Pour chaque règle active applicable au type de carburant du véhicule
  FOR r_record IN 
    SELECT * FROM maintenance_rules 
    WHERE is_active = true 
    AND v_record.fuel_type = ANY(fuel_types)
  LOOP
    -- Récupérer la dernière maintenance de ce type
    SELECT MAX(completed_date), MAX(m.id) INTO last_maint_date, last_maint_mileage
    FROM maintenance m
    WHERE m.vehicle_id = vehicle_uuid 
    AND m.status = 'completed'
    AND m.description ILIKE '%' || r_record.name || '%';

    -- Alertes basées sur le kilométrage
    IF r_record.rule_type IN ('mileage', 'both') AND r_record.mileage_interval IS NOT NULL THEN
      -- Calculer le kilométrage depuis la dernière maintenance
      mileage_diff := v_record.mileage - COALESCE(last_maint_mileage, 0);
      
      -- Déterminer la priorité
      IF mileage_diff >= r_record.mileage_interval THEN
        alert_priority := 'urgent';
      ELSIF mileage_diff >= (r_record.mileage_interval * 0.9) THEN
        alert_priority := 'high';
      ELSIF mileage_diff >= (r_record.mileage_interval * 0.8) THEN
        alert_priority := 'normal';
      ELSE
        alert_priority := 'low';
      END IF;

      -- Retourner l'alerte si proche de l'échéance (>= 80%)
      IF mileage_diff >= (r_record.mileage_interval * 0.8) THEN
        RETURN QUERY SELECT 
          r_record.name,
          'mileage'::TEXT,
          r_record.description,
          v_record.mileage,
          COALESCE(last_maint_mileage, 0) + r_record.mileage_interval,
          alert_priority,
          NULL::INTEGER;
      END IF;
    END IF;

    -- Alertes basées sur le temps
    IF r_record.rule_type IN ('time', 'both') AND r_record.time_interval_months IS NOT NULL THEN
      IF last_maint_date IS NOT NULL THEN
        date_diff := EXTRACT(DAY FROM (NOW() - last_maint_date));
        
        -- Déterminer la priorité
        IF date_diff >= (r_record.time_interval_months * 30) THEN
          alert_priority := 'urgent';
        ELSIF date_diff >= (r_record.time_interval_months * 30 * 0.9) THEN
          alert_priority := 'high';
        ELSIF date_diff >= (r_record.time_interval_months * 30 * 0.8) THEN
          alert_priority := 'normal';
        ELSE
          alert_priority := 'low';
        END IF;

        -- Retourner l'alerte si proche de l'échéance (>= 80%)
        IF date_diff >= (r_record.time_interval_months * 30 * 0.8) THEN
          RETURN QUERY SELECT 
            r_record.name,
            'time'::TEXT,
            r_record.description,
            date_diff,
            r_record.time_interval_months * 30,
            alert_priority,
            (r_record.time_interval_months * 30) - date_diff;
        END IF;
      ELSE
        -- Pas de maintenance précédente, considérer depuis la création du véhicule
        date_diff := EXTRACT(DAY FROM (NOW() - v_record.created_at));
        
        IF date_diff >= (r_record.time_interval_months * 30 * 0.8) THEN
          alert_priority := CASE 
            WHEN date_diff >= (r_record.time_interval_months * 30) THEN 'urgent'
            WHEN date_diff >= (r_record.time_interval_months * 30 * 0.9) THEN 'high'
            ELSE 'normal'
          END;

          RETURN QUERY SELECT 
            r_record.name,
            'time'::TEXT,
            r_record.description,
            date_diff,
            r_record.time_interval_months * 30,
            alert_priority,
            (r_record.time_interval_months * 30) - date_diff;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Vue pour afficher toutes les alertes de maintenance actives
CREATE OR REPLACE VIEW v_maintenance_alerts AS
SELECT 
  v.id as vehicle_id,
  v.brand,
  v.model,
  v.license_plate,
  v.mileage,
  v.fuel_type,
  alerts.*
FROM vehicles v
CROSS JOIN LATERAL calculate_maintenance_alerts(v.id) AS alerts
WHERE v.status != 'unavailable'
ORDER BY 
  CASE alerts.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  alerts.next_due_value;

-- Policies pour maintenance_rules
ALTER TABLE maintenance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view maintenance rules" ON maintenance_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage maintenance rules" ON maintenance_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policies pour maintenance_alerts
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view maintenance alerts" ON maintenance_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage maintenance alerts" ON maintenance_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
