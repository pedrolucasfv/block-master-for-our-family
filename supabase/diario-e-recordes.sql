-- Versão 1.7: ranking do Desafio do dia, aviso de manhã e "bateram seu recorde".
-- Rode depois de ranking.sql, desafios.sql e avisos.sql: "SQL Editor" → "New query", cole tudo e "Run".
-- Antes de rodar, troque COLOQUE_O_SEGREDO pelo valor do segredo AVISO_SEGREDO das Edge Functions.

-- ===== configuração dos avisos (endereço da função e segredo), num lugar que ninguém de fora lê =====
create table if not exists config_avisos (id int primary key default 1 check (id = 1), url text not null, segredo text not null);
alter table config_avisos enable row level security;
insert into config_avisos(id, url, segredo) values (1, 'https://udduiuoausbswczewcng.supabase.co/functions/v1/swift-endpoint', 'COLOQUE_O_SEGREDO')
on conflict (id) do update set url = excluded.url, segredo = excluded.segredo;

/* manda uma lista de avisos para a função: [{title, body, url, subs:[inscrições]}]. Quem não tem aparelho inscrito fica de fora. */
create or replace function mandar_avisos(p_avisos jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c config_avisos; v jsonb;
begin
  select coalesce(jsonb_agg(a), '[]'::jsonb) into v from jsonb_array_elements(coalesce(p_avisos, '[]'::jsonb)) a where jsonb_array_length(a->'subs') > 0;
  if jsonb_array_length(v) = 0 then return; end if;
  select * into c from config_avisos where id = 1; if not found then return; end if;
  perform net.http_post(url := c.url, body := jsonb_build_object('tipo', 'lista', 'avisos', v),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-segredo', c.segredo));
end $$;
create or replace function subs_de(p_chave text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(inscricao), '[]'::jsonb) from push_inscricoes where chave = p_chave $$;
revoke all on function mandar_avisos(jsonb) from public, anon, authenticated;
revoke all on function subs_de(text) from public, anon, authenticated;

-- ===== "Bateram seu recorde!" nas fases da campanha =====
/* o recorde (e1,v1) é melhor que (e2,v2)? mais estrelas primeiro; empate, o valor (menor ou maior, conforme a fase) */
create or replace function rk_melhor(e1 int, v1 numeric, e2 int, v2 numeric, menor boolean) returns boolean language sql immutable as $$
  select e1 > e2 or (e1 = e2 and case when menor then v1 < v2 else v1 > v2 end) $$;

create or replace function enviar_recorde(p_nome text, p_fase text, p_estrelas int, p_valor numeric, p_menor boolean) returns void
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); o recordes; achou boolean; passados text[]; w text; ph text;
begin
  if p_fase !~ '^[0-9]{1,2}-[0-9]{1,2}$' or p_estrelas not between 1 and 3 or p_valor < 0 or p_valor > 100000 then raise exception 'valor inválido'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  select * into o from recordes where chave = k and fase = p_fase; achou := found;
  if achou and not rk_melhor(p_estrelas, p_valor, o.estrelas, o.valor, p_menor) then return; end if;
  /* quem estava na frente (ou empatado) e agora ficou para trás */
  select array_agg(r.chave) into passados from recordes r
  where r.fase = p_fase and r.chave <> k and rk_melhor(p_estrelas, p_valor, r.estrelas, r.valor, p_menor)
    and (not achou or not rk_melhor(o.estrelas, o.valor, r.estrelas, r.valor, p_menor));
  insert into recordes(chave, fase, estrelas, valor, menor) values (k, p_fase, p_estrelas, p_valor, p_menor)
  on conflict (chave, fase) do update set estrelas = excluded.estrelas, valor = excluded.valor, menor = excluded.menor, quando = now();
  if passados is null then return; end if;
  w := split_part(p_fase, '-', 1); ph := split_part(p_fase, '-', 2);
  perform mandar_avisos((select jsonb_agg(jsonb_build_object(
      'title', '🏆 ' || btrim(p_nome) || ' passou você!',
      'body', 'Mundo ' || w || ' · Fase ' || ph || ': ' || btrim(p_nome) || ' fez melhor que o seu recorde. Bora recuperar?',
      'url', '?fase=' || p_fase, 'tag', 'recorde-' || p_fase, 'subs', subs_de(pc)))
    from unnest(passados[1:5]) pc));
end $$;
revoke all on function enviar_recorde(text,text,int,numeric,boolean) from public;
grant execute on function enviar_recorde(text,text,int,numeric,boolean) to anon, authenticated;

-- ===== Ranking do Desafio do dia =====
/* "hoje" no horário de Brasília (o servidor usa o horário de Londres) */
create or replace function hoje_br() returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;
create table if not exists diario (
  chave text not null references jogadores(chave) on delete cascade,
  dia date not null,
  var text not null check (var in ('t', 's')),   -- t = com tempo, s = sem tempo
  pontos int not null, linhas int not null default 0,
  quando timestamptz not null default now(),
  primary key (chave, dia, var)
);
create index if not exists diario_dia on diario(dia, var);
alter table diario enable row level security;
drop policy if exists "todos leem" on diario;
create policy "todos leem" on diario for select using (true);

/* vale só a primeira partida de cada um no dia (como no jogo); se tomar o 1º lugar, avisa quem estava nele */
create or replace function enviar_diario(p_nome text, p_dia date, p_var text, p_pontos int, p_linhas int) returns void
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); lider record;
begin
  if p_var not in ('t','s') or p_dia not between hoje_br() - 1 and hoje_br() + 1 or p_pontos not between 0 and 10000000 or p_linhas not between 0 and 100000 then raise exception 'valor inválido'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  select d.chave, d.pontos into lider from diario d where d.dia = p_dia and d.var = p_var order by d.pontos desc, d.quando asc limit 1;
  insert into diario(chave, dia, var, pontos, linhas) values (k, p_dia, p_var, p_pontos, p_linhas) on conflict do nothing;
  if not found then return; end if;
  if lider.chave is not null and lider.chave <> k and p_pontos > lider.pontos then
    perform mandar_avisos(jsonb_build_array(jsonb_build_object(
      'title', '👑 ' || btrim(p_nome) || ' tomou o 1º lugar!',
      'body', 'Desafio do dia' || case when p_var = 's' then ' (sem tempo)' else '' end || ': ' || p_pontos || ' pontos, passou os seus ' || lider.pontos || '.',
      'url', '?dia=1', 'tag', 'diario', 'subs', subs_de(lider.chave))));
  end if;
end $$;
revoke all on function enviar_diario(text,date,text,int,int) from public;
grant execute on function enviar_diario(text,date,text,int,int) to anon, authenticated;
grant select on diario to anon, authenticated;

/* vitórias do mês: quantos dias cada um terminou em 1º (empate de pontos: vale quem jogou primeiro). O dia de hoje só conta quando acabar. */
create or replace function vitorias_mes(p_mes date, p_var text) returns table(nome text, chave text, vitorias bigint)
language sql stable security definer set search_path = public as $$
  select j.nome, j.chave, count(*) from (
    select distinct on (d.dia) d.dia, d.chave from diario d
    where d.var = p_var and d.dia >= date_trunc('month', p_mes)::date and d.dia < (date_trunc('month', p_mes) + interval '1 month')::date and d.dia < hoje_br()
    order by d.dia, d.pontos desc, d.quando asc) w
  join jogadores j on j.chave = w.chave group by j.nome, j.chave order by count(*) desc, j.nome
$$;
revoke all on function vitorias_mes(date,text) from public;
grant execute on function vitorias_mes(date,text) to anon, authenticated;

-- ===== Aviso de manhã: "o Desafio do dia saiu" (todo dia às 8h de Brasília = 11h UTC) =====
create or replace function avisar_diario() returns void
language plpgsql security definer set search_path = public as $$
declare v record; corpo text;
begin
  select j.nome, d.pontos into v from diario d join jogadores j on j.chave = d.chave
  where d.dia = hoje_br() - 1 and d.var = 't' order by d.pontos desc, d.quando asc limit 1;
  corpo := case when v.nome is not null then 'Ontem quem venceu foi ' || v.nome || ' com ' || v.pontos || ' pontos. Consegue passar hoje?'
                else 'Mesmas peças para toda a família. Quem faz mais pontos hoje?' end;
  perform mandar_avisos(jsonb_build_array(jsonb_build_object('title', '☀️ O Desafio do dia saiu!', 'body', corpo, 'url', '?dia=1', 'tag', 'diario',
    'subs', (select coalesce(jsonb_agg(inscricao), '[]'::jsonb) from push_inscricoes))));
end $$;
revoke all on function avisar_diario() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('aviso-diario', '0 11 * * *', 'select avisar_diario()');
