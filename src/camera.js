import * as THREE from 'three';
export class FollowCamera{constructor(camera){this.camera=camera;this.target=new THREE.Vector3();this.desired=new THREE.Vector3()}resize(w,h){this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}follow(x,y,dt){this.desired.set(x+4,4.2,11);this.camera.position.lerp(this.desired,1-Math.pow(.001,dt));this.target.set(x+3,1,0);this.camera.lookAt(this.target)}}
