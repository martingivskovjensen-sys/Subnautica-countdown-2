// Target Date: May 14, 2026 at 17:00 CEST (Central European Summer Time, UTC+2)
// Since CEST is UTC+2, we specify the ISO string with +02:00
let targetDate = new Date('2026-05-14T17:00:00+02:00').getTime();

// Elements
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const countdownContainer = document.getElementById('countdown');
const launchMessage = document.getElementById('launch-message');
const previewBtn = document.getElementById('preview-btn');
const bubblesContainer = document.getElementById('bubbles-container');

// Audio Engine variables
let audioCtx;
let ambientNode;
let droneOsc, droneLfo, droneGain, droneFilter;
let isDronePlaying = false;

const initBtn = document.getElementById('init-btn');
const pdaOverlay = document.getElementById('pda-overlay');

initBtn.addEventListener('click', () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    ambientNode = createAmbientRumble();
    startBubblesAudio();
    
    pdaOverlay.style.opacity = '0';
    setTimeout(() => {
        pdaOverlay.style.display = 'none';
    }, 500);
});

function createAmbientRumble() {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80; 
    
    const gain = audioCtx.createGain();
    gain.gain.value = 0.8;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    return noise;
}

function playBubbleAudio() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    const startFreq = Math.random() * 100 + 150;
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startFreq + 300, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function startBubblesAudio() {
    setInterval(() => {
        if (Math.random() > 0.6) {
            playBubbleAudio();
        }
    }, 1000);
}

function playTick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Create a short noise burst filtered to sound like a clock tick
    const bufLen = Math.floor(audioCtx.sampleRate * 0.015); // 15ms
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        // Sharp attack, fast decay
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.003));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    
    // High-pass filter to make it "clicky" not bassy
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    hp.Q.value = 2;
    
    // Bandpass for body
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500;
    bp.Q.value = 5;
    
    const gain = audioCtx.createGain();
    gain.gain.value = 0.15;
    
    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(now);
}

function manageDrone(distance) {
    if (!audioCtx) return;
    const secondsLeft = distance / 1000;
    
    // Start the light music buildup 10 minutes (600s) before launch
    if (secondsLeft <= 600 && secondsLeft > 0) {
        if (!isDronePlaying) {
            startDramaticDrone();
        }
        
        // Exponential curve over 10 minutes (0 to 1), heavily weighted to the end
        const linearProgress = 1.0 - (secondsLeft / 600);
        const progress = Math.pow(linearProgress, 4.0); // Extreme exponential curve
        
        // Volume: slowly builds up from very quiet to a nice background level
        const volume = progress * 0.15;
        droneGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.5);
        
        // Filter: opens up, revealing brighter overtones as it gets closer to 0
        droneFilter.frequency.setTargetAtTime(200 + (progress * 2000), audioCtx.currentTime, 0.5);
        
        // Chorus/LFO speed increases slightly
        droneLfo.frequency.setTargetAtTime(0.5 + (progress * 4.0), audioCtx.currentTime, 0.5);
    } else {
        if (isDronePlaying) {
            stopDramaticDrone();
        }
    }
}

function startDramaticDrone() {
    isDronePlaying = true;
    
    // Create a beautiful, ethereal choir/pad drone instead of just a bass hum
    droneOsc = audioCtx.createOscillator();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.value = 110; // A2
    
    const droneOsc2 = audioCtx.createOscillator();
    droneOsc2.type = 'sawtooth';
    droneOsc2.frequency.value = 164.81; // E3 (perfect fifth)
    
    const droneOsc3 = audioCtx.createOscillator();
    droneOsc3.type = 'triangle';
    droneOsc3.frequency.value = 55; // A1 (sub bass)
    
    droneLfo = audioCtx.createOscillator();
    droneLfo.type = 'sine';
    droneLfo.frequency.value = 0.5; // Chorus wobble speed
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 10; // Detune amount
    
    droneFilter = audioCtx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 200;
    droneFilter.Q.value = 2; // Nice resonance
    
    droneLfo.connect(lfoGain);
    lfoGain.connect(droneOsc.detune);
    lfoGain.connect(droneOsc2.detune);
    
    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0;
    
    droneOsc.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneOsc3.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    
    droneOsc.start();
    droneOsc2.start();
    droneOsc3.start();
    droneLfo.start();
    
    droneOsc._companion = droneOsc2;
    droneOsc._companion2 = droneOsc3;
}

function stopDramaticDrone() {
    isDronePlaying = false;
    if (droneGain && audioCtx) {
        const now = audioCtx.currentTime;
        droneGain.gain.cancelScheduledValues(now);
        droneGain.gain.setValueAtTime(droneGain.gain.value, now);
        droneGain.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
            if (droneOsc && !isDronePlaying) {
                try { 
                    droneOsc.stop(); 
                    droneLfo.stop(); 
                    if (droneOsc._companion) droneOsc._companion.stop();
                    if (droneOsc._companion2) droneOsc._companion2.stop();
                } catch(e){}
                droneOsc = null;
                droneLfo = null;
            }
        }, 2000);
    }
}

function playReleaseEvent() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Master compressor to prevent clipping and give a "pump" effect
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -15;
    compressor.knee.value = 5;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.3;
    compressor.connect(audioCtx.destination);

    // === 1. COLOSSAL IMPACT BOOM ===
    const impactOsc = audioCtx.createOscillator();
    const impactGain = audioCtx.createGain();
    impactOsc.type = 'sine';
    impactOsc.frequency.setValueAtTime(80, now);
    impactOsc.frequency.exponentialRampToValueAtTime(15, now + 3.0);
    impactGain.gain.setValueAtTime(0.6, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
    impactOsc.connect(impactGain);
    impactGain.connect(compressor);
    impactOsc.start(now);
    impactOsc.stop(now + 4.0);

    // === 2. IMPACT SPLASH (Filtered Noise) ===
    const bufferSize = audioCtx.sampleRate * 3;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 3.0);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(compressor);
    noiseSrc.start(now);

    // === 3. MASSIVE CINEMATIC SWELL (Hans Zimmer style) ===
    const padMaster = audioCtx.createGain();
    padMaster.gain.setValueAtTime(0, now);
    padMaster.gain.linearRampToValueAtTime(0.15, now + 2.0); // Slow swell
    padMaster.gain.setValueAtTime(0.15, now + 6.0);
    padMaster.gain.linearRampToValueAtTime(0, now + 12.0);

    const padFilter = audioCtx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(300, now);
    padFilter.frequency.exponentialRampToValueAtTime(4000, now + 3.0); // Filter open
    padFilter.frequency.setValueAtTime(4000, now + 6.0);
    padFilter.frequency.exponentialRampToValueAtTime(200, now + 12.0); // Filter close

    const stereoDelayL = audioCtx.createDelay();
    const stereoDelayR = audioCtx.createDelay();
    stereoDelayL.delayTime.value = 0.33; // Dotted 8th note feel
    stereoDelayR.delayTime.value = 0.5;  // Quarter note feel
    
    const fbGain = audioCtx.createGain();
    fbGain.gain.value = 0.4;
    
    stereoDelayL.connect(fbGain);
    stereoDelayR.connect(fbGain);
    fbGain.connect(stereoDelayL);
    fbGain.connect(stereoDelayR);
    
    stereoDelayL.connect(compressor);
    stereoDelayR.connect(compressor);

    // C Major 7/9 across 3 octaves
    const padFreqs = [65.41, 130.81, 164.81, 196.0, 246.94, 293.66, 329.63, 392.0];
    
    padFreqs.forEach((freq, i) => {
        const type = i < 2 ? 'sawtooth' : 'triangle'; // Rich bass, soft highs
        for (let detune of [-8, 8]) {
            const osc = audioCtx.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            osc.connect(padFilter);
            osc.start(now);
            osc.stop(now + 12.0);
        }
    });
    
    padFilter.connect(padMaster);
    padMaster.connect(compressor);
    padMaster.connect(stereoDelayL);
    padMaster.connect(stereoDelayR);

    // === 4. CASCADING SHIMMER / ARPEGGIATOR ===
    // Shimmering glassy high notes cascading down then up
    const shimmerGain = audioCtx.createGain();
    shimmerGain.gain.value = 0.05;
    shimmerGain.connect(stereoDelayL);
    shimmerGain.connect(stereoDelayR);
    shimmerGain.connect(compressor);

    const arpNotes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, B5, C6, E6, G6
    let arpTime = now + 1.0;
    
    for (let loop = 0; loop < 4; loop++) {
        const isUp = loop % 2 === 0;
        const notes = isUp ? arpNotes : [...arpNotes].reverse();
        
        notes.forEach((freq) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            g.gain.setValueAtTime(0, arpTime);
            g.gain.linearRampToValueAtTime(1.0, arpTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, arpTime + 0.8);
            
            osc.connect(g);
            g.connect(shimmerGain);
            
            osc.start(arpTime);
            osc.stop(arpTime + 0.8);
            arpTime += 0.12; // fast sequence
        });
    }
}

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
const mainContainer = document.getElementById('main-container');
const flashOverlay = document.getElementById('flash-overlay');
const subtitleText = document.getElementById('subtitle-text');

function playHeartbeat() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Double thump like a real heartbeat
    for (let i = 0; i < 2; i++) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 40;
        const offset = i * 0.15;
        g.gain.setValueAtTime(0, now + offset);
        g.gain.linearRampToValueAtTime(0.3, now + offset + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
    }
}

function playFlashSound(isMassive = false) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Massive Cinematic BRAAAHM
    const duration = isMassive ? 3.0 : 0.8;
    const vol = isMassive ? 0.4 : 0.2;

    // Sub bass
    const subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(30, now);
    subOsc.frequency.exponentialRampToValueAtTime(15, now + duration);

    // Brass/Saw detuned swarm
    const numOscs = 4;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isMassive ? 8000 : 4000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);
    filter.Q.value = 2;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Distortion
    const waveShaper = audioCtx.createWaveShaper();
    const curve = new Float32Array(400);
    for (let i = 0; i < 400; i++) {
        const x = i * 2 / 400 - 1;
        curve[i] = (3 + 10) * x * 20 * (Math.PI / 180) / (Math.PI + 10 * Math.abs(x));
    }
    waveShaper.curve = curve;
    waveShaper.oversample = '4x';

    for (let i = 0; i < numOscs; i++) {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        // Base frequency 55Hz (A1)
        const detune = (Math.random() - 0.5) * 30; // +/- 15 cents
        osc.frequency.setValueAtTime(55, now);
        osc.detune.value = detune;
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + duration);
    }

    subOsc.connect(gain);
    filter.connect(waveShaper);
    waveShaper.connect(gain);
    gain.connect(audioCtx.destination);

    subOsc.start(now);
    subOsc.stop(now + duration);
}

let earthquakeOsc = null;
let earthquakeGain = null;

function startEarthquakeRumble() {
    if (!audioCtx || earthquakeOsc) return;
    const now = audioCtx.currentTime;
    
    earthquakeOsc = audioCtx.createOscillator();
    earthquakeOsc.type = 'square'; // Harsh rumble
    earthquakeOsc.frequency.value = 25; // 25Hz rumble
    
    // Add LFO for wobbling the rumble
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 12; // 12Hz wobble
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(earthquakeOsc.frequency);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80;

    earthquakeGain = audioCtx.createGain();
    earthquakeGain.gain.setValueAtTime(0, now);
    earthquakeGain.gain.linearRampToValueAtTime(0.3, now + 0.5);

    earthquakeOsc.connect(filter);
    filter.connect(earthquakeGain);
    earthquakeGain.connect(audioCtx.destination);

    earthquakeOsc.start(now);
    lfo.start(now);
    earthquakeOsc._lfo = lfo; // store for cleanup
}

function stopEarthquakeRumble() {
    if (earthquakeGain && audioCtx) {
        const now = audioCtx.currentTime;
        earthquakeGain.gain.cancelScheduledValues(now);
        earthquakeGain.gain.linearRampToValueAtTime(0, now + 1.0);
        setTimeout(() => {
            if (earthquakeOsc) {
                try { 
                    earthquakeOsc.stop(); 
                    if (earthquakeOsc._lfo) earthquakeOsc._lfo.stop();
                } catch(e) {}
                earthquakeOsc = null;
            }
        }, 1100);
    }
}

function playSubmarineAlarm() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    
    // Classic high-pitched warning sweep
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.4);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
}

let isRiserPlaying = false;
function playIntenseRiser() {
    if (!audioCtx || isRiserPlaying) return;
    isRiserPlaying = true;
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(8000, now + 10.0); // Sweep from A1 to 8kHz
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(110, now);
    osc2.frequency.exponentialRampToValueAtTime(4000, now + 10.0);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    // Use linear ramp initially to avoid exponential 0 error
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1); 
    gain.gain.exponentialRampToValueAtTime(0.15, now + 9.5); // Rises in volume over 10s
    gain.gain.linearRampToValueAtTime(0, now + 10.1);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(12000, now + 10.0);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 10.1);
    osc2.stop(now + 10.1);
    
    setTimeout(() => { isRiserPlaying = false; }, 11000);
}

function triggerFlash() {
    flashOverlay.style.transition = 'opacity 0.05s ease';
    flashOverlay.style.opacity = '1';
    setTimeout(() => {
        flashOverlay.style.transition = 'opacity 1.5s ease';
        flashOverlay.style.opacity = '0';
    }, 150);
}

function cleanupDramaticState() {
    document.body.classList.remove('final-10', 'final-3', 'heartbeat');
    mainContainer.classList.remove('screen-shake', 'screen-shake-heavy');
    subtitleText.textContent = 'Deploying to Planet Zezura...';
    stopEarthquakeRumble();
    isRiserPlaying = false;
}

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    const secondsLeft = Math.floor(distance / 1000);

    manageDrone(distance);

    if (distance <= 0) {
        daysEl.innerText = "00";
        hoursEl.innerText = "00";
        minutesEl.innerText = "00";
        secondsEl.innerText = "00";
        
        stopDramaticDrone();
        showLaunchState();
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const newSeconds = seconds < 10 ? '0' + seconds : seconds;
    const secondChanged = secondsEl.innerText !== newSeconds.toString();
    
    if (audioCtx && distance > 0 && secondChanged) {
        playTick();
    }

    // === DRAMATIC PHASES ===
    
    // Phase 1: Last 60 seconds — heartbeat begins
    if (secondsLeft <= 60 && secondsLeft > 10) {
        document.body.classList.add('heartbeat');
        document.body.classList.remove('final-10', 'final-3');
        mainContainer.classList.remove('screen-shake', 'screen-shake-heavy');
        subtitleText.textContent = 'T-minus ' + secondsLeft + ' seconds...';
        if (secondChanged) playHeartbeat();
    }
    // Phase 2: Last 10 seconds — RED ALERT (Shaking begins)
    else if (secondsLeft <= 10 && secondsLeft > 3) {
        document.body.classList.remove('heartbeat');
        document.body.classList.add('final-10');
        document.body.classList.remove('final-3');
        mainContainer.classList.add('screen-shake');
        mainContainer.classList.remove('screen-shake-heavy');
        subtitleText.textContent = '⚠ IMPACT IMMINENT ⚠';
        
        // Start shaking earthquake rumble at 10s
        startEarthquakeRumble();
        
        if (secondChanged) {
            playHeartbeat();
            playSubmarineAlarm();
        }
        
        if (secondsLeft === 10 && secondChanged) {
            playIntenseRiser();
        }
    }
    // Phase 3: Last 3 seconds — MAXIMUM INTENSITY
    else if (secondsLeft <= 3 && secondsLeft > 0) {
        document.body.classList.remove('heartbeat');
        document.body.classList.add('final-10', 'final-3');
        mainContainer.classList.remove('screen-shake');
        mainContainer.classList.add('screen-shake-heavy');
        subtitleText.textContent = '⚠ BRACE FOR IMPACT ⚠';
        
        startEarthquakeRumble(); // Ensures it's running
        
        if (secondChanged) {
            playHeartbeat();
            playSubmarineAlarm();
            triggerFlash();
            playFlashSound(false);
        }
    }
    else if (secondsLeft > 60) {
        cleanupDramaticState();
    }

    daysEl.innerText = days < 10 ? '0' + days : days;
    hoursEl.innerText = hours < 10 ? '0' + hours : hours;
    minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
    secondsEl.innerText = newSeconds;
}

let hasLaunched = false;
function showLaunchState() {
    if (hasLaunched) return;
    hasLaunched = true;
    
    // Final massive flash
    playFlashSound(true);
    flashOverlay.style.transition = 'opacity 0.02s ease';
    flashOverlay.style.opacity = '1';
    
    // Heavy shake for 500ms then calm
    mainContainer.classList.add('screen-shake-heavy');
    
    setTimeout(() => {
        mainContainer.classList.remove('screen-shake-heavy', 'screen-shake');
        cleanupDramaticState();
        flashOverlay.style.transition = 'opacity 2s ease';
        flashOverlay.style.opacity = '0';
        
        countdownContainer.classList.add('hidden');
        launchMessage.classList.remove('hidden');
        
        playReleaseEvent();
        triggerConfetti();
    }, 600);
}

// Initialization
createBubbles();
let countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();

// ===== CREATURE SHADOW SYSTEM =====
const creatureContainer = document.getElementById('creature-container');

// SVG silhouettes of sea creatures
const creatureSVGs = [
    // Reaper Leviathan style
    `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg"><path d="M0,40 Q30,20 60,35 Q100,10 150,30 Q180,15 220,25 L280,20 Q320,18 350,25 L380,30 Q395,32 400,40 Q395,48 380,50 L350,55 Q320,62 280,60 L220,55 Q180,65 150,50 Q100,70 60,45 Q30,60 0,40Z" fill="rgba(0,20,40,0.9)"/></svg>`,
    // Stalker/fish style
    `<svg viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg"><path d="M0,30 Q20,15 50,25 L100,20 Q150,10 200,22 L240,25 Q270,20 285,30 Q270,40 240,35 L200,38 Q150,50 100,40 L50,35 Q20,45 0,30Z" fill="rgba(0,20,40,0.9)"/><path d="M260,15 L300,5 L280,30 Z" fill="rgba(0,20,40,0.9)"/><path d="M260,45 L300,55 L280,30 Z" fill="rgba(0,20,40,0.9)"/></svg>`,
    // Ghost Leviathan style (long, flowing)
    `<svg viewBox="0 0 500 50" xmlns="http://www.w3.org/2000/svg"><path d="M0,25 Q40,10 80,22 Q120,8 160,20 Q200,5 250,18 Q300,8 350,20 Q380,12 420,22 Q450,18 480,25 Q450,32 420,28 Q380,38 350,30 Q300,42 250,32 Q200,45 160,30 Q120,42 80,28 Q40,40 0,25Z" fill="rgba(0,20,40,0.9)"/></svg>`,
    // Small school of fish
    `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="20" rx="15" ry="6" fill="rgba(0,20,40,0.9)"/><ellipse cx="60" cy="35" rx="12" ry="5" fill="rgba(0,20,40,0.9)"/><ellipse cx="25" cy="50" rx="14" ry="5" fill="rgba(0,20,40,0.9)"/><ellipse cx="80" cy="15" rx="11" ry="5" fill="rgba(0,20,40,0.9)"/><ellipse cx="90" cy="55" rx="13" ry="5" fill="rgba(0,20,40,0.9)"/><ellipse cx="50" cy="65" rx="10" ry="4" fill="rgba(0,20,40,0.9)"/></svg>`
];

function spawnCreature() {
    const el = document.createElement('div');
    el.classList.add('creature');
    
    const svgIndex = Math.floor(Math.random() * creatureSVGs.length);
    el.innerHTML = creatureSVGs[svgIndex];
    
    // Random size (larger = rarer)
    const size = 150 + Math.random() * 350;
    el.style.width = size + 'px';
    el.style.height = 'auto';
    
    // Random vertical position
    el.style.top = (10 + Math.random() * 70) + '%';
    
    // Swim direction
    const goRight = Math.random() > 0.5;
    const duration = 12 + Math.random() * 18; // 12-30 seconds
    
    if (goRight) {
        el.style.left = '-' + (size + 50) + 'px';
        el.style.animationName = 'swimAcross';
    } else {
        el.style.right = '-' + (size + 50) + 'px';
        el.style.animationName = 'swimAcrossReverse';
    }
    el.style.animationDuration = duration + 's';
    
    creatureContainer.appendChild(el);
    
    // Clean up after animation
    setTimeout(() => {
        el.remove();
    }, duration * 1000 + 500);
}

// Spawn creatures randomly every 8-25 seconds
function scheduleCreature() {
    const delay = 8000 + Math.random() * 17000;
    setTimeout(() => {
        spawnCreature();
        scheduleCreature();
    }, delay);
}
scheduleCreature();
// Spawn one early so users see it quickly
setTimeout(spawnCreature, 3000);

// ===== INTERACTIVE PARALLAX BACKGROUND + DAY/NIGHT CYCLE =====
const waterBg = document.getElementById('water-bg');

// Day/Night cycle parameters (cycles every 120 seconds)
const cycleDurationMs = 120000; 

function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

let currentMouseX = 50;
let currentMouseY = 50;

document.addEventListener('mousemove', (e) => {
    currentMouseX = (e.clientX / window.innerWidth) * 100;
    currentMouseY = (e.clientY / window.innerHeight) * 100;
});

function updateBackgroundLoop() {
    const now = Date.now();
    // Factor goes from 0 to 1 and back to 0
    const phase = (now % cycleDurationMs) / cycleDurationMs;
    const factor = (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0 to 1

    // Day colors (Bright surface water)
    const dayLight = "#0088cc";
    const dayMid = "#004488";
    const dayDark = "#001133";

    // Night colors (Deep dark ocean)
    const nightLight = "#003a5c";
    const nightMid = "#001e36";
    const nightDark = "#000c18";

    const currentLight = interpolateColor(nightLight, dayLight, factor);
    const currentMid = interpolateColor(nightMid, dayMid, factor);
    const currentDark = interpolateColor(nightDark, dayDark, factor);

    waterBg.style.background = `radial-gradient(circle at ${currentMouseX}% ${currentMouseY}%, ${currentLight} 0%, ${currentMid} 40%, ${currentDark} 100%)`;
    requestAnimationFrame(updateBackgroundLoop);
}

requestAnimationFrame(updateBackgroundLoop);

// ===== CLICK RIPPLE + PARTICLES =====
document.addEventListener('click', (e) => {
    // Don't trigger on buttons
    if (e.target.closest('button, a, .debug-panel')) return;
    
    // Ripple ring
    const ripple = document.createElement('div');
    ripple.classList.add('click-ripple');
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1200);
    
    // Particle burst
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.classList.add('click-particle');
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.5);
        const dist = 30 + Math.random() * 50;
        p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
    
    // Bubble pop sound
    if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        g.gain.setValueAtTime(0.08, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    }
});

// Preview button logic
previewBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    cleanupDramaticState();
    
    // Dramatic flash into reveal
    playFlashSound(true);
    flashOverlay.style.transition = 'opacity 0.02s ease';
    flashOverlay.style.opacity = '1';
    
    setTimeout(() => {
        flashOverlay.style.transition = 'opacity 2s ease';
        flashOverlay.style.opacity = '0';
        countdownContainer.classList.add('hidden');
        launchMessage.classList.remove('hidden');
        hasLaunched = false;
        stopDramaticDrone();
        playReleaseEvent();
        triggerConfetti();
    }, 400);
    
    // Reset after 9 seconds
    setTimeout(() => {
        if (new Date().getTime() < targetDate) {
            launchMessage.classList.add('hidden');
            countdownContainer.classList.remove('hidden');
            countdownInterval = setInterval(updateCountdown, 1000);
            updateCountdown();
        }
    }, 9000);
});

// Test Buttons Logic
const test15sBtn = document.getElementById('test-15s-btn');
const test60sBtn = document.getElementById('test-60s-btn');
const testTimeBtn = document.getElementById('test-time-btn');
const resetTimeBtn = document.getElementById('reset-time-btn');

test15sBtn.addEventListener('click', () => {
    targetDate = new Date().getTime() + (18 * 1000); // 18 seconds
    hasLaunched = false;
    cleanupDramaticState();
    countdownContainer.classList.remove('hidden');
    launchMessage.classList.add('hidden');
    stopDramaticDrone();
});

test60sBtn.addEventListener('click', () => {
    targetDate = new Date().getTime() + (65 * 1000);
    hasLaunched = false;
    cleanupDramaticState();
    countdownContainer.classList.remove('hidden');
    launchMessage.classList.add('hidden');
    stopDramaticDrone();
});

testTimeBtn.addEventListener('click', () => {
    targetDate = new Date().getTime() + (605 * 1000); 
    hasLaunched = false;
    cleanupDramaticState();
    countdownContainer.classList.remove('hidden');
    launchMessage.classList.add('hidden');
    stopDramaticDrone();
});

resetTimeBtn.addEventListener('click', () => {
    targetDate = new Date('2026-05-14T17:00:00+02:00').getTime();
    hasLaunched = false;
    cleanupDramaticState();
    countdownContainer.classList.remove('hidden');
    launchMessage.classList.add('hidden');
    stopDramaticDrone();
});
