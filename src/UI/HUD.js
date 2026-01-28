
import { GAME_SIZE, HERO } from '../core/constants.js';
import { EVENTS } from '../core/events.js';

export class Hud {
  constructor(scene, { uiTop, mode = 'HARPOON' } = {}) {
    this.scene = scene;
    this.events = scene.game.events;

    // Altura donde empieza la HUD:
    //  - si la escena pasa uiTop, lo usamos (normalmente altura del mapa)
    //  - si no, usamos la altura física del mundo
    const mapHeight = scene.walls?.height || scene.physics.world.bounds.height;
    this.uiTop = uiTop ?? mapHeight;
    this.uiHeight = GAME_SIZE.HEIGHT - this.uiTop;

    // Fondo negro
    this.background = scene.add
      .rectangle(0, this.uiTop, GAME_SIZE.WIDTH, this.uiHeight, 0x000000, 1)
      .setOrigin(0);

    // ==========================
    //   VIDAS COMO ICONOS
    // ==========================
    this.lives = 0;
    this.maxLives = HERO?.MAX_LIVES ?? 3;
    this.lifeIcons = [];

    const baseX = 24;
    const spacing = 40;
    const iconY = this.uiTop + this.uiHeight - 20;
    // Crear solo 3 iconos de vida
    for (let i = 0; i < 3; i++) {
      const icon = scene.add
        .image(baseX + i * spacing, iconY, 'player', 0)
        .setOrigin(0, 1)
        .setScale(0.5);
      this.lifeIcons.push(icon);
    }

    // Texto "1-P" encima de las vidas
    this.playerLabel = scene.add
      .text(baseX, iconY - 65, '1-P', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0, 1); // anclado por abajo, justo encima de los iconos

    // Texto para vidas extra (x{número}) - oculto inicialmente
    this.extraLivesText = scene.add
      .text(baseX + (3 * spacing) + 10, iconY, '', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0, 1)
      .setVisible(false);



    // ==========================
    //   TEXTO DE PUNTUACIÓN
    // ==========================
    this.score = 0;
    this.scoreText = scene.add
      .text(
        200,
        this.uiTop + this.uiHeight - 35,
        '00',
        {
          fontFamily: 'Arial Black',
          fontSize: '32px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4
        }
      )
      .setOrigin(0, 1);

    // ==========================
    //   WORLD + MODE LABELS
    // ==========================
    const levelNum = this._getLevelNumberFromSceneKey(scene?.scene?.key);
    const worldText = levelNum ? `WORLD 1-${levelNum}` : '';

    this.worldLabel = scene.add.text(
      GAME_SIZE.WIDTH * 0.35,
      this.uiTop + this.uiHeight - 20,
      worldText,
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setOrigin(0.5, 1);

    const isTourLevel = this._isTourLevel(scene?.scene?.key);
    const modeLabelText = isTourLevel ? 'TOUR MODE' : (mode === 'PANIC' ? 'PANIC MODE' : '');
    this.modeLabel = scene.add.text(
      GAME_SIZE.WIDTH - 30,
      this.uiTop + this.uiHeight - 35,
      modeLabelText,
      {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#00ff66',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setOrigin(1, 1);

    // ==========================
    //   POWER-UP SLOT (CENTER)
    // ==========================
    const slotCenterX = GAME_SIZE.WIDTH * 0.5;
    const slotBottomY = this.uiTop + this.uiHeight - 16; // a little above bottom edge

    // Border (fake) using two rectangles
    this.powerSlotBorder = scene.add
      .rectangle(slotCenterX, slotBottomY, 64, 64, 0x222222, 1)
      .setOrigin(0.5, 1);
    this.powerSlotBg = scene.add
      .rectangle(slotCenterX, slotBottomY - 4, 56, 56, 0x111111, 1)
      .setOrigin(0.5, 1);

    // Icon from bonus spritesheet (scaled)
    this.powerIcon = scene.add
      .image(slotCenterX, slotBottomY - 32, 'bonus', 0)
      .setOrigin(0.5, 0.5)
      .setScale(2.2)
      .setVisible(false);

    // Optional small text when no specific icon (e.g., time freeze/slow)
    this.powerSlotText = scene.add.text(
      slotCenterX,
      slotBottomY - 6,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5, 1).setVisible(false);

    // ==========================
    //   BARRA DE EXPERIENCIA (solo PanicMode)
    // ==========================
    if (mode === 'PANIC') {
      const centerX = GAME_SIZE.WIDTH / 2;
      const topY = this.uiTop + this.uiHeight - 70; // Posicionar en la zona visible de UI
      
      // Texto "LEVEL" grande estilo arcade (izquierda)
      this.levelLabelText = scene.add.text(centerX - 80, topY, 'LEVEL', {
        fontFamily: 'Arial Black',
        fontSize: '34px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
      }).setOrigin(0.5, 0);
      
      // Número de nivel grande y destacado (derecha, alineado con LEVEL)
      this.expBarLevelText = scene.add.text(centerX + 60, topY - 2, '1', {
        fontFamily: 'Arial Black',
        fontSize: '38px',
        color: '#ff8800',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
      }).setOrigin(0.5, 0);
      
      // Barra de experiencia más grande y estilizada
      const barWidth = 220;
      const barHeight = 18;
      const barY = topY + 48;
      
      // Borde externo de la barra
      this.expBarOuterBorder = scene.add.rectangle(centerX, barY, barWidth + 6, barHeight + 6, 0xffffff, 1).setOrigin(0.5, 0);
      
      // Fondo de la barra (oscuro)
      this.expBarBg = scene.add.rectangle(centerX, barY + 3, barWidth, barHeight, 0x000000, 1).setOrigin(0.5, 0);
      
      // Crear barra arcoiris con múltiples segmentos
      this.rainbowSegments = [];
      const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff];
      const segmentWidth = barWidth / colors.length;
      
      for (let i = 0; i < colors.length; i++) {
        const segment = scene.add.rectangle(
          centerX - barWidth/2 + (i * segmentWidth), 
          barY + 3, 
          segmentWidth, 
          barHeight, 
          colors[i], 
          1
        ).setOrigin(0, 0);
        this.rainbowSegments.push(segment);
      }
      
      // Máscara para mostrar solo el progreso
      this.expBarMask = scene.add.rectangle(centerX - barWidth/2, barY + 3, 0, barHeight, 0xffffff, 1).setOrigin(0, 0);
      
      // Aplicar máscara a todos los segmentos
      const maskShape = scene.make.graphics();
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(centerX - barWidth/2, barY + 3, 0, barHeight);
      
      this.rainbowSegments.forEach(segment => {
        segment.setVisible(false); // Ocultos inicialmente
      });
      
      this.exp = 0;
      this.expMax = 500;
      this.expLevel = 1;
      this.expBarMaxWidth = barWidth;
      this.expBarStartX = centerX - barWidth/2;
      this.expBarY = barY;
    }

    // ==========================
    //   LISTENERS DE EVENTOS
    // ==========================
    this.events.on(EVENTS.game.SCORE_CHANGE, this.onScoreChange, this);
    this.events.on(EVENTS.hero.READY, this.onHeroReady, this);
    this.events.on(EVENTS.hero.DAMAGED, this.onHeroDamaged, this);
    this.events.on(EVENTS.hero.LIFE_GAINED, this.onLifeGained, this);
    this.events.on('UI_WEAPON_CHANGE', this.onWeaponChange, this);



    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  // ===== SCORE =====
  onScoreChange(delta) {
    this.score += delta;
    const padded = this.score.toString().padStart(6, '0');
    this.scoreText.setText(`${padded}`);
  }

  resetScore() {
    this.score = 0;
    this.scoreText.setText('000000');
  }

  // ===== VIDAS =====
  onHeroReady(hero) {
    this.hero = hero;
    this.setLives(hero.lives ?? 0);

    // Start periodic check to update power slot for shield/time effects
    if (!this.powerSlotUpdater) {
      this.powerSlotUpdater = this.scene.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => this.updatePowerSlotFromStates(),
      });
    }
  }

  onHeroDamaged(remainingLives) {
    this.setLives(remainingLives);
  }

  onLifeGained(totalLives) {
    try {
      this.setLives(totalLives);
    } catch (error) {
      console.error('[HUD] Error in onLifeGained:', error);
    }
  }

  setLives(value) {
    try {
      this.lives = value;
      const actualValue = value ?? 0;
      const visibleIcons = Math.min(3, actualValue);
      
      // Protection: check if lifeIcons array exists
      if (!this.lifeIcons || !Array.isArray(this.lifeIcons)) {
        console.warn('[HUD] lifeIcons not initialized');
        return;
      }
      
      this.lifeIcons.forEach((icon, index) => {
        if (icon && icon.setVisible && icon.scene) {
          icon.setVisible(index < visibleIcons);
        }
      });
      
      // Vidas extra (solo si hay más de 3)
      const extraLives = Math.max(0, actualValue - 3);
      if (this.extraLivesText && this.extraLivesText.scene && typeof this.extraLivesText.setText === 'function') {
        try {
          if (extraLives > 0) {
            this.extraLivesText.setText(`X${extraLives}`);
            this.extraLivesText.setVisible(true);
          } else {
            this.extraLivesText.setVisible(false);
          }
        } catch (textError) {
          console.error('[HUD] Error updating extraLivesText:', textError);
        }
      }
    } catch (error) {
      console.error('[HUD] Error in setLives:', error);
    }
  }

  // ===== POWER SLOT UPDATES =====
  onWeaponChange(modeText) {
    // Map text to bonus frame
    const map = {
      'DOUBLE HARPOON': 0,
      'MACHINE GUN': 1,
      'FIXED HARPOON': 2,
      'HARPOON': null,
    };

    const frame = map[modeText];
    if (frame === null || frame === undefined) {
      // Hide when back to normal
      this.powerIcon.setVisible(false);
      this.powerSlotText.setVisible(false);
      this.powerSlotBg.fillColor = 0x111111;
      return;
    }
    this.powerIcon.setFrame(frame).setVisible(true);
    this.powerSlotText.setVisible(false);
    this.powerSlotBg.fillColor = 0x1a3d1f; // subtle green-ish when active
  }

  updatePowerSlotFromStates() {
    const scene = this.scene;
    if (!scene) return;

    // Shield takes precedence
    if (this.hero?.hasShield) {
      this.powerIcon.setFrame(3).setVisible(true);
      this.powerSlotText.setVisible(false);
      this.powerSlotBg.fillColor = 0x153a3a; // cyan-ish background
      return;
    }

    // Time effects fallback to text labels
    if (scene.isTimeFrozen) {
      this.powerIcon.setVisible(false);
      this.powerSlotText.setText('FREEZE').setVisible(true);
      this.powerSlotBg.fillColor = 0x2c2c5a; // bluish
      return;
    }
    if (scene.isTimeSlowed) {
      this.powerIcon.setVisible(false);
      this.powerSlotText.setText('SLOW').setVisible(true);
      this.powerSlotBg.fillColor = 0x5a2c2c; // reddish
      return;
    }

    // If weapon temporary icon already visible, keep; else clear
    if (this.powerIcon.visible) {
      this.powerSlotBg.fillColor = 0x1a3d1f;
    } else {
      this.powerSlotText.setVisible(false);
      this.powerSlotBg.fillColor = 0x111111;
    }
  }

  // ===== HELPERS =====
  _getLevelNumberFromSceneKey(key) {
    if (!key) return null;
    const m = String(key).match(/Level(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }
  _isTourLevel(key) {
    if (!key) return false;
    return /^Level\d+$/i.test(String(key));
  }


  // ===== EXPERIENCIA (solo PanicMode) =====
  setExp(value) {
    if (!this.rainbowSegments) return;
    this.exp = Math.max(0, Math.min(this.expMax, value));
    const barWidth = this.expBarMaxWidth || 220;
    const progressWidth = (this.exp / this.expMax) * barWidth;
    
    // Mostrar/ocultar segmentos según el progreso
    const segmentWidth = barWidth / this.rainbowSegments.length;
    this.rainbowSegments.forEach((segment, i) => {
      const segmentStart = i * segmentWidth;
      const segmentEnd = (i + 1) * segmentWidth;
      
      if (progressWidth > segmentStart) {
        segment.setVisible(true);
        if (progressWidth < segmentEnd) {
          // Segmento parcialmente visible
          segment.width = progressWidth - segmentStart;
        } else {
          // Segmento completamente visible
          segment.width = segmentWidth;
        }
      } else {
        segment.setVisible(false);
      }
    });
    
    this.expBarLevelText.setText(`${this.expLevel}`);
  }
  addExp(delta) {
    if (!this.rainbowSegments) return;
    this.setExp(this.exp + delta);
    if (this.exp >= this.expMax) {
      this.expLevel++;
      this.exp = 0;
      // Aumentar el expMax progresivamente con cada nivel
      // Formula: 500 bolas base por nivel (20 bolas * 25 puntos)
      this.expMax = 500 * this.expLevel;
      this.setExp(this.exp);
      this.expBarLevelText.setText(`${this.expLevel}`);
      if (this.onExpLevelUp) this.onExpLevelUp(this.expLevel);
    }
  }
  resetExp() {
    if (!this.rainbowSegments) return;
    this.exp = 0;
    this.expLevel = 1;
    this.setExp(this.exp);
    this.expBarLevelText.setText(`${this.expLevel}`);
  }

  // ===== LIMPIEZA =====
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.events.off(EVENTS.game.SCORE_CHANGE, this.onScoreChange, this);
    this.events.off(EVENTS.hero.READY, this.onHeroReady, this);
    this.events.off(EVENTS.hero.DAMAGED, this.onHeroDamaged, this);
    this.events.off('UI_WEAPON_CHANGE', this.onWeaponChange, this);

    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);

    this.background?.destroy();
    this.playerLabel?.destroy();
    this.lifeIcons?.forEach((icon) => icon.destroy());
    this.extraLivesText?.destroy();

    this.scoreText?.destroy();
    this.worldLabel?.destroy();
    this.modeLabel?.destroy();
    this.powerIcon?.destroy();
    this.powerSlotBg?.destroy();
    this.powerSlotBorder?.destroy();
    this.powerSlotText?.destroy();
    if (this.powerSlotUpdater) {
      this.powerSlotUpdater.remove(false);
      this.powerSlotUpdater = null;
    }
    this.expBar?.destroy();
    this.expBarBg?.destroy();
    this.expBarLevelText?.destroy();
  }
}

export default Hud;
