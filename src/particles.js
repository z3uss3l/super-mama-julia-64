import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

export class Particles{
 constructor(scene){
  this.scene=scene;
  this.pool=[];
  this.active=[];
  this.geometry=new THREE.BoxGeometry(1,1,1);
  this.maxActive=180;
 }
 _acquire(color,size){
  let p=this.pool.pop();
  if(!p){
   p=new THREE.Mesh(
    this.geometry,
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95})
   );
   p.userData.v=new THREE.Vector3();
   this.scene.add(p);
  }
  p.visible=true;
  p.material.color.setHex(color);
  p.material.opacity=.95;
  p.scale.setScalar(size);
  p.userData.baseSize=size;
  p.userData.life=.55;
  p.userData.maxLife=.55;
  return p;
 }
 burst(pos,color=0xffffff,count=10,speed=4){
  if(!pos||!this.scene||count<=0)return;
  const available=Math.max(0,this.maxActive-this.active.length);
  const n=Math.min(count,available);
  for(let i=0;i<n;i++){
   const size=.055+Math.random()*.055;
   const p=this._acquire(color,size);
   p.position.copy(pos);
   p.userData.v.set(
    (Math.random()-.5)*speed,
    Math.random()*speed,
    (Math.random()-.5)*speed
   );
   p.userData.life=.3+Math.random()*.5;
   p.userData.maxLife=p.userData.life;
   this.active.push(p);
  }
 }
 update(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  const safeDt=Math.min(dt,.05);
  for(let i=this.active.length-1;i>=0;i--){
   const p=this.active[i],u=p.userData;
   u.life-=safeDt;
   p.position.addScaledVector(u.v,safeDt);
   u.v.y-=12*safeDt;
   p.rotation.x+=safeDt*7;
   p.rotation.y+=safeDt*9;
   const alpha=Math.max(0,u.life/u.maxLife);
   p.material.opacity=alpha;
   // Never derive the next frame's size from the already-scaled mesh.
   // The previous implementation compounded the scale every frame.
   p.scale.setScalar(Math.max(.01,alpha)*u.baseSize);
   if(u.life<=0){
    p.visible=false;
    this.pool.push(p);
    this.active.splice(i,1);
   }
  }
 }
 clear(){
  for(const p of this.active){
   p.visible=false;
   this.pool.push(p);
  }
  this.active.length=0;
 }
 dispose(){
  this.clear();
  for(const p of this.pool)p.material.dispose();
  this.pool.length=0;
  this.geometry.dispose();
 }
}
