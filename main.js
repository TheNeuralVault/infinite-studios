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

// --- FALLBACK STATIC ---
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
        // 1. GENERATE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER (Using Turbo for Speed/Safety)
        ui.status.innerText = "SYSTEM: RENDERING (TURBO)...";
        const seed = character.getSeed();
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=turbo&seed=${seed}&nologo=true`;
        
        // 3. PRELOAD
        let loadedUrl = url;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                const timer = setTimeout(() => reject("Timeout"), 10000);
                img.onload = () => { clearTimeout(timer); resolve(); };
                img.onerror = () => { clearTimeout(timer); reject("Failed"); };
                img.src = url;
            });
        } catch (err) {
            loadedUrl = STATIC_URL;
        }

        // 4. PLATINUM TRANSITION
        ui.status.innerText = "SYSTEM: BROADCASTING";
        
        // Trigger Glitch
        vfx.trigger();
        // Trigger Audio Swell
        music.swell();
        
        // Swap Image
        setTimeout(() => {
            ui.img.src = loadedUrl;
        }, 50);

        // 5. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 6. COOL DOWN (Prevents Queue Errors)
        await new Promise(r => setTimeout(r, 2000));

    } catch (e) {
        console.error("Loop Error:", e);
        await new Promise(r => setTimeout(r, 1000));
    }

    broadcastLoop();
}

// --- START ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    
    music.startDrone(); // Unlock Audio
    
    active = true;
    broadcastLoop();
});
