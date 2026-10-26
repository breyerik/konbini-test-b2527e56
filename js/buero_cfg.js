// Paket 2 – Zentrale/Büro (Yuki b1–b8, Werte Bob PREISE.md 21.10.2026). Alle Spielwerte hier.
const QS=new URLSearchParams(globalThis.location?location.search:'');
export const ON=QS.get('paket2')!=='0';// Erik bestätigt: Paket 2 an, ?paket2=0 aus
export const AB_LAEDEN=5;// Erik: Büro ab 5 Läden
// Erik 25.10. 17:20 (R36): es gibt nur EIN Büro insgesamt – Tokio, Shibuya, über ☰. Keine Büros in anderen Städten.
export const BUEROS=[
 {id:'shibuya',name:'Kleines Büro Shibuya',stadt:'Tokio',viertel:'Shibuya',m2:85,plaetze:5,miete:690000,kauf:76e6,tag:'✅ deine Zentrale in Tokio'}];
// Frühere Angebote (nur für alte Spielstände): werden beim Laden kostenlos nach Shibuya verlegt
export const ALT_BUEROS={shinjuku:'Etage Shinjuku West',noge:'Altbau Noge'};
export const KAUF={unterhalt:50000,wiederverkauf:.9,anrechnung:.25,anrechnungAbWochen:104,kuendigungMonate:3};
export const PERSONAL=[
 {id:'pe',file:'produktentwickler',name:'Ryō Sato',rolle:'Produktentwickler',icon:'🧪',gehalt:520000,text:'Entwickelt Eigenmarken, die du beauftragst.',sterne:'★★★★ Produkt · ★★ Tempo'},
 {id:'cfo',file:'cfo',name:'Hiroshi Mori',rolle:'CFO (Finanzchef)',icon:'📊',gehalt:1000000,text:'Erinnert an Verträge, Kredite und Messe-Fristen.',sterne:'★★★★ Zahlen · ★★★ Verhandeln'},
 {id:'cmo',file:'cmo',name:'Reiko Kato',rolle:'CMO (Marketingchefin)',icon:'📣',gehalt:800000,text:'Setzt Ladenpreise und stellt Filialleiter für neue Läden ein.',sterne:'★★★★ Marketing · ★★★ Menschen'}];
// Eigenmarken (Bob): EK/VK so, dass PB ≈ 50 % Marge; Fremdmarke als Vergleich. Stück/Laden/Woche: Spielwert aus der Sim
export const EIGENMARKEN=[
 {id:'limo',name:'Kobo Zitronen-Limo',emoji:'🍋',kurz:'Limonade',sub:'Dose 350 ml',vk:140,ek:65,steuer:.08,kosten:1.2e6,wochen:5,stueck:60,fremd:{name:'Awa-Awa Bottlers Cola',marge:.31}},
 {id:'chiki',name:'Kobo-Chiki',emoji:'🍗',kurz:'Kobo-Chiki',sub:'Heißtheke',vk:248,ek:115,steuer:.08,kosten:1.8e6,wochen:6,stueck:110,fremd:{name:'Buta-Buta Ham Karaage',marge:.35}},
 {id:'dorayaki',name:'Kobo Dorayaki',emoji:'🥞',kurz:'Dorayaki',sub:'Süßes, Regal',vk:180,ek:83,steuer:.08,kosten:1.2e6,wochen:5,stueck:70,fremd:{name:'Marken-Dorayaki',marge:.3}},// Erik 15:45; Preise Bob 25.10. (EK 83)
 {id:'purin',name:'Kobo Purin',emoji:'🍮',kurz:'Purin',sub:'Kühlregal, Becher',vk:160,ek:74,steuer:.08,kosten:1e6,wochen:4,stueck:70,fremd:{name:'Marken-Purin',marge:.31}}];// Erik 25.10.: Purin statt Eiskaffee (Dessert aus dem Kühlregal, Gruppe Snacks/Süßes). Preise Bob 25.10. (EK 74).
export const NACHFRAGE_START={faktor:.95,wochen:13};// unbekannte Marke: −5 % für 3 Monate
// CMO: Preisfaktor je Viertel-Typ (Premium im Büroviertel, günstig an der Uni)
export const CMO_PREIS={office:1.06,station:1.02,tourist:1.04,nightlife:1.03,residential:.99,uni:.95,standard:1};
// CFO-Erinnerungen: Vorlauf in Wochen
export const CFO={vertragVorlauf:30,messeVorlauf:26,cashflowRegel:1.5};
