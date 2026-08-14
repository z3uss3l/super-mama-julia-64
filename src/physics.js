function moveAxis(player,dt){
 if(player.dash>0)return;
 const max=player.maxSpeed??8.6;
 const target=player.inputAxis*max;
 const accel=player.grounded?(player.accel??42):(player.airAccel??27);
 const friction=player.grounded?(player.friction??34):(player.airFriction??4.5);
 if(Math.abs(target)>0.001)player.vx+=Math.sign(target)*Math.min(Math.abs(target-player.vx),accel*dt);
 else player.vx-=Math.sign(player.vx)*Math.min(Math.abs(player.vx),friction*dt);
 player.vx=Math.max(-max,Math.min(max,player.vx));
}

function step(player,platforms,dt){
 const prevY=player.y,prevVy=player.vy;
 if(player.supportPlatform&&player.grounded&&player.supportPlatform.prevY!==undefined)player.y+=player.supportPlatform.y-player.supportPlatform.prevY;
 player.grounded=false;
 moveAxis(player,dt);
 player.x+=player.vx*dt;
 const nextY=player.y+player.vy*dt;
 if(prevVy<=0){
  let landing=null,best=-Infinity;
  for(const p of platforms){
   const top=p.y+p.h/2;
   const within=Math.abs(player.x-p.x)<=p.w/2+.28;
   const crossed=prevY>=top-.18&&nextY<=top+.08;
   if(within&&crossed&&top>best){landing=p;best=top;}
  }
  if(landing){
   const wasAir=!player.grounded;
   player.y=landing.y+landing.h/2;player.vy=0;player.grounded=true;player.supportPlatform=landing;player.jumps=0;
   return {landed:wasAir};
  }
 }
 player.supportPlatform=null;
 player.y=nextY;
 return {landed:false};
}

export function resolvePlayer(player,platforms,dt){
 const steps=Math.max(1,Math.ceil(dt/.008));
 let landed=false;
 for(let i=0;i<steps;i++){
  const r=step(player,platforms,dt/steps);landed=landed||r.landed;
 }
 return {landed};
}
