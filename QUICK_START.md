# VacanSee - Quick Start Testing Guide

## 🚀 START HERE

### Step 1: Start Backend (Auto-creates Owner Account)

Open Terminal #1 and run:
```bash
cd spring-boot-backend
mvn clean spring-boot:run
```

**Wait for output:**
```
✅ Owner account created successfully!
   Email: eragritchiegg@gmail.com
   Password: 123
   ID: 1

Started VacanSeeApplication in X.XXX seconds
```

✅ If you see this, owner account is ready!

---

### Step 2: Start Frontend

Open Terminal #2 and run:
```bash
npm start
```

App opens at `http://localhost:3000`

---

### Step 3: Test Flow (5 minutes)

#### 3.1: Register a Test Renter
1. Go to Register page
2. Email: `testrenter@test.com`
3. Password: `test123`
4. Full Name: `Test Renter`
5. Phone: `555-0100`
6. Click Register
7. ✅ Should see success

#### 3.2: Login as Renter
1. Go to Login page
2. Email: `testrenter@test.com`
3. Password: `test123`
4. Click Login
5. ✅ Should see Dashboard

#### 3.3: Book a Property
1. Go to Browse or find a property
2. Click property card
3. Click "Book Now" or "Confirm Booking"
4. Set dates (any future dates)
5. Click Confirm
6. ✅ Should see "Booking confirmed!"

#### 3.4: Check Dashboard Shows Real Data
1. Go to Dashboard
2. Verify "Your Bookings: 1" (not 0, not hardcoded)
3. Verify "New Messages: 0"
4. ✅ Real data showing!

#### 3.5: Send Message to Owner
1. Go to any property detail
2. Click "Message Owner" button
3. Type: "Hi, interested in this place"
4. Click "Send Message"
5. ✅ Should show "Message sent to property owner!"

#### 3.6: Login as Owner and Check Message
1. Logout (click logout)
2. Go to Login
3. Email: `eragritchiegg@gmail.com`
4. Password: `123`
5. Click Login
6. Go to Dashboard
7. Check "New Messages: 1" ✅
8. Go to Messages page
9. See conversation from test renter ✅
10. Click conversation
11. See the message: "Hi, interested in this place" ✅

---

## ✅ ALL TESTS PASSED = SYSTEM WORKS!

---

## 📊 What We Fixed

| Feature | Status | Notes |
|---------|--------|-------|
| Account Creation | ✅ Persists to DB | Now saves to users table |
| Login | ✅ DB validation | Checks against stored password |
| Book a Room | ✅ Saves booking | Stores in bookings table |
| Dashboard Analytics | ✅ Real data | Counts actual bookings/messages |
| Messages | ✅ End-to-end | Renters → Owner messaging works |
| Owner Account | ✅ Auto-created | ID 1, email: eragritchiegg@gmail.com |
| Error Handling | ✅ Improved | Better error messages throughout |

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Clean and rebuild
mvn clean install
mvn spring-boot:run
```

### Frontend errors
```bash
# Clear cache and restart
rm -r node_modules package-lock.json
npm install
npm start
```

### Owner account not working
- Check backend console for "Owner account created"
- If not shown, manually check database:
  ```bash
  mysql -u root -p123 appdevdb -e "SELECT id, email FROM users;"
  ```
- Owner should have ID 1

### Booking not showing in dashboard
- Verify booking was made
- Check localStorage: Open DevTools (F12) → Application → LocalStorage
- Look for "userId" - should have a value

### Messages not working
- Verify owner account exists with ID 1
- Check browser console (F12) for errors
- Try sending message again

---

## 🎯 Key Accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | eragritchiegg@gmail.com | 123 |
| Test Renter | testrenter@test.com | test123 |

---

## 📱 API Endpoints (for reference)

```
Backend: http://localhost:8000
Frontend: http://localhost:3000
Database: localhost:3306/appdevdb

POST /api/auth/register        # Create account
POST /api/auth/login            # Login
POST /api/bookings              # Book property
GET /api/bookings               # Get bookings
GET /api/messages/conversations/{userId}  # Get conversations
POST /api/messages              # Send message
```

---

## ✨ Next Steps

- [ ] All tests pass?
- [ ] Want to add more properties? Edit [src/data/appData.js](../src/data/appData.js)
- [ ] Want to customize UI? Update [src/styles/](../src/styles/)
- [ ] Ready to deploy? Let's discuss production setup

---

**Status: ✅ Ready for Testing**
**Version: 1.0 Complete**
