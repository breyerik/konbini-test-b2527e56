// Paket 2 – Zentrale/Büro (Yuki b1–b8, Werte Bob PREISE.md 21.10.2026). Alle Spielwerte hier.
const QS=new URLSearchParams(globalThis.location?location.search:'');
export const ON=QS.get('paket2')!=='0';// Erik bestätigt: Paket 2 an, ?paket2=0 aus
export const AB_LAEDEN=5;// Erik: Büro ab 5 Läden
export const BUEROS=[
 {id:'shibuya',name:'Kleines Büro Shibuya',stadt:'Tokio',viertel:'Shibuya',m2:85,plaetze:5,miete:690000,kauf:76e6,tag:'✅ günstig für den Anfang'},
 {id:'shinjuku',name:'Etage Shinjuku West',stadt:'Tokio',viertel:'Shinjuku',m2:210,plaetze:10,miete:1320000,kauf:187e6,tag:'mehr Platz für später'},
 {id:'noge',name:'Altbau Noge',stadt:'Yokohama',viertel:'Noge',m2:120,plaetze:6,miete:490000,kauf:39e6,tag:'günstig, weiter weg'}];
export const KAUF={unterhalt:50000,wiederverkauf:.9,anrechnung:.25,anrechnungAbWochen:104,kuendigungMonate:3};
export const PERSONAL=[
 {id:'pe',file:'produktentwickler',name:'Ryō Sato',rolle:'Produktentwickler',icon:'🧪',gehalt:520000,text:'Entwickelt Eigenmarken, die du beauftragst.',sterne:'★★★★ Produkt · ★★ Tempo'},
 {id:'cfo',file:'cfo',name:'Hiroshi Mori',rolle:'CFO (Finanzchef)',icon:'📊',gehalt:1000000,text:'Erinnert an Verträge, Kredite und Messe-Fristen.',sterne:'★★★★ Zahlen · ★★★ Verhandeln'},
 {id:'cmo',file:'cmo',name:'Reiko Kato',rolle:'CMO (Marketingchefin)',icon:'📣',gehalt:800000,text:'Setzt Ladenpreise und stellt Filialleiter für neue Läden ein.',sterne:'★★★★ Marketing · ★★★ Menschen'}];
// Eigenmarken (Bob): EK/VK so, dass PB ≈ 50 % Marge; Fremdmarke als Vergleich. Stück/Laden/Woche: Spielwert aus der Sim
export const EIGENMARKEN=[
 {id:'wasser',name:'Kobo Wasser 500 ml',emoji:'💧',kurz:'Wasser',sub:'500 ml',vk:108,ek:50,steuer:.08,kosten:8e5,wochen:4,stueck:120,fremd:{name:'Gletscherquell',marge:.33}},
 {id:'limo',name:'Kobo Zitronen-Limo',emoji:'🍋',kurz:'Limonade',sub:'Dose 350 ml',vk:140,ek:65,steuer:.08,kosten:1.2e6,wochen:5,stueck:60,fremd:{name:'Sorairo Cola',marge:.31}},
 {id:'chiki',name:'Kobo-Chiki',emoji:'🍗',kurz:'Kobo-Chiki',sub:'Heißtheke',vk:248,ek:115,steuer:.08,kosten:1.8e6,wochen:6,stueck:110,fremd:{name:'Buta-Buta Karaage',marge:.35}},
 {id:'onigiri',name:'Kobo Onigiri',emoji:'🍙',kurz:'Onigiri',sub:'Spezial',vk:160,ek:75,steuer:.08,kosten:1.5e6,wochen:6,stueck:200,fremd:{name:'Marken-Onigiri',marge:.32}}];
export const NACHFRAGE_START={faktor:.95,wochen:13};// unbekannte Marke: −5 % für 3 Monate
// CMO: Preisfaktor je Viertel-Typ (Premium im Büroviertel, günstig an der Uni)
export const CMO_PREIS={office:1.06,station:1.02,tourist:1.04,nightlife:1.03,residential:.99,uni:.95,standard:1};
// CFO-Erinnerungen: Vorlauf in Wochen
export const CFO={vertragVorlauf:30,messeVorlauf:26,cashflowRegel:1.5};
