import * as THREE from 'three';
import {LEVELS,WORLDS,BOSS_STATS} from './config.js';

const materialFor=world=>new THREE.MeshBasicMaterial({color:world.ground});
const rngSeed=n=>()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296};

export function buildLevel(index){
 const cfg=LEVELS[index],world=WORLDS[cfg.world],r=rngSeed((index+1)*9719);
 const platforms=[],items=[],enemies=[],hazards=[],moving=[];
 const mat=materialFor(world);
 platforms.push({x:0,y:-.45,w:18,h:.8,d:5,mat});
 let x=9,y=.1;

 while(x<cfg.length-16){
  const gap=.7+r()*1.15,w=4.5+r()*3.8;
  y=Math.max(-.05,Math.min(1.7,y+(-.35+r()*1.05)));
  const p={x:x+gap,y,w,h:.65,d:5,mat};
  if(r()<.18){p.baseY=y;p.move={amp:.35+r()*.4,speed:.6+r()*.6,phase:r()*6};moving.push(p)}
  platforms.push(p);
  const cx=p.x+p.w*.5;
  items.push({type:'coin',x:cx-.9,y:y+1.05,z:0},{type:'coin',x:cx+.15,y:y+1.05,z:0});
  if(r()<.65)items.push({type:'coin',x:cx+1.05,y:y+1.05,z:0});
  if(r()<.3)items.push({type:'crystal',x:cx,y:y+1.25,z:0});
  if(r()<.14)items.push({type:'heart',x:cx,y:y+1.25,z:0});
  if(r()<.62)enemies.push({type:['slime','bat','runner','turret'][Math.floor(r()*4)],x:cx,y:y+1,z:0});
  x=p.x+p.w;
 }

 const arenaY=Math.max(0,Math.min(1.3,y));
 platforms.push({x:cfg.length-7,y:arenaY,w:16,h:.85,d:5,mat});
 const arena=platforms.at(-1);
 items.push({type:'key',x:arena.x-2,y:arena.y+1.2,z:0},{type:'star',x:arena.x+1,y:arena.y+1.2,z:0});
 while(items.filter(i=>i.type==='coin').length<14){
  const p=platforms[1+Math.floor(r()*Math.max(1,platforms.length-2))];
  items.push({type:'coin',x:p.x,y:p.y+1.05,z:0});
 }
 while(enemies.length<(cfg.questKind==='kills'?8:6)){
  const p=platforms[1+Math.floor(r()*Math.max(1,platforms.length-2))];
  enemies.push({type:['slime','runner','bat'][enemies.length%3],x:p.x+p.w*.55,y:p.y+1,z:0});
 }
 for(let i=0;i<platforms.length-1;i++){
  const a=platforms[i],b=platforms[i+1];
  const gapW=b.x-b.w/2-(a.x+a.w/2);
  if(gapW>.85)hazards.push({x:(a.x+a.w/2+b.x-b.w/2)/2,y:-.45,w:gapW,h:.5});
 }
 const boss=cfg.boss?{x:arena.x+1.5,y:arena.y+2,stats:BOSS_STATS[world.id]||{name:'Wächter',hp:12,speed:2.4,aggro:12,projectile:4}}:null;
 return {cfg,world,platforms,items,enemies,hazards,goalX:arena.x+5,boss,moving};
}
