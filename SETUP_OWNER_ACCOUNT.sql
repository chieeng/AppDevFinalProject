-- ========================================
-- OWNER ACCOUNT SETUP FOR VACANSEE
-- ========================================
-- This script creates the dedicated boarding house owner account
-- Email: eragritchiegg@gmail.com
-- Password: 123
-- Note: The password hash is for "123" encoded with BCrypt

-- Step 1: Check if account already exists
SELECT 'Checking for existing account...' as status;
SELECT * FROM users WHERE email = 'eragritchiegg@gmail.com';

-- Step 2: Delete if exists (optional - comment out if you want to keep existing)
-- DELETE FROM users WHERE email = 'eragritchiegg@gmail.com';

-- Step 3: Insert the owner account
-- Password hash for "123": $2a$10$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm
INSERT INTO users (
    email, 
    password, 
    full_name, 
    phone, 
    bio, 
    created_at, 
    updated_at
) VALUES (
    'eragritchiegg@gmail.com',
    '$2a$10$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm',
    'VacanSee Owner',
    '+1-555-0100',
    'Official VacanSee Boarding House Owner Account',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    password = '$2a$10$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm',
    full_name = 'VacanSee Owner',
    updated_at = NOW();

-- Step 4: Verify the account was created and get its ID
SELECT 'Account creation verification:' as status;
SELECT id, email, full_name, created_at FROM users WHERE email = 'eragritchiegg@gmail.com';

-- Step 5: Important - Confirm the ID is 1
SELECT 'CRITICAL: Account ID should be 1 (required for messaging feature)' as note;
SELECT 'If ID is not 1, you will need to update MessageOwnerModal.jsx to use the correct ID' as warning;
