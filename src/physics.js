export function resolvePlayer(player,platforms,dt){
 const prevY=player.y,prevVy=player.vy;
 if(player.supportPlatform&&player.grounded&&player.supportPlatform.prevY!==undefined)
  player.y+=player.supportPlatform.y-player.supportPlatform.prevY;
 player.grounded=false;
 player.x+=player.vx*dt;
 const nextY=player.y+player.vy*dt;
 if(prevVy<=0){
  let landing=null,best=-Infinity;
  for(const p of platforms){
   const top=p.y+p.h/2;
   const within=Math.abs(player.x-p.x)<=p.w/2+.28;
   const crossed=prevY>=top-.1&&nextY<=top+.06;
   if(within&&crossed&&top>best){landing=p;best=top}
  }
  if(landing){
   player.y=landing.y+landing.h/2;player.vy=0;player.grounded=true;player.supportPlatform=landing;player.jumps=0;return;
  }
 }
 player.supportPlatform=null;player.y=nextY;
}
