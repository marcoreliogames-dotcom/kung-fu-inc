/* ========================================
   KUNG FU INC. — Main Game Engine
   ======================================== */

// Global instances
const ParticleSystemInst = new ParticleSystem();

const Game = {
    canvas: null,
    ctx: null,
    width: 320,
    height: 480,

    // Game state
    state: 'start', // 'start', 'playing', 'paused', 'gameover', 'howto'
    score: 0,
    highScore: 0,
    level: 1,
    combo: 0,
    comboTimer: 0,

    // Game objects
    player: null,
    enemyManager: null,
    tetrisSystem: null,

    // Timing
    lastTime: 0,
    gameTime: 0,
    screenShake: 0,
    flashScreen: 0,

    // Input
    keys: {
        left: false,
        right: false,
        punch: false,
        kick: false,
        jump: false
    },

    // Background animation
    bgOffset: 0,
    starsBg: [],

    // Difficulty
    levelProgress: 0,
    levelGoal: 500, // points needed per level

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Load high score
        this.highScore = parseInt(localStorage.getItem('kungfuinc_highscore') || '0');
        document.getElementById('hs-value').textContent = this.highScore;

        // Initialize audio on first interaction
        AudioSystem.init();

        // Generate background stars
        for (let i = 0; i < 30; i++) {
            this.starsBg.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() < 0.3 ? 2 : 1,
                speed: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        // Setup input listeners
        this.setupInput();

        // Setup UI buttons
        this.setupUI();

        // Start render loop
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    },

    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.punch = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.kick = true;
                    e.preventDefault();
                    break;
                case ' ':
                    this.keys.jump = true;
                    e.preventDefault();
                    break;
                case 'p':
                case 'P':
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keys.punch = false;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.keys.kick = false;
                    break;
                case ' ':
                    this.keys.jump = false;
                    break;
            }
        });

        // Mobile controls
        const setupTouch = (id, key, isAction = false) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (isAction) {
                    setTimeout(() => { this.keys[key] = false; }, 50);
                } else {
                    this.keys[key] = false;
                }
            });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                if (isAction) {
                    setTimeout(() => { this.keys[key] = false; }, 50);
                } else {
                    this.keys[key] = false;
                }
            });
        };

        setupTouch('btn-left', 'left');
        setupTouch('btn-right', 'right');
        setupTouch('btn-punch', 'punch', true);
        setupTouch('btn-kick', 'kick', true);
        setupTouch('btn-jump', 'jump', true);

        // Show mobile controls on touch devices
        if ('ontouchstart' in window) {
            document.getElementById('mobile-controls').classList.add('show');
        }
    },

    setupUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            AudioSystem.init();
            AudioSystem.resume();
            AudioSystem.select();
            this.startGame();
        });

        document.getElementById('btn-howto').addEventListener('click', () => {
            AudioSystem.select();
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('howto-screen').classList.remove('hidden');
            this.state = 'howto';
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            AudioSystem.select();
            document.getElementById('howto-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            this.state = 'start';
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            AudioSystem.select();
            this.startGame();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            AudioSystem.select();
            document.getElementById('gameover-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            this.state = 'start';
            this.updateHighScoreDisplay();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            AudioSystem.select();
            this.togglePause();
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            AudioSystem.select();
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            this.state = 'start';
            this.updateHighScoreDisplay();
        });
    },

    startGame() {
        // Hide all overlays
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('howto-screen').classList.add('hidden');

        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.gameTime = 0;
        this.levelProgress = 0;
        this.levelGoal = 500;
        this.screenShake = 0;
        this.flashScreen = 0;

        // Create game objects
        this.player = new Player(this.width / 2 - 8, this.height - 48);
        this.enemyManager = new EnemyManager();
        this.tetrisSystem = new TetrisSystem();
        this.tetrisSystem.setLevel(this.level);

        // Clear particles
        ParticleSystemInst.clear();

        // Reset keys
        this.keys = { left: false, right: false, punch: false, kick: false, jump: false };

        // Start music
        AudioSystem.setMusicTempo(100 + this.level * 5);
        AudioSystem.startMusic();
    },

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
            AudioSystem.stopMusic();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
            AudioSystem.startMusic();
        }
    },

    gameOver() {
        this.state = 'gameover';
        AudioSystem.stopMusic();
        AudioSystem.gameOver();

        // Update high score
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
            localStorage.setItem('kungfuinc_highscore', this.highScore.toString());
        }

        // Show game over screen
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-hs').textContent = this.highScore;
        document.getElementById('new-record').classList.toggle('hidden', !isNewRecord);
        document.getElementById('gameover-screen').classList.remove('hidden');
    },

    addScore(points) {
        // Combo multiplier
        const multiplier = 1 + this.combo * 0.1;
        const finalPoints = Math.floor(points * multiplier);
        this.score += finalPoints;
        this.levelProgress += finalPoints;

        // Level up?
        if (this.levelProgress >= this.levelGoal) {
            this.levelUp();
        }
    },

    levelUp() {
        this.level++;
        this.levelProgress = 0;
        this.levelGoal = 500 + this.level * 200;
        this.tetrisSystem.setLevel(this.level);
        AudioSystem.levelUp();
        this.flashScreen = 0.3;

        // Bonus: restore 1 HP
        if (this.player.hp < this.player.maxHp) {
            this.player.hp++;
        }

        ParticleSystemInst.addScorePopup(this.width / 2, this.height / 2, `LEVEL ${this.level}!`, '#f0a500');
    },

    addCombo() {
        this.combo++;
        this.comboTimer = 2.0; // combo resets after 2 seconds of no hits
    },

    updateHighScoreDisplay() {
        document.getElementById('hs-value').textContent = this.highScore;
    },

    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(dt);
        }

        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    },

    update(dt) {
        this.gameTime += dt;

        // Background scroll
        this.bgOffset += dt * 10;

        // Update background stars
        for (const star of this.starsBg) {
            star.y += star.speed;
            star.twinkle += dt * 3;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }

        // Screen shake
        if (this.screenShake > 0) {
            this.screenShake -= dt * 20;
        }

        // Flash screen
        if (this.flashScreen > 0) {
            this.flashScreen -= dt * 3;
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Update player
        const blocks = this.tetrisSystem.landedBlocks;
        this.player.update(dt, this.keys, this.width, this.height, blocks);

        // Update Tetris system
        const tetrisResult = this.tetrisSystem.update(dt, this.width, this.height, this.player);
        if (tetrisResult === 'gameover') {
            this.gameOver();
            return;
        }

        // Update enemies
        this.enemyManager.update(dt, this.player, this.width, this.height, this.level);

        // Check player attacks vs enemies
        this.enemyManager.checkAttacks(this.player.attackHitbox, ParticleSystemInst, (enemy) => {
            this.addScore(enemy.scoreValue);
            this.addCombo();
            this.screenShake = 3;
            ParticleSystemInst.addScorePopup(enemy.x + enemy.width / 2, enemy.y, `+${enemy.scoreValue}`, '#ff6b35');
        });

        // Check player attacks vs blocks
        this.tetrisSystem.checkAttacks(this.player.attackHitbox, ParticleSystemInst, (block) => {
            this.addScore(25);
            this.addCombo();
            this.screenShake = 2;
            ParticleSystemInst.addScorePopup(block.x + block.width / 2, block.y, `+25`, PALETTE[block.color]);
        });

        // Check enemy collisions with player
        this.enemyManager.checkPlayerCollision(this.player, (enemy) => {
            if (this.player.takeDamage()) {
                this.screenShake = 5;
                this.combo = 0;
            }
            if (this.player.state === PLAYER_STATES.DEAD) {
                this.gameOver();
            }
        });

        // Check block collisions with player
        this.tetrisSystem.checkPlayerCollision(this.player, () => {
            if (this.player.takeDamage()) {
                this.screenShake = 4;
                this.combo = 0;
            }
            if (this.player.state === PLAYER_STATES.DEAD) {
                this.gameOver();
            }
        });

        // Row cleared bonus
        if (this.tetrisSystem.rowsCleared > 0) {
            // Handled in tetris system
        }

        // Update particles
        ParticleSystemInst.update(dt);

        // Update music tempo with level
        AudioSystem.setMusicTempo(100 + this.level * 5);
    },

    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw background
        this.drawBackground(ctx);

        if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
            // Draw tetris blocks
            this.tetrisSystem.draw(ctx);

            // Draw enemies
            for (const enemy of this.enemyManager.enemies) {
                enemy.draw(ctx);
            }

            // Draw player
            this.player.draw(ctx);

            // Draw particles
            ParticleSystemInst.draw(ctx);

            // Draw HUD
            this.drawHUD(ctx);
        }

        ctx.restore();

        // Flash screen overlay
        if (this.flashScreen > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashScreen * 0.5})`;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw grid lines (subtle, for the Tetris play area)
        if (this.state === 'playing') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let x = 0; x < this.width; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height - 24);
                ctx.stroke();
            }
            for (let y = 0; y < this.height - 24; y += 16) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
        }
    },

    drawBackground(ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f0f1e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        for (const star of this.starsBg) {
            const twinkle = 0.5 + Math.sin(star.twinkle) * 0.5;
            ctx.globalAlpha = twinkle * 0.6;
            ctx.fillStyle = '#fff';
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        ctx.globalAlpha = 1;

        // Ground
        const groundY = this.height - 24;
        ctx.fillStyle = '#264653';
        ctx.fillRect(0, groundY, this.width, 24);
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(0, groundY, this.width, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, groundY + 3, this.width, 2);

        // Ground texture (bricks)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let x = 0; x < this.width; x += 16) {
            ctx.fillRect(x, groundY + 6, 1, 18);
        }
        for (let y = groundY + 6; y < this.height; y += 8) {
            ctx.fillRect(0, y, this.width, 1);
        }
    },

    drawHUD(ctx) {
        // Top bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.width, 32);

        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 8, 10);
        ctx.fillStyle = '#f0a500';
        ctx.fillText(this.score.toString().padStart(6, '0'), 8, 20);

        // Level
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('LV', this.width / 2, 10);
        ctx.fillStyle = '#2a9d8f';
        ctx.fillText(this.level.toString(), this.width / 2, 20);

        // HP
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText('HP', this.width - 8, 10);
        ctx.textAlign = 'left';
        for (let i = 0; i < this.player.maxHp; i++) {
            const hx = this.width - 40 + i * 8;
            ctx.fillStyle = i < this.player.hp ? '#e74c3c' : '#333';
            ctx.fillRect(hx, 14, 6, 6);
        }

        // Combo
        if (this.combo > 1) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f0a500';
            ctx.font = '10px "Press Start 2P", monospace';
            const alpha = Math.min(1, this.comboTimer / 2);
            ctx.globalAlpha = alpha;
            ctx.fillText(`x${this.combo} COMBO`, this.width / 2, 40);
            ctx.globalAlpha = 1;
        }

        // Level progress bar
        ctx.fillStyle = '#333';
        ctx.fillRect(0, this.height - 28, this.width, 4);
        ctx.fillStyle = '#2a9d8f';
        const progressW = (this.levelProgress / this.levelGoal) * this.width;
        ctx.fillRect(0, this.height - 28, progressW, 4);

        ctx.textAlign = 'left';
        ctx.font = '8px "Press Start 2P", monospace';
    }
};

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
