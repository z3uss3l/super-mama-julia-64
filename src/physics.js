const DEFAULTS = {
  maxSpeed: 8.6,
  dashSpeed: 20,
  accel: 42,
  airAccel: 27,
  friction: 34,
  airFriction: 4.5,
  terminalVelocity: -24,
  landingTolerance: 0.10,
  maxStep: 1 / 120,
  maxFrameDt: 1 / 20
};

function value(object, key, fallback) {
  const v = object?.[key];
  return Number.isFinite(v) ? v : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  if (current > target) return Math.max(current - amount, target);
  return target;
}

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
    back: z + depth / 2
  };
}

function playerBounds(player, x = player.x, y = player.y, z = player.z ?? 0) {
  const width = value(player, 'width', 0.75);
  const height = value(player, 'height', 1.7);
  const depth = value(player, 'depth', 0.75);

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
  return pb.right > pp.left && pb.left < pp.right;
}

function overlapsZ(player, platform, z = player.z ?? 0) {
  if (!Number.isFinite(platform.d) && !Number.isFinite(platform.depth)) {
    return true;
  }

  const pb = playerBounds(player, player.x, player.y, z);
  const pp = platformBounds(platform);
  return pb.back > pp.front && pb.front < pp.back;
}

export function moveAxis(player, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  if ((player.dash ?? 0) > 0) return;

  const maxSpeed = value(player, 'maxSpeed', DEFAULTS.maxSpeed);
  const axis = clamp(
    Number.isFinite(player.inputAxis) ? player.inputAxis : 0,
    -1,
    1
  );

  const target = axis * maxSpeed;
  const acceleration = player.grounded
    ? value(player, 'accel', DEFAULTS.accel)
    : value(player, 'airAccel', DEFAULTS.airAccel);

  const friction = player.grounded
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

function applyDash(player) {
  if ((player.dash ?? 0) <= 0) return;

  const dashSpeed = value(
    player,
    'dashSpeed',
    DEFAULTS.dashSpeed
  );

  const direction =
    Math.sign(
      Number.isFinite(player.dashDirection)
        ? player.dashDirection
        : (player.inputAxis || player.facing || 1)
    ) || 1;

  player.vx = direction * dashSpeed;
}

function applyMovingPlatform(player) {
  const platform = player.supportPlatform;

  if (
    !platform ||
    !player.grounded ||
    !Number.isFinite(platform.prevY)
  ) {
    return;
  }

  const deltaY = platform.y - platform.prevY;

  if (Math.abs(deltaY) > 0.000001) {
    player.y += deltaY;
  }
}

function findLandingPlatform(
  player,
  platforms,
  previousY,
  nextY
) {
  let landing = null;
  let bestTop = -Infinity;

  for (const platform of platforms) {
    if (!platform) continue;

    const p = platformBounds(platform);

    if (!overlapsX(player, platform)) continue;
    if (!overlapsZ(player, platform)) continue;

    /*
     * player.y is the player's FEET.
     * A landing occurs when the feet cross the platform's top
     * while moving downward.
     */
    const crossedTop =
      previousY >= p.top - DEFAULTS.landingTolerance &&
      nextY <= p.top + DEFAULTS.landingTolerance;

    if (crossedTop && p.top > bestTop) {
      bestTop = p.top;
      landing = platform;
    }
  }

  return landing;
}

function step(player, platforms, dt) {
  const previousY = player.y;
  const previousGrounded = player.grounded === true;

  player.justLanded = false;

  applyMovingPlatform(player);

  /*
   * Preserve coyote time independently from the Game controller.
   * Game.js also maintains its legacy p.coyote field; keeping both
   * paths compatible prevents a missed jump at a platform edge.
   */
  if (previousGrounded) {
    player.coyote = value(
      player,
      'coyote',
      0.11
    );
  } else if (Number.isFinite(player.coyote)) {
    player.coyote = Math.max(
      0,
      player.coyote - dt
    );
  }

  player.grounded = false;

  moveAxis(player, dt);
  applyDash(player);

  player.x += (player.vx ?? 0) * dt;

  /*
   * Gravity is intentionally NOT applied here.
   * The existing Game runtime owns vertical acceleration via
   * p.vy += GAME.gravity * dt. Applying it twice was one of the
   * failure modes of the mixed physics versions.
   */
  player.vy = Math.max(
    value(player, 'terminalVelocity', DEFAULTS.terminalVelocity),
    player.vy ?? 0
  );

  const nextY =
    player.y +
    (player.vy ?? 0) *
    dt;

  /*
   * Only downward motion can land.
   */
  if ((player.vy ?? 0) <= 0) {
    const landing = findLandingPlatform(
      player,
      platforms,
      previousY,
      nextY
    );

    if (landing) {
      const p = platformBounds(landing);

      player.y = p.top;
      player.vy = 0;
      player.grounded = true;
      player.supportPlatform = landing;
      player.jumps = 0;
      player.coyote = 0;

      player.justLanded =
        !previousGrounded;

      return {
        landed: player.justLanded,
        platform: landing,
        grounded: true
      };
    }
  }

  player.y = nextY;
  player.supportPlatform = null;

  return {
    landed: false,
    platform: null,
    grounded: false
  };
}

export function resolvePlayer(
  player,
  platforms = [],
  dt = 1 / 60
) {
  const safeDt = clamp(
    Number.isFinite(dt) ? dt : 0,
    0,
    DEFAULTS.maxFrameDt
  );

  const steps = Math.max(
    1,
    Math.ceil(safeDt / DEFAULTS.maxStep)
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

  return {
    landed,
    platform: landingPlatform,
    grounded: player.grounded
  };
}

export function bufferJump(player) {
  if (!player) return;

  player.jumpBuffer =
    Number.isFinite(player.jumpBuffer)
      ? Math.max(player.jumpBuffer, 0.12)
      : 0.12;
}

export function cutJump(
  player,
  multiplier = 0.48
) {
  if (!player) return;

  if ((player.vy ?? 0) > 0) {
    player.vy *= clamp(
      multiplier,
      0.1,
      1
    );
  }
}

export function getMovementState(player) {
  if (!player?.grounded) {
    return (player?.vy ?? 0) > 0
      ? 'jump'
      : 'fall';
  }

  return Math.abs(player?.vx ?? 0) > 0.15
    ? 'run'
    : 'idle';
}
