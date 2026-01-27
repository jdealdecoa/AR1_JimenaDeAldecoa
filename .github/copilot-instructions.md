# SuperPang Clone - AI Agent Guide

## Project Overview
Phaser 3 game implementing a Super Pang (Buster Bros.) clone with two modes: Tour (level-based) and Panic (endless). Uses ES6 modules without a bundler—files load directly via `<script type="module">`.

## Architecture

### Global Pattern: Window Namespace
- **Critical**: No module exports for core utilities. They attach to `window`:
  - `window.buildConfig()` - Phaser config builder ([config.js](src/core/config.js))
  - `window.AudioManager` - Global audio controller ([AudioManager.js](src/core/AudioManager.js))
- Access pattern: `this.scene.game.audioManager.playEffect(this.scene, 'burbuja_pop')`

### Scene Structure
- Each level is a full scene (Level1-10, PanicLevel) extending `Phaser.Scene`
- Scenes are self-contained: preload all assets, create entities, manage lifecycle
- Level scenes import and instantiate managers (BallManager, PlatformManager, WallManager, Dropper)
- Example: [Level1.js](src/scenes/Level1.js) shows the canonical structure

### Manager Pattern
Every entity type has a dedicated manager for spawning/tracking:
- `BallManager` - Creates balls from Tiled object layers or programmatically
- `PlatformManager` - Handles static and breakable platforms
- `WallManager` - Manages collision boundaries from Tiled
- `DropManager` - Tracks dropped items globally across levels
- `Dropper` - Handles item spawning with weighted loot tables

### Entity Hierarchy
```
HeroBase (base movement/physics)
  └─ Hero (weapons, power-ups, lives)

BaseBall (core ball physics)
  ├─ Normal: HugeBall → BigBall → MidBall → SmallBall → TinyBall
  ├─ Hexagonal: HexBigBall → HexMidBall → HexSmallBall
  └─ Special: SpecialBigBall → SpecialMidBall (animated)

BaseItem (TTL, physics)
  ├─ Fruits (score bonuses)
  └─ Power-ups (shield, weapons, time effects)
```

### Tiled Integration
- Maps stored in `assets/tiled/maps/` (both .tmx and .json)
- Object layers define entity spawning:
  - `balls` layer: Ball positions with custom properties (`type`, `dirX`, `initialSpeed`, `color`)
  - `platforms` layer: Platform definitions with `breakable` property
  - `items` layer: Pre-placed items with `dropItem` property
- Ball types in Tiled: `huge`, `big`, `mid`, `small`, `tiny1`, `tiny2`, `hex_big`, `hex_mid`, `hex_small`
- Platform creation is synchronous in `create()` - no async loading

### Event System
Centralized event bus via `game.events` (not scene.events):
```javascript
// Listen: this.scene.game.events.on(EVENTS.hero.DAMAGED, callback)
// Emit: this.scene.game.events.emit(EVENTS.enemy.BALL_DESTROYED, data)
```
Key events in [events.js](src/core/events.js): hero lifecycle, ball creation/destruction, item collection, score changes

## Critical Patterns

### Ball Spawning & Splitting
1. BallManager reads Tiled object layer properties to determine ball type/behavior
2. When hit, balls emit `BALL_DESTROYED` event with split data
3. Split logic: Each ball class defines `nextBallType` (e.g., `BigBall` → 2x `MidBall`)
4. **Important**: Use ball color inheritance (`this.ballColor`) when spawning children

### Item Dropping
- Weighted loot table in [Dropper.js](src/entities/items/Dropper.js) (`DEFAULT_LOOT_TABLE`)
- Drop chance: 40% by default (`DROPPER_CONFIG.DROP_CHANCE`)
- Max items on screen: 8 (`DROPPER_CONFIG.MAX_ITEMS_ON_SCREEN`)
- Items auto-despawn after TTL (defined in `ITEMS.TTL` constants)

### Weapon System
Hero has 3 weapon types (switch via keys 1-3 in Panic mode):
- `HARPOON` (1): Standard vertical shot, max 1-2 active
- `GUN` (2): Machine gun with bullets (lifespan-based)
- `FIXED_HARPOON` (3): Diagonal shot, single active instance

Power-ups provide temporary weapons: `WeaponTempDouble`, `WeaponTempMachine`, `WeaponTempFixed`

### Power-Up Effects
- **Shield**: Tint hero cyan, absorb 1 hit, use "keeper" timer to maintain tint (see [Hero.js](src/entities/Hero.js) `startShieldTintKeeper()`)
- **Time effects**: Freeze or slow game via `scene.physics.world.timeScale` and enemy pause
- **Weapon upgrades**: Modify `hero.weaponLevel` and `hero.weaponStats`

## Constants & Configuration
All game-wide values in [constants.js](src/core/constants.js):
- `GAME_SIZE`: 1536x950 canvas
- `PHYSICS.GRAVITY`: 1000 (world), 600 (balls), 200 (ball default)
- `HERO.JUMP_FORCE`: -450
- `ITEMS.DROP_CHANCE`: 0.4
- **Never hardcode** these values—always import from constants

## HUD & UI
- HUD constructed in [HUD.js](src/UI/HUD.js) with lives (icons), score, mode labels
- Lives: First 3 shown as icons, extras as "x{number}" text
- Update via events: `EVENTS.hero.DAMAGED`, `EVENTS.game.SCORE_CHANGE`
- ReadyScreen shows countdown before level starts

## Asset Loading
- **Path Pattern**: Always `load.setPath()` before loading group of assets
  ```javascript
  this.load.setPath('assets/sprites/spritesheets/hero');
  this.load.spritesheet('player', 'spritesheet_player.png', {...});
  ```
- Spritesheets require explicit `frameWidth`/`frameHeight`
- Tiled maps: Load as `tilemapTiledJSON`, then `map.addTilesetImage('tileset_name', 'loaded_image_key')`

## Development Workflow
- **Run**: Open `index.html` in a local server (e.g., `python -m http.server` or Live Server)
- **No build step**: Direct ES6 module loading in browser
- **Debugging**: Enable physics debug in [constants.js](src/core/constants.js) (`PHYSICS.DEBUG = true`)
- **TypeScript types**: Phaser IntelliSense via [phaser.d.ts](src/type/phaser.d.ts) reference in main.js

## Common Pitfalls
1. **Don't forget `window.` prefix** for buildConfig and AudioManager
2. **Ball collider setup**: Call `setCircle()` BEFORE scaling sprite (see [BaseBall.js](src/entities/enemies/balls/normal/BaseBall.js))
3. **Tile-platform linkage**: Ensure tiles store reference to platform object (`t.properties.platform = platform`)
4. **Scene keys**: Must match Tiled map names for auto-level detection in HUD
5. **Event listeners**: Use `game.events` (global), not `scene.events` (local to scene)
6. **Item spawn limits**: Check `DropManager.canSpawnItem()` before creating items
