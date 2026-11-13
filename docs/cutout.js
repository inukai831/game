export const FACE_OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
let tasksPromise;
async function tasks(){
 if(!tasksPromise)tasksPromise=(async()=>{
  const {FilesetResolver,FaceLandmarker,ImageSegmenter}=await import('./vendor/vision_bundle.mjs');
  const vision=await FilesetResolver.forVisionTasks(new URL('./vendor/wasm',import.meta.url).href);
  const detector=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('./models/face_landmarker.task',import.meta.url).href,delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.5,minFacePresenceConfidence:.5});
  try{const segmenter=await ImageSegmenter.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('./models/hair_segmenter.tflite',import.meta.url).href,delegate:'CPU'},runningMode:'IMAGE',outputCategoryMask:true,outputConfidenceMasks:false});return {detector,segmenter}}catch(e){detector.close();throw e}
 })().catch(e=>{tasksPromise=null;throw new Error('MediaPipeを準備できませんでした。ページをHTTP/HTTPSで開いているか確認し、もう一度お試しください。',{cause:e})});
 return tasksPromise;
}
export function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
export function fillHoles(alpha,w,h){
 // Exterior flood fill equals the padded PIL flood fill used in head_cutout.py.
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=i=>{if(!seen[i]&&alpha[i]<=127){seen[i]=1;queue[tail++]=i}};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
 while(head<tail){let i=queue[head++],x=i%w;if(x>0)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i<w*(h-1))visit(i+w)}
 const out=alpha.slice();for(let i=0;i<out.length;i++)if(alpha[i]<=127&&!seen[i])out[i]=255;return out;
}
export async function extractHead(source){
 const {detector,segmenter}=await tasks();
 const w=source.width,h=source.height;
 const rgb=canvas(w,h),rg=rgb.getContext('2d');rg.fillStyle='white';rg.fillRect(0,0,w,h);rg.drawImage(source,0,0);
 const result=detector.detect(rgb);if(!result.faceLandmarks.length)throw new Error('顔が見つかりませんでした。顔が明るく、大きく写っている画像で試してください。');if(result.faceLandmarks.length>1)throw new Error('複数の顔が検出されました。1人だけ写った画像を使用してください。');
 const lm=result.faceLandmarks[0],large=canvas(w*2,h*2),lg=large.getContext('2d');lg.fillStyle='white';lg.beginPath();FACE_OVAL.forEach((i,j)=>{let p=lm[i];j?lg.lineTo(Math.round(p.x*w*2),Math.round(p.y*h*2)):lg.moveTo(Math.round(p.x*w*2),Math.round(p.y*h*2))});lg.closePath();lg.fill();
 const mask=canvas(w,h),mg=mask.getContext('2d',{willReadFrequently:true});mg.drawImage(large,0,0,w,h);const fa=mg.getImageData(0,0,w,h).data;
 let hair,mw,mh;
 segmenter.segment(rgb,r=>{if(!r.categoryMask)throw new Error('髪の検出結果を取得できませんでした。');mw=r.categoryMask.width;mh=r.categoryMask.height;hair=r.categoryMask.getAsUint8Array().slice()});
 let alpha=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;alpha[i]=Math.max(fa[i*4+3],hair[Math.min(mh-1,Math.floor(y*mh/h))*mw+Math.min(mw-1,Math.floor(x*mw/w))]===1?255:0)}alpha=fillHoles(alpha,w,h);
 const out=canvas(w,h),g=out.getContext('2d',{willReadFrequently:true});g.drawImage(source,0,0);const pixels=g.getImageData(0,0,w,h);let left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;const a=Math.floor(alpha[i]*pixels.data[i*4+3]/255);pixels.data[i*4+3]=a;if(a){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}}
 if(right<left)throw new Error('切り抜く領域が見つかりませんでした。');g.putImageData(pixels,0,0);const head=canvas(right-left+1,bottom-top+1);head.getContext('2d').drawImage(out,left,top,head.width,head.height,0,0,head.width,head.height);
 const seam=[[61,61],[81,178],[13,14],[311,402],[291,291]].map(([a,b])=>[(lm[a].x+lm[b].x)*w/2-left,(lm[a].y+lm[b].y)*h/2-top]);
 return {head,seam};
}
