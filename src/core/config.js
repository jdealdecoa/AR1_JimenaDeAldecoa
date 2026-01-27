import { GAME_SIZE, PHYSICS, RENDER, SCALE } from "../core/constants.js";

/**
 * Define y devuelve el objeto de configuración con el que instanciaremos el motor de phaser.
 *
 * Esta función centraliza toda la configuración del juego (tamaño, físicas,
 * renderizado, escenas, etc.), utilizando las constantes definidas en core/constants.js
 */

window.buildConfig = function({ scenes = [] } = {}) 
{
    return {
        type: Phaser.AUTO,
        width: GAME_SIZE.WIDTH,
        height: GAME_SIZE.HEIGHT,
        scale: {
            // En lugar de NONE, usamos FIT
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: GAME_SIZE.WIDTH,
            height: GAME_SIZE.HEIGHT
        },
        pixelArt: RENDER.PIXEL_ART,
        physics: {
            default: PHYSICS.TYPE,
            arcade: {
                gravity: { y: PHYSICS.GRAVITY },
               // debug: PHYSICS.DEBUG
            }
        },
        fps:
        {
        target: 60,
        forceSetTimeOut: false
        },
        scene: scenes
    };
}