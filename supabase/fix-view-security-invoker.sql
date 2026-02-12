-- Fix: v_maintenance_alerts uses SECURITY DEFINER by default
-- Change to SECURITY INVOKER so it respects RLS policies of the querying user
ALTER VIEW v_maintenance_alerts SET (security_invoker = on);
