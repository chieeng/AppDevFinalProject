# VacanSee Application - Complete Setup & Testing Guide

## Quick Start - FOLLOW THESE STEPS IN ORDER

### 1. Database Setup - Create Owner Account

The messaging system requires a dedicated owner account. Follow these steps:

**Option A: Using MySQL Command Line (Recommended)**

1. Open Command Prompt or PowerShell
2. Navigate to your MySQL bin directory OR add MySQL to PATH
3. Run this command:
```bash
mysql -u root -p123 appdevdb -e "INSERT INTO users (email, password, full_name, phone, bio, created_at, updated_at) VALUES ('eragritchiegg@gmail.com', '\$2a\$10\$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm', 'VacanSee Owner', '+1-555-0100', 'Official VacanSee Boarding House Owner Account', NOW(), NOW()) ON DUPLICATE KEY UPDATE password = '\$2a\$10\$slYQmyNdGzin7olVN3p5Be7DhH97IExMsznS9MqMdRWqa3cqLu7Vm', full_name = 'VacanSee Owner', updated_at = NOW();"
```

4. Verify the account was created:
```bash
mysql -u root -p123 appdevdb -e "SELECT id, email, full_name FROM users WHERE email = 'eragritchiegg@gmail.com';"
```

**Expected Output:**
```
+----+----------------------------+-------------------+
| id | email                      | full_name         |
+----+----------------------------+-------------------+
|  1 | eragritchiegg@gmail.com    | VacanSee Owner    |
+----+----------------------------+-------------------+
```

⚠️ **CRITICAL**: The ID MUST be 1. If it's not 1, the messaging feature won't work.

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Click on your "localhost:3306" connection
3. Go to "File" → "Open SQL Script"
4. Select `SETUP_OWNER_ACCOUNT.sql` in your project root
5. Click the lightning bolt icon to execute
6. Check the output - ID should be 1

**Option C: Manual SQL in Application Properties**
If you're running the backend with `ddl-auto=create` or `update`, it should create basic schema. Then run the SQL above.

---

### 2. Start the Backend (Spring Boot)

**Terminal 1 - Backend**
```bash
cd spring-boot-backend
mvn clean spring-boot:run
```

Wait for output: `Started VacanSeeApplication in X.XXX seconds`

Expected: Server runs on `http://localhost:8000`

---

### 3. Start the Frontend (React)

**Terminal 2 - Frontend**
```bash
npm start
```

Application opens at `http://localhost:3000`

---

### 4. Test the Complete System

#### Test 4.1: Create a Test Renter Account

1. Go to http://localhost:3000/register
2. Fill in form:
   - **Email**: `testrenter@example.com`
   - **Password**: `test123`
   - **Full Name**: `Test Renter`
   - **Phone**: `555-0100`
3. Click "Register"
4. Should see success message
5. Click "Go to Login"

#### Test 4.2: Login as Test Renter

1. Enter email: `testrenter@example.com`
2. Enter password: `test123`
3. Click "Login"
4. Should redirect to menu/dashboard

#### Test 4.3: Test Booking Feature

1. From the menu, go to "Browse Properties" or find a property listing
2. Click on any property card
3. Click "Confirm Booking" or book button
4. Fill in booking details:
   - Check-in date: Any future date
   - Number of guests: Any number
5. Click "Confirm Booking"
6. Should see success message
7. Go to Dashboard → Check "Your Bookings" count (should show 1)

#### Test 4.4: Test Dashboard Analytics

1. Go to Dashboard
2. Verify the following stats display actual values (not hardcoded):
   - ✅ **Your Bookings**: Should show 1 (from booking above)
   - ✅ **Available Properties**: Should show number
   - ✅ **New Messages**: Should show 0 (no messages yet)
   - ✅ **Rating**: Should show number

**Example Dashboard Output:**
```
Available Properties: 24
Your Bookings: 1           ← Real data from database
New Messages: 0           ← Real data from database
Rating: 4.9               ← Real data from database
```

#### Test 4.5: Test Messaging - Send Message to Owner

1. Still logged in as test renter
2. Go to any property detail page
3. Click "Message Owner" button (should open modal)
4. Type message: `"Hello, I'm interested in this property"`
5. Click "Send Message"
6. Should see success: `"Message sent to property owner!"`

#### Test 4.6: Verify Message Received - Login as Owner

1. **Logout** from renter account (click logout button)
2. Go to http://localhost:3000/login
3. Login with owner account:
   - **Email**: `eragritchiegg@gmail.com`
   - **Password**: `123`
4. Should see dashboard
5. Go to "Messages" page
6. Should see conversation from "Test Renter" with your message

#### Test 4.7: Verify Unread Message Count

1. Still logged in as owner
2. Go to Dashboard
3. Check "New Messages" stat - should show 1 (the message from renter)
4. Go to Messages page - should see conversation with unread badge

#### Test 4.8: Reply to Renter

1. Go to Messages page (still as owner)
2. Click on the conversation from the renter
3. Type reply message
4. Send it
5. Logout and login as renter again
6. Check Messages - should see owner's reply with unread badge

---

## Troubleshooting

### Issue: "Account creation failed" during registration

**Solution:**
- Check backend is running on `http://localhost:8000`
- Check database connection: `mysql -u root -p123 appdevdb -e "SELECT COUNT(*) FROM users;"`
- Check browser console for error messages (F12 → Console tab)

### Issue: "Bookings not showing in Dashboard"

**Solution:**
- Verify booking was saved: `mysql -u root -p123 appdevdb -e "SELECT * FROM bookings;"`
- Check backend logs for errors
- Verify userId is saved in localStorage: Open DevTools → Application → LocalStorage → Check "userId"

### Issue: "Message Owner button doesn't work"

**Solution:**
- Verify owner account exists with ID=1: `mysql -u root -p123 appdevdb -e "SELECT * FROM users WHERE id=1;"`
- If ID is not 1, update [src/components/MessageOwnerModal.jsx](src/components/MessageOwnerModal.jsx#L24) line 24 from `const ownerId = 1;` to correct ID

### Issue: "Messages page is empty"

**Solution:**
- Send a test message using the MessageOwnerModal
- Check database: `mysql -u root -p123 appdevdb -e "SELECT * FROM conversations; SELECT * FROM messages;"`
- Check backend logs for error messages

### Issue: Java compilation errors when starting backend

**Solution:**
- These are mostly IDE warnings, not actual errors
- If backend won't start, check: `mvn clean compile`
- Check application.properties: `cat spring-boot-backend/src/main/resources/application.properties`

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get userId
- `GET /api/auth/user/{id}` - Get user details

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Messaging
- `GET /api/messages/conversations/{userId}` - Get user's conversations
- `GET /api/messages/conversation/{convId}` - Get messages in conversation
- `POST /api/messages` - Send message
- `POST /api/messages/conversations` - Create conversation

---

## Key Accounts for Testing

| Purpose | Email | Password | ID |
|---------|-------|----------|-----|
| Owner/Admin | eragritchiegg@gmail.com | 123 | 1 (MUST BE 1) |
| Test Renter 1 | testrenter@example.com | test123 | Auto-generated |
| Test Renter 2 | testrenter2@example.com | test123 | Auto-generated |

---

## Feature Completion Checklist

- [ ] Owner account created with ID=1
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Register → Account saves to database
- [ ] Login → Works with database auth
- [ ] Book a Room → Booking saves to database
- [ ] Dashboard → Shows real booking count
- [ ] Dashboard → Shows real unread message count
- [ ] Messages page → Shows conversations
- [ ] Message Owner → Creates conversation with owner
- [ ] Message Owner → Message saved to database
- [ ] Owner receives message → Shows in Messages page
- [ ] Unread badges → Display correctly

---

## Database Schema Verification

Run these commands to verify tables exist:

```bash
mysql -u root -p123 appdevdb -e "SHOW TABLES;"
```

Expected tables:
- users
- properties
- bookings
- conversations
- messages
- inquiries

If tables missing, ensure application.properties has:
```
spring.jpa.hibernate.ddl-auto=update
```

---

## Quick Commands Reference

```bash
# Start backend
cd spring-boot-backend && mvn clean spring-boot:run

# Start frontend (new terminal)
npm start

# Check if owner account exists
mysql -u root -p123 appdevdb -e "SELECT id, email FROM users WHERE email='eragritchiegg@gmail.com';"

# View all conversations
mysql -u root -p123 appdevdb -e "SELECT * FROM conversations;"

# View all messages
mysql -u root -p123 appdevdb -e "SELECT * FROM messages;"

# Clear test data (careful!)
mysql -u root -p123 appdevdb -e "DELETE FROM messages; DELETE FROM bookings; DELETE FROM conversations; DELETE FROM users WHERE email != 'eragritchiegg@gmail.com';"
```

---

## Next Steps After Testing

1. ✅ If all tests pass → System is working correctly
2. ⚠️ If some tests fail → Check troubleshooting section
3. 📋 If you want more properties → Update [src/data/appData.js](src/data/appData.js)
4. 🎨 If you want UI changes → Update CSS files in [src/styles/](src/styles/)
5. 🚀 Ready for deployment → Ask about production setup

---

**Last Updated**: 2024
**System Status**: Ready for testing
