// namensfeld.js – setzt den Firmennamen in Editor-Logos und passt die Schrift an.
(function(g){
  var NS="http://www.w3.org/2000/svg";
  function setze(t,txt){ while(t.firstChild)t.removeChild(t.firstChild); t.appendChild(document.createTextNode(txt)); }
  function zeilen(t,a,b,x,y,fs){
    while(t.firstChild)t.removeChild(t.firstChild);
    var lh=fs*1.1;
    [a,b].forEach(function(s,i){var sp=document.createElementNS(NS,"tspan");
      sp.setAttribute("x",x);sp.setAttribute("y",(y-lh/2+i*lh+fs*0.15).toFixed(1));sp.textContent=s;t.appendChild(sp);});
  }
  function breite(t){ var m=0; var sp=t.querySelectorAll("tspan");
    if(!sp.length) return t.getComputedTextLength();
    sp.forEach(function(s){m=Math.max(m,s.getComputedTextLength());}); return m; }
  function fuelleFeld(t,name){
    if(!t.dataset.y0){t.dataset.y0=t.getAttribute("y");}
    var x=t.getAttribute("x"), y=parseFloat(t.dataset.y0);
    var mb=+t.dataset.maxbreite, mx=+t.dataset.maxgroesse, mn=+t.dataset.mingroesse, z=+(t.dataset.zeilen||1);
    t.setAttribute("y",y); t.setAttribute("text-anchor","middle");
    name=(name||"").trim(); setze(t,name);
    var fs, zweiOk=(z>=2&&name.indexOf(" ")>0);
    // bei 2 Zeilen: einzeilig nur bis 60 % der Maximalgroesse schrumpfen, dann lieber umbrechen
    var mn1=zweiOk?Math.max(mn,Math.round(mx*0.6)):mn;
    for(fs=mx;fs>=mn1;fs--){t.setAttribute("font-size",fs); if(t.getComputedTextLength()<=mb){t.dataset.modus="1";return "1";}}
    if(zweiOk){
      var mid=name.length/2,best=-1;
      for(var i=0;i<name.length;i++) if(name[i]===" "&&(best<0||Math.abs(i-mid)<Math.abs(best-mid))) best=i;
      var a=name.slice(0,best),b=name.slice(best+1);
      var mx2=Math.min(mx,Math.round(mx*0.75));
      for(fs=mx2;fs>=mn;fs--){t.setAttribute("font-size",fs); zeilen(t,a,b,x,y,fs); if(breite(t)<=mb){t.dataset.modus="2";return "2";}}
      setze(t,name);
      for(fs=mn1-1;fs>=mn;fs--){t.setAttribute("font-size",fs); if(t.getComputedTextLength()<=mb){t.dataset.modus="1";return "1";}}
    }
    t.setAttribute("font-size",mn);
    var s=name; while(s.length>1){ s=s.slice(0,-1).trimEnd(); setze(t,s+"…"); if(t.getComputedTextLength()<=mb) break; }
    t.dataset.modus="…"; return "…";
  }
  /** fuelleLogo(svgElement, firmenname) – fuellt alle Felder data-placeholder="name". Rueckgabe: Liste der Modi ("1","2","…"). */
  g.fuelleLogo=function(svg,name){ return Array.prototype.map.call(svg.querySelectorAll('text[data-placeholder="name"]'),function(t){return fuelleFeld(t,name);}); };
})(window);
