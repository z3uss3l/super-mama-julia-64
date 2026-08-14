export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.action = false;
    this.dash = false;

    this.jumpPressed = false;
    this.jumpReleased = false;
    this.actionPressed = false;
    this.dashPressed = false;

    this.keys = new Set();
    this.touchKeys = new Set();
    this.bind();
  }

  bind() {
    addEventListener('keydown', e => {
      const code = e.code || '';
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      // Ignore browser auto-repeat. A held key is represented by this.jump.
      if (e.repeat) {
        this.keys.add(code);
        this.sync();
        return;
      }

      if (['Space','ArrowUp','KeyW'].includes(code)) this.jumpPressed = true;
      if (['KeyE','KeyX'].includes(code)) this.actionPressed = true;
      if (['ShiftLeft','ShiftRight','KeyF'].includes(code)) this.dashPressed = true;

      this.keys.add(code);
      this.sync();
    }, { passive: false });

    addEventListener('keyup', e => {
      const code = e.code || '';
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      if (['Space','ArrowUp','KeyW'].includes(code)) this.jumpReleased = true;
      this.keys.delete(code);
      this.sync();
    }, { passive: false });

    for (const [id, type] of [
      ['left', 'left'],
      ['right', 'right'],
      ['jump', 'jump'],
      ['action', 'action'],
      ['dash', 'dash']
    ]) this.touch(id, type);

    this.sync();
  }

  sync() {
    this.left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touchKeys.has('left');
    this.right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touchKeys.has('right');
    this.jump = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.touchKeys.has('jump');
    this.action = this.keys.has('KeyE') || this.keys.has('KeyX') || this.touchKeys.has('action');
    this.dash = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyF') || this.touchKeys.has('dash');
  }

  touch(id, type) {
    const el = document.getElementById(id);
    if (!el) return;

    const press = e => {
      e.preventDefault();
      try { el.setPointerCapture?.(e.pointerId); } catch (_) {}

      if (!this.touchKeys.has(type)) {
        if (type === 'jump') this.jumpPressed = true;
        if (type === 'action') this.actionPressed = true;
        if (type === 'dash') this.dashPressed = true;
      }

      this.touchKeys.add(type);
      this.sync();
    };

    const release = e => {
      e.preventDefault();
      if (type === 'jump') this.jumpReleased = true;
      this.touchKeys.delete(type);
      this.sync();
    };

    el.addEventListener('pointerdown', press, { passive: false });
    el.addEventListener('pointerup', release, { passive: false });
    el.addEventListener('pointercancel', release, { passive: false });
    el.addEventListener('lostpointercapture', release, { passive: false });
  }

  consume() {
    this.jumpPressed = false;
    this.jumpReleased = false;
    this.actionPressed = false;
    this.dashPressed = false;
  }
}
