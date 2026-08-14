export function overlap(a,b){
  return Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2;
}

// Stable feet-based platform solver. Platforms are one-way: Julia lands on
// their top surface while falling, but never gets trapped underneath them.
// A small horizontal tolerance prevents edge jitter on mobile controls.
export function resolvePlayer(player,platforms,dt){
  const previousY=player.y;
  const previousVY=player.vy;
  const support=player.supportPlatform;

  // Carry Julia with a moving platform while she is standing on it.
  if(support&&support.prevY!==undefined&&player.grounded){
    player.y+=support.y-support.prevY;
  }

  const nextX=player.x+player.vx*dt;
  const nextY=player.y+player.vy*dt;
  player.grounded=false;
  player.x=nextX;

  if(previousVY<=0){
    let landing=null;
    let bestTop=-Infinity;

    for(const p of platforms){
      const top=p.y+p.h/2;
      const withinX=Math.abs(player.x-p.x)<=p.w/2+0.32;
      const crossedTop=previousY>=top-0.08&&nextY<=top+0.02;

      if(withinX&&crossedTop&&top>bestTop){
        landing=p;
        bestTop=top;
      }
    }

    if(landing){
      player.y=landing.y+landing.h/2;
      player.vy=0;
      player.grounded=true;
      player.supportPlatform=landing;
      return player;
    }
  }

  player.supportPlatform=null;
  player.y=nextY;
  return player;
}
