import * as THREE from 'three';
export class FollowCamera{
 constructor(camera){this.camera=camera;this.target=new THREE.Vector3();this.desired=new THREE.Vector3();this.shake=0}
 resize(w,h){this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 kick(amount=.08){this.shake=Math.max(this.shake,amount)}
 follow(x,y,dt){
  this.desired.set(x+4.5,Math.max(3.8,y+3.5),12.5);
  this.camera.position.lerp(this.desired,1-Math.pow(.0008,dt));
  const s=this.shake>0?(Math.random()-.5)*this.shake:0;this.shake=Math.max(0,this.shake-dt*.7);
  this.target.set(x+3.2,y+.8,0);this.camera.lookAt(this.target.x+s,this.target.y+s,0);
 }
}
