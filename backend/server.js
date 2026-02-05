import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fleet Management API' });
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicleData = { ...req.body };
    if (vehicleData.vin === '') vehicleData.vin = null;
    if (vehicleData.color === '') vehicleData.color = null;
    if (vehicleData.notes === '') vehicleData.notes = null;
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicleData = { ...req.body };
    if (vehicleData.vin === '') vehicleData.vin = null;
    if (vehicleData.color === '') vehicleData.color = null;
    if (vehicleData.notes === '') vehicleData.notes = null;
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        vehicles (*),
        profiles (*)
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        vehicles (*)
      `)
      .eq('user_id', req.params.userId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.body;

    // Check for conflicting reservations
    const { data: conflictingReservations, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['pending', 'approved', 'active'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (resError) throw resError;

    if (conflictingReservations && conflictingReservations.length > 0) {
      return res.status(409).json({ 
        error: 'Ce véhicule est déjà réservé pour cette période.',
        conflict: 'reservation'
      });
    }

    // Check for conflicting maintenance
    const { data: conflictingMaintenance, error: maintError } = await supabase
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_date', start_date)
      .lte('scheduled_date', end_date);

    if (maintError) throw maintError;

    if (conflictingMaintenance && conflictingMaintenance.length > 0) {
      return res.status(409).json({ 
        error: 'Ce véhicule est en maintenance durant cette période.',
        conflict: 'maintenance'
      });
    }

    // No conflicts, create the reservation
    const { data, error } = await supabase
      .from('reservations')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.body;

    // Only check for conflicts if dates or vehicle are being changed
    if (vehicle_id && start_date && end_date) {
      // Check for conflicting reservations (excluding current reservation)
      const { data: conflictingReservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('vehicle_id', vehicle_id)
        .neq('id', req.params.id)
        .in('status', ['pending', 'approved', 'active'])
        .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

      if (resError) throw resError;

      if (conflictingReservations && conflictingReservations.length > 0) {
        return res.status(409).json({ 
          error: 'Ce véhicule est déjà réservé pour cette période.',
          conflict: 'reservation'
        });
      }

      // Check for conflicting maintenance
      const { data: conflictingMaintenance, error: maintError } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', vehicle_id)
        .in('status', ['scheduled', 'in_progress'])
        .gte('scheduled_date', start_date)
        .lte('scheduled_date', end_date);

      if (maintError) throw maintError;

      if (conflictingMaintenance && conflictingMaintenance.length > 0) {
        return res.status(409).json({ 
          error: 'Ce véhicule est en maintenance durant cette période.',
          conflict: 'maintenance'
        });
      }
    }

    // No conflicts, update the reservation
    const { data, error } = await supabase
      .from('reservations')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations/:id/return', async (req, res) => {
  try {
    const { current_mileage, fuel_level, battery_level, has_issues, issues_description } = req.body;
    const reservationId = req.params.id;

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, vehicles(*)')
      .eq('id', reservationId)
      .single();

    if (resError) throw resError;

    const { error: updateVehicleError } = await supabase
      .from('vehicles')
      .update({ 
        mileage: current_mileage,
        status: 'available'
      })
      .eq('id', reservation.vehicle_id);

    if (updateVehicleError) throw updateVehicleError;

    const returnNotes = `Retour - Kilométrage: ${current_mileage} km${fuel_level ? `, Essence: ${fuel_level}` : ''}${battery_level ? `, Batterie: ${battery_level}%` : ''}${has_issues ? `, Problèmes: ${issues_description}` : ''}`;

    const { error: updateResError } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        notes: reservation.notes ? `${reservation.notes}\n\n${returnNotes}` : returnNotes
      })
      .eq('id', reservationId);

    if (updateResError) throw updateResError;

    if (has_issues && issues_description) {
      await supabase
        .from('maintenance')
        .insert([{
          vehicle_id: reservation.vehicle_id,
          type: 'repair',
          description: `Problèmes signalés au retour: ${issues_description}`,
          scheduled_date: new Date().toISOString(),
          status: 'scheduled',
          mileage_at_service: current_mileage
        }]);
    }

    res.json({ message: 'Vehicle returned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/maintenance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        vehicles (*)
      `)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/maintenance-alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('v_maintenance_alerts')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/maintenance-alerts/vehicle/:vehicleId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_maintenance_alerts', { vehicle_uuid: req.params.vehicleId });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/maintenance-rules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_rules')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profiles/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.params.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
