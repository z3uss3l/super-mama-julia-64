import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

const M=(c,rough=.82)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.04});
const S=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.12});
export function meshBox(w,h,d,mat){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)}
function limb(w,h,d,mat){const m=meshBox(w,h,d,mat);m.geometry.translate(0,-h/2,0);return m}

export function makePlayer(){
  const g=new THREE.Group();
  const parts={};

  parts.body=meshBox(.58,.78,.45,M(0x376bd8));
  parts.body.position.y=.64;
  g.add(parts.body);

  parts.apron=meshBox(.64,.42,.47,M(0xffffff));
  parts.apron.position.set(0,.53,.25);
  g.add(parts.apron);

  parts.head=new THREE.Mesh(new THREE.SphereGeometry(.37,20,16),M(0xf6c7a5));
  parts.head.position.set(0,1.25,.02);
  g.add(parts.head);

  parts.hair=new THREE.Mesh(new THREE.SphereGeometry(.43,20,16),M(0xf4c430));
  parts.hair.scale.set(1,.86,1.08);
  parts.hair.position.set(0,1.34,-.055);
  g.add(parts.hair);

  parts.bun=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),M(0xf4c430));
  parts.bun.position.set(-.27,1.55,-.02);
  g.add(parts.bun);

  // Face is on +Z because the gameplay camera looks from +Z.
  // It is intentionally asymmetric: one visible eye plus offset nose/mouth
  // reads as a three-quarter side profile and follows X mirroring.
  parts.eye=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),S(0x15151a));
  parts.eye.position.set(.105,1.285,.355);
  g.add(parts.eye);

  parts.brow=meshBox(.10,.022,.018,S(0x6d432d));
  parts.brow.position.set(.105,1.345,.358);
  g.add(parts.brow);

  parts.nose=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),M(0xe79b79));
  parts.nose.scale.set(1.35,.78,1.0);
  parts.nose.position.set(.18,1.205,.375);
  g.add(parts.nose);

  parts.mouth=meshBox(.018,.032,.11,M(0x8f3e55));
  parts.mouth.position.set(.14,1.115,.37);
  g.add(parts.mouth);

  parts.cheek=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),M(0xf29b91));
  parts.cheek.scale.set(.9,.55,.22);
  parts.cheek.position.set(.02,1.17,.37);
  g.add(parts.cheek);

  parts.hairFringe=meshBox(.46,.20,.18,M(0xf4c430));
  parts.hairFringe.position.set(.10,1.55,.28);
  parts.hairFringe.rotation.z=-.16;
  g.add(parts.hairFringe);

  parts.armL=limb(.13,.48,.14,M(0xf6c7a5));
  parts.armL.position.set(-.39,.73,.03);
  g.add(parts.armL);

  parts.armR=limb(.13,.48,.14,M(0xf6c7a5));
  parts.armR.position.set(.39,.73,.03);
  g.add(parts.armR);

  parts.legL=limb(.17,.42,.18,M(0x29202b));
  parts.legL.position.set(-.18,.37,.05);
  g.add(parts.legL);

  parts.legR=limb(.17,.42,.18,M(0x29202b));
  parts.legR.position.set(.18,.37,.05);
  g.add(parts.legR);

  parts.scarf=meshBox(.62,.08,.5,M(0xff4b7d));
  parts.scarf.position.set(0,.91,.27);
  g.add(parts.scarf);

  g.userData={kind:'player',parts,height:1.72,t:0,lastGrounded:false,land:0};
  return g;
}

export function makeLion(){
 const g=new THREE.Group(),parts={};
 parts.mane=new THREE.Mesh(new THREE.SphereGeometry(.68,18,14),S(0xff6500));parts.mane.scale.set(1,.78,.8);parts.mane.position.y=.72;g.add(parts.mane);
 parts.body=meshBox(1.08,.62,.72,M(0xe88a18));parts.body.position.y=.62;g.add(parts.body);
 parts.head=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),M(0xe88a18));parts.head.position.set(.45,.98,0);g.add(parts.head);
 parts.eye=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),S(0x17110c));parts.eye.position.set(.72,1.08,.38);g.add(parts.eye);
 parts.muzzle=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),M(0xf4bd76));parts.muzzle.scale.set(1,.7,.65);parts.muzzle.position.set(.78,.88,.34);g.add(parts.muzzle);
 parts.nose=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),S(0x3b1d12));parts.nose.position.set(.88,.92,.54);g.add(parts.nose);
 parts.tail=limb(.10,.7,.10,M(0xe88a18));parts.tail.position.set(-.55,.7,0);parts.tail.rotation.z=-.8;g.add(parts.tail);
 g.userData={kind:'lion',parts,t:0};return g;
}

export function makeEnemy(type,boss=false){
 const g=new THREE.Group(),colors={slime:0x5bc34b,bat:0xff3b43,runner:0x8b5cf6,turret:0xffa21c};
 const mat=M(colors[type]||0xffffff),parts={};
 if(type==='turret'){
  parts.body=meshBox(.7,.9,.7,mat);g.add(parts.body);
  parts.eye=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),S(0xfff3a1));parts.eye.position.set(0,.15,.38);g.add(parts.eye);
 }else{
  parts.body=new THREE.Mesh(new THREE.SphereGeometry(boss?.72:.43,16,12),mat);parts.body.scale.y=.8;g.add(parts.body);
  if(type==='bat'){
   parts.wingL=meshBox(.55,.1,.3,mat);parts.wingL.position.z=-.45;g.add(parts.wingL);
   parts.wingR=meshBox(.55,.1,.3,mat);parts.wingR.position.z=.45;g.add(parts.wingR);
  }
  if(type==='runner'){
   parts.eyeL=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),S(0xffffff));parts.eyeL.position.set(-.16,.08,.37);g.add(parts.eyeL);
   parts.eyeR=parts.eyeL.clone();parts.eyeR.position.x=.16;g.add(parts.eyeR);
   parts.pupilL=new THREE.Mesh(new THREE.SphereGeometry(.025,7,5),S(0x111111));parts.pupilL.position.set(-.16,.08,.425);g.add(parts.pupilL);
   parts.pupilR=parts.pupilL.clone();parts.pupilR.position.x=.16;g.add(parts.pupilR);
  }
  if(type==='slime'||type==='bat'){
   parts.eyeL=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),S(0xffffff));parts.eyeL.position.set(-.14,.08,.34);g.add(parts.eyeL);
   parts.eyeR=parts.eyeL.clone();parts.eyeR.position.x=.14;g.add(parts.eyeR);
   parts.pupilL=new THREE.Mesh(new THREE.SphereGeometry(.023,7,5),S(0x111111));parts.pupilL.position.set(-.14,.08,.39);g.add(parts.pupilL);
   parts.pupilR=parts.pupilL.clone();parts.pupilR.position.x=.14;g.add(parts.pupilR);
  }
 }
 if(boss){
  parts.ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.06,10,28),S(0xffd43b));parts.ring.rotation.x=Math.PI/2;parts.ring.position.y=.1;g.add(parts.ring);
  parts.crown=new THREE.Mesh(new THREE.ConeGeometry(.28,.5,5),S(0xffd43b));parts.crown.position.y=1.05;g.add(parts.crown);
 }
 g.userData={kind:type,boss,parts,t:Math.random()*6};return g;
}

export function animateCharacter(model,dt,state={}){
 if(!model?.userData?.parts)return;
 const u=model.userData,p=u.parts;u.t+=dt;
 const speed=Math.abs(state.vx||0),moving=speed>.35,air=!state.grounded;
 const cycle=u.t*(moving?9+speed*.45:3);
 const anim=state.anim||'';

 if(u.kind==='player'){
  const swing=moving?Math.sin(cycle)*.48:Math.sin(u.t*2)*.025;
  const runLegL=swing,runLegR=-swing;
  p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,runLegL,.28);
  p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,runLegR,.28);
  p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-swing*.65,.28);
  p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,swing*.65,.28);

  // State-specific poses: readable silhouette rather than generic bobbing.
  if(anim==='jump'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,-.22,.32);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,.22,.32);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-.7,.32);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-.7,.32);
  }else if(anim==='fall'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,.32,.24);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,-.32,.24);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-.35,.24);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,.35,.24);
  }else if(anim==='stomp'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,.55,.5);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,-.55,.5);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-1.0,.5);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-1.0,.5);
  }else if(anim==='attack'){
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-1.25,.45);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-1.25,.45);
  }else if(anim==='land'){
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,.55,.4);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,.55,.4);
  }

  const bob=air?Math.sin(u.t*10)*.025:Math.abs(Math.sin(cycle))*.035;
  const lean=moving?THREE.MathUtils.clamp((state.vx||0)*-.018,-.14,.14):0;
  const targetBody=lean+(state.attack?-.12:0)+(anim==='stomp'?.08:0)+(anim==='land'?.06:0);
  p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,targetBody,.22);
  p.head.rotation.z=THREE.MathUtils.lerp(p.head.rotation.z,state.facing<0?.04:-.04,.08);
  p.scarf.rotation.z=Math.sin(u.t*12)*.08+(state.vx?-.08*state.facing:0);
  p.bun.rotation.z=Math.sin(u.t*8)*.04;
  p.hairFringe.rotation.z=THREE.MathUtils.lerp(p.hairFringe.rotation.z,-.16+(state.vx||0)*-.006,.12);
  if(p.cheek)p.cheek.scale.x=1+Math.sin(u.t*3)*.04;

  if(anim==='jump')p.head.rotation.z+=.05;
  if(anim==='fall')p.head.rotation.z-=.05;
  if(anim==='attack')p.scarf.rotation.z*=.35;

  u.animBob=bob;
  const squash=anim==='land'?1.08:anim==='stomp'?1.04:1;
  model.scale.y=THREE.MathUtils.lerp(model.scale.y,squash,.28);
  model.scale.x=THREE.MathUtils.lerp(model.scale.x,1/squash,.28);
  model.position.y+=bob*.12;

 }else if(u.kind==='lion'){
  const swing=Math.sin(cycle)*.25;
  p.mane.rotation.z=THREE.MathUtils.lerp(p.mane.rotation.z,swing*.25,.22);
  p.tail.rotation.z=THREE.MathUtils.lerp(p.tail.rotation.z,-.8+Math.sin(u.t*6)*.22,.2);
  p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,Math.sin(u.t*4)*.025,.2);
  if(anim==='jump'||anim==='doubleJump'){
   p.body.rotation.z+=.08;
   p.tail.rotation.z=-1.05;
  }else if(anim==='stomp'){
   p.body.scale.y=THREE.MathUtils.lerp(p.body.scale.y,1.08,.35);
   p.mane.scale.y=THREE.MathUtils.lerp(p.mane.scale.y,.9,.35);
  }else{
   p.body.scale.y=THREE.MathUtils.lerp(p.body.scale.y,1,.2);
   p.mane.scale.y=THREE.MathUtils.lerp(p.mane.scale.y,.78,.2);
  }

 }else if(u.kind==='bat'){
  const flap=Math.sin(u.t*14)*.55;
  p.wingL.rotation.x=flap;p.wingR.rotation.x=-flap;
  const swoop=state.swoop||0;
  p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,Math.sin(u.t*7)*.08+swoop*.18,.18);
  p.body.scale.y=THREE.MathUtils.lerp(p.body.scale.y,1+(state.alert?.08:0),.18);
 }else if(u.kind==='slime'){
  if(state.hit)p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,.18,.35);
  if(state.stomp){
   const t=Math.max(0,Math.min(1,state.stomp));
   p.body.scale.y=.12+.68*t;p.body.scale.x=1.28-.28*t;p.body.scale.z=1.28-.28*t;
  }else{
   const hop=state.attack?Math.abs(Math.sin(u.t*13))*.13:0;
   const squish=1+Math.sin(u.t*(state.alert?12:8))*.07;
   p.body.scale.y=(.8+hop)/squish;p.body.scale.x=squish;p.body.scale.z=squish;
   p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,state.alert?Math.sin(u.t*10)*.06:0,.16);
  }
 }else if(u.kind==='runner'){
  const charge=state.charge||0;
  p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,Math.sin(u.t*(state.alert?16:10))*(state.alert?.10:.06),.22);
  p.body.scale.x=THREE.MathUtils.lerp(p.body.scale.x,1+(charge?.08:0),.2);
  p.body.scale.y=THREE.MathUtils.lerp(p.body.scale.y,1-(charge?.06:0),.2);
  if(state.attack)p.body.position.y=THREE.MathUtils.lerp(p.body.position.y,.08,.3);
  else p.body.position.y=THREE.MathUtils.lerp(p.body.position.y,0,.18);
  if(state.stomp){
   const t=Math.max(0,Math.min(1,state.stomp));
   p.body.scale.y=.12+.68*t;p.body.scale.x=1.25-.25*t;p.body.scale.z=1.25-.25*t;
  }
  if(p.ring)p.ring.rotation.z+=dt*1.8;
  const pupilShift=THREE.MathUtils.clamp((state.vx||0)*.012,-.035,.035);
  if(p.pupilL)p.pupilL.position.x=THREE.MathUtils.lerp(p.pupilL.position.x,-.14+pupilShift,.2);
  if(p.pupilR)p.pupilR.position.x=THREE.MathUtils.lerp(p.pupilR.position.x,.14+pupilShift,.2);
  }else if(u.kind==='slime'||u.kind==='bat'){
  const pupilShift=THREE.MathUtils.clamp((state.vx||0)*.012,-.035,.035);
  if(p.pupilL)p.pupilL.position.x=THREE.MathUtils.lerp(p.pupilL.position.x,-.14+pupilShift,.2);
  if(p.pupilR)p.pupilR.position.x=THREE.MathUtils.lerp(p.pupilR.position.x,.14+pupilShift,.2);
 }else if(u.kind==='turret'){
  p.body.rotation.y+=dt*(state.alert?.35:.7);
  p.eye.scale.setScalar(1+Math.sin(u.t*7)*.12);
  p.body.scale.y=THREE.MathUtils.lerp(p.body.scale.y,state.attack?.92:1,.18);
  if(state.recoil>0)p.body.position.z=Math.sin(u.t*40)*.04;
 }
}

