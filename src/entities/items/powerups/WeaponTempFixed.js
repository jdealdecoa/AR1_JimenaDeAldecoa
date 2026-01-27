import { BaseItem } from '../BaseItem.js';
import { ITEMS } from '../../../core/constants.js';
import { HERO_WEAPON } from '../../Hero.js';

/**
 * Harpoon fijo temporal
 */

export class WeaponTempFixed extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'WEAPON_TEMP_FIXED',
      ttl: ITEMS.TTL.WEAPON_TEMP_FIXED,
      gravity: 450,
      bounce: 0.6
    });
    
    // Set to fixed harpoon frame (frame 2)
    this.setFrame(2);
    
    // Purple visual effect (sin animaciones que sobrescriben BaseItem)
    this.setTint(0xAA00FF);
  }

  /**
   * Apply temporary fixed harpoon weapon
   * @param {Hero} hero - The hero picking up this item
   */
  onPickup(hero) {
    // Store original weapon if not already in temp mode
    if (!hero._tempWeaponTimer) {
      hero._originalWeapon = hero.weaponType;
      hero._originalMaxHarpoons = hero.maxHarpoonsActive;
    } else {
      // Clear existing timer if picking up another temp weapon
      hero._tempWeaponTimer.destroy();
    }
    
    // Set fixed harpoon mode
    hero.weaponType = HERO_WEAPON.FIXED_HARPOON;
    
    // Show pickup text
    const weaponText = this.scene.add.text(
      this.x,
      this.y - 20,
      'FIXED HARPOON!',
      {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#AA00FF',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    weaponText.setDepth(100);
    
    this.scene.tweens.add({
      targets: weaponText,
      y: weaponText.y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => weaponText.destroy()
    });
    
    // Notify HUD
    this.scene.game.events.emit('UI_WEAPON_CHANGE', 'FIXED HARPOON');
    
    // Set timer to revert weapon - guardar referencia a scene
    const scene = this.scene;
    hero._tempWeaponTimer = scene.time.delayedCall(ITEMS.DURATION.WEAPON_TEMP, () => {
      this.revertWeapon(hero, scene);
    });
    
    console.log('Temporary fixed harpoon activated for', ITEMS.DURATION.WEAPON_TEMP / 1000, 'seconds');
  }

  /**
   * Revert to original weapon
   * @param {Hero} hero - The hero
   * @param {Phaser.Scene} scene - The scene reference
   */
  revertWeapon(hero, scene) {
    if (hero._originalWeapon !== undefined) {
      hero.weaponType = hero._originalWeapon;
      delete hero._originalWeapon;
    } else {
      hero.weaponType = HERO_WEAPON.HARPOON;
    }
    
    if (hero._originalMaxHarpoons !== undefined) {
      hero.maxHarpoonsActive = hero._originalMaxHarpoons;
      delete hero._originalMaxHarpoons;
    } else {
      hero.maxHarpoonsActive = 1;
    }
    
    delete hero._tempWeaponTimer;
    
    // Notify HUD
    scene.game.events.emit('UI_WEAPON_CHANGE', 'HARPOON');
    
    console.log('Temporary weapon expired, reverted to normal');
  }
}
