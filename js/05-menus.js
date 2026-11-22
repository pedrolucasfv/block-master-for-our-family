'use strict';
/* partículas, opções e códigos de desafio, placar da noite/histórico/recordes, configurações, perfil */
/* ===================== partículas ===================== */
const pcv=$('#pcv'), pctx=pcv.getContext('2d'); let parts=[], prun=false, DPR=1;
function sizeCanvas(){ DPR=1; pcv.width=innerWidth*DPR; pcv.height=innerHeight*DPR; }
function burst(x,y,color,count,power=1,o={}){
  if(SET.lite) return;
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=(1.2+Math.random()*2.7)*power;
    const pp={x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(o.up??1),g:o.g??.15,life:1,decay:(o.decay??.035)+Math.random()*.02,size:(o.size??CS*.12)*(.6+Math.random()*.6),color,round:!!o.round};
    if(o.sway){ pp.sw=o.sway*(.5+Math.random()); pp.ph=Math.random()*6.28; pp.drag=.94; }
    if(o.spin){ pp.rot=Math.random()*6.28; pp.vr=(Math.random()-.5)*.4; pp.w=o.w||.35; }
    parts.push(pp); }
  if(!prun){ prun=true; requestAnimationFrame(stepParts); }
}
function stepParts(){
  pctx.setTransform(DPR,0,0,DPR,0,0); pctx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life>0&&p.y<innerHeight+60);
  for(const p of parts){ if(p.drag){ p.vx*=p.drag; p.vy*=p.drag; } p.x+=p.vx+(p.sw?Math.sin(p.life*9+p.ph)*p.sw:0); p.y+=p.vy; p.vy+=p.g; p.life-=p.decay; pctx.globalAlpha=Math.max(0,p.life); pctx.fillStyle=p.color;
    if(p.emoji){ pctx.save(); pctx.translate(p.x,p.y); pctx.rotate(p.rot+=p.vr); pctx.font=p.size+'px sans-serif'; pctx.textAlign='center'; pctx.textBaseline='middle'; pctx.fillText(p.emoji,0,0); pctx.restore(); }
    else if(p.round){ pctx.beginPath(); pctx.arc(p.x,p.y,p.size/2,0,6.283); pctx.fill(); }
    else if(p.rot!==undefined){ pctx.save(); pctx.translate(p.x,p.y); pctx.rotate(p.rot+=p.vr); const hw=p.w?p.size*p.w:p.size; pctx.fillRect(-p.size/2,-hw/2,p.size,hw); pctx.restore(); }
    else pctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); }
  pctx.globalAlpha=1;
  if(parts.length) requestAnimationFrame(stepParts); else { prun=false; pctx.clearRect(0,0,innerWidth,innerHeight); }
}

/* ===================== opções e códigos ===================== */
/* 10 e 15 min ficam no fim da lista (o código do desafio só guarda 0 a 3) e só aparecem nos modos conectados */
const TIMES=[120,180,300,0,600,900,0], TIME_L=['2 min','3 min','5 min','Sem limite','10 min','15 min','Sem limite com progressão'];
const TIME_ORDER_NET=[0,1,2,4,5,3,6], TIME_ORDER_LOCAL=[0,1,2,3,6];
/* "Sem limite com progressão" (tempo 6): sem relógio geral, mas o tempo para pôr cada peça vai apertando (RAMP, no 07-duel).
   Só nos modos em que cada um joga no seu tabuleiro (o relógio dos modos de tabuleiro único é outro). */
const RAMP_TYPES=['solo','duel','live','tlive'];
const rampOn=o=>!!o.ramp||o.time===6;
const timeName=t=>TIMES[t]?TIME_L[t]:t===6?TIME_L[6]:'Sem limite';
const PLAYS=['Clássico','Gravidade','Cego','Sem combo'];
const GOALS=[0,500,1000,2000], GOAL_L=['Sem meta','500','1.000','2.000'];
const SERIES_L=['Avulsa','Melhor de 3','Melhor de 5'], SERIES_N=[1,3,5];
const FLAGS=['sudden','obstacles','heavy','color','undo','hold','bomb','ice','wild','final'];
const NETF=['attacks','pblocks','powers','handicap'];
const LABEL={sudden:'Morte súbita',obstacles:'Obstáculos',heavy:'Peças pesadas',color:'Bônus de cor',undo:'Desfazer',hold:'Guardar peça',bomb:'Bomba',ice:'Gelo',wild:'Coringa',final:'Reta final',attacks:'Ataques',pblocks:'Blocos de poder',powers:'Bloco dourado',handicap:'Handicap'};
const HINT={sudden:'5 s para colocar cada peça',obstacles:'blocos cinzas no início',heavy:'só peças grandes',color:'+100 por linha de uma cor só',undo:'desfaz 1 jogada por partida',hold:'guarda 1 peça para depois',bomb:'explode 3x3 ao sumir',ice:'precisa sumir duas vezes',wild:'vale qualquer cor',final:'pontos em dobro nos últimos 30 s',attacks:'3+ linhas mandam blocos blindados (4 linhas = 3 blocos…)',pblocks:'peças com ícone: limpe a linha do ícone para ativar o poder',powers:'aparece um bloco dourado; quem limpar primeiro leva +150',handicap:'quem venceu começa com obstáculos'};
const TYPES={camp:'Campanha',live:'Duelo ao vivo',coop:'Co-op',halves:'Co-op dividido',versus:'Versus em turnos',tlive:'Times ao vivo',tsplit:'Times no tabuleiro dividido'};
const TEAM={az:{n:'Time Azul',c:'#3e6fe0',e:'🔵'},la:{n:'Time Laranja',c:'#f08c25',e:'🟠'}};
const isTeamType=t=>t==='tlive'||t==='tsplit';
function otherTeam(k){ return k==='az'?'la':'az'; }
/* resultado de times: soma dos pontos; quem bateu a meta primeiro leva */
function teamResult(infos,teams){ const sum={az:0,la:0}; let gk=null, gt=Infinity;
  for(const id in infos){ const t=teams[id], x=infos[id]; if(!t||!x) continue; sum[t]+=x.score||0; if(x.goalTime!=null&&x.goalTime<gt){ gt=x.goalTime; gk=t; } }
  return {sum,winner:gk||(sum.az>sum.la?'az':sum.la>sum.az?'la':null)}; }
function teamVsHTML(sc,teams,ids,per){
  const col=k=>`<div><b style="color:${TEAM[k].c}">${fmtN(sc[k]||0)}</b><span>${TEAM[k].e} ${esc(TEAM[k].n)}</span><div class="tmem">${ids.filter(id=>teams[id]===k).map(id=>`<div>${avatarHTML(id,20)}${esc(nm(id))}${per?` <small>${fmtN(per[id]||0)}</small>`:''}</div>`).join('')}</div></div>`;
  return `<div class="vs">${col('az')}<div class="x">×</div>${col('la')}</div>`; }
function teamShareLine(teams,sc,per){ const side=k=>Object.keys(teams).filter(id=>teams[id]===k).map(id=>nm(id,false)+(per?' '+fmtN(per[id]||0):'')).join(' + ');
  return `${TEAM.az.e} ${side('az')} = ${fmtN(sc.az||0)} × ${fmtN(sc.la||0)} = ${side('la')} ${TEAM.la.e}`; }
/* partida de times nos resultados da sala: cada um do time vencedor ganha uma vitória */
function teamRec(type,label,teams,sc,winner,per,quitter){
  const ids=Object.keys(teams);
  return {type,label,date:Date.now(),tw:1,rows:ids.map(id=>({n:nm(id,false),s:per&&per[id]!=null?per[id]:0,p:winner?(teams[id]===winner?1:2):1,c:0,q:id===quitter?1:0})),
    tm:{az:ids.filter(id=>teams[id]==='az').map(id=>nm(id,false)),la:ids.filter(id=>teams[id]==='la').map(id=>nm(id,false)),sAz:sc.az||0,sLa:sc.la||0}}; }
const TYPE_HINT={camp:'Campanha em grupo (até 4), num tabuleiro só dividido: cada um com a sua parte (metade, ou quadrante com 3 ou 4 jogadores), todos jogando ao mesmo tempo. No quebra-cabeça o tabuleiro é livre para todos. Com mais gente, as metas ficam maiores. O progresso do grupo fica no celular de quem criou a sala.',tlive:'Dois times, cada jogador no seu tabuleiro, com as mesmas peças. Os pontos do time são somados e os ataques vão para o líder do outro time.',tsplit:'Um tabuleiro por time, dividido em faixas (uma para cada jogador, até 3 por time). Os dois tabuleiros correm lado a lado e linhas limpas atacam o outro time.',live:'Cada um no seu tabuleiro (2 a 6 jogadores), com as mesmas peças, placar ao vivo e miniatura dos outros. Ataques vão para o líder.',coop:'Um tabuleiro só (2 a 4 jogadores), um de cada vez, somando pontos.',halves:'Um tabuleiro só e cada um com a sua parte: com 2, metades; com 3 ou 4, um quadrante para cada num tabuleiro 10×10 (com 3, o quarto é livre). Toda peça precisa tocar a sua parte.',versus:'Um tabuleiro só, em turnos (2 a 4 jogadores): cada um escolhe a peça de quem joga depois dele.'};
function defOpts(){ const o={time:1,play:0,goal:0,series:0}; [...FLAGS,...NETF].forEach(k=>o[k]=false); return o; }
function applies(type,k){
  const base=['time','play','goal','obstacles','heavy','color','final','bomb','ice','wild'];
  if(type==='solo') return ['obstacles','heavy','sudden','color','final','undo','hold','bomb','ice','wild'].includes(k);
  if(type==='duel') return base.includes(k)||['series','sudden','undo','hold'].includes(k);
  if(k==='pblocks') return type==='live'||type==='tlive'||type==='tsplit';
  if(type==='live') return true;
  if(type==='tlive') return k!=='handicap';
  if(type==='tsplit') return base.includes(k)||['hold','attacks','series','pblocks'].includes(k);
  if(type==='versus') return base.includes(k)||k==='sudden'||k==='series';
  return base.includes(k)||k==='hold';
}
function buildOpts(el,o,type,cfg={}){
  const seg=(key,label,labels,order)=>applies(type,key)?`<div class="optrow"><label>${label}</label><div class="seg" data-k="${key}">${(order||labels.map((_,i)=>i)).map(i=>`<button type="button" data-v="${i}" class="${o[key]===i?'sel':''}">${labels[i]}</button>`).join('')}</div></div>`:'';
  const local=type==='solo'||type==='duel'; if(local&&o.time>3&&o.time!==6) o.time=1; if(o.time===6&&!RAMP_TYPES.includes(type)) o.time=3;
  const togs=(keys,label)=>{ const ks=keys.filter(k=>applies(type,k)); if(!ks.length) return '';
    return `<div class="optrow"><label>${label}</label><div class="toggles">${ks.map(k=>`<button type="button" class="tog ${o[k]?'on':''}" data-t="${k}"><span>${LABEL[k]}</span><small>${HINT[k]}</small></button>`).join('')}</div></div>`; };
  const pane=(k,h)=>h?`<div class="opane" data-pane="${k}">${h}</div>`:'';
  el.innerHTML=pane('regras',seg('time','Tempo',TIME_L,(local?TIME_ORDER_LOCAL:TIME_ORDER_NET).filter(t=>t!==6||RAMP_TYPES.includes(type)))+seg('play','Modo de jogo',PLAYS)+seg('goal','Meta de pontos',GOAL_L)+seg('series','Série',SERIES_L))
    +pane('mods',togs(['obstacles','heavy','sudden','color','final','undo','hold'],'Modificadores')+togs(['bomb','ice','wild'],'Blocos especiais'))+pane('net',togs(NETF,'Conectados'));
  if(cfg.ro) return; /* só leitura: quem entrou na sala vê, mas não muda */
  const ch=()=>{ if(cfg.onChange) cfg.onChange(); };
  el.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ const k=b.parentElement.dataset.k; o[k]=+b.dataset.v; b.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('sel',x===b)); ch(); }));
  el.querySelectorAll('.tog').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.t; o[k]=!o[k]; b.classList.toggle('on',o[k]); ch(); }));
}
function summary(o,type){
  const a=[TIMES[o.time]?TIME_L[o.time]:o.time===6?TIME_L[6]:'Sem limite de tempo', PLAYS[o.play]];
  if(o.goal&&applies(type,'goal')) a.push('Meta '+GOAL_L[o.goal]);
  if(o.series&&applies(type,'series')) a.push(SERIES_L[o.series]);
  [...FLAGS,...NETF].forEach(k=>{ if(o[k]&&applies(type,k)) a.push(LABEL[k]); });
  return a;
}
const B32='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const WORDS=['SOL','LUA','MAR','GATO','PATO','BOLO','FLOR','MEL','RIO','URSO','SAPO','PIPA','UVA','KIWI','CAFE','PERA','MANGA','TIGRE','PANDA','COCO','FOCA','ONDA','DOCE','LOBO','NEVE','CAJU','BOTO','RAIO','VENTO','ILHA','ZEBRA','MILHO'];
function optsToBits(o){ let v=(o.time===6?3:o.time)|(o.time===6?1<<18:0)|(o.play<<2)|(o.goal<<4)|(o.series<<6); FLAGS.forEach((k,i)=>{ if(o[k]) v|=1<<(8+i); }); return v; }
function bitsToOpts(v){ const o=defOpts(); o.time=v&3; o.play=(v>>2)&3; o.goal=(v>>4)&3; o.series=(v>>6)&3; if(o.series>2) o.series=0; FLAGS.forEach((k,i)=>o[k]=!!(v&(1<<(8+i)))); if(v&(1<<18)) o.time=6; return o; }
function enc4(v){ let s=''; for(let i=3;i>=0;i--) s+=B32[(v>>(5*i))&31]; return s; }
function dec4(s){ let v=0; for(const ch of s){ const k=B32.indexOf(ch); if(k<0) return null; v=v*32+k; } return v; }
function normCode(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function parseCode(n){
  if(n.length<7) return null;
  const rnd=n.slice(-2), w=n.slice(0,-6);
  const oc=n.slice(-6,-2).replace(/O/g,'0').replace(/[IL]/g,'1').replace(/U/g,'V');
  if(!/^\d\d$/.test(rnd)||!/^[A-Z]+$/.test(w)) return null;
  const v=dec4(oc); if(v===null||v>=(1<<19)) return null;
  return {norm:w+oc+rnd, pretty:`${w}-${oc}-${rnd}`, opts:bitsToOpts(v)};
}
function makeCode(o){
  const w=WORDS[Math.floor(Math.random()*WORDS.length)];
  return parseCode(w+enc4(optsToBits(o))+String(Math.floor(Math.random()*100)).padStart(2,'0'));
}
function dailyOpts(){
  /* desafio do dia: clássico, sem relógio geral; o tempo para pôr cada peça vai apertando (RAMP, no 07-duel) */
  const o=defOpts(); o.time=3; o.play=0; o.ramp=1;
  return o;
}
function dailyCode(dk){ const [k,v]=dk.split('|'); const [y,m,d]=k.split('-'); return 'DIA-'+d+m+(v==='S'?'-S':''); }
/* "|R": modo único com tempo por peça que aperta (desde a versão 1.7) */
function setDaily(){ setup.key=setup.day+'|R'; setup.opts=dailyOpts(); }

/* ===================== placar da noite, histórico, recordes ===================== */
function getNight(){ const n=store.get('ddb_night',{me:0,other:0,tie:0,at:0}); if(Date.now()-n.at>8*3600e3){ return {me:0,other:0,tie:0,at:Date.now()}; } return n; }
function addNight(res){ const n=getNight(); if(res==='win') n.me++; else if(res==='lose') n.other++; else if(res==='tie') n.tie++; n.at=Date.now(); store.set('ddb_night',n); renderNight(); }
function nightTxt(){ const n=getNight(); return `Você ${n.me} × ${n.other} Outro`+(n.tie?` · ${n.tie} empate${n.tie>1?'s':''}`:''); }
function renderNight(){ $('#nightTxt').textContent=nightTxt(); $('#lobbyNight').textContent=nightTxt(); }
$('#nightReset').addEventListener('click',()=>{ store.set('ddb_night',{me:0,other:0,tie:0,at:Date.now()}); renderNight(); });
function addHist(rec){ const h=store.get('ddb_hist',[]); h.unshift(rec); store.set('ddb_hist',h.slice(0,150)); }
function bestKey(kind,o){ if(kind==='solo') return 'sozinho|'+o.time+'|'+o.play; return kind==='coop'||kind==='halves' ? kind+'|'+PLAYS[o.play] : 'solo|'+PLAYS[o.play]; }
function bestName(k){ const [kind,a,b]=k.split('|'); if(kind==='sozinho') return `Sozinho · ${timeName(+a)} · ${PLAYS[+b]}`; return ({solo:'Código e desafio',coop:'Dupla (co-op)',halves:'Dupla (metades)'}[kind]||kind)+' · '+a; }
function checkBest(kind,o,score){ const b=store.get('ddb_bests',{}); const k=bestKey(kind,o); const old=b[k]||0; if(score>old){ b[k]=score; store.set('ddb_bests',b); return old>0||score>0; } return false; }
function getBest(kind,o){ return (store.get('ddb_bests',{})[bestKey(kind,o)])||0; }

function renderHistory(){
  const h=store.get('ddb_hist',[]);
  const total=h.length, wins=h.filter(x=>x.result==='win').length;
  const lines=h.reduce((s,x)=>s+(x.lines||0),0), combo=h.reduce((m,x)=>Math.max(m,x.combo||0),0), top=h.reduce((m,x)=>Math.max(m,x.score||0),0);
  const days=new Set(h.filter(x=>x.kind==='daily').map(x=>x.code)).size;
  $('#statGrid').innerHTML=[[total,'partidas'],[wins,'vitórias'],[fmtN(top),'maior pontuação'],[combo?'x'+combo:'0','maior combo'],[fmtN(lines),'linhas'],[days,'desafios do dia']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('');
  const b=store.get('ddb_bests',{});
  const keys=Object.keys(b).sort((x,y)=>(y.startsWith('sozinho')?1:0)-(x.startsWith('sozinho')?1:0));
  $('#bestList').innerHTML=keys.length?keys.map(k=>`<div class="kv"><span>${esc(bestName(k))}</span><b>${fmtN(b[k])}</b></div>`).join(''):'<p class="muted">Nenhum recorde ainda.</p>';
  const resTxt={win:'Vitória',lose:'Derrota',tie:'Empate'};
  $('#histList').innerHTML=h.slice(0,40).map(x=>{ const d=new Date(x.date); const when=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    return `<li><div>${esc(x.label)}<small>${when}${x.code?' · '+esc(x.code):''} · ${x.lines||0} linhas · combo x${x.combo||0}</small></div><div style="text-align:right"><b>${fmtN(x.score)}</b>${x.result?`<small class="res-${x.result}">${resTxt[x.result]}</small>`:''}</div></li>`; }).join('')||'<li class="muted">Nenhuma partida ainda.</li>';
}
$('#goHistory').addEventListener('click',()=>{ renderHistory(); show('history'); });

/* ===================== configurações ===================== */
function renderLift(){ $('#liftRange').value=SET.lift; $('#liftTxt').textContent=SET.lift===0?'Peça embaixo do dedo':`${SET.lift.toFixed(1).replace('.',',')} casas acima do dedo`; }
$('#liftRange').addEventListener('input',e=>{ SET.lift=+e.target.value; store.set('ddb_set',SET); renderLift(); });
/* miniaturas dos temas nas configurações usam os mesmos desenhos das peças (feitos uma vez e guardados) */
const PV={};
function skinPreviews(){
  const dpr=Math.min(2.5,window.devicePixelRatio||1), w=Math.round(24*dpr);
  $$('#skinSeg .skp').forEach(sp=>{ const k=[...sp.classList].find(c=>c.startsWith('skin-')).slice(5);
    sp.querySelectorAll('i[data-col]').forEach(i=>{ const c=+i.dataset.col, key=k+c+(SET.lite?'l':'')+(isGold(k)?'g':'');
      if(!PV[key]){ try{ PV[key]=drawBlock(k,PALETTE[c],k==='fruit'?FRUIT[c]:null,w,dpr,SET.lite).toDataURL(); }catch(e){ return; } }
      const b=i.querySelector('.bev'); b.style.cssText=`background:url("${PV[key]}") center/100% 100% no-repeat!important;background-blend-mode:normal;box-shadow:none;border:0`; }); });
}
function renderSettings(){
  renderLift(); renderProfile();
  $('#themeSeg').innerHTML=Object.keys(THEMES).map(k=>`<button type="button" data-k="${k}" class="${SET.theme===k?'sel':''}">${THEMES[k]}</button>`).join('');
  $('#skinSeg').innerHTML=SKINS_ALL.map(k=>{ const lock=!hasSkin(k), sel=baseSkin(SET.skin)===k, gold=sel&&isGold(SET.skin), has=hasGold(k), rw=SKIN_REW.indexOf(k);
    const sub=lock?esc(SKIN_LOCK[k]||'em breve'):has?(sel?(gold?'✨ dourado · toque para o normal':'toque de novo: ✨ dourado'):'✨ tem versão dourada'):rw>=0?`3⭐ em todo o Mundo ${rw+1}: versão dourada`:'';
    return `<button type="button" data-k="${k}" class="skinopt ${sel?'sel':''}${lock?' locked':''}${gold?' gold':''}"><span class="skp skin-${gold?k+'Gold':k}">${[0,3,5,6].map(c=>`<i data-col="${c}" style="--c:${PALETTE[c]}"><b class="blk bev"></b></i>`).join('')}</span><span>${lock?'🔒 ':''}${SKIN_L[k]}${gold?' dourado':''}</span>${sub?`<small>${sub}</small>`:''}</button>`; }).join('');
  $$('#themeSeg button').forEach(b=>b.addEventListener('click',()=>{ SET.theme=b.dataset.k; saveSet(); applyLook(); renderSettings(); }));
  $$('#skinSeg button').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.k; if(b.classList.contains('locked')){ toast('🔒 '+(SKIN_LOCK[k]||'Tema bloqueado')); return; }
    /* tocar de novo no tema escolhido troca entre o normal e o dourado (se já ganhou o dourado) */
    if(baseSkin(SET.skin)===k&&hasGold(k)) SET.skin=isGold(SET.skin)?k:k+'Gold'; else SET.skin=k;
    saveSet(); applyLook(); renderSettings(); }));
  skinPreviews();
  $('#tAuto').classList.toggle('on',SET.autoSkin); $('#tLite').classList.toggle('on',SET.lite);
  const VM={pack:'Ligada',off:'Desligada'};
  $('#voiceSeg').innerHTML=Object.keys(VM).map(k=>`<button type="button" data-k="${k}" class="${SET.voiceMode===k?'sel':''}">${VM[k]}</button>`).join('');
  $$('#voiceSeg button').forEach(b=>b.addEventListener('click',()=>{ SET.voiceMode=b.dataset.k; saveSet(); renderSettings(); if(SET.voiceMode!=='off'){ ac(); say('great',9); } }));
  $('#voiceHint').textContent=SET.voiceMode==='pack'?'Grave cada palavra com bastante energia, tipo GREAAAT!, ou importe um pack de áudios com os nomes das palavras (great.mp3, perfect.wav…). Fica só neste aparelho. Arquivos no repositório também valem: voz/great.mp3 e assim por diante.':'Sem voz, só o som e as palavras na tela.';
  renderVoiceList();
}
let recState=null;
function renderVoiceList(){
  const box=$('#voiceList'); if(!box) return;
  if(SET.voiceMode==='off'){ box.innerHTML=''; return; }
  box.innerHTML=`<div class="row" style="margin:6px 0 4px"><button type="button" class="btn small" id="vPack">Importar pack de vozes</button></div><input type="file" id="vPackIn" accept="audio/*" multiple hidden>`+VWORDS.map(w=>`<div class="vrow"><div><b>${w.toUpperCase()}</b><small>${vsrc[w]||'sem gravação'}</small></div><div class="row"><button type="button" class="chip ${recState&&recState.w===w?'rec':''}" data-rec="${w}">${recState&&recState.w===w?'⏹ Parar':'🎙 Gravar'}</button><button type="button" class="chip" data-file="${w}" aria-label="Escolher arquivo">📁</button><button type="button" class="chip" data-play="${w}" ${vbuf[w]?'':'disabled'}>▶</button><button type="button" class="chip" data-del="${w}" ${store.get('ddb_vrec_'+w,null)?'':'disabled'}>🗑</button></div></div>`).join('');
  box.querySelectorAll('[data-rec]').forEach(b=>b.addEventListener('click',()=>toggleRec(b.dataset.rec)));
  const pin=$('#vPackIn'); let fileFor=null;
  $('#vPack').addEventListener('click',()=>{ fileFor=null; pin.value=''; pin.click(); });
  box.querySelectorAll('[data-file]').forEach(b=>b.addEventListener('click',()=>{ fileFor=b.dataset.file; pin.multiple=false; pin.value=''; pin.click(); pin.multiple=true; }));
  pin.addEventListener('change',()=>importVoices([...pin.files],fileFor));
  box.querySelectorAll('[data-play]').forEach(b=>b.addEventListener('click',()=>{ ac(); playVoice(b.dataset.play); }));
  box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ try{ localStorage.removeItem('ddb_vrec_'+b.dataset.del); }catch(e){} loadVoices().then(renderVoiceList); }));
}
function readUrl(f){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(f); }); }
async function importVoices(files,only){
  if(!files.length) return;
  let ok=0, skip=[];
  for(const f of files){
    const base=f.name.toLowerCase().replace(/\.[a-z0-9]+$/,'').replace(/[^a-z]/g,'');
    const w=only||VWORDS.find(x=>base===x)||VWORDS.find(x=>base.includes(x));
    if(!w){ skip.push(f.name); continue; }
    if(f.size>900*1024){ skip.push(f.name+' (grande demais)'); continue; }
    try{ localStorage.setItem('ddb_vrec_'+w,JSON.stringify(await readUrl(f))); ok++; }catch(e){ skip.push(f.name+' (sem espaço)'); }
  }
  await loadVoices(); renderVoiceList();
  toast(ok?`${ok} voz${ok>1?'es':''} importada${ok>1?'s':''}`+(skip.length?` · ignorados: ${skip.slice(0,3).join(', ')}`:''):'Nenhum arquivo com nome de palavra: use great.mp3, perfect.mp3…');
}
async function toggleRec(w){
  if(recState){ const r=recState; if(r.mr.state!=='inactive') r.mr.stop(); return; }
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder)){ mediaHelp('mic',null); return; }
  let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}}); }catch(e){ mediaHelp('mic',e); return; }
  const mr=new MediaRecorder(st), chunks=[];
  recState={w,mr}; renderVoiceList();
  mr.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  mr.onstop=()=>{ st.getTracks().forEach(t=>t.stop()); clearTimeout(recState&&recState.to); recState=null;
    const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'}); const fr=new FileReader();
    fr.onload=()=>{ try{ localStorage.setItem('ddb_vrec_'+w,JSON.stringify(fr.result)); }catch(e){ toast('Sem espaço para salvar a gravação'); }
      loadVoices().then(()=>{ renderVoiceList(); ac(); playVoice(w); }); };
    fr.readAsDataURL(blob); };
  mr.start(); recState.to=setTimeout(()=>{ if(mr.state!=='inactive') mr.stop(); },2500);
}
$('#tAuto').addEventListener('click',()=>{ SET.autoSkin=!SET.autoSkin; saveSet(); renderSettings(); });
$('#tLite').addEventListener('click',()=>{ SET.lite=!SET.lite; saveSet(); applyLook(); renderSettings(); });
/* configurações abertas de qualquer lugar (início, sala conectada, pausa) e voltam para onde estavam */
let setFrom='home';
function openSettings(from){ setFrom=from; renderSettings(); show('settings'); }
function leaveSettings(){
  if(setFrom==='game'&&(D||SH)){ const g=D||SH; if(SH&&SH.type==='camp'){ setForceSkin(campSkin(SH.cfg)); setWorldLook(SH.cfg.camp.w||1); } show('game'); if(g.paused&&!g.over) $('#pauseOv').classList.add('show'); return; }
  if(setFrom==='lobby'&&NET.open){ renderLobby(); show('lobby'); return; }
  show('home');
}
$('#goSettings').addEventListener('click',()=>openSettings('home'));
$('#setBack').addEventListener('click',leaveSettings);
/* ===================== meu perfil (foto e bordões) =====================
   Tudo fica salvo só neste aparelho e é enviado para quem está na mesma sala. */
const PROF_MAX=90*1024;
function myProfile(){ return {name:myNick(),photo:store.get('ddb_photo',''),atk:store.get('ddb_bord_atk',''),combo:store.get('ddb_bord_combo','')}; }
function profOf(id){ if(typeof NET!=='undefined'&&id&&id!==NET.role) return (NET.prof&&NET.prof[id])||{}; return myProfile(); }
const AVC=['#e5483f','#3e6fe0','#4cbb47','#f08c25','#8a52d8','#2cb4d6'];
/* bolinha com a foto (ou a inicial do apelido, se não tiver foto) */
function avatarHTML(id,px=22,cls=''){
  if(id==='npc') return npcAvatar(px,cls);
  const p=profOf(id), name=(typeof nm==='function'&&id)?nm(id,false):(myNick()||'?');
  if(p.photo) return `<img class="av ${cls}" src="${p.photo}" alt="" style="width:${px}px;height:${px}px">`;
  const k=Math.max(0,'ABCDEF'.indexOf(id||'A'));
  return `<span class="av ${cls}" style="width:${px}px;height:${px}px;line-height:${px}px;font-size:${Math.round(px*.48)}px;background:${AVC[k%AVC.length]}">${esc((name||'?').trim().charAt(0).toUpperCase()||'?')}</span>`;
}
/* toca um bordão gravado (data URL), decodificando uma vez e guardando */
const CLIPS=new Map();
async function playClip(url,vol=1.6){
  if(!url||muted) return; const a=bus(); if(!a) return;
  try{ let buf=CLIPS.get(url); if(!buf){ buf=await a.decodeAudioData(b64ToBuf(url)); CLIPS.set(url,buf); }
    const s=a.createBufferSource(), g=a.createGain(); s.buffer=buf; g.gain.value=vol; s.connect(g); g.connect(master); s.start(now()+.02); return true;
  }catch(e){ return false; }
}
/* foto: recorta o centro em quadrado de 256 px (dá para ampliar sem ficar borrada), JPEG leve */
function readPhoto(file){
  return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onerror=rej; fr.onload=()=>{ const im=new Image(); im.onerror=rej; im.onload=()=>{
    const S=256, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'), m=Math.min(im.width,im.height);
    x.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S); res(c.toDataURL('image/jpeg',.72)); }; im.src=fr.result; }; fr.readAsDataURL(file); });
}
let profRec=null;
/* tempo máximo de cada gravação: o bordão de ataque pode ser um pouco mais longo */
const BORD_MS={ddb_bord_atk:3500,ddb_bord_combo:2500};
async function recordBordao(key){
  if(profRec){ if(profRec.mr.state!=='inactive') profRec.mr.stop(); return; }
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder)){ mediaHelp('mic',null); return; }
  let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:true,autoGainControl:true}}); }catch(e){ mediaHelp('mic',e); return; }
  const mr=new MediaRecorder(st), chunks=[]; profRec={key,mr}; renderProfile();
  mr.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  mr.onstop=()=>{ st.getTracks().forEach(t=>t.stop()); clearTimeout(profRec&&profRec.to); profRec=null;
    const fr=new FileReader(); fr.onload=()=>{ const url=fr.result;
      if(url.length>PROF_MAX*1.37){ toast('Gravação grande demais, tente de novo mais curta'); renderProfile(); return; }
      store.set(key,url); renderProfile(); ac(); playClip(url); profileChanged(); };
    fr.readAsDataURL(new Blob(chunks,{type:mr.mimeType||'audio/webm'})); };
  mr.start(); profRec.to=setTimeout(()=>{ if(mr.state!=='inactive') mr.stop(); },BORD_MS[key]||2500);
}
function renderProfile(){
  const box=$('#profBox'); if(!box) return; const p=myProfile();
  const clip=(key,label,hint)=>{ const has=!!store.get(key,''), rec=profRec&&profRec.key===key;
    /* gravando: barra que enche até o tempo acabar */
    const bar=rec?`<div class="recbar"><i style="animation-duration:${(BORD_MS[key]||2500)/1000}s"></i></div>`:'';
    return `<div class="vrow"><div style="flex:1;min-width:0"><b>${label}</b><small>${rec?'gravando…':has?'gravado':hint}</small>${bar}</div><div class="row"><button type="button" class="chip ${rec?'rec':''}" data-prec="${key}">${rec?'⏹ Parar':'🎙 Gravar'}</button><button type="button" class="chip" data-pplay="${key}" ${has?'':'disabled'} aria-label="Ouvir">▶</button><button type="button" class="chip" data-pdel="${key}" ${has?'':'disabled'} aria-label="Apagar">🗑</button></div></div>`; };
  box.innerHTML=`<div class="profhead">${avatarHTML(null,64,'big')}<div style="flex:1;min-width:0"><label class="muted" for="profNick" style="font-size:13px">Apelido</label><input class="code nick" id="profNick" maxlength="16" placeholder="Como você quer aparecer" autocomplete="off" spellcheck="false" value="${esc(p.name)}"></div></div>
    <div class="row" style="margin:10px 0 4px"><button type="button" class="btn small" id="profPhoto">📷 ${p.photo?'Trocar foto':'Pôr foto'}</button>${p.photo?'<button type="button" class="btn small" id="profPhotoDel">Remover foto</button>':''}</div>
    <input type="file" id="profPhotoIn" accept="image/*" hidden>
    ${clip('ddb_bord_atk','Bordão de ataque','toca no celular de quem você atacar')}
    ${clip('ddb_bord_combo','Bordão de combo','toca quando você fizer combo x3 ou mais')}
    <p class="muted" style="margin-top:6px">Ataque: até 3,5 segundos. Combo: até 2,5 segundos. Fica só neste aparelho e vai para quem estiver na mesma sala.</p>`;
  let nt=0; $('#profNick').addEventListener('input',e=>{ clearTimeout(nt); nt=setTimeout(()=>{ store.set('ddb_nick',e.target.value.trim().slice(0,16)); const av=box.querySelector('.profhead .av'); if(av) av.outerHTML=avatarHTML(null,64,'big'); profileChanged(true,true); },350); });
  /* o ranking só recebe o nome quando a pessoa termina de digitar (sai do campo): senão cada pedaço do nome vira um jogador */
  $('#profNick').addEventListener('change',e=>{ clearTimeout(nt); store.set('ddb_nick',e.target.value.trim().slice(0,16)); profileChanged(true); });
  $('#profPhoto').addEventListener('click',()=>{ const i=$('#profPhotoIn'); i.value=''; i.click(); });
  $('#profPhotoIn').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; try{ store.set('ddb_photo',await readPhoto(f)); renderProfile(); profileChanged(); }catch(err){ toast('Não consegui abrir essa imagem'); } });
  const pd=$('#profPhotoDel'); if(pd) pd.addEventListener('click',()=>{ store.set('ddb_photo',''); renderProfile(); profileChanged(); });
  box.querySelectorAll('[data-prec]').forEach(b=>b.addEventListener('click',()=>recordBordao(b.dataset.prec)));
  box.querySelectorAll('[data-pplay]').forEach(b=>b.addEventListener('click',()=>{ ac(); playClip(store.get(b.dataset.pplay,'')); }));
  box.querySelectorAll('[data-pdel]').forEach(b=>b.addEventListener('click',()=>{ store.set(b.dataset.pdel,''); renderProfile(); profileChanged(); }));
  pinRender();
}
/* mudou o perfil: avisa a sala (o apelido vai junto) */
function profileChanged(nickOnly,digitando){
  if(!digitando) rkSyncMe(); /* nome e foto no ranking e nos desafios */
  if(nickOnly) pinRender(); /* o PIN é de cada nome */
  if(typeof NET==='undefined'||!NET.open) return;
  const v=myNick(); NET.names[NET.role]=v; const ni=$('#nickIn'); if(ni&&document.activeElement!==ni) ni.value=v;
  if(NET.role==='A') sendRoster(); else send({t:'nick',name:v});
  if(!nickOnly) sendProfile();
}
/* foto de quem atacou balançando em cima do tabuleiro, com o bordão dele */
function showAttacker(from,txt){
  const gr=GR(), d=document.createElement('div'); d.className='atkpop';
  d.innerHTML=avatarHTML(from,Math.round(CS*2.2),'big')+`<span>${esc(txt)}</span>`;
  d.style.left=(gr.left+gr.width/2)+'px'; d.style.top=(gr.top+gr.height*.38)+'px';
  $('#fxl').appendChild(d); setTimeout(()=>d.remove(),2000);
  const p=profOf(from); if(p.atk) playClip(p.atk,1.8);
}
