'use strict';
/* modo SOZINHO e fluxo offline (códigos, tela de pronto) */
/* ===================== SOZINHO ===================== */
const ACH=[
  ['first','🧱','Primeira linha','Feche uma linha',s=>s.lines>=1],
  ['c3','🔥','Pegando fogo','Combo x3',s=>s.bestCombo>=3],
  ['c6','☄️','Imparável','Combo x6',s=>s.bestCombo>=6],
  ['c10','🌋','Lenda do combo','Combo x10',s=>s.bestCombo>=10],
  ['s1','⭐','Mil pontos','1.000 numa partida',s=>s.bestScore>=1000],
  ['s5','🌟','Cinco mil','5.000 numa partida',s=>s.bestScore>=5000],
  ['s10','💫','Dez mil','10.000 numa partida',s=>s.bestScore>=10000],
  ['l20','📏','Faxina','20 linhas numa partida',s=>s.bestLines>=20],
  ['perf','✨','Tabuleiro limpo','Deixe o tabuleiro vazio',s=>s.perfects>=1],
  ['g10','🎮','Não para mais','10 partidas sozinho',s=>s.games>=10],
  ['t100','🏗️','Cem linhas','100 linhas no total',s=>s.lines>=100],
  ['t1k','🏙️','Mil linhas','1.000 linhas no total',s=>s.lines>=1000]
];
function soloStats(){ return Object.assign({games:0,lines:0,perfects:0,bestLines:0,bestCombo:0,bestScore:0,ach:[]},store.get('ddb_solo',{})); }
function achHTML(a){ const got=soloStats().ach.includes(a[0]); return `<div class="ach ${got?'got':''}"><i>${a[1]}</i><div><b>${a[2]}</b><small>${a[3]}</small></div></div>`; }
function soloRecord(d){
  const st=soloStats(), broke=[];
  if(d.eng.maxCombo>st.bestCombo&&st.games) broke.push('maior combo: x'+d.eng.maxCombo);
  if(d.eng.lines>st.bestLines&&st.games) broke.push('mais linhas: '+d.eng.lines);
  st.games++; st.lines+=d.eng.lines; st.perfects+=d.perfects||0;
  st.bestLines=Math.max(st.bestLines,d.eng.lines); st.bestCombo=Math.max(st.bestCombo,d.eng.maxCombo); st.bestScore=Math.max(st.bestScore,d.score);
  const un=ACH.filter(a=>!st.ach.includes(a[0])&&a[4](st)); un.forEach(a=>st.ach.push(a[0]));
  store.set('ddb_solo',st); d.broke=broke; d.unlocked=un;
}
let soloOpts=Object.assign(defOpts(),{time:3,npc:0,attacks:true,pblocks:true,powers:true},store.get('ddb_soloOpts',{}));
function soloSeg(el,key,labels,order){
  el.innerHTML=(order||labels.map((_,i)=>i)).map(i=>`<button type="button" data-v="${i}" class="${soloOpts[key]===i?'sel':''}">${labels[i]}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ soloOpts[key]=+b.dataset.v; store.set('ddb_soloOpts',soloOpts); renderSolo(); }));
}
function renderSolo(){
  soloSeg($('#soloTime'),'time',TIME_L,TIME_ORDER_LOCAL); soloSeg($('#soloPlay'),'play',PLAYS); soloSeg($('#soloNpc'),'npc',NPC_L); renderNpcBox();
  const b=getBest('solo',soloOpts);
  $('#soloBestLine').textContent=(b?`Seu recorde neste modo: ${fmtN(b)}.`:'Nenhuma partida neste modo ainda.')+(soloOpts.time===6?' '+rampTxt(rampOf(soloOpts)):soloOpts.time===3?' Sem relógio: joga até não caber mais peça.':' Faça o máximo de pontos antes do tempo acabar.');
  $('#soloRamp').hidden=soloOpts.time!==6; if(soloOpts.time===6) rampEditor($('#soloRamp'),soloOpts,false,()=>{ store.set('ddb_soloOpts',soloOpts); renderSolo(); });
  if(!$('#soloMods').dataset.built){ buildOpts($('#soloMods'),soloOpts,'solo'); $('#soloMods').dataset.built=1;
    $('#soloMods').addEventListener('click',()=>setTimeout(()=>store.set('ddb_soloOpts',soloOpts),0)); }
  const st=soloStats();
  $('#soloStats').innerHTML=[[st.games,'partidas'],[fmtN(st.bestScore),'melhor pontuação'],[st.bestCombo?'x'+st.bestCombo:'0','maior combo'],[st.bestLines,'linhas numa partida'],[fmtN(st.lines),'linhas no total'],[st.perfects,'tabuleiros limpos']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('');
  const bs=store.get('ddb_bests',{}), ks=Object.keys(bs).filter(k=>k.startsWith('sozinho|')).sort((x,y)=>bs[y]-bs[x]);
  $('#soloBests').innerHTML=ks.map(k=>`<div class="kv"><span>${timeName(+k.split('|')[1])} · ${PLAYS[+k.split('|')[2]]}</span><b>${fmtN(bs[k])}</b></div>`).join('');
  $('#achCount').textContent=`${st.ach.length}/${ACH.length}`;
  $('#achList').innerHTML=ACH.map(achHTML).join('');
}
function openSolo(){ renderSolo(); show('solo'); }
function startSolo(o){
  ac(); const opts={...o,npc:0,attacks:false,pblocks:false,powers:false,cabo:false};
  startDuel({type:'solo',opts,seed:'S|'+Date.now()+'|'+Math.random().toString(36).slice(2),label:'Sozinho · '+timeName(opts.time)+(opts.play?' · '+PLAYS[opts.play]:'')});
}
/* teste das vozes (Configurações): a linha de baixo fica sempre com um buraco e a bandeja só com pecinhas de 1 casa; cada pecinha no buraco é +1 no combo */
function vtPeca(){ return {cells:[[0,0]],color:Math.floor(Math.random()*NCOL),spec:null,pw:null,h:1,w:1}; }
function vtBloco(){ return {c:Math.floor(Math.random()*NCOL),s:null,t:0}; }
function vtPrep(){
  const b=D.eng.b, y=N-1;
  if(!b[0][0]) b[0][0]=vtBloco(); /* um bloco no canto: limpar a linha de baixo não deixa o tabuleiro vazio */
  if(b[y].filter(Boolean).length<N-1){ const gap=Math.floor(Math.random()*N); for(let x=0;x<N;x++) b[y][x]=x===gap?null:(b[y][x]||vtBloco()); }
  D.tray=D.tray.map(p=>p||vtPeca());
}
function vtCombo(n){ if(!D||!D.cfg.vtest) return; if(NARR.ctx!==D) NARR={ctx:D,c:0,desistiu:false};
  D.eng.combo=n; D.eng.since=0; NARR.c=n; NARR.desistiu=n>=20; renderDuel(); toast(`Combo x${n}: a próxima pecinha no buraco faz x${n+1}`); }
function vozTeste(){
  ac(); loadVoices(); if(SET.voiceMode==='off'){ SET.voiceMode='std'; saveSet(); }
  startDuel({type:'solo',vtest:true,opts:{...defOpts(),time:3},seed:'V|'+Date.now(),label:'🧪 Teste das vozes'});
  D.tray=[null,null,null]; vtPrep(); renderDuel(true);
  $('#subTxt').textContent='Pecinha no buraco de baixo = +1 no combo'; setStatus('Fora do buraco 3 vezes seguidas, o combo quebra');
  vtBotoes();
}
function vtBotoes(){
  bossHide(); setActions(`<button class="chip" id="vt7">⏩ x7</button><button class="chip" id="vt15">⏩ x15</button><button class="chip" id="vt19">⏩ x19</button><button class="chip" id="vtLimpo">🧹 Tabuleiro limpo</button><button class="chip" id="vtChefes">👹 Chefões</button>`);
  [7,15,19].forEach(n=>$('#vt'+n).addEventListener('click',()=>vtCombo(n)));
  $('#vtLimpo').addEventListener('click',()=>{ if(!D||!D.cfg.vtest) return; const b=D.eng.b; for(let y=0;y<N-1;y++) b[y].fill(null); vtPrep(); b[0][0]=null; renderDuel(); toast('Agora a pecinha no buraco limpa o tabuleiro inteiro'); });
  $('#vtChefes').addEventListener('click',vtChefes);
}
/* testar os chefões: escolhe um e toca a chegada, o ataque, o bravo e a derrota (com animação e fala) */
function vtChefes(){
  bossHide(); setActions(Object.keys(BOSSES).map(id=>`<button class="chip" data-vtc="${id}">${BOSSES[id].name}</button>`).join('')+`<button class="chip" id="vtVoltar">↩ Voltar</button>`);
  $$('#actions [data-vtc]').forEach(b=>b.addEventListener('click',()=>vtChefe(b.dataset.vtc)));
  $('#vtVoltar').addEventListener('click',vtBotoes);
}
const VT_ACAO={enter:'👋 Chegada',attack:'💥 Ataque',rage:'😡 Bravo',defeat:'💀 Derrota'};
function vtChefe(id){
  ac(); const B=BOSSES[id]; let bravo=false;
  setActions(Object.keys(VT_ACAO).map(m=>`<button class="chip" data-vta="${m}">${VT_ACAO[m]}</button>`).join('')+`<button class="chip" id="vtTroca">👹 Outro chefão</button><button class="chip" id="vtVoltar">↩ Voltar</button>`);
  const vai=m=>bossPrep(id).then(()=>{ if(!D||!D.cfg.vtest) return; BOSS_ID=id; if(m==='enter') bravo=false; if(m==='rage') bravo=true;
    bossDock(bravo); bossShow(m,{rage:bravo}); const f=B.say[{enter:'enter',attack:bravo?'atkRage':'atk',rage:'rage',defeat:'defeat'}[m]];
    if(f) setTimeout(()=>bossSay(f,1600),300); });
  $$('#actions [data-vta]').forEach(b=>b.addEventListener('click',()=>vai(b.dataset.vta)));
  $('#vtTroca').addEventListener('click',vtChefes); $('#vtVoltar').addEventListener('click',vtBotoes);
  vai('enter');
}
function renderHome(){
  const st=soloStats(), el=$('#homeBest'); if(!el) return;
  el.innerHTML=st.games?`<div><b>${fmtN(st.bestScore)}</b><span>seu recorde</span></div><div><b>${st.bestCombo?'x'+st.bestCombo:'0'}</b><span>maior combo</span></div><div><b>${st.ach.length}/${ACH.length}</b><span>conquistas</span></div>`
    :`<div class="muted" style="padding:2px 4px">Jogue sozinho para começar a juntar recordes e conquistas.</div>`;
  const dl=store.get('ddb_daily',{}), hj=dl[diaBR()+'|R'], sq=dailyStreak(), sub=$('#goDailySub');
  if(sub) sub.textContent=(hj?`✓ jogado hoje: ${fmtN(hj.score)} pts · veja o ranking`:'mesmas peças para todo mundo · vale até meia-noite')+(sq>1?` · 🔥 ${sq} dias seguidos`:'');
}
/* dias seguidos jogando o Desafio do dia (conta até hoje, ou até ontem se ainda não jogou hoje) */
function dailyStreak(){ const dl=store.get('ddb_daily',{}), back=k=>{ const [y,m,dd]=k.split('-').map(Number); return todayKey(new Date(y,m-1,dd-1)); };
  let d=diaBR(), n=0; if(!dl[d+'|R']) d=back(d); while(dl[d+'|R']){ n++; d=back(d); } return n; }
$('#goSolo').addEventListener('click',openSolo);
$('#soloStart').addEventListener('click',()=>{ store.set('ddb_soloOpts',soloOpts); if(soloOpts.npc) startNpc(soloOpts); else startSolo(soloOpts); });
$('#goWith').addEventListener('click',()=>{ renderNight(); show('with'); });

/* ===================== fluxo offline ===================== */
let setup={type:'duel',opts:defOpts(),norm:'',code:'',round:1,created:true,ser:{me:0,other:0}};
let createOpts=Object.assign(defOpts(),store.get('ddb_lastOpts',{}));
$('#goCreate').addEventListener('click',()=>{ buildOpts($('#createOpts'),createOpts,'duel'); show('create'); });
$('#btnCreate').addEventListener('click',()=>{
  ac(); store.set('ddb_lastOpts',createOpts);
  const c=makeCode(createOpts);
  setup={type:'duel',opts:c.opts,norm:c.norm,code:c.pretty,round:1,created:true,ser:{me:0,other:0}};
  showReady();
});
function join(){
  ac(); const n=normCode($('#codeIn').value); const c=parseCode(n);
  if(!c){ $('#joinErr').textContent='Código inválido. Ele tem este formato: SOL-0K2A-37.'; return; }
  $('#joinErr').textContent=''; $('#codeIn').blur();
  setup={type:'duel',opts:c.opts,norm:c.norm,code:c.pretty,round:1,created:false,ser:{me:0,other:0}};
  showReady();
}
$('#btnJoin').addEventListener('click',join);
$('#codeIn').addEventListener('keydown',e=>{ if(e.key==='Enter') join(); });
$('#codeIn').addEventListener('input',()=>$('#joinErr').textContent='');
function showReady(){
  $('#readyResult').innerHTML=''; $('#btnStart').hidden=false;
  if(setup.type==='daily'){
    /* no lugar do código, a data por extenso; as regras do tempo viram etiquetas */
    const [dy,dm,dd]=setup.key.split('|')[0].split('-').map(Number), sq=dailyStreak();
    $('#ready').classList.add('dailyr');
    $('#readyTitle').textContent='📅 Desafio do dia'; $('#readyCode').textContent=`${['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][new Date(dy,dm-1,dd).getDay()]}, ${dd} de ${RK_MES[dm-1]}`;
    $('#readyChips').innerHTML=['Clássico',`⏱ 0–${RAMP[0][0]/60} min livre`,...RAMP.map(([t,x])=>`${t/60} min: ${x} s/peça`)].map(s=>`<span>${s}</span>`).join('');
    $('#readySeries').innerHTML=sq?`<span class="streak">🔥 ${sq} ${sq>1?'dias seguidos':'dia'}</span>`:'';
    const done=store.get('ddb_daily',{})[setup.key];
    if(done){
      $('#readyHint').textContent='Você já jogou o desafio de hoje. Volte amanhã para um novo.';
      $('#readyResult').innerHTML=`<div class="card"><div class="endscore">${fmtN(done.score)}</div><p class="muted">${done.lines} linhas · combo x${done.combo}</p><button class="btn" id="dailyShare">Compartilhar resultado</button></div>`;
      $('#btnStart').hidden=true;
      $('#dailyShare').addEventListener('click',()=>{ let t=`Duelo de Blocos · Desafio do dia ${dailyCode(setup.key)}\n${fmtN(done.score)} pontos · ${done.lines} linhas · combo x${done.combo}\nConsegue bater?`; const l=gameLink(); if(l) t+='\n'+l; shareText(t); });
    } else $('#readyHint').textContent='Mesmas peças para todo mundo, uma tentativa por dia. Depois do tempo livre, cada peça tem um tempo que vai apertando.';
    $('#readyResult').insertAdjacentHTML('beforeend','<div id="rkDaily"></div>'); rkDailyBox('#rkDaily',setup.key);
  } else {
    $('#ready').classList.remove('dailyr'); const n=SERIES_N[setup.opts.series], need=Math.ceil(n/2);
    if(n>1&&(setup.ser.me>=need||setup.ser.other>=need)) setup.ser={me:0,other:0};
    $('#readyTitle').textContent='Rodada '+setup.round; $('#readyCode').textContent=setup.code;
    $('#readyChips').innerHTML=summary(setup.opts,'duel').map(s=>`<span>${s}</span>`).join('');
    $('#readySeries').textContent=n>1?`${SERIES_L[setup.opts.series]}: Você ${setup.ser.me} × ${setup.ser.other} Outro`:'';
    $('#readyHint').textContent=setup.round>1?'Peças novas nesta rodada. O outro também precisa tocar em Revanche. Toquem em Começar juntos!':setup.created?'Mostre este código para o outro jogador digitar. As regras vão embutidas no código. Toquem em Começar juntos!':'Confira se o código é igual ao do outro celular e toquem em Começar juntos!';
  }
  show('ready');
}
$('#readyBack').addEventListener('click',()=>show(setup.type==='daily'?'home':'with'));
$('#btnStart').addEventListener('click',()=>{
  ac();
  if(setup.type==='daily') startDuel({type:'daily',opts:setup.opts,seed:'DAILY|'+setup.key,label:'Desafio '+dailyCode(setup.key),code:dailyCode(setup.key),key:setup.key});
  else startDuel({type:'duel',opts:setup.opts,seed:'D|'+setup.norm+'|'+setup.round,label:setup.code+(setup.round>1?' · R'+setup.round:''),code:setup.code});
});
$('#goDaily').addEventListener('click',()=>{ setup={type:'daily',day:diaBR(),round:1,ser:{me:0,other:0}}; setDaily(); showReady(); });
