import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import {LEVELS,WORLDS,BOSS_STATS} from './config.js';

const materialFor=world=>new THREE.MeshBasicMaterial({color:world.ground});
const addPlatform=(arr,x,y,w,h=.65,mat,extra={})=>{
 const p={x,y,w,h,d:5,mat,...extra};arr.push(p);return p;
};
const addCoinLine=(items,x,y,count,spacing=.9)=>{
 for(let i=0;i<count;i++)items.push({type:'coin',x:x+i*spacing,y,z:0});
};
const addEnemy=(enemies,type,x,y)=>enemies.push({type,x,y,z:0});

export function buildLevel(index){
 const cfg=LEVELS[index],world=WORLDS[cfg.world],mat=materialFor(world);
 const platforms=[],items=[],enemies=[],hazards=[],moving=[];
 const patterns=[
  [
   [0,-.45,18], [14.5,.1,7], [24.5,.55,6], [34.5,.1,8], [49,.8,6], [58,.15,10],
   [71,.55,7], [81,1.1,5], [90,.35,11], [104,.8,8], [115,.1,10], [128,.55,9]
  ],
  [
   [0,-.45,16], [19,.2,5], [27,1.0,5], [35,.2,5], [43,.9,6], [54,.15,7],
   [66,1.25,5], [75,.2,6], [86,.8,7], [98,.15,5], [108,1.1,6], [120,.3,10], [134,.7,10]
  ],
  [
   [0,-.45,20], [22,.1,9], [34,.1,9], [46,.9,5], [55,.9,5], [64,.1,8],
   [76,.75,6], [87,.1,9], [100,1.0,5], [109,.35,8], [121,.95,6], [131,.25,14]
  ]
 ];
 const pat=patterns[cfg.index%3];
 for(let i=0;i<pat.length;i++){
  const [x,y,w]=pat[i];
  const movingHere=(i>1 && i%5===0);
  addPlatform(platforms,x,y,w,.65,mat,movingHere?{baseY:y,move:{amp:.35,speed:.65+(i%3)*.18,phase:i}}:{});
  if(movingHere)moving.push(platforms.at(-1));
 }

 // Extend late-game levels without turning the layout into an endless random corridor.
 const last=platforms.at(-1);
 if(last.x+last.w/2<cfg.length-8)addPlatform(platforms,cfg.length-8,.45,14,.85,mat);
 const arena=addPlatform(platforms,cfg.length+2,.55,18,.85,mat);

 // Coins are placed as readable routes: reward the intended jump arc.
 for(let i=0;i<platforms.length;i++){
  const p=platforms[i];
  const count=Math.min(5,Math.max(2,Math.floor(p.w/2)));
  const start=p.x-(count-1)*.45;
  addCoinLine(items,start,p.y+1.0,count,.9);
 }
 // Story pickup: the golden lion mushroom triggers the transformation.
 if(cfg.worldId==='forest' && cfg.index===3){
  const mp=platforms[2];
  items.push({type:'mushroom',x:mp.x,y:mp.y+1.15,z:0,story:'Der Löwenpilz'});
 }
 if(cfg.worldId==='forest' && cfg.index===4){
  const mp=platforms[5];
  items.push({type:'mushroom',x:mp.x,y:mp.y+1.15,z:0,story:'Der zweite Löwenpilz'});
 }

 // Vertical challenge coins and utility pickups.
 for(let i=2;i<platforms.length-2;i+=4){
  const p=platforms[i];
  items.push({type:i%8===0?'heart':'crystal',x:p.x,y:p.y+1.65,z:0});
 }
 items.push({type:'key',x:arena.x-3,y:arena.y+1.25,z:0});
 if(cfg.boss)items.push({type:'star',x:arena.x+1,y:arena.y+1.3,z:0});

 // Deliberate enemy roles: opener -> pressure -> recovery -> encounter.
 for(let i=1;i<platforms.length-1;i++){
  const p=platforms[i];
  const role=i%6;
  if(role===1)addEnemy(enemies,'slime',p.x,p.y+1);
  if(role===2)addEnemy(enemies,'runner',p.x+p.w*.35,p.y+1);
  if(role===3)addEnemy(enemies,'bat',p.x+p.w*.5,p.y+1.7);
  if(role===4)addEnemy(enemies,'turret',p.x+p.w*.7,p.y+1);
  if(role===5){addEnemy(enemies,'slime',p.x-p.w*.2,p.y+1);addEnemy(enemies,'bat',p.x+p.w*.25,p.y+1.7)}
 }
 // Every level gets a minimum number of encounters, but placement stays deterministic.
 const minimum=cfg.questKind==='kills'?10:7;
 let cursor=2;
 while(enemies.length<minimum){
  const p=platforms[cursor++%(platforms.length-2)+1];
  addEnemy(enemies,['slime','runner','bat'][enemies.length%3],p.x,p.y+1);
 }

 // Explicit hazard gaps; landing surfaces remain wide enough for the collision model.
 for(let i=0;i<platforms.length-1;i++){
  const a=platforms[i],b=platforms[i+1];
  const gap=b.x-b.w/2-(a.x+a.w/2);
  if(gap>.9)hazards.push({x:(a.x+a.w/2+b.x-b.w/2)/2,y:-.45,w:gap,h:.5});
 }

 const boss=cfg.boss
  ? {x:arena.x+2,y:arena.y+2,stats:BOSS_STATS[world.id]||{name:'Wächter',hp:12,speed:2.4,aggro:12,projectile:4}}
  : null;

 return {cfg,world,platforms,items,enemies,hazards,goalX:arena.x+6,boss,moving};
}
