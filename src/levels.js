import * as THREE from 'three';
import { LEVELS, WORLDS, BOSS_STATS } from './config.js';

const mats = {
  grass: new THREE.MeshBasicMaterial({ color: 0x4e8b4a }),
  rock: new THREE.MeshBasicMaterial({ color: 0x777b88 }),
  ice: new THREE.MeshBasicMaterial({ color: 0xa8e6ff }),
  neon: new THREE.MeshBasicMaterial({ color: 0x25215a })
};

export function buildLevel(index) {
  const cfg = LEVELS[index];
  const world = WORLDS[cfg.world];
  const platforms = [], items = [], enemies = [], hazards = [], moving = [];
  const mat = world.id === 'ice' ? mats.ice : world.id === 'neon' ? mats.neon : world.id === 'canyon' ? mats.rock : mats.grass;
  platforms.push({ x: 0, y: -0.45, w: 18, h: 0.8, d: 5, mat });
  let x = 8, currentY = 0.15, lastPlatform = platforms[0];
  let seed = (index + 1) * 991;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  while (x < cfg.length) {
    const gap = 0.8 + rnd() * 1.5;
    const width = 3.6 + rnd() * 4.6;
    currentY = Math.max(-0.05, Math.min(1.65, currentY - 0.55 + rnd() * 1.45));
    const px = x + gap;
    const platform = { x: px, y: currentY, w: width, h: 0.6, d: 4, mat };
    platforms.push(platform);
    lastPlatform = platform;

    if (rnd() < 0.86) items.push({ type: 'coin', x: px + width * 0.28, y: currentY + 1, z: 0 });
    if (rnd() < 0.20) items.push({ type: 'crystal', x: px + width * 0.70, y: currentY + 1.05, z: 0 });
    if (rnd() < 0.10) items.push({ type: 'heart', x: px + width * 0.50, y: currentY + 1.05, z: 0 });
    if (rnd() < 0.48) {
      const type = ['slime', 'bat', 'runner', 'turret'][Math.floor(rnd() * 4)];
      enemies.push({ type, x: px + width * 0.55, y: currentY + 1, z: 0 });
    }
    x = px + width;
  }

  // Place progression items on real platforms rather than at arbitrary heights.
  const endPlatform = lastPlatform;
  const safeX = Math.min(endPlatform.x + endPlatform.w * 0.5, cfg.length - 4);
  items.push({ type: 'key', x: Math.max(10, cfg.length - 12), y: endPlatform.y + 1.05, z: 0 });
  items.push({ type: 'star', x: Math.max(10, cfg.length - 24), y: endPlatform.y + 1.05, z: 0 });
  if (index % 3 === 0) items.push({ type: 'mushroom', x: Math.max(10, cfg.length - 35), y: endPlatform.y + 1.05, z: 0 });
  void safeX;

  for (let i = 0; i < 5 + index; i++) hazards.push({ x: 10 + i * 17, y: -0.05, w: 1.6 + index * 0.05 });

  return {
    cfg, world, platforms, items, enemies, hazards, goalX: cfg.length - 3,
    boss: cfg.boss ? { x: cfg.length - 15, y: 2.5, kind: world.id, stats: BOSS_STATS[world.id] || { name: 'Waldwächter', hp: 10, speed: 2.2, projectile: 3 } } : null,
    moving
  };
}
