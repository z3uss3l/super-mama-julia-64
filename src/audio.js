export class AudioManager{
 constructor(){this.ctx=null;this.enabled=true;this.master=.035}
 init(){if(!this.ctx)this.ctx=new AudioContext();if(this.ctx.state==='suspended')this.ctx.resume()}
 setEnabled(v){this.enabled=v}
 tone(freq,dur=.08,type='square',gain=this.master){
  if(!this.enabled)return;this.init();
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g).connect(this.ctx.destination);
  g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+dur);
  o.start();o.stop(this.ctx.currentTime+dur);
 }
 jump(){this.tone(520,.08,'square')}
 coin(){this.tone(880,.05,'triangle');setTimeout(()=>this.tone(1320,.06,'triangle'),35)}
 hit(){this.tone(100,.1,'sawtooth',.05)}
 dash(){this.tone(220,.1,'sawtooth')}
 power(){this.tone(660,.1,'triangle');setTimeout(()=>this.tone(990,.14,'triangle'),60)}
 boss(){this.tone(70,.24,'sawtooth',.06)}
 win(){this.tone(523,.12,'triangle');setTimeout(()=>this.tone(659,.12,'triangle'),100);setTimeout(()=>this.tone(784,.2,'triangle'),200)}
}
