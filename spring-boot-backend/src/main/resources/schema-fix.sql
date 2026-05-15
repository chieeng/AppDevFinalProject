-- Fix featured_image column size - base64 images can be very large
ALTER TABLE properties MODIFY COLUMN featured_image LONGTEXT;
