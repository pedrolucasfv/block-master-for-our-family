'use strict';
/* NOVIDADES: tela com o que mudou em cada versão (lê o CHANGELOG.md do site e mostra em cartões); ponto vermelho no botão quando sai versão que você ainda não viu */
let novLista=null;
/* "## 1.12 · 22/11/2026" abre uma versão; "- 💬 **Título:** texto" é um item */
function novParse(txt){ const out=[]; let cur=null;
  txt.split(/\r?\n/).forEach(l=>{ const h=l.match(/^##\s+(\S+)\s*(?:·\s*(.*))?$/); if(h){ cur={v:h[1],d:(h[2]||'').trim(),itens:[]}; out.push(cur); return; }
    const it=l.match(/^-\s+(.*)$/); if(it&&cur){ cur.itens.push(it[1]); return; } if(cur&&cur.itens.length&&l.trim()) cur.itens[cur.itens.length-1]+=' '+l.trim(); });
  return out; }
const novMd=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\x60(.+?)\x60/g,'<code>$1</code>');
function novItem(t){ const m=t.match(/^([^\sA-Za-zÀ-ú0-9*"(\x60]+)\s+([\s\S]*)$/); const ic=m?m[1]:'•', txt=m?m[2]:t;
  return `<li><span class="nvic">${esc(ic)}</span><div>${novMd(txt)}</div></li>`; }
function novRender(){
  const el=$('#newsList'); if(!novLista){ el.innerHTML='<p class="muted tcenter">Carregando…</p>'; return; }
  if(!novLista.length){ el.innerHTML='<p class="muted tcenter">Não deu para abrir as novidades agora (sem internet?). Tente de novo daqui a pouco.</p>'; return; }
  el.innerHTML=novLista.map((x,i)=>{ const fix=x.v.split('.').length>2, atual=x.v===VERSAO;
    return `<details class="nvcard${fix?' fix':''}"${i<3?' open':''}><summary><b class="nvv">${esc(x.v)}</b><span class="nvtag">${fix?'🔧 Correção':'✨ Novidade'}</span>${atual?'<span class="nvtag me">Sua versão</span>':''}<small class="muted">${esc(x.d)}</small></summary><ul>${x.itens.map(novItem).join('')}</ul></details>`; }).join('');
}
async function novAbrir(){
  store.set('ddb_novVisto',VERSAO); novPonto(); show('news'); novRender();
  if(novLista&&novLista.length) return;
  try{ const r=await fetch('CHANGELOG.md',{cache:'no-cache'}); if(!r.ok) throw 0; novLista=novParse(await r.text()); }catch(e){ novLista=[]; }
  novRender(); if(!novLista.length) novLista=null;
}
function novPonto(){ $('#goNewsDot').hidden=store.get('ddb_novVisto','')===VERSAO; }
$('#goNews').addEventListener('click',novAbrir);
novPonto();
