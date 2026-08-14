import { UI } from './ui.js';
import { Game } from './game.js';

const showFatal = (error) => {
  console.error(error);
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `<div style=\"min-height:100%;display:grid;place-items:center;background:#080b12;color:#fff;font:16px system-ui;padding:24px;box-sizing:border-box\"><section style=\"max-width:720px;background:#111827;border:1px solid #ef4444;border-radius:16px;padding:24px\"><h1 style=\"margin-top:0;color:#ff6b6b\">Spiel konnte nicht gestartet werden</h1><p>Die Laufzeitumgebung hat einen Fehler gemeldet. Bitte Seite neu laden.</p><details><summary>Technische Meldung</summary><pre style=\"white-space:pre-wrap\">${String(error?.stack || error)}</pre></details></section></div>`;
};

window.addEventListener('error', (event) => showFatal(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => showFatal(event.reason));

try {
  const ui = new UI();
  const game = new Game(ui);
  window.juliaGame = game;
} catch (error) {
  showFatal(error);
}
