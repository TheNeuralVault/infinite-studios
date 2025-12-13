import { Director, character } from './brain.js';
import { Soundtrack } from './soundtrack.js';
import { VFX } from './vfx.js';

const director = new Director();
const music = new Soundtrack();
const vfx = new VFX();
const synth = window.speechSynthesis;

const ui = {
    vid: document.getElementById('sceneVid'),
    img: document.getElementById('sceneImg'),
    sub: document.getElementById('subtitleBox'),
    btn: document.getElementById('startBtn'),
    prompt: document.getElementById('prompt'),
    panel: document.getElementById('controlPanel'),
    status: document.getElementById('sysStatus')
};

let active = false;

// --- AUDIO ENGINE ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        
        // Android Voice Fix
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];

        const t = setTimeout(resolve, 6000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- HYBRID RENDERER (Wan 2.1 + Flux) ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. WRITE SCENE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. REQUEST SOTA VIDEO (Puter)
        ui.status.innerText = "SYSTEM: ALLOCATING GPU...";
        ui.sub.innerText = ">> GENERATING VIDEO (WAN 2.1)...";
        
        let mediaSource = null;
        let isVideo = false;

        try {
            // We give Puter 15 seconds to generate video. 
            // If it takes longer (Queue), we switch to Flux Image to keep flow.
            const videoTask = puter.ai.txt2vid(scene.visual);
            const timeoutTask = new Promise((_, reject) => setTimeout(() => reject("Timeout"), 15000));
            
            // Race: Video vs Clock
            const videoObj = await Promise.race([videoTask, timeoutTask]);
            mediaSource = videoObj.src;
            isVideo = true;
            console.log("Wan 2.1 Success");

        } catch (err) {
            console.warn("Wan 2.1 Busy/Timeout. Switching to Flux.");
            ui.status.innerText = "SYSTEM: FLUX FALLBACK...";
            const seed = character.getSeed();
            mediaSource = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true`;
            isVideo = false;
        }

        // 3. PRELOAD
        if (!isVideo) {
            await new Promise(r => { 
                const i = new Image(); i.src = mediaSource; i.onload = r; 
            });
        }

        // 4. TRANSITION & PLAY
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        music.swell();

        if (isVideo) {
            ui.img.style.opacity = 0;
            ui.vid.src = mediaSource;
            ui.vid.style.opacity = 1;
            ui.vid.play();
        } else {
            ui.vid.style.opacity = 0;
            ui.vid.pause();
            ui.img.src = mediaSource;
            ui.img.style.opacity = 1;
        }

        // 5. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 6. LOOP
        broadcastLoop();

    } catch (e) {
        console.error(e);
        await new Promise(r => setTimeout(r, 2000));
        broadcastLoop();
    }
}

// --- AUTHENTICATION HANDLER ---
ui.btn.addEventListener('click', async () => {
    if (!ui.prompt.value) return alert("Enter Mission!");
    
    ui.btn.innerText = "AUTHENTICATING...";
    
    try {
        // 1. TRIGGER POPUP (Must be direct user action)
        // This attempts to create a temp user or log you in
        await puter.auth.signIn({ attempt_temp_user_creation: true });
        
        ui.btn.innerText = "ACCESS GRANTED";
        ui.status.innerText = "SYSTEM: ONLINE";
        ui.panel.style.opacity = '0';
        
        // 2. Start Systems
        music.startDrone();
        active = true;
        
        // 3. Start Loop
        broadcastLoop();

    } catch (err) {
        alert("Authentication Failed. Please allow popups or try again.");
        ui.btn.innerText = "RETRY CONNECTION";
    }
});
