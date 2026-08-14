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
  this.renderer=new THREE.WebGLRenderer({canvas:document.getElementById('canvas'),antialias:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.clock=new THREE.Clock();this.particles=new Particles(this.scene);this.world=new WorldRuntime(this.scene);
  this.follow=new FollowCamera(this.camera);this.progression=new Progression(this.state,this.ui,this.audio,this.particles);
  this.player=null;this.playerModel=null;this.lionModel=null;this.level=null;this.enemyRuntime=[];this.items=[];
  this.projectiles=[];this.boss=null;this.running=false;this.lastQuestToast=0;this.bindUI();this.resize();
  addEventListener('resize',()=>this.resize());this.ui.setAbilities(this.state.save.unlocks);this.loop()
 }
 bindUI(){
  document.getElementById('new').onclick=()=>{this.audio.init();this.state.newGame();this.startLevel(0,true)};
  document.getElementById('continue').onclick=()=>{this.audio.init();this.startLevel(Math.min(this.state.save.level,LEVELS.length-1),false)};
  document.getElementById('saveReset').onclick=()=>{this.state.newGame();this.ui.toast('Neuer Spielstand angelegt')};
  addEventListener('keydown',e=>{if(e.code==='KeyP'||e.code==='Escape')this.togglePause()})
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.follow.resize(w,h)}
 clear(){
  this.world.clear();this.particles.clear();for(const q of this.projectiles)this.scene.remove(q.mesh);this.projectiles=[];
  if(this.playerModel)this.scene.remove(this.playerModel);if(this.lionModel)this.scene.remove(this.lionModel);
  this.playerModel=null;this.lionModel=null;this.enemyRuntime=[];this.items=[];this.boss=null;this.level=null
 }
 startLevel(index,newRun=false){
  if(index>=LEVELS.length){this.win();return}this.clear();this.state.mode='play';this.state.level=index;
  if(newRun){this.state.score=0;this.state.coins=0;this.state.lives=3;this.state.checkpoint=null;this.state.save.checkpoint=null}
  else if(this.state.save.checkpoint?.level!==index){this.state.checkpoint=null;this.state.save.checkpoint=null}
  this.level=buildLevel(index);this.scene.background=new THREE.Color(this.level.world.sky);
  this.player={x:this.state.checkpoint?.x??0,y:this.state.checkpoint?.y??1,vx:0,vy:0,facing:1,grounded:false,jumps:0,health:1,inv:0,attack:0,dash:0,shield:this.state.save.unlocks.shield?3:0,star:0,lion:!!this.state.save.unlocks.lion};
  this.playerModel=makePlayer();this.scene.add(this.playerModel);this.lionModel=makeLion();this.lionModel.visible=false;this.scene.add(this.lionModel);
  this.world.mount(this.level);this.enemyRuntime=this.world.enemies;this.items=this.world.items;if(this.level.boss)this.spawnBoss();
  this.state.quest={kind:this.level.cfg.questKind,target:this.level.cfg.questTarget,progress:0,done:false};
  this.state.levelStart=performance.now();this.state.bossDefeated=false;this.state.persist();this.ui.hideScreen();this.ui.hideBoss();
  this.ui.setObjective(this.level.cfg.quest);this.ui.setAbilities(this.state.save.unlocks);this.ui.setCheckpoint(!!this.state.checkpoint);
  this.ui.toast(`${this.level.cfg.name} — START`);this.audio.power()
 }
 spawnBoss(){const b=this.level.boss;this.world.addBoss(b);this.boss=this.world.boss;this.audio.boss();this.ui.showBoss(b.stats.name,b.stats.hp,b.stats.hp)}
 togglePause(){
  if(this.state.mode==='play'){this.state.mode='pause';this.state.persist();this.ui.showScreen('PAUSE','Spiel pausiert. Fortschritt und Checkpoint sind gesichert.')}
  else if(this.state.mode==='pause'){this.state.mode='play';this.ui.hideScreen()}
 }
 attack(){
  if(this.player.attack>0)return;this.player.attack=.22;this.audio.hit();
  const facing=this.player.vx!==0?Math.sign(this.player.vx):(this.player.facing||1),px=this.player.x+facing*1.05;
  for(const e of this.enemyRuntime){if(e.alive&&Math.abs(e.mesh.position.x-px)<1.35&&Math.abs(e.mesh.position.y-this.player.y)<1.5)this.damageEnemy(e,1)}
  if(this.boss&&Math.abs(this.boss.mesh.position.x-px)<1.9&&Math.abs(this.boss.mesh.position.y-this.player.y)<1.9){
   this.boss.hp--;this.state.addScore(500);this.particles.burst(this.boss.mesh.position,0xff6a00,14,6);
   this.ui.showBoss(this.boss.stats.name,this.boss.hp,this.boss.maxHp);
   if(this.boss.hp<=0){this.state.save.stats.bosses++;this.state.addScore(5000);this.boss.mesh.visible=false;this.boss=null;this.state.bossDefeated=true;this.ui.hideBoss();this.ui.toast('👑 BOSS BESIEGT!');this.audio.power();this.state.persist()}
  }
 }
 damageEnemy(e,amount){
  e.hp-=amount;this.particles.burst(e.mesh.position,0xffd43b,8,4);
  if(e.hp<=0){e.alive=false;e.mesh.visible=false;this.state.save.stats.kills++;this.state.addScore(ENEMY_STATS[e.type].value);
   if(this.state.quest.kind==='kills')this.state.quest.progress++;this.state.combo++;this.state.comboTimer=GAME.comboWindow}
 }
 dash(){
  if(!this.state.save.unlocks.dash||this.player.dash>0)return;this.player.dash=.22;this.player.inv=.28;
  this.player.vx=(this.input.right?1:this.input.left?-1:this.player.facing||1)*GAME.dashSpeed;this.state.save.stats.dashes++;
  this.audio.dash();this.particles.burst(this.playerModel.position,0xffd43b,12,6)
 }
 jump(){
  if(this.player.grounded){this.player.vy=GAME.jumpSpeed;this.player.grounded=false;this.player.jumps=1;this.state.save.stats.jumps++;this.audio.jump()}
  else if(this.state.save.unlocks.doubleJump&&this.player.jumps<2){this.player.vy=GAME.jumpSpeed*.9;this.player.jumps++;this.audio.jump()}
 }
 updateQuest(){
  const q=this.state.quest;if(q.kind==='heart')q.progress=this.state.lives;q.done=q.kind==='heart'?this.state.lives>=1:q.progress>=q.target;
  const suffix=q.kind==='heart'?` ${this.state.lives}❤️`:` ${Math.min(q.progress,q.target)}/${q.target}`;
  this.ui.setObjective(`${this.level.cfg.quest} ·${suffix}${this.boss?' · 👹 Boss':''}`)
 }
 update(dt){
  if(this.state.mode!=='play')return;const p=this.player;this.input.sync();
  if(this.input.jumpPressed)this.jump();if(this.input.actionPressed)this.attack();if(this.input.dashPressed)this.dash();this.world.update(dt);
  if(p.dash>0)p.dash-=dt;else{p.vx=(this.input.right?GAME.playerSpeed:this.input.left?-GAME.playerSpeed:0);if(p.vx)p.facing=Math.sign(p.vx);p.vx*=p.lion?1.15:1}
  p.vy+=GAME.gravity*dt;p.attack=Math.max(0,p.attack-dt);p.inv=Math.max(0,p.inv-dt);p.shield=Math.max(0,p.shield-dt);p.star=Math.max(0,p.star-dt);
  resolvePlayer(p,this.level.platforms,dt);
  // Only a genuine fall below the playable world causes fall damage.
  // The old gap check killed the player while merely standing/walking above a gap.
  if(p.y<-3.0){this.hurt(true)}
  this.playerModel.position.set(p.x,p.y,0);this.playerModel.rotation.y=p.vx<0?Math.PI:0;this.playerModel.visible=p.star<=0||Math.floor(p.star*14)%2===0;
  this.lionModel.visible=p.lion;this.lionModel.position.set(p.x-0.8*p.facing,p.y-.05,0);this.collectItems();this.updateEnemies(dt);this.updateLion(dt);
  if(!this.state.checkpoint&&p.x>this.level.cfg.length*GAME.checkpointRatio){this.state.checkpoint={x:p.x,y:p.y};this.state.persist();this.ui.setCheckpoint(true);this.ui.toast('🚩 CHECKPOINT GESICHERT')}
  this.updateBoss(dt);this.updateProjectiles(dt);this.updateHazards();this.particles.update(dt);this.state.comboTimer=Math.max(0,this.state.comboTimer-dt);
  if(this.state.comboTimer===0)this.state.combo=0;this.updateQuest();if(p.x>this.level.goalX)this.completeLevel();
  this.follow.follow(p.x,p.y,dt);this.ui.setStats({score:this.state.score,coins:this.state.coins,lives:this.state.lives,combo:this.state.combo,level:`${this.level.cfg.name} · ${this.state.level+1}/${LEVELS.length}`});this.input.consume()
 }
 collectItems(){
  const p=this.player;for(const it of this.items){if(!it.alive)continue;it.mesh.rotation.y+=.04;const dx=it.x-p.x,dy=it.y-(p.y+.7);
   if(Math.hypot(dx,dy)<1.1){it.alive=false;it.mesh.visible=false;this.progression.collect(it.type,p,this.playerModel);this.ui.setAbilities(this.state.save.unlocks)}
  }
 }
 updateEnemies(dt){
  const p=this.player;for(const e of this.enemyRuntime){if(!e.alive)continue;e.phase+=dt;
   if(e.type==='turret'){if(Math.random()<dt*.65)this.projectile(e.mesh.position.x,e.mesh.position.y,Math.sign(p.x-e.mesh.position.x)||1)}
   else{e.mesh.position.x+=Math.sign(p.x-e.mesh.position.x)*ENEMY_STATS[e.type].speed*dt;e.mesh.position.y=e.y+(e.type==='bat'?Math.sin(e.phase*3)*.8:0)}
   if(Math.abs(e.mesh.position.x-p.x)<.75&&Math.abs(e.mesh.position.y-p.y)<1.2)this.hurt(false)
  }
 }
 updateLion(dt){
  if(!this.player.lion)return;this.player.lionAttack=(this.player.lionAttack||0)-dt;if(this.player.lionAttack>0)return;
  let target=null,best=5;for(const e of this.enemyRuntime){if(!e.alive)continue;const d=Math.abs(e.mesh.position.x-this.player.x);if(d<best){best=d;target=e}}
  if(target){this.player.lionAttack=.8;this.damageEnemy(target,1);this.particles.burst(target.mesh.position,0xff8b1c,6,3)}
 }
 updateBoss(dt){
  if(!this.boss)return;const b=this.boss;b.phase+=dt;b.mesh.position.x+=(Math.sign(this.player.x-b.mesh.position.x))*b.stats.speed*dt;
  b.mesh.position.y=2.3+Math.sin(b.phase*1.8)*.8;b.attackTimer-=dt;
  if(b.attackTimer<=0){const n=Math.min(5,2+Math.floor((b.maxHp-b.hp)/5));for(let i=0;i<n;i++)this.projectile(b.mesh.position.x,b.mesh.position.y,Math.sign(this.player.x-b.mesh.position.x)||1,(i-(n-1)/2)*.5);b.attackTimer=Math.max(.45,1.5-(b.maxHp-b.hp)*.035)}
 }
 projectile(x,y,dir,spread=0){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),new THREE.MeshBasicMaterial({color:0xff4d4d}));m.position.set(x,y,0);this.scene.add(m);this.objectsPush(m);this.projectiles.push({mesh:m,vx:dir*4.5,vy:spread*2.5,life:4})
 }
 objectsPush(m){this.world.objects.push(m)}
 updateProjectiles(dt){
  for(let i=this.projectiles.length-1;i>=0;i--){const q=this.projectiles[i];q.life-=dt;q.mesh.position.x+=q.vx*dt;q.mesh.position.y+=q.vy*dt;q.vy-=2*dt;
   if(Math.hypot(q.mesh.position.x-this.player.x,q.mesh.position.y-this.player.y)<.65){this.hurt(false);q.life=0}
   if(q.life<=0){this.scene.remove(q.mesh);this.projectiles.splice(i,1)}
  }
 }
 // Hazards are visual/level metadata only for now. Falling is handled by the
 // authoritative world-height check above; this prevents invisible instant deaths.
 updateHazards(){return}
 hurt(fall){
  if(this.player.inv>0||this.player.star>0)return;
  if(this.player.shield>0){this.player.shield=0;this.player.inv=.6;this.audio.hit();this.ui.toast('🛡️ SCHILD GEBROCHEN');return}
  this.player.inv=1.2;this.state.save.stats.damage++;this.state.lives--;this.state.combo=0;this.audio.hit();
  this.particles.burst(this.playerModel.position,0xff3b43,18,7);
  if(this.state.lives<=0){this.gameOver();return}
  if(this.state.checkpoint){this.player.x=this.state.checkpoint.x;this.player.y=this.state.checkpoint.y;this.player.vx=0;this.player.vy=0}
  else{this.player.x=0;this.player.y=2;this.player.vx=0;this.player.vy=0}
  this.ui.toast(fall?'💥 Abgrund!':'💔 Treffer!');this.state.persist()
 }
 completeLevel(){
  if(this.state.mode!=='play')return;this.updateQuest();
  if(!this.state.quest.done){if(performance.now()-this.lastQuestToast>1200){this.lastQuestToast=performance.now();this.ui.toast(`❗ Quest offen: ${this.level.cfg.quest}`)}return}
  if(this.level.boss&&!this.state.bossDefeated){if(performance.now()-this.lastQuestToast>1200){this.lastQuestToast=performance.now();this.ui.toast('👹 Besiege zuerst den Boss!')}return}
  const t=(performance.now()-this.state.levelStart)/1000;this.state.markLevelComplete(this.state.level,t);this.state.addScore(Math.max(0,5000-Math.floor(t*20)));
  if(this.state.level===2)this.state.unlock('shield');if(this.state.level===5)this.state.unlock('lion');this.state.persist();this.ui.setAbilities(this.state.save.unlocks);
  this.ui.showScreen('LEVEL GESCHAFFT',`${this.level.cfg.name}\nZeit: ${t.toFixed(1)} s\nScore: ${this.state.score}\nQuest: erfüllt`);this.state.mode='pause';setTimeout(()=>this.startLevel(this.state.level+1,false),1100)
 }
 gameOver(){this.state.mode='over';this.state.persist();this.ui.showScreen('GAME OVER',`Score ${this.state.score} · Münzen ${this.state.coins}\nLevel ${this.state.level+1}/${LEVELS.length}\nCheckpoint bleibt erhalten.`)}
 win(){this.state.mode='win';this.state.persist();this.ui.showScreen('🎉 GERETTET!',`Julia hat alle 15 Level geschafft!\nScore ${this.state.score} · ${this.state.coins} Münzen\nKills ${this.state.save.stats.kills} · Bosse ${this.state.save.stats.bosses}`)}
 loop(){requestAnimationFrame(()=>this.loop());const dt=Math.min(.033,this.clock.getDelta());this.update(dt);this.renderer.render(this.scene,this.camera)}
}
