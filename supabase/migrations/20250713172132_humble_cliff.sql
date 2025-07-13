-- Script SQL pour remplir la table time_slots avec les créneaux des 3 prochains mois
-- Créneaux de 8h à 18h, du lundi au vendredi uniquement

-- Supprime les créneaux existants pour éviter les doublons
DELETE FROM time_slots WHERE date >= CURRENT_DATE;

-- Insère les créneaux pour les 3 prochains mois (environ 90 jours)
INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
SELECT 
  date_series.date,
  time_slot.start_time,
  time_slot.end_time,
  5 as capacity,
  0 as used_capacity,
  'available' as status
FROM (
  -- Génère les dates pour les 3 prochains mois
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    INTERVAL '1 day'
  )::date as date
) date_series
CROSS JOIN (
  -- Définit les créneaux horaires de 8h à 18h
  VALUES 
    ('08:00:00', '09:00:00'),
    ('09:00:00', '10:00:00'),
    ('10:00:00', '11:00:00'),
    ('11:00:00', '12:00:00'),
    ('12:00:00', '13:00:00'),
    ('13:00:00', '14:00:00'),
    ('14:00:00', '15:00:00'),
    ('15:00:00', '16:00:00'),
    ('16:00:00', '17:00:00'),
    ('17:00:00', '18:00:00')
) AS time_slot(start_time, end_time)
WHERE 
  -- Exclut les weekends (samedi = 6, dimanche = 0)
  EXTRACT(DOW FROM date_series.date) NOT IN (0, 6)
ORDER BY date_series.date, time_slot.start_time;

-- Affiche le nombre de créneaux créés
SELECT COUNT(*) as "Nombre de créneaux créés" FROM time_slots WHERE date >= CURRENT_DATE;