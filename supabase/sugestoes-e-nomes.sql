-- Versão 1.17: sugestões da família, quem cuida do jogo (ADM) e trocar o nome sem perder nada.
-- Rode depois de pin-e-progresso.sql: "SQL Editor" → "New query", cole tudo e "Run". Pode rodar de novo sem problema.
--
-- Depois de rodar, marque quem cuida do jogo (a pessoa precisa ter PIN; troque pelo nome em minúsculas):
--     update contas set adm = true where chave = 'lucas';
--   Com isso, qualquer celular onde essa pessoa entrou com o PIN responde as sugestões, recebe aviso de sugestão nova e pode usar "ADM" no nome.
--
-- Como funciona:
--   • O nome continua podendo ter espaços. Maiúsculas não contam ("Ana" e "ana" são a mesma pessoa), como já era.
--     Nome novo não pode ser quase igual a um que já existe (só muda acento, maiúscula ou espaço: "Lúcia" × "Lucia"), nem ter dois espaços seguidos.
--   • "ADM" (ou "ADMIN") como palavra do nome só para quem tem contas.adm = true.
--   • trocar_nome: quem tem PIN troca de nome e leva tudo junto (ranking, recordes, Desafio do dia, desafios, foto, avisos, PIN e progresso).
--     O nome antigo fica guardado por 30 dias (ninguém pega) e os outros aparelhos da pessoa passam para o nome novo sozinhos.
--   • Sugestões: todo mundo vê e curte; quem sugeriu responde as perguntas; quem cuida do jogo muda a etiqueta e escreve o motivo. Cada passo vira aviso.

-- ===== trocar o nome leva tudo junto: as ligações com o nome acompanham a troca (on update cascade) =====
alter table recordes drop constraint if exists recordes_chave_fkey,
  add constraint recordes_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table diario drop constraint if exists diario_chave_fkey,
  add constraint diario_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table push_inscricoes drop constraint if exists push_inscricoes_chave_fkey,
  add constraint push_inscricoes_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table avisos_log drop constraint if exists avisos_log_chave_fkey,
  add constraint avisos_log_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table progresso drop constraint if exists progresso_chave_fkey,
  add constraint progresso_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table contas drop constraint if exists contas_chave_fkey,
  add constraint contas_chave_fkey foreign key (chave) references jogadores(chave) on delete cascade on update cascade;
alter table sessoes drop constraint if exists sessoes_chave_fkey,
  add constraint sessoes_chave_fkey foreign key (chave) references contas(chave) on delete cascade on update cascade;

-- ===== quem cuida do jogo =====
alter table contas add column if not exists adm boolean not null default false;

/* nomes trocados: o antigo fica 30 dias guardado e aponta para o novo (os outros aparelhos da pessoa se acertam por aqui) */
create table if not exists nomes_antigos (
  antiga text primary key,
  nova text not null,
  quando timestamptz not null default now()
);
alter table nomes_antigos enable row level security;  -- sem regra de leitura: só as funções leem

/* nome para comparar: minúsculas, sem acento e com um espaço só entre as palavras */
create or replace function rk_base(p_nome text) returns text language sql immutable as $$
  select translate(lower(regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') $$;
/* o nome tem "ADM" (ou "ADMIN") como palavra, ou terminando colado ("PedroADM")? */
create or replace function rk_tem_adm(p_nome text) returns boolean language sql immutable as $$
  select rk_base(p_nome) ~ '(^|[^a-z0-9])adm(in)?([^a-z0-9]|$)' or rk_base(p_nome) ~ 'adm(in)?$' $$;

/* chave de quem chama, se entrou com o PIN numa conta de quem cuida do jogo (senão, vazio) */
create or replace function rk_adm() returns text
language sql stable security definer set search_path = public as $$
  select c.chave from sessoes s join contas c on c.chave = s.chave where s.token = pin_token() and c.adm limit 1 $$;
revoke all on function rk_adm() from public, anon, authenticated;
create or replace function sou_adm() returns boolean
language sql stable security definer set search_path = public as $$ select rk_adm() is not null $$;
revoke all on function sou_adm() from public;
grant execute on function sou_adm() to anon, authenticated;

/* confere um nome que ainda não existe. p_eu: chave de quem está trocando de nome (o parecido com ele mesmo pode) */
create or replace function rk_nome_novo(p_nome text, p_eu text default null) returns void
language plpgsql stable security definer set search_path = public as $$
declare k text := rk_chave(p_nome); o text;
begin
  if p_nome ~ '\s\s' then raise exception 'nome: dois espaços seguidos'; end if;
  select nome into o from jogadores where rk_base(nome) = rk_base(p_nome) and chave <> k and chave is distinct from p_eu limit 1;
  if found then raise exception 'nome: parecido com %', o; end if;
  if exists (select 1 from nomes_antigos where antiga = k and nova is distinct from p_eu and quando > now() - interval '30 days') then
    raise exception 'nome: trocado há pouco'; end if;
end $$;
revoke all on function rk_nome_novo(text,text) from public, anon, authenticated;

-- ===== salvar_jogador (igual à de pin-e-progresso.sql) + regras do nome =====
create or replace function salvar_jogador(p_nome text, p_estrelas int, p_solo int) returns void
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  p_nome := btrim(p_nome); k := rk_chave(p_nome);
  if p_nome = '' or length(p_nome) > 16 then raise exception 'nome inválido'; end if;
  if p_estrelas < 0 or p_estrelas > 1000 or p_solo < 0 or p_solo > 10000000 then raise exception 'valor inválido'; end if;
  perform rk_dono(k);
  if rk_tem_adm(p_nome) and not exists (select 1 from contas where chave = k and adm) then raise exception 'nome: ADM é só de quem cuida do jogo'; end if;
  if not exists (select 1 from jogadores where chave = k) then perform rk_nome_novo(p_nome); end if;
  insert into jogadores(chave, nome, estrelas, solo) values (k, p_nome, p_estrelas, p_solo)
  on conflict (chave) do update set nome = excluded.nome,
    estrelas = greatest(jogadores.estrelas, excluded.estrelas),
    solo = greatest(jogadores.solo, excluded.solo), atualizado = now();
end $$;
revoke all on function salvar_jogador(text,int,int) from public;
grant execute on function salvar_jogador(text,int,int) to anon, authenticated;

/* situação de um nome: 'com_pin' (com 'adm'), 'sem_pin', 'trocado' (virou 'nome'; 'guardado' = ainda nos 30 dias), 'adm' (não pode), 'parecido' (com 'nome') ou 'livre' */
create or replace function pin_estado(p_nome text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare k text := rk_chave(p_nome); o text; a nomes_antigos;
begin
  if exists (select 1 from contas c where c.chave = k) then
    return jsonb_build_object('estado', 'com_pin', 'adm', (select adm from contas where chave = k)); end if;
  if exists (select 1 from jogadores j where j.chave = k) then
    return jsonb_build_object('estado', 'sem_pin', 'estrelas', (select estrelas from jogadores where chave = k)); end if;
  select * into a from nomes_antigos where antiga = k;
  if found then return jsonb_build_object('estado', 'trocado', 'nome', (select nome from jogadores where chave = a.nova), 'guardado', a.quando > now() - interval '30 days'); end if;
  if rk_tem_adm(p_nome) then return jsonb_build_object('estado', 'adm'); end if;
  select nome into o from jogadores where rk_base(nome) = rk_base(p_nome) limit 1;
  if found then return jsonb_build_object('estado', 'parecido', 'nome', o); end if;
  return jsonb_build_object('estado', 'livre');
end $$;
revoke all on function pin_estado(text) from public;
grant execute on function pin_estado(text) to anon, authenticated;

/* troca o nome (precisa ter entrado com o PIN neste aparelho). Responde {ok:true, nome} ou {ok:false, erro: 'nome' | 'adm' | 'usado' | 'parecido' (com 'nome') | 'guardado'} */
create or replace function trocar_nome(p_antigo text, p_novo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_antigo); n text := regexp_replace(btrim(coalesce(p_novo, '')), '\s+', ' ', 'g'); kn text; o text;
begin
  perform rk_dono(k, true);
  kn := rk_chave(n);
  if n = '' or length(n) > 16 then return jsonb_build_object('ok', false, 'erro', 'nome'); end if;
  if rk_tem_adm(n) and not exists (select 1 from contas where chave = k and adm) then return jsonb_build_object('ok', false, 'erro', 'adm'); end if;
  if kn <> k then
    if exists (select 1 from jogadores where chave = kn) then return jsonb_build_object('ok', false, 'erro', 'usado'); end if;
    select nome into o from jogadores where rk_base(nome) = rk_base(n) and chave <> k limit 1;
    if found then return jsonb_build_object('ok', false, 'erro', 'parecido', 'nome', o); end if;
    if exists (select 1 from nomes_antigos where antiga = kn and nova <> k and quando > now() - interval '30 days') then
      return jsonb_build_object('ok', false, 'erro', 'guardado'); end if;
  end if;
  /* a troca da chave em jogadores leva junto recordes, Desafio do dia, avisos, PIN, aparelhos e progresso (on update cascade) */
  update jogadores set chave = kn, nome = n, atualizado = now() where chave = k;
  update desafios set a = kn, a_nome = n where a = k;
  update desafios set b = kn, b_nome = n where b = k;
  if kn <> k then
    delete from nomes_antigos where antiga = kn;
    update nomes_antigos set nova = kn where nova = k;
    insert into nomes_antigos(antiga, nova) values (k, kn) on conflict (antiga) do update set nova = excluded.nova, quando = now();
  end if;
  return jsonb_build_object('ok', true, 'nome', n);
end $$;
revoke all on function trocar_nome(text,text) from public;
grant execute on function trocar_nome(text,text) to anon, authenticated;

-- ===== sugestões =====
create table if not exists sugestoes (
  id bigserial primary key,
  chave text not null references jogadores(chave) on delete cascade on update cascade,  -- quem sugeriu
  titulo text not null,
  texto text not null default '',
  assunto text not null default 'outro',   -- pecas, visual, campanha, junto, erro, outro
  etiqueta text not null default 'nova' check (etiqueta in ('nova', 'analise', 'pergunta', 'vai', 'feita', 'nao')),
  motivo text,                             -- por que não vai entrar
  versao text,                             -- versão em que entrou no jogo
  curtidas int not null default 0,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists sugestoes_atualizado on sugestoes(atualizado desc);
create table if not exists sugestao_msgs (
  id bigserial primary key,
  sug bigint not null references sugestoes(id) on delete cascade,
  chave text references jogadores(chave) on delete set null on update cascade,
  adm boolean not null default false,      -- escrita por quem cuida do jogo
  etiqueta text,                           -- a etiqueta que esta mensagem colocou (vazio = só conversa)
  texto text not null default '',
  quando timestamptz not null default now()
);
create index if not exists sugestao_msgs_sug on sugestao_msgs(sug, quando);
create table if not exists sugestao_curtidas (
  sug bigint not null references sugestoes(id) on delete cascade,
  chave text not null references jogadores(chave) on delete cascade on update cascade,
  primary key (sug, chave)
);
alter table sugestoes enable row level security;
alter table sugestao_msgs enable row level security;
alter table sugestao_curtidas enable row level security;
drop policy if exists "todos leem" on sugestoes;
create policy "todos leem" on sugestoes for select using (true);
drop policy if exists "todos leem" on sugestao_msgs;
create policy "todos leem" on sugestao_msgs for select using (true);
drop policy if exists "todos leem" on sugestao_curtidas;
create policy "todos leem" on sugestao_curtidas for select using (true);
grant select on sugestoes, sugestao_msgs, sugestao_curtidas to anon, authenticated;

/* aviso para todos que cuidam do jogo (menos p_menos, quem fez a ação) */
create or replace function avisar_adms(p_title text, p_body text, p_url text, p_tag text, p_menos text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform mandar_avisos((select jsonb_agg(aviso_para(c.chave, p_title, p_body, p_url, p_tag)) from contas c where c.adm and c.chave is distinct from p_menos));
end $$;
revoke all on function avisar_adms(text,text,text,text,text) from public, anon, authenticated;

/* nova sugestão: grava e avisa quem cuida do jogo. Responde o número da sugestão */
create or replace function sugerir(p_nome text, p_titulo text, p_texto text, p_assunto text) returns bigint
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); v_id bigint;
begin
  p_titulo := btrim(coalesce(p_titulo, '')); p_texto := btrim(coalesce(p_texto, ''));
  if length(p_titulo) not between 3 and 60 or length(p_texto) > 600 then raise exception 'sugestão inválida'; end if;
  if coalesce(p_assunto, '') not in ('pecas', 'visual', 'campanha', 'junto', 'erro', 'outro') then p_assunto := 'outro'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  if (select count(*) from sugestoes where chave = k and criado > now() - interval '1 day') >= 10 then raise exception 'sugestão: muitas hoje'; end if;
  insert into sugestoes(chave, titulo, texto, assunto) values (k, p_titulo, p_texto, p_assunto) returning id into v_id;
  perform avisar_adms('💡 Nova sugestão de ' || btrim(p_nome), p_titulo, '?sug=' || v_id, 'sug-' || v_id, k);
  return v_id;
end $$;

/* mensagem na conversa de uma sugestão: de quem sugeriu (responde a pergunta: a etiqueta volta para "em análise") ou de quem cuida do jogo */
create or replace function sugestao_falar(p_nome text, p_id bigint, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); s sugestoes; eu_adm boolean;
begin
  p_texto := btrim(coalesce(p_texto, ''));
  if length(p_texto) not between 1 and 600 then raise exception 'mensagem inválida'; end if;
  select * into s from sugestoes where id = p_id for update;
  if not found then raise exception 'sugestão: não existe'; end if;
  eu_adm := rk_adm() is not distinct from k;
  if not eu_adm then
    perform salvar_jogador(p_nome, 0, 0);
    if s.chave <> k then raise exception 'sugestão: só quem sugeriu responde'; end if;
  end if;
  insert into sugestao_msgs(sug, chave, adm, texto) values (p_id, k, eu_adm, p_texto);
  if eu_adm then
    update sugestoes set atualizado = now() where id = p_id;
    if s.chave <> k then
      perform mandar_avisos(jsonb_build_array(aviso_para(s.chave, '💬 ' || btrim(p_nome) || ' respondeu sua sugestão',
        '“' || s.titulo || '”: ' || left(p_texto, 140), '?sug=' || p_id, 'sug-' || p_id)));
    end if;
  else
    update sugestoes set atualizado = now(), etiqueta = case when etiqueta = 'pergunta' then 'analise' else etiqueta end where id = p_id;
    perform avisar_adms('💬 ' || btrim(p_nome) || ' respondeu', '“' || s.titulo || '”: ' || left(p_texto, 140), '?sug=' || p_id, 'sug-' || p_id, k);
  end if;
end $$;

/* quem cuida do jogo muda a etiqueta. "pergunta" e "nao" precisam de texto (a pergunta ou o motivo); "feita" guarda a versão. Avisa quem sugeriu. */
create or replace function sugestao_etiqueta(p_id bigint, p_etiqueta text, p_texto text, p_versao text) returns void
language plpgsql security definer set search_path = public as $$
declare a text := rk_adm(); s sugestoes; nm text; tit text; corpo text;
begin
  if a is null then raise exception 'sugestão: só quem cuida do jogo'; end if;
  if coalesce(p_etiqueta, '') not in ('nova', 'analise', 'pergunta', 'vai', 'feita', 'nao') then raise exception 'etiqueta inválida'; end if;
  p_texto := btrim(coalesce(p_texto, '')); p_versao := nullif(btrim(coalesce(p_versao, '')), '');
  if length(p_texto) > 600 or length(coalesce(p_versao, '')) > 12 then raise exception 'texto inválido'; end if;
  if p_etiqueta in ('nao', 'pergunta') and p_texto = '' then raise exception 'sugestão: escreva o motivo ou a pergunta'; end if;
  select * into s from sugestoes where id = p_id for update;
  if not found then raise exception 'sugestão: não existe'; end if;
  update sugestoes set etiqueta = p_etiqueta, atualizado = now(),
    motivo = case when p_etiqueta = 'nao' then p_texto end,
    versao = case when p_etiqueta = 'feita' then p_versao end
  where id = p_id;
  insert into sugestao_msgs(sug, chave, adm, etiqueta, texto) values (p_id, a, true, p_etiqueta, p_texto);
  if s.chave = a or p_etiqueta = 'nova' then return; end if;
  select nome into nm from jogadores where chave = a;
  tit := case p_etiqueta
    when 'analise' then '👀 Sua sugestão está em análise'
    when 'pergunta' then '❓ ' || nm || ' tem uma pergunta'
    when 'vai' then '🚀 Sua sugestão vai entrar no jogo!'
    when 'feita' then '🎉 Sua ideia já está no jogo!'
    else '💭 Sobre sua sugestão' end;
  corpo := '“' || s.titulo || '”' || case
    when p_etiqueta = 'nao' then ' não vai entrar: ' || left(p_texto, 140)
    when p_etiqueta = 'feita' then coalesce(' entrou na versão ' || p_versao, ' entrou no jogo') || case when p_texto <> '' then '. ' || left(p_texto, 100) else '' end
    when p_texto <> '' then ': ' || left(p_texto, 140) else '' end;
  perform mandar_avisos(jsonb_build_array(aviso_para(s.chave, tit, corpo, '?sug=' || p_id, 'sug-' || p_id)));
end $$;

/* curte ou descurte. Responde quantas curtidas a sugestão tem agora */
create or replace function sugestao_curtir(p_nome text, p_id bigint) returns int
language plpgsql security definer set search_path = public as $$
declare k text := rk_chave(p_nome); n int;
begin
  perform salvar_jogador(p_nome, 0, 0);
  if not exists (select 1 from sugestoes where id = p_id) then raise exception 'sugestão: não existe'; end if;
  delete from sugestao_curtidas where sug = p_id and chave = k;
  if not found then insert into sugestao_curtidas(sug, chave) values (p_id, k); end if;
  update sugestoes set curtidas = (select count(*) from sugestao_curtidas where sug = p_id) where id = p_id returning curtidas into n;
  return n;
end $$;

/* apaga uma sugestão (bagunça, repetida): só quem cuida do jogo */
create or replace function sugestao_apagar(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if rk_adm() is null then raise exception 'sugestão: só quem cuida do jogo'; end if;
  delete from sugestoes where id = p_id;
end $$;

revoke all on function sugerir(text,text,text,text) from public;
revoke all on function sugestao_falar(text,bigint,text) from public;
revoke all on function sugestao_etiqueta(bigint,text,text,text) from public;
revoke all on function sugestao_curtir(text,bigint) from public;
revoke all on function sugestao_apagar(bigint) from public;
grant execute on function sugerir(text,text,text,text) to anon, authenticated;
grant execute on function sugestao_falar(text,bigint,text) to anon, authenticated;
grant execute on function sugestao_etiqueta(bigint,text,text,text) to anon, authenticated;
grant execute on function sugestao_curtir(text,bigint) to anon, authenticated;
grant execute on function sugestao_apagar(bigint) to anon, authenticated;
