// B2 / R57 (Grundlage: Whitebeard R4b Auflage E3; Eriks ‚Genau so machen‘ (t338u, 14:54) bezog sich auf die gezeigten Lagen A/B): feste Zuordnung Laden-Grundstück -> Stadtteil (Tokio, Plan V7).
// Die Zuordnung hängt damit NICHT mehr an der Geometrie (nächster Bezirksmittelpunkt). Stand: genau die bisherige Zuordnung
// (nächster Mittelpunkt, data.js vor B2, Commit a7e3a14), beide Wolkenkratzer-Platzierungen und alle Läden vor dem Umzug.
// Bezirksmittelpunkt (x/z) und Anker der Beschriftung (lx/lz) dürfen sich jetzt ändern, ohne dass Läden das Viertel wechseln.
// Neue Laden-Grundstücke: hier eintragen (Test tests/bezirk_zuordnung_v7.py prüft Vollständigkeit). Nicht eingetragene fallen auf den Mittelpunkt zurück.
export const BEZIRK_ZUORDNUNG={tokio:{7:{
 "1":"shinjuku", "104":"shinjuku", "106":"shinjuku", "109":"hongo", "111":"hongo", "128":"shinjuku", "132":"hongo", "133":"hongo",
 "135":"shinjuku", "139":"shinjuku", "140":"hongo", "142":"shinjuku", "143":"shinjuku", "147":"shinjuku", "15":"asakusa", "155":"shinjuku",
 "159":"asakusa", "162":"asakusa", "163":"shinjuku", "164":"shinjuku", "17":"asakusa", "171":"asakusa", "177":"marunouchi", "183":"shinjuku",
 "186":"setagaya", "189":"shinjuku", "190":"shinjuku", "191":"marunouchi", "197":"marunouchi", "198":"marunouchi", "202":"roppongi", "203":"setagaya",
 "212":"shibuya", "217":"roppongi", "219":"setagaya", "227":"roppongi", "228":"marunouchi", "232":"marunouchi", "233":"roppongi", "234":"roppongi",
 "235":"roppongi", "236":"setagaya", "24":"shinjuku", "242":"shibuya", "243":"roppongi", "246":"shibuya", "247":"roppongi", "248":"roppongi",
 "249":"roppongi", "251":"marunouchi", "254":"setagaya", "256":"setagaya", "26":"shinjuku", "263":"setagaya", "27":"hongo", "276":"setagaya",
 "285":"roppongi", "290":"setagaya", "297":"shibuya", "300":"setagaya", "301":"setagaya", "304":"setagaya", "33":"hongo", "34":"hongo",
 "36":"asakusa", "42":"shinjuku", "52":"asakusa", "54":"shinjuku", "55":"shinjuku", "64":"shinjuku", "77":"shinjuku", "86":"shinjuku",
 "90":"shinjuku", "98":"hongo"
}}};
export function festerBezirk(stadt,plan,lot){const t=(BEZIRK_ZUORDNUNG[stadt]||{})[plan];return t&&Object.prototype.hasOwnProperty.call(t,lot)?t[lot]:null;}
