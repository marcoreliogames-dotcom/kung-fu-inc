/* ========================================
   KUNG FU INC. — Audio System
   Web Audio API chiptune-style sound effects
   ======================================== */

const AudioSystem = {
    ctx: null,
    enabled: true,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            this.enabled = false;
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Play a simple tone
    tone(freq, duration, type = 'square', volume = 0.15) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Quick sweep (for effects)
    sweep(fromFreq, toFreq, duration, type = 'square', volume = 0.15) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(fromFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(toFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Sound: punch
    punch() {
        this.sweep(400, 120, 0.08, 'square', 0.12);
        setTimeout(() => this.tone(80, 0.05, 'sawtooth', 0.08), 40);
    },

    // Sound: kick
    kick() {
        this.sweep(200, 50, 0.12, 'sawtooth', 0.15);
    },

    // Sound: jump
    jump() {
        this.sweep(300, 600, 0.1, 'square', 0.1);
    },

    // Sound: enemy destroyed
    destroy() {
        this.sweep(800, 100, 0.15, 'square', 0.12);
        setTimeout(() => this.tone(150, 0.1, 'sawtooth', 0.1), 50);
    },

    // Sound: block lands
    blockLand() {
        this.tone(150, 0.06, 'square', 0.1);
    },

    // Sound: row cleared
    clearRow() {
        this.tone(523, 0.08, 'square', 0.12);
        setTimeout(() => this.tone(659, 0.08, 'square', 0.12), 60);
        setTimeout(() => this.tone(784, 0.12, 'square', 0.12), 120);
    },

    // Sound: game over
    gameOver() {
        this.tone(440, 0.15, 'square', 0.15);
        setTimeout(() => this.tone(330, 0.15, 'square', 0.15), 150);
        setTimeout(() => this.tone(220, 0.3, 'square', 0.15), 300);
    },

    // Sound: menu select
    select() {
        this.tone(660, 0.05, 'square', 0.1);
        setTimeout(() => this.tone(880, 0.05, 'square', 0.1), 30);
    },

    // Sound: move
    move() {
        this.tone(200, 0.02, 'square', 0.05);
    },

    // Sound: hit taken
    hit() {
        this.sweep(100, 50, 0.2, 'sawtooth', 0.2);
    },

    // Sound: level up
    levelUp() {
        this.tone(523, 0.1, 'square', 0.12);
        setTimeout(() => this.tone(659, 0.1, 'square', 0.12), 80);
        setTimeout(() => this.tone(784, 0.1, 'square', 0.12), 160);
        setTimeout(() => this.tone(1047, 0.15, 'square', 0.12), 240);
    },

    // Background music loop (simple chiptune)
    musicTimer: null,
    musicNotes: [
        262, 330, 392, 330, 262, 330, 392, 523,
        392, 330, 262, 330, 392, 330, 262, 196,
    ],
    musicIndex: 0,
    musicTempo: 200, // ms per note

    startMusic() {
        if (!this.enabled || !this.ctx) return;
        this.stopMusic();
        this.musicTimer = setInterval(() => {
            if (!this.enabled) return;
            const note = this.musicNotes[this.musicIndex % this.musicNotes.length];
            this.tone(note, 0.15, 'square', 0.04);
            this.musicIndex++;
        }, this.musicTempo);
    },

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    },

    setMusicTempo(bpm) {
        this.musicTempo = Math.floor(60000 / bpm / 2);
    }
};
