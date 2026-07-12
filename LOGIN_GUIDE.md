# 🔐 StudyGen AI - Login & Authentication Guide

## **Quick Start - Create Your Account**

Your application uses **Supabase Authentication**. There are no pre-defined demo accounts - you need to create your own.

---

## **📝 Step 1: Sign Up (Create New Account)**

### **Method: Through the Web UI**

1. **Open the app** at `http://localhost:5173`
2. **Click "Sign up"** tab
3. **Enter your details:**
   - Email: `your-email@example.com` (any email)
   - Password: `password123` (minimum 8 characters)
   - Confirm Password: `password123`
4. **Click "Sign Up"**
5. **Success!** You'll be redirected to login

---

## **🔑 Step 2: Log In**

### **Method: Through the Web UI**

1. **You should be on Login page** (or click "Login" tab)
2. **Enter your credentials:**
   - Email: `your-email@example.com` (what you just created)
   - Password: `password123`
3. **Click "Login"**
4. **Success!** You'll see the **Dashboard** ✅

---

## **💡 Suggested Test Credentials**

You can use any email/password combination. Here are suggestions:

### **Test Account 1 (Development)**
```
Email: dev@studygen.local
Password: DevPassword123
```

### **Test Account 2 (Testing)**
```
Email: test@studygen.local
Password: TestPassword456
```

### **Test Account 3 (Demo)**
```
Email: demo@studygen.local
Password: DemoPassword789
```

---

## **❓ Common Authentication Questions**

### **Q: Do I need to create multiple accounts?**
No, one account is enough for local development. Create one test account and reuse it.

### **Q: Can I use any email address?**
Yes! Since this is local development with Supabase, you can use any email format:
- `test@example.com` ✅
- `admin@localhost` ✅
- `user.123@test.local` ✅
- Even `abc@xyz` works! ✅

### **Q: Can I use a simple password?**
No, passwords must be at least **8 characters** long.

### **Q: What if I forget my password?**
For local development, just create a new account with a different email.

### **Q: Can I reset my password?**
Yes, if you set up Supabase email service. For local development, it's easier to just create a new account.

---

## **🔍 Verify Login Works**

After logging in, you should see:

1. **Dashboard Page** with:
   - Welcome message
   - Usage statistics
   - Recent documents
   - Quick actions

2. **Browser Console** (F12 → Console) shows:
   ```
   [API] GET /api/dashboard/overview
   [API] Response: 200
   ```

3. **Top Right** shows:
   - Your email address
   - Logout button

---

## **⚠️ If Login Fails**

### **Error: "Login failed. Check your credentials and try again."**
- ❌ Email or password is wrong
- ✅ Try signing up again with your email
- ✅ Make sure password is at least 8 characters

### **Error: "Network error"**
- ❌ Backend is not running
- ✅ Run: `cd backend && python run-backend-complete.bat`
- ✅ Wait for: `INFO: Application startup complete`

### **Error: Blank page after login**
- ❌ Frontend not running properly
- ✅ Press F5 to refresh browser
- ✅ Check browser console (F12) for errors
- ✅ Try: `npm run dev` in new terminal

### **Error: "Session has expired"**
- ❌ Your authentication token expired
- ✅ Refresh page (F5)
- ✅ Log out and log in again
- ✅ Check browser Application tab → localStorage → Look for auth tokens

---

## **🛠️ Authentication System Details**

### **How It Works:**

```
You (Browser)
    ↓
    [Sign Up / Login Form]
    ↓
Supabase (Local Stack at http://localhost:54321)
    ↓
    [Auth Token Created]
    ↓
Backend (http://localhost:8000)
    ↓
    [JWT Validation]
    ↓
Dashboard (http://localhost:5173)
```

### **Where Credentials Are Stored:**

| Location | What | Why |
|----------|------|-----|
| `localStorage` | Auth tokens (JWT) | Keeps you logged in |
| `Supabase` | Email & password hash | Secure authentication |
| Browser Cookies | Session info | Cross-domain tracking |

---

## **🔒 Security Notes for Development**

### **⚠️ DO NOT use these credentials in production:**
- This setup uses local Supabase instance
- Passwords are not production-grade hashed
- All data is in-memory or local database
- Perfect for development only

### **✅ For production, you need:**
- Real Supabase project (or other auth provider)
- Proper SSL/TLS certificates
- Production database
- Environment secrets management
- 2FA/MFA for user accounts

---

## **📚 More Information**

### **Related Documentation:**
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Frontend Auth Flow](src/lib/AuthProvider.tsx)
- [Backend Auth Endpoints](backend/app/routes/auth.py)

### **Troubleshooting:**
1. **TROUBLESHOOTING.md** - 30+ common issues
2. **PERFECT_START_GUIDE.md** - Complete setup guide
3. **WINDOWS_QUICK_START.txt** - Visual step-by-step

---

## **✅ Quick Checklist**

Before reporting authentication issues, verify:

- [ ] Both frontend and backend are running
- [ ] Backend shows: `Application startup complete`
- [ ] Frontend shows: `Local: http://localhost:5173`
- [ ] You can see the login page at `http://localhost:5173`
- [ ] Email field accepts your email
- [ ] Password is at least 8 characters
- [ ] Browser console (F12) doesn't show errors
- [ ] You tried signing up first (before logging in)

---

## **🚀 Ready to Login?**

1. Make sure both services are running
2. Go to: `http://localhost:5173`
3. Click **"Sign up"**
4. Create account with any email & 8+ char password
5. Click **"Login"** tab
6. Use the same credentials
7. **Enjoy! 🎉**

---

**Questions?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or [PERFECT_START_GUIDE.md](PERFECT_START_GUIDE.md)
