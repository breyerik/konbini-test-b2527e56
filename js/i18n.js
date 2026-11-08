import {en} from './i18n_catalog.js';

const STORAGE_KEY='tanuki-language';
const STANDARD_NAMES=new Set(['Tokio','Tokios','Omas Laden','Chefin/Chef','Vertretung (Aushilfe)']);
const englishCopy=value=>value.replace(/\bTokios\b/g,"Tokyo's").replace(/\bTokio\b/g,'Tokyo').replace(/\bOmas Laden\b/g,"Grandma's Store").replace(/Grandma[’']s store/gi,"Grandma's Store");
const supported=value=>value==='de'||value==='en';
function initialLanguage(){
 const query=new URLSearchParams(globalThis.location?.search||'').get('lang');
 if(supported(query)){try{localStorage.setItem(STORAGE_KEY,query);}catch{}return query;}
 try{const saved=localStorage.getItem(STORAGE_KEY);if(supported(saved))return saved;}catch{}
 const browserLanguage=globalThis.navigator?.language;
 const chosen=browserLanguage&&!browserLanguage.toLowerCase().startsWith('de')?'en':'de';
 try{localStorage.setItem(STORAGE_KEY,chosen);}catch{}return chosen;
}
export const language=initialLanguage();
export const decimal=value=>language==='en'?String(value):String(value).replace('.',',');
export const locale=()=>language==='en'?'en-GB':'de-DE';
export const de=Object.fromEntries(Object.keys(en).map(key=>[key,key]));
const normalise=value=>String(value).replace(/\s+/g,' ').trim();
const escapeRE=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let phrases=[],messages=[],pattern=null;
function rebuild(){
 phrases=Object.keys(en).filter(key=>key!==en[key]&&!/\{\w+\}/.test(key)).sort((a,b)=>b.length-a.length);
 messages=Object.keys(en).filter(key=>/\{\w+\}/.test(key)).map(key=>{
  const keys=[...key.matchAll(/\{(\w+)\}/g)].map(match=>match[1]);
  return {regex:new RegExp('^'+key.split(/\{\w+\}/).map(escapeRE).join('(.+?)')+'$','u'),keys,text:en[key]};
 });pattern=null;
}
rebuild();
// Runtime copy stays outside the source repository. Keep simulation/save text
// canonical (German); register its English display messages rather than mutating it.
export function registerRuntimeTexts(german,english){
 function pair(a,b){
  if(typeof a==='string'&&typeof b==='string'&&a!==b){
   const key=normalise(a);if(key){en[key]=englishCopy(normalise(b));de[key]=key;}
   const x=a.split(/\{\w+\}/),y=b.split(/\{\w+\}/);
   if(x.length===y.length&&x.length>1)for(let i=0;i<x.length;i++){const k=normalise(x[i]);if(k.length>=4&&normalise(y[i])){en[k]=englishCopy(normalise(y[i]));de[k]=k;}}
  }else if(a&&b&&typeof a==='object'&&typeof b==='object')for(const key of Object.keys(a))if(!key.startsWith('_')&&!['id','figur'].includes(key))pair(a[key],b[key]);
 }
 pair(german,english);rebuild();
}
const missing=new Set();
const names=new Set(['Hinata','Kogarashi','Tokyo','Yokohama','Osaka','Kyōto','Kyoto','Nagoya']);
export function protectNames(values){for(const name of values)if(typeof name==='string'&&name.trim()&&!STANDARD_NAMES.has(name)){if(!names.has(name)){names.add(name);pattern=null;}}}

// Message keys are the German source text, so a missing translation is always safe.
// The legacy renderers compose sentences from fragments; longest-match substitution
// localises only their display output, never simulation data, IDs or stored saves.
export function t(key,values={}){
 const source=String(key??''),trimmed=normalise(source);
 if(language==='de'||names.has(trimmed))return interpolate(source,values);
 let translated=en[trimmed];
 if(translated==null)for(const message of messages){const match=message.regex.exec(trimmed);if(match){translated=interpolate(message.text,Object.fromEntries(message.keys.map((key,i)=>[key,t(match[i+1])])));break;}}
 if(translated==null){
  if(!pattern){const words=[...new Set([...phrases,...names])].sort((a,b)=>b.length-a.length);pattern=new RegExp('(?<![\\p{L}\\p{N}])(?:'+words.map(escapeRE).join('|')+')(?![\\p{L}\\p{N}])','gu');}
  translated=trimmed.replace(pattern,match=>names.has(match)?match:en[match]??match);
  if(translated===trimmed&&/[äöüß]|\b(?:dein|deine|noch|nicht|wird|wurde|werden|für)\b/i.test(trimmed))missing.add(trimmed);
 }
 const before=source.match(/^\s*/)[0],after=source.match(/\s*$/)[0];
 return before+interpolate(translated,values)+after;
}
function interpolate(text,values){return text.replace(/\{([\w]+)\}/g,(all,key)=>Object.hasOwn(values,key)?String(values[key]):all);}
export const untranslated=()=>[...missing];

export function localize(root){
 if(language==='de')return root;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){if(node.parentElement?.closest('script,style,[translate="no"],input,textarea'))continue;node.nodeValue=t(node.nodeValue);}
 const elements=root.querySelectorAll?root.querySelectorAll('[title],[aria-label],[placeholder],[alt]'):[];
 for(const element of elements){if(element.closest('[translate="no"]'))continue;for(const attr of ['title','aria-label','placeholder','alt'])if(element.hasAttribute(attr))element.setAttribute(attr,t(element.getAttribute(attr)));}
 return root;
}
export function html(markup){
 if(language==='de'||markup==null)return markup;
 const template=document.createElement('template');template.innerHTML=String(markup);localize(template.content);return template.innerHTML;
}

export function languageButtons(){
 return `<div class="languagePicker" translate="no" role="group" aria-label="Sprache / Language">${[['de','Deutsch'],['en','English']].map(([lang,label])=>`<button type="button" lang="${lang}" data-language="${lang}" aria-pressed="${lang===language}">${label}</button>`).join('')}</div>`;
}
export function mountLanguagePicker(beforeChange){
 document.documentElement.lang=language;document.title=t(document.title);localize(document.body);
 const picker=document.createElement('div');picker.id='languagePicker';picker.innerHTML=languageButtons();document.body.appendChild(picker);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(!button)return;const lang=button.dataset.language;if(!supported(lang)||lang===language)return;
  const next=new URL(location.href);beforeChange?.(next);next.searchParams.set('lang',lang);try{localStorage.setItem(STORAGE_KEY,lang);}catch{}location.assign(next.href);
 });
}
