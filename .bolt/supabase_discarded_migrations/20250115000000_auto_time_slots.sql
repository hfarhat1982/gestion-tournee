-- Fonction pour générer automatiquement les créneaux horaires
CREATE OR REPLACE FUNCTION generate_time_slots(
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
  current_date DATE;
  slot_time TIME;
BEGIN
  -- Supprime les créneaux existants pour les dates futures
  DELETE FROM time_slots 
  WHERE date >= start_date;
  
  -- Génère les créneaux pour chaque jour ouvré
  FOR current_date IN 
    SELECT generate_series(
      start_date,
      start_date + (days_ahead || ' days')::INTERVAL,
      '1 day'::INTERVAL
    )::DATE
  LOOP
    -- Vérifie si c'est un jour ouvré (lundi = 1, vendredi = 5)
    IF EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5 THEN
      -- Génère les créneaux de 8h à 18h
      FOR slot_time IN 
        SELECT generate_series(
          '08:00:00'::TIME,
          '17:00:00'::TIME,
          '1 hour'::INTERVAL
        )::TIME
      LOOP
        INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
        VALUES (
          current_date,
          slot_time,
          slot_time + '1 hour'::INTERVAL,
          5,
          0,
          'available'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens créneaux (plus de 6 mois)
CREATE OR REPLACE FUNCTION cleanup_old_time_slots()
RETURNS VOID AS $$
BEGIN
  DELETE FROM time_slots 
  WHERE date < CURRENT_DATE - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement les créneaux quand ils manquent
CREATE OR REPLACE FUNCTION check_and_generate_slots()
RETURNS TRIGGER AS $$
DECLARE
  future_slots_count INTEGER;
BEGIN
  -- Vérifie s'il y a des créneaux pour les 7 prochains jours
  SELECT COUNT(*) INTO future_slots_count
  FROM time_slots 
  WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
  
  -- Si moins de 50 créneaux pour la semaine prochaine, en génère
  IF future_slots_count < 50 THEN
    PERFORM generate_time_slots(CURRENT_DATE, 30);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui s'exécute après chaque insertion dans orders
CREATE TRIGGER auto_generate_slots_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_and_generate_slots();

-- Génère les premiers créneaux
SELECT generate_time_slots(CURRENT_DATE, 30); 