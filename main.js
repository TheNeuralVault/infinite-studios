import { Director, character } from './brain.js';

const director = new Director();
const synth = window.speechSynthesis;

const ui = {
    vid: document.getElementById('scenePlayer'),
    sub: document.getElementById('subtitleBox'),
    btn: document.getElementById('startBtn'),
    prompt: document.getElementById('prompt'),
    panel: document.getElementById('controlPanel'),
    status: document.getElementById('sysStatus')
};

let active = false;

// --- AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        
        // Wan 2.2 videos are ~4-5 seconds. We match the audio timeout.
        const t = setTimeout(resolve, 5000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        synth.speak(u);
    });
}

// --- SOTA LOOP ---
async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. WRITE SCENE
        ui.status.innerText = "SYSTEM: WRITING SCENE...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);
        
        // 2. GENERATE VIDEO (The Puter Protocol)
        ui.status.innerText = "SYSTEM: ALLOCATING WAN-2.2 GPU...";
        ui.sub.innerText = ">> CONNECTING TO NEURAL CLOUD...";

        // Puter.ai.txt2vid is the Magic Function
        // It returns a Video Object URL (Blob)
        const videoElement = await puter.ai.txt2vid(scene.visual);
        
        // 3. PLAYBACK
        ui.status.innerText = "SYSTEM: BROADCASTING";
        
        // Swap the source to our main player
        ui.vid.src = videoElement.src;
        ui.vid.style.opacity = 1;
        ui.vid.play();

        // 4. NARRATE
        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

        // 5. NEXT
        broadcastLoop();

    } catch (e) {
        console.warn("Puter Busy/Error:", e);
        ui.sub.innerText = ">> RE-ROUTING TRAFFIC...";
        // If Puter is busy, wait 3s and retry.
        await new Promise(r => setTimeout(r, 3000));
        broadcastLoop();
    }
}

// --- IGNITION ---
ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    active = true;
    broadcastLoop();
});
