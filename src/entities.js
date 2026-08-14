import * as THREE from 'three';

export function meshBox(w,h,d,mat){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)}

const M=c=>new THREE.MeshBasicMaterial({color:c});

export function makePlayer(){
 const g=new THREE.Group();
 const body=meshBox(.58,.78,.45,M(0x376bd8));body.position.y=.58;g.add(body);
 const apron=meshBox(.64,.42,.47,M(0xffffff));apron.position.set(0,.5,.24);g.add(apron);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.37,12,10),M(0xf6c7a5));head.position.y=1.23;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.43,12,10),M(0xf4c430));hair.scale.set(1,.96,1.08);hair.position.y=1.31;g.add(hair);
 const bun=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),M(0xf4c430));bun.position.set(-.27,1.5,0);g.add(bun);
 for(const x of[-.12,.12]){const eye=meshBox(.055,.055,.03,M(0x050505));eye.position.set(x,1.22,.35);g.add(eye)}
 for(const x of[-.18,.18]){const foot=meshBox(.16,.42,.18,M(0x29202b));foot.position.set(x,.05,.05);g.add(foot)}
 g.userData.height=1.65;return g;
}

export function makeLion(){
 const g=new THREE.Group(),mane=new THREE.Mesh(new THREE.SphereGeometry(.68,12,10),M(0xff6500));
 mane.scale.set(1,.78,.8);mane.position.y=.72;g.add(mane);
 const body=meshBox(1.08,.62,.72,M(0xe88a18));body.position.y=.62;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.5,12,10),M(0xe88a18));head.position.set(.45,.96,0);g.add(head);
 return g;
}

export function makeEnemy(type,boss=false){
 const g=new THREE.Group(),colors={slime:0x5bc34b,bat:0xff3b43,runner:0x8b5cf6,turret:0xffa21c};
 const mat=M(colors[type]||0xffffff);
 if(type==='turret'){g.add(meshBox(.7,.9,.7,mat));}
 else{
  const b=new THREE.Mesh(new THREE.SphereGeometry(boss?.72:.43,10,8),mat);b.scale.y=.8;g.add(b);
  if(type==='bat'){for(const z of[-.45,.45]){const w=meshBox(.55,.1,.3,mat);w.position.z=z;g.add(w)}}
 }
 if(boss){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.06,8,24),M(0xffd43b));ring.rotation.x=Math.PI/2;ring.position.y=.1;g.add(ring);
 }
 return g;
}
