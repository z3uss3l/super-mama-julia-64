import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;

    this.offset = new THREE.Vector3(0, 3.8, 11.5);
    this.targetOffset = new THREE.Vector3(0, 1.2, 0);

    this.smoothSpeed = 6.5;
    this.lookSmooth = 8.0;

    this.currentPosition = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();

    this.initialized = false;
  }

  reset(player) {
    if (!player || !this.camera) return;

    const px = player.x ?? 0;
    const py = player.y ?? 0;
    const pz = player.z ?? 0;

    const facing = player.facing ?? 1;

    const lookAheadX = facing * 1.8;

    this.currentPosition.set(
      px + this.offset.x + lookAheadX * 0.4,
      Math.max(2.2, py + this.offset.y),
      pz + this.offset.z
    );

    this.currentTarget.set(
      px + lookAheadX,
      py + this.targetOffset.y,
      pz + this.targetOffset.z
    );

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);

    this.initialized = true;
  }

  update(player, dt) {
    if (!player || !this.camera) return;

    const safeDt = Math.max(
      0,
      Math.min(Number.isFinite(dt) ? dt : 0, 0.05)
    );

    const px = player.x ?? 0;
    const py = player.y ?? 0;
    const pz = player.z ?? 0;
    const facing = player.facing ?? 1;

    const lookAheadX = facing * 1.8;

    const desiredPosition = new THREE.Vector3(
      px + this.offset.x + lookAheadX * 0.4,
      Math.max(2.2, py + this.offset.y),
      pz + this.offset.z
    );

    const desiredTarget = new THREE.Vector3(
      px + lookAheadX,
      py + this.targetOffset.y,
      pz + this.targetOffset.z
    );

    if (!this.initialized) {
      this.currentPosition.copy(desiredPosition);
      this.currentTarget.copy(desiredTarget);
      this.initialized = true;
    } else {
      const positionLerp =
        1 - Math.exp(-this.smoothSpeed * safeDt);

      const targetLerp =
        1 - Math.exp(-this.lookSmooth * safeDt);

      this.currentPosition.lerp(
        desiredPosition,
        positionLerp
      );

      this.currentTarget.lerp(
        desiredTarget,
        targetLerp
      );
    }

    this.camera.position.copy(
      this.currentPosition
    );

    this.camera.lookAt(
      this.currentTarget
    );
  }
}
