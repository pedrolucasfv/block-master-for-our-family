-- Sala por link (jogar conectado estando longe). Rode depois de ranking.sql: "SQL Editor" → "New query", cole tudo e "Run".
-- Cada convite guarda o código de quem criou a sala (oferta) e a resposta de quem abriu o link. Convites com mais de 1 dia são apagados sozinhos.

create table if not exists salas (
  id text primary key,
  oferta text not null,
  resposta text,
  criado timestamptz not null default now()
);
alter table salas enable row level security;
drop policy if exists "todos leem" on salas;
create policy "todos leem" on salas for select using (true);

create or replace function criar_sala(p_oferta text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if length(p_oferta) not between 10 and 20000 then raise exception 'código inválido'; end if;
  delete from salas where criado < now() - interval '1 day';
  v_id := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  insert into salas(id, oferta) values (v_id, p_oferta);
  return v_id;
end $$;

create or replace function responder_sala(p_id text, p_resposta text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(p_resposta) not between 10 and 20000 then raise exception 'código inválido'; end if;
  update salas set resposta = p_resposta where id = p_id and resposta is null and criado > now() - interval '1 day';
end $$;

revoke all on function criar_sala(text) from public;
revoke all on function responder_sala(text,text) from public;
grant execute on function criar_sala(text) to anon, authenticated;
grant execute on function responder_sala(text,text) to anon, authenticated;
grant select on salas to anon, authenticated;
