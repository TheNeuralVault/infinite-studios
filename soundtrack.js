/**
 * ARTIFACT: NEURAL SYNTH
 * Protocol: Web Audio API Procedural Score
 */

export class Soundtrack {
    constructor() {
        this.ctx = null;
        this.filter = null;
    }

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Bus
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.0;
        this.master.connect(this.ctx.destination);

        // Underwater Filter
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 200;
        this.filter.connect(this.master);
    }

    startDrone() {
        if (!this.ctx) this.init();
        
        // The "Blade Runner" Chord (Root, 5th, Octave)
        const freqs = [55, 82.41, 110, 164.81]; 
        
        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth'; // Gritty sound
            osc.frequency.value = f;
            
            // LFO for movement (The "Throb")
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 0.1 + Math.random() * 0.2;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 150;
            lfo.connect(lfoGain);
            lfoGain.connect(this.filter.frequency);
            
            osc.connect(this.filter);
            osc.start();
            lfo.start();
        });

        // Slow Fade In
        this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 10);
    }

    swell() {
        if(!this.ctx) return;
        // Open the filter briefly on scene change
        this.filter.frequency.setTargetAtTime(700, this.ctx.currentTime, 0.5);
        setTimeout(() => {
            this.filter.frequency.setTargetAtTime(200, this.ctx.currentTime, 4);
        }, 500);
    }
}
