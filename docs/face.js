import {canvas} from './cutout.js';
import {clamp} from './core.js';
function ellipse(g,x,y,w,h,c){g.fillStyle=c;g.beginPath();g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);g.fill()}
export function defaultFace(){const c=canvas(110,130),g=c.getContext('2d');ellipse(g,0,0,110,130,'#ffd6aa');ellipse(g,8,0,94,40,'#3c281e');for(const x of [35,75]){ellipse(g,x-11,48,22,16,'white');ellipse(g,x-6,50,12,12,'#1e1e1e')}g.strokeStyle='#c88c6e';g.lineWidth=3;g.beginPath();g.moveTo(55,62);g.lineTo(51,80);g.stroke();ellipse(g,14,76,18,9,'#ff9696');ellipse(g,78,76,18,9,'#ff9696');g.strokeStyle='#963232';g.lineWidth=4;g.beginPath();g.moveTo(38,96);g.lineTo(72,96);g.stroke();return c}
export class PhotoFace{
 constructor(){this.src=defaultFace();this.seam=[];this.name='';this.id=null;this.zoom=1;this.ox=this.oy=this.mouth_offset=0}
 clone(){return Object.assign(new PhotoFace(),this)}
 reset(){this.zoom=1;this.ox=this.oy=this.mouth_offset=0}
 clamp(){this.zoom=clamp(this.zoom,1,4);let s=Math.min(110/this.src.width,130/this.src.height)*this.zoom,mx=Math.max(0,(this.src.width*s-110)/220),my=Math.max(0,(this.src.height*s-130)/260);this.ox=clamp(this.ox,-mx,mx);this.oy=clamp(this.oy,-my,my);this.mouth_offset=clamp(this.mouth_offset,-.7,.25)}
 build(factor=2){this.clamp();const w=Math.floor(110*factor),h=Math.floor(130*factor),out=canvas(w,h),g=out.getContext('2d');const s=Math.min(w/this.src.width,h/this.src.height)*this.zoom,sw=Math.max(1,Math.floor(this.src.width*s)),sh=Math.max(1,Math.floor(this.src.height*s)),x=Math.trunc((w-sw)/2+this.ox*w),y=Math.trunc((h-sh)/2+this.oy*h);g.drawImage(this.src,x,y,sw,sh);const lips=this.seam.map(([a,b])=>[(x+a*sw/this.src.width)/w,(y+b*sh/this.src.height)/h+this.mouth_offset]);return new Face(out,lips,lips.length?lips[2][1]:.74+this.mouth_offset)}
 settings(){return {id:this.id,zoom:this.zoom,ox:this.ox,oy:this.oy,mouth_offset:this.mouth_offset}}
}
export class Face{
 constructor(src,lips=[],mouth=.74){this.src=src;this.lips=lips;this.mouth=mouth;this.out=canvas(src.width,src.height+Math.ceil(src.height*.34));this.open=0}
 render(open){this.open=open;const w=this.src.width,h=this.src.height,g=this.out.getContext('2d');g.clearRect(0,0,this.out.width,this.out.height);
 if(this.lips.length){g.drawImage(this.src,0,0);if(open<=0)return this.out;const points=this.lips.map(([x,y])=>[x*w,y*h]).sort((a,b)=>a[0]-b[0]);const left=points[0][0],span=points.at(-1)[0]-left;if(span<2)return this.out;
 for(let j=0;j<points.length-1;j++){const [x0,y0]=points[j],[x1,y1]=points[j+1];for(let x=Math.max(0,Math.ceil(x0));x<Math.min(w,Math.ceil(x1));x++){const y=Math.round(y0+(y1-y0)*(x-x0)/(x1-x0));if(y<0||y>=h)continue;const ud=Math.min(y,Math.max(2,Math.round(span*.46))),ld=Math.min(h-y,Math.max(2,Math.round(span*.92))),opening=Math.sin(Math.PI*(x-left)/span)*open,lift=Math.min(Math.max(0,ud-1),Math.round(span*.28*opening)),drop=Math.min(ld-1,Math.round(span*.68*opening));if(lift){g.clearRect(x,y-ud,1,ud);g.drawImage(this.src,x,y-ud,1,ud,x,y-ud,1,ud-lift)}if(drop){g.clearRect(x,y,1,ld);g.drawImage(this.src,x,y,1,ld,x,y+drop,1,ld-drop)}if(lift||drop){g.fillStyle='#5a0a14';g.fillRect(x,y-lift,1,lift+drop)}}}return this.out}
 const my=clamp(Math.floor(h*this.mouth),0,h),gap=Math.floor(open*h*.34);if(gap>0){ellipse(g,w*.31,my-6,w*.38,gap+12,'#5a0a14');ellipse(g,w*.405,my+gap-2,w*.19,8,'#dc505a')}if(my>0)g.drawImage(this.src,0,0,w,my,0,0,w,my);if(my<h)g.drawImage(this.src,0,my,w,h-my,0,my+gap,w,h-my);return this.out;
 }
 get renderedHeight(){return this.lips.length?this.src.height:this.src.height+Math.floor(this.open*this.src.height*.34)}
}
