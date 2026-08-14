export class Progression{
 constructor(state,ui,audio,particles){this.state=state;this.ui=ui;this.audio=audio;this.particles=particles}
 collect(type,player,playerModel){
  if(type==='coin'){this.state.coins++;this.state.addScore(100);if(this.state.quest.kind==='coins')this.state.quest.progress++;this.audio.coin()}
  else if(type==='crystal'){this.state.addScore(350);this.audio.coin()}
  else if(type==='heart'){this.state.lives=Math.min(5,this.state.lives+1);this.state.addScore(250);this.audio.power();this.ui.toast('❤️ Extra-Herz')}
  else if(type==='mushroom'){if(this.state.unlock('doubleJump')){this.audio.power();this.ui.toast('🍄 DOPPELSPRUNG FREIGESCHALTET')}else this.state.addScore(500)}
  else if(type==='star'){player.star=8;this.state.unlock('starPower');this.state.addScore(750);this.audio.power();this.ui.toast('⭐ STERNKRAFT — UNVERWUNDBAR')}
  else if(type==='key'){if(this.state.unlock('dash'))this.ui.toast('🗝️ DASH FREIGESCHALTET');this.state.addScore(1000);this.audio.power()}
  this.state.persist();this.particles.burst(playerModel.position,0xffd43b,12,5);
 }
}
