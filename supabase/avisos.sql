-- Avisos no celular ("sua vez no desafio"). Rode depois de ranking.sql e desafios.sql: "SQL Editor" → "New query", cole tudo e "Run".
-- Cada aparelho que ativa os avisos guarda aqui o seu endereço de notificação. Ninguém de fora consegue ler esta tabela.

create table if not exists push_inscricoes (
  endpoint text primary key,
  chave text not null references jogadores(chave) on delete cascade,
  inscricao jsonb not null,
  criado timestamptz not null default now()
);
create index if not exists push_inscricoes_chave on push_inscricoes(chave);
alter table push_inscricoes enable row level security;  -- sem regra de leitura: só a função de avisos (no servidor) lê

create or replace function salvar_inscricao(p_nome text, p_inscricao jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_inscricao->>'endpoint','') not like 'https://%' or length(p_inscricao::text) > 4000 then raise exception 'inscrição inválida'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  insert into push_inscricoes(endpoint, chave, inscricao) values (p_inscricao->>'endpoint', rk_chave(p_nome), p_inscricao)
  on conflict (endpoint) do update set chave = excluded.chave, inscricao = excluded.inscricao, criado = now();
end $$;

create or replace function remover_inscricao(p_endpoint text) returns void
language sql security definer set search_path = public as $$ delete from push_inscricoes where endpoint = p_endpoint $$;

revoke all on function salvar_inscricao(text,jsonb) from public;
revoke all on function remover_inscricao(text) from public;
grant execute on function salvar_inscricao(text,jsonb) to anon, authenticated;
grant execute on function remover_inscricao(text) to anon, authenticated;
