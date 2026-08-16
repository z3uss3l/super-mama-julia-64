export class UI{
 constructor(){
  const app=document.getElementById('app');
  app.innerHTML=`<div id="game"><canvas id="canvas"></canvas>
   <div id="hud">
    <div class="bar"><span id="stats"></span><span id="level"></span></div>
    <div id="objective"></div><div id="abilities"></div><div id="combo"></div>
    <div id="boss"><b id="bossName"></b><div><i id="bossFill"></i></div></div><div id="toast"></div>
   </div>
   <div id="screen"><section><div class="eyebrow">SUPER MAMA JULIA 64</div><h1 id="screenTitle">REBORN</h1><h2 id="screenSub">V5.2</h2><p id="screenText"></p><div class="buttons"><button id="new">NEUES SPIEL</button><button id="continue">FORTSETZEN</button><button id="saveReset">SAVE LÖSCHEN</button></div><small>← → / A D · Springen Space/W · Angriff E/X · Werfen Q/R · Dash Shift/F · Pause P</small><div class="tip">Tipp: kurze Sprünge mit Loslassen steuern · Gegner von oben besiegen</div></section></div><div id="transition"><div id="transitionText"></div></div>
   <div id="touch" aria-label="Touch-Steuerung">
    <div class="touchPad" aria-label="Bewegung">
      <button id="left" type="button" aria-label="Nach links">◀</button>
      <button id="right" type="button" aria-label="Nach rechts">▶</button>
    </div>
    <div class="touchActions" aria-label="Aktionen">
      <button id="dash" type="button" aria-label="Dash">↯<span>Dash</span></button>
      <button id="throw" type="button" aria-label="Werfen">✦<span>Wurf</span></button>
      <button id="action" type="button" aria-label="Angriff">⚡<span>Angriff</span></button>
      <button id="jump" type="button" aria-label="Springen">▲<span>Sprung</span></button>
    </div>
  </div></div></div>`;
  this.style();
 }
 style(){
  const s=document.createElement('style');s.textContent=`*{box-sizing:border-box}html,body,#app,#game{margin:0;width:100%;height:100%;overflow:hidden;background:#05070d;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}#game{position:relative;isolation:isolate}canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;display:block}#hud{position:absolute;z-index:20;inset:0;pointer-events:none;text-shadow:2px 2px 4px #000}
  #hud:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#0003,transparent 18%,transparent 78%,#0005);z-index:-1}.bar{display:flex;justify-content:space-between;padding:12px;gap:8px}.bar span,#objective,#abilities,#combo{background:#070b12bb;border:1px solid #fff3;border-radius:10px;padding:7px 10px;font-weight:900}.bar span{font-size:13px}#objective{position:absolute;top:58px;left:12px}#abilities{position:absolute;top:58px;right:12px}.ability{display:inline-block;margin-left:7px}.ready{color:#9cffb0}.locked{opacity:.3;filter:grayscale(1)}#combo{position:absolute;top:105px;left:50%;transform:translateX(-50%);color:#ffd43b;opacity:0;transition:.15s}#combo.show{opacity:1}#boss{display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);width:min(360px,55vw);text-align:center}#boss div{height:13px;background:#171b26;border:1px solid #fff;border-radius:8px;overflow:hidden}#bossFill{display:block;height:100%;width:100%;background:#ff4d4d}#toast{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(.96);background:#090c16ee;border:2px solid #ffd43b;padding:14px 20px;border-radius:12px;color:#ffe47b;font-weight:900;opacity:0;transition:.18s;white-space:pre-line;max-width:min(680px,88vw);text-align:center}#screen{position:absolute;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;background:#050812c9;backdrop-filter:blur(5px)}#screen section{width:min(760px,92%);padding:34px;background:#070b14ee;border:1px solid #fff2;border-radius:22px;box-shadow:0 25px 100px #000}.eyebrow{font-weight:900;letter-spacing:.2em;color:#ffd43b}#screen h1{font-size:clamp(44px,8vw,82px);line-height:.9;margin:8px 0;color:#ffd43b}#screen p{white-space:pre-line;color:#d8dbea;line-height:1.55}.buttons{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}.buttons button,#touch button{border:1px solid #fff4;background:#111827;color:#fff;border-radius:11px;padding:12px 18px;font-weight:900}.buttons button:first-child{background:#7d4b00;border-color:#ffd43b}small{display:block;margin-top:18px;color:#aab1c5}#screen .buttons{pointer-events:auto}#transition{position:absolute;z-index:90;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at center,#ffd43b22,transparent 42%),#03050dcc;opacity:0;transition:opacity .28s ease;backdrop-filter:blur(0)}#transition.show{opacity:1;backdrop-filter:blur(8px)}#transitionText{font-size:clamp(24px,5vw,54px);font-weight:1000;letter-spacing:.08em;text-align:center;color:#fff;text-shadow:0 0 18px #ffd43b,0 0 42px #ff8a2b;transform:scale(.9);transition:transform .35s ease}.show #transitionText{transform:scale(1)}#touch{position:fixed;z-index:30;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));width:100%;display:flex;align-items:flex-end;justify-content:space-between;padding:0 max(14px,env(safe-area-inset-left)) 0 max(14px,env(safe-area-inset-right));pointer-events:none;box-sizing:border-box;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
#touch>div{pointer-events:auto}
.touchPad{display:grid;grid-template-columns:repeat(2,clamp(68px,11vw,82px));gap:10px;align-items:end}
.touchActions{display:grid;grid-template-columns:repeat(2,clamp(62px,10vw,76px));grid-template-rows:repeat(2,clamp(62px,10vw,76px));gap:10px;align-items:end}
#touch button{position:relative;width:100%;height:100%;min-width:62px;min-height:62px;padding:0;border:1px solid #ffffff2e;border-radius:24px;color:#fff;background:linear-gradient(145deg,#263653ed,#080d18ed);touch-action:none;pointer-events:auto;cursor:pointer;box-shadow:0 7px 22px #0009,0 0 0 1px #0008 inset,0 2px 0 #ffffff14 inset;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:30px;font-weight:1000;line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .08s ease,filter .08s ease,box-shadow .08s ease,border-color .08s ease;}
#touch button span{position:absolute;bottom:7px;left:0;right:0;font-size:9px;line-height:1;font-weight:900;letter-spacing:.08em;text-transform:uppercase;opacity:.68;text-shadow:0 1px 3px #000}
#left,#right{border-radius:22px!important;font-size:34px!important;background:linear-gradient(145deg,#1d2d49ed,#090e19ed)!important}
#left:active,#right:active{transform:scale(.94) translateY(2px)!important}
#jump{grid-column:2;grid-row:1 / span 2;width:calc(100% + 4px)!important;height:calc(100% + 4px)!important;min-width:70px!important;min-height:70px!important;border-radius:50%!important;font-size:34px!important;background:radial-gradient(circle at 35% 28%,#ffe88a,#d89016 55%,#754600)!important;border-color:#ffe27a!important;box-shadow:0 8px 26px #000a,0 0 22px #ffd43b55,0 2px 0 #fff6 inset!important}
#jump span{color:#fff8}
#action{grid-column:1;grid-row:2;border-color:#ffffff45!important;background:radial-gradient(circle at 35% 28%,#fff7,#3b4255 55%,#151a25)!important}
#throw{grid-column:1;grid-row:1;border-color:#ffd43b66!important;background:radial-gradient(circle at 35% 28%,#fff0b8,#c07b12 55%,#5e3600)!important}
#dash{grid-column:2;grid-row:2;border-color:#9c7cff66!important;background:radial-gradient(circle at 35% 28%,#e7dcff,#6548b8 55%,#261b55)!important}
#touch button:active,#touch button.isPressed{transform:scale(.94) translateY(2px);filter:brightness(1.3);box-shadow:0 3px 10px #000a,0 0 18px #ffd43b33 inset}
#touch button:focus-visible{outline:3px solid #fff;outline-offset:3px}
@media(max-width:700px){#touch{padding-left:max(10px,env(safe-area-inset-left));padding-right:max(10px,env(safe-area-inset-right));gap:8px}.touchPad{grid-template-columns:repeat(2,clamp(64px,19vw,78px));gap:8px}.touchActions{grid-template-columns:repeat(2,clamp(58px,17vw,72px));grid-template-rows:repeat(2,clamp(58px,17vw,72px));gap:8px}#touch button{border-radius:21px!important}.touchActions #jump{min-width:66px!important;min-height:66px!important}}
@media(max-width:430px){#touch{bottom:max(8px,env(safe-area-inset-bottom));padding-left:8px;padding-right:8px}.touchPad{grid-template-columns:repeat(2,58px);gap:7px}.touchActions{grid-template-columns:repeat(2,54px);grid-template-rows:repeat(2,54px);gap:7px}#touch button{min-width:54px;min-height:54px;font-size:25px}.touchPad button{font-size:29px!important}.touchActions #jump{min-width:62px!important;min-height:62px!important}#touch button span{font-size:8px;bottom:5px}}
@media(min-width:701px){#touch{max-width:1120px;margin:auto;padding-left:22px;padding-right:22px}.touchPad{grid-template-columns:82px 82px}.touchActions{grid-template-columns:72px 72px;grid-template-rows:72px 72px}}
.tip{margin-top:8px;font-size:12px;color:#8f98ad}@media(max-width:600px){#abilities{top:105px}#objective{top:105px;max-width:50vw}#screen section{padding:24px}.bar span{font-size:11px}}`;document.head.appendChild(s)
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
 toast(t){const e=this.q('#toast');e.textContent=t;e.style.opacity='1';e.style.transform='translate(-50%,-50%) scale(1)';clearTimeout(this.tt);this.tt=setTimeout(()=>{e.style.opacity='0'},1900)}
 transition(text=''){const e=this.q('#transition');if(!e)return;const label=this.q('#transitionText');label.textContent=text;e.classList.add('show');clearTimeout(this.transitionTimer);this.transitionTimer=setTimeout(()=>e.classList.remove('show'),520)}
 showScreen(title,text,sub=''){this.q('#screen').style.display='flex';this.q('#screen').setAttribute('aria-hidden','false');this.q('#screenTitle').textContent=title;this.q('#screenSub').textContent=sub;this.q('#screenText').textContent=text}
 hideScreen(){this.q('#screen').style.display='none'}
}
