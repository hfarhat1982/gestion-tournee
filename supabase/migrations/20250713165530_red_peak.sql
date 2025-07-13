/*
  # Create time slots generation function

  1. New Functions
    - `api_generate_time_slots` - Function to generate time slots for a date range
    
  2. Functionality
    - Generates time slots from 8h to 18h (10 slots per day)
    - Only creates slots for weekdays (Monday to Friday)
    - Configurable capacity per slot (default: 5)
    - Skips weekends automatically
    
  3. Parameters
    - start_date: Starting date for generation
    - days_ahead: Number of days to generate (default: 30)
*/

-- Create the function to generate time slots
CREATE OR REPLACE FUNCTION api_generate_time_slots(
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result_count INTEGER := 0;
  current_date DATE;
  end_date DATE;
  time_slot_start TIME;
  time_slot_end TIME;
  slot_hour INTEGER;
BEGIN
  -- Calculate end date
  end_date := start_date + INTERVAL '1 day' * days_ahead;
  
  -- Delete existing slots in the date range to avoid duplicates
  DELETE FROM time_slots 
  WHERE date >= start_date AND date <= end_date;
  
  -- Loop through each date
  current_date := start_date;
  WHILE current_date <= end_date LOOP
    -- Only create slots for weekdays (Monday=1 to Friday=5)
    IF EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5 THEN
      -- Create 10 time slots from 8h to 18h
      FOR slot_hour IN 8..17 LOOP
        time_slot_start := (slot_hour || ':00:00')::TIME;
        time_slot_end := ((slot_hour + 1) || ':00:00')::TIME;
        
        INSERT INTO time_slots (
          date,
          start_time,
          end_time,
          capacity,
          used_capacity,
          status
        ) VALUES (
          current_date,
          time_slot_start,
          time_slot_end,
          5, -- Default capacity of 5 per slot
          0, -- Initially no used capacity
          'available'
        );
        
        result_count := result_count + 1;
      END LOOP;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Return result as JSON
  RETURN json_build_object(
    'success', true,
    'message', 'Time slots generated successfully',
    'slots_created', result_count,
    'date_range', json_build_object(
      'start_date', start_date,
      'end_date', end_date
    )
  );
END;
$$;