import * as THREE from 'three';
import {makeEnemy,meshBox} from './entities.js';
import {ENEMY_STATS} from './config.js';

export class WorldRuntime{
 constructor(scene){this.scene=scene;this.objects=[];this.enemies=[];this.items=[];this.level=null;this.boss=null;this.goal=null}
 clear(){for(const o of this.objects)this.scene.remove(o);this.objects=[];this.enemies=[];this.items=[];this.boss=null;this.goal=null;this.level=null}
 mount(level){
  this.clear();this.level=level;
  for(const p of level.platforms){
   p.prevY=p.y;p.mesh=meshBox(p.w,p.h,p.d,p.mat);p.mesh.position.set(p.x,p.y,0);this.scene.add(p.mesh);this.objects.push(p.mesh);
  }
  for(const h of level.hazards){
   const m=meshBox(h.w,.12,4,new THREE.MeshBasicMaterial({color:0xff304f}));m.position.set(h.x,-.28,.04);this.scene.add(m);this.objects.push(m);h.mesh=m;
  }
  for(const it of level.items){
   const color={coin:0xffd43b,crystal:0x45d9ff,heart:0xff3b79,star:0xffffff,key:0x8b5cf6}[it.type]||0xffffff;
   const geo=it.type==='coin'?new THREE.TorusGeometry(.19,.065,8,14):new THREE.OctahedronGeometry(.22);
   const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color}));m.position.set(it.x,it.y,it.z);this.scene.add(m);this.objects.push(m);
   this.items.push({...it,mesh:m,alive:true});
  }
  for(const e of level.enemies){
   const m=makeEnemy(e.type);m.position.set(e.x,e.y,0);this.scene.add(m);this.objects.push(m);
   const st=ENEMY_STATS[e.type];this.enemies.push({...e,mesh:m,hp:st.hp,maxHp:st.hp,alive:true,phase:Math.random()*6,hitFlash:0,fire:0});
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.12,10,24),new THREE.MeshBasicMaterial({color:level.world.accent}));
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
