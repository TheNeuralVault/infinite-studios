import { Director, character } from './brain.js';
import { Soundtrack } from './soundtrack.js';
import { VFX } from './vfx.js';

// --- INIT SYSTEMS ---
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
let customAPI = localStorage.getItem("magnus_api") || "";

// --- ON-SCREEN LOGGER (For Debugging) ---
function log(msg, type="NORMAL") {
    console.log(`[${type}] ${msg}`);
    // If it's an error, show it in the subtitle box briefly so you know
    if (type === "ERROR") {
        ui.sub.innerText = `>> ERROR: ${msg}`;
        ui.sub.style.color = "red";
        setTimeout(() => ui.sub.style.color = "#00f3ff", 2000);
    }
    // Always update status bar
    ui.status.innerText = msg.toUpperCase().substring(0, 20);
}

// --- ROBUST AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        
        const voices = synth.getVoices();
        if(voices.length) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        
        // Short timeout to keep momentum
        const t = setTimeout(resolve, 5000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- THE BROADCAST LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. BRAIN
        log("WRITING SCENE...");
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER (The Critical Junction)
        let mediaUrl = null;
        let source = "FLUX";
        
        // CHECK GPU (With strict 3s Timeout)
        if (customAPI && customAPI.includes("trycloudflare")) {
             log("CONTACTING GPU...");
             try {
                 const controller = new AbortController();
                 const id = setTimeout(() => controller.abort(), 3000); // 3s Max wait

                 const res = await fetch(`${customAPI}/generate`, {
                     method: 'POST',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify({ prompt: scene.visual }),
                     signal: controller.signal
                 });
                 clearTimeout(id);
                 
                 if (res.ok) {
                     const blob = await res.blob();
                     mediaUrl = URL.createObjectURL(blob);
                     source = "T4 GPU";
                 } else {
                     throw new Error("GPU 500");
                 }
             } catch(e) {
                 log("GPU DEAD. FLUX ACTIVE.", "ERROR");
                 // Don't clear customAPI yet, just skip it for this frame
             }
        }

        // FALLBACK TO FLUX (If GPU failed)
        if (!mediaUrl) {
             log("RENDERING FLUX...");
             const seed = character.getSeed();
             const uid = Math.random().toString(36).substring(7);
             mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
        }

        // 3. PRELOAD (Visual Watchdog)
        log("BUFFERING...");
        await new Promise((resolve) => {
            const img = new Image();
            const t = setTimeout(() => resolve(), 8000); // 8s Force Proceed
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); resolve(); };
            img.src = mediaUrl;
        });

        // 4. DISPLAY
        log(`BROADCASTING [${source}]`);
        vfx.trigger();
        music.swell();
        
        ui.img.style.opacity = 0;
        setTimeout(() => { 
            ui.img.src = mediaUrl; 
            ui.img.style.opacity = 1; 
        }, 50);

        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 5. LOOP
        await new Promise(r => setTimeout(r, 1000));

    } catch (e) {
        log("SYSTEM RECOVERING...", "ERROR");
        console.error(e);
        await new Promise(r => setTimeout(r, 1000));
    }
    broadcastLoop();
}

// --- CONTROLS ---

// 1. STANDARD START
ui.btn.addEventListener('click', () => {
    const val = ui.prompt.value.trim();

    // LINK GPU MODE
    if (val.includes("trycloudflare")) {
        localStorage.setItem("magnus_api", val);
        customAPI = val;
        alert("✅ GPU LINKED. Clear box and enter mission.");
        ui.prompt.value = "";
        return;
    }

    // MOVIE MODE
    if (!val) return alert("Enter Mission!");
    
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});

// 2. FACTORY RESET (Double Tap Title)
// Use this if the system is totally stuck on an old link
document.querySelector('.brand').addEventListener('click', () => {
    if(confirm("RESET SYSTEM SETTINGS?")) {
        localStorage.removeItem("magnus_api");
        customAPI = "";
        alert("System Reset. GPU Unlinked. Reloading...");
        window.location.reload();
    }
});

// Load Check
if (customAPI) ui.status.innerText = "GPU LINKED (READY)";
