// Função "avisar" do Supabase (publicada com o nome swift-endpoint): manda o aviso no celular quando muda a vez num desafio.
// É chamada pelo gatilho "avisar" da tabela desafios (supabase/avisos.sql), com o cabeçalho x-segredo.
// Segredos (Edge Functions → Secrets): VAPID_PUBLIC, VAPID_PRIVATE, AVISO_SEGREDO. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = "https://pedrolucasfv.github.io/block-master-for-our-family/";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(SITE, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

type Desafio = { id: string; a: string; a_nome: string; b: string | null; b_nome: string | null; rodadas: (number | null)[][]; vez: string; vencedor: string | null };

function vitorias(d: Desafio) {
  let a = 0, b = 0;
  for (const r of d.rodadas) if (r[0] != null && r[1] != null) { if (r[0] > r[1]) a++; else if (r[1] > r[0]) b++; }
  return [a, b];
}
/* quem avisar, e com que texto, depois que a vez mudou */
export function avisos(d: Desafio) {
  const [wa, wb] = vitorias(d), n = d.rodadas.length, url = SITE + "?d=" + d.id, out = [];
  if (d.vez === "b" && d.b) {
    out.push(n === 1 && wa + wb === 0 && d.rodadas[0][1] == null
      ? { chave: d.b, title: `⚔️ ${d.a_nome} te desafiou!`, body: "Melhor de 5. Sua vez de jogar a rodada 1.", url }
      : { chave: d.b, title: `⚔️ Sua vez contra ${d.a_nome}`, body: `Rodada ${n}. Placar: você ${wb} × ${wa} ${d.a_nome}.`, url });
  } else if (d.vez === "a") {
    out.push({ chave: d.a, title: `⚔️ Sua vez contra ${d.b_nome}`, body: `Rodada ${n}. Placar: você ${wa} × ${wb} ${d.b_nome}.`, url });
  } else if (d.vez === "fim") {
    const txt = d.vencedor === "empate" ? "Terminou empatado" : d.vencedor === "a" ? "Você venceu! 🏆" : `${d.b_nome} venceu`;
    out.push({ chave: d.a, title: `⚔️ Desafio contra ${d.b_nome} terminou`, body: `${txt} (${wa} × ${wb}). Que tal uma revanche?`, url });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-segredo") !== Deno.env.get("AVISO_SEGREDO")) return new Response("não autorizado", { status: 401 });
  const p = await req.json().catch(() => null);
  const rec = p?.record, old = p?.old_record;
  if (p?.table !== "desafios" || !rec?.id) return new Response("ignorado");
  if (p.type === "UPDATE" && old && old.vez === rec.vez) return new Response("a vez não mudou");
  if (p.type === "INSERT" && rec.vez !== "b") return new Response("ainda não");
  /* lê de novo do banco: vale o que está lá, não o que veio na chamada */
  const { data: d } = await db.from("desafios").select("*").eq("id", rec.id).single();
  if (!d) return new Response("desafio não existe");
  let enviados = 0;
  for (const av of avisos(d)) {
    const { data: subs } = await db.from("push_inscricoes").select("endpoint,inscricao").eq("chave", av.chave);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.inscricao, JSON.stringify({ title: av.title, body: av.body, url: av.url, tag: "desafio-" + d.id }));
        enviados++;
      } catch (e) {
        /* aparelho desativou os avisos ou trocou de navegador: apaga a inscrição velha */
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_inscricoes").delete().eq("endpoint", s.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ enviados }), { headers: { "Content-Type": "application/json" } });
});
