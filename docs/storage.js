let dbPromise;
function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('song-flight-faithful',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function storePhoto(photo){const d=await db();await new Promise((resolve,reject)=>{const t=d.transaction('photos','readwrite');t.objectStore('photos').put(photo);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)})}
export async function getPhotos(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function loadImage(data){const im=new Image();im.src=data;await im.decode();return im}
export function readSetting(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
export function writeSetting(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
