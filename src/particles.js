import * as THREE from 'three';
export class Particles{
 constructor(scene){this.scene=scene;this.pool=[]}
 burst(pos,color=0xffffff,count=10,speed=4){
  for(let i=0;i<count;i++){
   const size=.055+Math.random()*.055;const m=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}));
   m.position.copy(pos);m.userData.v=new THREE.Vector3((Math.random()-.5)*speed,Math.random()*speed,(Math.random()-.5)*speed);
   m.userData.life=.3+Math.random()*.5;this.scene.add(m);this.pool.push(m);
  }
 }
 clear(){for(const p of this.pool){this.scene.remove(p);p.material.dispose()}this.pool.length=0}
 update(dt){
  for(let i=this.pool.length-1;i>=0;i--){
   const p=this.pool[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=12*dt;p.scale.multiplyScalar(Math.pow(.12,dt));p.material.opacity=Math.max(0,p.userData.life/.8);
   if(p.userData.life<=0){this.scene.remove(p);p.material.dispose();this.pool.splice(i,1)}
  }
 }
}
