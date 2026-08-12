/* ========================================
   KUNG FU INC. — Tetris Block System
   Cleaning machines fall as Tetris-style blocks
   Player must destroy them before they stack up
   ======================================== */

// Tetris piece shapes
const TETROMINOES = {
    I: { shape: [[1,1,1,1]], color: 17, size: 4 },
    O: { shape: [[1,1],[1,1]], color: 18, size: 2 },
    T: { shape: [[0,1,0],[1,1,1]], color: 19, size: 3 },
    S: { shape: [[0,1,1],[1,1,0]], color: 20, size: 3 },
    Z: { shape: [[1,1,0],[0,1,1]], color: 21, size: 3 },
    J: { shape: [[1,0,0],[1,1,1]], color: 22, size: 3 },
    L: { shape: [[0,0,1],[1,1,1]], color: 23, size: 3 },
};

const PIECE_TYPES = Object.keys(TETROMINOES);

class Block {
    constructor(x, y, shape, color) {
        this.x = x;
        this.y = y;
        this.shape = shape;
        this.color = color;
        this.cellSize = 16;
        this.width = shape[0].length * this.cellSize;
        this.height = shape.length * this.cellSize;
        this.vy = 30; // fall speed
        this.landed = false;
        this.hp = 1;
        this.maxHp = 1;
        this.flash = 0;
    }

    update(dt, gameWidth, gameHeight, stackedBlocks) {
        if (this.landed) return;

        this.y += this.vy * dt;
        if (this.flash > 0) this.flash -= dt;

        // Check collision with stacked blocks
        for (const block of stackedBlocks) {
            if (!block.landed) continue;
            if (this.collidesWith(block)) {
                this.y = block.y - this.height;
                this.landed = true;
                AudioSystem.blockLand();
                return;
            }
        }

        // Check ground collision
        const groundY = gameHeight - 24;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.landed = true;
            AudioSystem.blockLand();
        }
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    takeDamage(damage = 1) {
        this.hp -= damage;
        this.flash = 0.1;
        return this.hp <= 0;
    }

    getCells() {
        const cells = [];
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    cells.push({
                        x: this.x + col * this.cellSize,
                        y: this.y + row * this.cellSize,
                        w: this.cellSize,
                        h: this.cellSize
                    });
                }
            }
        }
        return cells;
    }

    draw(ctx) {
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    const px = this.x + col * this.cellSize;
                    const py = this.y + row * this.cellSize;

                    // Block fill
                    ctx.fillStyle = this.flash > 0 ? '#fff' : PALETTE[this.color];
                    ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);

                    // Border
                    ctx.fillStyle = this.flash > 0 ? '#ff0' : 'rgba(0,0,0,0.3)';
                    ctx.strokeStyle = this.flash > 0 ? '#ff0' : 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 0.5, py + 0.5, this.cellSize - 1, this.cellSize - 1);

                    // Inner highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(px + 2, py + 2, this.cellSize - 6, 2);
                    ctx.fillRect(px + 2, py + 2, 2, this.cellSize - 6);
                }
            }
        }
    }

    // Draw a mini machine face on each block cell
    drawMachines(ctx) {
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    const px = this.x + col * this.cellSize;
                    const py = this.y + row * this.cellSize;
                    const cs = this.cellSize;

                    // Machine face details
                    ctx.fillStyle = '#e74c3c'; // red eyes
                    ctx.fillRect(px + 4, py + 5, 2, 2);
                    ctx.fillRect(px + cs - 6, py + 5, 2, 2);

                    // Mouth
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.fillRect(px + 5, py + 10, cs - 10, 2);

                    // Antenna
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(px + cs/2 - 1, py + 2, 2, 3);
                }
            }
        }
    }
}

class TetrisSystem {
    constructor() {
        this.activeBlock = null;
        this.landedBlocks = [];
        this.spawnTimer = 0;
        this.spawnInterval = 4.0; // seconds between blocks
        this.fallSpeed = 30;
        this.level = 1;
        this.rowsCleared = 0;
    }

    update(dt, gameWidth, gameHeight, player) {
        // Spawn new blocks
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval && !this.activeBlock) {
            this.spawnBlock(gameWidth);
            this.spawnTimer = 0;
        }

        // Update active block
        if (this.activeBlock) {
            this.activeBlock.vy = this.fallSpeed;
            this.activeBlock.update(dt, gameWidth, gameHeight, this.landedBlocks);

            if (this.activeBlock.landed) {
                this.landedBlocks.push(this.activeBlock);
                this.activeBlock = null;

                // Check for full rows
                this.checkRows(gameWidth, gameHeight);
            }
        }

        // Update landed blocks
        for (let i = this.landedBlocks.length - 1; i >= 0; i--) {
            const block = this.landedBlocks[i];
            if (block.flash > 0) block.flash -= dt;

            // Remove destroyed blocks
            if (block.hp <= 0) {
                this.landedBlocks.splice(i, 1);
            }
        }

        // Check if any block reaches the top — game over trigger
        for (const block of this.landedBlocks) {
            if (block.y <= 0) {
                return 'gameover';
            }
        }
    }

    spawnBlock(gameWidth) {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        const piece = TETROMINOES[type];
        const x = Math.floor(Math.random() * (gameWidth - piece.shape[0].length * 16));
        this.activeBlock = new Block(x, 0, piece.shape, piece.color);
        this.activeBlock.hp = type === 'O' ? 2 : 1;
        this.activeBlock.maxHp = this.activeBlock.hp;
    }

    checkRows(gameWidth, gameHeight) {
        const groundY = gameHeight - 24;
        const cellSize = 16;
        const numRows = Math.floor((groundY) / cellSize);
        const numCols = Math.floor(gameWidth / cellSize);

        // Build a grid of filled cells
        const grid = Array(numRows).fill(null).map(() => Array(numCols).fill(null));

        for (const block of this.landedBlocks) {
            const cells = block.getCells();
            for (const cell of cells) {
                const row = Math.floor(cell.y / cellSize);
                const col = Math.floor(cell.x / cellSize);
                if (row >= 0 && row < numRows && col >= 0 && col < numCols) {
                    grid[row][col] = block;
                }
            }
        }

        // Check for full rows
        const fullRows = [];
        for (let row = 0; row < numRows; row++) {
            if (grid[row].every(cell => cell !== null)) {
                fullRows.push(row);
            }
        }

        // Clear full rows
        if (fullRows.length > 0) {
            AudioSystem.clearRow();
            for (const row of fullRows) {
                for (let col = 0; col < numCols; col++) {
                    const block = grid[row][col];
                    if (block) {
                        block.hp = 0;
                        ParticleSystemInst.explode(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, PALETTE[block.color], 8);
                    }
                }
            }
            this.rowsCleared += fullRows.length;

            // Move blocks down to fill gaps
            // (Simple approach: remove cleared, then let blocks fall)
            this.landedBlocks = this.landedBlocks.filter(b => b.hp > 0);

            // Drop floating blocks
            for (const block of this.landedBlocks) {
                let shouldFall = true;
                while (shouldFall) {
                    const testBlock = new Block(block.x, block.y + 2, block.shape, block.color);
                    let collides = false;
                    for (const other of this.landedBlocks) {
                        if (other === block) continue;
                        if (testBlock.collidesWith(other)) {
                            collides = true;
                            break;
                        }
                    }
                    if (!collides && testBlock.y + testBlock.height < groundY) {
                        block.y += 2;
                    } else {
                        shouldFall = false;
                    }
                }
            }
        }

        return fullRows.length;
    }

    // Check player attacks against blocks
    checkAttacks(attackHitbox, particles, onBlockDestroyed) {
        if (!attackHitbox) return;

        for (const block of this.landedBlocks) {
            if (block.hp <= 0) continue;
            if (block.flash > 0) continue;

            const cells = block.getCells();
            for (const cell of cells) {
                if (attackHitbox.x < cell.x + cell.w &&
                    attackHitbox.x + attackHitbox.width > cell.x &&
                    attackHitbox.y < cell.y + cell.h &&
                    attackHitbox.y + attackHitbox.height > cell.y) {

                    const destroyed = block.takeDamage(1);
                    particles.hitSpark(cell.x + cell.w / 2, cell.y + cell.h / 2);

                    if (destroyed) {
                        particles.explode(block.x + block.width / 2, block.y + block.height / 2, PALETTE[block.color], 10);
                        if (onBlockDestroyed) onBlockDestroyed(block);
                    }
                    break;
                }
            }
        }

        // Also check the active (falling) block
        if (this.activeBlock && this.activeBlock.flash <= 0) {
            const cells = this.activeBlock.getCells();
            for (const cell of cells) {
                if (attackHitbox.x < cell.x + cell.w &&
                    attackHitbox.x + attackHitbox.width > cell.x &&
                    attackHitbox.y < cell.y + cell.h &&
                    attackHitbox.y + attackHitbox.height > cell.y) {

                    const destroyed = this.activeBlock.takeDamage(1);
                    particles.hitSpark(cell.x + cell.w / 2, cell.y + cell.h / 2);

                    if (destroyed) {
                        particles.explode(this.activeBlock.x + this.activeBlock.width / 2, this.activeBlock.y + this.activeBlock.height / 2, PALETTE[this.activeBlock.color], 10);
                        if (onBlockDestroyed) onBlockDestroyed(this.activeBlock);
                        this.activeBlock = null;
                    }
                    break;
                }
            }
        }
    }

    // Check collision with player (blocks damage player)
    checkPlayerCollision(player, onHit) {
        if (player.invuln > 0 || player.state === PLAYER_STATES.DEAD) return;

        // Check falling block
        if (this.activeBlock) {
            const cells = this.activeBlock.getCells();
            for (const cell of cells) {
                if (player.x < cell.x + cell.w &&
                    player.x + player.width > cell.x &&
                    player.y < cell.y + cell.h &&
                    player.y + player.height > cell.y) {
                    if (onHit) onHit(this.activeBlock);
                    return;
                }
            }
        }

        // Check landed blocks (only if player is touching the side, not standing on top)
        for (const block of this.landedBlocks) {
            if (block.hp <= 0) continue;
            const cells = block.getCells();
            for (const cell of cells) {
                // Only damage if hitting the side, not standing on top
                if (player.x < cell.x + cell.w &&
                    player.x + player.width > cell.x &&
                    player.y < cell.y + cell.h - 4 && // slight offset to allow standing
                    player.y + player.height > cell.y + 4) {
                    // Check it's not the block the player is standing on
                    if (Math.abs((player.y + player.height) - cell.y) < 4) continue;
                    if (onHit) onHit(block);
                    return;
                }
            }
        }
    }

    setLevel(level) {
        this.level = level;
        this.fallSpeed = 30 + level * 8;
        this.spawnInterval = Math.max(1.5, 4.0 - level * 0.15);
    }

    getLandedBlocksArray() {
        return this.landedBlocks;
    }

    draw(ctx) {
        // Draw landed blocks
        for (const block of this.landedBlocks) {
            block.draw(ctx);
            block.drawMachines(ctx);
        }

        // Draw active (falling) block
        if (this.activeBlock) {
            this.activeBlock.draw(ctx);
            this.activeBlock.drawMachines(ctx);
        }
    }

    clear() {
        this.activeBlock = null;
        this.landedBlocks = [];
    }
}
