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
/* parte de cada um na tela dividida com 2 jogadores (como regionOf): [x0,x1,y0,y1] */
const TUT_ESQ=[[0,3,0,7]], TUT_DIR=[[4,7,0,7]];
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
 {id:'dividida',ic:'🪟',t:'Tela dividida',sub:'um tabuleiro só, cada um na sua parte (jogue com o robô)',passos:[
  {t:'Na tela dividida (Co-op dividido) a dupla joga num tabuleiro só, e cada um tem a sua parte. A sua é a metade clara, da esquerda; a escura é do 🤖 Robô. A linha passa pelas duas metades, então vocês limpam juntos! O Robô já fez a parte dele: complete a sua.',reg:TUT_ESQ,tab:['....3...','....1452'],pecas:[tutP('####',5)],dica:[7,0],meta:(T,r)=>r&&r.n>=1,ok:'Linha da dupla! Os pontos vão para o placar dos dois.'},
  {t:'Toda peça precisa tocar a sua parte, mas pode atravessar o meio. Tente pôr a peça inteira do lado do Robô: não vai. Depois encaixe atravessando a linha do meio.',reg:TUT_ESQ,tab:['.....6..','012..345'],pecas:[tutP('##',2)],dica:[7,3],meta:(T,r)=>r&&r.n>=1,ok:'Isso! A peça tocou a sua metade e passou para a do Robô. Vale!'},
  {t:'Vocês jogam ao mesmo tempo, cada um com as suas peças. O Robô vai enchendo a metade dele agora: complete a sua e limpem 3 linhas juntos.',reg:TUT_ESQ,tab:['...2....','........','........','........'],pecas:[tutP('####',0),tutP('####',3),tutP('####',6)],par:{modo:'tempo',jog:[[tutP('####',1),7,4,1200],[tutP('####',4),6,4,3600],[tutP('####',2),5,4,6000]]},dica:[7,0],meta:T=>T.eng.lines>=3,ok:'Três linhas da dupla! Na tela dividida, combinar quem fecha o quê é metade do jogo.'},
  {t:'Com 3 ou 4 jogadores, o tabuleiro cresce para 10×10 e cada um fica com um canto (um quadrante). Com 3, o quarto canto é livre para todos. A regra é a mesma: a peça precisa tocar o seu canto.',html:()=>`<div class="tutinfo"><div class="tutit tutmp tutdois">${modePic('halves',3)}${modePic('halves',4)}<div><b>${esc(TYPES.halves)}</b><p>${esc(TYPE_HINT.halves)}</p></div></div></div>`},
  {t:'Times no tabuleiro dividido: cada time tem o seu tabuleiro, dividido em faixas (uma para cada jogador). Você e o Robô são o Time Azul; o Time Laranja joga no tabuleiro do lado. Com Ataques ligado, limpar 3 linhas ou mais de uma vez manda blindados para o outro time. Ataque!',reg:TUT_ESQ,tab:['.......5','012.4560','123.5601','234.6012'],pecas:[tutP('#|#|#',3)],dica:[5,3],rival:{tit:'🟠 Time Laranja',tab:['..1.....','.23.4...','01234.5.'],jog:[[tutP('##',5),5,1,2500],[tutP('#',2),7,5,5500]]},meta:(T,r)=>r&&r.n>=3,ok:'Ataque! O Time Laranja recebeu 2 blocos blindados no tabuleiro deles.',ataque:2},
  {t:'Pergunta rápida:',quiz:{q:'Na tela dividida, onde você pode colocar uma peça?',ops:['Só inteira dentro da sua parte','Em qualquer lugar, desde que toque a sua parte','Em qualquer lugar do tabuleiro'],ok:1,exp:'A peça precisa tocar a sua parte, mas pode atravessar para a do parceiro.'}}]},
 {id:'estilos',ic:'👥',t:'Outros estilos da sala',sub:'duelo ao vivo, co-op em turnos e versus (jogue com o robô)',passos:[
  {t:'Duelo ao vivo: cada um no seu tabuleiro, com as mesmas peças e ao mesmo tempo. Em cima você vê o tabuleiro do 🤖 Robô em miniatura, com os pontos dele. Use as suas 3 peças e faça mais pontos que ele!',tab:['..4.....','123456..','0123456.'],pecas:[tutP('#',3),tutP('##',5),tutP('#|##',1)],rival:{tit:'🤖 Robô',tab:['..4.....','123456..','0123456.'],jog:[[tutP('#|##',1),3,0,2200],[tutP('#',3),7,7,4200],[tutP('##',5),2,2,6500]]},dica:[7,7],meta:T=>!T.tray.some(Boolean)&&T.score>T.riv.score,falhou:T=>!T.tray.some(Boolean)&&T.score<=T.riv.score,ok:'Você ganhou do Robô! No duelo ao vivo, quem fizer mais pontos (ou bater a meta primeiro) vence.'},
  {t:'Co-op: um tabuleiro só, um de cada vez, e os pontos são da dupla. Faça a sua jogada; depois é a vez do Robô.',tab:['....2...','01234...','012345..'],pecas:[tutP('##',1)],par:{modo:'vez',jog:[[tutP('###',4),6,5]]},dica:[7,6],meta:T=>T.eng.lines>=2,ok:'O Robô fechou a dele! No co-op, cada linha soma no placar da dupla.'},
  {t:'Versus em turnos: um tabuleiro só, mas cada um por si. E tem um truque: quem joga antes escolhe a peça do próximo! Toque na peça que o 🤖 Robô vai jogar. Se você der uma que não cabe em lugar nenhum, ele fica sem jogada e você ganha.',dar:true,tab:tutCheio([[0,0],[1,2],[2,4],[3,6],[4,1],[5,3],[6,5],[7,7]]),pecas:[tutP('#',3),tutP('##|##',1),tutP('###',5)],meta:T=>T.dada!=null&&!T.eng.anyFit(T.dadaP),ok:'O Robô ficou sem jogada: você venceu! No versus, dar a pior peça para o outro é a estratégia.'},
  {t:'Os outros estilos da sala:',html:()=>`<div class="tutinfo">${['tlive','cabo','camp'].map(k=>`<div class="tutit tutmp">${modePic(k,4,{az:2,la:2})}<div><b>${esc(TYPES[k])}</b><p>${esc(TYPE_HINT[k])}</p></div></div>`).join('')}</div>`},
  {t:'Pergunta rápida:',quiz:{q:'No Versus em turnos, quem escolhe a peça que você vai jogar?',ops:['Você mesmo','Quem joga antes de você','O jogo, por sorte'],ok:1,exp:()=>TYPE_HINT.versus}}]},
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
 {id:'onde',ic:'🗺️',t:'Onde jogar',sub:'o menu e os modificadores',passos:[
  {t:'O que tem no menu:',html:()=>tutLista(TUT_MENU)},
  {t:'Pergunta rápida:',quiz:{q:'Você quer jogar com alguém que mora longe, cada um no seu tempo, sem precisar estarem conectados juntos. O que escolher?',ops:['Desafio a distância','Co-op','Versus em turnos'],ok:0,exp:'No desafio a distância cada um joga a rodada quando puder, com as mesmas peças. Melhor de 5!'}},
  {t:'Pergunta rápida:',quiz:{q:'Todo mundo no mesmo tabuleiro, um de cada vez, somando pontos. Qual estilo é esse?',ops:()=>[TYPES.live,TYPES.coop,TYPES.tsplit],ok:1,exp:()=>TYPE_HINT.coop}},
  {t:'Modificadores mudam a partida: ligue em "Modificadores" no Jogar sozinho ou nas regras da sala. O tempo pode ser de 2, 3 ou 5 minutos, sem limite, ou "Sem limite com progressão", em que o tempo para pôr cada peça vai apertando.',html:()=>tutLista(FLAGS.map(k=>['•',LABEL[k],HINT[k]]))+`<p class="muted tutsub">Só no duelo ao vivo:</p>`+tutLista(NETF.map(k=>['⚔️',LABEL[k],HINT[k]]))}]}
];

let TUT=null;
const tutFeitas=()=>store.get('ddb_tut',{});
function tutPonto(){ const d=$('#goTutDot'); if(d) d.hidden=!!store.get('ddb_tutVisto',0); }
function tutAbrir(){ store.set('ddb_tutVisto',1); tutPonto(); tutParar(); show('tut'); tutRenderLista(); }
/* para os relógios do passo (robô parceiro, adversário, modo Cego) */
function tutParar(){ if(TUT){ TUT.timers.forEach(clearTimeout); clearInterval(TUT.blindT); } TUT=null; }
function tutRenderLista(){
  tutParar(); $('#tutNext').hidden=true;
  const f=tutFeitas(), n=TUT_AULAS.filter(a=>f[a.id]).length;
  $('#tutHead').innerHTML=`<h1>🎓 Como jogar</h1><p class="muted">Aulas curtinhas, com tabuleiro de treino: você joga enquanto aprende. ${n?`${n} de ${TUT_AULAS.length} feitas.`:''}</p>`;
  $('#tutBody').innerHTML=`<div class="tutaulas">${TUT_AULAS.map((a,i)=>`<button type="button" class="btn tutaula${f[a.id]?' feita':''}" data-i="${i}"><span class="ico">${a.ic}</span><span class="dtx"><b>${i+1}. ${esc(a.t)}</b><small>${esc(a.sub)}</small></span><span class="go">${f[a.id]?'✓':'›'}</span></button>`).join('')}</div>`;
  $$('#tutBody .tutaula').forEach(b=>b.addEventListener('click',()=>tutAula(+b.dataset.i,0)));
  window.scrollTo(0,0);
}
function tutAula(ai,pi){
  const a=TUT_AULAS[ai], p=a.passos[pi]; setN(8); tutParar();
  const T=TUT={ai,pi,a,p,eng:null,tray:[],sel:null,done:false,score:0,jog:0,hammer:p.martelo||0,dica:false,rev:{},anim:false,blindT:0,timers:[],parK:0,vez:'eu',riv:null,dada:null,dadaP:null,cel:[],novo:{}};
  if(p.tab){ T.eng=new Engine(Object.assign({play:0},p.o)); T.eng.b=tutTab(p.tab); T.tray=p.pecas.map(x=>({...x})); if(p.ini) p.ini(T); }
  if(p.rival) T.riv={eng:new Engine({play:0}),score:0,k:0}, T.riv.eng.b=tutTab(p.rival.tab);
  const val=v=>typeof v==='function'?v():v;
  $('#tutHead').innerHTML=`<div class="tuttop"><span class="muted">Aula ${ai+1} de ${TUT_AULAS.length} · ${esc(a.ic)} ${esc(a.t)}</span><div class="tutdots">${a.passos.map((_,i)=>`<i class="${i<pi?'ok':i===pi?'on':''}"></i>`).join('')}</div></div>`;
  let h=`<div class="card tuttxt"><p>${esc(p.t)}</p></div><div class="tutmsg" id="tutMsg"></div>`;
  if(p.html) h+=val(p.html);
  if(p.quiz){ const q=p.quiz; h+=`<div class="card tutquiz"><b>${esc(q.q)}</b><div class="tutops">${val(q.ops).map((o,i)=>`<button type="button" class="btn" data-o="${i}">${esc(o)}</button>`).join('')}</div></div>`; }
  if(p.tab){
    h+=`<div class="tuthud">${p.dica?'<button type="button" class="chip" id="tutDica" aria-label="Dica">💡</button>':'<span></span>'}<div class="tutpts"><b id="tutPts">0</b><small>${p.reg||p.par?'pontos da dupla':p.rival&&!p.reg?'seus pontos':'pontos'}</small></div><div id="tutCombo" class="tutcombo"></div><button type="button" class="chip" id="tutRe" aria-label="Recomeçar">↻</button></div>`;
    if(p.rival) h+=`<div class="tutriv"><div><b>${esc(p.rival.tit)}</b><small id="tutRivPts">0 pontos</small></div><div id="tutRivB"></div></div>`;
    if(p.reg) h+=`<p class="tutleg"><span class="lg1"></span>sua parte <span class="lg2"></span>parte do 🤖 Robô</p>`;
    h+=`<p class="tutvez" id="tutVez"></p><div class="tutwrap"><div class="tutboard tutb" id="tutBoard"></div><div id="tutPop"></div></div>`;
    if(!p.martelo) h+=`<div class="tuttray tutb" id="tutTray">${[0,1,2].map(i=>`<div class="tslot" data-s="${i}"></div>`).join('')}</div><p class="muted tutsub">${p.dar?'Toque na peça que o Robô vai jogar.':'Arraste a peça, ou toque nela e depois no tabuleiro.'}</p>`;
  }
  $('#tutBody').innerHTML=h;
  if(p.quiz) $$('#tutBody .tutops .btn').forEach(b=>b.addEventListener('click',()=>tutResponder(b,+b.dataset.o)));
  if(p.tab){ tutLayout(); tutRender(); tutRivRender();
    if(p.dica) $('#tutDica').addEventListener('click',()=>{ T.dica=!T.dica; tutRender(); });
    $('#tutRe').addEventListener('click',()=>tutAula(ai,pi));
    $('#tutBoard').addEventListener('click',tutBoardTap);
    $$('#tutTray .tslot').forEach(s=>s.addEventListener('pointerdown',tutDown));
    if(T.eng.o.play===2) T.blindT=setInterval(()=>{ if(TUT!==T||!$('#tut').classList.contains('active')){ clearInterval(T.blindT); return; } if(!T.anim) tutRender(); },300);
    /* robô parceiro que joga no tempo dele (tela dividida) e adversário da miniatura */
    if(p.par&&p.par.modo==='tempo') p.par.jog.forEach((j,k)=>tutDepois(T,j[3],()=>tutParJoga(T,k)));
    if(p.rival) p.rival.jog.forEach((j,k)=>tutDepois(T,j[3],()=>tutRivJoga(T,k)));
    tutVez(); }
  if(!p.tab&&!p.quiz) T.done=true;
  tutBotao(); window.scrollTo(0,0);
}
const tutDepois=(T,ms,f)=>T.timers.push(setTimeout(()=>{ if(TUT===T&&$('#tut').classList.contains('active')) f(); },ms));
function tutBotao(){ const b=$('#tutNext'); if(!TUT){ b.hidden=true; return; } const ult=TUT.pi===TUT.a.passos.length-1; b.hidden=false;
  b.textContent=TUT.done?(ult?'Concluir ✓':'Próximo →'):'Pular'; b.classList.toggle('primary',TUT.done); b.classList.toggle('pulsa',TUT.done); }
function tutProximo(){ if(!TUT) return; const {ai,pi,a}=TUT;
  if(pi<a.passos.length-1){ tutAula(ai,pi+1); return; }
  const f=tutFeitas(), nova=!f[a.id]; f[a.id]=1; store.set('ddb_tut',f); tutParar();
  const todas=TUT_AULAS.every(x=>f[x.id]); SFX.win(); $('#tutNext').hidden=true;
  $('#tutHead').innerHTML='';
  $('#tutBody').innerHTML=`<div class="card tcenter tutfim"><div class="tutbig">${todas?'🎓':'🎉'}</div><h2>${todas&&nova?'Tutorial completo!':'Aula concluída!'}</h2><p class="muted">${esc(a.ic)} ${esc(a.t)}</p></div><div class="endbtns">${ai<TUT_AULAS.length-1?`<button type="button" class="btn primary" id="tutSeg">Próxima aula: ${esc(TUT_AULAS[ai+1].ic)} ${esc(TUT_AULAS[ai+1].t)}</button>`:''}<button type="button" class="btn${ai<TUT_AULAS.length-1?'':' primary'}" id="tutLis">Ver todas as aulas</button><button type="button" class="btn ghost" id="tutJogar">🎯 Jogar sozinho</button></div>`;
  if($('#tutSeg')) $('#tutSeg').addEventListener('click',()=>tutAula(ai+1,0));
  $('#tutLis').addEventListener('click',tutRenderLista); $('#tutJogar').addEventListener('click',()=>$('#goSolo').click());
  window.scrollTo(0,0);
}
function tutResponder(b,i){ if(!TUT||TUT.done) return; const q=TUT.p.quiz, exp=typeof q.exp==='function'?q.exp():q.exp, m=$('#tutMsg');
  if(i===q.ok){ b.classList.add('certo'); $$('#tutBody .tutops .btn').forEach(x=>x.disabled=true); TUT.done=true; m.className='tutmsg bom'; m.textContent='✅ Isso mesmo! '+exp; SFX.win(); buzz(20); tutBotao(); }
  else { b.classList.add('errado'); b.disabled=true; m.className='tutmsg mau'; m.textContent='Quase! Tente outra.'; SFX.alert(); buzz([30,40,30]); }
}

/* ---------- tabuleiro de treino ---------- */
function tutLayout(){ const w=Math.min(360,$('#tutBody').clientWidth||320), cs=Math.max(26,Math.floor(Math.min(w-8,(window.innerHeight||640)*.36)/8)); $('#tut').style.setProperty('--tcs',cs+'px'); }
function tutCelHTML(v,x={}){
  const f=x.fora?' fora':'';
  if(!v) return `<div class="tq vazio${f}${x.dica?' dica':''}"></div>`;
  const col=v.c===-1||v.c===-4?'s':v.c===-2?'g':v.s==='wild'?'x':String(v.c), cor=v.c===-1||v.c===-4?STONE:v.c===-2?goldCol():v.s==='wild'?WILDC:PALETTE[v.c];
  const cls=(v.s==='bomb'?' sp-bomb':v.s==='ice'?' sp-ice':v.s==='wild'?' sp-wild':'')+(v.cr?' cr':'')+(v.c===-2?' gold':'')+(x.hl?' hl':'')+(x.sai?' sai':'')+(x.bad?' bad':'')+(x.novo?' novo':'')+f;
  return `<div class="tq${cls}" data-col="${col}" style="--c:${cor}"><div class="blk bev"></div>${v.pw?`<span class="pwi">${PWI[v.pw]}</span>`:''}</div>`;
}
/* as 64 casas em HTML (uma string por casa, para trocar só as que mudaram) */
function tutCasas(b,pv,o={}){
  const T=TUT, blind=!o.mini&&T&&T.eng&&T.eng.o.play===2, now=performance.now(), gh={}, hl=new Set(), dica=new Set(), reg=!o.mini&&T&&T.p.reg;
  if(pv){ pv.p.cells.forEach(([dr,dc])=>gh[(pv.r+dr)*8+pv.c+dc]=1);
    if(!blind&&!pv.fora){ const t=b.map(r=>r.map(v=>!!v)); pv.p.cells.forEach(([dr,dc])=>t[pv.r+dr][pv.c+dc]=true);
      for(let y=0;y<8;y++) if(t[y].every(Boolean)) for(let x=0;x<8;x++) hl.add(y*8+x);
      for(let x=0;x<8;x++) if(t.every(r=>r[x])) for(let y=0;y<8;y++) hl.add(y*8+x); } }
  if(o.dica){ const [r,c]=T.p.dica, p=T.tray[T.p.dicaPeca||0]; if(p) p.cells.forEach(([dr,dc])=>dica.add((r+dr)*8+c+dc)); }
  const out=[]; for(let i=0;i<64;i++){ const y=(i/8)|0, x=i%8; let v=b[y][x]; const fora=!!reg&&!inReg(reg,y,x);
    if(v&&blind&&v.c>=0&&now-v.t>2500&&!(T.rev[i]>now)) v=null;
    if(gh[i]&&!v) out.push(`<div class="tq gh${hl.has(i)?' hl':''}${pv.fora?' ghbad':''}${fora?' fora':''}" data-col="${pv.p.color}" style="--c:${PALETTE[pv.p.color]}"><div class="blk bev"></div></div>`);
    else out.push(tutCelHTML(v,{hl:hl.has(i),sai:o.sai&&o.sai.has(i),dica:dica.has(i)&&!v,bad:blind&&T.rev[i]>now,novo:!o.mini&&T&&T.novo[i]>now,fora})); }
  return out;
}
const tutBoardHTML=(b,pv,o={})=>`<div class="tutgrid${o.mini?' mini':''}">${tutCasas(b,pv,o).join('')}</div>`;
function tutRender(pv,sai,b){ const T=TUT; if(!T||!T.eng) return; const bd=$('#tutBoard'); if(!bd) return;
  const cs=tutCasas(b||T.eng.b,pv,{sai,dica:T.dica&&!T.done&&T.jog===0}); let g=bd.firstElementChild;
  if(!g||g.children.length!==64){ bd.innerHTML=`<div class="tutgrid">${cs.join('')}</div>`; T.cel=cs; }
  else for(let i=0;i<64;i++) if(T.cel[i]!==cs[i]){ g.children[i].outerHTML=cs[i]; T.cel[i]=cs[i]; }
  bd.classList.toggle('martelo',T.hammer>0);
  $('#tutPts').textContent=fmtN(T.score);
  const e=T.eng, c=$('#tutCombo'), ct=T.hammer>0?`🔨 toque em ${T.hammer} bloco${T.hammer>1?'s':''}`:e.combo>0&&e.o.play!==3?`🔥 Combo x${e.combo}<small>aguenta mais ${Math.max(0,2-e.since)} jogada${2-e.since===1?'':'s'} sem limpar</small>`:'';
  if(c._t!==ct){ c._t=ct; c.innerHTML=ct; }
  const reg=T.p.reg, travado=T.vez!=='eu'||T.anim;
  $$('#tutTray .tslot').forEach((s,i)=>{ const p=T.tray[i];
    const nofit=!!p&&!T.done&&!T.p.dar&&!e.anyFit(p,reg), pulsa=!!(T.dica&&T.jog===0&&(T.p.dicaPeca||0)===i), sig=p?[pkey(p),nofit,T.sel===i,T.drag===i,pulsa,travado].join('/'):'';
    if(s._sig===sig) return; s._sig=sig; s.innerHTML=''; s.classList.toggle('sel',T.sel===i); if(!p) return;
    const el=pieceEl(p); el.classList.add('tpc'); if(nofit||travado) el.classList.add('nofit'); if(pulsa) el.classList.add('pulsa'); if(T.drag===i) el.classList.add('hide'); s.appendChild(el); });
}
function tutRivRender(){ const T=TUT; if(!T||!T.riv) return; const el=$('#tutRivB'); if(!el) return; el.innerHTML=tutBoardHTML(T.riv.eng.b,null,{mini:1}); $('#tutRivPts').textContent=`${fmtN(T.riv.score)} pontos`; }
function tutVez(){ const T=TUT, el=$('#tutVez'); if(!el||!T) return; const p=T.p;
  el.textContent=T.vez==='par'?'🤖 Vez do Robô…':p.par&&p.par.modo==='vez'&&!T.done?'👉 Sua vez':p.par&&p.par.modo==='tempo'&&T.parK<p.par.jog.length&&!T.done?'🤖 O Robô também está jogando':'';
  el.classList.toggle('dele',T.vez==='par'); }
function tutPop(t,cls){ const d=document.createElement('div'); d.className='tutpopt '+(cls||''); d.textContent=t; const h=$('#tutPop'); if(!h) return; h.appendChild(d); setTimeout(()=>d.remove(),1300); }
/* casa do tabuleiro embaixo de um ponto da tela */
function tutCasa(px,py){ const g=$('#tutBoard .tutgrid'); if(!g) return null; const r=g.getBoundingClientRect(), cs=r.width/8; return {r:Math.floor((py-r.top)/cs),c:Math.floor((px-r.left)/cs)}; }
function tutBoardTap(e){ const T=TUT; if(!T||T.anim||T.vez!=='eu') return; const k=tutCasa(e.clientX,e.clientY); if(!k||k.r<0||k.r>7||k.c<0||k.c>7) return;
  if(T.hammer>0){ const v=T.eng.b[k.r][k.c]; if(!v){ toast('Toque num bloco para quebrar'); return; } T.eng.b[k.r][k.c]=null; T.hammer--; SFX.thud(); buzz(25); tutPop('🔨'); tutRender(); tutConferir(null); return; }
  if(T.sel==null||T.p.dar) return;
  const p=T.tray[T.sel]; if(!p) return; tutTentar(T.sel,k.r-Math.floor((p.h-1)/2),k.c-Math.floor((p.w-1)/2));
}
/* tenta colocar; explica quando não deu (fora da sua parte, ou não cabe) */
function tutTentar(i,r,c){ const T=TUT, p=T.tray[i]; if(tutColocar(i,r,c)) return true;
  if(T.p.reg&&T.eng.fits(p,r,c)){ toast('A peça precisa tocar a sua parte (a metade clara)'); SFX.alert(); buzz([30,40,30]); }
  else if(T.sel!=null){ toast('Não cabe aí'); SFX.alert(); }
  tutRender(); return false; }
function tutDown(e){
  const T=TUT; if(!T||T.anim||T.vez!=='eu') return; const s=e.currentTarget, i=+s.dataset.s, p=T.tray[i]; if(!p) return;
  e.preventDefault();
  if(T.p.dar){ tutDar(i); return; }
  try{ s.setPointerCapture(e.pointerId); }catch(er){}
  const cs=$('#tutBoard .tutgrid').getBoundingClientRect().width/8, el=pieceEl(p); el.classList.add('tutdrag','tutb'); el.style.setProperty('--cs',cs+'px'); el.style.display='none'; document.body.appendChild(el);
  const pw=p.w*cs, ph=p.h*cs, lift=e.pointerType==='touch'?ph/2+cs*SET.lift:0, x0=e.clientX, y0=e.clientY, blind=T.eng.o.play===2; let moveu=false, pv=null, g=null, raf=0, ult=null;
  SFX.pick();
  const passo=()=>{ raf=0; const ev=ult; const left=ev.clientX-pw/2, top=ev.clientY-ph/2-lift; el.style.transform=`translate(${left}px,${top}px)`;
    const r=Math.round((top-g.top)/cs), c=Math.round((left-g.left)/cs), cabe=T.eng.fits(p,r,c,T.p.reg)||(blind&&T.eng.inBounds(p,r,c,T.p.reg)), n=cabe?{p,r,c}:T.p.reg&&T.eng.fits(p,r,c)?{p,r,c,fora:1}:null;
    if((n&&n.r+','+n.c+n.fora)!==(pv&&pv.r+','+pv.c+pv.fora)){ pv=n; tutRender(pv); } };
  const mover=ev=>{ if(TUT!==T) return; if(!moveu){ if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<8) return; moveu=true; T.drag=i; el.style.display=''; g=$('#tutBoard .tutgrid').getBoundingClientRect(); tutRender(); }
    ult=ev; if(!raf) raf=requestAnimationFrame(passo); };
  const fim=ev=>{ s.removeEventListener('pointermove',mover); s.removeEventListener('pointerup',fim); s.removeEventListener('pointercancel',fim); cancelAnimationFrame(raf); el.remove(); if(TUT!==T) return; T.drag=null;
    if(!moveu){ T.sel=T.sel===i?null:i; tutRender(); return; }
    T.sel=null; if(ev.type==='pointerup'&&ult){ ult=ev; passo(); }
    if(pv&&ev.type==='pointerup') tutTentar(i,pv.r,pv.c); else tutRender(); };
  s.addEventListener('pointermove',mover); s.addEventListener('pointerup',fim); s.addEventListener('pointercancel',fim);
}
/* coloca uma peça da bandeja (sua) */
function tutColocar(i,r,c){ const T=TUT, p=T.tray[i], e=T.eng; if(!p||T.vez!=='eu') return false;
  if(T.anim){ T.timers.push(setTimeout(()=>{ if(TUT===T&&T.tray[i]===p) tutTentar(i,r,c); },150)); return true; }
  if(!e.fits(p,r,c,T.p.reg)){ if(e.o.play===2&&e.inBounds(p,r,c,T.p.reg)){ const now=performance.now(); p.cells.forEach(([dr,dc])=>{ const y=r+dr, x=c+dc; if(e.b[y][x]) T.rev[y*8+x]=now+900; }); SFX.alert(); tutRender(); return true; } return false; }
  T.tray[i]=null; T.sel=null; T.jog++;
  tutAplicar(p,r,c,'eu'); return true;
}
/* põe a peça no tabuleiro (sua ou do robô parceiro): pontos, sons e animação de limpeza */
function tutAplicar(p,r,c,quem){ const T=TUT, e=T.eng, antes=e.snap(), now=performance.now();
  const res=e.place(p,r,c,now), pts=res.pts+(res.gold?150*res.gold:0); T.score+=pts;
  if(quem==='par') res.placed.forEach(k=>T.novo[k]=now+1200);
  SFX.place(); if(res.n){ SFX.clear(res.combo||1,res.n,res.chain); buzz(20); } if(res.bombs) SFX.boom(); if(res.perfect) setTimeout(()=>SFX.perfect(),250);
  if(res.n) tutPop((quem==='par'?'🤖 ':'')+`+${fmtN(pts)}`+(res.combo>1?` · x${res.combo}`:''),'pts'); if(res.perfect) setTimeout(()=>tutPop('✨ +300','pts'),350);
  if(res.powers&&res.powers.length) setTimeout(()=>tutPop(res.powers.map(k=>PWI[k]+' '+PWN[k]).join(' ')),300);
  const fim=()=>{ T.anim=false; tutRender(); tutConferir(res); if(quem==='eu') tutParVez(T); tutVez(); };
  if(!res.steps.length){ fim(); return res; }
  /* animação: mostra a peça no lugar, as casas que somem piscando e, na Gravidade, cada queda */
  const placed=antes.map(row=>row.slice()); p.cells.forEach(([dr,dc],k)=>{ placed[r+dr][c+dc]={c:p.color,s:p.spec&&p.spec.i===k?p.spec.s:null,t:now,pw:p.pw&&p.pw.i===k?p.pw.k:undefined}; });
  T.anim=true; let k=0, prev=placed;
  const passo=()=>{ if(TUT!==T) return; if(k>=res.steps.length){ fim(); return; }
    const st=res.steps[k]; tutRender(null,new Set(st.cleared.map(x=>x[0])),prev);
    setTimeout(()=>{ if(TUT!==T) return; prev=st.board; k++; if(k<res.steps.length){ tutRender(null,null,prev); if(e.o.play===1) SFX.clear(res.combo||1,1,k+1); setTimeout(passo,380); } else passo(); },360); };
  passo(); return res;
}
/* lugar para o robô: o combinado no roteiro ou, se estiver ocupado, o que fecha mais linhas dentro da parte dele */
function tutMelhor(e,p,reg,r0,c0){ if(r0!=null&&e.fits(p,r0,c0,reg)) return [r0,c0]; let best=null, bv=-1;
  for(let r=0;r<=8-p.h;r++) for(let c=0;c<=8-p.w;c++){ if(!e.fits(p,r,c,reg)) continue; const t=e.b.map(row=>row.map(v=>!!v)); p.cells.forEach(([dr,dc])=>t[r+dr][c+dc]=true);
    let n=0; for(let y=0;y<8;y++) if(t[y].every(Boolean)) n++; for(let x=0;x<8;x++) if(t.every(row=>row[x])) n++;
    const v=n*100+r*8+c; if(v>bv){ bv=v; best=[r,c]; } }
  return best; }
function tutParJoga(T,k){ if(T.anim){ tutDepois(T,200,()=>tutParJoga(T,k)); return; } const j=T.p.par.jog[k]; T.parK=k+1;
  const pos=tutMelhor(T.eng,j[0],T.p.reg?TUT_DIR:null,j[1],j[2]); if(pos) tutAplicar({...j[0]},pos[0],pos[1],'par'); else { tutVez(); tutConferir(null); } }
/* co-op em turnos: depois da sua jogada, o robô joga a dele */
function tutParVez(T){ const p=T.p; if(!p.par||p.par.modo!=='vez'||T.parK>=p.par.jog.length) return; T.vez='par'; tutVez(); tutRender();
  tutDepois(T,1100,()=>{ const k=T.parK; T.vez='eu'; tutParJoga(T,k); }); }
/* adversário da miniatura (duelo ao vivo, outro time): joga no tabuleiro dele */
function tutRivJoga(T,k){ const j=T.p.rival.jog[k], R=T.riv; R.k=k+1; const pos=tutMelhor(R.eng,j[0],null,j[1],j[2]); if(!pos) return;
  const res=R.eng.place({...j[0]},pos[0],pos[1],performance.now()); R.score+=res.pts; tutRivRender(); if(res.n) SFX.tick();
  const el=$('#tutRivB'); if(el){ el.classList.remove('pisca'); void el.offsetWidth; el.classList.add('pisca'); } tutConferir(null); }
/* versus: você escolhe a peça que o robô vai jogar */
function tutDar(i){ const T=TUT, p=T.tray[i]; if(!p||T.dada!=null) return; T.dada=i; T.dadaP=p; T.tray[i]=null; SFX.pick(); tutPop('🤖 ⬅ '); T.vez='par'; tutVez(); tutRender();
  tutDepois(T,900,()=>{ T.vez='eu'; const pos=tutMelhor(T.eng,p,null);
    if(pos){ tutAplicar({...p},pos[0],pos[1],'par'); tutDepois(T,700,()=>{ const m=$('#tutMsg'); m.className='tutmsg mau'; m.textContent='O Robô encaixou essa peça e fez pontos. Toque em ↻ e dê uma peça que não caiba.'; }); }
    else { tutVez(); tutConferir(null); } }); }
function tutConferir(res){ const T=TUT; if(!T||T.done||T.anim) return; const m=$('#tutMsg');
  if(T.p.meta(T,res)){ T.done=true; m.className='tutmsg bom'; m.textContent='✅ '+T.p.ok;
    if(T.p.ataque&&T.riv){ const add=T.riv.eng.addStones(Math.random,T.p.ataque,-1,'ice'); tutRivRender(); const el=$('#tutRivB'); if(el){ el.classList.remove('pisca'); void el.offsetWidth; el.classList.add('pisca'); } if(add.length) SFX.boom(); }
    if(T.p.depois) m.insertAdjacentHTML('beforeend',T.p.depois());
    setTimeout(()=>{ if(TUT===T) SFX.win(); },300); tutBotao(); tutRender(); tutVez(); return; }
  const resta=T.tray.filter(Boolean), falta=T.p.par&&T.parK<T.p.par.jog.length;
  if((T.p.falhou&&T.p.falhou(T))||(!T.p.falhou&&!T.p.dar&&!T.hammer&&!falta&&T.vez==='eu'&&(!resta.length||!resta.some(p=>T.eng.anyFit(p,T.p.reg))))){
    m.className='tutmsg mau'; m.textContent='Não foi dessa vez. Toque em ↻ para recomeçar e tente de novo.'; const b=$('#tutRe'); if(b){ b.classList.remove('pulsa'); void b.offsetWidth; b.classList.add('pulsa'); } }
}

$('#goTut').addEventListener('click',tutAbrir);
$('#tutNext').addEventListener('click',tutProximo);
$('#tutBack').addEventListener('click',()=>{ if(TUT||!$('#tutBody .tutaulas')) tutRenderLista(); else { tutParar(); show('home'); } });
window.addEventListener('resize',()=>{ if(TUT&&TUT.eng&&$('#tut').classList.contains('active')){ tutLayout(); } });
tutPonto();
