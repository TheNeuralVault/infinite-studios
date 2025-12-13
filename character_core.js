export class CharacterEngine {
    constructor() {
        this.dna = {
            ID: "Aria",
            Visuals: "22yo woman, platinum white sharp bob-cut, violet glowing eyes, pale skin, barcode tattoo on cheek",
            Outfit: "Translucent iridescent raincoat over black tactical tech-wear",
            Vibe: "Cinematic, moody, hyper-realistic, 8k resolution, volumetric lighting"
        };
        this.anchor = `${this.dna.Visuals}, ${this.dna.Outfit}, ${this.dna.Vibe}`;
        this.baseSeed = 8808; 
    }

    enrichPrompt(action) {
        return `
            ${this.dna.ID}, ${this.anchor}, 
            ACTION: ${action}, 
            highly detailed, ray-traced reflections, depth of field, 
            anamorphic lens, film grain, color graded
        `.trim();
    }
    
    getSeed() {
        return this.baseSeed + Math.floor(Math.random() * 100);
    }
    
    getName() { return this.dna.ID; }
}
