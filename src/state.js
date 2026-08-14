import {GAME} from './config.js';
const KEY_OLD='smj64-v3';
const defaults=()=>({version:4,level:0,score:0,coins:0,lives:3,secrets:[],bestTimes:{},completedLevels:[],checkpoint:null,unlocks:{doubleJump:false,dash:false,shield:false,starPower:false,lion:false},stats:{kills:0,jumps:0,dashes:0,damage:0,levels:0,bosses:0},settings:{audio:true}});
function normalize(x){const d=defaults();return {...d,...x,version:4,unlocks:{...d.unlocks,...(x?.unlocks||{})},stats:{...d.stats,...(x?.stats||{})},bestTimes:{...d.bestTimes,...(x?.bestTimes||{})},completedLevels:Array.isArray(x?.completedLevels)?x.completedLevels:[],checkpoint:x?.checkpoint||null};}
export function loadSave(){try{let raw=localStorage.getItem(GAME.saveKey);if(!raw)raw=localStorage.getItem(KEY_OLD);if(!raw)return defaults();return normalize(JSON.parse(raw))}catch{return defaults()}}
export function saveGame(s){localStorage.setItem(GAME.saveKey,JSON.stringify(s))}
export function clearSave(){localStorage.removeItem(GAME.saveKey);localStorage.removeItem(KEY_OLD);return defaults()}
export class RuntimeState{
 constructor(){this.save=loadSave();this.resetRun(true)}
 resetRun(fromSave=false){this.level=fromSave?this.save.level:0;this.score=fromSave?this.save.score:0;this.coins=fromSave?this.save.coins:0;this.lives=fromSave?this.save.lives:3;this.combo=0;this.comboTimer=0;this.quest={kind:'',target:0,progress:0,done:false};this.checkpoint=fromSave&&this.save.checkpoint?.level===this.level?this.save.checkpoint:null;this.mode='menu';this.levelStart=0;this.bossDefeated=false}
 persist(){this.save={...this.save,version:4,level:this.level,score:this.score,coins:this.coins,lives:this.lives,checkpoint:this.checkpoint?{...this.checkpoint,level:this.level}:null};saveGame(this.save)}
 newGame(){this.save=defaults();this.resetRun(false);this.persist()}
 unlock(k){if(!this.save.unlocks[k]){this.save.unlocks[k]=true;saveGame(this.save);return true}return false}
 addScore(n){this.score+=n;this.save.score=this.score}
 markLevelComplete(index,time){if(!this.save.completedLevels.includes(index))this.save.completedLevels.push(index);this.save.bestTimes[index]=Math.min(this.save.bestTimes[index]??Infinity,time);this.save.stats.levels=this.save.completedLevels.length}
}
