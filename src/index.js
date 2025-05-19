// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, serverTimestamp, set } from 'firebase/database';

// Lightweight confetti animation function
function createConfetti() {
  // Create a canvas element for the confetti
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);

  // Set canvas dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Confetti settings
  const particleCount = 100;
  const gravity = 0.5;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const particles = [];
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 5 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 2 * Math.PI,
      speed: Math.random() * 1 + 2,
      rotationSpeed: Math.random() * 0.2 - 0.1,
      velocityY: Math.random() * 1 + 1,
      velocityX: Math.random() * 4 - 2
    });
  }
  
  // Animation loop
  let animationFrame;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let stillActive = false;
    
    particles.forEach(particle => {
      // Update particle position
      particle.y += particle.velocityY;
      particle.x += particle.velocityX;
      particle.velocityY += gravity;
      particle.rotation += particle.rotationSpeed;
      
      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
      
      // Check if particle is still on screen
      if (particle.y < canvas.height) {
        stillActive = true;
      }
    });
    
    // Continue animation if particles are still on screen
    if (stillActive) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // Clean up when animation is done
      document.body.removeChild(canvas);
    }
  };
  
  // Start animation
  animationFrame = requestAnimationFrame(animate);
  
  // Safety timeout to ensure cleanup after 5 seconds
  setTimeout(() => {
    if (canvas.parentNode) {
      cancelAnimationFrame(animationFrame);
      document.body.removeChild(canvas);
    }
  }, 5000);
}

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
const usageLogsRef = ref(database, 'usageLogs');

// DOM elements
const counterElement = document.getElementById('counter');
const counterValueSpan = counterElement.querySelector('span');
const incrementBtn = document.getElementById('incrementBtn');

// Start with the loader showing and button disabled
counterElement.classList.add('loading');
incrementBtn.disabled = true;

// Track click count in this session (max 5 per day)
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const clickCountKey = `clickCount_${today}`;
let clickCount = parseInt(localStorage.getItem(clickCountKey) || '0');

// Update button state based on remaining clicks
function updateButtonState() {
  if (clickCount >= 5) {
    incrementBtn.innerText = 'Daily Limit Reached (5/5)';
    incrementBtn.disabled = true;
  } else {
    incrementBtn.innerText = `I Generated a Component (${clickCount}/5)`;
    incrementBtn.disabled = false;
  }
}

// Call on initial load
updateButtonState();

// Update counter value from Firebase
onValue(counterRef, (snapshot) => {
  // Data is loaded, remove loading state and show the counter value
  if (counterElement.classList.contains('loading')) {
    console.log('Removing loading class');
    counterElement.classList.remove('loading');
    // Make sure the loader is hidden and counter value is visible
    const loader = counterElement.querySelector('.loader');
    if (loader) {
      loader.style.display = 'none';
    }
    counterValueSpan.style.display = 'inline';
  }
  
  // Apply click limit but don't disable button until data loads
  updateButtonState();
  
  const currentCount = snapshot.val() || 0;
  counterValueSpan.textContent = formatNumber(currentCount);
  
  // Log to verify data is being received
  console.log('Firebase data loaded:', currentCount);
}, (error) => {
  // Handle errors
  console.error('Error fetching counter value:', error);
  counterElement.classList.remove('loading');
  const loader = counterElement.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }
  counterValueSpan.style.display = 'inline';
  counterValueSpan.textContent = 'Error';
});

// Increment counter with transaction for handling concurrency
incrementBtn.addEventListener('click', () => {
  // Check daily limit again (in case multiple tabs are open)
  if (clickCount >= 5) {
    alert('You\'ve reached your daily limit of 5 components. Please come back tomorrow!');
    updateButtonState();
    return;
  }
  
  // Ask for confirmation with specific information about what should be counted
  if (!confirm('Did you just generate and implement a component with Claude?\n\nPlease only click if you ACTUALLY created a component, not just for using Claude in general.\n\nThis counter helps our team track Claude\'s effectiveness for component generation.')) {
    return; // User cancelled, don't increment
  }
  
  // Get user details
  const projectName = prompt('Please enter the project name this component is for:', '');
  if (!projectName || projectName.trim() === '') {
    alert('You need to provide the project name to increment the counter.');
    return;
  }
  
  // Ask for what component they created for verification
  const componentName = prompt('Please briefly describe the component you created (e.g., "Navigation bar", "Modal dialog"):', '');
  if (!componentName || componentName.trim() === '') {
    alert('You need to describe the component to increment the counter.');
    return;
  }
  
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
    if (result.committed) {
      console.log('Transaction completed successfully!');
      
      // Increment the daily click count and update storage
      clickCount++;
      localStorage.setItem(clickCountKey, clickCount.toString());
      updateButtonState();
      
// Log the user's increment with a timestamp AND the user and component details
      const timestamp = Date.now();
      const logRef = ref(database, `usageLogs/${timestamp}`);
      
      // Define the log data
      const logData = {
        timestamp: serverTimestamp(),
        newCount: result.snapshot.val(),
        projectName: projectName,
        componentName: componentName,
        date: today
      };
      
      try {
        // Store the detailed log in Firebase
        // Using set() instead of runTransaction() for logs
        set(logRef, logData)
          .then(() => {
            // Launch confetti celebration
            createConfetti();
            
            // Thank the user
            alert(`Thank you! Your component "${componentName}" for project "${projectName}" has been counted.\n\nYou have ${5 - clickCount} entries remaining today.`);
          })
          .catch(error => {
            console.error('Error saving log with set():', error);
            alert(`Thank you ${userName}! Your count was registered, but we couldn't save your details. Please inform the admin. Error: ${error.message}`);
          });
      } catch (e) {
        console.error('Error in log creation:', e);
        alert(`Thank you ${userName}! Your count was registered, but we couldn't save your details. Please inform the admin. Error: ${e.message}`);
      }
    } else {
      console.log('Transaction aborted');
      alert('Something went wrong. Please try again later.');
      incrementBtn.disabled = false;
    }
  }).catch((error) => {
    console.error('Transaction failed:', error);
    // Re-enable the button if there's an error
    incrementBtn.disabled = false;
    alert('Error updating the counter. Please try again later.');
  });
});

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 
function createConfetti() {
  // Create a canvas element for the confetti
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);

  // Set canvas dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Confetti settings
  const particleCount = 100;
  const gravity = 0.5;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const particles = [];
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 5 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 2 * Math.PI,
      speed: Math.random() * 1 + 2,
      rotationSpeed: Math.random() * 0.2 - 0.1,
      velocityY: Math.random() * 1 + 1,
      velocityX: Math.random() * 4 - 2
    });
  }
  
  // Animation loop
  let animationFrame;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let stillActive = false;
    
    particles.forEach(particle => {
      // Update particle position
      particle.y += particle.velocityY;
      particle.x += particle.velocityX;
      particle.velocityY += gravity;
      particle.rotation += particle.rotationSpeed;
      
      // Draw particle
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
      
      // Check if particle is still on screen
      if (particle.y < canvas.height) {
        stillActive = true;
      }
    });
    
    // Continue animation if particles are still on screen
    if (stillActive) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // Clean up when animation is done
      document.body.removeChild(canvas);
    }
  };
  
  // Start animation
  animationFrame = requestAnimationFrame(animate);
  
  // Safety timeout to ensure cleanup after 5 seconds
  setTimeout(() => {
    if (canvas.parentNode) {
      cancelAnimationFrame(animationFrame);
      document.body.removeChild(canvas);
    }
  }, 5000);
}