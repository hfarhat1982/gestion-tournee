/*
  # Create time slots generation function

  1. New Functions
    - `generate_time_slots_for_range(p_start_date, p_end_date, p_slot_capacity)`
      - Generates time slots for a given date range
      - Creates slots from 8:00 to 18:00 for weekdays only
      - Deletes existing slots in range to prevent duplicates
      - Returns count of created slots and date range

  2. Features
    - Automatic weekday filtering (excludes weekends)
    - Configurable slot capacity
    - Safe regeneration (deletes existing slots first)
    - Returns useful feedback information
*/

CREATE OR REPLACE FUNCTION public.generate_time_slots_for_range(
    p_start_date date,
    p_end_date date,
    p_slot_capacity integer
)
RETURNS TABLE (slots_created bigint, date_range text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_slots_count bigint;
    v_date_range text;
BEGIN
    -- Delete existing slots within the specified range to allow regeneration
    DELETE FROM time_slots
    WHERE date >= p_start_date AND date <= p_end_date;

    INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
    SELECT 
        date_series.date,
        time_slot.start_time,
        time_slot.end_time,
        p_slot_capacity as capacity,
        0 as used_capacity,
        'available' as status
    FROM (
        -- Generate dates for the given range (Monday to Friday)
        SELECT generate_series(
            p_start_date,
            p_end_date,
            INTERVAL '1 day'
        )::date as date
    ) date_series
    CROSS JOIN (
        -- Define time slots from 08:00 to 18:00
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
        -- Exclude weekends (Sunday = 0, Saturday = 6)
        EXTRACT(DOW FROM date_series.date) NOT IN (0, 6);

    GET DIAGNOSTICS v_slots_count = ROW_COUNT;
    v_date_range := p_start_date::text || ' to ' || p_end_date::text;

    RETURN QUERY SELECT v_slots_count, v_date_range;
END;
$$;