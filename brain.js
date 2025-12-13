import { CharacterEngine } from './character_core.js';

export const character = new CharacterEngine(); 

export class Director {
    constructor() {
        this.context = [];
        this.baseUrl = "https://text.pollinations.ai/";
    }

    async getNextScene(topic) {
        const history = this.context.slice(-2).join(" -> ");
        const name = character.getName();

        const system = `
            ROLE: Cyberpunk Film Director.
            CHARACTER: ${name}.
            MISSION: ${topic}.
            PREVIOUS: ${history}.
            TASK: Scene #${this.context.length + 1}.
            FORMAT: Narration [Visuals]
        `;

        try {
            // CRITICAL FIX: 5 Second Timeout prevents freezing
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, {
                signal: controller.signal
            });
            clearTimeout(id);
            const raw = await res.text();
            
            let narration = "";
            let action = "";

            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, cinematic scene of ${name}`;
            }

            const finalVisual = character.enrichPrompt(action);
            this.context.push(narration);
            return { narration, visual: finalVisual };

        } catch (e) {
            // Safe Fallback so loop continues
            return { 
                narration: "Re-calibrating visual sensors...", 
                visual: character.enrichPrompt("static noise, glitch, digital void") 
            };
        }
    }
}
