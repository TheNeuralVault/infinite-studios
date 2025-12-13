export class CharacterEngine {
    constructor() {
        this.dna = {
            ID: "Aria",
            Visuals: "Platinum bob-cut hair, violet eyes, pale skin",
            Outfit: "Iridescent raincoat, tactical gear",
            Vibe: "Cinematic, 8k, photorealistic"
        };
        this.baseSeed = 8808; 
    }

    enrichPrompt(action) {
        return `
            ${this.dna.ID}, ${this.dna.Visuals}, ${this.dna.Outfit}, 
            ${action}, 
            ${this.dna.Vibe}, movie still, high quality
        `.trim();
    }
    
    getSeed() { return this.baseSeed; }
    getName() { return this.dna.ID; }
}
