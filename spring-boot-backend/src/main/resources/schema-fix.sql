-- Fix featured_image column size - base64 images can be very large
ALTER TABLE properties MODIFY COLUMN featured_image LONGTEXT;

-- Add approval_status column if it does not already exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved';

-- Add account_status column if it does not already exist (owner approval flow)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add business_permit_image column if it does not already exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_permit_image LONGTEXT;
