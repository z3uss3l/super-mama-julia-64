import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

export class CinematicDirector{
 constructor(camera,follow,particles,audio,ui){
  this.camera=camera;this.follow=follow;this.particles=particles;this.audio=audio;this.ui=ui;
  this.active=false;this.type='';this.t=0;this.duration=0;this.ctx=null;this.done=null;
  this.originFov=camera.fov;
  this.flash=0;
 }
 start(type,ctx={},done=null){
  if(this.active)return false;
  this.active=true;this.type=type;this.t=0;this.ctx=ctx;this.done=done;
  this.originFov=this.camera.fov;
  this.camera.fov=52;
  this.camera.updateProjectionMatrix();
  this._enter(type);
  return true;
 }
 _enter(type){
  const p=this.ctx.player;
  if(p)p.hitStop=0;
  if(type==='tamia'){
   this.duration=3.8;
   this.ui.toast('🌿 TAMIA · Wächterin des alten Pfades');
   this.audio.cinematic();
  }else if(type==='shaya'){
   this.duration=3.8;
   this.ui.toast('🔮 SHAYA · Hüterin des Lichts');
   this.audio.cinematic();
  }else if(type==='alliance'){
   this.duration=5.4;
   this.ui.toast('✨ Die beiden Wächterinnen vereinen ihre Kräfte.');
   this.audio.alliance();
  }else if(type==='lion'){
   this.duration=3.2;
   this.ui.toast('🦁 Die Löwenkraft erwacht …');
   this.audio.cinematic();
  }else if(type==='intro'){
   this.duration=3.0;
  }else{
   this.duration=2.4;
  }
 }
 _camera(pos,target,fov,dt){
  this.camera.position.lerp(new THREE.Vector3(pos.x,pos.y,pos.z),1-Math.exp(-5.5*dt));
  this.camera.lookAt(target.x,target.y,target.z);
  const next=this.camera.fov+(fov-this.camera.fov)*(1-Math.exp(-4*dt));
  this.camera.fov=next;this.camera.updateProjectionMatrix();
 }
 _actorFocus(actor){
  if(!actor)return {x:0,y:1,z:0};
  const p=actor.mesh||actor;
  return {x:p.position.x,y:p.position.y+1,z:p.position.z||0};
 }
 cancel(){
  this.active=false;
  this.type='';
  this.t=0;
  this.duration=0;
  this.done=null;
  this.ctx=null;
  this.camera.fov=this.originFov;
  this.camera.updateProjectionMatrix();
 }

 update(dt){
  if(!this.active)return false;
  this.t+=dt;
  const p=this.ctx.player;
  const npcs=this.ctx.npcs||[];
  const tamia=npcs.find(n=>n.id==='tamia');
  const shaya=npcs.find(n=>n.id==='shaya');
  const ease=THREE.MathUtils.smootherstep(Math.min(1,this.t/this.duration),0,1);

  if(this.type==='tamia'){
   const a=this._actorFocus(tamia);
   this._camera({x:a.x+3.4,y:a.y+2.0,z:8.4},{x:a.x,y:a.y-.15,z:0},54,dt);
   if(this.t>1.0&&this.t<1.12){
    this.particles.sparkle(a,0xe56b8f,22,4.5);
   }
   if(this.t>1.35&&this.t<1.48)this.ui.toast('„Der alte Pfad erkennt nur, wer mutig weitergeht.“');
   if(this.t>2.35&&this.t<2.48)this.ui.toast('„Finde den Löwenpilz. Er wird dir zeigen, wer du wirklich bist.“');
  }else if(this.type==='shaya'){
   const a=this._actorFocus(shaya);
   this._camera({x:a.x+3.0,y:a.y+2.4,z:8.0},{x:a.x,y:a.y-.05,z:0},53,dt);
   if(this.t>1.0&&this.t<1.12)this.particles.sparkle(a,0x6d7cff,24,5.0);
   if(this.t>1.35&&this.t<1.48)this.ui.toast('„Nicht jeder Weg muss gerade sein.“');
   if(this.t>2.35&&this.t<2.48)this.ui.toast('„Manchmal ist der höchste Weg der sicherste.“');
  }else if(this.type==='alliance'){
   const a=this._actorFocus(tamia),b=this._actorFocus(shaya);
   const cx=(a.x+b.x)*.5,cy=(a.y+b.y)*.5;
   const orbit=1.8+Math.sin(this.t*1.5)*.35;
   this._camera({x:cx+Math.cos(this.t*.75)*orbit+4.2,y:cy+2.4,z:9.2},{x:cx,y:cy-.05,z:0},50,dt);
   if(this.t>1.0&&this.t<1.12){
    this.particles.shockwave({x:cx,y:cy,z:0},0xffd6f5,2.4,.6);
    this.particles.sparkle({x:cx,y:cy+1,z:0},0xffd6f5,34,6);
   }
   if(this.t>1.45&&this.t<1.58)this.ui.toast('TAMIA: „Ich öffne den Pfad.“');
   if(this.t>2.55&&this.t<2.68)this.ui.toast('SHAYA: „Und ich erhelle ihn.“');
   if(this.t>3.45&&this.t<3.58){
    this.particles.shockwave({x:cx,y:cy,z:0},0xffd43b,3.6,.8);
    this.particles.burst({x:cx,y:cy+1,z:0},0xffd43b,48,7);
   }
   if(this.t>3.8&&this.t<3.94)this.ui.toast('✨ DER ALTE LÖWENPFAD IST ERWACHT');
  }else if(this.type==='lion'){
   const a=this._actorFocus(p?.lionModel||p);
   const pos=p?{x:p.x,y:p.y+1,z:0}:a;
   this._camera({x:pos.x+3.0,y:pos.y+2.0,z:7.5},{x:pos.x,y:pos.y,z:0},49,dt);
   if(this.t>0.75&&this.t<.9)this.particles.shockwave(pos,0xffd43b,2.8,.7);
   if(this.t>1.0&&this.t<1.15)this.particles.burst(pos,0xff8a2b,42,8);
   if(this.t>1.55&&this.t<1.7)this.ui.toast('🦁 LÖWENKRAFT ERWACHT!');
  }else if(this.type==='intro'){
   const x=p?.x||0,y=p?.y||1;
   const radius=6.5-Math.min(2.0,ease*2);
   this._camera({x:x+radius,y:y+4.0,z:12.5},{x:x+1.5,y:y+1,z:0},52,dt);
   if(this.t>.7&&this.t<.84)this.particles.sparkle({x:x,y:y+1,z:0},this.ctx.accent||0xffd43b,16,3.5);
  }

  // Keep the featured characters alive while gameplay is frozen.
  for(const n of [tamia,shaya]){
   if(!n?.mesh)continue;
   const phase=n.id==='tamia'?0:.9;
   n.mesh.rotation.y=Math.sin(this.t*1.7+phase)*.09;
   n.mesh.scale.setScalar(1+Math.sin(this.t*2.4+phase)*.028);
   const gem=n.mesh.userData?.parts?.gem;
   if(gem)gem.rotation.y+=dt*5.5;
  }

  // Subtle cinematic bloom-like pulse without postprocessing.
  this.camera.position.x += Math.sin(this.t*2.2)*.018;
  this.camera.position.y += Math.sin(this.t*1.7)*.012;

  if(this.t>=this.duration){
   this.active=false;
   this.camera.fov=this.originFov;
   this.camera.updateProjectionMatrix();
   const cb=this.done;this.done=null;this.ctx=null;
   if(cb)cb();
  }
  return true;
 }
}
