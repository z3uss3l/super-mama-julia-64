import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import {GAME,LEVELS,ENEMY_STATS} from './config.js';
import {RuntimeState} from './state.js';
import {Input} from './input.js';
import {AudioManager} from './audio.js';
import {Particles} from './particles.js';
import {makePlayer,makeLion,animateCharacter} from './entities.js';
import {buildLevel} from './levels.js';
import {resolvePlayer,checkStompCollision} from './physics.js';
import {WorldRuntime} from './world.js';
import {FollowCamera} from './camera.js';
import {Progression} from './progression.js';
import {Decor} from './decor.js';

export class Game{
 constructor(ui){
  this.ui=ui;this.state=new RuntimeState();this.input=new Input();this.audio=new AudioManager();
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(58,1,.1,240);
  this.renderer=new THREE.WebGLRenderer({canvas:document.getElementById('canvas'),antialias:true,powerPreference:'high-performance'});
  const mobile=matchMedia('(max-width: 900px)').matches || (navigator.hardwareConcurrency||4)<=4;
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.35:1.7));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.setupLighting();
  this.projectileGeometry=new THREE.SphereGeometry(.13,7,6);
  this.projectileMaterial=new THREE.MeshBasicMaterial({color:0xff4d4d});
  this.clock=new THREE.Clock();this.particles=new Particles(this.scene);this.world=new WorldRuntime(this.scene);
  this.follow=new FollowCamera(this.camera);this.progression=new Progression(this.state,ui,this.audio,this.particles);this.decor=null;
  this.player=null;this.playerModel=null;this.lionModel=null;this.jumpHeldLast=false;this.level=null;this.boss=null;this.projectiles=[];this.running=false;this.lastToast=0;;this.devGodMode=false;
  this.bind();this.resize();addEventListener('resize',()=>this.resize());this.state.save.unlocks.doubleJump=true;this.ui.setAbilities(this.state.save.unlocks);this.loop();
 }
 setupLighting(){
  const hemi=new THREE.HemisphereLight(0xffffff,0x273248,1.35);this.scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,2.2);
  key.position.set(-8,16,12);key.castShadow=true;
  const shadowSize=(matchMedia('(max-width: 900px)').matches?768:1024);
  key.shadow.mapSize.set(shadowSize,shadowSize);
  key.shadow.camera.near=1;key.shadow.camera.far=80;
  this.scene.add(key);
 }
 bind(){
  document.getElementById('new').onclick=()=>{this.audio.init();this.state.newGame();this.startLevel(0,true)};
  document.getElementById('continue').onclick=()=>{this.audio.init();this.startLevel(Math.min(this.state.save.level,LEVELS.length-1),false)};
  document.getElementById('saveReset').onclick=()=>{this.state.newGame();this.ui.toast('Save gelöscht')};
  addEventListener('keydown',e=>{if(e.code==='KeyP'||e.code==='Escape')this.togglePause()});
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.follow.resize(w,h)}
 clear(){
  // Projectiles use shared geometry/material; remove them before world disposal.
  for(const p of this.projectiles)this.scene.remove(p.mesh);
  this.projectiles=[];
  this.world.objects=this.world.objects.filter(o=>!this.projectileGeometry || o.geometry!==this.projectileGeometry);
  this.world.clear();
  this.particles.clear();
  if(this.decor){this.decor.clear();this.decor=null;}if(this.playerModel)this.scene.remove(this.playerModel);if(this.lionModel)this.scene.remove(this.lionModel);this.playerModel=null;this.lionModel=null;this.boss=null;this.level=null}
 startLevel(index,newRun=false){
  this.state.save.unlocks.doubleJump=true;
  if(index>=LEVELS.length){this.win();return}
  this.clear();this.state.mode='play';this.state.level=index;
  if(newRun){this.state.score=0;this.state.coins=0;this.state.lives=3;this.state.checkpoint=null;this.state.save.checkpoint=null}
  this.level=buildLevel(index);this.scene.background=new THREE.Color(this.level.world.sky);
  this.scene.fog=new THREE.Fog(this.level.world.fog,35,115);this.decor=new Decor(this.scene,this.level.world);
  const cp=this.state.checkpoint&&this.state.checkpoint.level===index?this.state.checkpoint:null;
  const spawnPlatform=this.level?.platforms?.[0];
  const spawnY=cp?.y??(spawnPlatform ? spawnPlatform.y+spawnPlatform.h/2+.02 : 1);
  this.player={x:cp?.x??0,y:spawnY,z:0,vx:0,vy:0,inputAxis:0,maxSpeed:GAME.playerSpeed,accel:GAME.playerAccel,airAccel:GAME.playerAirAccel,friction:GAME.playerFriction,airFriction:GAME.playerAirFriction,facing:1,grounded:!cp&&!!spawnPlatform,jumps:0,inv:0,attack:0,dash:0,dashDirection:1,jumpBuffer:0,coyote:0,shield:this.state.save.unlocks.shield?3:0,star:0,lion:false,contact:0,hitStop:0,flash:0,anim:'idle',animTimer:0,transform:0,screenShake:0,stompBounce:0,landingKick:0,comboPulse:0,transformPulse:0};
  this.jumpHeldLast=false;this.playerModel=makePlayer();this.scene.add(this.playerModel);this.lionModel=makeLion();this.lionModel.visible=false;this.scene.add(this.lionModel);
  this.world.mount(this.level);if(this.level.boss)this.spawnBoss();
  this.state.quest={kind:this.level.cfg.questKind,target:this.level.cfg.questTarget,progress:0,done:false};
  this.state.levelStart=performance.now();this.state.bossDefeated=false;
  this.ui.hideScreen();this.ui.hideBoss();this.ui.setAbilities(this.state.save.unlocks);
  this.ui.setObjective(this.level.cfg.quest);this.ui.setLevel(`${this.level.cfg.name} · ${index+1}/${LEVELS.length}`);if(this.level.cfg.story?.intro)this.ui.toast(`📖 ${this.level.cfg.story.chapter}: ${this.level.cfg.story.intro}`);this.audio.power();
 }
 spawnBoss(){const b=this.level.boss;this.world.addBoss(b);this.boss=this.world.boss;this.audio.boss();this.ui.showBoss(b.stats.name,b.hp,b.hp)}
 togglePause(){if(this.state.mode==='play'){this.state.mode='pause';this.state.persist();this.ui.showScreen('PAUSE','Fortschritt und Checkpoint sind gesichert.','V7.1.4')}else if(this.state.mode==='pause'){this.state.mode='play';this.ui.hideScreen()}}
 jump(){
  const p=this.player;
  if(!p)return false;
  if(p.grounded||p.coyote>0){
   p.vy=GAME.jumpSpeed;p.grounded=false;p.coyote=0;p.jumps=1;p.supportPlatform=null;p.jumpBuffer=0;
   p.anim='jump';p.animTimer=.24;
   this.state.save.stats.jumps++;this.audio.jump();this.particles.burst(this.playerModel.position,0xffffff,6,3);
   return true;
  }
  if(this.state.save.unlocks.doubleJump&&p.jumps<2){
   p.vy=GAME.jumpSpeed*.94;p.grounded=false;p.jumps++;p.jumpBuffer=0;p.anim='doubleJump';p.animTimer=.28;this.audio.jump();
   this.particles.burst(this.playerModel.position,0x7de3ff,8,4);
   return true;
  }
  return false;
 }
 dash(){
  const p=this.player;if(!this.state.save.unlocks.dash||p.dash>0)return;
  p.dash=.22;p.inv=.28;p.supportPlatform=null;p.vx=(this.input.right?1:this.input.left?-1:p.facing)*GAME.dashSpeed;
  this.state.save.stats.dashes++;this.audio.dash();this.particles.burst(this.playerModel.position,0xffd43b,16,7)
 }
 attack(){
  const p=this.player;if(p.attack>0)return;p.attack=.24;p.flash=.12;p.anim='attack';p.animTimer=.24;this.audio.hit();this.follow.kick(.035);
  const dir=p.vx?Math.sign(p.vx):p.facing,px=p.x+dir*(p.lion?1.25:1.05);
  const attackDamage=p.lion?2:1;
  const attackReach=p.lion?1.55:1.35;
  for(const e of this.world.enemies){
   if(!e.alive)continue;
   const dx=Math.abs(e.mesh.position.x-px),dy=Math.abs(e.mesh.position.y-p.y);
   if(dx<attackReach&&dy<1.35)this.damageEnemy(e,attackDamage);
  }
  if(this.boss){
   const dx=Math.abs(this.boss.mesh.position.x-px),dy=Math.abs(this.boss.mesh.position.y-p.y);
   if(dx<(p.lion?2.0:1.8)&&dy<1.6)this.damageBoss(p.lion?2:1);
  }
 }
 triggerFeedback(kind,strength=1){
  const p=this.player;if(!p)return;
  if(kind==='stomp'){p.screenShake=Math.max(p.screenShake,.16*strength);p.stompBounce=.22;p.comboPulse=.22}
  else if(kind==='land'){p.screenShake=Math.max(p.screenShake,.07*strength);p.landingKick=.16}
  else if(kind==='hit'){p.screenShake=Math.max(p.screenShake,.11*strength)}
  else if(kind==='transform'){p.screenShake=Math.max(p.screenShake,.22*strength);p.transformPulse=.72}
 }
 animateEnemyStomp(e,dt){
  if(!e?.mesh||e.stompTimer<=0)return;
  const t=1-Math.max(0,e.stompTimer/.28);
  const type=e.type;
  if(type==='slime'){
   const squash=Math.sin(Math.min(1,t)*Math.PI);
   e.mesh.scale.set(1+0.38*squash,1-0.78*squash,1+0.38*squash);
   e.mesh.rotation.z=Math.sin(t*Math.PI*5)*.16;
  }else if(type==='runner'){
   const s=Math.sin(t*Math.PI);
   e.mesh.scale.set(1+.22*s,.35+.65*(1-s*.55),1+.12*s);
   e.mesh.rotation.z=t*Math.PI*2.4;
  }else if(type==='bat'){
   const s=Math.sin(t*Math.PI);
   e.mesh.scale.set(1+.28*s,1-.38*s,1+.28*s);
   e.mesh.rotation.z=t*Math.PI*3.2;
  }else{
   const s=Math.sin(t*Math.PI);
   e.mesh.scale.set(1+.16*s,.55+.45*(1-s),1+.16*s);
   e.mesh.rotation.z=t*Math.PI*1.6;
  }
  e.mesh.position.y=e.deathBaseY+Math.sin(t*Math.PI)*.18;
 }
 stompEnemy(e){
  if(!e||!e.alive)return false;
  e.alive=false;
  e.stompTimer=.28;e.deathBaseY=e.mesh.position.y;e.mesh.rotation.z=0;
  e.hitFlash=0;
  e.mesh.visible=true;
  e.mesh.scale.set(1.22,.18,1.22);
  this.player.vy=7.2;
  this.player.grounded=false;
  this.player.anim='stomp';this.player.animTimer=.22;
  this.player.stompBounce=.22;this.player.hitStop=.045;this.triggerFeedback('stomp',1);
  this.player.jumps=1;
  this.player.coyote=0;
  this.state.save.stats.kills++;
  this.state.addScore(ENEMY_STATS[e.type].value+50);
  this.state.quest.progress++;
  this.state.combo++;
  this.state.comboTimer=GAME.comboWindow;
  this.ui.setCombo(this.state.combo);if(this.state.combo>=2)this.ui.toast(`💥 COMBO x${this.state.combo}`);
  this.audio.hit();
  this.particles.burst(e.mesh.position,0xffd43b,18,6.5);
  this.particles.burst(e.mesh.position,e.type==='slime'?0x7cff7c:e.type==='bat'?0xff6b73:e.type==='runner'?0xb88cff:0xffb04a,10,4.5);
  this.follow.kick(.065);
  return true;
 }
 damageEnemy(e,n){
  e.hp-=n;e.hitFlash=.13;e.hitAnim=.13;e.ai='hurt';e.aiTimer=.18;e.mesh.scale.setScalar(1.15);this.particles.burst(e.mesh.position,0xffd43b,9,5);
  if(e.hp<=0){e.alive=false;e.mesh.visible=false;this.state.save.stats.kills++;this.state.addScore(ENEMY_STATS[e.type].value);this.state.quest.progress++;this.state.combo++;this.state.comboTimer=GAME.comboWindow;this.ui.setCombo(this.state.combo);if(this.state.combo>=2)this.ui.toast(`💥 COMBO x${this.state.combo}`)}
 }
 damageBoss(n){
  const b=this.boss;b.hp-=n;this.state.addScore(500);this.particles.burst(b.mesh.position,0xff6a00,15,7);this.ui.showBoss(b.stats.name,b.hp,b.maxHp);this.follow.kick(.18);
  if(b.hp<=0){this.state.save.stats.bosses++;this.state.addScore(5000);this.state.bossDefeated=true;b.mesh.visible=false;this.boss=null;this.ui.hideBoss();this.ui.toast('👑 BOSS BESIEGT!');this.audio.win();this.state.persist()}
 }
 hurt(fall=false){
  const p=this.player;
  if(!p)return;
  if(this.devGodMode)return;
  if(p.inv>0||p.star>0)return;
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
   if(!e.alive){
    if(e.stompTimer>0){
     e.stompTimer-=dt;
     e.mesh.visible=true;
     this.animateEnemyStomp(e,dt);
    }else{
     e.mesh.visible=false;
    }
    continue;
   }

   const st=ENEMY_STATS[e.type];
   if(e.type!=='bat'&&e.supportPlatform){
    e.y=e.supportPlatform.y+1;
   }
   e.phase+=dt;
   e.fire-=dt;
   e.aiTimer=Math.max(0,(e.aiTimer||0)-dt);
   e.attackTimer=Math.max(0,(e.attackTimer||0)-dt);
   e.recoil=Math.max(0,(e.recoil||0)-dt);

   const dx=p.x-e.mesh.position.x;
   const dist=Math.abs(dx);
   const dir=Math.sign(dx)||e.direction||1;
   e.direction=dir;
   const alert=dist<st.aggro;

   if(e.hitFlash>0){
    e.hitFlash-=dt;
    e.mesh.scale.setScalar(1.12);
   }else e.mesh.scale.setScalar(1);

   e.hitAnim=Math.max(0,(e.hitAnim||0)-dt);

   if(alert && e.ai==='patrol'){
    e.ai='alert';e.aiTimer=.18;
   }
   if(!alert && e.ai!=='patrol' && e.aiTimer<=0)e.ai='patrol';

   if(e.type==='turret'){
    if(alert){
     e.ai='alert';
     if(e.attackTimer<=0){
      e.attackTimer=1/st.fireRate;
      e.recoil=.16;
      this.projectile(e.mesh.position.x,e.mesh.position.y,dir,0);
      this.particles.burst(e.mesh.position,0xffa21c,5,2.5);
     }
    }
    animateCharacter(e.mesh,dt,{vx:dir*.1,grounded:true,alert,attack:e.recoil>0,recoil:e.recoil});
   }else if(e.type==='bat'){
    const baseY=e.y;
    let targetY=baseY+Math.sin(e.phase*3)*.7;
    let swoop=0;
    if(alert){
     if(e.ai==='alert'&&e.aiTimer<=0&&e.attackTimer<=0){e.ai='attack';e.attackTimer=.72}
     if(e.ai==='attack'){
      targetY+=THREE.MathUtils.clamp(p.y-baseY,-.65,.65)*.55;
      e.mesh.position.x+=dir*st.speed*dt*1.05;
      swoop=1;
      if(e.attackTimer<=0)e.ai='recover';
     }else e.mesh.position.x+=dir*st.speed*dt*.35;
    }else{
     e.mesh.position.x+=Math.sin(e.phase)*st.speed*dt*.18;
    }
    e.mesh.position.y=targetY;
    animateCharacter(e.mesh,dt,{vx:dir*st.speed,grounded:false,alert,swoop});
   }else if(e.type==='runner'){
    if(alert&&e.ai==='alert'&&e.aiTimer<=0&&e.attackTimer<=0){e.ai='attack';e.attackTimer=.55}
    if(e.ai==='attack'){
     e.mesh.position.x+=dir*st.speed*1.45*dt;
     if(e.attackTimer<=0)e.ai='recover';
    }else if(e.ai==='recover'){
     e.mesh.position.x+=dir*st.speed*.45*dt;
     if(!alert)e.ai='patrol';
    }else{
     const direction=alert?dir:Math.sign(Math.sin(e.phase))||e.direction;
     const proposed=e.mesh.position.x+direction*st.speed*dt;
     const platform=e.supportPlatform;
     const edgeSafe=platform&&Math.abs(proposed-platform.x)<=Math.max(.4,platform.w/2-.35);
     e.mesh.position.x=edgeSafe?proposed:e.mesh.position.x;
    }
    e.mesh.position.y=e.y;
    animateCharacter(e.mesh,dt,{vx:dir*(e.ai==='attack'?st.speed*1.45:st.speed),grounded:true,alert,charge:e.ai==='attack',attack:e.ai==='attack',hit:e.hitAnim>0});
   }else{
    if(alert&&e.ai==='alert'&&e.aiTimer<=0&&e.attackTimer<=0){e.ai='attack';e.attackTimer=.8}
    const speed=e.ai==='attack'?st.speed*1.15:st.speed;
    const direction=alert?dir:Math.sign(Math.sin(e.phase))||e.direction;
    const proposed=e.mesh.position.x+direction*speed*dt;
    const platform=this.level.platforms.find(pl=>Math.abs(pl.y-(e.y-1))<.18&&Math.abs(proposed-pl.x)<=pl.w/2+.05);
    const edgeSafe=platform&&Math.abs(proposed-p.x)<=Math.max(.4,platform.w/2-.35);
    e.mesh.position.x=edgeSafe?proposed:e.mesh.position.x;
    e.mesh.position.y=e.y;
    if(e.attackTimer<=0&&e.ai==='attack')e.ai='alert';
    animateCharacter(e.mesh,dt,{vx:direction*speed,grounded:true,alert,attack:e.ai==='attack',hit:e.hitAnim>0});
   }

   const postDist=Math.abs(p.x-e.mesh.position.x);
   if(p.contact<=0&&postDist<st.contactRange&&Math.abs(e.mesh.position.y-p.y)<st.contactHeight){
    this.hurt();p.contact=.8;
   }
  }
 }
 updateBoss(dt){
  if(!this.boss)return;
  const b=this.boss;b.phase+=dt;b.attackTimer-=dt;
  const dx=this.player.x-b.mesh.position.x,dist=Math.abs(dx);
  if(dist<b.stats.aggro)b.mesh.position.x+=Math.sign(dx)*b.stats.speed*dt*.55;
  b.mesh.position.y=this.level.boss.y+Math.sin(b.phase*1.7)*.75;animateCharacter(b.mesh,dt,{vx:dx,grounded:true});
  if(dist<b.stats.aggro&&b.attackTimer<=0){
   const phase=b.hp<=b.maxHp*.5?2:b.hp<=b.maxHp*.75?1:0;
   const n=phase===2?7:phase===1?5:3;
   const spread=phase===2?.7:.55;
   for(let i=0;i<n;i++)this.projectile(b.mesh.position.x,b.mesh.position.y,Math.sign(dx)||1,(i-(n-1)/2)*spread);
   b.attackTimer=phase===2?.62:phase===1?.9:1.25;
  }
  if(this.player.contact<=0&&dist<1.0&&Math.abs(b.mesh.position.y-this.player.y)<1.5){this.hurt();this.player.contact=.9}
 }
 projectile(x,y,dir,spread){
  const m=new THREE.Mesh(this.projectileGeometry,this.projectileMaterial);
  m.position.set(x,y,0);
  this.scene.add(m);
  this.world.objects.push(m);
  this.projectiles.push({mesh:m,vx:dir*4.8,vy:spread*2.3,life:4});
 }
 updateProjectiles(dt){
  for(let i=this.projectiles.length-1;i>=0;i--){const q=this.projectiles[i];q.life-=dt;q.mesh.position.x+=q.vx*dt;q.mesh.position.y+=q.vy*dt;q.vy-=2*dt;if(Math.hypot(q.mesh.position.x-this.player.x,q.mesh.position.y-this.player.y)<.65){this.hurt();q.life=0}if(q.life<=0){this.scene.remove(q.mesh);this.projectiles.splice(i,1)}}
 }
 update(dt){
  if(this.state.mode!=='play')return;
  const p=this.player;if(p.hitStop>0){
   p.hitStop=Math.max(0,p.hitStop-dt);
   this.particles.update(dt*.15);
   this.input.consume();
   return;
  }
  this.input.sync();
  const jumpDown=this.input.jump===true;
  const jumpEdge=this.input.jumpPressed===true || (jumpDown&&!this.jumpHeldLast);
  if(jumpEdge){const jumped=this.jump();if(!jumped)p.jumpBuffer=GAME.jumpBuffer;}
  if(this.input.actionPressed){
   // Development shortcut: first press of ATTACK activates session-only
   // invulnerability. The same press still performs the attack.
   if(!this.devGodMode){
    this.devGodMode=true;
    this.ui.toast('🛡️ GOD-MODUS AKTIV · UNVERWUNDBAR');
    this.audio.power();
   }
   this.attack();
  }
  if(this.input.dashPressed)this.dash();
  this.world.update(dt);if(this.decor)this.decor.update(dt,p.x);
  p.inputAxis=(this.input.right?1:0)-(this.input.left?1:0);p.maxSpeed=GAME.playerSpeed*(p.lion?1.12:1);if(p.vx)p.facing=Math.sign(p.vx);
  const wasGrounded=p.grounded;
  const stompPrevY=p.y;
  const stompPrevVy=p.vy;
  p.vy+=GAME.gravity*dt;
  const physics=resolvePlayer(p,this.level.platforms,dt);
  if(physics.landed){p.land=.12;p.anim='land';p.animTimer=.16;this.triggerFeedback('land',1);this.particles.burst(this.playerModel.position,0xffffff,5,2.2);this.follow.kick(.035)}
  p.land=Math.max(0,(p.land||0)-dt);
  if(wasGrounded&&!p.grounded&&p.vy<=0)p.coyote=GAME.coyoteTime;
  else if(p.grounded)p.coyote=0;
  // Stomp: use a swept feet-vs-enemy-top test. This is deliberately based
  // on the actual runner/slime/bat collider dimensions instead of a single
  // sampled frame, so fast downward movement cannot skip the purple runner.
  if(stompPrevVy<0){
   for(const e of this.world.enemies){
    if(!e.alive)continue;

    const enemyHalfHeight =
      e.type==='turret' ? .45 :
      e.type==='runner' ? .344 :
      e.type==='bat' ? .50 : .345;

    const enemyHalfWidth =
      e.type==='bat' ? .52 :
      e.type==='runner' ? .43 : .43;

    const enemyTop=e.mesh.position.y+enemyHalfHeight;

    if(checkStompCollision(
      stompPrevY,
      p.y,
      p.x,
      .34,
      e.mesh.position.x,
      enemyTop,
      enemyHalfWidth,
      .24
    )){
      this.stompEnemy(e);
      break;
    }
   }
  }
  if(this.input.jumpReleased===true&&p.vy>2)p.vy*=.52;
  if(p.jumpBuffer>0){
   p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
   if(p.grounded&&this.jump())p.jumpBuffer=0;
  }
  p.screenShake=Math.max(0,p.screenShake-dt);
  p.stompBounce=Math.max(0,p.stompBounce-dt);
  p.landingKick=Math.max(0,p.landingKick-dt);
  p.comboPulse=Math.max(0,p.comboPulse-dt);
  p.transformPulse=Math.max(0,p.transformPulse-dt);
  p.attack=Math.max(0,p.attack-dt);p.inv=Math.max(0,p.inv-dt);p.contact=Math.max(0,p.contact-dt);p.dash=Math.max(0,p.dash-dt);p.flash=Math.max(0,p.flash-dt);
  if(p.animTimer>0){
   p.animTimer=Math.max(0,p.animTimer-dt);
   if(p.animTimer<=0)p.anim='idle';
  }
  if(p.anim==='idle'){
   if(!p.grounded)p.anim=p.vy>0?'jump':'fall';
   else if(p.attack>0)p.anim='attack';
  }
  if(p.y<-3)this.hurt(true);
  this.playerModel.position.set(p.x,p.y,0);this.playerModel.rotation.y=0;
  const jumpStretch=p.grounded?1:1.05;
  const attackSquash=p.attack>0?.92:1;
  const landSquash=p.land>0?1-.12*(p.land/.12):1;
  const facingScale=p.facing<0?-1:1;
  this.playerModel.scale.set(facingScale*attackSquash*landSquash,1/jumpStretch/landSquash,jumpStretch);
  animateCharacter(this.playerModel,dt,p);
  animateCharacter(this.lionModel,dt,p);
  this.playerModel.visible=!p.lion&&(p.inv<=0||Math.floor(p.inv*14)%2===0);
  this.lionModel.visible=!!p.lion;this.lionModel.position.set(p.x-.75*p.facing,p.y,0);this.lionModel.rotation.y=0;this.lionModel.scale.x=p.facing<0?-1:1;
  if(p.transform>0){
   const t=1-p.transform/.90;
   const pulse=1+Math.sin(t*Math.PI)*.18;
   this.lionModel.scale.y*=pulse;
   this.lionModel.scale.z*=pulse;
  }
  const wasLion=p.lion;
  this.collect();
  if(!wasLion&&p.lion){
   p.transform=.90;
   p.inv=Math.max(p.inv,.90);
   p.anim='transform';p.animTimer=.90;
   this.triggerFeedback('transform',1.2);
   this.particles.burst(this.playerModel.position,0xffd43b,40,9);
   this.particles.burst(this.playerModel.position,0xff8a2b,24,7);
   this.particles.burst(this.playerModel.position,0xfff3b0,16,4);
   this.ui.toast('🦁 LÖWENKRAFT ERWACHT!');
   this.follow.kick(.18);
  }
  if(p.transform>0)p.transform=Math.max(0,p.transform-dt);
  if(p.star>0){
   p.star=Math.max(0,p.star-dt);
   if(Math.random()<dt*9)this.particles.burst(this.playerModel.position,0xffffff,2,3);
   for(const e of this.world.enemies)if(e.alive&&Math.abs(e.mesh.position.x-p.x)<1.25&&Math.abs(e.mesh.position.y-p.y)<1.3)this.damageEnemy(e,e.hp);
   if(this.boss&&Math.abs(this.boss.mesh.position.x-p.x)<1.45)this.damageBoss(1);
  }
  this.updateEnemies(dt);this.updateBoss(dt);this.updateProjectiles(dt);this.particles.update(dt);
  this.state.comboTimer=Math.max(0,this.state.comboTimer-dt);if(!this.state.comboTimer){this.state.combo=0;this.ui.setCombo(0)}
  const q=this.state.quest;q.done=q.kind==='heart'?this.state.lives>=1:q.progress>=q.target;
  this.ui.setObjective(`${this.level.cfg.quest} · ${q.kind==='heart'?this.state.lives+' ❤️':Math.min(q.progress,q.target)+'/'+q.target}${this.state.bossDefeated?' · 👑':''}`);
  if(!this.state.checkpoint&&p.x>this.level.cfg.length*.48){this.state.checkpoint={x:p.x,y:p.y};this.state.persist();this.ui.toast('🚩 CHECKPOINT');}
  if(p.x>this.level.goalX)this.completeLevel();
  this.follow.follow(p.x,p.y,dt,p.vx,p.vy);
  if(p.screenShake>0){
   const t=performance.now()*.07;
   this.follow.camera.position.x+=Math.sin(t)*p.screenShake;
   this.follow.camera.position.y+=Math.cos(t*1.17)*p.screenShake*.45;
  }
  this.ui.setStats({score:this.state.score,coins:this.state.coins,lives:this.state.lives,combo:this.state.combo});
  this.jumpHeldLast=jumpDown;
  this.input.consume();
 }
 completeLevel(){
  if(this.state.mode!=='play')return;
  const q=this.state.quest;if(!q.done){if(performance.now()-this.lastToast>1200){this.lastToast=performance.now();this.ui.toast(`❗ ${this.level.cfg.quest} noch offen`)}return}
  if(this.level.boss&&!this.state.bossDefeated){if(performance.now()-this.lastToast>1200){this.lastToast=performance.now();this.ui.toast('👹 Boss zuerst besiegen')}return}
  const t=(performance.now()-this.state.levelStart)/1000;this.state.markLevelComplete(this.state.level,t);this.state.addScore(Math.max(0,5000-Math.floor(t*18)));
  if(this.state.level===1)this.state.unlock('doubleJump');if(this.state.level===3)this.state.unlock('shield');if(this.state.level===7)this.state.unlock('starPower');if(this.state.level===9)this.state.unlock('dash');
  this.state.persist();this.ui.setAbilities(this.state.save.unlocks);this.ui.showScreen('LEVEL GESCHAFFT',`${this.level.cfg.name}\nZeit ${t.toFixed(1)} s · Score ${this.state.score}\nNächstes Level wird geladen …` ,'V7.1.4');this.state.mode='pause';setTimeout(()=>this.startLevel(this.state.level+1,false),1200)
 }
 gameOver(){this.state.mode='over';this.state.persist();this.ui.showScreen('GAME OVER',`Score ${this.state.score}\nLevel ${this.state.level+1}/${LEVELS.length}\nCheckpoint bleibt erhalten.`,'V7.1.4')}
 win(){this.state.mode='win';this.state.persist();this.ui.showScreen('🎉 GERETTET!',`Julia hat alle 15 Level geschafft!\nScore ${this.state.score} · ${this.state.coins} Münzen\nKills ${this.state.save.stats.kills} · Bosse ${this.state.save.stats.bosses}` ,'V7.1.4');this.audio.win()}
 loop(){requestAnimationFrame(()=>this.loop());const dt=Math.min(.033,this.clock.getDelta());this.update(dt);this.renderer.render(this.scene,this.camera)}
}
