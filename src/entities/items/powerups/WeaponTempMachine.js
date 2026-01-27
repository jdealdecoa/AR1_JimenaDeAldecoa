import { BaseItem } from '../BaseItem.js';
import { ITEMS } from '../../../core/constants.js';
import { HERO_WEAPON } from '../../Hero.js';

/**
 * Ametralladora temporal
 */

export class WeaponTempMachine extends BaseItem {
  constructor(scene, x, y) {
    super(scene, x, y, 'bonus', {
      itemType: 'WEAPON_TEMP_MACHINE',
      ttl: ITEMS.TTL.WEAPON_TEMP_MACHINE,
      gravity: 450,
      bounce: 0.6
    });
    
    // Set to machine gun frame (frame 1)
    this.setFrame(1);
    
    // Orange/red visual effect (sin animaciones que sobrescriben BaseItem)
    this.setTint(0xFF6600);
  }

  /**
   * Apply temporary machine gun weapon
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
    
    // Set machine gun mode
    hero.weaponType = HERO_WEAPON.GUN;
    
    // Show pickup text
    const weaponText = this.scene.add.text(
      this.x,
      this.y - 20,
      'MACHINE GUN!',
      {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#FF6600',
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
    this.scene.game.events.emit('UI_WEAPON_CHANGE', 'MACHINE GUN');
    
    // Set timer to revert weapon - store scene reference
    const scene = this.scene;
    hero._tempWeaponTimer = scene.time.delayedCall(ITEMS.DURATION.WEAPON_TEMP, () => {
      this.revertWeapon(hero, scene);
    });
    
    console.log('Temporary machine gun activated for', ITEMS.DURATION.WEAPON_TEMP / 1000, 'seconds');
  }

  /**
   * Revert to original weapon
   * @param {Hero} hero - The hero
   * @param {Phaser.Scene} scene - The game scene
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
