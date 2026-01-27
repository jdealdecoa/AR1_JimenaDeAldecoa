import { EVENTS } from '../../../../core/events.js';
import { BALL_COLORS, BALL_SCORES } from '../BallConstants.js';

export class BaseBall extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speedX, nextBallType = null, color = BALL_COLORS.WHITE, scoreValue = 10, minBounceSpeed = 150) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.world.enable(this);

    

    // Guardar referencia a la escena para splits/async (por si Phaser limpia this.scene)
    this._sceneRef = scene;
this.nextBallType = nextBallType;
    this.speedX = speedX;
    this.ballColor = color; // Guardar el color para heredarlo
    this.scoreValue = scoreValue; // Puntos que da esta bola
    this.minBounceSpeed = minBounceSpeed; // Velocidad mínima de rebote

    // Primero configurar el collider antes de escalar
    // Usar el tamaño original del sprite para el radio
    const radius = this.width * 0.5;
    this.body.setCircle(radius);
    
    // Centrar perfectamente el círculo
    this.body.setOffset(
      (this.width - radius * 2) / 2,
      (this.height - radius * 2) / 2
    );

    // Escalar después para que el sprite llene el collider
    this.setScale(2.0, 2.0);

    // Aplicar color
    this.setTint(this.ballColor);

    // Física - rebote perfecto
    this.body.setBounce(1, 1); // (bounceX, bounceY) - ambos al 100%
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(200);
    
    // Asegurar que la bola pueda moverse
    this.body.immovable = false;
    this.body.moves = true;
    
    // Eliminar drag y fricción para que no pierda energía
    this.body.setDrag(0, 0);
    this.body.setMaxVelocity(400, 400); // Limitar para evitar atravesar tiles
    this.body.allowGravity = true;
    
    // Habilitar collision faces en todos los lados
    this.body.checkCollision.up = true;
    this.body.checkCollision.down = true;
    this.body.checkCollision.left = true;
    this.body.checkCollision.right = true;
    
    // Velocidad inicial
    this.body.setVelocityX(this.speedX);
    
    // Guardar velocidad previa para el rebote
    this._prevVelocity = { x: this.speedX, y: 0 };
    // Emit BALL_CREATED event
    if (scene && scene.game && scene.game.events) {
      scene.game.events.emit(EVENTS.enemy.BALL_CREATED, this);
    }
  }
  
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    if (!this.body) return;
    
    // Guardar velocidad EXACTA antes de colisiones
    // Esto preserva la magnitud para rebote perfecto
    this._prevVelocity = {
      x: this.body.velocity.x,
      y: this.body.velocity.y
    };
    
    // Aplicar velocidad mínima de rebote si es necesario
    // Solo aplica en dirección vertical (Y) cuando rebota contra suelo/techo
    if (this.body.blocked.down || this.body.blocked.up) {
      const absVelY = Math.abs(this.body.velocity.y);
      // Solo aplicar si la velocidad es menor que el mínimo
      if (absVelY < this.minBounceSpeed) {
        // Mantener la dirección pero aplicar velocidad mínima
        const direction = this.body.velocity.y > 0 ? 1 : -1;
        this.body.setVelocityY(this.minBounceSpeed * direction);
      }
    }
  }

  async takeDamage() {
    // Mostrar puntaje flotante en azul
    this.showFloatingScore();
    // Dar puntos por destruir esta bola
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.game.SCORE_CHANGE, this.scoreValue);
    }
    // Split si corresponde
    if (this.nextBallType) {
      await this.split();
    }
    // Reproducir audio pop
    if (this.scene && this.scene.sound) {
      this.scene.sound.play('burbuja_pop', { volume: 0.7 });
    }
    // Emit BALL_DESTROYED event and remove from group BEFORE destroy
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit(EVENTS.enemy.BALL_DESTROYED, this);
    }
    if (this.scene && this.scene.ballsGroup && this.scene.ballsGroup.contains(this)) {
      this.scene.ballsGroup.remove(this, true, true);
      console.log('[BALL REMOVED] (destroy)', this, 'Current group:', this.scene.ballsGroup.getChildren());
    }
    // Destruir la bola actual
    this.destroy();
  }

  showFloatingScore() {
    // Prevent crash if scene.add is not available (scene may be destroyed)
    if (!this.scene || !this.scene.add) return;
    // Crear texto flotante con el puntaje
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
    // Animación: flota hacia arriba y desaparece
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
    const createBalls = async () => {
      switch (this.nextBallType) {
        case "big":
          const { BigBall } = await import('./BigBall.js');
          ball1 = new BigBall(scene, x, y, -1, color);
          ball2 = new BigBall(scene, x, y, 1, color);
          break;
        case "mid":
          const { MidBall } = await import('./MidBall.js');
          ball1 = new MidBall(scene, x, y, -1, color);
          ball2 = new MidBall(scene, x, y, 1, color);
          break;
        case "small":
          const { SmallBall } = await import('./SmallBall.js');
          ball1 = new SmallBall(scene, x, y, -1, color);
          ball2 = new SmallBall(scene, x, y, 1, color);
          break;
        case "tiny":
          const { TinyBall } = await import('./TinyBall.js');
          ball1 = new TinyBall(scene, x, y, -1, color);
          ball2 = new TinyBall(scene, x, y, 1, color);
          break;
        default:
          return;
      }
      if (scene.ballsGroup) {
        scene.ballsGroup.add(ball1);
        scene.ballsGroup.add(ball2);
        console.log('[BALL SPLIT] Added:', ball1, ball2, 'Current group:', scene.ballsGroup.getChildren());
        if (scene.game && scene.game.events) {
          scene.game.events.emit(EVENTS.enemy.BALL_CREATED, ball1);
          scene.game.events.emit(EVENTS.enemy.BALL_CREATED, ball2);
        }
        if (this._markedForBurst && scene.burstClearActive) {
          ball1._spawnedFromMarkedBall = true;
          ball2._spawnedFromMarkedBall = true;
          ball1._markedForBurst = true;
          ball2._markedForBurst = true;
          scene.markedForBurst.add(ball1);
          scene.markedForBurst.add(ball2);
        }
      }
      const parentWasFrozen = this._isFrozen;
      const horizontalSpeed = Math.abs(ball1.speedX);
      const upwardImpulse = -200;
      if (parentWasFrozen) {
        [ball1, ball2].forEach((ball, i) => {
          ball.body.setVelocity(0, 0);
          ball.body.setGravityY(0);
          ball.body.setAllowGravity(false);
          ball.setTint(0x00FFFF);
          ball._isFrozen = true;
          ball._pendingUnfreezeVelocity = {
            x: i === 0 ? -horizontalSpeed : horizontalSpeed,
            y: upwardImpulse
          };
        });
      } else {
        ball1.body.setVelocity(-horizontalSpeed, upwardImpulse);
        ball2.body.setVelocity(horizontalSpeed, upwardImpulse);
      }
    };
    await createBalls();
  }
}
