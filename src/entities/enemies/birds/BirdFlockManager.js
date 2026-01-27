import { BIRD_SPAWN_HEIGHTS, BIRD_COLORS } from './BirdConstants.js';
import { SmallBird } from './SmallBird.js';

/**
 * BirdFlockManager - Manages spawning and tracking of bird flocks
 * 
 * Spawns birds in groups of 5 in a line. When a bird is eliminated,
 * it won't spawn again in subsequent flocks. When all birds are defeated,
 * a new flock is generated.
 */
export class BirdFlockManager {
  constructor(scene, mapWidth) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    
    // Track which bird indices (0-4) have been eliminated in current flock
    this.eliminatedIndices = new Set();
    
    // Current flock being spawned
    this.currentFlock = [];
    
    // All birds that have ever been spawned (for tracking)
    this.allBirds = [];
  }

  /**
   * Spawn a flock of 5 birds in a line, skipping any that have been eliminated
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} direction - Direction (1 for right, -1 for left)
   * @param {number} spacing - Spacing between birds (pixels)
   */
  spawnFlock(x, y, direction = 1, spacing = 120) {
    const birds = [];
    
    // Determine world bounds and safe margins
    const worldWidth = this.mapWidth || this.scene.physics.world.bounds.width || 800;
    const margin = 80;

    // Remaining birds to spawn (skip eliminated)
    const remainingSlots = 5 - this.eliminatedIndices.size;
    const slots = Math.max(remainingSlots, 1);

    // Adjust spacing so that all birds fit comfortably inside margins
    const maxUsableWidth = Math.max(1, worldWidth - margin * 2);
    const maxSpacing = maxUsableWidth / Math.max(1, slots - 1);
    const finalSpacing = Math.max(80, Math.min(spacing, maxSpacing));

    // Starting position depends on direction and leaves margin inside screen
    const startX = direction > 0 ? margin : worldWidth - margin;
    const startY = y;

    // Spawn 5 birds, but skip eliminated ones
    let spawnedCount = 0;
    for (let i = 0; i < 5; i++) {
      // Skip if this bird index was eliminated in previous flock
      if (this.eliminatedIndices.has(i)) {
        continue;
      }

      // Calculate position in the line (birds behind each other)
      const offset = spawnedCount * finalSpacing * direction;
      const birdX = startX + offset;
      
      const bird = new SmallBird(this.scene, birdX, startY, direction);
      
      // Store the index for tracking if eliminated
      bird.flockIndex = i;
      
      // Add random color
      const colors = Object.values(BIRD_COLORS);
      const randomColor = Phaser.Utils.Array.GetRandom(colors);
      bird.setTint(randomColor);

      // Add to scene's bird group
      this.scene.birdsGroup.add(bird);
      
      birds.push(bird);
      this.allBirds.push(bird);
      spawnedCount++;
    }

    this.currentFlock = birds;
    return birds;
  }

  /**
   * Mark a bird as eliminated so it won't spawn in future flocks
   * @param {Bird} bird - The bird that was eliminated
   */
  markBirdEliminated(bird) {
    if (bird && bird.flockIndex !== undefined) {
      this.eliminatedIndices.add(bird.flockIndex);
    }
  }

  /**
   * Check if all birds in current flock are gone
   * @returns {boolean} True if all birds are dead/inactive
   */
  isFlockComplete() {
    if (this.currentFlock.length === 0) {
      return true;
    }

    const aliveBirds = this.currentFlock.filter(b => b.active && !b.isDead);
    return aliveBirds.length === 0;
  }

  /**
   * Reset for a new flock (clear eliminated list)
   */
  resetForNewFlock() {
    this.eliminatedIndices.clear();
    this.currentFlock = [];
  }

  /**
   * Get the number of birds that have been eliminated (permanent)
   */
  getEliminatedCount() {
    return this.eliminatedIndices.size;
  }

  /**
   * Check if a specific bird index was eliminated
   */
  isIndexEliminated(index) {
    return this.eliminatedIndices.has(index);
  }
}
