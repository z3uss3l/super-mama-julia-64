import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

export class Particles {
  constructor(scene = null) {
    this.scene = scene;
    this.pool = [];
    this.active = [];

    this.geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  setScene(scene) {
    this.scene = scene;
    return this;
  }

  burst(position, colorHex = 0xffd43b, count = 12, speed = 4) {
    if (!position || !this.scene) return;

    const safeCount = Math.max(0, Math.min(Math.floor(count), 80));
    const safeSpeed = Math.max(0, speed);

    for (let i = 0; i < safeCount; i++) {
      let mesh = this.pool.pop();

      if (!mesh) {
        const material = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 1,
          depthWrite: false
        });
        mesh = new THREE.Mesh(this.geometry, material);
      }

      mesh.material.color.setHex(colorHex);
      mesh.material.opacity = 1;
      mesh.visible = true;
      mesh.scale.set(1, 1, 1);

      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.3,
        position.y + (Math.random() - 0.5) * 0.3,
        position.z + (Math.random() - 0.5) * 0.3
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const angle = Math.random() * Math.PI * 2;
      const elevation =
        (Math.random() - 0.25) * Math.PI * 0.55;
      const particleSpeed =
        (0.5 + Math.random() * 0.8) * safeSpeed;

      const horizontal =
        Math.cos(elevation) * particleSpeed;

      const vx = Math.cos(angle) * horizontal;
      const vy = Math.sin(elevation) * particleSpeed + 1.5;
      const vz = Math.sin(angle) * horizontal;

      const maxLife = 0.45 + Math.random() * 0.3;

      this.scene.add(mesh);

      this.active.push({
        mesh,
        vx,
        vy,
        vz,
        life: maxLife,
        maxLife,
        rotX: (Math.random() - 0.5) * 14,
        rotY: (Math.random() - 0.5) * 14,
        gravity: 18
      });
    }
  }

  trail(position, colorHex = 0x8b5cf6) {
    if (!position || !this.scene) return;
    this.burst(position, colorHex, 2, 1);
  }

  update(dt) {
    if (!this.scene || !this.active.length) return;

    const safeDt = Math.max(
      0,
      Math.min(Number.isFinite(dt) ? dt : 0, 0.05)
    );

    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];

      p.life -= safeDt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.visible = false;
        p.mesh.material.opacity = 0;
        this.pool.push(p.mesh);
        this.active.splice(i, 1);
        continue;
      }

      p.vy -= p.gravity * safeDt;

      p.mesh.position.x += p.vx * safeDt;
      p.mesh.position.y += p.vy * safeDt;
      p.mesh.position.z += p.vz * safeDt;

      p.mesh.rotation.x += p.rotX * safeDt;
      p.mesh.rotation.y += p.rotY * safeDt;

      const progress =
        Math.max(0, Math.min(1, p.life / p.maxLife));

      p.mesh.scale.setScalar(
        Math.max(0.01, progress)
      );

      p.mesh.material.opacity = progress;
    }
  }

  clear() {
    for (const p of this.active) {
      this.scene?.remove(p.mesh);
      p.mesh.visible = false;
      p.mesh.material.opacity = 0;
      this.pool.push(p.mesh);
    }

    this.active.length = 0;
  }

  dispose() {
    this.clear();

    this.geometry.dispose();

    for (const mesh of this.pool) {
      mesh.material.dispose();
    }

    this.pool.length = 0;
  }
}
