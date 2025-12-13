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
// Load saved URL if it exists
let customAPI = localStorage.getItem("magnus_api") || ""; 

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

        ui.status.innerText = "SYSTEM: RENDERING...";
        
        let mediaUrl;
        
        // 1. CHECK FOR COLAB GPU CONNECTION
        if (customAPI && customAPI.includes("trycloudflare.com")) {
             ui.status.innerText = "SYSTEM: COLAB T4 GPU...";
             try {
                 const res = await fetch(`${customAPI}/generate`, {
                     method: 'POST',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify({ prompt: scene.visual })
                 });
                 if (!res.ok) throw new Error("GPU Error");
                 const blob = await res.blob();
                 mediaUrl = URL.createObjectURL(blob);
             } catch(e) {
                 console.warn("Colab Disconnected. Falling back.");
                 ui.status.innerText = "SYSTEM: GPU LOST. FALLBACK...";
             }
        }

        // 2. FALLBACK TO FLUX (If Colab is missing/dead)
        if (!mediaUrl) {
             ui.status.innerText = "SYSTEM: FLUX CLOUD...";
             const seed = character.getSeed();
             const uid = Math.random().toString(36).substring(7);
             mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
        }

        // 3. PRELOAD
        await new Promise((resolve, reject) => {
            const img = new Image();
            const t = setTimeout(() => reject("Timeout"), 15000); // 15s wait for GPU
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); reject("Failed"); };
            img.src = mediaUrl;
        });

        // 4. PLAY
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        music.swell();
        
        setTimeout(() => { ui.img.src = mediaUrl; }, 50);
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 5. LOOP
        await new Promise(r => setTimeout(r, 2000));

    } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
    }
    broadcastLoop();
}

// --- SMART IGNITION ---
ui.btn.addEventListener('click', () => {
    const inputVal = ui.prompt.value.trim();

    // MAGNUS SMART-LINK PROTOCOL
    // If the user pasted the Cloudflare URL, save it and don't start the movie yet.
    if (inputVal.includes("trycloudflare.com")) {
        localStorage.setItem("magnus_api", inputVal);
        customAPI = inputVal;
        
        // Visual Confirmation
        ui.prompt.value = "";
        ui.prompt.placeholder = "GPU LINKED! Enter Mission Now...";
        ui.status.innerText = "SYSTEM: T4 GPU ONLINE";
        ui.btn.innerText = "GPU LINKED - CLICK TO START";
        ui.btn.style.background = "#00ff00";
        ui.btn.style.color = "#000";
        
        alert("✅ NEURAL BRIDGE ESTABLISHED.\n\nThe T4 Supercomputer is linked.\nNow type your movie concept (e.g. 'Cyberpunk Rain') and click again.");
        return;
    }

    if (!inputVal) return alert("Enter a Concept!");

    // Start the Show
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});

// On Load check if we already have a GPU saved
if (localStorage.getItem("magnus_api")) {
    customAPI = localStorage.getItem("magnus_api");
    ui.status.innerText = "SYSTEM: GPU READY";
    ui.prompt.placeholder = "GPU Linked. Enter Mission...";
        }
