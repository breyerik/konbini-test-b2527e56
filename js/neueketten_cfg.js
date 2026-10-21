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
 kapitalAnteil:.6,kapitalMin:5e9,kapitalPlus:.2,// Startkapital 60 % unseres Firmenwerts, mind. 5 Mrd ¥, jede weitere +20 %
 jahr1Wochen:52,taktJahr1:1,taktDanach:2,// Jahr 1: 1 Laden/Woche, danach 1 je 2 Wochen (bevorzugt nahe Spieler-Läden: sim.rivalOpen)
 preisMinus:.05,preisWochen:104,// 2 Jahre 5 % unter unseren Preisen (wirkt als Dauer-Rabattaktion auf nahe Filialen)
 verlustWochen:156,    // 3 Jahre Verlustpuffer, danach ohne Gewinn Rückzug
 ladenKosten:2.5e7,ladenGewinn:1.2e5,minusJeSpielerLaden:4e4,preisKampfKosten:3e4,ohneMarkenMalus:2e4,// Spielwerte je Laden/Woche (Annahme)
};
// Beispielpreise für die Eilmeldung (Mockup k): unser Preis → ihrer = −5 %
export const BEISPIELE=[{icon:'🍙',cat:'onigiri'},{icon:'☕',cat:'coffee'},{icon:'🥤',cat:'drinks'}];
