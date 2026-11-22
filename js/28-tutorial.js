'use strict';
/* TUTORIAL interativo (tela #tut, botão #goTut do menu): aulas com tabuleiro de treino (o motor de verdade, arrastar ou tocar), perguntas e cartões sobre o menu e os estilos de jogo; ddb_tut guarda as aulas concluídas */

/* tabuleiro em texto (só as linhas de baixo; as que faltam em cima ficam vazias): '.' vazio, '0'…'6' cor, 'x' cinza, 'z' blindado, 'o' dourado, 'k' bomba, 'i' gelo, 'w' coringa */
function tutCel(ch,t){ if(!ch||ch==='.') return null; if(ch>='0'&&ch<='6') return {c:+ch,s:null,t};
  const v=({x:{c:-1,s:null},z:{c:-1,s:'ice'},o:{c:-2,s:null},k:{c:3,s:'bomb'},i:{c:4,s:'ice'},w:{c:5,s:'wild'}})[ch]; return v?{...v,t}:null; }
function tutTab(lin){ const t=performance.now(), l=Array(Math.max(0,8-lin.length)).fill('........').concat(lin); return l.map(r=>Array.from({length:8},(_,x)=>tutCel(r[x],t))); }
/* tabuleiro cheio de cores com buracos nas casas [y,x] da lista */
function tutCheio(buracos){ const furo=new Set(buracos.map(([y,x])=>y*8+x)); return Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>furo.has(y*8+x)?'.':String((x+y*3)%7)).join('')); }
/* peça a partir de um desenho: linhas separadas por '|', '#' = casa cheia */
function tutP(f,color,x={}){ const cells=[]; f.split('|').forEach((l,r)=>[...l].forEach((ch,c)=>{ if(ch==='#') cells.push([r,c]); }));
  return {cells,color,spec:x.spec||null,pw:x.pw||null,h:Math.max(...cells.map(c=>c[0]))+1,w:Math.max(...cells.map(c=>c[1]))+1}; }
const tutConta=(b,f)=>b.reduce((s,row)=>s+row.filter(v=>v&&f(v)).length,0);

const TUT_PW={pedra:'manda 2 blocos blindados para o líder',gelo:'congela as peças do líder por 4 segundos',nevoa:'cobre metade do tabuleiro do líder por 5 segundos',bomba:'põe uma bomba no tabuleiro do líder: se ele não limpar a linha dela em 3 jogadas, ela enche a área 3×3 de blocos cinza',escudo:'bloqueia o próximo ataque contra você (guarda até 2)',martelo:'você toca em 3 blocos do seu tabuleiro para quebrar'};
const TUT_PLAY=['o normal: linhas e colunas somem e o combo multiplica os pontos','depois de limpar, os blocos de cima caem e podem fechar outra linha sozinhos (reação em cadeia)','os blocos somem da vista 2,5 segundos depois de colocados: jogue de memória','sem multiplicador de combo; em troca, cada linha vale o dobro, e linha e coluna juntas valem o dobro de novo'];
const TUT_MENU=[['📅','Desafio do dia','As mesmas peças para todo mundo, valendo até a meia-noite. O tempo para pôr cada peça vai apertando. Tem ranking do dia e vitórias do mês.'],
  ['🎯','Jogar sozinho','Escolha o tempo, o modo de jogo e os modificadores, e bata seus recordes. Dá para jogar contra o robô, do Fácil ao Expert.'],
  ['👨‍👩‍👧','Jogar com alguém','Sala conectada (até 6 celulares, juntos pelo QR ou de longe pelo link, com chat e TV), partida por código (as mesmas peças, cada um no seu celular) e desafios a distância (melhor de 5, cada um joga quando puder).'],
  ['🗺️','Campanha','Mundos com fases de metas diferentes, de 1 a 3 estrelas em cada fase e um chefão no fim de cada mundo. Vencendo, você ganha temas novos para as peças.']];
const tutLista=itens=>`<div class="tutinfo">${itens.map(([ic,t,d])=>`<div class="tutit"><span class="tutic">${ic}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}</div>`;

/* aulas: cada passo tem texto (t) e um destes: tabuleiro (tab + pecas + meta), martelo, pergunta (quiz) ou cartões (html) */
const TUT_AULAS=[
 {id:'basico',ic:'🧩',t:'O básico',sub:'encaixar peças e limpar linhas',passos:[
  {t:'Arraste a peça lá de baixo até o tabuleiro e solte no espaço vazio da última linha. Linha cheia some e vale pontos.',tab:['.3......','012345..'],pecas:[tutP('##',5)],dica:[7,6],meta:(T,r)=>r&&r.n>=1,ok:'Isso! A linha cheia sumiu e você ganhou pontos.'},
  {t:'Coluna (em pé) também vale! Complete a coluna do meio.',tab:['...2....','...4....','...1....','...6....','...0....','...3....','........','6.......'],pecas:[tutP('#|#',2)],dica:[6,3],meta:(T,r)=>r&&r.n>=1,ok:'Coluna limpa! Linhas e colunas funcionam do mesmo jeito.'},
  {t:'Limpar mais de uma de uma vez vale muito mais. Coloque o bloquinho no cruzamento para fechar a linha e a coluna juntas.',tab:['6...1...','....3...','....5...','....0...','0123.560','....2...','....6...','....4...'],pecas:[tutP('#',1)],dica:[4,4],meta:(T,r)=>r&&r.n>=2,ok:'Duas de uma vez! 1 linha vale 10, 2 juntas valem 30, 3 juntas valem 60 (e tudo isso vezes o combo).'},
  {t:'O jogo acaba quando nenhuma peça da bandeja cabe no tabuleiro. A bandeja só enche de novo depois que você usa as 3. Peça apagada é peça que não cabe: encaixe a única que cabe.',tab:tutCheio([[0,7],[1,1],[1,6],[2,5],[3,0],[4,3],[5,2],[6,2],[6,3],[7,4]]),pecas:[tutP('###|###|###',6),tutP('#|##',3),tutP('#####',0)],dica:[5,2],dicaPeca:1,meta:(T,r)=>r&&r.n>=1,ok:'Boa! Se nenhuma coubesse, a partida acabaria. Guarde espaço para as peças grandes.'},
  {t:'Pergunta rápida:',quiz:{q:'Quantos pontos vale limpar 2 linhas de uma vez (sem combo ainda)?',ops:['10','20','30'],ok:2,exp:'1 linha = 10, 2 juntas = 30, 3 juntas = 60, 4 juntas = 100. Por isso vale a pena juntar!'}}]},
 {id:'combo',ic:'🔥',t:'Combo',sub:'limpe em seguida e multiplique os pontos',passos:[
  {t:'Cada jogada que limpa alguma coisa logo depois da outra sobe o combo (x2, x3…), e ele multiplica os pontos. Limpe as 3 linhas, uma em cada jogada, e chegue no x3.',tab:['3.......','123456..','12...456','.1234560'],pecas:[tutP('##',0),tutP('###',3),tutP('#',5)],dica:[5,6],meta:T=>T.eng.combo>=3,ok:'Combo x3! A 3ª linha valeu 3 vezes mais que a 1ª.'},
  {t:'O combo aguenta 2 jogadas sem limpar; na 3ª seguida sem limpar, ele zera. Seu combo está em x2: coloque as duas peças grandes onde não limpam nada e só depois feche a linha com o bloquinho.',ini:T=>{ T.eng.combo=2; },tab:['0123456.'],pecas:[tutP('##|##',1),tutP('###|#',4),tutP('#',6)],meta:(T,r)=>r&&r.n>=1&&T.jog===3&&r.combo>=3,ok:'Viu? O combo segurou e virou x3. Mas 3 jogadas seguidas sem limpar e ele volta para zero.'},
  {t:'Deixar o tabuleiro totalmente vazio dá +300 pontos de bônus. Limpe a última linha e veja!',tab:['6543210.'],pecas:[tutP('#',2)],dica:[7,7],meta:(T,r)=>r&&r.perfect,ok:'Tabuleiro limpo: +300!'},
  {t:'Pergunta rápida:',quiz:{q:'Você limpou uma linha e depois colocou 3 peças seguidas sem limpar nada. O que aconteceu com o combo?',ops:['Continua igual','Voltou para zero','Dobrou'],ok:1,exp:'O combo aguenta 2 jogadas sem limpar; na 3ª ele zera.'}}]},
 {id:'especiais',ic:'💣',t:'Blocos especiais',sub:'bomba, gelo, coringa e bônus de cor',passos:[
  {t:'Bomba (modificador): o bloco com a bolinha preta explode tudo em volta (3×3) quando a linha dele some. Feche a linha da bomba.',tab:['...1....','..253...','012k456.'],pecas:[tutP('#',0)],dica:[7,7],meta:(T,r)=>r&&r.bombs>=1,ok:'BUM! A bomba levou junto os blocos em volta.'},
  {t:'Gelo (modificador): o bloco com floco de neve precisa sumir 2 vezes; na 1ª ele só racha. Limpe a última linha duas vezes.',tab:['.....2..','i123456.'],pecas:[tutP('#',2),tutP('####',5),tutP('###',1)],dica:[7,7],meta:T=>!tutConta(T.eng.b,v=>v.s==='ice'||v.cr),ok:'O gelo rachou e depois sumiu de vez.'},
  {t:'Bônus de cor (modificador): uma linha toda de uma cor só vale +100. O coringa (bloco arco-íris) conta como qualquer cor. Feche a linha azul com a peça da cor certa.',o:{color:true},tab:['..2.....','55w5555.'],pecas:[tutP('#',0),tutP('#',5)],dica:[7,7],dicaPeca:1,meta:(T,r)=>r&&r.colorLines>=1,ok:'+100 de bônus de cor! O coringa ajudou a fechar.'}]},
 {id:'ataques',ic:'⚔️',t:'Ataques',sub:'no duelo ao vivo, mande blocos para quem está na frente',passos:[
  {t:'No duelo ao vivo com Ataques ligado, limpar 3 ou mais linhas de uma vez manda blocos blindados para o líder (quem tem mais pontos, fora você). Limpe 3 linhas com uma peça só.',tab:['..3.....','0123456.','1234560.','2345601.'],pecas:[tutP('#|#|#',4)],dica:[5,7],meta:(T,r)=>r&&r.n>=3,ok:'Ataque! 3 linhas mandam 2 blindados para o líder (4 linhas mandam 3, e assim por diante).',depois:()=>`<div class="tutmini"><div class="muted">Tabuleiro do líder</div>${tutBoardHTML(tutTab(['..12....','.3z45...','01234z6.']),0,{mini:1})}</div>`},
  {t:'Agora o ataque chegou em você: caíram blocos blindados (cinza com gelo) no seu tabuleiro. Eles precisam ser limpos 2 vezes. Limpe a linha duas vezes.',tab:['..4.....','z123z56.'],pecas:[tutP('#',2),tutP('###',5),tutP('###',1)],dica:[7,7],meta:T=>!tutConta(T.eng.b,v=>v.c===-1),ok:'Pronto, o ataque foi desfeito!'},
  {t:'Pergunta rápida:',quiz:{q:'Você limpou 4 linhas de uma vez num duelo com Ataques. Quantos blocos blindados o líder recebe?',ops:['2','3','4'],ok:1,exp:'Sempre um a menos que as linhas: 3 linhas = 2, 4 linhas = 3. E o 🛡️ Escudo (bloco de poder) bloqueia um ataque que chega em você.'}}]},
 {id:'poderes',ic:'✨',t:'Blocos de poder',sub:'ícones nas peças, martelo e bloco dourado',passos:[
  {t:'Com Blocos de poder ligado (duelo ao vivo), algumas peças vêm com um ícone. Limpe a linha onde o ícone ficou para ativar o poder.',tab:['....6...','012345..'],pecas:[tutP('##',3,{pw:{i:0,k:'escudo'}})],dica:[7,6],meta:(T,r)=>r&&r.powers.length>0,ok:'🛡️ Escudo ativado! Ele bloqueia o próximo ataque contra você.'},
  {t:'Cada ícone faz uma coisa:',html:()=>tutLista(PWK.map(k=>[PWI[k],PWN[k],TUT_PW[k]]))},
  {t:'Você ganhou o 🔨 Martelo! Toque em 3 blocos do tabuleiro para quebrar e abrir espaço. Ele salva a partida quando nenhuma peça cabe.',martelo:3,tab:['..12....','.3456...','0123.56.'],pecas:[],meta:T=>T.hammer<=0,ok:'Três blocos a menos! Com o martelo sobrando, você não perde por falta de espaço.'},
  {t:'Bloco dourado (modificador do duelo ao vivo): aparece uma estrela dourada no tabuleiro de todos. Quem limpar a linha dela primeiro ganha +150.',tab:['.5......','01o3456.'],pecas:[tutP('#',4)],dica:[7,7],meta:(T,r)=>r&&r.gold>=1,ok:'O dourado é seu: +150!'}]},
 {id:'modos',ic:'🎮',t:'Modos de jogo',sub:'Clássico, Gravidade, Cego e Sem combo',passos:[
  {t:'O "Modo de jogo" muda as regras do tabuleiro. Clássico é o normal, que você já aprendeu. Os outros:',html:()=>tutLista(PLAYS.map((n,i)=>[['🧱','⬇️','🙈','➗'][i],n,TUT_PLAY[i]]))},
  {t:'Gravidade: feche a linha de baixo e veja os blocos caírem e fecharem outra linha sozinhos.',o:{play:1},tab:['...2....','012.4560','.1234560'],pecas:[tutP('#',3)],dica:[7,0],meta:(T,r)=>r&&r.chain>=2,ok:'Reação em cadeia! Na Gravidade, cada queda que fecha outra linha soma mais pontos.'},
  {t:'Cego: os blocos somem da vista 2,5 segundos depois de colocados, mas continuam lá. Olhe bem a última linha e coloque a peça no buraco de memória.',o:{play:2},tab:['..3.....','01234.56'],pecas:[tutP('#',1)],meta:(T,r)=>r&&r.n>=1,ok:'Memória boa! No modo Cego, acertar o lugar é com você.'},
  {t:'Pergunta rápida:',quiz:{q:'Em qual modo os blocos de cima caem depois que uma linha some?',ops:['Clássico','Gravidade','Sem combo'],ok:1,exp:'Na Gravidade os blocos caem, e a queda pode fechar outras linhas.'}}]},
 {id:'onde',ic:'🗺️',t:'Onde jogar',sub:'o menu, os estilos da sala e os modificadores',passos:[
  {t:'O que tem no menu:',html:()=>tutLista(TUT_MENU)},
  {t:'Na sala conectada, quem criou escolhe o estilo de jogo:',html:()=>`<div class="tutinfo">${['live','coop','halves','versus','tlive','tsplit','camp'].map(k=>`<div class="tutit tutmp">${modePic(k,k==='halves'||k==='camp'?4:3,{az:2,la:2})}<div><b>${esc(TYPES[k])}</b><p>${esc(TYPE_HINT[k])}</p></div></div>`).join('')}</div>`},
  {t:'Pergunta rápida:',quiz:{q:'Você quer jogar com alguém que mora longe, cada um no seu tempo, sem precisar estarem conectados juntos. O que escolher?',ops:['Desafio a distância','Co-op','Versus em turnos'],ok:0,exp:'No desafio a distância cada um joga a rodada quando puder, com as mesmas peças. Melhor de 5!'}},
  {t:'Pergunta rápida:',quiz:{q:'Todo mundo no mesmo tabuleiro, um de cada vez, somando pontos. Qual estilo é esse?',ops:()=>[TYPES.live,TYPES.coop,TYPES.tsplit],ok:1,exp:()=>TYPE_HINT.coop}},
  {t:'Modificadores mudam a partida: ligue em "Modificadores" no Jogar sozinho ou nas regras da sala. O tempo pode ser de 2, 3 ou 5 minutos, sem limite, ou "Sem limite com progressão", em que o tempo para pôr cada peça vai apertando.',html:()=>tutLista(FLAGS.map(k=>['•',LABEL[k],HINT[k]]))+`<p class="muted tutsub">Só no duelo ao vivo:</p>`+tutLista(NETF.map(k=>['⚔️',LABEL[k],HINT[k]]))}]}
];

let TUT=null;
const tutFeitas=()=>store.get('ddb_tut',{});
function tutPonto(){ const d=$('#goTutDot'); if(d) d.hidden=!!store.get('ddb_tutVisto',0); }
function tutAbrir(){ store.set('ddb_tutVisto',1); tutPonto(); TUT=null; show('tut'); tutRenderLista(); }
function tutRenderLista(){
  const f=tutFeitas(), n=TUT_AULAS.filter(a=>f[a.id]).length;
  $('#tutHead').innerHTML=`<h1>🎓 Como jogar</h1><p class="muted">Aulas curtinhas, com tabuleiro de treino: você joga enquanto aprende. ${n?`${n} de ${TUT_AULAS.length} feitas.`:''}</p>`;
  $('#tutBody').innerHTML=`<div class="tutaulas">${TUT_AULAS.map((a,i)=>`<button type="button" class="btn tutaula${f[a.id]?' feita':''}" data-i="${i}"><span class="ico">${a.ic}</span><span class="dtx"><b>${i+1}. ${esc(a.t)}</b><small>${esc(a.sub)}</small></span><span class="go">${f[a.id]?'✓':'›'}</span></button>`).join('')}</div>`;
  $$('#tutBody .tutaula').forEach(b=>b.addEventListener('click',()=>tutAula(+b.dataset.i,0)));
}
function tutAula(ai,pi){
  const a=TUT_AULAS[ai], p=a.passos[pi]; setN(8); clearInterval(TUT&&TUT.blindT);
  TUT={ai,pi,a,p,eng:null,tray:[],sel:null,done:false,score:0,jog:0,hammer:p.martelo||0,dica:false,rev:{},anim:false,blindT:0,quizOk:false};
  if(p.tab){ TUT.eng=new Engine(Object.assign({play:0},p.o)); TUT.eng.b=tutTab(p.tab); TUT.tray=p.pecas.map(x=>({...x})); if(p.ini) p.ini(TUT); }
  const val=v=>typeof v==='function'?v():v;
  $('#tutHead').innerHTML=`<div class="tuttop"><span class="muted">Aula ${ai+1} de ${TUT_AULAS.length} · ${esc(a.ic)} ${esc(a.t)}</span><div class="tutdots">${a.passos.map((_,i)=>`<i class="${i<pi?'ok':i===pi?'on':''}"></i>`).join('')}</div></div>`;
  let h=`<div class="card tuttxt"><p>${esc(p.t)}</p></div>`;
  if(p.html) h+=val(p.html);
  if(p.quiz){ const q=p.quiz; h+=`<div class="card tutquiz"><b>${esc(q.q)}</b><div class="tutops">${val(q.ops).map((o,i)=>`<button type="button" class="btn" data-o="${i}">${esc(o)}</button>`).join('')}</div></div>`; }
  if(p.tab) h+=`<div class="tuthud"><div><b id="tutPts">0</b><small>pontos</small></div><div id="tutCombo" class="tutcombo"></div></div><div class="tutwrap"><div class="tutboard tutb" id="tutBoard"></div><div id="tutPop"></div></div>`
    +(p.martelo?'':`<div class="tuttray tutb" id="tutTray">${[0,1,2].map(i=>`<div class="tslot" data-s="${i}"></div>`).join('')}</div><p class="muted tutsub">Arraste a peça, ou toque nela e depois no tabuleiro.</p>`);
  h+=`<div class="tutmsg" id="tutMsg"></div><div class="row tutbtns">${p.tab?`${p.dica?'<button type="button" class="btn small" id="tutDica">💡 Dica</button>':''}<button type="button" class="btn small" id="tutRe">↻ Recomeçar</button>`:''}<button type="button" class="btn primary" id="tutNext"></button></div>`;
  $('#tutBody').innerHTML=h;
  if(p.quiz) $$('#tutBody .tutops .btn').forEach(b=>b.addEventListener('click',()=>tutResponder(b,+b.dataset.o)));
  if(p.tab){ tutLayout(); tutRender(); if(p.dica) $('#tutDica').addEventListener('click',()=>{ TUT.dica=!TUT.dica; tutRender(); }); $('#tutRe').addEventListener('click',()=>tutAula(ai,pi));
    $('#tutBoard').addEventListener('click',tutBoardTap);
    $$('#tutTray .tslot').forEach(s=>s.addEventListener('pointerdown',tutDown));
    if(TUT.eng.o.play===2){ const t=TUT; t.blindT=setInterval(()=>{ if(TUT!==t||!$('#tut').classList.contains('active')){ clearInterval(t.blindT); return; } if(!t.anim) tutRender(); },250); } }
  $('#tutNext').addEventListener('click',tutProximo);
  if(!p.tab&&!p.quiz) TUT.done=true;
  tutBotao(); window.scrollTo(0,0);
}
function tutBotao(){ const b=$('#tutNext'); if(!b||!TUT) return; const ult=TUT.pi===TUT.a.passos.length-1;
  b.textContent=TUT.done?(ult?'Concluir aula ✓':'Próximo →'):'Pular'; b.classList.toggle('primary',TUT.done); b.classList.toggle('ghost',!TUT.done); }
function tutProximo(){ if(!TUT) return; const {ai,pi,a}=TUT;
  if(pi<a.passos.length-1){ tutAula(ai,pi+1); return; }
  const f=tutFeitas(), nova=!f[a.id]; f[a.id]=1; store.set('ddb_tut',f); clearInterval(TUT.blindT);
  const todas=TUT_AULAS.every(x=>f[x.id]); SFX.win();
  $('#tutHead').innerHTML=''; TUT=null;
  $('#tutBody').innerHTML=`<div class="card tcenter tutfim"><div class="tutbig">${todas?'🎓':'🎉'}</div><h2>${todas&&nova?'Tutorial completo!':'Aula concluída!'}</h2><p class="muted">${esc(a.ic)} ${esc(a.t)}</p></div><div class="endbtns">${ai<TUT_AULAS.length-1?`<button type="button" class="btn primary" id="tutSeg">Próxima aula: ${esc(TUT_AULAS[ai+1].ic)} ${esc(TUT_AULAS[ai+1].t)}</button>`:''}<button type="button" class="btn${ai<TUT_AULAS.length-1?'':' primary'}" id="tutLis">Ver todas as aulas</button><button type="button" class="btn ghost" id="tutJogar">🎯 Jogar sozinho</button></div>`;
  if($('#tutSeg')) $('#tutSeg').addEventListener('click',()=>tutAula(ai+1,0));
  $('#tutLis').addEventListener('click',tutRenderLista); $('#tutJogar').addEventListener('click',()=>$('#goSolo').click());
  window.scrollTo(0,0);
}
function tutResponder(b,i){ if(!TUT||TUT.done) return; const q=TUT.p.quiz, exp=typeof q.exp==='function'?q.exp():q.exp, m=$('#tutMsg');
  if(i===q.ok){ b.classList.add('certo'); $$('#tutBody .tutops .btn').forEach(x=>x.disabled=true); TUT.done=true; m.className='tutmsg bom'; m.textContent='✅ Isso mesmo! '+exp; setTimeout(()=>m.scrollIntoView({behavior:'smooth',block:'nearest'}),150); SFX.win(); buzz(20); tutBotao(); }
  else { b.classList.add('errado'); b.disabled=true; m.className='tutmsg mau'; m.textContent='Quase! Tente outra.'; SFX.alert(); buzz([30,40,30]); }
}

/* ---------- tabuleiro de treino ---------- */
function tutLayout(){ const w=Math.min(360,$('#tutBody').clientWidth||320); const cs=Math.floor(Math.min(w-8,(window.innerHeight||640)*.34)/8); $('#tut').style.setProperty('--tcs',Math.max(26,cs)+'px'); TUT.cs=Math.max(26,cs); }
function tutCelHTML(v,i,x={}){
  if(!v) return `<div class="tq vazio${x.dica?' dica':''}"></div>`;
  const col=v.c===-1||v.c===-4?'s':v.c===-2?'g':v.s==='wild'?'x':String(v.c), cor=v.c===-1||v.c===-4?STONE:v.c===-2?goldCol():v.s==='wild'?WILDC:PALETTE[v.c];
  const cls=(v.s==='bomb'?' sp-bomb':v.s==='ice'?' sp-ice':v.s==='wild'?' sp-wild':'')+(v.cr?' cr':'')+(v.c===-2?' gold':'')+(x.hl?' hl':'')+(x.sai?' sai':'')+(x.bad?' bad':'');
  return `<div class="tq${cls}" data-col="${col}" style="--c:${cor}"><div class="blk bev"></div>${v.pw?`<span class="pwi">${PWI[v.pw]}</span>`:''}</div>`;
}
function tutBoardHTML(b,pv,o={}){
  const blind=TUT&&TUT.eng&&TUT.eng.o.play===2&&!o.mini, now=performance.now(), gh={}, hl=new Set(), dica=new Set();
  if(pv){ pv.p.cells.forEach(([dr,dc])=>gh[(pv.r+dr)*8+pv.c+dc]=1);
    if(pv.ok&&!blind){ const t=b.map(r=>r.map(v=>!!v)); pv.p.cells.forEach(([dr,dc])=>t[pv.r+dr][pv.c+dc]=true);
      for(let y=0;y<8;y++) if(t[y].every(Boolean)) for(let x=0;x<8;x++) hl.add(y*8+x);
      for(let x=0;x<8;x++) if(t.every(r=>r[x])) for(let y=0;y<8;y++) hl.add(y*8+x); } }
  if(o.dica){ const [r,c]=TUT.p.dica, p=TUT.tray[TUT.p.dicaPeca||0]; if(p) p.cells.forEach(([dr,dc])=>dica.add((r+dr)*8+c+dc)); }
  let h=''; for(let i=0;i<64;i++){ const y=(i/8)|0, x=i%8; let v=b[y][x];
    if(v&&blind&&v.c>=0&&now-v.t>2500&&!(TUT.rev[i]>now)) v=null;
    if(gh[i]&&!v) h+=`<div class="tq gh${hl.has(i)?' hl':''}" data-col="${pv.p.color}" style="--c:${PALETTE[pv.p.color]}"><div class="blk bev"></div></div>`;
    else h+=tutCelHTML(v,i,{hl:hl.has(i),sai:o.sai&&o.sai.has(i),dica:dica.has(i)&&!v,bad:TUT&&TUT.rev[i]>now&&blind}); }
  return `<div class="tutgrid${o.mini?' mini':''}">${h}</div>`;
}
function tutRender(pv,sai,b){ if(!TUT||!TUT.eng) return;
  $('#tutBoard').innerHTML=tutBoardHTML(b||TUT.eng.b,pv,{sai,dica:TUT.dica&&!TUT.done&&TUT.jog===0});
  $('#tutBoard').classList.toggle('martelo',TUT.hammer>0);
  $('#tutPts').textContent=fmtN(TUT.score);
  const e=TUT.eng, c=$('#tutCombo');
  c.innerHTML=TUT.hammer>0?`🔨 toque em ${TUT.hammer} bloco${TUT.hammer>1?'s':''}`:e.combo>0&&e.o.play!==3?`🔥 Combo x${e.combo}<small>aguenta mais ${Math.max(0,2-e.since)} jogada${2-e.since===1?'':'s'} sem limpar</small>`:'';
  const tr=$('#tutTray'); if(!tr) return;
  $$('#tutTray .tslot').forEach((s,i)=>{ const p=TUT.tray[i]; s.innerHTML=''; s.classList.toggle('sel',TUT.sel===i);
    if(!p) return; const el=pieceEl(p); el.classList.add('tpc'); if(!TUT.done&&!e.anyFit(p)) el.classList.add('nofit'); if(TUT.dica&&TUT.jog===0&&(TUT.p.dicaPeca||0)===i) el.classList.add('pulsa'); if(TUT.drag===i) el.classList.add('hide'); s.appendChild(el); });
}
function tutPop(t,cls){ const d=document.createElement('div'); d.className='tutpopt '+(cls||''); d.textContent=t; $('#tutPop').appendChild(d); setTimeout(()=>d.remove(),1300); }
/* casa do tabuleiro embaixo de um ponto da tela */
function tutCasa(px,py){ const g=$('#tutBoard .tutgrid'); if(!g) return null; const r=g.getBoundingClientRect(), cs=r.width/8; return {r:Math.floor((py-r.top)/cs),c:Math.floor((px-r.left)/cs),rect:r,cs}; }
function tutBoardTap(e){ if(!TUT||TUT.anim) return; const k=tutCasa(e.clientX,e.clientY); if(!k||k.r<0||k.r>7||k.c<0||k.c>7) return;
  if(TUT.hammer>0){ const v=TUT.eng.b[k.r][k.c]; if(!v){ toast('Toque num bloco para quebrar'); return; } TUT.eng.b[k.r][k.c]=null; TUT.hammer--; SFX.thud(); buzz(25); tutPop('🔨'); tutRender(); tutConferir(null); return; }
  if(TUT.sel==null){ return; }
  const p=TUT.tray[TUT.sel]; if(!p) return; const r=k.r-Math.floor((p.h-1)/2), c=k.c-Math.floor((p.w-1)/2);
  if(!tutColocar(TUT.sel,r,c)) { toast('Não cabe aí'); SFX.alert(); }
}
function tutDown(e){
  if(!TUT||TUT.anim||TUT.done&&!TUT.tray.some(Boolean)) return; const s=e.currentTarget, i=+s.dataset.s, p=TUT.tray[i]; if(!p) return;
  e.preventDefault(); try{ s.setPointerCapture(e.pointerId); }catch(er){}
  const cs=$('#tutBoard .tutgrid').getBoundingClientRect().width/8, el=pieceEl(p); el.classList.add('tutdrag','tutb'); el.style.setProperty('--cs',cs+'px'); document.body.appendChild(el);
  const pw=p.w*cs, ph=p.h*cs, lift=e.pointerType==='touch'?ph/2+cs*SET.lift:0, x0=e.clientX, y0=e.clientY; let moveu=false, pv=null;
  el.style.display='none'; SFX.pick(); TUT.drag=i;
  const mover=ev=>{ if(!moveu&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<8) return; if(!moveu) tutRender(pv); moveu=true; el.style.display='';
    const left=ev.clientX-pw/2, top=ev.clientY-ph/2-lift; el.style.transform=`translate(${left}px,${top}px)`;
    const g=$('#tutBoard .tutgrid').getBoundingClientRect(), r=Math.round((top-g.top)/cs), c=Math.round((left-g.left)/cs), blind=TUT.eng.o.play===2;
    const fits=TUT.eng.fits(p,r,c), ok=fits||(blind&&TUT.eng.inBounds(p,r,c)); const n=ok?{p,r,c,ok:fits||blind}:null;
    if(JSON.stringify(n&&[r,c])!==JSON.stringify(pv&&[pv.r,pv.c])){ pv=n; tutRender(pv); } };
  const fim=ev=>{ s.removeEventListener('pointermove',mover); s.removeEventListener('pointerup',fim); s.removeEventListener('pointercancel',fim); el.remove(); TUT.drag=null;
    if(!moveu){ TUT.sel=TUT.sel===i?null:i; tutRender(); return; }
    TUT.sel=null; if(pv&&ev.type==='pointerup'){ if(!tutColocar(i,pv.r,pv.c)) tutRender(); } else tutRender(); };
  s.addEventListener('pointermove',mover); s.addEventListener('pointerup',fim); s.addEventListener('pointercancel',fim);
}
function tutColocar(i,r,c){ const T=TUT, p=T.tray[i], e=T.eng;
  if(!e.fits(p,r,c)){ if(e.o.play===2&&e.inBounds(p,r,c)){ const now=performance.now(); p.cells.forEach(([dr,dc])=>{ const y=r+dr, x=c+dc; if(e.b[y][x]) T.rev[y*8+x]=now+900; }); SFX.alert(); tutRender(); return true; } return false; }
  const antes=e.snap(); T.tray[i]=null; T.sel=null; T.jog++;
  const res=e.place(p,r,c,performance.now()); let pts=res.pts+(res.gold?150*res.gold:0); T.score+=pts;
  SFX.place(); if(res.n){ SFX.clear(res.combo||1,res.n,res.chain); buzz(20); } if(res.bombs) SFX.boom(); if(res.perfect) setTimeout(()=>SFX.perfect(),250);
  if(res.n) tutPop(`+${fmtN(pts)}`+(res.combo>1?` · x${res.combo}`:''),'pts'); if(res.perfect) setTimeout(()=>tutPop('✨ +300','pts'),350);
  if(res.powers&&res.powers.length) setTimeout(()=>tutPop(res.powers.map(k=>PWI[k]+' '+PWN[k]).join(' ')),300);
  if(!res.steps.length){ tutRender(); tutConferir(res); return true; }
  /* animação: mostra a peça no lugar, as casas que somem piscando e, na Gravidade, cada queda */
  const placed=antes.map(row=>row.slice()); p.cells.forEach(([dr,dc],k)=>{ placed[r+dr][c+dc]={c:p.color,s:p.spec&&p.spec.i===k?p.spec.s:null,t:performance.now(),pw:p.pw&&p.pw.i===k?p.pw.k:undefined}; });
  T.anim=true; let k=0, prev=placed;
  const passo=()=>{ if(TUT!==T) return; if(k>=res.steps.length){ T.anim=false; tutRender(); tutConferir(res); return; }
    const st=res.steps[k]; tutRender(null,new Set(st.cleared.map(x=>x[0])),prev);
    setTimeout(()=>{ if(TUT!==T) return; prev=st.board; k++; if(k<res.steps.length){ tutRender(null,null,prev); if(e.o.play===1) SFX.clear(res.combo||1,1,k+1); setTimeout(passo,380); } else passo(); },360); };
  passo(); return true;
}
function tutConferir(res){ const T=TUT; if(!T||T.done) return; const m=$('#tutMsg');
  if(T.p.meta(T,res)){ T.done=true; m.className='tutmsg bom'; m.textContent='✅ '+T.p.ok; if(T.p.depois) m.insertAdjacentHTML('beforeend',T.p.depois()); setTimeout(()=>{ if(TUT===T) SFX.win(); },300); tutBotao(); tutRender(); setTimeout(()=>{ if(TUT===T) m.scrollIntoView({behavior:'smooth',block:'nearest'}); },150); return; }
  const resta=T.tray.filter(Boolean);
  if(!T.hammer&&(!resta.length||!resta.some(p=>T.eng.anyFit(p)))){ m.className='tutmsg mau'; setTimeout(()=>m.scrollIntoView({behavior:'smooth',block:'nearest'}),150); m.textContent='Não foi dessa vez. Toque em ↻ Recomeçar e tente de novo.'; const b=$('#tutRe'); if(b){ b.classList.remove('pulsa'); void b.offsetWidth; b.classList.add('pulsa'); } }
}

$('#goTut').addEventListener('click',tutAbrir);
$('#tutBack').addEventListener('click',()=>{ if(TUT||!$('#tutBody .tutaulas')){ if(TUT) clearInterval(TUT.blindT); TUT=null; tutRenderLista(); window.scrollTo(0,0); } else show('home'); });
window.addEventListener('resize',()=>{ if(TUT&&TUT.eng&&$('#tut').classList.contains('active')){ tutLayout(); tutRender(); } });
tutPonto();
