import {SONGS} from './songs.js';
import {BIRDS} from './birds.js';
export const W=1100,H=650,GROUND=580,START=160,BREATH=3.2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const NOTES=Array.from({length:15},(_,i)=>[ ['ド','レ','ミ','ファ','ソ','ラ','シ'][i%7],261.63*2**(([0,2,4,5,7,9,11][i%7]+12*Math.floor(i/7))/12)]);
export class Player{
 constructor(){this.reset()}
 reset(){Object.assign(this,{x:160,y:420,vx:0,vy:0,rot:0,spin:0,breath:3.2,max_h:0,singing:false,singing_now:false,note_idx:0,t:0,open:0})}
 get distance(){return Math.max(0,(this.x-160)/20)}
 get height(){return (515-this.y)/20}
 launch(angle,charge){let power=300+charge**1.5*1100,a=angle*Math.PI/180;this.vx=Math.cos(a)*power;this.vy=-Math.sin(a)*power;this.spin=rand(-200,200);this.open=1}
 push(angle,dt,boost=1){this.singing=true;let a=angle*Math.PI/180;this.vx+=Math.cos(a)*1250*boost*dt;this.vy-=Math.sin(a)*1250*boost*dt;return Math.atan2(Math.sin(a),-Math.cos(a))}
 sing(n,dt){if(this.breath<=0)return null;this.note_idx=n;this.breath=Math.max(0,this.breath-dt);return this.push(-5+n/14*85,dt)}
 singSong(n,a,dt){this.note_idx=n;return this.push(a,dt,1.4)}
 update(dt){this.t+=dt;this.open=this.singing?.55+.45*Math.abs(Math.sin(this.t*18)):Math.max(0,this.open-dt*4);this.vy+=900*dt;let drag=.00022*Math.hypot(this.vx,this.vy);this.vx-=this.vx*drag*dt;this.vy-=this.vy*drag*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.rot+=this.spin*dt;this.max_h=Math.max(this.max_h,this.height);let event=null;if(this.y>=515){this.y=515;if(this.vy>120){event='bounce';this.vy*=-.45;this.vx*=.78;this.spin=-this.vx*.6}else{this.vy=0;this.vx-=Math.sign(this.vx)*Math.min(Math.abs(this.vx),500*dt);this.spin=-this.vx*.9;if(Math.abs(this.vx)<6&&!this.singing){this.rot=0;event='stop'}}}this.singing=false;return event}
}
export class SongPlayer{
 constructor(){this.stop()}
 get playing(){return this.song!==null}
 get note(){return this.song.notes[this.i][0]}
 get angle(){const s=this.song;return 12+(s.hi===s.lo?.5:(this.note-s.lo)/(s.hi-s.lo))*68}
 get duration(){return this.song.notes[this.i][1]*this.song.beat}
 get gap(){return this.t>this.duration-.09}
 get progress(){return this.song?Math.min(1,this.elapsed/this.song.length):0}
 start(s){if(this.playing)return false;this.song=s;this.i=0;this.t=this.elapsed=0;return true}
 stop(){this.song=null;this.i=0;this.t=this.elapsed=0}
 update(dt){if(!this.song)return false;this.t+=dt;this.elapsed+=dt;while(this.song&&this.t>=this.duration){this.t-=this.duration;if(++this.i>=this.song.notes.length){this.song=null;return false}}return true}
}
export class World{
 constructor(){this.reset()}
 reset(){this.items=[];this.songs=[];let bag=[];for(let x=700;x<60000;x+=rand(350,900))this.items.push({x,y:rand(-250,470),t:rand(0,6),alive:true});for(let x=1400;x<60000;x+=rand(2600,4200)){if(!bag.length){bag=[...SONGS];for(let i=bag.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}this.songs.push({x,song:bag.pop(),t:rand(0,6),ys:[rand(-550,480)],alive:true})}}
 update(dt){for(const it of [...this.items,...this.songs])it.t+=dt}
 collect(p){let got=0;for(const it of this.items)if(it.alive&&Math.abs(it.x-p.x)<55&&Math.abs(it.y+Math.sin(it.t*3)*8-p.y)<60){it.alive=false;p.breath=Math.min(3.2,p.breath+1.12);got++}return got}
 collectSong(p){for(const it of this.songs)if(it.alive&&Math.abs(it.x-p.x)<=72&&it.ys.some((y,i)=>Math.abs(y+Math.sin(it.t*2+i*.7)*10-p.y)<80)){it.alive=false;return it.song}return null}
}
export function birds(t,center=0,radius=2600){let out=[];for(let i=Math.max(0,Math.floor((center-radius)/700));i<Math.floor((center+radius)/700)+1;i++){// First 35 km use the exact Python seeded positions.
 const fallback=n=>{let v=Math.sin(i*7919+17+n)*43758.5453;return v-Math.floor(v)};
 const [x,y,phase]=BIRDS[i]??[800+i*700-120+fallback(0)*240,100+fallback(1)*320,fallback(2)*Math.PI*2];out.push([i,x,y+Math.sin(t*3+phase)*12,phase])}return out}
export function birdHit(p,t){return birds(t,p.x).find(b=>Math.abs(p.x-b[1])<48&&Math.abs(p.y-b[2])<50)?.[0]??null}
