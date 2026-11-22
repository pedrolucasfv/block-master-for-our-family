-- Versão 1.8 (antes do PIN): histórico de avisos. Rode depois de diario-e-recordes.sql: "SQL Editor" → "New query", cole tudo e "Run".
-- Todo aviso fica guardado por 30 dias (mesmo para quem não ligou as notificações), e o jogo mostra no sino 🔔 do menu.
-- Os avisos de desafio também passam a ser montados aqui (antes eram montados na função swift-endpoint).

create table if not exists avisos_log (
  id bigserial primary key,
  chave text not null references jogadores(chave) on delete cascade,
  titulo text not null, corpo text not null default '', url text,
  quando timestamptz not null default now()
);
create index if not exists avisos_log_chave on avisos_log(chave, quando desc);
alter table avisos_log enable row level security;
drop policy if exists "todos leem" on avisos_log;
create policy "todos leem" on avisos_log for select using (true);
grant select on avisos_log to anon, authenticated;

/* manda avisos: [{chave, title, body, url, tag, subs:[inscrições]}]. Guarda no histórico de quem tem "chave"; só envia para quem tem aparelho inscrito. */
create or replace function mandar_avisos(p_avisos jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c config_avisos; v jsonb;
begin
  insert into avisos_log(chave, titulo, corpo, url)
  select a->>'chave', a->>'title', coalesce(a->>'body',''), a->>'url' from jsonb_array_elements(coalesce(p_avisos, '[]'::jsonb)) a
  where a->>'chave' is not null and exists (select 1 from jogadores j where j.chave = a->>'chave');
  delete from avisos_log where quando < now() - interval '30 days';
  select coalesce(jsonb_agg(a), '[]'::jsonb) into v from jsonb_array_elements(coalesce(p_avisos, '[]'::jsonb)) a where jsonb_array_length(coalesce(a->'subs','[]'::jsonb)) > 0;
  if jsonb_array_length(v) = 0 then return; end if;
  select * into c from config_avisos where id = 1; if not found then return; end if;
  perform net.http_post(url := c.url, body := jsonb_build_object('tipo', 'lista', 'avisos', v),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-segredo', c.segredo));
end $$;
revoke all on function mandar_avisos(jsonb) from public, anon, authenticated;

/* aviso com a chave de quem recebe e os aparelhos dessa pessoa */
create or replace function aviso_para(p_chave text, p_title text, p_body text, p_url text, p_tag text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('chave', p_chave, 'title', p_title, 'body', p_body, 'url', p_url, 'tag', p_tag, 'subs', subs_de(p_chave)) $$;
revoke all on function aviso_para(text,text,text,text,text) from public, anon, authenticated;

-- ===== desafios: quando muda a vez, avisa quem joga agora (e quem criou, quando termina) =====
create or replace function avisar_desafio() returns trigger
language plpgsql security definer set search_path = public as $$
declare wa int := 0; wb int := 0; r jsonb; n int; url text; tag text; txt text;
begin
  if tg_op <> 'UPDATE' or old.vez is not distinct from new.vez then return new; end if;
  for r in select * from jsonb_array_elements(new.rodadas) loop
    if (r->>0) is not null and (r->>1) is not null then
      if (r->>0)::int > (r->>1)::int then wa := wa + 1; elsif (r->>1)::int > (r->>0)::int then wb := wb + 1; end if;
    end if;
  end loop;
  n := jsonb_array_length(new.rodadas); url := '?d=' || new.id; tag := 'desafio-' || new.id;
  if new.vez = 'b' and new.b is not null then
    if n = 1 and wa + wb = 0 then
      perform mandar_avisos(jsonb_build_array(aviso_para(new.b, '⚔️ ' || new.a_nome || ' te desafiou!', 'Melhor de 5. Sua vez de jogar a rodada 1.', url, tag)));
    else
      perform mandar_avisos(jsonb_build_array(aviso_para(new.b, '⚔️ Sua vez contra ' || new.a_nome, 'Rodada ' || n || '. Placar: você ' || wb || ' × ' || wa || ' ' || new.a_nome || '.', url, tag)));
    end if;
  elsif new.vez = 'a' then
    perform mandar_avisos(jsonb_build_array(aviso_para(new.a, '⚔️ Sua vez contra ' || new.b_nome, 'Rodada ' || n || '. Placar: você ' || wa || ' × ' || wb || ' ' || new.b_nome || '.', url, tag)));
  elsif new.vez = 'fim' then
    txt := case when new.vencedor = 'empate' then 'Terminou empatado' when new.vencedor = 'a' then 'Você venceu! 🏆' else new.b_nome || ' venceu' end;
    perform mandar_avisos(jsonb_build_array(aviso_para(new.a, '⚔️ Desafio contra ' || new.b_nome || ' terminou', txt || ' (' || wa || ' × ' || wb || '). Que tal uma revanche?', url, tag)));
  end if;
  return new;
end $$;
drop trigger if exists avisar on desafios;
create trigger avisar after insert or update on desafios for each row execute function avisar_desafio();

-- ===== recorde batido, 1º lugar do dia e aviso de manhã: agora com a chave de quem recebe (para o histórico) =====
create or replace function enviar_recorde(p_nome text, p_fase text, p_estrelas int, p_valor numeric, p_menor boolean) returns void
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); o recordes; achou boolean; passados text[]; w text; ph text;
begin
  if p_fase !~ '^[0-9]{1,2}-[0-9]{1,2}$' or p_estrelas not between 1 and 3 or p_valor < 0 or p_valor > 100000 then raise exception 'valor inválido'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  select * into o from recordes where chave = k and fase = p_fase; achou := found;
  if achou and not rk_melhor(p_estrelas, p_valor, o.estrelas, o.valor, p_menor) then return; end if;
  select array_agg(r.chave) into passados from recordes r
  where r.fase = p_fase and r.chave <> k and rk_melhor(p_estrelas, p_valor, r.estrelas, r.valor, p_menor)
    and (not achou or not rk_melhor(o.estrelas, o.valor, r.estrelas, r.valor, p_menor));
  insert into recordes(chave, fase, estrelas, valor, menor) values (k, p_fase, p_estrelas, p_valor, p_menor)
  on conflict (chave, fase) do update set estrelas = excluded.estrelas, valor = excluded.valor, menor = excluded.menor, quando = now();
  if passados is null then return; end if;
  w := split_part(p_fase, '-', 1); ph := split_part(p_fase, '-', 2);
  perform mandar_avisos((select jsonb_agg(aviso_para(pc, '🏆 ' || btrim(p_nome) || ' passou você!',
      'Mundo ' || w || ' · Fase ' || ph || ': ' || btrim(p_nome) || ' fez melhor que o seu recorde. Bora recuperar?', '?fase=' || p_fase, 'recorde-' || p_fase))
    from unnest(passados[1:5]) pc));
end $$;

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
    perform mandar_avisos(jsonb_build_array(aviso_para(lider.chave, '👑 ' || btrim(p_nome) || ' tomou o 1º lugar!',
      'Desafio do dia: ' || p_pontos || ' pontos, passou os seus ' || lider.pontos || '.', '?dia=1', 'diario')));
  end if;
end $$;

/* aviso de manhã: vai para todo mundo que já jogou (histórico) e chega no celular de quem ligou os avisos */
create or replace function avisar_diario() returns void
language plpgsql security definer set search_path = public as $$
declare v record; corpo text;
begin
  select j.nome, d.pontos into v from diario d join jogadores j on j.chave = d.chave
  where d.dia = hoje_br() - 1 and d.var = 't' order by d.pontos desc, d.quando asc limit 1;
  corpo := case when v.nome is not null then 'Ontem quem venceu foi ' || v.nome || ' com ' || v.pontos || ' pontos. Consegue passar hoje?'
                else 'Mesmas peças para toda a família. Quem faz mais pontos hoje?' end;
  perform mandar_avisos((select jsonb_agg(aviso_para(j.chave, '☀️ O Desafio do dia saiu!', corpo, '?dia=1', 'diario')) from jogadores j));
end $$;
revoke all on function avisar_diario() from public, anon, authenticated;
