-- Seed script pour alimenter la table time_slots
-- Créneaux horaires pour les 30 prochaines semaines

-- Supprime les données existantes
DELETE FROM time_slots;

-- Insère des créneaux pour les 30 prochaines semaines
-- Créneaux de 8h à 18h, du lundi au vendredi
INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
SELECT 
  date_series.date,
  time_slot.start_time,
  time_slot.end_time,
  5 as capacity,
  0 as used_capacity,
  'available' as status
FROM (
  -- Génère les dates pour les 30 prochaines semaines (lundi au vendredi)
  SELECT generate_series(
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '210 days',
    INTERVAL '1 day'
  )::date as date
) date_series
CROSS JOIN (
  -- Définit les créneaux horaires
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