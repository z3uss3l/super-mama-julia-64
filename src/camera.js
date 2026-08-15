import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
export class FollowCamera{
 constructor(camera){this.camera=camera;this.target=new THREE.Vector3();this.desired=new THREE.Vector3();this.shake=0;this.lookAhead=0;this.zoom=0}
 resize(w,h){this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 kick(amount=.08){this.shake=Math.max(this.shake,amount)}
 follow(x,y,dt,vx=0,vy=0){
  const lead=THREE.MathUtils.clamp(vx*.22,-2.2,2.2);
  const vertical=THREE.MathUtils.clamp(vy*.06,-.7,.7);
  this.lookAhead += (lead-this.lookAhead)*(1-Math.exp(-5*dt));
  this.desired.set(x+4.5+this.lookAhead,Math.max(3.8,y+3.5+vertical),12.5);
  this.camera.position.lerp(this.desired,1-Math.pow(.0008,dt));
  const s=this.shake>0?(Math.random()-.5)*this.shake:0;this.shake=Math.max(0,this.shake-dt*.7);
  const speed=Math.min(1,Math.abs(vx)/8.6);
  const targetFov=58+speed*4+(Math.abs(vy)>6?1.5:0);
  const nextFov=this.camera.fov+(targetFov-this.camera.fov)*(1-Math.exp(-4*dt));
  if(Math.abs(nextFov-this.camera.fov)>0.01){
   this.camera.fov=nextFov;
   this.camera.updateProjectionMatrix();
  }
  this.target.set(x+3.2+this.lookAhead*.35,y+.8+vertical*.2,0);
  this.camera.lookAt(this.target.x+s,this.target.y+s,0);
 }
}
