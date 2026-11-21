'use strict';
/* desenho dos blocos em canvas por tema (drawBlock, GOLD_DECO, texturas) */
/* ===================== blocos pré-desenhados =====================
   Os temas com várias camadas (fibra, gradientes, misturas de cor, sombras internas) são desenhados uma vez
   por cor num canvas e viram imagens. O navegador só copia a imagem em vez de recalcular as camadas
   de cada bloco a cada mudança no tabuleiro. Refeito só quando o tema ou o tamanho do bloco muda. */
const SPR={skin:'',lite:null,px:0,urls:[],job:0,cv:{},hl:{},dead:{},ov:{},w:0};
const SPR_SKINS={velvet:1,crochet:1,fruit:1,brick:1,candy:1,lantern:1,classic:1,bear:1,jelly:1,bug:1,robot:1,bamboo:1,sushi:1};
const SKIN_R={velvet:.3,crochet:.14,fruit:.13,brick:.05,candy:.26,lantern:.12,classic:.07,bear:.24,jelly:.5,bug:.36,robot:.16,bamboo:.2,sushi:.3};
const skinR=sk=>SKIN_R[baseSkin(sk)]||.15;
const FRUIT=[['#f2655a','#3b1a12','#f5f0e1','#5fae4a'],['#ffa23a','#ffe3b0','#fff2d8','#ef8a1c'],['#ffdf4d','#fff4bf','#fffbe6','#e3b812'],['#8ccf4a','#1e1a14','#eef6d5','#7a5634'],['#7fd8c4','#b8904a','#eafaf3','#4f9d6b'],['#5b7be0','#26357a','#dfe6ff','#36489e'],['#9a5bd8','#3a1a5c','#f0e5ff','#5f3596']];
const rgbOf=h=>{ h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); };
/* mistura que devolve hexadecimal (dá para misturar de novo) */
function hmix(a,b,p){ const A=rgbOf(a),B=rgbOf(b); return '#'+A.map((v,i)=>Math.round(v*p+B[i]*(1-p)).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,p){ const A=rgbOf(a),B=rgbOf(b); return 'rgb('+A.map((v,i)=>Math.round(v*p+B[i]*(1-p))).join(',')+')'; }
function rrect(x,w,r){ x.beginPath(); x.moveTo(r,0); x.arcTo(w,0,w,w,r); x.arcTo(w,w,0,w,r); x.arcTo(0,w,0,0,r); x.arcTo(0,0,w,0,r); x.closePath(); }
/* sombra interna como no CSS "inset": moldura fora da forma projeta a sombra para dentro */
function inShadow(x,w,r,color,blur,dx,dy){
  const F=w*20;
  x.save(); rrect(x,w,r); x.clip(); x.translate(-F,0); x.beginPath(); x.rect(-w*2,-w*2,w*5,w*5);
  x.moveTo(r,0); x.arcTo(0,0,0,w,r); x.arcTo(0,w,w,w,r); x.arcTo(w,w,w,0,r); x.arcTo(w,0,0,0,r); x.closePath();
  const m=x.getTransform?x.getTransform():{a:1}; const sx=m.a||1;
  x.shadowColor=color; x.shadowBlur=blur; x.shadowOffsetX=dx+F*sx; x.shadowOffsetY=dy; x.fillStyle='#000'; x.fill('evenodd'); x.restore();
}
/* pedra preciosa lapidada, na cor da peça (deixa as cores diferentes nos temas dourados) */
function drawGem(x,cx,cy,r,c){
  const pts=[[0,-1],[.78,-.45],[.78,.45],[0,1],[-.78,.45],[-.78,-.45]].map(([a,b])=>[cx+a*r,cy+b*r]);
  x.save(); x.shadowColor='rgba(60,35,0,.55)'; x.shadowBlur=r*.5; x.shadowOffsetY=r*.15;
  x.beginPath(); pts.forEach(([px,py],k)=>k?x.lineTo(px,py):x.moveTo(px,py)); x.closePath(); x.fillStyle='#8a5a06'; x.fill(); x.restore();
  const g=x.createLinearGradient(cx-r,cy-r,cx+r,cy+r); g.addColorStop(0,mix(c,'#ffffff',.45)); g.addColorStop(.5,c); g.addColorStop(1,mix(c,'#000000',.55));
  x.beginPath(); pts.forEach(([px,py],k)=>k?x.lineTo(px,py):x.moveTo(px,py)); x.closePath(); x.fillStyle=g; x.fill();
  /* facetas: um hexágono menor no meio e raios até as pontas */
  const ins=pts.map(([px,py])=>[cx+(px-cx)*.5,cy+(py-cy)*.5]);
  x.beginPath(); ins.forEach(([px,py],k)=>k?x.lineTo(px,py):x.moveTo(px,py)); x.closePath(); x.fillStyle=mix(c,'#ffffff',.72); x.fill();
  x.lineWidth=Math.max(1,r*.09); x.strokeStyle='rgba(255,255,255,.55)'; x.beginPath(); pts.forEach(([px,py],k)=>{ x.moveTo(px,py); x.lineTo(ins[k][0],ins[k][1]); }); x.stroke();
  x.lineWidth=Math.max(1,r*.14); x.strokeStyle='#c8901a'; x.beginPath(); pts.forEach(([px,py],k)=>k?x.lineTo(px,py):x.moveTo(px,py)); x.closePath(); x.stroke();
  x.fillStyle='rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(cx-r*.28,cy-r*.42,r*.2,r*.11,-.6,0,7); x.fill();
}
/* tema dourado: o mesmo desenho em ouro, com brilho, e uma pedra na cor da peça */
/* robô: visor e olhos; bambu: anel do nó e folha; sushi: arroz e peixe (usados também pelos dourados) */
function robotEyes(x,w,col,glow){ x.save(); if(glow){ x.shadowColor=col; x.shadowBlur=w*.12; } x.fillStyle=col; [[.34,.46],[.66,.46]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.085,0,7); x.fill(); });
  x.fillRect(w*.32,w*.7,w*.36,w*.05); x.restore(); x.fillStyle='rgba(255,255,255,.85)'; [[.31,.43],[.63,.43]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.025,0,7); x.fill(); }); }
/* feixe de bambus finos: cada vara com sombreado de cilindro e nós em alturas diferentes */
/* feixe de bambu: 3 varas finas atrás (mais escuras) e 4 na frente, cada uma com o topo cortado em alturas diferentes */
const BAMBOO_BACK=[{x:.16,w:.13,top:.03},{x:.43,w:.12,top:.0},{x:.66,w:.13,top:.05}];
const BAMBOO_FRONT=[{x:.02,w:.23,top:.2,nodes:[.48,.84]},{x:.26,w:.24,top:.09,nodes:[.36,.74]},{x:.51,w:.22,top:.25,nodes:[.55,.9]},{x:.74,w:.24,top:.14,nodes:[.42,.8]}];
function bambooStalk(x,w,st,col,dark){
  const x0=w*st.x, bw=w*st.w, top=w*st.top, ry=bw*.24, c2=dark?'#'+rgbOf(col).map(v=>Math.round(v*.62).toString(16).padStart(2,'0')).join(''):col;
  const g=x.createLinearGradient(x0,0,x0+bw,0); g.addColorStop(0,mix(c2,'#000000',.5)); g.addColorStop(.3,mix(c2,'#ffffff',.6)); g.addColorStop(.6,c2); g.addColorStop(1,mix(c2,'#000000',.45));
  /* sombra da vara na de trás */
  if(!dark){ x.fillStyle='rgba(0,0,0,.22)'; x.fillRect(x0+bw*.85,top+ry,bw*.3,w-top); }
  x.fillStyle=g; x.fillRect(x0,top,bw,w-top+1);
  x.strokeStyle=mix(c2,'#000000',.4); x.lineWidth=Math.max(1,w*.01); x.beginPath(); x.moveTo(x0,top); x.lineTo(x0,w); x.moveTo(x0+bw,top); x.lineTo(x0+bw,w); x.stroke();
  /* topo cortado: anel claro e o oco escuro */
  x.beginPath(); x.ellipse(x0+bw/2,top,bw/2,ry,0,0,7); x.fillStyle=mix(c2,'#ffffff',.42); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(x0+bw/2,top+ry*.08,bw*.3,ry*.55,0,0,7); x.fillStyle=mix(c2,'#000000',.4); x.fill();
}
function bambooNodes(x,w,col,thick){
  BAMBOO_FRONT.forEach(st=>{ const x0=w*st.x, bw=w*st.w; st.nodes.forEach(ny=>{ const h=w*(thick?.08:.05), y0=w*ny-h/2, g=x.createLinearGradient(0,y0,0,y0+h);
    g.addColorStop(0,mix(col,'#000000',.5)); g.addColorStop(.5,mix(col,'#ffffff',.58)); g.addColorStop(1,mix(col,'#000000',.55));
    const l=x0-w*.01, r=x0+bw+w*.01, cx=x0+bw/2; x.fillStyle=g; x.beginPath(); x.moveTo(l,y0); x.quadraticCurveTo(cx,y0+h*.55,r,y0); x.lineTo(r,y0+h); x.quadraticCurveTo(cx,y0+h*1.55,l,y0+h); x.closePath(); x.fill(); }); });
}
function bambooBundle(x,w,col){ BAMBOO_BACK.forEach(st=>bambooStalk(x,w,st,col,true)); BAMBOO_FRONT.forEach(st=>bambooStalk(x,w,st,col,false)); bambooNodes(x,w,col,false); }
/* fita de alga do sushi: abraça o peixe e o arroz (curva por cima e por baixo), com brilho no meio */
function sushiBand(x,w,col,shiny){
  const l=w*.41, r=w*.59;
  x.beginPath(); x.moveTo(l,w*.155); x.quadraticCurveTo(w*.5,w*.115,r,w*.155); x.lineTo(r+w*.01,w*.9); x.quadraticCurveTo(w*.5,w*.96,l-w*.01,w*.9); x.closePath();
  const g=x.createLinearGradient(l,0,r,0); g.addColorStop(0,mix(col,'#000000',.55)); g.addColorStop(.38,shiny?mix(col,'#ffffff',.55):mix(col,'#ffffff',.85)); g.addColorStop(.62,col); g.addColorStop(1,mix(col,'#000000',.5));
  x.fillStyle=g; x.fill(); x.lineWidth=Math.max(1,w*.016); x.strokeStyle=shiny?'#a8740e':mix(col,'#000000',.45); x.stroke();
  x.save(); x.clip(); x.strokeStyle=shiny?'rgba(255,255,255,.22)':'rgba(255,255,255,.08)'; x.lineWidth=Math.max(1,w*.01);
  for(let k=1;k<6;k+=shiny?2:1){ const yy=w*(.16+k*.13); x.beginPath(); x.moveTo(l,yy); x.quadraticCurveTo(w*.5,yy+w*.025,r,yy); x.stroke(); } x.restore();
}
/* bolinho de arroz do sushi (o dourado repinta o arroz de branco) */
function sushiRice(x,w){ const rg=x.createLinearGradient(0,w*.4,0,w*.94); rg.addColorStop(0,'#ffffff'); rg.addColorStop(1,'#d9d2c3');
  x.beginPath(); x.moveTo(w*.12,w*.5); x.quadraticCurveTo(w*.04,w*.94,w*.5,w*.93); x.quadraticCurveTo(w*.96,w*.94,w*.88,w*.5); x.closePath(); x.fillStyle=rg; x.fill();
  x.fillStyle='rgba(150,140,120,.35)'; for(let k=0;k<14;k++){ const px=w*(.18+((k*37)%64)/100), py=w*(.62+((k*23)%28)/100); x.beginPath(); x.ellipse(px,py,w*.03,w*.017,k,0,7); x.fill(); } }
function sushiFish(x,w,col){ const g=x.createLinearGradient(0,w*.16,0,w*.6); g.addColorStop(0,mix(col,'#ffffff',.55)); g.addColorStop(.6,col); g.addColorStop(1,mix(col,'#000000',.7));
  x.beginPath(); x.moveTo(w*.08,w*.5); x.quadraticCurveTo(w*.06,w*.16,w*.5,w*.14); x.quadraticCurveTo(w*.94,w*.16,w*.92,w*.5); x.quadraticCurveTo(w*.5,w*.62,w*.08,w*.5); x.closePath(); x.fillStyle=g; x.fill();
  x.save(); x.clip(); x.strokeStyle='rgba(255,255,255,.45)'; x.lineWidth=Math.max(1,w*.035); for(let k=0;k<4;k++){ x.beginPath(); x.moveTo(w*(.16+k*.2),w*.12); x.quadraticCurveTo(w*(.26+k*.2),w*.34,w*(.12+k*.2),w*.6); x.stroke(); } x.restore(); }
/* bala embrulhada: as pontas de papel, a bala e as listras (a dourada repinta só as listras na cor da peça) */
function candyStripes(x,w,col){
  const cx=w*.5, cy=w*.5, rx=w*.31, ry=w*.29;
  x.save(); x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,7); x.clip(); x.translate(cx,cy); x.rotate(-.45);
  x.strokeStyle=col; x.lineCap='round';
  /* listras como os gomos de uma bola: no meio retas, nas bordas curvas e mais finas */
  for(let u=-.8;u<=.81;u+=.4){ x.lineWidth=w*(.042-Math.abs(u)*.018); x.beginPath();
    for(let k=0;k<=24;k++){ const yy=-ry*1.05+k*(ry*2.1/24), q=Math.max(0,1-(yy/(ry*1.05))**2), xx=u*rx*1.05*Math.sqrt(q); k?x.lineTo(xx,yy):x.moveTo(xx,yy); } x.stroke(); }
  x.restore();
  /* sombra redonda por cima (as listras somem nas bordas, como se dessem a volta) e um brilho pequeno */
  x.save(); x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,7); x.clip();
  const sh=x.createRadialGradient(w*.42,w*.4,w*.02,cx,cy,rx*1.05); sh.addColorStop(0,'rgba(255,255,255,.12)'); sh.addColorStop(.55,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.38)'); x.fillStyle=sh; x.fillRect(0,0,w,w);
  x.restore();
  x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(w*.38,w*.34,w*.05,w*.025,-.6,0,7); x.fill();
}
function candyWrap(x,w,c,stripe){
  const wr=sx=>{ x.save(); x.translate(w*.5+sx*w*.27,w*.5); x.scale(sx,1); const g=x.createLinearGradient(0,-w*.25,0,w*.25); g.addColorStop(0,mix(c,'#ffffff',.45)); g.addColorStop(.5,mix(c,'#ffffff',.7)); g.addColorStop(1,mix(c,'#000000',.75));
    x.beginPath(); x.moveTo(0,-w*.09); x.quadraticCurveTo(w*.1,-w*.12,w*.21,-w*.26); x.quadraticCurveTo(w*.17,0,w*.21,w*.26); x.quadraticCurveTo(w*.1,w*.12,0,w*.09); x.closePath(); x.fillStyle=g; x.fill();
    x.strokeStyle=mix(c,'#000000',.6); x.lineWidth=Math.max(1,w*.012); x.stroke(); x.strokeStyle='rgba(0,0,0,.15)'; x.beginPath(); x.moveTo(w*.03,0); x.lineTo(w*.18,-w*.14); x.moveTo(w*.03,0); x.lineTo(w*.18,w*.14); x.stroke(); x.restore(); };
  wr(1); wr(-1);
  const g=x.createRadialGradient(w*.42,w*.4,w*.03,w*.5,w*.5,w*.34); g.addColorStop(0,mix(c,'#ffffff',.45)); g.addColorStop(.6,c); g.addColorStop(1,mix(c,'#000000',.6));
  x.beginPath(); x.ellipse(w*.5,w*.5,w*.31,w*.29,0,0,7); x.fillStyle=g; x.fill(); x.strokeStyle=mix(c,'#000000',.6); x.lineWidth=Math.max(1,w*.012); x.stroke();
  candyStripes(x,w,stripe);
}
/* bolinhas da joaninha (a versão dourada pinta as mesmas bolinhas na cor da peça) */
const BUG_SPOTS=[[.3,.47,.085],[.7,.47,.085],[.27,.73,.075],[.73,.73,.075],[.42,.89,.05],[.58,.89,.05]];
/* tema dourado: o mesmo desenho em ouro, com brilho, e um detalhe na cor da peça para as cores continuarem diferentes */
const GOLD_DECO={
  /* ursinho: pedra lapidada na testa e o miolo das orelhas na cor da peça */
  /* ursinho: orelhas pretas e a pedra lapidada na testa, na cor da peça */
  bear:(x,w,c)=>{ const fx=w*.06, fy=w*.12, fw=w*.88, fr=w*.24;
    /* pinta só a parte das orelhas que aparece (fora do rosto) */
    x.save(); x.beginPath(); x.rect(0,0,w,w); x.moveTo(fx+fr,fy); x.arcTo(fx,fy,fx,fy+fw,fr); x.arcTo(fx,fy+fw,fx+fw,fy+fw,fr); x.arcTo(fx+fw,fy+fw,fx+fw,fy,fr); x.arcTo(fx+fw,fy,fx,fy,fr); x.closePath(); x.clip('evenodd');
    [[.2,.2],[.8,.2]].forEach(([ex,ey])=>{ x.fillStyle='#2a1d14'; x.beginPath(); x.arc(w*ex,w*ey,w*.16,0,7); x.fill(); x.fillStyle='#4a3526'; x.beginPath(); x.arc(w*ex,w*ey,w*.08,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.18)'; x.beginPath(); x.arc(w*ex-w*.05,w*ey-w*.05,w*.04,0,7); x.fill(); });
    x.restore(); drawGem(x,w*.5,w*.3,w*.155,c); },
  /* jujuba: casquinha de ouro com um miolo de goma colorida e brilhante */
  jelly:(x,w,c)=>candyStripes(x,w,c),
  /* robô: olhos e boca acesos na cor da peça */
  robot:(x,w,c)=>{ x.fillStyle='#1d2430'; x.beginPath(); x.roundRect?x.roundRect(w*.18,w*.32,w*.64,w*.28,w*.1):x.rect(w*.18,w*.32,w*.64,w*.28); x.fill(); robotEyes(x,w,c,true); },
  /* bambu: folha e nó na cor da peça */
  bamboo:(x,w,c)=>bambooNodes(x,w,c,true),
  /* sushi: arroz de ouro e o peixe na cor da peça */
  sushi:(x,w,c)=>{ sushiRice(x,w); sushiFish(x,w,GOLDSK); sushiBand(x,w,c,true); },
  /* joaninha: casco de ouro com as bolinhas na cor da peça */
  bug:(x,w,c)=>{ x.save(); x.beginPath(); x.rect(0,0,w,w*.255); x.clip();
    const hg=x.createRadialGradient(w*.44,w*.12,0,w*.5,w*.2,w*.22); hg.addColorStop(0,'#fff6c8'); hg.addColorStop(.5,'#e9b22a'); hg.addColorStop(1,'#8a5a06');
    x.fillStyle=hg; x.beginPath(); x.arc(w*.5,w*.2,w*.19,0,7); x.fill(); x.restore();
    x.fillStyle='#fff'; [[.42,.16],[.58,.16]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.04,0,7); x.fill(); });
    x.strokeStyle='#c8901a'; x.lineWidth=Math.max(1,w*.028); x.lineCap='round'; x.beginPath(); x.moveTo(w*.42,w*.06); x.quadraticCurveTo(w*.36,w*.01,w*.3,w*.03); x.moveTo(w*.58,w*.06); x.quadraticCurveTo(w*.64,w*.01,w*.7,w*.03); x.stroke();
    BUG_SPOTS.forEach(([sx,sy,sr])=>{ const g=x.createRadialGradient(w*(sx-sr*.3),w*(sy-sr*.3),0,w*sx,w*sy,w*sr*1.15); g.addColorStop(0,mix(c,'#ffffff',.5)); g.addColorStop(1,c);
    x.beginPath(); x.arc(w*sx,w*sy,w*sr*1.15,0,7); x.fillStyle=g; x.fill(); x.lineWidth=Math.max(1,w*.015); x.strokeStyle='#8a5a06'; x.stroke(); }); }
};
/* estrelinha de 4 pontas com brilho em volta */
function sparkle(x,sx,sy,sz,a=1){ x.save(); x.globalAlpha=a; x.shadowColor='rgba(255,250,210,.95)'; x.shadowBlur=sz*1.4; x.fillStyle='#fff';
  x.beginPath(); x.moveTo(sx,sy-sz); x.quadraticCurveTo(sx,sy,sx+sz,sy); x.quadraticCurveTo(sx,sy,sx,sy+sz); x.quadraticCurveTo(sx,sy,sx-sz,sy); x.quadraticCurveTo(sx,sy,sx,sy-sz); x.fill(); x.restore(); }
function drawGoldBlock(base,c,w,dpr,lite){
  const cv=drawBlock(base,GOLDSK,null,w,dpr,lite), x=cv.getContext('2d');
  /* ouro polido: faixas claras e escuras na diagonal (reflexo de metal) e um ponto de luz forte */
  x.save(); x.globalCompositeOperation='source-atop';
  const g=x.createLinearGradient(0,0,w,w);
  g.addColorStop(0,'rgba(255,253,225,.75)'); g.addColorStop(.2,'rgba(255,240,160,.1)'); g.addColorStop(.38,'rgba(110,60,0,.32)'); g.addColorStop(.5,'rgba(255,250,215,.6)');
  g.addColorStop(.58,'rgba(255,235,150,.05)'); g.addColorStop(.8,'rgba(110,60,0,.3)'); g.addColorStop(1,'rgba(255,240,170,.45)');
  x.fillStyle=g; x.fillRect(0,0,w,w);
  const hl=x.createRadialGradient(w*.3,w*.26,0,w*.3,w*.26,w*.36); hl.addColorStop(0,'rgba(255,255,255,.85)'); hl.addColorStop(.35,'rgba(255,250,220,.35)'); hl.addColorStop(1,'rgba(255,250,220,0)');
  x.fillStyle=hl; x.fillRect(0,0,w,w);
  x.restore();
  (GOLD_DECO[base]||((x2,w2,c2)=>drawGem(x2,w2*.5,w2*.5,w2*.18,c2)))(x,w,c);
  /* brilhinhos */
  sparkle(x,w*.82,w*.8,w*.085); sparkle(x,w*.25,w*.24,w*.06,.9); if(!lite) sparkle(x,w*.16,w*.86,w*.04,.8);
  return cv;
}
function drawBlock(skin,c,fr,w,dpr,lite){
  if(isGold(skin)) return drawGoldBlock(baseSkin(skin),c,w,dpr,lite);
  /* (pompom e crochê ignoram texturas de fibra) */
  const cv=document.createElement('canvas'); cv.width=cv.height=w; const x=cv.getContext('2d');
  const tx=!lite;
  if(skin==='velvet'){
    /* pompom de pelúcia: corpo macio com sombreado redondo e milhares de pelinhos saindo do centro */
    const cx=w*.5, cy=w*.5, ins=w*.08, iw=w-ins*2, rr=iw*.36;
    x.save(); x.translate(ins,ins);
    const g=x.createRadialGradient(iw*.38,iw*.32,iw*.05,iw*.5,iw*.55,iw*.72);
    g.addColorStop(0,mix(c,'#ffffff',.62)); g.addColorStop(.45,c); g.addColorStop(1,mix(c,'#000000',.55));
    rrect(x,iw,rr); x.fillStyle=g; x.fill(); x.restore();
    const N=lite?520:1500, B=7, paths=Array.from({length:B},()=>new Path2D()), lw=Math.max(1,w*.016);
    for(let k=0;k<N;k++){
      let px,py; do{ px=ins+Math.random()*iw; py=ins+Math.random()*iw; }while(Math.hypot(Math.max(0,Math.abs(px-cx)-(iw/2-rr)),Math.max(0,Math.abs(py-cy)-(iw/2-rr)))>rr);
      const dx=px-cx, dy=py-cy, dist=Math.hypot(dx,dy)/(iw*.5), a=Math.atan2(dy,dx)+(Math.random()-.5)*1.4, len=w*(.035+.055*Math.random())*(.6+dist*.7);
      const light=(-(dx+dy)/(iw))*.9+(Math.random()-.5)*.9, bk=Math.max(0,Math.min(B-1,Math.round((light+1)/2*(B-1))));
      paths[bk].moveTo(px,py); paths[bk].lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len);
    }
    x.lineCap='round'; x.lineWidth=lw;
    paths.forEach((pth,k)=>{ const t=k/(B-1); x.strokeStyle=t<.5?mix(c,'#000000',.55+t*.9):mix(c,'#ffffff',1-(t-.5)*.9); x.globalAlpha=.6; x.stroke(pth); });
    x.globalAlpha=1;
    const hl=x.createRadialGradient(w*.36,w*.3,0,w*.36,w*.3,w*.32); hl.addColorStop(0,'rgba(255,255,255,.28)'); hl.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=hl; x.fillRect(0,0,w,w);
  } else if(skin==='crochet'){
    /* crochê: carreiras de pontos em "V" (duas laçadas inclinadas), cada laçada com volume, sombra embaixo
       e os fios torcidos da lã; as carreiras se encaixam umas nas outras como no tecido de verdade */
    const r=w*.14; rrect(x,w,r); x.clip();
    x.fillStyle=mix(c,'#000000',.5); x.fillRect(0,0,w,w);
    const cols=3, rows=4, sw=w/cols, sh=w/rows, lw=Math.max(1,w*.012);
    const loop=(lx,ly,ang)=>{ const a=sw*.24, b=sh*.66;
      x.save(); x.translate(lx,ly); x.rotate(ang);
      x.fillStyle='rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(a*.15,b*.14,a,b,0,0,7); x.fill();
      const g=x.createLinearGradient(-a,-b*.3,a,b*.3); g.addColorStop(0,mix(c,'#000000',.68)); g.addColorStop(.38,mix(c,'#ffffff',.68)); g.addColorStop(.62,c); g.addColorStop(1,mix(c,'#000000',.62));
      x.beginPath(); x.ellipse(0,0,a,b,0,0,7); x.fillStyle=g; x.fill();
      x.save(); x.clip(); x.lineWidth=lw;
      for(let k=-5;k<=5;k++){ const yy=k*b*.2; x.strokeStyle='rgba(0,0,0,.2)'; x.beginPath(); x.moveTo(-a,yy-a*.7); x.lineTo(a,yy+a*.7); x.stroke();
        x.strokeStyle='rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(-a,yy-a*.7+lw*1.4); x.lineTo(a,yy+a*.7+lw*1.4); x.stroke(); }
      x.restore();
      x.strokeStyle=mix(c,'#000000',.55); x.lineWidth=lw; x.beginPath(); x.ellipse(0,0,a,b,0,0,7); x.stroke();
      x.restore(); };
    for(let ry=-1;ry<=rows;ry++) for(let cc=0;cc<cols;cc++){ const ox=cc*sw, oy=ry*sh;
      loop(ox+sw*.31,oy+sh*.5,-.42); loop(ox+sw*.69,oy+sh*.5,.42); }
    if(!lite){ x.strokeStyle=mix(c,'#ffffff',.6); x.globalAlpha=.28; x.lineWidth=Math.max(1,w*.007); x.beginPath();
      for(let k=0;k<110;k++){ const px=Math.random()*w, py=Math.random()*w, a=Math.random()*6.28, l=w*(.015+Math.random()*.03); x.moveTo(px,py); x.quadraticCurveTo(px+Math.cos(a+1)*l*.6,py+Math.sin(a+1)*l*.6,px+Math.cos(a)*l,py+Math.sin(a)*l); } x.stroke(); x.globalAlpha=1; }
    inShadow(x,w,r,'rgba(0,0,0,.32)',w*.07,0,-w*.035);
    inShadow(x,w,r,'rgba(255,255,255,.22)',w*.05,0,w*.025);
  } else if(skin==='fruit'){
    /* frutinhas (desenho de cartum), o quadrado inteiro é a fruta:
       vermelho melancia, laranja laranja, amarelo abacaxi, verde kiwi, ciano melancia azul, azul uva azul, roxo uva */
    const idx=PALETTE.indexOf(c), r=w*.14, R=(a,b2)=>{ let h=Math.sin(a*12.9898+b2*78.233)*43758.5453; return h-Math.floor(h); };
    const kind=['melon','orange','pine','kiwi','melon','grape','grape'][idx]||'plain';
    const sugar=(yMax)=>{ if(lite) return; for(let k=0;k<55;k++){ x.fillStyle=k%3?'rgba(255,255,255,.28)':'rgba(0,0,0,.08)'; x.beginPath(); x.arc(Math.random()*w,Math.random()*(yMax||w),w*(.006+Math.random()*.01),0,7); x.fill(); } };
    const flesh=()=>{ const g=x.createLinearGradient(0,0,0,w); g.addColorStop(0,mix(c,'#ffffff',.62)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.85)); return g; };
    rrect(x,w,r); x.save(); x.clip();
    if(kind==='melon'){
      /* fatia de melancia: a casca (listrada) e a parte branca fazem um "C" grosso no canto, na diagonal.
         Na melancia azul a casca também fica em tons de azul */
      const blue=idx===4, rc=blue?'#2f6fb0':'#4f9a2e', rs=blue?'#1d4a80':'#2f6e1d', wc=blue?'#e6f3ff':'#f6f1dc';
      x.fillStyle=rc; x.fillRect(0,0,w,w); x.save(); x.translate(w,w); x.rotate(-Math.PI/4); x.fillStyle=rs;
      for(let k=-5;k<=5;k++){ x.beginPath(); x.moveTo(k*w*.2-w*.04,-w*1.5); x.quadraticCurveTo(k*w*.2+w*.05,-w*.75,k*w*.2-w*.04,0); x.lineTo(k*w*.2+w*.05,0); x.quadraticCurveTo(k*w*.2+w*.14,-w*.75,k*w*.2+w*.05,-w*1.5); x.closePath(); x.fill(); } x.restore();
      const cx=w*.36, cy=w*.34; x.fillStyle=wc; x.beginPath(); x.ellipse(cx,cy,w*.62,w*.56,-.6,0,7); x.fill();
      x.fillStyle=flesh(); x.beginPath(); x.ellipse(cx,cy,w*.54,w*.48,-.6,0,7); x.fill();
      x.save(); x.beginPath(); x.ellipse(cx,cy,w*.54,w*.48,-.6,0,7); x.clip(); sugar(w*.8); x.restore();
      [[.14,.2,-.6],[.34,.14,-.3],[.55,.18,0],[.16,.42,-.8],[.36,.38,-.5],[.58,.4,-.2],[.32,.6,-.7]].forEach(([a,b2,an])=>{ x.save(); x.translate(w*a,w*b2); x.rotate(an+.6); x.fillStyle='#2a1a12'; x.beginPath(); x.moveTo(0,-w*.045); x.quadraticCurveTo(w*.035,w*.012,0,w*.035); x.quadraticCurveTo(-w*.035,w*.012,0,-w*.045); x.fill(); x.fillStyle='rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(-w*.008,-w*.014,w*.007,w*.012,0,0,7); x.fill(); x.restore(); });
    } else if(kind==='kiwi'){
      /* kiwi: casca marrom com pelinhos fazendo um "C" na diagonal, polpa com raios, anel de sementes e miolo claro */
      x.fillStyle='#7a5634'; x.fillRect(0,0,w,w); x.strokeStyle='rgba(60,40,20,.5)'; x.lineWidth=Math.max(1,w*.008); x.beginPath(); for(let k=0;k<60;k++){ const px=w*R(k,17), py=w*R(k,19); x.moveTo(px,py); x.lineTo(px+w*.02,py-w*.015); } x.stroke();
      const cx=w*.36, cy=w*.34; x.fillStyle='#e9f2c8'; x.beginPath(); x.ellipse(cx,cy,w*.58,w*.52,-.6,0,7); x.fill();
      const g=x.createRadialGradient(cx,cy,w*.05,cx,cy,w*.62); g.addColorStop(0,mix(c,'#ffffff',.45)); g.addColorStop(.6,c); g.addColorStop(1,mix(c,'#000000',.8)); x.fillStyle=g; x.beginPath(); x.ellipse(cx,cy,w*.53,w*.47,-.6,0,7); x.fill();
      x.strokeStyle='rgba(255,255,255,.25)'; x.lineWidth=Math.max(1,w*.012); x.beginPath(); for(let k=0;k<20;k++){ const a=k*Math.PI/10; x.moveTo(cx+Math.cos(a)*w*.13,cy+Math.sin(a)*w*.1); x.lineTo(cx+Math.cos(a)*w*.55,cy+Math.sin(a)*w*.5); } x.stroke();
      const cg=x.createRadialGradient(cx,cy,0,cx,cy,w*.15); cg.addColorStop(0,'#fbfde8'); cg.addColorStop(1,mix(c,'#ffffff',.35)); x.fillStyle=cg; x.beginPath(); x.ellipse(cx,cy,w*.15,w*.11,-.5,0,7); x.fill();
      for(let k=0;k<14;k++){ const a=k*Math.PI*2/14; x.fillStyle='#1e1a14'; x.beginPath(); x.ellipse(cx+Math.cos(a)*w*.21,cy+Math.sin(a)*w*.16,w*.014,w*.026,a+Math.PI/2,0,7); x.fill(); }
    } else if(kind==='grape'){
      /* uva: um cacho de verdade, com fileiras desencontradas, bolinhas de tamanhos um pouco diferentes,
         as de baixo por cima das de cima, sombra suave entre elas e um brilho pequeno */
      x.fillStyle=mix(c,'#000000',.55); x.fillRect(0,0,w,w);
      const G=[[.2,.2],[.5,.18],[.8,.2],[.35,.5],[.65,.5],[.04,.5],[.96,.5],[.2,.8],[.5,.82],[.8,.8]];
      G.forEach(([a,b2],k)=>{ const bx=w*(a+(R(k,3)-.5)*.03), by=w*(b2+(R(k,5)-.5)*.03), br=w*(.165+R(k,7)*.02);
        x.fillStyle='rgba(0,0,0,.28)'; x.beginPath(); x.arc(bx+br*.06,by+br*.14,br,0,7); x.fill();
        const gg=x.createRadialGradient(bx-br*.3,by-br*.35,br*.1,bx,by,br*1.05); gg.addColorStop(0,mix(c,'#ffffff',.62)); gg.addColorStop(.45,c); gg.addColorStop(1,mix(c,'#000000',.62));
        x.fillStyle=gg; x.beginPath(); x.arc(bx,by,br,0,7); x.fill();
        x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(bx-br*.35,by-br*.42,br*.18,br*.1,-.6,0,7); x.fill(); });
    } else {
      /* laranja (casca com poros) e abacaxi (losangos com pontinhos) */
      x.fillStyle=flesh(); x.fillRect(0,0,w,w);
      if(kind==='orange'){ for(let k=0;k<34;k++){ const px=w*R(k,1), py=w*R(k,2); x.fillStyle='rgba(140,60,0,.22)'; x.beginPath(); x.arc(px,py,w*.016,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.25)'; x.beginPath(); x.arc(px-w*.006,py-w*.006,w*.007,0,7); x.fill(); }
        const hl=x.createRadialGradient(w*.32,w*.3,0,w*.32,w*.3,w*.55); hl.addColorStop(0,'rgba(255,255,255,.35)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,w,w); }
      if(kind==='pine'){ x.strokeStyle=mix(c,'#000000',.7); x.lineWidth=Math.max(1,w*.02); x.beginPath(); for(let k=-4;k<6;k++){ x.moveTo(k*w*.25,0); x.lineTo(k*w*.25+w,w); x.moveTo(k*w*.25+w,0); x.lineTo(k*w*.25,w); } x.stroke();
        for(let k=-5;k<5;k++) for(let m=0;m<9;m++){ const px=(k+m+1)*w*.125, py=(m-k)*w*.125; if(px<0||px>w||py<0||py>w) continue; x.fillStyle='rgba(255,255,255,.22)'; x.beginPath(); x.arc(px,py-w*.03,w*.045,0,7); x.fill(); x.fillStyle='#8a5a12'; x.beginPath(); x.arc(px,py,w*.02,0,7); x.fill(); } }
      sugar();
    }
    x.fillStyle='rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(w*.26,w*.15,w*.13,w*.045,-.3,0,7); x.fill();
    x.restore();
    if(kind==='orange'){ x.save(); x.translate(w*.66,w*.12); x.rotate(-.55); const L=w*.3, lg=x.createLinearGradient(0,-L*.3,0,L*.3); lg.addColorStop(0,'#9be06a'); lg.addColorStop(1,'#3f8a2a'); x.fillStyle=lg; x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(L*.45,-L*.42,L,0); x.quadraticCurveTo(L*.45,L*.42,0,0); x.fill(); x.strokeStyle='rgba(30,70,20,.5)'; x.lineWidth=Math.max(1,w*.012); x.beginPath(); x.moveTo(L*.05,0); x.lineTo(L*.85,0); x.stroke(); x.restore(); }
    inShadow(x,w,r,'rgba(0,0,0,.25)',w*.07,0,-w*.045); inShadow(x,w,r,'rgba(255,255,255,.4)',w*.05,0,w*.03);
    x.strokeStyle='rgba(0,0,0,.18)'; x.lineWidth=Math.max(1,w*.015); rrect(x,w,r); x.stroke();
  } else if(skin==='brick'){
    /* tijolinhos: 3 carreiras desencontradas, rejunte claro afundado, cada tijolo com bisel e textura de barro */
    const r=w*.05; rrect(x,w,r); x.clip();
    x.fillStyle='#cfc6b4'; x.fillRect(0,0,w,w); const gm=w*.045;
    const rows=[[[0,.5],[.5,1]],[[-.25,.25],[.25,.75],[.75,1.25]],[[0,.5],[.5,1]]];
    rows.forEach((row,ri)=>row.forEach(([a,b2],k)=>{ const x0=w*a+gm/2, x1=w*b2-gm/2, y0=ri*w/3+gm/2, y1=(ri+1)*w/3-gm/2, bw=x1-x0, bh=y1-y0, tone=((ri*3+k)%3-1)*.06;
      const base=tone>0?mix(c,'#ffffff',1-tone):tone<0?mix(c,'#000000',1+tone):c;
      x.fillStyle=base; x.fillRect(x0,y0,bw,bh);
      const g=x.createLinearGradient(0,y0,0,y1); g.addColorStop(0,'rgba(255,255,255,.35)'); g.addColorStop(.25,'rgba(255,255,255,0)'); g.addColorStop(.8,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.35)'); x.fillStyle=g; x.fillRect(x0,y0,bw,bh);
      x.fillStyle='rgba(255,255,255,.3)'; x.fillRect(x0,y0,bw,Math.max(1,w*.015)); x.fillStyle='rgba(0,0,0,.28)'; x.fillRect(x0,y1-Math.max(1,w*.018),bw,Math.max(1,w*.018)); x.fillRect(x1-Math.max(1,w*.012),y0,Math.max(1,w*.012),bh);
      if(!lite){ for(let n=0;n<10;n++){ x.fillStyle=Math.random()<.5?'rgba(0,0,0,.16)':'rgba(255,255,255,.18)'; x.beginPath(); x.arc(x0+Math.random()*bw,y0+Math.random()*bh,w*(.006+Math.random()*.01),0,7); x.fill(); } } }));
    x.fillStyle='rgba(0,0,0,.12)'; for(let ri=1;ri<3;ri++) x.fillRect(0,ri*w/3-gm/2,w,Math.max(1,w*.012));
    x.strokeStyle='rgba(0,0,0,.25)'; x.lineWidth=Math.max(1,w*.02); rrect(x,w,r); x.stroke();
  } else if(skin==='classic'){
    const r=w*.07, b=w*.11; rrect(x,w,r); x.clip(); x.fillStyle=c; x.fillRect(0,0,w,w);
    const tri=(pts,col)=>{ x.beginPath(); x.moveTo(pts[0],pts[1]); for(let k=2;k<pts.length;k+=2) x.lineTo(pts[k],pts[k+1]); x.closePath(); x.fillStyle=col; x.fill(); };
    tri([0,0,w,0,w-b,b,b,b],mix(c,'#ffffff',.6)); tri([0,0,b,b,b,w-b,0,w],mix(c,'#ffffff',.8));
    tri([w,0,w,w,w-b,w-b,w-b,b],mix(c,'#000000',.8)); tri([0,w,b,w-b,w-b,w-b,w,w],mix(c,'#000000',.62));
  } else if(skin==='wild'){
    const r=w*skinR(effSkin()); rrect(x,w,r); x.clip(); const cols=['#e5483f','#f3c22f','#4cbb47','#2cb4d6','#8a52d8','#e5483f'];
    if(x.createConicGradient){ const g=x.createConicGradient(0,w/2,w/2); cols.forEach((cc,k)=>g.addColorStop(k/5,cc)); x.fillStyle=g; x.fillRect(0,0,w,w); }
    else cols.slice(0,5).forEach((cc,k)=>{ x.fillStyle=cc; x.fillRect(k*w/5,0,w/5+1,w); });
  } else if(skin==='bear'){
    /* ursinho: carinha com orelhas, olhos e focinho, tema ganho ao derrotar o Ursão */
    const r=w*.24, g=x.createRadialGradient(w*.4,w*.35,w*.05,w*.5,w*.55,w*.75); g.addColorStop(0,mix(c,'#ffffff',.6)); g.addColorStop(.6,c); g.addColorStop(1,mix(c,'#000000',.7));
    x.fillStyle=mix(c,'#000000',.62); [[.2,.2],[.8,.2]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.16,0,7); x.fill(); });
    x.fillStyle=mix(c,'#ffffff',.55); [[.2,.2],[.8,.2]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.08,0,7); x.fill(); });
    x.save(); x.translate(w*.06,w*.12); const iw=w*.88; rrect(x,iw,r); x.fillStyle=g; x.fill(); x.restore();
    x.fillStyle='#2a1a12'; [[.36,.5],[.64,.5]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.055,0,7); x.fill(); });
    x.fillStyle=mix(c,'#ffffff',.72); x.beginPath(); x.ellipse(w*.5,w*.7,w*.16,w*.12,0,0,7); x.fill();
    x.fillStyle='#2a1a12'; x.beginPath(); x.ellipse(w*.5,w*.65,w*.06,w*.045,0,0,7); x.fill();
  } else if(skin==='jelly'){
    /* bala embrulhada: bala listrada no meio e o papel torcido dos dois lados; tema ganho ao derrotar a Rainha Jujuba */
    candyWrap(x,w,c,'rgba(255,255,255,.55)');
  } else if(skin==='bug'){
    /* joaninha: casco na cor da peça, cabecinha preta, risca no meio e bolinhas; tema ganho ao derrotar o Lagartão */
    x.fillStyle='#2a2320'; x.beginPath(); x.arc(w*.5,w*.2,w*.19,0,7); x.fill();
    x.fillStyle='#fff'; [[.42,.16],[.58,.16]].forEach(([ex,ey])=>{ x.beginPath(); x.arc(w*ex,w*ey,w*.04,0,7); x.fill(); });
    x.strokeStyle='#2a2320'; x.lineWidth=Math.max(1,w*.025); x.lineCap='round'; x.beginPath(); x.moveTo(w*.42,w*.06); x.quadraticCurveTo(w*.36,w*.01,w*.3,w*.03); x.moveTo(w*.58,w*.06); x.quadraticCurveTo(w*.64,w*.01,w*.7,w*.03); x.stroke();
    const ins=w*.05, top=w*.24, iw=w-ins*2, ih=w-top-w*.04, r=iw*.42;
    x.save(); x.beginPath(); x.moveTo(ins+r,top); x.arcTo(ins+iw,top,ins+iw,top+ih,r); x.arcTo(ins+iw,top+ih,ins,top+ih,r); x.arcTo(ins,top+ih,ins,top,r); x.arcTo(ins,top,ins+iw,top,r); x.closePath();
    const g=x.createRadialGradient(w*.38,w*.4,w*.04,w*.5,w*.6,w*.62); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.5,c); g.addColorStop(1,mix(c,'#000000',.6));
    x.fillStyle=g; x.fill(); x.clip();
    x.fillStyle='#2a2320'; BUG_SPOTS.forEach(([sx,sy,sr])=>{ x.beginPath(); x.arc(w*sx,w*sy,w*sr,0,7); x.fill(); });
    x.strokeStyle=mix(c,'#000000',.45); x.lineWidth=Math.max(1,w*.035); x.beginPath(); x.moveTo(w*.5,top); x.lineTo(w*.5,top+ih); x.stroke();
    x.fillStyle='rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(w*.3,w*.36,w*.12,w*.05,-.6,0,7); x.fill(); x.beginPath(); x.ellipse(w*.7,w*.36,w*.12,w*.05,.6,0,7); x.fill();
    x.restore();
  } else if(skin==='ripe'||skin==='rotten'){
    /* maçã: madura (vermelha e brilhante) ou bichada (marrom, com manchas e uma minhoca) */
    const rot=skin==='rotten', cx=w*.5, cy=w*.56, r=w*.36;
    const g=x.createRadialGradient(w*.38,w*.42,w*.03,cx,cy,r*1.2); g.addColorStop(0,mix(c,'#ffffff',rot?.75:.5)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.55));
    x.beginPath(); x.moveTo(cx,cy-r*.72); x.bezierCurveTo(cx+r*.5,cy-r*1.15,cx+r*1.25,cy-r*.7,cx+r*1.02,cy+r*.15); x.bezierCurveTo(cx+r*.88,cy+r*.85,cx+r*.3,cy+r*1.08,cx,cy+r*.9);
    x.bezierCurveTo(cx-r*.3,cy+r*1.08,cx-r*.88,cy+r*.85,cx-r*1.02,cy+r*.15); x.bezierCurveTo(cx-r*1.25,cy-r*.7,cx-r*.5,cy-r*1.15,cx,cy-r*.72); x.closePath(); x.fillStyle=g; x.fill();
    x.strokeStyle='#5a3a1a'; x.lineWidth=Math.max(1,w*.04); x.lineCap='round'; x.beginPath(); x.moveTo(cx,cy-r*.68); x.quadraticCurveTo(cx+w*.02,cy-r*1.05,cx+w*.06,cy-r*1.22); x.stroke();
    x.fillStyle=rot?'#7a8a3a':'#4cbb47'; x.beginPath(); x.ellipse(cx+w*.15,cy-r*1.05,w*.11,w*.05,-.5,0,7); x.fill();
    if(rot){ x.fillStyle='rgba(50,28,10,.55)'; [[.36,.62,.07],[.62,.72,.05],[.6,.5,.04]].forEach(([a,b,rr])=>{ x.beginPath(); x.arc(w*a,w*b,w*rr,0,7); x.fill(); });
      x.fillStyle='#2a170a'; x.beginPath(); x.arc(w*.6,w*.6,w*.06,0,7); x.fill();
      x.fillStyle='#9fd65a'; x.beginPath(); x.arc(w*.66,w*.56,w*.06,0,7); x.fill(); x.fillStyle='#222'; x.beginPath(); x.arc(w*.68,w*.55,w*.014,0,7); x.fill(); }
    else { x.fillStyle='rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(w*.36,w*.44,w*.07,w*.12,-.5,0,7); x.fill(); }
  } else if(skin==='lantern'){
    /* Japão: papel claro, o sol grande e o portal torii, tudo no tom da peça */
    const r=w*.12; rrect(x,w,r); x.save(); x.clip();
    /* tudo no tom da peça: papel bem clarinho, o sol na cor da peça e o portal num tom escuro dela */
    const bg=x.createLinearGradient(0,0,0,w); bg.addColorStop(0,hmix(c,'#ffffff',.12)); bg.addColorStop(1,hmix(c,'#ffffff',.3)); x.fillStyle=bg; x.fillRect(0,0,w,w);
    const sg=x.createRadialGradient(w*.46,w*.42,w*.04,w*.5,w*.5,w*.34); sg.addColorStop(0,mix(c,'#ffffff',.55)); sg.addColorStop(1,c); x.fillStyle=sg; x.beginPath(); x.arc(w*.5,w*.5,w*.33,0,7); x.fill();
    const tc=hmix(c,'#000000',.5), tl=hmix(c,'#000000',.68), u=w/100;
    x.save();
    x.fillStyle=tc;
    /* trave de cima (kasagi), curvada nas pontas */
    x.beginPath(); x.moveTo(6*u,26*u); x.quadraticCurveTo(50*u,34*u,94*u,26*u); x.lineTo(90*u,36*u); x.quadraticCurveTo(50*u,42*u,10*u,36*u); x.closePath(); x.fill();
    x.fillRect(15*u,36*u,70*u,6*u);
    /* segunda trave (nuki) e o meio */
    x.fillRect(12*u,52*u,76*u,6*u); x.fillRect(46*u,40*u,8*u,13*u);
    /* colunas */
    x.fillRect(24*u,40*u,8*u,52*u); x.fillRect(68*u,40*u,8*u,52*u);
    x.restore();
    x.fillStyle=tl; x.fillRect(22*u,72*u,12*u,3*u); x.fillRect(66*u,72*u,12*u,3*u); x.fillRect(22*u,88*u,12*u,5*u); x.fillRect(66*u,88*u,12*u,5*u);
    x.fillStyle='rgba(255,255,255,.28)'; x.fillRect(10*u,28*u,40*u,2*u); x.fillRect(25*u,42*u,2*u,46*u); x.fillRect(69*u,42*u,2*u,46*u);
    x.restore();
    inShadow(x,w,r,'rgba(0,0,0,.2)',w*.06,0,-w*.035); x.strokeStyle=hmix(c,'#000000',.6); x.lineWidth=Math.max(1,w*.02); rrect(x,w,r); x.stroke();
  } else if(skin==='robot'){
    /* robô: caixinha de metal com parafusos, visor e olhos de luz; tema ganho ao derrotar o Robozão */
    const r=w*.16, ins=w*.04, iw=w-ins*2; x.save(); x.translate(ins,ins);
    const g=x.createLinearGradient(0,0,iw,iw); g.addColorStop(0,mix(c,'#ffffff',.5)); g.addColorStop(.45,c); g.addColorStop(1,mix(c,'#000000',.55));
    rrect(x,iw,r); x.fillStyle=g; x.fill(); x.lineWidth=Math.max(1,w*.025); x.strokeStyle=mix(c,'#000000',.5); x.stroke(); x.restore();
    x.fillStyle='rgba(255,255,255,.3)'; x.fillRect(w*.14,w*.1,w*.72,w*.06);
    [[.14,.14],[.86,.14],[.14,.86],[.86,.86]].forEach(([sx,sy])=>{ x.fillStyle=mix(c,'#000000',.45); x.beginPath(); x.arc(w*sx,w*sy,w*.045,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.arc(w*sx-w*.012,w*sy-w*.012,w*.016,0,7); x.fill(); });
    x.fillStyle='#1d2430'; x.beginPath(); if(x.roundRect) x.roundRect(w*.18,w*.32,w*.64,w*.28,w*.1); else x.rect(w*.18,w*.32,w*.64,w*.28); x.fill();
    robotEyes(x,w,'#8ff4ff',true); x.fillStyle=mix(c,'#000000',.55); x.fillRect(w*.32,w*.7,w*.36,w*.05);
  } else if(skin==='bamboo'){
    /* bambu: feixe de bambus finos na cor da peça; tema ganho ao derrotar o Pandão */
    bambooBundle(x,w,c);
  } else if(skin==='stalk'){
    /* bambu de verdade do Mundo 5 (cresce sozinho): uma vara grossa verde com folhinha */
    const ins=w*.18, bw=w-ins*2, g=x.createLinearGradient(ins,0,ins+bw,0); g.addColorStop(0,mix(c,'#000000',.55)); g.addColorStop(.3,mix(c,'#ffffff',.6)); g.addColorStop(.6,c); g.addColorStop(1,mix(c,'#000000',.55));
    x.fillStyle=g; x.fillRect(ins,0,bw,w); x.strokeStyle=mix(c,'#000000',.45); x.lineWidth=Math.max(1,w*.02); x.strokeRect(ins,0,bw,w);
    const ng=x.createLinearGradient(0,w*.46,0,w*.56); ng.addColorStop(0,mix(c,'#000000',.5)); ng.addColorStop(.5,mix(c,'#ffffff',.6)); ng.addColorStop(1,mix(c,'#000000',.55)); x.fillStyle=ng; x.fillRect(ins-w*.03,w*.46,bw+w*.06,w*.1);
    x.save(); x.translate(ins+bw,w*.46); x.rotate(-.5); x.fillStyle='#4f9a2e'; x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(w*.12,-w*.1,w*.28,0); x.quadraticCurveTo(w*.12,w*.1,0,0); x.fill(); x.restore();
  } else if(skin==='sushi'){
    /* sushi: bolinho de arroz com o peixe na cor da peça e uma fita de alga; tema ganho ao derrotar o Gatão da Sorte */
    const rg=x.createLinearGradient(0,w*.4,0,w*.94); rg.addColorStop(0,'#ffffff'); rg.addColorStop(1,'#d9d2c3');
    x.beginPath(); x.moveTo(w*.12,w*.5); x.quadraticCurveTo(w*.04,w*.94,w*.5,w*.93); x.quadraticCurveTo(w*.96,w*.94,w*.88,w*.5); x.closePath(); x.fillStyle=rg; x.fill();
    x.fillStyle='rgba(150,140,120,.35)'; for(let k=0;k<14;k++){ const px=w*(.18+((k*37)%64)/100), py=w*(.62+((k*23)%28)/100); x.beginPath(); x.ellipse(px,py,w*.03,w*.017,k,0,7); x.fill(); }
    sushiFish(x,w,c);
    sushiBand(x,w,c===GOLDSK?'#7a5200':'#24322a',false);
  } else if(skin==='petal'){
    /* flor de sakura: 5 pétalas cor-de-rosa (no Mundo 6 ela voa embora depois de poucas jogadas) */
    const cx=w*.5, cy=w*.52;
    for(let k=0;k<5;k++){ const a=k*Math.PI*2/5-Math.PI/2; x.save(); x.translate(cx,cy); x.rotate(a);
      const g=x.createLinearGradient(0,0,w*.36,0); g.addColorStop(0,'#fff0f5'); g.addColorStop(1,c);
      x.beginPath(); x.moveTo(0,0); x.bezierCurveTo(w*.12,-w*.2,w*.4,-w*.14,w*.38,-w*.03); x.lineTo(w*.33,0); x.lineTo(w*.38,w*.03); x.bezierCurveTo(w*.4,w*.14,w*.12,w*.2,0,0); x.fillStyle=g; x.fill();
      x.strokeStyle='rgba(214,90,130,.35)'; x.lineWidth=Math.max(1,w*.012); x.stroke(); x.restore(); }
    x.fillStyle='#f6c445'; x.beginPath(); x.arc(cx,cy,w*.07,0,7); x.fill(); x.fillStyle='#d6336c'; for(let k=0;k<5;k++){ const a=k*Math.PI*2/5; x.beginPath(); x.arc(cx+Math.cos(a)*w*.1,cy+Math.sin(a)*w*.1,w*.018,0,7); x.fill(); }
  } else if(skin==='koban'){
    /* moeda koban (oval de ouro) que o Gatão da Sorte joga */
    const g=x.createRadialGradient(w*.38,w*.32,w*.04,w*.5,w*.5,w*.5); g.addColorStop(0,'#fff3b8'); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.55));
    x.beginPath(); x.ellipse(w*.5,w*.5,w*.34,w*.44,0,0,7); x.fillStyle=g; x.fill(); x.lineWidth=Math.max(1,w*.03); x.strokeStyle=mix(c,'#000000',.5); x.stroke();
    x.strokeStyle=mix(c,'#000000',.62); x.lineWidth=Math.max(1,w*.018); for(let k=-3;k<=3;k++){ x.beginPath(); x.moveTo(w*.26,w*(.5+k*.08)); x.lineTo(w*.74,w*(.5+k*.08)); x.stroke(); }
    x.fillStyle=mix(c,'#000000',.62); x.fillRect(w*.43,w*.18,w*.14,w*.12); x.fillRect(w*.43,w*.7,w*.14,w*.12);
  } else if(skin==='nut'){
    /* porca de metal que o Robozão joga */
    const g=x.createLinearGradient(0,0,w,w); g.addColorStop(0,'#eef2f8'); g.addColorStop(.5,c); g.addColorStop(1,mix(c,'#000000',.5));
    x.beginPath(); for(let k=0;k<6;k++){ const a=k*Math.PI/3+Math.PI/6, px=w*.5+Math.cos(a)*w*.44, py=w*.5+Math.sin(a)*w*.44; k?x.lineTo(px,py):x.moveTo(px,py); } x.closePath(); x.fillStyle=g; x.fill();
    x.lineWidth=Math.max(1,w*.03); x.strokeStyle=mix(c,'#000000',.45); x.stroke();
    x.beginPath(); x.arc(w*.5,w*.5,w*.17,0,7); x.fillStyle='#3b4250'; x.fill(); x.lineWidth=Math.max(1,w*.04); x.strokeStyle='#cfd6e2'; x.stroke();
  } else if(skin==='gum'){
    /* chiclete: massa rosa amassada com uma bolha; gruda nas casas vizinhas */
    const ins=w*.06, iw=w-ins*2, r=iw*.38;
    x.save(); x.translate(ins,ins);
    const g=x.createRadialGradient(iw*.4,iw*.35,iw*.05,iw*.5,iw*.55,iw*.75); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.62));
    rrect(x,iw,r); x.fillStyle=g; x.fill();
    x.strokeStyle=mix(c,'#000000',.72); x.lineWidth=Math.max(1,w*.03); x.lineCap='round';
    [[.18,.62,.36,.7],[.3,.82,.52,.78],[.2,.4,.3,.3]].forEach(([a,b,c2,d])=>{ x.beginPath(); x.moveTo(iw*a,iw*b); x.quadraticCurveTo(iw*(a+c2)/2,iw*(b+d)/2+iw*.06,iw*c2,iw*d); x.stroke(); });
    const bg=x.createRadialGradient(iw*.6,iw*.36,0,iw*.64,iw*.42,iw*.26); bg.addColorStop(0,'rgba(255,255,255,.75)'); bg.addColorStop(.7,mix(c,'#ffffff',.55)); bg.addColorStop(1,mix(c,'#000000',.8));
    x.beginPath(); x.arc(iw*.64,iw*.42,iw*.24,0,7); x.fillStyle=bg; x.fill();
    x.fillStyle='rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(iw*.57,iw*.33,iw*.07,iw*.04,-.6,0,7); x.fill();
    x.restore();
  } else if(skin==='candy'){
    /* bolo de chocolate: quadradinho de bolo com a cobertura escorrida na cor da peça e granulado de chocolate */
    const ins=w*.04, iw=w-ins*2, r=iw*.16;
    const g=x.createLinearGradient(0,0,0,w); g.addColorStop(0,'#7a4a2a'); g.addColorStop(1,'#3e2414');
    x.save(); x.translate(ins,ins); rrect(x,iw,r); x.fillStyle=g; x.fill(); x.restore();
    if(!lite){ x.fillStyle='rgba(0,0,0,.18)'; for(let k=0;k<26;k++){ x.beginPath(); x.arc(w*(.1+Math.random()*.8),w*(.55+Math.random()*.38),w*.012,0,7); x.fill(); } }
    const ig=x.createLinearGradient(0,0,0,w*.6); ig.addColorStop(0,mix(c,'#ffffff',.5)); ig.addColorStop(1,c);
    x.fillStyle=ig; x.beginPath(); x.moveTo(w*.08,w*.2); x.quadraticCurveTo(w*.08,w*.06,w*.22,w*.06); x.lineTo(w*.78,w*.06); x.quadraticCurveTo(w*.92,w*.06,w*.92,w*.2); x.lineTo(w*.92,w*.42);
    [[.82,.62],[.7,.44],[.58,.7],[.44,.46],[.3,.6],[.18,.44]].forEach(([a,b2])=>x.quadraticCurveTo(w*(a+.06),w*(b2+.06),w*a,w*b2)); x.lineTo(w*.08,w*.44); x.closePath(); x.fill();
    x.strokeStyle=mix(c,'#000000',.7); x.lineWidth=Math.max(1,w*.012); x.stroke();
    x.fillStyle='rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(w*.32,w*.15,w*.15,w*.035,0,0,7); x.fill();
    /* granulado de chocolate por cima da cobertura */
    const gr=[[.22,.2,.4],[.38,.14,1.9],[.55,.22,.8],[.7,.15,2.4],[.8,.28,1.2],[.3,.32,2.8],[.47,.34,.2],[.64,.36,1.6],[.18,.36,1],[.86,.4,.5]];
    x.lineCap='round'; gr.forEach(([gx,gy,a])=>{ x.strokeStyle='#4a2a14'; x.lineWidth=Math.max(1.5,w*.035); x.beginPath(); x.moveTo(w*gx-Math.cos(a)*w*.03,w*gy-Math.sin(a)*w*.03); x.lineTo(w*gx+Math.cos(a)*w*.03,w*gy+Math.sin(a)*w*.03); x.stroke();
      x.strokeStyle='rgba(255,255,255,.3)'; x.lineWidth=Math.max(1,w*.01); x.stroke(); });
  }
  return cv;
}
function variant(src,kind){
  const w=src.width, c=document.createElement('canvas'); c.width=c.height=w; const x=c.getContext('2d'); x.drawImage(src,0,0);
  if(kind==='hl'){ x.globalCompositeOperation='source-atop'; x.fillStyle='rgba(255,255,255,.16)'; x.fillRect(0,0,w,w); }
  else { try{ const im=x.getImageData(0,0,w,w), d=im.data; for(let i=0;i<d.length;i+=4){ const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)*.55; d[i]=d[i+1]=d[i+2]=l; } x.putImageData(im,0,0); }
    catch(e){ x.globalCompositeOperation='source-atop'; x.fillStyle='rgba(40,40,48,.7)'; x.fillRect(0,0,w,w); } }
  return c;
}
function overlays(w,dpr,rad){
  const mk=f=>{ const c=document.createElement('canvas'); c.width=c.height=w; f(c.getContext('2d')); return c; };
  return {
    b:mk(x=>{ const g=x.createRadialGradient(w*.42,w*.42,0,w*.5,w*.5,w*.28); g.addColorStop(0,'#5a5a5a'); g.addColorStop(.7,'#111'); g.addColorStop(1,'#111');
      x.beginPath(); x.arc(w/2,w/2,w*.28,0,7); x.fillStyle=g; x.fill(); x.lineWidth=1.5*dpr; x.strokeStyle='rgba(255,255,255,.55)'; x.stroke(); }),
    i:mk(x=>{ rrect(x,w,w*rad); x.clip(); const g=x.createLinearGradient(0,0,w,w); g.addColorStop(0,'rgba(255,255,255,.7)'); g.addColorStop(.55,'rgba(190,225,255,.35)'); g.addColorStop(1,'rgba(255,255,255,.55)'); x.fillStyle=g; x.fillRect(0,0,w,w); }),
    c:mk(x=>{ x.lineCap='round'; x.lineWidth=Math.max(1,w*.035); x.strokeStyle='rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(w*.1,w*.1); x.lineTo(w*.9,w*.9); x.stroke();
      x.strokeStyle='rgba(255,255,255,.45)'; x.beginPath(); x.moveTo(w*.05,w*.7); x.lineTo(w*.95,w*.3); x.stroke(); }),
    ring:(()=>{ const cs=w/.94, R=Math.round(cs*1.3), c=document.createElement('canvas'); c.width=c.height=R; const x=c.getContext('2d'), sz=cs*1.06, o=(R-sz)/2, r=sz*.22;
      x.translate(o,o); x.shadowColor='rgba(255,255,255,.75)'; x.shadowBlur=cs*.4; x.lineWidth=2*dpr; x.strokeStyle='rgba(255,255,255,.95)'; rrect(x,sz,r); x.stroke(); x.stroke(); return c; })(),
    g:mk(x=>{ x.fillStyle='rgba(90,60,0,.7)'; x.font=`${Math.round(w*.45)}px system-ui,sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.fillText('★',w/2,w*.53); })
  };
}
function buildSprites(){
  const skin=effSkin(); if(!SPR_SKINS[baseSkin(skin)]){ document.body.classList.remove('spr'); SPR.skin=skin; SPR.lite=SET.lite; return; }
  const dpr=Math.min(2.5,window.devicePixelRatio||1), w=Math.max(16,Math.round(CS*.94*dpr));
  if(SPR.skin===skin&&SPR.lite===SET.lite&&SPR.px===w) return;
  const job=++SPR.job;
  const list=[...PALETTE.map((c,i)=>[String(i),c,skin==='fruit'?FRUIT[i]:null]),['s',STONE,null],['g',GOLD,null],['w','#fff',null,'wild'],['u',BEARC,null,'bear'],['m',GUMC,null,'gum'],['f',RIPEC,null,'ripe'],['r',ROTC,null,'rotten'],['k',STALKC,null,'stalk'],['p',PETALC,null,'petal'],['c',COINC,null,'koban'],['n',NUTC,null,'nut']];
  const out=[]; let i=0;
  const step=()=>{ if(job!==SPR.job) return;
    const t0=performance.now();
    while(i<list.length&&performance.now()-t0<6){ const [k,c,fr,sk]=list[i++]; out.push([k,drawBlock(sk||skin,c,fr,w,dpr,SET.lite)]); }
    if(i<list.length){ setTimeout(step,0); return; }
    const cv={}, hl={}, dead={}; out.forEach(([k,c])=>{ cv[k]=c; hl[k]=variant(c,'hl'); dead[k]=variant(c,'dead'); });
    SPR.cv=cv; SPR.hl=hl; SPR.dead=dead; SPR.ov=overlays(w,dpr,skinR(skin)); SPR.w=w; bDirty=true; bReq();
    /* imagens em data URL: funcionam em todo navegador (blob: falhava em alguns celulares e a peça sumia) */
    const enc=out.filter(o=>o[0]!=='w'), urls=[]; let j=0;
    const encStep=()=>{ if(job!==SPR.job) return; const t1=performance.now();
      while(j<enc.length&&performance.now()-t1<6){ const [k,c]=enc[j++]; urls.push([k,c.toDataURL('image/png')]); }
      if(j<enc.length){ setTimeout(encStep,0); return; }
      urls.forEach(([k,u])=>root.style.setProperty('--spr'+k,`url("${u}")`));
      SPR.skin=skin; SPR.lite=SET.lite; SPR.px=w; document.body.classList.add('spr');
    };
    encStep();
  };
  step();
}
function applyLook(){
  if(SET.theme==='soft') root.removeAttribute('data-app'); else root.setAttribute('data-app',SET.theme);
  const sk=effSkin();
  if(SPR.skin!==sk||SPR.lite!==SET.lite) document.body.classList.remove('spr');
  document.body.classList.forEach(c=>{ if(c.startsWith('skin-')&&c!=='skin-'+sk) document.body.classList.remove(c); }); document.body.classList.add('skin-'+sk);
  root.classList.toggle('lite',SET.lite); buildSprites(); SLOT.id=''; requestAnimationFrame(buildSlots);
  root.style.setProperty('--noise',SET.lite?'none':TEX.noise); root.style.setProperty('--fiber',SET.lite?'none':TEX.fiber);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content',THEME_COLOR[SET.theme]||'#e2e7ee');
}
