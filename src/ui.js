export class UI{
 constructor(){
  const app=document.getElementById('app');
  app.innerHTML=`<div id="game"><canvas id="canvas"></canvas>
   <div id="hud">
    <div class="bar"><span id="stats"></span><span id="level"></span></div>
    <div id="objective"></div><div id="abilities"></div><div id="combo"></div>
    <div id="boss"><b id="bossName"></b><div><i id="bossFill"></i></div></div><div id="toast"></div>
   </div>
   <div id="screen"><section><div class="eyebrow">SUPER MAMA JULIA 64</div><h1 id="screenTitle">REBORN</h1><h2 id="screenSub">V5.2</h2><p id="screenText"></p><div class="buttons"><button id="new">NEUES SPIEL</button><button id="continue">FORTSETZEN</button><button id="saveReset">SAVE LÖSCHEN</button></div><small>← → / A D · Springen Space/W · Angriff E/X · Dash Shift/F · Pause P</small></section></div>
   <div id="touch"><div><button id="left">◀</button><button id="right">▶</button></div><div><button id="dash">↯</button><button id="action">⚡</button><button id="jump">▲</button></div></div></div>`;
  this.style();
 }
 style(){
  const s=document.createElement('style');s.textContent=`*{box-sizing:border-box}html,body,#app,#game{margin:0;width:100%;height:100%;overflow:hidden;background:#05070d;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}#game{position:relative;isolation:isolate}canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;display:block}#hud{position:absolute;z-index:20;inset:0;pointer-events:none;text-shadow:2px 2px 4px #000}
  #hud:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#0003,transparent 18%,transparent 78%,#0005);z-index:-1}.bar{display:flex;justify-content:space-between;padding:12px;gap:8px}.bar span,#objective,#abilities,#combo{background:#070b12bb;border:1px solid #fff3;border-radius:10px;padding:7px 10px;font-weight:900}.bar span{font-size:13px}#objective{position:absolute;top:58px;left:12px}#abilities{position:absolute;top:58px;right:12px}.ability{display:inline-block;margin-left:7px}.ready{color:#9cffb0}.locked{opacity:.3;filter:grayscale(1)}#combo{position:absolute;top:105px;left:50%;transform:translateX(-50%);color:#ffd43b;opacity:0;transition:.15s}#combo.show{opacity:1}#boss{display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);width:min(360px,55vw);text-align:center}#boss div{height:13px;background:#171b26;border:1px solid #fff;border-radius:8px;overflow:hidden}#bossFill{display:block;height:100%;width:100%;background:#ff4d4d}#toast{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(.96);background:#090c16ee;border:2px solid #ffd43b;padding:14px 20px;border-radius:12px;color:#ffe47b;font-weight:900;opacity:0;transition:.18s;white-space:nowrap}#screen{position:absolute;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;background:#050812c9;backdrop-filter:blur(5px)}#screen section{width:min(760px,92%);padding:34px;background:#070b14ee;border:1px solid #fff2;border-radius:22px;box-shadow:0 25px 100px #000}.eyebrow{font-weight:900;letter-spacing:.2em;color:#ffd43b}#screen h1{font-size:clamp(44px,8vw,82px);line-height:.9;margin:8px 0;color:#ffd43b}#screen p{white-space:pre-line;color:#d8dbea;line-height:1.55}.buttons{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}.buttons button,#touch button{border:1px solid #fff4;background:#111827;color:#fff;border-radius:11px;padding:12px 18px;font-weight:900}.buttons button:first-child{background:#7d4b00;border-color:#ffd43b}small{display:block;margin-top:18px;color:#aab1c5}#screen .buttons{pointer-events:auto}#touch{position:fixed;z-index:30;bottom:10px;left:50%;transform:translateX(-50%);width:min(1100px,100%);display:flex;justify-content:space-between;padding:0 12px;pointer-events:none}#touch>div{display:flex;gap:8px;pointer-events:auto}#touch button{width:58px;height:58px;padding:0;border-radius:50%;font-size:21px;background:#08101acc;touch-action:none;box-shadow:0 5px 18px #0008;backdrop-filter:blur(5px)}#touch button:active{transform:scale(.92);background:#263044dd}@media(max-width:600px){#abilities{top:105px}#objective{top:105px;max-width:50vw}#screen section{padding:24px}.bar span{font-size:11px}}`;document.head.appendChild(s)
 }
 q(s){return document.querySelector(s)}
 setStats(s){this.q('#stats').textContent=`⭐ ${s.score} · 🪙 ${s.coins} · ❤️ ${s.lives} · 🔥 ${s.combo}`}
 setLevel(t){this.q('#level').textContent=t}
 setObjective(t){this.q('#objective').textContent=t}
 setAbilities(u){const e=this.q('#abilities');e.replaceChildren();for(const [icon,key] of [['↥','doubleJump'],['↯','dash'],['🛡','shield'],['⭐','starPower'],['🦁','lion']]){const s=document.createElement('span');s.className=`ability ${u[key]?'ready':'locked'}`;s.textContent=icon;s.title=key==='lion'?'Löwenform':key;e.appendChild(s)}}
 setCombo(n){const e=this.q('#combo');e.textContent=n>1?`COMBO ×${n}`:'';e.classList.toggle('show',n>1)}
 setCheckpoint(on){this.q('#objective').dataset.checkpoint=on?'🚩':''}
 showBoss(name,hp,max){this.q('#boss').style.display='block';this.q('#bossName').textContent=`👹 ${name}`;this.q('#bossFill').style.width=`${Math.max(0,hp/max)*100}%`}
 hideBoss(){this.q('#boss').style.display='none'}
 toast(t){const e=this.q('#toast');e.textContent=t;e.style.opacity='1';e.style.transform='translate(-50%,-50%) scale(1)';clearTimeout(this.tt);this.tt=setTimeout(()=>{e.style.opacity='0'},1200)}
 showScreen(title,text,sub=''){this.q('#screen').style.display='flex';this.q('#screen').setAttribute('aria-hidden','false');this.q('#screenTitle').textContent=title;this.q('#screenSub').textContent=sub;this.q('#screenText').textContent=text}
 hideScreen(){this.q('#screen').style.display='none'}
}
