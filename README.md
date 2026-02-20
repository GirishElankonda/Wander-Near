# 🗺️ WanderNear - Premium Travel Companion App

A beautiful, feature-rich web application that helps users discover and book amazing local experiences while traveling. Built with HTML, CSS, JavaScript, Firebase, and Google Maps API.

![WanderNear](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🔍 Smart Discovery
- **Google Maps Integration**: Interactive map with custom markers and info windows
- **Location-based Search**: Automatically finds places near your current location
- **Category Filters**: Filter by restaurants, attractions, hotels, cafes, museums, and more
- **Real-time Results**: Live search with Google Places API

### 👤 User Authentication
- **Firebase Authentication**: Secure email/password and Google OAuth sign-in
- **User Profiles**: Personalized experience with user data persistence
- **Session Management**: Automatic login state detection

### 📅 Booking System
- **Easy Reservations**: Book restaurants, hotels, and experiences
- **Booking Management**: View and manage all your bookings
- **Firestore Database**: Secure cloud storage for all bookings

### ❤️ Favorites
- **Save Places**: Add places to your favorites for quick access
- **Sync Across Devices**: Favorites stored in Firestore
- **Quick Actions**: One-click favorite toggle

### 🎨 Premium Design
- **Glassmorphism UI**: Modern glass-effect design elements
- **Smooth Animations**: Micro-interactions and transitions
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Perfect on desktop, tablet, and mobile

### 🚀 Performance
- **Fast Loading**: Optimized assets and lazy loading
- **Progressive Enhancement**: Works even with limited API access
- **Offline Support**: Graceful degradation when offline

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore)
- **APIs**: Google Maps JavaScript API, Google Places API
- **Fonts**: Google Fonts (Inter, Outfit)
- **Icons**: Font Awesome 6

## 📋 Prerequisites

Before you begin, ensure you have:

1. A modern web browser (Chrome, Firefox, Safari, Edge)
2. A Firebase account ([firebase.google.com](https://firebase.google.com))
3. A Google Cloud Platform account with Maps API enabled
4. A local web server (e.g., Live Server for VS Code, Python's http.server, or Node.js http-server)

## 🚀 Setup Instructions

### Step 1: Clone or Download

Download this project to your local machine.

### Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup wizard
3. Once created, click "Web" (</>) to add a web app
4. Copy the Firebase configuration object
5. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" sign-in
6. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in "Test mode" (for development)
   - Choose your region

### Step 3: Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key):
   - Go to Credentials > Create Credentials > API Key
   - Restrict the API key (recommended):
     - Application restrictions: HTTP referrers
     - API restrictions: Select the enabled APIs
5. Copy your API key

### Step 4: Configure the App

1. Open `config.js`
2. Replace the Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

3. Open `index.html`
4. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMap" async defer></script>
```

### Step 5: Run the App

#### Option 1: Using VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 2: Using Python
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

#### Option 3: Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server

# Then open http://localhost:8080 in your browser
```

## 📱 Usage Guide

### Getting Started

1. **Allow Location Access**: When prompted, allow the app to access your location for personalized results
2. **Sign In**: Click "Sign In" to create an account or log in with Google
3. **Explore**: Browse nearby places or use the search bar to find specific locations

### Searching for Places

1. Use the search bar to enter a location
2. Click the filter chips to narrow results by category
3. Toggle between grid and map views using the view switcher

### Making a Booking

1. Click on a place card to view details
2. Click "Book" button
3. Fill in the booking form (date, time, guests, notes)
4. Click "Confirm Booking"

### Managing Favorites

1. Click the heart icon on any place card
2. View all favorites in the "Favorites" section
3. Click again to remove from favorites

### Viewing Bookings

1. Navigate to "My Bookings" in the menu
2. View all your upcoming reservations
3. Cancel bookings if needed

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-500: hsl(200, 75%, 55%);
    --accent-orange: hsl(25, 95%, 60%);
    /* ... more colors */
}
```

### Modifying Search Radius

Edit `config.js`:

```javascript
const APP_CONFIG = {
    searchRadius: 5000, // Change to desired radius in meters
    maxResults: 20      // Maximum number of results
};
```

### Adding New Categories

1. Add a new filter chip in `index.html`
2. Add the corresponding icon and label
3. The app will automatically handle the filtering

## 🔒 Security Best Practices

### For Production:

1. **Restrict API Keys**:
   - Add HTTP referrer restrictions to your Google Maps API key
   - Limit Firebase API key to your domain

2. **Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{booking} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /favorites/{favorite} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. **Enable Firebase App Check** for additional security

## 📊 Firestore Data Structure

### Bookings Collection
```javascript
{
  placeId: "string",
  placeName: "string",
  userId: "string",
  date: "YYYY-MM-DD",
  time: "HH:MM",
  guests: number,
  notes: "string",
  status: "confirmed" | "cancelled",
  createdAt: "ISO timestamp"
}
```

### Favorites Collection
```javascript
{
  placeId: "string",
  placeName: "string",
  userId: "string",
  createdAt: "ISO timestamp"
}
```

## 🐛 Troubleshooting

### Maps not loading?
- Check if your Google Maps API key is correct
- Ensure Maps JavaScript API and Places API are enabled
- Check browser console for errors

### Authentication not working?
- Verify Firebase configuration in `config.js`
- Check if authentication methods are enabled in Firebase Console
- Clear browser cache and cookies

### Location not detected?
- Ensure you've allowed location permissions in your browser
- Try using HTTPS (required for geolocation in some browsers)
- Check if location services are enabled on your device

### No places showing?
- Verify your location is being detected
- Check if Places API is enabled and has quota
- Look for errors in the browser console

## 🚀 Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init hosting
```

4. Deploy:
```bash
firebase deploy
```

### Deploy to Netlify

1. Create a `netlify.toml` file:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Drag and drop your folder to [Netlify](https://app.netlify.com/)

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

## 📈 Future Enhancements

- [ ] Trip planning and itinerary builder
- [ ] Social features (share trips, follow friends)
- [ ] Reviews and ratings system
- [ ] Photo uploads
- [ ] Multi-language support
- [ ] Push notifications for booking reminders
- [ ] Integration with booking platforms (OpenTable, Booking.com)
- [ ] Offline mode with service workers
- [ ] AR features for navigation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Built with ❤️ by a senior full-stack developer

## 🙏 Acknowledgments

- Google Maps Platform for location services
- Firebase for backend infrastructure
- Font Awesome for beautiful icons
- Google Fonts for typography

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the browser console for errors
3. Ensure all API keys are correctly configured
4. Verify Firebase and Google Cloud Platform settings

---

**Happy Traveling! 🌍✈️**
