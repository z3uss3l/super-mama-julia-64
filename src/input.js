export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.action = false;
    this.jumpPressed = false;
    this.actionPressed = false;
    this.dashPressed = false;
    this.keys = new Set();
    this.touchKeys = new Set();
    this.bind();
  }

  bind() {
    const down = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.jumpPressed = true;
        if (e.code === 'KeyE' || e.code === 'KeyX') this.actionPressed = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyF') this.dashPressed = true;
      }
      this.keys.add(e.code);
      this.sync();
    };
    const up = (e) => {
      this.keys.delete(e.code);
      this.sync();
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);

    this.touch('left', 'left');
    this.touch('right', 'right');
    this.touch('jump', 'jump');
    this.touch('action', 'action');
    this.touch('dash', 'dash');
  }

  sync() {
    this.left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touchKeys.has('left');
    this.right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touchKeys.has('right');
    this.jump = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
    this.action = this.keys.has('KeyE') || this.keys.has('KeyX');
  }

  touch(id, type) {
    const el = document.getElementById(id);
    if (!el) return;

    const press = (e) => {
      e.preventDefault();
      if (type === 'jump') this.jumpPressed = true;
      if (type === 'action') this.actionPressed = true;
      if (type === 'dash') this.dashPressed = true;
      if (type === 'left' || type === 'right') {
        this.touchKeys.add(type);
        this.sync();
      }
    };
    const release = (e) => {
      e.preventDefault();
      if (type === 'left' || type === 'right') {
        this.touchKeys.delete(type);
        this.sync();
      }
    };

    el.addEventListener('pointerdown', press, { passive: false });
    el.addEventListener('pointerup', release, { passive: false });
    el.addEventListener('pointercancel', release, { passive: false });
    el.addEventListener('pointerleave', release, { passive: false });
  }

  consume() {
    this.jumpPressed = false;
    this.actionPressed = false;
    this.dashPressed = false;
  }
}
