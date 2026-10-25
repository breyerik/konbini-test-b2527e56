// Deterministischer Zufall für Balance-Läufe/Tests (Franky 23.10.): ?seed=N ersetzt Math.random durch mulberry32(N). Ohne Parameter: unverändert.
(function(){const q=new URLSearchParams(location.search).get('seed');if(q==null||q==='')return;let x=(parseInt(q,10)||0)^0x9E3779B9;
Math.random=function(){x|=0;x=x+0x6D2B79F5|0;let t=Math.imul(x^x>>>15,1|x);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};window.__seed=+q;})();
