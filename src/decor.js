import * as THREE from 'three';

export class Decor{
 constructor(scene,world){
  this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.t=0;
  const far=new THREE.MeshBasicMaterial({color:world.accent,transparent:true,opacity:.12});
  for(let i=0;i<24;i++){
   const g=i%2?new THREE.SphereGeometry(.7+Math.random()*1.3,8,6):new THREE.BoxGeometry(1.5+Math.random()*3,.5+Math.random()*1.5,.2);
   const m=new THREE.Mesh(g,far);m.position.set(i*9-15,3+Math.random()*5,-8-Math.random()*5);this.group.add(m);
  }
 }
 update(dt,x){
  this.t+=dt;
  this.group.position.x=-x*.06+Math.sin(this.t*.15)*.25;
 }
 clear(){this.scene.remove(this.group)}
}
