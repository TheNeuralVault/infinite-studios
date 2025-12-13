import { CharacterEngine } from './character_core.js';

export const character = new CharacterEngine(); 

export class Director {
    constructor() {
        this.context = [];
        this.baseUrl = "https://text.pollinations.ai/";
    }

    async getNextScene(topic) {
        // Maintain Narrative Flow
        const history = this.context.slice(-2).join(" -> ");
        const name = character.getName();

        // THE SYSTEM PROMPT (In-Context Learning)
        const system = `
            ROLE: Cyberpunk Director.
            CHARACTER: ${name} (Platinum hair, violet eyes).
            MISSION: ${topic}.
            PREVIOUS: ${history}.
            
            TASK: Write Scene #${this.context.length + 1}.
            
            RULES:
            1. Narrate in present tense.
            2. Visuals in brackets [ ].
            3. ${name} must be the focus.
            
            OUTPUT FORMAT: 
            "She bypasses the firewall... [Aria connecting a data cable to a glowing terminal]"
        `;

        try {
            // Signal Cloud Brain
            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`);
            const raw = await res.text();
            
            let narration = "";
            let action = "";

            // Parse Response
            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, cinematic scene of ${name}`;
            }

            // Inject Platinum Visuals
            const finalVisual = character.enrichPrompt(action);

            this.context.push(narration);
            return { narration, visual: finalVisual };

        } catch (e) {
            // Offline Fallback
            return { 
                narration: "Re-establishing neural uplink...", 
                visual: character.enrichPrompt("standing in digital void, static interference") 
            };
        }
    }
}
