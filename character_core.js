/**
 * ARTIFACT: CHARACTER DNA
 * Protocol: Visual Anchor & Seed Locking
 */

export class CharacterEngine {
    constructor() {
        this.dna = {
            ID: "Aria",
            Visuals: "22yo woman, platinum white sharp bob-cut, violet glowing eyes, pale skin, barcode tattoo on cheek",
            Outfit: "Translucent iridescent raincoat over black tactical tech-wear",
            Vibe: "Cinematic, moody, hyper-realistic, 8k resolution, volumetric lighting"
        };
        
        // COMPRESSED ANCHOR
        this.anchor = `${this.dna.Visuals}, ${this.dna.Outfit}, ${this.dna.Vibe}`;

        // IDENTITY SEED LOCK
        this.baseSeed = 8808; 
    }

    enrichPrompt(action) {
        // [DNA] + [ACTION] + [PHYSICS ENGINE]
        return `
            ${this.dna.ID}, ${this.anchor}, 
            ACTION: ${action}, 
            highly detailed, ray-traced reflections, depth of field, 
            anamorphic lens, film grain, color graded
        `.trim();
    }
    
    getSeed() {
        // Micro-variance (0-100) allows dynamic posing while keeping the face
        return this.baseSeed + Math.floor(Math.random() * 100);
    }
    
    getName() { return this.dna.ID; }
}
