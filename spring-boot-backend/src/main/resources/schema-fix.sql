-- Fix featured_image column size - base64 images can be very large
ALTER TABLE properties MODIFY COLUMN featured_image LONGTEXT;

-- Add approval_status column if it does not already exist
-- (safe to run on an already-migrated schema — uses IF NOT EXISTS)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved';
