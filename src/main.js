import {UI} from './ui.js';
import {Game} from './game.js';

const fatal=e=>{
 console.error(e);
 const app=document.getElementById('app');
 if(app)app.innerHTML=`<div style="min-height:100%;display:grid;place-items:center;background:#080b12;color:#fff;font:16px system-ui;padding:24px"><section style="max-width:720px;background:#111827;border:1px solid #ef4444;border-radius:16px;padding:24px"><h1>Spiel konnte nicht gestartet werden</h1><p>Bitte Seite neu laden.</p><details><summary>Technische Meldung</summary><pre style="white-space:pre-wrap">${String(e?.stack||e)}</pre></details></section></div>`;
};
addEventListener('error',e=>fatal(e.error||e.message));
addEventListener('unhandledrejection',e=>fatal(e.reason));
try{window.juliaGame=new Game(new UI());window.__juliaReady=true;window.__juliaBootReady?.()}catch(e){window.__juliaBootError?.(e);fatal(e)}
