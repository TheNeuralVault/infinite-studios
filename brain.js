import { CharacterEngine } from './character_core.js';

export const character = new CharacterEngine(); 

export class Director {
    constructor() {
        this.context = [];
        this.baseUrl = "https://text.pollinations.ai/";
        this.errorCount = 0;
    }

    async getNextScene(topic) {
        // RATE LIMIT SAFETY: If we hit too many errors, use local mode for a bit
        if (this.errorCount > 3) {
            this.errorCount--; // Slowly recover
            return this.getLocalBackup(topic);
        }

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
            // CRITICAL: 5 Second Timeout
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, {
                signal: controller.signal
            });
            clearTimeout(id);
            
            const raw = await res.text();

            // ERROR TRAP: Check if API sent an error message
            if (raw.includes("error") || raw.includes("Queue full") || raw.length < 5) {
                console.warn("Brain Rate Limit Hit");
                this.errorCount += 2;
                return this.getLocalBackup(topic);
            }
            
            let narration = "";
            let action = "";

            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, cinematic scene of ${name}`;
            }

            // Success - reduce error count
            this.errorCount = 0;

            const finalVisual = character.enrichPrompt(action);
            this.context.push(narration);
            return { narration, visual: finalVisual };

        } catch (e) {
            this.errorCount++;
            return this.getLocalBackup(topic);
        }
    }

    getLocalBackup(topic) {
        // Local phrases so the movie never stops even if WiFi dies
        const backups = [
            "Scanning the perimeter for hostiles...",
            "The signal is degrading, re-calibrating sensors...",
            "Moving deeper into the shadow zone...",
            "Data stream buffering, holding position..."
        ];
        const randomNarration = backups[Math.floor(Math.random() * backups.length)];
        const visual = character.enrichPrompt(`${topic}, dark atmosphere, static, glitch, 8k`);
        
        return { narration: randomNarration, visual: visual };
    }
}
