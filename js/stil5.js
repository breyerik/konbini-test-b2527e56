// Konbini Empire V5 – Stadtstil nach Eriks freigegebenem Musterausschnitt (Runde 10, js/ausschnitt.js, Erik 21.10. 9:06 „Okay sieht gut aus“).
// Alles eckig (keine Rundungen), dunkler Asphalt mit weißen Randlinien + gestrichelter Mittellinie, gelbgrüne Blöcke mit weißem Bordstein,
// Gebäude nach Yukis Vorlagen (grafik/stilmuster/haeuser/spec.md, palette-blatt.svg), Glas-Türme mit Dachkrone, Skytree als helles Gitter.
// Schalter: ?stil=alt = alter V4-Stil, ?pin=v1 = alter Pin (Standard: Yukis Pin v2).
import * as THREE from '../lib/three.module.min.js';
const QS=new URLSearchParams(globalThis.location?location.search:'');
export const STIL5=QS.get('stil')!=='alt';
export const PIN_V2=QS.get('pin')!=='v1';
export function seeded(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647;}
export const PAL={dach:['#7A5A48','#9C4A3C','#B0573F','#7A5A48','#3E4E6A','#75675E','#8E6A52','#9C4A3C'],fass:['#F7F3E9','#F2EFE6','#EFE4CC','#E8DCC4','#F5EBDD'],ziegel:'#A85E48',buero:'#DCE3EA',navy:'#2F3F66',kauf:'#F2E9DC',
 fHaus:'#6E8BAA',fBlock:'#5C7FA6',glas:'#7FA3C4',licht:'#F2E3A8',laden:'#7FB3C8',balkon:'#F7F5EF',tuer:'#5A4636',technik:'#9A9DA2',rot:'#E94F4F',blau:'#3D7BD9',gruen:'#5DBB73',gelb:'#FFC93C',halle:'#5F6B5A',
 gras:'#BFD271',ufer:'#9CCB3E',asphalt:'#4A4D52',linie:'#F4F1EA',strich:'#D8DBE0',wasser:'#1F667C',bord:'#F4F1EA'};
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const texC={},fM={},cM={};
const facTex=(wall,win,cols=1,big=false)=>{const k=wall+win+cols+big;return texC[k]||(texC[k]=canvasTex(64,64,(g,w,h)=>{g.fillStyle=wall;g.fillRect(0,0,w,h);g.fillStyle=win;
 if(big){g.fillRect(6,10,52,40);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(31,10,2,40);}else for(let c=0;c<cols;c++){const cw=w/cols;g.fillRect(c*cw+cw*.25,18,cw*.5,28);}}));};
export const facM=(wall,win,cols,big)=>{const k=wall+win+cols+big;return fM[k]||(fM[k]=new THREE.MeshLambertMaterial({map:facTex(wall,win,cols,big)}));};
export const colMat=c=>cM[c]||(cM[c]=new THREE.MeshLambertMaterial({color:c}));
const vband=(a,b)=>canvasTex(64,32,(g,w,h)=>{g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle=b;for(let x=4;x<w;x+=16)g.fillRect(x,0,9,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,h-3,w,3);});
const GLAS=[['#DCE3EA','#7FA3C4'],['#E6EBF0','#5C7FA6'],['#D3DBE4','#4F6A88'],['#C9D6E2','#3E6E9A'],['#E8EEF2','#6E9C8E'],['#2F3F66','#9CB4CC']];
const glassM=[];export const gM=k=>glassM[k]||(glassM[k]=new THREE.MeshLambertMaterial({map:vband(...GLAS[k%GLAS.length])}));
export const NGLAS=GLAS.length;
// Box mit Welt-UVs (Textur wiederholt sich alle u bzw. v Welteinheiten), Unterkante y=0
export function tbox(w,h,d,u=1,v=1){const g=new THREE.BoxGeometry(w,h,d).translate(0,h/2,0);const uv=g.attributes.uv,n=g.attributes.normal;
 for(let i=0;i<uv.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));const sx=ay>.5?w:(ax>.5?d:w),sy=ay>.5?d:h;uv.setXY(i,uv.getX(i)*sx/u,uv.getY(i)*sy/v);}return g;}
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d).translate(0,h/2,0);
function gable(w,h,d){const s=new THREE.Shape();s.moveTo(-w/2-.08,0);s.lineTo(w/2+.08,0);s.lineTo(0,h);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d+.16,bevelEnabled:false});g.translate(0,0,-(d+.16)/2);return g;}
// Sammler: Geometrien je Material, am Ende zu je einem Mesh zusammengeführt (wenige Draw Calls)
export class Bins{constructor(){this.m=new Map();}
 add(geo,mat,x,y,z,ry=0){if(ry)geo.rotateY(ry);geo.translate(x,y,z);if(!this.m.has(mat))this.m.set(mat,[]);this.m.get(mat).push(geo);}
 meshes(){const out=[];for(const[m,l]of this.m)out.push(new THREE.Mesh(mergeG(l),m));return out;}}
export function mergeG(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;for(const g of gs)n+=g.attributes.position.count;
 const p=new Float32Array(n*3),nm=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g of gs){if(!g.attributes.normal)g.computeVertexNormals();p.set(g.attributes.position.array,o*3);nm.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(p,3));m.setAttribute('normal',new THREE.BufferAttribute(nm,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));return m;}

/* ---------- Gebäude nach Yukis Vorlagen; U = 1 Plan-Feld, Stockwerk 0,2 Felder (×1,25 wie im Musterausschnitt) ---------- */
export function makeKit(U,B,rnd){const pick=a=>a[rnd()*a.length|0],FL=.2*U*1.25;
 const hM=c=>facM(c,PAL.fHaus,1);
 const K={FL,
 house(x,z,ry,fl,{w,d,ziegel=false}={}){w=w||(.52+rnd()*.17)*U;d=d||w*(.92+rnd()*.12);const h=fl*FL,wall=ziegel?PAL.ziegel:pick(PAL.fass);
  B.add(tbox(w,h,d,.31*U,FL),hM(wall),x,0,z,ry);
  if(rnd()<.15&&w<U){B.add(tbox(w+.08,.12,d+.08),colMat('#C9C6BD'),x,h,z,ry);if(rnd()<.4)B.add(box(w*.55,.06,d*.45),colMat('#3E5F8F'),x,h+.12,z,ry);}
  else B.add(gable(w,Math.min(.35*U*.9,w*.6),d),colMat(fl===3?'#3E4E6A':pick(PAL.dach)),x,h,z,ry);
  if(rnd()<.07&&w<U){B.add(box(w*.95,.22,.05),colMat(PAL.balkon),x+Math.sin(ry)*(d/2+.5),0,z+Math.cos(ry)*(d/2+.5),ry);}
  return h;},
 wohnblock(x,z,w,d,fl,{shop=true,wall}={}){const h=fl*FL;wall=wall||pick(['#F2EFE6','#DBD8CA','#E8DCC4','#C1BBAA',PAL.ziegel]);
  B.add(tbox(w,h,d,.38*U,FL),facM(wall,PAL.fBlock,2),x,0,z);
  if(shop)B.add(box(w*.92,FL*.88,.06),colMat(PAL.laden),x,FL*.06,z+d/2+.03);
  for(let f=2;f<fl;f++)B.add(box(w*.9,.07,.22),colMat(PAL.balkon),x,f*FL,z+d/2+.11);
  B.add(tbox(w+.1,.2,d+.1),colMat(wall==PAL.ziegel?'#B87058':'#E6E3DA'),x,h,z);B.add(tbox(w-.3,.08,d-.3),colMat('#C9C3B5'),x,h+.05,z);
  {const sc=pick([PAL.rot,PAL.blau,PAL.gruen,PAL.gelb]);B.add(box(w*.6,.5,.1),colMat(sc),x,h+.2,z+d/2-.15);B.add(box(w*.42,.1,.11),colMat('#FFFFFF'),x,h+.4,z+d/2-.15);}
  if(rnd()<.6)for(const t of[-1,1])B.add(box(.38,.3,.38),colMat(PAL.technik),x+t*w*.2,h+.1,z-d*.1);return h;},
 buero(x,z,w,d,fl,glas=false){const h=fl*FL,OW=[[PAL.buero,PAL.glas],['#E8DCC4','#5C7FA6'],['#DBD8CA','#4F6A88'],['#C1BBAA','#3E4E6A'],[PAL.ziegel,'#F2EADA'],['#3E4E6A','#B8CDE0'],['#F2EFE6','#6E8BAA']],ow=pick(OW);
  B.add(tbox(w,h,d,.45*U,FL),glas?facM(...pick([['#E6EBF0',PAL.glas],['#CFDCE8','#3E6E9A'],['#2F3F66','#9CB4CC']]),3):facM(ow[0],ow[1],3),x,0,z);if(fl>=5)B.add(box(w+.06,FL*.9,d+.06),colMat(pick(['#F3F5F7','#E6E3DA',PAL.rot,PAL.blau])),x,0,z);
  B.add(tbox(w+.12,.22,d+.12),colMat('#F3F5F7'),x,h,z);B.add(tbox(w-.3,.06,d-.3),colMat('#C5CCD4'),x,h+.08,z);B.add(tbox(Math.min(.7,w*.3),.4,Math.min(.6,d*.3)),colMat(PAL.technik),x,h+.1,z);return h;},
 hotel(x,z,w,d,fl){const h=fl*FL;B.add(tbox(w,h,d,.22*U,FL),facM(PAL.navy,PAL.licht,2),x,0,z);B.add(tbox(w+.1,.2,d+.1),colMat('#3A4A72'),x,h,z);B.add(tbox(w*.7,.25,d*.7),colMat('#CFC7B5'),x,h+.2,z);
  B.add(box(w*.45,.5,.05),colMat(PAL.rot),x-w*.15,h-.6,z+d/2+.03);return h;},
 // Glasturm mit Sockel, Geschossbändern und Dachkrone (Glasband, Rücksprünge, Mast)
 tower(x,z,w,d,h,k=rnd()*NGLAS|0,Bt=B,Bc=B){Bc.add(box(w+.6,.5,d+.6),colMat('#E8E4DA'),x,0,z);
  const g=box(w,h,d);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+p.getZ(i))/1.2,p.getY(i)/FL);Bt.add(g,gM(k),x,0,z);
  for(let y=FL*5;y<h;y+=FL*5)Bc.add(box(w+.08,.1,d+.08),colMat('#F2F4F6'),x,y,z);
  // kräftige Dachkrone: weißer Kranz, dunkles Glasband, weißer Deckel, Aufsatz + Mast mit rotem Licht
  Bc.add(box(w+.15,.6,d+.15),colMat('#FFFFFF'),x,h,z);Bc.add(box(w-.4,1.3,d-.4),colMat('#34465E'),x,h+.6,z);
  Bc.add(box(w-.2,.35,d-.2),colMat('#FFFFFF'),x,h+1.9,z);Bc.add(box(w*.45,.9,d*.45),colMat('#D5DCE3'),x,h+2.25,z);Bc.add(box(.12,2.6,.12),colMat('#E8ECEF'),x+w*.12,h+3.1,z-d*.12);Bc.add(box(.3,.3,.3),colMat(PAL.rot),x+w*.12,h+5.7,z-d*.12);return h+6;},
 tree(x,z){B.add(new THREE.IcosahedronGeometry(.45,0).translate(0,.75,0),colMat(pick(['#5DA048','#6FAE52','#C98A3E','#E8A6B8'])),x,0,z);B.add(box(.1,.4,.1),colMat('#6B5040'),x,0,z);}
 };return K;}

/* ---------- Skytree (Runde 10): helles, schlankes Gitter, zwei schmale Deckringe, lange Antenne; s = Maßstab ---------- */
export function skytree5(U){const s=U/2.6,g=new THREE.Group(),Ht=10*U*1.8*.8,dark=colMat('#CDD2D8'),light=colMat('#F1F3F5'),lat=[];
 const rad=y=>{const t=y/Ht;return (3.0*(1-t)**2.8+.32)*s;};
 const bar=(a,b,th)=>{const v=new THREE.Vector3().subVectors(b,a),L=v.length();const m=new THREE.BoxGeometry(th,L,th);m.translate(0,L/2,0);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.applyQuaternion(q);m.translate(a.x,a.y,a.z);lat.push(m);};
 const P=(k,y)=>{const an=k/3*Math.PI*2+Math.PI/6,r=rad(y);return new THREE.Vector3(Math.cos(an)*r,y,Math.sin(an)*r);};
 const st=Ht*.68/22;for(let n=0;n<22;n++){const y0=n*st,y1=y0+st;for(let k=0;k<3;k++){bar(P(k,y0),P(k,y1),.3*s);bar(P(k,y0),P(k+1,y1),.12*s);bar(P(k+1,y0),P(k,y1),.12*s);bar(P(k,y1),P(k+1,y1),.13*s);}}
 g.add(new THREE.Mesh(mergeG(lat),dark));
 g.add(new THREE.Mesh(new THREE.CylinderGeometry(.3*s,.7*s,Ht*.68,10).translate(0,Ht*.34,0),light));
 for(const[f,rr]of[[.44,1.45*s],[.58,1*s]])g.add(new THREE.Mesh(new THREE.CylinderGeometry(rr,rr*.92,.75*s,24).translate(0,Ht*f,0),colMat('#EEF1F4')),new THREE.Mesh(new THREE.CylinderGeometry(rr+.06*s,rr+.06*s,.12*s,24).translate(0,Ht*f+.42*s,0),colMat('#FFFFFF')),new THREE.Mesh(new THREE.CylinderGeometry(rr+.01*s,rr+.01*s,.3*s,24).translate(0,Ht*f,0),colMat('#8FA9C2')));
 g.add(new THREE.Mesh(new THREE.CylinderGeometry(.06*s,.3*s,Ht*.32,8).translate(0,Ht*.84,0),light));
 g.userData.height=Ht;return g;}

/* ---------- Boden: Asphalt, Linien, Blöcke, Wasser (Canvas-Textur, PX Pixel je Feld) ---------- */
export const RAND_WASSER=QS.get('rand')!=='schwarz';// v6 Standard (Erik): Meer statt Schwarz außerhalb der Karte, ?rand=schwarz = alt
export function drawGround(g,PX,N,cellAt,isRoad){
 const R=(x,y)=>isRoad(cellAt(x,y)),Wt=(x,y)=>cellAt(x,y)==='wasser'||(RAND_WASSER&&cellAt(x,y)==='aussen'),L=(x,y)=>{const c=cellAt(x,y);return c!=='aussen'&&c!=='wasser'&&!isRoad(c);};
 const run=(x,y,dx,dy)=>{let n=1,i=1;while(R(x+dx*i,y+dy*i)){n++;i++;}i=1;while(R(x-dx*i,y-dy*i)){n++;i++;}return n;};
 const runStart=(x,y,dx,dy)=>{let i=0;while(R(x-dx*(i+1),y-dy*(i+1)))i++;return i;};
 g.fillStyle=RAND_WASSER?PAL.wasser:'#0B0D12';g.fillRect(0,0,N*PX,N*PX);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=cellAt(x,y),X=x*PX,Y=y*PX;
  g.fillStyle=c==='wasser'?PAL.wasser:isRoad(c)?PAL.asphalt:c==='park'?'#B5D36A':c==='aussen'?(RAND_WASSER?PAL.wasser:'#0B0D12'):PAL.gras;g.fillRect(X,Y,PX,PX);}
 const lw=Math.max(1,PX/24),ins=PX*.1;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=cellAt(x,y),X=x*PX,Y=y*PX;
  if(isRoad(c)){g.fillStyle=PAL.linie;
   // weiße Randlinie überall, wo die Straße an Nicht-Straße grenzt (Brücken: Geländer-Kante)
   if(!R(x,y-1))g.fillRect(X,Y+ins,PX,lw);if(!R(x,y+1))g.fillRect(X,Y+PX-ins-lw,PX,lw);if(!R(x-1,y))g.fillRect(X+ins,Y,lw,PX);if(!R(x+1,y))g.fillRect(X+PX-ins-lw,Y,lw,PX);
   // Mittellinie entlang der Fahrtrichtung (nie quer), an Kreuzungen keine
   const h=run(x,y,1,0),v=run(x,y,0,1);g.fillStyle=PAL.strich;
   const MW=PX*.3,mc=c==='hauptstrasse';
   // v5: kein Grünstreifen innerhalb einer einzelnen 2-spurigen Hauptstraße (nur zwischen echt parallelen Straßen, s. u.)
   if(false){}

   else if(h>v+1&&v<=3){const cy=(y-runStart(x,y,0,1))*PX+v*PX/2;if(cy>=Y&&cy<=Y+PX)g.fillRect(X+PX*.3,cy-lw/2,PX*.4,lw);}
   else if(v>h+1&&h<=3){const cx=(x-runStart(x,y,1,0))*PX+h*PX/2;if(cx>=X&&cx<=X+PX)g.fillRect(cx-lw/2,Y+PX*.3,lw,PX*.4);}
  }else if(L(x,y)){// Bordstein zur Straße, gelbgrüne Uferkante zum Wasser
   g.fillStyle=PAL.bord;const k=Math.max(2,PX/12);if(R(x,y-1))g.fillRect(X,Y,PX,k);if(R(x,y+1))g.fillRect(X,Y+PX-k,PX,k);if(R(x-1,y))g.fillRect(X,Y,k,PX);if(R(x+1,y))g.fillRect(X+PX-k,Y,k,PX);
   g.fillStyle=PAL.ufer;const u=PX*.3;// V6 (Vorlage m26): türkises Wasser, breitere grüne Uferstreifen
   if(Wt(x,y-1))g.fillRect(X,Y,PX,u);if(Wt(x,y+1))g.fillRect(X,Y+PX-u,PX,u);if(Wt(x-1,y))g.fillRect(X,Y,u,PX);if(Wt(x+1,y))g.fillRect(X+PX-u,Y,u,PX);
  }}
 parkPaths(g,PX,N,cellAt);
 // V6 (Whitebeard 4816e73, Vorlage): durchgehender grüner Uferstreifen auf der Wasserseite jeder Land-/Straßenkante (auch wo eine Straße am Wasser liegt), Brücken ausgenommen
 {const us=PX*.22;g.fillStyle=PAL.ufer;for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='wasser')continue;const X=x*PX,Y=y*PX,Lk=(a,b)=>{const c=cellAt(a,b);return c!=='wasser'&&c!=='aussen'&&c!=='bruecke'};
  if(Lk(x,y-1))g.fillRect(X,Y,PX,us);if(Lk(x,y+1))g.fillRect(X,Y+PX-us,PX,us);if(Lk(x-1,y))g.fillRect(X,Y,us,PX);if(Lk(x+1,y))g.fillRect(X+PX-us,Y,us,PX);}}
 // Grünstreifen zwischen parallelen Straßen verschiedenen Typs (Ring neben Hauptstraße) – keine Asphaltflächen über ganze Blöcke
 const T=(x,y)=>cellAt(x,y),MW2=PX*.36,par=(c,d)=>c!==d&&(c==='ringstrasse'||d==='ringstrasse'||c==='gasse'||d==='gasse');
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=T(x,y);if(!isRoad(c)||c==='bruecke')continue;
  const e=T(x+1,y);if(isRoad(e)&&e!=='bruecke'&&par(c,e)&&R(x,y-1)&&R(x,y+1)&&R(x+1,y-1)&&R(x+1,y+1)&&T(x,y-1)===c&&T(x,y+1)===c&&T(x+1,y-1)===e&&T(x+1,y+1)===e){const X=(x+1)*PX;g.fillStyle='#9DBF5A';g.fillRect(X-MW2/2,y*PX,MW2,PX);g.fillStyle=PAL.bord;g.fillRect(X-MW2/2,y*PX,lw,PX);g.fillRect(X+MW2/2-lw,y*PX,lw,PX);}
  const s=T(x,y+1);if(isRoad(s)&&s!=='bruecke'&&par(c,s)&&R(x-1,y)&&R(x+1,y)&&R(x-1,y+1)&&R(x+1,y+1)&&T(x-1,y)===c&&T(x+1,y)===c&&T(x-1,y+1)===s&&T(x+1,y+1)===s){const Y=(y+1)*PX;g.fillStyle='#9DBF5A';g.fillRect(x*PX,Y-MW2/2,PX,MW2);g.fillStyle=PAL.bord;g.fillRect(x*PX,Y-MW2/2,PX,lw);g.fillRect(x*PX,Y+MW2/2-lw,PX,lw);}}
}
// Brücken (Straßenfelder 'bruecke'): je Brücke farbige Stahl-Bogenträger (Coffee-Inc-Stil) + Geländer
const BR_COL=['#3D7BD9','#5DBB73','#E94F4F','#FFC93C','#2FA5A0','#8E6BD9'];
export function bridgeRails(N,cellAt,wx,wz,F,skip=()=>false){const B=new Bins(),seen=new Set(),K=(x,y)=>y*N+x;let bi=0;
 const seg=(ax,ay,az,bx,by,bz,t,mat)=>{const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz),v=b.clone().sub(a),L=v.length();const g=new THREE.BoxGeometry(t,L,t).translate(0,L/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));B.add(g,mat,ax,ay,az);};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='bruecke'||seen.has(K(x,y)))continue;
  const comp=[],st=[[x,y]];seen.add(K(x,y));while(st.length){const[a,b]=st.pop();comp.push([a,b]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=[a+dx,b+dy];if(cellAt(c[0],c[1])==='bruecke'&&!seen.has(K(c[0],c[1]))){seen.add(K(c[0],c[1]));st.push(c);}}}
  const xs=comp.map(c=>c[0]),ys=comp.map(c=>c[1]),x0=Math.min(...xs),x1=Math.max(...xs)+1,y0=Math.min(...ys),y1=Math.max(...ys)+1;
  let wNS=0,wEW=0;for(const[a,b]of comp){if(cellAt(a,b-1)==='wasser')wNS++;if(cellAt(a,b+1)==='wasser')wNS++;if(cellAt(a-1,b)==='wasser')wEW++;if(cellAt(a+1,b)==='wasser')wEW++;}
  if(comp.some(([a,b])=>skip(a,b)))continue;
  const alongX=wNS>=wEW,mat=colMat(BR_COL[bi++%BR_COL.length]),rail=colMat('#F4F6F8');
  const L0=alongX?wx(x0):wz(y0),L1=alongX?wx(x1):wz(y1),S0=alongX?wz(y0):wx(x0),S1=alongX?wz(y1):wx(x1),len=L1-L0,Hh=Math.min(3.2,1.2+len*.18),n=10;
  const P=(u,side,yy)=>alongX?[L0+u,yy,side]:[side,yy,L0+u];
  for(const side of[S0+.2,S1-.2]){// Bogen, Untergurt, Hänger, Geländer
   for(let i=0;i<n;i++){const u0=len*i/n,u1=len*(i+1)/n,h0=Hh*Math.sin(Math.PI*i/n)+.45,h1=Hh*Math.sin(Math.PI*(i+1)/n)+.45;seg(...P(u0,side,h0),...P(u1,side,h1),.26,mat);}
   for(let i=1;i<n;i++){const u=len*i/n,h=Hh*Math.sin(Math.PI*i/n);if(h>.3)seg(...P(u,side,.45),...P(u,side,h+.45),.09,mat);}
   seg(...P(0,side,.35),...P(len,side,.35),.3,mat);seg(...P(0,side,.75),...P(len,side,.75),.1,rail);}
  // Querriegel oben am Scheitel
  for(const f of[.35,.5,.65]){const u=len*f,h=Hh*Math.sin(Math.PI*f)+.45;seg(...P(u,S0+.2,h),...P(u,S1-.2,h),.16,mat);}
 }
 const g=new THREE.Group();for(const m of B.meshes())g.add(m);return g;}
// Bäume auf Mittelstreifen (gleiche Bedingung wie drawGround)
export function medianTrees(N,cellAt,isRoad,wx,wz,F){const B=new Bins(),R=(x,y)=>isRoad(cellAt(x,y));
 const run=(x,y,dx,dy)=>{let n=1,i=1;while(R(x+dx*i,y+dy*i)){n++;i++;}i=1;while(R(x-dx*i,y-dy*i)){n++;i++;}return n;};
 const st=(x,y,dx,dy)=>{let i=0;while(R(x-dx*(i+1),y-dy*(i+1)))i++;return i;};
 const T=(X,Z)=>{B.add(new THREE.CylinderGeometry(.1,.12,.7,5).translate(0,.35,0),colMat('#7A5A3C'),X,0,Z);B.add(new THREE.BoxGeometry(1.05,1.05,1.05).translate(0,1.1,0),colMat('#6FA34A'),X,0,Z);};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(cellAt(x,y)!=='hauptstrasse')continue;const h=run(x,y,1,0),v=run(x,y,0,1);
  if(h>v+1&&v===2&&h>=4&&st(x,y,0,1)===0&&x%2===0&&R(x-1,y)&&R(x+1,y)&&run(x-1,y,0,1)===2&&run(x+1,y,0,1)===2)T(wx(x)+F/2,wz(y)+F);
  else if(v>h+1&&h===2&&v>=4&&st(x,y,1,0)===0&&y%2===0&&R(x,y-1)&&R(x,y+1)&&run(x,y-1,1,0)===2&&run(x,y+1,1,0)===2)T(wx(x)+F,wz(y)+F/2);}
 const g=new THREE.Group();for(const m of B.meshes())g.add(m);return g;}
/* ---------- V5-Wahrzeichen (Qualität wie Skytree Runde 10) ---------- */
function latticeBars(){const L=[];const bar=(a,b,th)=>{const v=new THREE.Vector3().subVectors(b,a),n=v.length();const m=new THREE.BoxGeometry(th,n,th);m.translate(0,n/2,0);m.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));m.translate(a.x,a.y,a.z);L.push(m);};return {L,bar};}
// Tokyo Tower: 4 Beine, rot/weiße Gitterbänder, zwei Aussichtsdecks, Antenne (≈ 0,55 × Skytree)
export function tokyoTower5(U){const g=new THREE.Group(),s=U/2.6,H=32*s,red=[],wht=[],R=latticeBars(),W=latticeBars();
 const half=y=>{const t=y/(H*.78);return (2.9*(1-t)**2.2+.28)*s;};
 const P=(k,y)=>{const a=k*Math.PI/2+Math.PI/4,r=half(y)*Math.SQRT2;return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);};
 const n=20,st=H*.78/n,WB=new Set([6,7,13,14,18]);
 for(let i=0;i<n;i++){const y0=i*st,y1=y0+st,T=WB.has(i)?W:R;for(let k=0;k<4;k++){T.bar(P(k,y0),P(k,y1),.34*s);T.bar(P(k,y0),P(k+1,y1),.12*s);T.bar(P(k+1,y0),P(k,y1),.12*s);T.bar(P(k,y1),P(k+1,y1),.14*s);}}
 // Bögen zwischen den Beinen am Fuß
 for(let k=0;k<4;k++){const a=P(k,0),b=P(k+1,0),m=a.clone().lerp(b,.5);m.y=st*2.2;m.multiplyScalar(1);R.bar(a,new THREE.Vector3((a.x+m.x)/2,st*1.6,(a.z+m.z)/2),.25*s);R.bar(new THREE.Vector3((a.x+m.x)/2,st*1.6,(a.z+m.z)/2),m,.25*s);R.bar(m,new THREE.Vector3((b.x+m.x)/2,st*1.6,(b.z+m.z)/2),.25*s);R.bar(new THREE.Vector3((b.x+m.x)/2,st*1.6,(b.z+m.z)/2),b,.25*s);}
 g.add(new THREE.Mesh(mergeG(R.L),colMat('#E8452C')));g.add(new THREE.Mesh(mergeG(W.L),colMat('#FAFAF7')));
 const deck=(y,w,h,c)=>{g.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,w).translate(0,y+h/2,0),colMat(c)));g.add(new THREE.Mesh(new THREE.BoxGeometry(w+.1*s,.25*s,w+.1*s).translate(0,y+h,0),colMat('#FFFFFF')));g.add(new THREE.Mesh(new THREE.BoxGeometry(w+.02,h*.45,w+.02).translate(0,y+h*.3,0),colMat('#6E8BAA')));};
 deck(H*.36,half(H*.36)*2.3,1.1*s,'#F4F1EA');deck(H*.64,half(H*.64)*2.6,.7*s,'#F4F1EA');
 g.add(new THREE.Mesh(new THREE.BoxGeometry(.35*s,H*.22,.35*s).translate(0,H*.78+H*.11,0),colMat('#E8452C')));
 g.add(new THREE.Mesh(new THREE.BoxGeometry(.18*s,H*.06,.18*s).translate(0,H,0),colMat('#FAFAF7')));
 g.add(new THREE.Mesh(new THREE.BoxGeometry(7.2*s,.6*s,7.2*s).translate(0,.3*s,0),colMat('#E6E1D6')));// Sockel/Foot Town
 g.add(new THREE.Mesh(new THREE.BoxGeometry(5.4*s,1.6*s,3*s).translate(0,.8*s,2.9*s),colMat('#F2EFE6')));
 g.userData.height=H*1.03;return g;}
// Roppongi Hills (Mori Tower): gestufter dunkler Glasturm, weiße Gesimse, Krone
export function roppongi5(U){const g=new THREE.Group(),s=U/2.6,B=new Bins(),FL=.2*U*1.25;
 B.add(box(7.4*s,1.4*s,7.2*s),colMat('#E6E1D6'),0,0,0);B.add(box(6*s,2.4*s,1.8*s),facM('#F2EFE6',PAL.glas,3),0,0,2.6*s);
 let y=1.4*s;const steps=[[4.9,11],[4.4,9],[3.9,7],[3.3,4]];
 for(const[w,f]of steps){const h=f*FL,W=w*s,D=W*.86;B.add(tbox(W,h,D,1.2,FL),facM('#2B3954','#5F7EA3',3),0,y,0);B.add(box(W+.12,.3*s,D+.12),colMat('#F3F5F7'),0,y+h-.3*s,0);
  for(const sx of[-1,1])B.add(box(.22*s,h,.22*s),colMat('#E8ECEF'),sx*(W/2),y,D/2);y+=h;}
 B.add(box(3.6*s,.5*s,3.2*s),colMat('#FFFFFF'),0,y,0);B.add(box(2.9*s,1.6*s,2.5*s),colMat('#34465E'),0,y+.5*s,0);B.add(box(3.1*s,.35*s,2.7*s),colMat('#FFFFFF'),0,y+2.1*s,0);
 for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])B.add(box(.2*s,1.8*s,.2*s),colMat('#E8ECEF'),dx*1.35*s,y+2.4*s,dz*1.15*s);
 B.add(box(.15*s,2.4*s,.15*s),colMat('#E8ECEF'),.6*s,y+2.4*s,0);B.add(box(.3*s,.3*s,.3*s),colMat(PAL.rot),.6*s,y+4.8*s,0);
 for(const m of B.meshes())g.add(m);g.userData.height=y+5*s;return g;}
// Kaiserpalast: Steinsockel, weiße Hallen mit grünen Dächern, Fushimi-Wachturm, Nijubashi-Brücke
export function palace5(U){const g=new THREE.Group(),s=U/2.6,B=new Bins();
 const roof=(w,d,h,c,x,y,z)=>{const geo=new THREE.CylinderGeometry(.01,1,h,4,1).rotateY(Math.PI/4);geo.scale(w*.72,1,d*.72);geo.translate(0,h/2,0);B.add(geo,colMat(c),x,y,z);};
 B.add(box(13*s,.8*s,9*s),colMat('#C9C3B5'),0,0,-1*s);B.add(box(13.4*s,.15*s,9.4*s),colMat('#E6E1D6'),0,.8*s,-1*s);
 B.add(box(9*s,1.6*s,4.2*s),colMat('#F4F1EA'),0,.95*s,-2.5*s);B.add(box(9.2*s,.4*s,4.4*s),colMat('#6E5A48'),0,2.2*s,-2.5*s);roof(10.4*s,5.4*s,1.5*s,'#5E8C6E',0,2.55*s,-2.5*s);
 for(const sx of[-1,1]){B.add(box(3*s,1.2*s,2.6*s),colMat('#F4F1EA'),sx*4.2*s,.95*s,2.2*s);roof(3.6*s,3.1*s,1*s,'#5E8C6E',sx*4.2*s,2.15*s,2.2*s);}
 B.add(box(2.2*s,1.4*s,2*s),colMat('#F7F5F0'),-5.6*s,.95*s,-5.4*s);roof(2.8*s,2.6*s,.7*s,'#3E4E5A',-5.6*s,2.35*s,-5.4*s);B.add(box(1.5*s,.9*s,1.4*s),colMat('#F7F5F0'),-5.6*s,3.05*s,-5.4*s);roof(2*s,1.9*s,.7*s,'#3E4E5A',-5.6*s,3.95*s,-5.4*s);
 B.add(box(1.6*s,.25*s,4.5*s),colMat('#D9D4C7'),2*s,.5*s,6*s);for(const z of[4.6,6,7.4])B.add(box(1.6*s,.5*s,.35*s),colMat('#C9C3B5'),2*s,0,z*s);
 B.add(box(.1*s,.35*s,4.5*s),colMat('#2B2D42'),1.25*s,.75*s,6*s);B.add(box(.1*s,.35*s,4.5*s),colMat('#2B2D42'),2.75*s,.75*s,6*s);
 for(const m of B.meshes())g.add(m);g.userData.height=5*s;return g;}
// Parks: Wege + Baumgruppen (Boden) – wird von drawGround5Parks auf die Bodentextur gemalt
export function parkPaths(g,PX,N,cellAt){const P=(x,y)=>cellAt(x,y)==='park';
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!P(x,y))continue;const X=x*PX,Y=y*PX,pw=PX*.24;g.fillStyle='#EFE6CF';
  const hv=(x%3===1),vv=(y%3===1);// Wegeraster alle 3 Felder, nur wo der Park weitergeht
  if(vv&&(P(x-1,y)||P(x+1,y)))g.fillRect(X,Y+PX/2-pw/2,PX,pw);if(hv&&(P(x,y-1)||P(x,y+1)))g.fillRect(X+PX/2-pw/2,Y,pw,PX);
  if(((x*7+y*13)%17)===5&&P(x+1,y)&&P(x,y+1)&&!hv&&!vv){g.fillStyle='#E9DFC6';g.fillRect(X+PX*.15,Y+PX*.15,PX*.7,PX*.7);g.fillStyle='#4FA0B4';g.fillRect(X+PX*.25,Y+PX*.25,PX*.5,PX*.5);}}}
export const parkPathAt=(x,y)=>(x%3===1)||(y%3===1)||((x*7+y*13)%17)===5;
const roof4=(B,w,d,h,c,x,y,z)=>{const geo=new THREE.CylinderGeometry(.01,1,h,4,1).rotateY(Math.PI/4);geo.scale(w*.72,1,d*.72);geo.translate(0,h/2,0);B.add(geo,colMat(c),x,y,z);};
const out=(B)=>{const g=new THREE.Group();for(const m of B.meshes())g.add(m);return g;};
// Tokyo Station: dreistöckiger Ziegelbau mit weißen Bändern, Fenstern und zwei Kuppeln, Vorplatz
export function station5(U){const s=U/2.6,B=new Bins(),FL=.2*U*1.25,L=14*s,D=3.6*s;
 B.add(box(L+2*s,.15,D+5*s),colMat('#E6E1D6'),0,0,1.2*s);
 B.add(tbox(L,3*FL,D,.45*U,FL),facM('#B5523B','#F2EADA',3),0,0,0);for(const y of[FL,2*FL,3*FL-.15])B.add(box(L+.1,.15,D+.1),colMat('#F4F1EA'),0,y,0);
 B.add(box(L+.3,.25,D+.3),colMat('#5C6370'),0,3*FL,0);
 for(const x of[-L/2+1.6*s,0,L/2-1.6*s]){B.add(tbox(3.2*s,4*FL,D+1*s,.45*U,FL),facM('#B5523B','#F2EADA',3),x,0,0);B.add(box(3.4*s,.2,D+1.2*s),colMat('#F4F1EA'),x,4*FL,0);
  if(x){const dm=new THREE.CylinderGeometry(.25*s,1.6*s,1.8*s,8).translate(0,.9*s,0);B.add(dm,colMat('#4A4F5E'),x,4*FL+.2,0);B.add(box(.15*s,.8*s,.15*s),colMat('#C9A54B'),x,4*FL+2*s,0);}
  else roof4(B,3.4*s,D+1.2*s,1.2*s,'#4A4F5E',x,4*FL+.2,0);}
 return out(B);}
// Shibuya-Kreuzung: Scramble-Platz mit Zebrastreifen, 109 (Zylinder mit Schild), Q-Front mit Bildschirm, Scramble Square
export function shibuya5(U){const s=U/2.6,B=new Bins(),FL=.2*U*1.25,w=10*s;
 B.add(box(w,.06,w),colMat('#D9D4C7'),0,0,0);B.add(box(w*.62,.07,1.9*s*1.6),colMat('#4A4D52'),0,0,0);B.add(box(1.9*s*1.6,.07,w*.62),colMat('#4A4D52'),0,0,0);B.add(box(5.4*s,.075,5.4*s),colMat('#4A4D52'),0,0,0);const z=colMat('#F4F6F8');
 for(let i=-1;i<=1;i++){B.add(box(.5*s,.04,1.8*s),z,i*1.05*s,.06,-2.3*s);B.add(box(.5*s,.04,1.8*s),z,i*1.05*s,.06,2.3*s);B.add(box(1.8*s,.04,.5*s),z,-2.3*s,.06,i*1.05*s);B.add(box(1.8*s,.04,.5*s),z,2.3*s,.06,i*1.05*s);}
 for(const a of[Math.PI/4,-Math.PI/4])for(let i=-2;i<=1;i++){const g=new THREE.BoxGeometry(.45*s,.04,1.6*s).translate(0,.08,0);g.rotateY(a);B.add(g,z,Math.cos(a)*i*1.1*s,0,-Math.sin(a)*i*1.1*s);}
 const c=3.8*s;
 B.add(new THREE.CylinderGeometry(1.1*s,1.1*s,9*FL,12).translate(0,9*FL/2,0),colMat('#D8DDE3'),-c,0,-c);B.add(new THREE.CylinderGeometry(1.15*s,1.15*s,1.2*s,12).translate(0,6*FL,0),colMat('#2B2D42'),-c,0,-c);B.add(box(1.6*s,.9*s,.25*s),colMat(PAL.rot),-c,9*FL,-c+.9*s);
 B.add(tbox(2.6*s,6*FL,2.4*s,.45*U,FL),facM('#3E4E6A','#B8CDE0',3),c,0,c);B.add(box(2.2*s,1.8*s,.12),colMat('#FF6FA8'),c,2.5*FL,c-1.25*s);B.add(box(1.4*s,.9*s,.13),colMat('#FFC93C'),c-.2*s,2.5*FL+.5*s,c-1.26*s);
 B.add(tbox(2.7*s,22*FL,2.5*s,1.2,FL),facM('#2F3F66','#9CB4CC',3),c,0,-c);B.add(box(2.9*s,.4*s,2.7*s),colMat('#FFFFFF'),c,22*FL,-c);B.add(box(2.3*s,1.2*s,2.1*s),colMat('#34465E'),c,22*FL+.4*s,-c);B.add(box(2.5*s,.3*s,2.3*s),colMat('#FFFFFF'),c,22*FL+1.6*s,-c);
 B.add(tbox(2.6*s,5*FL,2.4*s,.45*U,FL),facM('#F2EFE6',PAL.glas,3),-c,0,c);B.add(box(2*s,.8*s,.12),colMat(PAL.blau),-c,4*FL,c-1.25*s);
 return out(B);}
// Gōtoku-ji: Haupthalle, dreistöckige Pagode, Torii, Kiesplatz, Steinlaternen
export function gotoku5(U){const s=U/2.6,B=new Bins();
 B.add(box(9*s,.12,8*s),colMat('#E9DFC6'),0,0,0);
 B.add(box(5*s,.5*s,3.4*s),colMat('#C9C3B5'),0,0,-2*s);B.add(box(4.4*s,1.8*s,2.8*s),colMat('#8A5A3C'),0,.5*s,-2*s);B.add(box(4.5*s,.9*s,2.9*s),colMat('#F4F1EA'),0,1.2*s,-2*s);roof4(B,6*s,4.2*s,1.8*s,'#3E4E5A',0,2.3*s,-2*s);
 for(let i=0;i<3;i++){const y=.3*s+i*1.3*s,w=(1.9-i*.25)*s;B.add(box(w,1*s,w),colMat('#8A5A3C'),3.2*s,y,1.8*s);roof4(B,w*1.9,w*1.9,.45*s,'#3E4E5A',3.2*s,y+1*s,1.8*s);}
 B.add(box(.12*s,1.4*s,.12*s),colMat('#C9A54B'),3.2*s,4.2*s,1.8*s);
 const R=colMat('#E2452F');B.add(box(.35*s,2.6*s,.35*s),R,-1.3*s,0,3.4*s);B.add(box(.35*s,2.6*s,.35*s),R,1.3*s,0,3.4*s);B.add(box(3.8*s,.32*s,.5*s),R,0,2.6*s,3.4*s);B.add(box(3.4*s,.22*s,.4*s),colMat('#2B2D42'),0,2.92*s,3.4*s);B.add(box(3*s,.25*s,.3*s),R,0,2.05*s,3.4*s);
 for(const x of[-2.6,-1.6])for(const z of[-.2,1.2]){B.add(box(.4*s,.9*s,.4*s),colMat('#B9BDC3'),x*s,0,z*s);B.add(box(.6*s,.2*s,.6*s),colMat('#9A9DA2'),x*s,.9*s,z*s);}
 return out(B);}
// Akamon (Hongō): großes rotes Tor mit Doppeldach, Seitenmauern, Wächterhäuschen, Yasuda-Auditorium
export function akamon5(U){const s=U/2.6*.76,B=new Bins(),R='#C9302C';
 B.add(box(10*s,.12,7*s),colMat('#E9DFC6'),0,0,0);
 for(const sx of[-1.6,-.55,.55,1.6])B.add(box(.45*s,2.6*s,.45*s),colMat(R),sx*s,0,1.5*s);
 B.add(box(4.2*s,.6*s,1.6*s),colMat(R),0,2.6*s,1.5*s);B.add(box(4.4*s,.25*s,1.8*s),colMat('#F4F1EA'),0,3.2*s,1.5*s);roof4(B,5.8*s,2.8*s,1.5*s,'#3E4E5A',0,3.45*s,1.5*s);
 for(const sx of[-1,1]){B.add(box(2.6*s,1.7*s,.4*s),colMat('#F3EEE6'),sx*3.5*s,0,1.5*s);B.add(box(2.8*s,.25*s,.6*s),colMat('#3E4E5A'),sx*3.5*s,1.7*s,1.5*s);B.add(box(1.2*s,1.4*s,1.2*s),colMat(R),sx*2.9*s,0,2.5*s);roof4(B,1.7*s,1.7*s,.6*s,'#3E4E5A',sx*2.9*s,1.4*s,2.5*s);}
 B.add(tbox(6.5*s,3*s,2.6*s,.45*U,.25*U),facM('#B0563E','#F2EADA',3),0,0,-2.4*s);B.add(box(6.7*s,.25*s,2.8*s),colMat('#5C6370'),0,3*s,-2.4*s);
 B.add(tbox(1.8*s,6*s,1.8*s,.45*U,.25*U),facM('#B0563E','#F2EADA',3),0,0,-1.6*s);roof4(B,2.2*s,2.2*s,1.2*s,'#5C6370',0,6*s,-1.6*s);B.add(box(.9*s,.9*s,.1),colMat('#FFFFFF'),0,4.6*s,-.68*s);
 return out(B);}
// Odaiba: Fuji-TV-Gebäude – zwei weiße Gittertürme, Glasbänder, Verbindungsträger, silberne Kugel mit Ring
export function fujiTV5(U){const s=U/2.6*.9,B=new Bins(),W=colMat('#F4F6F8'),Gl=colMat('#6E9CC4'),Gr=colMat('#B9BDC3');
 B.add(box(11*s,.5*s,8*s),colMat('#E6E1D6'),0,0,0);
 const tw=(cx,w,d,h)=>{B.add(box(w-.5*s,h,d-.5*s),Gl,cx,.5*s,0);for(const sx of[-1,1])for(const sz of[-1,1])B.add(box(.45*s,h,.45*s),W,cx+sx*(w/2-.22*s),.5*s,sz*(d/2-.22*s));
  for(let y=.5*s;y<=h+.5*s;y+=1.5*s){B.add(box(w,.3*s,.4*s),W,cx,y,d/2-.2*s);B.add(box(w,.3*s,.4*s),W,cx,y,-d/2+.2*s);B.add(box(.4*s,.3*s,d),W,cx-w/2+.2*s,y,0);B.add(box(.4*s,.3*s,d),W,cx+w/2-.2*s,y,0);}
  for(const k of[-1,1])B.add(box(.3*s,h,.42*s),W,cx+k*w/6,.5*s,d/2-.2*s);};
 tw(-3.2*s,3.6*s,5*s,9*s);tw(3.2*s,3.6*s,5*s,10.5*s);
 for(const y of[2,5,8.6])for(const z of[-1.4,1.4])B.add(box(2.8*s,.6*s,1.1*s),Gr,0,y*s,z*s);
 B.add(box(2.8*s,.5*s,5*s),W,0,7.2*s,0);
 const sp=new THREE.SphereGeometry(2.1*s,12,8);B.add(sp,colMat('#D9DEE4'),0,8.4*s,1.6*s);
 const ring=new THREE.TorusGeometry(2.2*s,.14*s,4,16).rotateX(Math.PI/2);B.add(ring,Gr,0,8.4*s,1.6*s);
 B.add(box(4*s,1.6*s,2.4*s),colMat('#F2EFE6'),0,.5*s,3.2*s);
 return out(B);}
