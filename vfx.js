export class VFX {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        this.canvas.style.position = 'fixed';
        this.canvas.style.inset = '0';
        this.canvas.style.zIndex = '15';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.mixBlendMode = 'screen';
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    trigger() {
        let frame = 0;
        const loop = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (frame > 10) return; // Stop quickly

            for(let i=0; i<6; i++) { // Fewer particles for mobile speed
                const h = Math.random() * 60;
                const y = Math.random() * this.canvas.height;
                const w = this.canvas.width;
                this.ctx.fillStyle = Math.random() > 0.5 
                    ? `rgba(0, 243, 255, 0.3)` 
                    : `rgba(255, 0, 85, 0.3)`;
                this.ctx.fillRect(0, y, w, h);
            }
            frame++;
            requestAnimationFrame(loop);
        };
        loop();
    }
            }
