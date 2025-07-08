-- Fonction pour générer manuellement des créneaux (appelable via API)
CREATE OR REPLACE FUNCTION api_generate_time_slots(
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Génère les créneaux
  PERFORM generate_time_slots(start_date, days_ahead);
  
  -- Retourne un message de succès
  SELECT json_build_object(
    'success', true,
    'message', 'Créneaux générés avec succès',
    'start_date', start_date,
    'days_ahead', days_ahead
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donne les permissions nécessaires
GRANT EXECUTE ON FUNCTION api_generate_time_slots TO authenticated; 