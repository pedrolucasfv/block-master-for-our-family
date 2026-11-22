'use strict';
/* IDIOMA: com o japonês escolhido (SET.lang='ja'), troca na tela todo texto em português pelo do dicionário JA (js/22-ja.js), inclusive o que aparece depois (avisos, janelas, partida) */
/* O jogo continua escrito em português; esta camada traduz o que vai para a tela. Texto que não está no dicionário fica em português.
   Chaves do dicionário: o texto exato, com {} no lugar do que muda (nome, número…). Na tradução, {} segue a ordem; {1},{2}… escolhem a lacuna (para trocar a ordem ou pular uma).
   Elementos com data-notr (e dentro deles) não são traduzidos. Texto novo no código: rode  python3 ferramentas/textos-sem-traducao.py  e acrescente em js/22-ja.js o que ele listar. */
const IDIOMAS={pt:'🇧🇷 Português',ja:'🇯🇵 日本語'};
const LANG=SET.lang==='ja'?'ja':'pt';
const TR={exato:new Map(),padroes:[],cache:new Map()};
const trLetras=/[A-Za-zÀ-ú]{2}/, trEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/* lacunas: {} (em ordem) e as das metas da campanha com nome ({v}, {limit}…), que o jogo troca pelo número antes de mostrar */
function trPrep(){
  for(const pt in JA){ const ja=JA[pt]; if(ja==null) continue;
    const pd=pt.split(/\{(\w*)\}/), fixo=pd.filter((x,i)=>i%2===0), nomes=pd.filter((x,i)=>i%2===1);
    if(!nomes.length){ TR.exato.set(pt,ja); continue; }
    if(!trLetras.test(fixo.join(''))) continue; /* "{} {}" casaria com qualquer coisa */
    /* a lacuna seguida de palavra ("{} s por peça") não atravessa ", " nem " · ": assim um item de lista não engole a lista toda */
    const re=fixo.map((f,i)=>trEsc(f)+(i===fixo.length-1?'':/^ ?[A-Za-zÀ-ú(]/.test(fixo[i+1])?'((?:(?!, | · )[\\s\\S])*?)':'([\\s\\S]*?)')).join('');
    TR.padroes.push({re:new RegExp('^'+re+'$'),ja,nomes,seq:nomes.map((n,i)=>n===''?i:-1).filter(i=>i>=0),peso:fixo.join('').length}); }
  TR.padroes.sort((a,b)=>b.peso-a.peso); /* o mais específico primeiro */
}
const trPonto=t=>t==null?t:/[。！？]$/.test(t)?t:t+'。';
function trPadrao(p,m){ let i=0;
  return p.ja.replace(/\{(\w*)\}/g,(x,n)=>{ const g=n===''?p.seq[i++]:/^\d+$/.test(n)?p.seq[n-1]:p.nomes.indexOf(n); const v=g==null||g<0?null:m[g+1]; return v==null?(n&&!/^\d+$/.test(n)?x:''):trTxt(v); }); }
/* traduz um texto (devolve o mesmo texto se não souber) */
function trTxt(s){
  if(LANG!=='ja'||typeof s!=='string'||!trLetras.test(s)) return s;
  const c=TR.cache.get(s); if(c!==undefined) return c;
  const m0=s.match(/^(\s*)([\s\S]*?)(\s*)$/), miolo=m0[2].replace(/\s+/g,' ');
  let r=TR.exato.get(miolo); if(r==null) r=/\.$/.test(miolo)?trPonto(TR.exato.get(miolo.slice(0,-1))):TR.exato.get(miolo+'.'); /* com ou sem ponto final */
  if(r==null){ const pm=miolo.match(/^([^A-Za-zÀ-ú0-9]+)([A-Za-zÀ-ú][\s\S]*)$/), e=pm&&TR.exato.get(pm[2]); if(e!=null) r=pm[1]+e; } /* "🔀 Trocar peças": o texto exato vence as regras com lacuna */
  if(r==null) for(const p of TR.padroes){ const m=miolo.match(p.re); if(m){ r=trPadrao(p,m); break; } }
  /* texto montado aos pedaços no código: tenta por partes (" · ", ", ", ": "), depois o número do fim, depois palavras soltas conhecidas */
  if(r==null){ const m=miolo.match(/^([^A-Za-zÀ-ú0-9]+)([A-Za-zÀ-ú][\s\S]*)$/); if(m){ const t=trTxt(m[2]); if(t!==m[2]) r=m[1]+t; } } /* emoji na frente */
  if(r==null){ const fr=miolo.split(/(?<=[.!?]) (?=[A-ZÀ-Ú])/); if(fr.length>1){ const t=fr.map(trTxt); if(t.some((x,i)=>x!==fr[i])) r=t.map((x,i)=>i&&!/[。！？]$/.test(t[i-1])?' '+x:x).join(''); } } /* várias frases */
  if(r==null){ const pt=miolo.split(/( · |, |: )/); if(pt.length>1){ const t=pt.map((x,i)=>i%2?x:trTxt(x)); if(t.some((x,i)=>x!==pt[i])) r=t.join(''); } }
  if(r==null){ const m=miolo.match(/^(.*[A-Za-zÀ-ú].*?)(\s*[\d.,:%+-]+)$/); if(m){ const t=trTxt(m[1]); if(t!==m[1]) r=t+m[2]; } }
  if(r==null){ const t=miolo.replace(/[A-Za-zÀ-ú][A-Za-zÀ-ú ]*[A-Za-zÀ-ú]/g,w=>TR.exato.get(w)??w); if(t!==miolo) r=t; }
  const out=r==null?s:m0[1]+r+m0[3];
  if(TR.cache.size>4000) TR.cache.clear(); TR.cache.set(s,out); return out;
}
const TR_ATTR=['placeholder','title','aria-label'];
function trNo(n){ /* pula o que não é para traduzir */ const e=n.nodeType===1?n:n.parentElement; return !e||!!e.closest('script,style,textarea,[data-notr]'); }
function trTexto(t){ if(trNo(t)) return; const v=t.nodeValue, r=trTxt(v); if(r!==v) t.nodeValue=r; }
function trAttrs(e){ if(e.closest('[data-notr]')) return; TR_ATTR.forEach(a=>{ const v=e.getAttribute(a); if(v){ const r=trTxt(v); if(r!==v) e.setAttribute(a,r); } }); }
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
