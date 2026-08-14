import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import { ENEMY_STATS } from './config.js';

const PLAYER_DEFAULTS = {
  width: 0.75,
  height: 1.7,
  depth: 0.75,
  maxSpeed: 8.6,
  dashSpeed: 20,
  accel: 42,
  airAccel: 27,
  friction: 34,
  airFriction: 4.5,
  gravity: 27,
  terminalVelocity: -24,
  coyoteTime: 0.11,
  jumpBufferTime: 0.12
};

export function makePlayer() {
  const group = new THREE.Group();
  group.name = 'Julia';

  /*
   * Physics dimensions are deliberately aligned with the visible
   * character envelope. The collision origin is the player's feet.
   */
  const bodyGeo = new THREE.BoxGeometry(0.75, 1.4, 0.75);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff4be1,
    roughness: 0.3,
    metalness: 0.02
  });

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'body';
  body.position.y = 0.70;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.40, 20, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffe0bd,
    roughness: 0.5,
    metalness: 0
  });

  const head = new THREE.Mesh(headGeo, headMat);
  head.name = 'head';
  head.position.y = 1.50;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  /*
   * Small feet make the running animation readable without changing
   * the actual collision envelope.
   */
  const footGeo = new THREE.BoxGeometry(0.28, 0.18, 0.38);
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    roughness: 0.45
  });

  const footLeft = new THREE.Mesh(footGeo, footMat);
  footLeft.name = 'footLeft';
  footLeft.position.set(-0.22, 0.09, 0);
  footLeft.castShadow = true;
  group.add(footLeft);

  const footRight = new THREE.Mesh(footGeo, footMat);
  footRight.name = 'footRight';
  footRight.position.set(0.22, 0.09, 0);
  footRight.castShadow = true;
  group.add(footRight);

  /*
   * State used by animation. Keeping it on the player avoids using
   * Date.now() and makes animation deterministic with dt.
   */
  const player = {
    mesh: group,

    width: PLAYER_DEFAULTS.width,
    height: PLAYER_DEFAULTS.height,
    depth: PLAYER_DEFAULTS.depth,

    x: 0,
    y: 0,
    z: 0,

    vx: 0,
    vy: 0,

    grounded: false,
    supportPlatform: null,

    facing: 1,
    inputAxis: 0,

    maxSpeed: PLAYER_DEFAULTS.maxSpeed,
    dashSpeed: PLAYER_DEFAULTS.dashSpeed,

    accel: PLAYER_DEFAULTS.accel,
    airAccel: PLAYER_DEFAULTS.airAccel,

    friction: PLAYER_DEFAULTS.friction,
    airFriction: PLAYER_DEFAULTS.airFriction,

    gravity: PLAYER_DEFAULTS.gravity,
    terminalVelocity: PLAYER_DEFAULTS.terminalVelocity,

    coyoteTime: PLAYER_DEFAULTS.coyoteTime,
    coyoteTimer: 0,

    jumpBufferTime: PLAYER_DEFAULTS.jumpBufferTime,
    jumpBufferTimer: 0,

    jumps: 0,

    dash: 0,
    dashCooldown: 0,
    dashDirection: 1,

    justLanded: false,
    justJumped: false,

    animationTime: 0,
    animationState: 'idle'
  };

  /*
   * Keep render transform synchronized with physics coordinates.
   */
  syncPlayerMesh(player);

  return player;
}

function syncPlayerMesh(player) {
  if (!player?.mesh) return;

  player.mesh.position.set(
    player.x ?? 0,
    player.y ?? 0,
    player.z ?? 0
  );
}

export function makeEnemy(type, x, y, z) {
  const stats =
    ENEMY_STATS[type] ||
    ENEMY_STATS.slime;

  const group = new THREE.Group();
  group.name = `Enemy_${type}`;

  let mesh;

  if (type === 'bat') {
    const geo = new THREE.ConeGeometry(
      0.5,
      1,
      8
    );

    const mat =
      new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        roughness: 0.4
      });

    mesh = new THREE.Mesh(
      geo,
      mat
    );

    mesh.rotation.x =
      Math.PI / 2;
  } else {
    const geo =
      new THREE.BoxGeometry(
        0.9,
        stats.contactHeight || 0.9,
        0.9
      );

    const mat =
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.5
      });

    mesh = new THREE.Mesh(
      geo,
      mat
    );
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  group.add(mesh);
  group.position.set(
    x,
    y,
    z
  );

  return {
    type,
    mesh,

    x,
    y,
    z,

    vx: 0,
    vy: 0,

    hp: stats.hp,
    stats,

    patrolTimer: 0,
    animationTime: 0,

    facing: 1
  };
}

export function updateEnemies(
  enemies,
  player,
  platforms,
  dt
) {
  if (!Array.isArray(enemies)) {
    return null;
  }

  for (const en of enemies) {
    if (!en || !en.mesh) {
      continue;
    }

    const stats =
      en.stats ||
      ENEMY_STATS.slime;

    const dx =
      (player?.x ?? 0) -
      (en.x ?? 0);

    const dz =
      (player?.z ?? 0) -
      (en.z ?? 0);

    const distToPlayer =
      Math.hypot(dx, dz);

    const aggro =
      stats.aggro ?? 8;

    if (distToPlayer < aggro) {
      const dir =
        Math.sign(dx);

      if (dir !== 0) {
        en.vx =
          dir *
          (stats.speed ?? 2);
        en.facing = dir;
      }
    } else {
      en.patrolTimer += dt;

      if (en.patrolTimer > 3) {
        en.vx =
          -(en.vx || stats.speed || 2);

        en.facing =
          Math.sign(en.vx) || 1;

        en.patrolTimer = 0;
      }
    }

    en.x +=
      (en.vx ?? 0) *
      dt;

    en.mesh.position.set(
      en.x,
      en.y,
      en.z
    );

    en.mesh.rotation.y =
      en.facing > 0
        ? 0
        : Math.PI;

    en.animationTime += dt;

    /*
     * Small vertical movement for flying enemies.
     */
    if (en.type === 'bat') {
      en.mesh.position.y =
        en.y +
        Math.sin(
          en.animationTime * 8
        ) * 0.12;
    }

    /*
     * Player hit signal.
     * The caller decides how lives/damage are handled.
     */
    const hitDist =
      Math.hypot(
        (player?.x ?? 0) - en.x,
        (player?.y ?? 0) - en.y,
        (player?.z ?? 0) - en.z
      );

    if (hitDist < 1.1) {
      return en;
    }
  }

  return null;
}

export function animateCharacter(
  player,
  state,
  dt
) {
  if (
    !player ||
    !player.mesh
  ) {
    return;
  }

  const safeDt =
    Math.max(
      0,
      Math.min(
        Number.isFinite(dt)
          ? dt
          : 0,
        0.05
      )
    );

  player.animationTime =
    (player.animationTime || 0) +
    safeDt;

  player.animationState =
    state || 'idle';

  /*
   * Render transform.
   *
   * Physics owns x/y/z. entities.js only mirrors them.
   */
  syncPlayerMesh(player);

  /*
   * Facing follows actual velocity first, then input.
   */
  if (
    Math.abs(player.vx ?? 0) >
    0.1
  ) {
    player.facing =
      Math.sign(player.vx);
  } else if (
    Math.abs(player.inputAxis ?? 0) >
    0.01
  ) {
    player.facing =
      Math.sign(player.inputAxis);
  }

  /*
   * The character model faces +X by default.
   */
  player.mesh.rotation.y =
    player.facing > 0
      ? Math.PI / 2
      : -Math.PI / 2;

  const body =
    player.mesh.children[0];

  const head =
    player.mesh.children[1];

  const footLeft =
    player.mesh.children[2];

  const footRight =
    player.mesh.children[3];

  /*
   * Run animation.
   *
   * Frequency is based on actual horizontal speed rather than
   * wall-clock time, so slow movement looks slower.
   */
  const speed =
    Math.abs(player.vx ?? 0);

  const speedFactor =
    Math.min(
      1.4,
      Math.max(
        0.35,
        speed /
          Math.max(
            0.001,
            player.maxSpeed || 8.6
          )
      )
    );

  const runFrequency =
    7.5 *
    speedFactor;

  const phase =
    player.animationTime *
    runFrequency;

  if (state === 'run') {
    const stride =
      Math.sin(phase);

    const bounce =
      Math.abs(
        Math.sin(phase)
      ) * 0.075;

    if (body) {
      body.position.y =
        0.70 + bounce;

      body.rotation.z =
        stride * 0.035;
    }

    if (head) {
      head.position.y =
        1.50 + bounce * 0.65;

      head.rotation.z =
        -stride * 0.025;
    }

    if (footLeft) {
      footLeft.position.y =
        0.09 +
        Math.max(
          0,
          stride
        ) * 0.07;

      footLeft.rotation.x =
        stride * 0.22;
    }

    if (footRight) {
      footRight.position.y =
        0.09 +
        Math.max(
          0,
          -stride
        ) * 0.07;

      footRight.rotation.x =
        -stride * 0.22;
    }

    return;
  }

  /*
   * Jump / fall.
   */
  if (
    state === 'jump' ||
    state === 'fall'
  ) {
    const airborneBob =
      Math.sin(
        player.animationTime * 5
      ) * 0.025;

    if (body) {
      body.position.y =
        0.70 + airborneBob;

      body.rotation.z = 0;
    }

    if (head) {
      head.position.y =
        1.50 + airborneBob;
      head.rotation.z = 0;
    }

    if (footLeft) {
      footLeft.position.y = 0.09;
      footLeft.rotation.x =
        state === 'jump'
          ? -0.18
          : 0.12;
    }

    if (footRight) {
      footRight.position.y = 0.09;
      footRight.rotation.x =
        state === 'jump'
          ? 0.18
          : -0.12;
    }

    return;
  }

  /*
   * Landing / idle.
   *
   * Use a short procedural settling motion instead of Date.now().
   */
  const idle =
    Math.sin(
      player.animationTime * 2.2
    );

  if (body) {
    body.position.y =
      0.70 +
      idle * 0.012;

    body.rotation.z =
      idle * 0.008;
  }

  if (head) {
    head.position.y =
      1.50 +
      idle * 0.008;

    head.rotation.z =
      -idle * 0.006;
  }

  if (footLeft) {
    footLeft.position.y =
      0.09;
    footLeft.rotation.x = 0;
  }

  if (footRight) {
    footRight.position.y =
      0.09;
    footRight.rotation.x = 0;
  }
}
