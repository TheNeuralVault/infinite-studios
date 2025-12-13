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

// --- THE LEGION ARRAY ---
// We rotate these models to spread the heat.
const MODELS = ['flux', 'flux-realism', 'turbo', 'midjourney'];

// --- IDENTITY SPOOFER ---
function generateLegionID() {
    // Creates a fake 16-character User ID
    return 'user_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
}

function getNoisyURL(visualPrompt, seed) {
    const model = MODELS[Math.floor(Math.random() * MODELS.length)];
    const legionID = generateLegionID();
    const noise = Math.floor(Math.random() * 999999);
    
    // We append junk data (&ref, &rc, &uid) to confuse the caching layer
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=720&height=1280&model=${model}&seed=${seed}&nologo=true&uid=${legionID}&ref=${noise}`;
}

// --- AUDIO ENGINE ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];

        // Hard limit 6s
        const t = setTimeout(resolve, 6000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- BROADCAST LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. GENERATE
        ui.status.innerText = "LEGION: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. SWARM RENDER
        // We generate a fresh ID. To the server, we are User #8472
        const currentID = generateLegionID(); 
        ui.status.innerText = `LEGION: SPOOFING ID [${currentID.substring(0,6)}...]`;
        
        const seed = character.getSeed();
        const url = getNoisyURL(scene.visual, seed);
        
        // 3. FORCE LOAD
        // If this ID fails, we don't wait. We just loop and spawn a new ID.
        let success = false;
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                const t = setTimeout(() => reject("Timeout"), 8000); // 8s max
                img.onload = () => { clearTimeout(t); resolve(); };
                img.onerror = () => { clearTimeout(t); reject("Blocked"); };
                img.src = url;
            });
            success = true;
        } catch (err) {
            console.warn("ID Blocked. Spawning new user...");
            ui.sub.innerText = ">> ID BLOCKED. REROLLING IDENTITY...";
        }

        if (success) {
            // 4. TRANSITION
            ui.status.innerText = "LEGION: BROADCASTING";
            vfx.trigger();
            music.swell();
            
            setTimeout(() => { ui.img.src = url; }, 50);

            ui.sub.innerText = scene.narration;
            await speak(scene.narration);
        }

        // 5. SPEED
        // Legion mode requires almost no cool-down because every request is "New"
        await new Promise(r => setTimeout(r, 1000));

    } catch (e) {
        await new Promise(r => setTimeout(r, 500));
    }

    broadcastLoop();
}

// --- IGNITION ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "LEGION ACTIVE";
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});
