import { HERO } from '../core/constants.js';
import { EVENTS } from '../core/events.js';

export class HeroBase extends Phaser.Physics.Arcade.Sprite 
{
    constructor(scene, x, y, texture) 
    {
        super(scene, x, y, texture);
        
        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);

        this.setOrigin(0.5, 1);
        this.setCollideWorldBounds(true);

        if (this.body && this.body.setSize) {
            const width  = this.width  * 0.7;
            const height = this.height * 0.9;
            this.body.setSize(width, height);
            this.body.setOffset((this.width - width) / 2, this.height - height);
        }

        this.speed  = HERO?.SPEED      ?? 250;
        this.lives  = HERO?.MAX_LIVES  ?? 3;
        this.isDead = false;

        this.isShooting = false;

        this.cursors  = scene.input.keyboard.createCursorKeys();
        this.shootKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.scene.game.events.emit(EVENTS.hero.READY, this);
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);

        if (this.isDead || !this.body) return;

        const body = this.body;

        if (this.isShooting) {
            body.setVelocityX(0);
            return;
        }

        body.setVelocityX(0);
        let isMoving = false;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-this.speed);
            isMoving = true;
            this.setFlipX(false);
        } 
        else if (this.cursors.right.isDown) {
            body.setVelocityX(this.speed);
            isMoving = true;
            this.setFlipX(true);
        }

        this.updateAnimation(isMoving);

        if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
            if (this.handleShootingInput) {
                this.handleShootingInput();
            }
        }
    }

    updateAnimation(isMoving) {
        if (!this.anims) return;
        if (this.isShooting) return;

        const current = this.anims.currentAnim?.key;

        if (isMoving) {
            if (current !== 'run') this.play('run', true);
        } else {
            if (current !== 'idle') this.play('idle', true);
        }
    }

    handleShootingInput() {}

    takeDamage(amount = 1) {
        if (this.isDead) return;

        this.lives -= amount;
        this.scene.game.events.emit(EVENTS.hero.DAMAGED, this.lives);

        this.setTint(0xffaaaa);
        this.scene.time.delayedCall(150, () => this.clearTint());

        if (this.lives <= 0) this.die();
    }

    die() {
        this.isDead = true;
        this.setTint(0xff0000);
        this.setVelocity(0, 0);

        this.scene.game.events.emit(EVENTS.hero.DIED);

        this.scene.time.delayedCall(1000, () => {
            this.scene.scene.restart();
        });
    }
}
