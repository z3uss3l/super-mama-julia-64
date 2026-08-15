export const GAME={
  name:'Super Mama Julia 64',
  version:'7.1.1',
  saveKey:'smj64-v5',
  gravity:-27,
  playerSpeed:8.6,
  playerAccel:42,
  playerAirAccel:27,
  playerFriction:34,
  playerAirFriction:4.5,
  jumpSpeed:11.2,
  dashSpeed:20,
  maxLives:5,
  comboWindow:2.75,
  levelWidth:150
};

export const WORLDS=[
 {id:'meadow',name:'Blumenhain',sky:0x83cfff,ground:0x4d8f4a,accent:0xffd43b,fog:0xb8e7ff},
 {id:'forest',name:'Zauberwald',sky:0x12291f,ground:0x315b3c,accent:0x78e36b,fog:0x315b3c},
 {id:'canyon',name:'Glut-Canyon',sky:0x34150d,ground:0x8d4b2b,accent:0xff7424,fog:0x7b2d1d},
 {id:'ice',name:'Eispalast',sky:0x9edfff,ground:0x69a9c9,accent:0xc8f7ff,fog:0xd5f5ff},
 {id:'neon',name:'Neonfabrik',sky:0x0c0922,ground:0x27205d,accent:0xff4be1,fog:0x30276b}
];


export const STORY=[
 {chapter:'PROLOG — Der Ruf des Löwen',intro:'Julia findet im Blumenhain eine Spur aus goldenen Pfoten. Jemand ruft aus dem Zauberwald.',outro:'Die Spur führt tiefer in den Wald.'},
 {chapter:'I — Der Zauberwald',intro:'Im Zauberwald entdeckt Julia geheimnisvolle Löwenpilze. Einer pulsiert wie ein kleines Herz.',outro:'Julia spürt: Der Löwe ist kein Kostüm. Er gehört zu ihr.'},
 {chapter:'II — Die Pilzprüfung',intro:'Die Waldwesen testen Julia. Zwischen Wurzeln und Nebel liegen weitere Pilze verborgen.',outro:'Der Löwengeist zeigt Julia den Weg zum Feuer.'},
 {chapter:'III — Glut-Canyon',intro:'Die Spur führt in eine Welt aus Lava und Maschinen. Nur die Löwenkraft öffnet den sicheren Weg.',outro:'Hinter der Lava wartet das Eis.'},
 {chapter:'IV — Eispalast',intro:'Im Eis findet Julia Pfotenabdrücke und ein Medaillon mit demselben Symbol wie ihr Pilz.',outro:'Das Medaillon zeigt den Weg zur Neonfabrik.'},
 {chapter:'V — Neonfabrik',intro:'Die Fabrik produziert künstliche Kopien der Löwenkraft. Mama Prime will Julias Kraft kontrollieren.',outro:'Mama Prime flieht mit einem Fragment des Löwensiegels.'},
 {chapter:'VI — Das Löwensiegel',intro:'Julia folgt dem Fragment. Die Pilze sind Teile eines uralten Schutzrituals.',outro:'Nur noch das Herzstück fehlt.'},
 {chapter:'VII — Die letzte Spur',intro:'Am Rand der Fabrik findet Julia vier kleine Pfoten neben ihren eigenen.',outro:'Sie versteht: Stärke bedeutet Schutz.'},
 {chapter:'VIII — Mama Prime',intro:'Die künstliche Löwenkraft erwacht. Mama Prime stellt sich Julia ein letztes Mal entgegen.',outro:'Das Siegel ist fast vollständig.'},
 {chapter:'EPILOG — Super Mama',intro:'Julia setzt das Siegel ein. Der Löwengeist bleibt an ihrer Seite.',outro:'Die Welten sind gerettet. Und irgendwo wächst bereits der nächste goldene Pilz.'}
];

export const LEVELS=WORLDS.flatMap((w,wi)=>Array.from({length:3},(_,li)=>({
 id:wi*3+li,
 name:`${w.name} ${li+1}`,
 world:wi,
 worldId:w.id,
 index:wi*3+li,
 length:145+li*18+wi*10,
 difficulty:1+wi*1.5+li*.7,
 questKind:li===0?'coins':li===1?'kills':'heart',
 questTarget:li===0?14:li===1?8:1,
 story:STORY[Math.min(STORY.length-1,wi*2+li%2)],
 quest:li===0?'Sammle 14 Münzen':li===1?'Besiege 8 Gegner':'Behalte mindestens 1 Herz',
 boss:li===2
})));

export const ENEMY_STATS={
 slime:{hp:1,speed:1.7,value:100,aggro:7,contactRange:.55,contactHeight:.78},
 bat:{hp:1,speed:3.2,value:160,aggro:9,contactRange:.64,contactHeight:1.0},
 runner:{hp:2,speed:4.4,value:220,aggro:9.5,contactRange:.64,contactHeight:.9},
 turret:{hp:3,speed:0,value:300,aggro:11,fireRate:.8,contactRange:.52,contactHeight:.82}
};

export const BOSS_STATS={
 forest:{name:'Waldkönig',hp:14,speed:2.4,aggro:13,projectile:4},
 canyon:{name:'Lavakönigin',hp:18,speed:2.7,aggro:14,projectile:4.6},
 neon:{name:'Mama Prime',hp:24,speed:3.1,aggro:16,projectile:5.2}
};
