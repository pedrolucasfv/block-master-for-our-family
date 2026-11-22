-- Foto do perfil nos desafios e no ranking. Rode depois de ranking.sql: "SQL Editor" → "New query", cole tudo e "Run".
-- mini: miniatura de 64 px para as listas; foto: a de 256 px, baixada só quando alguém toca para ampliar.

alter table jogadores add column if not exists foto text;
alter table jogadores add column if not exists mini text;

create or replace function salvar_foto(p_nome text, p_foto text, p_mini text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_foto,'') <> '' and (p_foto not like 'data:image/jpeg;base64,%' or length(p_foto) > 80000) then raise exception 'foto inválida'; end if;
  if coalesce(p_mini,'') <> '' and (p_mini not like 'data:image/jpeg;base64,%' or length(p_mini) > 12000) then raise exception 'foto inválida'; end if;
  perform salvar_jogador(p_nome, 0, 0);
  update jogadores set foto = nullif(p_foto,''), mini = nullif(p_mini,'') where chave = rk_chave(p_nome);
end $$;

revoke all on function salvar_foto(text,text,text) from public;
grant execute on function salvar_foto(text,text,text) to anon, authenticated;
grant select on jogadores to anon, authenticated;
