# 🚀 Quick Setup Guide for WanderNear

## Step-by-Step Setup (5 minutes)

### 1. Firebase Setup

#### Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter project name: `wandernear` (or your choice)
4. Disable Google Analytics (optional for development)
5. Click **"Create Project"**

#### Get Firebase Configuration
1. In Firebase Console, click the **Web icon** (</>)
2. Register app name: `WanderNear`
3. Copy the `firebaseConfig` object
4. Open `config.js` and replace the configuration

#### Enable Authentication
1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get Started"**
3. Click **"Sign-in method"** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
5. Enable **Google**:
   - Click on "Google"
   - Toggle "Enable"
   - Enter support email
   - Click "Save"

#### Setup Firestore Database
1. In Firebase Console, go to **Build > Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose your region (closest to your users)
5. Click **"Enable"**

### 2. Google Maps API Setup

#### Enable APIs
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services > Library**
4. Search and enable:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

#### Create API Key
1. Go to **APIs & Services > Credentials**
2. Click **"Create Credentials" > "API Key"**
3. Copy the API key
4. Click **"Edit API key"** (recommended for security):
   - Under "Application restrictions":
     - Select "HTTP referrers"
     - Add: `http://localhost:*` (for development)
     - Add your production domain later
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose: Maps JavaScript API, Places API, Geocoding API
   - Click **"Save"**

#### Add API Key to Project
1. Open `index.html`
2. Find line with Google Maps script (near bottom)
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_KEY_HERE&libraries=places&callback=initMap" async defer></script>
```

### 3. Run the Application

#### Option A: VS Code Live Server (Recommended)
1. Install **Live Server** extension in VS Code
2. Right-click `index.html`
3. Select **"Open with Live Server"**
4. App opens at `http://localhost:5500`

#### Option B: Python HTTP Server
```bash
# Navigate to project directory
cd WanderNear

# Python 3
python -m http.server 8000

# Open browser to http://localhost:8000
```

#### Option C: Node.js HTTP Server
```bash
# Install globally (one time)
npm install -g http-server

# Run server
http-server

# Open browser to http://localhost:8080
```

### 4. Test the Application

1. **Allow Location Access**: Click "Allow" when browser asks for location
2. **Sign Up**: Click "Sign In" > "Sign up" and create an account
3. **Search Places**: App should automatically show nearby places
4. **Test Features**:
   - Click on a place card to view details
   - Click heart icon to add to favorites
   - Click "Book" to make a reservation
   - Toggle between grid and map views
   - Try dark mode toggle

## 🔧 Troubleshooting

### Maps Not Loading?
**Problem**: Blank map or "For development purposes only" watermark

**Solutions**:
- ✅ Verify API key is correct in `index.html`
- ✅ Check that Maps JavaScript API is enabled
- ✅ Check browser console for errors
- ✅ Ensure you're running on a local server (not file://)
- ✅ Add billing account to Google Cloud (required for production)

### Authentication Errors?
**Problem**: Can't sign in or sign up

**Solutions**:
- ✅ Verify Firebase config in `config.js` is correct
- ✅ Check that Email/Password is enabled in Firebase Console
- ✅ Clear browser cache and cookies
- ✅ Check browser console for specific error messages

### No Places Showing?
**Problem**: Empty grid or "No places found"

**Solutions**:
- ✅ Allow location access in browser
- ✅ Verify Places API is enabled
- ✅ Check API key has Places API restriction
- ✅ Try entering a location manually in search bar
- ✅ Check browser console for API errors

### CORS Errors?
**Problem**: Cross-origin request blocked

**Solutions**:
- ✅ Must run on local server (not file://)
- ✅ Use Live Server, Python server, or Node server
- ✅ Don't open HTML file directly in browser

## 📊 Firebase Security Rules (Production)

Before deploying to production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookings - users can only read/write their own
    match /bookings/{booking} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Favorites - users can only read/write their own
    match /favorites/{favorite} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🔒 API Key Security (Production)

### Restrict Google Maps API Key
1. Go to Google Cloud Console > Credentials
2. Edit your API key
3. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add your production domain: `https://yourdomain.com/*`
   - Remove `localhost` entries
4. Under "API restrictions":
   - Keep only: Maps JavaScript API, Places API, Geocoding API

### Restrict Firebase API Key
1. Go to Firebase Console > Project Settings
2. Under "Your apps", find your web app
3. Click "Config" to view settings
4. In Google Cloud Console, restrict the API key to your domain

## 🚀 Deployment Options

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting
# Select: Use existing project
# Public directory: . (current directory)
# Single-page app: Yes
# Overwrite index.html: No

# Deploy
firebase deploy --only hosting
```

### Deploy to Netlify

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop your `WanderNear` folder
3. Or connect GitHub repository
4. Site deploys automatically

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
```

## 📝 Configuration Checklist

Before going live, ensure:

- [ ] Firebase configuration is correct
- [ ] Google Maps API key is added
- [ ] All APIs are enabled (Maps, Places, Geocoding)
- [ ] Authentication methods are enabled
- [ ] Firestore database is created
- [ ] Security rules are updated for production
- [ ] API keys are restricted to your domain
- [ ] Billing is enabled on Google Cloud (for production)
- [ ] Test all features (auth, search, booking, favorites)
- [ ] Test on mobile devices
- [ ] Test in different browsers

## 🎯 Next Steps

1. **Customize Branding**: Update colors in `styles.css`
2. **Add Content**: Customize text and images
3. **Enhance Features**: Add more categories, filters
4. **Analytics**: Add Google Analytics or Firebase Analytics
5. **SEO**: Update meta tags for better search visibility
6. **Performance**: Optimize images, enable caching
7. **Testing**: Test on various devices and browsers

## 💡 Tips

- **Development**: Use test mode for Firestore during development
- **API Costs**: Monitor Google Maps API usage in Cloud Console
- **Firebase Limits**: Free tier has limits on reads/writes
- **Caching**: Implement caching for API responses to reduce costs
- **Error Handling**: Check browser console for detailed errors

## 📞 Need Help?

- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Google Maps Docs**: [developers.google.com/maps](https://developers.google.com/maps)
- **Browser Console**: Press F12 to see detailed errors

---

**You're all set! Happy coding! 🎉**
