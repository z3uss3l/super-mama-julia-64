import * as THREE from 'three';
import {makeEnemy,meshBox} from './entities.js';
import {ENEMY_STATS} from './config.js';

export class WorldRuntime{
  constructor(scene){this.scene=scene;this.objects=[];this.enemies=[];this.items=[];this.level=null;this.boss=null}
  clear(){for(const o of this.objects)this.scene.remove(o);this.objects.length=0;this.enemies=[];this.items=[];this.boss=null;this.level=null}
  mount(level){this.clear();this.level=level;for(const p of level.platforms){const m=meshBox(p.w,p.h,p.d,p.mat);m.position.set(p.x,p.y,0);this.scene.add(m);this.objects.push(m);p.mesh=m}
    for(const it of level.items){const color={coin:0xffd43b,crystal:0x45d9ff,heart:0xff3b79,star:0xffffff,key:0x8b5cf6,mushroom:0xff4d4d}[it.type]||0xffffff;const m=new THREE.Mesh(new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color}));m.position.set(it.x,it.y,it.z);this.scene.add(m);this.objects.push(m);this.items.push({...it,mesh:m,alive:true})}
    for(const e of level.enemies){const m=makeEnemy(e.type);m.position.set(e.x,e.y,0);this.scene.add(m);this.objects.push(m);this.enemies.push({...e,mesh:m,hp:ENEMY_STATS[e.type].hp,alive:true,phase:Math.random()*6})}
  }
  addBoss(data){const m=makeEnemy('runner',true);m.position.set(data.x,data.y,0);this.scene.add(m);this.objects.push(m);this.boss={...data,mesh:m,hp:data.stats.hp,maxHp:data.stats.hp,phase:0,attackTimer:1.2}}
}
