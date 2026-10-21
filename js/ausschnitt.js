// V4b Musterausschnitt 2 (nur Testseite ausschnitt.html, NICHT im Spiel).
// Coffee-Inc-Look: jedes Feld rundum von echten Straßen umgeben (dunkler Asphalt, weiße Randlinien, feine gestrichelte Mittellinie),
// kleine gelbgrüne Blöcke mit schmalem weißem Bordstein, verschlungene Kanäle, kleine Häuser mit Satteldach, Mittelbauten mit Fensterraster,
// schlanke Glas-Türme (auch rund), Skytree-Gitterturm, Pins als Sprite (pin-zu-vermieten.svg).
import * as THREE from '../lib/three.module.min.js';
// Testflag: ausschnitt.html?pin=v2 zeigt Yukis Pin-Entwurf v2 (nur Vorschlag, nicht Standard)
const PINV2=new URLSearchParams(location.search).get('pin')!=='v1'; // Runde 9: v2 Standard auf der Testseite, ?pin=v1 = alter Pin
const CAM={elev:35*Math.PI/180,yaw:45*Math.PI/180,viewH:120,zoom:1.8};
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const pick=a=>a[rnd()*a.length|0];
const scene=new THREE.Scene();scene.background=new THREE.Color('#000');
const W=innerWidth,H=innerHeight,asp=W/H,VH=CAM.viewH;
const cam=new THREE.OrthographicCamera(-VH*asp/2,VH*asp/2,VH/2,-VH/2,-600,1200);
const D=400;cam.position.set(Math.sin(CAM.yaw)*Math.cos(CAM.elev)*D,Math.sin(CAM.elev)*D,Math.cos(CAM.yaw)*Math.cos(CAM.elev)*D);cam.lookAt(0,0,0);cam.zoom=CAM.zoom;cam.updateProjectionMatrix();cam.updateMatrixWorld();
const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(W,H);document.body.appendChild(r.domElement);
scene.add(new THREE.HemisphereLight('#ffffff','#b8c0c8',1.7));const sun=new THREE.DirectionalLight('#fff',1.5);sun.position.set(-50,100,30);scene.add(sun);
// ---------- Texturen (Canvas) ----------
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const winTex=(wall,glass,frame)=>canvasTex(64,64,(g,w,h)=>{g.fillStyle=wall;g.fillRect(0,0,w,h);g.fillStyle=glass;g.fillRect(10,14,44,32);g.fillStyle=frame;g.fillRect(31,14,2,32);g.fillRect(10,46,44,4);});
const glassTex=(a,b)=>canvasTex(32,64,(g,w,h)=>{g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle=b;g.fillRect(0,0,w,40);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(2,4,6,30);g.fillStyle='#e6e9ee';g.fillRect(0,40,w,6);});
const houseTex=(wall)=>canvasTex(64,64,(g,w,h)=>{g.fillStyle=wall;g.fillRect(0,0,w,h);g.fillStyle='#5C7FA6';g.fillRect(12,18,16,18);g.fillRect(38,18,16,18);g.fillStyle='#fff';g.fillRect(12,36,16,3);g.fillRect(38,36,16,3);});
const roadTex=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#4a4d52';g.fillRect(0,0,w,h);g.fillStyle='#e9ebee';g.fillRect(4,0,2,h);g.fillRect(w-6,0,2,h);g.fillRect(w/2-1,0,2,h/2);});
// ---------- Geometrie-Sammler (pro Material zusammenführen) ----------
const bins=new Map();const mats={};
function matKey(k,make){return mats[k]||(mats[k]=make());}
const colMat=c=>matKey(c,()=>new THREE.MeshLambertMaterial({color:c}));
function add(geo,mat,x,y,z,ry=0){if(ry)geo.rotateY(ry);geo.translate(x,y,z);if(!bins.has(mat))bins.set(mat,[]);bins.get(mat).push(geo);}
// Box mit Welt-UVs (Textur wiederholt sich je u/v Welteinheiten)
function tbox(w,h,d,u=1,v=1){const g=new THREE.BoxGeometry(w,h,d).translate(0,h/2,0);const uv=g.attributes.uv,n=g.attributes.normal;
 for(let i=0;i<uv.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));const sx=ay>.5?w:(ax>.5?d:w),sy=ay>.5?d:h;uv.setXY(i,uv.getX(i)*sx/u,uv.getY(i)*sy/v);}return g;}
function rbox(w,h,d){return new THREE.BoxGeometry(w,h,d).translate(0,h/2,0);} // V4b-6: keine runden Ecken – immer scharfe 90°-Quader
function gable(w,h,d){const s=new THREE.Shape();s.moveTo(-w/2-.06,0);s.lineTo(w/2+.06,0);s.lineTo(0,h);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d+.12,bevelEnabled:false});g.translate(0,0,-(d+.12)/2);return g;}
// ---------- Raster: Zellen 9 (Block 6 + Straße 3) ----------
const C=9,RW=2.6,BLK=C-RW,N=30,O=-N*C/2;
const water=new Set();const key=(i,j)=>i+','+j;
// Wasser aus glatten Kurven (breite, geschwungene Kanäle + Bucht), Zellen folgen der Kurve
const wv=(i,j)=>{const c3=j===13&&i>11&&i<24,c1=i===11,c2=j===18&&i>11,bay=i>=21&&i<=23&&j>=23&&j<=25;return c1||c2||c3||bay;}; // gerade Kanäle, rechteckige Bucht
for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(wv(i,j))water.add(key(i,j));
const isW=(i,j)=>water.has(key(i,j));
// Blöcke verschmelzen (unregelmäßige Breiten, 90°-Stufen): 1x1, 2x1, 1x2
const used=new Set();const blocks=[];
for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(isW(i,j)||used.has(key(i,j)))continue;let w=1,d=1;const k=rnd();
 const free=(a,b)=>a<N&&b<N&&!isW(a,b)&&!used.has(key(a,b));
 if(k<.12&&free(i+1,j)&&free(i,j+1)&&free(i+1,j+1)){w=2;d=2;}else if(k<.18&&free(i+1,j)&&free(i+2,j))w=3;else if(k<.24&&free(i,j+1)&&free(i,j+2))d=3;else if(k<.33&&free(i+1,j))w=2;else if(k<.45&&j+1<N&&!isW(i,j+1)&&!used.has(key(i,j+1)))d=2;
 for(let a=0;a<w;a++)for(let b=0;b<d;b++)used.add(key(i+a,j+b));blocks.push({i,j,w,d});}
// Grund = Wasser; Land-Zellen = Asphalt (abgerundete Ecken zum Wasser), darunter gelbgrüne Uferkante
const roadM=new THREE.MeshLambertMaterial({map:roadTex});const lineM=colMat('#F4F1EA'),dashM=colMat('#d8dbe0');
const waterM=colMat('#236E81'),bankM=colMat('#A9CC55'),curbM=colMat('#F4F1EA'),grassM=colMat('#BFD271'),asphM=colMat('#4A4D52');
const wp=new THREE.Mesh(new THREE.PlaneGeometry(N*C*1.5,N*C*1.5).rotateX(-Math.PI/2),waterM);wp.position.y=-.3;scene.add(wp);
const wN=(i,j)=>[isW(i-1,j),isW(i+1,j),isW(i,j-1),isW(i,j+1)];
for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(isW(i,j))continue;const x=O+i*C+C/2,z=O+j*C+C/2,n=wN(i,j),coast=n.some(Boolean);
 if(coast){add(rbox(C+1.6,.3,C+1.6,3.2),bankM,x,-.3,z);add(rbox(C,.32,C,2.6),asphM,x,-.3,z);}else add(new THREE.BoxGeometry(C+.02,.32,C+.02).translate(0,.16,0),asphM,x,-.3,z);}
// Straßenmarkierungen entlang jeder Straße (horizontal/vertikal), nicht über Wasser – dort flache Brücke
const bridgeM=colMat('#55585e'),railM=colMat('#f2f2f2');
for(let L=0;L<=N;L++){const c=O+L*C;
 for(let s=0;s<N;s++){const a=O+s*C,m=a+C/2;
  for(const hor of[true,false]){
   const i=hor?s:L-1,j=hor?L-1:s,i2=hor?s:L,j2=hor?L:s;// Zellen beidseits der Straße
   const wBoth=isW(i,j)||isW(i2,j2);if(wBoth)continue; // Kanal läuft durch -> keine Straße
   const overW=isW(i,j)||isW(i2,j2);
   const P=(along,acr,len,wid,h,m)=>hor?add(new THREE.BoxGeometry(len,h,wid),m,along,h/2,acr):add(new THREE.BoxGeometry(wid,h,len),m,acr,h/2,along);
   if(wBoth){P(m,c,C,RW,.3,bridgeM);P(m,c-RW/2,C,.18,.5,railM);P(m,c+RW/2,C,.18,.5,railM);}
   P(m,c-RW/2+.35,C-RW,.1,.035,lineM);P(m,c+RW/2-.35,C-RW,.1,.035,lineM);
   for(let t=-C/2+RW/2+.6;t<C/2-RW/2-.4;t+=1.3)P(a+C/2+t+.35,c,.7,.09,.04,dashM);
  }}}
// ---------- Gebäude nach Yukis Vorlagen (grafik/stilmuster/haeuser/spec.md, Palette palette-blatt.svg) ----------
// 1 Feld = U Welteinheiten, Stockwerk = 0,20 Felder. Kleinhaus 0,8×0,8 Felder (aktualisierte Spec / größere Darstellung im Blatt).
const U=2.6,FH=.2*U,Y0=.3;
const PAL={dach:['#7A5A48','#9C4A3C','#B0573F','#7A5A48','#3E4E6A','#75675E','#8E6A52','#9C4A3C'],fass:['#F7F3E9','#F2EFE6','#EFE4CC','#E8DCC4','#F5EBDD'],ziegel:'#A85E48',buero:'#DCE3EA',navy:'#2F3F66',kauf:'#F2E9DC',
 fHaus:'#6E8BAA',fBlock:'#5C7FA6',glas:'#7FA3C4',licht:'#F2E3A8',laden:'#7FB3C8',balkon:'#F7F5EF',tuer:'#5A4636',technik:'#9A9DA2',rot:'#E94F4F',blau:'#3D7BD9',gruen:'#5DBB73',gelb:'#FFC93C',halle:'#5F6B5A'};
const texC={};const facTex=(wall,win,cols=1,big=false)=>{const k=wall+win+cols+big;return texC[k]||(texC[k]=canvasTex(64,64,(g,w,h)=>{g.fillStyle=wall;g.fillRect(0,0,w,h);g.fillStyle=win;
 if(big){g.fillRect(6,10,52,40);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(31,10,2,40);}else for(let c=0;c<cols;c++){const cw=w/cols;g.fillRect(c*cw+cw*.25,18,cw*.5,28);}}));};
const fM={};const facM=(wall,win,cols,big)=>{const k=wall+win+cols+big;return fM[k]||(fM[k]=new THREE.MeshLambertMaterial({map:facTex(wall,win,cols,big)}));};
const hM=c=>facM(c,PAL.fHaus,1);
function house(x,z,ry,fl=1+(rnd()*2.2|0),ziegel=false){const sc=.52+rnd()*.17,w=sc*U,d=(sc-.04+rnd()*.06)*U,h=fl*FH*1.25;
 const wall=ziegel?PAL.ziegel:pick(PAL.fass);add(tbox(w,h,d,w/2,h/fl),hM(wall),x,Y0,z,ry);
 const roof=fl===3?'#3E4E6A':pick(PAL.dach);
 if(rnd()<.15){add(tbox(w+.08,.12,d+.08),colMat('#C9C6BD'),x,Y0+h,z,ry);if(rnd()<.4)add(new THREE.BoxGeometry(w*.55,.06,d*.45),colMat('#3E5F8F'),x,Y0+h+.16,z,ry);}
 else add(gable(w,.35*U*.9,d),colMat(roof),x,Y0+h,z,ry);
 if(rnd()<.25){const fx=x+Math.sin(ry)*(d/2+.32),fz=z+Math.cos(ry)*(d/2+.32);add(new THREE.BoxGeometry(w*.9,.05,.4),colMat('#9BC25A'),fx,Y0,fz,ry);add(new THREE.BoxGeometry(w*.95,.22,.05),colMat('#F7F5EF'),x+Math.sin(ry)*(d/2+.52),Y0,z+Math.cos(ry)*(d/2+.52),ry);}
 add(new THREE.BoxGeometry(.32,.55,.05),colMat(PAL.tuer),x+Math.sin(ry)*(d/2+.02),Y0+.27,z+Math.cos(ry)*(d/2+.02),ry);}
function wohnblock(x,z,fl=pick([3,4,6])){const w=1.15*U,d=.98*U,h=fl*FH*1.25,wall=pick(['#F2EFE6','#DBD8CA','#E8DCC4','#C1BBAA',PAL.ziegel]);
 // nach Yukis wohnblock-4.svg: Fensterraster rundum, Ladenfront + Balkonbänder nur vorne
 add(tbox(w,h,d,w/3,FH*1.25),facM(wall,PAL.fBlock,2),x,Y0,z);
 add(new THREE.BoxGeometry(w*.92,FH*1.1,.06),colMat(PAL.laden),x,Y0+FH*.6,z+d/2+.03);
 for(let f=2;f<fl;f++)add(new THREE.BoxGeometry(w*.9,.07,.22),colMat(PAL.balkon),x,Y0+f*FH*1.25,z+d/2+.11);
 {const sc=pick([PAL.rot,PAL.blau,PAL.gruen,PAL.gelb]);add(new THREE.BoxGeometry(w*.7,.42,.08),colMat(sc),x,Y0+FH*1.25+.02,z+d/2+.08);add(new THREE.BoxGeometry(w*.5,.08,.09),colMat('#FFFFFF'),x,Y0+FH*1.25+.19,z+d/2+.09);add(new THREE.BoxGeometry(.08,.5,d*.6),colMat(sc),x+w/2+.08,Y0+FH*2.5+.3,z);add(new THREE.BoxGeometry(.09,.1,d*.45),colMat('#FFFFFF'),x+w/2+.09,Y0+FH*2.5+.5,z);}
 add(tbox(w+.1,.2,d+.1),colMat(wall==PAL.ziegel?'#B87058':'#E6E3DA'),x,Y0+h,z);
 {const sc=pick([PAL.rot,PAL.blau,PAL.gruen,PAL.gelb]);add(new THREE.BoxGeometry(w*.6,.5,.1).translate(0,.25,0),colMat(sc),x,Y0+h+.2,z+d/2-.15);add(new THREE.BoxGeometry(w*.42,.1,.11),colMat('#FFFFFF'),x,Y0+h+.47,z+d/2-.15);}// Dachschild vorne, immer sichtbaradd(tbox(w-.3,.08,d-.3),colMat('#C9C3B5'),x,Y0+h+.05,z);
 if(rnd()<.6)for(const t of[-1,1])add(new THREE.BoxGeometry(.38,.3,.38).translate(0,.15,0),colMat(PAL.technik),x+t*w*.2,Y0+h+.1,z-d*.1);}
function buero(x,z){const fl=5+(rnd()*3|0),w=1.35*U,d=1.15*U,h=fl*FH*1.25;add(tbox(w,h,d,w/3,FH*1.25),facM(PAL.buero,PAL.glas,3),x,Y0,z);
 add(tbox(w+.12,.22,d+.12),colMat('#F3F5F7'),x,Y0+h,z);add(tbox(w-.3,.06,d-.3),colMat('#C5CCD4'),x,Y0+h+.08,z);add(tbox(.7,.4,.6),colMat(PAL.technik),x,Y0+h+.1,z);}
function hotel(x,z){const fl=9,w=.9*U,d=.8*U,h=fl*FH*1.25;add(tbox(w,h,d,w/2,FH*1.25),facM(PAL.navy,PAL.licht,2),x,Y0,z);add(tbox(w+.1,.2,d+.1),colMat('#3A4A72'),x,Y0+h,z);add(tbox(w*.7,.25,d*.7),colMat('#CFC7B5'),x,Y0+h+.2,z);
 add(new THREE.BoxGeometry(w*.45,.5,.05),colMat(PAL.rot),x-w*.15,Y0+h-.6,z+d/2+.03);}
function kaufhaus(cx,cz){const w=2.2*U,d=1.5*U,h=3*FH*1.25;add(tbox(w,h,d,w/8,FH*1.25),facM(PAL.kauf,'#9FB8CF',1),cx,Y0,cz);
 add(new THREE.BoxGeometry(w+.04,.3,.04),colMat(PAL.rot),cx,Y0+h-.35,cz+d/2+.02);add(new THREE.BoxGeometry(.04,.3,d+.04),colMat(PAL.blau),cx+w/2+.02,Y0+h-.35,cz);
 add(new THREE.BoxGeometry(w*.8,.5,.04),colMat(PAL.laden),cx,Y0+.3,cz+d/2+.02);add(tbox(w+.1,.12,d+.1),colMat('#FFFDF5'),cx,Y0+h,cz);add(tbox(w*.35,.4,d*.35),colMat('#CBC2B2'),cx-w*.1,Y0+h+.1,cz);}
function tankstelle(cx,cz){const w=1.6*U,d=1.1*U;add(new THREE.BoxGeometry(w,.02,d).translate(0,.01,0),colMat('#A7AAAF'),cx,Y0,cz);add(tbox(w,.18,d),colMat('#FFFFFF'),cx,Y0+.5*U,cz);add(new THREE.BoxGeometry(w+.02,.12,.04),colMat(PAL.rot),cx,Y0+.5*U+.06,cz+d/2+.01);
 for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])add(new THREE.CylinderGeometry(.07,.07,.5*U,6).translate(0,.25*U,0),colMat('#D8DADC'),cx+a*w*.38,Y0,cz+b*d*.35);
 for(const a of[-1,1])add(tbox(.25,.5,.18),colMat('#ECEFF1'),cx+a*w*.18,Y0,cz);add(tbox(.6*U,.55,.6*U,.6,.55),facM('#ECEAE4',PAL.laden,1,true),cx+w/2+.4*U,Y0,cz-d*.2);}
function ziegelhalle(cx,cz){const w=2*U,d=1.2*U,h=2*FH*1.25;add(tbox(w,h,d,.6,FH*1.25),facM(PAL.ziegel,'#F2EADA',1),cx,Y0,cz);const g=gable(d,.4*U,w);g.rotateY(Math.PI/2);add(g,colMat(PAL.halle),cx,Y0+h,cz);}
function treeAt(x,z,c){add(new THREE.SphereGeometry(.42,6,4).translate(0,.7,0),colMat(c||pick(['#5DA048','#6FAE52','#C98A3E','#E8A6B8'])),x,Y0,z);add(new THREE.CylinderGeometry(.06,.06,.4,4).translate(0,.2,0),colMat('#6B5040'),x,Y0,z);}
const gTex={};const vband=(a,b)=>gTex[a+b]||(gTex[a+b]=canvasTex(64,32,(g,w,h)=>{g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle=b;for(let x=4;x<w;x+=16)g.fillRect(x,0,9,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,h-3,w,3);}));
const glassM=[];const gM=k=>glassM[k]||(glassM[k]=new THREE.MeshLambertMaterial({map:[vband('#DCE3EA','#7FA3C4'),vband('#E6EBF0','#9CB4CC'),vband('#D3DBE4','#6A7F99')][k]}));
function cylUV(g,rr){const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*rr/1.2,p.getY(i)/FH/1.25);return g;}
// Turm: ~3 Felder hoch (wie Tocho in der Spec), schlank, rund oder abgerundet
function tower(x,z,h=(3.3+rnd()*.4)*U,round=false){const k=rnd()*3|0;add(rbox(1.6*U,.5,1.6*U,.6),colMat('#E8E4DA'),x,Y0,z);
 if(round){const rr=.55*U;add(cylUV(new THREE.CylinderGeometry(rr,rr,h,20).translate(0,h/2,0),rr),gM(k),x,Y0,z);for(let y=FH*5;y<h;y+=FH*5)add(new THREE.CylinderGeometry(rr+.04,rr+.04,.1,20).translate(0,y,0),colMat('#F2F4F6'),x,Y0,z);add(new THREE.CylinderGeometry(rr*.8,rr,.4,20).translate(0,h+.2,0),colMat('#F0F2F4'),x,Y0,z);}
 else{const w=1.1*U,g=rbox(w,h,w,.3);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+p.getZ(i))/1.2,p.getY(i)/FH/1.25);add(g,gM(k),x,Y0,z);for(let y=FH*5;y<h;y+=FH*5)add(rbox(w+.08,.1,w+.08,.32),colMat('#F2F4F6'),x,Y0+y,z);add(rbox(w-.2,.4,w-.2),colMat('#F0F2F4'),x,Y0+h,z);// Dachkrone: Glasband, zwei Rücksprünge, Mast
  add(tbox(w-.5,.9,w-.5,1.2,FH*1.25),gM(k),x,Y0+h+.4,z);add(rbox(w-.4,.12,w-.4),colMat('#FFFFFF'),x,Y0+h+1.3,z);add(tbox(w*.4,.6,w*.4),colMat('#D5DCE3'),x,Y0+h+1.42,z);add(new THREE.CylinderGeometry(.04,.06,1.6,6).translate(0,.8,0),colMat('#E8ECEF'),x+w*.1,Y0+h+2,z-w*.1);}}
const mall=(cx,cz)=>kaufhaus(cx,cz),gas=(cx,cz)=>tankstelle(cx,cz),station=(cx,cz)=>ziegelhalle(cx,cz);
const pins=[];const ctr=b=>[O+b.i*C+b.w*C/2,O+b.j*C+b.d*C/2];
const scr=(b,X,Y)=>{const v=new THREE.Vector3(...[ctr(b)[0],0,ctr(b)[1]]).project(cam);return Math.hypot(v.x-X,(v.y-Y)*.5);};
const near=(X,Y,f=()=>true)=>blocks.filter(b=>!special.has(b)).filter(f).sort((a,b)=>scr(a,X,Y)-scr(b,X,Y))[0];
const near_=(x,z,f=()=>true)=>blocks.filter(f).sort((a,b)=>Math.hypot(ctr(a)[0]-x,ctr(a)[1]-z)-Math.hypot(ctr(b)[0]-x,ctr(b)[1]-z))[0];
const special=new Map();const big=b=>b.w*b.d===2;
special.set(near(-.35,-.55,b=>b.w*b.d===1),'skytree');special.set(near(.5,.3,big),'twin');special.set(near(.45,-.1,big),'mall');special.set(near(-.45,.55,big),'station');special.set(near(-.35,-.6,b=>b.w*b.d===1),'gas');
for(const b of blocks){const anyW=(f)=>{for(let t=0;t<f.n;t++)if(isW(...f.c(t)))return true;return false;};
 const wl=anyW({n:b.d,c:t=>[b.i-1,b.j+t]}),wr=anyW({n:b.d,c:t=>[b.i+b.w,b.j+t]}),wt=anyW({n:b.w,c:t=>[b.i+t,b.j-1]}),wb=anyW({n:b.w,c:t=>[b.i+t,b.j+b.d]});
 const X0=O+b.i*C+(wl?.6:RW/2),X1=O+(b.i+b.w)*C-(wr?.6:RW/2),Z0=O+b.j*C+(wt?.6:RW/2),Z1=O+(b.j+b.d)*C-(wb?.6:RW/2);
 const x0=X0,z0=Z0,w=X1-X0,d=Z1-Z0,cx=x0+w/2,cz=z0+d/2;
 add(rbox(w,.22,d,1.4),curbM,cx,0,cz);add(rbox(w-.35,.3,d-.35,1.25),grassM,cx,0,cz);
 const k=rnd(),dist=Math.hypot(cx,cz),sp=special.get(b);b.cx=cx;b.cz=cz;
 if(sp==='skytree'){window.__sky=[cx,cz];for(let t=0;t<6;t++)add(new THREE.SphereGeometry(.6,6,4).translate(0,.9,0),colMat(pick(['#6aa04a','#c4823a','#e8a0b4'])),x0+.7+(t%3)*2.2,.3,z0+(t<3?.8:d-.8));}
 else if(sp==='twin'){const v=b.w===2;tower(cx-(v?2.4:0),cz-(v?0:2.4),3.8*U,false);tower(cx+(v?2.4:0),cz+(v?0:2.4),3.5*U,false);for(const t of[-1,1])house(cx+(v?t*w/2.6:w/2-1.2),cz+(v?d/2-1.2:t*d/2.6),0);}
 else if(sp==='mall'||sp==='station'||sp==='gas'){const bw=sp==='mall'?2.2*U:sp==='gas'?2.3*U:2*U,bd=sp==='mall'?1.5*U:sp==='gas'?1.1*U:1.2*U;const bx=x0+bw/2+.2,bz=z0+bd/2+.2;
  (sp==='mall'?mall:sp==='gas'?gas:station)(sp==='gas'?bx-.4*U:bx,bz);
  const st=.82*U;for(let x=x0+st/2;x<x0+w;x+=st)for(let z=z0+st/2;z<z0+d;z+=st){if(x-st/2<x0+bw+.5&&z-st/2<z0+bd+.4)continue;house(x,z,rnd()<.5?0:Math.PI/2);}}
 else{// gemischter Block: Slots im Raster ~1,1 Felder, jeder Block anders
  const IN=.45,x0i=x0+IN,z0i=z0+IN,wi=w-2*IN,di=d-2*IN;const nx=Math.max(3,Math.round(wi/(.82*U))),nz=Math.max(3,Math.round(di/(.82*U))),sx=wi/nx,sz=di/nz;const mix=rnd();
  const inFrame=(()=>{const v=new THREE.Vector3(cx,0,cz).project(cam);return Math.abs(v.x)<.8&&v.y<.55&&v.y>-.85;})();
  let bigDone=false;
  for(let a=0;a<nx;a++)for(let c=0;c<nz;c++){const x=x0i+sx*(a+.5),z=z0i+sz*(c+.5),r=rnd();
   if(!bigDone&&mix<.16&&inFrame&&(window.__tw||0)<5){bigDone=true;window.__tw=(window.__tw||0)+1;tower(x,z);continue;}
   if((!bigDone&&(r<.3||(a===nx-1&&c===nz-1)))||(bigDone===true&&r<.12)){bigDone=bigDone?2:true;(mix<.3?buero:mix<.4?hotel:wohnblock)(x,z);continue;}
   if(r<.11&&r>=.07)continue;// Lücke
   if(r<.07){treeAt(x-.4,z-.3);treeAt(x+.4,z+.3);if(rnd()<.5)treeAt(x+.4,z-.4);continue;}
   house(x,z,rnd()<.5?0:Math.PI/2,undefined,rnd()<.12);}
  if(rnd()<.5)treeAt(x0+.4,z0+.4);}
}
// Skytree (Gitter): verjüngter Schaft aus Kanten + Kern + zwei Aussichtsdecks
{const [sx,sz]=window.__sky;
 // Block freiräumen ist im Sammler nicht möglich -> Skytree auf eigenem Platz daneben: Gras-Plaza
 // dunkles, kräftiges Gitter: 3 Beine (Dreieck), Ringe + Diagonalen aus Stäben, Aussichtsdecks, Antenne. 1,8× der Spec-Höhe
 const g=new THREE.Group(),Ht=10*U*1.8*.8,dark=colMat('#CDD2D8'),light=colMat('#F1F3F5'),lat=[];
 const rad=y=>{const t=y/Ht;return 3.0*(1-t)**2.8+.32;};
 const bar=(a,b,th)=>{const v=new THREE.Vector3().subVectors(b,a),L=v.length();const m=new THREE.BoxGeometry(th,L,th);m.translate(0,L/2,0);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.applyQuaternion(q);m.translate(a.x,a.y,a.z);lat.push(m);};
 const P=(k,y)=>{const an=k/3*Math.PI*2+Math.PI/6,r=rad(y);return new THREE.Vector3(Math.cos(an)*r,y,Math.sin(an)*r);};
 const st=Ht*.68/22;for(let n=0;n<22;n++){const y0=n*st,y1=y0+st;for(let k=0;k<3;k++){bar(P(k,y0),P(k,y1),.3);bar(P(k,y0),P(k+1,y1),.12);bar(P(k+1,y0),P(k,y1),.12);bar(P(k,y1),P(k+1,y1),.13);}}
 const m=mergeG(lat);g.add(new THREE.Mesh(m,dark));
 g.add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.7,Ht*.68,10).translate(0,Ht*.34,0),light));
 for(const[f,rr]of[[.44,1.45],[.58,1.0]])g.add(new THREE.Mesh(new THREE.CylinderGeometry(rr,rr*.92,.75,24).translate(0,Ht*f,0),colMat('#EEF1F4')),new THREE.Mesh(new THREE.CylinderGeometry(rr+.06,rr+.06,.12,24).translate(0,Ht*f+.42,0),colMat('#FFFFFF')),new THREE.Mesh(new THREE.CylinderGeometry(rr+.01,rr+.01,.3,24).translate(0,Ht*f,0),colMat('#8FA9C2')));
 g.add(new THREE.Mesh(new THREE.CylinderGeometry(.06,.3,Ht*.32,8).translate(0,Ht*.84,0),light));
 g.position.set(sx,.3,sz);scene.add(g);
 }
// Zusammenführen
function mergeG(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;for(const g of gs)n+=g.attributes.position.count;
 const p=new Float32Array(n*3),nm=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g of gs){if(!g.attributes.normal)g.computeVertexNormals();p.set(g.attributes.position.array,o*3);nm.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(p,3));m.setAttribute('normal',new THREE.BufferAttribute(nm,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));return m;}
let draws=0;for(const[m,l]of bins){scene.add(new THREE.Mesh(mergeG(l),m));draws++;}
// Pins als Sprite
const pinT=new THREE.TextureLoader().load(PINV2?'grafik/karte/pin-zu-vermieten-v2.svg':'grafik/karte/pin-zu-vermieten.svg',()=>{r.render(scene,cam);window.__ready=true;});pinT.colorSpace=THREE.SRGBColorSpace;
const pinM=new THREE.SpriteMaterial({map:pinT,depthTest:false});
{// Pins gleichmäßig übers Bild (5 untere, 3 obere Hälfte): Bildpunkt -> Bodenpunkt, nur auf Land
 const T=[[.5,-.6],[-.75,.1],[.35,.25],[-.3,.6]],ray=new THREE.Raycaster(),pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
 for(const[x,y]of T){for(const[dx,dy]of[[0,0],[.15,0],[-.15,0],[0,.1],[0,-.1],[.25,.1],[-.25,-.1]]){ray.setFromCamera(new THREE.Vector2(x+dx,y+dy),cam);ray.ray.intersectPlane(pl,hit);const i=Math.floor((hit.x-O)/C),j=Math.floor((hit.z-O)/C);if(isW(i,j)||isW(i,Math.floor((hit.z-3-O)/C)))continue;pins.push([hit.x,hit.z-3]);break;}}}
for(const[x,z]of pins){const s=new THREE.Sprite(pinM);s.center.set(.5,0);s.scale.set(...(PINV2?[3.4,4.1,1]:[4.6,5.6,1]));s.position.set(x,4,z);s.renderOrder=10;scene.add(s);}
window.__stats={blocks:blocks.length,draws,pins:pins.map(([x,z])=>{const v=new THREE.Vector3(x,4,z).project(cam);return [+v.x.toFixed(2),+v.y.toFixed(2)]})};
