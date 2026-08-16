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
 shockwave(pos,color=0xffffff,size=1.8,duration=.38){
  if(!pos||!this.scene)return;
  const geo=new THREE.RingGeometry(.08,.16,24);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(geo,mat);
  ring.position.copy(pos);ring.rotation.x=-Math.PI/2;
  ring.userData={ephemeral:true,life:duration,maxLife:duration,start:size};
  this.scene.add(ring);
  this.active.push(ring);
 }
 glow(pos,color=0xffd43b,size=1.0,duration=.34){
  if(!pos||!this.scene)return;
  const geo=new THREE.SphereGeometry(.16,12,8);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false});
  const g=new THREE.Mesh(geo,mat);
  g.position.copy(pos);
  g.userData={ephemeral:true,glow:true,life:duration,maxLife:duration,start:size};
  g.scale.setScalar(.35);
  this.scene.add(g);this.active.push(g);
 }
 trail(pos,color=0xffd43b,count=3){
  if(!pos)return;
  const available=Math.max(0,this.maxActive-this.active.length);
  for(let i=0;i<Math.min(count,available);i++){
   const p=this._acquire(color,.025+Math.random()*.035);
   p.position.set(pos.x+(Math.random()-.5)*.18,pos.y+(Math.random()-.5)*.18,pos.z+(Math.random()-.5)*.12);
   p.userData.v.set((Math.random()-.5)*.5,-.15-Math.random()*.5,(Math.random()-.5)*.25);
   p.userData.life=.14+Math.random()*.12;p.userData.maxLife=p.userData.life;
   this.active.push(p);
  }
 }

 sparkle(pos,color=0xffd43b,count=8,speed=2.8){
  this.burst(pos,color,count,speed);
  if(this.active.length<this.maxActive)this.shockwave(pos,color,1.25,.28);
 }

 update(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  const safeDt=Math.min(dt,.05);
  for(let i=this.active.length-1;i>=0;i--){
   const p=this.active[i],u=p.userData;
   if(u.ephemeral){
    u.life-=safeDt;
    const t=Math.max(0,1-u.life/u.maxLife);
    if(u.glow){
     const s=.35+t*u.start*1.9;
     p.scale.set(s,s,s);
     p.material.opacity=Math.max(0,(1-t)*.72);
     p.rotation.y+=safeDt*2.2;
    }else{
     const s=.35+t*u.start;
     p.scale.set(s,s,s);
     p.material.opacity=Math.max(0,1-t);
     p.rotation.z+=safeDt*2.5;
    }
    if(u.life<=0){
     this.scene.remove(p);p.geometry.dispose();p.material.dispose();
     this.active.splice(i,1);
    }
    continue;
   }
   u.life-=safeDt;
   p.position.addScaledVector(u.v,safeDt);
   u.v.y-=12*safeDt;
   p.rotation.x+=safeDt*(7+u.spin*.2);
   p.rotation.y+=safeDt*(9+u.spin*.35);
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
   if(p.userData?.ephemeral){
    this.scene.remove(p);
    p.geometry?.dispose();p.material?.dispose();
   }else{
    p.visible=false;
    this.pool.push(p);
   }
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
