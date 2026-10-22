// Sortiment des Spielers: welche Artikel sind freigeschaltet (Start, Markenverhandlung, Messe)
import * as K from './sortiment_cfg.js';
import {GFX} from './gfx.js';
export {K};
export function ensure(st){if(!st.sortiment){st.sortiment={art:{},alle:true};// alte Spielstände ohne Sortiment: alles bleibt offen
  for(const a of K.START)st.sortiment.art[a.id]={name:a.name,cat:a.cat};}return st.sortiment;}
export function katVon(name){for(const [re,c] of K.KAT_WORT)if(re.test(name))return c;return 'alltag';}
export function artikel(f){return String(f.liefert||'').split(',').map(x=>x.trim()).filter(x=>x&&x!=='–'&&!/paket|großhandel/i.test(x)).map((n,i)=>({id:f.id+'#'+i,name:n,cat:katVon(n)}));}
export function hat(st,id){return !!ensure(st).art[id];}
export function freischalten(st,id,name,cat){const so=ensure(st);if(so.art[id])return false;so.art[id]={name,cat};return true;}
export function arts(st,cat){return Object.values(ensure(st).art).filter(a=>a.cat===cat);}
export function offen(st,cat){if(!K.ON)return true;const so=ensure(st);return so.alle||arts(st,cat).length>0;}
export function breite(st,cat){if(!K.ON)return 1;const so=ensure(st);if(so.alle||K.BREITE.voll.includes(cat))return offen(st,cat)?1:0;const n=arts(st,cat).length;return n?Math.min(1,K.BREITE.basis+K.BREITE.jeArtikel*(n-1)):0;}
// Gruppenpreis aus freigeschalteten Artikeln (Option A); null = Gruppenschnitt wie bisher
export function preis(st,k){if(!K.ON||!K.PREIS_JE_ARTIKEL||k.id==='saison')return null;const so=ensure(st);if(so.alle)return null;
 const R=GFX.prices&&GFX.prices[k.id]&&GFX.prices[k.id].rows;if(!R||!R.length)return null;const A=arts(st,k.id);if(!A.length)return null;
 const start=K.START.find(a=>a.cat===k.id);let vk=0,ek=0,n=0;
 for(const a of A){const sa=K.START.find(x=>x.name===a.name&&x.cat===a.cat);const re=sa?(sa.csv?new RegExp(sa.csv,'i'):null):new RegExp(a.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  const M=re?R.filter(r=>re.test(r.produkt)):R;const use=M.length?M:null;
  if(use){for(const r of use){vk+=r.vk/use.length;ek+=r.ek/use.length;}}else{vk+=k.price;ek+=k.price*k.cost;}n++;}
 return {price:Math.round(vk/n),cost:+(ek/vk).toFixed(3)};}
