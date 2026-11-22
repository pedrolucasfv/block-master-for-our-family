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
| `js/05-menus.js` | Partículas, opções e códigos de desafio (`TIMES`, `enc4`/`dec4`, `TYPE_HINT`), placar da noite, histórico, recordes, configurações, perfil |
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
| `js/16-ranking.js` | Ranking online no Supabase (`SUPA_URL`/`SUPA_KEY`; vazio = desligado): recorde por fase da campanha (`rkCampEnd`, `rkPhaseBox`), ranking geral (`rkOpenGeneral`), fila de envio offline (`ddb_rkq`), ranking do Desafio do dia (`rkDailyBox`, `rkDailySync`). Banco: `supabase/ranking.sql` e `supabase/diario-e-recordes.sql` (avisos de recorde batido, 1º lugar do dia e aviso de manhã via pg_cron) |
| `js/17-desafio.js` | Desafio a distância, melhor de 5 (Supabase; usa `rkFetch`/`rkQueue`): tela `#chal`, aberta pelo topo de "Jogar com alguém" (`dsList`, jogadores para desafiar em `dsRenderPeople`), cartão (`dsOpen`), rodada é um `startDuel` com `type:'chal'` (`dsPlay`, `dsRoundEnd`), aviso por WhatsApp (`dsShare`), link `?d=id` (`dsFromLink`). Banco: `supabase/desafios.sql` |
| `js/18-sala-link.js` | Sala por link: guarda oferta/resposta do WebRTC no Supabase (`slSend` de quem cria, `slFromLink` de quem abre `?s=id`). Banco: `supabase/salas.sql` |
| `js/19-avisos.js` | Avisos no celular (Web Push, sem instalar): `sw.js` na raiz recebe e mostra; `avAtivar` inscreve o aparelho (`salvar_inscricao`), `PUSH_KEY` é a chave pública. Quem envia é a função `supabase/functions/avisar`, chamada pelo gatilho `avisar` da tabela `desafios` (pg_net). Banco: `supabase/avisos.sql` |
| `css/base.css` | Variáveis de tema em `:root[data-app=…]`, layout, blocos, jogo |
| `css/worlds.css` | Visual de cada mundo (`:root[data-world=…]`) e animações de limpeza por skin |
| `css/ui.css` | Efeitos, sobreposições, histórico, conexão, abas da sala, estrelinha dourada |

## Glossário rápido
- Tipos de partida (`type`): `solo`, `daily`, `chal` (rodada de desafio a distância), `duel`/`live` (cada um no seu tabuleiro), `versus`, `coop`, `halves`, `camp`, `tlive`/`tsplit` (times).
- `D` = estado da partida de duelo/solo; `SH` = estado do tabuleiro único; `IN` = a interface de entrada ativa (`duelIN` ou `sharedIN`: `piece`, `canDrag`, `check`, `drop`, `tap`, `toHold`).
- `NET.role`: `'A'` é quem criou a sala, `'S'` é o espectador, os outros são ids de convidado. Quem criou é o dono da verdade e repassa (`relay`).
- Fase da campanha (`def`): `goal` (`lines`, `score`, `clear`, `golds`, `combo`, `empty`, `survive`, `harvest`, `petals`, `boss`), `setup` (`stones`, `golds`, `gum`, `ice`, `bamboo`, `puzzle`), `st` = regra das estrelas (`by`, `two`, `three`).
- Valores especiais de cor no tabuleiro (`v.c` negativo) = pedras, ouro, chiclete etc.; veja `cellColor`.

## Versões
- `VERSAO` e `VERSAO_DATA` ficam no topo de `js/02-core.js` e aparecem no rodapé do menu. Toda mudança que vai para a `main` sobe a versão (1.x para novidade, 1.x.y para correção) e ganha uma linha em `CHANGELOG.md`.

## Convenções
- Código denso, de propósito: funções curtas numa linha só quando cabem. Não minifique nem encurte nomes; não reformate trechos que não está mudando.
- Comentários e textos para o jogador em português, sem jargão.
- Tudo funciona offline e no celular (toque). Canvas usa `dpr`; respeite `SET.lite` (aparelhos fracos).

## Como testar
- Servir a pasta: `python3 -m http.server` e abrir `index.html` (o Playwright já está instalado no ambiente).
- Como os scripts são globais, dá para chamar funções direto no `page.evaluate` (ex.: `startSolo(...)`, jogar com `IN.drop(s,r,c)`).
- Modo teste do jogo: tocar 7 vezes no título das Configurações. Com ele ligado, na sala criada, `simAdd()` coloca um aparelho de mentira (o próprio jogo em iframe com `?sim=n`, jogando sozinho).
- Depois de mudar algo, confira que a página carrega sem `pageerror`.
