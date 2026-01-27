// src/entities/weapons/Harpoon.js

import { WEAPON } from '../../core/constants.js';

export class Harpoon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'arponFijo') {
    // Lo spawneamos DEBAJO del mundo físico (no de la cámara)
    // Usar el bounds del physics world para asegurar que funciona en todas las escenas
    const worldHeight = scene.physics.world.bounds.height;
    
    // Ajustar posición de spawn según el sprite - arpon es más largo, necesita spawnearse más abajo
    let spawnOffset = 800;
    if (texture === 'arpon') {
      spawnOffset = 1800; // Más abajo para compensar el sprite más largo
    }
    
    const spawnY = worldHeight + spawnOffset;
    super(scene, x, spawnY, texture);

    this.scene = scene;

    // Añadir a la escena + física
    scene.add.existing(this);
    this.scene.physics.world.enable(this);

    // NO colisionar con los límites del mundo (puede estar fuera mientras sube)
    this.body.setCollideWorldBounds(false);

    // Anclado abajo (como una lanza que viene desde abajo)
    // PROFUNDIDAD: por encima del fondo (-2) y por debajo de todo lo demás (0)
    this.setDepth(-1);
    this.setOrigin(0.5, 1);
    
    // Ajustar escala según el sprite - arpon es más alto, necesita escala menor
    if (texture === 'arpon') {
      this.setScale(2.5, 5); // Escala más ancha para arpon
    } else {
      this.setScale(4, 5); // Escala normal para arponFijo
    }

    // Sin gravedad, no lo mueve nada salvo nuestra velocidad
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // Collider fijo que coincide con el sprite
    let bodyWidth, bodyHeight;
    
    if (texture === 'arpon') {
      // Para arpon: collider que cubra casi todo el sprite visible
      bodyWidth = this.displayWidth * 0.6;
      bodyHeight = this.displayHeight * 0.9;
      
      // Centrar el collider horizontalmente (offset desde el origen del sprite)
      // Como el origin es (0.5, 1), el sprite está centrado en X
      const offsetX = (this.width - bodyWidth) / 2;
      const offsetY = 0; // Empezar desde arriba
      
      this.body.setSize(bodyWidth, bodyHeight);
      this.body.setOffset(offsetX, offsetY);
    } else {
      // Para arponFijo: mantener lógica original
      bodyWidth = this.displayWidth * 0.4;
      bodyHeight = this.displayHeight - 740;
      this.body.setSize(bodyWidth, bodyHeight, true);
    }

    // Velocidad constante hacia arriba (recto, sin parábola)
    this.body.setVelocityY(-WEAPON.HARPOON_SPEED);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Cuando la punta llega al techo (y <= 0), lo destruimos
    if (this.getTopCenter().y <= 0) {
      this.destroy();
    }
  }
}

export default Harpoon;
