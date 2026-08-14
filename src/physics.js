export function overlap(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

// Simple swept landing solver. The player coordinate represents the feet position.
// Horizontal movement happens first; vertical collision then tests the complete
// previous -> next segment so fast falls do not tunnel through platforms.
export function resolvePlayer(player, platforms, dt) {
  const previousY = player.y;
  const previousVY = player.vy;
  const nextX = player.x + player.vx * dt;
  const nextY = player.y + player.vy * dt;
  player.grounded = false;
  player.x = nextX;

  if (previousVY <= 0) {
    let landing = null;
    let bestTop = -Infinity;
    for (const p of platforms) {
      const top = p.y + p.h / 2;
      const withinX = Math.abs(player.x - p.x) <= p.w / 2 + 0.38;
      const crossedTop = previousY >= top - 0.05 && nextY <= top;
      if (withinX && crossedTop && top > bestTop) {
        landing = p;
        bestTop = top;
      }
    }
    if (landing) {
      player.y = landing.y + landing.h / 2;
      player.vy = 0;
      player.grounded = true;
      return player;
    }
  }

  player.y = nextY;
  return player;
}
