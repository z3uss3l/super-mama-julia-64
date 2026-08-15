export class Progression{
 constructor(state,ui,audio,particles){this.state=state;this.ui=ui;this.audio=audio;this.particles=particles}
 collect(type,player,model){
  if(type==='coin'){this.state.coins++;this.state.save.stats.coins++;this.state.addScore(100);if(this.state.quest.kind==='coins')this.state.quest.progress++;this.audio.coin()}
  else if(type==='crystal'){this.state.addScore(350);this.audio.coin()}
  else if(type==='heart'){this.state.lives=Math.min(5,this.state.lives+1);this.state.addScore(250);this.ui.toast('❤️ Extra-Herz');this.audio.power()}
  else if(type==='mushroom'){
   const wasLion=!!player.lion;
   player.lion=true;
   this.state.unlock('lion');
   this.state.addScore(wasLion?500:1500);
   this.ui.toast(wasLion
    ? '🍄🦁 Löwenpilz gesammelt · Löwenkraft verstärkt!'
    : '🍄🦁 LÖWENVERWANDLUNG! Julia wird zur Löwin.');
   this.audio.power();
   this.particles.burst(model.position,0xffd43b,28,8);
   this.particles.burst(model.position,0xff8a2b,16,5);
  }
  else if(type==='star'){this.state.unlock('starPower');player.star=8;this.state.addScore(750);this.ui.toast('⭐ Sternkraft');this.audio.power()}
  else if(type==='key'){this.state.unlock('dash');this.state.addScore(1000);this.ui.toast('↯ Dash freigeschaltet');this.audio.power()}
  this.state.persist();this.particles.burst(model.position,0xffd43b,12,5);
 }
}
