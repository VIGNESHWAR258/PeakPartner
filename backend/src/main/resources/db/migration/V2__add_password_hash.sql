-- Add password_hash column to profiles table
ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255);
