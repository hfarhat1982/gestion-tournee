@@ .. @@
 CREATE OR REPLACE FUNCTION generate_time_slots_for_range(
   p_start_date DATE,
   p_end_date DATE,
   p_slot_capacity INTEGER DEFAULT 5
 ) RETURNS TABLE(slots_created INTEGER, date_range TEXT) AS $$
 DECLARE
   slots_count INTEGER := 0;
 BEGIN
-  -- Supprime les créneaux existants dans la plage de dates
-  DELETE FROM time_slots 
-  WHERE date BETWEEN p_start_date AND p_end_date;
+  -- Ne supprime que les créneaux non référencés par des commandes
+  DELETE FROM time_slots 
+  WHERE date BETWEEN p_start_date AND p_end_date
+    AND id NOT IN (
+      SELECT DISTINCT time_slot_id 
+      FROM orders 
+      WHERE time_slot_id IS NOT NULL
+    );
 
   -- Génère les nouveaux créneaux
   INSERT INTO time_slots (date, start_time, end_time, capacity, used_capacity, status)
   SELECT 
     date_series.date,
     time_slot.start_time::TIME,
     time_slot.end_time::TIME,
     p_slot_capacity,
     0,
     'available'
   FROM (
     SELECT generate_series(
       p_start_date,
       p_end_date,
       INTERVAL '1 day'
     )::DATE as date
   ) date_series
   CROSS JOIN (
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
+    -- Évite les doublons avec les créneaux existants
+    AND NOT EXISTS (
+      SELECT 1 FROM time_slots ts
+      WHERE ts.date = date_series.date 
+        AND ts.start_time = time_slot.start_time::TIME
+    )
   ORDER BY date_series.date, time_slot.start_time;
 
   GET DIAGNOSTICS slots_count = ROW_COUNT;
 
   RETURN QUERY SELECT 
     slots_count,
     CONCAT(p_start_date::TEXT, ' - ', p_end_date::TEXT);
 END;
 $$ LANGUAGE plpgsql;