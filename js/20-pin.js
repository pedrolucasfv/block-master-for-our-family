'use strict';
/* PIN DO NOME e PROGRESSO NA NUVEM (Supabase): PIN de 4 números que "fecha" o nome; com ele, estrelas, temas, conquistas e recordes ficam guardados no servidor. Banco: supabase/pin-e-progresso.sql */
/* Ao acertar o PIN, o servidor dá um token (senha longa) que fica em ddb_pins {nome em minúsculas: token} e vai em todo pedido (cabeçalho x-pin, em rkFetch).
   O progresso é juntado sempre pelo melhor dos dois lados (estrela maior, tema ganho em qualquer um, recorde maior): nunca se perde nada. */
const pinChave=()=>myNick().toLowerCase();
function pinSalvar(chave,tok){ const m=store.get('ddb_pins',{}); if(tok) m[chave]=tok; else delete m[chave]; store.set('ddb_pins',m); }
function pinEstado(){ return rkFetch('rpc/pin_estado',{body:{p_nome:myNick()}}); }
/* o servidor recusou o token (PIN trocado em outro aparelho ou apagado): pede o PIN de novo */
function pinPerdeu(){ if(!pinTok()) return; pinSalvar(pinChave(),''); toast('🔒 O PIN do seu nome mudou. Entre de novo no Perfil.'); pinRender(); }

/* ===================== janela do PIN ===================== */
/* modo: 'entrar' (nome já tem PIN), 'criar' (nome ainda sem PIN) ou 'trocar'. ok: chamado depois de dar certo */
function pinAbrir(modo,ok){
  const nome=myNick(); if(!nome){ toast('Coloque seu nome no Perfil primeiro'); return; }
  const campo=(id,ph)=>`<input class="code pin" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="${ph}">`;
  const txt={entrar:`<h2>🔒 PIN de ${esc(nome)}</h2><p class="muted">Esse nome tem PIN. Digite os 4 números para entrar e trazer seu progresso para este aparelho.</p>${campo('pinA','• • • •')}`,
    criar:`<h2>🔒 Criar PIN de ${esc(nome)}</h2><p class="muted">Com o PIN, ninguém mais usa o seu nome, e suas estrelas, temas, conquistas e recordes ficam guardados na nuvem. Trocou de celular? É só pôr o nome e o PIN.</p>${campo('pinA','4 números')}${campo('pinB','repita o PIN')}<p class="muted" style="font-size:12px">Escolha um que você lembre e não conte para ninguém.</p>`,
    trocar:`<h2>🔒 Trocar o PIN</h2><p class="muted">Os outros aparelhos onde você entrou vão pedir o PIN novo.</p>${campo('pinA','PIN novo')}${campo('pinB','repita o PIN novo')}`}[modo];
  openEnd(txt+'<p class="muted" id="pinMsg" style="min-height:1.3em;margin-top:8px"></p>'+(modo==='entrar'?'<p class="muted" style="font-size:12px">Esqueceu? Peça para quem cuida do jogo apagar o PIN do seu nome.</p>':''),
    [{t:modo==='entrar'?'Entrar':modo==='criar'?'Criar PIN':'Trocar',cls:'primary',on:()=>pinEnviar(modo,ok)},{t:'Agora não',cls:'ghost',on:closeEnd}]);
  const a=$('#pinA'), b=$('#pinB');
  [a,b].forEach(i=>{ if(!i) return; i.addEventListener('input',()=>{ i.value=i.value.replace(/\D/g,'').slice(0,4); if(i.value.length===4){ if(i===a&&b) b.focus(); else pinEnviar(modo,ok); } }); });
  setTimeout(()=>{ if(a) a.focus(); },100);
}
let pinBusy=false;
async function pinEnviar(modo,ok){
  if(pinBusy) return; const a=$('#pinA'), b=$('#pinB'), msg=$('#pinMsg'), pin=a?a.value:'', nome=myNick(), chave=pinChave();
  if(!/^\d{4}$/.test(pin)){ msg.textContent='O PIN tem 4 números.'; a.focus(); return; }
  if(b&&b.value!==pin){ msg.textContent='Os dois PINs ficaram diferentes. Digite de novo.'; b.value=''; b.focus(); return; }
  pinBusy=true; msg.textContent='Conferindo…';
  try{
    if(modo==='trocar'){ await rkFetch('rpc/trocar_pin',{body:{p_nome:nome,p_pin:pin}}); closeEnd(); toast('🔒 PIN trocado!'); pinRender(); return; }
    const r=await rkFetch('rpc/entrar_pin',{body:{p_nome:nome,p_pin:pin,p_novo:modo==='criar'}});
    if(!r||!r.ok){ const e=r&&r.erro;
      msg.textContent=e==='errado'?`PIN errado. ${r.restam==1?'Falta 1 tentativa':'Faltam '+r.restam+' tentativas'} antes de ter que esperar.`
        :e==='espera'?`Muitas tentativas erradas. Espere ${r.minutos} minutos e tente de novo.`
        :e==='tem_pin'?'Esse nome já tem PIN. Use "Entrar com PIN".':e==='sem_pin'?'Esse nome ainda não tem PIN. Crie um.':'Não deu certo. Confira e tente de novo.';
      a.value=''; if(b) b.value=''; a.focus(); return; }
    pinSalvar(chave,r.token); closeEnd();
    /* o que foi recusado enquanto estava sem PIN volta para a fila de envio; o nome e a foto vão de novo */
    const par=store.get('ddb_rkpin',[]), meus=par.filter(x=>String(x.args.p_nome||'').toLowerCase()===chave);
    store.set('ddb_rkpin',par.filter(x=>!meus.includes(x))); if(meus.length){ store.set('ddb_rkq',store.get('ddb_rkq',[]).concat(meus)); rkFlush(); }
    store.set('ddb_rksync',''); store.set('ddb_rkfoto',''); await pinFoto();
    const antes=campTotal(campLoad('solo')), sync=await pgSync(), depois=campTotal(campLoad('solo'));
    toast(modo==='criar'?'🔒 PIN criado! Seu progresso está guardado na nuvem.':!sync?'🔒 Entrou! O progresso vai para a nuvem quando a internet voltar.':depois>antes?`☁️ Progresso recuperado: ${depois} ⭐`:'🔒 Entrou! Progresso em dia.');
    rkSyncMe(); pinRender(); if(ok) ok();
  }catch(e){ msg.textContent=/pin:/.test(e.message)?'O PIN mudou em outro aparelho. Entre de novo.':'Sem internet agora. Tente de novo daqui a pouco.'; if(/pin:/.test(e.message)) pinSalvar(chave,''); }
  finally{ pinBusy=false; }
}
/* aparelho novo: traz a foto do perfil que já estava no servidor */
function pinFoto(){ if(store.get('ddb_photo','')) return Promise.resolve();
  return rkFetch(`jogadores?chave=eq.${encodeURIComponent(pinChave())}&select=foto`).then(r=>{ const f=r&&r[0]&&r[0].foto; if(f) store.set('ddb_photo',f); }).catch(()=>{}); }
/* antes de gravar com o nome (desafios, avisos): se o nome tem PIN e este aparelho não entrou, pede o PIN */
function pinGarantir(cb){
  if(!rkOn()||!myNick()||pinTok()){ cb(); return; }
  pinEstado().then(r=>{ if(r&&r.estado==='com_pin') pinAbrir('entrar',cb); else cb(); }).catch(()=>cb());
}
async function pinSair(){
  if(!confirm('Sair do nome neste aparelho? O progresso continua aqui e na nuvem; para gravar com esse nome de novo, vai precisar do PIN.')) return;
  rkFetch('rpc/sair_pin',{body:{}}).catch(()=>{}); pinSalvar(pinChave(),''); toast('Saiu do nome neste aparelho'); pinRender();
}

/* ===================== quadro no Perfil (Configurações) ===================== */
let pinRT=0;
function pinRender(){
  const box=$('#pinBox'); if(!box) return; box.hidden=!rkOn(); if(!rkOn()) return;
  const nome=myNick(), q=store.get('ddb_pgquando',0);
  const bt=(id,t,cls)=>`<button type="button" class="btn small ${cls||''}" id="${id}">${t}</button>`;
  const poe=(html,ev)=>{ box.innerHTML='<h3 class="pinh">🔒 PIN e progresso na nuvem</h3>'+html; (ev||[]).forEach(([id,f])=>{ const b=$('#'+id); if(b) b.addEventListener('click',f); }); };
  if(!nome){ poe('<p class="muted">Coloque seu apelido acima para criar um PIN e guardar seu progresso na nuvem.</p>'); return; }
  if(pinTok()){ poe(`<p class="muted">✅ <b>${esc(nome)}</b> está protegido com PIN. ☁️ Progresso guardado na nuvem${q?' '+pgQuando(q):''}.</p><div class="row" style="margin-top:8px">${bt('pgNow','☁️ Salvar agora')}${bt('pinTroca','Trocar PIN')}${bt('pinSai','Sair do nome','ghost')}</div>`,
    [['pgNow',()=>{ toast('☁️ Salvando…'); pgSync().then(ok=>{ toast(ok?'☁️ Progresso salvo na nuvem!':'Sem internet agora. Tente de novo daqui a pouco.'); pinRender(); }); }],['pinTroca',()=>pinAbrir('trocar')],['pinSai',pinSair]]); return; }
  poe('<p class="muted">Conferindo…</p>');
  clearTimeout(pinRT); pinRT=setTimeout(()=>pinEstado().then(r=>{ if(nome!==myNick()) return;
    if(r&&r.estado==='com_pin') poe(`<p class="muted">Esse nome já tem PIN. Se é você, entre com o PIN para trazer seu progresso para este aparelho. Se não é, escolha outro apelido.</p><div class="row" style="margin-top:8px">${bt('pinIn','🔒 Entrar com PIN','primary')}</div>`,[['pinIn',()=>pinAbrir('entrar')]]);
    else poe(`<p class="muted">Crie um PIN de 4 números para ninguém usar o seu nome e para guardar estrelas, temas, conquistas e recordes na nuvem. Trocou de celular? É só pôr o nome e o PIN.</p><div class="row" style="margin-top:8px">${bt('pinNew','🔒 Criar PIN','primary')}</div>`,[['pinNew',()=>pinAbrir('criar')]]);
  }).catch(()=>poe('<p class="muted">Sem internet agora. O PIN e a nuvem aparecem aqui quando a internet voltar.</p>')),400);
}
function pgQuando(t){ const m=Math.round((Date.now()-t)/60000); return m<1?'agora mesmo':m<60?`há ${m} min`:m<1440?`há ${Math.round(m/60)} h`:`em ${new Date(t).toLocaleDateString('pt-BR')}`; }

/* ===================== progresso na nuvem ===================== */
/* chaves guardadas: as de PG_KEYS (02-core.js), sem o "ddb_" */
function pgLocal(){ const o={}; PG_KEYS.forEach(k=>{ const v=store.get(k,null); if(v!=null) o[k.slice(4)]=v; }); return o; }
/* junta dois valores pegando o melhor: número maior, lista com tudo, sim ganha de não */
function pgJunta(a,b){
  if(a==null) return b; if(b==null) return a;
  if(typeof a==='number'&&typeof b==='number') return Math.max(a,b);
  if(typeof a==='boolean'||typeof b==='boolean') return !!a||!!b;
  if(Array.isArray(a)&&Array.isArray(b)) return [...new Set([...a,...b])];
  if(typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){ const o={}; new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>o[k]=pgJunta(a[k],b[k])); return o; }
  return a;
}
/* recorde de fase ({s:estrelas, v:valor}) e Desafio do dia ({score,…}): fica o resultado inteiro melhor, sem misturar dois */
function pgRkMelhor(k,x,y){ if(!x||!y) return x||y; if(x.s!==y.s) return x.s>y.s?x:y;
  const [w,ph]=k.split('-').map(Number), def=CWORLDS[w-1]&&CWD(w).phases[ph-1], menor=!def||def.st.by!=='lines'; return (menor?y.v<x.v:y.v>x.v)?y:x; }
function pgMerge(loc,nuv){
  const m=pgJunta(loc,nuv||{}), por=(key,f)=>{ const a=loc[key]||{}, b=(nuv||{})[key]||{}; if(!loc[key]&&!(nuv||{})[key]) return; m[key]={}; new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>m[key][k]=f(k,a[k],b[k])); };
  por('rkbest',pgRkMelhor);
  por('daily',(k,x,y)=>!x||!y?x||y:(y.score>x.score?y:x));
  return m;
}
/* JSON com as chaves em ordem: o banco reordena as chaves, então compara assim */
function pgTxt(v){ return Array.isArray(v)?'['+v.map(pgTxt).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+pgTxt(v[k])).join(',')+'}':JSON.stringify(v); }
let pgAplicando=false;
/* grava no aparelho o que veio da nuvem e libera os temas ganhos */
function pgAplicar(m){
  let mudou=false; pgAplicando=true;
  try{ PG_KEYS.forEach(k=>{ const v=m[k.slice(4)]; if(v!=null&&pgTxt(v)!==pgTxt(store.get(k,null))){ store.set(k,v); mudou=true; } });
    if(mudou){ (m.won||[]).forEach(k=>unlockSkin(k)); if(m.bear) unlockSkin('bear'); (m.gold||[]).forEach(k=>unlockGold(k)); } }finally{ pgAplicando=false; }
  if(!mudou) return false;
  if($('#home').classList.contains('active')) renderHome(); else if($('#settings').classList.contains('active')) renderSettings();
  return true;
}
let pgBusy=false, pgT=0, pgMais=false;
/* algo do progresso mudou (store.set de uma chave de PG_KEYS): manda daqui a pouco */
function pgAgendar(){ if(pgAplicando||!rkOn()||!pinTok()) return; clearTimeout(pgT); pgT=setTimeout(pgSync,4000); }
/* lê a nuvem, junta com o aparelho, grava nos dois. Se outro celular gravou no meio, junta de novo e tenta outra vez. Responde true se deu certo. */
async function pgSync(){
  if(!rkOn()||!pinTok()) return false; if(pgBusy){ pgMais=true; return false; }
  pgBusy=true; const nome=myNick();
  try{
    let r=await rkFetch('rpc/ler_progresso',{body:{p_nome:nome}});
    for(let i=0;i<5;i++){
      const m=pgMerge(pgLocal(),r.dados); pgAplicar(m);
      if(r.dados&&pgTxt(m)===pgTxt(r.dados)) break;
      const s=await rkFetch('rpc/salvar_progresso',{body:{p_nome:nome,p_dados:m,p_rev:r.rev||0}});
      if(s&&s.ok) break; r={dados:s&&s.dados,rev:s&&s.rev};
    }
    store.set('ddb_pgquando',Date.now()); return true;
  }catch(e){ if(/pin:/.test(e.message)) pinPerdeu(); return false; }
  finally{ pgBusy=false; if(pgMais){ pgMais=false; pgAgendar(); } }
}
/* ao abrir o jogo: com PIN, sincroniza; sem PIN, convida (uma vez por dia) ou pede o PIN se o nome já tem */
function pinInicio(){
  if(!rkOn()||!myNick()) return;
  if(pinTok()){ pgSync(); return; }
  const livre=()=>$('#home').classList.contains('active')&&!$('#end').classList.contains('show');
  pinEstado().then(r=>{ if(!r||!livre()||pinTok()) return;
    if(r.estado==='com_pin') pinAbrir('entrar');
    else if(store.get('ddb_pinconvite','')!==diaBR()){ store.set('ddb_pinconvite',diaBR()); pinAbrir('criar'); } }).catch(()=>{});
}
if(rkOn()){ setTimeout(pinInicio,3500); window.addEventListener('online',()=>{ if(pinTok()) pgAgendar(); }); }
