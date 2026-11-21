-- Desafios a distância (melhor de 5). Rode depois de ranking.sql: no Supabase, "SQL Editor" → "New query", cole tudo e "Run". Pode rodar de novo sem problema.
-- Cada rodada: os dois jogam as mesmas peças, primeiro quem criou (a), depois o outro (b). Quem fizer 3 rodadas vence (no máximo 9 rodadas, por causa dos empates).

create table if not exists desafios (
  id text primary key,
  a text not null, a_nome text not null,   -- quem criou
  b text, b_nome text,                     -- quem aceitou (vazio até alguém abrir o link)
  tempo int not null,                      -- opção de tempo do jogo (0 = 2 min, 1 = 3 min, 2 = 5 min, 3 = sem limite)
  rodadas jsonb not null default '[[null,null]]',  -- [[pontos de a, pontos de b], ...]
  vez text not null default 'a',           -- 'a', 'b' ou 'fim'
  vencedor text,                           -- 'a', 'b' ou 'empate'
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists desafios_a on desafios(a);
create index if not exists desafios_b on desafios(b);
alter table desafios enable row level security;
drop policy if exists "todos leem" on desafios;
create policy "todos leem" on desafios for select using (true);

create or replace function criar_desafio(p_nome text, p_tempo int) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if p_tempo not between 0 and 3 then raise exception 'tempo inválido'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  v_id := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  insert into desafios(id, a, a_nome, tempo) values (v_id, rk_chave(p_nome), btrim(p_nome), p_tempo);
  return v_id;
end $$;

create or replace function entrar_desafio(p_id text, p_nome text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform salvar_jogador(p_nome, 0, 0);
  update desafios set b = rk_chave(p_nome), b_nome = btrim(p_nome), atualizado = now()
  where id = p_id and b is null and a <> rk_chave(p_nome);
end $$;

create or replace function jogar_rodada(p_id text, p_nome text, p_rodada int, p_pontos int) returns void
language plpgsql security definer set search_path = public as $$
declare d desafios; v_lado text; v_i int; r jsonb; wa int := 0; wb int := 0; n int;
begin
  if p_pontos not between 0 and 10000000 then raise exception 'valor inválido'; end if;
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

revoke all on function criar_desafio(text,int) from public;
revoke all on function entrar_desafio(text,text) from public;
revoke all on function jogar_rodada(text,text,int,int) from public;
grant execute on function criar_desafio(text,int) to anon, authenticated;
grant execute on function entrar_desafio(text,text) to anon, authenticated;
grant execute on function jogar_rodada(text,text,int,int) to anon, authenticated;
grant select on desafios to anon, authenticated;
