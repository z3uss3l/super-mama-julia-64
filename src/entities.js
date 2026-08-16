import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

const M=(c,rough=.82)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.04});
const S=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.12});
export function meshBox(w,h,d,mat){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)}
function limb(w,h,d,mat){const m=meshBox(w,h,d,mat);m.geometry.translate(0,-h/2,0);return m}

export function makePlayer(){
  const g=new THREE.Group();
  const parts={};

  // Julia V8.2: stylized 3D character based on the supplied visual reference:
  // blonde hair, blue/grey eyes, black top, pink apron, jeans and pink shoes.
  // The face is built from separate features so it remains readable in 3/4
  // view and does not deform when Julia changes direction.
  const skin=M(0xf2c4a5,.72), hairMat=M(0xc99b62,.58), hairHi=M(0xe3b878,.54);
  const topMat=M(0x171922,.74), apronMat=M(0xd95b82,.52), denimMat=M(0x344b73,.78);
  const shoeMat=S(0xe46f91), white=S(0xf5e8df), iris=S(0x607d91), dark=S(0x24202a);

  parts.torso=meshBox(.64,.74,.46,topMat); parts.torso.position.y=.73; g.add(parts.torso);
  parts.apron=meshBox(.66,.48,.48,apronMat); parts.apron.position.set(0,.55,.255); g.add(parts.apron);
  parts.apronBib=meshBox(.42,.30,.035,apronMat); parts.apronBib.position.set(0,.79,.50); g.add(parts.apronBib);
  parts.apronPocket=meshBox(.30,.16,.025,apronMat); parts.apronPocket.position.set(0,.48,.51); g.add(parts.apronPocket);
  parts.apronStrapL=meshBox(.055,.34,.035,apronMat); parts.apronStrapL.position.set(-.21,.83,.47); parts.apronStrapL.rotation.z=-.08; g.add(parts.apronStrapL);
  parts.apronStrapR=parts.apronStrapL.clone(); parts.apronStrapR.position.x=.21; parts.apronStrapR.rotation.z=.08; g.add(parts.apronStrapR);
  parts.apronBow=meshBox(.28,.08,.045,apronMat); parts.apronBow.position.set(0,.36,.48); g.add(parts.apronBow);

  parts.neck=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.16,12),skin); parts.neck.position.y=1.07; g.add(parts.neck);
  parts.head=new THREE.Mesh(new THREE.SphereGeometry(.39,24,18),skin); parts.head.scale.set(1,.98,.94); parts.head.position.set(0,1.38,.025); g.add(parts.head);

  // Hair cap + layered fringe + side ponytail.
  parts.hair=new THREE.Mesh(new THREE.SphereGeometry(.445,24,18),hairMat);
  parts.hair.scale.set(1.01,.88,1.03); parts.hair.position.set(0,1.48,-.075); g.add(parts.hair);
  parts.fringe=meshBox(.50,.19,.18,hairHi); parts.fringe.position.set(.02,1.67,.31); parts.fringe.rotation.z=-.10; g.add(parts.fringe);
  parts.fringe2=meshBox(.28,.13,.16,hairHi); parts.fringe2.position.set(-.20,1.60,.33); parts.fringe2.rotation.z=.28; g.add(parts.fringe2);
  parts.ponytail=new THREE.Mesh(new THREE.SphereGeometry(.25,18,14),hairMat); parts.ponytail.scale.set(.82,1.25,.72); parts.ponytail.position.set(-.36,1.43,-.05); g.add(parts.ponytail);
  parts.ponytailTip=limb(.12,.36,.13,hairHi); parts.ponytailTip.position.set(-.46,1.18,-.04); parts.ponytailTip.rotation.z=-.28; g.add(parts.ponytailTip);
  parts.sideLock=limb(.10,.30,.11,hairHi); parts.sideLock.position.set(.31,1.42,.20); parts.sideLock.rotation.z=.18; g.add(parts.sideLock);

  // Symmetric eyes; the nose and mouth remain centered instead of being
  // mirrored by the root scale, preventing the previous facial distortion.
  for(const [key,x] of [['eyeL',-.105],['eyeR',.105]]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.052,12,9),white); eye.scale.z=.55; eye.position.set(x,1.405,.365); g.add(eye); parts[key]=eye;
    const irisMesh=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),iris); irisMesh.position.set(x,1.405,.394); g.add(irisMesh); parts[key+'Iris']=irisMesh;
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),dark); pupil.position.set(x,1.405,.416); g.add(pupil); parts[key+'Pupil']=pupil;
  }
  parts.browL=meshBox(.13,.025,.025,dark); parts.browL.position.set(-.105,1.49,.37); parts.browL.rotation.z=.05; g.add(parts.browL);
  parts.browR=meshBox(.13,.025,.025,dark); parts.browR.position.set(.105,1.49,.37); parts.browR.rotation.z=-.05; g.add(parts.browR);
  parts.nose=new THREE.Mesh(new THREE.SphereGeometry(.052,10,8),skin); parts.nose.scale.set(.8,.72,1.15); parts.nose.position.set(.015,1.34,.392); g.add(parts.nose);
  parts.mouth=meshBox(.13,.018,.025,M(0x9c5261,.55)); parts.mouth.position.set(.015,1.245,.382); g.add(parts.mouth);
  parts.mouthSmile=meshBox(.08,.012,.018,M(0xd27783,.55)); parts.mouthSmile.position.set(.015,1.235,.39); g.add(parts.mouthSmile);
  parts.cheekL=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),M(0xf09b91,.72)); parts.cheekL.scale.set(1,.48,.18); parts.cheekL.position.set(-.19,1.31,.355); g.add(parts.cheekL);
  parts.cheekR=parts.cheekL.clone(); parts.cheekR.position.x=.19; g.add(parts.cheekR);
  parts.eyeGlint=new THREE.Mesh(new THREE.SphereGeometry(.014,7,6),white); parts.eyeGlint.position.set(.105,1.418,.424); g.add(parts.eyeGlint);

  parts.armL=limb(.14,.49,.15,skin); parts.armL.position.set(-.40,.78,.02); g.add(parts.armL);
  parts.armR=limb(.14,.49,.15,skin); parts.armR.position.set(.40,.78,.02); g.add(parts.armR);

  // Longer legs with independent hip pivots make the walk cycle clearly visible.
  parts.legL=limb(.19,.54,.20,denimMat); parts.legL.position.set(-.18,.39,.03); g.add(parts.legL);
  parts.legR=limb(.19,.54,.20,denimMat); parts.legR.position.set(.18,.39,.03); g.add(parts.legR);
  parts.shoeL=meshBox(.25,.14,.38,shoeMat); parts.shoeL.position.set(-.18,.075,.13); g.add(parts.shoeL);
  parts.shoeR=meshBox(.25,.14,.38,shoeMat); parts.shoeR.position.set(.18,.075,.13); g.add(parts.shoeR);
  parts.shoeToeL=meshBox(.22,.08,.10,white); parts.shoeToeL.position.set(-.18,.08,.31); g.add(parts.shoeToeL);
  parts.shoeToeR=meshBox(.22,.08,.10,white); parts.shoeToeR.position.set(.18,.08,.31); g.add(parts.shoeToeR);

  parts.scarf=meshBox(.66,.075,.48,apronMat); parts.scarf.position.set(0,.98,.27); g.add(parts.scarf);
  parts.apronPin=new THREE.Mesh(new THREE.OctahedronGeometry(.045),S(0xffd43b)); parts.apronPin.position.set(.12,.68,.52); g.add(parts.apronPin);

  g.userData={kind:'player',parts,height:1.82,t:0,lastGrounded:false,land:0,blink:0};
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
 parts.earL=new THREE.Mesh(new THREE.ConeGeometry(.12,.25,6),M(0xe88a18));parts.earL.position.set(.25,1.36,-.22);g.add(parts.earL);
 parts.earR=parts.earL.clone();parts.earR.position.z=.22;g.add(parts.earR);
 parts.pawL=meshBox(.22,.16,.34,M(0xe88a18));parts.pawL.position.set(.18,.24,.26);g.add(parts.pawL);
 parts.pawR=parts.pawL.clone();parts.pawR.position.z=-.26;g.add(parts.pawR);
 const whisk=new THREE.MeshBasicMaterial({color:0xfff0c2,transparent:true,opacity:.8});
 for(const z of [-.12,.12]){const w=new THREE.Mesh(new THREE.BoxGeometry(.24,.012,.012),whisk);w.position.set(.95,.90,z);w.rotation.y=.12;g.add(w);}
 g.userData={kind:'lion',parts,t:0};return g;
}

export function makeNPC(role){
 const palette=role==='tamia'
  ? {dress:0xe56b8f,hair:0x5a3426,accent:0xffc3d2}
  : {dress:0x6d7cff,hair:0x241f4f,accent:0xd9ddff};
 const g=new THREE.Group(),parts={};

 parts.body=meshBox(.48,.72,.38,M(palette.dress));
 parts.body.position.y=.56;g.add(parts.body);

 parts.head=new THREE.Mesh(new THREE.SphereGeometry(.30,16,12),M(0xf4c2a1));
 parts.head.position.y=1.18;g.add(parts.head);

 parts.hair=new THREE.Mesh(new THREE.SphereGeometry(.33,16,12),M(palette.hair));
 parts.hair.scale.set(1,.9,1.05);parts.hair.position.set(0,1.27,-.04);g.add(parts.hair);

 parts.eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),S(0x15151a));
 parts.eye.position.set(.09,1.19,.285);g.add(parts.eye);
 const eye2=parts.eye.clone();eye2.position.x=-.09;g.add(eye2);

 parts.cape=meshBox(.56,.62,.08,M(palette.accent));
 parts.cape.position.set(0,.65,-.22);g.add(parts.cape);

 parts.staff=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.95,8),S(palette.accent));
 parts.staff.position.set(.38,.58,.03);g.add(parts.staff);

 parts.gem=new THREE.Mesh(new THREE.OctahedronGeometry(.10),S(palette.accent));
 parts.gem.position.set(.38,1.06,.03);g.add(parts.gem);

 g.userData={kind:'npc',role,parts,t:Math.random()*6.28};
 return g;
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
  // Full-body locomotion: legs drive from the hips, shoes follow the feet,
  // arms counter-swing and the torso/head remain stable.
  const stride=moving?THREE.MathUtils.clamp(.58+speed*.018,.58,.76):.035;
  const swing=moving?Math.sin(cycle)*stride:Math.sin(u.t*2)*.025;
  const opposite=-swing;
  const stepL=moving?Math.sin(cycle):0;
  const stepR=moving?Math.sin(cycle+Math.PI):0;
  const liftL=moving?Math.max(0,-Math.cos(cycle))*.045:0;
  const liftR=moving?Math.max(0,-Math.cos(cycle+Math.PI))*.045:0;

  p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,swing,.34);
  p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,opposite,.34);
  p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,opposite*.72,.30);
  p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,swing*.72,.30);

  // Explicit foot travel: shoes are separate meshes and must follow the gait.
  if(p.legL){
   p.legL.position.z=THREE.MathUtils.lerp(p.legL.position.z,.03+stepL*.055,.32);
   p.legL.position.y=THREE.MathUtils.lerp(p.legL.position.y,.39+liftL,.32);
  }
  if(p.legR){
   p.legR.position.z=THREE.MathUtils.lerp(p.legR.position.z,.03+stepR*.055,.32);
   p.legR.position.y=THREE.MathUtils.lerp(p.legR.position.y,.39+liftR,.32);
  }
  if(p.shoeL){
   p.shoeL.position.z=THREE.MathUtils.lerp(p.shoeL.position.z,.13+stepL*.115,.36);
   p.shoeL.position.y=THREE.MathUtils.lerp(p.shoeL.position.y,.075+liftL,.36);
   p.shoeL.rotation.x=p.legL.rotation.x*.45;
  }
  if(p.shoeR){
   p.shoeR.position.z=THREE.MathUtils.lerp(p.shoeR.position.z,.13+stepR*.115,.36);
   p.shoeR.position.y=THREE.MathUtils.lerp(p.shoeR.position.y,.075+liftR,.36);
   p.shoeR.rotation.x=p.legR.rotation.x*.45;
  }
  if(p.shoeToeL){
   p.shoeToeL.position.z=THREE.MathUtils.lerp(p.shoeToeL.position.z,.31+stepL*.115,.36);
   p.shoeToeL.position.y=THREE.MathUtils.lerp(p.shoeToeL.position.y,.08+liftL,.36);
   p.shoeToeL.rotation.x=p.legL.rotation.x*.45;
  }
  if(p.shoeToeR){
   p.shoeToeR.position.z=THREE.MathUtils.lerp(p.shoeToeR.position.z,.31+stepR*.115,.36);
   p.shoeToeR.position.y=THREE.MathUtils.lerp(p.shoeToeR.position.y,.08+liftR,.36);
   p.shoeToeR.rotation.x=p.legR.rotation.x*.45;
  }
  if(anim==='jump'||anim==='doubleJump'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,-.28,.38);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,.28,.38);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-.82,.35);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-.82,.35);
  }else if(anim==='fall'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,.34,.30);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,-.34,.30);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-.38,.28);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,.38,.28);
  }else if(anim==='stomp'){
   p.legL.rotation.x=THREE.MathUtils.lerp(p.legL.rotation.x,.72,.55);
   p.legR.rotation.x=THREE.MathUtils.lerp(p.legR.rotation.x,.72,.55);
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-1.05,.50);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-1.05,.50);
  }else if(anim==='attack'){
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-1.25,.48);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-1.25,.48);
  }else if(anim==='transform'){
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,-1.0,.30);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,-1.0,.30);
  }else if(anim==='land'){
   p.armL.rotation.x=THREE.MathUtils.lerp(p.armL.rotation.x,.50,.40);
   p.armR.rotation.x=THREE.MathUtils.lerp(p.armR.rotation.x,.50,.40);
  }

  const lean=moving?THREE.MathUtils.clamp((state.vx||0)*-.014,-.12,.12):0;
  const bob=moving?Math.abs(Math.sin(cycle))*.025:Math.sin(u.t*2)*.012;
  p.torso.rotation.z=THREE.MathUtils.lerp(p.torso.rotation.z,lean,.22);
  p.torso.position.y=THREE.MathUtils.lerp(p.torso.position.y,.78+bob,.22);
  p.head.rotation.z=THREE.MathUtils.lerp(p.head.rotation.z,moving?-(state.vx||0)*.004:0,.10);
  p.head.position.y=THREE.MathUtils.lerp(p.head.position.y,1.38+bob*.72,.22);
  p.scarf.rotation.z=Math.sin(u.t*12)*.08-(state.vx||0)*.01;
  p.ponytail.rotation.z=Math.sin(u.t*7)*.05-(state.vx||0)*.02;
  p.ponytailTip.rotation.z=-.28+Math.sin(u.t*8)*.08;
  p.sideLock.rotation.z=.18+Math.sin(u.t*6)*.04;
  p.fringe.rotation.z=-.10+Math.sin(u.t*4)*.018;
  if(p.apronPin)p.apronPin.rotation.y+=dt*3.2;

  // Eye direction and blink. Both eyes remain on the face; no root mirroring.
  const look=THREE.MathUtils.clamp((state.vx||0)*.012,-.035,.035);
  for(const side of ['L','R']){
   const iris=p['eye'+side+'Iris'], pupil=p['eye'+side+'Pupil'];
   if(iris)iris.position.x=THREE.MathUtils.lerp(iris.position.x,(side==='L'?-.105:.105)+look,.22);
   if(pupil)pupil.position.x=THREE.MathUtils.lerp(pupil.position.x,(side==='L'?-.105:.105)+look,.22);
  }
  const blinkCycle=(u.t+.8)%3.7;
  const blink=blinkCycle>3.48&&blinkCycle<3.58;
  const eyeScale=blink?.18:1;
  p.eyeL.scale.y=THREE.MathUtils.lerp(p.eyeL.scale.y,eyeScale,.48);
  p.eyeR.scale.y=THREE.MathUtils.lerp(p.eyeR.scale.y,eyeScale,.48);
  if(p.eyeGlint)p.eyeGlint.visible=!blink;
  p.browL.position.y=1.49+(blink?.012:0);p.browR.position.y=1.49+(blink?.012:0);
  p.cheekL.scale.x=1+Math.sin(u.t*3)*.03;p.cheekR.scale.x=1+Math.sin(u.t*3)*.03;

  const squash=anim==='land'?1.07:anim==='stomp'?1.04:1;
  const facing=Math.sign(state.facing||1);
  // Character art faces local +Z. Rotate the whole model around Y instead
  // of mirroring scale.x: mirroring made the face look backward/deformed.
  const targetYaw=facing>0?Math.PI/2:-Math.PI/2;
  const yawDelta=Math.atan2(Math.sin(targetYaw-model.rotation.y),Math.cos(targetYaw-model.rotation.y));
  model.rotation.y += yawDelta*Math.min(1,dt*12);
  model.scale.x=THREE.MathUtils.lerp(model.scale.x,squash,.28);
  model.scale.y=THREE.MathUtils.lerp(model.scale.y,1/squash,.28);
 }else if(u.kind==='lion'){
  const swing=Math.sin(cycle)*.25;
  if(p.earL)p.earL.rotation.z=Math.sin(u.t*2.2)*.06;
  if(p.earR)p.earR.rotation.z=-Math.sin(u.t*2.2)*.06;
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
 }else if(u.kind==='npc'){
  const bob=Math.sin(u.t*2.2)*.025;
  p.body.position.y=.56+bob;
  p.head.position.y=1.18+bob;
  p.cape.rotation.z=Math.sin(u.t*1.7)*.035;
  p.gem.rotation.y+=dt*1.8;
  p.gem.position.y=1.06+Math.sin(u.t*3)*.04;
 }
}

