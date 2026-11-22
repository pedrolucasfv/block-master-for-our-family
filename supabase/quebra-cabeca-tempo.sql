-- Versão 1.14: as fases 7 (quebra-cabeça) passaram a dar estrelas pelo TEMPO (segundos), e não mais pelo número de tentativas.
-- Os recordes antigos dessas fases guardam tentativas (1, 2, 3…) e apareceriam como "1 s" no ranking, ganhando de todo mundo.
-- Rode uma vez no SQL Editor do Supabase, depois que a 1.14 estiver no site. Apaga só os recordes das fases 7 de cada mundo.
delete from recordes where fase ~ '^[0-9]{1,2}-7$';
