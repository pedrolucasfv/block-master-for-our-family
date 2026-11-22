'use strict';
/* CAMPANHA: CWORLDS (mundos e fases), regras de fase (campHook), estrelas, mapa */
/* ===================== CAMPANHA =====================
   Fases jogadas no mesmo motor do co-op (em turnos): sozinho, sem conexão, ou em grupo, numa sala.
   O progresso solo fica neste aparelho; o do grupo fica no aparelho de quem criou a sala. */
/* Cada mundo: tema das fases (skin), chefão, tema ganho ao vencer o chefão (reward) e o fundo dos cartões do mapa (card).
   3 estrelas em todas as fases de um mundo dão a versão dourada do tema ganho nele. */
const CWORLDS=[{w:1,name:'Pelúcia',icon:'🧸',skin:'velvet',boss:'bear',reward:'bear',card:'plush',bossC:BEARC,phases:[
  {name:'Primeiros passos',icon:'🧸',goal:'lines',v:5,desc:'Limpe {v} linhas.',st:{by:'pieces',two:14,three:12}},
  {name:'Contra o relógio',icon:'⏱️',goal:'score',v:350,time:90,desc:'Faça {v} pontos em até 90 segundos.',st:{by:'time',two:60,three:45}},
  {name:'Faxina',icon:'🧹',goal:'clear',setup:'stones',k:10,desc:'O tabuleiro começa com {k} blocos cinza. Limpe todos.',st:{by:'pieces',two:21,three:17}},
  {name:'Caça às estrelas',icon:'⭐',goal:'golds',setup:'golds',k:4,limit:27,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:15,three:9}},
  {name:'Pegando fogo',icon:'🔥',goal:'combo',v:3,limit:23,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:11,three:8}},
  {name:'Chuva de pedras',icon:'🌧️',goal:'survive',time:120,rain:15,mt:8,desc:'Aguente 2 minutos. Cai um bloco cinza a cada {rain} segundos, e você tem 8 segundos por jogada.',st:{by:'lines',two:17,three:22}},
  {name:'Quebra-cabeça',icon:'🧩',goal:'empty',setup:'puzzle',desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Inverno',icon:'❄️',goal:'clear',setup:'ice',k:6,desc:'Limpe os {k} blocos de gelo. Cada um precisa ser limpo 2 vezes.',st:{by:'pieces',two:39,three:29}},
  {name:'Arco-íris',icon:'🌈',goal:'colorLines',v:2,limit:44,colors:[0,3,5],desc:'Só 3 cores. Faça {v} linhas de uma cor só em até {limit} peças.',st:{by:'pieces',two:14,three:8}},
  {name:'Chefão: Ursão',icon:'🐻',goal:'boss',hp:30,time:180,desc:'Cada linha tira vida do Ursão; o combo multiplica o dano. Bravo, ele congela uma peça por 4 s.',st:{by:'time',two:65,three:50}}
]},{w:2,name:'Doceria',icon:'🍬',skin:'candy',boss:'queen',reward:'jelly',card:'candy',bossC:'#e8459a',phases:[
  {name:'Vitrine de doces',icon:'🍭',goal:'lines',v:8,desc:'Limpe {v} linhas.',st:{by:'pieces',two:21,three:18}},
  {name:'Fornada',icon:'🧁',goal:'score',v:450,time:90,desc:'Faça {v} pontos em até 90 segundos.',st:{by:'time',two:65,three:50}},
  {name:'Chiclete!',icon:'🫧',goal:'clear',setup:'gum',k:3,gum:3,desc:'Limpe os {k} chicletes. A cada {gum} jogadas, um chiclete gruda numa casa vizinha.',st:{by:'pieces',two:15,three:8}},
  {name:'Granulado',icon:'✨',goal:'golds',setup:'golds',k:6,limit:31,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:18,three:12}},
  {name:'Açúcar no talo',icon:'🍫',goal:'combo',v:4,limit:28,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:12,three:10}},
  {name:'Chuva de confeitos',icon:'🌧️',goal:'survive',time:120,rain:12,mt:7,desc:'Aguente 2 minutos. Cai um bloco cinza a cada {rain} segundos, e você tem 7 segundos por jogada.',st:{by:'lines',two:17,three:23}},
  {name:'Bolo em camadas',icon:'🎂',goal:'empty',setup:'puzzle',bands:[2,2,2,1],desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Pudim gelado',icon:'🍮',goal:'clear',setup:'ice',k:8,desc:'Limpe os {k} blocos de gelo. Cada um precisa ser limpo 2 vezes.',st:{by:'pieces',two:47,three:32}},
  {name:'Chiclete grudento',icon:'🍬',goal:'lines',v:10,setup:'gum',k:2,gum:2,desc:'Limpe {v} linhas. Começa com {k} chicletes, e a cada {gum} jogadas um gruda numa casa vizinha.',st:{by:'pieces',two:23,three:20}},
  {name:'Chefona: Rainha Jujuba',icon:'👑',goal:'boss',hp:40,time:200,gum:4,desc:'Cada linha tira vida da Rainha; o combo multiplica o dano. Ela joga chicletes que se espalham e, brava, gruda uma peça por 4 s.',st:{by:'time',two:80,three:55}}
]},{w:3,name:'Pomar',icon:'🍎',skin:'fruit',boss:'cat',reward:'bug',card:'leaf',bossC:'#6fb83a',phases:[
  {name:'Pomar em flor',icon:'🌸',goal:'lines',v:10,desc:'Limpe {v} linhas.',st:{by:'pieces',two:25,three:23}},
  {name:'Feira',icon:'🍉',goal:'score',v:550,time:90,desc:'Faça {v} pontos em até 90 segundos.',st:{by:'time',two:75,three:55}},
  {name:'Colheita',icon:'🧺',goal:'harvest',v:4,limit:28,ripe:{k:2,life:7,every:3},desc:'Colha {v} frutas maduras em até {limit} peças: limpe a fruta antes de a contagem chegar a zero, senão ela apodrece e vira bloco cinza.',st:{by:'pieces',two:18,three:13}},
  {name:'Joaninhas douradas',icon:'🐞',goal:'golds',setup:'golds',k:7,limit:34,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:17,three:12}},
  {name:'Suco duplo',icon:'🥤',goal:'combo',v:4,limit:25,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:13,three:10}},
  {name:'Ventania',icon:'🍃',goal:'survive',time:150,rain:12,mt:7,desc:'Aguente 2 minutos e meio. Cai um bloco cinza a cada {rain} segundos, e você tem 7 segundos por jogada.',st:{by:'lines',two:22,three:28}},
  {name:'Cesta cheia',icon:'🧺',goal:'empty',setup:'puzzle',bands:[2,2,1,1,1],desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Geada no pomar',icon:'❄️',goal:'clear',setup:'ice',k:10,desc:'Limpe os {k} blocos de gelo. Cada um precisa ser limpo 2 vezes.',st:{by:'pieces',two:47,three:36}},
  {name:'Fruta passada',icon:'🍐',goal:'clear',setup:'stones',k:8,ripe:{k:1,life:5,every:4},desc:'Limpe os {k} blocos cinza. Cuidado: fruta madura que apodrece vira mais um bloco cinza!',st:{by:'pieces',two:33,three:23}},
  {name:'Chefão: Lagartão Guloso',icon:'🦎',goal:'boss',hp:50,time:220,ripe:{k:1,life:6,every:5},desc:'Cada linha tira vida do Lagartão; o combo multiplica o dano, e fruta madura colhida tira 3 a mais. Ele joga maçãs bichadas e, bravo, morde uma peça por 4 s.',st:{by:'time',two:75,three:55}}
]},{w:4,name:'Obras',icon:'🏗️',skin:'brick',boss:'robot',reward:'robot',card:'hazard',bossC:'#7d8ea8',phases:[
  {name:'Alicerce',icon:'🧱',goal:'lines',v:12,desc:'Limpe {v} linhas.',st:{by:'pieces',two:29,three:27}},
  {name:'Hora extra',icon:'⏱️',goal:'score',v:650,time:90,desc:'Faça {v} pontos em até 90 segundos.',st:{by:'time',two:75,three:55}},
  {name:'Esteira',icon:'🏭',goal:'lines',v:8,belt:{rows:[3],every:3},desc:'Limpe {v} linhas. A cada 3 jogadas, a linha da esteira (com as setas) anda uma casa para a direita.',st:{by:'pieces',two:21,three:18}},
  {name:'Entulho',icon:'🪨',goal:'clear',setup:'stones',k:14,desc:'O tabuleiro começa com {k} blocos cinza. Limpe todos.',st:{by:'pieces',two:24,three:20}},
  {name:'Guindaste',icon:'🏗️',goal:'combo',v:5,limit:31,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:14,three:12}},
  {name:'Turno da noite',icon:'🌙',goal:'survive',time:150,rain:10,mt:6,desc:'Aguente 2 minutos e meio. Cai um bloco cinza a cada {rain} segundos, e você tem 6 segundos por jogada.',st:{by:'lines',two:22,three:29}},
  {name:'Planta baixa',icon:'📐',goal:'empty',setup:'puzzle',bands:[2,2,2,1],desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Duas esteiras',icon:'🏭',goal:'clear',setup:'stones',k:10,belt:{rows:[2,5],every:3},desc:'Limpe os {k} blocos cinza. Duas esteiras andam uma casa a cada 3 jogadas.',st:{by:'pieces',two:22,three:16}},
  {name:'Parafusos dourados',icon:'🔩',goal:'golds',setup:'golds',k:8,limit:33,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:16,three:13}},
  {name:'Chefão: Robozão',icon:'🤖',goal:'boss',hp:52,time:240,belt:{rows:[4],every:4},desc:'Cada linha tira vida do Robozão; o combo multiplica o dano. Uma esteira anda a cada 4 jogadas. Ele joga porcas de aço e, bravo, trava uma peça por 4 s.',st:{by:'time',two:95,three:75}}
]},{w:5,name:'Bambuzal',icon:'🎋',skin:'crochet',boss:'panda',reward:'bamboo',card:'bamboo',bossC:'#3c4048',phases:[
  {name:'Brotos',icon:'🌱',goal:'lines',v:12,desc:'Limpe {v} linhas.',st:{by:'pieces',two:28,three:26}},
  {name:'Chá verde',icon:'🍵',goal:'score',v:700,time:100,desc:'Faça {v} pontos em até 100 segundos.',st:{by:'time',two:80,three:60}},
  {name:'Bambu cresce',icon:'🎋',goal:'clear',setup:'bamboo',k:5,bamboo:{every:3},desc:'Limpe todo o bambu. A cada 3 jogadas, cada pé de bambu cresce uma casa para cima.',st:{by:'pieces',two:14,three:9}},
  {name:'Lanternas',icon:'🏮',goal:'golds',setup:'golds',k:8,limit:32,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:18,three:14}},
  {name:'Dança do panda',icon:'🐼',goal:'combo',v:5,limit:30,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:14,three:11}},
  {name:'Chuva na floresta',icon:'🌧️',goal:'survive',time:160,rain:10,mt:6,desc:'Aguente 2 minutos e 40 segundos. Cai um bloco cinza a cada {rain} segundos, e você tem 6 segundos por jogada.',st:{by:'lines',two:24,three:31}},
  {name:'Cesto de bambu',icon:'🧺',goal:'empty',setup:'puzzle',bands:[2,2,2,1],desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Neblina',icon:'🌫️',goal:'clear',setup:'ice',k:10,desc:'Limpe os {k} blocos de gelo. Cada um precisa ser limpo 2 vezes.',st:{by:'pieces',two:48,three:36}},
  {name:'Bambuzal fechado',icon:'🎍',goal:'lines',v:12,setup:'bamboo',k:3,bamboo:{every:2},desc:'Limpe {v} linhas. Começa com {k} pés de bambu, e eles crescem uma casa a cada 2 jogadas.',st:{by:'pieces',two:27,three:23}},
  {name:'Chefão: Pandão',icon:'🐼',goal:'boss',hp:70,time:250,bamboo:{every:4},desc:'Cada linha tira vida do Pandão; o combo multiplica o dano. Ele planta bambu que cresce a cada 4 jogadas e, bravo, abraça uma peça por 4 s.',st:{by:'time',two:95,three:65}}
]},{w:6,name:'Japão',icon:'⛩️',skin:'lantern',boss:'neko',reward:'sushi',card:'sakura',bossC:'#d6334a',phases:[
  {name:'Torii',icon:'⛩️',goal:'lines',v:14,desc:'Limpe {v} linhas.',st:{by:'pieces',two:32,three:29}},
  {name:'Trem-bala',icon:'🚄',goal:'score',v:700,time:85,desc:'Faça {v} pontos em até 85 segundos.',st:{by:'time',two:70,three:58}},
  {name:'Hanami',icon:'🌸',goal:'petals',v:5,limit:32,petal:{k:3,life:4,every:2},desc:'Pegue {v} flores de sakura em até {limit} peças: limpe a linha da flor antes de a contagem zerar, senão ela voa embora.',st:{by:'pieces',two:25,three:14}},
  {name:'Moedas da sorte',icon:'🪙',goal:'golds',setup:'golds',k:9,limit:33,desc:'Pegue os {k} blocos dourados em até {limit} peças.',st:{by:'pieces',two:19,three:14}},
  {name:'Taiko',icon:'🥁',goal:'combo',v:6,limit:33,desc:'Faça um combo x{v} em até {limit} peças.',st:{by:'pieces',two:17,three:14}},
  {name:'Tufão',icon:'🌀',goal:'survive',time:180,rain:9,mt:6,desc:'Aguente 3 minutos. Cai um bloco cinza a cada {rain} segundos, e você tem 6 segundos por jogada.',st:{by:'lines',two:27,three:36}},
  {name:'Tsuru de papel',icon:'🦢',goal:'empty',setup:'puzzle',bands:[2,2,1,1,1],desc:'As peças são contadas: encaixe todas e deixe o tabuleiro vazio.',st:{by:'attempts',two:3,three:1}},
  {name:'Monte Fuji',icon:'🗻',goal:'clear',setup:'ice',k:12,desc:'Limpe os {k} blocos de gelo. Cada um precisa ser limpo 2 vezes.',st:{by:'pieces',two:50,three:40}},
  {name:'Jardim zen',icon:'🪨',goal:'clear',setup:'stones',k:12,belt:{rows:[4],every:3},petal:{k:1,life:5,every:4},desc:'Limpe os {k} blocos cinza. Uma esteira anda a cada 3 jogadas e flores de sakura aparecem pelo caminho.',st:{by:'pieces',two:25,three:19}},
  {name:'Chefão: Gatão da Sorte',icon:'🐱',goal:'boss',hp:70,time:260,petal:{k:2,life:5,every:4},desc:'Cada linha tira vida do Gatão; o combo multiplica o dano, e cada flor de sakura pega tira 3 a mais. Ele joga moedas e, bravo, prende uma peça por 4 s.',st:{by:'time',two:105,three:70}}
]}];
const CWD=w=>CWORLDS[(w||1)-1]||CWORLDS[0];
/* chave das estrelas: o Mundo 1 guarda só o número da fase (como sempre foi); os outros, "mundo-fase" */
const ck=(w,ph)=>(w||1)===1?String(ph):w+'-'+ph;
/* tema das fases do mundo; se a pessoa estiver usando o tema ganho nesse mundo (normal ou dourado), as fases usam ele */
const campSkin=cfg=>{ const W=CWD(cfg&&cfg.camp&&cfg.camp.w); return baseSkin(SET.skin)===W.reward&&hasSkin(W.reward)&&(!isGold(SET.skin)||hasGold(W.reward))?SET.skin:W.skin; };
/* fruta madura: aparece com uma contagem de jogadas; colhida (limpa) antes de zerar conta ponto, senão apodrece e vira bloco cinza */
function ripeAdd(eng,n,life){ const idx=eng.addStones(Math.random,n,-7); idx.forEach(i=>{ eng.b[(i/N)|0][i%N].rp=life; }); return idx; }
/* flor de sakura: igual à fruta madura, mas quando a contagem zera ela só voa embora (a casa fica vazia) */
function petalAdd(eng,n,life){ const idx=eng.addStones(Math.random,n,-10); idx.forEach(i=>{ eng.b[(i/N)|0][i%N].rp=life; }); return idx; }
function petalTick(eng){ const fly=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(v&&v.c===-10){ v.rp--; if(v.rp<=0){ eng.b[y][x]=null; fly.push(y*N+x); } } } return fly; }
/* esteira: as linhas marcadas andam uma casa para a direita (o bloco da ponta volta pelo começo) */
function beltShift(eng,rows){ rows.forEach(y=>{ const r=eng.b[y]; r.unshift(r.pop()); }); }
/* bambu: planta pés de bambu nas linhas de baixo; cada pé cresce uma casa para cima (sem fechar linha sozinho) */
function bambooPlant(eng,n){ const out=[]; for(let k=0;k<n;k++){ const e=[]; for(let y=N-3;y<N;y++) for(let x=0;x<N;x++) if(!eng.b[y][x]&&!eng.wouldFill(y,x)) e.push([y,x]);
  if(!e.length) break; const [y,x]=e[Math.floor(Math.random()*e.length)]; eng.b[y][x]={c:-9,s:null,t:0}; out.push(y*N+x); } return out; }
function bambooGrow(eng){ const out=[], tops=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(v&&v.c===-9&&!(y>0&&eng.b[y-1][x]&&eng.b[y-1][x].c===-9)) tops.push([y,x]); }
  tops.sort(()=>Math.random()-.5).slice(0,4).forEach(([y,x])=>{ if(y>0&&!eng.b[y-1][x]&&!eng.wouldFill(y-1,x)){ eng.b[y-1][x]={c:-9,s:null,t:0}; out.push((y-1)*N+x); } }); return out; }
function ripeTick(eng){ const rot=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(v&&v.c===-7){ v.rp--; if(v.rp<=0){ eng.b[y][x]={c:-1,s:null,t:0}; rot.push(y*N+x); } } } return rot; }
const CHELPS=[{k:'martelo',i:'🔨',n:'Martelo',need:6,d:'quebra 1 bloco'},{k:'swap',i:'🔀',n:'Trocar peças',need:12,d:'troca as suas 3 peças'},{k:'row',i:'💥',n:'Bomba de linha',need:18,d:'limpa uma linha inteira'}];
function campLoad(slot){ return Object.assign({stars:{},att:{}},store.get('ddb_camp_'+slot,{})); }
function campSave(slot,st){ store.set('ddb_camp_'+slot,st); }
function campTotal(st){ return Object.values(st.stars).reduce((a,b)=>a+b,0); }
function campWTotal(st,w){ return CWD(w).phases.reduce((a,_,i)=>a+(st.stars[ck(w,i+1)]||0),0); }
/* um mundo abre quando o chefão do mundo anterior é vencido */
function campWOpen(st,w){ return w===1||devAll()||(st.stars[ck(w-1,CWD(w-1).phases.length)]||0)>0; }
function campOpen(st,w,n){ return campWOpen(st,w)&&(n===1||devAll()||(st.stars[ck(w,n-1)]||0)>0); }
function campAllGold(st,w){ return CWD(w).phases.every((_,i)=>(st.stars[ck(w,i+1)]||0)>=3); }
/* chiclete: um chiclete do tabuleiro gruda numa casa vizinha vazia (sem fechar linha sozinho) */
function gumSpread(eng){
  const c=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=eng.b[y][x]; if(!v||v.c!==-6) continue;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dy,dx])=>{ const ny=y+dy, nx=x+dx; if(ny>=0&&ny<N&&nx>=0&&nx<N&&!eng.b[ny][nx]&&!eng.wouldFill(ny,nx)) c.push(ny*N+nx); }); }
  if(!c.length) return -1; const i=c[Math.floor(Math.random()*c.length)]; eng.b[(i/N)|0][i%N]={c:-6,s:null,t:0}; return i;
}
function campHelps(st){ const t=campTotal(st); return CHELPS.filter(h=>t>=h.need||devAll()).map(h=>h.k); }
/* fases de pontos (score): a pontuação cresce mais rápido que o número de jogadas (combo), então metas pequenas a mais pedem muito mais tempo.
   Calibradas com um robô que planeja as 3 peças da bandeja: 1 estrela ~3,4 s por jogada, 3 estrelas ~2,2 s por jogada numa partida boa. */
/* mais jogadores, metas maiores (há mais variedade de peças e mais cabeças pensando) */
function campScale(def,P){
  const m=[1,1.25,1.4,1.55][Math.max(0,Math.min(3,P-1))], pm=1+(m-1)*.8, r=x=>Math.round(x);
  const sc={v:def.v, limit:def.limit?r(def.limit*pm):0, hp:def.hp?r(def.hp*m):0, rain:def.rain?Math.max(8,r(def.rain/m)):0, st2:def.st.two, st3:def.st.three};
  if(def.goal==='lines'||def.goal==='score') sc.v=r(def.v*m);
  if(def.st.by==='pieces'){ sc.st2=r(def.st.two*pm); sc.st3=r(def.st.three*pm); }
  if(def.st.by==='lines'){ sc.st2=r(def.st.two*m); sc.st3=r(def.st.three*m); }
  return sc;
}
function campDesc(def,sc,w){ const t=def.desc.replace('{v}',fmtN(sc.v||def.v||0)).replace('{k}',def.k||0).replace('{limit}',sc.limit||def.limit||0).replace('{rain}',sc.rain||def.rain||0).replace('{gum}',def.gum||0); return w&&isGold(campSkin({camp:{w}}))?t.replace(/blocos dourados/g,'blocos de diamante'):goldTxt(t); }
function campStarTxt(def,sc){
  const by=def.st.by;
  if(by==='pieces') return [`em até ${sc.st2} peças`,`em até ${sc.st3} peças`];
  if(by==='time') return [`em até ${fmtT(sc.st2*1000)}`,`em até ${fmtT(sc.st3*1000)}`];
  if(by==='lines') return [`limpando ${sc.st2} linhas`,`limpando ${sc.st3} linhas`];
  return ['em até 3 tentativas','na primeira tentativa'];
}
function campOpts(def){ const o=defOpts(); o.time=3; o.play=0; if(def.colors){ o.color=true; o.colors=def.colors; } return o; }
/* quebra-cabeça: faixas de linhas cheias, cada uma com o buraco exato de uma peça.
   Como as linhas de cima ficam vazias, nenhuma coluna fecha sozinha; cada peça completa só as linhas da sua faixa. */
function makePuzzle(seed,bands){
  const rng=makeRng(seed), b=Array.from({length:N},()=>Array(N).fill(null)), pieces=[];
  const hs=(bands||[2,2,1,1]).slice().sort(()=>rng()-.5); let row=N-hs.reduce((a,c)=>a+c,0);
  for(const h of hs){
    const opts=[]; FAM_ALL.forEach(f=>f.vars.forEach(v=>{ const vh=Math.max(...v.map(c=>c[0]))+1, vw=Math.max(...v.map(c=>c[1]))+1; if(vh===h&&vw<=3&&v.length>=2) opts.push(v); }));
    const cells=opts[Math.floor(rng()*opts.length)], w=Math.max(...cells.map(c=>c[1]))+1, col=Math.floor(rng()*(N-w+1)), color=Math.floor(rng()*NCOL);
    const hole=new Set(cells.map(([r,c])=>(row+r)*N+col+c));
    for(let y=row;y<row+h;y++) for(let x=0;x<N;x++) if(!hole.has(y*N+x)) b[y][x]={c:Math.floor(rng()*NCOL),s:null,t:0};
    pieces.push({cells,color,spec:null,pw:null,h,w,at:[row,col]});
    row+=h;
  }
  return {board:b,pieces:pieces.sort(()=>rng()-.5)};
}
function campStarsCalc(def,sc,cp,att){
  if(!cp.win) return 0; const by=def.st.by; let st=1;
  const v=by==='pieces'?cp.placed:by==='time'?cp.el/1000:by==='lines'?cp.lines:att;
  if(by==='lines'){ if(v>=sc.st3) st=3; else if(v>=sc.st2) st=2; } else { if(v<=sc.st3) st=3; else if(v<=sc.st2) st=2; }
  if(cp.used.length) st=Math.min(st,2);
  return st;
}
const isTurnType=t=>t==='coop';
/* regras de cada fase (o anfitrião calcula; os outros só mostram) */
function campHook(cfg){
  const ph=cfg.camp.ph, w=cfg.camp.w||1, W=CWD(w), def=W.phases[ph-1], BS=BOSSES[W.boss], P=cfg.players.length, sc=campScale(def,P), hk={noRegen:def.setup==='puzzle',def,sc};
  const cnt=(b,f)=>{ let n=0; for(const row of b) for(const v of row) if(v&&f(v)) n++; return n; };
  hk.init=H=>{
    const e=H.bd.all.eng, rnd=makeRng(cfg.seed+'|camp');
    if(def.colors) SH.ids.forEach(id=>H.trays[id]=gen3(H.rng[id],SH.o));
    if(def.setup==='stones') e.addStones(rnd,def.k);
    if(def.setup==='golds') e.addStones(rnd,def.k,-2);
    if(def.setup==='gum') e.addStones(rnd,def.k,-6);
    if(def.ripe) for(let k=0;k<def.ripe.k;k++) ripeAdd(e,1,def.ripe.life+k*2);
    if(def.petal) for(let k=0;k<def.petal.k;k++) petalAdd(e,1,def.petal.life+k);
    if(def.setup==='bamboo') bambooPlant(e,def.k);
    if(def.setup==='ice'){ const idx=e.addStones(rnd,def.k,0); idx.forEach(i=>{ e.b[(i/N)|0][i%N]={c:Math.floor(rnd()*NCOL),s:'ice',t:0,ic:1}; }); }
    if(def.setup==='puzzle'){ const pz=makePuzzle(w===1?'W1P7':'W'+w+'P'+ph,def.bands); e.b=pz.board; const q={}; SH.ids.forEach(id=>q[id]=[]); pz.pieces.forEach((p,i)=>q[SH.ids[i%SH.ids.length]].push(p));
      SH.ids.forEach(id=>{ H.trays[id]=[null,null,null]; for(let s=0;s<3&&q[id].length;s++) H.trays[id][s]=q[id].shift(); }); H.campQ=q; }
    H.cp={wait:!!(def.mt||def.rain||(def.time&&cfg.solo)),w,gumN:0,gum:0,ripe:0,ripeN:0,petal:0,petalN:0,beltN:0,bambN:0,bamb:0,ph,P,placed:0,lines:0,score:0,combo:0,colorLines:0,left:0,hp:sc.hp,hpMax:sc.hp,el:0,tl:def.time||0,helps:cfg.camp.helps||[],used:[],frz:null,bossN:0,rage:0,rainAt:sc.rain,txt:'',att:cfg.camp.att||1,mt:def.mt?def.mt*1000:0,moveAt:def.mt?def.mt*1000:0};
    hk.progress(H);
  };
  hk.progress=H=>{
    const cp=H.cp, b=H.bd.all.eng.b; let win=false;
    if(def.setup==='stones') cp.left=cnt(b,v=>v.c===-1);
    if(def.setup==='golds') cp.left=cnt(b,v=>v.c===-2);
    if(def.setup==='ice') cp.left=cnt(b,v=>v.ic);
    if(def.setup==='gum') cp.left=cnt(b,v=>v.c===-6);
    if(def.gum) cp.gum=cnt(b,v=>v.c===-6);
    if(def.setup==='bamboo') cp.left=cnt(b,v=>v.c===-9);
    if(def.bamboo) cp.bamb=cnt(b,v=>v.c===-9);
    if(def.setup==='puzzle') cp.left=SH.ids.reduce((s,id)=>s+H.trays[id].filter(Boolean).length+H.campQ[id].length,0);
    switch(def.goal){
      case 'lines': win=cp.lines>=sc.v; cp.txt=`Linhas: ${cp.lines}/${sc.v} · ${cp.placed} peças`; break;
      case 'score': win=cp.score>=sc.v; cp.txt=`Faltam ${fmtN(Math.max(0,sc.v-cp.score))} pontos`; break;
      case 'clear': win=cp.left===0; cp.txt=`${{ice:'Gelo',gum:'Chicletes',bamboo:'Bambu'}[def.setup]||'Blocos cinza'}: faltam ${cp.left} · ${cp.placed} peças`; break;
      case 'petals': win=cp.petal>=def.v; cp.txt=`Flores pegas: ${cp.petal}/${def.v} · peças ${cp.placed}/${sc.limit}`; break;
      case 'golds': win=cp.left===0; cp.txt=`Estrelas: ${def.k-cp.left}/${def.k} · peças ${cp.placed}/${sc.limit}`; break;
      case 'harvest': win=cp.ripe>=def.v; cp.txt=`Frutas colhidas: ${cp.ripe}/${def.v} · peças ${cp.placed}/${sc.limit}`; break;
      case 'combo': win=cp.combo>=def.v; cp.txt=`Maior combo: x${cp.combo} de x${def.v} · peças ${cp.placed}/${sc.limit}`; break;
      case 'colorLines': win=cp.colorLines>=def.v; cp.txt=`Linhas de uma cor: ${cp.colorLines}/${def.v} · peças ${cp.placed}/${sc.limit}`; break;
      case 'survive': cp.txt=`Aguente firme! ${cp.lines} linhas limpas`; break;
      case 'empty': win=b.every(row=>row.every(v=>!v)); cp.txt=`Peças que faltam: ${cp.left} · tentativa ${cp.att}`; break;
      case 'boss': win=cp.hp<=0; cp.txt=cp.rage?'😡 Bravo(a)! Cuidado':'⚔️ Limpe linhas para atacar'; break;
    }
    return win;
  };
  hk.finish=(win,msg)=>{ const H=SH.H, cp=H.cp; if(H.over) return; cp.win=win; cp.msg=msg||''; cp.el=SH.elapsed; cp.stars=campStarsCalc(def,sc,cp,cp.att); hostEnd(win?'campwin':'campfail',null); };
  const frzOn=cp=>{ if(!cp||!cp.frz) return false; const el=SH.host?SH.elapsed:cp.el+(SH.remAt?performance.now()-SH.remAt.at:0); return el<cp.frz.until; };
  hk.canPlace=(who,src)=>{ const cp=SH.H.cp; return !(frzOn(cp)&&cp.frz.id===who&&src!=='h'&&cp.frz.slot===src); };
  hk.canDrag=src=>{ const cp=SH.view&&SH.view.cp; return !(frzOn(cp)&&cp.frz.id===SH.me&&src!=='h'&&cp.frz.slot===src); };
  hk.dimSlot=i=>{ const cp=SH.view&&SH.view.cp; return !!(frzOn(cp)&&cp.frz.id===SH.me&&cp.frz.slot===i); };
  hk.afterPlace=(who,res,pts,B)=>{
    const H=SH.H, cp=H.cp; cp.wait=false; if(cp.mt) cp.moveAt=SH.elapsed+cp.mt; cp.placed++; cp.ripe+=res.ripe||0; cp.petal+=res.petal||0; cp.lines+=res.n; cp.score+=pts; cp.combo=Math.max(cp.combo,res.combo||0); cp.colorLines+=res.colorLines||0;
    if(def.goal==='boss'){
      if(res.n>0){ const dmg=res.n*Math.max(1,res.combo||1)*(res.chain||1)+((res.ripe||0)+(res.petal||0))*3; cp.hp-=dmg; H.ev.dmg=dmg; }
      if(cp.hp>0){ cp.bossN++; const rage=cp.hp<=cp.hpMax/2; if(rage&&!cp.rage){ cp.rage=1; H.ev.rage=1; }
        if(cp.bossN>=(rage?4:5)){ cp.bossN=0; const added=BS.cell[0]===-9?bambooPlant(B.eng,2):B.eng.addStones(Math.random,2,BS.cell[0],BS.cell[1]); H.ev.boss={cells:added}; if(rage) cp.frzPending=1; } }
    }
    /* chiclete gruda numa casa vizinha a cada def.gum jogadas (só conta enquanto houver chiclete) */
    /* esteira: anda e, se fechar linha, limpa na hora (conta para a meta e para o dano no chefão) */
    if(def.belt){ cp.beltN++; if(cp.beltN>=def.belt.every){ cp.beltN=0; beltShift(B.eng,def.belt.rows); H.ev.belt=def.belt.rows.slice();
      const fl=B.eng.fullLines(); if(fl.rows.length||fl.cols.length){ const r2=B.eng.settle(0); cp.lines+=r2.n; cp.score+=r2.pts; B.sc+=r2.pts;
        r2.steps.forEach(st=>st.cleared.forEach(x=>H.ev.cleared.push([x[0],x[1],x[2]]))); if(def.goal==='boss'&&r2.n){ const d2=r2.n*Math.max(1,r2.combo||1); cp.hp-=d2; H.ev.dmg=(H.ev.dmg||0)+d2; } } } }
    if(def.bamboo&&B.eng.b.some(row=>row.some(v=>v&&v.c===-9))){ cp.bambN++; if(cp.bambN>=def.bamboo.every){ cp.bambN=0; const g2=bambooGrow(B.eng); if(g2.length) H.ev.grow=g2; } }
    if(def.petal){ const fly=petalTick(B.eng); if(fly.length) H.ev.fly=fly; cp.petalN++;
      const have=B.eng.b.reduce((a,row)=>a+row.filter(v=>v&&v.c===-10).length,0);
      if(have<def.petal.k&&cp.petalN>=def.petal.every){ cp.petalN=0; const add=petalAdd(B.eng,1,def.petal.life); if(add.length) H.ev.petal=add; } }
    if(def.ripe){ const rot=ripeTick(B.eng); if(rot.length) H.ev.rot=rot; cp.ripeN++;
      const have=B.eng.b.reduce((a,row)=>a+row.filter(v=>v&&v.c===-7).length,0);
      if(have<def.ripe.k&&cp.ripeN>=def.ripe.every){ cp.ripeN=0; const add=ripeAdd(B.eng,1,def.ripe.life); if(add.length) H.ev.ripe=add; } }
    if(def.gum&&B.eng.b.some(row=>row.some(v=>v&&v.c===-6))){ cp.gumN++; if(cp.gumN>=def.gum){ cp.gumN=0; const i=gumSpread(B.eng); if(i>=0) H.ev.gum=[i]; } }
    if(hk.noRegen){ const q=H.campQ[who]; if(H.trays[who].every(x=>!x)&&q.length) for(let s=0;s<3&&q.length;s++) H.trays[who][s]=q.shift(); }
    if(hk.progress(H)){ hk.finish(true); return; }
    if(sc.limit&&cp.placed>=sc.limit){ hk.finish(false,'Acabaram as peças'); return; }
    if(hk.noRegen&&cp.left===0){ hk.finish(false,'As peças acabaram e sobrou bloco no tabuleiro'); return; }
  };
  /* depois da reposição e da troca de vez: congela uma peça de quem joga agora, por 4 segundos */
  hk.afterTurn=()=>{
    const H=SH.H, cp=H.cp; if(!cp.frzPending||H.over) return; cp.frzPending=0;
    const ids=SH.ids.filter(x=>(H.trays[x]||[]).some(Boolean)), id=ids.length?ids[Math.floor(Math.random()*ids.length)]:H.turn, tray=H.trays[id]||[], cand=[0,1,2].filter(i=>tray[i]);
    if(!cand.length) return;
    cp.frz={slot:cand[Math.floor(Math.random()*cand.length)],id,until:SH.elapsed+4000}; if(H.ev&&H.ev.boss) H.ev.boss.frz=1;
  };
  hk.afterHelp=()=>{ const H=SH.H; if(H.over) return; if(hk.progress(H)) hk.finish(true); };
  /* ajuda ainda não usada (martelo, trocar peças, bomba de linha) salva: avisa em vez de perder */
  hk.helpLeft=cp=>cp.helps.some(h=>!cp.used.includes(h)&&!(h==='swap'&&hk.noRegen));
  hk.stuck=()=>{ const cp=SH.H.cp;
    if(hk.helpLeft(cp)){ if(!cp.needHelp){ cp.needHelp=true; if(!cp.used.length&&SH.playing&&!SH.paused){ cancelDrag(); setPaused(true); } else broadcast(); renderShared(); } return; }
    hk.finish(false,def.setup==='puzzle'?'Nenhuma peça cabe mais: o quebra-cabeça travou':'Sem espaço no tabuleiro'); };
  hk.tick=t=>{
    if(!SH||SH.over) return; const v=SH.view, cp=SH.host?SH.H.cp:v&&v.cp; if(!cp) return;
    if(cp.frz&&SH.playing){ const el=SH.host?SH.elapsed:cp.el+(SH.remAt?t-SH.remAt.at:0);
      if(el>=cp.frz.until){ if(SH.host){ cp.frz=null; broadcast(); } renderShared(); } else if(t-(hk.fzT||0)>250){ hk.fzT=t; renderSharedStatus(t); } }
    if(cp.mt&&SH.playing&&!(v&&v.paused)&&t-(hk.stT||0)>100){ hk.stT=t; renderSharedStatus(t);
      const el=SH.host?SH.elapsed:cp.el+(SH.remAt?t-SH.remAt.at:0), sec=Math.ceil((cp.moveAt-el)/1000); if(sec<=3&&sec>0&&sec!==hk.beep){ hk.beep=sec; SFX.tick(); } }
    if(!SH.host){ if(cp.tl&&SH.remAt&&SH.playing&&!(v&&v.paused)){ const el=cp.el+(t-SH.remAt.at); setTimer(cp.tl*1000-el,cp.tl*1000,false); } return; }
    const H=SH.H; if(!SH.playing||H.paused||H.over) return; cp.el=SH.elapsed;
    if(cp.mt&&SH.elapsed>=cp.moveAt){ hk.finish(false,'O tempo da jogada acabou'); return; }
    if(cp.tl){ const left=cp.tl*1000-SH.elapsed; setTimer(left,cp.tl*1000,false);
      if(left<=0){ if(def.goal==='survive'){ hk.progress(H); hk.finish(true); } else hk.finish(false,'O tempo acabou'); return; } }
    if(sc.rain&&SH.elapsed>=cp.rainAt*1000){ cp.rainAt+=sc.rain; const added=H.bd.all.eng.addStones(Math.random,1);
      H.ev={id:(H.ev?H.ev.id:0)+1,who:'_',k:null,pts:0,res:{n:0,chain:0,colorLines:0,bombs:0,perfect:false,combo:H.bd.all.eng.combo},cleared:[],placed:[],cr:0,cc:0,rain:added};
      playEv(H.ev); hostCheckStuck(); broadcast(); renderShared(); }
  };
  hk.status=v=>{ const cp=v.cp; if(!cp) return null; const grp=SH.ids.length>1;
    const k=SH.ids.indexOf(SH.me), part=grp&&!hk.noRegen?(SH.ids.length<=2?(k?'Seu lado: direita · ':'Seu lado: esquerda · '):`Seu quadrante: ${['↖','↗','↙','↘'][k]} · `):'';
    let t=part+cp.txt, wn=false;
    if(cp.wait) return {t:'⏸ Relógio parado · toque na tela ou jogue uma peça para começar',w:false};
    if(frzOn(cp)&&cp.frz.id===SH.me){ const el=SH.host?SH.elapsed:cp.el+(SH.remAt?performance.now()-SH.remAt.at:0); t+=` · ${BS.frzI} ${BS.frzT} (${Math.ceil((cp.frz.until-el)/1000)} s)`; wn=true; }
    if(def.gum&&cp.gum) t+=` · 🫧 gruda em ${def.gum-(cp.gumN||0)}`;
    if(def.belt) t+=` · 🏭 anda em ${def.belt.every-(cp.beltN||0)}`;
    if(def.bamboo&&cp.bamb) t+=` · 🎋 cresce em ${def.bamboo.every-(cp.bambN||0)}`;
    if(cp.mt&&SH.playing){ const el=SH.host?SH.elapsed:cp.el+(SH.remAt?performance.now()-SH.remAt.at:0), left=Math.max(0,cp.moveAt-el); t=`⏱ ${(left/1000).toFixed(1).replace('.',',')} s · `+t; if(left<3000) wn=true; } if(cp.needHelp&&SH.playing){ t='Nenhuma peça cabe: use uma ajuda (🔨 🔀 💥) para continuar'; wn=true; } if(v.hammer>0) t='🔨 Toque num bloco para quebrar'; if(SH.tapMode==='row') t='💥 Toque numa casa: a linha inteira some';
    return {t,w:wn}; };
  hk.render=(v,anim)=>{
    const cp=v.cp; if(!cp) return;
    if(def.goal==='boss') BOSS_ID=W.boss;
    const bl=def.belt?def.belt.rows:null; if(BELT!==bl){ BELT=bl; bDirty=true; bReq(); }
    if(def.goal==='boss'&&!SH.over){ const tr=$('#fxl .bosstrip'); if(!tr||tr.style.visibility==='hidden'){ bossDock(cp.rage); bossHP(cp.hp,cp.hpMax); } }
    if(def.goal==='boss'&&!SH.bossIntro){ SH.bossIntro=true; const s0=SH; bossPrep(W.boss).then(()=>{ if(SH===s0&&!SH.over){ bossDock(cp.rage); bossShow('enter'); setTimeout(()=>bossSay(BS.say.enter,1900),350); } }); }
    $('#gLabel').textContent=`Fase ${ph} · ${def.name}`; $('#scoreLbl').textContent=cfg.solo?'Pontos':'Pontos do grupo';
    /* embaixo: a descrição e o que precisa para as estrelas; o andamento vai no cartão ao lado dos pontos (setStatus) */
    /* chefão: a descrição fica só na pausa; o andamento ("Limpe linhas para atacar") vai nessa linha (setStatus), e o chefão ganha o espaço do cartão */
    if(def.goal==='boss') SH.bossUI=true;
    else { const st=$('#subTxt'), html=`${def.icon} ${esc(campDesc(def,sc,w))}`;
      if(st._h!==html){ st._h=html; st.innerHTML=html; } const m=$('#mission'); if(m.hidden){ m.hidden=false; layout(); } }
    const tb=$('#timebar'); tb.classList.remove('hp');
    if(def.goal==='boss') bossHP(cp.hp,cp.hpMax);
    if(cp.tl){ tb.style.visibility='visible'; } else { tb.style.visibility='hidden'; $('#timer').textContent=''; }
    $$('#actions [data-help]').forEach(b=>{ const k=b.dataset.help; b.disabled=!cp.helps.includes(k)||cp.used.includes(k)||(k==='swap'&&hk.noRegen)||!SH.playing; });
  };
  hk.ev=(ev,mine)=>{
    if(ev.rain){ setTimeout(()=>BC.drop(ev.rain),0); SFX.alert(); }
    if(ev.gum){ setTimeout(()=>{ BC.drop(ev.gum,0); SFX.pick(); },ev.boss?1500:ev.dmg?300:120); }
    if(ev.ripe) setTimeout(()=>{ BC.drop(ev.ripe,0); SFX.pick(); },ev.boss?1500:200);
    if(ev.petal) setTimeout(()=>{ BC.drop(ev.petal,0); SFX.pick(); },ev.boss?1500:200);
    if(ev.fly) ev.fly.forEach((i,k)=>spawnClear(i,-10,null,k*80));
    if(ev.grow) setTimeout(()=>{ BC.drop(ev.grow,0); SFX.pick(); },ev.boss?1500:250);
    if(ev.belt){ setTimeout(()=>{ const idx=[]; ev.belt.forEach(y=>{ for(let x=0;x<N;x++) idx.push(y*N+x); }); BC.glow(idx); SFX.back(); },120); }
    if(ev.res&&ev.res.petal) toast(def.goal==='boss'?'🌸 Flor de sakura: +3 de dano!':'🌸 Flor de sakura!');
    if(ev.rot){ setTimeout(()=>{ BC.glow(ev.rot); SFX.thud(); },150); if(mine) toast('🍂 Uma fruta apodreceu e virou bloco cinza'); }
    if(ev.res&&ev.res.ripe) toast(def.goal==='boss'?'🧺 Fruta colhida: +3 de dano!':'🧺 Fruta colhida!');
    if(ev.dmg) bossHurt(ev.dmg);
    if(ev.boss){ const later=ev.dmg?650:0; setTimeout(()=>{ if(!SH||SH.over) return; BC.drop(ev.boss.cells,1000); bossShow('attack',{cells:ev.boss.cells,rage:!!(SH.view&&SH.view.cp&&SH.view.cp.rage)||!!ev.rage});
        setTimeout(()=>bossSay(ev.boss.frz?BS.say.atkFrz:ev.rage?BS.say.atkRage:BS.say.atk,1500),260);
        setTimeout(()=>shake(),1350); },later); }
    else if(ev.rage){ setTimeout(()=>{ if(!SH||SH.over) return; bossShow('rage',{rage:true}); setTimeout(()=>bossSay(BS.say.rage,1500),250); },ev.dmg?650:0); }
  };
  hk.actions=()=>{
    setActions(CHELPS.map(h=>`<button class="chip" data-help="${h.k}" title="${h.d}">${h.i} ${h.n}</button>`).join('')+(cfg.solo?'':emoBtns())); bindEmos();
    $$('#actions [data-help]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.help;
      if(k==='row'){ SH.tapMode=SH.tapMode==='row'?null:'row'; if(SH.tapMode) toast('💥 Toque numa casa do tabuleiro: a linha inteira some'); renderShared(); return; }
      act({k:'help',h:k}); if(k==='martelo') toast('🔨 Toque num bloco para quebrar'); }));
  };
  hk.act=(who,a)=>{
    if(a.k!=='help') return; const H=SH.H, cp=H.cp, h=a.h;
    if(!cp.helps.includes(h)||cp.used.includes(h)) return;
    if(h==='martelo') H.hammer[who]=(H.hammer[who]||0)+1;
    else if(h==='swap'){ if(hk.noRegen) return; H.trays[who]=gen3(H.rng[who],SH.o); }
    else if(h==='row'){ const y=a.i|0, B=H.bd.all; if(y<0||y>=N) return; const cl=[];
      for(let x=0;x<N;x++){ const v=B.eng.b[y][x]; if(v){ cl.push([y*N+x,v.c,v.s]); B.eng.b[y][x]=null; } }
      H.ev={id:(H.ev?H.ev.id:0)+1,who,k:null,pts:0,res:{n:0,chain:0,colorLines:0,bombs:0,perfect:false,combo:B.eng.combo},cleared:cl,placed:[],cr:y+.5,cc:N/2}; playEv(H.ev); }
    else return;
    cp.used.push(h); cp.needHelp=false; if(hk.progress(H)) hk.finish(true); else hostCheckStuck();
  };
  hk.onEnd=over=>{
    const cp=SH.H.cp; over.win=cp.win; over.stars=cp.stars; over.msg=cp.msg; over.camp={w,ph,slot:cfg.camp.slot}; over.cp={placed:cp.placed,lines:cp.lines,score:cp.score,el:cp.el,used:cp.used.length};
    const slot=cfg.camp.slot, st=campLoad(slot), k=ck(w,ph);
    if(cp.win){ st.stars[k]=Math.max(st.stars[k]||0,cp.stars); over.best=st.stars[k]; }
    campSave(slot,st);
    if(cp.win&&campAllGold(st,w)) over.gold=W.reward;
  };
  hk.over=info=>{
    const s=SH; cancelDrag(); $('#timebar').classList.remove('hp');
    if(info.win&&def.goal==='boss'&&unlockSkin(W.reward)) info.won=W.reward;
    if(info.gold&&unlockSkin(info.gold)) info.won=info.gold;
    if(info.gold&&unlockGold(info.gold)) info.goldNew=1;
    setTimeout(()=>{ if(SH!==s) return;
      if(info.win&&def.goal==='boss'){ bossShow('defeat'); setTimeout(()=>bossSay(BS.say.defeat,1300),200); }
      if(info.win){ setTimeout(()=>{ if(SH===s){ praise('VITÓRIA!','⭐'.repeat(info.stars||1),true); SFX.win(); } },def.goal==='boss'?1300:0); } else { praise(info.msg||'Não foi dessa vez'); SFX.over(); BC.dead(); }
      setTimeout(()=>{ if(SH===s) campEnd(info,cfg); },def.goal==='boss'&&info.win?2900:1600); },300);
  };
  return hk;
}
/* no pause da campanha: a descrição e o que precisa para cada estrela */
function campPauseInfo(){
  const box=$('#pauseGoal'); if(!box) return; if(!SH||SH.type!=='camp'){ box.hidden=true; return; }
  const c=SH.cfg.camp, W=CWD(c.w), def=W.phases[c.ph-1], sc=campScale(def,SH.cfg.players.length), tx=campStarTxt(def,sc), cp=SH.view&&SH.view.cp, used=cp&&cp.used&&cp.used.length;
  box.innerHTML=`<p class="reason">${def.icon} ${esc(campDesc(def,sc,c.w))}</p><div class="kv"><span>★</span><b>completar</b></div><div class="kv"><span>★★</span><b>${esc(tx[0])}</b></div><div class="kv"><span>★★★</span><b>${esc(tx[1])}</b></div>${used?'<p class="muted">Você usou ajuda: nesta tentativa o máximo é ★★.</p>':''}`;
  box.hidden=false;
}
function campEnd(info,cfg){
  const ph=cfg.camp.ph, w=cfg.camp.w||1, W=CWD(w), def=W.phases[ph-1], sc=campScale(def,cfg.players.length), solo=!!cfg.solo, host=solo||NET.role==='A';
  const next=ph<W.phases.length?[w,ph+1]:CWORLDS[w]?[w+1,1]:null, cp=info.cp||{};
  let body=`<p class="reason">${def.icon} Mundo ${w} · Fase ${ph} · ${esc(def.name)}</p>`;
  if(info.win){ body+=`<div class="stars3">${[1,2,3].map(i=>`<span class="${i<=info.stars?'on':''}">★</span>`).join('')}</div><div class="winner win">Fase concluída!</div>`;
    const tx=campStarTxt(def,sc); body+=`<p class="muted">★★ ${tx[0]} · ★★★ ${tx[1]}${cp.used?' · com ajuda, no máximo ★★':''}</p>`;
    if(info.won&&def.goal==='boss') body+=`<p class="newbest">🏆 Você derrotou ${esc(bossArt(BOSSES[W.boss]))}! Novo tema de peças liberado: ${SKIN_L[W.reward]} (nas Configurações).${CWORLDS[w]?` O Mundo ${w+1} · ${CWORLDS[w].icon} ${esc(CWORLDS[w].name)} foi aberto!`:''}</p>`;
    if(info.goldNew) body+=`<p class="newbest">✨ 3 estrelas em todas as fases do Mundo ${w}! ${SKIN_L[W.reward]} dourado liberado: nas Configurações, toque de novo no tema ${SKIN_L[W.reward]} para trocar.</p>`; }
  else body+=`<div class="winner lose">${esc(info.msg||'Não foi dessa vez')}</div><p class="muted">Tente de novo: as tentativas são ilimitadas.</p>`;
  body+=statsHTML([[cp.placed||0,'peças'],[cp.lines||0,'linhas'],[fmtT(cp.el||0),'tempo']]);
  if(solo) body+='<div id="rkPhase"></div>';
  const btns=[];
  if(host){
    if(info.win&&next) btns.push({t:next[0]!==w?'Próximo mundo':'Próxima fase',cls:'primary',on:()=>campGo(next[1],cfg,next[0])});
    btns.push({t:'Tentar de novo',cls:info.win&&next?'':'primary',on:()=>campGo(ph,cfg)});
  } else body+=`<p class="muted">Quem criou a sala escolhe a próxima fase.</p>`;
  btns.push({t:solo?'Mapa':'Voltar à sala',cls:'ghost',on:()=>{ if(solo){ closeEnd(); SH=null; IN=null; openCamp(w); } else backToRoom(); }});
  openEnd(body,btns);
  if(solo){ rkCampEnd(info,cfg); rkPhaseBox(w,ph); }
}
function campGo(ph,cfg,w){ w=w||cfg.camp.w||1; closeEnd(); if(cfg.solo){ SH=null; startCampSolo(w,ph); } else { NET.lobby.w=w; NET.lobby.ph=ph; hostStart(true); } }
function startCampSolo(w,ph){
  const st=campLoad('solo'), def=CWD(w).phases[ph-1], k=ck(w,ph); st.att[k]=(st.att[k]||0)+1; campSave('solo',st);
  ac(); startShared({type:'camp',solo:true,me:'A',players:['A'],opts:campOpts(def),seed:'C|'+Date.now()+'|'+Math.random().toString(36).slice(2),round:st.att[k],size:8,camp:{w,ph,helps:campHelps(st),slot:'solo',att:st.att[k]}});
}
/* mapa do mundo */
/* retângulo inteiro de pelúcia (mesma técnica do bloco Pelúcia: sombreado macio + milhares de pelinhos) */
const hexOf=rgb=>'#'+rgb.match(/\d+/g).slice(0,3).map(v=>(+v).toString(16).padStart(2,'0')).join('');
function plushRect(W,H,c){
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d'), ins=0, iw=W, ih=H, rr=0.01;
  const path=()=>{ x.beginPath(); x.moveTo(ins+rr,ins); x.arcTo(ins+iw,ins,ins+iw,ins+ih,rr); x.arcTo(ins+iw,ins+ih,ins,ins+ih,rr); x.arcTo(ins,ins+ih,ins,ins,rr); x.arcTo(ins,ins,ins+iw,ins,rr); x.closePath(); };
  const g=x.createLinearGradient(0,ins,0,ins+ih); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.5,c); g.addColorStop(1,mix(c,'#000000',.8));
  path(); x.fillStyle=g; x.fill(); x.save(); path(); x.clip();
  const B=7, paths=Array.from({length:B},()=>new Path2D()), n=Math.round(W*H/24), lw=Math.max(1,H*.014);
  for(let k=0;k<n;k++){ const px=ins+Math.random()*iw, py=ins+Math.random()*ih, edge=Math.min(px-ins,ins+iw-px,py-ins,ins+ih-py)/(ih*.5);
    const a=(py<ins+ih/2?-Math.PI/2:Math.PI/2)*(1-Math.min(1,edge))+(Math.random()-.5)*2.6, len=H*(.03+.05*Math.random());
    const light=(1-(py-ins)/ih)*1.4-.7+(Math.random()-.5)*.9, bk=Math.max(0,Math.min(B-1,Math.round((light+1)/2*(B-1))));
    paths[bk].moveTo(px,py); paths[bk].lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len); }
  x.lineCap='round'; x.lineWidth=lw;
  paths.forEach((pth,i)=>{ const t=i/(B-1); x.strokeStyle=t<.5?mix(c,'#000000',1-.3*(1-t*2)):mix(c,'#ffffff',1-.45*(t-.5)*2); x.globalAlpha=.6; x.stroke(pth); });
  x.restore(); x.globalAlpha=1; return cv;
}
/* cartão de doce: barra brilhante com listras na diagonal e granulado */
function candyRect(W,H,c){
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,mix(c,'#ffffff',.5)); g.addColorStop(.5,c); g.addColorStop(1,mix(c,'#000000',.78)); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.2)'; const sw=H*.24, st=H*.62;
  for(let k=-H;k<W+H;k+=st){ x.beginPath(); x.moveTo(k,H); x.lineTo(k+H*.7,0); x.lineTo(k+H*.7+sw,0); x.lineTo(k+sw,H); x.closePath(); x.fill(); }
  for(let k=0;k<Math.round(W*H/2600);k++){ const px=Math.random()*W, py=Math.random()*H; x.save(); x.translate(px,py); x.rotate(Math.random()*3.14); x.fillStyle=PALETTE[k%PALETTE.length]; x.globalAlpha=.55; x.beginPath(); x.ellipse(0,0,H*.035,H*.012,0,0,7); x.fill(); x.restore(); }
  const hl=x.createLinearGradient(0,0,0,H*.4); hl.addColorStop(0,'rgba(255,255,255,.45)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,W,H*.4);
  return cv;
}
/* cartão de folhas: verde com folhinhas e frutinhas espalhadas */
function leafRect(W,H,c){
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.75)); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let k=0;k<Math.round(W*H/2200);k++){ const px=Math.random()*W, py=Math.random()*H, a=Math.random()*6.28, L=H*(.08+Math.random()*.06);
    x.save(); x.translate(px,py); x.rotate(a); x.globalAlpha=.22; x.fillStyle=k%7===0?'#e5483f':k%2?'#ffffff':mix(c,'#000000',.6);
    if(k%7===0){ x.beginPath(); x.arc(0,0,H*.035,0,7); x.fill(); } else { x.beginPath(); x.moveTo(-L,0); x.quadraticCurveTo(0,-L*.5,L,0); x.quadraticCurveTo(0,L*.5,-L,0); x.fill(); }
    x.restore(); }
  const hl=x.createLinearGradient(0,0,0,H*.4); hl.addColorStop(0,'rgba(255,255,255,.4)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,W,H*.4);
  return cv;
}
/* cartão de obra: concreto com faixa zebrada; de bambu: gomos na vertical; de sakura: flores caindo */
function hazardRect(W,H,c){ const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.75)); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let k=0;k<Math.round(W*H/90);k++){ x.fillStyle=Math.random()<.5?'rgba(255,255,255,.12)':'rgba(0,0,0,.1)'; x.fillRect(Math.random()*W,Math.random()*H,2,2); }
  const bh=H*.13; x.save(); x.beginPath(); x.rect(0,H-bh,W,bh); x.clip(); x.fillStyle='rgba(255,196,40,.9)'; x.fillRect(0,H-bh,W,bh); x.fillStyle='rgba(30,30,30,.8)';
  for(let k=-H;k<W+H;k+=bh*2){ x.beginPath(); x.moveTo(k,H); x.lineTo(k+bh,H-bh); x.lineTo(k+bh*2,H-bh); x.lineTo(k+bh,H); x.fill(); } x.restore();
  const hl=x.createLinearGradient(0,0,0,H*.4); hl.addColorStop(0,'rgba(255,255,255,.4)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,W,H*.4); return cv; }
function bambooRect(W,H,c){ const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.75)); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let k=0;k<W;k+=H*.42+Math.random()*H*.3){ const sw=H*(.12+Math.random()*.06); x.fillStyle='rgba(255,255,255,.16)'; x.fillRect(k,0,sw,H); x.fillStyle='rgba(0,0,0,.14)';
    const ny=H*(.2+Math.random()*.5); x.fillRect(k-1,ny,sw+2,H*.05); x.fillRect(k+sw-3,0,3,H); }
  x.globalAlpha=.25; x.fillStyle='#ffffff'; for(let k=0;k<Math.round(W/60);k++){ x.save(); x.translate(Math.random()*W,Math.random()*H); x.rotate(Math.random()*6.28); x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(H*.1,-H*.06,H*.22,0); x.quadraticCurveTo(H*.1,H*.06,0,0); x.fill(); x.restore(); } x.globalAlpha=1;
  const hl=x.createLinearGradient(0,0,0,H*.4); hl.addColorStop(0,'rgba(255,255,255,.4)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,W,H*.4); return cv; }
function sakuraRect(W,H,c){ const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,mix(c,'#ffffff',.55)); g.addColorStop(.55,c); g.addColorStop(1,mix(c,'#000000',.75)); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(255,255,255,.18)'; x.lineWidth=H*.025; for(let k=-H;k<W+H;k+=H*.5){ x.beginPath(); x.arc(k,H*1.05,H*.42,Math.PI,0); x.stroke(); x.beginPath(); x.arc(k,H*1.05,H*.26,Math.PI,0); x.stroke(); }
  for(let k=0;k<Math.round(W*H/3200);k++){ const px=Math.random()*W, py=Math.random()*H, r=H*(.04+Math.random()*.03); x.save(); x.translate(px,py); x.rotate(Math.random()*6.28); x.globalAlpha=.55; x.fillStyle=k%3?'#ffd1e0':'#ffffff';
    for(let j=0;j<5;j++){ x.rotate(Math.PI*2/5); x.beginPath(); x.ellipse(r*.9,0,r*.75,r*.45,0,0,7); x.fill(); } x.restore(); }
  const hl=x.createLinearGradient(0,0,0,H*.4); hl.addColorStop(0,'rgba(255,255,255,.4)'); hl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=hl; x.fillRect(0,0,W,H*.4); return cv; }
const CCARD={};
function campCard(w,n,open){ const W=CWD(w), boss=n===W.phases.length, k=w+'|'+(open?(boss?'b':n):'x');
  if(CCARD[k]==null){ try{ const c=open?(boss?W.bossC:hexOf(mix(PALETTE[(n-1)%PALETTE.length],'#ffffff',.85))):'#a7adbd', cw=boss?720:640, chh=boss?150:140;
    CCARD[k]=({candy:candyRect,leaf:leafRect,hazard:hazardRect,bamboo:bambooRect,sakura:sakuraRect}[W.card]||plushRect)(cw,chh,c).toDataURL('image/jpeg',.82); }catch(e){ CCARD[k]=''; } } return CCARD[k]; }
function campNodes(st,w){
  const W=CWD(w);
  return W.phases.map((d,i)=>{ const n=i+1, open=campOpen(st,w,n), s=st.stars[ck(w,n)]||0, pl=campCard(w,n,open);
    return `<button type="button" class="cnode plush${n===W.phases.length?' boss':''}" data-w="${w}" data-ph="${n}" ${open?'':'disabled'}${pl?` style="background-image:url('${pl}')"`:''}><span class="cic">${open?d.icon:'🔒'}</span><span class="cnm"><small>Fase ${n}</small>${esc(d.name)}</span><span class="cst">${[1,2,3].map(k=>`<i class="${k<=s?'on':''}">★</i>`).join('')}</span></button>`; }).join('');
}
/* abas dos mundos (no mapa e na sala) */
function campWTabs(st,cur){
  return CWORLDS.map(x=>{ const op=campWOpen(st,x.w); return `<button type="button" class="wtab${x.w===cur?' sel':''}${op?'':' locked'}" data-w="${x.w}"><span>${op?x.icon:'🔒'}</span><small>Mundo ${x.w}</small></button>`; }).join('')
    +(CWORLDS.length<6?`<button type="button" class="wtab locked soon"><span>🧱</span><small>em breve</small></button>`:'');
}
function campWLockMsg(w){ const P=CWD(w-1), B=BOSSES[P.boss]; return `🔒 Vença ${bossArt(B)} no Mundo ${w-1} para abrir`; }
/* quem já tinha 3 estrelas em tudo antes da versão dourada existir também ganha */
function campGoldCheck(st){ CWORLDS.forEach(W=>{ if(campAllGold(st,W.w)){ unlockSkin(W.reward); if(unlockGold(W.reward)) toast(`✨ ${SKIN_L[W.reward]} dourado liberado! Toque de novo no tema nas Configurações.`); } }); }
let CAMP_W=store.get('ddb_campw',1);
function openCamp(w){
  const st=campLoad('solo'); campGoldCheck(st);
  if(typeof w==='number') CAMP_W=w; if(!CWORLDS[CAMP_W-1]||!campWOpen(st,CAMP_W)) CAMP_W=1; store.set('ddb_campw',CAMP_W);
  const W=CWD(CAMP_W), B=BOSSES[W.boss], hs=campHelps(st);
  $('#camp').dataset.w=W.w; setWorldLook(W.w);
  $('#campWorlds').innerHTML=campWTabs(st,W.w);
  $('#campWLabel').textContent=`Mundo ${W.w}`; $('#campWName').textContent=`${W.icon} ${W.name}`;
  $('#campStars').textContent=`${campWTotal(st,W.w)} ⭐ de ${W.phases.length*3}`;
  $('#campPrize').innerHTML=`🏆 Vença ${esc(bossArt(B))}: tema ${SKIN_L[W.reward]}${WON.has(W.reward)?' ✓':''} · ✨ 3⭐ em todas: ${SKIN_L[W.reward]} dourado${GOLDS.has(W.reward)?' ✓':''}`;
  $('#campHelps').innerHTML=`Ajudas (${campTotal(st)}⭐ no total): `+CHELPS.map(h=>`<span class="${hs.includes(h.k)?'':'off'}">${h.i} ${h.n} ${hs.includes(h.k)?'✓':`(${h.need}⭐)`}</span>`).join(' · ');
  $('#campMap').innerHTML=campNodes(st,W.w);
  if(devAll()) $('#campPrize').insertAdjacentHTML('beforeend','<br>🔓 Modo teste: tudo liberado');
  $$('#campMap .cnode').forEach(b=>b.addEventListener('click',()=>campIntro(+b.dataset.w,+b.dataset.ph)));
  $$('#campWorlds .wtab').forEach(b=>b.addEventListener('click',()=>{ if(b.classList.contains('soon')){ toast('🐼 Novos mundos chegando!'); return; }
    if(b.classList.contains('locked')){ toast(campWLockMsg(+b.dataset.w)); return; } openCamp(+b.dataset.w); }));
  show('camp');
}
function campIntro(w,ph){
  const W=CWD(w), def=W.phases[ph-1];
  if(def.goal==='boss') bossPrep(W.boss);
  const sc=campScale(def,1), st=campLoad('solo'), tx=campStarTxt(def,sc), s=st.stars[ck(w,ph)]||0;
  openEnd(`<h2>${def.icon} Fase ${ph} · ${esc(def.name)}</h2><p class="reason" style="margin:8px 0 12px">${esc(campDesc(def,sc,w))}</p>
    <div class="kv"><span>★</span><b>completar</b></div><div class="kv"><span>★★</span><b>${tx[0]}</b></div><div class="kv"><span>★★★</span><b>${tx[1]}</b></div>
    <p class="muted" style="margin-top:8px">${s?`Seu melhor: ${'★'.repeat(s)}`:'Ainda não concluída'} · usar ajuda limita a ★★</p><div id="rkPhase"></div>`,
    [{t:'Começar',cls:'primary',on:()=>{ closeEnd(); startCampSolo(w,ph); }},{t:'Voltar',cls:'ghost',on:closeEnd}]);
  rkPhaseBox(w,ph);
}
$('#goCamp').addEventListener('click',()=>openCamp());
