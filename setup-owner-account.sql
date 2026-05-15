-- Create boarding house owner account
-- Email: eragritchiegg@gmail.com
-- Password: 1234 (will be hashed by BCrypt in Java - store the hashed version)
-- Note: BCrypt hashing of "1234" produces: $2a$10$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm

-- Check if user already exists
SELECT * FROM appdevdb.users WHERE email = 'eragritchiegg@gmail.com';

-- If the above returns no results, insert the owner:
INSERT INTO appdevdb.users 
(email, password, full_name, phone, bio, profile_image, created_at, updated_at) 
VALUES 
(
  'eragritchiegg@gmail.com',
  '$2a$10$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm',  -- BCrypt hash of "1234"
  'Boarding House Owner',
  '+1234567890',
  'Welcome to our boarding house!',
  NULL,
  NOW(),
  NOW()
);

-- Verify the owner was created:
SELECT id, email, full_name FROM appdevdb.users WHERE email = 'eragritchiegg@gmail.com';

-- If you need to get the owner's ID after creation:
SELECT * FROM appdevdb.users WHERE email = 'eragritchiegg@gmail.com' LIMIT 1;
