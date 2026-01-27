import { EVENTS } from '../../../core/events.js';
import { GAME_SIZE } from '../../../core/constants.js';

/**
 * BaseBird - Flying enemy with looping movement pattern
 *
 * Spritesheet DIRECCIONAL (8 frames, 51x31) en este orden:
 * 0 down
 * 1 down-right
 * 2 right
 * 3 up-right
 * 4 up
 * 5 up-left
 * 6 down-left
 * 7 left
 */
export class BaseBird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speedX, scoreValue = 100) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.speedX = Math.abs(speedX);
    this.scoreValue = scoreValue;

    this.isFlying = true;
    this.isFalling = false;
    this.isDead = false;

    this.loopPhase = 'DESCENDING';

    this.startX = x;
    this.startY = y;
    this.startTime = scene.time.now;

    const worldWidth = scene?.map?.widthInPixels
      ?? scene?.physics?.world?.bounds?.width
      ?? GAME_SIZE.WIDTH;
    const worldHeight = scene?.map?.heightInPixels
      ?? scene?.physics?.world?.bounds?.height
      ?? GAME_SIZE.HEIGHT;

    // Center of looping path: push inward depending on entry side and clamp to bounds
    const desiredCenterX = speedX >= 0 ? x + 400 : x - 400;
    this.loopCenterX = Phaser.Math.Clamp(desiredCenterX, 100, worldWidth - 100);

    const desiredCenterY = y + 300;
    this.loopCenterY = Phaser.Math.Clamp(desiredCenterY, 100, worldHeight - 100);
    this.loopRadius = 150;

    this.totalDuration = 5000;
    this.pathProgress = 0;

    this.setScale(1.5, 1.5);
    this.setAngle(0);
    this.setFlipX(false);

    if (this.anims) this.anims.stop();
    this.setFrame(2);

    this.body.setAllowGravity(false);
    this.body.setGravityY(0);
    this.body.setBounce(0, 0);
    this.body.setCollideWorldBounds(false);

    this.body.moves = true;
    this.body.setDrag(0, 0);
    this.body.setMaxVelocity(10000, 10000);

    const hitboxWidth = this.width * 0.6;
    const hitboxHeight = this.height * 0.6;
    this.body.setSize(hitboxWidth, hitboxHeight);
    this.body.setOffset(
      (this.width - hitboxWidth) / 2,
      (this.height - hitboxHeight) / 2
    );

    // (OJO) No desactivamos checkCollision aquí para no romper overlaps.
    // En Level_01 filtramos colisión con tiles SOLO cuando cae.

    this.hasDroppedItem = false;

    this._dir = 2;
    this._pendingDir = null;
    this._pendingCount = 0;
    this._lastFrameUpdateTime = 0;
    this._boundCheckCounter = 0;
  }

  quadraticBezier(p0, p1, p2, t) {
    const oneMinusT = 1 - t;
    return (
      oneMinusT * oneMinusT * p0 +
      2 * oneMinusT * t * p1 +
      t * t * p2
    );
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  _computeDirFrame(vx, vy) {
    let angle = Math.atan2(vy, vx);
    if (angle < 0) angle += Math.PI * 2;

    const sector = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;

    // sector: 0=right,1=down-right,2=down,3=down-left,4=left,5=up-left,6=up,7=up-right
    // frame:  2=right,1=down-right,0=down,6=down-left,7=left,5=up-left,4=up,3=up-right
    const map = [2, 1, 0, 6, 7, 5, 4, 3];
    return map[sector];
  }

  updateDirectionalFrame(vx, vy, isExiting = false) {
    const speed = Math.hypot(vx, vy);

    const MIN_SPEED = isExiting ? 140 : 70;
    if (speed < MIN_SPEED) return;

    const candidate = this._computeDirFrame(vx, vy);
    const now = this.scene?.time?.now ?? 0;

    // Faster frame updates for smoother animation
    const FRAME_UPDATE_MS = isExiting ? 80 : 50;
    if (now - (this._lastFrameUpdateTime || 0) < FRAME_UPDATE_MS) return;
    this._lastFrameUpdateTime = now;

    if (candidate === this._dir) {
      this._pendingDir = null;
      this._pendingCount = 0;
      return;
    }

    // Reduce confirmation ticks for more responsive direction changes
    const CONFIRM_TICKS = isExiting ? 2 : 1;

    if (this._pendingDir !== candidate) {
      this._pendingDir = candidate;
      this._pendingCount = 1;
      return;
    }

    this._pendingCount++;

    if (this._pendingCount >= CONFIRM_TICKS) {
      this._dir = candidate;
      this.setFrame(candidate);
      this._pendingDir = null;
      this._pendingCount = 0;
    }
  }

  updateLoopingMovement(delta) {
    if (!this.isFlying || this.isFalling) return;
    if (!this.scene || !this.scene.time) return;

    const now = this.scene.time.now;
    const elapsed = now - this.startTime;
    this.pathProgress = Math.min(elapsed / this.totalDuration, 1);

    const prevX = this.x;
    const prevY = this.y;

    let newX, newY;

    if (this.pathProgress < 0.3) {
      this.loopPhase = 'DESCENDING';
      const phaseProgress = this.pathProgress / 0.3;
      const eased = this.easeInOutQuad(phaseProgress);

      const entryX = this.loopCenterX + this.loopRadius;
      const entryY = this.loopCenterY;

      const controlX = this.startX + 200;
      const controlY = this.startY + 200;

      newX = this.quadraticBezier(this.startX, controlX, entryX, eased);
      newY = this.quadraticBezier(this.startY, controlY, entryY, eased);
    } else if (this.pathProgress < 0.7) {
      this.loopPhase = 'LOOPING';
      const phaseProgress = (this.pathProgress - 0.3) / 0.4;

      const angle = phaseProgress * Math.PI * 2;

      newX = this.loopCenterX + Math.cos(angle) * this.loopRadius;
      newY = this.loopCenterY + Math.sin(angle) * this.loopRadius;
    } else {
      this.loopPhase = 'ASCENDING';
      const phaseProgress = (this.pathProgress - 0.7) / 0.3;
      const eased = this.easeInOutQuad(phaseProgress);

      const loopExitX = this.loopCenterX + this.loopRadius;
      const loopExitY = this.loopCenterY;

      const exitX = loopExitX + 300;
      const exitY = this.startY - 50;

      const controlX = loopExitX + 150;
      const controlY = loopExitY - 100;

      newX = this.quadraticBezier(loopExitX, controlX, exitX, eased);
      newY = this.quadraticBezier(loopExitY, controlY, exitY, eased);
    }

    const safeDelta = Number.isFinite(delta) ? delta : 16.666;
    const dt = Math.max(1, safeDelta) / 1000;

    const dx = newX - prevX;
    const dy = newY - prevY;

    // Set velocity for smooth movement and reset body position to ensure overlaps work reliably
    const vx = dx / dt;
    const vy = dy / dt;
    if (!Number.isFinite(vx) || !Number.isFinite(vy)) return;

    this.body.reset(newX, newY);
    this.body.setVelocity(vx, vy);

    const isExiting = this.pathProgress >= 0.7;
    this.updateDirectionalFrame(vx, vy, isExiting);

    if (this.pathProgress >= 1) {
      this.destroy();
    }
  }

  checkOutOfBounds() {
    if (!this.scene || !this.scene.physics || !this.scene.physics.world) return false;

    const bounds = this.scene.physics.world.bounds;
    const buffer = 200;

    if (
      this.x < -buffer || this.x > bounds.width + buffer ||
      this.y < -buffer || this.y > bounds.height + buffer
    ) {
      this.destroy();
      return true;
    }

    return false;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.scene || !this.body || this.isDead) return;

    if (this.isFlying) {
      this.updateLoopingMovement(delta);
      // Check bounds every 5 frames to reduce CPU usage
      this._boundCheckCounter++;
      if (this._boundCheckCounter >= 5) {
        this.checkOutOfBounds();
        this._boundCheckCounter = 0;
      }
    } else if (this.isFalling) {
      if (this.body.blocked.down || this.body.touching.down) {
        this.destroyBird();
      }
    }
  }

  takeDamage() {
    if (this.isDead || this.isFalling) return;

    this.showFloatingScore();

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, this.scoreValue);
    }

    // Mark bird as eliminated in the flock manager
    if (this.scene && this.scene.birdFlockManager && this.flockIndex !== undefined) {
      this.scene.birdFlockManager.markBirdEliminated(this);
    }

    if (!this.hasDroppedItem && this.scene.dropper) {
      this.scene.dropper.dropFrom(this, this.x, this.y);
      this.hasDroppedItem = true;
    }

    this.isFlying = false;
    this.isFalling = true;

    this.body.checkCollision.none = false;
    this.body.setAllowGravity(true);
    this.body.setGravityY(600);
    this.body.setCollideWorldBounds(true);

    this.body.setVelocityX(0);
    this.setTint(0xff0000);
    this.setFrame(0);

    // Play pop sound when bird is hit
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }
  }

  showFloatingScore() {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;

    const scoreText = this.scene.add.text(this.x, this.y, `+${this.scoreValue}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#00FFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });

    scoreText.setOrigin(0.5);
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

  destroyBird() {
    if (this.isDead) return;
    this.isDead = true;

    this.createImpactEffect();

    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(50, () => this.destroy());
    } else {
      this.destroy();
    }
  }

  createImpactEffect() {
    if (!this.scene || !this.scene.add || !this.scene.tweens) return;

    const flash = this.scene.add.circle(this.x, this.y, this.width, 0xffffff, 0.8);
    flash.setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }
}
