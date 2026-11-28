# Duelo de Blocos

Jogo de encaixar blocos (estilo 8×8) para a família, em PT-BR. Site estático publicado pelo GitHub Pages a partir da `main`. Sem build, sem npm, sem framework. Mantido só por IA.

## Como o código está organizado
`index.html` tem só o `<head>`, o HTML das telas (`.screen`, trocadas por `show(id)`) e as tags que carregam CSS e JS.
Os `js/NN-*.js` são scripts clássicos (não módulos), carregados **nesta ordem** e compartilhando o mesmo escopo global: um `const`/`function` de qualquer arquivo é visível nos outros.
- Código que **roda ao carregar** (fora de função) só pode usar o que foi definido no mesmo arquivo ou em arquivos anteriores. Dentro de funções/eventos tudo pode ser usado.
- Cada arquivo começa com `'use strict';` e um comentário de uma linha dizendo o que tem nele. Ao criar arquivo novo, siga isso e adicione a `<script src>` no fim do `index.html` na posição certa.
- Não pode haver nomes repetidos entre arquivos (vira erro ao carregar). Antes de criar um nome global, faça `grep`.

| Arquivo | Conteúdo |
|---|---|
| `js/01-engine.js` | Motor puro, sem DOM: `$`/`$$`, `N` (tamanho do tabuleiro), `NCOL`, `makeRng(seed)`, peças `BASE`, `genPiece`/`gen3`, `class Engine` (tabuleiro `b[y][x]`, encaixe, limpeza, pedras) |
| `js/02-core.js` | `store` (localStorage; em `?sim` usa memória), `SET` (configurações), `show`, `toast`, temas ganhos/dourados (`isGold`, `baseSkin`), texturas `TEX` |
| `js/03-blocks.js` | Desenho dos blocos em canvas por tema (`drawBlock`, `GOLD_DECO`), `applyLook()` aplica tema e skin |
| `js/04-audio.js` | `SFX`, rugidos, combos, sons do laboratório, voz (`voz/*.mp3` opcional + gravações do perfil) |
| `js/05-menus.js` | Partículas, opções e códigos de desafio (`TIMES`, `enc4`/`dec4`, `TYPE_HINT`, desenho de cada estilo `modePic`, etapas da progressão `rampEditor`/`rampOf`), placar da noite, histórico, recordes, configurações, perfil |
| `js/06-board.js` | Tabuleiro em canvas (`setN`, `renderBoard`, `CELL`), cenário dos mundos, marcações, animações de limpeza, bandeja e arraste (`drag`, `IN`) |
| `js/07-duel.js` | HUD, DUELO local/ao vivo (`D`, `startDuel`, `duelIN`), poderes e ataques, placar final, pausa/saída |
| `js/08-solo.js` | Modo Sozinho (`startSolo`) e fluxo offline por código |
| `js/09-net.js` | WebRTC + QR (`NET`, `send`, `sendTo`, `encodeSig`/`decodeSig`, `scan`), sala até 6 jogadores, mensagens (`hostMsg`, `guestMsg`, `common`), `hostStart`, abas da sala |
| `js/10-shared.js` | Tabuleiro único (`SH`, `startShared`, `sharedIN`): co-op, dividido, versus, times; martelo, marcar, peça guardada da equipe |
| `js/11-bosses.js` | Chefões (SVGs `*_SVG`, `BOSSES`), falas, vida, animações (`bossShow`) |
| `js/12-campaign.js` | Campanha: `CWORLDS` (mundos → `phases`), `CWD(w)`, regras de cada fase (`campHook`), `campScale`, `makePuzzle`, estrelas (`ck`), mapa |
| `js/13-spectator.js` | Modo espectador (TV): `specMsg`, `specRender` |
| `js/14-main.js` | Inicialização e modo teste (`simAdd`, `simBoot`, `simBot`) |
| `js/15-npc.js` | Duelo contra o robô no Sozinho (`startNpc`, `NPC`, `npcHear`): é um duelo ao vivo (`D.cfg.npc`) com adversário `'npc'`; o `send` desvia para o robô quando não há sala |
| `js/16-ranking.js` | Ranking online no Supabase (`SUPA_URL`/`SUPA_KEY`; vazio = desligado): recorde por fase da campanha (`rkCampEnd`, `rkPhaseBox`), ranking geral (`rkOpenGeneral`), fila de envio offline (`ddb_rkq`), ranking do Desafio do dia por dia e vitórias do mês (`rkDailyBox`, `rkDailyEnd`). Banco: `supabase/ranking.sql`, `supabase/quebra-cabeca-tempo.sql` (fases 7 por tempo desde a 1.14; no `ddb_rkbest` a chave delas ganha `t`) e `supabase/diario-e-recordes.sql` (avisos de recorde batido, 1º lugar do dia e aviso de manhã via pg_cron) |
| `js/17-desafio.js` | Desafio a distância, melhor de 5 (Supabase; usa `rkFetch`/`rkQueue`): tela `#chal`, aberta pelo topo de "Jogar com alguém" (`dsList`, jogadores para desafiar em `dsRenderPeople`), cartão (`dsOpen`), rodada é um `startDuel` com `type:'chal'` (`dsPlay`, `dsRoundEnd`), aviso por WhatsApp (`dsShare`), link `?d=id` (`dsFromLink`). Banco: `supabase/desafios.sql` |
| `js/18-sala-link.js` | Sala por link: guarda oferta/resposta do WebRTC no Supabase (`slSend` de quem cria, `slFromLink` de quem abre `?s=id`). Banco: `supabase/salas.sql` |
| `js/19-avisos.js` | Avisos no celular (Web Push, sem instalar): `sw.js` na raiz recebe e mostra; `avAtivar` inscreve o aparelho (`salvar_inscricao`), `PUSH_KEY` é a chave pública. Os avisos são montados no banco (`mandar_avisos`, que também guarda o histórico em `avisos_log`) e enviados pela função `supabase/functions/avisar` (publicada como `swift-endpoint`). Sino 🔔 do menu com o histórico: `avBellLoad`, `avBellOpen`; `avGo(url)` abre o que o aviso fala. Banco: `supabase/avisos.sql` e `supabase/historico-avisos.sql` |
| `js/20-pin.js` | PIN do nome e progresso na nuvem: janela do PIN (`pinAbrir`, `pinEnviar`), `pinGarantir(cb)` antes de gravar com o nome, quadro no Perfil (`pinRender`), sincronização (`pgSync`; chaves em `PG_KEYS` no `02-core.js`, e o `store.set` delas, quando o valor muda, chama `pgAgendar`, que marca `ddb_pglocal`/`ddb_pgsujo`/`ddb_pgoff`). Se jogou sem internet, os dois lados mudaram ou é a primeira vez do aparelho com aquela nuvem (`ddb_pgrev` = versão com que está em dia), pergunta qual fica (`pgPerguntar`/`pgEscolher`: este aparelho, nuvem ou juntar pelo melhor em `pgMerge`), com a data de cada lado. O token fica em `ddb_pins` e vai no cabeçalho `x-pin` em `rkFetch` (`pinTok`); pedidos recusados por falta de PIN ficam em `ddb_rkpin` até entrar. Banco: `supabase/pin-e-progresso.sql` (`salvar_jogador` e `jogar_rodada` conferem o PIN com `rk_dono`). Trocar o nome (`nickDefinir` no Perfil e na sala → `trocar_nome`; `nickAdotar` passa PIN/avisos/fila para o nome novo, também quando `pin_estado` diz `trocado`). Quem cuida do jogo: `contas.adm` no banco, `souAdm()`/`admConferir()` aqui (`ddb_adm`); "ADM" no nome só para ele (`nickTemAdm`, `rk_tem_adm`). Nome novo não pode ser quase igual a outro (`rk_base`: sem acento/maiúscula/espaço extra). Banco: `supabase/sugestoes-e-nomes.sql` |
| `js/21-chat.js` | Chat temporário da sala conectada (`CHAT`, só na memória): mensagem `{t:'chat',x}` pela conexão da sala (quem criou carimba `from` e repassa em `hostMsg`; chega em `common` → `chatRecv`), fica fixo na aba Sala (`#chatHome`); na partida o botão `.chatb` da barra de emojis (`chatBtn` em `emoBtns`) abre o painel `#chatOv` (`chatAbrir`/`chatFechar` mudam `#chatBody` de lugar), `chatEnviar`, número de novas (`chatBadge`). Quem criou manda a conversa para quem entra depois (`chatHistPara` no `hello` → `chatHist`). `closeNet` apaga tudo (`chatLimpar`) |
| `js/22-ja.js` | Dicionário português → japonês (`JA`): chave = texto como aparece na tela, com `{}` no lugar do que muda (e `{v}`, `{limit}`… das metas da campanha); na tradução `{}` segue a ordem e `{1}`, `{2}`… escolhem a lacuna; `null` = não traduzir |
| `js/23-idioma.js` | Idioma (`SET.lang`, `LANG`): com japonês, traduz na tela tudo que aparece (`trTxt`; observa a página com `MutationObserver`, inclusive `placeholder`/`title`/`aria-label`, `confirm`/`alert`). Texto montado aos pedaços é traduzido por partes (" · ", ", ", frases, emoji na frente, número no fim). `data-notr` = não traduzir. Escolha nas Configurações (`renderIdioma`, recarrega a página) |
| `js/24-novidades.js` | Tela "✨ Novidades" (`#news`, botão `#goNews` no menu): lê o `CHANGELOG.md` do site e mostra um cartão por versão (`novParse`, `novRender`); `ddb_novVisto` guarda a última versão vista (pontinho vermelho no botão) |
| `js/25-instalar.js` | Instalar o jogo (`manifest.webmanifest`, ícones em `img/`): botão `#goInstalar` do menu (`instRender`, `instTocar`; no Chrome usa `beforeinstallprompt`, no iPhone mostra o passo a passo) e registro do `sw.js`. O `sw.js` guarda no aparelho tudo que o `index.html` carrega (lê as tags dele ao instalar) e responde da internet primeiro, usando a cópia só sem internet ou com mais de 4 s de espera |
| `js/26-voltar.js` | Botão voltar do celular (`voltarAcao`): fecha a janela aberta, pausa a partida ou clica no `.back` da tela; no menu pede um segundo toque |
| `js/27-sugestoes.js` | Sugestões da família (tela `#sug`, botão `#goSug` com pontinho `#goSugDot`): lista com abas (`sugRender`), uma sugestão com conversa e quadro de quem cuida do jogo (`sugRenderUma`, `sugAdmSalvar`), nova (`sugNova`), `sugTela(id)` abre direto (avisos `?sug=id`). Etiquetas em `SUG_ET`. Banco: `supabase/sugestoes-e-nomes.sql` (`sugerir`, `sugestao_falar`, `sugestao_etiqueta`, `sugestao_curtir`, `sugestao_apagar`) |
| `js/28-tutorial.js` | Tutorial interativo "Como jogar" (tela `#tut`, botão `#goTut` com pontinho `#goTutDot`): aulas em `TUT_AULAS` (passos com tabuleiro de treino em texto `tab` + peças `tutP` + `meta`, parte do jogador na tela dividida `reg`, robô parceiro `par` (no tempo dele ou em turnos), adversário em miniatura `rival`, escolher a peça do outro `dar` (versus), martelo, pergunta `quiz` ou cartões `html`); só as casas que mudam são redesenhadas (`tutCasas`); botão `#tutNext` fixo no topo, usa a `Engine` de verdade num tabuleiro próprio em DOM (`tutBoardHTML`, arrastar `tutDown`/tocar `tutBoardTap`, `tutColocar`); aulas feitas em `ddb_tut` |
| `js/29-cabo.js` | Cabo de guerra: duelo ao vivo com times (`D.teams`) e `D.o.cabo`; a corda segue a diferença de pontos + trancos (`caboVal`, `caboForca`; ponta `CABO_PTS`, tranco `CABO_TRANCO`, que vai no `st` como `tc` e no `info` como `tranco`), fim pela ponta ou pelo outro lado inteiro travado (`caboCheck` → `caboWin`/`caboLose`/`caboTravou`/`caboSaiu`), resultado igual em todos e na TV (`caboResult`), barra `#cabo` (`caboRender`, `caboBarSet`). Na sala é o tipo `cabo` (vira `startDuel` tipo `live` com `opts.cabo`); contra o robô, `soloOpts.cabo` |
| `css/base.css` | Variáveis de tema em `:root[data-app=…]` (padrão `toy`; o mesmo bloco vale para `.tpv[data-t=…]`, a miniatura de cada tema nas Configurações; cores do menu em `--m1`…`--m4`), menu inicial, layout, blocos, jogo |
| `css/worlds.css` | Visual de cada mundo (`:root[data-world=…]`) e animações de limpeza por skin |
| `css/ui.css` | Efeitos, sobreposições, histórico, conexão, abas da sala, estrelinha dourada |

## Glossário rápido
- Tipos de partida (`type`): `solo`, `daily` (Desafio do dia: modo único, tempo por peça que aperta em `RAMP`, dia de Brasília em `diaBR`), `chal` (rodada de desafio a distância), `duel`/`live` (cada um no seu tabuleiro), `versus`, `coop`, `halves`, `camp`, `tlive`/`tsplit` (times), `cabo` (cabo de guerra, na sala; dentro da partida é `live` com `D.o.cabo`).
- `D` = estado da partida de duelo/solo; `SH` = estado do tabuleiro único; `IN` = a interface de entrada ativa (`duelIN` ou `sharedIN`: `piece`, `canDrag`, `check`, `drop`, `tap`, `toHold`).
- `NET.role`: `'A'` é quem criou a sala, `'S'` é o espectador, os outros são ids de convidado. Quem criou é o dono da verdade e repassa (`relay`).
- Fase da campanha (`def`): `goal` (`lines`, `score`, `clear`, `golds`, `combo`, `empty`, `survive`, `harvest`, `petals`, `boss`), `setup` (`stones`, `golds`, `gum`, `ice`, `bamboo`, `puzzle`), `st` = regra das estrelas (`by`, `two`, `three`).
- Valores especiais de cor no tabuleiro (`v.c` negativo) = pedras, ouro, chiclete etc.; veja `cellColor`.

## Ideias e plano
`IDEIAS.md` (raiz) guarda o brainstorm de novidades: o plano consolidado no topo (ordem, tamanho, o que falta decidir) e o detalhe de cada ideia, inclusive as regras já combinadas e as ideias descartadas (para não sugerir de novo). Antes de começar uma novidade do plano, leia a seção dela; ao implementar ou decidir algo, atualize o arquivo. Ele não é carregado pelo jogo e mudar só ele não sobe a versão.

## Versões
- `VERSAO` e `VERSAO_DATA` ficam no topo de `js/02-core.js` e aparecem no rodapé do menu. Toda mudança que vai para a `main` sobe a versão (1.x para novidade, 1.x.y para correção) e ganha uma linha em `CHANGELOG.md` — que o jogo mostra na tela "✨ Novidades": mantenha o formato (`## 1.x · data` e itens `- emoji **Título:** texto`, escritos para o jogador).

## Convenções
- Código denso, de propósito: funções curtas numa linha só quando cabem. Não minifique nem encurte nomes; não reformate trechos que não está mudando.
- Comentários e textos para o jogador em português, sem jargão.
- O jogo tem japonês (`js/22-ja.js`). Depois de criar ou mudar texto para o jogador, rode `python3 ferramentas/textos-sem-traducao.py` e acrescente a tradução do que ele listar.
- Tudo funciona offline e no celular (toque). Canvas usa `dpr`; respeite `SET.lite` (aparelhos fracos).

## Como testar
- Servir a pasta: `python3 -m http.server` e abrir `index.html` (o Playwright já está instalado no ambiente).
- Como os scripts são globais, dá para chamar funções direto no `page.evaluate` (ex.: `startSolo(...)`, jogar com `IN.drop(s,r,c)`).
- Modo teste do jogo: tocar 7 vezes no título das Configurações. Com ele ligado, na sala criada, `simAdd()` coloca um aparelho de mentira (o próprio jogo em iframe com `?sim=n`, jogando sozinho).
- Depois de mudar algo, confira que a página carrega sem `pageerror`.
