import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import { GAME, LEVELS } from './config.js';
import { RuntimeState } from './state.js';
import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { Particles } from './particles.js';
import { makePlayer, animateCharacter } from './entities.js';
import { buildLevel } from './levels.js';
import { resolvePlayer, bufferJump, cutJump, getMovementState } from './physics.js';
import { WorldRuntime } from './world.js';
import { FollowCamera } from './camera.js';
import { UI } from './ui.js';

export class GameRuntime {
  constructor() {
    this.state = new RuntimeState();
    this.ui = new UI();
    this.audio = new AudioManager();
    this.input = new Input();
    this.particles = new Particles();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const placeholder = document.getElementById('canvas');
    if (placeholder) placeholder.replaceWith(this.renderer.domElement);
    else document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'canvas';

    this.world = new WorldRuntime(this.scene);
    this.camCtrl = new FollowCamera(this.camera);
    this.clock = new THREE.Clock();

    this.player = null;
    this.platforms = [];
    this.enemies = [];
    this.collectibles = [];
    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    this.isRunning = false;
    this.initEvents();
    this.loadProgress();
    this.showMainMenu();
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    });

    document.getElementById('new')?.addEventListener('click', () => {
      this.state.reset();
      this.startLevel(0);
    });

    document.getElementById('continue')?.addEventListener('click', () => {
      this.startLevel(this.state.level);
    });

    document.getElementById('saveReset')?.addEventListener('click', () => {
      localStorage.removeItem(GAME.saveKey);
      this.state.reset();
      this.ui.toast('Spielstand gelöscht.');
      this.showMainMenu();
    });

    this.input.onJump = () => {
      if (!this.state.screen && this.player) this.tryJump();
    };

    this.input.onJumpRelease = () => {
      if (this.player) cutJump(this.player, 0.45);
    };

    this.input.onDash = () => {
      if (!this.state.screen && this.player) this.tryDash();
    };

    this.input.onAction = () => {
      if (!this.state.screen && this.player) this.triggerAction();
    };
  }

  tryJump() {
    const p = this.player;
    if (!p) return false;

    if (p.grounded || (p.coyoteTimer ?? 0) > 0) {
      p.vy = GAME.jumpSpeed;
      p.grounded = false;
      p.supportPlatform = null;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.justJumped = true;
      p.jumps = 1;
      this.audio.play('jump');
      return true;
    }

    if (this.state.abilities.doubleJump && (p.jumps ?? 0) < 2) {
      p.vy = GAME.jumpSpeed * 0.9;
      p.grounded = false;
      p.supportPlatform = null;
      p.jumps = 2;
      p.jumpBufferTimer = 0;
      p.justJumped = true;
      this.audio.play('doubleJump');
      return true;
    }

    bufferJump(p);
    return false;
  }

  tryDash() {
    const p = this.player;
    if (!p || !this.state.abilities.dash) return false;
    if ((p.dashCooldown ?? 0) > 0) return false;

    p.dashDirection = Math.sign(this.input.getAxis() || p.facing || 1) || 1;
    p.dash = 0.22;
    p.dashCooldown = 0.8;
    this.audio.play('dash');
    return true;
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(GAME.saveKey);
      if (!raw) return;
      const data = JSON.parse(raw);

      this.state.level = Number.isFinite(data.level) ? data.level : 0;
      this.state.score = Number.isFinite(data.score) ? data.score : 0;
      this.state.coins = Number.isFinite(data.coins) ? data.coins : 0;
      this.state.lives = Number.isFinite(data.lives) ? data.lives : GAME.maxLives;

      if (data.abilities && typeof data.abilities === 'object') {
        this.state.abilities = {
          ...this.state.abilities,
          ...data.abilities
        };
      }
    } catch (e) {
      console.warn('Konnte Spielstand nicht laden', e);
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(GAME.saveKey, JSON.stringify({
        level: this.state.level,
        score: this.state.score,
        coins: this.state.coins,
        lives: this.state.lives,
        abilities: this.state.abilities
      }));
    } catch (e) {
      console.warn('Konnte Spielstand nicht speichern', e);
    }
  }

  showMainMenu() {
    this.state.screen = 'menu';
    this.ui.showScreen(
      'SUPER MAMA JULIA 64',
      'Das ultimative 3D-Plattformer-Abenteuer.\nErlebe die Reise durch alle Welten.',
      'REBORN V5.5'
    );
  }

  startLevel(index) {
    this.state.level = Math.min(Math.max(0, index), LEVELS.length - 1);
    const levelData = LEVELS[this.state.level];

    this.state.screen = null;
    this.ui.hideScreen();
    this.ui.setLevel(levelData.name);
    this.ui.setObjective(levelData.quest);
    this.ui.setAbilities(this.state.abilities);

    while (this.scene.children.length > 1) {
      this.scene.remove(this.scene.children[this.scene.children.length - 1]);
    }

    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    this.world.setupWorld(levelData.worldId);

    const built = buildLevel(levelData, this.scene);
    this.platforms = built.platforms || [];
    this.enemies = built.enemies || [];
    this.collectibles = built.collectibles || [];

    this.player = makePlayer();
    Object.assign(this.player, {
      x: 0, y: 5, z: 0,
      vx: 0, vy: 0,
      inputAxis: 0,
      grounded: false,
      supportPlatform: null,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      dash: 0,
      dashCooldown: 0,
      dashDirection: 1,
      facing: 1,
      jumps: 0,
      justLanded: false,
      justJumped: false
    });

    this.scene.add(this.player.mesh);
    this.audio.playBGM(levelData.worldId);
    this.saveProgress();

    if (!this.isRunning) {
      this.isRunning = true;
      this.clock.start();
      this.loop();
    }
  }

  triggerAction() {
    if (!this.player) return;
    this.audio.play('hit');

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      if (!en) continue;

      const dx = (en.x ?? 0) - this.player.x;
      const dy = (en.y ?? 0) - this.player.y;
      const dz = (en.z ?? 0) - this.player.z;
      const distance = Math.hypot(dx, dz, dy * 0.65);

      if (distance < 2) {
        en.hp = (en.hp ?? 1) - 1;

        if (en.hp <= 0) {
          if (en.mesh) this.scene.remove(en.mesh);
          this.enemies.splice(i, 1);
          this.state.score += 250;
          this.audio.play('defeat');
        }
      }
    }
  }

  update(dt) {
    if (this.state.screen || !this.player) return;

    this.player.inputAxis = this.input.getAxis();

    if (Math.abs(this.player.inputAxis) > 0.01) {
      this.player.facing = Math.sign(this.player.inputAxis);
    }

    // Dash duration is owned by physics.js. Do not decrement player.dash here.
    if ((this.player.dashCooldown ?? 0) > 0) {
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    }

    const result = resolvePlayer(this.player, this.platforms, dt);

    if (result.landed) {
      this.audio.play('landing');
    }

    // Consume a buffered jump immediately after landing.
    if (
      this.player.grounded &&
      (this.player.jumpBufferTimer ?? 0) > 0
    ) {
      this.player.jumpBufferTimer = 0;
      this.player.vy = GAME.jumpSpeed;
      this.player.grounded = false;
      this.player.supportPlatform = null;
      this.player.justJumped = true;
      this.player.jumps = 1;
      this.audio.play('jump');
    }

    this.camCtrl.update(this.player, dt);
    animateCharacter(this.player, getMovementState(this.player), dt);
    this.ui.setStats(this.state);

    this.player.justLanded = false;
    this.player.justJumped = false;
    this.input.consume();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    if (!this.isRunning) return;

    const dt = Math.min(Math.max(this.clock.getDelta() || 0, 0), 0.05);
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    window.game = new GameRuntime();
  } catch (error) {
    console.error('GameRuntime konnte nicht gestartet werden:', error);

    const screen = document.getElementById('screen');
    if (screen) {
      screen.style.display = 'flex';
      screen.style.zIndex = '10000';
      screen.innerHTML = `
        <div style="max-width:720px;padding:28px;margin:20px;border-radius:18px;
          background:#101522;color:#fff;font-family:system-ui,sans-serif;text-align:left">
          <h1>Super Mama Julia 64</h1>
          <p>Die Game-Engine konnte nicht gestartet werden.</p>
          <pre style="white-space:pre-wrap;overflow:auto;padding:14px;
            border-radius:10px;background:#05070b;color:#ffb4b4">${String(error?.stack || error)}</pre>
        </div>`;
    }
  }
});
