// Yokohama-Wahrzeichen aus Yukis Bauvorlagen (grafik/landmarks/yokohama/bauvorlagen/bauvorlagen.json) – Franky
// Nur aktiv mit ?stadt=yokohama. Einheit Felder; x = Ost, y = Süd, z = Höhe, relativ zur NW-Ecke der Grundfläche.
// Landmark Tower: Whitebeards Endform (glatt verjüngter Schaft 1,4→1,1, Krone im oberen Fünftel mit 3 Stufen + schmalem Glasband).
import * as THREE from '../lib/three.module.min.js';
const MATS=new Map();const M=c=>{if(!MATS.has(c))MATS.set(c,new THREE.MeshLambertMaterial({color:c,flatShading:true}));return MATS.get(c);};
const GM=new Map();const MG=c=>{if(!GM.has(c)){const m=new THREE.MeshLambertMaterial({color:c,flatShading:true,emissive:new THREE.Color(c).multiplyScalar(c==='#D4A62A'?.6:.38)});m.userData.keep=1;GM.set(c,m);}return GM.get(c);};
// Leuchtende Akzente (Whitebeard 21.10.): Gold, Shachihoko, rote/goldene Turmköpfe, Umeda-Ring – eigenes Material mit Eigenleuchten, wird beim Backen nicht verschmolzen
let GLOW=null;const ACC=/gold|Shachihoko|Phönix|Leuchtband|Laternenring|Aussichtsdeck \(rot\)|Rotband|Spitzenlicht|Ring/i;
const mesh=(g,c)=>{const m=new THREE.Mesh(g,GLOW?MG(c):M(c));m.castShadow=true;m.receiveShadow=true;return m;};
function wedge(b,h,t,dir){// Prisma, Grundfläche b×t (x×z), Höhe h; dir: nord/süd/ost/west/giebel
 const x0=-b/2,x1=b/2,z0=-t/2,z1=t/2;let top;
 if(dir==='giebel'){const P=[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1],[x0,h,0],[x1,h,0]];const F=[[0,4,5],[0,5,1],[3,2,5],[3,5,4],[0,3,4],[1,5,2],[0,1,2],[0,2,3]];return tri(P,F);}
 // hohe Kante: nord = z0, süd = z1, ost = x1, west = x0
 const P=[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]];
 const hi={nord:[0,1],'süd':[3,2],sued:[3,2],ost:[1,2],west:[0,3]}[dir]||[0,1];
 const T=hi.map(i=>[P[i][0],h,P[i][2]]);P.push(...T);// 4,5
 let F;if(hi[0]===0&&hi[1]===1)F=[[0,1,2],[0,2,3],[0,4,5],[0,5,1],[3,2,5],[3,5,4],[0,3,4],[1,5,2]];
 else if(hi[0]===3)F=[[0,1,2],[0,2,3],[3,5,4],[3,4,2].reverse(),[0,4,3],[1,2,5],[0,5,4].reverse(),[0,1,5]];
 else if(hi[0]===1)F=[[0,1,2],[0,2,3],[1,4,5],[1,5,2],[0,4,1],[3,2,5],[0,3,4].reverse(),[3,5,4].reverse()];
 else F=[[0,1,2],[0,2,3],[0,4,5],[0,5,3],[0,1,4],[3,5,2],[1,2,4],[2,5,4]];
 return tri(P,F);}
function tri(P,F){const a=[];for(const f of F)for(const i of f)a.push(...P[i]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();
 // doppelseitig sicher: Material ist einseitig, daher Rückseiten ergänzen
 const b=[];for(const f of F){const r=[f[0],f[2],f[1]];for(const i of r)b.push(...P[i]);}const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b],3));g2.computeVertexNormals();return g2;}
// Landmark Tower – Whitebeard 21.10. 13:38: schlank 1,4→1,1, deutlich höchstes Gebäude (≈1,5× normale Türme ≈ 7 Felder), Sockel = Turmfuß + schmaler Rand, Krone im oberen Fünftel (3 Stufen + Glasband), Fensterbänder
const LT_H=7.0,LT_S0=.3,LT_C=LT_H*.8;
const LT_OVERRIDE=[
 {form:'quader',x:.6,y:.6,z:0,b:1.8,t:1.8,h:LT_S0,farbe:'#A85E48'},
 {form:'quaderstumpf',cx:1.5,cy:1.5,z:LT_S0,b:1.4,t:1.4,b_oben:1.1,t_oben:1.1,h:LT_C-LT_S0,farbe:'#DBD8CA'},
 ...Array.from({length:15},(_,k)=>{const z=LT_S0+.35*(k+1);return {form:'band',cx:1.5,cy:1.5,z,h:.04,b:1.4-.3*(z-LT_S0)/(LT_C-LT_S0)+.006,farbe:'#B9B4A4'};}),
 {form:'quader',x:1.0,y:1.0,z:LT_C,b:1.0,t:1.0,h:.5,farbe:'#E8DCC4'},
 {form:'quader',x:1.03,y:1.03,z:LT_C+.5,b:.94,t:.94,h:.08,farbe:'#5C7FA6'},// schmales Glasband
 {form:'quader',x:1.075,y:1.075,z:LT_C+.58,b:.85,t:.85,h:.42,farbe:'#C1BBAA'},
 {form:'quader',x:1.15,y:1.15,z:LT_C+1.0,b:.7,t:.7,h:LT_H-LT_C-1.0,farbe:'#E8DCC4'}];
export const LT_HEIGHT=LT_H;
// Queen's Square – deutlich gestaffelt (A 2,9 / B 2,1 / C 1,4 über Sockel), helles Glas #7FB3C8 mit Rahmen-/Fensterbändern
const QS_OVERRIDE=(()=>{const T=[{form:'quader',x:.1,y:.1,z:0,b:2.8,t:2.8,h:.05,farbe:'#E8DCC4'}];// Whitebeard: kein dunkler Sockel, helles Pflaster
 [[.2,.4,2.9],[1.1,.6,2.1],[2.0,.8,1.4]].forEach(([x,y,h])=>{T.push({form:'quader',x,y,z:.35,b:.8,t:1.0,h,farbe:'#7FB3C8'});
  for(let z=.35+.22;z<.35+h-.05;z+=.22)T.push({form:'quader',x:x-.01,y:y-.01,z,b:.82,t:1.02,h:.025,farbe:'#DCE3EA'});// Geschossbänder
  for(const fx of [.27,.53])T.push({form:'quader',x:x+fx-.012,y:y+1.0,z:.35,b:.025,t:.012,h,farbe:'#DCE3EA'});// Fassadenpfosten Süd
  T.push({form:'quader',x:x+.8,y:y+.5-.012,z:.35,b:.012,t:.025,h,farbe:'#DCE3EA'});// Pfosten Ost
  T.push({form:'quader',x:x-.02,y:y-.02,z:.35+h,b:.84,t:1.04,h:.05,farbe:'#DCE3EA'});});// Dachrahmen
 return T;})();
// Chinatown-Tor (Paifang) – Whitebeard 21.10. 14:46: freistehende rote Säulen (Durchblick), gestaffelte kleine Dächer (grün/blau, Ecken hochgezogen), Gold-Schild mittig, ≈1,2 Felder hoch, über einer Straße
const CT_OVERRIDE=(()=>{const Y=1.41,T=[
 {form:'quader',x:0,y:0,z:0,b:3,t:3,h:.02,farbe:'#E8DCC4'},
 {form:'quader',x:1.05,y:0,z:0,b:.9,t:3,h:.03,farbe:'#DDD0B6'}];// Weg N–S durchs Tor, helles Pflaster (kein grauer Straßenstummel)
 const col=(x,h,w)=>{T.push({form:'quader',x:x-.04,y:Y-.04,z:0,b:w+.08,t:w+.08,h:.08,farbe:'#F2EFE6'});T.push({form:'quader',x,y:Y,z:0,b:w,t:w,h,farbe:'#E94F4F'});};
 col(.5,.78,.13);col(2.37,.78,.13);col(1.02,.95,.15);col(1.83,.95,.15);
 const roof=(x0,x1,z,d)=>{const b=x1-x0,yc=Y+.07;T.push({form:'quader',x:x0,y:yc-d/2,z,b,t:d,h:.05,farbe:'#E94F4F'});// Balken
  T.push({form:'quader',x:x0-.08,y:yc-d/2-.04,z:z+.05,b:b+.16,t:d+.08,h:.03,farbe:'#5DBB73'});// Traufe grün
  T.push({form:'keil',x:x0-.05,y:yc-d/2,z:z+.08,b:b+.1,t:d,h:.12,farbe:'#2F3F66',steigt_nach:'giebel'});
  for(const ex of [x0-.1,x1+.02])T.push({form:'quader',x:ex,y:yc-d/2-.04,z:z+.08,b:.08,t:d+.08,h:.06,farbe:'#5DBB73'});};// hochgezogene Ecken
 roof(.42,1.2,.78,.34);roof(1.7,2.48,.78,.34);roof(.95,2.05,.95,.4);roof(1.2,1.8,1.12,.3);
 T.push({form:'quader',x:1.3,y:Y+.25,z:.74,b:.4,t:.03,h:.16,farbe:'#FFC93C'});// Gold-Schild (ohne Schrift), Südseite
 T.push({form:'quader',x:.5,y:Y+.02,z:.62,b:1.99,t:.09,h:.05,farbe:'#E94F4F'});// unterer Querriegel
 return T;})();
// Cosmo Clock – Erik/Whitebeard 21.10. 14:29: ≈2,7 Felder hoch (≈40 % Landmark Tower), Rad füllt fast den ganzen Block, roter Sockel flacher
const cosmoOverride=sp=>sp.teile.map(t=>{const R=1.3,CZ=1.4;
 if(t.form==='ring')return {...t,R,cz:CZ,r:.11};
 if(t.form==='gondeln')return {...t,radius:R,groesse:.14};
 if(t.name==='Station')return {...t,x:.6,b:1.8,h:.12};
 if(/Stütze/.test(t.name||''))return {...t,x:t.name.includes('links')?.85:2.05,h:CZ};
 return t;});

// Japanische Burg (Erik/Whitebeard 23:34): hoher geböschter Ishigaki (~30 % Höhe), weiße Geschosse als klare Wandblöcke,
// dünne, nur leicht überstehende Dächer, große Chidori-Hafu (Dreiecksgiebel) und Kara-Hafu (geschwungen) – lesbar statt maßstäblich
function castleLM(o,F){const g=new THREE.Group();const add=(m,x,y,z)=>{m.position.set(x*F,y*F,z*F);g.add(m);return m;};
 const frust=(wT,wB,h,d,c)=>{const geo=new THREE.CylinderGeometry(wT*F/Math.SQRT2,wB*F/Math.SQRT2,h*F,4,1);geo.rotateY(Math.PI/4);geo.scale(1,1,d);return mesh(geo,c);};
 // Ishigaki: zwei Stufen, unten breit
 add(frust(o.w*.78,o.w,o.sockel,o.tief,o.stein),0,o.sockel/2,0);
 add(mesh(new THREE.BoxGeometry(o.w*.79*F,.02*F,o.w*.79*o.tief*F),'#9C968A'),0,o.sockel+.01,0);
 let y=o.sockel;
 for(let i=0;i<o.ebenen;i++){const top=i===o.ebenen-1,w=o.w*.7*Math.pow(1-o.verj,i),d=w*o.tief,h=o.wandH*(top?1.1:1);
  GLOW=1;add(mesh(new THREE.BoxGeometry(w*F,h*F,d*F),o.wand),0,y+h/2,0);GLOW=null;
  for(const sz of[-1,1])for(let k=-1;k<=1;k++)add(mesh(new THREE.BoxGeometry(w*.09*F,h*.32*F,.01*F),'#2C3136'),k*w*.28,y+h*.55,sz*(d/2+.005));// Fenster
  for(const sx of[-1,1])for(let k=-1;k<=1;k+=2)add(mesh(new THREE.BoxGeometry(.01*F,h*.32*F,d*.09*F),'#2C3136'),sx*(w/2+.005),y+h*.55,k*d*.25);
  y+=h;
  // Dach: dünne Traufe, wenig Überstand, oben leicht eingezogen; Ecken aufgebogen
  const ew=w+o.ueber,ed=d+o.ueber,nw=top?w*.35:w*(1-o.verj);
  add(frust(w*.98,ew,o.dachH,ed/ew,o.dachF),0,y+o.dachH/2,0);
  if(top){add(frust(w*.25,w*.9,o.dachH*2.2,ed/ew,o.dachF),0,y+o.dachH+o.dachH*1.1,0);}
  for(const sx of[-1,1])for(const sz of[-1,1]){const k=mesh(new THREE.BoxGeometry(.09*F,.07*F,.09*F),o.dachF);add(k,sx*ew/2,y+o.dachH*.9,sz*ed/2);if(o.gold){GLOW=1;add(mesh(new THREE.BoxGeometry(.05*F,.05*F,.05*F),'#FFC93C'),sx*ew/2,y+o.dachH*1.5,sz*ed/2);GLOW=null;}}
  if(o.gold){GLOW=1;for(const sz of[-1,1])add(mesh(new THREE.BoxGeometry(ew*.9*F,.03*F,.015*F),'#FFC93C'),0,y+.005,sz*(ed/2+.005));for(const sx of[-1,1])add(mesh(new THREE.BoxGeometry(.015*F,.03*F,ed*.9*F),'#FFC93C'),sx*(ew/2+.005),y+.005,0);GLOW=null;}
  // Giebel: große Chidori-Hafu vorn+hinten (Ebene 0,2) bzw. seitlich (Ebene 1,3); Kara-Hafu vorn auf Ebene 0
  if(!top){const gw=w*.62,gh=o.wandH*1.35,side=i%2===1;
   for(const s of[-1,1]){const gb=mesh(wedge(.22*F,gh*F,gw*F,'giebel'),o.dachF);const gf=mesh(wedge(.02*F,gh*.75*F,gw*.78*F,'giebel'),o.wand);
    if(side){add(gb,s*(w/2+.02),y,0);add(gf,s*(w/2+.13),y+.01,0);}else{gb.rotation.y=Math.PI/2;gf.rotation.y=Math.PI/2;add(gb,0,y,s*(d/2+.02));add(gf,0,y+.01,s*(d/2+.13));}
    if(o.gold){GLOW=1;const gt=mesh(new THREE.BoxGeometry(.05*F,.05*F,.05*F),'#FFC93C');side?add(gt,s*(w/2+.06),y+gh,0):add(gt,0,y+gh,s*(d/2+.06));GLOW=null;}}
   if(i===0){const r=w*.26,k=new THREE.CylinderGeometry(r*F,r*F,.2*F,16,1,false,0,Math.PI);k.rotateZ(Math.PI/2);k.rotateY(Math.PI/2);k.scale(1,.7,1);
    for(const s of[-1,1]){const km=mesh(k.clone(),o.dachF);add(km,0,y+o.dachH,s*(d/2+o.ueber/2+.04));add(mesh(new THREE.BoxGeometry(r*1.6*F,r*.6*F,.02*F),o.wand),0,y+o.dachH-r*.25,s*(d/2+o.ueber/2+.1));}}}
  y+=o.dachH;}
 // First + Shachihoko
 const tw=o.w*.7*Math.pow(1-o.verj,o.ebenen-1)*.5,yt=y+o.dachH*2.2;add(mesh(new THREE.BoxGeometry(tw*F,.05*F,.06*F),o.dachF),0,yt-.03,0);
 GLOW=1;for(const sx of[-1,1]){const sh=o.shachi;const body=mesh(new THREE.ConeGeometry(sh*.32*F,sh*F,6),'#FFC93C');body.rotation.z=sx*.3;add(body,sx*tw/2,yt+sh*.45,0);const tail=mesh(new THREE.ConeGeometry(sh*.22*F,sh*.5*F,5),'#FFC93C');tail.rotation.z=-sx*.9;add(tail,sx*(tw/2-sh*.25),yt+sh*.95,0);}GLOW=null;
 return g;}
const CASTLE={'osaka-castle':{w:3,tief:1,sockel:.55,ebenen:5,wandH:.24,dachH:.07,verj:.13,ueber:.1,wand:'#F7F5EF',dachF:'#2F6E58',stein:'#9A958C',gold:true,shachi:.12},
 'nagoya-castle':{w:3.3,tief:.85,sockel:.5,ebenen:5,wandH:.25,dachH:.07,verj:.09,ueber:.11,wand:'#F7F5EF',dachF:'#3F8A74',stein:'#A39E92',gold:false,shachi:.3}};
// Umeda Sky (Whitebeard 23:14): Floating Garden als Brücke oben zwischen beiden Türmen, mit kreisrunder Öffnung (Ring) in der Brücke
function umedaLM(spec,F){const g=new THREE.Group(),X=x=>(x-1.5)*F,Z=y=>(y-1)*F,b=(x,y,z,w,t,h,c)=>{const m=mesh(new THREE.BoxGeometry(w*F,h*F,t*F),c);m.position.set(X(x+w/2),(z+h/2)*F,Z(y+t/2));g.add(m);};
 b(0,0,0,3,2,.03,'#E8DCC4');b(.3,.5,0,.8,1,1.95,'#7FB3C8');b(1.9,.5,0,.8,1,1.95,'#7FB3C8');b(.3,1.48,1.0,2.4,.04,.06,'#DCE3EA');b(1.1,.9,1.05,.8,.2,.06,'#DCE3EA');
 // Brücke oben: Deck + Dach über die ganze Breite, dazwischen Rahmen um die runde Öffnung
 GLOW=1;b(.3,.5,2.02,2.4,1,.1,'#F7F5EF');b(1.1,.5,1.55,.8,1,.06,'#F7F5EF');GLOW=null;
 for(const sx of[1.1,1.84])b(sx,.5,1.55,.06,1,.5,'#F7F5EF');
 GLOW=1;const ring=mesh(new THREE.TorusGeometry(.24*F,.045*F,8,32),'#FFC93C');ring.position.set(X(1.5),1.81*F,Z(1.52));g.add(ring);GLOW=null;
 const back=mesh(new THREE.CircleGeometry(.22*F,24),'#2E4F66');back.position.set(X(1.5),1.81*F,Z(1.49));g.add(back);
 return g;}
export function buildYokohamaLM(spec,F){
 if(spec.neu&&CASTLE[spec.id])return castleLM(CASTLE[spec.id],F);
 if(spec.neu&&spec.id==='umeda-sky')return umedaLM(spec,F);
 if(spec.neu&&spec.id==='kinkakuji')spec={...spec,teile:spec.teile.map(t=>/EG/.test(t.name)&&!/Dach/.test(t.name)?{...t,farbe:'#D4A62A',name:t.name+' gold'}:t)};// ganz gold (Whitebeard)
 const g=new THREE.Group(),[W,D]=spec.grundflaeche,X=x=>(x-W/2)*F,Z=y=>(y-D/2)*F;
 const teile={'landmark-tower':LT_OVERRIDE,'queens-square':QS_OVERRIDE,'chukagai-tor':CT_OVERRIDE,'cosmo-clock':spec.id==='cosmo-clock'?cosmoOverride(spec):null}[spec.id]||spec.teile;
 const schaft=teile.find(t=>t.name&&/Schaft/.test(t.name)&&t.form==='kegelstumpf');
 let ring=null;
 const NEU=['osaka','kyoto','nagoya'].includes(spec.stadt_id||'')||!!spec.neu;
 for(let t of teile){const c=t.farbe||'#DBD8CA';GLOW=NEU&&(ACC.test(t.name||'')||(/castle/.test(spec.id)&&/Geschoss/.test(t.name||'')))&&!/Dach/.test(t.name||'')?1:null;
  if(NEU&&spec.id==='nagoya-castle'&&/Shachihoko/.test(t.name||'')&&t.form==='quader'){t={...t,b:t.b*1.6,t:t.t*1.6,h:t.h*1.6,x:t.x-t.b*.3,y:t.y-t.t*.3};}// Shachihoko gut sichtbar (Whitebeard)
  if(NEU&&spec.id==='umeda-sky'&&t.form==='ring')t={...t,cz:2.13,R:.42,r:.05,achse:'y'};// Ring oben auf dem Floating Garden, leuchtend
  if(t.form==='quader'){if(!(t.h>0))continue;const m=mesh(new THREE.BoxGeometry(t.b*F,t.h*F,t.t*F),c);m.position.set(X(t.x+t.b/2),(t.z+t.h/2)*F,Z(t.y+t.t/2));g.add(m);}
  else if(t.form==='quaderstumpf'){const geo=new THREE.CylinderGeometry(t.b_oben*F/Math.SQRT2,t.b*F/Math.SQRT2,t.h*F,4,1);geo.rotateY(Math.PI/4);if(NEU&&t.t&&t.t<t.b)geo.scale(1,1,t.t/t.b);if(NEU&&/castle|kinkakuji/.test(spec.id)&&/Dach/.test(t.name||''))geo.scale(.84,.8,.84);/* Dach rechteckig nach Vorlage (b×t), sonst deckt es die Wände zu */const m=mesh(geo,c);m.position.set(X(t.cx),(t.z+t.h/2)*F,Z(t.cy));g.add(m);}
  else if(t.form==='band'){const m=mesh(new THREE.BoxGeometry(t.b*F,t.h*F,t.b*F),c);m.position.set(X(t.cx),(t.z+t.h/2)*F,Z(t.cy));g.add(m);}
  else if(t.form==='keil'){if(!(t.h>0))continue;const m=mesh(wedge(t.b*F,t.h*F,t.t*F,t.steigt_nach),c);m.position.set(X(t.x+t.b/2),t.z*F,Z(t.y+t.t/2));g.add(m);}
  else if(t.form==='zylinder'||t.form==='kegelstumpf'){const seg=t.segmente||8,geo=new THREE.CylinderGeometry((t.r_oben??t.r)*F,t.r*F,t.h*F,seg,1);if(seg===4)geo.rotateY(Math.PI/4);if(spec.id==='chukagai-tor'&&/Dach/.test(t.name||''))geo.scale(1,1,.26);// Tor-Dach schmal (Vorlage: 2,5 tief – wirkt wie Halle; Yuki fragen)
   const m=mesh(geo,c);
   if(/Nabe|Uhr/.test(t.name||'')&&ring){geo.rotateX(Math.PI/2);m.position.set(X(ring.cx),ring.cz*F,Z(ring.cy)+.15*F);}else m.position.set(X(t.cx),(t.z+t.h/2)*F,Z(t.cy));g.add(m);}
  else if(t.form==='ring'){ring=t;const m=mesh(new THREE.TorusGeometry(t.R*F,(spec.id==='umeda-sky'?t.r*2.2:t.r)*F,spec.id==='umeda-sky'?8:4,Math.max(24,t.segmente||16)),c);if(NEU&&t.achse==='y')m.geometry.rotateX(Math.PI/2);m.position.set(X(t.cx),t.cz*F,Z(t.cy));g.add(m);
   if(spec.id!=='umeda-sky')for(let k=0;k<16;k++){const sw=spec.id==='cosmo-clock'?.05:.02,s=mesh(new THREE.BoxGeometry(sw*F,t.R*F,sw*F),'#DCE3EA');s.geometry.translate(0,t.R*F/2,0);s.rotation.z=k/16*Math.PI*2;s.position.copy(m.position);g.add(s);}}
  else if(t.form==='gondeln'&&ring){for(let k=0;k<t.anzahl;k++){const a=k/t.anzahl*Math.PI*2,m=mesh(new THREE.BoxGeometry(t.groesse*F,t.groesse*F,t.groesse*F),t.farben[k%t.farben.length]);m.position.set(X(ring.cx)+Math.cos(a)*t.radius*F,ring.cz*F+Math.sin(a)*t.radius*F-t.groesse*F*.6,Z(ring.cy));g.add(m);}}
  else if(t.form==='baeume'){for(const[px,py]of t.positionen){const s=mesh(new THREE.BoxGeometry(.06*F,t.stamm_h*F,.06*F),'#7A5A48');s.position.set(X(px),t.stamm_h*F/2,Z(py));g.add(s);const k=mesh(new THREE.CylinderGeometry(0,t.krone_r*F,t.krone_h*F,8),c);k.position.set(X(px),(t.stamm_h+t.krone_h/2)*F,Z(py));g.add(k);}}
  else if(t.form==='streifen'&&schaft){for(const z of t.hoehen){const r=schaft.r+(schaft.r_oben-schaft.r)*(z-schaft.z)/schaft.h+.012;const m=mesh(new THREE.CylinderGeometry(r*F,(r+.004)*F,t.dicke*F,schaft.segmente||10,1),c);m.position.set(X(schaft.cx),z*F,Z(schaft.cy));g.add(m);}}
 }
 GLOW=null;return g;}
// Bay Bridge: Schrägseilbrücke mit 2 Pylonen – Pylone + Seilfächer in lokalen Brückenkoordinaten (x längs, z quer), Fahrbahn bleibt die befahrbare Spielbrücke
export function bayBridgeParts(spec,F,len,deckH){
 const g=new THREE.Group(),L=spec.grundflaeche[0],D=spec.grundflaeche[1],k=len/(L*F);
 const fx=x=>(x-L/2)*F*k,fz=y=>(y-D/2)*F;
 const pyl=spec.teile.filter(t=>/Pylon/.test(t.name||''));for(const t of pyl){const m=mesh(new THREE.BoxGeometry(t.b*F,t.h*F,t.t*F),t.farbe);m.position.set(fx(t.x+t.b/2),(t.z+t.h/2)*F,fz(t.y+t.t/2));g.add(m);}
 const sf=spec.teile.find(t=>t.form==='seilfaecher'),lat=pyl.filter(t=>/links|rechts/.test(t.name)).map(t=>fz(t.y+t.t/2));const top=Math.max(...pyl.map(t=>(t.z+t.h)*F))-.25*F;
 if(sf)for(const px of sf.an_pylonen)for(const z of [...new Set(lat.map(v=>+v.toFixed(3)))])for(const sgn of[-1,1])for(let i=1;i<=sf.je_seite;i++){
  const a=new THREE.Vector3(fx(px),top-(i-1)*.05*F,z),b=new THREE.Vector3(fx(px)+sgn*i/sf.je_seite*sf.spannweite*F*k,deckH+.2,z);const l=a.distanceTo(b);
  const m=mesh(new THREE.BoxGeometry(sf.dicke*F*2,l,sf.dicke*F*2),sf.farbe);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());g.add(m);}
 return g;}
