import { Director, character } from './brain.js';

const director = new Director();
const synth = window.speechSynthesis;

// UI REFS
const ui = {
    img: document.getElementById('sceneImg'),
    sub: document.getElementById('subtitleBox'),
    btn: document.getElementById('startBtn'),
    prompt: document.getElementById('prompt'),
    panel: document.getElementById('controlPanel'),
    status: document.getElementById('sysStatus')
};

let active = false;

// --- AUDIO (Android Optimized) ---
function speak(text) {
    return new Promise(resolve => {
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];

        // Force next scene after 5s even if audio breaks
        const timer = setTimeout(resolve, 5000);
        u.onend = () => { clearTimeout(timer); resolve(); };
        u.onerror = () => { clearTimeout(timer); resolve(); };
        synth.speak(u);
    });
}

// --- MAIN LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        ui.status.innerText = "SYSTEM: RENDERING (TURBO)...";
        const seed = character.getSeed();
        
        // KEY FIX: Using 'model=turbo' instead of 'flux'. 
        // Turbo is free, unlimited, and fast. No queue blocking.
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=turbo&seed=${seed}&nologo=true`;
        
        // Preload (Max 5s wait)
        await new Promise(resolve => {
            const img = new Image();
            const t = setTimeout(resolve, 5000);
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); resolve(); };
            img.src = url;
        });

        // Display
        ui.status.innerText = "SYSTEM: LIVE";
        ui.img.style.opacity = 0;
        setTimeout(() => { ui.img.src = url; ui.img.style.opacity = 1; }, 50);

        // Narrate
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

    } catch (e) {
        // Silent recovery
        await new Promise(r => setTimeout(r, 1000));
    }

    broadcastLoop();
}

// --- START ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    active = true;
    broadcastLoop();
});
