import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

export class Decor{
 constructor(scene,world){
  this.scene=scene;this.world=world;this.group=new THREE.Group();scene.add(this.group);this.t=0;
  this.items=[];
  this.fireflies=[];
  this.accentMaterial=new THREE.MeshBasicMaterial({color:world.accent,transparent:true,opacity:.16});
  this.farMaterial=new THREE.MeshBasicMaterial({color:world.ground,transparent:true,opacity:.20});
  const accent=this.accentMaterial,far=this.farMaterial;
  // Layered parallax silhouettes: inexpensive, but gives the world much more depth.
  for(let i=0;i<34;i++){
   const type=i%3;
   const g=type===0
    ?new THREE.SphereGeometry(.45+Math.random()*1.15,8,6)
    :type===1
     ?new THREE.ConeGeometry(.3+Math.random()*.55,1.2+Math.random()*2.2,7)
     :new THREE.BoxGeometry(1.2+Math.random()*2.5,.35+Math.random()*1.4,.2);
   const m=i%4===0?accent:far;
   const mesh=new THREE.Mesh(g,m);
   mesh.position.set(i*7-18,1.8+Math.random()*5,-7-Math.random()*7);
   mesh.rotation.z=Math.random()*Math.PI;
   mesh.userData.phase=Math.random()*6.28;
   this.group.add(mesh);this.items.push(mesh);
  }
  // Tiny emissive fireflies: pooled meshes, capped for mobile performance.
  const glowMat=new THREE.MeshBasicMaterial({color:world.accent,transparent:true,opacity:.85});
  for(let i=0;i<18;i++){
   const m=new THREE.Mesh(new THREE.SphereGeometry(.035+Math.random()*.025,6,6),glowMat);
   m.position.set(i*8-10,1.2+Math.random()*4,-1.5-Math.random()*5);
   m.userData.phase=Math.random()*Math.PI*2;
   this.group.add(m);this.fireflies.push(m);
  }
 }
 update(dt,x){
  this.t+=dt;
  this.group.position.x=-x*.055+Math.sin(this.t*.16)*.25;
  for(const m of this.items){
   m.rotation.y+=dt*.05;
   m.position.y+=Math.sin(this.t*.45+m.userData.phase)*dt*.04;
  }
  for(const m of this.fireflies){
   m.position.y+=Math.sin(this.t*1.7+m.userData.phase)*dt*.08;
   const pulse=.45+.55*(.5+.5*Math.sin(this.t*3.4+m.userData.phase));
   m.material.opacity=.35+pulse*.55;
  }
 }
 clear(){
  this.scene.remove(this.group);
  for(const mesh of this.items){
   mesh.geometry?.dispose?.();
  }
  this.items.length=0;
  this.fireflies.length=0;
  // accent/far are shared materials created by this Decor instance.
  this.group.traverse?.(node=>{
   const materials=Array.isArray(node.material)?node.material:[node.material];
   for(const mat of materials)if(mat?.dispose)mat.dispose();
  });
  this.group.clear?.();
}
}
