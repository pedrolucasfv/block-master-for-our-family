# Ideias para o Duelo de Blocos (brainstorm)

Plano vivo do brainstorm. **Nada aqui está implementado.** Quando o brainstorm terminar, juntamos tudo num plano de execução (ordem, tamanho, dependências).

Legenda: ⭐ escolhida pelo Pedro · 🧪 precisa refinar · 💭 só ideia (ainda não comentada)

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
Objetivo do Pedro: algo **robusto, que ajude a pessoa a melhorar de verdade**, mesmo o jogo sendo aleatório.

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

**Em aberto:** qual recompensa (ou combinação); onde cadastrar os aniversários (perfil?).

---

## 6. 💭 Outras ideias já levantadas (ainda não comentadas)
- Missões da semana · Liga da família (campeão da semana) · Desafio do dia em dupla
- Chefão em grupo (sala inteira contra um chefão com muita vida)
- Quebra-cabeça feito pela família (editor + link)
- Modo Zen · Modo "uma peça só" · Fase surpresa semanal na campanha
- Álbum de figurinhas dos mundos · Mascote que cresce
- Replay da melhor jogada · Torneio da noite (chave na TV) · Reações de voz
- Pega-pega de linhas · Mestre da sala (inspirou o técnico) · Revezamento · Aposta antes da partida
- Retrospectiva do ano · Placar de rivalidade (você × vovô) · Cápsula do tempo do recorde
- Blocos com fotos da família · Cenário pelo horário/estação · Comemoração personalizada

## 7. 💭 Ideias novas (rodada 4)
- **Fantasma de ontem:** jogar com a miniatura da sua melhor partida rodando ao lado (com as mesmas peças).
- **Ajuste justo (handicap):** cada pessoa tem um nível de ajuda calculado pelo histórico (peças um pouco mais fáceis, um "salva-vidas"), para avô × neto ser parelho.
- **Peça da família:** cada um desenha a sua peça (até 5 casas) no perfil; ela aparece nas partidas da sala quando essa pessoa joga.
- **Peça rara:** peça brilhante rara (1 em 500); colocar dá bônus e entra numa coleção.
- **Peça misteriosa:** de vez em quando uma peça vem coberta "?" e só aparece quando você a pega.
- **Corrida:** sala inteira, o primeiro a limpar 20 linhas ganha.
- **Espelho:** na sala, cada linha que você limpa aparece espelhada como pedra no tabuleiro do vizinho.
- **Ajude alguém:** missão coletiva ("família, juntem 500 linhas esta semana para liberar o tema X").
- **Ao vivo no aviso:** "a Lúcia está quase batendo o recorde, venha assistir 📺" (abre o espectador).
- **Novos mundos:** Fundo do mar (bolhas que sobem, gravidade ao contrário), Espaço (meteoros que viram pedra), Festa junina (fogueira que queima uma linha).
- **Modo acessível:** cores com símbolos (daltônico), letras e peças maiores, menos animação.
