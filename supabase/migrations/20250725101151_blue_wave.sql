/*
  # Create time slots generation function

  1. New Functions
    - `generate_time_slots_for_range` - Generates time slots for a date range
    - Automatically creates slots from 8h to 18h for weekdays only
    - Configurable capacity per slot (default: 5)

  2. Security
    - Function accessible to authenticated users
    - Proper error handling
*/

-- Function to generate time slots for a date range
CREATE OR REPLACE FUNCTION generate_time_slots_for_range(
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  slot_capacity INTEGER DEFAULT 5
)
RETURNS TABLE(
  slots_created INTEGER,
  date_range TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date DATE;
  slot_start TIME;
  slot_end TIME;
  slots_count INTEGER := 0;
  time_slots TIME[] := ARRAY['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  i INTEGER;
BEGIN
  -- Loop through each date in the range
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      
      -- Create time slots for this date
      FOR i IN 1..array_length(time_slots, 1) LOOP
        slot_start := time_slots[i];
        
        -- Calculate end time (1 hour later)
        IF i < array_length(time_slots, 1) THEN
          slot_end := time_slots[i + 1];
        ELSE
          slot_end := '18:00';
        END IF;
        
        -- Insert time slot if it doesn't exist
        INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
        VALUES (current_date, slot_start, slot_end, slot_capacity, 0, 'available')
        ON CONFLICT (date, start_time) DO NOTHING;
        
        -- Count successful insertions
        IF FOUND THEN
          slots_count := slots_count + 1;
        END IF;
      END LOOP;
      
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN QUERY SELECT 
    slots_count,
    start_date::TEXT || ' to ' || end_date::TEXT;
END;
$$;

-- Add unique constraint to prevent duplicate slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'time_slots_date_start_time_unique'
  ) THEN
    ALTER TABLE time_slots 
    ADD CONSTRAINT time_slots_date_start_time_unique 
    UNIQUE (date, start_time);
  END IF;
END $$;