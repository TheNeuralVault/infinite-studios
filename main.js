import { Director, character } from './brain.js';
import { Soundtrack } from './soundtrack.js';
import { VFX } from './vfx.js';

const director = new Director();
const music = new Soundtrack();
const vfx = new VFX();
const synth = window.speechSynthesis;

const ui = {
    layers: [document.getElementById('layerA'), document.getElementById('layerB')],
    sub: document.getElementById('subtitleBox'),
    btn: document.getElementById('startBtn'),
    prompt: document.getElementById('prompt'),
    panel: document.getElementById('controlPanel'),
    status: document.getElementById('sysStatus')
};

let activeLayer = 0; // Toggles between 0 and 1
let isRunning = false;

// THE OUROBOROS BUFFER
// We keep 2 scenes in memory: [Current, Next]
let sceneBuffer = [];

// --- ASYNC GENERATOR (The Future) ---
async function generateSceneData(topic) {
    ui.status.innerText = "SYSTEM: PREDICTING FUTURE...";
    
    // 1. Write Script
    const narrative = await director.getNextScene(topic);
    
    // 2. Shotgun Render (Multiplex)
    // We try Flux first, if it takes > 6s we assume queue full and use Turbo
    const seed = character.getSeed();
    const uid = Math.random().toString(36).substring(7);
    
    // Primary High Quality
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(narrative.visual)}?width=720&height=1280&model=flux&seed=${seed}&nologo=true&uid=${uid}`;
    // Backup Fast
    const turboUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(narrative.visual)}?width=720&height=1280&model=turbo&seed=${seed}&nologo=true&uid=${uid}`;

    // 3. Preload Race
    let finalUrl = fluxUrl;
    try {
        await new Promise((resolve, reject) => {
            const img = new Image();
            const timer = setTimeout(() => {
                // If Flux is slow, switch URL to Turbo and try again
                img.src = turboUrl; 
            }, 6000); 
            
            // Hard timeout at 12s (Total failure -> Static)
            const hardStop = setTimeout(() => reject("Timeout"), 12000);

            img.onload = () => { clearTimeout(timer); clearTimeout(hardStop); resolve(); };
            img.onerror = () => { clearTimeout(timer); clearTimeout(hardStop); reject("Error"); };
            img.src = fluxUrl;
        });
        // If we reach here, img.src loaded successfully (either flux or turbo)
        finalUrl = fluxUrl; // (Or turbo if it switched)
    } catch(e) {
        finalUrl = "https://image.pollinations.ai/prompt/static%20noise%20glitch?width=720&height=1280&nologo=true";
    }

    return { url: finalUrl, text: narrative.narration };
}

// --- BUFFER MANAGER ---
async function fillBuffer(topic) {
    while (sceneBuffer.length < 2 && isRunning) {
        const scene = await generateSceneData(topic);
        sceneBuffer.push(scene);
        ui.status.innerText = `BUFFER: ${sceneBuffer.length} READY`;
    }
}

// --- PLAYER LOOP (The Present) ---
async function playLoop() {
    if (!isRunning) return;

    if (sceneBuffer.length === 0) {
        ui.status.innerText = "BUFFERING...";
        await new Promise(r => setTimeout(r, 1000));
        playLoop();
        return;
    }

    // 1. Get Next Scene
    const scene = sceneBuffer.shift(); // Remove from queue
    
    // 2. Trigger Background Refill (Async)
    fillBuffer(ui.prompt.value);

    // 3. Transition Layers
    const currentImg = ui.layers[activeLayer];
    const nextLayerIndex = (activeLayer + 1) % 2;
    const nextImg = ui.layers[nextLayerIndex];

    // Set source hidden
    nextImg.src = scene.url;
    
    // VFX Trigger
    vfx.trigger(nextImg);
    music.swell();

    // Crossfade
    currentImg.classList.remove('active');
    nextImg.classList.add('active');
    activeLayer = nextLayerIndex;

    // 4. Narrate
    ui.sub.innerText = scene.text;
    await speak(scene.text);

    // 5. Loop immediately (No cool down needed because buffer does the waiting)
    playLoop();
}

// --- AUDIO ---
function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        
        // Timeout based on text length to keep pace moving
        const duration = Math.min(text.length * 100, 6000); 
        const t = setTimeout(resolve, duration);
        
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

// --- IGNITION ---
ui.btn.addEventListener('click', async () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    
    music.startDrone();
    isRunning = true;
    
    // Prime the pump
    ui.status.innerText = "PRIMING BUFFER...";
    await fillBuffer(ui.prompt.value);
    
    playLoop();
});
