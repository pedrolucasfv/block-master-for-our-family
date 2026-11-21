-- Ranking do Duelo de Blocos.
-- Cole tudo no Supabase em "SQL Editor" → "New query" e clique em "Run". Pode rodar de novo sem problema.
-- Quem joga só consegue LER as tabelas; gravar passa pelas funções abaixo, que só melhoram recordes (nunca apagam nem pioram).

create table if not exists jogadores (
  chave text primary key,              -- nome em minúsculas: a mesma pessoa em dois celulares conta uma vez só
  nome text not null,
  estrelas int not null default 0,     -- total de estrelas da campanha
  solo int not null default 0,         -- maior pontuação no modo Sozinho
  atualizado timestamptz not null default now()
);
create table if not exists recordes (
  chave text not null references jogadores(chave) on delete cascade,
  fase text not null,                  -- "mundo-fase", ex.: "3-8"
  estrelas int not null,
  valor numeric not null,              -- peças, segundos, linhas ou tentativas (depende da fase)
  menor boolean not null,              -- true: quanto menor o valor, melhor
  quando timestamptz not null default now(),
  primary key (chave, fase)
);
create index if not exists recordes_fase on recordes(fase);

alter table jogadores enable row level security;
alter table recordes enable row level security;
drop policy if exists "todos leem" on jogadores;
drop policy if exists "todos leem" on recordes;
create policy "todos leem" on jogadores for select using (true);
create policy "todos leem" on recordes for select using (true);

create or replace function rk_chave(p_nome text) returns text language sql immutable as $$ select lower(btrim(p_nome)) $$;

create or replace function salvar_jogador(p_nome text, p_estrelas int, p_solo int) returns void
language plpgsql security definer set search_path = public as $$
begin
  p_nome := btrim(p_nome);
  if p_nome = '' or length(p_nome) > 16 then raise exception 'nome inválido'; end if;
  if p_estrelas < 0 or p_estrelas > 1000 or p_solo < 0 or p_solo > 10000000 then raise exception 'valor inválido'; end if;
  insert into jogadores(chave, nome, estrelas, solo) values (rk_chave(p_nome), p_nome, p_estrelas, p_solo)
  on conflict (chave) do update set nome = excluded.nome,
    estrelas = greatest(jogadores.estrelas, excluded.estrelas),
    solo = greatest(jogadores.solo, excluded.solo), atualizado = now();
end $$;

create or replace function enviar_recorde(p_nome text, p_fase text, p_estrelas int, p_valor numeric, p_menor boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_fase !~ '^[0-9]{1,2}-[0-9]{1,2}$' or p_estrelas not between 1 and 3 or p_valor < 0 or p_valor > 100000 then raise exception 'valor inválido'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  insert into recordes(chave, fase, estrelas, valor, menor) values (rk_chave(p_nome), p_fase, p_estrelas, p_valor, p_menor)
  on conflict (chave, fase) do update set estrelas = excluded.estrelas, valor = excluded.valor, menor = excluded.menor, quando = now()
  where excluded.estrelas > recordes.estrelas
     or (excluded.estrelas = recordes.estrelas and (case when excluded.menor then excluded.valor < recordes.valor else excluded.valor > recordes.valor end));
end $$;

revoke all on function salvar_jogador(text,int,int) from public;
revoke all on function enviar_recorde(text,text,int,numeric,boolean) from public;
grant execute on function salvar_jogador(text,int,int) to anon, authenticated;
grant execute on function enviar_recorde(text,text,int,numeric,boolean) to anon, authenticated;
grant select on jogadores, recordes to anon, authenticated;
