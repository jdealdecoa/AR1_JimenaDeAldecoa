// src/scenes/Level4.js

import { Hero } from "../entities/Hero.js";
import { GAME_SIZE } from "../core/constants.js";
import { Hud } from "../UI/HUD.js";
import { ReadyScreen } from "../UI/ReadyScreen.js";
import { PlatformManager } from "../objects/platforms/PlatformManager.js";
import { WallManager } from "../objects/WallManager.js";
import { BallManager } from "../entities/enemies/balls/BallManager.js";
import { Dropper } from "../entities/items/Dropper.js";
import { DropManager } from "../entities/items/DropManager.js";

//test temporal pajaros
import { SmallBird } from "../entities/enemies/birds/SmallBird.js";
import { BIRD_SPAWN_HEIGHTS, BIRD_COLORS } from "../entities/enemies/birds/BirdConstants.js";
import { BirdFlockManager } from "../entities/enemies/birds/BirdFlockManager.js";

// Cocodrilos
import { Crocodile } from "../entities/enemies/crocodiles/Crocodile.js";
import { CROCODILE_COLORS } from "../entities/enemies/crocodiles/CrocodileConstants.js";

export class Level4 extends Phaser.Scene {
  constructor() {
    super({ key: "Level4" });
    this.platformObjects = new Map();
    this.heroBallOverlap = null; // Referencia al overlap pelotas-héroe

    // Time effects (stackables)
    this.isTimeFrozen = false;
    this._timeFreezeEnd = 0;
    this._timeFreezeTimer = null;
    this._timeFreezeOverlay = null;

    this.isTimeSlowed = false;
    this._timeSlowEnd = 0;
    this._timeSlowTimer = null;
    this._timeSlowOverlay = null;

    // Ready Screen
    this.readyScreen = new ReadyScreen(this);

    // Bird Flock Manager
    this.birdFlockManager = null;
  }

  preload() {
    console.log('Nivel 4 abierto');
    // --- AUDIO ---
    this.load.setPath('assets/audio');
    this.load.audio('burbuja_pop', 'burbuja_pop.mp3');
    this.load.audio('rectangulo_pop', 'rectangulo_pop.mp3');
    this.load.audio('disparo', 'disparo.mp3');
    this.load.audio('inicio', 'inicio.mp3');
    this.load.audio('victoria', 'victoria.mp3');
    this.load.audio('gameover', 'gameover.mp3');
    // --- 1. FONDO ---
    this.load.setPath("assets/sprites/backgrounds");
    this.load.spritesheet("backgrounds", "backgrounds.png", {
      frameWidth: 256,
      frameHeight: 192
    });

    // --- 2. TILESETS (MUROS Y PLATAFORMAS) ---
    this.load.setPath("assets/tiled/tilesets");
    this.load.image("tileset_muros_img", "tileset_muros.png");
    this.load.image("tileset_platform_img", "tileset_platform.png");

    // --- 3. TILEMAP ---
    this.load.setPath("assets/tiled/maps");
    this.load.tilemapTiledJSON("map_level_04", "Level4.json");

    // --- 4. SPRITES HERO ---
    this.load.setPath("assets/sprites/spritesheets/hero");
    this.load.spritesheet("player", "spritesheet_player.png", {
      frameWidth: 118,
      frameHeight: 127,
      spacing: 0,
      margin: 0
    });

    // --- 5. ARMA ---
    this.load.setPath("assets/sprites/static");
    this.load.image("arponFijo", "arponFijo.png");
    this.load.image("arpon", "arpon.png");
    this.load.image("bullet", "disparo.png");

    // --- 6. PELOTAS ---
    this.load.setPath("assets/sprites/static");
    this.load.image("n_huge", "n_huge.png");
    this.load.image("n_big", "n_big.png");
    this.load.image("n_mid", "n_mid.png");
    this.load.image("n_small", "n_small.png");
    this.load.image("n_tiny1", "n_tiny1.png");
    this.load.image("n_tiny2", "n_tiny2.png");

    // --- 7. PELOTAS HEXAGONALES ---
    this.load.setPath("assets/sprites/spritesheets/Balls");
    this.load.spritesheet("hex_big", "hex_big.png", {
      frameWidth: 98 / 3,
      frameHeight: 30
    });
    this.load.spritesheet("hex_mid", "hex_mid.png", {
      frameWidth: 52 / 3,
      frameHeight: 16
    });
    this.load.spritesheet("hex_small", "hex_small.png", {
      frameWidth: 33 / 3,
      frameHeight: 10
    });

    // --- 8. POWER-UPS (BONUS SPRITESHEET) ---
    this.load.setPath("assets/sprites/static");
    this.load.spritesheet("bonus", "bonus.png", {
      frameWidth: 20,
      frameHeight: 20
    });

    // --- 9. BIRDS ---
    this.load.setPath("assets/sprites/spritesheets/enemies");
    this.load.spritesheet("bird_small", "bird_small.png", {
      frameWidth: 51,
      frameHeight: 31
    });

    // --- 10. CROCODILES ---
    this.load.setPath("assets/sprites/spritesheets/enemies");
    this.load.spritesheet("crocodile", "crocodile.png", {
      frameWidth: 118,
      frameHeight: 127
    });
  }

  create() {
                // Listener para vidas del héroe
                if (this.game && this.game.events) {
                  this.game.events.on('hero:damaged', (remainingLives) => {
                    if (remainingLives <= 0) {
                      if (this.sound) this.sound.play('gameover', { volume: 0.12 });
                      setTimeout(() => {
                        this.scene.start('MainMenuScene');
                      }, 2000);
                    }
                  });
                }
        // Ball counter and event listeners
        this._ballCount = 0;
        this._levelCompleted = false;
        if (this.game && this.game.events) {
          this.game.events.on('enemy:ball_created', (ball) => {
            this._ballCount++;
            console.log(`[BALL CREATED] Count: ${this._ballCount}`, ball);
          });
          this.game.events.on('enemy:ball_destroyed', async (ball) => {
            this._ballCount = Math.max(0, this._ballCount - 1);
            if (this._ballCount === 0 && !this._levelCompleted) {
              this._levelCompleted = true;
              this.game.audioManager.playEffect(this, 'victoria', { volume: 1 });
              await new Promise(res => setTimeout(res, 2000));
              this.game.audioManager.stopMusic();
              this.scene.start('Level5');
            }
          });
          this.game.events.on('hero:damaged', (remainingLives) => {
            if (remainingLives <= 0) {
              this.game.audioManager.playEffect(this, 'gameover', { volume: 0.12 });
              this.game.audioManager.stopMusic();
              setTimeout(() => {
                this.scene.start('MainMenuScene');
              }, 2000);
            }
          });
        }
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
          this.game.audioManager.stopMusic();
        });
    const BG_HEIGHT = GAME_SIZE.HEIGHT;

    // --- FONDO ---
    const bg = this.add.image(0, 0, "backgrounds", 1).setOrigin(0, 0);
    bg.setDisplaySize(GAME_SIZE.WIDTH, BG_HEIGHT);

    // el fondo al fondo de todo
    bg.setDepth(-2);

    this.cameras.main.setBackgroundColor(0x000000);

    // --- MAPA ---
    const map = this.make.tilemap({ key: "map_level_04" });
    this.map = map; // Guardar referencia al mapa

    const tilesetMuros = map.addTilesetImage("tileset_muros", "tileset_muros_img");
    const tilesetPlatform = map.addTilesetImage("tileset_platforms", "tileset_platform_img");

    // --- WALL MANAGER (floor, ceiling) ---
    this.wallManager = new WallManager(this, map, {
      floorLayer: "layer_floor",
      ceilingLayer: "layer_ceiling",
      tilesetName: tilesetMuros
    });

    this.platformsStatic = map.createLayer("layer_platforms_undestructable", tilesetPlatform, 0, 0);
    this.platformsBreakable = map.createLayer("layer_platforms_destructable", tilesetPlatform, 0, 0);

    // Colisión tiles (IMPORTANTE: los tiles deben tener collision shape en Tiled)
    
    if (this.platformsStatic) {
      this.platformsStatic.setCollisionByExclusion([-1, 0]);
      // Asegurar que todos los tiles tengan colisión en todas las caras
      this.platformsStatic.forEachTile(tile => {
        if (tile && tile.index > 0) {
          tile.setCollision(true, true, true, true);
        }
      });
    }
    
    if (this.platformsBreakable) {
      this.platformsBreakable.setCollisionByExclusion([-1, 0]);
    }

    // Initialize Platform Manager with breakable layer
    this.platformManager = new PlatformManager(this, map, this.platformsBreakable);
    
    // Store tile positions before clearing
    const breakableTilePositions = [];
    if (this.platformsBreakable) {
      this.platformsBreakable.forEachTile((tile) => {
        if (tile.index > 0) {
          breakableTilePositions.push({
            x: tile.x,
            y: tile.y,
            index: tile.index
          });
        }
      });
      
      // Clear original tiles (we'll recreate them as platform objects)
      this.platformsBreakable.fill(-1);
    }
    
    // Create platforms from stored positions
    breakableTilePositions.forEach(pos => {
      const pattern = [pos.index]; // Use the actual tile index
      const color = 0x00FFFF; // Cyan glass for breakable
      
      this.platformManager.createBreakablePlatform(
        pos.x, pos.y,
        pattern,
        color,
        null // No drop for now
      );
    });
    
    // Static platforms keep collision but no special behavior needed
    
    this.createPlatformObjects();

    // Bounds mundo físico
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Mejorar colisiones tilemap (reduce tunneling)
    this.physics.world.TILE_BIAS = 64;
    this.physics.world.overlapBias = 32;

    // --- INPUT ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // --- GRUPO DE BALAS ---
    this.bullets = this.add.group({ runChildUpdate: true });

    // --- GRUPO DE PELOTAS ---
    this.ballsGroup = this.physics.add.group();
    // Balas rompen plataformas - TEMPORALMENTE DESACTIVADO hasta implementar nuevo sistema
    // this.physics.add.collider(
    //   this.bullets,
    //   this.platforms,
    //   this.onWeaponHitsPlatform,
    //   null,
    //   this
    // );

    // --- HERO ---
    const startX = map.widthInPixels / 2;
    const startY = map.heightInPixels - 64;
    this.hero = new Hero(this, startX, startY, "player");

    // Configuración del héroe
    this.hero.body.immovable = true;
    this.hero.body.pushable = false;
    this.hero.body.moves = true;
    this.hero.body.setMass(10000);

    // Referencias de input para el Hero
    this.hero.cursors = this.cursors;
    this.hero.keyShoot = this.keyShoot;
    this.hero.keySpace = this.keyShoot;

    // --- COLISIONES HERO ---
    this.wallManager.addHeroCollider(this.hero);
    this.physics.add.collider(this.hero, this.platformsStatic);
    this.physics.add.collider(this.hero, this.platformsBreakable);

    // --- COLISIONES BOLAS ---
    this.wallManager.addGroupCollider(this.ballsGroup, this.bounceBall, this);
    this.physics.add.collider(this.ballsGroup, this.platformsStatic, this.bounceBall, null, this);
    this.physics.add.collider(this.ballsGroup, this.platformsBreakable, this.bounceBall, null, this);
    // Overlap con el héroe - NO hay separación física automática, solo rebote manual
    this.heroBallOverlap = this.physics.add.overlap(this.ballsGroup, this.hero, this.bounceOffHero, null, this);

    // --- ANIM IDLE ---
    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: 3 }],
        frameRate: 1,
        repeat: -1
      });
    }
    this.hero.play("idle");

    // ===================== BALLS (DESDE TILED) =====================
    this.ballManager = new BallManager(this, this.map, this.ballsGroup);
    this.ballManager.createFromObjectLayer('balls');
    // Log all balls detected at start
    console.log('[BALLS INIT] Balls detected:', this.ballsGroup.getChildren());

    // --- DROPPER (SISTEMA DE ITEMS) ---

    this.dropper = new Dropper(this, {
      dropChance: 1, // 50% de probabilidad de drop (puedes ajustar)
      maxItems: 8
    });

    // --- MANAGER DE DROPS ---
    this.dropManager = new DropManager(this, map, this.dropper, this.platformManager, this.platformObjects);
    this.dropManager.createDropsFromLayers();

    // --- COLISIONES ITEMS (sin rebote) ---
    // Los items colisionan con paredes y plataformas pero no rebotan
    this.wallManager.addGroupCollider(this.dropper.activeItems);
    this.physics.add.collider(this.dropper.activeItems, this.platformsStatic);
    this.physics.add.collider(this.dropper.activeItems, this.platformsBreakable);

    // --- HUD ---
    this.hud = new Hud(this, {
      uiTop: map.heightInPixels,
      mode: "HARPOON"
    });

    // --- PAUSA ---
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.launch("PauseMenu", { from: "Level4" });
      this.scene.pause();
      this.scene.bringToTop("PauseMenu");
    });

    this.birdsGroup = this.physics.add.group();

    // Initialize Bird Flock Manager
    this.birdFlockManager = new BirdFlockManager(this, map.widthInPixels);
  
    // --- BIRD COLLISIONS ---
    // Birds damage hero on overlap (only while flying)
    this.physics.add.overlap(
      this.birdsGroup,
      this.hero,
      this.birdHitsHero,
      null,
      this
    );
    
    // Birds collide with floor/ceiling/walls ONLY when falling
    this.physics.add.collider(
      this.birdsGroup,
      this.wallManager.getFloorLayer(),
      null,
      (bird) => bird && bird.isFalling && !bird.isDead,
      this
    );
    
    if (this.wallManager.getCeilingLayer()) {
      this.physics.add.collider(
        this.birdsGroup,
        this.wallManager.getCeilingLayer(),
        null,
        (bird) => bird && bird.isFalling && !bird.isDead,
        this
      );
    }
    
    if (this.wallManager.getWallsLayer()) {
      this.physics.add.collider(
        this.birdsGroup,
        this.wallManager.getWallsLayer(),
        null,
        (bird) => bird && bird.isFalling && !bird.isDead,
        this
      );
    }
    
    // Birds vs platforms
    this.physics.add.collider(
      this.birdsGroup,
      this.platformsStatic,
      null,
      (bird) => bird && bird.isFalling && !bird.isDead,
      this
    );
    
    this.physics.add.collider(
      this.birdsGroup,
      this.platformsBreakable,
      null,
      (bird) => bird && bird.isFalling && !bird.isDead,
      this
    );
    
    // Bullets hit birds
    this.physics.add.overlap(
      this.bullets,
      this.birdsGroup,
      this.onWeaponHitsBird,
      null,
      this
    );
    
    // --- SPAWN INITIAL FLOCK OF BIRDS ---
    const initialY = BIRD_SPAWN_HEIGHTS.HIGH;
    const initialDirection = 1;
    this.birdFlockManager.spawnFlock(0, initialY, initialDirection);
    
    // --- BIRD SPAWNER TIMER ---
    this.birdSpawnTimer = this.time.addEvent({
      delay: Phaser.Math.Between(3000, 5000),
      callback: this.spawnRandomBird,
      callbackScope: this,
      loop: true
    });
    
    // --- DEBUG KEY ---
    this.setupLevelSkipKeys();

    // ===================== CROCODILES =====================
    this.crocodilesGroup = this.physics.add.group();

    // Crocodiles collide with floor and platforms
    if (this.wallManager.getFloorLayer()) {
      this.physics.add.collider(this.crocodilesGroup, this.wallManager.getFloorLayer());
    }
    this.physics.add.collider(this.crocodilesGroup, this.platformsStatic);
    this.physics.add.collider(this.crocodilesGroup, this.platformsBreakable);

    // Crocodiles hit hero
    this.physics.add.overlap(
      this.crocodilesGroup,
      this.hero,
      this.onPlayerHitsCrocodile,
      null,
      this
    );

    // DEBUG: Press V to spawn crocodile
    this.input.keyboard.on('keydown-V', () => {
      const groundY = 700;
      this.spawnCrocodile(this.hero.x, groundY);
    });

    // Show ready screen at level start
    this.readyScreen.show(1500);
  }

  spawnBird(type, x, y, direction = 1) {
    // Deprecated: Use spawnBirdFlock() instead
    let bird;
    
    if (type === 'SMALL') {
      bird = new SmallBird(this, x, y, direction);
    } else {
      bird = new SmallBird(this, x, y, direction);
    }
    
    const colors = Object.values(BIRD_COLORS);
    const randomColor = Phaser.Utils.Array.GetRandom(colors);
    bird.setTint(randomColor);
    
    this.birdsGroup.add(bird);
    
    return bird;
  }

  /**
   * Spawn a new flock of birds (or respawn non-eliminated birds)
   */
  spawnBirdFlock() {
    // Check if current flock is complete
    if (!this.birdFlockManager.isFlockComplete()) {
      return; // Still have birds alive
    }

    // Pick random spawn parameters
    const heights = Object.values(BIRD_SPAWN_HEIGHTS);
    const y = Phaser.Utils.Array.GetRandom(heights);
    const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

    // Spawn the flock using the manager
    this.birdFlockManager.spawnFlock(0, y, direction);
  }

  spawnRandomBird() {
    // Trigger flock spawning if needed
    this.spawnBirdFlock();
  }

  /**
   * Permite navegar entre niveles con B (atrás) y N (adelante)
   */
  setupLevelSkipKeys() {
    const LEVEL_ORDER = [
      'Level1','Level2','Level3','Level4','Level5',
      'Level6','Level7','Level8','Level9','Level10'
    ];

    const currentKey = this.scene.key;
    const idx = LEVEL_ORDER.indexOf(currentKey);
    const prev = idx > 0 ? LEVEL_ORDER[idx - 1] : null;
    const next = idx >= 0 && idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;

    this.input.keyboard.on('keydown-B', () => {
      if (prev) this.scene.start(prev);
    });

    this.input.keyboard.on('keydown-N', () => {
      if (next) this.scene.start(next);
    });
  }

  birdHitsHero(hero, bird) {
    if (bird && bird.isFlying && !bird.isDead && hero && hero.active) {
      if (hero.isInvulnerable) return;
      hero.takeDamage(1);
    }
  }

  spawnCrocodile(x, y) {
    const croc = new Crocodile(this, x, y);
    this.crocodilesGroup.add(croc);
    return croc;
  }

  onPlayerHitsCrocodile(hero, croc) {
    if (!croc || !croc.active) return;

    if (croc.state === 'STUNNED') {
      croc.launchFlying(hero.x);
    }
  }

  onWeaponHitsCrocodile(weapon, croc) {
    if (!weapon || !weapon.active) return;
    if (!croc || !croc.active || croc.isDead) return;


    if (weapon.destroy) weapon.destroy();

    if (croc.takeDamage) croc.takeDamage();
  }

  createPlatformObjects() {
    // TODO: Implement new platform system with PlatformManager
    // this.platformObjects.clear();

    // this.platforms.forEachTile((tile) => {
    //   if (tile.index > 0) {
    //     const key = `${tile.x}_${tile.y}`;
    //     const platform = new Platform(this, tile);
    //     this.platformObjects.set(key, platform);
    //   }
    // });

  }

  createBall() {
    const startX = this.map.widthInPixels / 2;
    const startY = 200;

    // Elegir un color aleatorio para la bola inicial
    const colors = Object.values(BALL_COLORS);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const ball = new HugeBall(this, startX, startY, 1, randomColor);
    this.ballsGroup.add(ball);

    // Empujón inicial con velocidad horizontal y vertical
    ball.body.setVelocityY(50);
    ball.body.setVelocityX(150); // Fuerza horizontal para probar rebote en paredes
  }

  bounceBall(ball, objectOrTile) {
    if (!ball || !ball.body) return;

    // Cooldown para evitar rebotes múltiples
    const now = Date.now();
    if (ball._lastBounce && now - ball._lastBounce < 60) {
      return; // Ignorar si rebotó hace menos de 100ms
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
      ball.y -= 2; // Separación pequeña para evitar re-colisión inmediata
    }
    
    if (ball.body.blocked.up || ball.body.touching.up) {
      // Rebote desde ABAJO de una plataforma:
      // - evita impulsos hacia abajo demasiado fuertes (tunneling)
      // - separa poco para no "empujar" la bola dentro de otras colisiones
      const downwardVel = Math.min(200, Math.max(80, ball._constantBounceVel.y * 0.35));
      ball.body.setVelocityY(downwardVel);
      ball.y += 2;
    }
    
    // Rebote horizontal (izquierda/derecha)
    if (ball.body.blocked.left || ball.body.touching.left) {
      ball.body.setVelocityX(ball._constantBounceVel.x);
      ball.x += 2;
    }
    
    if (ball.body.blocked.right || ball.body.touching.right) {
      ball.body.setVelocityX(-ball._constantBounceVel.x);
      ball.x -= 2;
    }

    // Clamp de seguridad (Arcade puede tunelizar con picos de velocidad)
    if (ball.maxVelocityX && ball.maxVelocityY) {
      ball.body.velocity.x = Phaser.Math.Clamp(ball.body.velocity.x, -ball.maxVelocityX, ball.maxVelocityX);
      ball.body.velocity.y = Phaser.Math.Clamp(ball.body.velocity.y, -ball.maxVelocityY, ball.maxVelocityY);
    }
  }

  bounceOffHero(hero, ball) {
    if (!ball || !ball.body || !hero || !hero.body) return;

    // El JUGADOR recibe daño cuando toca la pelota, solo si NO es invulnerable
    if (hero.isInvulnerable) return;
    hero.takeDamage(1);
  }

  // ===================== TIME EFFECTS (STACK) =====================
  addTimeFreeze(durationMs) {
    const now = this.time.now;
    const base = Math.max(this._timeFreezeEnd || 0, now);
    this._timeFreezeEnd = base + durationMs;

    // Si ya estaba congelado, solo extendemos
    if (!this.isTimeFrozen) {
      this.isTimeFrozen = true;
      this.disableHeroBallOverlap();
      this._freezeGroups();
      this._showFreezeOverlay();
    }

    // Reschedule timer al nuevo end
    if (this._timeFreezeTimer) this._timeFreezeTimer.remove(false);
    this._timeFreezeTimer = this.time.delayedCall(
      this._timeFreezeEnd - now,
      () => {
        this.isTimeFrozen = false;
        this.enableHeroBallOverlap();
        this._unfreezeGroups();
        this._hideFreezeOverlay();
        this._timeFreezeTimer = null;
      },
      null,
      this
    );
  }

  addTimeSlow(durationMs, multiplier = 0.5) {
    const now = this.time.now;
    const base = Math.max(this._timeSlowEnd || 0, now);
    this._timeSlowEnd = base + durationMs;

    // Solo aplicamos el slow una vez (evita acumular multiplicadores)
    if (!this.isTimeSlowed) {
      this.isTimeSlowed = true;
      this._timeSlowMultiplier = multiplier;
      this._slowGroups(multiplier);
      this._showSlowOverlay();
    }

    if (this._timeSlowTimer) this._timeSlowTimer.remove(false);
    this._timeSlowTimer = this.time.delayedCall(
      this._timeSlowEnd - now,
      () => {
        this.isTimeSlowed = false;
        this._restoreSlowGroups();
        this._hideSlowOverlay();
        this._timeSlowTimer = null;
      },
      null,
      this
    );
  }

  _freezeGroups() {
    // Balls
    if (this.ballsGroup) {
      this.ballsGroup.getChildren().forEach(ball => {
        if (!ball || !ball.body || !ball.active) return;
        if (ball._isFrozen) return;
        ball._isFrozen = true;
        ball._frozenVel = { x: ball.body.velocity.x, y: ball.body.velocity.y };
        ball.body.setVelocity(0, 0);
      });
    }

    // HERO INVULNERABLE DURANTE FREEZE
    if (this.hero) {
      this.hero.isInvulnerable = true;
    }

    // Birds
    if (this.birdsGroup) {
      this.birdsGroup.getChildren().forEach(bird => {
        if (!bird || !bird.body || !bird.active) return;
        if (bird._isFrozen) return;
        bird._isFrozen = true;
        bird._frozenVel = { x: bird.body.velocity.x, y: bird.body.velocity.y };
        bird.body.setVelocity(0, 0);
      });
    }

    // Crocodiles
    if (this.crocodilesGroup) {
      this.crocodilesGroup.getChildren().forEach(croc => {
        if (!croc || !croc.body || !croc.active) return;
        if (croc._isFrozen) return;
        croc._isFrozen = true;
        croc._frozenVel = { x: croc.body.velocity.x, y: croc.body.velocity.y };
        croc.body.setVelocity(0, 0);
      });
    }
  }

  _unfreezeGroups() {
    const restore = (obj) => {
      if (!obj || !obj.body) return;
      if (!obj._isFrozen) return;
      obj._isFrozen = false;
      // Si tiene método restoreTrajectoryAfterFreeze, llamarlo
      if (typeof obj.restoreTrajectoryAfterFreeze === 'function') {
        obj.restoreTrajectoryAfterFreeze();
      } else {
        const v = obj._frozenVel || { x: 0, y: 0 };
        obj.body.setVelocity(v.x, v.y);
      }
      obj._frozenVel = null;
    };

    this.ballsGroup?.getChildren().forEach(restore);
    this.birdsGroup?.getChildren().forEach(restore);
    this.crocodilesGroup?.getChildren().forEach(restore);

    // HERO VUELVE A SER VULNERABLE
    if (this.hero) {
      this.hero.isInvulnerable = false;
    }
  }

  _slowGroups(multiplier) {
    const apply = (obj) => {
      if (!obj || !obj.body || !obj.active) return;
      if (obj._isSlowed) return;
      obj._isSlowed = true;
      obj._slowOriginalVel = { x: obj.body.velocity.x, y: obj.body.velocity.y };
      obj.body.setVelocity(obj.body.velocity.x * multiplier, obj.body.velocity.y * multiplier);
    };

    this.ballsGroup?.getChildren().forEach(apply);
    this.birdsGroup?.getChildren().forEach(apply);
    this.crocodilesGroup?.getChildren().forEach(apply);
  }

  _restoreSlowGroups() {
    const restore = (obj) => {
      if (!obj || !obj.body) return;
      if (!obj._isSlowed) return;
      obj._isSlowed = false;
      const v = obj._slowOriginalVel || { x: obj.body.velocity.x, y: obj.body.velocity.y };
      obj.body.setVelocity(v.x, v.y);
      obj._slowOriginalVel = null;
    };

    this.ballsGroup?.getChildren().forEach(restore);
    this.birdsGroup?.getChildren().forEach(restore);
    this.crocodilesGroup?.getChildren().forEach(restore);
  }

  _showFreezeOverlay() {
    if (this._freezeOverlay) return;
    this._freezeOverlay = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x66ccff,
        0.15
      )
      .setScrollFactor(0)
      .setDepth(999);
  }

  _hideFreezeOverlay() {
    if (this._freezeOverlay) {
      this._freezeOverlay.destroy();
      this._freezeOverlay = null;
    }
  }

  _showSlowOverlay() {
    if (this._slowOverlay) return;
    this._slowOverlay = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x8800ff,
        0.08
      )
      .setScrollFactor(0)
      .setDepth(998);
  }

  _hideSlowOverlay() {
    if (this._slowOverlay) {
      this._slowOverlay.destroy();
      this._slowOverlay = null;
    }
  }

  update() {
    // Destruir pelotas fuera de la pantalla
    this.ballsGroup.children.entries.forEach(ball => {
      if (ball && ball.active) {
        if (ball.y > this.cameras.main.height + 50 || ball.y < -50 || 
            ball.x < -50 || ball.x > this.cameras.main.width + 50) {
          ball.destroy();
        }
      }
    });

    // Arpón rompiendo plataformas y pelotas
    if (this.hero.activeHarpoons && this.hero.activeHarpoons.length > 0) {
      // Clean up destroyed harpoons
      this.hero.activeHarpoons = this.hero.activeHarpoons.filter(h => h && h.active);
      
      // Check collision for each active harpoon
      this.hero.activeHarpoons.forEach(harpoon => {
        if (harpoon && harpoon.active) {
          // Colisión con plataformas breakable
          this.physics.overlap(
            harpoon,
            this.platformsBreakable,
            (harpoon, tile) => {
              if (tile && tile.properties && tile.properties.platform) {
                this.platformManager.onWeaponHitPlatform(harpoon, tile);
              }
            },
            null,
            this
          );

          this.physics.overlap(
            harpoon,
            this.ballsGroup,
            this.onWeaponHitsBall,
            null,
            this
          );

          // Harpoon hits birds
          this.physics.overlap(
            harpoon,
            this.birdsGroup,
            this.onWeaponHitsBird,
            null,
            this
          );

          // Harpoon hits crocodiles
          this.physics.overlap(
            harpoon,
            this.crocodilesGroup,
            this.onWeaponHitsCrocodile,
            null,
            this
          );
        }
      });
    }

    // Arpón Fijo rompiendo pelotas
    if (this.hero.activeFixedHarpoon && this.hero.activeFixedHarpoon.active) {
      // Colisión con techo para pegarse
      if (this.wallManager.getCeilingLayer()) {
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
      }

      // Colisión con plataformas estáticas para pegarse (igual que las paredes)
      this.physics.collide(
        this.hero.activeFixedHarpoon,
        this.platformsStatic,
        (harpoon, tile) => {
          if (harpoon && harpoon.onWallCollision) {
            harpoon.onWallCollision(); // Se pega, NO destruye la plataforma
          }
        },
        null,
        this
      );

      // Colisión con plataformas breakable
      this.physics.overlap(
        this.hero.activeFixedHarpoon,
        this.platformsBreakable,
        (harpoon, tile) => {
          if (tile && tile.properties && tile.properties.platform) {
            this.platformManager.onWeaponHitPlatform(harpoon, tile);
          }
        },
        null,
        this
      );
      
      // Colisión con bolas
      this.physics.overlap(
        this.hero.activeFixedHarpoon,
        this.ballsGroup,
        this.onFixedHarpoonHitsBall,
        null,
        this
      );

      // Fixed harpoon hits birds
      this.physics.overlap(
        this.hero.activeFixedHarpoon,
        this.birdsGroup,
        this.onWeaponHitsBird,
        null,
        this
      );

      // Fixed harpoon hits crocodiles
      this.physics.overlap(
        this.hero.activeFixedHarpoon,
        this.crocodilesGroup,
        this.onWeaponHitsCrocodile,
        null,
        this
      );
    }

    // Balas destruyendo pelotas
    this.physics.overlap(this.bullets, this.ballsGroup, this.onWeaponHitsBall, null, this);

    // Balas vs Crocodiles
    this.physics.overlap(
      this.bullets,
      this.crocodilesGroup,
      this.onWeaponHitsCrocodile,
      null,
      this
    );

    // Balas vs Plataformas Breakable
    this.physics.overlap(
      this.bullets,
      this.platformsBreakable,
      (bullet, tile) => {
        if (tile && tile.properties && tile.properties.platform) {
          this.platformManager.onWeaponHitPlatform(bullet, tile);
        }
      },
      null,
      this
    );

    // CHECK ITEM PICKUPS
    if (this.dropper && this.dropper.activeItems) {
      this.dropper.activeItems.getChildren().forEach(item => {
        if (item && item.active && !item.consumed) {
          item.checkPickup(this.hero);
        }
      });
    }
  }

  onWeaponHitsBird(weapon, bird) {
    if (weapon && weapon.active && bird && bird.active && !bird.isDead) {
      
      if (weapon.destroy) weapon.destroy();
      
      if (bird.takeDamage) bird.takeDamage();
    }
  }

  onWeaponHitsPlatform(weapon, tile) {
    const key = `${tile.x}_${tile.y}`;
    const platform = this.platformObjects.get(key);

    if (platform) {
      platform.break(weapon);
      this.platformObjects.delete(key);
    }
      
    if (weapon && weapon.active && weapon.destroy) weapon.destroy();
  }

  onWeaponHitsBall(weapon, ball) {
    if (weapon && weapon.active && ball && ball.active) {
      if (weapon.destroy) weapon.destroy();
      // Remove ball from group before destroying
      if (this.ballsGroup && this.ballsGroup.contains(ball)) {
        this.ballsGroup.remove(ball, true, true);
        console.log(`[BALL REMOVED FROM GROUP] Remaining: ${this.ballsGroup.getChildren().length}`);
        // Check group length for level completion
        if (this.ballsGroup.getChildren().length === 0 && !this._levelCompleted) {
          this._levelCompleted = true;
          console.log('Nivel 4 completado, pasando a Nivel 5');
          this.scene.start('Level5');
        }
      }
      // Play ball pop sound
      if (this.sound) this.sound.play('burbuja_pop', { volume: 0.7 });
      if (ball.takeDamage) ball.takeDamage();
    }
  }

  onFixedHarpoonHitsBall(fixedHarpoon, ball) {
    if (fixedHarpoon && fixedHarpoon.active && ball && ball.active) {
      // Call the onBallHit method on the fixed harpoon to destroy it
      if (fixedHarpoon.onBallHit) fixedHarpoon.onBallHit();
      // Damage the ball
      if (ball.takeDamage) ball.takeDamage();
    }
  }

  // Llama a esto cuando se active el time freeze
  disableHeroBallOverlap() {
    if (this.heroBallOverlap) this.heroBallOverlap.active = false;
  }

  // Llama a esto cuando termine el time freeze
  enableHeroBallOverlap() {
    if (this.heroBallOverlap) this.heroBallOverlap.active = true;
  }
}

export default Level4;