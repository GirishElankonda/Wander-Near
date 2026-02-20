/**
 * WanderNear Bookings System - FULLY DEBUGGED VERSION
 * 
 * CRITICAL: This version uses a cached currentUser variable
 * and never relies on auth.currentUser in async handlers
 */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================================
// GLOBAL STATE - SINGLE SOURCE OF TRUTH
// ============================================================================

let currentUser = null; // CRITICAL: Cached user object from onAuthStateChanged
let userBookings = [];
let bookedPlaceIds = new Set();
let isInitialized = false;

console.log('📚 Bookings module loading...');

// ============================================================================
// INITIALIZATION
// ============================================================================

function initBookings() {
    console.log('🔧 [BOOKINGS] Initializing bookings module...');

    // CRITICAL: onAuthStateChanged is the ONLY reliable way to track auth state
    onAuthStateChanged(auth, async (user) => {
        console.log('═══════════════════════════════════════════════════');
        console.log('🔄 [AUTH STATE CHANGED]');
        console.log('Timestamp:', new Date().toISOString());

        if (user) {
            console.log('✅ User IS authenticated');
            console.log('├─ UID:', user.uid);
            console.log('├─ Email:', user.email);
            console.log('├─ Display Name:', user.displayName);
            console.log('└─ Email Verified:', user.emailVerified);

            // CRITICAL: Store user in global variable
            currentUser = user;

            // Ensure user document exists in Firestore
            await ensureUserDocumentExists(user);

            // Load user's bookings
            await loadUserBookings(user.uid);

            // Update UI
            updateBookingButtons();

            console.log('✅ [AUTH STATE] User setup complete');

        } else {
            console.log('❌ User NOT authenticated (logged out)');

            // CRITICAL: Clear user from global variable
            currentUser = null;
            userBookings = [];
            bookedPlaceIds.clear();

            // Update UI
            updateBookingsUI();
            updateBookingButtons();

            console.log('✅ [AUTH STATE] Logout cleanup complete');
        }

        isInitialized = true;
        console.log('═══════════════════════════════════════════════════');
    });

    // Setup navigation
    setupBookingsNavigation();

    console.log('✅ [BOOKINGS] Initialization complete');
}

// ============================================================================
// USER DOCUMENT MANAGEMENT
// ============================================================================

/**
 * CRITICAL: Ensure user document exists in Firestore
 * This prevents permission denied errors when creating bookings
 */
async function ensureUserDocumentExists(user) {
    console.log('📄 [USER DOC] Checking user document...');
    console.log('├─ Path: users/' + user.uid);

    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            console.log('✅ [USER DOC] Document already exists');
            console.log('└─ Updating lastLogin...');

            await setDoc(userRef, {
                lastLogin: serverTimestamp()
            }, { merge: true });

            console.log('✅ [USER DOC] lastLogin updated');

        } else {
            console.log('⚠️  [USER DOC] Document does NOT exist, creating...');

            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            console.log('✅ [USER DOC] Document created successfully');
        }

    } catch (error) {
        console.error('❌ [USER DOC ERROR]');
        console.error('├─ Code:', error.code);
        console.error('├─ Message:', error.message);
        console.error('└─ Full error:', error);
        throw error;
    }
}

// ============================================================================
// BOOKING OPERATIONS
// ============================================================================

/**
 * Add a booking - MAIN FUNCTION
 * CRITICAL: Uses cached currentUser, never auth.currentUser
 */
async function addBooking(place) {
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 [ADD BOOKING] Function called');
    console.log('├─ Place:', place?.name || 'UNDEFINED');
    console.log('├─ Place ID:', place?.id || 'UNDEFINED');
    console.log('└─ Timestamp:', new Date().toISOString());

    // CRITICAL CHECK 1: Is module initialized?
    if (!isInitialized) {
        console.warn('⚠️  [ADD BOOKING] Module not initialized yet, waiting...');
        showToast('Please wait, initializing...', 'warning');
        return;
    }

    // CRITICAL CHECK 2: Is user authenticated?
    console.log('🔍 [AUTH CHECK] Checking authentication...');
    console.log('├─ currentUser:', currentUser ? currentUser.uid : 'NULL');
    console.log('└─ auth.currentUser:', auth.currentUser ? auth.currentUser.uid : 'NULL');

    if (!currentUser) {
        console.log('❌ [AUTH CHECK] User NOT authenticated');
        console.log('└─ Showing login modal...');
        promptSignIn();
        return;
    }

    console.log('✅ [AUTH CHECK] User IS authenticated');
    console.log('└─ UID:', currentUser.uid);

    // CRITICAL CHECK 3: Is place data valid?
    if (!place || !place.id) {
        console.error('❌ [VALIDATION] Invalid place data');
        console.error('└─ Place object:', place);
        showToast('Invalid place data', 'error');
        return;
    }

    console.log('✅ [VALIDATION] Place data valid');

    // CRITICAL CHECK 4: Is place already booked?
    if (isPlaceBooked(place.id)) {
        console.log('⚠️  [DUPLICATE] Place already booked');
        console.log('└─ Place ID:', place.id);
        showToast('You have already booked this place', 'warning');
        return;
    }

    console.log('✅ [DUPLICATE] Not already booked');

    try {
        // CRITICAL: Build booking data
        const bookingData = {
            placeId: place.id,
            name: place.name,
            category: place.category || 'attraction',
            address: place.address || 'Address not available',
            lat: place.lat || null,
            lng: place.lng || null,
            rating: place.rating || null,
            photo: place.photo || null,
            bookedAt: serverTimestamp(),
            userId: currentUser.uid
        };

        console.log('📦 [BOOKING DATA] Prepared:');
        console.log(JSON.stringify(bookingData, null, 2));

        // CRITICAL: Firestore write
        const bookingsPath = `users/${currentUser.uid}/bookings`;
        console.log('💾 [FIRESTORE] Writing to path:', bookingsPath);

        const bookingsRef = collection(db, 'users', currentUser.uid, 'bookings');
        const docRef = await addDoc(bookingsRef, bookingData);

        console.log('✅ [FIRESTORE] Write successful!');
        console.log('├─ Document ID:', docRef.id);
        console.log('└─ Full path:', `${bookingsPath}/${docRef.id}`);

        // Update local cache
        userBookings.push({ id: docRef.id, ...bookingData });
        bookedPlaceIds.add(place.id);

        console.log('✅ [CACHE] Updated local cache');
        console.log('├─ Total bookings:', userBookings.length);
        console.log('└─ Booked IDs:', Array.from(bookedPlaceIds));

        // Update UI
        updateBookingButtons();

        // Show success
        showToast(`${place.name} added to your bookings!`, 'success');

        console.log('✅ [ADD BOOKING] SUCCESS - Complete!');
        console.log('═══════════════════════════════════════════════════');

    } catch (error) {
        console.error('═══════════════════════════════════════════════════');
        console.error('❌ [FIRESTORE ERROR] Booking failed');
        console.error('├─ Error code:', error.code);
        console.error('├─ Error message:', error.message);
        console.error('├─ Error name:', error.name);
        console.error('└─ Full error:', error);
        console.error('═══════════════════════════════════════════════════');

        // Show specific error message
        if (error.code === 'permission-denied') {
            console.error('🚫 PERMISSION DENIED - Firestore rules issue!');
            showToast('Permission denied. Check Firestore rules.', 'error');
        } else if (error.code === 'unavailable') {
            showToast('Network error. Check internet connection.', 'error');
        } else {
            showToast(`Booking failed: ${error.message}`, 'error');
        }
    }
}

/**
 * Remove a booking
 */
async function removeBooking(bookingId) {
    console.log('═══════════════════════════════════════════════════');
    console.log('🗑️  [REMOVE BOOKING] Function called');
    console.log('└─ Booking ID:', bookingId);

    if (!currentUser) {
        console.error('❌ [REMOVE] User not authenticated');
        showToast('You must be signed in', 'error');
        return;
    }

    try {
        const bookingPath = `users/${currentUser.uid}/bookings/${bookingId}`;
        console.log('💾 [FIRESTORE] Deleting from:', bookingPath);

        const bookingRef = doc(db, 'users', currentUser.uid, 'bookings', bookingId);
        await deleteDoc(bookingRef);

        console.log('✅ [FIRESTORE] Delete successful');

        // Update local cache
        const booking = userBookings.find(b => b.id === bookingId);
        if (booking) {
            bookedPlaceIds.delete(booking.placeId);
            userBookings = userBookings.filter(b => b.id !== bookingId);
            console.log('✅ [CACHE] Updated');
        }

        // Update UI
        updateBookingsUI();
        updateBookingButtons();

        showToast('Booking removed', 'success');
        console.log('✅ [REMOVE BOOKING] SUCCESS');
        console.log('═══════════════════════════════════════════════════');

    } catch (error) {
        console.error('❌ [REMOVE ERROR]');
        console.error('├─ Code:', error.code);
        console.error('├─ Message:', error.message);
        console.error('└─ Full:', error);
        showToast(`Failed to remove: ${error.message}`, 'error');
    }
}

/**
 * Check if place is already booked
 */
function isPlaceBooked(placeId) {
    const isBooked = bookedPlaceIds.has(placeId);
    console.log(`🔍 [CHECK] Place ${placeId} booked:`, isBooked);
    return isBooked;
}

// ============================================================================
// FIRESTORE OPERATIONS
// ============================================================================

/**
 * Load user's bookings from Firestore
 * CRITICAL: Only called when currentUser is set
 */
async function loadUserBookings(userId) {
    console.log('📥 [LOAD BOOKINGS] Starting...');
    console.log('└─ User ID:', userId);

    try {
        const bookingsPath = `users/${userId}/bookings`;
        console.log('💾 [FIRESTORE] Querying:', bookingsPath);

        const bookingsRef = collection(db, 'users', userId, 'bookings');
        const q = query(bookingsRef, orderBy('bookedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        console.log('✅ [FIRESTORE] Query successful');
        console.log('└─ Documents found:', querySnapshot.size);

        // Clear existing
        userBookings = [];
        bookedPlaceIds.clear();

        // Process each booking
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📄 Booking:', doc.id, '-', data.name);

            userBookings.push({
                id: doc.id,
                ...data
            });
            bookedPlaceIds.add(data.placeId);
        });

        console.log('✅ [LOAD BOOKINGS] Complete');
        console.log('├─ Total loaded:', userBookings.length);
        console.log('└─ Booked IDs:', Array.from(bookedPlaceIds));

        // Update UI
        updateBookingsUI();

    } catch (error) {
        console.error('❌ [LOAD ERROR]');
        console.error('├─ Code:', error.code);
        console.error('├─ Message:', error.message);
        console.error('└─ Full:', error);

        if (error.code === 'permission-denied') {
            console.error('🚫 Cannot read bookings - permission denied');
        }
    }
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateBookingsUI() {
    console.log('🎨 [UI] Updating bookings display');

    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) {
        console.warn('⚠️  [UI] bookingsList element not found');
        return;
    }

    bookingsList.innerHTML = '';

    if (userBookings.length === 0) {
        console.log('└─ No bookings, showing empty state');
        bookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Bookings Yet</h3>
                <p>${currentUser ? 'Start exploring and book your first experience!' : 'Sign in to view your bookings'}</p>
                <button class="btn-primary" onclick="document.getElementById('explore')?.scrollIntoView({behavior: 'smooth'})">
                    Explore Places
                </button>
            </div>
        `;
        return;
    }

    console.log('└─ Creating', userBookings.length, 'booking cards');
    userBookings.forEach(booking => {
        const card = createBookingCard(booking);
        bookingsList.appendChild(card);
    });
}

function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = 'booking-card';

    const bookedDate = booking.bookedAt?.toDate ?
        booking.bookedAt.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Recently';

    const icon = getCategoryIcon(booking.category);

    card.innerHTML = `
        <div class="booking-card-header">
            <div class="booking-icon">${icon}</div>
            <div class="booking-info">
                <h3 class="booking-name">${booking.name}</h3>
                <p class="booking-category">${formatCategory(booking.category)}</p>
            </div>
        </div>
        <div class="booking-card-body">
            <div class="booking-detail">
                <i class="fas fa-map-marker-alt"></i>
                <span>${booking.address}</span>
            </div>
            <div class="booking-detail">
                <i class="fas fa-calendar"></i>
                <span>Booked on ${bookedDate}</span>
            </div>
            ${booking.rating ? `
                <div class="booking-detail">
                    <i class="fas fa-star" style="color: #fbbf24;"></i>
                    <span>${booking.rating} / 5</span>
                </div>
            ` : ''}
        </div>
        <div class="booking-card-actions">
            <button class="btn-outline btn-small" onclick="viewPlaceDetails(${booking.placeId})">
                <i class="fas fa-info-circle"></i>
                View Details
            </button>
            <button class="btn-danger btn-small" onclick="BookingsModule.removeBooking('${booking.id}')">
                <i class="fas fa-trash"></i>
                Remove
            </button>
        </div>
    `;

    return card;
}

function updateBookingButtons() {
    console.log('🔘 [BUTTONS] Updating booking buttons');

    const bookButtons = document.querySelectorAll('[data-place-id]');
    console.log('└─ Found', bookButtons.length, 'buttons');

    bookButtons.forEach(button => {
        const placeId = parseInt(button.dataset.placeId);

        if (isPlaceBooked(placeId)) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Booked';
            button.classList.add('booked');
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-calendar-plus"></i> Book';
            button.classList.remove('booked');
        }
    });
}

// ============================================================================
// NAVIGATION
// ============================================================================

function setupBookingsNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === '#bookings') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showBookingsSection();
            });
        } else {
            link.addEventListener('click', () => {
                hideBookingsSection();
            });
        }
    });
}

function showBookingsSection() {
    console.log('📖 [NAV] Showing bookings section');

    if (!currentUser) {
        console.log('└─ User not authenticated, prompting login');
        promptSignIn();
        return;
    }

    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        if (section.id !== 'bookings') {
            section.style.display = 'none';
        }
    });

    // Show bookings section
    const bookingsSection = document.getElementById('bookings');
    if (bookingsSection) {
        bookingsSection.style.display = 'block';

        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#bookings') {
                link.classList.add('active');
            }
        });

        // Refresh bookings
        if (currentUser) {
            loadUserBookings(currentUser.uid);
        }
    }
}

function hideBookingsSection() {
    const bookingsSection = document.getElementById('bookings');
    if (bookingsSection) {
        bookingsSection.style.display = 'none';
    }
}

function promptSignIn() {
    console.log('🔑 [AUTH] Prompting sign in');

    const authModal = document.getElementById('authModal');
    const authSubtitle = document.getElementById('authSubtitle');

    if (authModal) {
        if (authSubtitle) {
            authSubtitle.textContent = 'Please sign in to book experiences';
        }
        authModal.classList.add('active');
        authModal.style.display = 'flex';
        showToast('Please sign in to book experiences', 'info');
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCategoryIcon(category) {
    const icons = {
        'restaurant': '🍽️',
        'cafe': '☕',
        'lodging': '🏨',
        'hotel': '🏨',
        'museum': '🏛️',
        'tourist_attraction': '🎯',
        'attraction': '🎯',
        'park': '🌳'
    };
    return icons[category] || '📍';
}

function formatCategory(category) {
    const names = {
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'lodging': 'Hotel',
        'hotel': 'Hotel',
        'museum': 'Museum',
        'tourist_attraction': 'Attraction',
        'attraction': 'Attraction',
        'park': 'Park'
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function viewPlaceDetails(placeId) {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
    showToast('Place details feature coming soon', 'info');
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.BookingsModule = {
    addBooking,
    removeBooking,
    isPlaceBooked,
    showBookingsSection,

    // Debug helpers
    getCurrentUser: () => currentUser,
    getBookings: () => userBookings,
    getBookedIds: () => Array.from(bookedPlaceIds)
};

// ============================================================================
// INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookings);
} else {
    initBookings();
}

console.log('✅ Bookings module script loaded');
