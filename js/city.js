// Konbini Empire v3 – Stadt aus Yukis Stadtplan: Boden, Gebäude (ein Atlas, 1 Draw Call), integrierte Läden, Bäume
import * as THREE from '../lib/three.module.min.js';
import {PLAN,N,F,W0,cellAt,wx,wz,isRoad,FEATURES,LM_BLOCKS,SHOPS,FLOOR_H,LANDMARK_AREAS,TOWERS} from './plan.js';

import {STIL5,drawGround,makeKit,Bins,seeded as seeded5,parkPathAt} from './stil5.js';
const TEX='grafik/texturen/';
const imgCache=new Map();
export function loadImg(url){if(imgCache.has(url))return imgCache.get(url);const p=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});imgCache.set(url,p);return p;}
const svgText=new Map();
function getSvg(url){if(!svgText.has(url))svgText.set(url,fetch(url).then(r=>r.text()));return svgText.get(url);}
function svgToImg(txt){return loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(txt));}
function seeded(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647;}

/* ---------- Gebäudetypen: Fassaden-Kachel im Atlas + Stockwerke pro Kachel ---------- */
export const BTYPES=['buero-glas','buero-beton','wohnhaus-mansion','geschaeftshaus-neon','altbau-holz','mittelhaus-fliesen','kleinhaus-putz','apaato-holz','kleinhaus-laden'];
const FLOORS_PER_TILE={'buero-glas':8,'buero-beton':8,'wohnhaus-mansion':6,'geschaeftshaus-neon':6,'altbau-holz':4,'mittelhaus-fliesen':8,'kleinhaus-putz':2,'apaato-holz':2,'kleinhaus-laden':2};
const ATLAS_FILES=[...BTYPES,'dach-flach','dach-ziegel','gruen-rasen','dach-flach-technik'];// Kacheln 0..12 im 4×4-Atlas
const FALLBACK=['#7FB2DA','#B9BDC3','#EFE9DC','#3B3F5C','#7A5236','#B5785A','#F3E3CF','#9A6B45','#F1B48F','#A9A9A4','#8C5A4A','#9BD37E','#A9A9A4'];
function atlasTexture(){
 const S=1024,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
 ATLAS_FILES.forEach((f,i)=>{g.fillStyle=FALLBACK[i];g.fillRect((i%4)*256,Math.floor(i/4)*256,256,256);});
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 Promise.all(ATLAS_FILES.map(f=>loadImg(TEX+f+'.svg').catch(()=>null))).then(imgs=>{imgs.forEach((im,i)=>{if(im)g.drawImage(im,(i%4)*256,Math.floor(i/4)*256,256,256);});t.needsUpdate=true;});
 return t;
}
// Material mit Kachel-Wiederholung innerhalb des Atlas (fract + textureGrad gegen Nähte)
function atlasMaterial(map){
 const m=new THREE.MeshLambertMaterial({map});
 m.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 tile;\nvarying vec2 vTile;').replace('#include <uv_vertex>','#include <uv_vertex>\nvTile=tile;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vTile;').replace('#include <map_fragment>',
  `#ifdef USE_MAP
   vec2 tuv=vTile+(fract(vMapUv)*0.96+0.02)*0.25;
   vec4 sampledDiffuseColor=textureGrad(map,tuv,dFdx(vMapUv)*0.24,dFdy(vMapUv)*0.24);
   diffuseColor*=sampledDiffuseColor;
  #endif`);
 };
 return m;
}
const tileOf=i=>[(i%4)*.25,1-.25-Math.floor(i/4)*.25];// flipY: Zeile 0 oben

/* ---------- Geometrie-Puffer ---------- */
class Geo{constructor(tiled){this.p=[];this.n=[];this.uv=[];this.t=tiled?[]:null;this.c=[];}
 quad(a,b,c,d,n,uvs,tile,col){// a,b,c,d gegen den Uhrzeigersinn von außen
  const P=[a,b,c,a,c,d],U=[uvs[0],uvs[1],uvs[2],uvs[0],uvs[2],uvs[3]];
  for(let i=0;i<6;i++){this.p.push(...P[i]);this.n.push(...n);this.uv.push(...U[i]);if(this.t)this.t.push(...tile);this.c.push(...(col||[1,1,1]));}}
 build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));if(this.t)g.setAttribute('tile',new THREE.Float32BufferAttribute(this.t,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();return g;}}

/* ---------- Boden aus den Feldern ---------- */
function runLen(x,y,dx,dy,type){let n=1,i=1;while(cellAt(x+dx*i,y+dy*i)===type){n++;i++;}i=1;while(cellAt(x-dx*i,y-dy*i)===type){n++;i++;}return n;}
export function groundTexture(YM){
 const PX=32,S=N*PX,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
 if(STIL5){// V5: eckiger Coffee-Inc-Stil – jede Straße (auch Gasse) dunkler Asphalt, leere bebaut-Felder = Blockgrund
  drawGround(g,PX,N,cellAt,isRoad);let roads=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(isRoad(cellAt(x,y)))roads++;
  t.userData.roadCoverage={roads,covered:roads,full:true,stil:5};t.needsUpdate=true;return t;}
 const info=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=cellAt(x,y);let o=null;if(c==='hauptstrasse'){const h=runLen(x,y,1,0,c),v=runLen(x,y,0,1,c);o=h>2&&v>2?'x':h>v?'h':'v';}info.push({x,y,c,o});}
 const isX=(x,y)=>{const i=info[y*N+x];return i&&x>=0&&y>=0&&x<N&&y<N&&i.o==='x';};
 const cov=new Set();
 const draw=(T)=>{cov.clear();
  const col={bebaut:'#E9E3D8',hauptstrasse:'#8E929B',gasse:'#C3C2C0',ringstrasse:'#8E929B',wasser:'#2F7E8A',park:'#A6D98A',wahrzeichen:'#EEE6D6'};
  for(const i of info){const X=i.x*PX,Y=i.y*PX;g.fillStyle=col[i.c]||'#E9E3D8';g.fillRect(X,Y,PX,PX);
   if(i.c==='bebaut'&&T.gehweg)g.drawImage(T.gehweg,X,Y,PX,PX);
   else if(i.c==='park'&&T.rasen){const h=(i.x*7+i.y*13)%11;g.drawImage(h===0&&T.weg?T.weg:h===3&&T.sakura?T.sakura:T.rasen,X,Y,PX,PX);}
   else if(isRoad(i.c)){
    // v3.2: jede Straßenzelle bekommt eine Kachel (Abdeckung wird gezählt)
    const R2=(x,y)=>isRoad(cellAt(x,y));
    if(i.c==='hauptstrasse'&&i.o==='x'){if(T.kreuz){g.drawImage(T.kreuz,X,Y,PX,PX);cov.add(i.y*N+i.x);}continue;}
    if(i.c==='gasse'||i.c==='ringstrasse'){const hn=R2(i.x-1,i.y)+R2(i.x+1,i.y),vn=R2(i.x,i.y-1)+R2(i.x,i.y+1);
     if(hn&&vn&&(hn+vn>=3||i.c==='ringstrasse')){/* Kreuzung bzw. Ecke der Ringstraße */if(T.kreuz){g.drawImage(T.kreuz,X,Y,PX,PX);cov.add(i.y*N+i.x);}continue;}}
    const hz=i.c!=='hauptstrasse'?(R2(i.x-1,i.y)+R2(i.x+1,i.y)>R2(i.x,i.y-1)+R2(i.x,i.y+1)||(R2(i.x-1,i.y)+R2(i.x+1,i.y)===R2(i.x,i.y-1)+R2(i.x,i.y+1)&&runLen(i.x,i.y,1,0,i.c)>=runLen(i.x,i.y,0,1,i.c))):i.o==='h';
    // Hauptstraße: Paare quer zur Fahrtrichtung bekommen eine gemeinsame Kachel (Mittellinie dazwischen), Rest einzeln
    let span=1;
    if(i.c==='hauptstrasse'){const same=(x,y)=>{const n=info[y*N+x];return x>=0&&y>=0&&x<N&&y<N&&n.c==='hauptstrasse'&&n.o===i.o;};
     let k=0;while(hz?same(i.x,i.y-k-1):same(i.x-k-1,i.y))k++;
     if(k%2===1){cov.add(i.y*N+i.x);continue;}// zweite Hälfte, vom Partner gezeichnet
     if(hz?same(i.x,i.y+1):same(i.x+1,i.y))span=2;}
    const zebra=i.c==='hauptstrasse'&&(hz?(isX(i.x-1,i.y)||isX(i.x+1,i.y)):(isX(i.x,i.y-1)||isX(i.x,i.y+1)));
    const img=zebra&&T.zebra?T.zebra:(i.c==='hauptstrasse'&&span===2)?(T.gelb||T.gerade):T.gerade;
    if(!img)continue;
    cov.add(i.y*N+i.x);
    const w=hz?PX:span*PX,h=hz?span*PX:PX;
    g.save();g.translate(X+w/2,Y+h/2);
    if(img===T.zebra){if(!hz)g.rotate(Math.PI/2);g.drawImage(img,-PX/2,-span*PX/2,PX,span*PX);}
    else{if(hz)g.rotate(Math.PI/2);g.drawImage(img,-span*PX/2,-PX/2,span*PX,PX);}
    g.restore();
   }
   else if(i.c==='wasser'&&T.wasser){g.drawImage(T.wasser,X,Y,PX,PX);}
  }
  // Ufer: Yukis Kai-Kante (oben Land, unten Wasser) auf jeder Land/Wasser-Kante, passend gedreht
  for(const i of info){if(i.c!=='wasser')continue;for(const [dx,dy,rot] of [[0,-1,0],[1,0,Math.PI/2],[0,1,Math.PI],[-1,0,-Math.PI/2]]){const nb=cellAt(i.x+dx,i.y+dy);if(nb==='wasser'||nb==='aussen')continue;
   const X=i.x*PX,Y=i.y*PX;if(T.ufer){g.save();g.translate(X+PX/2,Y+PX/2);g.rotate(rot);g.beginPath();g.rect(-PX/2,-PX/2,PX,PX*.5);g.clip();g.drawImage(T.ufer,-PX/2,-PX/2,PX,PX);g.fillStyle='#B5D35A';g.fillRect(-PX/2,-PX/2,PX,PX*.2);g.fillStyle='#8FA94A';g.fillRect(-PX/2,-PX/2+PX*.2,PX,PX*.04);g.restore();}// grüner Inselrand wie in Eriks Vorlagen
   else{g.fillStyle='#B9B2A4';g.fillRect(X+(dx>0?PX-5:0),Y+(dy>0?PX-5:0),dx?5:PX,dy?5:PX);}}}
  // Wahrzeichen-Flächen
  for(const w of LANDMARK_AREAS){const X=w.x*PX,Y=w.y*PX,ww=w.breite*PX,hh=w.tiefe*PX;
   if(w.wahrzeichen==='shibuya-crossing'&&T.kreuz){g.drawImage(T.kreuz,X,Y,ww,hh);}
   else if(w.wahrzeichen==='haneda'&&FEATURES.haneda){g.fillStyle='#C9CCD2';g.fillRect(X,Y,ww,hh);g.fillStyle='#7E838C';g.fillRect(X+8,Y+hh*.55,ww-16,hh*.22);g.fillStyle='#fff';for(let k=X+16;k<X+ww-24;k+=30)g.fillRect(k,Y+hh*.655,16,3);}
   else if(w.wahrzeichen==='kaiserpalast'){g.fillStyle='#9ED8F0';g.fillRect(X,Y,ww,hh);g.fillStyle='#A6D98A';g.fillRect(X+12,Y+12,ww-24,hh-24);if(T.baeume)g.drawImage(T.baeume,X+12,Y+12,ww-24,hh-24);}
   else if(!FEATURES.haneda&&w.wahrzeichen==='haneda'){}
   else{if(T.rasen){for(let yy=0;yy<w.tiefe;yy++)for(let xx=0;xx<w.breite;xx++)g.drawImage(T.rasen,X+xx*PX,Y+yy*PX,PX,PX);}else{g.fillStyle='#A6D98A';g.fillRect(X,Y,ww,hh);}}}
  // Gleisbett Yamanote (nur mit FEATURES.rail)
  if(YM&&FEATURES.rail){const P=v=>(v-W0)/F*PX;g.strokeStyle='rgba(205,198,185,.9)';g.lineWidth=2.2/F*PX;g.beginPath();g.ellipse(P(YM.cx),P(YM.cz),YM.rx/F*PX,YM.rz/F*PX,0,0,7);g.stroke();}
  t.needsUpdate=true;let roads=0;for(const i of info)if(isRoad(i.c))roads++;t.userData.roadCoverage={roads,covered:cov.size,full:!!T.gerade};
 };
 draw({});
 const S2=TEX+'strasse/';
 Promise.all([S2+'gehweg.svg',S2+'gerade.svg',S2+'kreuzung.svg',S2+'zebrastreifen.svg',S2+'gerade-mittellinie-gelb.svg',TEX+'gruen-rasen.svg',TEX+'gruen-park-weg.svg',TEX+'gruen-sakura.svg',TEX+'gruen-baeume.svg',TEX+'wasser.svg',TEX+'ufer-kante.svg'].map(u=>loadImg(u).catch(()=>null)))
  .then(([gehweg,gerade,kreuz,zebra,gelb,rasen,weg,sakura,baeume,wasser,ufer])=>draw({gehweg,gerade,kreuz,zebra,gelb,rasen,weg,sakura,baeume,wasser,ufer}));
 return t;
}

/* ---------- Gebäude ---------- */
const INSET=.35;
export function buildCity(){
 if(STIL5)return buildCity5();
 const atlas=atlasTexture(),G=new Geo(true),rnd=seeded(11),lots=[];
 for(const l of PLAN.grundstuecke){
  if(l.turm)continue;// V4: hier steht ein Wolkenkratzer (buildTowers)
  const ti=Math.max(0,BTYPES.indexOf(l.typ)),x0=wx(l.x)+INSET,x1=wx(l.x+l.breite)-INSET,z0=wz(l.y)+INSET,z1=wz(l.y+l.tiefe)-INSET,h=l.stockwerke*FLOOR_H;
  const tile=tileOf(ti),vt=h/(FLOOR_H*FLOORS_PER_TILE[l.typ]||1),uw=(x1-x0)/F,ud=(z1-z0)/F;
  const sh=.92+rnd()*.08,col=[sh,sh,sh];
  // vier Wände (u = Breite in Feldern, v = Höhe in Kacheln)
  G.quad([x0,0,z1],[x1,0,z1],[x1,h,z1],[x0,h,z1],[0,0,1],[[0,0],[uw,0],[uw,vt],[0,vt]],tile,col);// Süd
  G.quad([x1,0,z0],[x0,0,z0],[x0,h,z0],[x1,h,z0],[0,0,-1],[[0,0],[uw,0],[uw,vt],[0,vt]],tile,col);// Nord
  G.quad([x1,0,z1],[x1,0,z0],[x1,h,z0],[x1,h,z1],[1,0,0],[[0,0],[ud,0],[ud,vt],[0,vt]],tile,col);// Ost
  G.quad([x0,0,z0],[x0,0,z1],[x0,h,z1],[x0,h,z0],[-1,0,0],[[0,0],[ud,0],[ud,vt],[0,vt]],tile,col);// West
  // Dach: Ziegel bei kleinen Häusern, sonst Flachdach
  const TECH=['buero-beton','mittelhaus-fliesen','wohnhaus-mansion','geschaeftshaus-neon'];
  const roof=l.stockwerke<=2?10:(l.stockwerke>=5&&l.stockwerke<=12&&TECH.includes(l.typ))?12:9;// Ziegel / Flachdach mit Technik / schlichtes Flachdach
  G.quad([x0,h,z1],[x1,h,z1],[x1,h,z0],[x0,h,z0],[0,1,0],[[0,0],[.999,0],[.999,.999],[0,.999]],tileOf(roof),[1,1,1]);
  lots.push({l,x0,x1,z0,z1,h});
 }
 const mesh=new THREE.Mesh(G.build(),atlasMaterial(atlas));mesh.castShadow=mesh.receiveShadow=true;
 return {mesh,lots,atlas};
}

/* ---------- V4: Yukis Wolkenkratzer (grafik/wolkenkratzer) ---------- */
// Grundform aus wolkenkratzer.json (box, zylinder, gestuft, doppel), Fassade = Yukis 256×768-Textur über die ganze Höhe,
// Dach: schlichtes Flachdach (dach-flach, ohne Technik) – Eriks Dachregel für Hochhäuser. Ein Mesh je Turm + ein Dach-Mesh.
export const TOWER_INFO=await fetch(new URL('../grafik/wolkenkratzer/wolkenkratzer.json',import.meta.url)).then(r=>r.json()).then(j=>j.tuerme||[]).catch(()=>[]);
// Yukis Turm-SVGs sind Ansichtszeichnungen (Silhouette auf transparentem Grund, unten Schild/Bodenlinie).
// Franky: Zeichnung wird auf die gefüllte Fläche zugeschnitten und mit Alpha-Schnitt auf jede Wand gelegt;
// so zeigt jede Seite die Silhouette (Spitzen, Doppeltürme), Höhe folgt dem Seitenverhältnis der Zeichnung.
function analyse(im){const W=256,H=768,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0,W,H);
 const d=g.getImageData(0,0,W,H).data,A=(x,y)=>d[(y*W+x)*4+3]>128;let x0=W,x1=-1,y0=H,y1=-1;const rows=[];
 const yMax=H-56;// Bodenlinie + Namensschild unten weglassen
 for(let y=0;y<yMax;y++){let l=-1,r=-1;for(let x=0;x<W;x++)if(A(x,y)){if(l<0)l=x;r=x;}rows.push([l,r]);if(l>=0){x0=Math.min(x0,l);x1=Math.max(x1,r);y0=Math.min(y0,y);y1=y;}}
 if(x1<0)return null;const bw=x1-x0+1,bh=y1-y0+1;let sh=y1;for(let y=y0;y<=y1;y++){const [l,r]=rows[y];if(l>=0&&r-l+1>=bw*.85){sh=y;break;}}
 const out=document.createElement('canvas');out.width=bw;out.height=bh;out.getContext('2d').drawImage(cv,x0,y0,bw,bh,0,0,bw,bh);
 return {canvas:out,aspect:bh/bw,shoulder:(y1-sh)/bh};}// shoulder = Anteil der Höhe bis zur vollen Breite (dort liegt das Flachdach)
function wall(G,ax,az,bx,bz,y0,y1,u0,u1,v0,v1){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz)||1;
 G.quad([ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az],[-dz/l,0,dx/l],[[u0,v0],[u1,v0],[u1,v1],[u0,v1]]);}
// Grundfläche gegen den Uhrzeigersinn wie die Plan-Häuser (Süd, Ost, Nord, West); Zylinder mit 12 Seiten
function ringPts(shape,cx,cz,hw,hd){if(shape==='zylinder'){const n=12,o=[];for(let i=0;i<n;i++){const a=Math.PI/2-(i+.5)*2*Math.PI/n;o.push([cx+Math.cos(a)*hw,cz+Math.sin(a)*hd]);}return o;}
 return [[cx-hw,cz+hd],[cx+hw,cz+hd],[cx+hw,cz-hd],[cx-hw,cz-hd]];}
function prism(G,R,shape,cx,cz,hw,hd,H,roofY){const P=ringPts(shape,cx,cz,hw,hd),n=P.length,per=shape==='zylinder'?n/4:1;
 for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],k=i%per;wall(G,a[0],a[1],b[0],b[1],0,H,k/per,(k+1)/per,0,1);}
 const uv=(x,z)=>[(x-cx)/(2*hw)+.5,(z-cz)/(2*hd)+.5];
 if(n===4)R.quad(...P.map(p=>[p[0],roofY,p[1]]),[0,1,0],P.map(p=>uv(...p)));
 else for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];R.quad([cx,roofY,cz],[a[0],roofY,a[1]],[b[0],roofY,b[1]],[cx,roofY,cz],[0,1,0],[[.5,.5],uv(...a),uv(...b),[.5,.5]]);}}
export function buildTowers(){
 if(STIL5)return buildTowers5();
 const group=new THREE.Group(),list=[];group.userData.towers=list;
 const roofMat=new THREE.MeshLambertMaterial({color:'#ffffff'});loadImg(TEX+'dach-flach.svg').then(im=>{const tx=new THREE.Texture(im);tx.colorSpace=THREE.SRGBColorSpace;tx.needsUpdate=true;roofMat.map=tx;roofMat.needsUpdate=true;}).catch(()=>{});
 const jobs=TOWERS.map(t=>{const info=TOWER_INFO.find(x=>x.id===t.turm);if(!info)return null;
  const ins=t.landmark?F*.3:INSET,x0=wx(t.x)+ins,x1=wx(t.x+t.breite)-ins,z0=wz(t.y)+ins,z1=wz(t.y+t.tiefe)-ins,cx=(x0+x1)/2,cz=(z0+z1)/2,hw=(x1-x0)/2,hd=(z1-z0)/2;
  const ud={turm:t.turm,name:t.name,lot:t.lot,landmark:t.landmark,cx,cz,grundform:info.grundform};list.push(ud);
  return loadImg(encodeURI(TEX.replace('texturen/','')+info.textur)).then(im=>{const a=analyse(im);if(!a)return;
   const shape=info.grundform==='zylinder'?'zylinder':'box',faceW=shape==='zylinder'?hw*2*.8:Math.max(hw,hd)*2,H=Math.min(95,Math.max(28,faceW*a.aspect)),roofY=H*(1-a.shoulder);
   const G=new Geo(false),R=new Geo(false);prism(G,R,shape,cx,cz,hw,hd,H,roofY);
   const tx=new THREE.CanvasTexture(a.canvas);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
   const m=new THREE.Mesh(G.build(),new THREE.MeshLambertMaterial({map:tx,alphaTest:.5,side:THREE.FrontSide}));m.castShadow=m.receiveShadow=true;
   const r=new THREE.Mesh(R.build(),roofMat);r.receiveShadow=true;r.userData.roof='dach-flach';
   Object.assign(ud,{h:H,roofY});m.userData=ud;group.add(m,r);}).catch(()=>{});});
 group.userData.ready=Promise.all(jobs.filter(Boolean));return group;}

/* ---------- Integrierte Erdgeschoss-Läden (eigener Atlas 8×10 Streifen à 256×96) ---------- */
const SW=256,SH=96,COLS=8;
export function buildShops(){
 const cv=document.createElement('canvas');cv.width=COLS*SW;cv.height=1024;const g=cv.getContext('2d');
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const G=new Geo(false),hS=FLOOR_H*1.15,out=.06;
 const cell=(k,side)=>{const n=k*2+(side?1:0);return {x:(n%COLS)*SW,y:Math.floor(n/COLS)*SH};};// 2 Streifen je Laden (vorne, Seite)
 const uvRect=(k,side)=>{const c=cell(k,side);const u0=c.x/cv.width,u1=(c.x+SW)/cv.width,v1=1-c.y/1024,v0=1-(c.y+SH)/1024;return [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];};
 for(const s of SHOPS){const l=s.lot,ft=SHOP_FOOT.get(l.id),x0=(ft?ft.x0:wx(l.x)+INSET)-out,x1=(ft?ft.x1:wx(l.x+l.breite)-INSET)+out,z0=(ft?ft.z0:wz(l.y)+INSET)-out,z1=(ft?ft.z1:wz(l.y+l.tiefe)-INSET)+out;
  const face=(dir,side)=>{// Streifen auf der Fassade dir; Ecke: an der Seite der zweiten Straße
   const len=(dir==='n'||dir==='s')?x1-x0:z1-z0,w=Math.min(len,hS*SW/SH);let a,b;
   const other=side?s.front:s.side;// für Eckläden: Richtung der Nachbarstraße
   const atEnd=other==='o'||other==='s';// Streifen an das Ende schieben, das zur zweiten Straße zeigt
   const u=uvRect(s.k,side);
   if(dir==='s'){a=s.art==='ecke'?(other==='o'?x1-w:x0):(x0+x1-w)/2;G.quad([a,0,z1],[a+w,0,z1],[a+w,hS,z1],[a,hS,z1],[0,0,1],u);}
   if(dir==='n'){a=s.art==='ecke'?(other==='w'?x0:x1-w):(x0+x1-w)/2;G.quad([a+w,0,z0],[a,0,z0],[a,hS,z0],[a+w,hS,z0],[0,0,-1],u);}
   if(dir==='o'){b=s.art==='ecke'?(other==='n'?z0:z1-w):(z0+z1-w)/2;G.quad([x1,0,b+w],[x1,0,b],[x1,hS,b],[x1,hS,b+w],[1,0,0],u);}
   if(dir==='w'){b=s.art==='ecke'?(other==='s'?z1-w:z0):(z0+z1-w)/2;G.quad([x0,0,b],[x0,0,b+w],[x0,hS,b+w],[x0,hS,b],[-1,0,0],u);}
  };
  face(s.front,false);if(s.art==='ecke'&&s.side)face(s.side,true);
 }
 const mesh=new THREE.Mesh(G.build(),new THREE.MeshLambertMaterial({map:tex,emissive:'#ffffff',emissiveIntensity:.12,emissiveMap:tex}));mesh.receiveShadow=true;
 // Streifen zeichnen (Farbe + Name pro Besitzer)
 const files={front:TEX+'laden-integriert-front.svg',vorne:TEX+'laden-integriert-eck-vorne.svg',seite:TEX+'laden-integriert-eck-seite.svg'};
 const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 const ver=new Map();
 function paint(k,{color,name}){
  const s=SHOPS[k];const v=(ver.get(k)||0)+1;ver.set(k,v);
  const jobs=s.art==='ecke'?[[files.vorne,false],[files.seite,true]]:[[files.front,false]];
  for(const [f,side] of jobs){const c=cell(k,side);g.fillStyle=color;g.fillRect(c.x,c.y,SW,SH);tex.needsUpdate=true;
   getSvg(f).then(txt=>{txt=txt.replace(/var\(--ladenfarbe,[^)]*\)/g,color).replace(/(<text[^>]*data-placeholder="name"[^>]*>)([^<]*)(<\/text>)/g,(m,a,b,e)=>a+esc(name)+e);return svgToImg(txt);})
    .then(im=>{if(ver.get(k)!==v)return;g.clearRect(c.x,c.y,SW,SH);g.drawImage(im,c.x,c.y,SW,SH);tex.needsUpdate=true;}).catch(()=>{});}
 }
 return {mesh,paint};
}

/* ---------- Bäume in Parks ---------- */
export function treeSpots(){const r=seeded(99),out=[];
 const inBlock=(x,y)=>LM_BLOCKS.some(b=>x>=b.x&&y>=b.y&&x<b.x+b.breite&&y<b.y+b.tiefe);
 for(const b of LM_BLOCKS)for(const [tx,ty] of b.baeume)out.push([wx(tx),wz(ty),.7+r()*.4]);// Yukis Baumplätze auf den Wahrzeichen-Blöcken
 if(STIL5){// V5: Parks als dichte Baumgruppen neben den Wegen (Wegraster alle 3 Felder, Teiche frei)
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='park')continue;if(((x*7+y*13)%17)===5&&cellAt(x+1,y)==='park'&&cellAt(x,y+1)==='park'&&x%3!==1&&y%3!==1)continue;
   const inb=inBlock(x,y);for(const[qx,qz]of[[.22,.22],[.78,.22],[.22,.78],[.78,.78]]){if(r()<(inb?.6:.42))continue;
    out.push([wx(x)+qx*F+(r()-.5)*.5,wz(y)+qz*F+(r()-.5)*.5,.55+r()*.4]);}}
  const kp=LANDMARK_AREAS.find(w=>w.wahrzeichen==='kaiserpalast');if(kp)for(let i=0;i<14;i++){const x=kp.cx+(r()-.5)*(kp.w-3),z=kp.cz+(r()-.5)*(kp.d-3);if(Math.abs(x-kp.cx)>10.5||Math.abs(z-kp.cz)>8.5)out.push([x,z,.7+r()*.4]);}
  return out;}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='park'||inBlock(x,y))continue;const n=r()<.55?1:r()<.5?2:0;for(let i=0;i<n;i++)out.push([wx(x)+.6+r()*(F-1.2),wz(y)+.6+r()*(F-1.2),.65+r()*.5]);}
 // Kaiserpalast-Garten
 const kp=LANDMARK_AREAS.find(w=>w.wahrzeichen==='kaiserpalast');if(kp)for(let i=0;i<26;i++){const x=kp.cx+(r()-.5)*(kp.w-7),z=kp.cz+(r()-.5)*(kp.d-7);if(Math.hypot(x-kp.cx,z-kp.cz)>5)out.push([x,z,.8+r()*.5]);}
 return out;}

/* ---------- Fahrspuren der Hauptstraßen (für Autos) ---------- */
export function roadLanes(){const lanes=[];
 for(let y=0;y<N-1;y++){let n=0;for(let x=0;x<N;x++)if(cellAt(x,y)==='hauptstrasse'&&cellAt(x,y+1)==='hauptstrasse')n++;if(n>N*.6&&!(lanes.some(l=>l.h&&l.y===y-1)))lanes.push({h:true,y,z:wz(y+1)});}
 for(let x=0;x<N-1;x++){let n=0;for(let y=0;y<N;y++)if(cellAt(x,y)==='hauptstrasse'&&cellAt(x+1,y)==='hauptstrasse')n++;if(n>N*.6&&!(lanes.some(l=>!l.h&&l.x===x-1)))lanes.push({h:false,x,xw:wx(x+1)});}
 return lanes;}
// Erik: Autos nur auf Hauptstraßen, Ringstraßen und Brücken – nach Zelltyp, nicht nach Breite (keine Autos auf Gassen)
export const isCarRoad=c=>c==='hauptstrasse'||c==='ringstrasse'||c==='bruecke';
export const onRoad=(x,z)=>{const gx=Math.floor((x-W0)/F),gy=Math.floor((z-W0)/F);return isCarRoad(cellAt(gx,gy));};

/* ---------- V5: Gebäude nach Yukis Vorlagen (Musterausschnitt Runde 10) ---------- */
export const SHOP_FOOT=new Map();// V5: Ladengebäude kleiner als das Grundstück – Fassade bündig zur Ladenfront (buildShops nutzt diese Fläche)
const MIDT={'buero-glas':'glas','buero-beton':'buero','wohnhaus-mansion':'block','geschaeftshaus-neon':'laden','mittelhaus-fliesen':'block'};
export const FILL5={n:0};
function buildCity5(){const B=new Bins(),rnd=seeded5(11),K0=makeKit(F,B,rnd),lots=[];let roofs=0;
  // Belegung merken, damit Rasen in bebauten Blöcken danach bis an die Straße aufgefüllt wird (Runde-10-Dichte)
  const FP=FILL5.fp=[],reg=(x,z,w,d)=>FP.push([x-w/2,x+w/2,z-d/2,z+d/2]);
  const K=Object.assign({},K0,{house:(x,z,ry,fl,o={})=>{const w=o.w||.6*F;reg(x,z,w,o.d||w);return K0.house(x,z,ry,fl,o);}});
  for(const k of['buero','wohnblock','hotel','tower'])K[k]=(x,z,w,d,...a)=>{reg(x,z,w,d);return K0[k](x,z,w,d,...a);};
  for(const t of TOWERS){const cx=wx(t.x+t.breite/2),cz=wz(t.y+t.tiefe/2),dp=t.turm==='rathaus-zwilling'||(TOWER_INFO.find(i=>i.id===t.turm)||{}).grundform==='doppel';const a=dp?1.25*F:.7*F;reg(cx,cz,Math.min(a*2,wx(t.x+t.breite)-wx(t.x)),Math.min(a*2,wz(t.y+t.tiefe)-wz(t.y)));}
 for(const l of PLAN.grundstuecke){if(l.turm)continue;
  const x0=wx(l.x)+INSET,x1=wx(l.x+l.breite)-INSET,z0=wz(l.y)+INSET,z1=wz(l.y+l.tiefe)-INSET,w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const mt=MIDT[l.typ];let h;
  if(mt&&!l.laden&&(w>1.5*F||d>1.5*F)){// Mittelbau in Spec-Größe (Yuki: 1,1–1,4 Felder) + Kleinhäuser auf dem Rest
   const fl=Math.max(3,l.stockwerke),bw=Math.min(w,(1.15+rnd()*.25)*F),bd=Math.min(d,(1.0+rnd()*.2)*F),bx=x0+bw/2,bz=z1-bd/2;
   h=fl>10?K.tower(bx,bz,Math.min(bw,1.1*F),Math.min(bd,1.1*F),Math.min(fl,14)*K.FL):mt==='glas'||mt==='buero'?K.buero(bx,bz,bw,bd,Math.min(fl,8),mt==='glas'):mt==='laden'&&rnd()<.3?K.hotel(bx,bz,Math.min(bw,.9*F),Math.min(bd,.8*F),9):K.wohnblock(bx,bz,bw,bd,Math.min(fl,6),{shop:mt==='laden'});
   const st=.82*F;for(let x=x0+st/2;x<=x1-st/2+.01;x+=st)for(let z=z0+st/2;z<=z1-st/2+.01;z+=st){if(x-st/2<x0+bw+.2&&z+st/2>z1-bd-.2)continue;const r=rnd();if(r<.06){K.tree(x,z);continue;}K.house(x,z,rnd()<.5?0:Math.PI/2,1+(rnd()*2.2|0),{w:st*(.9+rnd()*.07)});}
  }else if(l.laden&&(w>1.45*F||d>1.45*F)){// Laden: kompaktes Gebäude an der Ladenfront (Ecke: an beiden Straßen), Rest Kleinhäuser
   const sh=SHOPS.find(q=>q.lot===l||q.lot.id===l.id),f=sh?sh.front:'s',sd=sh?sh.side:null;
   const bw=Math.min(w,(1.2+rnd()*.15)*F),bd=Math.min(d,(1.05+rnd()*.15)*F);
   const ax=f==='o'?x1-bw:f==='w'?x0:sd==='o'?x1-bw:sd==='w'?x0:(x0+x1-bw)/2,az=f==='s'?z1-bd:f==='n'?z0:sd==='s'?z1-bd:sd==='n'?z0:(z0+z1-bd)/2;
   const ft={x0:ax,x1:ax+bw,z0:az,z1:az+bd};SHOP_FOOT.set(l.id,ft);const bx=ax+bw/2,bz=az+bd/2,fl=Math.max(2,Math.min(l.stockwerke,6));
   h=mt==='glas'||mt==='buero'?K.buero(bx,bz,bw,bd,Math.max(4,fl),mt==='glas'):mt?K.wohnblock(bx,bz,bw,bd,Math.max(3,fl),{shop:false}):K.house(bx,bz,0,2,{w:bw,d:bd});
   const st=.82*F;for(let x=x0+st/2;x<=x1-st/2+.01;x+=st)for(let z=z0+st/2;z<=z1-st/2+.01;z+=st){if(x+st/2>ft.x0-.15&&x-st/2<ft.x1+.15&&z+st/2>ft.z0-.15&&z-st/2<ft.z1+.15)continue;const r=rnd();if(r<.06){K.tree(x,z);continue;}K.house(x,z,rnd()<.5?0:Math.PI/2,1+(rnd()*2|0),{w:st*(.9+rnd()*.07)});}
  }else if(mt||l.laden){// ein Gebäude über das ganze Grundstück (Läden: Erdgeschoss-Streifen liegt auf dieser Fassade)
   const fl=Math.max(2,Math.min(l.stockwerke,mt?40:3));
   if(fl>10&&!l.laden&&w<=1.5*F&&d<=1.5*F)h=K.tower(cx,cz,w,d,Math.min(fl,14)*K.FL);
   else if(fl>10)h=K.buero(cx,cz,w,d,9,rnd()<.5);// Laden-Grundstück: Bürohaus statt breitem Turm
   else if(mt==='glas')h=K.buero(cx,cz,w,d,Math.max(4,fl),true);
   else if(mt==='buero')h=K.buero(cx,cz,w,d,Math.max(4,fl));
   else if(mt==='laden'&&rnd()<.25&&fl>=5)h=K.hotel(cx,cz,w,d,fl);
   else if(mt)h=K.wohnblock(cx,cz,w,d,Math.max(3,fl),{shop:mt==='laden'});
   else h=K.house(cx,cz,0,fl,{w,d,ziegel:l.typ==='altbau-holz'&&rnd()<.4});// Laden in Kleinhaus: ein Haus über das Grundstück
  }else{// Kleinhäuser: Raster aus kleinen Häusern mit Abständen, Lücken und Bäumen
   const st=.82*F,nx=Math.max(1,Math.round(w/st)),nz=Math.max(1,Math.round(d/st)),sx=w/nx,sz=d/nz,fl=Math.max(1,Math.min(3,l.stockwerke));h=0;
   for(let a=0;a<nx;a++)for(let c=0;c<nz;c++){const x=x0+sx*(a+.5),z=z0+sz*(c+.5),r=rnd();
    if(nx*nz>2&&r<.06){K.tree(x,z);continue;}
    h=Math.max(h,K.house(x,z,rnd()<.5?0:Math.PI/2,Math.max(1,fl-(rnd()<.3?1:0)),{w:Math.min(sx,sz)*(.9+rnd()*.07),ziegel:l.typ==='altbau-holz'&&rnd()<.3}));}
   if(!h)h=K.house(cx,cz,0,fl);}
  roofs++;lots.push({l,x0,x1,z0,z1,h});}
  {// Auffüllen: jedes bebaut-Feld ohne Gebäude bekommt Kleinhäuser bzw. (selten) einen kleinen Mittelbau
   const fr=.15*F,free=(a0,a1,b0,b1)=>!FP.some(r=>r[0]<a1-fr&&r[1]>a0+fr&&r[2]<b1-fr&&r[3]>b0+fr);
   const fr2=.1*F,free2=(a0,a1,b0,b1)=>!FP.some(r=>r[0]<a1-fr2&&r[1]>a0+fr2&&r[2]<b1-fr2&&r[3]>b0+fr2);
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='bebaut')continue;const a0=wx(x),a1=wx(x+1),b0=wz(y),b1=wz(y+1);
    if(free(a0,a1,b0,b1)&&rnd()<.16){K.wohnblock((a0+a1)/2,(b0+b1)/2,.84*F,.84*F,3+(rnd()*3|0));FILL5.n++;continue;}
    const hF=F/2;if(free2(a0,a1,b0,b1)){const v=rnd()<.5;for(const o of[-1,1]){const hx=(a0+a1)/2+(v?o*hF/2:0),hz=(b0+b1)/2+(v?0:o*hF/2);K.house(hx,hz,0,1+(rnd()*2.3|0),v?{w:hF*.88,d:F*.86}:{w:F*.86,d:hF*.88});FILL5.n++;}continue;}
    const fs=[[0,0],[0,1],[1,0],[1,1]].map(([i,j])=>free2(a0+i*hF,a0+i*hF+hF,b0+j*hF,b0+j*hF+hF));const used=[0,0,0,0];
    const put=(c0,c1,d0,d1)=>{const hx=(c0+c1)/2,hz=(d0+d1)/2;if(rnd()<.06){K0.tree(hx,hz);return;}K.house(hx,hz,0,1+(rnd()*2.3|0),{w:(c1-c0)*.88,d:(d1-d0)*.88});FILL5.n++;};
    for(let i=0;i<2;i++)if(fs[i*2]&&fs[i*2+1]){put(a0+i*hF,a0+i*hF+hF,b0,b1);used[i*2]=used[i*2+1]=1;}
    for(let j=0;j<2;j++)if(fs[j]&&fs[2+j]&&!used[j]&&!used[2+j]){put(a0,a1,b0+j*hF,b0+j*hF+hF);used[j]=used[2+j]=1;}
    for(let k=0;k<4;k++)if(fs[k]&&!used[k]){const i=k>>1,j=k&1;put(a0+i*hF,a0+i*hF+hF,b0+j*hF,b0+j*hF+hF);}}}
 const mesh=new THREE.Group();for(const m of B.meshes()){m.castShadow=m.receiveShadow=true;mesh.add(m);}mesh.userData.roofs=roofs;mesh.userData.stil=5;
 return {mesh,lots,atlas:null};}
function buildTowers5(){const group=new THREE.Group(),list=[];group.userData.towers=list;const rnd=seeded5(23);
 for(const t of TOWERS){const info=TOWER_INFO.find(x=>x.id===t.turm);if(!info)continue;
  const ins=t.landmark?F*.3:INSET,x0=wx(t.x)+ins,x1=wx(t.x+t.breite)-ins,z0=wz(t.y)+ins,z1=wz(t.y+t.tiefe)-ins,cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
  const Bt=new Bins(),Bc=new Bins(),K=makeKit(F,Bt,rnd),k=rnd()*3|0;let H;
  if(info.grundform==='doppel'||t.turm==='rathaus-zwilling'){const v=w>=d,tw=Math.min(1.15*F,v?w*.38:w*.8),td=Math.min(1.15*F,v?d*.8:d*.38),o=Math.min((v?w:d)*.27,tw*.75);
   H=K.tower(cx-(v?o:0),cz-(v?0:o),tw,td,3.8*F,k,Bt,Bc);K.tower(cx+(v?o:0),cz+(v?0:o),tw,td,3.5*F,k,Bt,Bc);Bc.add(new THREE.BoxGeometry(v?o*2:tw*.9,2.2,v?td*.9:o*2).translate(0,1.1,0),new THREE.MeshLambertMaterial({color:'#DCE3EA'}),cx,0,cz);}
  else{const s=Math.min(w,d,1.15*F);H=K.tower(cx,cz,Math.min(w*.8,s),Math.min(d*.8,s),(3.2+rnd()*.6)*F,k,Bt,Bc);}
  const ud={turm:t.turm,name:t.name,lot:t.lot,landmark:t.landmark,cx,cz,grundform:info.grundform,h:H,roofY:H};list.push(ud);
  const main=new THREE.Group();main.userData=ud;for(const m of Bt.meshes()){m.castShadow=m.receiveShadow=true;main.add(m);}
  const crown=new THREE.Group();crown.userData={roof:'krone'};for(const m of Bc.meshes()){m.castShadow=m.receiveShadow=true;crown.add(m);}
  group.add(main,crown);}
 group.userData.ready=Promise.resolve();return group;}
