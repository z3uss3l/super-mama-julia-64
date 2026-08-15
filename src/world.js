import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import {makeEnemy,meshBox} from './entities.js';
import {ENEMY_STATS} from './config.js';

export class WorldRuntime{
 constructor(scene){this.scene=scene;this.objects=[];this.enemies=[];this.items=[];this.level=null;this.boss=null;this.goal=null;this.goalPulse=0}
 clear(){
  for(const o of this.objects){
   this.scene.remove(o);
   this.disposeObject(o);
  }
  this.objects=[];
  this.enemies=[];
  this.items=[];
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
   const color={coin:0xffd43b,crystal:0x45d9ff,heart:0xff3b79,star:0xffffff,key:0x8b5cf6,mushroom:0xff4b7d}[it.type]||0xffffff;
   let geo;
   if(it.type==='coin') geo=new THREE.TorusGeometry(.19,.065,8,14);
   else if(it.type==='mushroom') geo=new THREE.SphereGeometry(.32,16,10);
   else geo=new THREE.OctahedronGeometry(.22);
   const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.08,emissive:color,emissiveIntensity:(it.type==='star'||it.type==='mushroom')?.35:0.04}));
   if(it.type==='mushroom'){
    m.scale.set(1,.65,1);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.32,10),new THREE.MeshStandardMaterial({color:0xfff0c8,roughness:.65}));
    stem.position.y=-.25;stem.castShadow=true;m.add(stem);
   }
   m.castShadow=true;m.position.set(it.x,it.y,it.z);this.scene.add(m);this.objects.push(m);
   this.items.push({...it,mesh:m,alive:true});
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
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.12,12,28),new THREE.MeshStandardMaterial({color:level.world.accent,emissive:level.world.accent,emissiveIntensity:.55}));ring.castShadow=true;
  ring.position.set(level.goalX,.8,0);this.scene.add(ring);this.objects.push(ring);this.goal=ring;
 }
 addBoss(data){
  const m=makeEnemy('runner',true);m.position.set(data.x,data.y,0);this.scene.add(m);this.objects.push(m);
  this.boss={...data,mesh:m,hp:data.stats.hp,maxHp:data.stats.hp,phase:0,attackTimer:1.4};
 }
 update(dt){
  for(const p of this.level?.moving||[]){
   p.prevY=p.y;p.move.phase+=dt*p.move.speed;p.y=p.baseY+Math.sin(p.move.phase)*p.move.amp;p.mesh.position.y=p.y;
  }
  if(this.goal){this.goal.rotation.z+=dt*1.5;this.goal.rotation.y+=dt*2}
 }
}
