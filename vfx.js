/**
 * ARTIFACT: PLATINUM VFX
 * Protocol: Canvas Overlay Glitch
 */

export class VFX {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        
        // Styling
        this.canvas.style.position = 'fixed';
        this.canvas.style.inset = '0';
        this.canvas.style.zIndex = '15';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.mixBlendMode = 'screen'; // Cyberpunk blend
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    trigger() {
        let frame = 0;
        const loop = () => {
            // Clear previous frame
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (frame > 12) return; // Stop after 12 frames (~0.2s)

            // Draw Digital Artifacts
            for(let i=0; i<8; i++) {
                const h = Math.random() * 40;
                const y = Math.random() * this.canvas.height;
                const w = this.canvas.width;
                
                // Color Shift (Cyan/Red)
                this.ctx.fillStyle = Math.random() > 0.5 
                    ? `rgba(0, 243, 255, ${Math.random() * 0.4})` 
                    : `rgba(255, 0, 85, ${Math.random() * 0.4})`;
                
                this.ctx.fillRect(0, y, w, h);
            }
            
            frame++;
            requestAnimationFrame(loop);
        };
        loop();
    }
}
