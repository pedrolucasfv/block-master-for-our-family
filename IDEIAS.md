# Ideias para o Duelo de Blocos (brainstorm)

Plano vivo do brainstorm. Só o que está marcado como ✅ feito foi implementado. Quando o brainstorm terminar, juntamos tudo num plano de execução (ordem, tamanho, dependências).

## ✅ Plano consolidado (brainstorm encerrado em 23/11/2026)
Ordem sugerida, pensando no que já existe no código e no que depende do quê. Tamanho: P (pequeno), M (médio), G (grande).

| # | Ideia | Tamanho | Por que nessa ordem | Falta decidir |
|---|---|---|---|---|
| 0 | 👤 Página de perfil (com estante de troféus) | M/G | **Estudar melhor antes**. Pré-requisito do troféu das datas especiais | Ver o perfil dos outros?; foto na nuvem? |
| 1 | 🎉 Datas especiais no Desafio do dia (Natal primeiro) | M | Natal está perto; usa o Desafio do dia e os avisos que já existem. Recompensa: **troféu no perfil**, então só depois do perfil (o Natal de 2026 pode ficar sem troféu) | Onde cadastrar aniversários |
| 2 | 🤖 Supere o robô | P | Reaproveita o robô do duelo; é a base do robô treinador | Nível do robô; robô joga no aparelho ou no banco |
| 3 | 🎓 Robô treinador | G | Melhorar o cérebro do robô (3 peças em todas as ordens), depois: aviso na hora → revisão no fim → erros mais comuns | Quando falar; quantas dicas 💡 |
| 4 | 🪢 Cabo de guerra | ✅ feito (1.26) | Só uma regra nova em cima do duelo ao vivo; aquece para o Território | Ver se a ponta de 1.000 pontos está boa jogando de verdade |
| 5 | 🏰 Território | ✅ feito (1.27) | Duelo ao vivo + tabuleiro dividido + mapa igual para todos + bloco de tinta | Combo/tabuleiro limpo pintarem algo a mais |
| 6 | 🥔 Batata quente na sala | M | Em cima do co-op em turnos do tabuleiro único | 1 ou 3 peças por vez; vidas |
| 7 | 👀 Assistir quem está jogando | M/G | Precisa de tabela nova no banco (presença + retrato da partida) | Detalhes da permissão |
| 8 | 🧢 Times com técnico | G | O mais complexo; **refinar antes** de começar | Estoque/fichas; bandeja ou peça a peça; time com 1 pessoa |
| — | 🗺️ Mundos novos da campanha | G | Para bem depois | Quais mundos primeiro |
| — | 🕵️ Impostor | ? | Só se ficar legal depois de refinar | Quase tudo |

Itens 2 a 7 não dependem do perfil e podem começar a qualquer hora.

Cada item vira uma versão própria (1.x) com linha no `CHANGELOG.md` e tradução em japonês.

---

Legenda: ⭐ escolhida · 🧪 precisa refinar · 💭 só ideia (ainda não comentada) · ❌ descartada

---

## 1. 🧢 Times com técnico ⭐🧪 (prioridade 1)
Cada time tem **1 jogador + 1 técnico** (2×2 com 4 celulares; ou 3×3 com 1 técnico + 2 jogadores).

- **Jogador:** joga normal no próprio tabuleiro, mas as próximas peças são escolhidas pelo técnico do time rival.
- **Técnico:** vê os dois tabuleiros (o do seu jogador e o do rival) e decide as peças.

**Como evitar "só mandar 3×3"** (escolher/combinar):
- **Estoque limitado:** o técnico recebe ~12 peças sorteadas; cada uma usada sai da lista.
- **Fichas:** as linhas que o seu jogador limpa dão fichas; peça mais maldosa custa mais (1×1 de graça, L grande 2, 3×3 4).
- **Regra de justiça:** não pode mandar uma bandeja em que nada cabe (peça fica cinza).
- **Relógio:** ~10 s para escolher; se não escolher, vai bandeja sorteada.

**Ajudar o próprio time:** com as mesmas fichas, comprar uma peça boa para o seu jogador, usar o martelo no tabuleiro dele, **marcar casas** ("põe aqui!", já existe no tabuleiro único) ou mandar voz gravada.

**Variações:** troca de papéis no intervalo · técnico robô (para jogar sozinho, usa o mesmo cérebro do robô de treino) · TV mostra as escolhas dos técnicos.

**Em aberto:**
- Estoque, fichas ou os dois juntos?
- O técnico manda a bandeja inteira (3 peças) ou uma peça de cada vez?
- O jogador vê qual será a próxima bandeja (fila)?
- E se um time tiver só 1 pessoa? (técnico robô?)
- Como fica no tabuleiro dividido / tabuleiro único?

Base no código: times (`tlive`/`tsplit`), versus (escolher a peça do outro), `marcar` e martelo do `10-shared.js`, sala do `09-net.js`.

---

## 2. 🎓 Robô treinador ⭐🧪
Objetivo: algo **robusto, que ajude a pessoa a melhorar de verdade**, mesmo o jogo sendo aleatório.

Base existente: o robô do duelo (`js/15-npc.js`): `npcEval` (nota do tabuleiro), `npcMoves` (testa cada peça em cada lugar), `npcPick` (olha uma jogada à frente).

**Ideias para ficar robusto:**
- **Análise com as peças que vieram de verdade:** como as peças vêm da semente (`makeRng`/`gen3`), no fim dá para ver a sequência real e mostrar "com essas 3 peças, a ordem X teria fechado 2 linhas". Assim não é "chute", é "com o que você tinha na mão".
- **Olhar para trás:** quando a pessoa trava, voltar 2–3 jogadas e mostrar onde começou o problema ("aqui você fechou o último espaço 3×3").
- **Proteção contra peças grandes:** a cada jogada, conferir se ainda cabe 3×3, 1×5, 5×1 e L grande. Avisar quando a jogada acaba com o último lugar de uma delas ("cuidado: agora não cabe mais uma barra de 5").
- **Tipos de erro com nome** (vira aula): buraco criado · centro bloqueado · combo quebrado · linha quase completa abandonada · sem lugar para peça grande · cantos mal usados.
- **Seus erros mais comuns:** guardar, ao longo das partidas, quais tipos de erro mais aparecem ("você costuma tampar buraco no meio"), com uma dica fixa para cada um.
- **Avisar só quando importa:** falar só quando a diferença for grande; quando a jogada foi boa, um 👍 de vez em quando.

**Formas de mostrar:** aviso na hora (peça fantasma onde o robô colocaria) · lâmpada 💡 limitada · revisão no fim com os 3 piores momentos (antes / sua jogada / jogada do robô) · nota da partida ("acertou 78% das jogadas do robô").

**Cuidados:** robô é bom, não perfeito, então falar "eu teria colocado aqui" e não "você errou" · testar todas as ordens das 3 peças pesa em celular fraco (olhar só as melhores e respeitar `SET.lite`) · pode valer melhorar o próprio robô (olhar as 3 peças em todas as ordens).

---

## 3. 🤖 "Supere o robô" no Desafio do dia ⭐
Mostrar quantos pontos o Robô Bom fez **com as mesmas peças** do dia (a sequência vem da semente do dia, então é igual para todos). Meta extra: "você passou o robô 🎉".
- O robô pode jogar uma vez por dia (no aparelho ou no banco) e o resultado fica fixo.
- Atenção: o Desafio do dia tem tempo por peça (`RAMP`); o robô joga sem pressa, então talvez use "nível" do robô (fácil/bom/mestre).
- Combina com o robô treinador: depois da partida, "veja como o robô jogou o desafio de hoje".

---

## 4. 🥔 Batata quente na sala conectada ⭐🧪
Cada um no seu celular, um tabuleiro só, jogadas passando de um para o outro (base: co-op em turnos do tabuleiro único).
- Na sua vez: 1 peça (ou 3, configurável), com ~8 s; a 🥔 vai ficando vermelha. Se acabar o tempo, a peça cai num lugar qualquer.
- Quem recebe peças que não cabem em lugar nenhum perde uma vida 🥔 (2–3 vidas) ou sai; ganha o último que sobrar.
- Opcional: quem limpa linha escolhe a peça difícil do próximo.
- TV: tabuleiro grande + fila de quem é o próximo.

---

## 5. 🎉 Datas especiais no Desafio do dia ⭐🧪
Natal, Ano-Novo, Carnaval, Páscoa, Dia das Mães/Pais, festa junina, Dia das Crianças e **aniversários da família**: tema e desafio especial.

**Recompensas para quem ganha (escolher):**
- Troféu da data no perfil, para sempre ("🎄 Campeão do Natal 2026"), numa estante de troféus e ao lado do nome no ranking.
- Bloco/tema exclusivo da data (1º lugar ganha o completo; quem jogou ganha uma versão simples).
- Coroa 👑 por 7 dias (sala, chat e ranking).
- Escolher o modo do Desafio do dia seguinte ("hoje quem escolheu foi…").
- Recado do campeão no menu para todo mundo no dia seguinte.

**Aniversário:** bônus de presente para o aniversariante, ou todo mundo joga para somar pontos para ele.

**Decidido:** recompensa = **troféu no perfil** (para sempre, na estante de troféus). Depende da página de perfil (seção 5b).
**Em aberto:** onde cadastrar os aniversários (na página de perfil?); quem jogou mas não ganhou leva algo?

---

## 5b. 👤 Página de perfil ⭐🧪 (estudar melhor depois)
Hoje o "perfil" é só um quadro dentro das Configurações (apelido, foto, bordões, PIN), e a foto fica só no aparelho. Para ter troféu, precisa de uma **tela de perfil de verdade**.

**O que teria:**
- **Topo:** foto grande, nome, desde quando joga, 🔥 dias seguidos no Desafio do dia.
- **Estante de troféus 🏆:** troféus das datas especiais, 1º lugares no Desafio do dia, vitórias do mês; troféu que ainda não tem aparece apagado (dá vontade de ganhar).
- **Números:** recorde, maior combo, estrelas da campanha, conquistas (x/y), desafios a distância ganhos.
- **Rivalidade:** placar contra cada pessoa da família (dos desafios a distância e duelos).
- **Editar:** apelido, foto, bordões e PIN saem das Configurações e vêm para cá.

**Como abrir:** sua foto no topo do menu abre o seu; tocar no nome de alguém no ranking, na sala ou nos desafios abre o perfil dela (só para ver).

**Por baixo:**
- Troféus das datas e 1º lugares podem sair do ranking do Desafio do dia que já está no banco (não precisa guardar à parte), mas um troféu "oficial" gravado no banco evita discussão se o ranking mudar.
- Para os outros verem a sua foto e os números, a foto e um resumo precisam ir para a nuvem (junto com o progresso do PIN).

**Em aberto:** ver o perfil dos outros (sim/não); subir a foto para a nuvem; o que mais entra (conquistas detalhadas? histórico de partidas?).

---

## 6. 👀 Assistir quem está jogando agora ⭐🧪
Ver ao vivo a partida de alguém da família, **só se a pessoa deixar**.
- **Permissão no Perfil:** "Deixar a família me assistir": nunca · perguntar a cada vez · sempre.
- **"Jogando agora"** no menu: bolinha verde em quem está online e em que está jogando (Sozinho, Desafio do dia, Campanha fase 3…).
- **Quem joga vê** "👀 Fulano está assistindo" e pode recusar ou fechar a qualquer hora.
- **Torcida:** quem assiste manda emojis/aplausos que aparecem na tela de quem joga (dá para desligar).
- Combina com o aviso "Fulano está quase batendo o recorde, venha assistir".

**Como daria para fazer (do mais simples ao mais fino):**
1. Quem joga manda um "retrato" pequeno da partida (tabuleiro, peças, pontos; já existe algo assim no `npcState`/`boardStr`) para o Supabase a cada 1–2 s; quem assiste lê no mesmo ritmo e o jogo anima. Reaproveita a tela do espectador (`specRender`). Atraso de 1–2 s.
2. Mais tarde, trocar por tempo real (Supabase Realtime ou WebRTC como a sala), sem atraso.
- "Online agora": o jogo avisa o banco a cada ~30 s que está aberto.
- Precisa de tabela nova no banco (presença + retrato) e respeitar o PIN do nome.

---

## 7. 🏰 Território ✅ feito na 1.27
Cada um joga no **seu tabuleiro**, mas existe um **mapa de território igual em todos os tabuleiros** (o chão por baixo das peças, com as mesmas marcações em todos).

**Formatos:**
- 1 contra 1.
- 2 contra 2, cada um no seu tabuleiro.
- Dupla com tela dividida contra dupla com tela dividida (um tabuleiro por dupla).

**Regras (já definidas):**
- Limpou uma linha ou coluna → as casas dela no mapa mudam:
  - neutra → fica da sua cor;
  - da cor do adversário → volta a ser **neutra**;
  - já da sua cor → continua sua.
  - Ou seja, para tomar uma casa do rival é preciso limpar aquela linha/coluna duas vezes.
- Vale para todos os tabuleiros ao mesmo tempo (a linha 3 limpa no meu tabuleiro muda a linha 3 do mapa de todo mundo).
- **Fim:** quando o tempo acaba ou o tabuleiro fica todo pintado. Ganha quem tiver mais casas.
- **Travou, perdeu:** se o jogador trava, perde, não importa quantas casas tem. Em dupla, o time só perde quando **os dois** travarem.

**Decidido depois:**
- **Fim por pintura:** só quando o tabuleiro inteiro fica **de uma cor só**.
- **Dupla:** quando um trava, o parceiro **continua sozinho** até o fim.
- **Barra ao vivo** com as cores de cada lado mostrando quem tem mais casas.
- **Bloco de tinta 🎨** (só com a opção Ataques ligada): limpar 3+ linhas de uma vez manda um bloco de tinta para o tabuleiro do adversário. Se ele não limpar a linha/coluna do bloco a tempo, o bloco **explode e pinta as casas em volta no mapa** com a cor de quem mandou.

**Decidido e feito na 1.27** (código em `js/30-territorio.js`, mapa `TMAP` desenhado no `bDraw` do `06-board.js`):
- 1×1 e times (cada um no seu tabuleiro): estilo `terr` da sala (vira `startDuel` tipo `live` com `opts.terr`) e contra o robô no Sozinho (`soloOpts.terr`, um ou outro com o Cabo de guerra). A TV mostra o mapa e a barra.
- **Quem criou a sala é o dono do mapa:** cada celular manda as linhas/colunas que limpou (`{t:'tr'}`), quem criou aplica na ordem que chegam e manda o mapa para todos (`{t:'tm'}`); no fim manda o mapa final (`{t:'tfim'}`) e todos contam as casas com ele (quem não recebe em 3 s conta com o seu).
- **Bloco de tinta:** explode depois de **3 jogadas** sem ser limpo (como a bomba-relógio, `c:-4` com `tp` = time de quem mandou), pinta **3×3 em volta** e vira casa de quem mandou **mesmo se era do rival** (é a recompensa por limpar 3+ linhas). Vai para o líder do outro lado, e o escudo bloqueia.
- **Os blocos mostram o mapa:** no Território as peças da bandeja ficam claras (sem cor, `NEUTC`); no tabuleiro o bloco fica da cor do dono da casa (azul/laranja) ou claro se ela é neutra, e troca de cor quando a casa muda (`terrCinza`/`terrKey` no `06-board.js`, também na TV pelo `specDraw`). Casa vazia fica com o chão colorido. (Antes era uma bolinha no canto do bloco; trocamos porque não ficou bom.) Por isso o Bônus de cor não vale no Território.
- Meta de pontos e Handicap não valem no Território. Os pontos continuam contando (gráfico, placar), mas quem ganha é o mapa.

- **Dupla com tela dividida:** estilo `tterr` da sala ("Território no tabuleiro dividido"), que vira um `tsplit` com `opts.terr`. Lá quem criou a sala já calcula tudo, então o mapa fica em `SH.H.tmap` e vai no `sync` (campo `tm`); a tinta vai junto com os blindados (o escudo do time bloqueia os dois). Quando um da dupla trava, o parceiro continua sozinho; o time inteiro travado perde na hora.

**Ainda em aberto:**
- Combo ou tabuleiro limpo pintam algo a mais?
- O robô ainda não pensa no mapa (só joga bem); dava para ele preferir linhas que tomam casas.

---

## 7b. 🪢 Cabo de guerra ✅ feito na 1.26
Duelo com uma corda no meio da tela; ganha quem puxar até o fim, ou quem estiver com a corda do seu lado quando o tempo acabar. Travou, perdeu (igual ao Território).

**Decidido e feito** (código em `js/29-cabo.js`):
- **A corda segue a diferença de pontos** (escolhido no lugar de "cada linha puxa X"). Ponta = **1.000 pontos de vantagem** (`CABO_PTS`). Começamos com 1.500, mas em partidas de robô contra robô do mesmo nível a corda quase não chegava na ponta em 3 minutos; com 1.000 ela anda mais.
- **Tranco:** com Ataques ligado, limpar 3+ linhas de uma vez manda os blindados como sempre e ainda soma 150 pontos de corda (15% do caminho, `CABO_TRANCO`). Os trancos não entram nos pontos da pessoa, só na corda.
- **Times:** com 2 pessoas é 1×1; com 3 a 6, Time Azul × Time Laranja (a mesma escolha de time dos Times ao vivo), somando pontos e trancos do time. O time só perde por travar quando todos travarem; quem trava fica assistindo.
- Meta de pontos e Handicap não valem no Cabo de guerra.
- Também dá para jogar contra o robô no Sozinho (opção 🪢 Cabo de guerra na caixa do robô), e a TV mostra a corda.

**Para pensar depois:** a ponta poderia crescer com o tempo de partida (os pontos sobem mais rápido no fim por causa dos combos).

---

## 8. 🗺️ Campanha: mundos novos (para bem depois)
Cada mundo apresenta um modo/modificador que já existe:
- **Fundo do mar:** bolhas que sobem (gravidade ao contrário).
- **Espaço:** modo Gravidade + meteoros que viram pedra.
- **Mundo do modo Cego** (caverna / casa mal-assombrada): só uma lanterna mostra parte do tabuleiro.
- **Festa junina:** fogueira que queima uma linha; bandeirinhas = bônus de cor.
- Outros encaixes possíveis: Vulcão (bombas), Corrida/estrada (morte súbita), Montanha (peças pesadas), mundo "Sem combo".

---

## 9. 💭 Outras ideias já levantadas (ainda não comentadas)
- Missões da semana · Liga da família (campeão da semana) · Desafio do dia em dupla
- Chefão em grupo (sala inteira contra um chefão com muita vida)
- Quebra-cabeça feito pela família (editor + link)
- Modo Zen · Modo "uma peça só" · Fase surpresa semanal na campanha
- Álbum de figurinhas dos mundos · Mascote que cresce
- Replay da melhor jogada · Torneio da noite (chave na TV) · Reações de voz
- Pega-pega de linhas · Mestre da sala (inspirou o técnico) · Revezamento · Aposta antes da partida
- Retrospectiva do ano · Placar de rivalidade (você × outra pessoa) · Cápsula do tempo do recorde
- Blocos com fotos da família · Cenário pelo horário/estação · Comemoração personalizada

## 10. 💭 Ideias novas (rodada 4)
- **Fantasma de ontem:** jogar com a miniatura da sua melhor partida rodando ao lado (com as mesmas peças).
- **Ajuste justo (handicap):** (já existe o modificador "Handicap": quem venceu começa com obstáculos; isto seria a versão automática) cada pessoa tem um nível de ajuda calculado pelo histórico (peças um pouco mais fáceis, um "salva-vidas"), para avô × neto ser parelho.
- **Peça da família:** cada um desenha a sua peça (até 5 casas) no perfil; ela aparece nas partidas da sala quando essa pessoa joga.
- **Peça rara:** peça brilhante rara (1 em 500); colocar dá bônus e entra numa coleção.
- **Peça misteriosa:** de vez em quando uma peça vem coberta "?" e só aparece quando você a pega.
- **Corrida:** sala inteira, o primeiro a limpar 20 linhas ganha.
- **Espelho:** na sala, cada linha que você limpa aparece espelhada como pedra no tabuleiro do vizinho.
- **Ajude alguém:** missão coletiva ("família, juntem 500 linhas esta semana para liberar o tema X").
- **Ao vivo no aviso:** "Fulano está quase batendo o recorde, venha assistir 📺" (abre o espectador).
- **Modo acessível:** cores com símbolos (daltônico), letras e peças maiores, menos animação.

## 11. ❌ Rodada 5: nenhuma escolhida (guardado só para não repetir)
- **Calendário do Advento 🎄:** de 1 a 24 de dezembro, uma caixinha por dia que abre ao jogar o Desafio do dia (figurinha, bloco, tema; dia 24 = prêmio maior). Liga com as datas especiais.
- **Partida por correspondência:** um tabuleiro da família que cada um joga uma bandeja por dia, na sua vez, com aviso no celular ("sua vez!"). Batata quente sem pressa.
- **Quebra-cabeça do dia:** rapidinho, uma jogada só ("limpe 3 linhas com essas peças"). Bom para quem não tem paciência para partida longa.
- **Bolão do dia:** de manhã, cada um aposta quem vai ganhar o Desafio do dia; quem acertar ganha estrelinha.
- **Roleta da noite:** na sala, uma roleta sorteia o estilo e os modificadores da próxima partida.
- **Mural da família:** foto do tabuleiro final das melhores partidas (recorde, combo gigante), com curtidas.
- **Evento relâmpago:** aviso "desafio de 1 minuto, vale até as 21 h"; quem fizer mais leva a coroa da noite.
- **Modo "na cama":** depois das 22 h, menos brilho, sem vibração e som baixinho (automático, dá para desligar).
- **Blocos que ensinam (crianças):** modo opcional com continhas ou letras nos blocos; limpar a linha certa dá bônus.

## 12. ❌ Rodada 6 descartada (guardado só para não repetir)
Draft de peças · Cartas de poder · Rei do morro · Troca de tabuleiro · Liga com subida e descida.

## 13. 💭 Rodada 7
- 🧪 **Impostor** (achamos interessante, mas precisa de muito refino; não sabemos se é legal ainda): co-op de 4 no tabuleiro único; um, em segredo, tenta fazer o time falhar sem ser descoberto. No fim, todos votam em quem era.
- **Tabuleiro que encolhe:** sala com vários jogadores; a cada minuto a borda vira pedra em todos os tabuleiros. Vence o último que não travar.
- **Escolher o alvo:** com 3+ jogadores, quem limpa escolhe para quem vai o ataque (dá para se vingar, fazer aliança...).
- **Cabo de guerra:** duelo com uma corda no meio da tela; cada linha puxa para o seu lado; ganha quem puxar até o fim.
- **Combo de dupla:** o combo do time só continua se os dois limparem linhas um depois do outro (revezando).
- **Rebater ataque:** quando chega um ataque, você tem 3 s para limpar uma linha e mandar de volta.
- **Tesouro escondido:** antes de começar, cada um esconde 3 tesouros no mapa; limpar a linha onde está um tesouro do rival rouba o tesouro.
