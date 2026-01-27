import { EVENTS } from '../../../../core/events.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class BaseHexBall extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speedX, speedY, nextBallType = null, scoreValue = 10, color = BALL_COLORS.WHITE) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.world.enable(this);

    

    // Referencia a la escena para divisiones y eventos
    this._sceneRef = scene;
this.nextBallType = nextBallType;
    this.speedX = speedX;
    this.speedY = speedY;
    this.scoreValue = scoreValue;
    this.ballColor = color; // Guardar el color para heredarlo

    // Crea animación si no existe
    const animKey = `${texture}_anim`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // Inicia animación
    this.play(animKey);

    // Aplica color
    this.setTint(this.ballColor);

    // Escala el sprite
    this.setScale(3.5, 3.5);

    // Configura el collider circular
    const radius = this.width * 0.5;
    this.body.setCircle(radius);
    
    // Centra el collider
    this.body.setOffset(
      (this.width - radius * 2) / 2,
      (this.height - radius * 2) / 2
    );

    // Sin gravedad ni rebote automático
    this.body.setAllowGravity(false);
    this.body.setGravity(0, 0);
    this.body.setBounce(0, 0);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;
    
    this.body.immovable = false;
    this.body.moves = true;
    this.body.setDrag(0, 0);
    this.body.setMaxVelocity(10000, 10000);
    
    // Calcula y guarda la velocidad constante
    this.constantSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
    
    // Velocidad actual
    this.velocityX = this.speedX;
    this.velocityY = this.speedY;
    
    // Aplica velocidad inicial
    this.body.setVelocity(this.velocityX, this.velocityY);
    // Emite evento BALL_CREATED
    if (scene && scene.game && scene.game.events) {
      scene.game.events.emit(EVENTS.enemy.BALL_CREATED, this);
    }
  }
  
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    if (!this.body) return;
    
    const worldBounds = this.scene.physics.world.bounds;
    
    // Invierte velocidad X si choca con los lados
    if (this.body.blocked.left || this.body.blocked.right) {
      this.velocityX = -this.velocityX;
    }
    
    // Invierte velocidad Y si choca con arriba/abajo
    if (this.body.blocked.up || this.body.blocked.down) {
      this.velocityY = -this.velocityY;
    }
    
    // Mantiene velocidad constante
    const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    
    if (currentSpeed > 0) {
      // Normaliza y aplica velocidad constante
      this.velocityX = (this.velocityX / currentSpeed) * this.constantSpeed;
      this.velocityY = (this.velocityY / currentSpeed) * this.constantSpeed;
    }
    
    // Aplica velocidad constante al body
    this.body.setVelocity(this.velocityX, this.velocityY);
  }

  async takeDamage() {
    this.showFloatingScore();
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, this.scoreValue);
    }
    // Divide la bola si corresponde
    if (this.nextBallType) {
      await this.split();
    }
    // Reproduce sonido pop
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }
    // Elimina del grupo antes de destruir
    if (this.scene && this.scene.ballsGroup && this.scene.ballsGroup.contains(this)) {
      this.scene.ballsGroup.remove(this, true, true);
    }
    // Emite evento BALL_DESTROYED antes de destruir
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.enemy.BALL_DESTROYED, this);
    }
    this.destroy();
  }

  showFloatingScore() {
    // Evita errores si la escena no existe
    if (!this.scene || !this.scene.add) return;
    // Muestra puntaje flotante
    const scoreText = this.scene.add.text(this.x, this.y, `+${this.scoreValue}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#0066FF', // Azul
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 3
    });
    scoreText.setOrigin(0.5, 0.5);
    scoreText.setDepth(100); // Por encima de todo
    // Animación: flota y desaparece
    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy();
      }
    });
  }

  async split() {
    const scene = this.scene || this._sceneRef;
    const x = this.x;
    const y = this.y;
    const color = this.ballColor;
    let ball1, ball2;
    switch (this.nextBallType) {
      case "hex_mid": {
        const { HexMidBall } = await import('./HexMidBall.js');
        ball1 = new HexMidBall(scene, x, y, -1, -1, color);
        ball2 = new HexMidBall(scene, x, y, 1, 1, color);
        break;
      }
      case "hex_small": {
        const { HexSmallBall } = await import('./HexSmallBall.js');
        ball1 = new HexSmallBall(scene, x, y, -1, -1, color);
        ball2 = new HexSmallBall(scene, x, y, 1, 1, color);
        break;
      }
      default:
        return;
    }
    if (scene.ballsGroup) {
      scene.ballsGroup.add(ball1);
      scene.ballsGroup.add(ball2);
      // Emit BALL_CREATED for split balls
      if (scene.game && scene.game.events) {
        scene.game.events.emit(EVENTS.enemy.BALL_CREATED, ball1);
        scene.game.events.emit(EVENTS.enemy.BALL_CREATED, ball2);
      }
      // Mark split balls if parent was marked for burst
      if (this._markedForBurst && scene.burstClearActive) {
        ball1._spawnedFromMarkedBall = true;
        ball2._spawnedFromMarkedBall = true;
        ball1._markedForBurst = true;
        ball2._markedForBurst = true;
        scene.markedForBurst.add(ball1);
        scene.markedForBurst.add(ball2);
      }
    }
    const horizontalSpeed = 200;
    const upwardSpeed = -300;
    // SIEMPRE SPLIT NORMAL, IGNORAR FREEZE
    ball1.velocityX = -horizontalSpeed;
    ball1.velocityY = upwardSpeed;
    ball1.body.setVelocity(ball1.velocityX, ball1.velocityY);
    ball2.velocityX = horizontalSpeed;
    ball2.velocityY = upwardSpeed;
    ball2.body.setVelocity(ball2.velocityX, ball2.velocityY);
    // Play pop sound when splitting
    if (scene && scene.sound) {
      scene.sound.play('burbuja_pop', { volume: 0.7 });
    }
  }
}


