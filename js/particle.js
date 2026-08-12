/* ========================================
   KUNG FU INC. — Particle System
   Visual effects for hits, explosions, etc.
   ======================================== */

class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size || 3;
        this.gravity = 0.15;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Explosion when an enemy is destroyed
    explode(x, y, color = '#ff6b35', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                0.5 + Math.random() * 0.3,
                2 + Math.random() * 3
            ));
        }
        // Add some sparks
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(
                x, y,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                '#fff',
                0.3,
                2
            ));
        }
    }

    // Hit spark when punching
    hitSpark(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                '#ff0',
                0.25,
                2
            ));
        }
    }

    // Dust when landing
    dust(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 16,
                y,
                (Math.random() - 0.5) * 2,
                -Math.random() * 1.5,
                '#aaa',
                0.3,
                2
            ));
        }
    }

    // Score popup text
    popups = [];

    addScorePopup(x, y, text, color = '#f0a500') {
        this.popups.push({
            x, y, text, color,
            life: 1.0,
            maxLife: 1.0,
            vy: -1
        });
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
        // Update popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) {
                this.popups.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
        // Draw score popups
        for (const p of this.popups) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        }
    }

    clear() {
        this.particles = [];
        this.popups = [];
    }
}
