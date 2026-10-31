// Konbini Empire v3 – 3D-Karte (Yukis Stadtplan) von Tokio (Three.js, Low-Poly, mobil-optimiert)
import * as THREE from '../lib/three.module.min.js';
import {MapControls} from '../lib/MapControls.js';
import {DISTRICTS,DMAP,TYPES,CHAINS,FACADES,DESIGN,HUBS,TIERS,tierOf} from './data.js';
import {designOf} from './sim.js';
import {GFX,svgColored,svgImage} from './gfx.js';
import {logoCanvas,shade} from './logo.js';
import * as LG from './logo.js';
import {SKYSCRAPERS,TOWERS,SHOPS,LANDMARK_AREAS,lm as LM,F as FIELD,FEATURES,LM_BLOCKS,BRIDGES,wx,wz,CITY as PCITY} from './plan.js';
import {buildYokohamaLM,bayBridgeParts,LT_HEIGHT} from './lm_yokohama.js';
import {SHOP_FOOT,groundTexture as planGround,buildTowers,buildCity,buildShops,treeSpots,roadLanes,onRoad,loadImg} from './city.js';
import {PLAN_SLOTS,slotOpen} from './data.js';
import {RAND_WASSER,STIL5,PIN_V2,skytree5,tokyoTower5,roppongi5,palace5,station5,shibuya5,gotoku5,akamon5,fujiTV5,bridgeRails,medianTrees,colMat as colMat5} from './stil5.js';
function mergeLife(gs){const g=new THREE.BufferGeometry(),P=[],Nn=[];for(const x of gs){const y=x.index?x.toNonIndexed():x;P.push(...y.attributes.position.array);Nn.push(...y.attributes.normal.array);}g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return g;}
import {N as PN,cellAt as pCellAt,isRoad as pIsRoad,FLOOR_H as PFH} from './plan.js';

/* ---------- Geografie ---------- */
const RIVER=[[97,-140],[94,-95],[92,-62],[91,-35],[89,-10],[87,15],[86,40],[84,58]];
const BAY=[[140,16],[112,28],[96,42],[82,58],[72,72],[64,88],[56,104],[50,140],[140,140]];
const ODAIBA=[[84,90],[106,84],[116,98],[102,112],[84,106]];
const PALACE={x:30,z:0,r:9.5};
const PARKS=[{x:30,z:0,r:9.5,pal:1},{x:45,z:-50,r:7},{x:-37,z:28,r:8},{x:-20,z:-1,r:5},{x:36,z:56,r:4.5},{x:-96,z:84,r:7},{x:12,z:-20,r:4}];
const YM={cx:9,cz:-2.4,rx:51.6,rz:58.8};
const R=130;
const BG=PCITY&&PCITY.id==='yokohama'?'#2F7E8A':(RAND_WASSER?'#236E81':'#0B0D12');// Yokohama: offene Bucht – außerhalb der Karte Meer statt Schwarz// v3.2: Hintergrund außerhalb der Karte
export const PIN_CAP_Z=1.2;
export const CAM={elev:35*Math.PI/180,yaw:45*Math.PI/180,viewH:120,zoom0:.88,minZoom:.5,maxZoom:6,carZoom:1.5};
function seeded(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647;}
function inPoly(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,zi]=P[i],[xj,zj]=P[j];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c;}return c;}
function distSeg(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(px-ax-t*dx,pz-az-t*dz);}
function distRiver(x,z){let m=1e9;for(let i=0;i<RIVER.length-1;i++)m=Math.min(m,distSeg(x,z,...RIVER[i],...RIVER[i+1]));return m;}
const isBay=(x,z)=>inPoly(x,z,BAY)&&!inPoly(x,z,ODAIBA);
export function isWater(x,z,margin=0){
 if(distRiver(x,z)<3.6+margin)return true;
 if(isBay(x,z)||(margin&&(isBay(x+margin,z)||isBay(x,z+margin)||isBay(x-margin,z)||isBay(x,z-margin))))return true;
 const dp=Math.hypot(x-PALACE.x,z-PALACE.z);if(dp>PALACE.r&&dp<PALACE.r+1.6+margin)return true;
 return false;
}
const isPark=(x,z,m=0)=>PARKS.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+m);
function distYM(x,z){const u=(x-YM.cx)/YM.rx,v=(z-YM.cz)/YM.rz;return Math.abs(Math.hypot(u,v)-1)*Math.min(YM.rx,YM.rz);}
function nearestDistrict(x,z){let best=null,bd=1e9;for(const d of DISTRICTS){const dd=Math.hypot(x-d.x,z-d.z);if(dd<bd){bd=dd;best=d}}return [best,bd];}

/* ---------- Materialien ---------- */
const MATS=new Map();
function M(color,opt={}){const k=color+JSON.stringify(opt);if(!MATS.has(k))MATS.set(k,new THREE.MeshLambertMaterial({color,...opt}));return MATS.get(k);}
const BOX=new THREE.BoxGeometry(1,1,1);BOX.translate(0,.5,0);
const CBOX=new THREE.BoxGeometry(1,1,1);
function box(w,h,d,color,x=0,y=0,z=0,opt){const m=new THREE.Mesh(BOX,typeof color==='string'?M(color,opt):color);m.scale.set(w,h,d);m.position.set(x,y,z);return m;}
function cyl(rt,rb,h,seg,color,x=0,y=0,z=0){const g=new THREE.CylinderGeometry(rt,rb,h,seg);g.translate(0,h/2,0);const m=new THREE.Mesh(g,M(color));m.position.set(x,y,z);return m;}
function cone4(r,h,color,x=0,y=0,z=0,sx=1,sz=1){const g=new THREE.ConeGeometry(r,h,4);g.rotateY(Math.PI/4);g.translate(0,h/2,0);const m=new THREE.Mesh(g,M(color));m.position.set(x,y,z);m.scale.set(sx,1,sz);return m;}
function shadowAll(o,cast=true){o.traverse(c=>{if(c.isMesh){c.castShadow=cast;c.receiveShadow=true;}});return o;}

/* ---------- Bodentextur ---------- */
function groundTexture(){
 const S=2048,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
 const P=v=>(v+R)/(2*R)*S,L=v=>v/(2*R)*S;
 g.fillStyle='#F3EDE1';g.fillRect(0,0,S,S);
 // Viertel-Tönung
 for(const d of DISTRICTS){const gr=g.createRadialGradient(P(d.x),P(d.z),0,P(d.x),P(d.z),L(30));const c=TYPES[d.type].color;gr.addColorStop(0,c+'40');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,S,S);}
 // Straßenraster
 const rnd=seeded(42);g.strokeStyle='#FFFFFF';g.lineCap='round';
 for(let i=-R;i<=R;i+=6.5){g.lineWidth=i%26===0?7:3.2;g.beginPath();g.moveTo(P(i+rnd()*1.2),0);g.lineTo(P(i+rnd()*1.2),S);g.stroke();g.beginPath();g.moveTo(0,P(i+rnd()*1.2));g.lineTo(S,P(i+rnd()*1.2));g.stroke();}
 // Hauptstraßen radial
 g.lineWidth=10;g.strokeStyle='#FFFFFF';for(const d of DISTRICTS){g.beginPath();g.moveTo(P(d.x),P(d.z));g.lineTo(P(PALACE.x),P(PALACE.z));g.stroke();}
 // Parks
 for(const p of PARKS){g.fillStyle=p.pal?'#B9DE9C':'#C4E5A8';g.beginPath();g.arc(P(p.x),P(p.z),L(p.r),0,7);g.fill();g.strokeStyle='#A9D38A';g.lineWidth=4;g.stroke();}
 // Wasser
 const water='#9ED8F0',shore='#D3F0FA';
 g.lineJoin='round';
 g.strokeStyle=shore;g.lineWidth=L(10);g.beginPath();RIVER.forEach(([x,z],i)=>i?g.lineTo(P(x),P(z)):g.moveTo(P(x),P(z)));g.stroke();
 g.strokeStyle=water;g.lineWidth=L(7.4);g.stroke();
 g.fillStyle=shore;g.beginPath();BAY.forEach(([x,z],i)=>i?g.lineTo(P(x),P(z)):g.moveTo(P(x),P(z)));g.closePath();g.fill();
 g.save();g.translate(L(1.6),L(1.6));g.fillStyle=water;g.fill();g.restore();
 g.fillStyle='#F3EDE1';g.beginPath();ODAIBA.forEach(([x,z],i)=>i?g.lineTo(P(x),P(z)):g.moveTo(P(x),P(z)));g.closePath();g.fill();g.strokeStyle='#E3DACA';g.lineWidth=5;g.stroke();
 g.strokeStyle=water;g.lineWidth=L(1.6);g.beginPath();g.arc(P(PALACE.x),P(PALACE.z),L(PALACE.r+.8),0,7);g.stroke();
 // Gleisbett Yamanote
 g.strokeStyle='#DCD5C8';g.lineWidth=L(2.2);g.beginPath();g.ellipse(P(YM.cx),P(YM.cz),L(YM.rx),L(YM.rz),0,0,7);g.stroke();
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

/* ---------- Wahrzeichen ---------- */
const RED='#E8452C',WHITE='#FAFAF7',ROOF='#4A4F5E',BRICK='#B5523B',GLASS='#BFD8EE';
function tokyoTower(){const g=new THREE.Group();
 const sec=[[0,7,3.4,2.1,RED],[7,1.2,2.4,2.4,WHITE],[8.2,5,2.0,1.2,RED],[13.2,2,1.25,1.0,WHITE],[15.2,3,1.0,.7,RED],[18.2,1,.9,.9,WHITE],[19.2,5,.6,.18,RED]];
 for(const[y,h,rb,rt,c] of sec){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,4).translate(0,h/2,0),M(c));m.rotation.y=Math.PI/4;m.position.y=y;g.add(m);}
 g.add(box(3.4,.9,3.4,WHITE,0,7.6,0));g.add(box(1.9,.6,1.9,WHITE,0,14.6,0));g.add(cyl(.06,.12,4,5,WHITE,0,24,0));return g;}
function skytree(){const g=new THREE.Group();const c='#E6EEF5';
 g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2,2.8,9,3).translate(0,4.5,0),M(c)));
 g.add(cyl(1.0,1.2,15,8,c,0,9,0));g.add(cyl(2.1,1.8,1.6,12,'#CBD8E4',0,24,0));g.add(cyl(2.2,2.2,.3,12,'#8FB5DA',0,24.9,0));
 g.add(cyl(.6,.9,9,8,c,0,25.6,0));g.add(cyl(1.35,1.2,.9,12,'#CBD8E4',0,34.6,0));g.add(cyl(.15,.5,9,6,c,0,35.5,0));return g;}
function sensoji(){const g=new THREE.Group();
 // Haupthalle
 g.add(box(6,2.2,4.4,'#C8372D',0,.4,-4));g.add(box(6.6,.4,5,'#F2EEE6',0,0,-4));g.add(cone4(4.7,2.4,ROOF,0,2.6,-4,1,.72));
 // Pagode
 for(let i=0;i<5;i++){const y=.4+i*1.25,w=1.7-i*.14;g.add(box(w,.9,w,'#C8372D',-5.2,y,-3.5));g.add(cone4(1.75-i*.13,.55,ROOF,-5.2,y+.9,-3.5));}
 g.add(cyl(.05,.1,2,5,'#C9A54B',-5.2,6.9,-3.5));
 // Nakamise-Stände
 for(let i=0;i<4;i++)for(const sx of [-1.4,1.4]){g.add(box(.9,.8,1.1,i%2?'#F6E7D0':'#FFFFFF',sx,0,.2+i*1.3));g.add(box(1.1,.15,1.3,'#D9342B',sx,.8,.2+i*1.3));}
 // Kaminarimon
 g.add(box(.45,2.3,.45,'#D2302A',-1.4,0,6));g.add(box(.45,2.3,.45,'#D2302A',1.4,0,6));g.add(box(3.6,.35,1.2,'#D2302A',0,2.3,6));g.add(cone4(2.6,1,ROOF,0,2.6,6,1,.5));
 const lan=cyl(.62,.62,1.3,12,'#E23A2E',0,.9,6);g.add(lan);g.add(cyl(.66,.66,.14,12,'#222',0,.86,6));
 return g;}
function shibuyaCrossing(){const g=new THREE.Group();const z=M('#FFFFFF');
 const road=box(12,.04,12,'#9AA0A8',0,0,0);g.add(road);
 for(let i=-2;i<=2;i++){for(const [x,zz,rx] of [[i*1.1,-4.4,0],[i*1.1,4.4,0],[-4.4,i*1.1,1],[4.4,i*1.1,1]]){const m=new THREE.Mesh(BOX,z);m.scale.set(rx?1.8:.55,.03,rx?.55:1.8);m.position.set(x,.04,zz);g.add(m);}}
 for(const a of [Math.PI/4,-Math.PI/4])for(let i=-3;i<=3;i++){const m=new THREE.Mesh(BOX,z);m.scale.set(.5,.03,1.6);m.rotation.y=a;m.position.set(Math.cos(a)*i*1.05,.05,-Math.sin(a)*i*1.05);g.add(m);}
 g.add(cyl(1.5,1.5,8,12,'#D8DDE3',-8.5,0,-8.5));g.add(cyl(1.55,1.55,.6,12,'#E8452C',-8.5,7.4,-8.5));
 g.add(box(4.5,24,4.5,'#C9DCEE',8.5,0,-8.5));g.add(box(4.9,.6,4.9,'#9BB9D6',8.5,24,-8.5));
 g.add(box(4,9,3.5,'#E9ECEF',-8.3,0,8.3));
 const scr=new THREE.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,128,96);gr.addColorStop(0,'#FF6FA8');gr.addColorStop(.5,'#FFC93C');gr.addColorStop(1,'#3D7BD9');x.fillStyle=gr;x.fillRect(0,0,128,96);x.fillStyle='#fff';x.font='bold 30px sans-serif';x.fillText('渋谷',30,60);return c})());scr.colorSpace=THREE.SRGBColorSpace;
 const sm=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.6),new THREE.MeshBasicMaterial({map:scr}));sm.position.set(-8.3,6.6,6.52);sm.rotation.y=Math.PI;g.add(sm);
 g.add(box(4,7,3.5,'#F1EEE8',8.3,0,8.3));const sm2=sm.clone();sm2.position.set(8.3,5,6.52);g.add(sm2);
 return g;}
function shinjukuTowers(){const g=new THREE.Group();
 // Rathaus (Doppeltürme)
 g.add(box(8,9,5.5,'#D7DBE1',0,0,0));for(const sx of [-2.2,2.2]){g.add(box(3,13,3,'#D7DBE1',sx,9,0));const t=box(2.1,2,2.1,'#C3C9D2',sx,22,0);t.rotation.y=Math.PI/4;g.add(t);}
 g.add(box(1.4,.8,5.6,'#B8C0CB',0,8.6,0));
 // Cocoon Tower
 const c=cyl(1.3,1.9,18,10,'#7FA9D6',9,0,8);c.scale.set(1,1,.75);g.add(c);const top=new THREE.Mesh(new THREE.SphereGeometry(1.3,10,6,0,Math.PI*2,0,Math.PI/2),M('#7FA9D6'));top.position.set(9,18,8);top.scale.set(1,1.4,.75);g.add(top);
 // Uhrenturm-Hochhaus
 g.add(box(2.8,16,2.8,'#AFC3D8',-9,0,10));g.add(cone4(2,3,'#AFC3D8',-9,16,10));g.add(cyl(.06,.1,3,5,'#AFC3D8',-9,19,10));
 return g;}
function tokyoStation(){const g=new THREE.Group();
 g.add(box(3,2.4,18,BRICK,0,0,0));g.add(box(3.2,.3,18.2,'#F2EEE6',0,1.2,0));
 for(const z of [-8,0,8]){g.add(box(3.6,3.2,3.2,BRICK,0,0,z));const d=new THREE.Mesh(new THREE.SphereGeometry(1.6,12,6,0,Math.PI*2,0,Math.PI/2),M('#5C6370'));d.position.set(0,3.2,z);g.add(d);}
 return g;}
function palace(){const g=new THREE.Group();
 g.add(box(2.4,1.3,1.6,WHITE,3,0,-4));g.add(cone4(2,1,ROOF,3,1.3,-4,1,.7));g.add(box(1.2,.8,1,WHITE,3,1.4,-4));
 g.add(box(5,.3,1.2,'#B9BDC3',8.4,.3,4));g.add(box(.5,.3,1.2,'#B9BDC3',6.2,0,4));
 g.add(box(4,1.2,3,'#EDE9E0',-2,0,1));g.add(cone4(3,.9,'#5A8C6B',-2,1.2,1,1,.75));return g;}
function akamon(){const g=new THREE.Group();
 for(const sx of [-1.5,1.5]){g.add(box(.45,2.2,.45,'#C9302C',sx,0,0));}g.add(box(4,.5,1.4,'#C9302C',0,2.2,0));g.add(cone4(2.8,1.1,ROOF,0,2.6,0,1,.5));
 g.add(box(3.6,1.6,.3,'#F3EEE6',-4.2,0,0));g.add(box(3.6,1.6,.3,'#F3EEE6',4.2,0,0));
 // Yasuda-Auditorium
 g.add(box(7,3,3.4,'#B0563E',0,0,-7));g.add(box(1.8,6,1.8,'#B0563E',0,0,-6));g.add(cone4(1.4,1,'#5C6370',0,6,-6));g.add(box(.9,.9,.1,'#FFFFFF',0,4.6,-5.08));return g;}
function moriTower(){const g=new THREE.Group();const t=cyl(2.4,2.8,24,8,'#9FB1C4',0,0,0);g.add(t);g.add(cyl(2.8,2.4,1.8,8,'#7E93AA',0,24,0));g.add(box(8,2,6,'#E3E7EC',0,0,5));return g;}
function torii(){const g=new THREE.Group();g.add(box(.35,2.6,.35,'#E2452F',-1.2,0,0));g.add(box(.35,2.6,.35,'#E2452F',1.2,0,0));g.add(box(3.6,.32,.5,'#E2452F',0,2.6,0));g.add(box(3.2,.22,.4,'#2B2D42',0,2.9,0));g.add(box(3,.25,.3,'#E2452F',0,2.05,0));return g;}
function rainbowBridge(a,b){const g=new THREE.Group();const A=new THREE.Vector3(a[0],3,a[1]),B=new THREE.Vector3(b[0],3,b[1]);
 const dir=B.clone().sub(A),len=dir.length(),ang=Math.atan2(dir.x,dir.z);
 const deck=new THREE.Mesh(CBOX,M('#F4F4F2'));deck.scale.set(1.6,.5,len);deck.position.copy(A.clone().add(B).multiplyScalar(.5));deck.rotation.y=ang;g.add(deck);
 const T1=A.clone().lerp(B,.3),T2=A.clone().lerp(B,.7);
 for(const T of [T1,T2]){const tw=new THREE.Group();tw.position.set(T.x,0,T.z);tw.rotation.y=ang;for(const sx of [-.8,.8])tw.add(box(.45,11,.6,'#FFFFFF',sx,0,0));tw.add(box(2.1,.4,.6,'#FFFFFF',0,6,0));tw.add(box(2.1,.4,.6,'#FFFFFF',0,10.5,0));g.add(tw);}
 const cable=(p0,p1,sag)=>{const mid=p0.clone().lerp(p1,.5);mid.y-=sag;const c=new THREE.QuadraticBezierCurve3(p0,mid,p1);g.add(new THREE.Mesh(new THREE.TubeGeometry(c,16,.09,4),M('#FFFFFF')));};
 for(const s of [-.75,.75]){const off=new THREE.Vector3(Math.cos(ang)*s,0,-Math.sin(ang)*s);
  const t1=T1.clone().add(off).setY(11),t2=T2.clone().add(off).setY(11),a1=A.clone().add(off).setY(3.3),b1=B.clone().add(off).setY(3.3);
  cable(t1,t2,6.5);cable(a1,t1,-1.5);cable(t2,b1,-1.5);}
 for(const p of [A,B])g.add(box(1.8,3,1.8,'#E6E2DA',p.x,0,p.z));return g;}
function fujiTV(){// v3.2: Gitterbau aus zwei Türmen, verbunden durch Träger, mit silberner Kugel (Palette: Weiß, Glasblau, Grau)
 const g=new THREE.Group(),FR='#F4F6F8',GL='#7FB2DA',BE='#B9BDC3';
 const tower=(cx,w,d,h)=>{g.add(box(w-.5,h-.2,d-.5,GL,cx,0,0));// Glaskern
  for(const sx of [-1,1])for(const sz of [-1,1])g.add(box(.45,h,.45,FR,cx+sx*(w/2-.22),0,sz*(d/2-.22)));// Eckstützen
  for(let y=0;y<=h;y+=1.6){g.add(box(w,.28,.4,FR,cx,y,d/2-.2));g.add(box(w,.28,.4,FR,cx,y,-d/2+.2));g.add(box(.4,.28,d,FR,cx-w/2+.2,y,0));g.add(box(.4,.28,d,FR,cx+w/2-.2,y,0));}
  for(let k=-1;k<=1;k+=2)g.add(box(.3,h,.42,FR,cx+k*w/6,0,d/2-.2));};
 tower(-3.3,3.6,4.2,8);tower(3.3,3.6,4.2,9.6);
 for(const y of [1.6,4.8,8])g.add(box(3,.5,1.2,BE,0,y,1.2)),g.add(box(3,.5,1.2,BE,0,y,-1.2));// Verbindungsträger
 g.add(box(3,.5,4.2,FR,0,6.4,0));// Brückendeck unter der Kugel
 const s=new THREE.Mesh(new THREE.SphereGeometry(1.9,16,12),new THREE.MeshLambertMaterial({color:'#D9DEE4'}));s.position.set(0,8.6,0);g.add(s);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.95,.12,6,24),M(BE));ring.rotation.x=Math.PI/2;ring.position.set(0,8.6,0);g.add(ring);
 return g;}

const LM_MAKE={'tokyo-tower':[tokyoTower,28],'skytree':[skytree,44],'sensoji':[sensoji,8],'shibuya-crossing':[shibuyaCrossing,6],'shinjuku-rathaus':[shinjukuTowers,24],'tokyo-station':[tokyoStation,5],'kaiserpalast':[palace,3],'akamon':[akamon,6],'roppongi-hills':[moriTower,26],'gotokuji':[torii,4],'odaiba':[fujiTV,8],'haneda':[airport,3]};
// V4: mit Wolkenkratzern steht auf dem Rathaus-Block Yukis Tocho-Zwillingsturm (buildTowers); das Wahrzeichen bleibt als Vorplatz
function tochoPlaza(){const g=new THREE.Group();g.add(box(8,.3,8,'#D9D4C7',0,0,0));return g;}
if(SKYSCRAPERS&&TOWERS.some(t=>t.landmark==='shinjuku-rathaus'))LM_MAKE['shinjuku-rathaus']=[tochoPlaza,1];
if(STIL5){LM_MAKE['skytree']=[()=>skytree5(FIELD),60];LM_MAKE['tokyo-tower']=[()=>tokyoTower5(FIELD),33];LM_MAKE['roppongi-hills']=[()=>roppongi5(FIELD),30];LM_MAKE['kaiserpalast']=[()=>palace5(FIELD),6];LM_MAKE['tokyo-station']=[()=>station5(FIELD),7];LM_MAKE['shibuya-crossing']=[()=>shibuya5(FIELD),10];LM_MAKE['gotokuji']=[()=>gotoku5(FIELD),6];LM_MAKE['akamon']=[()=>akamon5(FIELD),7];LM_MAKE['odaiba']=[()=>fujiTV5(FIELD),17];}// V5: Skytree aus dem freigegebenen Musterausschnitt (Runde 10)
// Yokohama: Wahrzeichen aus Yukis Bauvorlagen (nur ?stadt=yokohama), ersetzen die Torii-Platzhalter
const YLM=PCITY&&['yokohama','osaka','kyoto','nagoya'].includes(PCITY.id)?await fetch(`grafik/landmarks/${PCITY.id}/bauvorlagen/bauvorlagen.json`,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null):null;// neue Städte gibt es nur mit ?neuestaedte=1 (cities.js)
const YSPEC=Object.fromEntries(((YLM&&YLM.wahrzeichen)||[]).map(w=>[w.id,w]));
for(const w of Object.values(YSPEC)){if(PCITY&&PCITY.id!=='yokohama')w.neu=true;w.teile=w.teile.filter(t=>!/Referenz-Auto/.test(t.name||''));}// rotes Maßstabs-Auto nicht bauen
for(const w of Object.values(YSPEC))if(w.id!=='bay-bridge')LM_MAKE[w.id]=[()=>buildYokohamaLM(w,FIELD),(w.id==='landmark-tower'?LT_HEIGHT:w.id==='cosmo-clock'?2.7:w.hoehe)*FIELD];
const LANDMARKS=LANDMARK_AREAS.map(w=>({id:w.wahrzeichen,name:w.name,x:w.cx,z:w.cz,w:w.w,d:w.d,make:(LM_MAKE[w.wahrzeichen]||[torii])[0],h:(LM_MAKE[w.wahrzeichen]||[0,6])[1]}));
function airport(){const g=new THREE.Group();g.add(box(9,2,4.5,'#F4F6F8',-10,0,-6.5));g.add(box(9.4,.4,4.9,'#3D7BD9',-10,2,-6.5));g.add(box(1.2,6,1.2,'#F4F6F8',4,0,-7));g.add(box(2.6,1.4,2.6,'#9ED8F0',4,6,-7));
 const pl=new THREE.Group();pl.add(box(.9,.9,6,'#FFFFFF',0,0,0));pl.add(box(7,.2,1.4,'#FFFFFF',0,.4,.4));pl.add(box(2.6,.15,.8,'#FFFFFF',0,.5,-2.6));pl.add(box(.2,1.6,.9,'#3D7BD9',0,.8,-2.7));pl.position.set(8,.2,1.5);pl.rotation.y=Math.PI/2;g.add(pl);return g;}
// mehrere Meshes zu einem Mesh mit Vertexfarben zusammenfassen (1 Draw Call)
function bake(root){root.updateMatrixWorld(true);const P=[],Nn=[],C=[],keep=[];
 root.traverse(o=>{if(!o.isMesh)return;if(o.material.map||o.material.userData.keep){keep.push(o);return;}const g0=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g0.applyMatrix4(o.matrixWorld);
  const p=g0.attributes.position,n=g0.attributes.normal,c=o.material.color;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));Nn.push(n.getX(i),n.getY(i),n.getZ(i));C.push(c.r,c.g,c.b);}g0.dispose();});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
 const out=new THREE.Group();out.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})));for(const k of keep){k.updateMatrixWorld(true);const m=k.clone();m.matrixAutoUpdate=false;m.matrix.copy(k.matrixWorld);out.add(m);}return out;}
const BRIDGE=[[58,79],[92,95]];


/* ---------- Brücken (stadtplan-bruecken.json, Yukis Texturen) ---------- */
function bridgeTex(url,rep){const t=new THREE.TextureLoader().load(url);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,1);return t;}
function asphaltTex(lanes){const c=document.createElement('canvas');c.width=64;c.height=64*lanes;const g=c.getContext('2d');g.fillStyle='#4A4D52';g.fillRect(0,0,64,c.height);g.fillStyle='#F4F1EA';g.fillRect(0,4,64,3);g.fillRect(0,c.height-7,64,3);g.fillStyle='#D8DBE0';g.fillRect(16,c.height/2-1.5,32,3);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
function buildBridges(){const g=new THREE.Group();
 for(const b of BRIDGES){if(b.felder&&b.art!=='haengebruecke')continue;// V6: kleine Brücken sind Straßenfelder im Plan; nur die Regenbogenbrücke (mit Auffahrt) als 3D-Modell
  const ax=wx(b.von[0]+.5),az=wz(b.von[1]+.5),bx=wx(b.bis[0]+.5),bz=wz(b.bis[1]+.5);
  const dx=bx-ax,dz=bz-az,len0=Math.hypot(dx,dz),ux=dx/len0,uz=dz/len0,len=len0+FIELD,cx=(ax+bx)/2,cz=(az+bz)/2,ang=Math.atan2(-dz,dx);
  const w=(b.breite||1)*FIELD,H=.6,ramp=FIELD*.9,big=b.art==='haengebruecke',BAYB=b.id==='bay-bridge'&&YSPEC['bay-bridge'];
  const grp=new THREE.Group();grp.position.set(cx,0,cz);grp.rotation.y=ang;g.add(grp);// lokale x-Achse = Brückenrichtung
  // Fahrbahn: Mittelteil + zwei Rampen bis auf Straßenniveau
  const rails=new THREE.Group();
  const deck=(x0,x1,y0,y1)=>{const l=x1-x0,geo=new THREE.PlaneGeometry(Math.hypot(l,y1-y0),w);geo.rotateX(-Math.PI/2);geo.rotateZ(Math.atan2(y1-y0,l));geo.rotateY(Math.PI/2);geo.rotateY(-Math.PI/2);
   const t=bridgeTex('grafik/bruecken/fahrbahn.svg');t.wrapT=THREE.RepeatWrapping;t.rotation=Math.PI/2;t.center.set(.5,.5);t.repeat.set(Math.max(1,Math.round(l/FIELD)),b.breite||1);
   const m=new THREE.Mesh(geo,STIL5?new THREE.MeshLambertMaterial({map:asphaltTex(b.breite||1)}):new THREE.MeshLambertMaterial({map:t}));m.position.set((x0+x1)/2,(y0+y1)/2+.02,0);m.receiveShadow=true;grp.add(m);};
  deck(-len/2,-len/2+ramp,0,H);deck(-len/2+ramp,len/2-ramp,H,H);deck(len/2-ramp,len/2,H,0);
  // Seitenansicht (Träger/Pylone) als Textur, Geländer als schmale Leisten
  const sh=big?6:1.6,st=bridgeTex(big?'grafik/bruecken/rainbow-seite.svg':'grafik/bruecken/balken-seite.svg');st.offset.y=.22;st.repeat.y=.78;
  for(const sz of [-1,1]){if(STIL5){rails.add(box(len-2*ramp,.7,.3,'#F4F6F8',0,H-.7,sz*(w/2+.1)));}else{const pg=new THREE.PlaneGeometry(len-2*ramp,sh);const m=new THREE.Mesh(pg,new THREE.MeshLambertMaterial({map:st,transparent:true,alphaTest:.3,side:THREE.DoubleSide}));
   m.position.set(0,H+sh/2-(big?.6:1.1),sz*(w/2+.05));grp.add(m);}
   rails.add(box(len-2*ramp,.35,.12,'#F4F6F8',0,H+.05,sz*(w/2-.06)));// Geländer
   for(let k=-len/2+ramp;k<=len/2-ramp;k+=1.6)rails.add(box(.1,.4,.1,'#F4F6F8',k,H,sz*(w/2-.06)));}
  if(BAYB)rails.add(bayBridgeParts(BAYB,FIELD,len-2*ramp,H));// Schrägseilbrücke mit 2 Pylonen (Yuki)
  if(big&&!BAYB)for(const f of [-.25,.25])for(const sz of [-1,1])rails.add(box(STIL5?.35:.5,7.5,STIL5?.35:.5,'#F4F6F8',f*(len-2*ramp),0,sz*(w/2+.2)));// Pylone
  if(big&&STIL5&&!BAYB)for(const f of [-.25,.25])rails.add(box(.35,.35,w+.75,'#F4F6F8',f*(len-2*ramp),7.2,0));// Pylon-Querriegel
  if(STIL5)for(let k=-len/2+ramp+3;k<len/2-ramp-1;k+=6)rails.add(box(.8,H+.6,w*.5,'#D9DCE0',k,-.6,0));// Pfeiler
  if(big&&STIL5&&!BAYB){// Tragseile (gerade Segmente) + Hänger + Schleifenauffahrt
   const seg=(x0,y0,x1,y1,z,t,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x1-x0,y1-y0),t,t),new THREE.MeshLambertMaterial({color:col}));m.position.set((x0+x1)/2,(y0+y1)/2,z);m.rotation.z=Math.atan2(y1-y0,x1-x0);rails.add(m);};
   const L=len-2*ramp,p1=-.25*L,p2=.25*L,top=7.4,cy=x=>{if(x<p1)return top-(top-H-.5)*(p1-x)/(p1+L/2);if(x>p2)return top-(top-H-.5)*(x-p2)/(L/2-p2);const u=(x-p1)/(p2-p1);return H+.9+(top-H-.9)*Math.pow(2*u-1,2);};
   for(const sz of [-1,1]){const z=sz*(w/2+.2);const xs=[];for(let i=0;i<=24;i++)xs.push(-L/2+L*i/24);xs.push(p1,p2);xs.sort((a,b)=>a-b);
    for(let i=0;i<xs.length-1;i++)if(xs[i+1]-xs[i]>.01)seg(xs[i],cy(xs[i]),xs[i+1],cy(xs[i+1]),z,.22,'#FFFFFF');
    for(let x=-L/2+1.2;x<L/2-.6;x+=1.2){const y=cy(x);if(y-H>.5)rails.add(box(.07,y-H-.1,.07,'#E8ECEF',x,H+.1,z));}}
   // Schleife: achteckige Rampe (gerade Stücke) am Westende, steigt von 0 auf H
   const R=FIELD*1.05,ox=-len/2+ramp*.4,oz=-(w/2+R+.4),n=8,am=new THREE.MeshLambertMaterial({map:asphaltTex(1)});
   for(let i=0;i<n;i++){const a0=Math.PI/2+i*2*Math.PI/n,a1=a0+2*Math.PI/n,x0=ox+Math.cos(a0)*R,z0=oz+Math.sin(a0)*R,x1=ox+Math.cos(a1)*R,z1=oz+Math.sin(a1)*R,y0=H*i/n,y1=H*(i+1)/n,l=Math.hypot(x1-x0,z1-z0)+.3;
    const m=new THREE.Mesh(new THREE.BoxGeometry(l,.3,FIELD*.55),am);m.position.set((x0+x1)/2,(y0+y1)/2+.15,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);m.rotation.z=Math.atan2(y1-y0,l);grp.add(m);
    const e=new THREE.Mesh(new THREE.BoxGeometry(l,.35,.12),new THREE.MeshLambertMaterial({color:'#F4F6F8'}));e.position.copy(m.position);e.position.y+=.3;e.rotation.copy(m.rotation);e.translateZ(-FIELD*.28);grp.add(e);
    rails.add(box(.5,(y0+y1)/2+.15,.5,'#D9DCE0',(x0+x1)/2,0,(z0+z1)/2));}
  }
  grp.add(bake(rails));
 }
 return g;}

/* ---------- Store-Sites ---------- */
function footprintBlocked(x,z,r){
 for(const l of LANDMARKS){if(l.long){if(Math.abs(x-l.x)<l.r+r&&Math.abs(z-l.z)<l.long+r)return true;}else if(Math.hypot(x-l.x,z-l.z)<l.r+r)return true;}
 for(let i=0;i<=10;i++){const p=[BRIDGE[0][0]+(BRIDGE[1][0]-BRIDGE[0][0])*i/10,BRIDGE[0][1]+(BRIDGE[1][1]-BRIDGE[0][1])*i/10];if(Math.hypot(x-p[0],z-p[1])<2+r)return true;}
 return false;
}
export const SLOTS=Object.fromEntries(Object.entries(PLAN_SLOTS).map(([d,a])=>[d,a.map(sh=>({x:sh.x,z:sh.z,rot:sh.rot,k:sh.k,h:sh.h}))]));

/* ---------- Laden-Modell (Karte & Vorschau) ---------- */
const texCache=new Map();
function svgTex(key,svg,w,h,fallback){
 if(texCache.has(key))return texCache.get(key);
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');fallback&&fallback(ctx,w,h);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 if(svg)svgImage(svg).then(img=>{ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);t.needsUpdate=true;}).catch(()=>{});
 texCache.set(key,t);if(texCache.size>120){const k=texCache.keys().next().value;texCache.get(k).dispose();texCache.delete(k);}return t;
}
function bannerFallback(main,second,name){return (ctx,w,h)=>{ctx.fillStyle=main;ctx.fillRect(0,0,w,h);ctx.fillStyle=second;ctx.font=`bold ${h*.42}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((name||'').toUpperCase(),w/2,h/2);};}
export function chainLook(chain,logo,design){
 if(chain==='player'){const fac=FACADES.find(f=>f.id===design.facade)||FACADES[0];return {main:logo.bg.toLowerCase()==='#ffffff'?logo.fg:logo.bg,second:logo.bg.toLowerCase()==='#ffffff'?'#ffffff':logo.fg,facade:fac.c||shade(logo.bg,.75),name:logo.name,logo};}
 const c=CHAINS[chain];return {main:c.color,second:c.color2,facade:'#FFFFFF',name:c.name,rival:chain};
}
function logoTex(look){
 if(look.rival){const k='rl_'+look.rival;return svgTex(k,GFX.svg['logo_'+look.rival],256,256,(ctx,w)=>ctx.drawImage(logoCanvas(look.rival,w),0,0));}
 const k='pl_'+LG.logoVer+JSON.stringify(look.logo);return svgTex(k,null,256,256,(ctx,w)=>ctx.drawImage(logoCanvas(look.logo,w),0,0));
}
const FAC_DIM=[[3.2,2.6],[4.2,3.1],[5.4,3.6]];
export function buildStore(chain,logo,design,{interior=false}={}){
 const look=chainLook(chain,logo,design),[w,d]=FAC_DIM[design.layout??1],h=1.9,g=new THREE.Group();
 const corner=design.building===1;
 g.add(box(w+.5,.12,d+.5,'#D9D5CC',0,0,0));
 const fM=M(look.facade),mainM=M(look.main),secM=M(look.second);
 if(interior){
  // Puppenhaus-Ansicht: Wände ohne Dach
  g.add(box(w,h,.1,fM,0,.12,-d/2+.05));g.add(box(.1,h,d,fM,-w/2+.05,.12,0));
  if(!corner)g.add(box(.1,h,d,fM,w/2-.05,.12,0));
  g.add(box(w,.45,.1,fM,0,.12,d/2-.05));
  const glass=new THREE.MeshLambertMaterial({color:'#BFE6FF',transparent:true,opacity:.28});
  const gl=new THREE.Mesh(BOX,glass);gl.scale.set(w*.96,h-.6,.04);gl.position.set(0,.57,d/2-.05);g.add(gl);
  if(corner){const gs=gl.clone();gs.scale.set(.04,h-.6,d*.96);gs.position.set(w/2-.05,.57,0);g.add(gs);g.add(box(.1,.45,d,fM,w/2-.05,.12,0));}
  const floorC=['#EEF1F4','#F7FBFF','#E9D6BC'][design.lighting];g.add(box(w-.2,.04,d-.2,floorC,0,.12,0));
  addInterior(g,design,look,w,d,h);
 }else{
  g.add(box(w,h,d,fM,0,.12,0));
  g.add(box(w+.06,.1,d+.06,'#C9CDD3',0,h+.12,0));
  g.add(box(.8,.35,.6,'#B9BEC6',-w*.25,h+.22,-d*.15));
  const glassM=M('#A9DCF5',{emissive:'#3D7BD9',emissiveIntensity:.15});
  g.add(box(w*.82,1.05,.06,glassM,0,.2,d/2+.01));
  if(corner)g.add(box(.06,1.05,d*.8,glassM,w/2+.01,.2,0));
 }
 // Farbbänder
 if(interior){// nur Ränder, damit man von oben hineinsieht
  for(const [bw,bd,bx,bz] of [[w+.08,.14,0,-d/2],[w+.08,.14,0,d/2],[.14,d+.08,-w/2,0],[.14,d+.08,w/2,0]]){g.add(box(bw,.32,bd,mainM,bx,h-.28,bz));g.add(box(bw,.09,bd,secM,bx,h-.38,bz));}
 }else{g.add(box(w+.08,.32,d+.08,mainM,0,h-.28,0));g.add(box(w+.08,.09,d+.08,secM,0,h-.38,0));}
 // Schild
 const st=design.sign||0;
 if(look.rival){
  const lt=logoTex(look);const p=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshLambertMaterial({map:lt,transparent:true}));p.position.set(-w*.3,h-.3,d/2+.07);g.add(p);
  const p2=p.clone();p2.scale.set(1.5,1.5,1);p2.position.set(0,h+.95,0);const holder=box(.12,.7,.12,'#9AA0A8',0,h+.12,0);g.add(holder);const back=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshLambertMaterial({map:lt,transparent:true}));back.scale.copy(p2.scale);back.position.copy(p2.position);back.rotation.y=Math.PI;g.add(p2,back);
 }else{
  const key='s'+st+look.main+look.second+look.name;
  if(st===0){const t=svgTex(key,svgColored('sign0',{main:look.main,second:look.second,name:look.name}),512,128,bannerFallback(look.main,look.second,look.name));
   const p=new THREE.Mesh(new THREE.PlaneGeometry(w*.8,w*.2),new THREE.MeshLambertMaterial({map:t,transparent:true}));p.position.set(0,h-.25,d/2+.08);g.add(p);}
  else if(st===1){const t=svgTex(key,svgColored('sign1',{main:look.main,second:look.second,name:look.name,nameJp:'コンビニ'}),512,154,bannerFallback(look.main,look.second,'コンビニ'));
   const p=new THREE.Mesh(new THREE.PlaneGeometry(w*.62,w*.62*.3),new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide}));p.position.set(0,1.05,d/2+.12);g.add(p);
   const s0=svgTex(key+'b',svgColored('sign0',{main:look.main,second:look.second,name:look.name}),512,128,bannerFallback(look.main,look.second,look.name));const pb=new THREE.Mesh(new THREE.PlaneGeometry(w*.8,w*.2),new THREE.MeshLambertMaterial({map:s0,transparent:true}));pb.position.set(0,h-.25,d/2+.08);g.add(pb);}
  else{const t=svgTex(key,svgColored('sign2',{main:look.main,second:look.second,name:look.name}),200,300,bannerFallback(look.main,look.second,'24'));
   g.add(cyl(.08,.1,3.6,6,'#8E949C',w/2+.7,0,d/2-.2));const p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.95),new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide}));p.position.set(w/2+.7,3.9,d/2-.2);g.add(p);
   const s0=svgTex(key+'b',svgColored('sign0',{main:look.main,second:look.second,name:look.name}),512,128,bannerFallback(look.main,look.second,look.name));const pb=new THREE.Mesh(new THREE.PlaneGeometry(w*.8,w*.2),new THREE.MeshLambertMaterial({map:s0,transparent:true}));pb.position.set(0,h-.25,d/2+.08);g.add(pb);}
  // Logo-Würfel auf dem Dach
  if(!interior){const lt=logoTex(look);const lm=new THREE.MeshLambertMaterial({map:lt,transparent:true});
  for(const r of [0,Math.PI]){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.15),lm);p.position.set(w*.28,h+.85,0);p.rotation.y=r;g.add(p);}g.add(box(.1,.4,.1,'#9AA0A8',w*.28,h+.12,0));}
 }
 // Markise
 const aw=design.awning||0;
 if(aw){const t=svgTex('a'+aw+look.main+look.second,svgColored('awn'+aw,{main:look.main,second:look.second}),512,128,(ctx,W,H)=>{for(let i=0;i<8;i++){ctx.fillStyle=i%2?look.second:look.main;ctx.fillRect(i*W/8,0,W/8,H)}});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w*.86,.62),new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide}));p.position.set(0,1.42,d/2+.3);p.rotation.x=-.55;g.add(p);}
 g.userData.look=look;return g;
}
function addInterior(g,D,look,w,d,h){
 const y0=.16,shelfH=D.shelves===1?1.15:.75,n=[2,3,4][D.layout??1];
 const cols=['#FF8A80','#FFD180','#A5D6A7','#81D4FA','#CE93D8','#FFCC80'];
 for(let i=0;i<n;i++){const x=-w/2+.75+i*((w-1.7)/Math.max(1,n-1))*.82;const sh=box(.32,shelfH,d*.42,'#FFFFFF',x,y0,-.15);g.add(sh);
  for(let j=0;j<3;j++)g.add(box(.36,.08,d*.4,cols[(i+j)%6],x,y0+.2+j*shelfH/3.2,-.15));}
 if(D.shelves===2){g.add(box(w*.78,1.3,.32,'#DFF3FF',0,y0,-d/2+.3,{emissive:'#7FC8F8',emissiveIntensity:.35}));for(let j=0;j<3;j++)g.add(box(w*.74,.06,.3,cols[j+2],0,y0+.35+j*.32,-d/2+.32));}
 else g.add(box(w*.6,.9,.28,'#F2F2F2',-w*.1,y0,-d/2+.28));
 // Kasse
 const cx=w/2-.75,cz=d/2-.75;
 if(D.counter===2){for(const o of [0,.6]){g.add(box(.36,.85,.36,'#2B2D42',cx-o,y0,cz));g.add(box(.3,.22,.04,'#7FD3FF',cx-o,y0+.75,cz+.2,{emissive:'#7FD3FF',emissiveIntensity:.6}));}}
 else{g.add(box(1.1,.62,.45,look.main,cx,y0,cz-(D.counter===1?.55:0)));if(D.counter===1)g.add(box(1.1,.62,.45,look.main,cx,y0,cz+.05));}
 // Kaffee
 if(D.coffee===1)g.add(box(.3,.42,.3,'#3A3A3A',cx-.35,y0+.62,cz-(D.counter===1?.55:0)));
 if(D.coffee===2){g.add(box(1,.62,.42,'#B07A4F',-w/2+.75,y0,d/2-.7));g.add(box(.34,.46,.3,'#2B2D42',-w/2+.6,y0+.62,d/2-.7));g.add(box(.18,.12,.18,'#F7E6D0',-w/2+.95,y0+.62,d/2-.7));}
 // Sitzplätze
 if(D.eatin>=1){g.add(box(w*.5,.07,.28,'#E8D4B8',0,y0+.6,d/2-.25));for(let i=0;i<3;i++)g.add(cyl(.11,.11,.55,8,'#5B4B8A',-w*.18+i*w*.18,y0,d/2-.55));}
 if(D.eatin===2){for(const tx of [-w*.25,w*.05]){g.add(cyl(.32,.32,.05,12,'#FFFFFF',tx,y0+.5,.55));g.add(cyl(.05,.05,.5,6,'#8E949C',tx,y0,.55));for(const a of [0,Math.PI])g.add(box(.25,.42,.25,'#F7A1B5',tx+Math.cos(a)*.48,y0,.55+Math.sin(a)*.1));}}
 // Licht
 const lc=['#FFFFFF','#EAF6FF','#FFD9A0'][D.lighting];
 if(D.lighting===2){for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:'#FFCF7A'}));s.position.set(-w*.3+i*w*.3,h-.35,0);g.add(s);g.add(box(.02,.3,.02,'#555',-w*.3+i*w*.3,h-.25,0));}}
 else for(let i=0;i<2;i++){const b=new THREE.Mesh(CBOX,new THREE.MeshBasicMaterial({color:lc}));b.scale.set(w*.6,.04,.12);b.position.set(0,h-.1,-d*.2+i*d*.4);g.add(b);}
 const pl=new THREE.PointLight(lc,D.lighting===2?6:D.lighting===1?7:5,8,1.6);pl.position.set(0,h-.2,0);g.add(pl);
}

/* ---------- Pins ---------- */
let _bn=null;
function bannerTex(){if(_bn)return _bn;const cv=document.createElement('canvas');cv.width=280;cv.height=70;const g=cv.getContext('2d');g.fillStyle='#FFC93C';g.fillRect(6,10,268,50);g.fillStyle='#2B2D42';g.font='bold 26px sans-serif';g.textAlign='center';g.fillText('BALD ERÖFFNET',140,44);_bn=new THREE.CanvasTexture(cv);_bn.colorSpace=THREE.SRGBColorSpace;if(GFX.svg.ban_soon)svgImage(GFX.svg.ban_soon).then(i=>{g.clearRect(0,0,280,70);g.drawImage(i,0,0,280,70);_bn.needsUpdate=true}).catch(()=>{});return _bn;}
const _op=new Map();
function ownPinTex(logo){const k=LG.logoVer+JSON.stringify(logo);if(_op.has(k))return _op.get(k);const cv=document.createElement('canvas');cv.width=256;cv.height=312;const g=cv.getContext('2d');const main=logo.bg.toLowerCase()==='#ffffff'?logo.fg:logo.bg;g.fillStyle=main;g.strokeStyle='#2B2D42';g.lineWidth=9;g.beginPath();g.moveTo(128,300);g.bezierCurveTo(96,256,28,220,28,128);g.arc(128,128,100,Math.PI,0);g.bezierCurveTo(228,220,160,256,128,300);g.fill();g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(128,124,72,0,7);g.fill();g.stroke();g.drawImage(logoCanvas(logo,120),68,64,120,120);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;_op.set(k,t);return t;}
/* ---------- Welt ---------- */
export function createWorld(container,cb){
 const isSmall=Math.min(innerWidth,innerHeight)<700;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,isSmall?2:1.75));
 renderer.setSize(container.clientWidth,container.clientHeight);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const sky=new THREE.Color(BG);scene.background=sky;renderer.setClearColor(sky,1);scene.fog=new THREE.Fog(sky,2000,3000);// v3.2: außerhalb der Karte dunkel
 // v3.2: feste isometrische Ansicht (orthografisch, ~35° Neigung, 45° Gierwinkel); nur Verschieben + Pinch-Zoom
 const asp=container.clientWidth/container.clientHeight,VH=CAM.viewH;
 const camera=new THREE.OrthographicCamera(-VH*asp/2,VH*asp/2,VH/2,-VH/2,-600,1200);
 const camOff=new THREE.Vector3(Math.sin(CAM.yaw)*Math.cos(CAM.elev),Math.sin(CAM.elev),Math.cos(CAM.yaw)*Math.cos(CAM.elev)).multiplyScalar(300);
 const controls=new MapControls(camera,renderer.domElement);
 controls.target.set(6,0,10);camera.position.copy(controls.target).add(camOff);camera.zoom=CAM.zoom0;camera.updateProjectionMatrix();
 controls.enableRotate=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.screenSpacePanning=false;
 controls.minZoom=CAM.minZoom;controls.maxZoom=CAM.maxZoom;controls.zoomSpeed=1.1;
 controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
 controls.update();
 scene.add(new THREE.HemisphereLight('#FFFFFF','#E9DFC9',2.1));
 const sun=new THREE.DirectionalLight('#FFF4E0',2.2);sun.position.set(-90,160,70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-150,right:150,top:150,bottom:-150,near:10,far:420});sun.shadow.bias=-.0006;sun.shadow.normalBias=.4;scene.add(sun);
 // Boden aus Yukis Stadtplan (Felder 64×64)
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2*R,2*R),new THREE.MeshLambertMaterial({map:planGround(YM)}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const outer=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshBasicMaterial({color:BG}));outer.rotation.x=-Math.PI/2;outer.position.y=-.05;scene.add(outer);
 // Wahrzeichen (12 Flächen aus dem Plan), je Wahrzeichen ein gebackenes Mesh
 const lmGroup=new THREE.Group();
 // V6 (Erik 25.10., Whitebeard 4816e73): das dunkle Hochhaus direkt hinter dem Tokyo Tower (Roppongi-Hills-Turm) entfällt; ?tuerme=alle zeigt es wieder (R39)
 const OHNE_LM=new URLSearchParams(location.search).get('tuerme')==='alle'?[]:['roppongi-hills'];
 for(const l of LANDMARKS){if(STIL5&&OHNE_LM.includes(l.id))continue;let o=l.make();const bb=new THREE.Box3().setFromObject(o),sz=bb.getSize(new THREE.Vector3());const k=Math.min(STIL5&&['akamon','sensoji'].includes(l.id)?1.6:1.25,l.w*.95/Math.max(.1,sz.x),l.d*.95/Math.max(.1,sz.z));if(/-castle$/.test(l.id)&&YSPEC[l.id]&&YSPEC[l.id].neu){o.scale.setScalar(.62*Math.min(l.w,l.d)/Math.max(.1,sz.x,sz.z));}// Burgen füllen ~60 % des Grundstücks (Erik 23:34)
  else if(k<1&&!(YSPEC[l.id]&&YSPEC[l.id].neu)&&!(STIL5&&['skytree','tokyo-tower','roppongi-hills','kaiserpalast','gotokuji','akamon','odaiba'].includes(l.id)))o.scale.setScalar(k);
  if(l.id==='tokyo-station'||l.id==='haneda'){if(l.w>l.d&&l.id==='tokyo-station'&&!STIL5)o.rotation.y=Math.PI/2;}
  const b=bake(o);b.position.set(l.x,0,l.z);b.updateMatrixWorld(true);l.box=new THREE.Box3().setFromObject(b);if(l.id==='tokyo-station'&&l.w>l.d)b.rotation.y=0;lmGroup.add(shadowAll(b));}
 scene.add(lmGroup);
 const bridges=buildBridges();scene.add(bridges);if(STIL5){{const HB=BRIDGES.filter(b=>b.art==='haengebruecke');scene.add(bridgeRails(PN,pCellAt,wx,wz,FIELD,(x,y)=>HB.some(b=>x>=Math.min(b.von[0],b.bis[0])-1&&x<=Math.max(b.von[0],b.bis[0])+1&&y>=Math.min(b.von[1],b.bis[1])-1&&y<=Math.max(b.von[1],b.bis[1])+1)));}}
 // v3.2: jedes Wahrzeichen auf eigenem Rasenblock mit Bordstein
 {const kg=new THREE.Group();for(const b of LM_BLOCKS){const x0=wx(b.x),x1=wx(b.x+b.breite),z0=wz(b.y),z1=wz(b.y+b.tiefe),k=.35,h=.32,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const KC=STIL5?'#F4F1EA':'#D9D4C7';kg.add(box(x1-x0,h,k,KC,cx,0,z0+k/2),box(x1-x0,h,k,KC,cx,0,z1-k/2),box(k,h,z1-z0,KC,x0+k/2,0,cz),box(k,h,z1-z0,KC,x1-k/2,0,cz));}
  const kb=bake(kg);kb.userData.kerbs=LM_BLOCKS.length;scene.add(kb);}
 // Gebäude: alle 334 Grundstücke in einem Mesh (Textur-Atlas), integrierte Läden in einem zweiten
 const city=buildCity();scene.add(city.mesh);const bl=city.lots;
 const towers=SKYSCRAPERS?buildTowers():new THREE.Group();scene.add(towers);
 const shops=buildShops();scene.add(shops.mesh);
 const mtx=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion(),e=new THREE.Euler();
 // Bäume (Parks laut Plan)
 const trees=treeSpots();
 const crownG=new THREE.IcosahedronGeometry(1,0);crownG.translate(0,1.6,0);const trunkG=STIL5?new THREE.CylinderGeometry(.12,.16,1,3,1,true):new THREE.CylinderGeometry(.12,.16,1,5);trunkG.translate(0,.5,0);
 const crowns=new THREE.InstancedMesh(crownG,new THREE.MeshLambertMaterial({color:'#ffffff',flatShading:true}),trees.length),trunks=new THREE.InstancedMesh(trunkG,M('#8B6B4A'),trees.length);
 trees.forEach(([x,z,s],i)=>{mtx.compose(new THREE.Vector3(x,0,z),q.identity(),new THREE.Vector3(s,s,s));crowns.setMatrixAt(i,mtx);trunks.setMatrixAt(i,mtx);});
 crowns.castShadow=true;scene.add(crowns,trunks);
 const rnd=seeded(7);
 function setSeason(key){const P={hanami:['#F7A1B5','#FBC4D2','#F28DAA','#7CC36A'],spring:['#7CC36A','#8FD07A','#F7A1B5','#6DB85E'],rain:['#5FAE5A','#6DBE5A','#4E9E4E'],summer:['#5FAE5A','#6DBE5A','#4E9E4E','#78C461'],autumn:['#E8833A','#D9534F','#F2B33D','#C9A14A','#7CB35A'],winter:['#9DB7A0','#B8CBB9','#7E9E84','#E8EEF0']}[key]||['#6DBE5A'];
  const r=seeded(5);for(let i=0;i<trees.length;i++)crowns.setColorAt(i,col.set(P[Math.floor(r()*P.length)]));crowns.instanceColor.needsUpdate=true;}
 setSeason('hanami');
 // Yamanote-Linie (FEATURES.rail)
 let curve=null;const train=[];
 if(FEATURES.rail){ const pts=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;pts.push(new THREE.Vector3(YM.cx+Math.cos(a)*YM.rx,.55,YM.cz+Math.sin(a)*YM.rz));}
 curve=new THREE.CatmullRomCurve3(pts,true);
 scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,240,.28,5,true),M('#8DC63F')));
 const rails=new THREE.Mesh(new THREE.TubeGeometry(curve,240,.9,4,true),M('#D2CCC0'));rails.scale.y=.25;scene.add(rails);
 for(let i=0;i<4;i++){const c0=new THREE.Group();c0.add(box(1.05,.9,2.3,'#E9EDF0',0,0,0));c0.add(box(1.08,.22,2.32,'#8DC63F',0,.38,0));c0.add(box(1.08,.2,2.1,'#6E7C8C',0,.62,0));const c=bake(c0);train.push(c);scene.add(c);}
 }
 // Wolken
 const clouds=[];for(let i=0;i<(STIL5?0:6);i++){const c=new THREE.Group();const n=3+Math.floor(rnd()*3);for(let j=0;j<n;j++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(3+rnd()*3,0),new THREE.MeshLambertMaterial({color:'#FFFFFF',flatShading:true,transparent:true,opacity:.92}));s.position.set(j*4-n*2,rnd()*2,rnd()*3);c.add(s);}{const a=rnd()*Math.PI*2,r=135+rnd()*40;c.position.set(Math.cos(a)*r,30+rnd()*12,Math.sin(a)*r);}const cp=c.position.clone();c.position.set(0,0,0);const cb2=bake(c);cb2.children[0].material.transparent=true;cb2.children[0].material.opacity=.92;cb2.position.copy(cp);cb2.userData.v=.6+rnd()*.8;clouds.push(cb2);scene.add(cb2);}
 // Standort-Marker (freie Sites): „空き / Zu vermieten“-Pins mit Lage-Badge
 const slotList=[];for(const d of DISTRICTS)SLOTS[d.id].forEach((s,i)=>slotList.push({d:d.id,i,tier:tierOf(d.id,i),...s}));
 const slotByK=new Map(slotList.map((s,i)=>[s.k,i]));
 const pinTex={};
 // V4 (Erik, kamera_vorlage): freie Standorte als große rote Pins – Pin rot, Schild weiß mit rotem 空き
 const redLease=s=>s.replace('fill="#fff" stroke','fill="#E94F4F" stroke').replace('rx="6" fill="#E94F4F"','rx="6" fill="#fff"').replace(/(font-size="22" )fill="#fff"/,'$1fill="#E94F4F"').replace(/(font-size="10" )fill="#2B2D42"/,'$1fill="#fff"');
 function pinTexture(tier){
  if(pinTex[tier])return pinTex[tier];
  const cv=document.createElement('canvas');cv.width=256;cv.height=330;const g=cv.getContext('2d');
  const draw=()=>{g.clearRect(0,0,256,330);const a=PIN_V2?GFX.img&&GFX.img.pin_lease_v2:GFX.img&&GFX.img.pin_lease,b=GFX.img&&GFX.img['lage_'+tier];if(a)g.drawImage(a,0,0,256,312);if(b)g.drawImage(b,150,170,96,112);t.needsUpdate=true;};
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
  g.fillStyle='#fff';g.beginPath();g.arc(128,100,90,0,7);g.fill();g.fillStyle='#E94F4F';g.fillRect(60,70,136,80);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.fillText('空き',128,125);t.needsUpdate=true;
  Promise.all([PIN_V2?fetch('grafik/karte/pin-zu-vermieten-v2.svg').then(r=>r.text()).then(svgImage):svgImage(redLease(GFX.svg.pin_lease||'')),svgImage(GFX.svg['lage_'+tier]||'')]).then(([a,b])=>{GFX.img=GFX.img||{};GFX.img[PIN_V2?'pin_lease_v2':'pin_lease']=a;GFX.img['lage_'+tier]=b;draw();}).catch(()=>{});
  return pinTex[tier]=t;
 }
 const pinSprites=slotList.map((s,i)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:pinTexture(s.tier),depthTest:false,transparent:true}));sp.position.set(s.x,3.6,s.z);if(PIN_V2)sp.scale.set(5.9,7.6,1);else sp.scale.set(8,10.3,1);sp.renderOrder=5;sp.userData.slot=i;sp.center.set(.5,0);scene.add(sp);return sp;});
 // Verkehrsknoten (Tokio Hbf, Haneda) + Platzhalter-Pins für spätere Stadtreisen
 const hubG=new THREE.Group();scene.add(hubG);
 // Yukis Wahrzeichen-Grafiken als Billboards (Tokio Hbf, Haneda)
 const landmarkSprites=[];
 [['tokyo-st','hub_station',16],['haneda','hub_haneda',22]].filter(([id])=>id==='haneda'?FEATURES.haneda:FEATURES.rail).forEach(([id,key,w])=>{const h=HUBS.find(x=>x.id===id);if(!h)return;
  const cv=document.createElement('canvas');cv.width=384;cv.height=280;const g=cv.getContext('2d');const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false});const sp=new THREE.Sprite(m);sp.scale.set(w,w*140/192,1);sp.center.set(.5,0);sp.position.set(h.x,id==='haneda'?4:6,h.z+(id==='haneda'?-4:3));sp.renderOrder=5;sp.userData={hub:id==='tokyo-st'?'station':'haneda'};hubG.add(sp);landmarkSprites.push(sp);
  if(GFX.svg&&GFX.svg[key])svgImage(GFX.svg[key]).then(img=>{g.drawImage(img,0,0,384,280);t.needsUpdate=true;}).catch(()=>{});
 });
 function emojiPin(emoji,label,bg){const cv=document.createElement('canvas');cv.width=192;cv.height=240;const g=cv.getContext('2d');g.fillStyle=bg;g.strokeStyle='#2B2D42';g.lineWidth=7;g.beginPath();g.moveTo(96,232);g.bezierCurveTo(70,190,14,160,14,94);g.arc(96,94,82,Math.PI,0);g.bezierCurveTo(178,160,122,190,96,232);g.fill();g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(96,92,56,0,7);g.fill();g.font='62px sans-serif';g.textAlign='center';g.fillText(emoji,96,114);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;}
 const utility=[{id:'borse',name:'Börse',emoji:'📈',x:58,z:-6,bg:'#8EA6C4'},{id:'immo',name:'Immobilienbüro',emoji:'🏢',x:-4,z:12,bg:'#8EA6C4'},{id:'hq',name:'Hauptquartier',emoji:'🏠',x:-12,z:-30,bg:'#B8A6D9'},{id:'station',name:'Tokio Hbf (Fernreisen)',emoji:'🚄',x:HUBS[0].x,z:HUBS[0].z+3,bg:'#9AD8EE'},{id:'haneda',name:'Haneda (Flüge)',emoji:'✈️',x:HUBS[1].x,z:HUBS[1].z-4,bg:'#9AD8EE'}];
 const HIDE_UTIL={immo:true,hq:!FEATURES.hq,station:!FEATURES.rail,haneda:!FEATURES.haneda};// Tokio Hbf bleibt als Gebäude, ohne Funktion
 const utilSprites=utility.filter(u=>!HIDE_UTIL[u.id]).map(u=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:emojiPin(u.emoji,u.name,u.bg),depthTest:false,transparent:true}));sp.position.set(u.x,u.id==='haneda'?21:u.id==='station'?18:6.5,u.z);sp.scale.set(4.2,5.2,1);sp.renderOrder=4;sp.center.set(.5,0);sp.userData.hub=u.id;scene.add(sp);return sp;});
 // Autos auf dem Straßenraster
 const CARN=46,carG=(()=>{const a=new THREE.BoxGeometry(1.0,.34,.52).translate(0,.27,0),b=new THREE.BoxGeometry(.52,.24,.46).translate(-.06,.56,0);return mergeLife([a,b]);})();
 const cars=new THREE.InstancedMesh(carG,new THREE.MeshLambertMaterial({color:'#fff'}),CARN);const cl=['#E94F4F','#3D7BD9','#FFC93C','#FFFFFF','#5DBB73','#F7A1B5','#2B2D42'];
 const lanes=roadLanes();const carD=[];for(let i=0;i<CARN;i++){const L=lanes[i%lanes.length]||{h:true,z:0},dir=rnd()<.5?1:-1;carD.push({horiz:L.h,lane:(L.h?L.z:L.xw)+dir*FIELD*.45,pos:(rnd()-.5)*2*R,v:(.4+rnd()*.5)*dir*.5});cars.setColorAt(i,col.set(cl[i%cl.length]));}
 scene.add(cars);cars.visible=false;
 // Autos auf Ringstraßen (Rundkurs um jedes Wahrzeichen) und über die Brücken (hin und her)
 const paths=[];for(const w of LANDMARK_AREAS){if(!w.ring)continue;const r=w.ring,x0=wx(r.x+.5),x1=wx(r.x+r.breite-.5),z0=wz(r.y+.5),z1=wz(r.y+r.tiefe-.5);paths.push({pts:[[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,z0]],loop:true});}
 for(const b of BRIDGES.filter(b=>!b.felder||b.art==='haengebruecke')){paths.push({pts:[[wx(b.von[0]+.5),wz(b.von[1]+.5)],[wx(b.bis[0]+.5),wz(b.bis[1]+.5)]],loop:false,y:.6});}
 const PCN=Math.min(40,paths.length*2),pcars=new THREE.InstancedMesh(carG,new THREE.MeshLambertMaterial({color:'#fff'}),Math.max(1,PCN));const pcD=[];
 for(let i=0;i<PCN;i++){const P=paths[i%paths.length];let L=0;const seg=[];for(let k=1;k<P.pts.length;k++){const l=Math.hypot(P.pts[k][0]-P.pts[k-1][0],P.pts[k][1]-P.pts[k-1][1]);seg.push(l);L+=l;}pcD.push({P,seg,L,s:rnd()*L,v:(.15+rnd()*.15)*(i%2?1:-1)});pcars.setColorAt(i,col.set(cl[(i+3)%cl.length]));}
 pcars.count=PCN;pcars.visible=false;scene.add(pcars);
 function updatePathCars(){for(let i=0;i<PCN;i++){const c=pcD[i];c.s+=c.v;if(c.P.loop){c.s=(c.s%c.L+c.L)%c.L;}else if(c.s<0||c.s>c.L){c.v=-c.v;c.s=Math.max(0,Math.min(c.L,c.s));}
  let d=c.s,k=0;while(k<c.seg.length-1&&d>c.seg[k]){d-=c.seg[k];k++;}const A=c.P.pts[k],B=c.P.pts[k+1],t=d/c.seg[k];const x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t;
  let y=c.P.y||0;if(c.P.y){const e2=Math.min(c.s,c.L-c.s);y=Math.min(c.P.y,e2/FIELD*c.P.y);}
  e.set(0,-Math.atan2(B[1]-A[1],B[0]-A[0]),0);q.setFromEuler(e);mtx.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(1.3,1.3,1.3));pcars.setMatrixAt(i,mtx);}pcars.instanceMatrix.needsUpdate=true;}
 function updateCars(){for(let i=0;i<CARN;i++){const c=carD[i];c.pos+=c.v;if(c.pos>R-3)c.pos=-R+3;if(c.pos<-R+3)c.pos=R-3;const x=c.horiz?c.pos:c.lane,z=c.horiz?c.lane:c.pos;const ok=onRoad(x,z);e.set(0,c.horiz?0:Math.PI/2,0);q.setFromEuler(e);mtx.compose(new THREE.Vector3(x,ok?0:-5,z),q,new THREE.Vector3(1.3,1.3,1.3));cars.setMatrixAt(i,mtx);}cars.instanceMatrix.needsUpdate=true;}
 let occupied=new Set();
 // V6 (Whitebeard-Vorabtest 22d0cd1, Vorlage m26): nur ~8 空き-Pins gleichzeitig – beste Lage zuerst, reihum über die Viertel verteilt.
 // Ebenen-Knopf (☰ links unten) schaltet „alle freien Grundstücke“ ein/aus.
 const PIN_MAX=8,TRANK=Object.keys(TIERS);let pinAll=false,pinKey='',pinShow=new Set();
 function pickPins(){const free=slotList.map((s,i)=>({s,i})).filter(({s})=>!occupied.has(s.d+':'+s.i)&&slotOpen(s.d,s.i,curWeek));
  if(pinAll)return new Set(free.map(x=>x.i));
  free.sort((a,b)=>TRANK.indexOf(a.s.tier)-TRANK.indexOf(b.s.tier)||a.i-b.i);const per=new Map();for(const x of free){if(!per.has(x.s.d))per.set(x.s.d,[]);per.get(x.s.d).push(x.i);}
  const out=new Set(),Q=[...per.values()];for(let r=0;out.size<PIN_MAX&&Q.some(q=>q.length>r);r++)for(const q of Q){if(out.size>=PIN_MAX)break;if(q[r]!==undefined)out.add(q[r]);}return out;}
 function updatePads(t){const k=pinAll+'|'+curWeek+'|'+[...occupied].join(',');if(k!==pinKey){pinKey=k;pinShow=pickPins();}
  slotList.forEach((s,i)=>{const on=pinShow.has(i);const sp=pinSprites[i];sp.visible=on;if(on)sp.position.y=3.4+Math.sin(t*2.2+i)*.3;});}
 function pinLayer(v){pinAll=v===undefined?!pinAll:!!v;pinKey='';return pinAll;}
 // Auswahlring
 const selRing=new THREE.Mesh(new THREE.TorusGeometry(3.4,.18,6,36),new THREE.MeshBasicMaterial({color:'#E94F4F'}));selRing.rotation.x=-Math.PI/2;selRing.visible=false;scene.add(selRing);
 // Läden
 const storeObjs=new Map(),anims=[];
 const rivalPin={};
 function rivalPinTex(chain){if(rivalPin[chain])return rivalPin[chain];const cv=document.createElement('canvas');cv.width=128;cv.height=156;const g=cv.getContext('2d');const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
  g.fillStyle=CHAINS[chain].color;g.beginPath();g.arc(64,64,50,0,7);g.fill();t.needsUpdate=true;
  Promise.all([svgImage(GFX.svg.pin_rival||''),svgImage(GFX.svg['logo_'+chain]||'')]).then(([a,b])=>{g.clearRect(0,0,128,156);g.drawImage(a,0,0,128,156);g.drawImage(b,30,28,68,68);t.needsUpdate=true;}).catch(()=>{});
  return rivalPin[chain]=t;}
 const shopState=new Map();
 function paintShop(k,chain,logo){const look=chain?chainLook(chain,logo,{facade:'brand'}):null;const key=chain?chain+'|'+(chain==='player'?look.main+look.name:''):'frei';if(shopState.get(k)===key)return;shopState.set(k,key);
  shops.paint(k,chain?{color:look.main,name:(look.name||'').toUpperCase().slice(0,14)}:{color:'#A7ABB3',name:'空き · FREI'});}
 SHOPS.forEach(sh=>paintShop(sh.k,null));
 let curWeek=1;
 /* ---------- Leben: Kunden an Spieler-Filialen, Lieferwagen (V6) ---------- */
 // Kunden: Low-Poly-Figuren (Beine, Oberkörper mit Armen, Kopf, Haare) – je Teil ein InstancedMesh, Farben je Figur
 const mergeG=gs=>{const g=new THREE.BufferGeometry(),P=[],N=[];for(const x of gs){const n=x.index?x.toNonIndexed():x;P.push(...n.attributes.position.array);N.push(...n.attributes.normal.array);}g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return g;};
 const PPL_MAX=96,pmat=()=>new THREE.MeshLambertMaterial({color:'#fff'}),
  pLegs=new THREE.InstancedMesh(mergeG([new THREE.BoxGeometry(.085,.22,.1).translate(-.06,.11,0),new THREE.BoxGeometry(.085,.22,.1).translate(.06,.11,0)]),pmat(),PPL_MAX),
  pBody=new THREE.InstancedMesh(mergeG([new THREE.BoxGeometry(.24,.25,.15).translate(0,.345,0),new THREE.BoxGeometry(.06,.22,.08).translate(-.155,.34,0),new THREE.BoxGeometry(.06,.22,.08).translate(.155,.34,0)]),pmat(),PPL_MAX),
  pHead=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.1,0).translate(0,.57,0),pmat(),PPL_MAX),
  pHair=new THREE.InstancedMesh(new THREE.BoxGeometry(.19,.07,.19).translate(0,.645,-.01),pmat(),PPL_MAX);
 const PCOL=['#E94F4F','#3D7BD9','#FFC93C','#5DBB73','#F7A1B5','#F2EFE6','#8E5BD1','#FF8A3D','#2E9C9C','#F5F5F5'],LCOL=['#2B2D42','#3B4A6B','#5A4636','#6B6B6B','#1F3A5F'],SKIN=['#F6D2B4','#EBC09A','#D9A77E','#F2C9A6'],HAIR=['#2B2D42','#1E1E24','#5A3B26','#8A5A35','#C9C3BA'];
 for(let i=0;i<PPL_MAX;i++){pBody.setColorAt(i,col.set(PCOL[(i*7)%PCOL.length]));pLegs.setColorAt(i,col.set(LCOL[(i*3)%LCOL.length]));pHead.setColorAt(i,col.set(SKIN[(i*5)%SKIN.length]));pHair.setColorAt(i,col.set(HAIR[(i*11)%HAIR.length]));}
 const PPL=[pLegs,pBody,pHead,pHair];for(const m of PPL)m.count=0;scene.add(...PPL);
 // Option ?kunden=yuki: Yukis Kunden-Entwürfe (grafik/kunden/kunde-1..6.svg, 16×32) als Billboard-Sprites (Option, aus) – Erik 21.10. 13:43: Low-Poly-Figuren sind final Standard
 const YUKI_PPL=new URLSearchParams(location.search).get('kunden')==='yuki',pSpr=[];
 if(YUKI_PPL){const mats=[1,2,3,4,5,6].map(n=>{const cv=document.createElement('canvas');cv.width=64;cv.height=128;const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const im=new Image();im.onload=()=>{const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,64,128);t.needsUpdate=true;};im.src=`grafik/kunden/kunde-${n}.svg`;return new THREE.SpriteMaterial({map:t,transparent:true});});
  for(let i=0;i<PPL_MAX;i++){const sp=new THREE.Sprite(mats[(i*5)%6]);sp.center.set(.5,.03);sp.scale.set(.46,.92,1);sp.visible=false;sp.renderOrder=3;scene.add(sp);pSpr.push(sp);}}
 const VAN_MAX=24,vans=new THREE.InstancedMesh(new THREE.BoxGeometry(1.1,.66,.62).translate(-.18,.45,0),new THREE.MeshLambertMaterial({color:'#F4F4F0'}),VAN_MAX),
  vanCab=new THREE.InstancedMesh(mergeLife([new THREE.BoxGeometry(.42,.44,.6).translate(.58,.34,0),new THREE.BoxGeometry(1.12,.1,.64).translate(-.18,.22,0)]),new THREE.MeshLambertMaterial({color:'#E94F4F'}),VAN_MAX);
 vans.count=vanCab.count=0;scene.add(vans,vanCab);for(const m of[...PPL,vans,vanCab]){m.frustumCulled=false;m.castShadow=true;}
 let life=[];
 function lifeFor(stores){life=[];let np=0;
  for(const s of stores){if(s.chain!=='player'||s.build>0)continue;const sh=PLAN_SLOTS[s.d]&&PLAN_SLOTS[s.d][s.slot];if(!sh)continue;
   const ft=SHOP_FOOT.get(sh.id),f=sh.front,dir={s:[0,1],n:[0,-1],o:[1,0],w:[-1,0]}[f]||[0,1],lat=[-dir[1],dir[0]];
   let dx=sh.x,dz=sh.z;if(ft){dx=f==='o'?ft.x1:f==='w'?ft.x0:(ft.x0+ft.x1)/2;dz=f==='s'?ft.z1:f==='n'?ft.z0:(ft.z0+ft.z1)/2;}
   const busy=s.last&&s.last.cust?s.last.cust/7:400,n=Math.max(3,Math.min(10,Math.round(busy/90)));
   life.push({door:[dx,dz],edge:[sh.x,sh.z],dir,lat,n,p0:np,seed:(s.id*0.6180339)%1});np+=n;}
  for(const m of PPL)m.count=Math.min(PPL_MAX,np);vans.count=vanCab.count=Math.min(VAN_MAX,life.length);}
 const lv=new THREE.Vector3(),ls=new THREE.Vector3(1,1,1);
 function updateLife(t){const show=camera.zoom>=1.5;pLegs.visible=pHair.visible=pBody.visible=pHead.visible=vans.visible=vanCab.visible=show&&life.length>0;if(YUKI_PPL){for(const m of PPL)m.visible=false;pSpr.forEach((sp,i)=>sp.visible=vans.visible&&i<pBody.count);}if(!vans.visible)return;
  for(const L of life){for(let k=0;k<L.n;k++){const i=L.p0+k;if(i>=PPL_MAX)break;const ph=((t*.07+L.seed+k/L.n)%1),inb=k%2===0,side=(k%2?-1:1)*(2.2+k*.7);
    // Weg: Tür → Gehweg (1,1 Einheiten vor der Grundstückskante) → seitlich weg; die Hälfte läuft andersherum (kommt herein)
    let u=inb?1-ph:ph,x,z,ry;const out=Math.abs((L.edge[0]-L.door[0])*L.dir[0]+(L.edge[1]-L.door[1])*L.dir[1])+.45;
    if(u<.35){const a=u/.35;x=L.door[0]+L.dir[0]*out*a;z=L.door[1]+L.dir[1]*out*a;ry=Math.atan2(L.dir[0],L.dir[1]);}
    else{const a=(u-.35)/.65;x=L.door[0]+L.dir[0]*out+L.lat[0]*side*a;z=L.door[1]+L.dir[1]*out+L.lat[1]*side*a;ry=Math.atan2(L.lat[0]*side,L.lat[1]*side);}
    if(inb)ry+=Math.PI;const bob=Math.abs(Math.sin(t*9+k))*.04,sc=u<.03?0:1;
    e.set(0,ry,0);q.setFromEuler(e);ls.set(sc,sc,sc);ls.multiplyScalar(1.25);mtx.compose(lv.set(x,bob,z),q,ls);for(const m of PPL)m.setMatrixAt(i,mtx);if(YUKI_PPL){pSpr[i].position.set(x,bob,z);pSpr[i].scale.set(.46*sc*1.25,.92*sc*1.25,1);}}}
  life.forEach((L,j)=>{if(j>=VAN_MAX)return;const per=26,ph=((t+L.seed*per+j*7)%per)/per;let a;// anfahren – 40 % parken – wegfahren
   a=ph<.3?-1+ph/.3:ph<.7?0:(ph-.7)/.3;const lane=Math.abs((L.edge[0]-L.door[0])*L.dir[0]+(L.edge[1]-L.door[1])*L.dir[1])+FIELD*.3,d=a*16;
   const x=L.door[0]+L.dir[0]*lane+L.lat[0]*d,z=L.door[1]+L.dir[1]*lane+L.lat[1]*d,sc=Math.abs(a)>.97?0:1;
   e.set(0,-Math.atan2(L.lat[1],L.lat[0]),0);q.setFromEuler(e);ls.set(sc,sc,sc);mtx.compose(lv.set(x,0,z),q,ls);vans.setMatrixAt(j,mtx);vanCab.setMatrixAt(j,mtx);});
  for(const m of PPL)m.instanceMatrix.needsUpdate=true;vans.instanceMatrix.needsUpdate=vanCab.instanceMatrix.needsUpdate=true;}
 // Eigene Läden (Whitebeard): Pin + Ballons über dem Ladengebäude statt an der Straßenkante; Konbini-Front (Glas + Farbband mit Name) auf den Fassaden zur Kamera
 const _rc=new THREE.Raycaster(),_up=new THREE.Vector3(),_dn=new THREE.Vector3(0,-1,0);
 function roofY(x,z,skip){_up.set(x,400,z);_rc.set(_up,_dn);_rc.camera=camera;for(const h of _rc.intersectObjects(scene.children,true)){const ob=h.object;if(ob.isSprite||PPL.includes(ob)||ob===vans||ob===vanCab)continue;let p=ob,sk=false;while(p){if(p===skip){sk=true;break;}p=p.parent;}if(sk)continue;return h.point.y;}return 0;}
 function frontTex(look){const cv=document.createElement('canvas');cv.width=512;cv.height=256;const g=cv.getContext('2d');
  g.fillStyle='#F4F4F0';g.fillRect(0,0,512,256);g.fillStyle=look.main;g.fillRect(0,0,512,88);g.fillStyle='#FFFFFF';g.fillRect(0,88,512,7);
  try{g.drawImage(logoCanvas(look.logo,128),12,8,72,72);}catch(e){}
  g.fillStyle=look.main.toLowerCase()==='#ffffff'?'#E94F4F':'#FFFFFF';g.font='900 50px sans-serif';g.textBaseline='middle';g.fillText((look.name||'').toUpperCase().slice(0,14),98,47,400);
  g.fillStyle='#9FD6E8';g.fillRect(14,108,484,136);g.fillStyle='#CDEFF7';g.fillRect(14,108,484,22);
  g.fillStyle='#F4F4F0';for(let i=1;i<5;i++)g.fillRect(14+i*96.8-3,108,6,136);g.fillStyle='#6AB2CC';g.fillRect(212,136,88,108);g.fillStyle='#F4F4F0';g.fillRect(254,136,4,108);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;return tx;}
 function ownFront(s,sl,look,o){const sh=PLAN_SLOTS[s.d]&&PLAN_SLOTS[s.d][s.slot],ft=sh&&SHOP_FOOT.get(sh.id);if(!ft)return null;
  const H=PFH*1.25,mat=new THREE.MeshLambertMaterial({map:frontTex(look),emissive:'#ffffff',emissiveIntensity:.15});mat.emissiveMap=mat.map;const e=.05,cx=(ft.x0+ft.x1)/2,cz=(ft.z0+ft.z1)/2;
  const a=new THREE.Mesh(new THREE.PlaneGeometry(ft.x1-ft.x0-.1,H),mat);a.position.set(cx-sl.x,H/2,ft.z1+e-sl.z);o.add(a);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(ft.z1-ft.z0-.1,H),mat);b.rotation.y=Math.PI/2;b.position.set(ft.x1+e-sl.x,H/2,cz-sl.z);o.add(b);
  return {cx:cx-sl.x,cz:cz-sl.z,top:roofY(cx,cz,o)};}
 function syncStores(stores,logo,week){if(week)curWeek=week;lifeFor(stores);
  occupied=new Set(stores.map(s=>s.d+':'+s.slot));const seen=new Set(),used=new Set();
  for(const s of stores){const sl=SLOTS[s.d]&&SLOTS[s.d][s.slot];if(!sl)continue;used.add(sl.k);paintShop(sl.k,s.chain,logo);
   const key=JSON.stringify([s.chain,s.build>0,s.chain==='player'?logo:0,s.chain==='player'?LG.logoVer:0]);seen.add(s.id);let o=storeObjs.get(s.id);
   if(o&&o.userData.key===key)continue;
   const isNew=!o;if(o)scene.remove(o);
   o=new THREE.Group();o.userData.key=key;o.position.set(sl.x,0,sl.z);
   if(s.build>0){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:bannerTex(),depthTest:false,transparent:true}));sp.position.set(0,4.2,0);sp.scale.set(7,1.75,1);sp.renderOrder=6;o.add(sp);}
   else if(s.chain==='player'){const of=ownFront(s,sl,chainLook('player',logo,{facade:'brand'}),o)||{cx:0,cz:0,top:0};const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ownPinTex(logo),depthTest:false,transparent:true}));sp.center.set(.5,0);sp.position.set(of.cx,Math.max(3.4,of.top+.6),of.cz);sp.scale.set(4.8,5.9,1);sp.userData.ownPin=1;sp.renderOrder=7;o.add(sp);
    const bc=['#E94F4F','#FFC93C','#3D7BD9'];const bg=new THREE.Group();bc.forEach((c,i)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.38,8,6),M(c));b.position.set(-1.3+i*1.3,(i%2)*.6,0);bg.add(b);bg.add(cyl(.015,.015,2.6,3,'#777',-1.3+i*1.3,-2.6+(i%2)*.6,0));});const bb=bake(bg);bb.userData.by=Math.max(9.6,of.top+5.6);bb.position.set(of.cx,bb.userData.by,of.cz);bb.userData.balloons=true;o.add(bb);}
   else{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:rivalPinTex(s.chain),depthTest:false,transparent:true}));sp.center.set(.5,0);sp.position.set(0,3,0);sp.scale.set(3.4,4.15,1);sp.renderOrder=5;o.add(sp);}
   o.traverse(c=>{c.userData.storeId=s.id;});scene.add(o);storeObjs.set(s.id,o);
   if(isNew&&cb.animateNew!==false&&s.chain==='player')anims.push({o,t0:performance.now()});
  }
  for(const [id,o] of storeObjs)if(!seen.has(id)){scene.remove(o);storeObjs.delete(id);}
  for(const sh of SHOPS)if(!used.has(sh.k))paintShop(sh.k,null);
  renderer.shadowMap.needsUpdate=true;
 }
 // Labels
 const SHOW_LABELS=new URLSearchParams(location.search).get('beschriftung')==='1';// Erik 21.10.: Stadtteil-/Wahrzeichen-Beschriftung standardmäßig aus
 const labelLayer=document.createElement('div');labelLayer.className='labels';if(!SHOW_LABELS)labelLayer.style.display='none';container.appendChild(labelLayer);
 const labels=DISTRICTS.map(d=>{const el=document.createElement('div');el.className='lbl3d';el.innerHTML=`<i style="background:${TYPES[d.type].color}">${TYPES[d.type].icon}</i><b>${d.name}</b><small>${d.jp}</small>`;labelLayer.appendChild(el);return {el,p:new THREE.Vector3(d.x,9,d.z)};});
 const lmLabels=LANDMARKS.filter(l=>!['shibuya-crossing','tokyo-station','haneda'].includes(l.id)).concat(FEATURES.rail?[{name:'Yamanote-Linie',x:YM.cx-YM.rx,z:YM.cz+14,h:3}]:[]).map(l=>{const el=document.createElement('div');el.className='lmlbl';el.textContent=l.name;labelLayer.appendChild(el);return {el,p:new THREE.Vector3(l.x,STIL5?.3:(l.h||6)+2,l.z),below:STIL5};});
 const v=new THREE.Vector3();
 const placedLm=[];function placeLabels(){if(!SHOW_LABELS)return;const W=container.clientWidth,H=container.clientHeight,dist=120/camera.zoom;
  // V4: Labels entzerren – Viertel zuerst, Wahrzeichen weichen nach unten aus (bis 3 Stufen), sonst ausblenden
  const placed=[],lmRects=placedLm;const hitLm=a=>lmRects.some(b=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y);const hit=(a)=>placed.some(b=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y);
  if(STIL5){// V5: Pins zuerst als Hindernisse – Labels weichen aus oder werden ausgeblendet
   const ppu=H*camera.zoom/(camera.top-camera.bottom);
   const SP=[...pinSprites,...utilSprites,...landmarkSprites];for(const o of storeObjs.values())o.traverse(c=>{if(c.isSprite)SP.push(c);});
   for(const sp of SP){if(!sp.visible)continue;sp.getWorldPosition(v);v.project(camera);if(v.z>1||Math.abs(v.x)>1.2||Math.abs(v.y)>1.2)continue;
    const x=(v.x+1)/2*W,y=(1-v.y)/2*H,w=sp.scale.x*ppu,h=sp.scale.y*ppu;placed.push({x:x-w*sp.center.x,y:y-h*(1-sp.center.y),w,h});}
   // HUD-Elemente (oben/unten) als Hindernisse
   const cr=container.getBoundingClientRect();for(const el of document.querySelectorAll('#hud > *, #seasonChip, #cityBar > *, #bar')){const b=el.getBoundingClientRect();if(b.width&&b.height&&getComputedStyle(el).display!=='none')placed.push({x:b.left-cr.left-4,y:b.top-cr.top-4,w:b.width+8,h:b.height+8});}
   // Wahrzeichen-Silhouetten (nur für Viertel-Labels)
   lmRects.length=0;const c8=new THREE.Vector3();for(const l of LANDMARKS){if(!l.box||l.box.max.y<10)continue;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<8;i++){c8.set(i&1?l.box.max.x:l.box.min.x,i&2?l.box.max.y:l.box.min.y,i&4?l.box.max.z:l.box.min.z).project(camera);const px=(c8.x+1)/2*W,py=(1-c8.y)/2*H;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);}
    const sh=(x1-x0)*.22;lmRects.push({x:x0+sh,y:y0,w:x1-x0-2*sh,h:(y1-y0)*.8});}}
  for(const L of labels.concat(lmLabels)){v.copy(L.p).project(camera);const vis=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
   if(!vis){L.el.style.display='none';continue;}L.el.style.display='';if(!L.w){L.w=L.el.offsetWidth;L.h=L.el.offsetHeight;}
   const x=(v.x+1)/2*W,y=(1-v.y)/2*H;let dy=0,ok=false;const lm=lmLabels.includes(L);
   const base=L.below?L.h+6:0,OFF=STIL5?[0,-1,1,-2,2,-3,3]:[0,1,2,3];
   let dx=0;const CAND=[];for(const k of (lm||STIL5?OFF:[0]))CAND.push([0,k]);if(STIL5&&!lm){const ppu2=H*camera.zoom/(camera.top-camera.bottom),o=new THREE.Vector3();for(const[wxo,wzo]of[[12,12],[-12,-12],[12,-12],[-12,12],[18,0],[-18,0],[0,18],[0,-18]]){o.copy(L.p).add(new THREE.Vector3(wxo,0,wzo)).project(camera);const px=(o.x+1)/2*W,py=(1-o.y)/2*H;for(const k of[0,-1,1])CAND.push([px-x,k,py-y]);}}
   for(const [ddx,k,ddy=0] of CAND){dx=ddx;dy=k*(L.h+4)+base+ddy;const r={x:x+dx-L.w/2-2,y:y-L.h+dy-2,w:L.w+4,h:L.h+4};const inside=!STIL5||(r.x>=0&&r.x+r.w<=W&&r.y>=0&&r.y+r.h<=H);if((!lm&&!STIL5)||(inside&&!hit(r)&&(lm||!STIL5||!hitLm(r)))){placed.push(r);ok=true;break;}}
   if(!ok&&STIL5&&!lm)for(const [ddx,k,ddy=0] of CAND){dx=ddx;dy=k*(L.h+4)+ddy;const r={x:x+dx-L.w/2-2,y:y-L.h+dy-2,w:L.w+4,h:L.h+4};if(r.x>=0&&r.x+r.w<=W&&r.y>=0&&r.y+r.h<=H&&!hit(r)){placed.push(r);ok=true;break;}}// Fallback: Viertel-Label darf vor einem Wahrzeichen stehen, nie über Pins/HUD
   if(!ok){L.el.style.display='none';continue;}
   L.el.style.transform=`translate3d(${(x+(STIL5?dx:0)).toFixed(1)}px,${(y+dy).toFixed(1)}px,0) translate(-50%,-100%)`;}
  labelLayer.classList.toggle('far',dist>210);labelLayer.classList.toggle('near',dist<70);}
 // Picking
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',ev=>{down={x:ev.clientX,y:ev.clientY,t:performance.now()};});
 renderer.domElement.addEventListener('pointerup',ev=>{if(!down)return;const moved=Math.hypot(ev.clientX-down.x,ev.clientY-down.y);const dt=performance.now()-down.t;down=null;if(moved>9||dt>600)return;
  const r=renderer.domElement.getBoundingClientRect();ndc.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
  const targets=[...pinSprites.filter(p=>p.visible),...utilSprites,...landmarkSprites,...storeObjs.values()];
  const hits=ray.intersectObjects(targets,true);
  for(const h of hits){let o=h.object;
   if(o.userData.slot!=null){const sl=slotList[o.userData.slot];cb.onSlot&&cb.onSlot(sl.d,sl.i);return;}
   if(o.userData.hub){cb.onHub&&cb.onHub(o.userData.hub);return;}
   if(o.userData.storeId!=null){cb.onStore&&cb.onStore(o.userData.storeId);return;}}
  cb.onEmpty&&cb.onEmpty();});
 // Kamerafahrt
 let fly=null;
 function flyTo(x,z,dist=70){fly={t0:performance.now(),from:controls.target.clone(),to:clampT(new THREE.Vector3(x,0,z)),z0:camera.zoom,z1:Math.max(CAM.minZoom,Math.min(CAM.maxZoom,120/dist))};}// dist wie früher: 120/dist = Zoom
 function select(x,z){if(x==null){selRing.visible=false;return}selRing.visible=true;selRing.position.set(x,.3,z);}
 // Loop
 const clock=new THREE.Clock();let running=true,frame=0;
 const tmp=new THREE.Vector3();
 // Pan auf die Karte begrenzen: der sichtbare Ausschnitt bleibt über dem Plan (sichtbare Halbbreite abhängig vom Zoom)
 function clampT(t){const hw=(camera.right-camera.left)/2/camera.zoom,hh=(camera.top-camera.bottom)/2/camera.zoom/Math.sin(CAM.elev);
  const m=Math.max(0,R-Math.min(hw,hh)*.5);t.x=Math.max(-m,Math.min(m,t.x));t.z=Math.max(-m,Math.min(m,t.z));t.y=0;return t;}
 controls.addEventListener('change',()=>{const t=controls.target,ox=t.x,oz=t.z;clampT(t);if(ox!==t.x||oz!==t.z){camera.position.copy(t).add(camOff);}});
 function loop(){if(!running)return;const t=clock.getElapsedTime();frame++;
  if(fly){const p=Math.min(1,(performance.now()-fly.t0)/750),k=1-Math.pow(1-p,3);controls.target.lerpVectors(fly.from,fly.to,k);camera.position.copy(controls.target).add(camOff);camera.zoom=fly.z0+(fly.z1-fly.z0)*k;camera.updateProjectionMatrix();if(p>=1)fly=null;}
  controls.update();
  const u=(t/80)%1;if(curve)train.forEach((c,i)=>{const a=(u+i*.0068)%1;const p=curve.getPointAt(a),p2=curve.getPointAt((a+.002)%1);c.position.set(p.x,.62,p.z);c.lookAt(p2.x,.62,p2.z);});
  clouds.forEach(c=>{c.rotation.y+=0;c.position.x+=c.userData.v*.02;if(c.position.x>190)c.position.x=-190;});
  // eigener Pin: Bildschirmgröße gedeckelt (ab Zoom 1,2 nicht größer, ≈ 空き-Pin), damit die Ladenfront frei bleibt
 {const k=Math.min(1,PIN_CAP_Z/camera.zoom);for(const o of storeObjs.values())for(const c of o.children)if(c.userData.ownPin)c.scale.set(4.8*k,5.9*k,1);
  for(const sp of pinSprites)if(PIN_V2)sp.scale.set(5.9*k,7.6*k,1);else sp.scale.set(8*k,10.3*k,1);}// 空き-Pins gleich gedeckelt (Whitebeard)
 updatePads(t);cars.visible=pcars.visible=camera.zoom>=CAM.carZoom&&PCN>0;updateLife(t);if(cars.visible){updateCars();updatePathCars();}for(const o of storeObjs.values())for(const c of o.children)if(c.userData.balloons)c.position.y=(c.userData.by||9.6)+Math.sin(t*1.6)*.25;
  if(selRing.visible){const s=1+Math.sin(t*4)*.06;selRing.scale.set(s,s,s);}
  for(let i=anims.length-1;i>=0;i--){const a=anims[i],p=Math.min(1,(performance.now()-a.t0)/700),k=p<1?1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2):1;a.o.scale.set(1,Math.max(.01,k),1);if(p>=1){anims.splice(i,1);renderer.shadowMap.needsUpdate=true;}}
  renderer.render(scene,camera);placeLabels();
 }
 renderer.setAnimationLoop(loop);
 renderer.shadowMap.needsUpdate=true;
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);const a=w/h;camera.left=-VH*a/2;camera.right=VH*a/2;camera.top=VH/2;camera.bottom=-VH/2;camera.updateProjectionMatrix();}
 addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running)renderer.setAnimationLoop(loop);else renderer.setAnimationLoop(null);});
 return {pinLayer,pinsShown:()=>pinShow.size,storePins:()=>{let p=0,r=0;for(const o of storeObjs.values()){let own=false;o.traverse(c=>{if(c.userData.ownPin)own=true;});if(own)p++;else r++;}return {player:p,rival:r};},// V7: Test-Hook (sichtbare Laden-Pins)
 life:()=>({n:pBody.count,vis:pBody.visible||pSpr.some(s=>s.visible),yuki:YUKI_PPL,L:life.slice(0,2)}),pcars,bridges,CAM,clampT,cars,lmGroup,roadCoverage:()=>ground.material.map.userData.roadCoverage,scene,tierOfSlot:(d,i)=>tierOf(d,i),syncStores,flyTo,select,setSeason,slotPos:(d,i)=>SLOTS[d][i],renderer,camera,controls,towers,stats:()=>({roofs:city.mesh.userData.roofs,stil:STIL5?5:4,buildings:bl.length,towerLots:TOWERS.filter(t=>t.lot!=null).length,towers:towers.children.filter(o=>!o.userData.roof).length,shops:SHOPS.length,landmarks:LANDMARKS.length,trees:trees.length,calls:renderer.info.render.calls,tris:renderer.info.render.triangles})};
}

/* ---------- 3D-Vorschau eines Ladens ---------- */
let PV=null;
export function storePreview(host,chain,logo,design){
 if(!PV){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(32,1,.1,100);
  scene.add(new THREE.HemisphereLight('#FFFFFF','#EADFCB',1.8));const sun=new THREE.DirectionalLight('#FFF4E0',1.8);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6});scene.add(sun);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(5.2,5.4,.25,40),new THREE.MeshLambertMaterial({color:'#F3EDE1'}));disc.position.y=-.13;disc.receiveShadow=true;scene.add(disc);
  PV={renderer,scene,cam,model:null,host:null,t0:performance.now(),mode:'inside'};
  const loop=()=>{if(!PV.host||!PV.host.isConnected){renderer.setAnimationLoop(null);PV.loop=false;return}const t=(performance.now()-PV.t0)/1000;const a=.5+Math.sin(t*.35)*.55;const r=PV.mode==='inside'?6.4:9;PV.cam.position.set(Math.sin(a)*r,PV.mode==='inside'?7.4:3.6,Math.cos(a)*r);PV.cam.lookAt(0,.9,0);renderer.render(scene,PV.cam);};
  PV.start=()=>{if(!PV.loop){PV.loop=true;renderer.setAnimationLoop(loop);}};
 }
 PV.host=host;host.appendChild(PV.renderer.domElement);
 const w=host.clientWidth||320,h=host.clientHeight||200;PV.renderer.setSize(w,h);PV.cam.aspect=w/h;PV.cam.updateProjectionMatrix();
 if(PV.model)PV.scene.remove(PV.model);
 PV.model=buildStore(chain,logo,design,{interior:PV.mode==='inside'});PV.model.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true}});PV.scene.add(PV.model);
 PV.args=[chain,logo,design];PV.start();
}
export function previewMode(m){if(PV){PV.mode=m;if(PV.host&&PV.args)storePreview(PV.host,...PV.args);}}
