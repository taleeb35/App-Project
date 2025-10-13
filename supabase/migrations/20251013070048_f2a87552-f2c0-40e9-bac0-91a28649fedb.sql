-- Add patient_type column to patients table
ALTER TABLE patients ADD COLUMN patient_type text DEFAULT 'Civilian' CHECK (patient_type IN ('Veteran', 'Civilian'));

-- Migrate existing data from is_veteran to patient_type
UPDATE patients SET patient_type = CASE WHEN is_veteran = true THEN 'Veteran' ELSE 'Civilian' END;

-- Make patient_type NOT NULL after migration
ALTER TABLE patients ALTER COLUMN patient_type SET NOT NULL;