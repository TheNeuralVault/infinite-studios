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
let errorCount = 0;

// --- FALLBACK STATIC URL ---
// If the AI fails, we show this instead of black screen
const STATIC_URL = "https://image.pollinations.ai/prompt/static%20noise%20glitch%20cyberpunk?width=720&height=1280&nologo=true";

// --- ROBUST SPEECH ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; 
        u.pitch = 0.8;
        
        const voices = synth.getVoices();
        if (voices.length > 0) {
            u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        }

        // Hard timeout: Audio forces next scene after 6s no matter what
        const safeTimer = setTimeout(resolve, 6000);

        u.onend = () => { clearTimeout(safeTimer); resolve(); };
        u.onerror = () => { clearTimeout(safeTimer); resolve(); };

        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- MAIN LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. GENERATE NARRATIVE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. GENERATE VISUAL (With Error Handling)
        ui.status.innerText = "SYSTEM: RENDERING...";
        
        const seed = character.getSeed();
        // Add random cache-buster to prevent stuck images
        const cacheBuster = Math.floor(Math.random() * 100000);
        
        // Use standard Flux model (Turbo is faster but Flux is better quality)
        // If we hit too many errors, switch to Turbo temporarily
        const model = errorCount > 2 ? 'turbo' : 'flux';
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=${model}&seed=${seed}&nologo=true&cb=${cacheBuster}`;
        
        // 3. PRELOAD WITH TIMEOUT
        let loadedUrl = url;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                const timer = setTimeout(() => reject("Timeout"), 10000); // 10s max load
                
                img.onload = () => { clearTimeout(timer); resolve(); };
                img.onerror = () => { clearTimeout(timer); reject("Load Failed"); };
                img.src = url;
            });
            errorCount = 0; // Reset errors on success
        } catch (err) {
            console.warn("Image Load Failed:", err);
            errorCount++;
            loadedUrl = STATIC_URL; // Switch to static if API fails
            ui.sub.innerText = ">> SIGNAL LOST. RE-ESTABLISHING...";
        }

        // 4. TRANSITION
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        
        setTimeout(() => {
            ui.img.src = loadedUrl;
        }, 50); // Instant swap inside glitch

        // 5. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 6. RATE LIMIT DELAY (The "Queue Full" Fix)
        // We MUST wait 5 seconds before asking for the next image
        ui.status.innerText = "SYSTEM: COOLING DOWN...";
        await new Promise(r => setTimeout(r, 5000));

    } catch (e) {
        console.error("Critical Loop Error:", e);
        await new Promise(r => setTimeout(r, 2000));
    }

    // 7. RECURSE
    broadcastLoop();
}

// --- START ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    
    music.startDrone();
    
    active = true;
    broadcastLoop();
});
