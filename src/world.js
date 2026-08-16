import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import {makeEnemy,makeNPC,animateCharacter,meshBox} from './entities.js';
import {ENEMY_STATS} from './config.js';

export class WorldRuntime{
 constructor(scene){this.scene=scene;this.objects=[];this.enemies=[];this.items=[];this.npcs=[];this.level=null;this.boss=null;this.goal=null;this.goalPulse=0}
 clear(){
  for(const o of this.objects){
   this.scene.remove(o);
   this.disposeObject(o);
  }
  this.objects=[];
  this.enemies=[];
  this.items=[];
  this.npcs=[];
  this.boss=null;
  this.goal=null;
  this.level=null;
 }
 disposeObject(root){
  root.traverse?.(node=>{
   if(node.geometry?.dispose)node.geometry.dispose();
   const materials=Array.isArray(node.material)?node.material:[node.material];
   for(const mat of materials)if(mat?.dispose)mat.dispose();
  });
 }
 mount(level){
  this.clear();this.level=level;
  for(const p of level.platforms){
   p.prevY=p.y;p.prevX=p.x;p.mesh=meshBox(p.w,p.h,p.d,p.mat);p.mesh.position.set(p.x,p.y,0);p.mesh.castShadow=true;p.mesh.receiveShadow=true;this.scene.add(p.mesh);this.objects.push(p.mesh);
  }
  for(const h of level.hazards){
   const m=meshBox(h.w,.12,4,new THREE.MeshStandardMaterial({color:0xff304f,emissive:0x550011,emissiveIntensity:.7}));m.position.set(h.x,-.28,.04);this.scene.add(m);this.objects.push(m);h.mesh=m;
  }
  for(const it of level.items){
   const color={coin:0xffd43b,crystal:0x45d9ff,heart:0xff3b79,star:0xffffff,key:0x8b5cf6,mushroom:0xff4b7d,relic:0xff66ff}[it.type]||0xffffff;
   let geo;
   if(it.type==='coin') geo=new THREE.TorusGeometry(.19,.065,8,14);
   else if(it.type==='relic') geo=new THREE.DodecahedronGeometry(.25,1);
   else if(it.type==='mushroom') geo=new THREE.SphereGeometry(.32,16,10);
   else geo=new THREE.OctahedronGeometry(.22);
   const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.08,emissive:color,emissiveIntensity:(it.type==='star'||it.type==='mushroom')?.35:0.04}));
   if(it.type==='mushroom'){
    // Distinctive Mario-like silhouette without using external assets:
    // cap + stem + six cream spots + warm emissive glow.
    m.scale.set(1,.72,1);
    const stem=new THREE.Mesh(
      new THREE.CylinderGeometry(.12,.15,.38,12),
      new THREE.MeshStandardMaterial({color:0xfff0c8,roughness:.65})
    );
    stem.position.y=-.25;stem.castShadow=true;m.add(stem);

    const spotMat=new THREE.MeshStandardMaterial({
      color:0xfff7d6,roughness:.5,emissive:0xffd43b,emissiveIntensity:.08
    });
    for(let si=0;si<6;si++){
      const a=(si/6)*Math.PI*2;
      const spot=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),spotMat);
      spot.position.set(Math.cos(a)*.22,.10,Math.sin(a)*.22);
      spot.scale.y=.38;
      m.add(spot);
    }
    const aura=new THREE.Mesh(new THREE.TorusGeometry(.52,.018,8,24),
      new THREE.MeshBasicMaterial({color:0xffd43b,transparent:true,opacity:.48}));
    aura.rotation.x=Math.PI/2;aura.position.y=-.22;m.add(aura);
    m.userData.aura=aura;
    m.userData.mushroom=true;
    m.userData.baseY=it.y;
    m.userData.phase=Math.random()*Math.PI*2;
   }
   m.castShadow=true;m.position.set(it.x,it.y,it.z);this.scene.add(m);this.objects.push(m);
   this.items.push({...it,mesh:m,alive:true});
  }
  for(const n of (level.npcs||[])){
   const m=makeNPC(n.role);
   m.position.set(n.x,n.y,n.z||.15);
   this.scene.add(m);this.objects.push(m);
   this.npcs.push({...n,mesh:m,seen:false});
  }
  for(const e of level.enemies){
   const m=makeEnemy(e.type);m.position.set(e.x,e.y,0);this.scene.add(m);this.objects.push(m);
   const st=ENEMY_STATS[e.type];
   let support=null,bestDist=Infinity;
   for(const pl of level.platforms){
    const d=Math.abs((pl.y+pl.h*.5)-e.y);
    if(d<bestDist){bestDist=d;support=pl;}
   }
   this.enemies.push({...e,mesh:m,hp:st.hp,maxHp:st.hp,alive:true,phase:Math.random()*6,hitFlash:0,hitAnim:0,fire:0,ai:'patrol',aiTimer:0,attackTimer:0,recoil:0,direction:1,supportPlatform:support});
  }
  for(const s of (level.setpieces||[])){
   if(s.type==='landmark'){
    const g=new THREE.Group();
    const accent=level.world.accent;
    const core=new THREE.Mesh(
      new THREE.IcosahedronGeometry(.55,1),
      new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.8,roughness:.22})
    );
    core.position.y=.95;g.add(core);
    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(1.05,.055,10,32),
      new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.7})
    );
    ring.rotation.x=Math.PI/2;ring.position.y=.95;g.add(ring);
    const beam=new THREE.Mesh(
      new THREE.CylinderGeometry(.025,.12,3.2,8),
      new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.16})
    );
    beam.position.y=2.0;g.add(beam);
    g.position.set(s.x,s.y,0);g.userData={kind:'landmark',phase:s.phase||0};
    this.scene.add(g);this.objects.push(g);
   }
   if(s.type==='storyGate'){
    const g=new THREE.Group();
    const left=meshBox(.34,2.6,.38,new THREE.MeshStandardMaterial({color:level.world.accent,emissive:level.world.accent,emissiveIntensity:.35}));
    const right=left.clone();left.position.x=-1.45;right.position.x=1.45;
    const top=meshBox(3.2,.28,.42,new THREE.MeshStandardMaterial({color:level.world.accent,emissive:level.world.accent,emissiveIntensity:.5}));
    top.position.y=1.3;g.add(left,right,top);g.position.set(s.x,s.y,0);this.scene.add(g);this.objects.push(g);
   }
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.12,12,28),new THREE.MeshStandardMaterial({color:level.world.accent,emissive:level.world.accent,emissiveIntensity:.55}));ring.castShadow=true;
  ring.position.set(level.goalX,.8,0);this.scene.add(ring);this.objects.push(ring);this.goal=ring;
 }
 addBoss(data){
  const m=makeEnemy('runner',true);m.position.set(data.x,data.y,0);this.scene.add(m);this.objects.push(m);
  this.boss={...data,mesh:m,hp:data.stats.hp,maxHp:data.stats.hp,phase:0,attackTimer:1.4};
 }
 update(dt){
  for(const n of this.npcs){
   if(n.mesh){
    const t=performance.now()*.001+n.mesh.userData.t;
    n.mesh.position.y=n.y+Math.sin(t*2.1)*.035;
    n.mesh.rotation.y=Math.sin(t*.7)*.05;
    n.mesh.scale.setScalar(1+Math.sin(t*2.1)*.018);
    animateCharacter(n.mesh,dt,{grounded:true});
   }
  }
  for(const o of this.objects){
   if(o.userData?.kind==='landmark'){
    const t=performance.now()*.001+(o.userData.phase||0);
    o.rotation.y+=dt*.25;
    const core=o.children[0],ring=o.children[1];
    if(core){core.rotation.x+=dt*1.7;core.rotation.z+=dt*1.2;core.position.y=.95+Math.sin(t*2.5)*.10}
    if(ring){ring.rotation.z+=dt*.9;ring.scale.setScalar(1+Math.sin(t*3.1)*.08)}
   }
  }
  for(const it of this.items){
   if(it.alive&&it.type==='mushroom'&&it.mesh){
    const t=performance.now()*.001;
    it.mesh.rotation.y+=dt*.9;
    it.mesh.position.y=it.y+Math.sin(t*2.6+(it.mesh.userData.phase||0))*.10;
    const s=1+Math.sin(t*5.2+(it.mesh.userData.phase||0))*.045;
    it.mesh.scale.x=s;it.mesh.scale.z=s;
    if(it.mesh.userData.aura){
     it.mesh.userData.aura.rotation.z+=dt*1.7;
     it.mesh.userData.aura.scale.setScalar(1+Math.sin(t*4+(it.mesh.userData.phase||0))*.16);
     it.mesh.userData.aura.material.opacity=.28+.22*(.5+.5*Math.sin(t*5+(it.mesh.userData.phase||0)));
    }
   }
  }
  for(const p of this.level?.moving||[]){
   p.prevY=p.y;p.move.phase+=dt*p.move.speed;p.y=p.baseY+Math.sin(p.move.phase)*p.move.amp;p.mesh.position.y=p.y;
  }
  if(this.goal){this.goal.rotation.z+=dt*1.5;this.goal.rotation.y+=dt*2}
 }
}
