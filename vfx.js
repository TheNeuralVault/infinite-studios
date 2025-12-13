/**
 * ARTIFACT: CSS GLITCH CONTROLLER
 * Protocol: Lightweight DOM Manipulation
 */

export class VFX {
    constructor() {
        this.img = document.getElementById('sceneImg');
    }

    trigger() {
        // Add the chaotic CSS class
        this.img.classList.add('glitch-active');
        
        // Random duration (100ms to 300ms)
        const duration = 100 + Math.random() * 200;
        
        setTimeout(() => {
            this.img.classList.remove('glitch-active');
        }, duration);
    }
}
