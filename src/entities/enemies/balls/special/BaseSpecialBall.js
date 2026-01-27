import { EVENTS } from '../../../../core/events.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export const SPECIAL_BALL_VARIANTS = {
  CLOCK: 0,
  STAR: 1
};

export const SPECIAL_BALL_TINTS = {
  CLOCK: 0x00ff00,
  STAR: 0xff8800
};

export class BaseSpecialBall extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speedX, scoreValue = 50) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.nextBallType = null;
    this.speedX = speedX;
    this.scoreValue = scoreValue;
    this.minBounceSpeed = 150;

    this.currentVariant = SPECIAL_BALL_VARIANTS.CLOCK;
    this.setFrame(this.currentVariant);
    this.setTint(SPECIAL_BALL_TINTS.CLOCK);

    this.wasOnFloor = false;
    this.isConsumed = false;

    const radius = this.width * 0.5;
    this.body.setCircle(radius);

    this.body.setOffset(
      (this.width - radius * 2) / 2,
      (this.height - radius * 2) / 2
    );

    this.setScale(2, 2);

    this.body.setBounce(1, 1);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(300);

    this.body.immovable = false;
    this.body.moves = true;

    this.body.setDrag(0, 0);
    this.body.setMaxVelocity(10000, 10000);
    this.body.allowGravity = true;

    this.body.checkCollision.up = true;
    this.body.checkCollision.down = true;
    this.body.checkCollision.left = true;
    this.body.checkCollision.right = true;

    this.body.setVelocityX(this.speedX);

    this._prevVelocity = { x: this.speedX, y: 0 };
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.body) return;

    this._prevVelocity = {
      x: this.body.velocity.x,
      y: this.body.velocity.y
    };

    const isOnFloor = this.body.blocked.down || this.body.touching.down;

    if (isOnFloor && !this.wasOnFloor) {
      this.switchVariant();
    }

    this.wasOnFloor = isOnFloor;

    if (this.body.blocked.down || this.body.blocked.up) {
      const absVelY = Math.abs(this.body.velocity.y);
      if (absVelY < this.minBounceSpeed) {
        const direction = this.body.velocity.y > 0 ? 1 : -1;
        this.body.setVelocityY(this.minBounceSpeed * direction);
      }
    }
  }

  switchVariant() {
    this.currentVariant =
      this.currentVariant === SPECIAL_BALL_VARIANTS.CLOCK
        ? SPECIAL_BALL_VARIANTS.STAR
        : SPECIAL_BALL_VARIANTS.CLOCK;

    this.setFrame(this.currentVariant);

    const newTint =
      this.currentVariant === SPECIAL_BALL_VARIANTS.CLOCK
        ? SPECIAL_BALL_TINTS.CLOCK
        : SPECIAL_BALL_TINTS.STAR;

    this.setTint(newTint);

    console.log(
      `Special ball switched to ${
        this.currentVariant === 0 ? 'CLOCK (green)' : 'STAR (orange)'
      }`
    );
  }

  takeDamage() {
    this.showFloatingScore();

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, this.scoreValue);
    }

    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }

    if (this.scene && this.scene.ballsGroup && this.scene.ballsGroup.contains(this)) {
      this.scene.ballsGroup.remove(this, true, true);
    }

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.enemy.BALL_DESTROYED, this);
    }

    this.playDestructionEffect();
    this.destroy();
  }

  triggerClockEffect() {
    const duration = 3000;
    const bonusScore = 100;

    console.log('⏰ CLOCK EFFECT: Time Stop activated!');

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, bonusScore);
    }

    if (this.scene && typeof this.scene.activateTimeStop === 'function') {
      this.scene.activateTimeStop(duration);
    }

    this.showEffectText('TIME STOP!', 0x00ff00);
  }

  triggerStarEffect() {
    const bonusScore = 150;

    console.log('⭐ STAR EFFECT: Burst Clear activated!');

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, bonusScore);
    }

    if (this.scene && typeof this.scene.activateBurstClear === 'function') {
      this.scene.activateBurstClear(this);
    }

    this.showEffectText('BURST CLEAR!', 0xff8800);
  }

  showEffectText(text, color) {
    if (!this.scene) return;

    const effectText = this.scene.add
      .text(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY - 100,
        text,
        {
          fontFamily: 'Arial',
          fontSize: '48px',
          color: `#${color.toString(16).padStart(6, '0')}`,
          stroke: '#000000',
          strokeThickness: 6
        }
      )
      .setOrigin(0.5);

    effectText.setDepth(1000);
    effectText.setScrollFactor(0);

    this.scene.tweens.add({
      targets: effectText,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => effectText.destroy()
    });
  }

  playDestructionEffect() {
    if (!this.scene) return;

    const color =
      this.currentVariant === SPECIAL_BALL_VARIANTS.CLOCK ? 0x00ff00 : 0xff8800;

    const flash = this.scene.add.circle(this.x, this.y, this.width * 2, color, 0.8);
    flash.setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  showFloatingScore() {
    const scoreText = this.scene.add.text(this.x, this.y, `+${this.scoreValue}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#0066FF',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 3
    });

    scoreText.setOrigin(0.5, 0.5);
    scoreText.setDepth(100);

    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => scoreText.destroy()
    });
  }
}
