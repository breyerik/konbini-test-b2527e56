// Konbini Empire V4 – Yukis Bildschirme (grafik/screens/*.svg, von Erik freigegeben) als Inline-SVG
// Platzhalter (data-placeholder) werden per DOM gefüllt; foreignObject-Fließtext wird durch eigene HTML-Overlays ersetzt
// (auch für Renderer ohne foreignObject). Klickflächen sind transparente HTML-Knöpfe über den gezeichneten Knöpfen.
const NAMES=['start','spielstand-auswahl','spielstand-karte','spielstand-karte-leer','spielstand-karte-verloren','toast-gespeichert','ueberschreiben','minus-warnung-1','minus-warnung-2','minus-warnung-3','pleite'];
const RAW={};
// Japanische Schrift: Noto Sans/Serif CJK JP, sonst die Systemschrift (iOS: Hiragino) – keine CDN-Abhängigkeit
const JP_SANS='Noto Sans CJK JP, Noto Sans JP, Hiragino Sans, Hiragino Kaku Gothic ProN, Yu Gothic, sans-serif';
await Promise.all(NAMES.map(n=>fetch(new URL('../grafik/screens/'+n+'.svg',import.meta.url)).then(r=>r.ok?r.text():null).then(t=>{if(t)RAW[n]=t.replace(/font-family="Noto Sans CJK JP, sans-serif"/g,`font-family="${JP_SANS}"`);}).catch(()=>{})));
export const SCREENS_OK=NAMES.every(n=>RAW[n]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let uid=0;
export function doc(name){const d=new DOMParser().parseFromString(RAW[name],'image/svg+xml');return d.documentElement;}
export function vb(root){const v=(root.getAttribute('viewBox')||'0 0 100 100').split(/\s+/).map(Number);return {w:v[2],h:v[3]};}
export function fill(root,vals){for(const el of root.querySelectorAll('[data-placeholder]')){const k=el.getAttribute('data-placeholder');if(vals[k]==null||el.closest('foreignObject'))continue;el.textContent=String(vals[k]);}return root;}
// foreignObject entfernen, Position + Platzhalter + Stil für HTML-Overlay merken
export function takeFO(root){const out=[];for(const fo of [...root.querySelectorAll('foreignObject')]){const div=fo.firstElementChild;
 out.push({x:+fo.getAttribute('x'),y:+fo.getAttribute('y'),w:+fo.getAttribute('width'),h:+fo.getAttribute('height'),ph:div&&div.getAttribute('data-placeholder'),style:div?div.getAttribute('style')||'':''});fo.remove();}return out;}
// eindeutige IDs je Einbettung (mehrere Inline-SVGs auf einer Seite)
function uniq(root){const p='s'+(++uid)+'-';for(const el of root.querySelectorAll('[id]')){const o=el.id;el.id=p+o;for(const r of root.querySelectorAll('*'))for(const a of ['fill','stroke','href','clip-path','mask','filter']){const v=r.getAttribute(a);if(v&&v.includes('#'+o))r.setAttribute(a,v.split('url(#'+o+')').join('url(#'+p+o+')').replace(new RegExp('^#'+o+'$'),'#'+p+o));}}return root;}
export function ser(root){root.removeAttribute('width');root.removeAttribute('height');root.setAttribute('preserveAspectRatio','xMidYMid meet');root.setAttribute('aria-hidden','true');uniq(root);return new XMLSerializer().serializeToString(root);}
const pct=(v,t)=>(v/t*100).toFixed(3)+'%';
// Overlay-Text: Schriftgröße in Container-Einheiten, damit er mit dem Bild skaliert
function foText(o,box,text){const m=/font:\s*(\d+)\s+(\d+)px/.exec(o.style)||[0,600,34],al=/text-align:\s*(\w+)/.exec(o.style),col=/color:\s*([#\w]+)/.exec(o.style);
 return `<div class="scrtx" data-ph="${esc(o.ph||'')}" style="left:${pct(o.x,box.w)};top:${pct(o.y,box.h)};width:${pct(o.w,box.w)};height:${pct(o.h,box.h)};font-weight:${m[1]};font-size:${(m[2]/box.w*100).toFixed(3)}cqw;text-align:${al?al[1]:'left'};color:${col?col[1]:'#2B2D42'}">${esc(text)}</div>`;}
export function hot(b,box){return `<button class="scrhot${b.cls?' '+b.cls:''}" data-act="${b.act}"${b.v!=null?` data-v="${b.v}"`:''} aria-label="${esc(b.label||'')}"${b.disabled?' disabled aria-disabled="true"':''} style="left:${pct(b.x,box.w)};top:${pct(b.y,box.h)};width:${pct(b.w,box.w)};height:${pct(b.h,box.h)}"><span class="sr">${esc(b.label||'')}</span></button>`;}
// Ein Bildschirm: {name, vals, texts:{ph:text}, mutate(root), buttons:[...], cls}
export function screen({name,vals={},texts={},mutate,buttons=[],cls='',extra=''}){
 const root=doc(name);fill(root,vals);if(mutate)mutate(root);const box=vb(root),fos=takeFO(root);
 return `<div class="scr ${cls}" data-screen="${name}" style="aspect-ratio:${box.w}/${box.h}">${ser(root)}${fos.map(o=>foText(o,box,texts[o.ph]!=null?texts[o.ph]:'')).join('')}${buttons.map(b=>hot(b,box)).join('')}${extra}</div>`;}
// Spielstand-Karte als <svg>-Element zum Einsetzen in spielstand-auswahl (x,y im 1080er-Raster)
export function cardSvg(kind,x,y,{slot,name,datum,spielwoche,kasse,laeden,neg,verlorenText,verlorenAlt,lostText}={}){
 const root=doc(kind==='leer'?'spielstand-karte-leer':kind==='verloren'?'spielstand-karte-verloren':'spielstand-karte');
 fill(root,{datum,spielwoche,kasse,laeden});
 const first=root.querySelector('text');if(first)first.textContent='Slot '+slot+(name?' · '+name:'');
 if(kind==='leer'){const t=root.querySelectorAll('text')[1];if(t&&verlorenAlt)t.textContent=verlorenAlt;}
 if(kind==='normal'&&lostText){// verlorener Slot auf der normalen Karte: ausgegraut + Itos Text
  const r=root.querySelector('rect');if(r){r.setAttribute('fill','#E9E7E3');r.setAttribute('stroke','#9A9DAA');}
  for(const tx of root.querySelectorAll('text'))tx.setAttribute('fill','#9A9DAA');
  for(const k of ['spielwoche','kasse','laeden']){const e=root.querySelector(`[data-placeholder="${k}"]`);if(e)e.setAttribute('font-size','36');}
  for(const e of root.querySelectorAll('text'))if(+e.getAttribute('y')===186)e.setAttribute('y','176');else if(+e.getAttribute('y')===140)e.setAttribute('y','128');
  const ns='http://www.w3.org/2000/svg',l=root.ownerDocument.createElementNS(ns,'text');l.setAttribute('x','40');l.setAttribute('y','234');l.setAttribute('font-size','30');l.setAttribute('font-weight','700');l.setAttribute('fill','#2B2D42');l.setAttribute('font-family','Fredoka, Nunito, sans-serif');l.textContent=lostText;root.appendChild(l);}
 else if(kind==='normal'&&neg){const k=root.querySelector('[data-placeholder="kasse"]');if(k)k.setAttribute('fill','#E94F4F');}
 if(kind==='verloren'){const ts=[...root.querySelectorAll('text')];const strike=ts.find(t=>t.getAttribute('text-decoration'));if(strike&&verlorenAlt)strike.textContent=verlorenAlt;
  const line=ts.find(t=>/Neues Spiel/.test(t.textContent));if(line&&verlorenText){line.textContent=verlorenText;line.setAttribute('font-size','30');line.setAttribute('y','218');line.setAttribute('x','40');}
  // Stempel etwas kleiner nach rechts oben, damit Itos Zeile ganz Platz hat
  const st=[...root.querySelectorAll('g')].find(g=>/rotate/.test(g.getAttribute('transform')||''));if(st)st.setAttribute('transform','translate(800 120) rotate(-8) scale(.72)');}
 root.setAttribute('x',x);root.setAttribute('y',y);root.setAttribute('width',960);root.setAttribute('height',260);
 return root;}
