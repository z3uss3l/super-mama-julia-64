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
 const platforms=[],items=[],enemies=[],hazards=[],moving=[],npcs=[],setpieces=[];
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

 // STORY ROUTES ---------------------------------------------------------
 // Forest levels receive an optional elevated route. It is not decorative:
 // the platforms are part of the collision set and form a genuine alternate
 // traversal line with extra rewards.
 if(cfg.worldId==='forest'){
  const branch=[
   [26,2.15,4.8],[34,2.65,4.4],[43,2.15,5.0],
   [54,2.9,4.6],[65,2.35,5.0],[76,2.85,4.8]
  ];
  for(let i=0;i<branch.length;i++){
   const [x,y,w]=branch[i];
   addPlatform(platforms,x,y,w,.48,mat,{storyRoute:'lion-path'});
   addCoinLine(items,x-w*.35,y+1.0,Math.max(2,Math.floor(w/1.8)),.8);
  }
  // A safe landing shelf connects the high route back to the main route.
  addPlatform(platforms,88,1.65,7,.5,mat,{storyRoute:'return'});
 }
 // Canyon: two moving stepping stones create a second rhythm layer.
 if(cfg.worldId==='canyon'){
  for(const [x,y,amp,speed] of [[38,2.0,.9,.9],[68,2.45,1.15,1.05],[101,1.9,.8,1.2]]){
   addPlatform(platforms,x,y,4.2,.5,mat,{baseY:y,move:{amp,speed,phase:x*.17}});
   moving.push(platforms.at(-1));
  }
 }
 // Neon: short upper lanes reward confident double-jump chains.
 if(cfg.worldId==='neon'){
  for(const [x,y,w] of [[31,2.0,4.5],[47,2.6,4.2],[64,2.1,4.8],[82,2.8,4.5],[100,2.25,5]]){
   addPlatform(platforms,x,y,w,.45,mat,{storyRoute:'neon-lane'});
   addCoinLine(items,x-w*.3,y+1,w>=4.5?3:2,.85);
  }
 }

 // Story characters are physical scene actors placed on safe platforms.
 for(const id of (cfg.characters||[])){
  const charIndex=id==='tamia'?1:2;
  const base=platforms[Math.min(charIndex,platforms.length-2)];
  npcs.push({
   id,x:base.x,y:base.y+base.h/2+.02,z:.15,
   dialogue:id==='tamia'
    ?(cfg.index===3
      ?'Tamia: Da bist du ja! Der Löwenpilz hat auf dich gewartet. Nimm den hohen Pfad.'
      :'Tamia: Der Wald kennt dich jetzt. Folge den goldenen Spuren.')
    :(cfg.index===4
      ?'Shaya: Halt. Siehst du das Licht? Der sichere Weg liegt über dir.'
      :'Shaya: Zwei Wege, ein Ziel. Wähle den Weg, auf dem du andere schützen kannst.'),
   role:id
  });
 }
 if(cfg.storyBeat)setpieces.push({type:'storyGate',x:cfg.worldId==='forest'?90:cfg.worldId==='canyon'?cfg.length-18:cfg.length-22,y:1.2});

 // Epic landmark beats: visual anchors + optional traversal branches.
 const landmarkX=cfg.worldId==='meadow'?42:
                 cfg.worldId==='forest'?72:
                 cfg.worldId==='canyon'?58:
                 cfg.worldId==='ice'?66:78;
 setpieces.push({type:'landmark',x:landmarkX,y:1.1,variant:cfg.worldId,phase:cfg.index%3});
 if(cfg.worldId==='meadow'){
  for(let i=0;i<5;i++)addPlatform(platforms,58+i*5,2.1+(i%2)*.55,3.2,.42,mat,{storyRoute:'flower-arc'});
 }else if(cfg.worldId==='forest'){
  for(let i=0;i<5;i++)addPlatform(platforms,96+i*4.5,2.7+(i%2)*.65,3.0,.42,mat,{storyRoute:'moon-steps'});
 }else if(cfg.worldId==='ice'){
  for(let i=0;i<5;i++)addPlatform(platforms,46+i*5,2.35+(i%2)*.45,3.1,.42,mat,{storyRoute:'ice-bridge'});
 }else if(cfg.worldId==='neon'){
  for(let i=0;i<6;i++)addPlatform(platforms,54+i*4.2,2.5+(i%3)*.45,2.8,.42,mat,{storyRoute:'pulse-lane'});
 }

 // Coins are placed as readable routes: reward the intended jump arc.
 for(let i=0;i<platforms.length;i++){
  const p=platforms[i];
  const count=Math.min(5,Math.max(2,Math.floor(p.w/2)));
  const start=p.x-(count-1)*.45;
  addCoinLine(items,start,p.y+1.0,count,.9);
 }
 // Story pickups: the golden lion mushrooms return as the central
 // transformation mechanic of the Zauberwald. Each forest level gets one
 // deliberately reachable mushroom; the first one transforms Julia.
 if(cfg.worldId==='forest'){
  const lionRoute=platforms.filter(p=>p.storyRoute==='lion-path');
  const mp=cfg.index===3?(lionRoute.find(p=>p.x>=32)||lionRoute[1]):
           cfg.index===4?(lionRoute.find(p=>p.x>=60)||lionRoute.at(-2)):
           (lionRoute.at(-1)||platforms[5]);
  items.push({
   type:'mushroom',
   x:mp.x,
   y:mp.y+mp.h/2+1.05,
   z:.15,
   story:cfg.index===3?'Der erste Löwenpilz':
         cfg.index===4?'Der zweite Löwenpilz':'Der goldene Löwenpilz',
   transform:true
  });
  setpieces.push({type:'lionMushroomBeacon',x:mp.x,y:mp.y+mp.h/2});
 }

 // Tiny deterministic easter eggs: optional and deliberately off the main line.
 const secretIndex=(cfg.index*3+2)%(Math.max(3,platforms.length-4))+2;
 const secretPlatform=platforms[Math.min(secretIndex,platforms.length-3)];
 items.push({type:'relic',x:secretPlatform.x+(cfg.index%2?-.55:.55),y:secretPlatform.y+2.15,z:0,secret:true});

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
  if(role===3)addEnemy(enemies,'bat',p.x+p.w*.5,p.y+1.42);
  if(role===4)addEnemy(enemies,'turret',p.x+p.w*.7,p.y+1);
  if(role===5){addEnemy(enemies,'slime',p.x-p.w*.2,p.y+1);addEnemy(enemies,'bat',p.x+p.w*.25,p.y+1.7)}
 }
 // Every level gets a minimum number of encounters, but placement stays deterministic.
 const minimum=cfg.questKind==='kills'?10:7;
 let cursor=2;
 while(enemies.length<minimum){
  const p=platforms[cursor++%(platforms.length-2)+1];
  addEnemy(enemies,['slime','runner','bat'][enemies.length%3],p.x,p.y+(enemies.length%3===2?1.42:1));
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

 return {cfg,world,platforms,items,enemies,hazards,goalX:arena.x+6,boss,moving,npcs,setpieces};
}
