// Keyboard + mouse + touch, reduced to what the world needs each step:
// a move vector, an aim point, and edge-triggered actions (start, nova, pause).
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.mouseSeen = false;
    this.pressed = new Set(); // keys pressed since the last consume()
    this.clicked = false;     // a mouse press since the last consume()
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseSeen = true;
    });
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseSeen = true;
      this.mouseDown = true;
      this.clicked = true;
    });
    window.addEventListener('pointerup', () => { this.mouseDown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** -1/0/1 on each axis from WASD or the arrow keys. */
  moveVector() {
    const k = this.keys;
    const x = (k.has('d') || k.has('ArrowRight') ? 1 : 0) - (k.has('a') || k.has('ArrowLeft') ? 1 : 0);
    const y = (k.has('s') || k.has('ArrowDown') ? 1 : 0) - (k.has('w') || k.has('ArrowUp') ? 1 : 0);
    if (x !== 0 && y !== 0) {
      const n = Math.SQRT1_2;
      return { x: x * n, y: y * n };
    }
    return { x, y };
  }

  /** True once for each press of the named key (use ' ' for Space). */
  wasPressed(key) {
    if (this.pressed.has(key)) {
      this.pressed.delete(key);
      return true;
    }
    return false;
  }

  wasClicked() {
    if (this.clicked) {
      this.clicked = false;
      return true;
    }
    return false;
  }

  /** Clear edge triggers (call after the frame has read them). */
  consume() {
    this.pressed.clear();
    this.clicked = false;
  }
}
