export const GAME={name:'Super Mama Julia 64',version:'3.3.2',saveKey:'smj64-v3',gravity:-25,playerSpeed:8,jumpSpeed:10,dashSpeed:19,maxLives:5};
export const WORLDS=[
 {id:'meadow',name:'Blumenhain',sky:0x8fd3ff,ground:0x4e8b4a,accent:0xffd43b,levels:3},
 {id:'forest',name:'Zauberwald',sky:0x142b24,ground:0x315b3c,accent:0x75e06b,levels:3},
 {id:'canyon',name:'Glut-Canyon',sky:0x35150e,ground:0x8b4e2e,accent:0xff6a00,levels:3},
 {id:'ice',name:'Eispalast',sky:0x9bdcff,ground:0x6aa9c9,accent:0xbff5ff,levels:3},
 {id:'neon',name:'Neonfabrik',sky:0x100a2b,ground:0x25215a,accent:0xff3bd4,levels:3},
];
export const LEVELS=WORLDS.flatMap((w,wi)=>Array.from({length:w.levels},(_,li)=>({
 id:wi*3+li,name:`${w.name} ${li+1}`,world:wi,worldId:w.id,index:wi*3+li,
 length:105+li*18+wi*8,difficulty:1+wi*1.5+li*.5,
 quest:li===0?'Sammle 12 Münzen':li===1?'Besiege 6 Gegner':'Erreiche das Ziel mit mindestens 1 Herz',
 boss:li===2,unlock:wi*3+li,
}))); 
export const ENEMY_STATS={slime:{hp:1,speed:1.8,damage:1,value:100},bat:{hp:1,speed:3.1,damage:1,value:150},runner:{hp:2,speed:4.8,damage:1,value:220},turret:{hp:3,speed:0,damage:1,value:300}};
export const BOSS_STATS={forest:{name:'Waldkönig',hp:12,speed:2.2,projectile:2.8},canyon:{name:'Lavakönigin',hp:16,speed:2.7,projectile:3.5},neon:{name:'Mama Prime',hp:22,speed:3.2,projectile:4.2}};
