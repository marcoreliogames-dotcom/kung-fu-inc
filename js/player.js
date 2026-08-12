/* ========================================
   KUNG FU INC. — Player Character
   ======================================== */

const PLAYER_STATES = {
    IDLE: 'idle',
    WALKING: 'walking',
    PUNCHING: 'punching',
    KICKING: 'kicking',
    JUMPING: 'jumping',
    HIT: 'hit',
    DEAD: 'dead'
};

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 24;
        this.speed = 80; // pixels per second
        this.state = PLAYER_STATES.IDLE;
        this.facing = 1; // 1 = right, -1 = left
        this.hp = 5;
        this.maxHp = 5;

        // Animation
        this.animTime = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.actionTimer = 0; // timer for punch/kick animation
        this.actionDuration = 0.25; // seconds

        // Physics
        this.vy = 0;
        this.onGround = true;
        this.jumpPower = -220;
        this.gravity = 600;

        // Invulnerability after hit
        this.invuln = 0;
        this.invulnDuration = 1.0;

        // Attack hitbox
        this.attackHitbox = null;
        this.hasDealtDamage = false;
    }

    update(dt, keys, gameWidth, gameHeight, blocks) {
        this.animTime += dt;

        // Decrement timers
        if (this.invuln > 0) this.invuln -= dt;
        if (this.actionTimer > 0) {
            this.actionTimer -= dt;
            if (this.actionTimer <= 0) {
                this.state = this.onGround ? PLAYER_STATES.IDLE : PLAYER_STATES.JUMPING;
                this.attackHitbox = null;
                this.hasDealtDamage = false;
            }
        }

        // Handle input
        let moving = false;

        if (this.state !== PLAYER_STATES.PUNCHING &&
            this.state !== PLAYER_STATES.KICKING &&
            this.state !== PLAYER_STATES.HIT &&
            this.state !== PLAYER_STATES.DEAD) {

            // Move left
            if (keys.left) {
                this.x -= this.speed * dt;
                this.facing = -1;
                moving = true;
                if (this.onGround) this.state = PLAYER_STATES.WALKING;
            }

            // Move right
            if (keys.right) {
                this.x += this.speed * dt;
                this.facing = 1;
                moving = true;
                if (this.onGround) this.state = PLAYER_STATES.WALKING;
            }

            // Jump
            if (keys.jump && this.onGround) {
                this.vy = this.jumpPower;
                this.onGround = false;
                this.state = PLAYER_STATES.JUMPING;
                AudioSystem.jump();
            }

            // Punch
            if (keys.punch && this.onGround) {
                this.state = PLAYER_STATES.PUNCHING;
                this.actionTimer = this.actionDuration;
                this.hasDealtDamage = false;
                this.createAttackHitbox('punch');
                AudioSystem.punch();
                keys.punch = false; // consume
            }

            // Kick
            if (keys.kick && this.onGround) {
                this.state = PLAYER_STATES.KICKING;
                this.actionTimer = this.actionDuration;
                this.hasDealtDamage = false;
                this.createAttackHitbox('kick');
                AudioSystem.kick();
                keys.kick = false; // consume
            }

            // Jumping punch
            if (keys.punch && !this.onGround) {
                this.state = PLAYER_STATES.PUNCHING;
                this.actionTimer = this.actionDuration;
                this.hasDealtDamage = false;
                this.createAttackHitbox('punch');
                AudioSystem.punch();
                keys.punch = false;
            }
        }

        // Apply gravity
        if (!this.onGround) {
            this.vy += this.gravity * dt;
            this.y += this.vy * dt;
        }

        // Check ground collision (bottom of play area)
        const groundY = gameHeight - 24; // ground level
        if (this.y >= groundY) {
            if (!this.onGround) {
                ParticleSystemInst.dust(this.x + this.width / 2, this.y + this.height);
            }
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
            if (this.state === PLAYER_STATES.JUMPING) {
                this.state = moving ? PLAYER_STATES.WALKING : PLAYER_STATES.IDLE;
            }
        }

        // Clamp to screen bounds
        this.x = Math.max(0, Math.min(gameWidth - this.width, this.x));

        // Check block collision (landing on blocks)
        if (!this.onGround && this.vy > 0) {
            for (const block of blocks) {
                if (!block.landed) continue;
                if (this.x + this.width > block.x && this.x < block.x + block.width) {
                    if (this.y + this.height >= block.y && this.y + this.height <= block.y + block.height + 10 && this.vy > 0) {
                        this.y = block.y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        if (this.state === PLAYER_STATES.JUMPING) {
                            this.state = moving ? PLAYER_STATES.WALKING : PLAYER_STATES.IDLE;
                        }
                        ParticleSystemInst.dust(this.x + this.width / 2, this.y + this.height);
                        break;
                    }
                }
            }
        }

        // Walking animation
        if (this.state === PLAYER_STATES.WALKING) {
            this.walkTimer += dt;
            if (this.walkTimer > 0.15) {
                this.walkFrame = (this.walkFrame + 1) % 2;
                this.walkTimer = 0;
            }
        } else {
            this.walkFrame = 0;
        }

        // Idle if not moving and on ground
        if (!moving && this.onGround &&
            this.state !== PLAYER_STATES.PUNCHING &&
            this.state !== PLAYER_STATES.KICKING &&
            this.state !== PLAYER_STATES.HIT &&
            this.state !== PLAYER_STATES.DEAD) {
            this.state = PLAYER_STATES.IDLE;
        }

        // Update attack hitbox
        if (this.attackHitbox) {
            this.updateAttackHitbox();
        }
    }

    createAttackHitbox(type) {
        const range = type === 'punch' ? 14 : 18;
        if (this.facing === 1) {
            this.attackHitbox = {
                x: this.x + this.width,
                y: this.y + 6,
                width: range,
                height: type === 'kick' ? 16 : 10,
                type: type
            };
        } else {
            this.attackHitbox = {
                x: this.x - range,
                y: this.y + 6,
                width: range,
                height: type === 'kick' ? 16 : 10,
                type: type
            };
        }
    }

    updateAttackHitbox() {
        if (!this.attackHitbox) return;
        const range = this.attackHitbox.type === 'punch' ? 14 : 18;
        if (this.facing === 1) {
            this.attackHitbox.x = this.x + this.width;
        } else {
            this.attackHitbox.x = this.x - range;
        }
    }

    takeDamage() {
        if (this.invuln > 0) return false;
        this.hp--;
        this.invuln = this.invulnDuration;
        AudioSystem.hit();
        if (this.hp <= 0) {
            this.state = PLAYER_STATES.DEAD;
            AudioSystem.gameOver();
        } else {
            this.state = PLAYER_STATES.HIT;
            setTimeout(() => {
                if (this.state === PLAYER_STATES.HIT) {
                    this.state = PLAYER_STATES.IDLE;
                }
            }, 300);
        }
        return true;
    }

    draw(ctx) {
        // Flicker when invulnerable
        if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) {
            return;
        }

        let sprite;
        switch (this.state) {
            case PLAYER_STATES.WALKING:
                sprite = this.walkFrame === 0 ? PLAYER_WALK1 : PLAYER_WALK2;
                break;
            case PLAYER_STATES.PUNCHING:
                sprite = PLAYER_PUNCH;
                break;
            case PLAYER_STATES.KICKING:
                sprite = PLAYER_KICK;
                break;
            case PLAYER_STATES.JUMPING:
                sprite = PLAYER_JUMP;
                break;
            case PLAYER_STATES.HIT:
                sprite = PLAYER_IDLE;
                break;
            case PLAYER_STATES.DEAD:
                sprite = PLAYER_IDLE;
                break;
            default:
                sprite = PLAYER_IDLE;
        }

        if (this.facing === 1) {
            drawSprite(ctx, sprite, this.x, this.y);
        } else {
            drawSpriteFlipped(ctx, sprite, this.x, this.y);
        }

        // Draw attack hitbox (for debug)
        // if (this.attackHitbox) {
        //     ctx.strokeStyle = '#f00';
        //     ctx.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
        // }
    }
}
