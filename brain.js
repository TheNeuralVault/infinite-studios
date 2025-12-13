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
        // Prompt engineered for Wan 2.1 (Needs physics keywords)
        const system = `
            ROLE: Cinema Director.
            CHARACTER: ${name}.
            MISSION: ${topic}.
            PREVIOUS: ${history}.
            TASK: Scene #${this.context.length + 1}.
            OUTPUT: Narration [Visuals]
        `;

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, { signal: controller.signal });
            clearTimeout(id);
            const raw = await res.text();

            if (raw.includes("{") || raw.includes("error") || raw.includes("<")) return this.getFallback();

            let narration = "", action = "";
            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, cinematic shot of ${name}`;
            }

            const finalVisual = character.enrichPrompt(action);
            this.context.push(narration);
            return { narration, visual: finalVisual };

        } catch (e) { return this.getFallback(); }
    }

    getFallback() {
        return { 
            narration: "Neural uplink stabilizing...", 
            visual: character.enrichPrompt("standing in digital void, static noise") 
        };
    }
}
