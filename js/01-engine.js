'use strict';
/* motor puro do jogo: RNG com semente, peças (BASE), class Engine (tabuleiro, encaixe, limpeza). Sem DOM. */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const root = document.documentElement;

/*ENGINE-START*/
let N = 8; const NCOL = 7;
const PWK=['pedra','gelo','nevoa','bomba','escudo','martelo'];
/* região de um jogador no tabuleiro dividido: lista de retângulos [x0,x1,y0,y1] */
function inReg(reg,y,x){ for(const q of reg) if(x>=q[0]&&x<=q[1]&&y>=q[2]&&y<=q[3]) return true; return false; }
function hashStr(str){
  let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;
  for(let i=0;i<str.length;i++){ const k=str.charCodeAt(i);
    h1=h2^Math.imul(h1^k,597399067); h2=h3^Math.imul(h2^k,2869860233); h3=h4^Math.imul(h3^k,951274213); h4=h1^Math.imul(h4^k,2716044179); }
  h1=Math.imul(h3^(h1>>>18),597399067); h2=Math.imul(h4^(h2>>>22),2869860233); h3=Math.imul(h1^(h3>>>17),951274213); h4=Math.imul(h2^(h4>>>19),2716044179);
  return [(h1^h2^h3^h4)>>>0,(h2^h1)>>>0,(h3^h1)>>>0,(h4^h1)>>>0];
}
function makeRng(seed){
  const st = hashStr(seed);
  const f = function(){
    let a=st[0]>>>0,b=st[1]>>>0,c=st[2]>>>0,d=st[3]>>>0;
    let t=(a+b)|0; a=b^(b>>>9); b=(c+(c<<3))|0; c=(c<<21)|(c>>>11); d=(d+1)|0; t=(t+d)|0; c=(c+t)|0;
    st[0]=a; st[1]=b; st[2]=c; st[3]=d;
    return (t>>>0)/4294967296;
  };
  f.get = () => st.slice();
  f.set = s => { for(let i=0;i<4;i++) st[i]=s[i]; };
  for(let i=0;i<20;i++) f();
  return f;
}
const BASE = [
  {w:4,big:0,cells:[[0,0]]},
  {w:6,big:0,cells:[[0,0],[0,1]]},
  {w:7,big:0,cells:[[0,0],[0,1],[0,2]]},
  {w:5,big:1,cells:[[0,0],[0,1],[0,2],[0,3]]},
  {w:3,big:1,cells:[[0,0],[0,1],[0,2],[0,3],[0,4]]},
  {w:6,big:1,cells:[[0,0],[0,1],[1,0],[1,1]]},
  {w:2,big:1,cells:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]},
  {w:3,big:1,cells:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]},
  {w:7,big:0,cells:[[0,0],[1,0],[1,1]]},
  {w:6,big:1,cells:[[0,0],[1,0],[2,0],[2,1]]},
  {w:4,big:1,cells:[[0,0],[0,1],[0,2],[1,1]]},
  {w:3,big:1,cells:[[0,1],[0,2],[1,0],[1,1]]},
  {w:3,big:1,cells:[[0,0],[1,0],[2,0],[2,1],[2,2]]}
];
function normalizeCells(cells){
  const mr=Math.min(...cells.map(c=>c[0])), mc=Math.min(...cells.map(c=>c[1]));
  return cells.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
function variants(cells){
  const out=[], seen=new Set(); let cur=cells;
  for(let f=0;f<2;f++){
    for(let k=0;k<4;k++){ const n=normalizeCells(cur), key=JSON.stringify(n); if(!seen.has(key)){ seen.add(key); out.push(n); } cur=cur.map(([r,c])=>[c,-r]); }
    cur=cells.map(([r,c])=>[r,-c]);
  }
  return out;
}
const FAM_ALL = BASE.map(b=>({w:b.w,big:b.big,vars:variants(b.cells)}));
const FAM_BIG = FAM_ALL.filter(f=>f.big);
function pickFam(rng,fams){ const tw=fams.reduce((s,f)=>s+f.w,0); let x=rng()*tw; for(const f of fams){ if(x<f.w) return f; x-=f.w; } return fams[fams.length-1]; }
function genPiece(rng,o,maxW){
  const f=pickFam(rng,o.heavy?FAM_BIG:FAM_ALL);
  let vars=f.vars;
  if(maxW){ const ok=vars.filter(v=>Math.max(...v.map(c=>c[1]))+1<=maxW); if(ok.length) vars=ok; }
  const cells=vars[Math.floor(rng()*vars.length)];
  const color=o.colors?o.colors[Math.floor(rng()*o.colors.length)]:Math.floor(rng()*NCOL);
  let spec=null, pw=null;
  const sp=['bomb','ice','wild'].filter(k=>o[k]);
  if(sp.length && rng()<0.18) spec={i:Math.floor(rng()*cells.length), s:sp[Math.floor(rng()*sp.length)]};
  /* blocos de poder: mais ou menos 1 peça em cada 6 traz um ícone numa das casas */
  if(o.pblocks && rng()<1/6){ let i=Math.floor(rng()*cells.length); const k=PWK[Math.floor(rng()*PWK.length)]; if(spec&&spec.i===i) i=(i+1)%cells.length; if(!(spec&&spec.i===i)) pw={i,k}; }
  return {cells,color,spec,pw,h:Math.max(...cells.map(c=>c[0]))+1,w:Math.max(...cells.map(c=>c[1]))+1};
}
function gen3(rng,o,maxW){ return [genPiece(rng,o,maxW),genPiece(rng,o,maxW),genPiece(rng,o,maxW)]; }

class Engine{
  constructor(o){ this.o=o; this.b=Array.from({length:N},()=>Array(N).fill(null)); this.combo=0; this.since=0; this.maxCombo=0; this.lines=0; }
  fits(p,r,c,reg){
    let inside=!reg;
    for(const [dr,dc] of p.cells){ const y=r+dr, x=c+dc;
      if(y<0||y>=N||x<0||x>=N) return false;
      if(reg && !inside && inReg(reg,y,x)) inside=true;
      if(this.b[y][x]) return false; }
    return inside;
  }
  inBounds(p,r,c,reg){
    let inside=!reg;
    for(const [dr,dc] of p.cells){ const y=r+dr, x=c+dc;
      if(y<0||y>=N||x<0||x>=N) return false;
      if(reg && !inside && inReg(reg,y,x)) inside=true; }
    return inside;
  }
  anyFit(p,reg){ for(let r=0;r<=N-p.h;r++) for(let c=0;c<=N-p.w;c++) if(this.fits(p,r,c,reg)) return true; return false; }
  snap(){ return this.b.map(row=>row.map(v=>v?{...v}:null)); }
  wouldFill(y,x){ let row=true,col=true; for(let k=0;k<N;k++){ if(k!==x && !this.b[y][k]) row=false; if(k!==y && !this.b[k][x]) col=false; } return row||col; }
  addStones(rnd,k,c=-1,s=null){
    const added=[];
    for(let n=0;n<k;n++){
      const e=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!this.b[y][x] && !this.wouldFill(y,x)) e.push([y,x]);
      if(!e.length) break;
      const [y,x]=e[Math.floor(rnd()*e.length)];
      this.b[y][x]={c,s,t:0}; added.push(y*N+x);
    }
    return added;
  }
  fullLines(){
    const rows=[],cols=[];
    for(let y=0;y<N;y++) if(this.b[y].every(v=>v)) rows.push(y);
    for(let x=0;x<N;x++){ let f=true; for(let y=0;y<N;y++) if(!this.b[y][x]){ f=false; break; } if(f) cols.push(x); }
    return {rows,cols};
  }
  mono(line){
    let col=null;
    for(const [y,x] of line){ const v=this.b[y][x]; if(v.c<0) return false; if(v.s==='wild') continue; if(col===null) col=v.c; else if(col!==v.c) return false; }
    return true;
  }
  gravity(){
    const falls={};
    for(let x=0;x<N;x++){ let w=N-1;
      for(let y=N-1;y>=0;y--){ const v=this.b[y][x]; if(v){ if(w!==y){ this.b[w][x]=v; this.b[y][x]=null; falls[w*N+x]=w-y; } w--; } } }
    return falls;
  }
  place(p,r,c,now){
    const placed=[];
    p.cells.forEach(([dr,dc],i)=>{ const y=r+dr, x=c+dc; const v={c:p.color,s:(p.spec&&p.spec.i===i)?p.spec.s:null,t:now}; if(p.pw&&p.pw.i===i) v.pw=p.pw.k; this.b[y][x]=v; placed.push(y*N+x); });
    const out=this.settle(p.cells.length); out.placed=placed; return out;
  }
  /* fecha as linhas cheias do tabuleiro (depois de uma peça ou quando um bloco aparece sozinho no último buraco) */
  settle(base){
    const nc=this.o.play===3; /* modo Sem combo */
    let pts=base, n=0, chain=0, colorLines=0, bombs=0, gold=0, ripe=0, petal=0;
    const steps=[], rowsC=[], colsC=[], powers=[];
    for(let guard=0;guard<12;guard++){
      const {rows,cols}=this.fullLines(); const k=rows.length+cols.length;
      if(!k) break;
      chain++; rowsC.push(...rows); colsC.push(...cols);
      if(chain===1){ if(nc) this.combo=0; else { this.combo++; this.since=0; if(this.combo>this.maxCombo) this.maxCombo=this.combo; } }
      const lines=[];
      rows.forEach(y=>lines.push(Array.from({length:N},(_,x)=>[y,x])));
      cols.forEach(x=>lines.push(Array.from({length:N},(_,y)=>[y,x])));
      if(this.o.color) lines.forEach(l=>{ if(this.mono(l)) colorLines++; });
      const set=new Set(); lines.forEach(l=>l.forEach(([y,x])=>set.add(y*N+x)));
      const q=[...set].filter(i=>this.b[(i/N)|0][i%N].s==='bomb'), done=new Set();
      while(q.length){
        const i=q.pop(); if(done.has(i)) continue; done.add(i); bombs++;
        const y=(i/N)|0, x=i%N;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
          const ny=y+dy, nx=x+dx; if(ny<0||ny>=N||nx<0||nx>=N) continue;
          const v=this.b[ny][nx]; if(!v) continue;
          const j=ny*N+nx; set.add(j); if(v.s==='bomb' && !done.has(j)) q.push(j);
        }
      }
      const cleared=[];
      for(const i of set){ const y=(i/N)|0, x=i%N, v=this.b[y][x]; if(!v) continue;
        cleared.push([i,v.c,v.s]); if(v.pw){ powers.push(v.pw); v.pw=undefined; }
        if(v.c===-2) gold++; if(v.c===-7) ripe++; if(v.c===-10) petal++;
        if(v.s==='ice'){ v.s=null; v.cr=1; } else this.b[y][x]=null; }
      n+=k; this.lines+=k;
      pts+=nc?20*k*(k+1)/2*chain*(rows.length&&cols.length?2:1):10*k*(k+1)/2*this.combo*chain;
      let falls=null; if(this.o.play===1) falls=this.gravity();
      steps.push({cleared,falls,board:this.snap()});
      if(this.o.play!==1) break;
    }
    if(!chain){ this.since++; if(this.since>=3) this.combo=0; }
    pts+=colorLines*100+bombs*20;
    const perfect=chain>0 && this.b.every(row=>row.every(v=>!v));
    if(perfect) pts+=300;
    return {pts,n,chain,colorLines,bombs,gold,ripe,petal,perfect,steps,placed:[],combo:this.combo,rowsC,colsC,powers};
  }
}
/*ENGINE-END*/
