// Mehrere Städte (Vorbereitung). Jede Stadt = eigener Plan im Format von Yukis stadtplan-v6.json
// (raster, felder, ufer, bruecken, wahrzeichen, grundstuecke) + eigenes Wahrzeichen-Set.
// Tokio bleibt Standard. Andere Städte nur per ?stadt=<id> (keine Auswahl-UI, bis Erik entscheidet).
// Neue Stadt hinzufügen: Plan-JSON unter grafik/stadtplan/ ablegen, hier eintragen, Wahrzeichen-Modelle in world.js LM_MAKE
// unter den Wahrzeichen-IDs des Plans registrieren (unbekannte IDs werden als Park-Block mit Platzhalter gezeigt).
import {NEUE_STAEDTE} from './staedte_neu.js';
export const NEUESTAEDTE=new URLSearchParams(globalThis.location?location.search:'').get('neuestaedte')!=='0';// V5 (Erik 00:06): Osaka/Kyoto/Nagoya standardmäßig an, ?neuestaedte=0 schaltet aus
export const CITIES={
 tokio:{id:'tokio',name:'Tokio',jp:'東京',emoji:'🗼',plan:v=>`stadtplan-v${v}.json`,landmarks:'tokio',districts:'tokio',start:'shinjuku-rathaus',gen:'Tokios',startviertel:'Shinjuku',hub:'tokyo-station'},
 yokohama:{id:'yokohama',name:'Yokohama',jp:'横浜',emoji:'🎡',plan:()=>`../stadtplan-yokohama/stadtplan-yokohama.json`,landmarks:'yokohama',start:'yokohama-station',hub:'yokohama-station',gen:'Yokohamas',startviertel:'Yokohama-Bahnhof',startviertelPH:true,// PH: Startviertel Yokohama – Erik/Yuki entscheiden
  districts:[// PH Franky: Stadtteile Yokohama (Anker aus Yukis Wahrzeichen-Lagen, Werte wie ähnliche Tokio-Viertel) – Bob/Erik prüfen
  {id:'yokohama-eki',name:'Yokohama-Bahnhof',jp:'横浜駅',type:'station',x:-81.2,z:-89.4,mult:1.5,rentM:1900000,night:.30,ps:.6,svc:.8,ward:'Nishi',areas:['Takashima','Kitasaiwai','Minamisaiwai']},
  {id:'minatomirai',name:'Minato Mirai',jp:'みなとみらい',type:'office',x:-8.1,z:-48.8,mult:1.35,rentM:2100000,night:.08,ps:.4,svc:1,ward:'Nishi',areas:['Minatomirai','Shinkō']},
  {id:'kannai',name:'Kannai',jp:'関内',type:'tourist',x:44.7,z:0.0,mult:1.2,rentM:1500000,night:.14,ps:.5,svc:.7,ward:'Naka',areas:['Kaigan-dōri','Nihon-ōdōri','Yamashita-chō']},
  {id:'chukagai',name:'Chūkagai',jp:'中華街',type:'tourist',x:-4.1,z:52.8,mult:1.2,rentM:1450000,night:.2,ps:.5,svc:.7,ward:'Naka',areas:['Yamashita-chō','Motomachi']},
  {id:'noge',name:'Noge',jp:'野毛',type:'nightlife',x:-56.9,z:0.0,mult:1.15,rentM:1300000,night:.45,ps:.7,svc:.7,ward:'Naka',areas:['Noge-chō','Hanasaki-chō']},
  {id:'yamate',name:'Yamate',jp:'山手',type:'residential',x:81.2,z:89.4,mult:1.0,rentM:1150000,night:.12,ps:1.2,svc:1.6,ward:'Naka',areas:['Yamate-chō','Honmoku']},
  {id:'kohoku',name:'Hodogaya',jp:'保土ケ谷',type:'residential',x:-89.4,z:65.0,mult:1.0,rentM:1100000,night:.14,ps:1.2,svc:1.6,ward:'Hodogaya',areas:['Hodogaya-chō','Iwai-chō']}]},// Plan: Yuki (Entwurf, nicht freigegeben)
};
if(NEUESTAEDTE)for(const [id,c] of Object.entries(NEUE_STAEDTE)){const p=c.planPfad;CITIES[id]={...c,plan:()=>p};}
const q=new URLSearchParams(globalThis.location?location.search:'').get('stadt');
export const CITY_ID=CITIES[q]?q:'tokio';
export const CITY=CITIES[CITY_ID];
// Lädt den Plan der Stadt; fehlt die Datei (z. B. Yokohama noch nicht geliefert), fällt es auf Tokio zurück.
export async function loadCityPlan(base,version){
 const url=c=>new URL('../grafik/stadtplan/'+c.plan(version),base);
 if(CITY_ID!=='tokio'){try{const r=await fetch(url(CITY));if(r.ok){const j=await r.json();if(validPlan(j))return {plan:j,city:CITY};}}catch(e){}
  console.info('Stadtplan für',CITY.name,'fehlt – Tokio wird geladen');}
 return {plan:await fetch(url(CITIES.tokio)).then(r=>r.json()),city:CITIES.tokio};}
// Stadt-Platzhalter in Itos Texten ({stadt}, {stadt_gen}, {startviertel}) – einmal beim Laden für die aktive Stadt
export const CITY_VARS={stadt:CITY.name,stadt_gen:CITY.gen,startviertel:CITY.startviertel};
export function fillCity(o){if(typeof o==='string')return o.replace(/\{(stadt|stadt_gen|startviertel)\}/g,(m,k)=>CITY_VARS[k]);if(Array.isArray(o))return o.map(fillCity);if(o&&typeof o==='object'){const r={};for(const k in o)r[k]=fillCity(o[k]);return r;}return o;}
export function validPlan(j){return !!(j&&j.raster&&j.raster.n&&Array.isArray(j.felder)&&j.felder.length===j.raster.n&&Array.isArray(j.grundstuecke)&&Array.isArray(j.wahrzeichen||[]));}
