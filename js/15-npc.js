'use strict';
/* ROBÔ do modo Sozinho: duelo contra o computador (fácil, médio, difícil), usando o duelo ao vivo sem conexão */
/* ===================== DUELO CONTRA O ROBÔ =====================
   A partida é um duelo ao vivo comum (D.live) com um adversário de id 'npc'. O que o jogo mandaria pela
   conexão (ataques, poderes, fim) vem para npcHear; o robô responde chamando onSt/onEnd/receiveAttack como se fosse outro celular. */
const NPC_L=['Ninguém','🤖 Fácil','🤖 Médio','🤖 Difícil','🤖 Expert'], NPC_N=['','Robô Fácil','Robô Médio','Robô Difícil','Robô Expert'];
/* tempo entre jogadas (ms), chance de jogar qualquer coisa e se pensa na peça seguinte */
const NPC_LV=[null,{min:2600,max:4000,miss:.3,deep:false},{min:1500,max:2500,miss:.08,deep:false},{min:1300,max:2100,miss:.08,deep:true},{min:800,max:1400,miss:0,deep:true}];
let NPC=null;
function npcName(){ return NPC_N[(D&&D.cfg.npc)||(NPC&&NPC.lv)||0]||'Robô'; }
function npcAvatar(px,cls){ return `<span class="av ${cls}" style="width:${px}px;height:${px}px;line-height:${px}px;font-size:${Math.round(px*.62)}px;background:#5b6b86">🤖</span>`; }
function npcStats(){ return store.get('ddb_npc',{}); }
function startNpc(o){
  if(NET.open){ toast('Saia da sala de jogo conectado para jogar contra o robô'); return; }
  ac(); npcStop(); NET.role='A';
  const lv=Math.min(4,Math.max(1,o.npc|0)), opts={...o,npc:lv}, seed='N|'+Date.now()+'|'+Math.random().toString(36).slice(2);
  startDuel({type:'live',opts,seed,players:['A','npc'],npc:lv,label:'Contra o '+NPC_N[lv]+' · '+timeName(opts.time)+(opts.play?' · '+PLAYS[opts.play]:'')});
  const eng=new Engine(opts); if(opts.obstacles) eng.addStones(makeRng(seed+'|obs'),6);
  NPC={d:D,lv,cfg:NPC_LV[lv],eng,rng:makeRng(seed),tray:null,score:0,placed:0,t:0,next:0,last:performance.now(),timeline:[[0,0]],over:false,shield:0,frozen:0,slow:0,hurry:false,timer:0};
  NPC.tray=gen3(NPC.rng,opts); NPC.next=npcDelay(); npcState(); npcLoop();
}
function npcStop(){ if(NPC){ NPC.over=true; clearTimeout(NPC.timer); } }
/* saiu do duelo contra o robô: devolve o papel de "sem sala" */
function npcLeave(){ npcStop(); NPC=null; if(!NET.open) NET.role=null; }
function npcDelay(){ const n=NPC, c=n.cfg; let ms=c.min+Math.random()*(c.max-c.min);
  if(n.hurry) ms*=.35; if(n.slow>n.t) ms*=1.7; if(n.d.o.sudden) ms=Math.min(ms,4300); return ms; }
function npcLoop(){
  const n=NPC; if(!n||n.over) return; const d=n.d; if(D!==d){ npcStop(); return; }
  const now=performance.now(), dt=Math.min(500,now-n.last); n.last=now;
  /* espera a contagem; continua mesmo se você já terminou (para tentar passar seus pontos) */
  if((d.playing||d.over)&&!d.paused){
    n.t+=dt; const tot=TIMES[d.o.time]*1000;
    if(tot&&n.t>=tot){ npcEnd('time'); return; }
    if(n.t>=n.next&&n.t>=n.frozen){ npcMove(); if(n.over) return; n.next=n.t+npcDelay(); }
  }
  n.timer=setTimeout(npcLoop,80);
}
function npcState(){ const n=NPC, e=n.eng; onSt({t:'st',from:'npc',seed:n.d.cfg.seed,s:n.score,m:e.b.flat().map(v=>v?(v.c<0&&v.c!==-2?2:1):0).join(''),b:boardStr(e.b)}); }
function npcEnd(reason){
  const n=NPC; if(!n||n.over) return; n.over=true; clearTimeout(n.timer);
  const e=n.eng; npcState();
  onEnd({t:'end',from:'npc',seed:n.d.cfg.seed,info:{reason,score:n.score,lines:e.lines,combo:e.maxCombo,placed:n.placed,timeline:n.timeline,elapsed:n.t,goalTime:reason==='goal'?n.t:null}});
}
/* ----- como o robô escolhe a jogada ----- */
/* nota do tabuleiro: espaço livre, sem buracos isolados, bordas lisas e lugar para as peças grandes */
function npcEval(b){
  let empty=0, holes=0, tr=0;
  const full=(y,x)=>y<0||x<0||y>=N||x>=N||!!b[y][x];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!b[y][x]){ empty++; if(full(y-1,x)&&full(y+1,x)&&full(y,x-1)&&full(y,x+1)) holes++; }
  for(let y=0;y<N;y++){ let pr=true; for(let x=0;x<N;x++){ const f=!!b[y][x]; if(f!==pr) tr++; pr=f; } if(!pr) tr++; }
  for(let x=0;x<N;x++){ let pr=true; for(let y=0;y<N;y++){ const f=!!b[y][x]; if(f!==pr) tr++; pr=f; } if(!pr) tr++; }
  let f3=false, f5h=false, f5v=false;
  for(let y=0;y<=N-3&&!f3;y++) for(let x=0;x<=N-3&&!f3;x++){ let ok=true; for(let k=0;k<9&&ok;k++) if(b[y+(k/3|0)][x+k%3]) ok=false; if(ok) f3=true; }
  for(let y=0;y<N;y++){ let run=0; for(let x=0;x<N;x++){ run=b[y][x]?0:run+1; if(run>=5) f5h=true; } }
  for(let x=0;x<N;x++){ let run=0; for(let y=0;y<N;y++){ run=b[y][x]?0:run+1; if(run>=5) f5v=true; } }
  return empty-holes*6-tr*1.5+(f3?12:0)+(f5h?5:0)+(f5v?5:0);
}
function npcTry(eng,p,r,c){ const t=new Engine(eng.o); t.b=eng.snap(); t.combo=eng.combo; t.since=eng.since; const res=t.place(p,r,c,0); return {t,res}; }
/* todas as jogadas possíveis com as peças da bandeja (rest = as outras peças que ainda faltam) */
function npcMoves(eng,tray){
  const out=[];
  tray.forEach((p,i)=>{ if(!p) return; const rest=tray.filter((q,j)=>q&&j!==i);
    for(let r=0;r<=N-p.h;r++) for(let c=0;c<=N-p.w;c++) if(eng.fits(p,r,c)){
      const {t,res}=npcTry(eng,p,r,c); let v=res.pts+res.n*8+npcEval(t.b);
      rest.forEach(q=>{ if(!t.anyFit(q)) v-=60; });
      out.push({i,r,c,v,t,res,rest}); } });
  return out.sort((a,b)=>b.v-a.v);
}
function npcPick(n){
  const mv=npcMoves(n.eng,n.tray); if(!mv.length) return null;
  const c=n.cfg;
  if(Math.random()<c.miss) return mv[Math.floor(Math.random()*mv.length)];
  if(!c.deep) return c.miss>=.3?mv[Math.floor(Math.random()*Math.min(3,mv.length))]:mv[0];
  /* difícil e expert: para as melhores jogadas, olha também a melhor jogada seguinte com as peças que sobram */
  let best=mv[0], bv=-Infinity;
  for(const m of mv.slice(0,8)){
    let v=m.v;
    if(m.rest.length){ const tr2=n.tray.map((q,j)=>j===m.i?null:q), m2=npcMoves(m.t,tr2); v=m2.length?m.res.pts+m.res.n*8+m2[0].v:-500; }
    if(v>bv){ bv=v; best=m; } }
  return best;
}
/* martelo do robô: quebra os blocos que mais melhoram o tabuleiro */
function npcHammer(k){
  const b=NPC.eng.b;
  for(let n=0;n<k;n++){ let best=null, bv=-Infinity;
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=b[y][x]; if(!v) continue; b[y][x]=null; const s=npcEval(b)+(v.c<0?3:0); b[y][x]=v; if(s>bv){ bv=s; best=[y,x]; } }
    if(!best) break; b[best[0]][best[1]]=null; }
}
function npcScore(res,goldMsg){
  const n=NPC, d=n.d, tot=TIMES[d.o.time]*1000;
  let pts=res.pts; if(d.o.final&&tot&&tot-n.t<=30000) pts*=2;
  if(res.gold){ pts+=150; if(!d.over){ removeGold(); toast(goldMsg); } }
  n.score+=pts; n.timeline.push([Math.round(n.t/1000),n.score]);
  if(res.powers&&res.powers.length) npcPowers(res.powers);
  if(d.o.attacks&&res.n>=3&&!d.over) receiveAttack(res.n-1,'npc');
  if(res.n>=3&&!d.over&&Math.random()<.4) setTimeout(()=>{ if(D===d&&!d.over) bigEmoji(['😎','🤖','😈'][Math.floor(Math.random()*3)]); },500);
}
function npcMove(){
  const n=NPC, d=n.d, e=n.eng;
  const m=npcPick(n); if(!m){ npcEnd('stuck'); return; }
  const p=n.tray[m.i]; n.tray[m.i]=null;
  const res=e.place(p,m.r,m.c,0); n.placed++;
  tickBombs(e);
  npcScore(res,`${npcName()} pegou o bloco dourado`);
  if(n.tray.every(x=>!x)) n.tray=gen3(n.rng,d.o);
  npcState(); npcCheck();
}
/* depois de cada mudança: bateu a meta, passou seus pontos (se você já terminou) ou ficou sem jogada */
function npcCheck(){
  const n=NPC; if(!n||n.over) return; const d=n.d, g=GOALS[d.o.goal];
  if(g&&n.score>=g){ npcEnd('goal'); return; }
  if(d.info&&d.info.reason!=='quit'&&n.score>d.info.score){ npcEnd('passed'); return; }
  if(!n.tray.some(p=>p&&n.eng.anyFit(p))) npcEnd('stuck');
}
function npcPowers(list){
  const n=NPC, d=n.d;
  for(const k of list){
    if(k==='escudo'){ n.shield=Math.min(2,n.shield+1); if(!d.over) toast(`🛡️ ${npcName()} ganhou um escudo`); continue; }
    if(k==='martelo'){ npcHammer(3); continue; }
    if(d.over) continue;
    if(k==='pedra') receiveAttack(2,'npc');
    else receivePower(k==='gelo'?'freeze':k==='nevoa'?'fog':'tbomb',FOG_SIDES[Math.floor(Math.random()*4)],'npc');
  }
}
function npcBlocked(){ const n=NPC; if(!(n.shield>0)) return false; n.shield--; toast(`🛡️ ${npcName()} bloqueou seu ataque com o escudo`); return true; }
/* o que o jogo mandaria para o outro celular chega aqui */
function npcHear(m){
  const n=NPC; if(!n||D!==n.d) return; const d=n.d, e=n.eng;
  if(m.t==='emo'){ if(Math.random()<.6) setTimeout(()=>{ if(D===d) bigEmoji(['😂','😎','🤖','😈','👏'][Math.floor(Math.random()*5)]); },900); return; }
  if(n.over) return;
  switch(m.t){
    case 'atk': if(m.to!=='npc'||npcBlocked()) return; e.addStones(Math.random,m.n,-1,'ice'); npcState(); break;
    case 'pw': if(m.to!=='npc'||npcBlocked()) return;
      if(m.k==='freeze') n.frozen=n.t+4000; else if(m.k==='fog') n.slow=n.t+5000; else placeTimeBomb(e);
      npcState(); break;
    case 'gold': { const free=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!e.b[y][x]) free.push([y,x]); if(!free.length) return;
      const safe=free.filter(([y,x])=>!e.wouldFill(y,x)), pool=safe.length?safe:free, [y,x]=pool[Math.floor(Math.random()*pool.length)];
      e.b[y][x]={c:-2,s:null,t:0}; const res=e.settle(0); if(res.n) npcScore(res,`O dourado fechou uma linha do ${npcName()}`); npcState(); npcCheck(); break; }
    case 'goldWon': for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(e.b[y][x]&&e.b[y][x].c===-2) e.b[y][x]=null; npcState(); break;
    case 'end': { const i=m.info||{};
      if(i.reason==='quit'){ npcStop(); return; }
      if(i.reason==='time'){ npcEnd('time'); return; }
      if(i.reason==='goal'){ npcEnd('oppGoal'); return; }
      /* você ficou sem jogada: o robô continua (mais rápido) até passar seus pontos ou travar */
      n.hurry=true; n.next=Math.min(n.next,n.t+600); npcCheck(); break; }
  }
}
function npcRecord(res,me){
  const lv=D.cfg.npc, st=npcStats(), s=st[lv]||(st[lv]={w:0,l:0,t:0});
  if(res==='win') s.w++; else if(res==='lose') s.l++; else s.t++; store.set('ddb_npc',st);
  addHist({date:Date.now(),kind:'npc',label:D.cfg.label,code:'',score:me.score,lines:me.lines,combo:me.combo,result:res});
}
function npcMenu(){ closeEnd(); D=null; IN=null; npcLeave(); openSolo(); }
/* ----- tela do Sozinho: escolha do adversário ----- */
function renderNpcBox(){
  const box=$('#soloNpcBox'), lv=soloOpts.npc|0; box.hidden=!lv; $('#soloBestLine').hidden=!!lv; if(!lv) return;
  const s=npcStats()[lv]||{w:0,l:0,t:0};
  box.innerHTML=`<p class="muted">${['','Joga devagar e às vezes erra. Bom para aprender.','Joga direitinho, num ritmo tranquilo.','Pensa na próxima peça, mas ainda erra de vez em quando.','Rápido, pensa na próxima peça e quase não erra. Boa sorte!'][lv]}</p>
    <p class="muted">Contra o ${NPC_N[lv]}: ${s.w} vitória${s.w===1?'':'s'} · ${s.l} derrota${s.l===1?'':'s'}${s.t?` · ${s.t} empate${s.t>1?'s':''}`:''}</p>
    <div class="toggles">${['attacks','pblocks','powers'].map(k=>`<button type="button" class="tog ${soloOpts[k]?'on':''}" data-t="${k}"><span>${LABEL[k]}</span><small>${HINT[k]}</small></button>`).join('')}</div>`;
  box.querySelectorAll('.tog').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.t; soloOpts[k]=!soloOpts[k]; b.classList.toggle('on',soloOpts[k]); store.set('ddb_soloOpts',soloOpts); }));
}
