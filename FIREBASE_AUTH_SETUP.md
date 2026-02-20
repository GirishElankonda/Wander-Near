# Firebase Authentication Setup Guide

## 📋 Overview
This guide will help you set up Firebase Authentication for the WanderNear application.

## 🚀 Quick Start

### Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Click on the **gear icon** (Project Settings)
4. Scroll down to "Your apps" section
5. Click on the **Web app** icon (`</>`)
6. Copy your Firebase configuration object

### Step 2: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### Step 3: Enable Authentication Methods

In Firebase Console:

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** sign-in provider
   - Add your email as the support email
   - Save the configuration

### Step 4: Set up Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your region and create

### Step 5: Run the Application

Since the app uses ES Modules, you need to serve it from a local server:

```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx serve .

# Option 3: Using Live Server (VS Code Extension)
# Right-click on index.html → "Open with Live Server"
```

Then open your browser to `http://localhost:8000` (or the appropriate port).

## ✨ Features Implemented

### Authentication Flow
- ✅ **Email & Password Sign Up** - New users can register
- ✅ **Email & Password Sign In** - Existing users can log in
- ✅ **Google Sign In** - One-click Google authentication
- ✅ **Sign Out** - Users can log out
- ✅ **Auth State Persistence** - Users stay logged in across sessions

### UI Components
- ✅ **Auth Modal** - Professional login/signup modal
- ✅ **Form Validation** - Client-side validation with error messages
- ✅ **Loading States** - Visual feedback during authentication
- ✅ **Toast Notifications** - Success/error messages
- ✅ **User Menu Dropdown** - Profile menu after login
- ✅ **Responsive Design** - Works on all screen sizes

### Security
- ✅ **Firebase Auth** - Industry-standard authentication
- ✅ **Firestore Integration** - User data stored securely
- ✅ **Error Handling** - Proper error messages for all scenarios

## 🎯 How It Works

### Sign In Process
1. User clicks "Sign In" button in navbar
2. Auth modal opens with email/password fields
3. User enters credentials and submits
4. Firebase authenticates the user
5. On success:
   - User data is saved to Firestore
   - Navbar updates to show user profile
   - Success toast appears
   - Modal closes

### Sign Up Process
1. User clicks "Sign up" link in the modal
2. Form switches to signup mode (shows Name field)
3. User enters name, email, and password
4. Firebase creates the account
5. User profile is updated with display name
6. User data is saved to Firestore

### Google Sign In
1. User clicks "Continue with Google" button
2. Google popup opens for account selection
3. User selects Google account
4. Firebase handles authentication
5. User data is saved to Firestore
6. User is logged in

## 🛠️ Common Issues & Solutions

### Issue: "Module not found" errors
**Solution:** Make sure you're running the app from a local server, not opening the HTML file directly.

### Issue: Firebase errors in console
**Solution:** Check that you've replaced all placeholder values in `firebase-config.js` with your actual Firebase credentials.

### Issue: Google Sign In not working
**Solution:** 
1. Make sure Google provider is enabled in Firebase Console
2. Check that your domain is authorized in Firebase settings
3. For localhost, it should work by default

### Issue: CORS errors
**Solution:** Use a proper local server (http-server, Live Server, etc.) instead of file:// protocol.

## 📱 Testing the Auth Flow

### Test Email Sign Up
1. Click "Sign In" in navbar
2. Click "Sign up" link
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123456
4. Click "Sign Up"
5. You should see a success message and be logged in

### Test Google Sign In
1. Click "Sign In" in navbar
2. Click "Continue with Google"
3. Select your Google account
4. You should be logged in automatically

### Test Sign Out
1. Click on the user icon in navbar (appears after login)
2. Click "Sign Out" in the dropdown
3. You should be logged out and see the "Sign In" button again

## 🎨 Customization

### Change Colors
Edit `styles.css` variables:
```css
:root {
    --primary-500: hsl(200, 75%, 55%);  /* Change primary color */
    --success: hsl(150, 70%, 50%);      /* Change success color */
    --error: hsl(0, 85%, 60%);          /* Change error color */
}
```

### Modify Toast Duration
Edit `auth.js`:
```javascript
// Change from 3000 (3 seconds) to your preferred duration
setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}, 3000); // <-- Change this value
```

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)

## 🔒 Security Best Practices

1. **Never commit your firebase-config.js** with real credentials to public repositories
2. Set up **Firestore Security Rules** in production
3. Use **environment variables** for sensitive data in production
4. Enable **Email Verification** for better security
5. Implement **Password Reset** functionality for users

## 🎉 You're All Set!

Your Firebase Authentication system is now fully functional. Users can sign up, sign in, and enjoy a personalized experience on WanderNear!
