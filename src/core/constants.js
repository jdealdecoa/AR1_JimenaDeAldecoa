
export const GAME_SIZE = {
    WIDTH: 1536,    
    HEIGHT: 950
};

export const PHYSICS = {
    TYPE: 'arcade',
    GRAVITY: 1000,
    DEBUG: false 
};

export const HERO = {
    JUMP_FORCE: -450, 
    MAX_LIVES: 3,
    LADDER_SPEED: 150
};

export const WEAPON = {
    HARPOON_SPEED: 800, 
    BULLET_SPEED: 600,
    BULLET_LIFESPAN: 1000
};

export const BALLS = {
    BALL_BOUNCE: 1.0, 
    BALL_GRAVITY: 600, 
};

export const RENDER = {
    PIXEL_ART: true
};

export const SCALE = {
    MODE: 'FIT',
    AUTO_CENTER: 'CENTER_BOTH'
};


export const ENEMY = {
    DEFAULT_SPEED: 100,
    DEFAULT_GRAVITY: 300,
    DEFAULT_BOUNCE: 1,
    BALL: {
        MIN_SIZE: 1,
        MAX_SIZE: 4
    }
};


export const ITEMS = {
  
    DROP_CHANCE: 0.4, 
    MAX_ITEMS_ON_SCREEN: 8,
    
   
    TTL: {
        SCORE_BONUS: 8000,
        POWER_UP_LIFE: 10000,
        POWER_UP_SHIELD: 8000,
        POWER_UP_WEAPON: 7000,
        WEAPON_TEMP_DOUBLE: 7000,
        WEAPON_TEMP_MACHINE: 7000,
        WEAPON_TEMP_FIXED: 7000,
        BOMB: 9000,
        TIME_FREEZE: 8000,
        TIME_SLOW: 8000
    },
    
 
    SCORE: {
        SMALL: 100,
        MEDIUM: 250,
        LARGE: 500,
        SPECIAL: 1000
    },
    
 
    DURATION: {
        SHIELD: 30000,     
        SHIELD_INVULN_AFTER_BREAK: 1000, 
        WEAPON_TEMP: 15000, 
        TIME_FREEZE: 10000, 
        TIME_SLOW: 12000    
    },
    
    
    MULTIPLIER: {
        SLOW_MOTION: 0.4 
    }
};

