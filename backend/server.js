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

// Email notification config
const ALERT_EMAILS = (process.env.ALERT_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const EDGE_FUNCTION_URL = process.env.SUPABASE_EDGE_FUNCTION_URL;

async function sendAlertEmail(to, subject, html) {
  if (!EDGE_FUNCTION_URL) {
    console.warn('SUPABASE_EDGE_FUNCTION_URL not configured, skipping email');
    return;
  }
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('Email send error:', err);
    }
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

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
      .select('*, vehicles(*)')
      .single();

    if (error) throw error;

    // Update vehicle mileage when maintenance is completed with mileage_at_service
    if (req.body.status === 'completed' && req.body.mileage_at_service) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ mileage: req.body.mileage_at_service })
        .eq('id', data.vehicle_id);

      if (vehicleError) throw vehicleError;
    }

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

app.post('/api/maintenance-alerts/notify', async (req, res) => {
  try {
    if (ALERT_EMAILS.length === 0) {
      return res.status(400).json({ error: 'Aucune adresse email configurée.' });
    }

    const { data: alerts, error } = await supabase
      .from('v_maintenance_alerts')
      .select('*');

    if (error) throw error;

    const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high');

    if (urgentAlerts.length === 0) {
      return res.json({ message: 'Aucune alerte urgente à notifier.', sent: false });
    }

    const alertRows = urgentAlerts.map(a => {
      const priority = a.priority === 'urgent' ? '🔴 Urgent' : '🟠 Haute';
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${a.vehicle_brand || ''} ${a.vehicle_model || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.license_plate || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.rule_name || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.description || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${priority}</td>
      </tr>`;
    }).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#c05c4f;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:22px;">⚠️ Alertes de maintenance - Fleet Manager</h1>
        </div>
        <div style="padding:20px;background:#faf3f2;border-radius:0 0 8px 8px;">
          <p style="color:#0d0604;"><strong>${urgentAlerts.length}</strong> alerte(s) nécessitent votre attention :</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#c05c4f;color:white;">
                <th style="padding:8px;text-align:left;">Véhicule</th>
                <th style="padding:8px;text-align:left;">Plaque</th>
                <th style="padding:8px;text-align:left;">Type</th>
                <th style="padding:8px;text-align:left;">Description</th>
                <th style="padding:8px;text-align:left;">Priorité</th>
              </tr>
            </thead>
            <tbody>${alertRows}</tbody>
          </table>
          <p style="margin-top:20px;color:#666;font-size:13px;">Connectez-vous à Fleet Manager pour planifier les maintenances nécessaires.</p>
        </div>
      </div>
    `;

    const subject = `⚠️ ${urgentAlerts.length} alerte(s) de maintenance - Fleet Manager`;

    await Promise.all(
      ALERT_EMAILS.map(email => sendAlertEmail(email, subject, html))
    );

    res.json({ message: `Notifications envoyées à ${ALERT_EMAILS.length} destinataire(s).`, sent: true, alertCount: urgentAlerts.length });
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

app.get('/api/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

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

// Track notified alerts to avoid duplicate emails
const notifiedAlerts = new Set();

async function checkAndNotifyAlerts() {
  if (ALERT_EMAILS.length === 0 || !EDGE_FUNCTION_URL) return;

  try {
    const { data: alerts, error } = await supabase
      .from('v_maintenance_alerts')
      .select('*');

    if (error) {
      console.error('Error fetching alerts:', error.message);
      return;
    }

    // Filter only urgent/high alerts that haven't been notified yet
    const newAlerts = alerts.filter(a => 
      (a.priority === 'urgent' || a.priority === 'high') &&
      !notifiedAlerts.has(`${a.vehicle_id}-${a.rule_name}`)
    );

    if (newAlerts.length === 0) return;

    const alertRows = newAlerts.map(a => {
      const priority = a.priority === 'urgent' ? '🔴 Urgent' : '🟠 Haute';
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${a.vehicle_brand || ''} ${a.vehicle_model || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.license_plate || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.rule_name || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${a.description || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;">${priority}</td>
      </tr>`;
    }).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#c05c4f;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:22px;">🚨 Nouvelles alertes de maintenance - Fleet Manager</h1>
        </div>
        <div style="padding:20px;background:#faf3f2;border-radius:0 0 8px 8px;">
          <p style="color:#0d0604;"><strong>${newAlerts.length}</strong> nouvelle(s) alerte(s) détectée(s) :</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#c05c4f;color:white;">
                <th style="padding:8px;text-align:left;">Véhicule</th>
                <th style="padding:8px;text-align:left;">Plaque</th>
                <th style="padding:8px;text-align:left;">Type</th>
                <th style="padding:8px;text-align:left;">Description</th>
                <th style="padding:8px;text-align:left;">Priorité</th>
              </tr>
            </thead>
            <tbody>${alertRows}</tbody>
          </table>
          <p style="margin-top:20px;color:#666;font-size:13px;">Connectez-vous à Fleet Manager pour planifier les maintenances nécessaires.</p>
        </div>
      </div>
    `;

    const subject = `🚨 ${newAlerts.length} nouvelle(s) alerte(s) de maintenance - Fleet Manager`;

    await Promise.all(
      ALERT_EMAILS.map(email => sendAlertEmail(email, subject, html))
    );

    // Mark these alerts as notified
    newAlerts.forEach(a => notifiedAlerts.add(`${a.vehicle_id}-${a.rule_name}`));
    console.log(`[Auto-notify] ${newAlerts.length} nouvelle(s) alerte(s) envoyée(s) à ${ALERT_EMAILS.join(', ')}`);
  } catch (error) {
    console.error('[Auto-notify] Error:', error.message);
  }
}

// Check alerts every 30 minutes
const ALERT_CHECK_INTERVAL = 30 * 60 * 1000;
setInterval(checkAndNotifyAlerts, ALERT_CHECK_INTERVAL);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initial check 10 seconds after startup
  setTimeout(checkAndNotifyAlerts, 10000);
});
