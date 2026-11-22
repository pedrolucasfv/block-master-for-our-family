'use strict';
/* HUD do jogo, DUELO (local e ao vivo), placar final, pausa e saída */
/* ===================== HUD do jogo ===================== */
function setActions(html){ $('#actions').innerHTML=html; requestAnimationFrame(layout); }
const AURA=['255,255,255','255,214,90','255,150,60','255,90,120','200,110,255','90,170,255','80,230,200','255,255,255'];
function updateCombo(combo,since){
  const key=combo+'|'+since; if(updateCombo.k===key) return; updateCombo.k=key;
  const bd=$('#board'); bd.style.setProperty('--heat',combo>=2?Math.min(1,.35+(combo-2)*.13).toFixed(2):'0'); bd.style.setProperty('--glow',AURA[Math.min(AURA.length-1,Math.max(0,combo-1))]);
  const el=$('#combo');
  /* sempre à vista, do lado dos pontos; aceso a partir do x2 */
  const left=combo>=1?3-since:0; el.innerHTML=`<small>Combo</small><b>x${Math.max(combo,0)}</b><span class="dots">${[0,1,2].map(k=>`<i class="${k<left?'':'off'}"></i>`).join('')}</span>`;
  el.classList.toggle('show',combo>=2);
}
function setTimer(remMs,totalMs,finalOn){
  const t=$('#timer');
  if(totalMs>0){ const txt=fmtT(remMs), st=txt+(remMs<=10000)+!!finalOn;
    if(setTimer.k!==st){ setTimer.k=st; t.textContent=txt; t.classList.toggle('hurry',remMs<=10000); t.classList.toggle('final',!!finalOn&&remMs>10000); }
    const sc=Math.max(0,remMs/totalMs).toFixed(3); if(setTimer.s!==sc){ setTimer.s=sc; $('#timebarFill').style.transform=`scaleX(${sc})`; } }
}
let scoreRaf=0, shownScore=0;
function showScore(v){ cancelAnimationFrame(scoreRaf); const el=$('#score'), from=shownScore, t0=performance.now();
  const step=t=>{ const k=Math.min(1,(t-t0)/400), e=1-Math.pow(1-k,3); const nv=Math.round(from+(v-from)*e); if(nv!==shownScore||k===0){ shownScore=nv; el.textContent=fmtN(nv); el.style.setProperty('--sl',el.textContent.length); } if(k<1) scoreRaf=requestAnimationFrame(step); };
  scoreRaf=requestAnimationFrame(step); }
function resetScore(v=0){ cancelAnimationFrame(scoreRaf); shownScore=v; const el=$('#score'); el.textContent=fmtN(v); el.style.setProperty('--sl',el.textContent.length); }
function setStatus(t,warn){ const s=$('#status'), m=$('#mission');
  /* na campanha o andamento (linhas, peças, o que falta…) vai no cartão ao lado dos pontos, uma informação por linha */
  if(SH&&SH.type==='camp'&&m&&!m.hidden){ const parts=String(t||'').split(' · ').filter(Boolean), html=parts.map((p,i)=>`<div class="${i?'mline':'mbig'}">${esc(p)}</div>`).join('');
    if(m._h!==html){ m._h=html; m.innerHTML=html; } m.classList.toggle('warn',!!warn); s.textContent=''; return; }
  s.textContent=t||''; s.classList.toggle('warn',!!warn); }
$('#gMute').addEventListener('click',()=>{ muted=!muted; store.set('ddb_muted',muted); $('#gMute').textContent=muted?'🔇':'🔊'; if(!muted){ ac(); SFX.pick(); } });

function countdown(token,cb){
  const ov=$('#count'), seq=['3','2','1','Já!']; let i=0;
  ov.classList.add('show');
  const step=()=>{
    if(token()===false){ ov.classList.remove('show'); return; }
    if(i>=seq.length){ ov.classList.remove('show'); cb(); return; }
    ov.innerHTML=`<div class="cd${i===3?' go':''}">${seq[i]}</div>`; SFX.beep(i===3,i); i++;
    setTimeout(step,i===4?550:800);
  };
  step();
}
function graphSVG(series,maxT){
  const W=300,H=100,P=4;
  let mt=Math.max(1,maxT||0), ms=1;
  series.forEach(s=>s.tl.forEach(([t,v])=>{ if(t>mt) mt=t; if(v>ms) ms=v; }));
  const lines=series.map(s=>{ const pts=s.tl.map(([t,v])=>`${(P+(W-2*P)*t/mt).toFixed(1)},${(H-P-(H-2*P)*v/ms).toFixed(1)}`).join(' '); return `<polyline fill="none" style="stroke:${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`; }).join('');
  const legend=series.length>1?`<div class="legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>`:'';
  return `<div class="graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico da pontuação ao longo da partida"><line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" style="stroke:var(--gline)"/>${lines}</svg>${legend}</div>`;
}
function statsHTML(arr){ return `<div class="stats">${arr.map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`; }
function openEnd(body,buttons){
  $('#endBody').innerHTML=body;
  const box=$('#endBtns'); box.innerHTML='';
  buttons.forEach(b=>{ const el=document.createElement('button'); el.className='btn '+(b.cls||''); el.textContent=b.t; el.addEventListener('click',b.on); box.appendChild(el); });
  $('#end').classList.add('show');
}
function closeEnd(){ $('#end').classList.remove('show'); }
async function shareText(text){
  if(navigator.share){ try{ await navigator.share({text}); return; }catch(e){ if(e.name==='AbortError') return; } }
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
/* por que o microfone/câmera não abriu, em palavras simples */
function mediaWhy(kind,e){
  const nome=kind==='mic'?'o microfone':'a câmera';
  let framed=false; try{ framed=window.self!==window.top; }catch(x){ framed=true; }
  const pol=document.permissionsPolicy||document.featurePolicy; let allowed=true; try{ if(pol&&pol.allowsFeature) allowed=pol.allowsFeature(kind==='mic'?'microphone':'camera'); }catch(x){}
  if(framed||!allowed) return `Esta tela não deixa usar ${nome}: o jogo está aberto dentro de outro app (pré-visualização). Abra o jogo direto no Chrome ou no Safari, pelo link do site, para usar ${nome}.`;
  if(!window.isSecureContext) return `Para usar ${nome}, abra o jogo por um link que comece com https.`;
  if(e&&(e.name==='NotFoundError'||e.name==='OverconstrainedError')) return `Não encontrei ${nome} neste aparelho.`;
  if(e&&e.name==='NotReadableError') return `${nome[0].toUpperCase()+nome.slice(1)} está sendo usado por outro app. Feche o outro app e tente de novo.`;
  return `O navegador bloqueou ${nome}. Toque no cadeado (ou nos três pontinhos) ao lado do endereço do site, permita ${nome} e tente de novo.`;
}
function mediaHelp(kind,e){ openEnd(`<h2>${kind==='mic'?'🎙 Microfone':'📷 Câmera'} indisponível</h2><p class="reason" style="margin-top:8px">${esc(mediaWhy(kind,e))}</p>`,[{t:'Entendi',cls:'primary',on:closeEnd}]); }
function gameLink(){ return /^https?:/.test(location.href)?location.href.split('#')[0]:''; }

/* ===================== DUELO (local e ao vivo) ===================== */
let D=null;
function duelLeft(){ return TIMES[D.o.time]*1000-D.elapsed; }
function finalOn(){ return D.o.final && TIMES[D.o.time]>0 && duelLeft()<=30000; }
function startDuel(cfg){
  closeEnd(); IN=null; SH=null; setN(8); MK=null; setForceSkin(null); bossHide();
  const o=cfg.opts, eng=new Engine(o);
  if(o.obstacles) eng.addStones(makeRng(cfg.seed+'|obs'),6);
  if(cfg.handicapMe) eng.addStones(makeRng(cfg.seed+'|hc'),3);
  D={cfg,o,eng,rng:makeRng(cfg.seed),tray:[null,null,null],hold:null,score:0,placed:0,timeline:[[0,0]],undoUsed:false,snap:null,
     playing:false,over:false,paused:false,elapsed:0,lastTick:0,suddenAt:Infinity,pv:null,finalShown:false,lastBlind:0,
     live:cfg.type==='live',wait:cfg.type!=='live'&&(TIMES[o.time]>0||!!o.sudden||rampOn(o)),powers:0,powerLines:0,frozenUntil:0,fog:null,nextGold:30000,others:[],opps:{}};
  if(D.live){ D.others=(cfg.players||[]).filter(id=>id!==NET.role); D.others.forEach(id=>D.opps[id]={score:0,mini:'',b:'',info:null}); D.teams=cfg.teams||null; D.myTeam=D.teams?D.teams[NET.role]:null; }
  resetScore(); animTimers.forEach(clearTimeout); $('#fx').innerHTML=''; BC.reset();
  $('#gLabel').textContent=cfg.label; $('#gMute').textContent=muted?'🔇':'🔊';
  if(D.live){ oppsSetup(D.others,true,id=>{ if(D&&D.spect) pickWatch(id); },D.teams); } else $('#opps').hidden=true;
  $('#scoreLbl').textContent=D.live?'Você':'';
  const tot=TIMES[o.time]*1000;
  $('#timer').textContent=tot?fmtT(tot):(GOALS[o.goal]?'Meta '+GOAL_L[o.goal]:'Sem limite'); $('#timer').className='timer';
  $('#timebar').style.visibility=(tot||GOALS[o.goal])?'visible':'hidden'; $('#timebarFill').style.transform=tot?'scaleX(1)':'scaleX(0)';
  $('#mission').hidden=true; $('#subTxt')._h=''; myEndOff(); D.oldBest=getBest(cfg.type,o); $('#subTxt').textContent=D.oldBest?'Recorde '+fmtN(D.oldBest):(cfg.type==='solo'?'Primeira partida neste modo':'Recorde 0'); updateCombo(0,0); updTeamLine();
  if(D.teams) $('#scoreLbl').textContent=`Você · ${TEAM[D.myTeam].e} ${TEAM[D.myTeam].n}`;
  setStatus(D.live?'':(PLAYS[o.play]!=='Clássico'?'Modo '+PLAYS[o.play]:''));
  $('#fog').classList.remove('show');
  IN=duelIN;
  D.tray=gen3(D.rng,o);
  buildDuelActions();
  show('game');
  renderDuel(true);
  const d=D;
  countdown(()=>D===d&&!d.over,()=>{ d.playing=true; d.lastTick=performance.now(); armSudden(); requestAnimationFrame(duelTick); });
}
function buildDuelActions(){
  let h='';
  if(D.o.undo) h+=`<button class="chip" id="aUndo">↶ Desfazer</button>`;
  if(D.live) h+=`<span class="chip on" id="aShield" hidden></span><span class="chip on" id="aHammer" hidden></span>`;
  if(D.live) h+=emoBtns();
  setActions(h);
  const u=$('#aUndo'); if(u) u.addEventListener('click',duelUndo);
  bindEmos();
}
function renderDuel(anim){
  if(!D) return;
  renderBoard(D.animBoard||D.eng.b,D.o,D.pv);
  renderTray(D.tray,D.hold,{anim,holdOn:D.o.hold,nofit:p=>!D.eng.anyFit(p),frozen:D.frozenUntil>D.elapsed});
  updateCombo(D.eng.combo,D.eng.since);
  const u=$('#aUndo'); if(u) u.disabled=D.undoUsed||!D.snap||!D.playing;
  updPowChips();
  if(D.holdHint) setStatus('Guarde a peça!',true);
  else if(D.hammerHint&&D.hammer>0) setStatus('Nenhuma peça cabe: use o martelo 🔨',true);
  else if(D.live&&!D.o.sudden&&!D.spect){ const bl=bombLeft(D.eng.b); setStatus(bl!=null?`💣 Limpe a bomba em ${bl} jogada${bl>1?'s':''}!`:'',bl!=null&&bl<=1); }
}
const duelIN={
  piece:src=>src==='h'?D.hold:D.tray[src],
  canDrag:src=>D.playing&&!D.paused&&!(D.frozenUntil>D.elapsed)&&!!(src==='h'?D.hold:D.tray[src]),
  check:(p,r,c)=>D.eng.fits(p,r,c)?true:(D.o.play===2&&D.eng.inBounds(p,r,c)?'ghost':false),
  preview:pv=>{ D.pv=pv; renderBoard(D.animBoard||D.eng.b,D.o,pv); },
  drop:(src,r,c)=>duelDrop(src,r,c),
  toHold:src=>duelHold(src)
};
function duelSnap(){ const e=D.eng; return {b:e.snap(),combo:e.combo,since:e.since,maxCombo:e.maxCombo,lines:e.lines,tray:D.tray.slice(),hold:D.hold,score:D.score,placed:D.placed,rng:D.rng.get(),tl:D.timeline.length,powers:D.powers,powerLines:D.powerLines}; }
function duelUndo(){
  if(!D||!D.snap||D.undoUsed||!D.playing||D.paused) return;
  const s=D.snap, e=D.eng;
  e.b=s.b; e.combo=s.combo; e.since=s.since; e.maxCombo=s.maxCombo; e.lines=s.lines;
  D.tray=s.tray; D.hold=s.hold; D.score=s.score; D.placed=s.placed; D.rng.set(s.rng); D.timeline.length=s.tl; D.powers=s.powers; D.powerLines=s.powerLines;
  D.undoUsed=true; D.snap=null; D.animBoard=null; animTimers.forEach(clearTimeout);
  showScore(D.score); renderDuel(); sendState(); armSudden(); toast('Jogada desfeita');
}
function duelHold(src){
  if(src==='h'||!D.o.hold||!D.playing) return false;
  const p=D.tray[src]; D.tray[src]=D.hold||null; D.hold=p;
  if(D.tray.every(x=>!x)) D.tray=gen3(D.rng,D.o);
  if(D.holdHint){ D.holdHint=false; setStatus(''); }
  holdPulse(false); renderDuel(); duelCheckStuck(); return true;
}
function duelDrop(src,r,c){
  const p=src==='h'?D.hold:D.tray[src];
  if(!p||!D.playing) return false;
  if(!D.eng.fits(p,r,c)){ if(D.o.play===2&&D.eng.inBounds(p,r,c)){ flashBad(p,r,c,D.eng.b); renderDuel(); } return false; }
  if(D.o.undo&&!D.undoUsed) D.snap=duelSnap();
  if(src==='h') D.hold=null; else D.tray[src]=null;
  const res=D.eng.place(p,r,c,performance.now());
  D.placed++; if(D.wait){ D.wait=false; setStatus(''); }
  const tb=tickBombs(D.eng); if(tb.boom){ setTimeout(()=>BC.drop(tb.added),0); toast('💣 A bomba explodiu! Blocos cinza no seu tabuleiro'); SFX.boom(); shake(); }
  duelApply(res,r+p.h/2,c+p.w/2,goldTxt('Bloco dourado é seu! +150'));
  const refilled=D.tray.every(x=>!x);
  if(refilled) D.tray=gen3(D.rng,D.o);
  renderDuel(refilled);
  glowCells(res.placed,D.eng.b); ripple(r+(p.h-1)/2,c+(p.w-1)/2,D.eng.b);
  duelAfter(true);
  return true;
}
/* pontos, poderes, ataque, efeitos e animação de um resultado do motor (peça colocada ou dourado fechando linha) */
function duelApply(res,cr,cc,goldMsg){
  let pts=res.pts; if(finalOn()) pts*=2;
  if(res.gold&&D.live){ pts+=150; send({t:'goldWon'}); removeGold(); toast(goldMsg); }
  D.score+=pts; if(res.perfect) D.perfects=(D.perfects||0)+1; updTeamLine();
  if(D.cfg.type==='solo'&&!D.passedBest&&D.oldBest>0&&D.score>D.oldBest){ D.passedBest=true; $('#subTxt').textContent='Recorde: é você agora!'; setTimeout(()=>{ if(D&&!D.over){ praise('NOVO RECORDE!','',false,7); SFX.win(); } },900); }
  D.timeline.push([Math.round(D.elapsed/1000),D.score]);
  if(D.live&&res.powers&&res.powers.length) firePowers(res.powers);
  if(D.live&&D.o.attacks&&res.n>=3){ const k=res.n-1, to=leaderId(); if(to){ send({t:'atk',n:k,to}); toast(`Ataque! ${k} blocos blindados para ${nm(to)} (líder)`); } }
  feedback(res,pts,cr,cc);
  showScore(D.score);
  if(res.steps.length>1||(res.steps[0]&&res.steps[0].falls)){
    const d=D;
    playSteps(res.steps,b=>{ if(D===d){ d.animBoard=b; renderBoard(b,d.o,d.pv); } },()=>{ if(D===d){ d.animBoard=null; renderDuel(); } });
  } else if(res.steps.length){ { const dr=clearDirs(res.steps[0].cleared); res.steps[0].cleared.forEach(([i,c2,s])=>{ const y=(i/N)|0, x=i%N; spawnClear(i,c2,s,Math.hypot(y+.5-cr,x+.5-cc)*30,dr[i]); }); } }
  return pts;
}
function duelAfter(newMove){
  sendState(); if(newMove) armSudden();
  const g=GOALS[D.o.goal];
  if(g&&(D.teams?teamSum(D.myTeam):D.score)>=g){ duelEnd('goal'); return; }
  if(passedOpp()){ duelEnd('passed'); return; }
  duelCheckStuck();
}
/* com o espaço de guardar vazio e só uma peça na bandeja, guardar traz 3 peças novas: ainda há jogada */
function holdRescue(tray,hold,on){ return !!on&&!hold&&tray.filter(Boolean).length===1; }
function duelCheckStuck(){ if(!D.playing) return; const ps=[...D.tray,D.hold].filter(Boolean); D.holdHint=false; const hh=D.hammerHint; D.hammerHint=false;
  if(ps.some(p=>D.eng.anyFit(p))){ holdPulse(false); if(hh) setStatus(''); return; }
  /* martelo sobrando: ainda dá para abrir espaço, não perde */
  if(D.hammer>0){ D.hammerHint=true; if(!hh) toast('Nenhuma peça cabe: use o martelo 🔨 para abrir espaço'); setStatus('Nenhuma peça cabe: use o martelo 🔨',true); return; }
  if(holdRescue(D.tray,D.hold,D.o.hold)){ D.holdHint=true; toast('Nenhuma peça cabe: guarde a peça para receber peças novas'); holdPulse(true); setStatus('Guarde a peça!',true); return; }
  duelEnd('stuck'); }
function holdPulse(on){ const h=$('#holdSlot'); if(h) h.classList.toggle('pulse',!!on); }
function armSudden(){ if(!D) return; if(D.o.sudden) D.suddenAt=D.elapsed+5000; else if(rampOn(D.o)){ const l=rampLim(D.elapsed); D.suddenAt=l?D.elapsed+l*1000:Infinity; } }
/* Desafio do dia: tempo livre no começo, depois um limite por peça que vai apertando. [a partir de (s), segundos por peça] */
const RAMP=[[180,8],[360,5],[540,3]];
function rampLim(el){ let l=0; for(const [t,s] of rampOf(D.o)) if(el>=t*1000) l=s; return l; }
function rampTick(){
  const el=D.elapsed, l=rampLim(el);
  if(l!==(D.rampL||0)){ D.rampL=l; D.suddenAt=Math.min(D.suddenAt,el+l*1000); praise(`⏱ Agora ${l} s por peça!`); SFX.alert(); }
  const R=rampOf(D.o);
  if(!l){ const nx=R[0][0]*1000-el; setStatus(`Tempo livre por mais ${fmtT(nx)} · depois ${R[0][1]} s por peça`,false); return true; }
  const left=D.suddenAt-el, nxt=R.find(([t])=>t*1000>el);
  setStatus(`⏱ ${(Math.max(0,left)/1000).toFixed(1).replace('.',',')} s para pôr a peça`+(nxt?` · em ${fmtT(nxt[0]*1000-el)}: ${nxt[1]} s`:''),left<2000);
  if(left<=0){ duelEnd('sudden'); return false; } return true;
}
function duelTick(t){
  if(!D||D.over) return;
  const dt=Math.min(1000,t-D.lastTick); D.lastTick=t;
  if(D.playing&&!D.paused){
    /* jogando sozinho: o relógio só começa depois do primeiro toque ou da primeira peça */
    if(D.wait){ if(!D.waitShown){ D.waitShown=1; setStatus('⏸ Relógio parado · toque na tela ou jogue uma peça para começar'); } requestAnimationFrame(duelTick); return; }
    D.elapsed+=dt;
    const tot=TIMES[D.o.time]*1000;
    if(tot){ const left=tot-D.elapsed; setTimer(left,tot,finalOn());
      if(finalOn()&&!D.finalShown){ D.finalShown=true; praise('Reta final: pontos em dobro'); SFX.alert(); }
      const s=Math.ceil(left/1000); if(s<=5&&s>0&&s!==D.lastBeep){ D.lastBeep=s; SFX.tick(); }
      if(left<=0){ duelEnd('time'); return; } }
    else if(GOALS[D.o.goal]) $('#timebarFill').style.transform=`scaleX(${Math.min(1,D.score/GOALS[D.o.goal])})`;
    if(rampOn(D.o)&&!rampTick()) return;
    if(D.o.sudden){ const l=D.suddenAt-D.elapsed; setStatus('Coloque a peça: '+(Math.max(0,l)/1000).toFixed(1).replace('.',',')+' s',l<2000); if(l<=0){ duelEnd('sudden'); return; } }
    if(D.o.play===2&&t-D.lastBlind>250){ D.lastBlind=t; renderBoard(D.animBoard||D.eng.b,D.o,D.pv); }
    if(D.frozenUntil&&D.elapsed>D.frozenUntil){ D.frozenUntil=0; renderDuel(); }
    if(D.fog&&D.elapsed>D.fog.until){ D.fog=null; $('#fog').classList.remove('show'); }
    if(D.live&&D.o.powers&&NET.role==='A'&&D.elapsed>=D.nextGold){ D.nextGold+=40000; spawnGold(); }
  }
  requestAnimationFrame(duelTick);
}
function boardStr(b){ return b.flat().map(v=>{ if(!v) return '.-'; const c=v.c===-2?'g':v.c<0?'s':String(v.c); const s=v.s==='bomb'?'b':v.s==='ice'?'i':v.s==='wild'?'w':v.cr?'c':'-'; return c+s; }).join(''); }
function strBoard(str){ const b=Array.from({length:N},()=>Array(N).fill(null)); if(!str) return b; for(let i=0;i<64;i++){ const c=str[i*2], s=str[i*2+1]; if(!c||c==='.') continue; b[(i/N)|0][i%N]={c:c==='s'?-1:c==='g'?-2:+c,s:s==='b'?'bomb':s==='i'?'ice':s==='w'?'wild':null,cr:s==='c'?1:0,t:Infinity}; } return b; }
function sendState(){ if(!D||!D.live||D.over) return; send({t:'st',seed:D.cfg.seed,s:D.score,m:D.eng.b.flat().map(v=>v?(v.c<0&&v.c!==-2?2:1):0).join(''),b:boardStr(D.eng.b),c:D.eng.combo,k:D.eng.since}); }
function stillPlaying(){ return D&&D.others?D.others.filter(id=>!D.opps[id].info):[]; }
const EMOS=['😂','😱','🔥','👏','😈'];
function emoBtns(){ return EMOS.map(e=>`<button class="emo" data-e="${e}">${e}</button>`).join('')+chatBtn(); }
function bindEmos(){ $$('#actions .emo[data-e]').forEach(b=>b.addEventListener('click',()=>{ send({t:'emo',e:b.dataset.e}); bigEmoji(b.dataset.e); })); }
function enterSpectate(){
  const d=D; d.spect=true; IN=null; cancelDrag();
  BC.reset();
  renderTray([null,null,null],null,{holdOn:false});
  updateCombo(0,0);
  setActions(`<button class="chip" id="aMine">Meu resultado</button>`+emoBtns());
  $('#aMine').addEventListener('click',showDuelEnd); bindEmos();
  d.watch=null; pickWatch(); d.lastTick=performance.now(); requestAnimationFrame(spectTick);
}
/* assiste o jogador que ainda está jogando com mais pontos (toque num placar para trocar) */
function pickWatch(force){
  const d=D; if(!d||!d.spect) return false; const pl=stillPlaying();
  if(!pl.length){ d.watch=null; return false; }
  if(force&&pl.includes(force)) d.watch=force;
  else if(!d.watch||d.opps[d.watch].info) d.watch=pl.sort((a,b)=>d.opps[b].score-d.opps[a].score)[0];
  d.prevB=null; d.prevC=d.opps[d.watch].c||0; resetScore(d.opps[d.watch].score); renderSpect(); return true;
}
function myEndOff(){ const e=$('#myEndBig'); if(e) e.remove(); }
function renderSpect(){
  const d=D; if(!d||!d.spect||!d.watch) return; const op=d.opps[d.watch];
  const b=strBoard(op.b); renderBoard(b,{...d.o,play:0},null);
  if(d.prevB&&op.b){ const old=d.prevB, nw=[]; for(let i=0;i<64;i++){ if(old[i*2]==='.'&&op.b[i*2]!=='.') nw.push(i); } glowCells(nw,b); }
  d.prevB=op.b; showScore(op.score);
  /* combo de quem você está assistindo (vem junto com o tabuleiro); subiu para x2 ou mais: aparece no tabuleiro */
  const c=op.c||0; updateCombo(c,op.k||0); if(c>=2&&c>(d.prevC||0)) praise('COMBO x'+c,undefined,false,Math.min(7,c+1)); d.prevC=c;
  $('#scoreLbl').textContent=nm(d.watch);
  /* onde você parou, em destaque embaixo do tabuleiro (no lugar das peças), com a sua posição agora (muda se alguém passar) */
  const pos=1+d.others.filter(id=>{ const o=d.opps[id]; return (o.info?o.info.score:o.score)>d.info.score; }).length;
  let me=$('#myEndBig'); if(!me){ me=document.createElement('div'); me.id='myEndBig'; $('#tray').appendChild(me); }
  const h=`<small>🏁 Você parou em</small><b>${fmtN(d.info.score)}</b><span>${pos}º lugar agora</span>`;
  if(me._h!==h){ me._h=h; me.innerHTML=h; } $('#subTxt').textContent='';
  setStatus('Assistindo '+nm(d.watch)+(stillPlaying().length>1?' · toque num placar para trocar':''));
  d.others.forEach(id=>oppSet(id,d.opps[id].score,null,{watch:id===d.watch}));
}
function spectTick(t){
  const d=D; if(!d||!d.spect||!stillPlaying().length) return;
  const dt=Math.min(1000,t-d.lastTick); d.lastTick=t; if(!d.paused) d.elapsed+=dt;
  const tot=TIMES[d.o.time]*1000; if(tot) setTimer(tot-d.elapsed,tot,false);
  requestAnimationFrame(spectTick);
}
function removeGold(){ const b=D.eng.b; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(b[y][x]&&b[y][x].c===-2) b[y][x]=null; renderDuel(); }
function spawnGold(){
  const cand=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!D.eng.b[y][x]&&!D.eng.wouldFill(y,x)) cand.push([y,x]);
  if(!cand.length) return; const [y,x]=cand[Math.floor(Math.random()*cand.length)];
  applyGold(y,x); send({t:'gold',y,x});
}
function applyGold(y,x){
  if(!D||D.over) return;
  const e=D.eng, b=e.b;
  /* a casa foi sorteada no tabuleiro de quem criou a sala: se aqui ela já tem bloco, escolhe outra vazia */
  if(b[y][x]){ const free=[]; for(let yy=0;yy<N;yy++) for(let xx=0;xx<N;xx++) if(!b[yy][xx]) free.push([yy,xx]); if(!free.length) return;
    const safe=free.filter(([a,c])=>!e.wouldFill(a,c)), pool=safe.length?safe:free; [y,x]=pool[Math.floor(Math.random()*pool.length)]; }
  b[y][x]={c:-2,s:null,t:performance.now()};
  const fl=e.fullLines();
  if(!fl.rows.length&&!fl.cols.length){ renderDuel(); toast(goldTxt('Bloco dourado! Quem eliminar primeiro leva +150')); return; }
  /* caiu no último buraco de uma linha ou coluna: fecha na hora e o dono do tabuleiro leva tudo */
  const res=e.settle(0);
  duelApply(res,y+.5,x+.5,goldTxt('O dourado fechou sua linha! +150 para você'));
  renderDuel(); glowCells([y*N+x],b); duelAfter(false);
}
/* ataques e poderes vão para o líder (quem está jogando com mais pontos, fora você) */
function teamSum(k){ if(!D||!D.teams) return 0; return (D.myTeam===k?D.score:0)+D.others.filter(id=>D.teams[id]===k).reduce((s,id)=>{ const o=D.opps[id]; return s+(o.info?o.info.score:o.score); },0); }
function updTeamLine(){ if(!D||!D.teams) return;
  ['az','la'].forEach(k=>{ const e=$(`#opps [data-tsum="${k}"]`), t=fmtN(teamSum(k)); if(e&&e.textContent!==t) e.textContent=t; });
  const m=$('#opps [data-mysc]'); if(m) m.textContent=fmtN(D.spect&&D.info?D.info.score:D.score);
  if(!D.spect) $('#subTxt').textContent=''; /* o total de cada time fica em cima da coluna dele */ }
function leaderId(){ let pl=stillPlaying(); if(D&&D.teams) pl=pl.filter(id=>D.teams[id]!==D.myTeam); if(!pl.length) return null; return pl.sort((a,b)=>D.opps[b].score-D.opps[a].score)[0]; }
/* blocos de poder no duelo: ataques vão para o líder (do outro time, nos times); escudo e martelo são seus */
function firePowers(list){
  for(const k of list){
    if(k==='escudo'){ D.shield=Math.min(2,(D.shield||0)+1); toast('🛡️ Escudo! O próximo ataque contra você será bloqueado'); continue; }
    if(k==='martelo'){ D.hammer=(D.hammer||0)+3; toast('🔨 Martelo! Toque em 3 blocos do seu tabuleiro para quebrar'); continue; }
    const to=leaderId(); if(!to){ toast(`${PWI[k]} ${PWN[k]}: ninguém jogando para receber`); continue; }
    if(k==='pedra'){ send({t:'atk',n:2,to,pw:1}); toast(`🧱 Pedra! 2 blindados para ${nm(to)}`); }
    else { const kk=k==='gelo'?'freeze':k==='nevoa'?'fog':'tbomb'; send({t:'pw',k:kk,side:FOG_SIDES[Math.floor(Math.random()*4)],to}); toast(`${PWI[k]} ${PWN[k]} em ${nm(to)}!`); }
  }
  updPowChips();
}
function updPowChips(){ const s=$('#aShield'), h=$('#aHammer'); if(!D) return;
  if(s){ s.hidden=!(D.shield>0); s.textContent='🛡️ x'+(D.shield||0); }
  if(h){ h.hidden=!(D.hammer>0); h.textContent=`🔨 toque em ${D.hammer} bloco${D.hammer>1?'s':''}`; } }
function shieldBlock(from){ if(!D||!(D.shield>0)) return false; D.shield--; updPowChips(); toast(`🛡️ Seu escudo bloqueou o ataque de ${nm(from)}`); send({t:'blk',to:from}); SFX.alert(); return true; }
function receivePower(k,side,from){
  if(!D||D.over) return;
  if(shieldBlock(from)) return;
  showAttacker(from,k==='freeze'?`${nm(from)} congelou você!`:k==='fog'?`${nm(from)} jogou névoa!`:`${nm(from)} jogou uma bomba-relógio!`);
  if(k==='freeze'){ D.frozenUntil=D.elapsed+4000; cancelDrag(); toast(`${nm(from)} congelou suas peças por 4 s`); }
  else if(k==='fog'){ D.fog={until:D.elapsed+5000}; fogShow(side,0); toast(`${nm(from)} jogou névoa no seu tabuleiro`); }
  else if(k==='tbomb'){ const i=placeTimeBomb(D.eng); if(i>=0) setTimeout(()=>BC.drop([i]),0); toast('💣 Bomba-relógio! Limpe a linha ou coluna dela em 3 jogadas'); sendState(); }
  SFX.alert(); renderDuel();
}
function receiveAttack(n,from){
  if(!D||D.over) return;
  if(shieldBlock(from)) return;
  const added=D.eng.addStones(Math.random,n,-1,'ice'); renderDuel();
  BC.drop(added);
  const b=$('#board'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
  showAttacker(from,`${nm(from)} atacou! +${added.length} blindados`); toast(`${nm(from)} atacou você (líder). Blocos blindados precisam ser limpos 2 vezes`);
  SFX.boom(); SFX.alert(); sendState(); setTimeout(()=>{ if(D&&!D.over) duelCheckStuck(); },600);
}
function passedOpp(){
  if(!D||!D.live||!D.others.length) return false;
  /* times: se todo mundo do outro time já terminou e o meu time tem mais pontos, não tem mais como virar */
  if(D.teams){ const ot=D.myTeam==='az'?'la':'az', mem=D.others.filter(id=>D.teams[id]===ot);
    if(!mem.length||!mem.every(id=>D.opps[id].info)) return false; if(mem.some(id=>D.opps[id].info.reason==='goal')) return false;
    return teamSum(D.myTeam)>teamSum(ot); }
  const inf=D.others.map(id=>D.opps[id].info); if(inf.some(x=>!x)) return false;
  const real=inf.filter(x=>x.reason!=='quit'); if(!real.length||real.some(x=>x.reason==='goal')) return false;
  return D.score>Math.max(...real.map(x=>x.score));
}
const REASON={time:'Tempo esgotado',stuck:'Sem espaço',sudden:'O tempo da peça acabou',goal:'Meta atingida',quit:'Você saiu'};
function reasonTxt(r){ if(r==='oppGoal'&&D&&D.teams&&D.goalBy) return `${TEAM[D.teams[D.goalBy]].n} atingiu a meta`; if(r==='goal'&&D&&D.teams) return 'Seu time atingiu a meta'; if(r==='passed') return D&&D.teams?'O outro time terminou e o seu já tem mais pontos':D&&D.others&&D.others.length>1?'Você passou a pontuação de todos':'Você passou a pontuação do outro'; if(r==='oppGoal') return `${nm(D&&D.goalBy)} atingiu a meta`; return REASON[r]||''; }
function duelEnd(reason){
  if(!D||D.over) return;
  const d=D; d.over=true; d.playing=false; cancelDrag();
  d.info={reason,score:d.score,lines:d.eng.lines,combo:d.eng.maxCombo,placed:d.placed,timeline:d.timeline,elapsed:d.elapsed,goalTime:reason==='goal'?d.elapsed:null};
  if(d.live){ send({t:'end',seed:d.cfg.seed,info:d.info}); noteEnd(NET.role,d.info,d.cfg.seed); saveLastOnline(); }
  if(d.cfg.type==='daily'){ const dl=store.get('ddb_daily',{}); dl[d.cfg.key]={score:d.score,lines:d.eng.lines,combo:d.eng.maxCombo}; store.set('ddb_daily',dl); }
  if(d.cfg.type==='chal') dsRoundEnd(d);
  if(d.cfg.type==='daily') rkDailyEnd(d);
  d.newBest=d.cfg.type!=='chal'&&checkBest(d.cfg.type,d.o,d.score)&&d.score>0;
  if(d.cfg.type==='solo') soloRecord(d);
  if(!d.live) addHist({date:Date.now(),kind:d.cfg.type,label:d.cfg.type==='daily'?'Desafio do dia':d.cfg.type==='chal'?d.cfg.label:d.cfg.type==='solo'?'Sozinho · '+timeName(d.o.time)+' · '+PLAYS[d.o.play]:'Duelo · '+PLAYS[d.o.play],code:d.cfg.code||'',score:d.score,lines:d.eng.lines,combo:d.eng.maxCombo,result:null});
  setTimeout(()=>{ if(D!==d) return; praise(reasonTxt(reason)); SFX.over(); BC.dead();
    setTimeout(()=>{ if(D!==d) return; if(d.live&&stillPlaying().length&&(NET.open||d.cfg.npc)) enterSpectate(); else showDuelEnd(); },1400); }, reason==='stuck'?450:0);
}
/* classificação: quem saiu fica por último; quem bateu a meta antes vem primeiro; depois, mais pontos */
function liveRank(infos){
  const ids=Object.keys(infos);
  const key=i=>{ const x=infos[i]; return [x.reason==='quit'?1:0,x.goalTime!=null?x.goalTime:Infinity,-x.score]; };
  const cmp=(a,b)=>{ const A=key(a),B=key(b); for(let k=0;k<3;k++){ if(A[k]<B[k]) return -1; if(A[k]>B[k]) return 1; } return 0; };
  ids.sort(cmp); const out=[];
  ids.forEach((id,i)=>out.push({id,info:infos[id],place:i&&cmp(ids[i-1],id)===0?out[i-1].place:i+1}));
  return out;
}
function resOf(rank,me){ const r=rank.find(x=>x.id===me); if(!r||r.place>1) return 'lose'; return rank.filter(x=>x.place===1).length>1?'tie':'win'; }
const LINEC=['var(--gold)','#2cb4d6','#e5483f','#8a52d8','#4cbb47','#f08c25'];
function winnerLine(res,firstId){ return `<div class="winner ${res}">${res==='win'?'Você venceu!':res==='tie'?'Empate':esc(nm(firstId))+' venceu'}</div>`; }
/* placar final: lado a lado com 2 jogadores, lista com 3 ou mais */
function rankHTML(rows){
  if(rows.length===2){ const me=rows.find(r=>r.id===NET.role)||rows[0], op=rows.find(r=>r!==me);
    return `<div class="vs"><div>${avatarHTML(me.id,34)}<b>${fmtN(me.score)}</b><span>${esc(nm(me.id))}</span></div><div class="x">×</div><div>${avatarHTML(op.id,34)}<b>${fmtN(op.score)}</b><span>${esc(nm(op.id))}${op.sub?' · '+op.sub:''}</span></div></div>`; }
  return `<div class="rank">${rows.map(r=>`<div class="kv${r.id===NET.role?' me':''}"><span>${r.place}º ${avatarHTML(r.id,22)}${esc(nm(r.id))}${r.sub?' <small class="muted">'+r.sub+'</small>':''}</span><b>${fmtN(r.score)}</b></div>`).join('')}</div>`;
}
function rematchBtn(){
  if(NET.role==='A'){ const n=NET.rematchReq.size; return {t:'Revanche para todos'+(n?` (${n} pediram)`:''),cls:'primary',on:()=>hostStart(true)}; }
  return {t:NET.rematch.me?'Revanche pedida ✓':'Pedir revanche',cls:'primary',on:requestRematch};
}
function waitListHTML(){ const d=D; return `<div class="rank">${d.others.map(id=>{ const o=d.opps[id]; return `<div class="kv"><span>${esc(nm(id))} <small class="muted">${o.info?(o.info.reason==='quit'?'saiu':'terminou'):'jogando'}</small></span><b>${fmtN(o.info?o.info.score:o.score)}</b></div>`; }).join('')}</div>`; }
function backToRoom(){ if(NET.role==='A') send({t:'lobby'}); toLobby(); }
function showDuelEnd(){
  const d=D, i=d.info, live=d.live;
  let body=`<p class="reason">${reasonTxt(i.reason)}</p>`;
  const stats=[[i.lines,'linhas'],[i.combo?'x'+i.combo:'0','maior combo'],[i.placed,'peças']];
  if(i.goalTime!=null) stats[2]=[fmtT(i.goalTime),'até a meta'];
  const btns=[];
  if(live){
    if(!stillPlaying().length&&d.teams){
      const infos={[NET.role]:i}; d.others.forEach(id=>infos[id]=d.opps[id].info);
      const tr=d.tr||(d.tr=teamResult(infos,d.teams)), res=d.res||(d.res=tr.winner===d.myTeam?'win':tr.winner?'lose':'tie'), per={}; for(const id in infos) per[id]=infos[id].score;
      if(!d.resolved){ d.resolved=true; addNight(res); seriesAdd(tr.winner); NET.lastWinner=null; addHist({date:Date.now(),kind:'live',label:'Times ao vivo · '+PLAYS[d.o.play],code:'',score:i.score,lines:i.lines,combo:i.combo,result:res}); }
      body+=`<div class="winner ${res}">${res==='win'?'Seu time venceu!':res==='lose'?esc(TEAM[tr.winner].n)+' venceu':'Empate'}</div>`+teamVsHTML(tr.sum,d.teams,Object.keys(infos),per);
      body+=statsHTML(stats)+graphSVG(Object.keys(infos).map(id=>({tl:infos[id].timeline||[[0,0]],color:TEAM[d.teams[id]].c,label:nm(id)})));
      body+=seriesLine(); d.rank=null;
      if(NET.open) btns.push(rematchBtn());
    } else if(!stillPlaying().length){
      const infos={[NET.role]:i}; d.others.forEach(id=>infos[id]=d.opps[id].info);
      const rank=d.rank||(d.rank=liveRank(infos)), res=d.res||(d.res=resOf(rank,NET.role));
      if(!d.resolved){ d.resolved=true; if(d.cfg.npc) npcRecord(res,i); else liveRecord(res,i,rank); }
      body+=winnerLine(res,rank[0].id)+rankHTML(rank.map(r=>({id:r.id,score:r.info.score,place:r.place,sub:r.info.reason==='quit'?'saiu':''})));
      body+=statsHTML(stats)+graphSVG(rank.map((r,k)=>({tl:r.info.timeline||[[0,0]],color:r.id===NET.role?'var(--text)':LINEC[k%LINEC.length],label:nm(r.id)})));
      body+=seriesLine();
      if(NET.open) btns.push(rematchBtn());
      else if(d.cfg.npc) btns.push({t:'Revanche',cls:'primary',on:()=>startNpc(d.o)});
    } else {
      body+=`<h2>Sua pontuação</h2><div class="endscore">${fmtN(i.score)}</div><p class="muted">Aguardando os outros terminarem…</p><div id="waitList">${waitListHTML()}</div>`;
      body+=statsHTML(stats)+graphSVG([{tl:i.timeline,color:'var(--text)',label:'Você'}]);
      if(d.spect) btns.push({t:'Assistir',cls:'primary',on:closeEnd});
    }
    btns.push({t:'Compartilhar',on:()=>shareText(shareMsg())});
    btns.push(d.cfg.npc?{t:'Menu',cls:'ghost',on:npcMenu}:{t:'Voltar à sala',cls:'ghost',on:backToRoom});
  } else {
    body+=`<h2>${d.cfg.type==='daily'?'Desafio do dia':'Sua pontuação'}</h2><div class="endscore">${fmtN(i.score)}</div>${d.newBest?'<div class="newbest">Novo recorde!</div>':''}`;
    if(d.cfg.type==='solo'){
      body+=d.newBest?'':`<p class="muted">Recorde neste modo: ${fmtN(getBest('solo',d.o))}</p>`;
      if(d.broke&&d.broke.length) body+=`<p class="newbest">${d.broke.join(' · ')}</p>`;
      if(d.unlocked&&d.unlocked.length) body+=`<div class="unlock"><p class="muted">Conquista${d.unlocked.length>1?'s':''} nova${d.unlocked.length>1?'s':''}</p>${d.unlocked.map(achHTML).join('')}</div>`;
    }
    body+=statsHTML(stats)+graphSVG([{tl:i.timeline,color:'var(--text)',label:'Você'}]);
    if(d.cfg.type==='duel'){
      body+=`<div class="sep"></div><p class="muted">Compare com o outro celular. Quem venceu esta rodada?</p><div class="who" id="whoBox"><button class="btn" data-r="win">Eu</button><button class="btn" data-r="tie">Empate</button><button class="btn" data-r="lose">O outro</button></div><p class="muted" id="whoMsg">${offSeriesTxt()}</p>`;
      btns.push({t:'Revanche',cls:'primary',on:()=>{ closeEnd(); setup.round++; showReady(); }});
    }
    if(d.cfg.type==='solo') btns.push({t:'Jogar de novo',cls:'primary',on:()=>startSolo(d.o)});
    if(d.cfg.type==='chal'){ body+=`<p class="muted">Rodada ${d.cfg.chal.r} enviada. Agora avise quem você desafiou!</p>`; btns.push(...dsEndBtns(d)); }
    else { btns.push({t:'Compartilhar',on:()=>shareText(shareMsg())});
      btns.push({t:'Menu',cls:'ghost',on:d.cfg.type==='solo'?()=>{ closeEnd(); D=null; IN=null; openSolo(); }:goHome}); }
  }
  if(!d.live&&d.cfg.type==='daily') body+='<div id="rkDaily"></div>';
  openEnd(body,btns);
  if(!d.live&&d.cfg.type==='daily') rkDailyBox('#rkDaily',d.cfg.key);
  $$('#whoBox .btn').forEach(b=>b.addEventListener('click',()=>{
    if(d.whoDone) return; d.whoDone=true; const r=b.dataset.r;
    addNight(r); const h=store.get('ddb_hist',[]); if(h[0]) { h[0].result=r; store.set('ddb_hist',h); }
    if(SERIES_N[d.o.series]>1){ if(r==='win') setup.ser.me++; else if(r==='lose') setup.ser.other++; }
    $$('#whoBox .btn').forEach(x=>{ x.disabled=x!==b; }); $('#whoMsg').textContent=offSeriesTxt(true);
  }));
  if(i.score>0&&(d.cfg.type!=='solo'||d.newBest||(d.unlocked&&d.unlocked.length))) setTimeout(()=>SFX.win(),300);
}
function offSeriesTxt(after){
  const n=SERIES_N[setup.opts?setup.opts.series:0]; if(!n||n<2) return after?'Resultado salvo no placar da noite.':'';
  const need=Math.ceil(n/2), s=setup.ser;
  if(s.me>=need) return `Você venceu a série (${s.me} × ${s.other})! A revanche começa uma série nova.`;
  if(s.other>=need) return `O outro venceu a série (${s.other} × ${s.me}). A revanche começa uma série nova.`;
  return `${SERIES_L[setup.opts.series]}: Você ${s.me} × ${s.other} Outro`;
}
function shareMsg(){
  const i=D?D.info:null; if(!i) return '';
  const head=D.cfg.type==='daily'?`Duelo de Blocos · Desafio do dia ${dailyCode(D.cfg.key)}`:`Duelo de Blocos · ${D.cfg.label}`+(D.cfg.type==='solo'&&D.newBest?' · novo recorde!':'');
  let t=`${head}\n${fmtN(i.score)} pontos · ${i.lines} linhas · combo x${i.combo}`;
  if(D.live&&D.teams&&D.tr){ const per={[NET.role]:i.score}; D.others.forEach(id=>per[id]=D.opps[id].info?D.opps[id].info.score:0); t+='\n'+teamShareLine(D.teams,D.tr.sum,per); }
  else if(D.live&&D.rank) t+='\n'+D.rank.map(r=>`${r.place}º ${nm(r.id,false)} ${fmtN(r.info.score)}`).join(' · ');
  if(D.cfg.code) t+=`\nCódigo: ${D.cfg.code}`;
  t+='\nConsegue bater?'; const l=gameLink(); if(l) t+='\n'+l;
  return t;
}
function goHome(){ closeEnd(); D=null; SH=null; IN=null; renderNight(); show('home'); }

/* pausa e saída */
/* campanha travada sem ajuda usada ainda: a pausa vira a escolha entre usar ajuda (no máximo ★★) ou recomeçar (ainda vale ★★★) */
function campStuckPauseTxt(){
  const cp=SH&&SH.type==='camp'?(SH.host?SH.H&&SH.H.cp:SH.view&&SH.view.cp):null, ask=!!(cp&&cp.needHelp&&!(cp.used&&cp.used.length)), boss=SH&&(SH.cfg.solo||SH.host);
  $('#pResume').textContent=ask?'Continuar com ajuda (máx. ★★)':'Continuar';
  $('#pRetry').textContent=ask?'↻ Recomeçar a fase (vale ★★★)':'↻ Tentar de novo';
  if(!ask) return;
  $('#pauseTitle').textContent='Nenhuma peça cabe';
  $('#pauseTxt').textContent=boss?'Você ainda tem ajudas (🔨 🔀 💥) para continuar, mas quem usa ajuda fica com no máximo ★★ nesta fase. Quer continuar com ajuda ou recomeçar para tentar ★★★?'
    :'Ainda dá para continuar com ajuda (🔨 🔀 💥), mas aí a fase vale no máximo ★★. Quem criou a sala pode recomeçar para tentar ★★★.';
}
function setPaused(p,fromRemote){
  const g=D||SH; if(!g||g.over) return;
  if(SH&&!SH.host&&!fromRemote){ act({k:p?'pause':'resume'}); return; }
  g.paused=p; if(SH&&SH.host){ SH.H.paused=p; broadcast(); }
  if(D&&D.live&&!fromRemote) send({t:p?'pause':'resume'});
  $('#pRetry').hidden=!(SH&&SH.type==='camp'&&(SH.cfg.solo||SH.host));
  if(p){ cancelDrag(); campPauseInfo(); $('#pauseTitle').textContent='Pausado'; $('#pauseTxt').textContent=fromRemote?(typeof fromRemote==='string'?nm(fromRemote)+' pausou a partida.':'A partida foi pausada.'):(D&&(!D.live||D.cfg.npc)&&!SH?'O tempo está parado.':'A partida está pausada para todos.'); campStuckPauseTxt(); $('#pauseOv').classList.add('show'); }
  else { $('#pauseOv').classList.remove('show'); if($('#settings').classList.contains('active')) show('game'); }
}
$('#gPause').addEventListener('click',()=>{ const g=D||SH; if(g&&g.playing) setPaused(true); });
$('#pResume').addEventListener('click',()=>setPaused(false));
$('#pRetry').addEventListener('click',()=>{ if(!SH||SH.type!=='camp') return; const cfg=SH.cfg; $('#pauseOv').classList.remove('show'); bossHide(); SH.over=true; if(SH.H) SH.H.over=SH.H.over||{reason:'retry'}; campGo(cfg.camp.ph,cfg); });
$('#pSet').addEventListener('click',()=>{ $('#pauseOv').classList.remove('show'); openSettings('game'); });
$('#pQuit').addEventListener('click',()=>{ $('#pauseOv').classList.remove('show'); quitGame(); });
$('#gQuit').addEventListener('click',()=>$('#quitOv').classList.add('show'));
$('#qNo').addEventListener('click',()=>$('#quitOv').classList.remove('show'));
$('#qYes').addEventListener('click',()=>{ $('#quitOv').classList.remove('show'); quitGame(); });
function quitGame(){
  $('#count').classList.remove('show'); cancelDrag();
  if(D&&D.cfg.type==='chal'&&!D.over){ const c=D.cfg.chal; dsSend(c.id,c.r,D.score); toast(`Rodada ${c.r} enviada com ${fmtN(D.score)} pontos.`); }
  if(D){ const live=D.live, npc=D.cfg.npc; if(live&&!D.over){ D.over=true; D.playing=false; const info={reason:'quit',score:D.score,lines:D.eng.lines,combo:D.eng.maxCombo,placed:D.placed,timeline:D.timeline,goalTime:null}; send({t:'end',seed:D.cfg.seed,info}); noteEnd(NET.role,info,D.cfg.seed); }
    D.over=true; D.playing=false; D=null; IN=null; if(npc){ npcLeave(); openSolo(); return; } if(live&&NET.open){ toLobby(); return; } }
  if(SH&&SH.cfg.solo){ SH.over=true; SH=null; IN=null; $('#timebar').classList.remove('hp'); openCamp(); return; }
  if(SH){ if(NET.open&&!SH.over){ if(SH.host) hostEnd('oppQuit',null,SH.me); else send({t:'quit'}); } SH.over=true; SH=null; IN=null; if(NET.open){ toLobby(); return; } }
  goHome();
}
