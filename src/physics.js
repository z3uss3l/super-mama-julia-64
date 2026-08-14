/*
 * SUPER MAMA JULIA 64
 * Physics V5.5
 *
 * Coordinate convention:
 *   x = horizontal
 *   y = vertical
 *   z = depth
 *
 * IMPORTANT:
 *   vy > 0 means UP.
 *   Gravity therefore decreases vy.
 *
 * Compatible with existing platforms:
 *   p.x, p.y, p.w, p.h
 *
 * Optional 3D platform fields:
 *   p.z, p.d
 *
 * Platform y is interpreted as CENTER Y,
 * matching the existing game implementation.
 */

const DEFAULTS = {
  gravity: 27,
  terminalVelocity: -24,

  maxSpeed: 8.6,
  dashSpeed: 20,

  accel: 42,
  airAccel: 27,

  friction: 34,
  airFriction: 4.5,

  coyoteTime: 0.11,
  jumpBufferTime: 0.12,

  skin: 0.035,
  landingTolerance: 0.10,

  maxStep: 1 / 120,
  maxFrameDt: 1 / 20,

  airControl: 1
};


/* -------------------------------------------------------------------------- */
/* Utility                                                                    */
/* -------------------------------------------------------------------------- */

function value(object, key, fallback) {
  const v = object?.[key];
  return Number.isFinite(v) ? v : fallback;
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function approach(current, target, amount) {
  if (current < target) {
    return Math.min(current + amount, target);
  }

  if (current > target) {
    return Math.max(current - amount, target);
  }

  return target;
}


function getPlayerWidth(player) {
  return value(player, 'width', 0.75);
}


function getPlayerHeight(player) {
  return value(player, 'height', 1.7);
}


function getPlayerDepth(player) {
  return value(player, 'depth', 0.8);
}


/*
 * Existing level data uses:
 *
 *   p.x = center
 *   p.y = center
 *   p.w = width
 *   p.h = height
 *
 * Some future levels may use:
 *
 *   p.z
 *   p.d
 */
function platformBounds(platform) {
  const width = value(platform, 'w', value(platform, 'width', 1));
  const height = value(platform, 'h', value(platform, 'height', 0.5));
  const depth = value(platform, 'd', value(platform, 'depth', Infinity));

  const x = value(platform, 'x', 0);
  const y = value(platform, 'y', 0);
  const z = value(platform, 'z', 0);

  return {
    left: x - width / 2,
    right: x + width / 2,

    bottom: y - height / 2,
    top: y + height / 2,

    front: z - depth / 2,
    back: z + depth / 2,

    width,
    height,
    depth
  };
}


function playerBounds(player, x = player.x, y = player.y, z = player.z ?? 0) {
  const width = getPlayerWidth(player);
  const height = getPlayerHeight(player);
  const depth = getPlayerDepth(player);

  return {
    left: x - width / 2,
    right: x + width / 2,

    bottom: y,
    top: y + height,

    front: z - depth / 2,
    back: z + depth / 2
  };
}


function overlapsX(player, platform, x = player.x) {
  const pb = playerBounds(player, x);
  const pp = platformBounds(platform);

  return (
    pb.right > pp.left &&
    pb.left < pp.right
  );
}


function overlapsZ(player, platform, z = player.z ?? 0) {
  const depth = getPlayerDepth(player);

  /*
   * Infinite depth is intentional for the existing 2.5D levels.
   */
  if (!Number.isFinite(platform.d) &&
      !Number.isFinite(platform.depth)) {
    return true;
  }

  const pb = playerBounds(player, player.x, player.y, z);
  const pp = platformBounds(platform);

  return (
    pb.back > pp.front &&
    pb.front < pp.back
  );
}


/* -------------------------------------------------------------------------- */
/* Horizontal movement                                                        */
/* -------------------------------------------------------------------------- */

export function moveAxis(player, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;

  /*
   * Dash owns horizontal velocity.
   * Normal acceleration must not fight the dash.
   */
  if ((player.dash ?? 0) > 0) {
    return;
  }

  const maxSpeed = value(
    player,
    'maxSpeed',
    DEFAULTS.maxSpeed
  );

  const axis = clamp(
    Number.isFinite(player.inputAxis)
      ? player.inputAxis
      : 0,
    -1,
    1
  );

  const target = axis * maxSpeed;

  const grounded = player.grounded === true;

  const acceleration = grounded
    ? value(player, 'accel', DEFAULTS.accel)
    : value(player, 'airAccel', DEFAULTS.airAccel) *
      value(player, 'airControl', DEFAULTS.airControl);

  const friction = grounded
    ? value(player, 'friction', DEFAULTS.friction)
    : value(player, 'airFriction', DEFAULTS.airFriction);

  if (Math.abs(target) > 0.001) {
    player.vx = approach(
      player.vx ?? 0,
      target,
      acceleration * dt
    );
  } else {
    player.vx = approach(
      player.vx ?? 0,
      0,
      friction * dt
    );
  }

  player.vx = clamp(
    player.vx,
    -maxSpeed,
    maxSpeed
  );
}


/* -------------------------------------------------------------------------- */
/* Dash                                                                       */
/* -------------------------------------------------------------------------- */

function applyDash(player, dt) {
  if ((player.dash ?? 0) <= 0) {
    return;
  }

  player.dash = Math.max(
    0,
    player.dash - dt
  );

  const dashSpeed = value(
    player,
    'dashSpeed',
    DEFAULTS.dashSpeed
  );

  /*
   * Keep existing dash direction if available.
   * Otherwise derive it from input.
   */
  let direction = player.dashDirection;

  if (!Number.isFinite(direction) || Math.abs(direction) < 0.01) {
    direction =
      Math.sign(player.inputAxis || player.facing || 1) || 1;
  }

  player.vx = direction * dashSpeed;
}


/* -------------------------------------------------------------------------- */
/* Moving platforms                                                           */
/* -------------------------------------------------------------------------- */

function applyMovingPlatform(player) {
  const platform = player.supportPlatform;

  if (!platform || !player.grounded) {
    return;
  }

  if (!Number.isFinite(platform.prevY)) {
    return;
  }

  if (!Number.isFinite(platform.y)) {
    return;
  }

  const deltaY = platform.y - platform.prevY;

  /*
   * Only transfer platform motion when it is actually moving.
   * This prevents microscopic numerical noise from becoming player drift.
   */
  if (Math.abs(deltaY) > 0.000001) {
    player.y += deltaY;
  }

  if (
    Number.isFinite(platform.prevX) &&
    Number.isFinite(platform.x)
  ) {
    const deltaX = platform.x - platform.prevX;

    if (Math.abs(deltaX) > 0.000001) {
      player.x += deltaX;
    }
  }

  if (
    Number.isFinite(platform.prevZ) &&
    Number.isFinite(platform.z)
  ) {
    const deltaZ = platform.z - platform.prevZ;

    if (Math.abs(deltaZ) > 0.000001) {
      player.z = (player.z ?? 0) + deltaZ;
    }
  }
}


/* -------------------------------------------------------------------------- */
/* Platform detection                                                         */
/* -------------------------------------------------------------------------- */

function findLandingPlatform(
  player,
  platforms,
  previousY,
  nextY
) {
  /*
   * Player coordinate:
   *   player.y = feet
   *
   * Therefore the platform's top surface is the target.
   */

  const previousFeet = previousY;
  const nextFeet = nextY;

  let landing = null;
  let bestTop = -Infinity;

  for (const platform of platforms) {
    if (!platform) continue;

    const p = platformBounds(platform);

    if (!overlapsX(player, platform)) {
      continue;
    }

    if (!overlapsZ(player, platform)) {
      continue;
    }

    /*
     * Only resolve downward movement.
     *
     * Previous feet must have been above the platform.
     * Current feet must be at or below it.
     */
    const crossedTop =
      previousFeet >= p.top - DEFAULTS.landingTolerance &&
      nextFeet <= p.top + DEFAULTS.landingTolerance;

    if (!crossedTop) {
      continue;
    }

    /*
     * Choose the highest valid platform.
     *
     * This matters when platforms overlap vertically.
     */
    if (p.top > bestTop) {
      bestTop = p.top;
      landing = platform;
    }
  }

  return landing;
}


/* -------------------------------------------------------------------------- */
/* Gravity                                                                    */
/* -------------------------------------------------------------------------- */

function applyGravity(player, dt) {
  const gravity = value(
    player,
    'gravity',
    DEFAULTS.gravity
  );

  const terminalVelocity = value(
    player,
    'terminalVelocity',
    DEFAULTS.terminalVelocity
  );

  player.vy = Math.max(
    terminalVelocity,
    (player.vy ?? 0) - gravity * dt
  );
}


/* -------------------------------------------------------------------------- */
/* Landing                                                                    */
/* -------------------------------------------------------------------------- */

function landPlayer(player, platform) {
  const p = platformBounds(platform);

  const wasAirborne = !player.grounded;

  player.y = p.top;
  player.vy = 0;

  player.grounded = true;
  player.supportPlatform = platform;

  /*
   * Existing jump systems may use this.
   */
  if (Number.isFinite(player.jumps)) {
    player.jumps = 0;
  }

  /*
   * Useful for animation/game feel.
   */
  player.justLanded = wasAirborne;
  player.landingVelocity = wasAirborne
    ? Math.abs(player.vy ?? 0)
    : 0;

  /*
   * Reset coyote timer after successful landing.
   */
  player.coyoteTimer = value(
    player,
    'coyoteTime',
    DEFAULTS.coyoteTime
  );

  return wasAirborne;
}


/* -------------------------------------------------------------------------- */
/* Coyote / jump buffer                                                       */
/* -------------------------------------------------------------------------- */

function updateJumpTimers(player, dt) {
  if (player.grounded) {
    player.coyoteTimer = value(
      player,
      'coyoteTime',
      DEFAULTS.coyoteTime
    );
  } else {
    player.coyoteTimer = Math.max(
      0,
      (player.coyoteTimer ?? 0) - dt
    );
  }

  if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer = Math.max(
      0,
      player.jumpBufferTimer - dt
    );
  }
}


/*
 * Call this from input handling when jump is pressed.
 *
 * Keeping this here means the physics system owns timing,
 * while Game decides what an actual jump should do.
 */
export function bufferJump(player) {
  player.jumpBufferTimer = value(
    player,
    'jumpBufferTime',
    DEFAULTS.jumpBufferTime
  );
}


/* -------------------------------------------------------------------------- */
/* Variable jump height                                                       */
/* -------------------------------------------------------------------------- */

export function cutJump(player, multiplier = 0.48) {
  /*
   * Only shorten upward movement.
   *
   * This avoids the common bug where releasing jump while falling
   * suddenly changes downward velocity.
   */
  if ((player.vy ?? 0) > 0) {
    player.vy *= clamp(
      multiplier,
      0.1,
      1
    );
  }
}


/* -------------------------------------------------------------------------- */
/* Single physics step                                                        */
/* -------------------------------------------------------------------------- */

function step(player, platforms, dt) {
  const previousY = player.y;

  /*
   * Platform motion must be applied BEFORE we calculate player movement.
   */
  applyMovingPlatform(player);

  updateJumpTimers(player, dt);

  /*
   * The grounded flag describes the state at the beginning of the step.
   * It is cleared before collision resolution and restored if we land.
   */
  player.grounded = false;

  /*
   * Horizontal movement.
   */
  moveAxis(player, dt);

  /*
   * Dash has priority over normal horizontal control.
   */
  applyDash(player, dt);

  /*
   * Integrate horizontal position.
   */
  player.x += (player.vx ?? 0) * dt;

  /*
   * Keep dash speed, but prevent absurd values from accumulated impulses.
   */
  const normalMax = value(
    player,
    'maxSpeed',
    DEFAULTS.maxSpeed
  );

  const dashMax = value(
    player,
    'dashSpeed',
    DEFAULTS.dashSpeed
  );

  const horizontalCap =
    (player.dash ?? 0) > 0
      ? dashMax * 1.12
      : normalMax;

  player.vx = clamp(
    player.vx ?? 0,
    -horizontalCap,
    horizontalCap
  );

  /*
   * Gravity.
   */
  applyGravity(player, dt);

  /*
   * Vertical integration.
   */
  const nextY =
    player.y +
    (player.vy ?? 0) * dt;

  /*
   * We only need platform landing while moving downward.
   *
   * With vy > 0 = UP:
   *   vy < 0 means falling.
   */
  if ((player.vy ?? 0) <= 0) {
    const landing = findLandingPlatform(
      player,
      platforms,
      previousY,
      nextY
    );

    if (landing) {
      const landed = landPlayer(
        player,
        landing
      );

      return {
        landed,
        platform: landing
      };
    }
  }

  /*
   * No landing.
   */
  player.y = nextY;
  player.supportPlatform = null;

  return {
    landed: false,
    platform: null
  };
}


/* -------------------------------------------------------------------------- */
/* Public resolver                                                            */
/* -------------------------------------------------------------------------- */

export function resolvePlayer(
  player,
  platforms = [],
  dt = 1 / 60
) {
  /*
   * Protect physics from browser-tab suspension,
   * phone frame drops and background throttling.
   */
  const safeDt = clamp(
    Number.isFinite(dt)
      ? dt
      : 1 / 60,
    0,
    DEFAULTS.maxFrameDt
  );

  /*
   * Sub-stepping is critical on mobile.
   *
   * A single 80 ms frame could otherwise move Julia
   * completely through a thin platform.
   */
  const stepSize = DEFAULTS.maxStep;

  const steps = Math.max(
    1,
    Math.ceil(safeDt / stepSize)
  );

  const subDt = safeDt / steps;

  let landed = false;
  let landingPlatform = null;

  for (let i = 0; i < steps; i++) {
    const result = step(
      player,
      platforms,
      subDt
    );

    if (result.landed) {
      landed = true;
      landingPlatform = result.platform;
    }
  }

  /*
   * Clear one-frame landing state after the caller has had
   * a chance to consume it.
   *
   * Do NOT clear justLanded here; Game/animation can consume it.
   */

  return {
    landed,
    platform: landingPlatform,
    grounded: player.grounded,
    vx: player.vx,
    vy: player.vy
  };
}


/* -------------------------------------------------------------------------- */
/* Optional helpers for Game / animation                                      */
/* -------------------------------------------------------------------------- */

export function isGrounded(player) {
  return player.grounded === true;
}


export function getHorizontalSpeed(player) {
  return Math.abs(player.vx ?? 0);
}


export function getVerticalSpeed(player) {
  return player.vy ?? 0;
}


export function getMovementState(player) {
  if (!player.grounded) {
    return (player.vy ?? 0) > 0
      ? 'jump'
      : 'fall';
  }

  if (Math.abs(player.vx ?? 0) > 0.15) {
    return 'run';
  }

  return 'idle';
}
