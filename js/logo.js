// Logos: eigener Logo-Editor + fiktive Rivalen (alles im Code gezeichnet, keine echten Marken)
const FONT='-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans CJK JP","Noto Sans JP",system-ui,sans-serif';
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function shapePath(ctx,shape,S){
 const c=S/2;ctx.beginPath();
 switch(shape){
  case 'circle':ctx.arc(c,c,S*.48,0,Math.PI*2);break;
  case 'hexagon':for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;ctx.lineTo(c+Math.cos(a)*S*.49,c+Math.sin(a)*S*.49)}ctx.closePath();break;
  case 'shield':ctx.moveTo(S*.12,S*.1);ctx.lineTo(S*.88,S*.1);ctx.quadraticCurveTo(S*.9,S*.62,c,S*.96);ctx.quadraticCurveTo(S*.1,S*.62,S*.12,S*.1);ctx.closePath();break;
  case 'diamond':ctx.moveTo(c,S*.02);ctx.quadraticCurveTo(S*.5,S*.02,S*.98,c);ctx.quadraticCurveTo(S*.98,c,c,S*.98);ctx.quadraticCurveTo(c,S*.98,S*.02,c);ctx.quadraticCurveTo(S*.02,c,c,S*.02);ctx.closePath();break;
  case 'banner':rr(ctx,S*.02,S*.17,S*.96,S*.66,S*.2);break;
  default:rr(ctx,S*.03,S*.03,S*.94,S*.94,S*.26);
 }
}
function star(ctx,cx,cy,R,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;ctx.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}ctx.closePath();ctx.fill();}
function symbol(ctx,L,S){
 const c=S/2,k=S*.3,fg=L.fg,bg=L.bg;ctx.fillStyle=fg;ctx.strokeStyle=fg;ctx.lineCap='round';ctx.lineJoin='round';
 switch(L.symbol){
  case 'star':star(ctx,c,c*1.04,k*1.05,k*.45);break;
  case 'sakura':for(let i=0;i<5;i++){ctx.save();ctx.translate(c,c);ctx.rotate(i*Math.PI*2/5);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-k*.62,-k*.35,-k*.5,-k*1.05,-k*.12,-k*1.02);ctx.lineTo(0,-k*.86);ctx.lineTo(k*.12,-k*1.02);ctx.bezierCurveTo(k*.5,-k*1.05,k*.62,-k*.35,0,0);ctx.fill();ctx.restore();}ctx.fillStyle=bg;ctx.beginPath();ctx.arc(c,c,k*.16,0,7);ctx.fill();break;
  case 'onigiri':{ctx.beginPath();ctx.moveTo(c,c-k*.95);ctx.quadraticCurveTo(c+k*.25,c-k*1.05,c+k*.45,c-k*.6);ctx.lineTo(c+k*.98,c+k*.48);ctx.quadraticCurveTo(c+k*1.1,c+k*.85,c+k*.7,c+k*.85);ctx.lineTo(c-k*.7,c+k*.85);ctx.quadraticCurveTo(c-k*1.1,c+k*.85,c-k*.98,c+k*.48);ctx.lineTo(c-k*.45,c-k*.6);ctx.quadraticCurveTo(c-k*.25,c-k*1.05,c,c-k*.95);ctx.fill();
   ctx.fillStyle=(fg.toLowerCase()==='#1d2140')?'#ffffff':'#1d2140';if(bg.toLowerCase()==='#1d2140'&&fg.toLowerCase()==='#ffffff')ctx.fillStyle='#3a3f6b';rr(ctx,c-k*.36,c+k*.12,k*.72,k*.73,k*.08);ctx.fill();break;}
  case 'wave':ctx.lineWidth=k*.26;for(let j=0;j<3;j++){const y=c-k*.55+j*k*.55;ctx.beginPath();ctx.moveTo(c-k,y);ctx.bezierCurveTo(c-k*.5,y-k*.45,c-k*.2,y+k*.45,c+k*.1,y);ctx.bezierCurveTo(c+k*.4,y-k*.45,c+k*.7,y+k*.3,c+k,y-k*.05);ctx.stroke();}break;
  case 'moon':ctx.beginPath();ctx.arc(c,c,k*.95,0,7);ctx.fill();ctx.fillStyle=bg;ctx.beginPath();ctx.arc(c+k*.45,c-k*.3,k*.8,0,7);ctx.fill();ctx.fillStyle=fg;star(ctx,c+k*.55,c+k*.35,k*.28,k*.12);break;
  case 'leaf':ctx.beginPath();ctx.moveTo(c-k*.85,c+k*.85);ctx.bezierCurveTo(c-k*1.1,c-k*.4,c-k*.1,c-k*1.1,c+k*.95,c-k*.95);ctx.bezierCurveTo(c+k*1.05,c+k*.1,c+k*.3,c+k*1.05,c-k*.85,c+k*.85);ctx.fill();ctx.strokeStyle=bg;ctx.lineWidth=k*.12;ctx.beginPath();ctx.moveTo(c-k*.85,c+k*.85);ctx.quadraticCurveTo(c,c,c+k*.7,c-k*.7);ctx.stroke();break;
  case 'heart':ctx.beginPath();ctx.moveTo(c,c+k*.9);ctx.bezierCurveTo(c-k*1.3,c,c-k*.9,c-k*1.1,c,c-k*.45);ctx.bezierCurveTo(c+k*.9,c-k*1.1,c+k*1.3,c,c,c+k*.9);ctx.fill();break;
  case 'bolt':ctx.beginPath();[[.25,-1],[-.6,.12],[-.02,.12],[-.3,1],[.62,-.18],[.04,-.18],[.3,-1]].forEach(([x,y],i)=>i?ctx.lineTo(c+x*k,c+y*k):ctx.moveTo(c+x*k,c+y*k));ctx.closePath();ctx.fill();break;
  case 'cat':ctx.beginPath();ctx.arc(c,c+k*.15,k*.78,0,7);ctx.fill();[[-1,1],[1,1]].forEach(([sx])=>{ctx.beginPath();ctx.moveTo(c+sx*k*.72,c-k*.18);ctx.lineTo(c+sx*k*.62,c-k*.95);ctx.lineTo(c+sx*k*.12,c-k*.55);ctx.fill();});ctx.fillStyle=bg;[[-1],[1]].forEach(([sx])=>{ctx.beginPath();ctx.ellipse(c+sx*k*.3,c+k*.08,k*.1,k*.15,0,0,7);ctx.fill();});ctx.beginPath();ctx.moveTo(c-k*.08,c+k*.35);ctx.lineTo(c+k*.08,c+k*.35);ctx.lineTo(c,c+k*.45);ctx.fill();ctx.strokeStyle=bg;ctx.lineWidth=k*.06;[[-1],[1]].forEach(([sx])=>{ctx.beginPath();ctx.moveTo(c+sx*k*.25,c+k*.48);ctx.lineTo(c+sx*k*.75,c+k*.42);ctx.stroke();});break;
  case 'letter':ctx.font=`900 ${S*.56}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((L.name||'K').trim().charAt(0).toUpperCase(),c,c+S*.03);break;
  case 'kanji':ctx.font=`800 ${S*.54}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L.kanji||'星',c,c+S*.03);break;
 }
}
// Yukis Editor-Logos v2 (grafik/logos/editor-v2): als Bild gerendert; Name/Initiale per fuelleLogo() aus namensfeld.js
export const V2_LOGOS=['a1-kanji-fuku','a2-hanko-en','a3-noren-wa','a4-chochin-hikari','b1-streifen','b2-farbblock-24','b3-buchstabe','b4-ladenschild','c1-katze','c2-kitsune','c3-kranich','c4-panda','d1-monogramm','d2-linie-tasche','d3-negativ-laden','d4-wortmarke'];
export let logoVer=0;
const v2Img=new Map(),v2Pending=new Map(),v2Txt=new Map();let nfP=null;
const v2File=id=>'grafik/logos/editor-v2/logo-'+V2_LOGOS.find(f=>f.startsWith(id.slice(3)+'-'))+'.svg';
function loadNF(){return nfP||(nfP=new Promise(r=>{if(window.fuelleLogo)return r();const sc=document.createElement('script');sc.src='grafik/logos/editor-v2/namensfeld.js';sc.onload=()=>r();sc.onerror=()=>r();document.head.appendChild(sc);}));}
const v2Key=L=>[L.symbol,L.bg,L.fg,L.name].join('|');
export function ensureV2(L){if(!L||!String(L.symbol).startsWith('v2-'))return Promise.resolve();const k=v2Key(L);if(v2Img.has(k))return Promise.resolve();if(v2Pending.has(k))return v2Pending.get(k);
 const f=v2File(L.symbol);const p=Promise.all([loadNF(),v2Txt.get(f)||fetch(f).then(r=>r.text()).then(t=>(v2Txt.set(f,t),t)),document.fonts?document.fonts.ready:0]).then(([,txt])=>{
  txt=txt.replace(/var\(--ladenfarbe,[^)]*\)/g,L.bg).replace(/var\(--zweitfarbe,[^)]*\)/g,L.fg);
  const host=document.createElement('div');host.style.cssText='position:absolute;left:-9999px;top:0;width:256px;height:256px';host.innerHTML=txt;document.body.appendChild(host);const svg=host.querySelector('svg');
  try{if(window.fuelleLogo)window.fuelleLogo(svg,L.name||'');}catch(e){}
  svg.querySelectorAll('text[data-placeholder="initiale"]').forEach(t=>t.textContent=((L.name||'K').trim().charAt(0)||'K').toUpperCase());
  const out=new XMLSerializer().serializeToString(svg);host.remove();
  return new Promise(r=>{const im=new Image();im.onload=()=>{v2Img.set(k,im);logoVer++;cache.clear();window.dispatchEvent(new Event('logo-ready'));r();};im.onerror=()=>r();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(out);});});
 v2Pending.set(k,p);return p;}
export function drawPlayerLogo(ctx,L,S){
 if(String(L.symbol).startsWith('v2-')){const im=v2Img.get(v2Key(L));if(im){ctx.drawImage(im,0,0,S,S);return;}ensureV2(L);
  ctx.fillStyle=L.bg;rr(ctx,S*.05,S*.05,S*.9,S*.9,S*.18);ctx.fill();ctx.fillStyle=L.fg;ctx.font=`900 ${S*.5}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((L.name||'K').trim().charAt(0).toUpperCase(),S/2,S/2);return;}
 ctx.save();shapePath(ctx,L.shape,S);
 const g=ctx.createLinearGradient(0,0,0,S);g.addColorStop(0,shade(L.bg,.12));g.addColorStop(1,shade(L.bg,-.08));ctx.fillStyle=g;ctx.fill();
 if(L.bg.toLowerCase()==='#ffffff'){ctx.lineWidth=S*.03;ctx.strokeStyle='#d9dce6';ctx.stroke();}
 ctx.clip();
 if(L.ring){ctx.save();ctx.translate(S/2,S/2);ctx.scale(.84,.84);ctx.translate(-S/2,-S/2);shapePath(ctx,L.shape,S);ctx.lineWidth=S*.035;ctx.strokeStyle=hexA(L.fg,.4);ctx.stroke();ctx.restore();}
 if(L.shape==='shield'){ctx.translate(0,-S*.04)}
 symbol(ctx,L,S);ctx.restore();
}
function drawRival(ctx,id,S){
 ctx.save();ctx.scale(S/40,S/40);rr(ctx,0,0,40,40,10);ctx.clip();
 const T=(t,x,y,s,col,f='900')=>{ctx.fillStyle=col;ctx.font=`${f} ${s}px Arial Black,Arial,sans-serif`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(t,x,y)};
 switch(id){
  case 'eight':ctx.fillStyle='#fff';ctx.fillRect(0,0,40,40);[['#ff7a1a',28],['#12a26a',32],['#e8442e',36]].forEach(([c,y])=>{ctx.fillStyle=c;ctx.fillRect(0,y,40,4)});T('EIGHT',20,23,10,'#e8442e');break;
  case 'lawsun':ctx.fillStyle='#2d7cf6';ctx.fillRect(0,0,40,40);ctx.strokeStyle='#fff';ctx.lineWidth=2.4;ctx.lineCap='round';for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(20+Math.cos(a)*9.5,17+Math.sin(a)*9.5);ctx.lineTo(20+Math.cos(a)*13,17+Math.sin(a)*13);ctx.stroke()}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(20,17,6.5,0,7);ctx.fill();T('LAWSUN',20,37,6.5,'#fff');break;
  case 'familia':ctx.fillStyle='#fff';ctx.fillRect(0,0,40,40);ctx.fillStyle='#1fc47f';ctx.fillRect(0,0,40,11);ctx.fillStyle='#2d6cf6';ctx.fillRect(0,29,40,11);T('FAMILIA',20,24,7.5,'#1a8f5c');break;
  case 'minihalt':ctx.fillStyle='#ffcf1a';ctx.fillRect(0,0,40,40);ctx.beginPath();[[14.2,6],[25.8,6],[34,14.2],[34,25.8],[25.8,34],[14.2,34],[6,25.8],[6,14.2]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle='#e5383b';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.stroke();T('MH',20,24.5,12,'#fff');break;
 }
 ctx.restore();
}
export function shade(hex,amt){let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');const n=parseInt(c,16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.round(amt>0?v+(255-v)*amt:v*(1+amt));return '#'+[f(r),f(g),f(b)].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
function hexA(hex,a){const n=parseInt(hex.replace('#',''),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`}
export function logoCanvas(src,S=128){
 const cv=document.createElement('canvas');cv.width=cv.height=S;const ctx=cv.getContext('2d');
 if(typeof src==='string')drawRival(ctx,src,S);else drawPlayerLogo(ctx,src,S);return cv;
}
const cache=new Map();
export function logoURL(src,S=96){const k=(typeof src==='string'?src:JSON.stringify(src))+S;if(!cache.has(k)){if(cache.size>200)cache.clear();cache.set(k,logoCanvas(src,S).toDataURL());}return cache.get(k);}
export function logoImg(src,size=28,cls='logo'){return `<img class="${cls}" src="${logoURL(src,Math.min(256,size*3))}" width="${size}" height="${size}" alt="">`;}
