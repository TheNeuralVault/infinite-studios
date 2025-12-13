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
let modelIndex = 0;
const MODELS = ['turbo', 'flux', 'midjourney']; // Rotation list

function speak(text) {
    return new Promise(resolve => {
        if (!text) { resolve(); return; }
        if (synth.speaking) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 0.8;
        const voices = synth.getVoices();
        if (voices.length > 0) u.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        const t = setTimeout(resolve, 5000);
        u.onend = () => { clearTimeout(t); resolve(); };
        u.onerror = () => { clearTimeout(t); resolve(); };
        try { synth.speak(u); } catch(e) { resolve(); }
    });
}

async function broadcastLoop() {
    if (!active) return;

    try {
        // 1. GENERATE
        ui.status.innerText = "SYSTEM: WRITING...";
        const topic = ui.prompt.value;
        const scene = await director.getNextScene(topic);

        // 2. RENDER (With Model Rotation)
        const currentModel = MODELS[modelIndex % MODELS.length];
        ui.status.innerText = `SYSTEM: RENDERING (${currentModel.toUpperCase()})...`;
        
        const seed = character.getSeed();
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual)}?width=720&height=1280&model=${currentModel}&seed=${seed}&nologo=true`;
        
        // 3. PRELOAD
        await new Promise((resolve, reject) => {
            const img = new Image();
            const timer = setTimeout(() => reject("Timeout"), 10000);
            
            img.onload = () => { clearTimeout(timer); resolve(); };
            img.onerror = () => { 
                // If this model fails, switch to the next one for next time
                modelIndex++;
                clearTimeout(timer); 
                reject("Load Failed"); 
            };
            img.src = url;
        });

        // 4. DISPLAY
        ui.status.innerText = "SYSTEM: BROADCASTING";
        vfx.trigger();
        music.swell();
        
        setTimeout(() => { ui.img.src = url; }, 50);

        ui.sub.innerText = scene.narration;
        await speak(scene.narration);

    } catch (e) {
        console.warn("Retrying...", e);
        // If it failed, don't wait. Try again immediately with next model.
        modelIndex++;
    }

    // 5. LOOP
    // Small delay to let the phone cool down
    await new Promise(r => setTimeout(r, 1000));
    broadcastLoop();
}

ui.btn.addEventListener('click', () => {
    if (!ui.prompt.value) return;
    ui.btn.innerText = "SYSTEM ACTIVE";
    ui.panel.style.opacity = '0';
    music.startDrone();
    active = true;
    broadcastLoop();
});
