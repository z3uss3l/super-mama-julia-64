import * as THREE from 'three';
import {LEVELS,WORLDS,BOSS_STATS} from './config.js';

const mats={
  grass:new THREE.MeshBasicMaterial({color:0x4e8b4a}),
  rock:new THREE.MeshBasicMaterial({color:0x777b88}),
  ice:new THREE.MeshBasicMaterial({color:0xa8e6ff}),
  neon:new THREE.MeshBasicMaterial({color:0x25215a})
};

export function buildLevel(index){
  const cfg=LEVELS[index],world=WORLDS[cfg.world],platforms=[],items=[],enemies=[],hazards=[],moving=[];
  const mat=world.id==='ice'?mats.ice:world.id==='neon'?mats.neon:world.id==='canyon'?mats.rock:mats.grass;

  platforms.push({x:0,y:-.45,w:18,h:.8,d:5,mat});
  let x=8,currentY=.15,seed=(index+1)*991;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};

  while(x<cfg.length-12){
    // Keep procedural jumps inside Julia's reliable movement envelope.
    const gap=.75+rnd()*1.15,width=4.2+rnd()*4.0;
    const deltaY=-.35+rnd()*1.0;
    currentY=Math.max(-.05,Math.min(1.55,currentY+deltaY));

    const px=x+gap,p={x:px,y:currentY,w:width,h:.6,d:4,mat};
    if(rnd()<.16){
      p.baseY=currentY;
      p.move={axis:'y',amp:.45+rnd()*.35,speed:.65+rnd()*.55,phase:rnd()*6};
      moving.push(p);
    }
    platforms.push(p);

    items.push({type:'coin',x:px+width*.28,y:currentY+1,z:0});
    if(rnd()<.65)items.push({type:'coin',x:px+width*.55,y:currentY+1,z:0});
    if(rnd()<.35)items.push({type:'crystal',x:px+width*.78,y:currentY+1.05,z:0});
    if(rnd()<.13)items.push({type:'heart',x:px+width*.5,y:currentY+1.05,z:0});
    if(rnd()<.58){
      const type=['slime','bat','runner','turret'][Math.floor(rnd()*4)];
      enemies.push({type,x:px+width*.58,y:currentY+1,z:0});
    }
    x=px+width;
  }

  // Guaranteed final arena: goal and boss always have solid ground.
  const arenaY=Math.max(.05,Math.min(1.2,currentY));
  const arena={x:cfg.length-8,y:arenaY,w:14,h:.8,d:5,mat,baseY:arenaY};
  platforms.push(arena);

  const last=arena;
  const place=(type,ratio,extra=1.05)=>{
    const p=platforms[Math.max(1,Math.floor((platforms.length-1)*ratio))]||last;
    items.push({type,x:p.x+p.w*.5,y:p.y+extra,z:0});
  };

  // Guaranteed progression pickups and quest budget.
  while(items.filter(i=>i.type==='coin').length<14){
    const p=platforms[1+(items.length%Math.max(1,platforms.length-1))];
    items.push({type:'coin',x:p.x+p.w*.35,y:p.y+1,z:0});
  }

  while(enemies.length<Math.max(7,cfg.questKind==='kills'?8:6)){
    const p=platforms[2+(enemies.length%Math.max(1,platforms.length-2))];
    enemies.push({
      type:['slime','runner','bat'][enemies.length%3],
      x:p.x+p.w*.65,
      y:p.y+1,
      z:0
    });
  }

  place('star',.72);
  if(index%3===0)place('mushroom',.55);
  place('key',.84);

  for(let i=0;i<platforms.length-1;i++){
    const a=platforms[i],b=platforms[i+1];
    const gapCenter=(a.x+a.w/2+b.x-b.w/2)/2;
    const gapWidth=Math.max(0,b.x-b.w/2-(a.x+a.w/2));
    if(gapWidth>.9)hazards.push({x:gapCenter,y:-.45,w:gapWidth,h:.5});
  }

  const boss=cfg.boss?{
    x:arena.x+2,
    y:arena.y+1.8,
    kind:world.id,
    stats:BOSS_STATS[world.id]||{name:'Waldwächter',hp:10,speed:2.2,projectile:3}
  }:null;

  return {
    cfg,world,platforms,items,enemies,hazards,
    goalX:arena.x+5,
    boss,moving
  };
}
