'use strict';
/* TABULEIRO ÚNICO (co-op, dividido, versus, times), poderes, martelo, marcar */
/* ===================== TABULEIRO ÚNICO (co-op, dividido, versus, times no tabuleiro dividido) =====================
   Cada partida tem um ou mais tabuleiros (H.bd): "all" nos modos de equipe única; "az" e "la" nos times. */
let SH=null;
const VE=new Engine(defOpts());
function bdKey(who){ return SH&&SH.type==='tsplit'?(SH.cfg.teams[who]||'az'):'all'; }
function bdIds(k){ return SH.type==='tsplit'?SH.ids.filter(id=>SH.cfg.teams[id]===k):SH.ids; }
const STRIPS={2:['esquerda','direita'],3:['esquerda','meio','direita']};
/* dividido: 2 jogadores = metades (8×8); 3 ou 4 = quadrantes (10×10); com 3, o 4º quadrante é livre para todos.
   times no tabuleiro dividido: cada um tem uma faixa vertical do tabuleiro do seu time */
function regionOf(type,who){
  if(!SH) return null;
  if(type==='tsplit'){ const ids=bdIds(bdKey(who)), k=ids.indexOf(who), m=ids.length, n=N; if(m<=1||k<0) return null;
    const w=Math.floor(n/m), x0=k*w, x1=k===m-1?n-1:x0+w-1; return [[x0,x1,0,n-1]]; }
  /* campanha em grupo: cada um com a sua parte, como no Co-op dividido (no quebra-cabeça o tabuleiro é livre para todos) */
  if(type==='camp'){ if(SH.ids.length<2||(SH.hook&&SH.hook.noRegen)) return null; type='halves'; }
  if(type!=='halves') return null; const ids=SH.ids, k=ids.indexOf(who); if(k<0) return null; const n=N, h=n/2;
  if(ids.length<=2) return [k?[h,n-1,0,n-1]:[0,h-1,0,n-1]];
  const Q=[[0,h-1,0,h-1],[h,n-1,0,h-1],[0,h-1,h,n-1],[h,n-1,h,n-1]], r=[Q[k]]; if(ids.length===3) r.push(Q[3]); return r;
}
const QN=['de cima à esquerda','de cima à direita','de baixo à esquerda','de baixo à direita'];
function nextOf(id){ const L=SH.ids; return L[(L.indexOf(id)+1)%L.length]; }
function prevOf(id){ const L=SH.ids; return L[(L.indexOf(id)-1+L.length)%L.length]; }
function teamWord(){ return SH&&SH.ids.length>2?'equipe':'dupla'; }
function startShared(cfg){
  closeEnd(); D=null; IN=null; TMAP=null; caboRender(); terrRender(); setN(cfg.size||8); setForceSkin(cfg.type==='camp'?campSkin(cfg):null); setWorldLook(cfg.type==='camp'?(cfg.camp.w||1):null); bossHide();
  const o=cfg.opts, me=cfg.me||NET.role, host=!!cfg.solo||me==='A', ids=cfg.players, ts=cfg.type==='tsplit';
  SH={cfg,o,type:cfg.type,me,host,ids,view:null,pv:null,playing:false,over:false,paused:false,elapsed:0,lastTick:0,lastEv:0,lastBlind:0,pending:null,lastSync:0,remAt:null,markMode:false,mkKey:'',tapMode:null,frozenUntil:0,hook:cfg.type==='camp'?campHook(cfg):null};
  if(host){
    const bd={}; (ts?['az','la']:['all']).forEach(k=>{ const eng=new Engine(o); if(o.obstacles) eng.addStones(makeRng(cfg.seed+'|obs'),N>8?9:6); bd[k]={eng,hold:null,marks:{c:[],r:[],k:[]},sc:0,shield:0}; });
    /* nos times, o jogador na mesma posição de cada time recebe as mesmas peças */
    const rng={}, trays={}, scs={}, stuck={}, ptsBy={};
    ids.forEach(id=>{ const key=ts?'T'+ids.filter(x=>cfg.teams[x]===cfg.teams[id]).indexOf(id):id; rng[id]=makeRng(cfg.seed+'|'+key); scs[id]=0; stuck[id]=false; ptsBy[id]=0; });
    const H={bd,rng,trays,tray:null,scs,ptsBy,hammer:{},turn:ids[0],ph:'choose',ch:null,timeline:[[0,0]],ev:null,suddenAt:Infinity,over:null,paused:false,stuck,out:{}};
    if(cfg.type==='versus') H.tray=gen3(rng[ids[0]],o); else ids.forEach(id=>trays[id]=gen3(rng[id],o));
    if(ts&&o.terr) H.tmap=Array(N*N).fill('');
    SH.H=H; if(SH.hook&&SH.hook.init) SH.hook.init(H); SH.view=hostView();
  }
  resetScore(); animTimers.forEach(clearTimeout); $('#fx').innerHTML=''; BC.reset(); MK=null;
  $('#gLabel').textContent=typeName(cfg)+' · R'+cfg.round; $('#gMute').textContent=muted?'🔇':'🔊';
  const vs=cfg.type==='versus', myT=ts?cfg.teams[me]:null;
  if(vs) oppsSetup(ids.filter(x=>x!==me),false);
  else if(ts){ const ot=otherTeam(myT), el=$('#opps'); el.hidden=false; el.classList.remove('many');
    el.innerHTML=`<div class="opp tmini" style="box-shadow:inset 0 0 0 2px ${TEAM[ot].c}"><canvas id="oppBoard"></canvas><div><b id="oppTeamSc">0</b><span>${TEAM[ot].e} ${TEAM[ot].n}</span></div></div>`; }
  else $('#opps').hidden=true;
  $('#scoreLbl').textContent=vs?'Você':ts?`Pontos do ${TEAM[myT].e} ${TEAM[myT].n}`:'Pontos da '+teamWord();
  const tot=TIMES[o.time]*1000;
  $('#timer').textContent=tot?fmtT(tot):(GOALS[o.goal]?'Meta '+GOAL_L[o.goal]:'Sem limite'); $('#timer').className='timer';
  $('#timebar').style.visibility=(tot||GOALS[o.goal])?'visible':'hidden'; $('#timebarFill').style.transform=tot?'scaleX(1)':'scaleX(0)';
  $('#subTxt').textContent=(vs||ts)?'':cfg.solo?'':`Recorde da ${teamWord()} `+fmtN(getBest(cfg.type,o)); updateCombo(0,0); setStatus(''); $('#mission').hidden=true; $('#subTxt')._h=''; myEndOff();
  $('#fog').classList.remove('show');
  buildSharedActions();
  IN=sharedIN; show('game');
  if(host) broadcast();
  renderShared(true);
  const s=SH;
  countdown(()=>SH===s&&!s.over,()=>{ s.playing=true; s.lastTick=performance.now(); if(s.host){ armSuddenH(); broadcast(); } requestAnimationFrame(sharedTick); renderShared(); });
}
function buildSharedActions(){
  if(SH.hook&&SH.hook.actions){ SH.hook.actions(); return; }
  const coopish=SH.type!=='versus'&&!SH.cfg.solo;
  setActions((coopish?`<button class="chip" id="aMark">✏️ Marcar</button>`:'')+emoBtns()); bindEmos();
  const m=$('#aMark'); if(m) m.addEventListener('click',()=>{ if(!SH) return; SH.markMode=!SH.markMode; m.classList.toggle('on',SH.markMode); m.textContent=SH.markMode?'✏️ Marcando…':'✏️ Marcar';
    if(SH.markMode) toast('Toque numa casa vazia para pedir que preencham. Arraste por uma linha ou coluna para pedir que limpem. Toque de novo para desmarcar.');
    renderSharedStatus(performance.now()); });
}
/* a visão de cada aparelho: todos os tabuleiros + os campos do seu próprio tabuleiro (b, hold, marks, sc…) */
function deriveView(v){ const my=v.bds[bdKey(SH.me)]||v.bds.all||Object.values(v.bds)[0]; return Object.assign(v,{b:my.b,hold:my.hold,marks:my.marks,sc:my.sc,combo:my.combo,since:my.since,shield:my.shield}); }
function hostView(){ const H=SH.H, bds={}; for(const k in H.bd){ const B=H.bd[k]; bds[k]={b:B.eng.b,hold:B.hold,marks:B.marks,sc:B.sc,combo:B.eng.combo,since:B.eng.since,shield:B.shield}; }
  return deriveView({bds,tm:H.tmap?terrStr(H.tmap):null,tr:SH.type==='versus'?H.tray:H.trays,scs:H.scs,turn:H.turn,ph:H.ph,ch:H.ch,paused:H.paused,stuck:H.stuck,out:H.out,cp:H.cp||null,hammer:(H.hammer||{})[SH.me]||0}); }
function serBoard(b){ const now=performance.now(); return b.flat().map(v=>v?[v.c,v.s||0,Math.round(now-v.t),v.cr?1:0,v.pw?PWK.indexOf(v.pw)+1:0,v.tb!=null?v.tb:-1,v.tp==='az'?1:v.tp==='la'?2:0]:0); }
function deserBoard(a){ const now=performance.now(), b=Array.from({length:N},()=>Array(N).fill(null)); a.forEach((v,i)=>{ if(v){ const o={c:v[0],s:v[1]||null,t:now-v[2],cr:v[3]}; if(v[4]) o.pw=PWK[v[4]-1]; if(v[5]!=null&&v[5]>=0) o.tb=v[5]; if(v[6]) o.tp=v[6]===1?'az':'la'; b[(i/N)|0][i%N]=o; } }); return b; }
function broadcast(){
  if(!SH||!SH.host) return; const H=SH.H, tot=TIMES[SH.o.time]*1000;
  SH.view=hostView();
  if(SH.cfg.solo){ SH.lastSync=performance.now(); return; }
  const bds={}; for(const k in H.bd){ const B=H.bd[k]; bds[k]={b:serBoard(B.eng.b),hold:B.hold,marks:B.marks,sc:B.sc,combo:B.eng.combo,since:B.eng.since,shield:B.shield}; }
  send({t:'sync',bds,tm:SH.view.tm,tr:SH.view.tr,scs:H.scs,turn:H.turn,ph:H.ph,ch:H.ch,paused:H.paused,stuck:H.stuck,out:H.out,cp:H.cp||null,hm:H.hammer||{},
    rem:tot?tot-SH.elapsed:null,sd:SH.o.sudden&&SH.type==='versus'?H.suddenAt-SH.elapsed:null,playing:SH.playing,ev:H.ev,over:H.over,tl:H.timeline.length>1?H.timeline[H.timeline.length-1]:null});
  SH.lastSync=performance.now();
}
function applySync(m){
  const s=SH; const prevPaused=s.view&&s.view.paused;
  const bds={}; for(const k in m.bds){ const q=m.bds[k]; bds[k]={b:deserBoard(q.b),hold:q.hold||null,marks:q.marks||null,sc:q.sc,combo:q.combo,since:q.since,shield:q.shield}; }
  s.view=deriveView({bds,tm:m.tm||null,tr:m.tr,scs:m.scs,turn:m.turn,ph:m.ph,ch:m.ch,paused:m.paused,stuck:m.stuck,out:m.out||{},cp:m.cp||null,hammer:(m.hm||{})[s.me]||0});
  s.remAt={rem:m.rem,sd:m.sd,at:performance.now()}; s.pending=null;
  if(m.paused!==prevPaused&&s.playing) { s.paused=m.paused; if(m.paused){ cancelDrag(); campPauseInfo(); $('#pauseTitle').textContent='Pausado'; $('#pauseTxt').textContent='A partida está pausada para todos.'; campStuckPauseTxt(); if(!$('#settings').classList.contains('active')) $('#pauseOv').classList.add('show'); } else { $('#pauseOv').classList.remove('show'); if($('#settings').classList.contains('active')) show('game'); } }
  if(m.ev&&m.ev.id!==s.lastEv) playEv(m.ev);
  if(m.over&&!s.over) sharedOver(m.over);
  renderShared();
}
function playEv(ev){
  SH.lastEv=ev.id;
  const mk=bdKey(SH.me);
  if(SH.type==='tsplit') playPowers(ev,mk);
  if(ev.k&&ev.k!==mk){ /* jogada no tabuleiro do outro time */
    if(ev.atk&&ev.atk.to===mk){ showAttacker(ev.who,`${nm(ev.who)} atacou! +${ev.atk.n} blindados`); setTimeout(()=>BC.drop(ev.atk.cells||[]),0); const b=$('#board'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); SFX.boom(); buzz([30,50,30]); }
    if(ev.blocked&&ev.blocked.to===mk) toast('🛡️ O escudo do seu time bloqueou um ataque!');
    if(SH.hook&&SH.hook.ev) SH.hook.ev(ev,false);
    return; }
  { const dr=clearDirs(ev.cleared); ev.cleared.forEach(([i,c,sp])=>{ const y=(i/N)|0,x=i%N; spawnClear(i,c,sp,Math.hypot(y+.5-ev.cr,x+.5-ev.cc)*30,dr[i]); }); }
  const mine=ev.who===SH.me;
  if(ev.res.n>0||mine) feedback(ev.res,ev.pts,ev.cr,ev.cc,mine);
  setTimeout(()=>{ if(SH){ glowCells(ev.placed,SH.view.b); ripple(ev.cr-.5,ev.cc-.5,SH.view.b); } },0);
  if(SH.type==='versus'&&ev.pts&&ev.res.n>0) toast(mine?`Você fez +${fmtN(ev.pts)}`:`${nm(ev.who)} fez +${fmtN(ev.pts)}`);
  if(ev.atk&&ev.k) toast(`Ataque! +${ev.atk.n} blindados no ${TEAM[ev.atk.to].n}`);
  if(ev.blocked&&ev.k) toast(`O ${TEAM[ev.blocked.to].n} bloqueou o ataque com o escudo`);
  if(SH.hook&&SH.hook.ev) SH.hook.ev(ev,true);
  showScore(SH.type==='versus'?SH.view.scs[SH.me]:SH.view.sc);
}
function act(a){ if(!SH) return; if(SH.host) hostAct(SH.me,a); else { send({t:'act',a}); if(a.k==='place'||a.k==='hold'){ SH.pending=a.src; renderShared(); } } }
function hostAct(who,a){
  const H=SH.H; if(!H||H.over) return;
  if(a.k==='pause'){ if(SH.playing){ setPaused(true); if(who!==SH.me){ $('#pauseTxt').textContent=`${nm(who)} pausou a partida.`; } } return; }
  if(a.k==='resume'){ setPaused(false); return; }
  if(!SH.playing||H.paused) { broadcast(); return; }
  if(a.k==='place') hostPlace(who,a.src,a.r,a.c);
  else if(a.k==='choose') hostChoose(who,a.i);
  else if(a.k==='hold') hostHold(who,a.src);
  else if(a.k==='mark') hostMark(who,a);
  else if(a.k==='hammer'){ const B=H.bd[bdKey(who)], i=a.i|0, y=(i/N)|0, x=i%N; if((H.hammer[who]||0)>0&&B.eng.b[y]&&B.eng.b[y][x]){ const v=B.eng.b[y][x]; B.eng.b[y][x]=null; H.hammer[who]--; H.ev={id:(H.ev?H.ev.id:0)+1,who,k:SH.type==='tsplit'?bdKey(who):null,pts:0,res:{n:0,chain:0,colorLines:0,bombs:0,perfect:false,combo:B.eng.combo},cleared:[[i,v.c,v.s]],placed:[],cr:y+.5,cc:x+.5,hammer:1}; hostCheckStuck(); if(SH.hook&&SH.hook.afterHelp) SH.hook.afterHelp(); } }
  else if(SH.hook&&SH.hook.act) SH.hook.act(who,a);
  broadcast(); SH.view=hostView(); renderShared();
}
function sharedFinal(){ return SH.o.final&&TIMES[SH.o.time]>0&&TIMES[SH.o.time]*1000-SH.elapsed<=30000; }
function hostPlace(who,src,r,c){
  const H=SH.H, vs=SH.type==='versus', ts=SH.type==='tsplit', k=bdKey(who), B=H.bd[k], eng=B.eng; let p;
  if(ts&&H.out[k]) return false;
  if(SH.hook&&SH.hook.canPlace&&!SH.hook.canPlace(who,src)) return false;
  if(vs){ if(H.ph!=='place'||H.turn!==who||src!==H.ch) return false; p=H.tray[src]; }
  else { if(isTurnType(SH.type)&&H.turn!==who) return false; p=src==='h'?B.hold:(H.trays[who]||[])[src]; }
  if(!p||!eng.fits(p,r,c,regionOf(SH.type,who))) return false;
  if(vs) H.tray[src]=null; else if(src==='h') B.hold=null; else H.trays[who][src]=null;
  const res=eng.place(p,r,c,performance.now());
  let pts=res.pts; if(sharedFinal()) pts*=2;
  if(vs) H.scs[who]+=pts; else B.sc+=pts; H.ptsBy[who]=(H.ptsBy[who]||0)+pts;
  const tsec=Math.round(SH.elapsed/1000);
  H.timeline.push(vs?[tsec,...SH.ids.map(id=>H.scs[id])]:ts?[tsec,H.bd.az.sc,H.bd.la.sc]:[tsec,B.sc]);
  H.ev={id:(H.ev?H.ev.id:0)+1,who,k:ts?k:null,pts,res:{n:res.n,chain:res.chain,colorLines:res.colorLines,bombs:res.bombs,perfect:res.perfect,combo:res.combo,ripe:res.ripe||0,petal:res.petal||0},cleared:res.steps.flatMap(s=>s.cleared.map(x=>[x[0],x[1],x[2]])),placed:res.placed,cr:r+p.h/2,cc:c+p.w/2};
  const tb=tickBombs(eng); if(tb.boom) H.ev.boom={k,cells:tb.added};
  if(ts&&SH.o.attacks&&res.n>=3) hostAttackBoard(otherTeam(k),res.n-1);
  if(ts&&res.powers&&res.powers.length) hostPowers(who,k,res.powers);
  const tw=ts&&SH.o.terr?terrSplitPlace(H,k,res,eng):null;
  if(SH.hook&&SH.hook.afterPlace) SH.hook.afterPlace(who,res,pts,B);
  cleanMarks(res,B);
  playEv(H.ev);
  if(H.over) return true;
  if(tw){ hostEnd('terrWin',tw); return true; }
  if(vs){ if(H.tray.every(x=>!x)) H.tray=gen3(H.rng[SH.ids[0]],SH.o); H.turn=nextOf(who); H.ph='choose'; H.ch=null; armSuddenH(); }
  else if(H.trays[who].every(x=>!x)&&!(SH.hook&&SH.hook.noRegen)) H.trays[who]=gen3(H.rng[who],SH.o);
  const g=GOALS[SH.o.goal];
  if(g){ if(vs&&H.scs[who]>=g){ hostEnd('goal',who); return true; } if(!vs&&B.sc>=g){ hostEnd('goal',ts?k:null); return true; } }
  hostCheckStuck();
  if(isTurnType(SH.type)&&!H.over){ let nx=nextOf(who); for(let k=0;k<SH.ids.length&&H.stuck[nx];k++) nx=nextOf(nx); H.turn=nx; if(nx===who&&SH.ids.length>1) H.ev.keep=1; }
  if(SH.hook&&SH.hook.afterTurn) SH.hook.afterTurn();
  return true;
}
/* blocos de poder no tabuleiro dividido dos times */
function hostPowers(who,k,list){
  const H=SH.H, ot=otherTeam(k), B=H.bd[k], T=H.bd[ot]; H.ev.pwf=H.ev.pwf||[];
  for(const p of list){
    if(p==='escudo'){ B.shield=Math.min(2,(B.shield||0)+1); H.ev.pwf.push({k:p,to:k}); continue; }
    if(p==='martelo'){ H.hammer[who]=(H.hammer[who]||0)+3; H.ev.pwf.push({k:p,to:k,who}); continue; }
    if(T.shield){ T.shield--; H.ev.pwf.push({k:p,to:ot,blocked:1}); continue; }
    if(p==='pedra'){ const added=T.eng.addStones(Math.random,2,-1,'ice'); H.ev.pwf.push({k:p,to:ot,cells:added}); }
    else if(p==='bomba'){ const i=placeTimeBomb(T.eng); H.ev.pwf.push({k:p,to:ot,cells:i>=0?[i]:[]}); }
    else H.ev.pwf.push({k:p,to:ot,side:FOG_SIDES[Math.floor(Math.random()*4)]});
  }
}
/* o que os poderes fazem na tela de cada um (tabuleiro dividido dos times) */
function playPowers(ev,mk){
  if(SH.o.terr) terrSplitEv(ev,mk);
  if(ev.boom&&ev.boom.k===mk){ setTimeout(()=>BC.drop(ev.boom.cells),0); toast('💣 A bomba explodiu!'); SFX.boom(); shake(); }
  for(const f of ev.pwf||[]){
    const mine=f.to===mk;
    if(f.blocked){ toast(mine?`🛡️ O escudo do seu time bloqueou: ${PWN[f.k]}`:`🛡️ O outro time bloqueou: ${PWN[f.k]}`); continue; }
    if(f.k==='escudo'){ if(mine) toast('🛡️ Escudo para o seu time!'); continue; }
    if(f.k==='martelo'){ if(f.who===SH.me) toast('🔨 Martelo! Toque em 3 blocos do seu tabuleiro para quebrar'); continue; }
    if(!mine){ if(ev.k===mk) toast(`${PWI[f.k]} ${PWN[f.k]} no ${TEAM[f.to].n}!`); continue; }
    showAttacker(ev.who,`${nm(ev.who)}: ${PWN[f.k]}!`);
    if(f.k==='gelo'){ SH.frozenUntil=performance.now()+4000; cancelDrag(); toast('❄️ Suas peças congelaram por 4 s'); setTimeout(()=>{ if(SH) renderShared(); },4100); }
    else if(f.k==='nevoa'){ fogShow(f.side,5000); }
    else if(f.cells) setTimeout(()=>BC.drop(f.cells),0);
  }
}
/* ataque entre os tabuleiros dos times (o escudo do time bloqueia) */
function hostAttackBoard(k,n){
  const T=SH.H.bd[k]; if(!T) return;
  if(T.shield){ T.shield--; SH.H.ev.blocked={to:k}; return; }
  const added=T.eng.addStones(Math.random,n,-1,'ice'); SH.H.ev.atk={to:k,n:added.length,cells:added};
}
/* marcações somem quando a casa é preenchida ou a linha/coluna é limpa */
function cleanMarks(res,B){
  const M=B.marks, b=B.eng.b;
  M.c=M.c.filter(i=>!(res&&res.placed.includes(i))&&!b[(i/N)|0][i%N]);
  if(res){ M.r=M.r.filter(y=>!res.rowsC.includes(y)); M.k=M.k.filter(x=>!res.colsC.includes(x)); }
}
function hostMark(who,a){
  if(SH.type==='versus') return; const B=SH.H.bd[bdKey(who)], M=B.marks, k=a.m==='c'?'c':a.m==='r'?'r':'k', i=a.i|0;
  if(i<0||i>=(k==='c'?N*N:N)) return;
  if(k==='c'&&B.eng.b[(i/N)|0][i%N]) return;
  const at=M[k].indexOf(i); if(at>=0) M[k].splice(at,1); else M[k].push(i);
}
function hostChoose(who,i){
  const H=SH.H; if(SH.type!=='versus'||H.ph!=='choose'||who!==prevOf(H.turn)||!H.tray[i]) return;
  H.ch=i; H.ph='place'; armSuddenH();
  if(!H.bd.all.eng.anyFit(H.tray[i])) hostEnd('stuck',who);
}
/* peça guardada é da equipe: um guarda, qualquer um usa (no co-op normal, só na sua vez) */
function hostHold(who,src){
  const H=SH.H, B=H.bd[bdKey(who)]; if(SH.type==='versus'||!SH.o.hold||src==='h') return;
  if(isTurnType(SH.type)&&H.turn!==who) return;
  const p=(H.trays[who]||[])[src]; if(!p) return;
  H.trays[who][src]=B.hold||null; B.hold=p;
  if(H.trays[who].every(x=>!x)) H.trays[who]=gen3(H.rng[who],SH.o);
  hostCheckStuck();
}
function hostCheckStuck(){
  if(SH.type==='versus'||SH.H.over) return; const H=SH.H;
  const can=w=>{ const B=H.bd[bdKey(w)], reg=regionOf(SH.type,w); return ((H.hammer||{})[w]||0)>0||H.trays[w].some(p=>p&&B.eng.anyFit(p,reg))||(!!B.hold&&B.eng.anyFit(B.hold,reg))||holdRescue(H.trays[w],B.hold,SH.o.hold&&SH.type!=='versus'); };
  SH.ids.forEach(id=>H.stuck[id]=!can(id));
  if(SH.type==='tsplit'){
    /* time sem jogadas fica de fora; o outro continua até passar a pontuação dele */
    ['az','la'].forEach(k=>{ if(!H.out[k]&&bdIds(k).every(id=>H.stuck[id])) H.out[k]=true; });
    if(H.out.az&&H.out.la){ hostEnd('stuck',null); return; }
    const o=H.out.az?'az':H.out.la?'la':null; if(o){ const w=otherTeam(o); if(SH.o.terr) hostEnd('terrTravou',w); else if(H.bd[w].sc>H.bd[o].sc) hostEnd('passed',w); } /* território: travou, perdeu */
    return;
  }
  if(SH.hook&&SH.hook.stuck&&SH.ids.every(id=>H.stuck[id])){ SH.hook.stuck(); return; }
  if(SH.ids.every(id=>H.stuck[id])) hostEnd('stuck',null);
}
function armSuddenH(){ if(SH&&SH.host&&SH.o.sudden&&SH.type==='versus') SH.H.suddenAt=SH.elapsed+5000; }
function argmaxScore(exclude){ const H=SH.H; let best=null,bs=-1,tie=false; SH.ids.forEach(id=>{ if(id===exclude) return; const v=H.scs[id]||0; if(v>bs){ bs=v; best=id; tie=false; } else if(v===bs) tie=true; }); return tie?null:best; }
function hostEnd(reason,winner,quitter){
  const H=SH.H; if(H.over) return; const vs=SH.type==='versus', ts=SH.type==='tsplit';
  if(vs&&(reason==='time'||reason==='oppQuit')) winner=argmaxScore(quitter);
  if(vs&&reason==='sudden') winner=argmaxScore(H.turn);
  if(ts&&SH.o.terr){ if(reason==='time'||reason==='stuck') winner=terrSplitWinner(H); else if(reason==='oppQuit') winner=otherTeam(SH.cfg.teams[quitter]); }
  else if(ts&&(reason==='time'||reason==='stuck'||reason==='oppQuit')) winner=H.bd.az.sc>H.bd.la.sc?'az':H.bd.la.sc>H.bd.az.sc?'la':null;
  const bs=Object.values(H.bd);
  H.over={reason,winner,quitter:quitter||null,sc:H.bd.all?H.bd.all.sc:0,scs:{...H.scs},scT:ts?{az:H.bd.az.sc,la:H.bd.la.sc}:null,teams:ts?SH.cfg.teams:null,ptsBy:{...H.ptsBy},ids:SH.ids,tm:H.tmap?terrStr(H.tmap):null,
    lines:bs.reduce((s,b)=>s+b.eng.lines,0),combo:Math.max(...bs.map(b=>b.eng.maxCombo)),timeline:H.timeline};
  if(SH.hook&&SH.hook.onEnd) SH.hook.onEnd(H.over);
  if(reason!=='disc'&&!SH.cfg.solo) recordShared(H.over);
  broadcast(); sharedOver(H.over);
}
function versusRows(o){
  const rest=o.ids.filter(id=>id!==o.winner).sort((a,b)=>(o.scs[b]||0)-(o.scs[a]||0)), ord=o.winner?[o.winner,...rest]:rest, rows=[];
  ord.forEach((id,i)=>{ const prev=rows[i-1], same=i>0&&!(o.winner&&i===1)&&(o.scs[ord[i-1]]||0)===(o.scs[id]||0); rows.push({id,score:o.scs[id]||0,place:same?prev.place:i+1,sub:id===o.quitter?'saiu':''}); });
  return rows;
}
function recordShared(o){
  const label=typeName(SH.cfg)+' · R'+SH.cfg.round;
  if(SH.type==='versus') recordMatch({type:'versus',label,date:Date.now(),rows:versusRows(o).map(r=>({n:nm(r.id,false),s:r.score,p:r.place,c:0,q:r.sub?1:0}))});
  else if(SH.type==='tsplit') recordMatch(teamRec('tsplit',label,o.teams,o.scT,o.winner,o.ptsBy,o.quitter));
  else if(SH.type==='camp') return;
  else recordMatch({type:SH.type,label,date:Date.now(),team:o.sc,names:SH.ids.map(id=>nm(id,false))});
}
/* toque na tela libera o relógio das fases de chuva */
document.addEventListener('pointerdown',()=>{ if(D&&D.wait&&D.playing&&!D.over&&!D.paused){ D.wait=false; setStatus(''); } if(SH&&SH.host&&SH.type==='camp'&&SH.H&&SH.H.cp&&SH.H.cp.wait&&SH.playing&&!SH.over){ SH.H.cp.wait=false; broadcast(); renderShared(); } },true);
function sharedTick(t){
  const s=SH; if(!s||s.over) return;
  const dt=Math.min(1000,t-s.lastTick); s.lastTick=t;
  const tot=TIMES[s.o.time]*1000;
  if(s.host){
    const H=s.H;
    if(s.playing&&!H.paused){
      /* campanha (fases de chuva): o relógio só começa depois do primeiro toque ou da primeira peça */
      if(!(H.cp&&H.cp.wait)) s.elapsed+=dt;
      if(tot){ const left=tot-s.elapsed; setTimer(left,tot,sharedFinal()); if(left<=0){ hostEnd('time',null); return; } }
      if(s.o.sudden&&s.type==='versus'){ const l=H.suddenAt-s.elapsed;
        if(l<=0){ if(H.ph==='choose'){ const av=H.tray.map((p,i)=>p?i:-1).filter(i=>i>=0); hostChoose(prevOf(H.turn),av[Math.floor(Math.random()*av.length)]); broadcast(); renderShared(); }
          else { hostEnd('sudden',null); return; } } }
      if(t-s.lastSync>1000) broadcast();
    }
  } else if(s.remAt&&s.playing&&!(s.view&&s.view.paused)){
    const since=t-s.remAt.at;
    if(tot&&s.remAt.rem!=null) setTimer(s.remAt.rem-since,tot,s.o.final&&s.remAt.rem-since<=30000);
  }
  if(SH.hook&&SH.hook.tick) SH.hook.tick(t);
  if(GOALS[s.o.goal]&&!tot&&s.view){ const v=s.type==='versus'?Math.max(...Object.values(s.view.scs)):s.type==='tsplit'?Math.max(s.view.bds.az.sc,s.view.bds.la.sc):s.view.sc; $('#timebarFill').style.transform=`scaleX(${Math.min(1,v/GOALS[s.o.goal])})`; }
  if(s.o.sudden&&s.type==='versus'&&s.view){ renderSharedStatus(t); }
  if(s.o.play===2&&t-s.lastBlind>250){ s.lastBlind=t; renderBoard(s.view.b,s.o,s.pv,{region:regionOf(s.type,s.me)}); }
  requestAnimationFrame(sharedTick);
}
const sharedIN={
  piece:src=>{ const v=SH&&SH.view; if(!v) return null; if(src==='h') return SH.type==='versus'?null:v.hold||null; return SH.type==='versus'?v.tr[src]:(v.tr[SH.me]||[])[src]; },
  canDrag:src=>{ const v=SH.view; if(!SH.playing||SH.over||v.paused||SH.pending!=null||SH.markMode||SH.tapMode||(SH.frozenUntil&&performance.now()<SH.frozenUntil)) return false; if(SH.type==='tsplit') return !(v.out&&v.out[bdKey(SH.me)]); if(SH.hook&&SH.hook.canDrag&&!SH.hook.canDrag(src)) return false; if(SH.type==='versus') return v.ph==='place'&&v.turn===SH.me&&src===v.ch; if(isTurnType(SH.type)) return v.turn===SH.me; return true; },
  tap:src=>{ const v=SH&&SH.view; if(v&&SH.type==='versus'&&SH.playing&&!v.paused&&v.ph==='choose'&&prevOf(v.turn)===SH.me&&src!=='h'&&v.tr[src]){ act({k:'choose',i:src}); SFX.pick(); return true; } return false; },
  check:(p,r,c)=>{ VE.b=SH.view.b; const reg=regionOf(SH.type,SH.me); return VE.fits(p,r,c,reg)?true:(SH.o.play===2&&VE.inBounds(p,r,c,reg)?'ghost':false); },
  preview:pv=>{ SH.pv=pv; renderBoard(SH.view.b,SH.o,pv,{region:regionOf(SH.type,SH.me)}); },
  drop:(src,r,c)=>{ VE.b=SH.view.b; const p=sharedIN.piece(src); if(!p) return false; if(!VE.fits(p,r,c,regionOf(SH.type,SH.me))){ if(SH.o.play===2){ flashBad(p,r,c,SH.view.b); renderShared(); } return false; } act({k:'place',src,r,c}); return true; },
  toHold:src=>{ const v=SH&&SH.view; if(!v||SH.type==='versus'||!SH.o.hold||src==='h'||v.paused||SH.pending!=null) return false; if(isTurnType(SH.type)&&v.turn!==SH.me) return false; act({k:'hold',src}); return true; }
};
/* martelo: toque num bloco do seu tabuleiro para quebrar */
$('#board').addEventListener('pointerdown',e=>{
  const at=()=>{ grC=null; const gr=GR(), c=Math.floor((e.clientX-gr.left)/CS), r=Math.floor((e.clientY-gr.top)/CS); return (r<0||c<0||r>=N||c>=N)?null:[r,c]; };
  if(D&&D.live&&D.hammer>0&&D.playing&&!D.paused){ const p=at(); if(!p) return; const [r,c]=p, v=D.eng.b[r][c]; if(!v) return;
    e.preventDefault(); e.stopPropagation(); D.eng.b[r][c]=null; D.hammer--; spawnClear(r*N+c,v.c,v.s,0); SFX.place(); buzz(15); renderDuel(); sendState(); duelCheckStuck(); return; }
  if(SH&&SH.tapMode==='row'&&SH.playing&&!SH.over){ const p=at(); if(!p) return; e.preventDefault(); e.stopPropagation(); SH.tapMode=null; act({k:'help',h:'row',i:p[0]}); SFX.boom(); renderShared(); return; }
  if(SH&&SH.view&&SH.view.hammer>0&&SH.playing&&!SH.over){ const p=at(); if(!p) return; const [r,c]=p; if(!SH.view.b[r][c]) return;
    e.preventDefault(); e.stopPropagation(); act({k:'hammer',i:r*N+c}); SFX.place(); buzz(15); }
},true);
/* modo marcar: toque numa casa vazia = marca a casa; arrastar por uma linha/coluna = marca a linha/coluna */
(function(){
  const bd=$('#board'); let mk=null;
  const cellAt=(x,y)=>{ const gr=GR(), c=Math.floor((x-gr.left)/CS), r=Math.floor((y-gr.top)/CS); return (r<0||c<0||r>=N||c>=N)?null:[r,c]; };
  bd.addEventListener('pointerdown',e=>{ if(!SH||!SH.markMode||SH.tapMode||!SH.playing||SH.over||!SH.view) return; grC=null; const p=cellAt(e.clientX,e.clientY); if(!p) return; e.preventDefault(); mk={a:p,b:p,id:e.pointerId}; });
  window.addEventListener('pointermove',e=>{ if(mk&&e.pointerId===mk.id){ const p=cellAt(e.clientX,e.clientY); if(p) mk.b=p; } });
  window.addEventListener('pointerup',e=>{
    if(!mk||e.pointerId!==mk.id) return; const {a,b}=mk; mk=null; if(!SH||!SH.view) return;
    if(a[0]===b[0]&&a[1]===b[1]){
      const i=a[0]*N+a[1], M=SH.view.marks||{c:[]};
      if(SH.view.b[a[0]][a[1]]&&!M.c.includes(i)){ toast('Essa casa já está cheia. Arraste por uma linha ou coluna para marcá-la.'); return; }
      act({k:'mark',m:'c',i});
    } else { const dy=Math.abs(b[0]-a[0]), dx=Math.abs(b[1]-a[1]); act(dx>=dy?{k:'mark',m:'r',i:a[0]}:{k:'mark',m:'k',i:a[1]}); }
    SFX.pick();
  });
})();
function renderSharedStatus(t){
  const v=SH.view, vs=SH.type==='versus', me=SH.me;
  let st='', warn=false;
  if(vs){
    const ch=prevOf(v.turn);
    if(v.ph==='choose') st=ch===me?`Escolha a peça que ${nm(v.turn)} vai jogar`:v.turn===me?`${nm(ch)} está escolhendo a sua peça…`:`${nm(ch)} escolhe a peça de ${nm(v.turn)}`;
    else st=v.turn===me?'Sua vez: coloque a peça escolhida':`Vez de ${nm(v.turn)}`;
    if(SH.o.sudden&&SH.playing){ let l=null; if(SH.host) l=SH.H.suddenAt-SH.elapsed; else if(SH.remAt&&SH.remAt.sd!=null) l=SH.remAt.sd-(t-SH.remAt.at); if(l!=null&&!v.paused){ st+=' · '+(Math.max(0,l)/1000).toFixed(1).replace('.',',')+' s'; warn=l<2000; } }
  } else {
    const k=SH.ids.indexOf(me);
    if(SH.type==='halves') st=SH.ids.length<=2?'Seu lado: '+(k?'direita':'esquerda')+' · a peça precisa tocar nele':'Seu quadrante: o '+QN[k]+(SH.ids.length===3?' · o de baixo à direita é livre':'');
    if(SH.type==='tsplit'){ const k=bdKey(me), ids=bdIds(k), i=ids.indexOf(me); st=ids.length<=1?'O tabuleiro do time é todo seu':`Sua faixa: ${STRIPS[ids.length][i]} · ${TEAM[k].e} ${TEAM[k].n}`; if(v.shield) st+=' · 🛡️'; }
    if(SH.type==='coop'){ const others=SH.ids.filter(x=>x!==me); st=v.turn===me?(v.stuck&&others.every(x=>v.stuck[x])?'Sua vez de novo: os outros estão sem jogada':'Sua vez'):`Vez de ${nm(v.turn)}`; }
    if(v.stuck&&v.stuck[me]){ st='Sem jogada para você. Espere alguém abrir espaço'; warn=true; }
    { const tr=v.tr[me]||[], reg=regionOf(SH.type,me); VE.b=v.b; const rescue=SH.o.hold&&!tr.some(p=>p&&VE.anyFit(p,reg))&&!(v.hold&&VE.anyFit(v.hold,reg))&&holdRescue(tr,v.hold,true)&&(!isTurnType(SH.type)||v.turn===me);
      holdPulse(rescue); if(rescue){ st='Nenhuma peça cabe: guarde a peça!'; warn=true; } }
    if(SH.type==='tsplit'&&v.out&&v.out[bdKey(me)]){ st='Seu time ficou sem jogadas. Agora é torcer!'; warn=true; }
    if(SH.type==='tsplit'){ const bl=bombLeft(v.b), tl=SH.o.terr?terrTintaLeft(v.b):null; if(bl!=null){ st=`💣 Limpe a bomba em ${bl} jogada${bl>1?'s':''}!`; warn=bl<=1; } else if(tl!=null){ st=`🎨 Limpe a tinta em ${tl} jogada${tl>1?'s':''}!`; warn=tl<=1; } }
    if(v.hammer>0){ st=`🔨 Toque em ${v.hammer} bloco${v.hammer>1?'s':''} do seu tabuleiro para quebrar`; warn=false; }
    if(SH.hook&&SH.hook.status){ const h=SH.hook.status(v); if(h) { st=h.t; warn=!!h.w; } }
    if(SH.markMode) { st='Marcando: toque numa casa vazia ou arraste por uma linha/coluna'; warn=false; }
  }
  setStatus(st,warn);
}
function renderShared(anim){
  const s=SH; if(!s||!s.view) return;
  const v=s.view, vs=s.type==='versus', me=s.me, reg=regionOf(s.type,me);
  const mks=!vs&&v.marks&&(v.marks.c.length||v.marks.r.length||v.marks.k.length)?v.marks:null, key=JSON.stringify(mks||0);
  MK=mks; if(key!==s.mkKey){ s.mkKey=key; bDirty=true; bReq(); }
  if(s.o.terr&&v.tm) terrSetMap(terrDe(v.tm));
  renderBoard(v.b,s.o,s.pv,{region:reg});
  VE.b=v.b;
  if(vs){
    const chooser=v.ph==='choose'&&prevOf(v.turn)===me;
    renderTray(v.tr,null,{anim,chosen:v.ch,pick:chooser,dim:i=>v.ph==='place'?i!==v.ch:!chooser,nofit:p=>!VE.anyFit(p),hideSrc:s.pending});
    s.ids.forEach(id=>{ if(id!==me) oppSet(id,v.scs[id]||0,null,{label:nm(id)+(v.turn===id?' · vez':''),watch:v.turn===id}); });
    if(!anim) showScore(v.scs[me]||0);
  } else {
    renderTray(v.tr[me]||[null,null,null],v.hold,{anim,holdOn:!!s.o.hold,holdLbl:s.type==='tsplit'?'Guardada (do time)':`Guardada (da ${teamWord()})`,nofit:p=>!VE.anyFit(p,reg),dim:i=>(isTurnType(s.type)&&v.turn!==me&&s.ids.length>1)||!!(s.hook&&s.hook.dimSlot&&s.hook.dimSlot(i)),hideSrc:s.pending});
    if(!anim) showScore(v.sc);
    if(s.type==='tsplit'){ const ot=otherTeam(bdKey(me)), ob=v.bds[ot], cv=$('#oppBoard'); if(cv&&ob) specDraw(cv,ob.b,N,{tmap:s.o.terr?TMAP:null}); const e=$('#oppTeamSc'); if(e) e.textContent=fmtN(ob?ob.sc:0); }
  }
  if(s.hook&&s.hook.render) s.hook.render(v,anim);
  updateCombo(v.combo,v.since);
  renderSharedStatus(performance.now());
}
const SREASON={terrWin:'O mapa ficou todo de uma cor!',terrTravou:'Um time ficou sem jogadas',campwin:'Fase concluída!',campfail:'Não foi dessa vez',time:'Tempo esgotado',stuck:'Sem espaço',sudden:'O tempo da jogada acabou',goal:'Meta atingida',disc:'Conexão perdida'};
function sharedReason(info){ return info.reason==='oppQuit'?`${nm(info.quitter)} saiu da partida`:SREASON[info.reason]||'Fim'; }
function sharedOver(info){
  const s=SH; if(!s||s.over) return;
  s.over=true; s.playing=false; s.overInfo=info; cancelDrag(); $('#pauseOv').classList.remove('show');
  const vs=s.type==='versus', ts=s.type==='tsplit', myT=ts?s.cfg.teams[s.me]:null;
  if(s.hook&&s.hook.over){ s.hook.over(info); return; }
  let res=null;
  if(vs){ res=info.winner===s.me?'win':info.winner?'lose':'tie'; if(info.reason!=='disc'){ addNight(res); seriesAdd(info.winner); NET.lastWinner=info.winner; } }
  if(ts){ res=info.winner===myT?'win':info.winner?'lose':'tie'; if(info.reason!=='disc'){ addNight(res); seriesAdd(info.winner); } }
  if(!vs&&!ts) s.newBest=checkBest(s.type,s.o,info.sc)&&info.sc>0;
  addHist({date:Date.now(),kind:s.type,label:typeName(s.cfg)+' · '+PLAYS[s.o.play]+(s.ids.length>2?` · ${s.ids.length} jogadores`:''),code:'',score:vs?info.scs[s.me]:ts?(info.scT?info.scT[myT]:0):info.sc,lines:info.lines,combo:info.combo,result:res});
  setTimeout(()=>{ if(SH!==s) return;
    praise(vs?(res==='win'?'Você venceu!':res==='lose'?`${nm(info.winner)} venceu`:'Empate'):ts?(res==='win'?'Seu time venceu!':res==='lose'?`${TEAM[info.winner].n} venceu`:'Empate'):sharedReason(info)); SFX.over();
    BC.dead();
    setTimeout(()=>{ if(SH===s) showSharedEnd(info); },1400); },300);
}
function showSharedEnd(info){
  const s=SH, vs=s.type==='versus', me=s.me, ids=info.ids||s.ids;
  let body=`<p class="reason">${esc(sharedReason(info))}</p>`;
  const tl=info.timeline||[[0,0]];
  if(vs){
    const res=info.winner===me?'win':info.winner?'lose':'tie', rows=versusRows({...info,ids});
    body+=winnerLine(res,info.winner||rows[0].id)+rankHTML(rows);
    body+=statsHTML([[info.lines,'linhas'],[info.combo?'x'+info.combo:'0','maior combo'],[tl.length-1,'jogadas']]);
    body+=graphSVG(ids.map((id,k)=>({tl:tl.map(x=>[x[0],x[1+k]||0]),color:id===me?'var(--text)':LINEC[k%LINEC.length],label:nm(id)})));
    body+=seriesLine();
  } else if(s.type==='tsplit'){
    const myT=s.cfg.teams[me], res=info.winner===myT?'win':info.winner?'lose':'tie', sc=info.scT||{az:0,la:0};
    body+=`<div class="winner ${res}">${res==='win'?'Seu time venceu!':res==='lose'?esc(TEAM[info.winner].n)+' venceu':'Empate'}</div>`;
    if(s.o.terr){ const tr=terrSplitTr(info); s.trr=tr; body=`<div class="winner ${res}">${res==='win'?'Seu time venceu!':res==='lose'?esc(caboLado(info.winner,info.teams,me))+' venceu':'Empate'}</div><p class="muted">${esc(terrPorque(tr,info.teams))}</p>`+terrMapHTML(terrDe(info.tm))+terrBarHTML('terrFim'); }
    body+=teamVsHTML(sc,info.teams,ids,info.ptsBy);
    body+=statsHTML([[info.lines,'linhas'],[info.combo?'x'+info.combo:'0','maior combo'],[tl.length-1,'peças']]);
    body+=graphSVG([{tl:tl.map(x=>[x[0],x[1]||0]),color:TEAM.az.c,label:TEAM.az.n},{tl:tl.map(x=>[x[0],x[2]||0]),color:TEAM.la.c,label:TEAM.la.n}]);
    body+=seriesLine();
  } else {
    body+=`<h2>Pontos da ${teamWord()}</h2><div class="endscore">${fmtN(info.sc)}</div>${s.newBest?`<div class="newbest">Novo recorde da ${teamWord()}!</div>`:''}<p class="muted">${esc(ids.map(id=>nm(id)).join(', '))}</p>`;
    body+=statsHTML([[info.lines,'linhas'],[info.combo?'x'+info.combo:'0','maior combo'],[tl.length-1,'peças']]);
    body+=graphSVG([{tl:tl.map(x=>[x[0],x[1]]),color:'var(--text)',label:teamWord()}]);
  }
  const btns=[];
  if(NET.open) btns.push(rematchBtn());
  btns.push({t:'Compartilhar',on:()=>{ let t=`Duelo de Blocos · ${typeName(s.cfg)}\n`+(s.type==='tsplit'?teamShareLine(info.teams,info.scT,info.ptsBy):vs?versusRows({...info,ids}).map(r=>`${r.place}º ${nm(r.id,false)} ${fmtN(r.score)}`).join(' · '):`${fmtN(info.sc)} pontos da ${teamWord()} (${ids.map(id=>nm(id,false)).join(', ')})`)+`\n${info.lines} linhas · combo x${info.combo}`; const l=gameLink(); if(l) t+='\n'+l; shareText(t); }});
  btns.push({t:NET.open?'Voltar à sala':'Menu',cls:'ghost',on:()=>{ if(NET.open) backToRoom(); else goHome(); }});
  openEnd(body,btns);
  if(s.trr){ const f=$('#terrFim'); if(f){ f.classList.add('fim'); terrBarSet(f,s.trr.n,'az',caboLado('az',info.teams,me),caboLado('la',info.teams,me)); } }
}

function hasBlocks(str){ if(!str) return false; for(let i=0;i<str.length;i+=2) if(str[i]!=='.') return true; return false; }
