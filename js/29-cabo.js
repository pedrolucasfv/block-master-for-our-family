'use strict';
/* CABO DE GUERRA: duelo ao vivo (1×1 ou times) com uma corda que segue a diferença de pontos; ataques dão tranco; travou, perdeu */
/* A partida é um duelo ao vivo com times (D.teams) e D.o.cabo ligado. Cada celular calcula a corda sozinho com os pontos
   e os trancos que todos mandam no 'st' (campo tc); quem vê a corda chegar na ponta, ou o outro lado inteiro travar, termina. */
const CABO_PTS=1000, CABO_TRANCO=150, CABO_CAI=['stuck','sudden','quit'];
const caboOn=()=>!!(D&&D.live&&D.o.cabo&&D.teams);
/* força de um lado = pontos + trancos de todo mundo do time */
function caboForca(k){ if(!D||!D.teams) return 0; let s=D.myTeam===k?D.score+(D.tranco||0):0;
  D.others.forEach(id=>{ if(D.teams[id]!==k) return; const o=D.opps[id], x=o.info||o; s+=(x.score||0)+(x.tranco||0); }); return s; }
/* positivo = corda puxada para o Time Azul */
function caboVal(){ return caboForca('az')-caboForca('la'); }
/* nome do lado: com uma pessoa só, o nome dela ("Você"); com mais, o nome do time */
function caboLado(k,teams,me){ const ids=Object.keys(teams).filter(id=>teams[id]===k); if(ids.length===1) return ids[0]===me?'Você':nm(ids[0]); return TEAM[k].e+' '+TEAM[k].n; }
/* o lado inteiro terminou sem jogada (travou, o tempo da peça acabou ou saiu) */
function caboCaiu(k){ const fim=[]; if(D.myTeam===k) fim.push(D.info); D.others.forEach(id=>{ if(D.teams[id]===k) fim.push(D.opps[id].info); });
  return fim.length&&fim.every(x=>x&&CABO_CAI.includes(x.reason))?(fim.every(x=>x.reason==='quit')?'saiu':'caiu'):null; }
/* depois de cada mudança: corda na ponta ou o outro lado caiu */
function caboCheck(){
  if(!caboOn()||D.over) return false;
  const v=caboVal(); if(Math.abs(v)>=CABO_PTS){ duelEnd((v>0)===(D.myTeam==='az')?'caboWin':'caboLose'); return true; }
  const c=caboCaiu(otherTeam(D.myTeam)); if(c){ duelEnd(c==='saiu'?'caboSaiu':'caboTravou'); return true; }
  return false;
}
/* tranco: com Ataques ligado, limpar 3 linhas ou mais de uma vez puxa a corda a mais */
function caboTranco(res){ if(!caboOn()||!D.o.attacks||res.n<3) return; D.tranco=(D.tranco||0)+CABO_TRANCO; praise('🪢 TRANCO!'); }
/* resultado final (o mesmo em todos os celulares e na TV) */
function caboResult(infos,teams){
  const f={az:0,la:0}, sc={az:0,la:0};
  for(const id in infos){ const x=infos[id], k=teams[id]; if(!x||!k) continue; f[k]+=(x.score||0)+(x.tranco||0); sc[k]+=x.score||0; }
  const val=f.az-f.la, dead=k=>{ const ids=Object.keys(teams).filter(id=>teams[id]===k); return ids.length&&ids.every(id=>infos[id]&&CABO_CAI.includes(infos[id].reason)); };
  let w=null, why='';
  for(const id in infos){ const r=infos[id]&&infos[id].reason, k=teams[id]; if(!k) continue;
    if(r==='caboWin'||r==='caboTravou'||r==='caboSaiu'){ w=k; why=r; break; } if(r==='caboLose'){ w=otherTeam(k); why='caboWin'; break; } }
  if(!w){ const da=dead('az'), dl=dead('la'); if(da!==dl){ w=da?'la':'az'; why='caboTravou'; } }
  if(!w&&val){ w=val>0?'az':'la'; why=Math.abs(val)>=CABO_PTS?'caboWin':'caboPerto'; }
  return {winner:w,why,val,forca:f,sum:sc};
}
function caboPorque(cr,teams){ if(!cr.winner) return 'A corda ficou no meio'; const w=caboLado(cr.winner,teams,NET.role), l=caboLado(otherTeam(cr.winner),teams,NET.role);
  if(cr.why==='caboWin') return `${w} puxou a corda até o fim`; if(cr.why==='caboTravou') return `${l} ficou sem jogada`; if(cr.why==='caboSaiu') return `${l} saiu da partida`;
  return `A corda terminou do lado de ${w}`; }
/* a corda: esq = time que fica do lado esquerdo; val positivo puxa para o Azul */
function caboBarHTML(id){ return `<div class="cabo"${id?` id="${id}"`:''}><div class="cabolbl"><span class="cl"></span><small class="ct"></small><span class="cr"></span></div><div class="cabotrk"><i class="cabofim l"></i><i class="cabofim r"></i><i class="cabomeio"></i><i class="cabocorda"></i><b class="cabono">🎀</b></div></div>`; }
function caboBarSet(el,val,esq,lblE,lblD){
  if(!el) return; const dir=otherTeam(esq), p=Math.max(-1,Math.min(1,val/CABO_PTS))*(esq==='az'?1:-1), x=50-p*46;
  el.style.setProperty('--ce',TEAM[esq].c); el.style.setProperty('--cd',TEAM[dir].c);
  const no=el.querySelector('.cabono'); no.style.left=x.toFixed(1)+'%';
  const old=el._p||0; if(Math.abs(p-old)>=.12){ no.classList.remove('puxao'); void no.offsetWidth; no.classList.add('puxao'); } el._p=p;
  el.querySelector('.cl').textContent=lblE; el.querySelector('.cr').textContent=lblD;
  const a=Math.abs(val), lado=val>0?'az':'la';
  el.querySelector('.ct').textContent=a<1?'Corda no meio':`${lado===esq?lblE:lblD} na frente: ${fmtN(Math.min(a,CABO_PTS))} de ${fmtN(CABO_PTS)}`;
}
/* corda no jogo (o seu lado fica à esquerda) */
function caboRender(){
  const el=$('#cabo'); if(!el) return; const on=!!(D&&D.live&&D.o.cabo&&D.teams); el.hidden=!on; if(!on) return;
  caboBarSet(el,caboVal(),D.myTeam,caboLado(D.myTeam,D.teams,NET.role),caboLado(otherTeam(D.myTeam),D.teams,NET.role));
}
