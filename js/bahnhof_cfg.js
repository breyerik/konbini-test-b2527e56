// Bahnhof-Menü (Yuki: grafik/bahnhof/bahnhof-menue.svg). Preise/Fahrzeiten kommen aus daten/BAHNHOF_FAHRTEN.json (Bob, nicht hier ändern);
// diese Tabelle hält nur, welche Städte spielbar sind, den Bahnhofsnamen und Ersatzwerte, falls die JSON fehlt. Yuki darf hier korrigieren.
export const STAEDTE=[
 {id:'tokio',name:'Tokio',jp:'東京',bahnhof:'Tokio',json:'Tokio',live:true},
 {id:'yokohama',name:'Yokohama',jp:'横浜',bahnhof:'Shin-Yokohama',json:'Shin-Yokohama',live:true,ersatz:{von:'tokio',preis:1380,min:17}},// Shinkansen hält in Shin-Yokohama
 {id:'nagoya',name:'Nagoya',jp:'名古屋',bahnhof:'Nagoya',json:'Nagoya',live:false},
 {id:'kyoto',name:'Kyoto',jp:'京都',bahnhof:'Kyoto',json:'Kyoto',live:false},
 {id:'osaka',name:'Osaka',jp:'大阪',bahnhof:'Shin-Osaka',json:'Shin-Osaka',live:false}];
export const TAFEL={zeilen:4,start:16*60+3,takt:7,gleis:14};// Deko: erste Abfahrt 16:03, alle 7 Min., Gleis 14/15; Ziele kommen aus BAHNHOF_FAHRTEN.json
export const LADEZEIT_MS=2600;
