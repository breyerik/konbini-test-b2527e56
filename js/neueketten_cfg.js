// Neue Ketten (Erik freigegeben 21.10.2026). Werte = Bobs Vorschlag aus daten/PREISE.md („Neue ausländische Ketten“) bzw. Spielwerte.
// Namen/Logos: Yuki (daten/KONKURRENZ_AUSLAND.md, grafik/logos/*.svg) – hier korrigierbar.
export const ZABU={id:'zabu',name:'Zabu',jp:'ザブ',file:'zabu',color:'#2E9E4F',color2:'#FFD23F',brand:1,aggr:.1,land:'🇯🇵 Japan',text:'Neue japanische Kette',abJahr:10};// Zabu kommt nach 10 Spieljahren
export const AUSLAND=[
 {id:'loopgo',name:'Loop & Go',jp:'ループ&ゴー',file:'loop-and-go',color:'#14A39A',color2:'#FF8A3D',brand:1.05,aggr:.1,land:'🇨🇦 Kanada',text:'Konbini-Riese aus Kanada'},
 {id:'molenmarkt',name:'Molenmarkt',jp:'モーレンマルクト',file:'molenmarkt',color:'#1F5FAF',color2:'#FF8A3D',brand:.98,aggr:.1,land:'🇳🇱 Niederlande',text:'Genossenschafts-Nahversorger aus den Niederlanden'},
 {id:'bluejay',name:'Bluejay Stop',jp:'ブルージェイ',file:'bluejay-stop',color:'#2D6FD1',color2:'#F5ECD9',brand:1.02,aggr:.1,land:'🇺🇸 USA',text:'Kult-Kette aus den USA'}];
export const REGELN={
 startNachWochen:52,   // 1 Spieljahr nachdem keine Konkurrenz mehr übrig ist
 abstandWochen:104,    // danach alle 2 Jahre eine weitere
 maxAktiv:2,           // höchstens 2 neue Ketten gleichzeitig
 kapitalAnteil:.6,kapitalMin:5e6,kapitalPlus:0,// nur noch alte Spielstände; alle neuen Ketten (auch Zabu) starten seit 23.10. gleich: NACHFOLGER_REGEL ¥5 Mio + Startkredit
 jahr1Wochen:52,taktJahr1:1,taktDanach:2,// Jahr 1: 1 Laden/Woche, danach 1 je 2 Wochen (bevorzugt nahe Spieler-Läden: sim.rivalOpen)
 preisMinus:.05,preisWochen:104,// 2 Jahre 5 % unter unseren Preisen (wirkt als Dauer-Rabattaktion auf nahe Filialen)
 verlustWochen:156,    // 3 Jahre Verlustpuffer, danach ohne Gewinn Rückzug
 ladenKosten:2.5e7,ladenGewinn:1.2e5,minusJeSpielerLaden:4e4,preisKampfKosten:3e4,ohneMarkenMalus:2e4,// Spielwerte je Laden/Woche (Annahme)
};
// Beispielpreise für die Eilmeldung (Mockup k): unser Preis → ihrer = −5 %
export const BEISPIELE=[{icon:'🍙',cat:'onigiri'},{icon:'☕',cat:'coffee'},{icon:'🥤',cat:'drinks'}];
// Nachrücker (Erik 23.10.): Geht eine Kette pleite oder wird sie aufgekauft, rückt eine neu gegründete japanische Kette nach –
// 0 Läden, kleines Startkapital, gleiche Mission wie wir (von ganz unten nach ganz oben). Frei erfundene Namen, keine echten Marken.
export const NACHFOLGER=[
 {id:'tanpopo',logo:'tanpopo24',name:'Tanpopo 24',jp:'たんぽぽ24',color:'#E8B730',color2:'#4E8C4A',brand:.95,aggr:.09},
 {id:'komorebi',name:'Komorebi Mart',jp:'こもれびマート',color:'#5B8A5A',color2:'#F2E3B3',brand:.95,aggr:.09},
 {id:'donguri',name:'Donguri Mart',jp:'どんぐりマート',color:'#9A6B3F',color2:'#F4D9A8',brand:.95,aggr:.09},
 {id:'kazaguruma',name:'Kazaguruma',jp:'かざぐるま',color:'#3F7FBF',color2:'#F28C8C',brand:.95,aggr:.09},
 {id:'mikanya',name:'Mikan-ya',jp:'みかん屋',color:'#F08A24',color2:'#3E7D3A',brand:.95,aggr:.09},
 {id:'yukimichi',name:'Yukimichi',jp:'ゆきみち',color:'#6C8FB3',color2:'#FFFFFF',brand:.95,aggr:.09},
 {id:'shirasagi',name:'Shirasagi Mart',jp:'しらさぎマート',color:'#D94A64',color2:'#FFF1E6',brand:.95,aggr:.09},
 {id:'tsubaki',name:'Tsubaki 24',jp:'つばき24',color:'#B23A48',color2:'#F2E86D',brand:.95,aggr:.09},
 {id:'kumo',name:'Kumo Store',jp:'くもストア',color:'#7FA7C9',color2:'#FFFFFF',brand:.95,aggr:.09},
 {id:'tsukimi',name:'Tsukimi',jp:'つきみ',color:'#2E3A6B',color2:'#F5D76E',brand:.95,aggr:.09},
 {id:'ichigoya',name:'Ichigo-ya',jp:'いちご屋',color:'#E5484D',color2:'#5A9A4A',brand:.95,aggr:.09},
 {id:'suzume',name:'Suzume Mart',jp:'すずめマート',color:'#8A6A4A',color2:'#F3E3C8',brand:.95,aggr:.09},
 {id:'nijiiro',name:'Nijiiro',jp:'にじいろ',color:'#7B5EA7',color2:'#F7C548',brand:.95,aggr:.09},
 {id:'momiji',name:'Momiji Mart',jp:'もみじマート',color:'#C4472B',color2:'#F6D7A7',brand:.95,aggr:.09},
 {id:'shiokaze',name:'Shiokaze',jp:'しおかぜ',color:'#2B8C9E',color2:'#F0EAD6',brand:.95,aggr:.09},
 {id:'hinata',name:'Hinata 24',jp:'ひなた24',color:'#F2A93B',color2:'#4A6FA5',brand:.95,aggr:.09},
 {id:'kaeru',name:'Kaeru Mart',jp:'かえるマート',color:'#4FA05A',color2:'#FCE38A',brand:.95,aggr:.09},
 {id:'usagi',name:'Usagi Store',jp:'うさぎストア',color:'#B98FC9',color2:'#FFFFFF',brand:.95,aggr:.09},
 {id:'take',name:'Takebayashi',jp:'たけばやし',color:'#3F7D4F',color2:'#E9E2C0',brand:.95,aggr:.09},
 {id:'fuurin',name:'Fuurin',jp:'ふうりん',color:'#4C9ED9',color2:'#E86A5A',brand:.95,aggr:.09}];
// Logos aus grafik/ketten/ erst nach Eriks Freigabe laden (true = Datei verwenden), sonst Initiale
export const LOGO_FREIGEGEBEN={tanpopo:true,komorebi:true,donguri:false,kazaguruma:false,mikanya:false,yukimichi:false,loopgo:false,molenmarkt:false,bluejay:false,shirasagi:false,tsubaki:false,kumo:false,tsukimi:false,ichigoya:false,suzume:false,nijiiro:false,momiji:false,shiokaze:false,hinata:false,kaeru:false,usagi:false,take:false,fuurin:false};
export const NACHFOLGER_REGEL={auslandChance:.5,kasse:5e6,wachstum:.1,ipoChance:.03,ansageWochen:52,startWochen:104};// Erik 23.10.: Nachfolger rückt 2 Jahre nach Verfahrensende nach, Ankündigung nach 1 Jahr// Startkasse wie der Spieler (START_CASH ¥5 Mio)
