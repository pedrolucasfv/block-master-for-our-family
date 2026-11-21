// Função "avisar" do Supabase (publicada com o nome swift-endpoint): manda o aviso no celular quando muda a vez num desafio.
// É chamada pelo gatilho "avisar" da tabela desafios (supabase/avisos.sql), com o cabeçalho x-segredo.
// O gatilho já manda o desafio e os aparelhos inscritos de cada lado ("subs"), então a função não precisa ler o banco.
// Segredos (Edge Functions → Secrets): VAPID_PUBLIC, VAPID_PRIVATE, AVISO_SEGREDO.
import webpush from "npm:web-push@3.6.7";

const SITE = "https://pedrolucasfv.github.io/block-master-for-our-family/";
/* endereço e chave pública do projeto (as mesmas do jogo): só para apagar inscrição velha, pela função remover_inscricao */
const SUPA_URL = "https://udduiuoausbswczewcng.supabase.co", SUPA_KEY = "sb_publishable_mSdw3fWJ7a6qJGC7XW2slg_HrE8anNh";
webpush.setVapidDetails(SITE, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

type Desafio = { id: string; a: string; a_nome: string; b: string | null; b_nome: string | null; rodadas: (number | null)[][]; vez: string; vencedor: string | null };
type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

function vitorias(d: Desafio) {
  let a = 0, b = 0;
  for (const r of d.rodadas) if (r[0] != null && r[1] != null) { if (r[0] > r[1]) a++; else if (r[1] > r[0]) b++; }
  return [a, b];
}
/* quem avisar (lado "a" ou "b"), e com que texto, depois que a vez mudou */
export function avisos(d: Desafio) {
  const [wa, wb] = vitorias(d), n = d.rodadas.length, url = SITE + "?d=" + d.id, out = [];
  if (d.vez === "b" && d.b) {
    out.push(n === 1 && wa + wb === 0 && d.rodadas[0][1] == null
      ? { lado: "b", title: `⚔️ ${d.a_nome} te desafiou!`, body: "Melhor de 5. Sua vez de jogar a rodada 1.", url }
      : { lado: "b", title: `⚔️ Sua vez contra ${d.a_nome}`, body: `Rodada ${n}. Placar: você ${wb} × ${wa} ${d.a_nome}.`, url });
  } else if (d.vez === "a") {
    out.push({ lado: "a", title: `⚔️ Sua vez contra ${d.b_nome}`, body: `Rodada ${n}. Placar: você ${wa} × ${wb} ${d.b_nome}.`, url });
  } else if (d.vez === "fim") {
    const txt = d.vencedor === "empate" ? "Terminou empatado" : d.vencedor === "a" ? "Você venceu! 🏆" : `${d.b_nome} venceu`;
    out.push({ lado: "a", title: `⚔️ Desafio contra ${d.b_nome} terminou`, body: `${txt} (${wa} × ${wb}). Que tal uma revanche?`, url });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-segredo") !== Deno.env.get("AVISO_SEGREDO")) return new Response("não autorizado", { status: 401 });
  const p = await req.json().catch(() => null);
  const d: Desafio = p?.record, old = p?.old_record;
  if (p?.table !== "desafios" || !d?.id) return new Response("ignorado");
  if (p.type === "UPDATE" && old && old.vez === d.vez) return new Response("a vez não mudou");
  if (p.type === "INSERT") return new Response("ainda não");
  let enviados = 0, aparelhos = 0;
  const erros: string[] = [];
  for (const av of avisos(d)) {
    const subs: Sub[] = p.subs?.[av.lado] ?? [];
    aparelhos += subs.length;
    for (const s of subs) {
      try {
        await webpush.sendNotification(s, JSON.stringify({ title: av.title, body: av.body, url: av.url, tag: "desafio-" + d.id }));
        enviados++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        erros.push(String(code ?? (e as Error).message));
        /* aparelho desativou os avisos ou trocou de navegador: apaga a inscrição velha */
        if (code === 404 || code === 410) await fetch(SUPA_URL + "/rest/v1/rpc/remover_inscricao", { method: "POST", headers: { apikey: SUPA_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_endpoint: s.endpoint }) }).catch(() => {});
      }
    }
  }
  return new Response(JSON.stringify({ aparelhos, enviados, erros }), { headers: { "Content-Type": "application/json" } });
});
