import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

const M=(c,rough=.82)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.04});
const S=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.12});
export function meshBox(w,h,d,mat){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)}
function limb(w,h,d,mat){const m=meshBox(w,h,d,mat);m.geometry.translate(0,-h/2,0);return m}

export function makePlayer(){
 const g=new THREE.Group();
 const parts={};
 parts.body=meshBox(.58,.78,.45,M(0x376bd8));parts.body.position.y=.64;g.add(parts.body);
 parts.apron=meshBox(.64,.42,.47,M(0xffffff));parts.apron.position.set(0,.53,.25);g.add(parts.apron);
 parts.head=new THREE.Mesh(new THREE.SphereGeometry(.37,18,14),M(0xf6c7a5));parts.head.position.y=1.25;g.add(parts.head);
 parts.hair=new THREE.Mesh(new THREE.SphereGeometry(.43,18,14),M(0xf4c430));parts.hair.scale.set(1,.96,1.08);parts.hair.position.y=1.34;g.add(parts.hair);
 parts.bun=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),M(0xf4c430));parts.bun.position.set(-.27,1.55,0);g.add(parts.bun);
 parts.eyeL=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),S(0x15151a));parts.eyeL.position.set(-.12,1.24,.36);g.add(parts.eyeL);
 parts.eyeR=parts.eyeL.clone();parts.eyeR.position.x=.12;g.add(parts.eyeR);
 parts.armL=limb(.13,.48,.14,M(0xf6c7a5));parts.armL.position.set(-.39,.73,0);g.add(parts.armL);
 parts.armR=limb(.13,.48,.14,M(0xf6c7a5));parts.armR.position.set(.39,.73,0);g.add(parts.armR);
 parts.legL=limb(.17,.42,.18,M(0x29202b));parts.legL.position.set(-.18,.37,.05);g.add(parts.legL);
 parts.legR=limb(.17,.42,.18,M(0x29202b));parts.legR.position.set(.18,.37,.05);g.add(parts.legR);
 parts.scarf=meshBox(.62,.08,.5,M(0xff4b7d));parts.scarf.position.set(0,.91,.27);g.add(parts.scarf);
 g.userData={kind:'player',parts,height:1.72,t:0,lastGrounded:false,land:0};return g;
}

export function makeLion(){
 const g=new THREE.Group(),parts={};
 parts.mane=new THREE.Mesh(new THREE.SphereGeometry(.68,18,14),S(0xff6500));parts.mane.scale.set(1,.78,.8);parts.mane.position.y=.72;g.add(parts.mane);
 parts.body=meshBox(1.08,.62,.72,M(0xe88a18));parts.body.position.y=.62;g.add(parts.body);
 parts.head=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),M(0xe88a18));parts.head.position.set(.45,.98,0);g.add(parts.head);
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
   parts.eyeL=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),S(0xffffff));parts.eyeL.position.set(-.16,.08,.37);g.add(parts.eyeL);
   parts.eyeR=parts.eyeL.clone();parts.eyeR.position.x=.16;g.add(parts.eyeR);
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
 if(u.kind==='player'){
  const swing=moving?Math.sin(cycle)*.48:Math.sin(u.t*2)*.025;
  p.legL.rotation.x=swing;p.legR.rotation.x=-swing;p.armL.rotation.x=-swing*.65;p.armR.rotation.x=swing*.65;
  const bob=air?Math.sin(u.t*10)*.025:Math.abs(Math.sin(cycle))*.035;
  const lean=moving?THREE.MathUtils.clamp((state.vx||0)*-.018,-.14,.14):0;
  p.body.rotation.z=THREE.MathUtils.lerp(p.body.rotation.z,lean+(state.attack?-.12:0),.22);
  model.position.y+=0;
  
  p.head.rotation.z=THREE.MathUtils.lerp(p.head.rotation.z,state.facing<0?.04:-.04,.08);
  p.scarf.rotation.z=Math.sin(u.t*12)*.08+(state.vx?-.08*state.facing:0);
  p.bun.rotation.z=Math.sin(u.t*8)*.04;
  model.userData.animBob=bob;model.position.y+=bob*.12;
 }else if(u.kind==='lion'){
  const swing=Math.sin(cycle)*.25;p.mane.rotation.z=swing*.25;p.tail.rotation.z=-.8+Math.sin(u.t*6)*.22;p.body.rotation.z=Math.sin(u.t*4)*.025;
 }else if(u.kind==='bat'){
  const flap=Math.sin(u.t*14)*.55;p.wingL.rotation.x=flap;p.wingR.rotation.x=-flap;p.body.rotation.z=Math.sin(u.t*7)*.08;
 }else if(u.kind==='slime'){
  const squish=1+Math.sin(u.t*8)*.07;p.body.scale.y=.8/squish;p.body.scale.x=squish;p.body.scale.z=squish;
 }else if(u.kind==='runner'){
  p.body.rotation.z=Math.sin(u.t*10)*.06;
  if(p.ring)p.ring.rotation.z+=dt*1.8;
 }else if(u.kind==='turret'){
  p.body.rotation.y+=dt*.7;p.eye.scale.setScalar(1+Math.sin(u.t*7)*.12);
 }
}
