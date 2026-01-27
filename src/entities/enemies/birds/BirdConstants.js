/**
 * Bird Enemy Constants
 * 
 * Configuration values for bird enemies in Super Pang.
 * Simplified version - only SmallBird
 */

// Bird scores (points awarded when hit)
export const BIRD_SCORE = 150; // Points for hitting a bird

// Bird speed (horizontal velocity)
export const BIRD_SPEED = 800; // Fast flight speed

// Bird spawn heights (Y positions for entry)
export const BIRD_SPAWN_HEIGHTS = {
  HIGH: -50,     // Standard entry (above screen)
  MEDIUM: -100,  // Higher entry (more dramatic arc)
  LOW: 0         // Screen edge entry (less arc)
};

// Bird colors/tints (for variety)
export const BIRD_COLORS = {
  RED: 0xff0000,
  BLUE: 0x0080ff,
  GREEN: 0x00ff00,
  YELLOW: 0xffff00,
  PURPLE: 0xff00ff,
  ORANGE: 0xff8800,
  CYAN: 0x00FFFF,
  PINK: 0xFF1493
};

// Arc movement parameters (can be adjusted per bird if needed)
export const BIRD_ARC_CONFIG = {
  TARGET_DESCENT: 300,  // How far down the bird descends (pixels)
  DURATION: 2000,       // Time to complete arc (milliseconds)
  
  // Presets for different arc styles
  SHALLOW: { descent: 200, duration: 1500 },
  NORMAL: { descent: 300, duration: 2000 },
  DEEP: { descent: 450, duration: 2500 }
};