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
let customAPI = localStorage.getItem("magnus_api") || ""; // Remember previous link

// --- AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8; 
        const voices = synth.getVoices();
        if(voices.length) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        
        // 5s Timeout prevents audio freeze
        const t = setTimeout(resolve, 5000);
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
        
        let mediaUrl = null;
        let source = "FLUX";
        
        // 1. TRY GOOGLE COLAB GPU (If linked)
        if (customAPI && customAPI.includes("trycloudflare.com")) {
             ui.status.innerText = "SYSTEM: CONTACTING T4 GPU...";
             try {
                 // Fast 5s Timeout check
                 const controller = new AbortController();
                 const id = setTimeout(() => controller.abort(), 5000);

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
                     source = "COLAB T4";
                 } else {
                     throw new Error("GPU 500 Error");
                 }
             } catch(e) {
                 console.warn("GPU Failed, switching to Flux:", e);
                 ui.status.innerText = "SYSTEM: GPU TIMEOUT. FLUX ENGAGED.";
             }
        }

        // 2. FALLBACK TO FLUX (If Colab failed or wasn't set)
        if (!mediaUrl) {
             const seed = character.getSeed();
             const uid = Math.random().toString(36).substring(7);
             mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
        }

        // 3. PRELOAD (Visual Watchdog)
        await new Promise((resolve, reject) => {
            const img = new Image();
            const t = setTimeout(() => resolve(), 8000); // Force proceed after 8s
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); resolve(); }; // Never crash
            img.src = mediaUrl;
        });

        // 4. DISPLAY
        ui.status.innerText = `SYSTEM: BROADCASTING [${source}]`;
        vfx.trigger();
        music.swell();
        
        // Instant Swap
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
        console.error("System Error", e);
        await new Promise(r => setTimeout(r, 1000));
    }
    broadcastLoop();
}

// --- IGNITION LOGIC ---
ui.btn.addEventListener('click', () => {
    const val = ui.prompt.value.trim();

    // 1. LINK MODE: User pasted a Cloudflare URL
    if (val.includes("trycloudflare.com")) {
        localStorage.setItem("magnus_api", val);
        customAPI = val;
        alert(`✅ GPU LINKED: ${val}\n\nNow clear the box and type your movie concept.`);
        ui.prompt.value = "";
        ui.prompt.placeholder = "GPU Linked! Enter Mission...";
        return; // Don't start movie yet
    }

    // 2. MOVIE MODE: Start the show
    if (!val) return alert("Enter a Mission!");

    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.btn.style.background = "#00ff00";
    ui.btn.style.color = "#000";
    
    // Fade Controls
    ui.panel.style.transition = "opacity 1s";
    ui.panel.style.opacity = '0';
    
    music.startDrone();
    active = true;
    broadcastLoop();
});

// Restore previous link on load
if (customAPI) {
    ui.status.innerText = "SYSTEM: GPU LINKED";
    ui.prompt.placeholder = "GPU Ready. Enter Mission...";
}
