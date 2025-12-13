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

// --- HARDCODED GPU LINK ---
// This is the direct tunnel to your Google Colab T4 GPU
const customAPI = "https://passage-down-decide-honor.trycloudflare.com";

// --- ROBUST AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8; 
        const voices = synth.getVoices();
        if(voices.length) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
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
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        ui.status.innerText = "SYSTEM: CONTACTING T4 GPU...";
        
        let mediaUrl;
        
        // 1. EXECUTE HARDLINE CONNECTION
        try {
             const res = await fetch(`${customAPI}/generate`, {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ prompt: scene.visual })
             });
             
             if (!res.ok) throw new Error("GPU Offline");
             
             const blob = await res.blob();
             mediaUrl = URL.createObjectURL(blob);
             console.log(">> GPU RENDER SUCCESS");

        } catch(e) {
             console.warn("Colab Tunnel Dead. Falling back to Flux.");
             ui.status.innerText = "SYSTEM: GPU LOST. FLUX BACKUP...";
             
             // Fallback to Pollinations if Colab disconnects
             const seed = character.getSeed();
             const uid = Math.random().toString(36).substring(7);
             mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
        }

        // 2. PRELOAD
        await new Promise((resolve, reject) => {
            const img = new Image();
            const t = setTimeout(() => reject("Timeout"), 15000); // 15s wait for GPU
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); reject("Failed"); };
            img.src = mediaUrl;
        });

        // 3. PLAY
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        music.swell();
        
        setTimeout(() => { ui.img.src = mediaUrl; }, 50);
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 4. LOOP
        await new Promise(r => setTimeout(r, 1000));

    } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
    }
    broadcastLoop();
}

// --- IGNITION ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return alert("Enter Mission!");

    // Visual Confirmation
    ui.btn.innerText = "GPU HARDLINE ACTIVE";
    ui.btn.style.background = "#00ff00";
    ui.btn.style.color = "#000";
    ui.status.innerText = "SYSTEM: T4 ONLINE";
    
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});

// Set initial status
ui.status.innerText = "SYSTEM: GPU LINKED";
