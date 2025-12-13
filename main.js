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
let customAPI = localStorage.getItem("magnus_api") || ""; // Save URL between reloads

// --- AUDIO ---
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

        ui.status.innerText = "SYSTEM: RENDERING...";
        
        let mediaUrl;
        
        // CHECK: Do we have a Custom Colab URL?
        if (customAPI && customAPI.includes("trycloudflare.com")) {
             ui.status.innerText = "SYSTEM: COLAB GPU (T4)...";
             try {
                 // Hit your private server
                 const res = await fetch(`${customAPI}/generate`, {
                     method: 'POST',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify({ prompt: scene.visual })
                 });
                 const blob = await res.blob();
                 mediaUrl = URL.createObjectURL(blob);
             } catch(e) {
                 console.warn("Colab Disconnected. Falling back to Flux.");
                 customAPI = ""; // Reset if dead
             }
        }

        // Fallback to Flux if Colab is not set or dead
        if (!mediaUrl) {
             ui.status.innerText = "SYSTEM: FLUX CLOUD...";
             const seed = character.getSeed();
             const uid = Math.random().toString(36).substring(7);
             mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
        }

        // Preload
        await new Promise((resolve, reject) => {
            const img = new Image();
            const t = setTimeout(() => reject("Timeout"), 10000);
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); reject("Failed"); };
            img.src = mediaUrl;
        });

        // Play
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        music.swell();
        
        setTimeout(() => { ui.img.src = mediaUrl; }, 50);
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        await new Promise(r => setTimeout(r, 2000));

    } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
    }
    broadcastLoop();
}

// --- CONFIG MODE ---
// Long press "INITIATE" to set Custom URL
let pressTimer;
ui.btn.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
        const url = prompt("ENTER COLAB URL (trycloudflare.com):", customAPI);
        if(url) {
            customAPI = url;
            localStorage.setItem("magnus_api", url);
            alert("GPU LINKED. POWER UNLIMITED.");
        }
    }, 1000);
});
ui.btn.addEventListener('touchend', () => clearTimeout(pressTimer));

// --- START ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});
