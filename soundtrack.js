export class Soundtrack {
    constructor() {
        this.ctx = null;
        this.filter = null;
    }

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.0;
        this.master.connect(this.ctx.destination);
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 200;
        this.filter.connect(this.master);
    }

    startDrone() {
        if (!this.ctx) this.init();
        
        // FORCE RESUME FOR ANDROID
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const freqs = [55, 82.41, 110]; 
        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 0.1;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 100;
            lfo.connect(lfoGain);
            lfoGain.connect(this.filter.frequency);
            osc.connect(this.filter);
            osc.start();
            lfo.start();
        });

        this.master.gain.setTargetAtTime(0.4, this.ctx.currentTime, 5);
    }

    swell() {
        if(!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        this.filter.frequency.setTargetAtTime(600, this.ctx.currentTime, 0.5);
        setTimeout(() => {
            this.filter.frequency.setTargetAtTime(200, this.ctx.currentTime, 4);
        }, 500);
    }
}
