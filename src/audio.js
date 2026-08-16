export class AudioManager{
 constructor(){this.ctx=null;this.enabled=true;this.master=.035;this.noiseBuffer=null}
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
 land(){this.tone(115,.055,'sine',.035);setTimeout(()=>this.tone(175,.07,'triangle',.025),35)}
 stomp(){this.tone(92,.065,'square',.05);setTimeout(()=>this.tone(184,.09,'triangle',.04),35)}
 secret(){this.tone(740,.08,'sine',.04);setTimeout(()=>this.tone(988,.10,'sine',.045),70);setTimeout(()=>this.tone(1480,.16,'triangle',.05),150)}
 combo(){this.tone(440,.055,'triangle',.025);setTimeout(()=>this.tone(660,.07,'triangle',.03),45)}
 transform(){this.tone(220,.12,'sine',.035);setTimeout(()=>this.tone(440,.15,'triangle',.045),100);setTimeout(()=>this.tone(880,.28,'sine',.055),230)}
 cinematic(){
  this.tone(392,.10,'triangle',.045);
  setTimeout(()=>this.tone(523,.12,'triangle',.05),90);
  setTimeout(()=>this.tone(784,.22,'sine',.055),210);
 }
 alliance(){
  this.tone(330,.12,'triangle',.045);
  setTimeout(()=>this.tone(494,.12,'triangle',.045),100);
  setTimeout(()=>this.tone(659,.16,'triangle',.05),220);
  setTimeout(()=>this.tone(988,.26,'sine',.055),380);
 }
 boss(){this.tone(70,.24,'sawtooth',.06)}
 win(){this.tone(523,.12,'triangle');setTimeout(()=>this.tone(659,.12,'triangle'),100);setTimeout(()=>this.tone(784,.2,'triangle'),200)}
}
