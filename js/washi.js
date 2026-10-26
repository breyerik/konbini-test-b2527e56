// Washi-Design (Yuki, Erik 25.10.): Linien-Icons – 2px Tusche, offene Enden, keine Füllung (Franky)
const P={
 map:'<path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z"/><path d="M8.5 4v13.5M15.5 6.5V20"/>',
 shop:'<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M10 20v-5h4v5"/>',
 chart:'<path d="M4 20h16"/><path d="M6 16v-3M10 16V9M14 16v-5M18 16V6"/>',
 trophy:'<path d="M12 15a5 5 0 0 0 5-5V4H7v6a5 5 0 0 0 5 5z"/><path d="M12 15v4M8.5 20h7"/>',
 pin:'<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 plane:'<path d="M3.5 13.5 10 12l3.5-7.5 2 .5-1.5 6.5 6 1.5 1-2 1.5.5-1 3.5-3.5-.5"/><path d="m10 12-1 6.5 2 .5 3-6"/>',
 train:'<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10.5h12M9.5 13.5h.01M14.5 13.5h.01M8.5 20l1.5-3.5M15.5 20 14 16.5"/>',
 layers:'<path d="M12 4 3 8.5l9 4.5 9-4.5z"/><path d="m3 12.5 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
 menu:'<path d="M5 7h14M5 12h14M5 17h14"/>',
 star:'<path d="m12 4 2.4 5 5.3.7-3.9 3.7 1 5.3L12 16.2 7.2 18.7l1-5.3-3.9-3.7 5.3-.7z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
 leaf:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
 snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
 blossom:'<circle cx="12" cy="12" r="2"/><path d="M12 10c-2-3-1-6 0-6s2 3 0 6M14 12c3-2 6-1 6 0s-3 2-6 0M12 14c2 3 1 6 0 6s-2-3 0-6M10 12c-3 2-6 1-6 0s3-2 6 0"/>',
 search:'<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 user:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
 home:'<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
 heart:'<path d="M12 19.5C6 15.5 3.5 12 4.5 8.6 5.5 5.3 9.7 4.8 12 8c2.3-3.2 6.5-2.7 7.5.6 1 3.4-1.5 6.9-7.5 10.9z"/>',
 comment:'<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z"/>',
 share:'<path d="M7 17 17 7M9.5 7H17v7.5"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 more:'<path d="M6 12h.01M12 12h.01M18 12h.01"/>',
 megaphone:'<path d="M4 10v4h3l8 4.5V5.5L7 10z"/><path d="M18 9.5c1 .7 1 4.3 0 5"/>',
 trend:'<path d="M3.5 17 9 11.5l3.5 3.5L20.5 7"/><path d="M15.5 7h5v5"/>',
 handshake:'<path d="M3 12.5 7 8.5l3 1 2-1.5 3 .5 3 3"/><path d="M3 12.5 8 17.5c1 1 2 1 3 0l1-1 1 1c1 1 2 1 3 0l2.5-2.5"/><path d="M21 11.5 18 8.5"/>',
 award:'<circle cx="12" cy="9.5" r="5.5"/><path d="M9 14.5 7.5 21 12 18.5l4.5 2.5L15 14.5"/>',
 box:'<path d="M4 8 12 4l8 4v8.5L12 20.5 4 16.5z"/><path d="M4 8l8 4 8-4M12 12v8.5"/>',
 ghost:'<path d="M6 20V11a6 6 0 0 1 12 0v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><path d="M10 11h.01M14 11h.01"/>',
 umbrella:'<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 play:'<path d="M9 7l6 5-6 5"/>',
};
export function ico(n,size=24,cls=''){return `<svg class="wico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${(2*24/size).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||P.star}</svg>`;}
// Saison-/Ereignis-Icon: Linie statt Emoji
export function seasonIco(ev){const k=String(ev&&(ev.key||'')),b=String(ev&&ev.base||'');const x=k+' '+b;return /hanami|spring/.test(x)?'blossom':/rain/.test(x)?'umbrella':/summer/.test(x)?'sun':/autumn/.test(x)?'leaf':/winter/.test(x)?'snow':'star';}
// Stylesheets nach dynamisch nachgeladenen (finanzen.css, bahnhof.css) halten
export function keepLast(){const f=()=>{const a=document.getElementById('washicss'),z=document.getElementById('washifz'),h=document.head;if(!a||!z)return;if(h.lastElementChild===z&&z.previousElementSibling===a)return;h.appendChild(a);h.appendChild(z);};new MutationObserver(f).observe(document.head,{childList:true});f();}
