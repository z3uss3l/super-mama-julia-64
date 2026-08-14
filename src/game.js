import * as THREE from 'three';
import {GAME,LEVELS,ENEMY_STATS} from './config.js';
import {RuntimeState} from './state.js';
import {Input} from './input.js';
import {AudioManager} from './audio.js';
import {Particles} from './particles.js';
import {makePlayer,makeLion} from './entities.js';
import {buildLevel} from './levels.js';
import {resolvePlayer} from './physics.js';
import {WorldRuntime} from './world.js';
import {FollowCamera} from './camera.js';
import {Progression} from './progression.js';

export class Game{
 constructor(ui){
  this.ui=ui;this.state=new RuntimeState();this.input=new Input();this.audio=new AudioManager();
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(58,1,.1,240);
  this.renderer=new THREE.WebGLRenderer({canvas:document.getElementById('canvas'),antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.clock=new THREE.Clock();this.particles=new Particles(this.scene);this.world=new WorldRuntime(this.scene);
  this.follow=new FollowCamera(this.camera);this.progression=new Progression(this.state,ui,this.audio,this.particles);
  this.player=null;this.playerModel=null;this.lionModel=null;this.level=null;this.boss=null;this.projectiles=[];this.running=false;this.lastToast=0;
  this.bind();this.resize();addEventListener('resize',()=>this.resize());this.ui.setAbilities(this.state.save.unlocks);this.loop();
 }
 bind(){
  document.getElementById('new').onclick=()=>{this.audio.init();this.state.newGame();this.startLevel(0,true)};
  document.getElementById('continue').onclick=()=>{this.audio.init();this.startLevel(Math.min(this.state.save.level,LEVELS.length-1),false)};
  document.getElementById('saveReset').onclick=()=>{this.state.newGame();this.ui.toast('Save gelöscht')};
  addEventListener('keydown',e=>{if(e.code==='KeyP'||e.code==='Escape')this.togglePause()});
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.follow.resize(w,h)}
 clear(){this.world.clear();this.particles.clear();for(const p of this.projectiles)this.scene.remove(p.mesh);this.projectiles=[];if(this.playerModel)this.scene.remove(this.playerModel);if(this.lionModel)this.scene.remove(this.lionModel);this.playerModel=null;this.lionModel=null;this.boss=null;this.level=null}
 startLevel(index,newRun=false){
  if(index>=LEVELS.length){this.win();return}
  this.clear();this.state.mode='play';this.state.level=index;
  if(newRun){this.state.score=0;this.state.coins=0;this.state.lives=3;this.state.checkpoint=null;this.state.save.checkpoint=null}
  this.level=buildLevel(index);this.scene.background=new THREE.Color(this.level.world.sky);
  this.scene.fog=new THREE.Fog(this.level.world.fog,35,115);
  const cp=this.state.checkpoint&&this.state.checkpoint.level===index?this.state.checkpoint:null;
  this.player={x:cp?.x??0,y:cp?.y??1,vx:0,vy:0,facing:1,grounded:false,jumps:0,inv:0,attack:0,dash:0,shield:this.state.save.unlocks.shield?3:0,star:0,lion:!!this.state.save.unlocks.lion,contact:0,hitStop:0};
  this.playerModel=makePlayer();this.scene.add(this.playerModel);this.lionModel=makeLion();this.lionModel.visible=false;this.scene.add(this.lionModel);
  this.world.mount(this.level);if(this.level.boss)this.spawnBoss();
  this.state.quest={kind:this.level.cfg.questKind,target:this.level.cfg.questTarget,progress:0,done:false};
  this.state.levelStart=performance.now();this.state.bossDefeated=false;
  this.ui.hideScreen();this.ui.hideBoss();this.ui.setAbilities(this.state.save.unlocks);
  this.ui.setObjective(this.level.cfg.quest);this.ui.setLevel(`${this.level.cfg.name} · ${index+1}/${LEVELS.length}`);this.audio.power();
 }
 spawnBoss(){const b=this.level.boss;this.world.addBoss(b);this.boss=this.world.boss;this.audio.boss();this.ui.showBoss(b.stats.name,b.hp,b.hp)}
 togglePause(){if(this.state.mode==='play'){this.state.mode='pause';this.state.persist();this.ui.showScreen('PAUSE','Fortschritt und Checkpoint sind gesichert.','V5.0')}else if(this.state.mode==='pause'){this.state.mode='play';this.ui.hideScreen()}}
 jump(){
  const p=this.player;
  if(p.grounded){p.vy=GAME.jumpSpeed;p.grounded=false;p.jumps=1;p.supportPlatform=null;this.state.save.stats.jumps++;this.audio.jump()}
  else if(this.state.save.unlocks.doubleJump&&p.jumps<2){p.vy=GAME.jumpSpeed*.9;p.jumps++;this.audio.jump()}
 }
 dash(){
  const p=this.player;if(!this.state.save.unlocks.dash||p.dash>0)return;
  p.dash=.22;p.inv=.28;p.supportPlatform=null;p.vx=(this.input.right?1:this.input.left?-1:p.facing)*GAME.dashSpeed;
  this.state.save.stats.dashes++;this.audio.dash();this.particles.burst(this.playerModel.position,0xffd43b,16,7)
 }
 attack(){
  const p=this.player;if(p.attack>0)return;p.attack=.24;this.audio.hit();
  const dir=p.vx?Math.sign(p.vx):p.facing,px=p.x+dir*1.05;
  for(const e of this.world.enemies){if(!e.alive)continue;const dx=Math.abs(e.mesh.position.x-px),dy=Math.abs(e.mesh.position.y-p.y);if(dx<1.35&&dy<1.25)this.damageEnemy(e,1)}
  if(this.boss){const dx=Math.abs(this.boss.mesh.position.x-px),dy=Math.abs(this.boss.mesh.position.y-p.y);if(dx<1.8&&dy<1.6)this.damageBoss(1)}
 }
 damageEnemy(e,n){
  e.hp-=n;e.hitFlash=.13;e.mesh.scale.setScalar(1.15);this.particles.burst(e.mesh.position,0xffd43b,9,5);
  if(e.hp<=0){e.alive=false;e.mesh.visible=false;this.state.save.stats.kills++;this.state.addScore(ENEMY_STATS[e.type].value);this.state.quest.progress++;this.state.combo++;this.state.comboTimer=GAME.comboWindow;this.ui.setCombo(this.state.combo)}
 }
 damageBoss(n){
  const b=this.boss;b.hp-=n;this.state.addScore(500);this.particles.burst(b.mesh.position,0xff6a00,15,7);this.ui.showBoss(b.stats.name,b.hp,b.maxHp);this.follow.kick(.18);
  if(b.hp<=0){this.state.save.stats.bosses++;this.state.addScore(5000);this.state.bossDefeated=true;b.mesh.visible=false;this.boss=null;this.ui.hideBoss();this.ui.toast('👑 BOSS BESIEGT!');this.audio.win();this.state.persist()}
 }
 hurt(fall=false){
  const p=this.player;if(p.inv>0||p.star>0)return;
  if(p.shield>0){p.shield=0;p.inv=.7;this.ui.toast('🛡️ Schild absorbiert Treffer');this.audio.hit();return}
  p.inv=1.15;this.state.lives--;this.state.save.stats.damage++;this.state.combo=0;this.ui.setCombo(0);this.audio.hit();this.follow.kick(.22);this.particles.burst(this.playerModel.position,0xff3b43,20,8);
  if(this.state.lives<=0){this.gameOver();return}
  const cp=this.state.checkpoint&&this.state.checkpoint.level===this.state.level?this.state.checkpoint:null;
  p.x=cp?.x??0;p.y=cp?.y??2;p.vx=0;p.vy=0;this.ui.toast(fall?'💥 Abgrund!':'💔 Treffer!');this.state.persist();
 }
 collect(){
  for(const it of this.world.items){if(!it.alive)continue;it.mesh.rotation.y+=.05;const d=Math.hypot(it.x-this.player.x,it.y-(this.player.y+.7));if(d<1.05){it.alive=false;it.mesh.visible=false;this.progression.collect(it.type,this.player,this.playerModel);this.ui.setAbilities(this.state.save.unlocks)}}
 }
 updateEnemies(dt){
  const p=this.player;
  for(const e of this.world.enemies){
   if(!e.alive)continue;e.phase+=dt;e.fire-=dt;
   const st=ENEMY_STATS[e.type],dx=p.x-e.mesh.position.x,dist=Math.abs(dx);
   if(e.hitFlash>0){e.hitFlash-=dt;e.mesh.scale.setScalar(1.12)}else e.mesh.scale.setScalar(1);
   if(e.type==='turret'){
    if(dist<st.aggro&&e.fire<=0){this.projectile(e.mesh.position.x,e.mesh.position.y,Math.sign(dx)||1,0);e.fire=1/st.fireRate}
   }else if(e.type==='bat'){
    if(dist<st.aggro)e.mesh.position.x+=Math.sign(dx)*st.speed*dt*.75;
    e.mesh.position.y=e.y+Math.sin(e.phase*3)*.7;
   }else{
    if(dist<st.aggro)e.mesh.position.x+=Math.sign(dx)*st.speed*dt;
    else e.mesh.position.x+=Math.sin(e.phase)*st.speed*.12*dt;
    e.mesh.position.y=e.y;
   }
   if(p.contact<=0&&dist<st.contactRange&&Math.abs(e.mesh.position.y-p.y)<st.contactHeight){this.hurt();p.contact=.8}
  }
 }
 updateBoss(dt){
  if(!this.boss)return;
  const b=this.boss;b.phase+=dt;b.attackTimer-=dt;
  const dx=this.player.x-b.mesh.position.x,dist=Math.abs(dx);
  if(dist<b.stats.aggro)b.mesh.position.x+=Math.sign(dx)*b.stats.speed*dt*.55;
  b.mesh.position.y=this.level.boss.y+Math.sin(b.phase*1.7)*.75;
  if(dist<b.stats.aggro&&b.attackTimer<=0){
   const n=Math.min(6,2+Math.floor((b.maxHp-b.hp)/5));
   for(let i=0;i<n;i++)this.projectile(b.mesh.position.x,b.mesh.position.y,Math.sign(dx)||1,(i-(n-1)/2)*.55);
   b.attackTimer=Math.max(.65,1.45-(b.maxHp-b.hp)*.025)
  }
  if(this.player.contact<=0&&dist<1.0&&Math.abs(b.mesh.position.y-this.player.y)<1.5){this.hurt();this.player.contact=.9}
 }
 projectile(x,y,dir,spread){const m=new THREE.Mesh(new THREE.SphereGeometry(.13,7,6),new THREE.MeshBasicMaterial({color:0xff4d4d}));m.position.set(x,y,0);this.scene.add(m);this.world.objects.push(m);this.projectiles.push({mesh:m,vx:dir*4.8,vy:spread*2.3,life:4})}
 updateProjectiles(dt){
  for(let i=this.projectiles.length-1;i>=0;i--){const q=this.projectiles[i];q.life-=dt;q.mesh.position.x+=q.vx*dt;q.mesh.position.y+=q.vy*dt;q.vy-=2*dt;if(Math.hypot(q.mesh.position.x-this.player.x,q.mesh.position.y-this.player.y)<.65){this.hurt();q.life=0}if(q.life<=0){this.scene.remove(q.mesh);this.projectiles.splice(i,1)}}
 }
 update(dt){
  if(this.state.mode!=='play')return;
  const p=this.player;this.input.sync();if(this.input.jumpPressed)this.jump();if(this.input.actionPressed)this.attack();if(this.input.dashPressed)this.dash();
  this.world.update(dt);p.vy+=GAME.gravity*dt;p.attack=Math.max(0,p.attack-dt);p.inv=Math.max(0,p.inv-dt);p.contact=Math.max(0,p.contact-dt);p.dash=Math.max(0,p.dash-dt);
  if(p.dash<=0)p.vx=(this.input.right?GAME.playerSpeed:this.input.left?-GAME.playerSpeed:0)*(p.lion?1.12:1);if(p.vx)p.facing=Math.sign(p.vx);
  resolvePlayer(p,this.level.platforms,dt);if(p.y<-3)this.hurt(true);
  this.playerModel.position.set(p.x,p.y,0);this.playerModel.rotation.y=p.facing<0?Math.PI:0;this.playerModel.visible=p.inv<=0||Math.floor(p.inv*14)%2===0;
  this.lionModel.visible=!!p.lion;this.lionModel.position.set(p.x-.75*p.facing,p.y,0);
  this.collect();this.updateEnemies(dt);this.updateBoss(dt);this.updateProjectiles(dt);this.particles.update(dt);
  this.state.comboTimer=Math.max(0,this.state.comboTimer-dt);if(!this.state.comboTimer){this.state.combo=0;this.ui.setCombo(0)}
  const q=this.state.quest;q.done=q.kind==='heart'?this.state.lives>=1:q.progress>=q.target;
  this.ui.setObjective(`${this.level.cfg.quest} · ${q.kind==='heart'?this.state.lives+' ❤️':Math.min(q.progress,q.target)+'/'+q.target}${this.state.bossDefeated?' · 👑':''}`);
  if(!this.state.checkpoint&&p.x>this.level.cfg.length*.48){this.state.checkpoint={x:p.x,y:p.y};this.state.persist();this.ui.toast('🚩 CHECKPOINT');}
  if(p.x>this.level.goalX)this.completeLevel();
  this.follow.follow(p.x,p.y,dt);
  this.ui.setStats({score:this.state.score,coins:this.state.coins,lives:this.state.lives,combo:this.state.combo});
  this.input.consume();
 }
 completeLevel(){
  if(this.state.mode!=='play')return;
  const q=this.state.quest;if(!q.done){if(performance.now()-this.lastToast>1200){this.lastToast=performance.now();this.ui.toast('❗ Quest noch nicht erfüllt')}return}
  if(this.level.boss&&!this.state.bossDefeated){if(performance.now()-this.lastToast>1200){this.lastToast=performance.now();this.ui.toast('👹 Boss zuerst besiegen')}return}
  const t=(performance.now()-this.state.levelStart)/1000;this.state.markLevelComplete(this.state.level,t);this.state.addScore(Math.max(0,5000-Math.floor(t*18)));
  if(this.state.level===1)this.state.unlock('doubleJump');if(this.state.level===3)this.state.unlock('shield');if(this.state.level===5)this.state.unlock('lion');if(this.state.level===7)this.state.unlock('starPower');if(this.state.level===9)this.state.unlock('dash');
  this.state.persist();this.ui.setAbilities(this.state.save.unlocks);this.ui.showScreen('LEVEL GESCHAFFT',`${this.level.cfg.name}\nZeit ${t.toFixed(1)} s · Score ${this.state.score}\nNächstes Level wird geladen …`,'V5.0');this.state.mode='pause';setTimeout(()=>this.startLevel(this.state.level+1,false),1200)
 }
 gameOver(){this.state.mode='over';this.state.persist();this.ui.showScreen('GAME OVER',`Score ${this.state.score}\nLevel ${this.state.level+1}/${LEVELS.length}\nCheckpoint bleibt erhalten.`,'V5.0')}
 win(){this.state.mode='win';this.state.persist();this.ui.showScreen('🎉 GERETTET!',`Julia hat alle 15 Level geschafft!\nScore ${this.state.score} · ${this.state.coins} Münzen\nKills ${this.state.save.stats.kills} · Bosse ${this.state.save.stats.bosses}`,'V5.0');this.audio.win()}
 loop(){requestAnimationFrame(()=>this.loop());const dt=Math.min(.033,this.clock.getDelta());this.update(dt);this.renderer.render(this.scene,this.camera)}
}
