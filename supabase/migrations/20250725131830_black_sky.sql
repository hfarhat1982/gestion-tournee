/*
  # Create time slots generation function

  1. Function Purpose
    - Generates time slots for a given date range
    - Handles existing slots referenced by orders safely
    - Creates only new slots that don't already exist

  2. Safety Features
    - No deletion of existing slots
    - Checks for duplicates before insertion
    - Preserves data integrity with foreign key constraints

  3. Parameters
    - p_start_date: Start date for generation
    - p_end_date: End date for generation  
    - p_slot_capacity: Capacity for each slot (default 5)
*/

CREATE OR REPLACE FUNCTION generate_time_slots_for_range(
  p_start_date DATE,
  p_end_date DATE,
  p_slot_capacity INTEGER DEFAULT 5
)
RETURNS TABLE(
  slots_created INTEGER,
  date_range TEXT
) AS $$
DECLARE
  slot_count INTEGER := 0;
BEGIN
  -- Insert new time slots only if they don't already exist
  INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
  SELECT 
    date_series.date,
    time_slot.start_time,
    time_slot.end_time,
    p_slot_capacity as capacity,
    0 as used_capacity,
    'available' as status
  FROM (
    -- Generate dates for the specified range (weekdays only)
    SELECT generate_series(
      p_start_date,
      p_end_date,
      INTERVAL '1 day'
    )::date as date
  ) date_series
  CROSS JOIN (
    -- Define time slots from 8:00 to 18:00
    VALUES 
      ('08:00:00'::time, '09:00:00'::time),
      ('09:00:00'::time, '10:00:00'::time),
      ('10:00:00'::time, '11:00:00'::time),
      ('11:00:00'::time, '12:00:00'::time),
      ('12:00:00'::time, '13:00:00'::time),
      ('13:00:00'::time, '14:00:00'::time),
      ('14:00:00'::time, '15:00:00'::time),
      ('15:00:00'::time, '16:00:00'::time),
      ('16:00:00'::time, '17:00:00'::time),
      ('17:00:00'::time, '18:00:00'::time)
  ) AS time_slot(start_time, end_time)
  WHERE 
    -- Exclude weekends (Saturday = 6, Sunday = 0)
    EXTRACT(DOW FROM date_series.date) NOT IN (0, 6)
    -- Only insert if the slot doesn't already exist
    AND NOT EXISTS (
      SELECT 1 FROM time_slots ts 
      WHERE ts.date = date_series.date 
      AND ts.start_time = time_slot.start_time
    );

  -- Get count of inserted rows
  GET DIAGNOSTICS slot_count = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT 
    slot_count,
    CONCAT(p_start_date::text, ' - ', p_end_date::text);
END;
$$ LANGUAGE plpgsql;