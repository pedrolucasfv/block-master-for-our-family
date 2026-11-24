'use strict';
/* som: SFX, rugidos, combos, sons do laboratório, voz */
/* ===================== som ===================== */
if(SIM) store.set('ddb_nick','Teste '+SIM);
let actx=null, muted=SIM?true:store.get('ddb_muted',false), noiseBuf=null, master=null, verb=null;
function ac(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ actx=null; } } if(actx&&actx.state==='suspended'){ try{ actx.resume(); }catch(e){} } return actx; }
function bus(){
  const a=ac(); if(!a) return null;
  if(!master){
    const comp=a.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=10; comp.ratio.value=5; comp.attack.value=.002; comp.release.value=.25;
    const out=a.createGain(); out.gain.value=1; comp.connect(out); out.connect(a.destination); master=comp;
    const len=Math.floor(a.sampleRate*1.1), ir=a.createBuffer(2,len,a.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2); }
    const conv=a.createConvolver(); conv.buffer=ir; const vg=a.createGain(); vg.gain.value=.4; conv.connect(vg); vg.connect(comp); verb=conv;
    noiseBuf=a.createBuffer(1,Math.floor(a.sampleRate*1.5),a.sampleRate); const nd=noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  }
  return a;
}
function now(){ const a=bus(); return a?a.currentTime+.005:0; }
function env(g,t,peak,att,dec){ g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+att); g.gain.exponentialRampToValueAtTime(.0001,t+att+dec); }
function wetSend(a,node,amt){ if(!amt) return; const s=a.createGain(); s.gain.value=amt; node.connect(s); s.connect(verb); }
function osc(type,f0,f1,t,dur,peak,att=.004,wet=0){
  if(muted) return; const a=bus(); if(!a) return;
  const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+att+dur);
  env(g,t,peak,att,dur); o.connect(g); g.connect(master); wetSend(a,g,wet); o.start(t); o.stop(t+att+dur+.05);
}
function nz(t,dur,peak,ftype,freq,q=.7,wet=0,att=.002,f1=0){
  if(muted) return; const a=bus(); if(!a) return;
  const s=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain(); s.buffer=noiseBuf; s.loop=true;
  f.type=ftype; f.frequency.setValueAtTime(freq,t); if(f1) f.frequency.exponentialRampToValueAtTime(f1,t+att+dur); f.Q.value=q;
  env(g,t,peak,att,dur); s.connect(f); f.connect(g); g.connect(master); wetSend(a,g,wet); s.start(t); s.stop(t+att+dur+.05);
}
/* rugido do Ursão: rosnado grave (dente de serra com tremor) passando por "boca" (filtros de formante) + bafo de ar.
   O mesmo gráfico serve para tocar ao vivo ou para gravar uma vez num buffer (OfflineAudioContext). */
function bearRoarGraph(a,dest,t,len,pitch,noise){
  const out=a.createGain(); out.gain.value=0; out.connect(dest);
  out.gain.setValueAtTime(0,t); out.gain.linearRampToValueAtTime(.55,t+.09); out.gain.setValueAtTime(.5,t+len*.55); out.gain.exponentialRampToValueAtTime(.001,t+len);
  const sh=a.createWaveShaper(), cv=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/512-1; cv[i]=Math.tanh(x*3.2); } sh.curve=cv;
  const f1=a.createBiquadFilter(), f2=a.createBiquadFilter(), lp=a.createBiquadFilter();
  f1.type='bandpass'; f1.Q.value=2.2; f1.frequency.setValueAtTime(380,t); f1.frequency.linearRampToValueAtTime(720,t+len*.35); f1.frequency.linearRampToValueAtTime(330,t+len);
  f2.type='bandpass'; f2.Q.value=3; f2.frequency.setValueAtTime(1100,t); f2.frequency.linearRampToValueAtTime(1500,t+len*.35); f2.frequency.linearRampToValueAtTime(900,t+len);
  lp.type='lowpass'; lp.frequency.value=2200;
  const mixf=a.createGain(); sh.connect(f1); sh.connect(f2); f1.connect(mixf); f2.connect(mixf); mixf.connect(lp); lp.connect(out);
  [[1,.9],[1.012,.6],[.5,.7]].forEach(([m,v])=>{ const o=a.createOscillator(), g=a.createGain(); o.type='sawtooth';
    o.frequency.setValueAtTime(82*m*pitch,t); o.frequency.linearRampToValueAtTime(118*m*pitch,t+len*.3); o.frequency.exponentialRampToValueAtTime(64*m*pitch,t+len);
    const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=29; lg.gain.value=14*m*pitch; lfo.connect(lg); lg.connect(o.frequency);
    const am=a.createOscillator(), ag=a.createGain(); am.frequency.value=21; ag.gain.value=.35*v; am.connect(ag); g.gain.value=.6*v; ag.connect(g.gain);
    o.connect(g); g.connect(sh); [o,lfo,am].forEach(n=>{ n.start(t); n.stop(t+len+.05); }); });
  const n=a.createBufferSource(), nf=a.createBiquadFilter(), ng=a.createGain(); n.buffer=noise; n.loop=true; nf.type='bandpass'; nf.frequency.value=650; nf.Q.value=.8;
  ng.gain.setValueAtTime(0,t); ng.gain.linearRampToValueAtTime(.22,t+.08); ng.gain.exponentialRampToValueAtTime(.001,t+len); n.connect(nf); nf.connect(ng); ng.connect(out); n.start(t); n.stop(t+len+.05);
  const so=a.createOscillator(), sg=a.createGain(); so.type='sine'; so.frequency.setValueAtTime(70,t); so.frequency.exponentialRampToValueAtTime(38,t+.35);
  sg.gain.setValueAtTime(.0001,t); sg.gain.exponentialRampToValueAtTime(.35,t+.004); sg.gain.exponentialRampToValueAtTime(.0001,t+.36); so.connect(sg); sg.connect(dest); so.start(t); so.stop(t+.4);
}
const ROAR={};
/* grava os rugidos (normal, bravo e derrota) uma vez; no ataque só toca o buffer pronto */
function prepRoars(){
  const a=ac(); const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!a||!OAC) return;
  [1,.85,1.6].forEach(p=>{ if(ROAR[p]) return; ROAR[p]='…';
    try{ const len=1.05, sr=a.sampleRate, oc=new OAC(1,Math.ceil(sr*(len+.15)),sr), nb=oc.createBuffer(1,Math.floor(sr*1.5),sr), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      bearRoarGraph(oc,oc.destination,0,len,p,nb); const r=oc.startRendering(); const ok=b=>{ ROAR[p]=b; }; if(r&&r.then) r.then(ok,()=>{ delete ROAR[p]; }); else oc.oncomplete=e=>ok(e.renderedBuffer);
    }catch(e){ delete ROAR[p]; } });
}
function bearRoar(t,len=1.05,pitch=1){
  if(muted) return; const a=bus(); if(!a) return;
  const b=ROAR[pitch]; if(b&&b!=='…'){ playBuf(b,t,1,1,.25); return; }
  bearRoarGraph(a,(()=>{ const g=a.createGain(); g.connect(master); wetSend(a,g,.25); return g; })(),t,len,pitch,noiseBuf);
}
function bearOof(t){ if(muted) return; osc('sawtooth',170,95,t,.2,.12,.01); osc('sine',120,70,t,.22,.2,.006); nz(t,.12,.08,'bandpass',500,1.2,0,.004); }
function tone(freq,dur=.1,type='sine',vol=.2,when=0,slide=0){ osc(type,freq,slide?freq*slide:0,now()+when,dur,vol,.008); }
/* PÃ: impacto grave que cresce com o nível do combo */
function impact(level){
  if(muted) return; const t=now(); if(!t) return; const k=Math.max(1,Math.min(10,level)), p=.5+k*.07;
  osc('sine',175-k*4,36,t,.3+k*.05,Math.min(1.5,p*1.35),.002,.08+k*.03);
  osc('sine',64,38,t,.45+k*.1,Math.min(1.1,p*.85),.01,.12);
  nz(t,.07+k*.012,Math.min(1,.4+k*.06),'bandpass',1600,.8,.2+k*.05);
  nz(t,.22+k*.035,Math.min(1,.32+k*.05),'lowpass',380,.5,.1);
  if(k>=4) osc('triangle',98,46,t,.55+k*.07,.22+k*.035,.004,.35);
  if(k>=5) nz(t+.01,.8+k*.13,.1+k*.03,'highpass',5000,.5,.6,.003);
  if(k>=7) osc('sawtooth',55,26,t,.9+k*.05,.16+k*.01,.01,.5);
  if(k>=9){ nz(t-.0,.5,.25,'bandpass',300,1.2,.4,.25,2400); }
}
/* clique gravado: senoide amortecida + estalo, gerado como amostra (soa como plástico/madeira, não como 8 bits) */
const CBUF={};
function clickBuf(key,parts,len=.06){
  const a=bus(); if(!a) return null; if(CBUF[key]) return CBUF[key];
  const sr=a.sampleRate, n=Math.floor(sr*len), buf=a.createBuffer(1,n,sr), d=buf.getChannelData(0);
  for(let i=0;i<n;i++){ const t=i/sr; let v=0;
    for(const p of parts){ const at=p.at||0; if(t<at) continue; const u=t-at;
      v+=p.noise?(Math.random()*2-1)*p.amp*Math.exp(-u/p.dec):p.amp*Math.sin(2*Math.PI*p.f*u*(1-u*(p.drop||0)))*Math.exp(-u/p.dec)*Math.min(1,u*sr/(p.soft||6)); }
    d[i]=v; }
  let mx=0; for(let i=0;i<n;i++) mx=Math.max(mx,Math.abs(d[i])); if(mx>0) for(let i=0;i<n;i++) d[i]/=mx;
  return CBUF[key]=buf;
}
function playBuf(buf,t,vol,rate=1,wet=0,pan=0){
  if(muted||!buf) return; const a=bus(); if(!a) return;
  const s=a.createBufferSource(), g=a.createGain(); s.buffer=buf; s.playbackRate.value=rate; g.gain.value=vol;
  let out=g; if(pan&&a.createStereoPanner){ const p=a.createStereoPanner(); p.pan.value=pan; g.connect(p); out=p; }
  s.connect(g); out.connect(master); wetSend(a,out,wet); s.start(t);
}
const TOK=()=>clickBuf('tok2',[{f:860,amp:1,dec:.0048,drop:2,soft:55},{f:3600,amp:.35,dec:.0014},{f:4500,amp:.2,dec:.001},{noise:1,amp:.45,dec:.0009,at:0}],.05);
const TIK=()=>clickBuf('tik2',[{f:1520,amp:1,dec:.0036,soft:40},{f:3500,amp:.55,dec:.0018},{f:4650,amp:.4,dec:.0013},{noise:1,amp:.35,dec:.0012,at:0},{noise:1,amp:.06,dec:.02,at:.004}],.07);
const WOOD=()=>clickBuf('wood',[{f:1000,amp:1,dec:.03},{f:2760,amp:.35,dec:.012},{f:4100,amp:.12,dec:.006},{noise:1,amp:.3,dec:.0015,at:0}],.25);
/* sino e purpurina pré-calculados uma vez; cada uso toca a amostra (1 nó) em vez de dezenas de osciladores */
function bellBuf(){
  const a=bus(); if(!a) return null; if(CBUF.bell) return CBUF.bell;
  const sr=a.sampleRate, n=Math.floor(sr*1.1), buf=a.createBuffer(1,n,sr), d=buf.getChannelData(0), f=523.25;
  const P=[[1,1,.9],[2,.5,.6],[3,.22,.42],[4.2,.12,.3],[6.3,.16,.22]];
  for(const [m,amp,dk] of P){ const w=2*Math.PI*f*m/sr, tau=dk/6.9*sr; for(let i=0;i<n;i++) d[i]+=amp*Math.sin(w*i)*Math.exp(-i/tau)*Math.min(1,i/180); }
  let mx=0; for(let i=0;i<n;i++) mx=Math.max(mx,Math.abs(d[i])); for(let i=0;i<n;i++) d[i]/=mx;
  return CBUF.bell=buf;
}
function bell(f,t,dur,vol=.2,wet=.35,pan=0){ playBuf(bellBuf(),t,vol*1.6,f/523.25,wet,pan); }
function glitterBuf(v){
  const a=bus(); if(!a) return null; const key='gl'+v; if(CBUF[key]) return CBUF[key];
  const sr=a.sampleRate, n=Math.floor(sr*.8), buf=a.createBuffer(2,n,sr);
  for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch);
    for(let g=0;g<70;g++){ const st=Math.floor(Math.pow(Math.random(),1.7)*n*.8), hi=Math.random()<.65, f=hi?3500+Math.random()*2100:1000+Math.random()*1100,
        len=Math.floor(sr*(.018+Math.random()*.05)), amp=(1-st/n*.8)*(hi?.5:.75)*(.5+Math.random()*.5), w=2*Math.PI*f/sr;
      for(let i=0;i<len&&st+i<n;i++) d[st+i]+=amp*Math.sin(w*i)*Math.exp(-i/(len*.3))*Math.min(1,i/90); }
    let lp=0; for(let i=0;i<n;i++){ const e=Math.exp(-i/(n*.28)), r=Math.random()*2-1; lp+=(r-lp)*.25; d[i]+=(r-lp)*.22*e+lp*.12*e; }
    let mx=0; for(let i=0;i<n;i++) mx=Math.max(mx,Math.abs(d[i])); for(let i=0;i<n;i++) d[i]/=mx; }
  return CBUF[key]=buf;
}
let glN=0;
function glitter(t,dur,vol){ playBuf(glitterBuf(glN++%3),t,vol*2.6,Math.max(.75,Math.min(1.25,.8/dur)),.45); }
function warmSounds(){ try{ TOK(); TIK(); WOOD(); bellBuf(); glitterBuf(0); setTimeout(()=>{ glitterBuf(1); glitterBuf(2); },300); prepareChosen(); }catch(e){} }
/* escala maior subindo duas oitavas a partir de C5 (perto dos ~700 Hz da gravação) */
const SCALE=[0,2,4,5,7,9,11,12,14,16,17,19,21,23,24];
const noteF=k=>523.25*Math.pow(2,SCALE[Math.max(0,Math.min(SCALE.length-1,k))]/12);
/* acorde macio para o fim de partida: osciladores desafinados passando num filtro, com ataque lento */
function pad(freqs,t,dur,vol,bright=2200){
  if(muted) return; const a=bus(); if(!a) return;
  const f=a.createBiquadFilter(); f.type='lowpass'; f.Q.value=.4; f.frequency.setValueAtTime(bright*.45,t); f.frequency.linearRampToValueAtTime(bright,t+dur*.35); f.frequency.exponentialRampToValueAtTime(bright*.3,t+dur);
  const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.18); g.gain.setValueAtTime(vol,t+dur*.45); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  f.connect(g); g.connect(master); wetSend(a,g,.55);
  freqs.forEach(fr=>[-7,0,7].forEach(dt=>{ const o=a.createOscillator(); o.type=dt?'sawtooth':'triangle'; o.frequency.value=fr; o.detune.value=dt; const og=a.createGain(); og.gain.value=dt?.18:.5; o.connect(og); og.connect(f); o.start(t); o.stop(t+dur+.05); }));
}
/* ===================== sons escolhidos no laboratório =====================
   Combo: "Mil pianos". Linha/coluna: kalimba. Tabuleiro limpo: "Vitória arcade".
   Os sons grandes são gravados uma vez em segundo plano (OfflineAudioContext), já com reverb,
   e no jogo cada um vira uma única amostra tocada: nada de dezenas de osciladores na hora. */
const REC={piano:{},arcade:null,kal:null,busy:false,started:false};
const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function offline(dur,build){
  return new Promise(res=>{ try{
    const sr=44100, X=new OAC(2,Math.ceil(sr*dur),sr);
    const comp=X.createDynamicsCompressor(); comp.threshold.value=-12; comp.knee.value=8; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.18;
    const lim=X.createDynamicsCompressor(); lim.threshold.value=-4; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=.001; lim.release.value=.12;
    const fade=X.createGain(); fade.gain.setValueAtTime(1,dur-.25); fade.gain.linearRampToValueAtTime(0,dur);
    comp.connect(lim); lim.connect(fade); fade.connect(X.destination);
    build(X,comp);
    const done=b=>res(b); /* o limitador já segura o pico; sem passada extra de normalização */
    const pr=X.startRendering(); if(pr&&pr.then) pr.then(done,()=>res(null)); else X.oncomplete=e=>done(e.renderedBuffer);
  }catch(e){ res(null); } });
}
/* buffers de ruído e de reverb feitos uma vez e reaproveitados em todas as gravações */
const XB={};
function abuf(X,ch,n){ return (typeof AudioBuffer==='function')?new AudioBuffer({length:n,sampleRate:X.sampleRate,numberOfChannels:ch}):X.createBuffer(ch,n,X.sampleRate); }
function xNoise(X,len=1.5){ const k='n'+len; if(XB[k]) return XB[k]; const n=Math.floor(X.sampleRate*len), b=abuf(X,1,n), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; return XB[k]=b; }
function xHall(X,dest,len,gain,bright){
  const key='h'+len+'|'+bright; let ir=XB[key];
  if(!ir){ const sr=X.sampleRate, n=Math.floor(sr*len), pre=Math.floor(sr*.03); ir=abuf(X,2,n);
    for(let c=0;c<2;c++){ const d=ir.getChannelData(c); let lp=0; for(let i=pre;i<n;i++){ const r=Math.random()*2-1, u=1-(i-pre)/(n-pre); lp+=(r-lp)*(bright-(bright-.15)*(i/n)); d[i]=lp*u*u; } }
    XB[key]=ir; }
  const cv=X.createConvolver(); cv.buffer=ir; const g=X.createGain(); g.gain.value=gain; cv.connect(g); g.connect(dest); return cv;
}
function xPan(X,node,v,dest){ if(X.createStereoPanner){ const p=X.createStereoPanner(); p.pan.value=v; node.connect(p); p.connect(dest); return p; } node.connect(dest); return node; }
/* piano: parciais levemente inarmônicas, duas cordas desafinadas e martelo (mesmo do laboratório) */
const PB=[65.41,261.63,1046.5], PIANO={};
function pianoBuf(base){
  if(PIANO[base]) return PIANO[base];
  const sr=44100, n=Math.floor(sr*(base<100?3.2:base<500?2.8:1.8));
  const b=(typeof AudioBuffer==='function')?new AudioBuffer({length:n,sampleRate:sr,numberOfChannels:1}):bus().createBuffer(1,n,sr), d=b.getChannelData(0);
  const B=.00035, P=base<100?18:base<500?12:7;
  for(let k=1;k<=P;k++){ const fk=k*base*Math.sqrt(1+B*k*k); if(fk>sr/2.2) break;
    const amp=Math.pow(k,-1.15)*(k===1?1:.9), tau=(base<100?2.2:base<500?1.5:.8)/Math.pow(k,.65);
    /* senoide amortecida por recorrência (2 multiplicações por amostra, sem sin/exp): bem mais rápido */
    [-1.6,1.6].forEach(c=>{ const w=2*Math.PI*fk*Math.pow(2,c/1200)/sr, ph=Math.random()*6.28, r=Math.exp(-1/(tau*sr)), k2=2*r*Math.cos(w), r2=r*r;
      let y2=amp*Math.sin(ph-w)/r, y1=amp*Math.sin(ph); d[0]+=y1; for(let i=1;i<n;i++){ const y=k2*y1-r2*y2; d[i]+=y; y2=y1; y1=y; } }); }
  let lp=0; for(let i=0;i<Math.min(n,sr*.012);i++){ lp+=((Math.random()*2-1)-lp)*.35; d[i]+=lp*.5*Math.exp(-i/(sr*.003)); }
  for(let i=0;i<220;i++) d[i]*=i/220;
  let mx=0; for(let i=0;i<n;i++) mx=Math.max(mx,Math.abs(d[i])); for(let i=0;i<n;i++) d[i]/=mx;
  return PIANO[base]=b;
}
const angelRoot=c=>48+(c<=6?(c-1)*2:10+(c-6));
function bigChord(r,c){ const v=[r-24,r-12,r-5,r,r+4,r+7,r+12,r+16,r+19,r+24]; if(c>=4) v.push(r+28,r+31); if(c>=7) v.push(r+36); return v; }
/* "Mil pianos": acorde maior em todas as oitavas, cada tecla tocada por várias mãos, estrondo grave e catedral */
/* todos os níveis numa gravação só (um reverb só, que é a parte cara), depois recortados */
const PSEG=4.2, PLEN=3.4;
function renderPianos(levels){
  return offline(PSEG*levels.length+.5,(X,M)=>{
    const hall=xHall(X,M,3.2,.9,.55), nb=xNoise(X);
    const toHall=(node,a)=>{ const g=X.createGain(); g.gain.value=a; node.connect(g); g.connect(hall); };
    levels.forEach((c,j)=>pianoLevel(X,M,c,j*PSEG+.01,nb,toHall));
  }).then(b=>{ if(!b) return;
    const n=Math.floor(PLEN*b.sampleRate), fadeN=Math.floor(.25*b.sampleRate);
    levels.forEach((c,j)=>{ const off=Math.floor(j*PSEG*b.sampleRate), seg=abuf(b,2,n);
      for(let ch=0;ch<2;ch++){ const src=b.getChannelData(ch).subarray(off,off+n), dst=seg.getChannelData(ch); dst.set(src); for(let i=n-fadeN;i<n;i++) dst[i]*=(n-i)/fadeN; }
      REC.piano[c]=seg; }); });
}
function pianoLevel(X,M,c,t,nb,toHall){
  {
    const big=Math.min(1,(c-1)/8), r=angelRoot(c);
    const o=X.createOscillator(), og=X.createGain(); o.type='sine'; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(42,t+.25);
    const bv=.75+big*.25; og.gain.setValueAtTime(.0001,t); og.gain.exponentialRampToValueAtTime(bv,t+.004); og.gain.exponentialRampToValueAtTime(.0001,t+.9); o.connect(og); og.connect(M); toHall(og,.25); o.start(t); o.stop(t+1);
    const ns=X.createBufferSource(); ns.buffer=nb; const lp=X.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; const ng=X.createGain(); ng.gain.setValueAtTime(bv*.5,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.18); ns.connect(lp); lp.connect(ng); ng.connect(M); ns.start(t); ns.stop(t+.2);
    const cs=X.createBufferSource(); cs.buffer=nb; const hp=X.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6500; const cg=X.createGain(); cg.gain.setValueAtTime(.0001,t); cg.gain.exponentialRampToValueAtTime(bv*.09,t+.01); cg.gain.exponentialRampToValueAtTime(.0001,t+1.4); cs.connect(hp); hp.connect(cg); cg.connect(M); toHall(cg,.5); cs.start(t); cs.stop(t+1.45);
    const hands=4+Math.round(big*3);
    bigChord(r,c).forEach((m,i)=>{ const f=mtof(m), base=PB.reduce((a,b)=>Math.abs(Math.log(b/f))<Math.abs(Math.log(a/f))?b:a), vol=(m<r?.36:.25)*(1+big*.25);
      for(let h=0;h<hands;h++){ const sN=X.createBufferSource(), g=X.createGain(); sN.buffer=pianoBuf(base); sN.playbackRate.value=f/base*Math.pow(2,((Math.random()*2-1)*5)/1200); g.gain.value=vol*.5/Math.sqrt(hands);
        sN.connect(g); const pn=xPan(X,g,(Math.random()*2-1)*.85,M); toHall(pn,.45); sN.start(t+i*.003+(h?Math.random()*.018:0)); } });
  }
}
/* "Vitória arcade": arpejo de sintetizador subindo duas oitavas e acorde cintilante */
function renderArcade(){
  return offline(3.3,(X,M)=>{
    const t0=.02, nb=xNoise(X), hall=xHall(X,M,2.4,.8,.6);
    const busG=X.createGain(); busG.gain.setValueAtTime(1,t0); busG.gain.setValueAtTime(1,t0+.6); busG.gain.exponentialRampToValueAtTime(.18,t0+1.9); busG.gain.exponentialRampToValueAtTime(.001,t0+3.1);
    busG.connect(M); const w=X.createGain(); w.gain.value=.35; busG.connect(w); w.connect(hall);
    const pluck=(f,t,vol,pv,len)=>{ const flt=X.createBiquadFilter(); flt.type='lowpass'; flt.frequency.setValueAtTime(f*8,t); flt.frequency.exponentialRampToValueAtTime(f*2,t+len); const g=X.createGain();
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.004); g.gain.exponentialRampToValueAtTime(.0001,t+len); flt.connect(g); xPan(X,g,pv,busG);
      [-7,7].forEach(d=>{ const o=X.createOscillator(); o.type='triangle'; o.frequency.value=f; o.detune.value=d; o.connect(flt); o.start(t); o.stop(t+len+.05); });
      const o=X.createOscillator(); o.type='sawtooth'; o.frequency.value=f; const og=X.createGain(); og.gain.value=.25; o.connect(og); og.connect(flt); o.start(t); o.stop(t+len+.05); };
    const rs=X.createBufferSource(); rs.buffer=nb; const bp=X.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1; bp.frequency.setValueAtTime(600,t0); bp.frequency.exponentialRampToValueAtTime(6000,t0+.45);
    const rg=X.createGain(); rg.gain.setValueAtTime(.0001,t0); rg.gain.exponentialRampToValueAtTime(.12,t0+.36); rg.gain.exponentialRampToValueAtTime(.0001,t0+.45); rs.connect(bp); bp.connect(rg); rg.connect(M); rs.start(t0); rs.stop(t0+.5);
    const seq=[60,64,67,72,76,79,84,88,91,96]; seq.forEach((m,i)=>pluck(mtof(m),t0+i*.045,.12,(i%2?.4:-.4),.35));
    const t=t0+seq.length*.045+.02;
    [72,76,79,84,88].forEach((m,i)=>pluck(mtof(m),t,.11,(i/4-.5)*1.4,2.2)); [48,55].forEach(m=>pluck(mtof(m),t,.15,0,1.8));
    const k=X.createOscillator(), kg=X.createGain(); k.type='sine'; k.frequency.setValueAtTime(140,t); k.frequency.exponentialRampToValueAtTime(42,t+.12); kg.gain.setValueAtTime(.0001,t); kg.gain.exponentialRampToValueAtTime(.6,t+.003); kg.gain.exponentialRampToValueAtTime(.0001,t+.6); k.connect(kg); kg.connect(busG); k.start(t); k.stop(t+.65);
    const cr=X.createBufferSource(); cr.buffer=nb; const ch=X.createBiquadFilter(); ch.type='highpass'; ch.frequency.value=5000; const crg=X.createGain(); crg.gain.setValueAtTime(.0001,t); crg.gain.exponentialRampToValueAtTime(.09,t+.006); crg.gain.exponentialRampToValueAtTime(.0001,t+1.5); cr.connect(ch); ch.connect(crg); crg.connect(busG); cr.start(t); cr.stop(t+1.5);
  });
}
/* kalimba: uma nota gravada (Dó), as outras saem mudando a velocidade */
function renderKalimba(){
  return offline(1.25,(X,M)=>{ const f=523.25, t=.005, nb=xNoise(X,.05);
    const tone=(fr,len,vol)=>{ const o=X.createOscillator(), g=X.createGain(); o.type='sine'; o.frequency.value=fr; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.003); g.gain.exponentialRampToValueAtTime(.0001,t+len); o.connect(g); g.connect(M); o.start(t); o.stop(t+len+.02); };
    tone(f,1.1,.6); tone(f*5.4,.12,.21); tone(f*2,.4,.09);
    const s=X.createBufferSource(); s.buffer=nb; const bp=X.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*3; bp.Q.value=2; const g=X.createGain(); g.gain.setValueAtTime(.24,t); g.gain.exponentialRampToValueAtTime(.0001,t+.012); s.connect(bp); bp.connect(g); g.connect(M); s.start(t); s.stop(t+.02);
  });
}
/* grava em segundo plano, um por vez: kalimba e combos baixos primeiro (são os mais usados) */
function prepareChosen(){
  if(REC.started||!OAC) return; REC.started=true;
  const jobs=[()=>renderKalimba().then(b=>REC.kal=b)];
  PB.forEach(f=>jobs.push(()=>Promise.resolve(pianoBuf(f))));
  jobs.push(()=>renderPianos([2,3,4]));
  jobs.push(()=>renderPianos([5,6,7,8,9,10]));
  jobs.push(()=>renderArcade().then(b=>REC.arcade=b));
  let i=0;
  /* não grava enquanto a pessoa arrasta uma peça: espera um momento parado */
  const idle=f=>{ if(typeof drag!=='undefined'&&drag){ setTimeout(()=>idle(f),300); return; } (window.requestIdleCallback?requestIdleCallback(f,{timeout:1200}):setTimeout(f,0)); };
  const next=()=>{ if(i>=jobs.length) return; const j=jobs[i++]; setTimeout(()=>idle(()=>{ try{ j().then(next,next); }catch(e){ next(); } }),i===1?0:200); };
  setTimeout(next,250);
}
function kalimbaHit(n,t){ const seq=[72,76,79,84,88];
  if(!REC.kal){ for(let i=0;i<n+1;i++) bell(mtof(seq[i]),t+i*.08,.6,.12,.3,(i%2?.3:-.3)); return; }
  for(let i=0;i<n+1;i++) playBuf(REC.kal,t+i*.08,.55,mtof(seq[i])/523.25,.3,(i%2?.3:-.3)); }
const SFX={
  pick(){ const t=now(); playBuf(TOK(),t,.9,.97+Math.random()*.06,.04); },
  place(){ const t=now(); playBuf(TIK(),t,.75,.96+Math.random()*.08,.05); osc('sine',150,70,t,.09,.45,.002,.03); },
  back(){ const t=now(); playBuf(TIK(),t,.35,.7,.05); playBuf(TOK(),t+.05,.3,.8,.05); },
  /* linha/coluna: kalimba (uma nota a mais por linha extra); do combo x2 em diante entram os "Mil pianos" por cima */
  clear(combo=1,lines=1,chain=1){
    const t=now(); if(!t) return;
    const n=Math.max(1,Math.min(4,lines)), lvl=Math.min(10,combo+(chain-1));
    kalimbaHit(n,t);
    if(lvl>=2){ const b=REC.piano[lvl]||REC.piano[Math.max(2,...Object.keys(REC.piano).map(Number).filter(k=>k<=lvl))];
      if(b) playBuf(b,t,.95,1,0); else impact(Math.min(8,lvl)); }
  },
  boom(){ impact(7); const t=now(); nz(t,1.1,.4,'lowpass',260,.4,.5,.01); },
  roar(p=1){ ac(); bearRoar(now()+.01,1.05,p); },
  thud(){ impact(5); const t=now(); osc('sine',90,45,t,.25,.3,.003); nz(t,.18,.15,'lowpass',400,.6,.2,.003); },
  oof(){ ac(); bearOof(now()+.01); },
  perfect(){ const t=now(); if(REC.arcade) playBuf(REC.arcade,t,.95,1,0); else { impact(8); [0,2,4,7,9,11,14].forEach((s,i)=>bell(noteF(s),t+.08+i*.07,1.2,.16,.5,(i%2?.3:-.3))); } },
  /* contagem: marimba subindo; "Já!" vira um acorde brilhante com subida de ar */
  beep(go,i=0){ const t=now();
    if(!go){ const f=[392,440,494][i]||440; playBuf(WOOD(),t,.85,f/1000,.12); bell(f,t,.45,.14,.25); osc('sine',f/2,f/2,t,.18,.18,.003); }
    else { nz(t-.0,.28,.3,'bandpass',800,1.1,.3,.2,6000); [523.3,659.3,784,1046.5].forEach((f,j)=>bell(f,t+.02+j*.03,1,.13,.45,(j-1.5)*.2)); glitter(t+.05,.45,.1,18); osc('sine',131,65,t,.25,.5,.003,.05); } },
  tick(){ const t=now(); playBuf(TIK(),t,.5,1.25,.02); },
  over(){ const t=now(); pad([196,246.9,293.7],t,1.6,.11,1800); pad([174.6,220,261.6,329.6],t+.75,2.2,.1,1600); [587.3,523.3,440,392].forEach((f,i)=>bell(f,t+.1+i*.22,1.1,.09,.5)); },
  win(){ const t=now(); [523.3,659.3,784,1046.5,1318.5].forEach((f,i)=>bell(f,t+i*.09,1.3,.12,.5,(i-2)*.15)); pad([261.6,329.6,392,493.9],t+.05,2.4,.1,2800); glitter(t+.3,.9,.08,26); },
  alert(){ const t=now(); playBuf(WOOD(),t,.6,.62,.1); playBuf(WOOD(),t+.13,.6,.52,.1); }
};
/* ---------- voz: narrador dos combos ---------- */
/* combo 2 a 8: escala; 9 a 16: sorteado sem repetir; 17 a 20: o narrador vai desistindo; 21 em diante: quieto */
const V_ESC=['good','nice','great','excellent','amazing','unbelievable','legendary'];
const V_ALT=['unstoppable','incredible','spectacular','phenomenal','somebody_stop_this','what_is_happening','oh_my_goodness'];
const V_FIM=['on_fire','running_out_of_words','no_words','i_give_up'];
const V_TELA=['UNSTOPPABLE!','INCREDIBLE!','SPECTACULAR!','PHENOMENAL!'];
const VWORDS=[...V_ESC,'perfect']; /* as que a pessoa pode gravar por cima */
const V_ARQ=[...V_ESC,...V_ALT,...V_FIM,'is_it_over','perfect'];
const vbuf={}, vsrc={}, vpad={};
function b64ToBuf(d){ const bin=atob(d.split(',')[1]); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer; }
/* gravações extras (depois do LEGENDARY): ids em ddb_vextra, áudio em ddb_vrec_<id> */
function vExtras(){ return store.get('ddb_vextra',[]).filter(id=>store.get('ddb_vrec_'+id,null)); }
/* ?v=2: a versão antiga pedia voz/good.mp3… quando ainda não existiam, e alguns celulares guardaram o "não encontrado" */
let vPadLoading=null;
function loadPadrao(){
  if(vPadLoading||!/^https?:/.test(location.href)) return vPadLoading; const a=bus(); if(!a) return null;
  vPadLoading=Promise.all(V_ARQ.map(async w=>{ try{ const r=await fetch('voz/'+w+'.mp3?v=2'); if(r.ok) vpad[w]=await a.decodeAudioData(await r.arrayBuffer()); }catch(e){} }));
  return vPadLoading;
}
async function loadVoices(){
  const a=bus(); if(!a) return;
  if(SET.voiceMode!=='off') loadPadrao();
  for(const w of [...VWORDS,...store.get('ddb_vextra',[])]){
    vbuf[w]=null; vsrc[w]='';
    const rec=store.get('ddb_vrec_'+w,null);
    if(rec){ try{ vbuf[w]=await a.decodeAudioData(b64ToBuf(rec)); vsrc[w]='sua voz'; }catch(e){} }
  }
  if($('#settings').classList.contains('active')) renderVoiceList();
}
/* uma narração por vez: a nova corta a anterior */
/* cada voz é nivelada pelo volume da fala (sem os silêncios), para todas soarem iguais e um pouco acima do som do combo */
const VOZ_ALVO=-9;
function vozGanho(buf){ if(buf._g) return buf._g; const d=buf.getChannelData(0), w=Math.floor(buf.sampleRate*.05); let s=0,n=0;
  for(let i=0;i+w<=d.length;i+=w){ let e=0; for(let j=i;j<i+w;j++) e+=d[j]*d[j]; e/=w; if(e>1e-4){ s+=e; n++; } }
  const db=n?10*Math.log10(s/n):VOZ_ALVO; return buf._g=Math.min(4,Math.max(.4,Math.pow(10,(VOZ_ALVO-db)/20))); }
let vTocando=null;
function vozParar(){ if(vTocando){ try{ vTocando.stop(); }catch(e){} vTocando=null; } }
function playBufVoz(buf){
  const a=bus(); if(!a||!buf) return false; vozParar();
  const s=a.createBufferSource(), g=a.createGain(); s.buffer=buf; g.gain.value=vozGanho(buf); s.connect(g); g.connect(master); wetSend(a,g,.18); s.start(now()+.02);
  vTocando=s; s.onended=()=>{ if(vTocando===s) vTocando=null; }; return true;
}
/* gravação da pessoa (só na voz personalizada) ou o mp3 padrão */
function vozBuf(w){ return (SET.voiceMode==='mine'&&vbuf[w])||vpad[w]||null; }
function playVoice(w){ return playBufVoz(vbuf[w]||vpad[w]); }
function say(w){ if(muted||SET.voiceMode==='off') return; playBufVoz(vozBuf(w)); }
/* estado do narrador na partida atual (zera sozinho quando começa outra) */
let NARR={ctx:null};
function sorteiaSem(l,ult){ const ok=l.length>1?l.filter(x=>x!==ult):l; return ok[Math.floor(Math.random()*ok.length)]; }
/* sorteio de sacola: todas saem antes de alguma repetir; a primeira da rodada nova nunca é a última da anterior */
function sacola(nome,l){
  let s=NARR[nome]; if(!s||s.id!==l.join()) s=NARR[nome]={id:l.join(),fila:[],ult:null};
  if(!s.fila.length){ const f=l.slice(); for(let i=f.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [f[i],f[j]]=[f[j],f[i]]; }
    if(f.length>1&&f[0]===s.ult){ const j=1+Math.floor(Math.random()*(f.length-1)); [f[0],f[j]]=[f[j],f[0]]; } s.fila=f; }
  return s.ult=s.fila.shift();
}
/* palavra da tela para um combo (sem mexer no narrador: jogada dos outros) */
function comboTela(c){ return c<2?null:c<=8?V_ESC[c-2].toUpperCase()+'!':sorteiaSem(V_TELA,null); }
/* chamado a cada jogada sua: devolve {w: palavra na tela, voz: o que falar}; combo quebrado depois do "i give up" fala "is it over?" */
function narrStep(res,ctx){
  if(NARR.ctx!==ctx) NARR={ctx,c:0,desistiu:false};
  const c=res.combo||0, prev=NARR.c; NARR.c=c;
  if(c<prev){ if(NARR.desistiu){ NARR.desistiu=false; return {voz:'is_it_over'}; } return null; }
  if(!(res.n>0)||c<=prev||c<2) return null;
  if(c>=20) NARR.desistiu=true;
  if(c<=8) return {w:V_ESC[c-2].toUpperCase()+'!',voz:V_ESC[c-2]};
  let voz=null;
  if(c<=20){ const ex=SET.voiceMode==='mine'?vExtras():[], k=c-9, modo=SET.voiceExtra||'pad';
    voz=ex.length&&(modo!=='pad'||k<ex.length)?(modo==='rnd'?sacola('ext',ex):ex[k%ex.length]):c<=16?sacola('alt',V_ALT):V_FIM[c-17]; }
  /* quando o narrador fala UNSTOPPABLE, INCREDIBLE, SPECTACULAR ou PHENOMENAL, a tela mostra a mesma; nas outras frases, qualquer uma das quatro */
  const igual=voz&&V_TELA.find(t=>t===voz.toUpperCase()+'!');
  return {w:igual||sacola('tela',V_TELA),voz};
}
function buzz(p){ if(SIM&&!SIMCTL) return; try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
