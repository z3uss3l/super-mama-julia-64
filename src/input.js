/*
 * SUPER MAMA JULIA 64
 * Input System V5.5
 *
 * Supports:
 *   - Keyboard
 *   - Touch / Pointer
 *   - Mouse
 *   - Held movement
 *   - Press / release events
 *   - Jump buffer integration
 *   - Dash
 *   - Action
 *
 * Public state:
 *   left
 *   right
 *   jump
 *   action
 *
 * Edge events:
 *   jumpPressed
 *   jumpReleased
 *   actionPressed
 *   dashPressed
 *
 * Callbacks:
 *   onJump
 *   onJumpRelease
 *   onAction
 *   onDash
 */

export class Input {

  constructor() {

    /* -------------------------------------------------------------- */
    /* Held state                                                      */
    /* -------------------------------------------------------------- */

    this.left = false;
    this.right = false;
    this.jump = false;
    this.action = false;
    this.dash = false;


    /* -------------------------------------------------------------- */
    /* Edge state                                                      */
    /* -------------------------------------------------------------- */

    this.jumpPressed = false;
    this.jumpReleased = false;

    this.actionPressed = false;
    this.actionReleased = false;

    this.dashPressed = false;
    this.dashReleased = false;


    /* -------------------------------------------------------------- */
    /* Input collections                                               */
    /* -------------------------------------------------------------- */

    this.keys = new Set();
    this.touchKeys = new Set();


    /* -------------------------------------------------------------- */
    /* Callbacks                                                        */
    /* -------------------------------------------------------------- */

    this.onJump = null;
    this.onJumpRelease = null;

    this.onAction = null;

    this.onDash = null;
    this.onDashRelease = null;


    /* -------------------------------------------------------------- */
    /* Pointer bookkeeping                                             */
    /* -------------------------------------------------------------- */

    this.activePointers = new Map();


    /* -------------------------------------------------------------- */
    /* Bind everything                                                  */
    /* -------------------------------------------------------------- */

    this.bind();
  }


  /* ================================================================== */
  /* GLOBAL KEYBOARD                                                    */
  /* ================================================================== */

  bind() {

    addEventListener(
      'keydown',
      event => this.handleKeyDown(event),
      { passive: false }
    );


    addEventListener(
      'keyup',
      event => this.handleKeyUp(event),
      { passive: false }
    );


    /*
     * If the browser loses focus while a key is held,
     * release everything.
     *
     * This prevents the classic mobile/desktop bug:
     *
     *   hold right
     *   switch tab
     *   return
     *   Julia keeps running forever
     */
    addEventListener(
      'blur',
      () => this.releaseAll()
    );


    addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          this.releaseAll();
        }
      }
    );


    /* -------------------------------------------------------------- */
    /* Touch controls                                                  */
    /* -------------------------------------------------------------- */

    this.touch('left', 'left');
    this.touch('right', 'right');
    this.touch('jump', 'jump');
    this.touch('action', 'action');
    this.touch('dash', 'dash');
  }


  /* ================================================================== */
  /* KEYBOARD                                                           */
  /* ================================================================== */

  handleKeyDown(event) {

    const code = event.code;

    /*
     * Prevent browser scrolling / navigation for game controls.
     */
    if (
      [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight'
      ].includes(code)
    ) {
      event.preventDefault();
    }


    /*
     * Ignore keyboard auto-repeat for press events.
     */
    const alreadyDown = this.keys.has(code);

    this.keys.add(code);


    if (!alreadyDown) {

      /* Jump */
      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'KeyW'
      ) {
        this.pressJump();
      }


      /* Action */
      if (
        code === 'KeyE' ||
        code === 'KeyX'
      ) {
        this.pressAction();
      }


      /* Dash */
      if (
        code === 'ShiftLeft' ||
        code === 'ShiftRight' ||
        code === 'KeyF'
      ) {
        this.pressDash();
      }
    }


    this.sync();
  }


  handleKeyUp(event) {

    const code = event.code;

    const wasDown = this.keys.has(code);

    this.keys.delete(code);


    if (wasDown) {

      /* Jump release */
      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'KeyW'
      ) {
        this.releaseJump();
      }


      /* Action release */
      if (
        code === 'KeyE' ||
        code === 'KeyX'
      ) {
        this.releaseAction();
      }


      /* Dash release */
      if (
        code === 'ShiftLeft' ||
        code === 'ShiftRight' ||
        code === 'KeyF'
      ) {
        this.releaseDash();
      }
    }


    this.sync();
  }


  /* ================================================================== */
  /* TOUCH / POINTER                                                    */
  /* ================================================================== */

  touch(id, type) {

    const element = document.getElementById(id);

    if (!element) {
      console.warn(
        `[Input] Touch control #${id} nicht gefunden.`
      );

      return;
    }


    /*
     * Prevent the browser from interpreting game controls
     * as scrolling, dragging or page gestures.
     */
    element.style.touchAction = 'none';


    const press = event => {

      event.preventDefault();


      /*
       * Pointer-ID merken.
       *
       * Dadurch können mehrere Finger gleichzeitig aktiv sein.
       */
      const pointerId =
        Number.isFinite(event.pointerId)
          ? event.pointerId
          : 0;


      this.activePointers.set(
        pointerId,
        type
      );


      /*
       * Keep pointer capture.
       *
       * Important on phones:
       * dragging a finger slightly outside the button
       * must not randomly lose the state.
       */
      if (
        typeof element.setPointerCapture === 'function' &&
        Number.isFinite(event.pointerId)
      ) {
        try {
          element.setPointerCapture(
            event.pointerId
          );
        } catch (_) {
          /*
           * Some browsers reject capture in edge cases.
           * Not fatal.
           */
        }
      }


      switch (type) {

        case 'left':
        case 'right':

          this.touchKeys.add(type);
          this.sync();

          break;


        case 'jump':

          this.pressJump();

          this.touchKeys.add('jump');
          this.sync();

          break;


        case 'action':

          this.pressAction();

          this.touchKeys.add('action');
          this.sync();

          break;


        case 'dash':

          this.pressDash();

          this.touchKeys.add('dash');
          this.sync();

          break;
      }
    };


    const release = event => {

      event.preventDefault();


      const pointerId =
        Number.isFinite(event.pointerId)
          ? event.pointerId
          : 0;


      const registeredType =
        this.activePointers.get(pointerId);


      /*
       * If we know which control this pointer started on,
       * use that exact control.
       */
      const releaseType =
        registeredType || type;


      this.activePointers.delete(pointerId);


      switch (releaseType) {

        case 'left':
        case 'right':

          this.touchKeys.delete(
            releaseType
          );

          this.sync();

          break;


        case 'jump':

          this.touchKeys.delete('jump');

          this.releaseJump();

          this.sync();

          break;


        case 'action':

          this.touchKeys.delete('action');

          this.releaseAction();

          this.sync();

          break;


        case 'dash':

          this.touchKeys.delete('dash');

          this.releaseDash();

          this.sync();

          break;
      }


      if (
        typeof element.releasePointerCapture === 'function' &&
        Number.isFinite(event.pointerId)
      ) {
        try {
          element.releasePointerCapture(
            event.pointerId
          );
        } catch (_) {
          /*
           * Pointer may already have been released.
           */
        }
      }
    };


    element.addEventListener(
      'pointerdown',
      press,
      { passive: false }
    );


    element.addEventListener(
      'pointerup',
      release,
      { passive: false }
    );


    element.addEventListener(
      'pointercancel',
      release,
      { passive: false }
    );


    /*
     * pointerleave is deliberately NOT treated as release.
     *
     * With pointer capture, a finger can leave the visual button
     * while still holding it.
     */
  }


  /* ================================================================== */
  /* STATE SYNCHRONISATION                                              */
  /* ================================================================== */

  sync() {

    this.left =
      this.keys.has('ArrowLeft') ||
      this.keys.has('KeyA') ||
      this.touchKeys.has('left');


    this.right =
      this.keys.has('ArrowRight') ||
      this.keys.has('KeyD') ||
      this.touchKeys.has('right');


    this.jump =
      this.keys.has('Space') ||
      this.keys.has('ArrowUp') ||
      this.keys.has('KeyW') ||
      this.touchKeys.has('jump');


    this.action =
      this.keys.has('KeyE') ||
      this.keys.has('KeyX') ||
      this.touchKeys.has('action');


    this.dash =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.keys.has('KeyF') ||
      this.touchKeys.has('dash');
  }


  /* ================================================================== */
  /* AXIS                                                               */
  /* ================================================================== */

  getAxis() {

    if (this.right && !this.left) {
      return 1;
    }


    if (this.left && !this.right) {
      return -1;
    }


    return 0;
  }


  /* ================================================================== */
  /* JUMP                                                               */
  /* ================================================================== */

  pressJump() {

    /*
     * Only generate a press event once.
     */
    if (this.jumpPressed) {
      return;
    }


    this.jumpPressed = true;


    if (typeof this.onJump === 'function') {
      this.onJump();
    }
  }


  releaseJump() {

    this.jumpReleased = true;


    if (typeof this.onJumpRelease === 'function') {
      this.onJumpRelease();
    }
  }


  /* ================================================================== */
  /* ACTION                                                             */
  /* ================================================================== */

  pressAction() {

    if (this.actionPressed) {
      return;
    }


    this.actionPressed = true;


    if (typeof this.onAction === 'function') {
      this.onAction();
    }
  }


  releaseAction() {

    this.actionReleased = true;
  }


  /* ================================================================== */
  /* DASH                                                               */
  /* ================================================================== */

  pressDash() {

    if (this.dashPressed) {
      return;
    }


    this.dashPressed = true;


    if (typeof this.onDash === 'function') {
      this.onDash();
    }
  }


  releaseDash() {

    this.dashReleased = true;


    if (typeof this.onDashRelease === 'function') {
      this.onDashRelease();
    }
  }


  /* ================================================================== */
  /* GENERIC KEY STATE                                                  */
  /* ================================================================== */

  isDown(code) {

    return (
      this.keys.has(code) ||
      this.touchKeys.has(code)
    );
  }


  /* ================================================================== */
  /* RELEASE ALL                                                        */
  /* ================================================================== */

  releaseAll() {

    this.keys.clear();
    this.touchKeys.clear();
    this.activePointers.clear();

    this.left = false;
    this.right = false;
    this.jump = false;
    this.action = false;
    this.dash = false;

    /*
     * A forced release should also shorten an active jump.
     */
    if (typeof this.onJumpRelease === 'function') {
      this.onJumpRelease();
    }


    this.sync();
  }


  /* ================================================================== */
  /* FRAME EVENT CONSUMPTION                                            */
  /* ================================================================== */

  consume() {

    this.jumpPressed = false;
    this.jumpReleased = false;

    this.actionPressed = false;
    this.actionReleased = false;

    this.dashPressed = false;
    this.dashReleased = false;
  }
}
