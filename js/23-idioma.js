'use strict';
/* IDIOMA: com o japonês escolhido (SET.lang='ja'), troca na tela todo texto em português pelo do dicionário JA (js/22-ja.js), inclusive o que aparece depois (avisos, janelas, partida) */
/* O jogo continua escrito em português; esta camada traduz o que vai para a tela. Texto que não está no dicionário fica em português.
   Chaves do dicionário: o texto exato, com {} no lugar do que muda (nome, número…). Na tradução, {} segue a ordem; {1},{2}… escolhem a lacuna (para trocar a ordem ou pular uma).
   Elementos com data-notr (e dentro deles) não são traduzidos. Texto novo no código: acrescente a frase em JA (e rode o extrator descrito no CHANGELOG da 1.11). */
const IDIOMAS={pt:'🇧🇷 Português',ja:'🇯🇵 日本語'};
const LANG=SET.lang==='ja'?'ja':'pt';
const TR={exato:new Map(),padroes:[],cache:new Map()};
const trLetras=/[A-Za-zÀ-ú]{2}/, trEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function trPrep(){
  for(const pt in JA){ const ja=JA[pt]; if(ja==null) continue;
    if(!pt.includes('{}')){ TR.exato.set(pt,ja); continue; }
    const fixo=pt.split('{}'); if(!trLetras.test(fixo.join(''))) continue; /* "{} {}" casaria com qualquer coisa */
    TR.padroes.push({re:new RegExp('^'+fixo.map(trEsc).join('([\\s\\S]+?)')+'$'),ja,peso:fixo.join('').length}); }
  TR.padroes.sort((a,b)=>b.peso-a.peso); /* o mais específico primeiro */
}
/* traduz um texto (devolve o mesmo texto se não souber) */
function trTxt(s){
  if(LANG!=='ja'||typeof s!=='string'||!trLetras.test(s)) return s;
  const c=TR.cache.get(s); if(c!==undefined) return c;
  const m0=s.match(/^(\s*)([\s\S]*?)(\s*)$/), miolo=m0[2].replace(/\s+/g,' ');
  let r=TR.exato.get(miolo);
  if(r==null) for(const p of TR.padroes){ const m=miolo.match(p.re); if(!m) continue;
    let i=0; r=p.ja.replace(/\{(\d*)\}/g,(x,n)=>{ const v=n?m[+n]:m[++i]; return v==null?'':trTxt(v); }); break; }
  const out=r==null?s:m0[1]+r+m0[3];
  if(TR.cache.size>4000) TR.cache.clear(); TR.cache.set(s,out); return out;
}
const TR_ATTR=['placeholder','title','aria-label'];
function trNo(n){ /* pula o que não é para traduzir */ const e=n.nodeType===1?n:n.parentElement; return !e||!!e.closest('script,style,textarea,[data-notr]'); }
function trTexto(t){ if(trNo(t)) return; const v=t.nodeValue, r=trTxt(v); if(r!==v) t.nodeValue=r; }
function trAttrs(e){ if(trNo(e)) return; TR_ATTR.forEach(a=>{ const v=e.getAttribute(a); if(v){ const r=trTxt(v); if(r!==v) e.setAttribute(a,r); } }); }
function trArvore(raiz){
  if(raiz.nodeType===3){ trTexto(raiz); return; } if(raiz.nodeType!==1||trNo(raiz)) return;
  trAttrs(raiz); raiz.querySelectorAll('[placeholder],[title],[aria-label]').forEach(trAttrs);
  const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT); let t; while((t=w.nextNode())) trTexto(t);
}
/* escolha do idioma nas Configurações: muda e recarrega (o português volta do zero) */
function renderIdioma(){
  const box=$('#langSeg'); if(!box) return;
  box.innerHTML=Object.keys(IDIOMAS).map(k=>`<button type="button" data-k="${k}" class="${LANG===k?'sel':''}">${IDIOMAS[k]}</button>`).join('');
  box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.k===LANG) return; SET.lang=b.dataset.k; saveSet(); location.reload(); }));
}
renderIdioma();
if(LANG==='ja'){
  trPrep(); document.documentElement.lang='ja'; document.title=trTxt(document.title);
  const conf=window.confirm.bind(window), alr=window.alert.bind(window);
  window.confirm=m=>conf(trTxt(String(m))); window.alert=m=>alr(trTxt(String(m)));
  trArvore(document.body);
  new MutationObserver(lista=>{ for(const m of lista){
    if(m.type==='characterData') trTexto(m.target);
    else if(m.type==='attributes') trAttrs(m.target);
    else m.addedNodes.forEach(trArvore);
  } }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:TR_ATTR});
}
