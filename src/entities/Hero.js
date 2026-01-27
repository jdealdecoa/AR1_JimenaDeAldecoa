import { HeroBase } from './HeroBase.js';
import { Harpoon } from './weapons/Harpoon.js';
import { FixedHarpoon } from './weapons/FixedHarpoon.js';
import { Bullet } from './weapons/Bullet.js';
import { EVENTS } from '../core/events.js';
import { WEAPON_LEVELS, MAX_WEAPON_LEVEL } from './items/powerups/PowerUpWeapon.js';
import { SHIELD_CONFIG } from './items/powerups/PowerUpShield.js';

// tipos de arma
export const HERO_WEAPON = {
    HARPOON: 1,
    GUN: 2,
    FIXED_HARPOON: 3,
};

export class Hero extends HeroBase {
    constructor(scene, x, y, texture = 'player') {
        super(scene, x, y, texture);

        this.activeHarpoons = [];
        this.maxHarpoonsActive = 1;
        this.activeFixedHarpoon = null;
        this.isShooting = false;

        this.weaponType = HERO_WEAPON.HARPOON;

        // Sistema de vida e invencibilidad
        this.lives = 3;
        this.maxLives = 5;
        this.isInvulnerable = false;

        // Items system: score tracking
        this.score = 0;

        // Items system: power-up states (SIN SPEED)
        this.hasShield = false;
        this.shieldTimer = null;
        this.weaponLevel = 0;
        this.weaponStats = WEAPON_LEVELS[0];

        // keep shield tint always on
        this._shieldTintKeeper = null;

        this.createAnimations();

        // cambio de arma
        this.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.key4 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

        this.key1.on('down', () => this.setWeapon(HERO_WEAPON.HARPOON));
        this.key2.on('down', () => this.setWeapon(HERO_WEAPON.GUN));
        this.key3.on('down', () => this.setWeapon(HERO_WEAPON.FIXED_HARPOON));
        this.key4.on('down', () => {
            const newState = this.maxHarpoonsActive === 1;
            this.setDoubleHarpoon(newState);
            const status = newState ? 'ON (2 max)' : 'OFF (1 max)';
            this.scene.game.events.emit('UI_WEAPON_CHANGE', `DOUBLE HARPOON: ${status}`);
        });

        this.play('idle');
        this.scene.game.events.emit(EVENTS.hero.READY, this);
    }

    // ============================================================
    // SHIELD TINT HELPERS
    // ============================================================

    forceShieldTint() {
        if (!this.hasShield) return;
        this.setTint(SHIELD_CONFIG.TINT_COLOR);
    }

    restoreTintIfShieldActive() {
        if (this.hasShield) this.forceShieldTint();
        else this.clearTint();
    }

    startShieldTintKeeper() {
        if (this._shieldTintKeeper) {
            this._shieldTintKeeper.destroy();
            this._shieldTintKeeper = null;
        }

        this._shieldTintKeeper = this.scene.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                if (!this.hasShield) {
                    this.stopShieldTintKeeper();
                    return;
                }
                this.forceShieldTint();
            }
        });
    }

    stopShieldTintKeeper() {
        if (this._shieldTintKeeper) {
            this._shieldTintKeeper.destroy();
            this._shieldTintKeeper = null;
        }
    }

    // ============================================================

    setWeapon(weaponType) {
        this.weaponType = weaponType;

        let modeText;
        if (weaponType === HERO_WEAPON.GUN) modeText = 'MACHINE GUN';
        else if (weaponType === HERO_WEAPON.FIXED_HARPOON) modeText = 'FIXED HARPOON';
        else modeText = 'HARPOON';

        this.scene.game.events.emit('UI_WEAPON_CHANGE', modeText);
    }

    createAnimations() {
        const anims = this.scene.anims;

        if (!anims.exists('idle')) {
            anims.create({
                key: 'idle',
                frames: [{ key: 'player', frame: 3 }],
                frameRate: 1,
                repeat: -1,
            });
        }

        if (!anims.exists('run')) {
            anims.create({
                key: 'run',
                frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 12,
                repeat: -1,
            });
        }

        if (!anims.exists('shoot')) {
            anims.create({
                key: 'shoot',
                frames: anims.generateFrameNumbers('player', { start: 4, end: 5 }),
                frameRate: 8,
                repeat: 0,
            });
        }

        // (CLIMB eliminado)
    }

    handleShootingInput() {
        if (this.isShooting) return;

        if (this.weaponType === HERO_WEAPON.HARPOON) {
            this.activeHarpoons = this.activeHarpoons.filter(h => h && h.active);
            if (this.activeHarpoons.length >= this.maxHarpoonsActive) return;
        }

        if (this.weaponType === HERO_WEAPON.FIXED_HARPOON) {
            if (this.activeFixedHarpoon && this.activeFixedHarpoon.active) return;
        }

        this.isShooting = true;
        this.setVelocityX(0);
        this.play('shoot', true);

        // Play disparo.mp3 sound when player fires in Hero.js.
        if (this.scene && this.scene.sound) {
          this.scene.sound.play('disparo', { volume: 0.7 });
        }

        if (this.weaponType === HERO_WEAPON.HARPOON) this.shootHarpoon();
        else if (this.weaponType === HERO_WEAPON.FIXED_HARPOON) this.shootFixedHarpoon();
        else this.shootGunFan();

        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
            if (anim.key === 'shoot') this.isShooting = false;
        });
    }

    shootHarpoon() {
        let offsetX = 0;
        if (this.activeHarpoons.length > 0 && this.maxHarpoonsActive > 1) {
            offsetX = (this.activeHarpoons.length % 2 === 0) ? -15 : 15;
        }

        const texture = this.maxHarpoonsActive > 1 ? 'arpon' : 'arponFijo';

        const harpoon = new Harpoon(this.scene, this.x + offsetX, this.y, texture);
        this.activeHarpoons.push(harpoon);
        this.scene.game.events.emit(EVENTS.hero.SHOOT);
    }

    shootFixedHarpoon() {
        this.activeFixedHarpoon = new FixedHarpoon(this.scene, this.x, this.y);
        this.scene.game.events.emit(EVENTS.hero.SHOOT);
    }

    shootGunFan() {
        const angles = [-80, -85, -90, -95, -100];
        const offsets = [-10, -5, 0, 5, 10];

        angles.forEach((angle, index) => {
            const bullet = new Bullet(this.scene, this.x + offsets[index], this.y - 40, 'bullet');

            if (this.scene.bullets) this.scene.bullets.add(bullet);

            bullet.setDepth(10);
            bullet.fire(angle);
        });

        this.scene.game.events.emit(EVENTS.hero.SHOOT);
    }

    takeDamage(amount = 1) {
        // SHIELD FIRST
        if (this.hasShield) {

            this.hasShield = false;

            if (this.shieldTimer) {
                this.shieldTimer.destroy();
                this.shieldTimer = null;
            }

            if (this._shieldPulse) {
                this._shieldPulse.stop();
                delete this._shieldPulse;
            }

            this.stopShieldTintKeeper();

            this.clearTint();
            this.setAlpha(1);

            this.showShieldBreakEffect();

            this.isInvulnerable = true;

            const invulnDuration = SHIELD_CONFIG.INVULN_AFTER_BREAK || 1000;
            const blinkInterval = 100;
            let blinkCount = 0;
            const maxBlinks = invulnDuration / blinkInterval;

            const blinkTimer = this.scene.time.addEvent({
                delay: blinkInterval,
                callback: () => {
                    blinkCount++;
                    if (blinkCount % 2 === 0) {
                        this.setTint(0xFFFF00);
                        this.setAlpha(0.5);
                    } else {
                        this.clearTint();
                        this.setAlpha(1);
                    }

                    if (blinkCount >= maxBlinks) {
                        this.clearTint();
                        this.setAlpha(1);
                        this.isInvulnerable = false;
                        blinkTimer.destroy();
                    }
                },
                loop: true
            });

            return;
        }

        // Si está invulnerable (por freeze o powerup), NO hacer nada
        if (this.isInvulnerable) {
            return;
        }

        this.lives -= amount;

        this.scene.game.events.emit(EVENTS.hero.DAMAGED, this.lives);

        this.isInvulnerable = true;

        const invulnerabilityDuration = 2000;
        const blinkInterval = 150;
        let blinkCount = 0;
        const maxBlinks = invulnerabilityDuration / blinkInterval;

        const blinkTimer = this.scene.time.addEvent({
            delay: blinkInterval,
            callback: () => {
                blinkCount++;
                if (blinkCount % 2 === 0) this.setTint(0xff0000);
                else this.clearTint();

                if (blinkCount >= maxBlinks) {
                    this.clearTint();
                    this.isInvulnerable = false;
                    blinkTimer.destroy();
                }
            },
            loop: true
        });

        if (this.lives <= 0) this.die();
    }

    showShieldBreakEffect() {
        const breakText = this.scene.add.text(
            this.x,
            this.y - 50,
            'SHIELD BREAK!',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#FFFF00',
                stroke: '#FF6600',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        breakText.setDepth(100);

        this.scene.tweens.add({
            targets: breakText,
            y: breakText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => breakText.destroy()
        });

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const particle = this.scene.add.circle(this.x, this.y - 30, 4, 0x00FFFF, 1);
            particle.setDepth(99);

            const targetX = this.x + Math.cos(angle) * 60;
            const targetY = this.y - 30 + Math.sin(angle) * 60;

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    die() {
        this.scene.game.events.emit(EVENTS.hero.DIED);
        this.scene.game.events.emit(EVENTS.game.GAME_OVER);
    }

    setDoubleHarpoon(enabled) {
        this.maxHarpoonsActive = enabled ? 2 : 1;
        const status = enabled ? 'ENABLED' : 'DISABLED';
    }

    addScore(points) {
        this.score += points;
        this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, points);
    }

    addLife(amount = 1) {
        const oldLives = this.lives;
        this.lives = Math.min(this.lives + amount, this.maxLives);
        const actualGain = this.lives - oldLives;

        if (actualGain > 0) {
            this.scene.game.events.emit(EVENTS.hero.LIFE_GAINED, this.lives);
        } else {
        }
    }

    setShield(duration = SHIELD_CONFIG.DURATION) {
        if (this.shieldTimer) {
            this.shieldTimer.destroy();
        } else {
        }

        this.hasShield = true;

        // Azul siempre mientras dure el escudo
        this.forceShieldTint();
        this.startShieldTintKeeper();

        if (this._shieldPulse) {
            this._shieldPulse.stop();
            delete this._shieldPulse;
        }

        this._shieldPulse = this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.7 },
            duration: SHIELD_CONFIG.BLINK_INTERVAL,
            yoyo: true,
            repeat: -1
        });

        this.shieldTimer = this.scene.time.delayedCall(duration, () => {
            this.hasShield = false;

            if (this._shieldPulse) {
                this._shieldPulse.stop();
                delete this._shieldPulse;
            }

            this.stopShieldTintKeeper();

            this.clearTint();
            this.setAlpha(1);

            this.shieldTimer = null;
        });
    }

    upgradeWeapon() {
        if (this.weaponLevel < MAX_WEAPON_LEVEL) {
            this.weaponLevel++;
        }

        this.weaponStats = WEAPON_LEVELS[this.weaponLevel];

        // Stats: ${this.weaponStats.shots} shots, ${this.weaponStats.speedMultiplier}x speed, ${this.weaponStats.spread}° spread

        // feedback visual sin pisar el azul del escudo
        if (!this.hasShield) {
            this.setTint(0xFF6600);
            this.scene.time.delayedCall(500, () => {
                this.restoreTintIfShieldActive();
            });
        } else {
            this.forceShieldTint();
        }

        this.scene.game.events.emit(EVENTS.hero.WEAPON_UPGRADED, this.weaponLevel);
    }

    resetPowerUps() {
        if (this.shieldTimer) {
            this.shieldTimer.destroy();
            this.shieldTimer = null;
        }
        this.hasShield = false;

        if (this._shieldPulse) {
            this._shieldPulse.stop();
            delete this._shieldPulse;
        }

        this.stopShieldTintKeeper();

        this.weaponLevel = 0;
        this.weaponStats = WEAPON_LEVELS[0];

        this.isInvulnerable = false;
        this.clearTint();
        this.setAlpha(1);

    }
}
