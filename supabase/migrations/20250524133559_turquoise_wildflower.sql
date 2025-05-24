/*
  # Add subscription plan column to profiles table

  1. Changes
    - Add `subscription_plan` column to `profiles` table with type `text`
    - Set default value to 'free'
    - Add check constraint to ensure valid plan types

  2. Security
    - No additional security changes needed as the profiles table already has RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN subscription_plan text NOT NULL DEFAULT 'free';

    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_subscription_plan_check 
    CHECK (subscription_plan IN ('free', 'premium'));
  END IF;
END $$;