'use strict';
/* SUGESTÕES da família (Supabase): tela #sug com a lista, a conversa de cada sugestão e o quadro de quem cuida do jogo (ADM, souAdm em 20-pin.js). Banco: supabase/sugestoes-e-nomes.sql */
/* etiqueta → [texto, classe da cor] */
const SUG_ET={nova:['Nova','sgn'],analise:['Em análise','sga'],pergunta:['Pergunta','sgp'],vai:['Vai entrar','sgv'],feita:['Implementada','sgf'],nao:['Não vai entrar','sgx']};
const SUG_AS={pecas:'Peças e tabuleiro',visual:'Visual e temas',campanha:'Campanha',junto:'Jogar junto',erro:'Algo deu errado',outro:'Outra coisa'};
/* lista: sugestões (null = carregando); curti: as que eu curti; id: a aberta (0 = lista); msgs: conversa da aberta; et: etiqueta escolhida no quadro do ADM */
const SG={lista:null,curti:new Set(),aba:'todas',id:0,msgs:null,erro:false,et:'',busy:false};
const sugEu=()=>myNick().toLowerCase();
const sugMeu=s=>!!myNick()&&s.chave===sugEu();
const sugNome=x=>(x&&x.jogadores&&x.jogadores.nome)||'Alguém';
function sugTag(s,et){ const k=et||s.etiqueta, e=SUG_ET[k]||SUG_ET.nova; return `<span class="sgtag ${e[1]}">${e[0]}${!et&&k==='feita'&&s.versao?' · '+esc(s.versao):''}</span>`; }
function sugErro(e){ const m=String(e&&e.message||'');
  return /pin:/.test(m)?'Entre com o PIN do seu nome no Perfil e tente de novo.':/muitas hoje/.test(m)?'Você já mandou muitas sugestões hoje. Tente amanhã!'
    :/nome:/.test(m)?'Esse apelido não pode ser usado. Troque no Perfil.':/escreva o motivo/.test(m)?'Escreva o motivo ou a pergunta.':/ranking 4/.test(m)?'Não deu certo. Confira e tente de novo.':'Sem internet agora. Tente de novo daqui a pouco.'; }

/* abre a tela (id: já abre aquela sugestão, vindo de um aviso) */
function sugTela(id){ show('sug'); SG.id=id||0; SG.msgs=null; SG.et=''; sugRender(); admConferir().then(sugRender); sugCarregar(); }
async function sugCarregar(){
  if(!rkOn()){ SG.erro=true; sugRender(); return; }
  try{
    const eu=myNick()?encodeURIComponent(sugEu()):'';
    const [l,c]=await Promise.all([rkFetch('sugestoes?select=*,jogadores(nome)&order=atualizado.desc&limit=200'),eu?rkFetch(`sugestao_curtidas?chave=eq.${eu}&select=sug`):Promise.resolve([])]);
    SG.lista=l||[]; SG.curti=new Set((c||[]).map(x=>x.sug)); SG.erro=false;
    if(SG.id) await sugMsgs(SG.id);
  }catch(e){ SG.erro=true; }
  sugRender(); sugPonto();
}
async function sugMsgs(id){ const m=await rkFetch(`sugestao_msgs?sug=eq.${id}&select=*,jogadores(nome)&order=quando.asc`); if(SG.id===id) SG.msgs=m||[]; }
async function sugAbrir(id){ SG.id=id; SG.msgs=null; SG.et=''; sugRender(); window.scrollTo(0,0); try{ await sugMsgs(id); }catch(e){ SG.msgs=[]; } sugRender(); }
function sugVoltar(){ if(SG.id){ SG.id=0; SG.msgs=null; sugRender(); return; } show('home'); sugPontoLoad(); }

/* ===================== lista ===================== */
function sugRender(){
  const el=$('#sugBody'); if(!el||!$('#sug').classList.contains('active')) return;
  if(SG.id){ sugRenderUma(el); return; }
  const adm=souAdm(), eu=sugEu(), L=SG.lista||[], resp=s=>s.etiqueta==='nova'||s.etiqueta==='analise';
  const abas=[['todas','Todas'],['minhas','Minhas'],['feitas','Já no jogo']].concat(adm?[['resp','Para responder']]:[]);
  if(!abas.some(a=>a[0]===SG.aba)) SG.aba='todas';
  const conta={minhas:L.filter(s=>s.chave===eu&&s.etiqueta==='pergunta').length,resp:L.filter(resp).length};
  const f={todas:()=>true,minhas:s=>s.chave===eu,feitas:s=>s.etiqueta==='feita',resp}[SG.aba];
  let corpo;
  if(SG.erro&&!SG.lista) corpo='<p class="muted tcenter">Sem internet agora. As sugestões aparecem aqui quando a internet voltar.</p>';
  else if(!SG.lista) corpo='<p class="muted tcenter">Carregando…</p>';
  else { const v=L.filter(f);
    corpo=v.length?'<div class="sglist">'+v.map(sugCartao).join('')+'</div>':`<p class="muted tcenter">${{minhas:'Você ainda não mandou nenhuma sugestão. Toque em “💡 Nova” e conte sua ideia!',feitas:'Nenhuma sugestão entrou no jogo ainda.',resp:'Nada esperando resposta. 🎉'}[SG.aba]||'Nenhuma sugestão ainda. Mande a primeira!'}</p>`; }
  el.innerHTML=`<div class="sgtop"><h1>Sugestões</h1><button type="button" class="btn primary small" id="sugNovaB">💡 Nova</button></div>
    <p class="muted">Ideias da família para o jogo. Quem cuida do jogo responde e você recebe um aviso.</p>
    <div class="sgabas">${abas.map(([k,t])=>`<button type="button" class="chip${SG.aba===k?' sel':''}" data-aba="${k}">${t}${conta[k]?`<i class="sgnum">${conta[k]}</i>`:''}</button>`).join('')}</div>${corpo}`;
  $('#sugNovaB').addEventListener('click',sugNova);
  el.querySelectorAll('[data-aba]').forEach(b=>b.addEventListener('click',()=>{ SG.aba=b.dataset.aba; sugRender(); }));
  el.querySelectorAll('.sgcard').forEach(b=>b.addEventListener('click',()=>sugAbrir(+b.dataset.id)));
}
function sugCartao(s){
  const meu=sugMeu(s), perg=meu&&s.etiqueta==='pergunta';
  const linha=s.etiqueta==='nao'&&s.motivo?`<span class="sgmot">Motivo:</span> ${esc(s.motivo)}`:perg?'Tem uma pergunta para você. Toque para responder.':esc(s.texto);
  return `<button type="button" class="sgcard${perg?' eu':''}" data-id="${s.id}"><span class="sghd">${sugTag(s)}<small>${avAgo(s.atualizado)}</small></span><b>${esc(s.titulo)}</b>${linha?`<p>${linha}</p>`:''}<small>${esc(sugNome(s))}${meu?' (você)':''} · ${s.curtidas==1?'1 curtida':`${s.curtidas} curtidas`}</small></button>`;
}

/* ===================== uma sugestão: conversa, resposta e quadro do ADM ===================== */
function sugRenderUma(el){
  const s=(SG.lista||[]).find(x=>x.id===SG.id);
  if(!s){ el.innerHTML=`<p class="muted tcenter">${SG.lista?'Essa sugestão não existe mais.':SG.erro?'Sem internet agora. Tente de novo daqui a pouco.':'Carregando…'}</p>`; return; }
  const adm=souAdm(), meu=sugMeu(s), nome=sugNome(s), curti=SG.curti.has(s.id), dia=t=>new Date(t).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  const msgs=SG.msgs==null?'<p class="muted tcenter">Carregando a conversa…</p>':SG.msgs.map(m=>{
    const quem=esc(sugNome(m)), ev=m.etiqueta?`<p class="sgev">${quem} mudou para ${sugTag(s,m.etiqueta)} · ${dia(m.quando)}</p>`:'';
    const tipo=m.adm?(m.etiqueta==='pergunta'?'pergunta':m.etiqueta==='nao'?'motivo':'resposta'):'';
    return ev+(m.texto?`<div class="sgmsg${m.adm?'':' dir'}"><em>${quem}${tipo?' · '+tipo:''}</em>${esc(m.texto)}<small>${avAgo(m.quando)}</small></div>`:''); }).join('');
  const caixa=s.etiqueta==='nao'&&s.motivo?`<div class="sgbox sgx"><b>Não vai entrar.</b> Motivo: ${esc(s.motivo)}</div>`
    :s.etiqueta==='feita'?`<div class="sgbox sgf">🎉 Já está no jogo${s.versao?` desde a versão ${esc(s.versao)}`:''}!</div>`
    :meu&&s.etiqueta==='pergunta'?'<div class="sgbox sgp">Tem uma pergunta para você. Quando responder, a etiqueta volta para “Em análise” e quem cuida do jogo recebe um aviso.</div>':'';
  const responde=meu&&!adm?`<label class="muted sglbl" for="sugResp">${s.etiqueta==='pergunta'?'Sua resposta':'Quer contar mais alguma coisa?'}</label><textarea class="sgta" id="sugResp" maxlength="600"></textarea><div class="row"><button type="button" class="btn primary" id="sugRespB">Enviar resposta</button></div>`:'';
  if(!SG.et) SG.et=s.etiqueta==='nova'?'analise':s.etiqueta;
  const quadro=adm?`<div class="card sgadm"><h3>⭐ Responder como quem cuida do jogo</h3><div class="sgchips">${['analise','pergunta','vai','feita','nao'].map(k=>`<button type="button" class="sgtag ${SUG_ET[k][1]}" data-et="${k}">${k==='pergunta'?'Fazer pergunta':SUG_ET[k][0]}</button>`).join('')}</div>
    <label class="muted sglbl" for="sugAdmTxt" id="sugAdmLbl"></label><textarea class="sgta" id="sugAdmTxt" maxlength="600"></textarea>
    <div id="sugVerRow"><label class="muted sglbl" for="sugVer">Versão em que entrou</label><input class="code nick" id="sugVer" maxlength="12" value="${esc(s.versao||VERSAO)}"></div>
    <div class="row"><button type="button" class="btn primary" id="sugAdmOk"></button></div><button type="button" class="btn small ghost" id="sugApagar">🗑 Apagar sugestão</button></div>`:'';
  el.innerHTML=`<div class="sghd">${sugTag(s)}<button type="button" class="chip sglike${curti?' on':''}" id="sugLike" aria-pressed="${curti}">👍 ${s.curtidas}</button></div>
    <h1 class="sgtit">${esc(s.titulo)}</h1>${s.texto?`<p class="sgtxt">${esc(s.texto)}</p>`:''}
    <p class="muted" style="font-size:13px">${esc(nome)}${meu?' (você)':''} · ${esc(SUG_AS[s.assunto]||SUG_AS.outro)} · ${dia(s.criado)}</p>
    ${caixa}<div class="sgmsgs">${msgs}</div>${responde}${quadro}`;
  $('#sugLike').addEventListener('click',()=>sugCurtir(s));
  const rb=$('#sugRespB'); if(rb) rb.addEventListener('click',()=>{ const t=$('#sugResp').value.trim(); if(!t){ toast('Escreva sua resposta'); return; } sugFalar(s.id,t); });
  if(adm){
    $$('#sugBody [data-et]').forEach(b=>b.addEventListener('click',()=>{ SG.et=b.dataset.et; sugAdmAtualizar(s); }));
    $('#sugAdmOk').addEventListener('click',()=>sugAdmSalvar(s));
    $('#sugApagar').addEventListener('click',()=>sugApagar(s));
    sugAdmAtualizar(s);
  }
}
/* troca só o que muda com a etiqueta escolhida (sem apagar o que já foi escrito) */
function sugAdmAtualizar(s){
  const et=SG.et, mesma=et===s.etiqueta, nome=sugNome(s);
  $$('#sugBody [data-et]').forEach(b=>{ b.classList.toggle('sel',b.dataset.et===et); b.setAttribute('aria-pressed',b.dataset.et===et); });
  $('#sugAdmLbl').textContent=et==='pergunta'?'Sua pergunta (obrigatória)':et==='nao'?'Motivo (obrigatório)':mesma?'Mensagem':'Recado (se quiser)';
  $('#sugVerRow').hidden=et!=='feita';
  $('#sugAdmOk').textContent=mesma&&et!=='pergunta'?'Enviar mensagem':sugMeu(s)?'Salvar':`Salvar e avisar ${nome}`;
}
async function sugAdmSalvar(s){
  if(SG.busy) return; const et=SG.et, txt=$('#sugAdmTxt').value.trim(), ver=$('#sugVer').value.trim();
  if((et==='pergunta'||et==='nao')&&!txt){ toast(et==='nao'?'Escreva o motivo: quem sugeriu vai ler':'Escreva a pergunta'); $('#sugAdmTxt').focus(); return; }
  const soMsg=et===s.etiqueta&&et!=='pergunta';
  if(soMsg&&!txt){ toast('Escreva a mensagem ou escolha outra etiqueta'); return; }
  SG.busy=true;
  try{
    if(soMsg) await rkFetch('rpc/sugestao_falar',{body:{p_nome:myNick(),p_id:s.id,p_texto:txt}});
    else await rkFetch('rpc/sugestao_etiqueta',{body:{p_id:s.id,p_etiqueta:et,p_texto:txt,p_versao:et==='feita'?ver:null}});
    toast(sugMeu(s)?'✅ Salvo!':`✅ Salvo! ${sugNome(s)} vai receber um aviso.`); SG.et=''; await sugCarregar();
  }catch(e){ toast(sugErro(e)); }finally{ SG.busy=false; }
}
async function sugApagar(s){
  if(!confirm(`Apagar a sugestão “${s.titulo}”? A conversa também some.`)) return;
  try{ await rkFetch('rpc/sugestao_apagar',{body:{p_id:s.id}}); toast('Sugestão apagada'); SG.id=0; await sugCarregar(); }catch(e){ toast(sugErro(e)); }
}
function sugFalar(id,txt){
  if(SG.busy) return;
  dsNeedNick(async()=>{ SG.busy=true;
    try{ await rkFetch('rpc/sugestao_falar',{body:{p_nome:myNick(),p_id:id,p_texto:txt}}); toast('✅ Resposta enviada!'); await sugCarregar(); }
    catch(e){ toast(sugErro(e)); }finally{ SG.busy=false; } });
}
function sugCurtir(s){
  dsNeedNick(()=>rkFetch('rpc/sugestao_curtir',{body:{p_nome:myNick(),p_id:s.id}}).then(n=>{
    if(SG.curti.has(s.id)) SG.curti.delete(s.id); else SG.curti.add(s.id); s.curtidas=n; sugRender(); }).catch(e=>toast(sugErro(e))));
}

/* ===================== nova sugestão ===================== */
function sugNova(){
  if(!rkOn()){ toast('Sem internet agora'); return; }
  dsNeedNick(()=>{
    let as='';
    openEnd(`<h2>💡 Nova sugestão</h2><p class="muted">Conte o que você queria mudar ou ter no jogo. Quando alguém responder, chega um aviso e fica no sino 🔔 do menu.</p>
      <label class="muted sglbl" for="sugTit">Em poucas palavras</label><input class="code nick" id="sugTit" maxlength="60" autocomplete="off">
      <label class="muted sglbl" for="sugTxt">Explique melhor (se quiser)</label><textarea class="sgta" id="sugTxt" maxlength="600"></textarea>
      <p class="muted sglbl">É sobre o quê?</p><div class="sgchips">${Object.entries(SUG_AS).map(([k,t])=>`<button type="button" class="chip" data-as="${k}">${t}</button>`).join('')}</div>
      <p class="muted" id="sugMsg" style="min-height:1.3em"></p>`,
      [{t:'Enviar sugestão',cls:'primary',on:()=>sugEnviar(as)},{t:'Cancelar',cls:'ghost',on:closeEnd}]);
    $$('#endBody [data-as]').forEach(b=>b.addEventListener('click',()=>{ as=b.dataset.as; $$('#endBody [data-as]').forEach(x=>x.classList.toggle('sel',x===b)); }));
    setTimeout(()=>{ const i=$('#sugTit'); if(i) i.focus(); },100);
  });
}
async function sugEnviar(as){
  if(SG.busy) return; const tit=$('#sugTit').value.trim(), txt=$('#sugTxt').value.trim(), msg=$('#sugMsg');
  if(tit.length<3){ msg.textContent='Escreva sua ideia em poucas palavras.'; $('#sugTit').focus(); return; }
  SG.busy=true; msg.textContent='Enviando…';
  try{ const id=await rkFetch('rpc/sugerir',{body:{p_nome:myNick(),p_titulo:tit,p_texto:txt,p_assunto:as||'outro'}});
    closeEnd(); toast('💡 Sugestão enviada! Você recebe um aviso quando responderem.'); SG.busy=false; sugTela(+id); }
  catch(e){ msg.textContent=sugErro(e); }finally{ SG.busy=false; }
}

/* ===================== pontinho no botão do menu ===================== */
/* acende quando tem pergunta para mim; para quem cuida do jogo, também quando chegou sugestão nova */
function sugPonto(){ const d=$('#goSugDot'), eu=sugEu(), L=SG.lista; if(!d||!L) return; d.hidden=!L.some(s=>(myNick()&&s.chave===eu&&s.etiqueta==='pergunta')||(souAdm()&&s.etiqueta==='nova')); }
function sugPontoLoad(){
  if(!rkOn()||!myNick()) return; const eu=encodeURIComponent(sugEu());
  Promise.all([rkFetch(`sugestoes?chave=eq.${eu}&etiqueta=eq.pergunta&select=id&limit=1`),souAdm()?rkFetch('sugestoes?etiqueta=eq.nova&select=id&limit=1'):Promise.resolve([])])
    .then(([a,b])=>{ $('#goSugDot').hidden=!((a&&a.length)||(b&&b.length)); }).catch(()=>{});
}
$('#goSug').addEventListener('click',()=>sugTela());
$('#sugBack').addEventListener('click',sugVoltar);
if(rkOn()){ setTimeout(()=>admConferir().then(sugPontoLoad),5000); document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&$('#home').classList.contains('active')) sugPontoLoad(); }); }
