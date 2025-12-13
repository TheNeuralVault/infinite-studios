import { CharacterEngine } from './character_core.js';

export const character = new CharacterEngine(); 

export class Director {
    constructor() {
        this.context = [];
        this.baseUrl = "https://text.pollinations.ai/";
        this.retryCount = 0;
    }

    async getNextScene(topic) {
        const history = this.context.slice(-2).join(" -> ");
        const name = character.getName();

        const system = `
            ROLE: Cyberpunk Director.
            CHARACTER: ${name}.
            MISSION: ${topic}.
            PREVIOUS: ${history}.
            TASK: Scene #${this.context.length + 1}.
            OUTPUT FORMAT: Narration [Visuals]
        `;

        try {
            // 1. ATTEMPT CONNECTION
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 8000); // 8s Timeout

            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, {
                signal: controller.signal
            });
            clearTimeout(id);
            
            const raw = await res.text();

            // 2. ERROR DETECTION (The Logic, not the Lie)
            // If the response is the "Queue Full" JSON error
            if (raw.trim().startsWith("{") || raw.includes('"error"')) {
                console.warn("API Error Detected:", raw);
                return this.handleError(topic, "QUEUE FULL");
            }

            // If the response is HTML (Server down)
            if (raw.trim().startsWith("<")) {
                return this.handleError(topic, "SERVER BUSY");
            }

            // 3. SUCCESSFUL PARSE
            let narration = "";
            let action = "";

            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, cinematic scene of ${name}`;
            }

            // Clean up prompt length so it doesn't overflow
            if (narration.length > 200) narration = narration.substring(0, 199) + ".";

            const finalVisual = character.enrichPrompt(action);
            this.context.push(narration);
            this.retryCount = 0; // Reset error count on success
            
            return { narration, visual: finalVisual, status: "OK" };

        } catch (e) {
            console.error("Fetch Error:", e);
            return this.handleError(topic, "TIMEOUT");
        }
    }

    async handleError(topic, reason) {
        this.retryCount++;
        
        // Update the UI status directly to be honest with the Operator
        const statusEl = document.getElementById('sysStatus');
        if(statusEl) statusEl.innerText = `SYSTEM: ${reason} (RETRY ${this.retryCount})`;

        // Wait 3 seconds and try again (Recursive Retry)
        await new Promise(r => setTimeout(r, 3000));
        
        // If we fail 5 times, THEN we fall back to local logic to keep the show running
        if (this.retryCount > 5) {
            return {
                narration: `The data stream is buffering. Holding pattern active.`,
                visual: character.enrichPrompt("atmospheric idle scene, floating particles"),
                status: "FALLBACK"
            };
        }

        return this.getNextScene(topic);
    }
}
