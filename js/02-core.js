'use strict';
/* utilidades, store (localStorage/SIM), SET (configurações salvas), temas ganhos e dourados */
/* versão do jogo: aparece no rodapé do menu. A cada mudança publicada, suba o número e anote em CHANGELOG.md */
const VERSAO='1.18', VERSAO_DATA='22/11/2026';
/* ===================== utilidades ===================== */
const PALETTE=['#e5483f','#f08c25','#f3c22f','#4cbb47','#2cb4d6','#3e6fe0','#8a52d8'];
const STONE='#7d859c', GOLD='#e8b923', WILDC='#b9bfd6', BEARC='#a8703e', GUMC='#ff6fae', GOLDSK='#eab526', RIPEC='#ff4b3e', ROTC='#8d5a2b', STALKC='#8fcf5a', PETALC='#ffb3cc', COINC='#e0a83a', NUTC='#9aa6b8';
/* fases de um mundo usam o tema dele, por cima do que a pessoa escolheu */
let FORCE_SKIN=null;
function effSkin(){ return FORCE_SKIN||SET.skin; }
function setForceSkin(sk){ if(FORCE_SKIN===(sk||null)) return; FORCE_SKIN=sk||null; applyLook(); }
const PWI={pedra:'🧱',gelo:'❄️',nevoa:'🌫️',bomba:'💣',escudo:'🛡️',martelo:'🔨'};
const PWN={pedra:'Pedra',gelo:'Gelo',nevoa:'Névoa',bomba:'Bomba-relógio',escudo:'Escudo',martelo:'Martelo'};
/* bomba-relógio: um bloco com contagem; se não for limpo em 3 jogadas, explode e enche a área 3×3 de blocos cinza */
function placeTimeBomb(eng){ const e=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!eng.b[y][x]&&!eng.wouldFill(y,x)) e.push([y,x]); if(!e.length) return -1;
  const [y,x]=e[Math.floor(Math.random()*e.length)]; eng.b[y][x]={c:-4,s:null,t:performance.now(),tb:3}; return y*N+x; }
function tickBombs(eng){ const boom=[], added=[];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(v&&v.c===-4){ v.tb--; if(v.tb<=0) boom.push([y,x]); } }
  boom.forEach(([y,x])=>{ eng.b[y][x]={c:-1,s:null,t:0}; added.push(y*N+x);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const ny=y+dy, nx=x+dx; if(ny<0||nx<0||ny>=N||nx>=N||eng.b[ny][nx]) continue; eng.b[ny][nx]={c:-1,s:null,t:0}; added.push(ny*N+nx); } });
  return {boom:boom.length,added}; }
function bombLeft(b){ let m=null; for(const row of b) for(const v of row) if(v&&v.c===-4) m=m==null?v.tb:Math.min(m,v.tb); return m; }
const FOG_SIDES=['top','bottom','left','right'];
function fogShow(side,ms){ const f=$('#fog'), h=side==='top'||side==='bottom', st=f.style;
  st.left=side==='right'?'50%':'0'; st.top=side==='bottom'?'50%':'0'; st.width=h?'100%':'50%'; st.height=h?'50%':'100%'; f.classList.add('show');
  clearTimeout(fogShow.t); if(ms) fogShow.t=setTimeout(()=>f.classList.remove('show'),ms); }
/* aparelho de teste: o mesmo jogo aberto escondido dentro do seu, com ?sim=n */
const SIM=(()=>{ try{ return new URLSearchParams(location.search).get('sim'); }catch(e){ return null; } })(), SIMMEM={};
let SIMCTL=false;
/* progresso que vai para a nuvem com o PIN (js/20-pin.js): campanha, temas ganhos e dourados, conquistas e recordes. Mudou um desses, agenda o envio. */
const PG_KEYS=['ddb_camp_solo','ddb_camp_group','ddb_won','ddb_bear','ddb_gold','ddb_solo','ddb_bests','ddb_rkbest','ddb_daily','ddb_npc'];
const store={
  get(k,d){ if(SIM) return k in SIMMEM?JSON.parse(SIMMEM[k]):d; try{ const v=localStorage.getItem(k); return v===null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ if(SIM){ SIMMEM[k]=JSON.stringify(v); return; } const j=JSON.stringify(v), pg=PG_KEYS.includes(k); let antes=null; try{ if(pg) antes=localStorage.getItem(k); localStorage.setItem(k,j); }catch(e){} if(pg&&antes!==j&&typeof pgAgendar==='function') pgAgendar(); },
  del(k){ if(SIM){ delete SIMMEM[k]; return; } try{ localStorage.removeItem(k); }catch(e){} }
};
const NF=(()=>{ try{ return new Intl.NumberFormat('pt-BR'); }catch(e){ return null; } })();
const fmtN = n => NF?NF.format(Math.round(n)):String(Math.round(n));
function fmtT(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
/* dia de hoje no horário de Brasília (o Desafio do dia vira à meia-noite de Brasília, em qualquer celular) */
function diaBR(){ try{ return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }catch(e){ return todayKey(); } }
function todayKey(d=new Date()){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function show(id){ grC=null; $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id)); $('#app').classList.toggle('wide',id==='game'); $('#app').classList.toggle('tv',id==='spec'); if(id==='spec') requestAnimationFrame(()=>{ specRender(); if(!SP.raf) SP.raf=requestAnimationFrame(specTick); }); if(id==='game') requestAnimationFrame(layout); if(id==='home') renderHome(); if(id==='with') renderWith(); if(id!=='game'&&id!=='spec'){ if(FORCE_SKIN) setForceSkin(null); if(id!=='camp') setWorldLook(null); } if(id!=='game') bossHide(); }
let toastT=0;
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2600); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));

const SET = Object.assign({lift:1.4,theme:'toy',skin:'velvet',autoSkin:true,voiceMode:'pack',lite:false},store.get('ddb_set',{}));
if(SET.theme==='wood') SET.theme='soft';
/* 1.15: visual novo. Quem estava no tema padrão antigo (Suave) passa para o novo padrão (Brinquedos) uma vez; depois vale o que escolher */
if(!SET.look115){ if(SET.theme==='soft') SET.theme='toy'; SET.look115=1; }
if(SET.voiceMode!=='off') SET.voiceMode='pack';
const THEMES={toy:'Brinquedos',arcade:'Fliperama',starry:'Noite estrelada',soft:'Suave',softdark:'Suave escuro',blue:'Azul',night:'Noite',candy:'Doce',forest:'Floresta'};
const THEME_COLOR={toy:'#fff1e2',arcade:'#3a2f9e',starry:'#0a0b17',soft:'#e2e7ee',softdark:'#272b33',blue:'#2b4590',night:'#0c0e17',candy:'#f3b0cf',forest:'#5a8757'};
const SKINS=['velvet','crochet','fruit','brick','candy','lantern','classic'], SKIN_L={velvet:'Pelúcia',crochet:'Crochê',fruit:'Frutinhas',brick:'Tijolinhos',candy:'Bolo de chocolate',lantern:'Japão',classic:'Clássico',bear:'Ursinho',jelly:'Bala',bug:'Joaninha',robot:'Robô',bamboo:'Bambu',sushi:'Sushi'};
/* temas ganhos vencendo o chefão de cada mundo (na ordem dos mundos) */
const SKIN_REW=['bear','jelly','bug','robot','bamboo','sushi'];
const SKINS_ALL=[...SKINS,...SKIN_REW], SKIN_LOCK={bear:'Vença o Ursão na campanha',jelly:'Vença a Rainha Jujuba na campanha',bug:'Vença o Lagartão Guloso na campanha',robot:'Vença o Robozão na campanha',bamboo:'Vença o Pandão na campanha',sushi:'Vença o Gatão da Sorte na campanha'};
const WON=new Set(store.get('ddb_won',[])); if(store.get('ddb_bear',false)) WON.add('bear');
/* versão dourada: 3 estrelas em todas as fases do mundo. Fica no nome do tema ("bearGold") */
const GOLDS=new Set(store.get('ddb_gold',[]));
SKIN_REW.forEach(k=>{ if(WON.has(k)) SKINS.push(k); });
const isGold=s=>typeof s==='string'&&s.endsWith('Gold'), baseSkin=s=>isGold(s)?s.slice(0,-4):s;
/* com um tema dourado equipado, todas as peças já são de ouro: o bloco dourado (de pegar) vira bloco de DIAMANTE para não confundir */
const DIAMC='#8fe3ff';
const diaOn=()=>isGold(effSkin());
const goldCol=()=>diaOn()?DIAMC:GOLD;
function goldTxt(s){ return diaOn()?s.replace(/blocos dourados/g,'blocos de diamante').replace(/Bloco dourado/g,'Bloco de diamante').replace(/bloco dourado/g,'bloco de diamante').replace(/O dourado/g,'O diamante'):s; }
const hasSkin=k=>SKINS.includes(k)||devAll(), hasGold=k=>SKIN_REW.includes(k)&&(GOLDS.has(k)||devAll());
function fixSkin(){ if(isGold(SET.skin)&&!hasGold(baseSkin(SET.skin))) SET.skin=baseSkin(SET.skin); if(!hasSkin(baseSkin(SET.skin))) SET.skin='velvet'; }
fixSkin();
function unlockSkin(k){ if(WON.has(k)) return false; WON.add(k); store.set('ddb_won',[...WON]); if(k==='bear') store.set('ddb_bear',true); if(!SKINS.includes(k)) SKINS.push(k); return true; }
function unlockGold(k){ if(GOLDS.has(k)) return false; GOLDS.add(k); store.set('ddb_gold',[...GOLDS]); return true; }
function saveSet(){ store.set('ddb_set',SET); }
const TEX={noise:'none',fiber:'none'};
(function makeTex(){
  try{
    const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const im=x.createImageData(64,64);
    for(let i=0;i<im.data.length;i+=4){ const v=Math.random()*255|0; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=120; }
    x.putImageData(im,0,0); TEX.noise=`url(${c.toDataURL()})`;
    const f=document.createElement('canvas'); f.width=f.height=48; const y=f.getContext('2d'); y.lineCap='round';
    for(let i=0;i<1400;i++){ const px=Math.random()*48, py=Math.random()*48, an=Math.random()*Math.PI*2, l=.8+Math.random()*2.2;
      y.strokeStyle=Math.random()<.5?`rgba(255,255,255,${.08+Math.random()*.16})`:`rgba(0,0,0,${.07+Math.random()*.14})`;
      y.lineWidth=.4+Math.random()*.5; y.beginPath(); y.moveTo(px,py); y.lineTo(px+Math.cos(an)*l,py+Math.sin(an)*l); y.stroke(); }
    TEX.fiber=`url(${f.toDataURL()})`;
  }catch(e){}
})();
{ const v=$('#verTxt'); if(v) v.textContent=`Versão ${VERSAO} · ${VERSAO_DATA}`; }
