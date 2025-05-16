// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, serverTimestamp } from 'firebase/database';

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
const counterValueSpan = counterElement.querySelector('span');
const incrementBtn = document.getElementById('incrementBtn');

// Start with the loader showing and button disabled
counterElement.classList.add('loading');
incrementBtn.disabled = true;

// Update counter value from Firebase
onValue(counterRef, (snapshot) => {
  // Data is loaded, remove loading state
  counterElement.classList.remove('loading');
  incrementBtn.disabled = false;
  
  const currentCount = snapshot.val() || 0;
  counterValueSpan.textContent = formatNumber(currentCount);
}, (error) => {
  // Handle errors
  console.error('Error fetching counter value:', error);
  counterElement.classList.remove('loading');
  counterValueSpan.textContent = 'Error';
});

// Increment counter with transaction for handling concurrency
incrementBtn.addEventListener('click', () => {
  // Disable the button during transaction to prevent multiple clicks
  incrementBtn.disabled = true;
  
  // Create YouTube-style count animation
  counterElement.classList.add('counter-animation');
  setTimeout(() => {
    counterElement.classList.remove('counter-animation');
  }, 500);
  
  // Use a transaction to safely increment the counter
  // This handles multiple users incrementing at the same time
  runTransaction(counterRef, (currentValue) => {
    // If the counter doesn't exist yet, start at 1
    // Otherwise increment the existing value
    return (currentValue || 0) + 1;
  }).then((result) => {
    // Re-enable the button after transaction completes
    incrementBtn.disabled = false;
    
    if (result.committed) {
      console.log('Transaction completed successfully!');
      // Optional: log the user's increment with a timestamp
      const logsRef = ref(database, `logs/${Date.now()}`);
      const logData = {
        timestamp: serverTimestamp(),
        newCount: result.snapshot.val()
      };
      // You could save who incremented with user auth info here too
      runTransaction(logsRef, () => logData);
    } else {
      console.log('Transaction aborted');
    }
  }).catch((error) => {
    console.error('Transaction failed:', error);
    // Re-enable the button if there's an error
    incrementBtn.disabled = false;
  });
});

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}