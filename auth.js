import { auth, googleProvider, db } from './firebase-config.js';
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');
const authModalOverlay = document.getElementById('authModalOverlay');
const loginBtn = document.getElementById('loginBtn');

// Form Elements
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authName = document.getElementById('authName');
const nameGroup = document.getElementById('nameGroup');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const rememberMeCheck = document.getElementById('rememberMeCheck');

// Toggle Elements
const authToggleLink = document.getElementById('authToggleLink');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authToggleText = document.getElementById('authToggleText');

// User Menu Elements
const userMenuDropdown = document.getElementById('userMenuDropdown');
const menuUserName = document.getElementById('menuUserName');
const menuUserEmail = document.getElementById('menuUserEmail');
const logoutBtn = document.getElementById('logoutBtn');

// State
let isSignUp = false;
let currentAuthUser = null; // Track current authenticated user

// ==========================================
// Initialization
// ==========================================

function initAuth() {
    console.log('🔧 Initializing Auth module...');
    setupEventListeners();
    checkAuthState();
    console.log('✅ Auth module initialized');
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
    // Modal Controls
    if (loginBtn) {
        loginBtn.addEventListener('click', openAuthModal);
    }

    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }

    if (authModalOverlay) {
        authModalOverlay.addEventListener('click', closeAuthModal);
    }

    // Toggle Sign In / Sign Up
    if (authToggleLink) {
        authToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }

    // Form Submission
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', handleAuthSubmit);
    }

    // Google Sign In
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ==========================================
// Auth Logic
// ==========================================

async function handleAuthSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const email = authEmail.value;
    const password = authPassword.value;

    try {
        if (isSignUp) {
            // Sign Up
            console.log('📝 Creating new user account...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ User account created:', user.uid);

            // Update Profile with Name
            if (authName.value) {
                await updateProfile(user, {
                    displayName: authName.value
                });
                console.log('✅ User profile updated with name');
            }

            // Create User Document in Firestore (CRITICAL FIX)
            await ensureUserDocument(user);

            showToast(`Welcome, ${user.displayName || 'Traveler'}!`, 'success');
        } else {
            // Sign In
            console.log('🔑 Signing in user...');

            // Handle Persistence
            const persistenceMode = rememberMeCheck && rememberMeCheck.checked ?
                browserLocalPersistence :
                browserSessionPersistence;

            await setPersistence(auth, persistenceMode);
            console.log(`💾 Persistence set to: ${persistenceMode === browserLocalPersistence ? 'LOCAL' : 'SESSION'}`);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ User signed in:', user.uid);

            // Ensure user document exists (CRITICAL FIX)
            await ensureUserDocument(user);

            showToast(`Welcome back, ${user.displayName || 'Traveler'}!`, 'success');
        }

        closeAuthModal();
        resetForm();

    } catch (error) {
        console.error("❌ Auth Error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        handleAuthError(error);
    } finally {
        setLoading(false);
    }
}

async function handleGoogleSignIn() {
    try {
        console.log('🔑 Signing in with Google...');

        // Handle Persistence
        const persistenceMode = rememberMeCheck && rememberMeCheck.checked ?
            browserLocalPersistence :
            browserSessionPersistence;

        await setPersistence(auth, persistenceMode);
        console.log(`💾 Persistence set to: ${persistenceMode === browserLocalPersistence ? 'LOCAL' : 'SESSION'}`);

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log('✅ Google sign-in successful:', user.uid);

        // Ensure user document exists (CRITICAL FIX)
        await ensureUserDocument(user);

        showToast(`Welcome, ${user.displayName}!`, 'success');
        closeAuthModal();

    } catch (error) {
        console.error("❌ Google Auth Error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        handleAuthError(error);
    }
}

async function handleLogout() {
    try {
        console.log('👋 Logging out user...');
        await signOut(auth);
        console.log('✅ User logged out successfully');
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error("❌ Logout Error:", error);
        showToast('Error logging out', 'error');
    }
}

// ==========================================
// Firestore Integration (CRITICAL FIX)
// ==========================================

/**
 * CRITICAL FIX: Ensure user document exists in Firestore
 * This is called on EVERY login (email/password or Google)
 * Uses merge: true to avoid overwriting existing data
 */
async function ensureUserDocument(user) {
    if (!user || !user.uid) {
        console.error('❌ Cannot create user document: user or uid is null');
        return;
    }

    const userRef = doc(db, "users", user.uid);

    try {
        console.log('📄 Ensuring user document exists for:', user.uid);

        // Check if document exists
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            console.log('✅ User document already exists, updating lastLogin');
            // Update last login only
            await setDoc(userRef, {
                lastLogin: serverTimestamp()
            }, { merge: true });
        } else {
            console.log('📝 Creating new user document in Firestore');
            // Create new document with full data
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
            console.log('✅ User document created successfully');
        }

    } catch (error) {
        console.error("❌ Error ensuring user document:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        // Still allow login even if Firestore write fails
        showToast('Warning: Could not save user data', 'warning');
    }
}

// ==========================================
// UI Helpers
// ==========================================

function toggleAuthMode() {
    isSignUp = !isSignUp;

    // Update UI elements
    if (isSignUp) {
        authTitle.textContent = "Create an Account";
        authSubtitle.textContent = "Start your journey with WanderNear";
        authSubmitBtn.querySelector('span').textContent = "Sign Up";
        authToggleText.innerHTML = 'Already have an account? <a href="#" id="authToggleLink">Sign In</a>';
        nameGroup.style.display = 'block';
        authName.setAttribute('required', 'true');
    } else {
        authTitle.textContent = "Welcome to WanderNear";
        authSubtitle.textContent = "Sign in to save favorites and make bookings";
        authSubmitBtn.querySelector('span').textContent = "Sign In";
        authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="authToggleLink">Sign up</a>';
        nameGroup.style.display = 'none';
        authName.removeAttribute('required');
    }

    // Re-attach listener to new link element
    const newLink = document.getElementById('authToggleLink');
    if (newLink) {
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
}

function openAuthModal() {
    authModal.classList.add('active');
    authModal.style.display = 'flex';
}

function closeAuthModal() {
    authModal.classList.remove('active');
    authModal.style.display = 'none';
    resetForm();
    // Reset to sign in mode
    if (isSignUp) toggleAuthMode();
}

function setLoading(isLoading) {
    const btnText = authSubmitBtn.querySelector('span');
    if (isLoading) {
        authSubmitBtn.classList.add('loading');
        authSubmitBtn.disabled = true;
        btnText.textContent = "Processing...";
    } else {
        authSubmitBtn.classList.remove('loading');
        authSubmitBtn.disabled = false;
        btnText.textContent = isSignUp ? "Sign Up" : "Sign In";
    }
}

function validateForm() {
    if (!authEmail.value || !authPassword.value) {
        showToast('Please fill in all fields', 'error');
        return false;
    }
    if (isSignUp && !authName.value) {
        showToast('Please enter your name', 'error');
        return false;
    }
    return true;
}

function resetForm() {
    if (authForm) {
        authForm.querySelectorAll('input').forEach(input => input.value = '');
    }
}

function handleAuthError(error) {
    let message = "An error occurred";
    switch (error.code) {
        case 'auth/invalid-email':
            message = "Invalid email address";
            break;
        case 'auth/user-disabled':
            message = "User account is disabled";
            break;
        case 'auth/user-not-found':
            message = "No account found with this email";
            break;
        case 'auth/wrong-password':
            message = "Incorrect password";
            break;
        case 'auth/email-already-in-use':
            message = "Email is already registered";
            break;
        case 'auth/weak-password':
            message = "Password should be at least 6 characters";
            break;
        case 'auth/popup-closed-by-user':
            message = "Sign in cancelled";
            break;
        default:
            message = error.message;
    }
    showToast(message, 'error');
}

// ==========================================
// Auth State Observer (CRITICAL FIX)
// ==========================================

/**
 * CRITICAL FIX: Single source of truth for auth state
 * This listener fires on:
 * - Page load
 * - Login
 * - Logout
 * - Auth token refresh
 */
function checkAuthState() {
    console.log('👁️ Setting up auth state observer...');

    onAuthStateChanged(auth, async (user) => {
        console.log('🔄 Auth state changed');

        if (user) {
            // User is signed in
            console.log('✅ User authenticated:', user.uid);
            console.log('📧 Email:', user.email);
            console.log('👤 Display name:', user.displayName);

            currentAuthUser = user;

            // Ensure user document exists (defensive programming)
            await ensureUserDocument(user);

            // Update UI
            updateUIForLogin(user);

            // Notify other modules that user is authenticated
            // This is critical for bookings module
            window.dispatchEvent(new CustomEvent('userAuthenticated', {
                detail: { user }
            }));

        } else {
            // User is signed out
            console.log('❌ No user authenticated');
            currentAuthUser = null;

            // Update UI
            updateUIForLogout();

            // Notify other modules
            window.dispatchEvent(new CustomEvent('userSignedOut'));
        }
    });
}

function updateUIForLogin(user) {
    console.log('🎨 Updating UI for logged-in user');
    if (loginBtn) loginBtn.style.display = 'none';
    createProfileButton(user);
}

function createProfileButton(user) {
    // Check if we already created it
    let profileBtn = document.getElementById('profileBtn');

    if (!profileBtn) {
        profileBtn = document.createElement('button');
        profileBtn.id = 'profileBtn';
        profileBtn.className = 'btn-icon';
        profileBtn.innerHTML = '<i class="fas fa-user"></i>';

        // Add to DOM
        if (loginBtn && loginBtn.parentNode) {
            loginBtn.parentNode.insertBefore(profileBtn, loginBtn);

            // Add click listener to toggle dropdown
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userMenuDropdown.classList.remove('active');
            });
            userMenuDropdown.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    profileBtn.style.display = 'inline-flex';

    // Update Menu Content
    if (menuUserName) menuUserName.textContent = user.displayName || 'Traveler';
    if (menuUserEmail) menuUserEmail.textContent = user.email;
}

function updateUIForLogout() {
    console.log('🎨 Updating UI for logged-out state');
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) profileBtn.style.display = 'none';
    if (userMenuDropdown) userMenuDropdown.classList.remove('active');
}

// ==========================================
// Toast Notification System
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Expose showToast globally for other scripts
window.showToast = showToast;

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// ==========================================
// Global Export for Auth User
// ==========================================

/**
 * CRITICAL: Export current user getter
 * Other modules should use this instead of auth.currentUser
 */
window.getCurrentAuthUser = function () {
    console.log('🔍 getCurrentAuthUser called, user:', currentAuthUser ? currentAuthUser.uid : 'null');
    return currentAuthUser;
};

// Initialize on load
initAuth();
