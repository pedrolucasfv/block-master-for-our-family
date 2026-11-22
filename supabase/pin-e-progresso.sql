-- Versão 1.9: PIN de 4 dígitos ligado ao nome e progresso guardado na nuvem.
-- Rode depois de todos os outros (ranking, desafios, avisos, fotos, diario-e-recordes, historico-avisos): "SQL Editor" → "New query", cole tudo e "Run". Pode rodar de novo sem problema.
--
-- Como funciona:
--   • Quem cria um PIN "fecha" o nome: daí em diante, só grava com esse nome (ranking, desafios, foto, avisos, progresso) o aparelho que entrou com o PIN.
--   • Ao acertar o PIN, o aparelho recebe uma senha longa e aleatória ("token"), que o jogo guarda e manda escondida em cada pedido (cabeçalho x-pin).
--     Assim o PIN de 4 dígitos só é conferido num lugar (entrar_pin), que trava depois de 5 erros.
--   • Nomes que ainda não têm PIN continuam funcionando como antes, até alguém criar o PIN deles.
--   • Ninguém de fora consegue ler as tabelas contas, sessoes e progresso (sem regra de leitura); tudo passa pelas funções abaixo.
--
-- Alguém esqueceu o PIN? Rode (trocando o nome, em minúsculas):   delete from contas where chave = 'nome';
--   O nome volta a ficar sem PIN (o progresso na nuvem continua guardado) e a pessoa cria um PIN novo no jogo.

create table if not exists contas (
  chave text primary key references jogadores(chave) on delete cascade,
  sal text not null,
  pin_hash text not null,                 -- sha256(sal || pin): o PIN em si não fica guardado
  erros int not null default 0,           -- PINs errados seguidos
  bloqueado_ate timestamptz,
  criado timestamptz not null default now()
);
create table if not exists sessoes (
  token text primary key,                 -- 64 letras aleatórias, guardadas no aparelho
  chave text not null references contas(chave) on delete cascade,
  criado timestamptz not null default now()
);
create index if not exists sessoes_chave on sessoes(chave, criado desc);
create table if not exists progresso (
  chave text primary key references jogadores(chave) on delete cascade,
  dados jsonb not null,                   -- estrelas, temas ganhos e dourados, conquistas, recordes (o jogo monta e junta)
  rev int not null default 1,             -- sobe a cada gravação: evita que um celular apague o que o outro acabou de gravar
  atualizado timestamptz not null default now()
);
alter table contas enable row level security;
alter table sessoes enable row level security;
alter table progresso enable row level security;
revoke all on contas, sessoes, progresso from anon, authenticated;

create or replace function pin_hash(p_sal text, p_pin text) returns text language sql immutable as $$
  select encode(sha256(convert_to(p_sal || p_pin, 'UTF8')), 'hex') $$;
revoke all on function pin_hash(text,text) from public, anon, authenticated;

/* token mandado pelo jogo no cabeçalho x-pin (vazio quando não veio) */
create or replace function pin_token() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-pin', '') $$;

/* confere se quem chama pode usar este nome: se o nome tem PIN, precisa do token certo. p_exigir: sem PIN também não pode (progresso na nuvem). */
create or replace function rk_dono(p_chave text, p_exigir boolean default false) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if exists (select 1 from contas where chave = p_chave) then
    if not exists (select 1 from sessoes where token = pin_token() and chave = p_chave) then raise exception 'pin: este nome tem PIN'; end if;
  elsif p_exigir then raise exception 'pin: este nome ainda não tem PIN';
  end if;
end $$;
revoke all on function rk_dono(text,boolean) from public, anon, authenticated;

-- ===== todo gravar com nome passa por salvar_jogador (recordes, Desafio do dia, desafios, foto, avisos): a conferência do PIN fica aqui =====
create or replace function salvar_jogador(p_nome text, p_estrelas int, p_solo int) returns void
language plpgsql security definer set search_path = public as $$
begin
  p_nome := btrim(p_nome);
  if p_nome = '' or length(p_nome) > 16 then raise exception 'nome inválido'; end if;
  if p_estrelas < 0 or p_estrelas > 1000 or p_solo < 0 or p_solo > 10000000 then raise exception 'valor inválido'; end if;
  perform rk_dono(rk_chave(p_nome));
  insert into jogadores(chave, nome, estrelas, solo) values (rk_chave(p_nome), p_nome, p_estrelas, p_solo)
  on conflict (chave) do update set nome = excluded.nome,
    estrelas = greatest(jogadores.estrelas, excluded.estrelas),
    solo = greatest(jogadores.solo, excluded.solo), atualizado = now();
end $$;
revoke all on function salvar_jogador(text,int,int) from public;
grant execute on function salvar_jogador(text,int,int) to anon, authenticated;

-- jogar_rodada é a única que grava com nome sem passar por salvar_jogador: igual à de desafios.sql, mais a conferência do PIN
create or replace function jogar_rodada(p_id text, p_nome text, p_rodada int, p_pontos int) returns void
language plpgsql security definer set search_path = public as $$
declare d desafios; v_lado text; v_i int; r jsonb; wa int := 0; wb int := 0; n int;
begin
  if p_pontos not between 0 and 10000000 then raise exception 'valor inválido'; end if;
  perform rk_dono(rk_chave(p_nome));
  select * into d from desafios where id = p_id for update;
  if not found then raise exception 'desafio não existe'; end if;
  v_lado := case when d.a = rk_chave(p_nome) then 'a' when d.b = rk_chave(p_nome) then 'b' end;
  n := jsonb_array_length(d.rodadas);
  if v_lado is null or d.vez <> v_lado or p_rodada <> n then raise exception 'não é sua vez'; end if;
  v_i := case when v_lado = 'a' then 0 else 1 end;
  d.rodadas := jsonb_set(d.rodadas, array[(n-1)::text, v_i::text], to_jsonb(p_pontos));
  if v_lado = 'a' then
    d.vez := 'b';
  else
    for r in select * from jsonb_array_elements(d.rodadas) loop
      if (r->>0)::int > (r->>1)::int then wa := wa + 1; elsif (r->>1)::int > (r->>0)::int then wb := wb + 1; end if;
    end loop;
    if wa >= 3 or wb >= 3 or n >= 9 then
      d.vez := 'fim'; d.vencedor := case when wa > wb then 'a' when wb > wa then 'b' else 'empate' end;
    else
      d.rodadas := d.rodadas || '[[null,null]]'::jsonb; d.vez := 'a';
    end if;
  end if;
  update desafios set rodadas = d.rodadas, vez = d.vez, vencedor = d.vencedor, atualizado = now() where id = p_id;
end $$;
revoke all on function jogar_rodada(text,text,int,int) from public;
grant execute on function jogar_rodada(text,text,int,int) to anon, authenticated;

-- ===== PIN =====
/* situação de um nome: 'com_pin', 'sem_pin' (já existe no ranking, sem PIN) ou 'livre' (ninguém usa) */
create or replace function pin_estado(p_nome text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from contas c where c.chave = rk_chave(p_nome)) then jsonb_build_object('estado', 'com_pin')
    when exists (select 1 from jogadores j where j.chave = rk_chave(p_nome)) then jsonb_build_object('estado', 'sem_pin', 'estrelas', (select estrelas from jogadores where chave = rk_chave(p_nome)))
    else jsonb_build_object('estado', 'livre') end $$;

/* entra com o PIN (p_novo = false) ou cria o PIN de um nome que ainda não tem (p_novo = true).
   Responde {ok:true, token, nome} ou {ok:false, erro: 'formato' | 'nome' | 'tem_pin' | 'sem_pin' | 'errado' (com 'restam') | 'espera' (com 'minutos')}.
   Não usa "raise" nos erros de propósito: assim a contagem de PINs errados fica gravada. */
create or replace function entrar_pin(p_nome text, p_pin text, p_novo boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); c contas; v_tok text; v_sal text;
begin
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then return jsonb_build_object('ok', false, 'erro', 'formato'); end if;
  if coalesce(btrim(p_nome), '') = '' or length(btrim(p_nome)) > 16 then return jsonb_build_object('ok', false, 'erro', 'nome'); end if;
  select * into c from contas where chave = k for update;
  if p_novo then
    if found then return jsonb_build_object('ok', false, 'erro', 'tem_pin'); end if;
    perform salvar_jogador(p_nome, 0, 0);
    v_sal := replace(gen_random_uuid()::text, '-', '');
    insert into contas(chave, sal, pin_hash) values (k, v_sal, pin_hash(v_sal, p_pin)) on conflict (chave) do nothing;
    if not found then return jsonb_build_object('ok', false, 'erro', 'tem_pin'); end if;
  else
    if not found then return jsonb_build_object('ok', false, 'erro', 'sem_pin'); end if;
    if c.bloqueado_ate > now() then
      return jsonb_build_object('ok', false, 'erro', 'espera', 'minutos', ceil(extract(epoch from c.bloqueado_ate - now()) / 60));
    end if;
    if c.pin_hash <> pin_hash(c.sal, p_pin) then
      c.erros := c.erros + 1;
      /* a cada 5 erros seguidos: espera 15 min, depois 30, 60… (no máximo 1 dia) */
      update contas set erros = c.erros,
        bloqueado_ate = case when c.erros % 5 = 0 then now() + least(interval '15 minutes' * power(2, c.erros / 5 - 1), interval '1 day') end
      where chave = k;
      if c.erros % 5 = 0 then return jsonb_build_object('ok', false, 'erro', 'espera', 'minutos', least(15 * power(2, c.erros / 5 - 1), 1440)); end if;
      return jsonb_build_object('ok', false, 'erro', 'errado', 'restam', 5 - c.erros % 5);
    end if;
    update contas set erros = 0, bloqueado_ate = null where chave = k;
  end if;
  v_tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into sessoes(token, chave) values (v_tok, k);
  delete from sessoes where chave = k and token in (select token from sessoes where chave = k order by criado desc offset 20);  -- no máximo 20 aparelhos
  return jsonb_build_object('ok', true, 'token', v_tok, 'nome', (select nome from jogadores where chave = k));
end $$;

/* troca o PIN (precisa ter entrado com o PIN antigo neste aparelho). Os outros aparelhos vão pedir o PIN novo. */
create or replace function trocar_pin(p_nome text, p_pin text) returns void
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); v_sal text := replace(gen_random_uuid()::text, '-', '');
begin
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then raise exception 'PIN inválido'; end if;
  perform rk_dono(k, true);
  update contas set sal = v_sal, pin_hash = pin_hash(v_sal, p_pin), erros = 0, bloqueado_ate = null where chave = k;
  delete from sessoes where chave = k and token <> pin_token();
end $$;

/* sai do nome neste aparelho */
create or replace function sair_pin() returns void
language sql security definer set search_path = public as $$ delete from sessoes where token = pin_token() $$;

-- ===== progresso na nuvem (só para nome com PIN) =====
create or replace function ler_progresso(p_nome text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p progresso;
begin
  perform rk_dono(rk_chave(p_nome), true);
  select * into p from progresso where chave = rk_chave(p_nome);
  if not found then return jsonb_build_object('dados', null, 'rev', 0); end if;
  return jsonb_build_object('dados', p.dados, 'rev', p.rev, 'atualizado', p.atualizado);
end $$;

/* grava se ninguém gravou depois da leitura (p_rev = rev lido). Se outro celular gravou antes, devolve o que está lá para o jogo juntar e tentar de novo. */
create or replace function salvar_progresso(p_nome text, p_dados jsonb, p_rev int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); p progresso;
begin
  perform rk_dono(k, true);
  if jsonb_typeof(p_dados) <> 'object' or length(p_dados::text) > 300000 then raise exception 'progresso inválido'; end if;
  select * into p from progresso where chave = k for update;
  if coalesce(p.rev, 0) <> coalesce(p_rev, 0) then return jsonb_build_object('ok', false, 'dados', p.dados, 'rev', p.rev); end if;
  insert into progresso(chave, dados, rev) values (k, p_dados, 1)
  on conflict (chave) do update set dados = excluded.dados, rev = progresso.rev + 1, atualizado = now();
  return jsonb_build_object('ok', true, 'rev', coalesce(p.rev, 0) + 1);
end $$;

revoke all on function pin_estado(text) from public;
revoke all on function entrar_pin(text,text,boolean) from public;
revoke all on function trocar_pin(text,text) from public;
revoke all on function sair_pin() from public;
revoke all on function ler_progresso(text) from public;
revoke all on function salvar_progresso(text,jsonb,int) from public;
grant execute on function pin_estado(text) to anon, authenticated;
grant execute on function entrar_pin(text,text,boolean) to anon, authenticated;
grant execute on function trocar_pin(text,text) to anon, authenticated;
grant execute on function sair_pin() to anon, authenticated;
grant execute on function ler_progresso(text) to anon, authenticated;
grant execute on function salvar_progresso(text,jsonb,int) to anon, authenticated;
