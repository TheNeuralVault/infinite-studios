export class CharacterEngine {
    constructor() {
        this.dna = {
            ID: "Aria",
            Visuals: "22yo woman, platinum bob-cut hair, violet eyes, pale skin, barcode tattoo",
            Outfit: "Translucent iridescent raincoat, tactical gear",
            Vibe: "Cyberpunk, 8k, hyper-realistic, volumetric lighting"
        };
        this.anchor = `${this.dna.Visuals}, ${this.dna.Outfit}, ${this.dna.Vibe}`;
        this.baseSeed = 8808; 
    }

    enrichPrompt(action) {
        return `
            ${this.dna.ID}, ${this.anchor}, 
            ACTION: ${action}, 
            highly detailed, ray-traced, neon atmosphere
        `.trim();
    }
    
    getSeed() { return this.baseSeed + Math.floor(Math.random() * 50); }
    getName() { return this.dna.ID; }
}
