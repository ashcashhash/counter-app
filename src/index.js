// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';

// Firebase configuration will be injected by the build process
// instead of being hardcoded here
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const counterRef = ref(database, 'counter');

// DOM elements
const counterElement = document.getElementById('counter');
const incrementBtn = document.getElementById('incrementBtn');

// Update counter value from Firebase
onValue(counterRef, (snapshot) => {
  const currentCount = snapshot.val() || 0;
  counterElement.textContent = formatNumber(currentCount);
});

// Increment counter
incrementBtn.addEventListener('click', () => {
  // Create YouTube-style count animation
  counterElement.classList.add('counter-animation');
  setTimeout(() => {
    counterElement.classList.remove('counter-animation');
  }, 500);
  
  // Get current count
  get(counterRef).then((snapshot) => {
    const currentCount = snapshot.val() || 0;
    
    // Increment counter in Firebase
    set(counterRef, currentCount + 1);
  });
});

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}