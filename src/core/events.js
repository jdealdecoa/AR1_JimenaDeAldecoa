export const EVENTS = {
    game: {
        SCORE_CHANGE: 'game:score_change',
        GAME_OVER: 'game:game_over',
        LEVEL_COMPLETED: 'game:level_completed'
    },
    hero: {
        READY: 'hero:ready',
        DAMAGED: 'hero:damaged',
        DIED: 'hero:died',
        SHOOT: 'hero:shoot',
        LIFE_GAINED: 'hero:life_gained',
        WEAPON_UPGRADED: 'hero:weapon_upgraded'
    },
    enemy: {
        BALL_CREATED: 'enemy:ball_created',
        BALL_DESTROYED: 'enemy:ball_destroyed'
    },
    items: {
        ITEM_SPAWNED: 'items:spawned',
        ITEM_COLLECTED: 'items:collected',
        ITEM_DESPAWNED: 'items:despawned'
    }
};