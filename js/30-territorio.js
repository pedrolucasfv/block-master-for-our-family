'use strict';
/* TERRITÓRIO: duelo ao vivo (1×1 ou times) com um mapa igual em todos os tabuleiros; limpar linha/coluna pinta o mapa; bloco de tinta; travou, perdeu */
/* A partida é um duelo ao vivo com times (D.teams) e D.o.terr ligado. O mapa (TMAP, no 06-board.js: '' neutra, 'az' ou 'la') é de quem criou a sala:
   cada celular manda as linhas/colunas que limpou ({t:'tr'}), quem criou aplica na ordem em que chegam e manda o mapa novo para todos ({t:'tm'}).
   Quando todos terminam, quem criou manda o mapa final ({t:'tfim'}) e todo mundo conta as casas com ele. Contra o robô, tudo acontece aqui mesmo. */
let TERR={seed:'',v:0,fim:false};
const terrOn=()=>!!(D&&D.live&&D.o.terr&&D.teams);
function terrStr(m){ return (m||[]).map(k=>k==='az'?'a':k==='la'?'l':'.').join(''); }
function terrDe(s){ return Array.from({length:s?s.length:N*N},(_,i)=>s&&s[i]==='a'?'az':s&&s[i]==='l'?'la':''); }
function terrConta(m){ const n={az:0,la:0,ne:0}; (m||[]).forEach(k=>{ if(k==='az'||k==='la') n[k]++; else n.ne++; }); return n; }
function terrInicio(seed){ TERR={seed,v:0,fim:false}; TMAP=Array(N*N).fill(''); TMAPT=Array(N*N).fill(0); }
/* regra do mapa: a linha limpa pinta as casas neutras com a sua cor e tira a cor do outro lado (volta a neutra); a tinta pinta direto */
function terrAplica(m,ev){
  const k=ev.k, o=otherTeam(k), mud=[], set=new Set();
  (ev.r||[]).forEach(y=>{ for(let x=0;x<N;x++) set.add(y*N+x); }); (ev.c||[]).forEach(x=>{ for(let y=0;y<N;y++) set.add(y*N+x); });
  set.forEach(i=>{ if(!(i>=0&&i<N*N)) return; const nv=m[i]===o?'':k; if(m[i]!==nv){ m[i]=nv; mud.push(i); } });
  (ev.p||[]).forEach(i=>{ if(i>=0&&i<N*N&&m[i]!==k){ m[i]=k; mud.push(i); } });
  return mud;
}
/* as linhas/colunas que eu limpei vão para o mapa */
function terrLimpei(res){ if(!terrOn()||!res.n) return; terrEv({t:'tr',seed:D.cfg.seed,k:D.myTeam,r:[...new Set(res.rowsC)],c:[...new Set(res.colsC)]}); }
function terrEv(ev){ if(NET.role==='A') terrHost(ev); else send(ev); }
/* quem criou a sala (ou o jogo contra o robô): aplica e manda o mapa novo para todos */
function terrHost(ev){
  if(!TMAP||ev.seed!==TERR.seed||TERR.fim||(ev.k!=='az'&&ev.k!=='la')) return;
  const mud=terrAplica(TMAP,ev); if(!mud.length) return; TERR.v++;
  if(NET.open) send({t:'tm',seed:TERR.seed,v:TERR.v,m:terrStr(TMAP)});
  terrMudou(mud);
}
/* os outros celulares: recebem o mapa de quem criou */
function terrRecebe(m){
  if(!TMAP||m.seed!==TERR.seed||!(m.v>TERR.v)) return; TERR.v=m.v;
  const nv=terrDe(m.m), mud=[]; for(let i=0;i<N*N;i++) if(TMAP[i]!==nv[i]){ TMAP[i]=nv[i]; mud.push(i); }
  terrMudou(mud);
}
function terrFim(m){
  if(!TMAP||m.seed!==TERR.seed) return; terrRecebe({...m,v:Infinity}); TERR.fim=true;
  if(D&&D.live&&D.o.terr&&D.over&&!stillPlaying().length&&$('#end').classList.contains('show')) showDuelEnd();
}
function terrMudou(mud){
  const t=performance.now(); mud.forEach(i=>{ TMAPT[i]=t; }); bDirty=true; bReq(); terrRender();
  terrCheck();
}
/* depois de cada mudança: o mapa ficou todo de uma cor ou o outro lado inteiro caiu (travou, o tempo da peça acabou ou saiu) */
function terrCheck(){
  if(!terrOn()||D.over) return false;
  const n=terrConta(TMAP); for(const k of ['az','la']) if(n[k]===N*N){ duelEnd(k===D.myTeam?'terrWin':'terrLose'); return true; }
  const c=caboCaiu(otherTeam(D.myTeam)); if(c){ duelEnd(c==='saiu'?'terrSaiu':'terrTravou'); return true; }
  return false;
}
/* bloco de tinta: com Ataques ligado, limpar 3 linhas ou mais de uma vez manda um para o líder do outro lado */
function terrTinta(res){ if(!terrOn()||!D.o.attacks||res.n<3) return; const to=leaderId(); if(!to) return; send({t:'pw',k:'tinta',to}); toast(`🎨 Bloco de tinta para ${nm(to)}!`); }
function terrPoeTinta(eng,k){ const i=placeTimeBomb(eng); if(i>=0) eng.b[(i/N)|0][i%N].tp=k; return i; }
/* depois de cada jogada: a tinta que não foi limpa em 3 jogadas explode e pinta 3×3 no mapa com a cor de quem mandou */
function terrTickTinta(eng){
  const out=[];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(!v||v.c!==-4||!v.tp) continue; v.tb--; if(v.tb>0) continue;
    eng.b[y][x]=null; const p=[]; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const ny=y+dy, nx=x+dx; if(ny>=0&&nx>=0&&ny<N&&nx<N) p.push(ny*N+nx); }
    out.push({k:v.tp,p,i:y*N+x}); }
  return out;
}
function terrTintaLeft(b){ let m=null; for(const row of b) for(const v of row) if(v&&v.c===-4&&v.tp) m=m==null?v.tb:Math.min(m,v.tb); return m; }
/* no meu tabuleiro, depois de pôr a peça */
function terrDepoisJogada(){
  if(!terrOn()) return;
  terrTickTinta(D.eng).forEach(t=>{ terrEv({t:'tr',seed:D.cfg.seed,k:t.k,p:t.p}); spawnExplosion(t.i,0); SFX.boom();
    toast(t.k===D.myTeam?'🎨 A tinta explodiu e pintou o mapa com a sua cor!':'🎨 A tinta explodiu: o mapa em volta ficou da cor do outro lado'); });
}
/* resultado final (o mesmo em todos os celulares e na TV, contado com o mapa final de quem criou a sala) */
function terrResult(infos,teams,m){
  const n=terrConta(m), sum={az:0,la:0};
  for(const id in infos){ const x=infos[id], k=teams[id]; if(x&&k) sum[k]+=x.score||0; }
  const dead=k=>{ const ids=Object.keys(teams).filter(id=>teams[id]===k); return ids.length&&ids.every(id=>infos[id]&&CABO_CAI.includes(infos[id].reason)); };
  let w=null, why='';
  for(const id in infos){ const r=infos[id]&&infos[id].reason, k=teams[id]; if(!k) continue;
    if(r==='terrWin'||r==='terrTravou'||r==='terrSaiu'){ w=k; why=r; break; } if(r==='terrLose'){ w=otherTeam(k); why='terrWin'; break; } }
  if(!w){ const da=dead('az'), dl=dead('la'); if(da!==dl){ w=da?'la':'az'; why='terrTravou'; } }
  if(!w&&n.az!==n.la){ w=n.az>n.la?'az':'la'; why='terrMais'; }
  return {winner:w,why,n,sum};
}
function terrPorque(tr,teams){
  const n=tr.n; if(!tr.winner) return `Empate: ${n.az} casa${n.az===1?'':'s'} para cada lado`;
  const w=caboLado(tr.winner,teams,NET.role), l=caboLado(otherTeam(tr.winner),teams,NET.role);
  if(tr.why==='terrWin') return `${w} pintou o mapa inteiro`; if(tr.why==='terrTravou') return `${l} ficou sem jogada`; if(tr.why==='terrSaiu') return `${l} saiu da partida`;
  return `${w} ficou com mais casas: ${n[tr.winner]} × ${n[otherTeam(tr.winner)]}`;
}
/* barra com as casas de cada lado (esq = time que fica à esquerda) */
function terrBarHTML(id){ return `<div class="terr"${id?` id="${id}"`:''}><div class="terrlbl"><span class="tl"></span><small class="tt"></small><span class="tr"></span></div><div class="terrtrk"><i class="terre"></i><i class="terrd"></i></div></div>`; }
function terrBarSet(el,n,esq,lblE,lblD){
  if(!el) return; const dir=otherTeam(esq), tot=n.az+n.la+n.ne;
  el.style.setProperty('--ce',TEAM[esq].c); el.style.setProperty('--cd',TEAM[dir].c);
  el.querySelector('.terre').style.width=(n[esq]/tot*100).toFixed(1)+'%'; el.querySelector('.terrd').style.width=(n[dir]/tot*100).toFixed(1)+'%';
  el.querySelector('.tl').textContent=`${lblE} ${n[esq]}`; el.querySelector('.tr').textContent=`${n[dir]} ${lblD}`;
  el.querySelector('.tt').textContent=n.ne===tot?'Limpe linhas para pintar o mapa':`${n.ne} neutra${n.ne===1?'':'s'}`;
}
/* barra no jogo (o seu lado fica à esquerda) */
function terrRender(){
  const el=$('#terr'); if(!el) return; const sp=terrSplit(), on=terrOn()||sp; el.hidden=!on; if(!on) return;
  const teams=sp?SH.cfg.teams:D.teams, me=sp?SH.me:NET.role, my=teams[me];
  terrBarSet(el,terrConta(TMAP),my,caboLado(my,teams,me),caboLado(otherTeam(my),teams,me));
}
/* o mapa em miniatura (placar final e TV) */
function terrMapHTML(m,id){ m=m||terrDe(''); return `<div class="tmapa"${id?` id="${id}"`:''} style="grid-template-columns:repeat(${Math.round(Math.sqrt(m.length))},1fr)">${m.map(k=>`<i${k?` style="background:${TEAM[k].c}"`:''}></i>`).join('')}</div>`; }
/* placar final do Território (o que vai no showDuelEnd) */
function terrEndBody(d,i,stats,btns){
  const final=NET.role==='A'||!!d.cfg.npc||TERR.fim;
  if(!final){ /* espera o mapa final de quem criou a sala; sem resposta em 3 s, conta com o mapa daqui */
    if(!d.tWait) d.tWait=setTimeout(()=>{ if(D===d&&!TERR.fim){ TERR.fim=true; if($('#end').classList.contains('show')) showDuelEnd(); } },3000);
    return `<h2>🏰 Contando as casas…</h2><p class="muted">Esperando o mapa final de quem criou a sala.</p>`; }
  const infos={[NET.role]:i}; d.others.forEach(id=>infos[id]=d.opps[id].info);
  if(!d.tmFim) d.tmFim=(TMAP||terrDe('')).slice();
  const tr=d.trr||(d.trr=terrResult(infos,d.teams,d.tmFim)), res=d.res||(d.res=tr.winner===d.myTeam?'win':tr.winner?'lose':'tie'), per={}; for(const id in infos) per[id]=infos[id].score;
  d.tr={sum:tr.sum,winner:tr.winner};
  if(!d.resolved){ d.resolved=true; if(d.cfg.npc) npcRecord(res,i); else { addNight(res); seriesAdd(tr.winner); NET.lastWinner=null; addHist({date:Date.now(),kind:'live',label:'Território · '+PLAYS[d.o.play],code:'',score:i.score,lines:i.lines,combo:i.combo,result:res}); } }
  const solo=Object.values(d.teams).filter(k=>k===d.myTeam).length<2;
  let body=`<div class="winner ${res}">${res==='win'?(solo?'Você venceu!':'Seu time venceu!'):res==='lose'?esc(caboLado(tr.winner,d.teams,NET.role))+' venceu':'Empate'}</div><p class="muted">${esc(terrPorque(tr,d.teams))}</p>`;
  body+=terrMapHTML(d.tmFim)+terrBarHTML('terrFim')+teamVsHTML(tr.sum,d.teams,Object.keys(infos),per);
  body+=statsHTML(stats)+graphSVG(Object.keys(infos).map(id=>({tl:infos[id].timeline||[[0,0]],color:TEAM[d.teams[id]].c,label:nm(id)})));
  body+=seriesLine(); d.rank=null;
  if(NET.open) btns.push(rematchBtn());
  else if(d.cfg.npc) btns.push({t:'Revanche',cls:'primary',on:()=>startNpc(d.o)});
  return body;
}
function terrEndBar(d){ if(!d.trr) return; const f=$('#terrFim'); if(f){ f.classList.add('fim'); terrBarSet(f,d.trr.n,'az',caboLado('az',d.teams,NET.role),caboLado('la',d.teams,NET.role)); } } /* Azul à esquerda, como o placar logo abaixo */

/* ----- Território no tabuleiro dividido dos times (dupla × dupla, até 3 por time) -----
   Na sala é o tipo 'tterr', que vira um tsplit com opts.terr. Lá quem criou a sala já calcula tudo (SH.H): o mapa fica em H.tmap
   e vai no 'sync' (campo tm, em texto). Cada aparelho desenha o que chega (terrSetMap no renderShared). */
const terrSplit=()=>!!(SH&&SH.type==='tsplit'&&SH.o.terr);
/* quem criou a sala, depois de cada peça no tabuleiro do time k; devolve o time que pintou o mapa inteiro (ou null) */
function terrSplitPlace(H,k,res,eng){
  if(res.n) terrAplica(H.tmap,{k,r:[...new Set(res.rowsC)],c:[...new Set(res.colsC)]});
  terrTickTinta(eng).forEach(t=>{ terrAplica(H.tmap,{k:t.k,p:t.p}); (H.ev.tboom=H.ev.tboom||[]).push({k,i:t.i,by:t.k}); });
  if(SH.o.attacks&&res.n>=3&&!H.ev.blocked){ const ot=otherTeam(k), i=terrPoeTinta(H.bd[ot].eng,k); if(i>=0) H.ev.tinta={to:ot,cells:[i]}; }
  const n=terrConta(H.tmap); return n.az===N*N?'az':n.la===N*N?'la':null;
}
/* fim por tempo ou com os dois times travados: ganha quem tem mais casas */
function terrSplitWinner(H){ const n=terrConta(H.tmap); return n.az>n.la?'az':n.la>n.az?'la':null; }
/* o mapa que chegou (ou o de quem criou): pisca as casas que mudaram */
function terrSetMap(nv){
  if(!TMAP||TMAP.length!==nv.length){ TMAP=nv; TMAPT=Array(nv.length).fill(0); bDirty=true; bReq(); terrRender(); return; }
  const t=performance.now(); let mud=false; for(let i=0;i<nv.length;i++) if(TMAP[i]!==nv[i]){ TMAP[i]=nv[i]; TMAPT[i]=t; mud=true; }
  if(mud){ bDirty=true; bReq(); terrRender(); }
}
/* avisos de tinta na tela de cada um (mk = o tabuleiro do meu time) */
function terrSplitEv(ev,mk){
  if(ev.tinta){ if(ev.tinta.to===mk){ showAttacker(ev.who,`${nm(ev.who)} jogou um bloco de tinta!`); setTimeout(()=>BC.drop(ev.tinta.cells),0); toast('🎨 Bloco de tinta! Limpe a linha ou coluna dele em 3 jogadas, senão ele pinta o mapa em volta'); }
    else if(ev.k===mk) toast(`🎨 Bloco de tinta no ${TEAM[ev.tinta.to].n}!`); }
  (ev.tboom||[]).forEach(t=>{ if(t.k!==mk) return; spawnExplosion(t.i,0); SFX.boom(); toast(t.by===mk?'🎨 A tinta explodiu e pintou o mapa com a sua cor!':'🎨 A tinta explodiu: o mapa em volta ficou da cor do outro lado'); });
}
/* o resultado do tabuleiro dividido no formato do terrPorque */
function terrSplitTr(info){ return {winner:info.winner,why:info.reason==='terrWin'?'terrWin':info.reason==='terrTravou'?'terrTravou':info.reason==='oppQuit'?'terrSaiu':'terrMais',n:terrConta(terrDe(info.tm))}; }
