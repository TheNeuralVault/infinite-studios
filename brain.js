import { CharacterEngine } from './character_core.js';

export const character = new CharacterEngine(); 

export class Director {
    constructor() {
        this.context = [];
        this.baseUrl = "https://text.pollinations.ai/";
        
        // EMERGENCY BACKUP SCENES (Used if Cloud is blocked)
        this.backups = [
            "Aria hacking a neon terminal in the rain.",
            "Aria riding a high-speed motorcycle through a tunnel.",
            "Aria standing on a rooftop overlooking a mega-city.",
            "Aria walking through a crowded cyber-market.",
            "Aria drawing a glowing katana in a dark alley.",
            "Aria analyzing a holographic map.",
            "Aria hiding behind a concrete pillar.",
            "Aria sprinting across a glass bridge.",
            "Aria exploring an abandoned temple.",
            "Aria interfacing with a rogue drone.",
            "Aria sitting in a futuristic cafe looking anxious.",
            "Aria staring into a broken mirror."
        ];
    }

    async getNextScene(topic) {
        const history = this.context.slice(-2).join(" -> ");
        const name = character.getName();

        // 1. CLOUD ATTEMPT
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000); // Fast 3s timeout

            const system = `
                ROLE: Director. CHARACTER: ${name}. TOPIC: ${topic}. PREVIOUS: ${history}.
                TASK: Write Scene. OUTPUT: Narration [Visuals]
            `;

            const res = await fetch(`${this.baseUrl}${encodeURIComponent(system)}`, {
                signal: controller.signal
            });
            clearTimeout(id);
            const raw = await res.text();

            // Error Check
            if (raw.includes("{") || raw.includes("error") || raw.includes("<") || raw.length < 5) {
                throw new Error("Cloud Blocked");
            }

            // Parse
            let narration = "";
            let action = "";

            if (raw.includes('[')) {
                narration = raw.split('[')[0].trim();
                action = raw.split('[')[1].replace(']', '').trim();
            } else {
                narration = raw;
                action = `${topic}, scene of ${name}`;
            }

            if (narration.length > 120) narration = narration.substring(0, 119) + "...";

            this.context.push(narration);
            return { 
                narration, 
                visual: character.enrichPrompt(action) 
            };

        } catch (e) {
            // 2. OFFLINE FALLBACK (The Fix)
            // Instead of static, we pick a REAL scene from the backup list.
            const randomScene = this.backups[Math.floor(Math.random() * this.backups.length)];
            
            return { 
                narration: `System offline. Executing protocol: ${randomScene}`, 
                visual: character.enrichPrompt(randomScene) 
            };
        }
    }
                }
