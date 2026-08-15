const DEFAULTS = {
  maxSpeed: 8.6,
  dashSpeed: 20,
  accel: 42,
  airAccel: 27,
  friction: 34,
  airFriction: 4.5,
  terminalVelocity: -24,
  landingTolerance: 0.15,
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

export function platformBounds(platform) {
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

export function playerBounds(player, x = player.x, y = player.y, z = player.z ?? 0) {
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

export function overlapsX(player, platform, x = player.x) {
  const pb = playerBounds(player, x);
  const pp = platformBounds(platform);
  return pb.right > pp.left && pb.left < pp.right;
}

export function overlapsZ(player, platform, z = player.z ?? 0) {
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
  if (!platform || !player.grounded) return;

  if (Number.isFinite(platform.prevY)) {
    const deltaY = platform.y - platform.prevY;
    if (Math.abs(deltaY) > 0.000001) player.y += deltaY;
  }

  if (Number.isFinite(platform.prevX)) {
    const deltaX = platform.x - platform.prevX;
    if (Math.abs(deltaX) > 0.000001) player.x += deltaX;
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
  const previousX = player.x;
  const previousGrounded = player.grounded === true;

  player.justLanded = false;
  applyMovingPlatform(player);

  if (previousGrounded) {
    player.coyote = value(player, 'coyote', 0.11);
  } else if (Number.isFinite(player.coyote)) {
    player.coyote = Math.max(0, player.coyote - dt);
  }

  player.grounded = false;
  moveAxis(player, dt);
  applyDash(player);

  // Horizontal movement + solid side-wall collision.
  player.x += (player.vx ?? 0) * dt;
  const pw = value(player, 'width', 0.75) / 2;
  const ph = value(player, 'height', 1.7);

  for (const platform of platforms) {
    if (!platform) continue;
    const p = platformBounds(platform);
    if (!overlapsZ(player, platform)) continue;

      // Use the real player AABB for robust side-wall detection.
    const playerBottom = player.y;
    const playerTop = player.y + ph;

    // Standing exactly on the top surface is not a side collision.
    const overlapsVerticalSide =
      playerTop > p.bottom + 0.0001 &&
      playerBottom < p.top - 0.0001;

    if (!overlapsVerticalSide) continue;

    const prevLeft = previousX - pw;
    const prevRight = previousX + pw;
    const nextLeft = player.x - pw;
    const nextRight = player.x + pw;

    if ((player.vx ?? 0) > 0 &&
        prevRight <= p.left + 0.0001 &&
        nextRight >= p.left) {
      player.x = p.left - pw - 0.001;
      player.vx = 0;
    } else if ((player.vx ?? 0) < 0 &&
               prevLeft >= p.right - 0.0001 &&
               nextLeft <= p.right) {
      player.x = p.right + pw + 0.001;
      player.vx = 0;
    }
  }

  // Vertical movement. GameRuntime owns gravity and updates vy before this call.
  player.vy = Math.max(
    value(player, 'terminalVelocity', DEFAULTS.terminalVelocity),
    player.vy ?? 0
  );

  const nextY = player.y + (player.vy ?? 0) * dt;

  // Ceiling collision: prevent jumping through the underside of platforms.
  if ((player.vy ?? 0) > 0) {
    for (const platform of platforms) {
      if (!platform) continue;
      const p = platformBounds(platform);
      if (!overlapsX(player, platform) || !overlapsZ(player, platform)) continue;

      const prevHead = previousY + ph;
      const nextHead = nextY + ph;
      if (prevHead <= p.bottom + 0.15 && nextHead >= p.bottom - 0.05) {
        player.y = p.bottom - ph - 0.001;
        player.vy = 0;
        player.supportPlatform = null;
        return { landed: false, platform: null, grounded: false };
      }
    }
  }

  // Landing while descending.
  if ((player.vy ?? 0) <= 0) {
    const landing = findLandingPlatform(player, platforms, previousY, nextY);
    if (landing) {
      const p = platformBounds(landing);
      player.y = p.top;
      player.vy = 0;
      player.grounded = true;
      player.supportPlatform = landing;
      player.jumps = 0;
      player.coyote = 0;
      player.justLanded = !previousGrounded;
      return { landed: player.justLanded, platform: landing, grounded: true };
    }
  }

  player.y = nextY;
  player.supportPlatform = null;
  return { landed: false, platform: null, grounded: false };
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



/**
 * Swept vertical stomp test.
 *
 * The important part is that we test the whole segment travelled by the
 * player's feet during this frame, rather than requiring the feet to be
 * within a tiny tolerance at the two sampled positions. Fast downward
 * movement otherwise makes small/fast enemies (especially the runner)
 * intermittently non-stompable.
 */
export function checkStompCollision(
  previousBottom,
  currentBottom,
  playerX,
  playerHalfWidth,
  enemyX,
  enemyTop,
  enemyHalfWidth,
  tolerance = 0.24
) {
  const previous = Number(previousBottom);
  const current = Number(currentBottom);
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return false;

  // Only a downward crossing counts. A player rising through an enemy cannot
  // accidentally trigger a stomp.
  if (previous < current) return false;

  const crossedTop =
    previous >= enemyTop - tolerance &&
    current <= enemyTop + tolerance;

  if (!crossedTop) return false;

  const playerLeft = playerX - playerHalfWidth;
  const playerRight = playerX + playerHalfWidth;
  const enemyLeft = enemyX - enemyHalfWidth;
  const enemyRight = enemyX + enemyHalfWidth;

  return playerRight > enemyLeft && playerLeft < enemyRight;
}

/**
 * Deterministic physics regression checks.
 * Kept dependency-free so they can run in CI without WebGL.
 */
export function runPhysicsRegressionTests() {
  const platform = {x: 5, y: 0.5, z: 0, width: 2, height: 1, depth: 4};

  const a = {
    x: 3.0, y: 0.0, z: 0, width: 1, height: 1.8, depth: 1,
    vx: 0, vy: 0, inputAxis: 1, grounded: false, maxSpeed: 8.6
  };
  for(let i=0;i<90;i++) resolvePlayer(a,[platform],1/60);
  const blockedRight = a.x <= platform.x-platform.width/2-a.width/2+0.01;

  const b = {
    x: 7.0, y: 0.0, z: 0, width: 1, height: 1.8, depth: 1,
    vx: 0, vy: 0, inputAxis: -1, grounded: false, maxSpeed: 8.6
  };
  for(let i=0;i<90;i++) resolvePlayer(b,[platform],1/60);
  const blockedLeft = b.x >= platform.x+platform.width/2+b.width/2-0.01;

  const c = {
    x: 5, y: 1.0, z: 0, width: 1, height: 1.8, depth: 1,
    vx: 0, vy: 0, inputAxis: 0, grounded: true, maxSpeed: 8.6
  };
  resolvePlayer(c,[platform],1/60);
  const standingStable = Math.abs(c.x-5)<0.001;

  // Purple runner: simulate a fast downward frame crossing its top.
  // Runner geometry is a 0.43-radius sphere scaled to 80% vertically.
  const runnerTop = 1 + 0.43 * 0.8;
  const runnerStomp = checkStompCollision(2.05, 0.98, 5, 0.34, 5, runnerTop, 0.43);
  const runnerMissFromBelow = !checkStompCollision(0.80, 0.95, 5, 0.34, 5, runnerTop, 0.43);

  return {
    blockedRight,
    blockedLeft,
    standingStable,
    runnerStomp,
    runnerMissFromBelow,
    ok:blockedRight&&blockedLeft&&standingStable&&runnerStomp&&runnerMissFromBelow
  };
}
