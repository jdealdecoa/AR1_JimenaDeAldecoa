// src/entities/weapons/Bullet.js

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'bullet') {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5);

        // ===== TAMAÑO =====
        
        this.setScale(3);               // tamaño visual

      
        if (this.body && this.body.setSize) {
            this.body.setAllowGravity(false);
            // Hitbox más pequeño que el sprite visual
            const hitboxSize = Math.min(this.width, this.height) * 0.3; // 30% del tamaño
            this.body.setSize(hitboxSize, hitboxSize);
            this.body.setOffset(
                (this.width - hitboxSize) / 2,
                (this.height - hitboxSize) / 2
            );
        }

      
        this.lifespan = 10000;               
        this.birthTime = scene.time.now;

        // console.log('Bullet created at', x, y);
    
        this.setRotation(0);
    }

 
    fire(angleDeg) {
        const speed = 600;
        const rad = Phaser.Math.DegToRad(angleDeg);

        const vx = Math.cos(rad) * speed;
        const vy = Math.sin(rad) * speed;

        this.body.setVelocity(vx, vy);

      
        this.setRotation(0);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

     
        if (time > this.birthTime + this.lifespan) {
            // console.log('Bullet destroyed by LIFESPAN at', this.x, this.y);
            this.destroy();
        }
    }

    destroy() {
        // console.log('Bullet.destroy() called at position:', this.x, this.y);
        // console.trace(); // Stack trace para ver desde dónde se llama
        super.destroy();
    }
}
