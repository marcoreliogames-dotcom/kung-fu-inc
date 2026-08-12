/* ========================================
   KUNG FU INC. — Enemy System
   Cleaning machines that attack the player
   ======================================== */

class Enemy {
    constructor(x, y, type = 0) {
        this.x = x;
        this.y = y;
        this.type = type; // 0 = vacuum, 1 = washer, 2 = duster
        this.width = 16;
        this.height = 14;
        this.vx = (Math.random() - 0.5) * 40;
        this.vy = 0;
        this.hp = 1;
        this.maxHp = 1;
        this.active = true;
        this.hitFlash = 0;
        this.animTime = 0;

        // Type-specific behavior
        switch(type) {
            case 0: // vacuum - moves toward player
                this.speed = 40;
                this.scoreValue = 50;
                break;
            case 1: // washer - bounces
                this.speed = 60;
                this.vy = -100; // initial bounce
                this.scoreValue = 100;
                this.hp = 2;
                this.maxHp = 2;
                break;
            case 2: // duster - hovers and dives
                this.speed = 30;
                this.hoverY = y;
                this.scoreValue = 150;
                this.hp = 1;
                break;
        }
    }

    update(dt, player, gameWidth, gameHeight) {
        this.animTime += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        switch(this.type) {
            case 0: // Vacuum - chase player horizontally
                const dx = player.x - this.x;
                if (Math.abs(dx) > 5) {
                    this.x += Math.sign(dx) * this.speed * dt;
                }
                break;

            case 1: // Washer - bounce around
                this.vy += 500 * dt;
                this.y += this.vy * dt;
                this.x += this.vx * dt;

                // Bounce off ground
                const groundY = gameHeight - 28;
                if (this.y + this.height >= groundY) {
                    this.y = groundY - this.height;
                    this.vy = -150 - Math.random() * 50;
                    this.vx = (Math.random() - 0.5) * 80;
                }
                // Bounce off walls
                if (this.x <= 0 || this.x >= gameWidth - this.width) {
                    this.vx *= -1;
                    this.x = Math.max(0, Math.min(gameWidth - this.width, this.x));
                }
                break;

            case 2: // Duster - hover and dive
                this.y = this.hoverY + Math.sin(this.animTime * 3) * 8;
                this.x += Math.cos(this.animTime * 0.8) * this.speed * dt;
                if (this.x < 0) this.x = 0;
                if (this.x > gameWidth - this.width) this.x = gameWidth - this.width;

                // Dive attack when player is close
                const distToPlayer = Math.abs(player.x - this.x);
                if (distToPlayer < 60 && this.animTime % 3 < 0.1) {
                    this.y += 40 * dt; // quick dive
                }
                break;
        }
    }

    takeDamage(damage = 1) {
        this.hp -= damage;
        this.hitFlash = 0.1;
        if (this.hp <= 0) {
            this.active = false;
            AudioSystem.destroy();
            return true;
        }
        return false;
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    draw(ctx) {
        const sprite = ENEMY_SPRITES[this.type] || MACHINE_VACUUM;

        if (this.hitFlash > 0) {
            // White flash when hit
            ctx.globalAlpha = 1;
            // Draw all-white version
            ctx.save();
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 6;
            drawSprite(ctx, sprite, this.x, this.y);
            ctx.restore();
        } else {
            // Slight hover animation
            const bob = Math.sin(this.animTime * 4) * 1;
            drawSprite(ctx, sprite, this.x, this.y + bob);
        }

        // Draw HP bar for multi-hp enemies
        if (this.maxHp > 1) {
            const barW = 14;
            const barH = 2;
            const barX = this.x + 1;
            const barY = this.y - 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = this.hp > 1 ? '#27ae60' : '#e74c3c';
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
        }
    }
}

// Enemy manager
class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3.0; // seconds
        this.maxEnemies = 5;
    }

    update(dt, player, gameWidth, gameHeight, level) {
        // Spawn enemies
        this.spawnTimer += dt;
        this.spawnInterval = Math.max(1.0, 3.5 - level * 0.15);
        this.maxEnemies = Math.min(10, 3 + Math.floor(level / 2));

        if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawn(gameWidth, gameHeight, level);
            this.spawnTimer = 0;
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, player, gameWidth, gameHeight);

            // Remove inactive
            if (!e.active) {
                this.enemies.splice(i, 1);
            }
        }
    }

    spawn(gameWidth, gameHeight, level) {
        const type = Math.floor(Math.random() * Math.min(3, 1 + Math.floor(level / 3)));
        const x = Math.random() * (gameWidth - 16);
        const y = type === 2 ? 30 + Math.random() * 50 : 30;

        this.enemies.push(new Enemy(x, y, type));
    }

    // Check collision with player attack
    checkAttacks(attackHitbox, particles, onKill) {
        if (!attackHitbox) return;

        for (const e of this.enemies) {
            if (!e.active) continue;
            if (e.hitFlash > 0) continue; // can't hit again while flashing

            const hb = e.getHitbox();
            if (attackHitbox.x < hb.x + hb.width &&
                attackHitbox.x + attackHitbox.width > hb.x &&
                attackHitbox.y < hb.y + hb.height &&
                attackHitbox.y + attackHitbox.height > hb.y) {

                const killed = e.takeDamage(1);
                particles.hitSpark(hb.x + hb.width / 2, hb.y + hb.height / 2);

                if (killed) {
                    particles.explode(e.x + e.width / 2, e.y + e.height / 2, PALETTE[11], 12);
                    if (onKill) onKill(e);
                }
            }
        }
    }

    // Check collision with player
    checkPlayerCollision(player, onHit) {
        if (player.invuln > 0 || player.state === PLAYER_STATES.DEAD) return;

        for (const e of this.enemies) {
            if (!e.active) continue;
            const hb = e.getHitbox();
            if (player.x < hb.x + hb.width &&
                player.x + player.width > hb.x &&
                player.y < hb.y + hb.height &&
                player.y + player.height > hb.y) {
                if (onHit) onHit(e);
                break;
            }
        }
    }

    clear() {
        this.enemies = [];
    }
}
