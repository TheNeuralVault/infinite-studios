import { Director, character } from './brain.js';
import { Soundtrack } from './soundtrack.js';
import { VFX } from './vfx.js';

const director = new Director();
const music = new Soundtrack();
const vfx = new VFX();
const synth = window.speechSynthesis;

const ui = {
    img: document.getElementById('sceneImg'),
    sub: document.getElementById('subtitleBox'),
    btn: document.getElementById('startBtn'),
    prompt: document.getElementById('prompt'),
    panel: document.getElementById('controlPanel'),
    status: document.getElementById('sysStatus')
};

let active = false;

// --- ROBUST SPEECH (Non-Blocking) ---
function speak(text) {
    // If speech fails, we do NOT want to crash the visual loop
    return new Promise(resolve => {
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; 
        u.pitch = 0.8;
        
        // Samsung Voice Grabber
        const voices = synth.getVoices();
        if (voices.length > 0) {
            u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        }

        // Force resolve after 5s so video keeps moving even if audio breaks
        const safeTimer = setTimeout(resolve, 5000);

        u.onend = () => {
            clearTimeout(safeTimer);
            resolve();
        };
        u.onerror = () => {
            clearTimeout(safeTimer);
            resolve();
        };

        try {
            synth.speak(u);
        } catch(e) {
            resolve(); // Fail gracefully
        }
    });
}

// --- MAIN LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. BRAIN (With Visual Feedback)
        ui.status.innerText = "SYSTEM: WRITING SCENE...";
        ui.sub.innerText = ">> NEURAL UPLINK ESTABLISHED...";
        
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER (With Preload Timeout)
        ui.status.innerText = "SYSTEM: RENDERING 4K...";
        ui.sub.innerText = ">> GENERATING FLUX ARTIFACT...";
        
        const seed = character.getSeed();
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true`;
        
        // Safety Preloader: Don't wait more than 8s for an image
        await new Promise(resolve => {
            const img = new Image();
            const timer = setTimeout(resolve, 8000); // Watchdog
            img.onload = () => { clearTimeout(timer); resolve(); };
            img.onerror = () => { clearTimeout(timer); resolve(); };
            img.src = url;
        });

        // 3. TRANSITION
        ui.status.innerText = "SYSTEM: BROADCASTING";
        
        vfx.trigger(); // Glitch
        music.swell(); // Audio dynamic
        
        // Instant Swap
        ui.img.style.opacity = 0;
        setTimeout(() => {
            ui.img.src = url;
            ui.img.style.opacity = 1;
        }, 100);

        // 4. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

    } catch (e) {
        console.error("Frame Drop:", e);
        ui.sub.innerText = ">> SIGNAL INTERFERENCE. REALIGNING...";
        await new Promise(r => setTimeout(r, 2000));
    }

    // 5. NEXT FRAME
    broadcastLoop();
}

// --- IGNITION ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    
    ui.btn.innerText = "SYSTEM ACTIVATED";
    ui.panel.style.opacity = '0'; // Hide UI
    
    // Attempt Audio Start (Non-Blocking)
    music.startDrone();
    
    active = true;
    broadcastLoop();
});
