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

// --- STATIC FALLBACK ---
const STATIC_URL = "https://image.pollinations.ai/prompt/static%20noise%20glitch%20cyberpunk?width=720&height=1280&nologo=true";

// --- SPEECH ---
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

        // Timeout allows visual to linger while audio plays
        const safeTimer = setTimeout(resolve, 8000);

        u.onend = () => { clearTimeout(safeTimer); resolve(); };
        u.onerror = () => { clearTimeout(safeTimer); resolve(); };

        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- MAIN LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. GENERATE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER
        ui.status.innerText = "SYSTEM: RENDERING...";
        
        const seed = character.getSeed();
        const cacheBuster = Math.floor(Math.random() * 100000);
        
        // Use 'turbo' periodically to save API load, 'flux' for quality
        // Strategy: Alternate to avoid queue lock? No, just wait longer.
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&cb=${cacheBuster}`;
        
        // 3. PRELOAD
        let loadedUrl = url;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                // Increased timeout to 15s for slow mobile networks
                const timer = setTimeout(() => reject("Timeout"), 15000);
                
                img.onload = () => { clearTimeout(timer); resolve(); };
                img.onerror = () => { clearTimeout(timer); reject("Failed"); };
                img.src = url;
            });
        } catch (err) {
            console.warn("Load Error, using static");
            loadedUrl = STATIC_URL;
        }

        // 4. TRANSITION
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        
        setTimeout(() => {
            ui.img.src = loadedUrl;
        }, 50);

        // 5. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 6. CRITICAL: COOL DOWN (10 Seconds)
        // This prevents the "Queue Full" error shown in your video
        ui.status.innerText = "SYSTEM: RECHARGING...";
        await new Promise(r => setTimeout(r, 10000));

    } catch (e) {
        console.error("Loop Error:", e);
        await new Promise(r => setTimeout(r, 5000));
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
