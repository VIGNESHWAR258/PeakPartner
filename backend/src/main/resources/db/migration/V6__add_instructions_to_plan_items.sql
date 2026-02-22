-- Add instructions column to plan exercises and diet meal items
ALTER TABLE plan_exercises ADD COLUMN instructions TEXT;
ALTER TABLE diet_meal_items ADD COLUMN instructions TEXT;
