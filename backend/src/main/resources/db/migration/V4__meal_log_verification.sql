-- Add trainer verification columns to meal_logs
ALTER TABLE meal_logs ADD COLUMN trainer_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE meal_logs ADD COLUMN trainer_verified_at TIMESTAMPTZ;
