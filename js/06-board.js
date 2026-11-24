'use strict';
/* tabuleiro em canvas, cenário dos mundos, marcações, animações de limpeza, placar dos adversários, bandeja e arraste */
/* ===================== tabuleiro (visual) ===================== */
let CS=40, TS=.5;
/* ===================== tabuleiro em canvas =====================
   As 64 casas são desenhadas num canvas só: casas vazias e blocos são imagens prontas (copiadas, não recalculadas).
   Só redesenha quando algo muda, e as animações (encaixe, queda, onda, fim de jogo) rodam no mesmo laço,
   que para sozinho quando nada está animando. */
const bcv=document.createElement('canvas'); bcv.id='bcv'; $('#grid').prepend(bcv);
const bx=bcv.getContext('2d');
const newCell=()=>({mode:0,key:'',ov:'',slot:0,glow:0,fall:0,fd:0,drop:0,rip:0,rd:0,dead:0});
let CELL=Array.from({length:N*N},newCell);
/* troca o tamanho do tabuleiro (8×8 normal, 10×10 nos quadrantes) */
function setN(n){ if(N===n) return; N=n; CELL=Array.from({length:N*N},newCell); for(const k in reveal) delete reveal[k]; root.style.setProperty('--N',N); grC=null; bDirty=true; }
let bDirty=true, bRaf=0, BDPR=1, SLOT={id:'',cv:[]};
function bReq(){ if(!bRaf) bRaf=requestAnimationFrame(bDraw); }
function bSize(){
  BDPR=Math.min(2.5,window.devicePixelRatio||1); const W=Math.round(CS*N*BDPR);
  if(bcv.width!==W){ bcv.width=bcv.height=W; }
  bcv.style.width=bcv.style.height=(CS*N)+'px'; bDirty=true; bReq();
}
function parseShadows(str){
  const out=[]; let depth=0, cur='';
  for(const ch of str){ if(ch==='(') depth++; if(ch===')') depth--; if(ch===','&&!depth){ out.push(cur); cur=''; } else cur+=ch; }
  out.push(cur);
  return out.map(p=>p.trim().match(/^inset\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+(.+)$/)).filter(Boolean).map(m=>({x:+m[1],y:+m[2],b:+m[3],c:m[4]}));
}
/* textura do tabuleiro de cada mundo: cobertor de pelúcia, bancada de mármore, copa de árvore vista de cima,
   concreto, esteira de bambu trançado e tatame */
const WTEX={};
function worldTex(w){
  if(WTEX[w]!=null) return WTEX[w];
  const S=480, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'), R=Math.random;
  try{
    if(w===1){ x.fillStyle='#efd0e2'; x.fillRect(0,0,S,S);
      for(let k=0;k<9000;k++){ const px=R()*S, py=R()*S, a=R()*6.28; x.strokeStyle=R()<.5?'rgba(255,255,255,.22)':'rgba(170,100,150,.16)'; x.lineWidth=1; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*3,py+Math.sin(a)*3); x.stroke(); }
      x.strokeStyle='rgba(255,255,255,.7)'; x.lineWidth=2.5; x.setLineDash([7,6]); const st=S/6;
      for(let k=-6;k<12;k++){ x.beginPath(); x.moveTo(k*st,0); x.lineTo(k*st+S,S); x.stroke(); x.beginPath(); x.moveTo(k*st,S); x.lineTo(k*st+S,0); x.stroke(); } x.setLineDash([]); }
    else if(w===2){ x.fillStyle='#f8f1ee'; x.fillRect(0,0,S,S);
      for(let k=0;k<14;k++){ x.strokeStyle=k%3?`rgba(190,150,160,${.12+R()*.15})`:`rgba(235,140,175,${.18+R()*.2})`; x.lineWidth=1+R()*3; x.beginPath(); let px=R()*S, py=R()*S; x.moveTo(px,py);
        for(let j=0;j<5;j++){ const nx=px+(R()-.3)*S*.5, ny=py+(R()-.5)*S*.35; x.quadraticCurveTo((px+nx)/2+(R()-.5)*60,(py+ny)/2+(R()-.5)*60,nx,ny); px=nx; py=ny; } x.stroke(); }
      const g=x.createLinearGradient(0,0,S,S); g.addColorStop(0,'rgba(255,255,255,.5)'); g.addColorStop(.5,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,220,235,.3)'); x.fillStyle=g; x.fillRect(0,0,S,S); }
    else if(w===3){ x.fillStyle='#6fae52'; x.fillRect(0,0,S,S);
      /* copa vista de cima, bem suave: manchas grandes de folhagem e só alguns pontinhos de fruta */
      for(let k=0;k<70;k++){ const px=R()*S, py=R()*S, r=40+R()*60, g=x.createRadialGradient(px,py,0,px,py,r); const lt=R()<.5;
        g.addColorStop(0,lt?'rgba(160,215,110,.35)':'rgba(60,120,40,.28)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(px-r,py-r,r*2,r*2); }
      for(let k=0;k<120;k++){ const px=R()*S, py=R()*S, L=10+R()*10; x.save(); x.translate(px,py); x.rotate(R()*6.28); x.fillStyle=R()<.5?'rgba(255,255,255,.1)':'rgba(30,80,20,.12)';
        x.beginPath(); x.moveTo(-L,0); x.quadraticCurveTo(0,-L*.5,L,0); x.quadraticCurveTo(0,L*.5,-L,0); x.fill(); x.restore(); }
      for(let k=0;k<8;k++){ x.fillStyle='rgba(229,72,63,.45)'; x.beginPath(); x.arc(R()*S,R()*S,5,0,7); x.fill(); } }
    else if(w===4){ x.fillStyle='#b8b4ab'; x.fillRect(0,0,S,S);
      for(let k=0;k<16000;k++){ x.fillStyle=R()<.5?'rgba(255,255,255,.18)':'rgba(40,35,30,.16)'; x.fillRect(R()*S,R()*S,1.5,1.5); }
      for(let k=0;k<6;k++){ x.fillStyle=`rgba(90,80,70,${.06+R()*.06})`; x.beginPath(); x.ellipse(R()*S,R()*S,30+R()*60,20+R()*40,R()*3,0,7); x.fill(); }
      x.strokeStyle='rgba(60,55,50,.35)'; x.lineWidth=1.5; for(let k=0;k<5;k++){ let px=R()*S, py=R()*S; x.beginPath(); x.moveTo(px,py); for(let j=0;j<6;j++){ px+=(R()-.5)*50; py+=(R()-.5)*50; x.lineTo(px,py); } x.stroke(); } }
    else if(w===5){ x.fillStyle='#e4d4a4'; x.fillRect(0,0,S,S);
      /* esteira de ripas finas de bambu na vertical, de pouco contraste */
      const st=S/16; for(let k=0;k<16;k++){ const g=x.createLinearGradient(k*st,0,(k+1)*st,0); g.addColorStop(0,'rgba(150,120,60,.18)'); g.addColorStop(.4,'rgba(255,250,225,.25)'); g.addColorStop(1,'rgba(150,120,60,.12)'); x.fillStyle=g; x.fillRect(k*st,0,st,S);
        x.fillStyle='rgba(140,110,50,.18)'; const ny=(k*97)%S; x.fillRect(k*st,ny,st,3); x.fillRect(k*st,(ny+S/2)%S,st,3); }
      x.strokeStyle='rgba(120,95,45,.18)'; x.lineWidth=2; for(let y=S/6;y<S;y+=S/3){ x.beginPath(); x.moveTo(0,y); x.lineTo(S,y); x.stroke(); } }
    else if(w===6){ x.fillStyle='#cdbf86'; x.fillRect(0,0,S,S);
      for(let k=0;k<S;k+=3){ x.fillStyle=k%6?'rgba(120,110,50,.12)':'rgba(255,250,210,.18)'; x.fillRect(k,0,1.5,S); }
      x.fillStyle='rgba(40,30,20,.75)'; x.fillRect(S/2-5,0,10,S); x.fillStyle='rgba(200,50,60,.6)'; x.fillRect(S/2-1.5,0,3,S);
      for(let k=0;k<16;k++){ const px=R()*S, py=R()*S, r=5+R()*4; x.save(); x.translate(px,py); x.rotate(R()*6.28); x.fillStyle='rgba(255,190,210,.85)'; for(let j=0;j<5;j++){ x.rotate(Math.PI*2/5); x.beginPath(); x.ellipse(r,0,r*.8,r*.5,0,0,7); x.fill(); } x.restore(); } }
    WTEX[w]=`url("${cv.toDataURL('image/jpeg',.85)}")`;
  }catch(e){ WTEX[w]='none'; }
  return WTEX[w];
}
/* liga o cenário do mundo (ou desliga com null) */
function setWorldLook(w){
  const cur=root.dataset.world?+root.dataset.world:null; if(cur===(w||null)) return;
  if(w){ root.dataset.world=w; root.style.setProperty('--boardTex',worldTex(w)); } else { delete root.dataset.world; root.style.removeProperty('--boardTex'); }
  SLOT.id=''; requestAnimationFrame(buildSlots);
}
function buildSlots(){
  const cs=getComputedStyle(root), slot=cs.getPropertyValue('--slot').trim()||'#dbe1e9', fx=cs.getPropertyValue('--slotFx').trim();
  const w=Math.max(8,Math.round(CS*BDPR)), id=slot+fx+w; if(SLOT.id===id) return;
  const sh=parseShadows(fx), inner=w*.88, r=inner*.2, o=w*.06;
  const mk=fill=>{ const c=document.createElement('canvas'); c.width=c.height=w; const x=c.getContext('2d'); x.translate(o,o);
    rrect(x,inner,r); x.fillStyle=fill; x.fill();
    sh.forEach(s=>inShadow(x,inner,r,s.c,s.b*BDPR,s.x*BDPR,s.y*BDPR)); return c; };
  let shade=slot; try{ shade=/^#[0-9a-f]{6}$/i.test(slot)?mix(slot,'#000000',.55):'rgba(0,0,0,.42)'; }catch(e){}
  SLOT={id,cv:[mk(slot),mk(shade),mk('#7a2f3a')]}; bDirty=true; bReq();
}
const easeOut=k=>1-Math.pow(1-k,3), backOut=k=>{ const c1=1.4,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
function popScale(k){ return k<.45?.8+(.27*easeOut(k/.45)):k<.7?1.07-.09*((k-.45)/.25):.98+.02*((k-.7)/.3); }
function bDraw(t){
  bRaf=0; t=t||performance.now();
  const cs=CS*BDPR, W=bcv.width, bs=cs*.94, pad=cs*.03, S=SPR, ov=S.ov||{};
  bx.setTransform(1,0,0,1,0,0); bx.clearRect(0,0,W,W);
  let anim=false; const late=[];
  for(let i=0;i<N*N;i++){ const c=CELL[i], x0=(i%N)*cs, y0=((i/N)|0)*cs;
    let sc=1;
    if(c.rip){ const k=(t-c.rip-c.rd)/500; if(k<1){ anim=true; if(k>0) sc=1-.2*Math.sin(Math.PI*Math.min(1,k)); } else c.rip=0; }
    const sl=SLOT.cv[c.slot];
    if(sl){ if(sc===1) bx.drawImage(sl,x0,y0,cs,cs); else { const d=cs*sc; bx.drawImage(sl,x0+(cs-d)/2,y0+(cs-d)/2,d,d); } }
    if(!c.mode) continue;
    if(c.glow||c.fall||c.drop){ late.push(i); continue; }
    drawCell(c,x0+pad,y0+pad,bs,1,1,t,i)&&(anim=true);
  }
  for(const i of late){ const c=CELL[i], x0=(i%N)*cs+pad, y0=((i/N)|0)*cs+pad;
    let sc=1, dy=0, al=1;
    if(c.fall){ const k=(t-c.fall)/300; if(k<1){ anim=true; dy=-c.fd*cs*(1-k*k); } else c.fall=0; }
    if(c.drop){ const k=(t-c.drop)/600; if(k<1){ anim=true; const e=backOut(Math.max(0,k)); dy=-5*cs*(1-e); sc=1+.4*(1-e); al=Math.max(0,Math.min(1,k/.55)); } else c.drop=0; }
    if(c.glow){ const k=(t-c.glow)/420; if(k<1){ anim=true; sc*=popScale(Math.max(0,k)); } }
    drawCell(c,x0,y0+dy,bs,sc,al,t,i)&&(anim=true);
    if(c.glow){ const k=(t-c.glow)/450; if(k<1&&ov.ring){ const r=ov.ring, d=cs*1.3*(.9+.25*easeOut(k)); bx.globalAlpha=1-easeOut(k); bx.drawImage(r,x0+bs/2-d/2,y0+bs/2-d/2,d,d); bx.globalAlpha=1; } else if(k>=1) c.glow=0; }
  }
  if(BELT) drawBelt(cs);
  if(MK) drawMarks(cs);
  bDirty=false; if(anim) bReq();
}
function drawCell(c,x,y,bs,sc,al,t,i){
  const S=SPR; let anim=false;
  const img=(c.mode===3?S.hl:S.cv)[c.key];
  if(sc!==1){ const d=bs*sc; x+=(bs-d)/2; y+=(bs-d)/2; bs=d; }
  bx.globalAlpha=al*(c.mode===2?.35:1);
  if(img) bx.drawImage(img,x,y,bs,bs); else { bx.fillStyle=c.key==='s'?STONE:c.key==='g'?goldCol():c.key==='w'?WILDC:c.key==='u'?BEARC:c.key==='m'?GUMC:c.key==='f'?RIPEC:c.key==='r'?ROTC:c.key==='k'?STALKC:c.key==='p'?PETALC:c.key==='c'?COINC:c.key==='n'?NUTC:(PALETTE[+c.key]||'#999'); rrect2(x,y,bs,bs*.16); bx.fill(); }
  if(c.ov&&c.mode===1) for(const o of c.ov){ const im=S.ov&&S.ov[o]; if(im) bx.drawImage(im,x,y,bs,bs); }
  if(c.pw&&c.mode===1){ bx.font=`${Math.round(bs*.56)}px system-ui,sans-serif`; bx.textAlign='center'; bx.textBaseline='middle'; bx.fillText(PWI[c.pw],x+bs/2,y+bs*.54); }
  if(c.tb!=null&&c.mode===1){ bx.font=`${Math.round(bs*.42)}px system-ui,sans-serif`; bx.textAlign='center'; bx.textBaseline='middle'; bx.fillText('💣',x+bs*.36,y+bs*.42);
    bx.font=`700 ${Math.round(bs*.36)}px system-ui,sans-serif`; bx.fillStyle='#fff'; bx.strokeStyle='rgba(0,0,0,.8)'; bx.lineWidth=Math.max(2,bs*.06); bx.strokeText(String(c.tb),x+bs*.72,y+bs*.7); bx.fillText(String(c.tb),x+bs*.72,y+bs*.7); }
  if(c.rp!=null&&c.mode===1){ const fs=Math.round(bs*.34); bx.font=`700 ${fs}px system-ui,sans-serif`; bx.textAlign='center'; bx.textBaseline='middle'; bx.fillStyle=c.rp<=2?'#ffe14d':'#fff'; bx.strokeStyle='rgba(0,0,0,.8)'; bx.lineWidth=Math.max(2,bs*.06);
    bx.strokeText(String(c.rp),x+bs*.78,y+bs*.76); bx.fillText(String(c.rp),x+bs*.78,y+bs*.76); }
  if(c.dead){ const k=(t-c.dead-((i/N)|0)*55)/450; if(k<1) anim=true; if(k>0){ const di=S.dead[c.key]; bx.globalAlpha=Math.min(1,k); if(di) bx.drawImage(di,x,y,bs,bs); else { bx.fillStyle='rgba(30,30,36,.7)'; rrect2(x,y,bs,bs*.16); bx.fill(); } } }
  bx.globalAlpha=1; return anim;
}
/* esteira (Mundo 4): faixa listrada nas bordas da linha e setas nas casas vazias */
let BELT=null;
function drawBelt(cs){
  const W=cs*N, sw=cs*.07, seg=cs*.28; bx.save();
  for(const y of BELT){ const y0=y*cs;
    bx.fillStyle='rgba(240,160,32,.1)'; bx.fillRect(0,y0,W,cs);
    for(const yy of [y0,y0+cs-sw]) for(let x=0,k=0;x<W;x+=seg,k++){ bx.fillStyle=k%2?'rgba(40,40,40,.55)':'rgba(255,196,40,.9)'; bx.fillRect(x,yy,Math.min(seg,W-x),sw); }
    bx.strokeStyle='rgba(214,128,0,.6)'; bx.lineWidth=Math.max(2,cs*.07); bx.lineCap='round'; bx.lineJoin='round';
    for(let x=0;x<N;x++){ const c=CELL[y*N+x]; if(c&&c.mode) continue; const cx=x*cs+cs/2, cy=y0+cs/2, s=cs*.13;
      bx.beginPath(); bx.moveTo(cx-s*1.2,cy-s*1.3); bx.lineTo(cx,cy); bx.lineTo(cx-s*1.2,cy+s*1.3); bx.moveTo(cx+s*.2,cy-s*1.3); bx.lineTo(cx+s*1.4,cy); bx.lineTo(cx+s*.2,cy+s*1.3); bx.stroke(); } }
  bx.restore();
}
/* marcações da equipe (co-op): casas para preencher e linhas/colunas para limpar */
let MK=null;
function drawMarks(cs){
  const col='58,209,255', W=cs*N, lw=Math.max(2,cs*.07);
  bx.save(); bx.lineWidth=lw; bx.setLineDash([cs*.18,cs*.12]);
  const band=(x,y,w,h)=>{ bx.fillStyle=`rgba(${col},.13)`; bx.fillRect(x,y,w,h); bx.strokeStyle=`rgba(${col},.95)`; bx.strokeRect(x+lw/2,y+lw/2,w-lw,h-lw); };
  (MK.r||[]).forEach(y=>band(0,y*cs,W,cs));
  (MK.k||[]).forEach(x=>band(x*cs,0,cs,W));
  (MK.c||[]).forEach(i=>{ const x=(i%N)*cs, y=((i/N)|0)*cs, p=cs*.1, w=cs-2*p;
    bx.strokeStyle=`rgba(${col},1)`; rrect2(x+p,y+p,w,w*.22); bx.stroke();
    bx.setLineDash([]); bx.fillStyle=`rgba(${col},.9)`; bx.beginPath(); bx.arc(x+cs/2,y+cs/2,cs*.09,0,7); bx.fill(); bx.setLineDash([cs*.18,cs*.12]); });
  bx.restore();
}
function rrect2(x0,y0,w,r){ bx.beginPath(); bx.moveTo(x0+r,y0); bx.arcTo(x0+w,y0,x0+w,y0+w,r); bx.arcTo(x0+w,y0+w,x0,y0+w,r); bx.arcTo(x0,y0+w,x0,y0,r); bx.arcTo(x0,y0,x0+w,y0,r); bx.closePath(); }
const BC={
  glow(idxs){ const n=performance.now(); idxs.forEach(i=>{ CELL[i].glow=n; }); bReq(); },
  fall(falls){ const n=performance.now(); for(const k in falls){ CELL[+k].fall=n; CELL[+k].fd=falls[k]; } bReq(); },
  drop(idxs,delay=0){ const n=performance.now()+delay; idxs.forEach(i=>{ if(CELL[i]) CELL[i].drop=n; }); bReq(); },
  dead(){ const n=performance.now(); CELL.forEach(c=>{ if(c.mode===1) c.dead=n; }); bReq(); },
  reset(){ CELL.forEach(c=>{ c.glow=c.fall=c.drop=c.dead=c.rip=0; }); bDirty=true; bReq(); }
};
function layout(){
  grC=null;
  const g=$('#game'); if(!g.classList.contains('active')) return;
  const W=g.clientWidth-16;
  const H=g.clientHeight-$('#gTop').offsetHeight-$('#gInfo').offsetHeight-$('#actions').offsetHeight-22;
  const holdOn=!$('#holdRow').hidden;
  const hold=holdOn?1.95:0;
  let cs=Math.floor(Math.min(W/(N+.45),H/(N+.42+.3+2.75+hold)));
  cs=Math.max(20,Math.min(cs,80)); CS=cs;
  /* sobrou altura? peças da bandeja maiores */
  const ts=Math.max(.5,Math.min(.64,((H/cs)-N-.72-hold-.3)/5));
  root.style.setProperty('--CS',cs+'px'); root.style.setProperty('--cs',cs+'px');
  TS=ts; bSize(); buildSlots(); BOSS_Q=null; clearTimeout(SPR.t); SPR.t=setTimeout(()=>{ buildSprites(); buildSlots(); },180);
  root.style.setProperty('--ts',ts.toFixed(3)); root.style.setProperty('--trayH',(ts*5+.25).toFixed(3));
}
function cellColor(v){ if(!v) return 'transparent'; if(v.c===-5) return BEARC; if(v.c===-6) return GUMC; if(v.c===-7) return RIPEC; if(v.c===-8) return ROTC; if(v.c===-9) return STALKC; if(v.c===-10) return PETALC; if(v.c===-11) return COINC; if(v.c===-12) return NUTC; if(v.c===-1) return STONE; if(v.c===-2) return goldCol(); if(v.s==='wild') return WILDC; return PALETTE[v.c]; }
const reveal={};
function renderBoard(b,o,pv,extra={}){
  const now=performance.now(), blind=o.play===2;
  const ghost=new Set(), hl=new Set(); let pc=null;
  if(pv){
    pc=PALETTE[pv.p.color];
    pv.p.cells.forEach(([dr,dc])=>ghost.add((pv.r+dr)*N+(pv.c+dc)));
    if(pv.ok===true && !blind){
      const tmp=b.map(row=>row.slice()); pv.p.cells.forEach(([dr,dc])=>{ tmp[pv.r+dr][pv.c+dc]=1; });
      for(let y=0;y<N;y++) if(tmp[y].every(v=>v)) for(let x=0;x<N;x++) hl.add(y*N+x);
      for(let x=0;x<N;x++){ let f=true; for(let y=0;y<N;y++) if(!tmp[y][x]){ f=false; break; } if(f) for(let y=0;y<N;y++) hl.add(y*N+x); }
    }
  }
  const reg=extra.region;
  for(let i=0;i<N*N;i++){
    const y=(i/N)|0, x=i%N, v=b[y][x], c=CELL[i];
    const hidden=blind && v && v.c>=0 && now-v.t>2500 && !(reveal[i]>now);
    const on=!!v && !hidden, gh=ghost.has(i), h=hl.has(i), bad=reveal[i]>now&&!!v, sh=!!reg&&!inReg(reg,y,x);
    const key=(on?'1':'0')+(gh?'1':'0')+(h?'1':'0')+(sh?'1':'0')+(bad?'1':'0')+'|'+(on?v.c+(v.s||'')+(v.cr?'c':'')+(v.pw||'')+(v.tb!=null?'t'+v.tb:'')+(v.rp!=null?'r'+v.rp:''):'')+'|'+((h||gh)?pv.p.color:'');
    if(c._k===key) continue; c._k=key; bDirty=true;
    c.mode=h?3:on?1:gh?2:0;
    c.key=(h||(!on&&gh))?String(pv.p.color):on?(v.c===-1||v.c===-4?'s':v.c===-2?'g':v.c===-5?'u':v.c===-6?'m':v.c===-7?'f':v.c===-8?'r':v.c===-9?'k':v.c===-10?'p':v.c===-11?'c':v.c===-12?'n':v.s==='wild'?'w':String(v.c)):'';
    c.pw=on&&!h?v.pw||'':''; c.tb=on&&v.c===-4?v.tb:null; c.rp=on&&!h&&(v.c===-7||v.c===-10)?v.rp:null;
    c.ov=on&&!h?((v.s==='bomb'?'b':v.s==='ice'?'i':'')+(v.cr?'c':'')+(v.c===-2?'g':'')):'';
    c.slot=bad?2:sh?1:0;
    if(!on) c.dead=0;
  }
  if(bDirty) bReq();
}
let grC=null;
/* posição do tabuleiro guardada; só mede de novo quando o layout muda (evita layout forçado a cada efeito) */
function GR(){ if(!grC){ grC=$('#grid').getBoundingClientRect(); } return grC; }
function glowCells(idxs,b){
  const gr=GR();
  const els=[];
  idxs.forEach(i=>{ const v=b[(i/N)|0][i%N]; if(!v) return; els.push(i);
    const x=gr.left+(i%N+.5)*CS, y=gr.top+(((i/N)|0)+.5)*CS;
    burst(x,y,cellColor(v),2,.9,{round:true,size:CS*.13,g:.06,up:1.6,decay:.03}); });
  BC.glow(els);
}
/* reinicia animação CSS sem forçar layout síncrono: tira a classe agora, recoloca dois quadros depois */
function restart(els,cls){ if(!els.length) return; requestAnimationFrame(()=>requestAnimationFrame(()=>els.forEach(el=>el.classList.add(cls)))); }
function ripple(r,c,b){
  if(SET.lite) return; const n=performance.now();
  for(let i=0;i<N*N;i++){ const y=(i/N)|0, x=i%N; if(b[y][x]) continue; const d=Math.hypot(y-r,x-c); if(d>3.2) continue; CELL[i].rip=n; CELL[i].rd=d*45; }
  bReq();
}
function bump(){ const b=$('#board'); b.classList.remove('bump'); restart([b],'bump'); }
function fallCells(falls){ BC.fall(falls); }
function spawnExplosion(i,delay){
  const x=i%N, y=(i/N)|0;
  setTimeout(()=>{
    ['boom','ring'].forEach(cls=>{ const d=document.createElement('div'); d.className=cls; d.style.setProperty('--x',x); d.style.setProperty('--y',y); $('#fx').appendChild(d); setTimeout(()=>d.remove(),700); });
    const gr=GR(), px=gr.left+(x+.5)*CS, py=gr.top+(y+.5)*CS;
    ['#fff1a8','#ffc23d','#ff8a2b','#e5483f','#4a4a4a'].forEach(col=>burst(px,py,col,6,3));
    shake();
  },delay);
}
/* direção de cada casa limpa: 'h' se a linha inteira saiu, 'v' se foi a coluna */
function clearDirs(cells){ const rows={}, cols={}, out={}; cells.forEach(([i])=>{ const y=(i/N)|0, x=i%N; rows[y]=(rows[y]||0)+1; cols[x]=(cols[x]||0)+1; });
  cells.forEach(([i])=>{ const y=(i/N)|0, x=i%N; out[i]=rows[y]>=N?'h':cols[x]>=N?'v':'h'; }); return out; }
/* crochê desfiando: tudo num canvas só por cima do tabuleiro (leve no celular).
   Linha limpa: o bloco solta 4 fios na horizontal (as 4 carreiras); coluna: 3 fios em pé (as 3 colunas de pontos).
   Cada fio tem a grossura dos pontos, corre para a casa vizinha da mesma linha/coluna e some. */
const YARN={cv:null,x:null,list:[],raf:0,dpr:1};
const KEY_OF={'-1':'s','-4':'s','-2':'g','-5':'u','-6':'m','-7':'f','-8':'r','-9':'k','-10':'p','-11':'c','-12':'n'};
function yarnAdd(i,c,s,delay,dir,flip){
  const g=$('#fx'), W=Math.round(CS*N), dpr=Math.min(2,window.devicePixelRatio||1);
  if(!YARN.cv){ YARN.cv=document.createElement('canvas'); YARN.cv.className='yarncv'; YARN.x=YARN.cv.getContext('2d'); }
  if(YARN.cv.parentNode!==g) g.appendChild(YARN.cv);
  if(YARN.cv.width!==W*dpr){ YARN.cv.width=YARN.cv.height=W*dpr; YARN.cv.style.width=YARN.cv.style.height=W+'px'; }
  YARN.dpr=dpr;
  const key=s==='wild'?'w':c>=0?String(c):KEY_OF[c]||'s', col=c>=0?PALETTE[c]:c===-2?goldCol():STONE;
  YARN.list.push({x:i%N,y:(i/N)|0,key,col,lite:hmix(col,'#ffffff',.55),dark:hmix(col,'#000000',.6),v:dir==='v',flip,t0:performance.now()+delay,ph:Math.random()*6});
  if(!YARN.raf) YARN.raf=requestAnimationFrame(yarnStep);
}
function yarnStep(t){
  const x=YARN.x, d=YARN.dpr, cs=CS, n4=4, n3=3, PEEL=70, PULL=520;
  x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,YARN.cv.width,YARN.cv.height); x.setTransform(d,0,0,d,0,0);
  x.lineCap='round'; x.lineJoin='round';
  YARN.list=YARN.list.filter(it=>t-it.t0<PEEL*4+PULL+40);
  for(const it of YARN.list){
    const e=t-it.t0, n=it.v?n3:n4, ox=it.x*cs, oy=it.y*cs, img=SPR.cv&&SPR.cv[it.key], dirS=it.flip?-1:1;
    /* parte do bloco que ainda não desfiou */
    const done=Math.max(0,Math.min(n,Math.floor(e/PEEL)+(e>=0?1:0)));
    if(done<n){ const k0=done, frac=k0/n, pad=cs*.03, bs=cs*.94;
      if(img){ const iw=img.width;
        if(it.v){ const sx=it.flip?0:iw*frac, sw=iw*(1-frac); x.drawImage(img,sx,0,sw,iw,ox+pad+(it.flip?0:bs*frac),oy+pad,bs*(1-frac),bs); }
        else { const sy=it.flip?0:iw*frac, sh=iw*(1-frac); x.drawImage(img,0,sy,iw,sh,ox+pad,oy+pad+(it.flip?0:bs*frac),bs,bs*(1-frac)); } }
      else { x.fillStyle=it.col; if(it.v) x.fillRect(ox+pad+(it.flip?0:bs*frac),oy+pad,bs*(1-frac),bs); else x.fillRect(ox+pad,oy+pad+(it.flip?0:bs*frac),bs,bs*(1-frac)); } }
    /* fios soltos */
    for(let k=0;k<n;k++){ const tk=e-k*PEEL; if(tk<0||tk>PULL) continue; const p=tk/PULL, ease=1-(1-p)*(1-p), band=cs/n, th=band*.62;
      const kk=it.flip?n-1-k:k, c0=(kk+.5)*band, len=cs*(1-.35*ease), shift=cs*1.15*ease*dirS, amp=band*(.12+.3*ease), alpha=p<.75?1:1-(p-.75)/.25;
      x.globalAlpha=Math.max(0,alpha);
      const seg=10; x.beginPath();
      for(let j=0;j<=seg;j++){ const u=j/seg, along=(dirS>0?u*len:cs-u*len)+shift+(dirS>0?cs*.35*ease:-cs*.35*ease)*0, wob=Math.sin(u*9+it.ph+tk*.012)*amp;
        const px=it.v?ox+c0+wob:ox+along, py=it.v?oy+along:oy+c0+wob; j?x.lineTo(px,py):x.moveTo(px,py); }
      x.strokeStyle=it.dark; x.lineWidth=th; x.stroke();
      x.strokeStyle=it.col; x.lineWidth=th*.72; x.stroke();
      x.strokeStyle=it.lite; x.lineWidth=Math.max(1,th*.18); x.setLineDash([th*.5,th*.45]); x.stroke(); x.setLineDash([]); }
    x.globalAlpha=1;
  }
  if(YARN.list.length) YARN.raf=requestAnimationFrame(yarnStep); else { YARN.raf=0; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,YARN.cv.width,YARN.cv.height); }
}
function spawnClear(i,c,s,delay,dir){
  if(s==='bomb') spawnExplosion(i,delay);
  const x=i%N, y=(i/N)|0;
  if(!SET.lite&&effSkin()==='crochet'&&s!=='bomb'){ const vert=dir==='v'; yarnAdd(i,c,s,delay,dir,vert?y>=N-1:x>=N-1); return; }
  const d=document.createElement('div');
  const sk=SET.lite?'classic':effSkin(), vert=dir==='v';
  /* o fio corre para a casa vizinha da mesma linha (ou coluna); na ponta do tabuleiro ele volta para dentro */
  const flip=vert?y>=N-1:(dir==='h'?x>=N-1:Math.random()<.5);
  d.className='fxc fx-'+sk+(s==='bomb'?' sp-bomb':'')+(flip?' flip':'')+(vert?' vert':''); d.dataset.col=s==='wild'?'x':c===-1?'s':c===-2?'g':c>=0?c:'x';
  d.style.setProperty('--x',x); d.style.setProperty('--y',y); const cc=c===-1?STONE:c===-2?goldCol():c===-5?BEARC:c===-6?GUMC:c===-7?RIPEC:c===-8?ROTC:c===-9?STALKC:c===-10?PETALC:c===-11?COINC:c===-12?NUTC:(PALETTE[c]||WILDC); d.style.setProperty('--c',cc);
  d.style.setProperty('--dl',delay+'ms'); d.style.animationDelay=delay+'ms';
  d.innerHTML=sk==='brick'?'<div class="blk bev q q1"></div><div class="blk bev q q2"></div><div class="blk bev q q3"></div><div class="blk bev q q4"></div>'
    :sk==='crochet'?'<div class="blk bev"></div><svg class="yarn" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="100" d="M50 50 C 64 36, 80 64, 96 50 S 124 38, 136 52 S 160 62, 172 50"/><path class="ply" pathLength="100" d="M50 50 C 64 36, 80 64, 96 50 S 124 38, 136 52 S 160 62, 172 50"/></svg>'
    :'<div class="blk bev"></div>';
  $('#fx').appendChild(d);
  const col=cc;
  const at=(ms,f)=>setTimeout(()=>{ const gr=GR(); f(gr.left+(x+.5)*CS,gr.top+(y+.5)*CS); },delay+ms);
  if(sk==='velvet') at(160,(px,py)=>{ burst(px,py,mix(col,'#ffffff',.7),6,.7,{round:true,size:CS*.17,g:-.035,up:.6,decay:.016,sway:.7}); burst(px,py,'#ffffff',3,.5,{round:true,size:CS*.1,g:-.03,up:.4,decay:.02,sway:.5}); });
  else if(sk==='crochet') at(420,(px,py)=>burst(px,py,col,3,.8,{size:CS*.12,g:.12,spin:true,w:.22}));
  else if(sk==='brick') at(90,(px,py)=>{ burst(px,py,'#cfc6b4',6,1,{size:CS*.07,g:.05,up:.4,decay:.03}); burst(px,py,mix(col,'#000000',.7),3,1.3,{size:CS*.12,g:.25,spin:true,w:.8}); });
  else if(sk==='candy') at(220,(px,py)=>{ for(let k=0;k<7;k++) burst(px,py,PALETTE[(k*3+c+7)%7]||col,1,1.8,{size:CS*.16,g:.14,spin:true,w:.3}); burst(px,py,'#fff',2,1.2,{round:true,size:CS*.08}); });
  else if(baseSkin(sk)==='jelly') at(200,(px,py)=>{ burst(px,py,isGold(sk)?GOLDSK:col,4,1.4,{round:true,size:CS*.2,g:.12}); burst(px,py,'#fff',5,1.1,{size:CS*.06,g:.08,spin:true,w:.4}); });
  else if(isGold(sk)) at(200,(px,py)=>{ burst(px,py,GOLDSK,4,1.5,{round:true,size:CS*.14,g:.14}); burst(px,py,col,2,1.3,{size:CS*.12,g:.16,spin:true,w:.5}); burst(px,py,'#fff8d0',3,1,{round:true,size:CS*.07}); });
  else if(sk==='fruit'&&c>=0) at(240,(px,py)=>{ const fl=FRUIT[c]?FRUIT[c][0]:col; burst(px,py,fl,5,1.7,{round:true,size:CS*.22,g:.18}); burst(px,py,'#fff',1,1.2,{round:true,size:CS*.08}); });
  else at(240,(px,py)=>{ burst(px,py,col,4,1.6); burst(px,py,'#fff',1,1.2,{round:true,size:CS*.1}); });
  setTimeout(()=>d.remove(),delay+950);
}
/* tema dourado: de vez em quando uma estrelinha pisca em cima de uma peça do tabuleiro */
setInterval(()=>{
  if(SET.lite||document.hidden||!isGold(effSkin())||!$('#game').classList.contains('active')) return;
  const on=[]; for(let i=0;i<N*N;i++){ const c=CELL[i]; if(c&&c.mode===1&&/^[0-6]$/.test(c.key)) on.push(i); }
  if(!on.length) return; const gr=GR();
  for(let k=0;k<Math.min(2,Math.ceil(on.length/12));k++){ const i=on[Math.floor(Math.random()*on.length)], d=document.createElement('div'); d.className='gtw';
    d.style.left=(gr.left+(i%N+.2+Math.random()*.6)*CS)+'px'; d.style.top=(gr.top+(((i/N)|0)+.2+Math.random()*.6)*CS)+'px'; d.style.fontSize=Math.round(CS*.42)+'px';
    d.style.animationDelay=(k*260)+'ms'; d.textContent='✦'; $('#fxl').appendChild(d); setTimeout(()=>d.remove(),1300+k*260); }
},1100);
function floatText(t,x,y){ const d=document.createElement('div'); d.className='ft'; d.textContent=t; d.style.left=x+'px'; d.style.top=y+'px'; $('#fxl').appendChild(d); setTimeout(()=>d.remove(),1000); }
function letters(t){ let i=0; return String(t).split(' ').map(w=>`<span class="wd">${[...w].map(c=>`<span class="ch" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`).join(' '); }
function praise(t,sub,big,level=0){
  const gr=GR(), d=document.createElement('div');
  const plain=sub===undefined&&!big;
  d.className='praise'+(big?' big':'')+(plain?' plain':'')+(level>=7?' lvl7':level>=5?' lvl5':'');
  d.innerHTML=`<span class="w">${letters(t)}</span>`+(sub?`<span class="sub">${letters(sub)}</span>`:'');
  const x=big?innerWidth/2:gr.left+gr.width/2, y=big?innerHeight*.42:gr.top+gr.height*.42; d.style.left=x+'px'; d.style.top=y+'px'; $('#fxl').appendChild(d); setTimeout(()=>d.remove(),1950);
  if(sub!==undefined) setTimeout(()=>{ ['#ffe066','#fff','#ff9f1c'].forEach(c=>burst(x,y,c,6,1.4,{round:true,size:CS*.11,g:.05})); },150);
}
const FRUITS=['🍓','🍊','🍋','🍏','🍉','🫐','🍇'];
function perfectShow(mine=true){
  SFX.perfect(); if(mine) say('perfect');
  const fl=document.createElement('div'); fl.className='flash'; $('#fxl').appendChild(fl); setTimeout(()=>fl.remove(),900);
  praise('PERFECT!','TABULEIRO LIMPO',true);
  const app=$('#app'); app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
  if(!SET.lite){
    const W=innerWidth, H=innerHeight, fruit=effSkin()==='fruit';
    for(let i=0;i<60;i++){ const col=i%NCOL; parts.push({x:Math.random()*W,y:-30-Math.random()*H*.6,vx:(Math.random()-.5)*2,vy:3+Math.random()*4,g:.1,life:1,decay:.005+Math.random()*.004,
      size:fruit?28:10+Math.random()*10,color:PALETTE[col],emoji:fruit?FRUITS[col]:null,rot:Math.random()*6,vr:(Math.random()-.5)*.2}); }
    for(let i=0;i<70;i++){ const a=Math.random()*Math.PI*2, sp=4+Math.random()*9, col=PALETTE[i%NCOL];
      parts.push({x:W/2,y:H*.45,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3,g:.16,life:1,decay:.012+Math.random()*.01,size:6+Math.random()*9,color:i%5?col:'#fff',round:i%3===0,rot:i%3?Math.random()*6:undefined,vr:(Math.random()-.5)*.3}); }
    if(!prun){ prun=true; requestAnimationFrame(stepParts); }
  }
  if(SET.autoSkin&&!FORCE_SKIN) setTimeout(()=>{ SET.skin=SKINS[(SKINS.indexOf(baseSkin(SET.skin))+1)%SKINS.length]; saveSet(); applyLook();
    const f2=document.createElement('div'); f2.className='flash'; $('#fxl').appendChild(f2); setTimeout(()=>f2.remove(),900); toast('Novo tema das peças: '+SKIN_L[SET.skin]); },2100);
}
function bigEmoji(e){ const d=document.createElement('div'); d.className='bigemo'; d.textContent=e; $('#fxl').appendChild(d); setTimeout(()=>d.remove(),1650); }
function shake(){ const b=$('#board'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
function gridPt(r,c){ const gr=GR(); return [gr.left+c*CS,gr.top+r*CS]; }
/* palavra na tela: a do narrador (combo 2 a 8 na escala, depois UNSTOPPABLE…); sem combo, só cascata/bomba/cor */
function praiseFor(res,nv,mine=true){
  const level=res.n+Math.max(0,res.combo-1)+(res.chain-1)*2+(res.bombs?1:0)+(res.colorLines?1:0);
  let sub=res.chain>1?'CASCATA x'+res.chain:res.combo>=2?'COMBO x'+res.combo:res.bombs?'BUM!':res.colorLines?'COR PERFEITA':'';
  if(res.perfect) return {w:'PERFECT!',sub:'TABULEIRO LIMPO',level:9};
  const w=nv?nv.w:mine?null:comboTela(res.combo||0);
  if(!w) return {w:sub&&res.combo<2?sub:null,level};
  return {w,sub,level};
}
function feedback(res,pts,cr,cc,mine=true){
  const nv=mine?narrStep(res,SH||D):null;
  if(nv&&!nv.w&&nv.voz) say(nv.voz); /* combo quebrou depois do "i give up" */
  if(res.n>0){
    const [x,y]=gridPt(cr,cc); floatText('+'+fmtN(pts),x,y);
    const pr=praiseFor(res,nv,mine);
    if(res.perfect){ SFX.clear(1,res.n,1); setTimeout(()=>perfectShow(mine),350); }
    else { SFX.clear(res.combo||1,res.n,res.chain);
      const myCombo=mine&&res.combo>=3&&SET.voiceMode!=='off'&&store.get('ddb_bord_combo','');
      if(mine&&res.combo>=3&&typeof NET!=='undefined'&&NET.open&&(NET.specOn||NET.peers.S)) send({t:'cmb',to:'S',c:res.combo});
      if(pr.w) setTimeout(()=>praise(pr.w,pr.sub,false,pr.level),90);
      /* o bordão de combo gravado no Perfil fala no lugar do narrador */
      if(myCombo) setTimeout(()=>{ vozParar(); playClip(myCombo); },90); else if(nv&&nv.voz) setTimeout(()=>say(nv.voz),90); }
    if(res.bombs) SFX.boom();
    if(mine) buzz(res.n>=2?[25,40,25]:22);
    if(!SET.lite&&(pr.level>=4||res.perfect)) shake(); else bump();
  } else SFX.place();
}
let animTimers=[];
function playSteps(steps,renderStep,done){
  animTimers.forEach(clearTimeout); animTimers=[];
  steps.forEach((st,k)=>{
    animTimers.push(setTimeout(()=>{
      { const dr=clearDirs(st.cleared); st.cleared.forEach(([i,c,s])=>spawnClear(i,c,s,0,dr[i])); }
      if(k<steps.length-1 || st.falls){ renderStep(st.board); if(st.falls) fallCells(st.falls); }
    },k*420));
  });
  animTimers.push(setTimeout(done,steps.length*420));
}
/* placar dos adversários (um cartão por jogador, com miniatura do tabuleiro no duelo ao vivo) */
function oppsSetup(ids,withMini,onTap,teams){
  const el=$('#opps'); el.hidden=!ids.length; el.classList.toggle('many',ids.length>1);
  const card=id=>`<button type="button" class="opp" data-id="${id}"${teams&&teams[id]?` style="box-shadow:inset 0 0 0 2px ${TEAM[teams[id]].c}"`:''}>${withMini?'<div class="mini">'+'<i></i>'.repeat(64)+'</div>':''}${avatarHTML(id,26)}<div><b>0</b><span>${esc(nm(id))}</span></div></button>`;
  /* duelo em times: cada time na sua coluna (o seu time do lado esquerdo, com você nele), com o total do time em cima */
  const me=teams&&teams[NET.role]; el.classList.toggle('teams',!!me);
  if(me){ const col=k=>`<div class="tcol" style="--tc:${TEAM[k].c}"><div class="thead"><span>${TEAM[k].e} ${esc(TEAM[k].n)}</span><b data-tsum="${k}">0</b></div><div class="tlist">${k===me?`<div class="opp me"><div><b data-mysc>0</b><span>Você</span></div></div>`:''}${ids.filter(id=>teams[id]===k).map(card).join('')}</div></div>`;
    el.innerHTML=col(me)+'<div class="tx">×</div>'+col(otherTeam(me)); }
  else el.innerHTML=ids.map(card).join('');
  el.querySelectorAll('.opp').forEach(b=>b.addEventListener('click',()=>{ if(onTap) onTap(b.dataset.id); }));
}
function oppSet(id,score,mini,o={}){
  const c=$('#opps').querySelector(`[data-id="${id}"]`); if(!c) return;
  const b=c.querySelector('b'), t=fmtN(score); if(b.textContent!==t) b.textContent=t;
  if(o.label!=null) c.querySelector('div>span').textContent=o.label;
  if(o.av){ const a=c.querySelector('.av'); if(a) a.outerHTML=avatarHTML(id,26); }
  if(o.done!=null) c.classList.toggle('done',!!o.done);
  if(o.watch!=null) c.classList.toggle('watch',!!o.watch);
  if(mini!=null){ const m=c.querySelector('.mini'); if(m){ const ch=m.children, old=m._o||''; for(let i=0;i<64;i++){ const v=mini[i]||'0'; if(old[i]===v) continue; ch[i].className=v==='1'?'f':v==='2'?'s':''; } m._o=mini; } }
}

/* ===================== bandeja e arraste ===================== */
const slots=$$('.tray .slot').filter(s=>s.dataset.src!=='h');
const holdSlot=$('#holdSlot');
function pieceEl(p){
  const el=document.createElement('div');
  el.style.width=`calc(var(--cs) * ${p.w})`; el.style.height=`calc(var(--cs) * ${p.h})`;
  el.style.setProperty('--c',PALETTE[p.color]);
  el.innerHTML=p.cells.map(([r,c],i)=>{ const sp=p.spec&&p.spec.i===i?' sp-'+p.spec.s:''; const col=sp===' sp-wild'?`;--c:${WILDC}`:''; return `<div class="pc${sp}" data-col="${sp===' sp-wild'?'x':p.color}" style="--x:${c};--y:${r}${col}"><div class="blk bev"></div>${p.pw&&p.pw.i===i?`<span class="pwi">${PWI[p.pw.k]}</span>`:''}</div>`; }).join('');
  return el;
}
const pkey=p=>p?(p._k||(p._k=p.color+'|'+p.cells.join(';')+'|'+(p.spec?p.spec.i+p.spec.s:'')+(p.pw?'|'+p.pw.i+p.pw.k:''))):'';
function trayPiece(host,p,anim,delay){
  const k=pkey(p);
  if(host._k===k&&host._el&&!anim) return host._el;
  if(host._el) host._el.remove(); host._k=k; host._el=null; if(!p) return null;
  const el=pieceEl(p); el.classList.add('tp'); if(anim){ el.classList.add('in'); el.style.animationDelay=delay+'ms'; }
  host.appendChild(el); host._el=el; return el;
}
function renderTray(pieces,hold,f={}){
  slots.forEach((s,i)=>{
    s.classList.toggle('chosen',f.chosen===i); s.classList.toggle('pick',!!f.pick&&!!pieces[i]);
    const p=pieces[i], el=trayPiece(s,p,!!f.anim&&!!p,i*70); if(!el) return;
    el.classList.toggle('nofit',!!(f.nofit&&f.nofit(p)));
    el.classList.toggle('dim',!!(f.dim&&f.dim(i)));
    el.classList.toggle('hide',!!((drag&&drag.src===i)||f.hideSrc===i));
  });
  const hOn=!!f.holdOn;
  const hr=$('#holdRow'); if(hr.hidden===hOn){ hr.hidden=!hOn; layout(); }
  const lbl=hold?(f.holdLbl||'Guardada'):'Arraste para cá para guardar';
  if(!holdSlot._lbl){ holdSlot.innerHTML=''; holdSlot._lbl=document.createElement('span'); holdSlot._lbl.className='holdlbl'; holdSlot.appendChild(holdSlot._lbl); }
  if(holdSlot._lbl.textContent!==lbl) holdSlot._lbl.textContent=lbl;
  const hel=trayPiece(holdSlot,hOn?hold:null,false,0);
  if(hel){ hel.classList.toggle('hide',!!((drag&&drag.src==='h')||f.hideSrc==='h')); hel.classList.toggle('nofit',!!(f.nofit&&f.nofit(hold))); }
  $('#tray').classList.toggle('frozen',!!f.frozen);
}
let drag=null, IN=null;
[...slots,holdSlot].forEach(el=>el.addEventListener('pointerdown',e=>{
  const src=el.dataset.src==='h'?'h':+el.dataset.src;
  if(!IN||drag) return;
  if(IN.tap&&IN.tap(src)){ e.preventDefault(); return; }
  if(!IN.canDrag(src)) return;
  const p=IN.piece(src); if(!p) return;
  e.preventDefault(); ac();
  const d=document.createElement('div'); d.className='drag';
  const inner=pieceEl(p); inner.classList.add('dinner'); d.appendChild(inner); document.body.appendChild(d);
  const srcEl=el.querySelector('.tp'); if(srcEl) srcEl.classList.add('hide');
  drag={src,p,el:d,inner,srcEl,id:e.pointerId,touch:e.pointerType!=='mouse',gr:(grC=null,GR()),hr:$('#holdRow').hidden?null:holdSlot.getBoundingClientRect(),pv:null,overHold:false};
  SFX.pick(); moveDrag(e.clientX,e.clientY);
}));
function moveDrag(x,y){
  const d=drag, pw=d.p.w*CS, ph=d.p.h*CS;
  const lift=d.touch?ph/2+CS*SET.lift:0;
  const left=x-pw/2, top=y-ph/2-lift;
  d.el.style.transform=`translate3d(${left}px,${top}px,0)`;
  const overHold=!!d.hr && d.src!=='h' && x>=d.hr.left && x<=d.hr.right && y>=d.hr.top && y<=d.hr.bottom+20;
  if(overHold!==d.overHold){ d.overHold=overHold; holdSlot.classList.toggle('target',overHold); }
  let pv=null;
  if(!overHold){ const c=Math.round((left-d.gr.left)/CS), r=Math.round((top-d.gr.top)/CS); const ok=IN.check(d.p,r,c); if(ok) pv={p:d.p,r,c,ok}; }
  const o=d.pv;
  if((!pv&&o)||(pv&&(!o||o.r!==pv.r||o.c!==pv.c||o.ok!==pv.ok))){ d.pv=pv; IN.preview(pv); }
}
window.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; e.preventDefault(); moveDrag(e.clientX,e.clientY); },{passive:false});
window.addEventListener('pointerup',e=>{ if(drag&&e.pointerId===drag.id) endDrag(true); });
window.addEventListener('pointercancel',e=>{ if(drag&&e.pointerId===drag.id) endDrag(false); });
function endDrag(drop){
  const d=drag; drag=null; holdSlot.classList.remove('target');
  const pv=d.pv; if(pv) IN.preview(null);
  let ok=false;
  if(drop&&IN){ if(d.overHold) ok=IN.toHold(d.src); else if(pv) ok=IN.drop(d.src,pv.r,pv.c); }
  if(ok){ d.el.remove(); return; }
  returnPiece(d);
}
function returnPiece(d){
  const host=d.src==='h'?holdSlot:slots[d.src]; const s=host.getBoundingClientRect(), pw=d.p.w*CS, ph=d.p.h*CS;
  d.el.style.transition='transform .2s ease'; d.inner.style.transition='transform .2s ease';
  d.el.style.transform=`translate3d(${s.left+s.width/2-pw/2}px,${s.top+s.height/2-ph/2}px,0)`;
  d.inner.style.transform=`scale(${TS})`;
  SFX.back();
  setTimeout(()=>{ d.el.remove(); const t=host.querySelector('.tp'); if(t) t.classList.remove('hide'); },200);
}
function cancelDrag(){ if(!drag) return; const d=drag; drag=null; d.el.remove(); holdSlot.classList.remove('target'); const host=d.src==='h'?holdSlot:slots[d.src]; const t=host&&host.querySelector('.tp'); if(t) t.classList.remove('hide'); }
function flashBad(p,r,c,b){ const now=performance.now(); p.cells.forEach(([dr,dc])=>{ const y=r+dr,x=c+dc; if(y>=0&&y<N&&x>=0&&x<N&&b[y][x]) reveal[y*N+x]=now+900; }); SFX.alert(); toast('Ops, já tem bloco aí'); }
