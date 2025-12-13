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
            ROLE: Movie Director.
            CHARACTER: ${name}.
            MISSION: ${topic}.
            PREVIOUS: ${history}.
            TASK: Scene #${this.context.length + 1}.
            OUTPUT: Narration [Visuals]
        `;

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000); // Fast timeout
            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, { signal: controller.signal });
            clearTimeout(id);
            const raw = await res.text();

            // SANITIZER: If raw looks like code/error, kill it.
            if (raw.includes("{") || raw.includes("error") || raw.includes("<")) {
                return this.getFallback();
            }

            let narration = "";
            let action = "";

            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, scene of ${name}`;
            }

            // Length cap
            if (narration.length > 120) narration = narration.substring(0, 119) + "...";

            const finalVisual = character.enrichPrompt(action);
            this.context.push(narration);
            return { narration, visual: finalVisual };

        } catch (e) {
            return this.getFallback();
        }
    }

    getFallback() {
        return { 
            narration: "Signal stabilizing...", 
            visual: character.enrichPrompt("standing in digital rain, static glitch") 
        };
    }
}
