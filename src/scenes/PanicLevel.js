// src/scenes/PanicLevel.js

import { Hero } from '../entities/Hero.js';
import { WallManager } from '../objects/WallManager.js';

import { HugeBall } from '../entities/enemies/balls/normal/HugeBall.js';
import { BigBall } from '../entities/enemies/balls/normal/BigBall.js';
import { MidBall } from '../entities/enemies/balls/normal/MidBall.js';
import { SmallBall } from '../entities/enemies/balls/normal/SmallBall.js';
import { HexBigBall } from '../entities/enemies/balls/hexagonal/HexBigBall.js';
import { HexMidBall } from '../entities/enemies/balls/hexagonal/HexMidBall.js';
import { HexSmallBall } from '../entities/enemies/balls/hexagonal/HexSmallBall.js';
import { SpecialBigBall } from '../entities/enemies/balls/special/SpecialBigBall.js';
import { SpecialMidBall } from '../entities/enemies/balls/special/SpecialMidBall.js';
import { BALL_COLORS } from '../entities/enemies/balls/BallConstants.js';
import { GAME_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { Hud } from '../UI/HUD.js';

export class PanicLevel extends Phaser.Scene {
  constructor() {
    super({ key: 'PanicLevel' });
    
    // Initialize time stop properties
    this.isFrozen = false;
    this.timeStopUntil = 0;
    
    // Initialize burst clear properties
    this.burstClearActive = false;
    this.markedForBurst = new Set();
    
    // Panic Mode level system
    this.panicLevel = 1; // Nivel de dificultad actual (1-99)
    
    // Ball spawn configuration
    this.ballSpawnInterval = null;
    this.nextBallSpawnTime = 0;
  }

  init(data) {
    // Store the mode (normal or panic)
    this.gameMode = data.mode || 'panic';
    
    // Si viene de un reinicio, mantener el nivel y las vidas
    this.panicLevel = data.panicLevel || 1;
    this.heroLives = data.heroLives || 3;
    this.savedScore = data.score || 0; // Guardar score para restaurar
  }

  preload() {
    // --- FONDO Y TILEMAP ---
    this.load.setPath('assets/sprites/backgrounds');
   	this.load.spritesheet('backgrounds', 'backgrounds.png', {
      frameWidth: 256,
      frameHeight: 192,
    });
    this.load.image('tileset_muros_img', 'tileset_muros.png');

    this.load.setPath('assets/tiled/maps');
    this.load.tilemapTiledJSON('map_marco', 'marcoLadrillos.json');

    // --- SPRITES DEL HÉROE (los que usa Hero.js) ---
    this.load.setPath('assets/sprites/spritesheets/hero');
    
    // Spritesheet principal del héroe (requerido por Hero.createAnimations())
    this.load.spritesheet('player', 'spritesheet_player.png', {
      frameWidth: 118,
      frameHeight: 127,
      spacing: 0,
      margin: 0
    });
    
    // Spritesheets adicionales para animaciones extendidas
    this.load.spritesheet('player_walk', 'player_walk.png', {
      frameWidth: 109, // 4 frames
      frameHeight: 118,
    });
    this.load.spritesheet('player_shoot', 'player_shoot.png', {
      frameWidth: 96, // 2 frames
      frameHeight: 119,
    });

    // --- ARMA ---
    this.load.setPath('assets/sprites/static');
    this.load.image('arponFijo', 'arponFijo.png');
    this.load.image('arpon', 'arpon.png');
    this.load.image('bullet', 'disparo.png');

    // --- PELOTAS ---
    this.load.image('n_huge', 'n_huge.png');
    this.load.image('n_big', 'n_big.png');
    this.load.image('n_mid', 'n_mid.png');
    this.load.image('n_small', 'n_small.png');
    this.load.image('n_tiny1', 'n_tiny1.png');
    this.load.image('n_tiny2', 'n_tiny2.png');

    // --- PELOTAS HEXAGONALES ---
    this.load.setPath('assets/sprites/spritesheets/Balls');
    this.load.spritesheet('hex_big', 'hex_big.png', {
      frameWidth: 98 / 3,
      frameHeight: 30
    });
    this.load.spritesheet('hex_mid', 'hex_mid.png', {
      frameWidth: 52 / 3,
      frameHeight: 16
    });
    this.load.spritesheet('hex_small', 'hex_small.png', {
      frameWidth: 33 / 3,
      frameHeight: 10
    });

    // --- PELOTAS ESPECIALES (CLOCK/STAR) ---
    // sp_big: 100x42 total (1x2 spritesheet) = 50x42 per frame
    // sp_mid: 68x28 total (1x2 spritesheet) = 34x28 per frame
    this.load.spritesheet('sp_big', 'sp_big.png', {
      frameWidth: 50,  // 100 / 2 frames
      frameHeight: 42
    });
    this.load.spritesheet('sp_mid', 'sp_mid.png', {
      frameWidth: 34,  // 68 / 2 frames
      frameHeight: 28
    });

    // --- CARGA DE AUDIO ---
    this.load.setPath('assets/audio');
    this.load.audio('bandaSonora', 'bandaSonora.mp3');
    this.load.audio('disparo', 'disparo.mp3');
    this.load.audio('burbuja_pop', 'burbuja_pop.mp3');
    this.load.audio('gameover', 'gameover.mp3');
  }

  create() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
      this.game.audioManager.playMusic(this, 'bandaSonora', { loop: true, volume: 0.5 });
    }
    // --- MAPA ---
    const map = this.make.tilemap({ key: 'map_marco' });
    const tileset = map.addTilesetImage('tileset_muros', 'tileset_muros_img');
    // --- WALL MANAGER ---
    this.wallManager = new WallManager(this, map, {
      floorLayer: 'layer_floor',
      ceilingLayer: 'layer_ceiling',
      tilesetName: tileset
    });
    this.physics.world.bounds.width = map.widthInPixels;
    this.physics.world.bounds.height = map.heightInPixels;
    
    // Asegurar que los límites estén bien definidos
    this.physics.world.bounds.x = 0;
    this.physics.world.bounds.y = 0;
    
    // Guardar dimensiones del mapa para verificaciones
    this.mapWidth = map.widthInPixels;
    this.mapHeight = map.heightInPixels;
    // --- FONDO ---
    this.bgFrame = Math.max(0, this.panicLevel - 1); // Frame basado en el nivel actual
    this.bgMaxFrame = 3; // Cambia según tu spritesheet
    this.bg = this.add.image(0, 0, 'backgrounds', this.bgFrame).setOrigin(0, 0);
    this.bg.setDisplaySize(GAME_SIZE.WIDTH, map.heightInPixels);
    this.bg.setDepth(-2);
    this.cameras.main.setBackgroundColor(0x000000);
    // --- GRUPOS ---
    this.ballsGroup = this.physics.add.group();
    this.bullets = this.add.group({ runChildUpdate: true });
    this.wallManager.addWeaponOverlap(this.bullets, (bullet) => { if (bullet && bullet.active) bullet.destroy(); });
    // --- HÉROE ---
    const startX = map.widthInPixels / 2;
    const startY = map.heightInPixels - 64;
    this.hero = new Hero(this, startX, startY, 'player');
    this.hero.lives = this.heroLives; // Restaurar vidas desde el reinicio
    this.hero.body.immovable = true;
    this.hero.body.pushable = false;
    this.hero.body.moves = true;
    this.hero.body.setMass(10000);
    this.hero.body.setGravityY(600);
    this.wallManager.addHeroCollider(this.hero);
    this.wallManager.addGroupCollider(this.ballsGroup, this.bounceBall, this);
    
    // NO usar overlap automático - lo haremos manual en update() para tener más control
    this.heroBallContactCooldown = {};
    
    // Empezar con doble arpón SIEMPRE en Panic Mode
    this.hero.maxHarpoonsActive = 2;
    
    // --- HUD CON BARRA DE EXP ---
    this.hud = new Hud(this, { uiTop: map.heightInPixels, mode: 'PANIC' });
    
    // Restaurar score si viene de un reinicio
    if (this.savedScore > 0) {
      this.hud.score = this.savedScore;
      const padded = this.savedScore.toString().padStart(6, '0');
      this.hud.scoreText.setText(`${padded}`);
    }
    
    // Restaurar nivel y experiencia si viene de un reinicio
    if (this.panicLevel > 1) {
      this.hud.expLevel = this.panicLevel;
      this.hud.exp = 0; // La barra empieza vacía en el nuevo nivel
      this.hud.setExp(0);
      console.log(`PANIC MODE - Reiniciando en Nivel ${this.panicLevel}`);
    }
    
    // Actualizar las vidas en el HUD (importante si viene de un reinicio)
    this.hud.setLives(this.heroLives);
    
    // Cuando el medidor llegue al 100%, subir nivel de dificultad
    this.hud.onExpLevelUp = (level) => {
      this.panicLevel = level;
      this.advanceBackground();
      console.log(`PANIC MODE - Nivel ${this.panicLevel}`);
    };
    // --- PAUSA CON ESC ---
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.launch('PauseMenu', { from: 'PanicLevel' });
      this.scene.pause();
      this.scene.bringToTop('PauseMenu');
    });
    
    // --- SPAWN CONTINUO DE BOLAS (basado en nivel de dificultad) ---
    // Spawnear la primera bola inmediatamente
    this.spawnBall();
    // Programar el siguiente spawn
    this.scheduleNextBallSpawn();
    
    // --- SCORE GLOBAL ---
    this.globalScore = 0;

    // Listener para vidas del héroe
    if (this.game && this.game.events) {
      this.game.events.on(EVENTS.hero.DAMAGED, (remainingLives) => {
        if (remainingLives <= 0) {
          // Game Over - volver al menú principal
          if (this.sound) this.sound.play('gameover', { volume: 0.12 });
          setTimeout(() => {
            this.scene.start('MainMenuScene');
          }, 2000);
        } else {
          // Aún quedan vidas - reiniciar nivel actual manteniendo score
          console.log(`Vida perdida. Quedan ${remainingLives} vidas. Reiniciando nivel ${this.panicLevel}...`);
          // Guardar el score actual antes de reiniciar
          const currentScore = this.hud ? this.hud.score : 0;
          setTimeout(() => {
            this.scene.restart({ 
              mode: 'panic',
              panicLevel: this.panicLevel,
              heroLives: remainingLives,
              score: currentScore
            });
          }, 1000);
        }
      });
      
      // Listener para cuando se destruye una bola - aumentar experiencia
      this.game.events.on(EVENTS.enemy.BALL_DESTROYED, (data) => {
        // Cada bola destruida suma al medidor (25 puntos base - subió de 10)
        if (this.hud && this.hud.addExp) {
          this.hud.addExp(25);
        }
      });
    }
  }

  /**
   * Programa el próximo spawn de bola basado en el nivel de dificultad
   */
  scheduleNextBallSpawn() {
    let spawnInterval;
    
    // Progresión de intervalos según el nivel (muy lenta y progresiva)
    if (this.panicLevel <= 3) {
      // Niveles 1-3: Inicio muy tranquilo para aprender
      spawnInterval = Phaser.Math.Between(10000, 13000);
    } else if (this.panicLevel <= 7) {
      // Niveles 4-7: Incremento gradual
      spawnInterval = Phaser.Math.Between(8000, 10000);
    } else if (this.panicLevel <= 12) {
      // Niveles 8-12: Aumenta presión moderadamente
      spawnInterval = Phaser.Math.Between(6500, 8000);
    } else if (this.panicLevel <= 17) {
      // Niveles 13-17: Ritmo medio
      spawnInterval = Phaser.Math.Between(5000, 6500);
    } else if (this.panicLevel <= 22) {
      // Niveles 18-22: Ritmo medio-alto
      spawnInterval = Phaser.Math.Between(4000, 5500);
    } else if (this.panicLevel <= 27) {
      // Niveles 23-27: Ritmo alto
      spawnInterval = Phaser.Math.Between(3200, 4500);
    } else {
      // Niveles 28+: Supervivencia extrema con reducción progresiva
      const reduction = Math.min((this.panicLevel - 27) * 50, 1000);
      spawnInterval = Math.max(1800, 3200 - reduction);
    }
    
    this.nextBallSpawnTime = this.time.now + spawnInterval;
  }

  /**
   * Spawn de bola automático basado en nivel
   */
  spawnBall() {
    const x = Phaser.Math.Between(100, GAME_SIZE.WIDTH - 100);
    const y = Phaser.Math.Between(60, 120); // Siempre cerca del techo
    
    let ball;
    
    // Probabilidad de special ball (aumenta ligeramente con el nivel)
    const specialBallChance = this.panicLevel <= 10 ? 0.03 : 
                              this.panicLevel <= 20 ? 0.05 : 0.07;
    
    if (Math.random() < specialBallChance) {
      // Special ball que alterna entre clock (time stop 7s) y star (limpia pantalla)
      ball = new SpecialBigBall(this, x, y, 1);
      console.log(`[NIVEL ${this.panicLevel}] Spawned SPECIAL BALL`);
    } else {
      // Determinar si es bola rebotante (normal) o exagon según el nivel
      let isExagon = false;
      
      if (this.panicLevel <= 14) {
        // Niveles 1-14: Solo bolas rebotantes, NO exagons
        isExagon = false;
      } else if (this.panicLevel <= 20) {
        // Niveles 15-20: Exagons empiezan a aparecer
        isExagon = Math.random() < 0.25; // 25% exagons
      } else if (this.panicLevel <= 25) {
        // Niveles 21-25: Más exagons
        isExagon = Math.random() < 0.40; // 40% exagons
      } else {
        // Niveles 26+: Mezcla equilibrada
        isExagon = Math.random() < 0.50; // 50% exagons
      }
      
      // Determinar tamaño según el nivel (SOLO 2 tamaños más grandes)
      let ballSize;
      
      if (this.panicLevel <= 7) {
        // Niveles 1-7: SOLO big, NO huge todavía
        ballSize = 'big';
      } else if (this.panicLevel <= 12) {
        // Niveles 8-12: Huge empieza a aparecer
        const weights = ['big', 'big', 'big', 'huge'];
        ballSize = Phaser.Math.RND.pick(weights);
      } else if (this.panicLevel <= 17) {
        // Niveles 13-17: Mix equilibrado
        const weights = ['big', 'big', 'huge', 'huge'];
        ballSize = Phaser.Math.RND.pick(weights);
      } else if (this.panicLevel <= 22) {
        // Niveles 18-22: Más huge
        const weights = ['big', 'huge', 'huge', 'huge'];
        ballSize = Phaser.Math.RND.pick(weights);
      } else {
        // Niveles 23+: Dominan huge
        const weights = ['big', 'huge', 'huge', 'huge', 'huge'];
        ballSize = Phaser.Math.RND.pick(weights);
      }
      
      // Crear la bola según tipo
      if (isExagon) {
        // Exagons (hexagonales) - Solo tamaño grande
        ball = new HexBigBall(this, x, y, 1, 1, BALL_COLORS.GREEN);
        console.log(`[NIVEL ${this.panicLevel}] Spawned EXAGON big`);
      } else {
        // Bolas rebotantes normales - Solo huge o big
        if (ballSize === 'huge') {
          ball = new HugeBall(this, x, y, 1, BALL_COLORS.PURPLE);
        } else {
          ball = new BigBall(this, x, y, 1, BALL_COLORS.RED);
        }
        console.log(`[NIVEL ${this.panicLevel}] Spawned BALL ${ballSize}`);
      }
    }
    
    this.ballsGroup.add(ball);
    
    // Programar el siguiente spawn
    this.scheduleNextBallSpawn();
  }

  advanceBackground() {
    this.bgFrame = (this.bgFrame + 1) % (this.bgMaxFrame + 1);
    this.bg.setFrame(this.bgFrame);
  }

  createBall(x = null, y = null, ballType = null) {
    const startX = x !== null ? x : this.wallManager.getFloorLayer().width / 2;
    // Always spawn high on the map in PanicMode
    const startY = y !== null ? y : 80;

    let ball;
    const type = ballType || (this.gameMode === 'panic' ? 'special' : 'hexagonal');
    
    if (type === 'special') {
      // Special Ball (Clock/Star)
      ball = new SpecialBigBall(this, startX, startY, 1);
      console.log(`Spawning Special Big Ball at (${startX}, ${startY})`);
    } else if (type === 'normal') {
      // Normal ball with proper color
      ball = new BigBall(this, startX, startY, 1, BALL_COLORS.RED);
      console.log(`Spawning Normal Big Ball at (${startX}, ${startY})`);
    } else {
      // Hexagonal ball (default)
      ball = new HexBigBall(this, startX, startY, 1, 1, BALL_COLORS.BLUE);
      console.log(`Spawning Hexagonal Big Ball at (${startX}, ${startY})`);
    }
    
    this.ballsGroup.add(ball);
  }

  bounceBall(ball, objectOrTile) {
    if (!ball || !ball.body) return;

    // Cooldown para evitar rebotes múltiples
    const now = Date.now();
    if (ball._lastBounce && now - ball._lastBounce < 100) {
      return;
    }
    ball._lastBounce = now;

    // Asegurarse de que _prevVelocity existe
    if (!ball._prevVelocity) {
      ball._prevVelocity = { x: 150, y: 400 };
    }

    // Primera vez: guardar la velocidad de impacto como constante
    if (!ball._constantBounceVel) {
      ball._constantBounceVel = {
        x: Math.abs(ball._prevVelocity.x) || 150,
        y: Math.abs(ball._prevVelocity.y) || 400
      };
    }

    // Rebote perfecto: usar velocidad constante guardada
    if (ball.body.blocked.down || ball.body.touching.down) {
      ball.body.setVelocityY(-ball._constantBounceVel.y);
      ball.y -= 5;
    }
    
    if (ball.body.blocked.up || ball.body.touching.up) {
      ball.body.setVelocityY(ball._constantBounceVel.y);
      ball.y += 5;
    }
    
    if (ball.body.blocked.left || ball.body.touching.left) {
      ball.body.setVelocityX(ball._constantBounceVel.x);
      ball.x += 5;
    }
    
    if (ball.body.blocked.right || ball.body.touching.right) {
      ball.body.setVelocityX(-ball._constantBounceVel.x);
      ball.x -= 5;
    }
  }

  update() {
    // Spawn automático de bolas basado en tiempo
    if (this.time.now >= this.nextBallSpawnTime) {
      this.spawnBall();
    }
    
    // Verificar que las bolas no se salgan del mapa y reposicionarlas
    this.ballsGroup.children.entries.forEach(ball => {
      if (ball && ball.active && ball.body) {
        const margin = 20; // Margen de seguridad
        let needsReposition = false;
        
        // Verificar límites horizontales
        if (ball.x < margin) {
          ball.x = margin;
          ball.body.setVelocityX(Math.abs(ball.body.velocity.x) || 200);
          needsReposition = true;
        } else if (ball.x > this.mapWidth - margin) {
          ball.x = this.mapWidth - margin;
          ball.body.setVelocityX(-Math.abs(ball.body.velocity.x) || -200);
          needsReposition = true;
        }
        
        // Verificar límites verticales
        if (ball.y < margin) {
          ball.y = margin;
          ball.body.setVelocityY(Math.abs(ball.body.velocity.y) || 200);
          needsReposition = true;
        } else if (ball.y > this.mapHeight - margin) {
          ball.y = this.mapHeight - margin;
          ball.body.setVelocityY(-Math.abs(ball.body.velocity.y) || -200);
          needsReposition = true;
        }
        
        if (needsReposition) {
          console.warn(`Bola reposicionada: (${ball.x.toFixed(0)}, ${ball.y.toFixed(0)})`);
        }
      }
    });
    
    // Verificar colisión manual entre bolas y hero (SIN destruir la bola)
    this.ballsGroup.children.entries.forEach(ball => {
      if (ball && ball.active && this.hero && this.hero.active) {
        const distance = Phaser.Math.Distance.Between(ball.x, ball.y, this.hero.x, this.hero.y);
        const minDistance = (ball.displayWidth + this.hero.displayWidth) / 2;
        
        if (distance < minDistance) {
          this.onHeroHitBall(ball, this.hero);
        }
      }
    });
    
    // Update time stop state
    this.updateTimeStop();
    
    // Mark newly spawned balls from splits during burst clear
    if (this.burstClearActive) {
      this.ballsGroup.children.entries.forEach(ball => {
        if (ball && ball.active && ball._spawnedFromMarkedBall && !this.markedForBurst.has(ball)) {
          // This ball was spawned from a marked ball during burst, mark it too
          this.markedForBurst.add(ball);
          ball._markedForBurst = true;
          console.log('Marking new split ball for burst');
        }
      });
    }
    
    // Freeze any newly spawned balls during time stop
    if (this.isFrozen) {
      this.ballsGroup.children.entries.forEach(ball => {
        if (ball && ball.body && ball.active && !ball._frozenVelocity) {
          // This ball was spawned during time stop, freeze it immediately
          ball._frozenVelocity = {
            x: ball.body.velocity.x,
            y: ball.body.velocity.y
          };
          ball._originalTintTopLeft = ball.tintTopLeft;
          ball._originalTintTopRight = ball.tintTopRight;
          ball._originalTintBottomLeft = ball.tintBottomLeft;
          ball._originalTintBottomRight = ball.tintBottomRight;
          ball._wasTinted = ball.isTinted;
          
          ball.body.setVelocity(0, 0);
          ball.body.setAllowGravity(false);
          ball.body.moves = false;
          ball.setTint(0x888888);
        }
      });
    }
    
    // Colisión Arpón vs bolas
    if (this.hero.activeHarpoons && this.hero.activeHarpoons.length > 0) {
      // Clean up destroyed harpoons
      this.hero.activeHarpoons = this.hero.activeHarpoons.filter(h => h && h.active);
      
      // Check collision for each active harpoon
      this.hero.activeHarpoons.forEach(harpoon => {
        if (harpoon && harpoon.active) {
          this.physics.overlap(
            harpoon,
            this.ballsGroup,
            this.onWeaponHitBall,
            null,
            this
          );
        }
      });
    }

    // Colisión Arpón Fijo vs bolas
    if (this.hero.activeFixedHarpoon && this.hero.activeFixedHarpoon.active) {
      // Colisión con techo para pegarse
      this.physics.collide(
        this.hero.activeFixedHarpoon,
        this.wallManager.getCeilingLayer(),
        (harpoon, tile) => {
          if (harpoon && harpoon.onWallCollision) {
            harpoon.onWallCollision();
          }
        },
        null,
        this
      );
      
      // Colisión con bolas
      this.physics.overlap(
        this.hero.activeFixedHarpoon,
        this.ballsGroup,
        this.onFixedHarpoonHitBall,
        null,
        this
      );
    }
  }

  /**
   * Activate time stop effect
   */
  activateTimeStop(duration = 3000) {
    const now = Date.now();
    const endTime = now + duration;
    
    // Don't stack - either set new time or extend to max
    if (this.timeStopUntil > now) {
      // Already active - extend but cap at max duration
      const maxDuration = 5000; // Max 5 seconds total
      const maxEndTime = now + maxDuration;
      this.timeStopUntil = Math.min(endTime, maxEndTime);
    } else {
      // New time stop
      this.timeStopUntil = endTime;
    }
    
    this.isFrozen = true;
    
    // Disable collision between hero and balls
    if (this.heroBallOverlap) {
      this.heroBallOverlap.active = false;
    }
    
    // Freeze all balls and stop their movement
    this.ballsGroup.children.entries.forEach(ball => {
      if (ball && ball.body && ball.active) {
        // Store velocity and original tint before freezing
        if (!ball._frozenVelocity) {
          ball._frozenVelocity = {
            x: ball.body.velocity.x,
            y: ball.body.velocity.y
          };
          // Store the current tint state
          ball._originalTintTopLeft = ball.tintTopLeft;
          ball._originalTintTopRight = ball.tintTopRight;
          ball._originalTintBottomLeft = ball.tintBottomLeft;
          ball._originalTintBottomRight = ball.tintBottomRight;
          ball._wasTinted = ball.isTinted;
        }
        // Stop movement completely - disable body to prevent all physics
        ball.body.setVelocity(0, 0);
        ball.body.setAllowGravity(false);
        ball.body.moves = false; // Disable all movement
        
        // Aplicar efecto de brillo pulsante (blanco brillante)
        ball.setTint(0xffffff);
        
        // Crear efecto de brillo pulsante
        if (!ball._glowTween) {
          ball._glowTween = this.tweens.add({
            targets: ball,
            alpha: { from: 1, to: 0.4 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    });
    
    console.log(`Time Stop activated for ${duration}ms`);
  }

  /**
   * Update time stop state each frame
   */
  updateTimeStop() {
    if (!this.isFrozen) return;
    
    const now = Date.now();
    
    if (now >= this.timeStopUntil) {
      // Time stop ended - unfreeze all balls
      this.isFrozen = false;
      
      // Re-enable collision between hero and balls
      if (this.heroBallOverlap) {
        this.heroBallOverlap.active = true;
      }
      
      this.ballsGroup.children.entries.forEach(ball => {
        if (ball && ball.body && ball.active && ball._frozenVelocity) {
          // Detener y eliminar el tween de brillo
          if (ball._glowTween) {
            ball._glowTween.stop();
            ball._glowTween.remove();
            ball._glowTween = null;
          }
          
          // Restaurar alpha a 1
          ball.setAlpha(1);
          
          // Re-enable body movement
          ball.body.setAllowGravity(true);
          ball.body.moves = true;
          
          // Restore velocity
          ball.body.setVelocity(
            ball._frozenVelocity.x,
            ball._frozenVelocity.y
          );
          
          // Restore original tint or clear if there was none
          if (ball._wasTinted) {
            // Restore the exact tint that was there before
            ball.setTint(
              ball._originalTintTopLeft,
              ball._originalTintTopRight,
              ball._originalTintBottomLeft,
              ball._originalTintBottomRight
            );
          } else {
            // No tint before, clear it
            ball.clearTint();
          }
          
          // Clear frozen state
          ball._frozenVelocity = null;
          ball._originalTintTopLeft = undefined;
          ball._originalTintTopRight = undefined;
          ball._originalTintBottomLeft = undefined;
          ball._originalTintBottomRight = undefined;
          ball._wasTinted = undefined;
        }
      });
      
      console.log('Time Stop ended');
    }
  }

  /**
   * Activate burst clear effect (Star special ball)
   * Marks all current balls and destroys them one by one (including splits)
   * @param {BaseSpecialBall} triggeringBall - The ball that triggered the effect
   */
  activateBurstClear(triggeringBall) {
    // Mark all current balls on screen (except triggering ball)
    this.markedForBurst.clear();
    this.burstClearActive = true;
    
    this.ballsGroup.children.entries.forEach(ball => {
      if (ball && ball.active && ball !== triggeringBall) {
        this.markedForBurst.add(ball);
        ball._markedForBurst = true;
      }
    });
    
    console.log(`Burst Clear: Marked ${this.markedForBurst.size} balls`);
    
    // Start the sequential destruction
    this.processBurstClear();
  }

  /**
   * Process burst clear - destroy one marked ball at a time
   */
  processBurstClear() {
    if (!this.burstClearActive) return;
    
    // Get next marked ball to destroy
    const markedBalls = Array.from(this.markedForBurst).filter(ball => ball.active);
    
    if (markedBalls.length === 0) {
      // All marked balls destroyed
      this.burstClearActive = false;
      this.markedForBurst.clear();
      console.log('Burst Clear: Complete');
      return;
    }
    
    // Destroy the first marked ball
    const ball = markedBalls[0];
    this.markedForBurst.delete(ball);
    
    if (ball && ball.active) {
      // Create burst particle effect
      this.createBurstParticle(ball.x, ball.y);
      
      // Award points
      if (this.game && this.game.events) {
        const score = ball.scoreValue || 10;
        this.game.events.emit(EVENTS.game.SCORE_CHANGE, score);
      }
      
      // Check if ball will split
      const willSplit = ball.nextBallType != null;
      
      if (willSplit) {
        // Mark that any spawned balls should be tracked
        this._currentBurstBall = ball;
        
        // Let the ball split naturally by calling takeDamage
        // We'll catch the spawned balls in the split() override
        ball.takeDamage();
        
        this._currentBurstBall = null;
      } else {
        // Ball won't split, just destroy it
        ball.destroy();
      }
    }
    
    // Schedule next ball destruction
    this.time.delayedCall(80, () => {
      this.processBurstClear();
    });
  }

  /**
   * Create burst particle effect
   */
  createBurstParticle(x, y) {
    const particle = this.add.circle(x, y, 30, 0xff8800, 1);
    particle.setDepth(200);
    
    this.tweens.add({
      targets: particle,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }

  onWeaponHitBall(weapon, ball) {
    if (weapon && weapon.active && ball && ball.active) {
      if (weapon.destroy) weapon.destroy();
      // Sonido de pop
      if (this.sound) this.sound.play('burbuja_pop', { volume: 0.7 });
      // IMPORTANTE: primero damage (emite score + floating text + split), y la bola se destruye desde dentro
      if (ball.takeDamage) ball.takeDamage();
    }
  }

  onFixedHarpoonHitBall(fixedHarpoon, ball) {
    if (fixedHarpoon && fixedHarpoon.active && ball && ball.active) {
      // Call the onBallHit method on the fixed harpoon to destroy it
      if (fixedHarpoon.onBallHit) fixedHarpoon.onBallHit();
      // Damage the ball
      if (ball.takeDamage) ball.takeDamage();
    }
  }

  onHeroHitBall(ball, hero) {
    if (!hero || !ball || !hero.active) return;
    if (hero.isInvulnerable || hero.isDead) return;
    
    // Cooldown simple: guardar timestamp en la bola misma
    const now = Date.now();
    
    if (ball._lastHeroContactTime && now - ball._lastHeroContactTime < 1000) {
      return; // Demasiado pronto, ignorar
    }
    ball._lastHeroContactTime = now;
    
    console.log(`[HERO HIT] Ball touched hero! Remaining lives: ${hero.lives}`);
    
    // Si el héroe tiene escudo
    if (hero.hasShield) {
      hero.breakShield();
      return;
    }
    
    // Si no tiene escudo, pierde vida (esto emitirá un evento que se encargará del reinicio)
    hero.takeDamage(1);
  }

  shutdown() {
    if (this.game.audioManager) {
      this.game.audioManager.stopMusic();
    }
    // ...existing code...
  }
}
