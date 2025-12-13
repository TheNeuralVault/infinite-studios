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
let mode = 'flux'; // Default to Flux, upgrade to WAN if login succeeds

// --- AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];

        const t = setTimeout(resolve, 6000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- UNIVERSAL LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. WRITE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER (Branching Logic)
        let mediaSource = null;
        let isVideo = false;

        if (mode === 'wan') {
            ui.status.innerText = "SYSTEM: WAN 2.1 VIDEO...";
            try {
                // Try SOTA Video
                const videoTask = puter.ai.txt2vid(scene.visual);
                const timeoutTask = new Promise((_, r) => setTimeout(() => r("Timeout"), 15000));
                const videoObj = await Promise.race([videoTask, timeoutTask]);
                mediaSource = videoObj.src;
                isVideo = true;
            } catch (e) {
                // SOTA Failed? Fallback to Flux for this frame
                console.warn("Wan busy, using Flux fallback");
                mode = 'flux'; // Downgrade temporarily
            }
        }

        if (mode === 'flux') {
            ui.status.innerText = "SYSTEM: FLUX RENDER...";
            const seed = character.getSeed();
            // Cache buster + User ID to prevent queue blocking
            const uid = Math.random().toString(36).substring(7);
            mediaSource = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
            isVideo = false;
        }

        // 3. PRELOAD
        if (!isVideo) {
            await new Promise((resolve, reject) => {
                const img = new Image();
                const t = setTimeout(() => reject("Timeout"), 10000);
                img.onload = () => { clearTimeout(t); resolve(); };
                img.onerror = () => { clearTimeout(t); reject("Load Failed"); };
                img.src = mediaSource;
            });
        }

        // 4. PLAY
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

        // 5. SPEAK
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 6. LOOP (Cool down to prevent bans)
        await new Promise(r => setTimeout(r, 2000));
        broadcastLoop();

    } catch (e) {
        console.error(e);
        // If anything breaks, wait 1s and try again (Infinite resilience)
        await new Promise(r => setTimeout(r, 1000));
        broadcastLoop();
    }
}

// --- ROBUST IGNITION ---
ui.btn.addEventListener('click', async () => {
    if (!ui.prompt.value) return alert("Enter Mission!");
    
    ui.btn.innerText = "INITIALIZING...";
    
    // 1. Try Audio Unlock
    music.startDrone();

    // 2. Try Puter Login (But don't crash if it fails)
    try {
        await puter.auth.signIn({ attempt_temp_user_creation: true });
        mode = 'wan'; // Success! We have video.
        ui.status.innerText = "SYSTEM: WAN 2.1 ONLINE";
    } catch (err) {
        console.warn("Auth Failed. Switching to Flux Mode.");
        mode = 'flux'; // Failure handled. Use standard engine.
        ui.status.innerText = "SYSTEM: STANDARD MODE";
    }

    // 3. Start The Show regardless of login status
    ui.panel.style.opacity = '0';
    active = true;
    broadcastLoop();
});
