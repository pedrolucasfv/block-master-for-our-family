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

-- ===== Link da sala (1.18): um link só, que serve para todo mundo enquanto a sala estiver aberta =====
-- Pode rodar de novo sem problema. Quem criou a sala deixa sempre um código (oferta) esperando o próximo;
-- quando alguém responde, ele conecta essa pessoa e põe um código novo (n sobe). "visto" = última vez que quem criou deu sinal de vida.
alter table salas add column if not exists n int not null default 0;
alter table salas add column if not exists visto timestamptz;
alter table salas add column if not exists chave text; -- md5 da chave de quem criou (só ele troca o código ou fecha a sala)

create or replace function abrir_sala(p_oferta text) returns json
language plpgsql security definer set search_path = public as $$
declare v_id text; v_chave text;
begin
  if length(p_oferta) not between 10 and 20000 then raise exception 'código inválido'; end if;
  delete from salas where criado < now() - interval '1 day';
  v_id := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  v_chave := md5(random()::text || clock_timestamp()::text || v_id);
  insert into salas(id, oferta, visto, chave) values (v_id, p_oferta, now(), md5(v_chave));
  return json_build_object('id', v_id, 'chave', v_chave);
end $$;

-- quem criou põe o código para o próximo que abrir o link; devolve o número da vez
create or replace function nova_vaga(p_id text, p_chave text, p_oferta text) returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if length(p_oferta) not between 10 and 20000 then raise exception 'código inválido'; end if;
  update salas set oferta = p_oferta, resposta = null, n = n + 1, visto = now(), criado = now()
    where id = p_id and chave = md5(p_chave) returning n into v_n;
  if v_n is null then raise exception 'sala fechada'; end if;
  return v_n;
end $$;

create or replace function sala_viva(p_id text, p_chave text) returns void
language sql security definer set search_path = public as $$
  update salas set visto = now(), criado = now() where id = p_id and chave = md5(p_chave);
$$;

create or replace function fechar_sala(p_id text, p_chave text) returns void
language sql security definer set search_path = public as $$
  delete from salas where id = p_id and chave = md5(p_chave);
$$;

-- quem abriu o link responde ao código da vez p_n: 'ok', 'ocupado' (outra pessoa respondeu antes; tente de novo) ou 'fechada'
create or replace function responder_vaga(p_id text, p_n int, p_resposta text) returns text
language plpgsql security definer set search_path = public as $$
declare s salas;
begin
  if length(p_resposta) not between 10 and 20000 then raise exception 'código inválido'; end if;
  select * into s from salas where id = p_id;
  if not found or s.criado < now() - interval '1 day' then return 'fechada'; end if;
  if s.chave is not null and s.visto < now() - interval '3 minutes' then return 'fechada'; end if;
  update salas set resposta = p_resposta where id = p_id and n = p_n and resposta is null;
  if found then return 'ok'; end if;
  return case when s.chave is null then 'fechada' else 'ocupado' end; -- convite antigo (de uma pessoa só) já usado
end $$;

revoke all on function abrir_sala(text) from public;
revoke all on function nova_vaga(text,text,text) from public;
revoke all on function sala_viva(text,text) from public;
revoke all on function fechar_sala(text,text) from public;
revoke all on function responder_vaga(text,int,text) from public;
grant execute on function abrir_sala(text) to anon, authenticated;
grant execute on function nova_vaga(text,text,text) to anon, authenticated;
grant execute on function sala_viva(text,text) to anon, authenticated;
grant execute on function fechar_sala(text,text) to anon, authenticated;
grant execute on function responder_vaga(text,int,text) to anon, authenticated;
