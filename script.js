// Target Date: May 14, 2026 at 17:00 CEST (Central European Summer Time, UTC+2)
// Since CEST is UTC+2, we specify the ISO string with +02:00
const targetDate = new Date('2026-05-14T17:00:00+02:00').getTime();

// Elements
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const countdownContainer = document.getElementById('countdown');
const launchMessage = document.getElementById('launch-message');
const previewBtn = document.getElementById('preview-btn');
const bubblesContainer = document.getElementById('bubbles-container');

// Create Bubbles for background effect
function createBubbles() {
    for (let i = 0; i < 30; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        // Randomize bubble properties
        const size = Math.random() * 20 + 5;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 10 + 5}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        
        bubblesContainer.appendChild(bubble);
    }
}

// Confetti logic - customized for Subnautica underwater vibe (blues, teals, greens)
function triggerConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti using cool bioluminescent colors
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        colors: ['#00f0ff', '#003a5c', '#39ff14', '#e0f7fa'],
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        colors: ['#00f0ff', '#003a5c', '#39ff14', '#e0f7fa'],
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }));
    }, 250);
}

// Update countdown timer
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
        // Reached zero
        daysEl.innerText = "00";
        hoursEl.innerText = "00";
        minutesEl.innerText = "00";
        secondsEl.innerText = "00";
        
        showLaunchState();
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = days < 10 ? '0' + days : days;
    hoursEl.innerText = hours < 10 ? '0' + hours : hours;
    minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
    secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
}

let hasLaunched = false;
function showLaunchState() {
    if (hasLaunched) return;
    hasLaunched = true;
    
    countdownContainer.classList.add('hidden');
    launchMessage.classList.remove('hidden');
    
    triggerConfetti();
}

// Initialization
createBubbles();
let countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();

// Preview button logic
previewBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    countdownContainer.classList.add('hidden');
    launchMessage.classList.remove('hidden');
    hasLaunched = false; // allow re-triggering for preview
    triggerConfetti();
    
    // Reset after 6 seconds for preview purposes
    setTimeout(() => {
        if (new Date().getTime() < targetDate) {
            launchMessage.classList.add('hidden');
            countdownContainer.classList.remove('hidden');
            countdownInterval = setInterval(updateCountdown, 1000);
            updateCountdown();
        }
    }, 6000);
});
