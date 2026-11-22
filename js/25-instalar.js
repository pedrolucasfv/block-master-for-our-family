'use strict';
/* INSTALAR O JOGO (ícone na tela, janela própria) e jogo guardado no aparelho para abrir sem internet: registra o sw.js e cuida do botão "📲 Instalar o jogo" do menu */
const instAberto=()=>{ try{ return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true; }catch(e){ return false; } };
let instPedido=null; /* janela de instalação do Chrome, guardada para abrir quando tocar no botão */
/* já instalado neste aparelho: aberto pelo ícone alguma vez, o Chrome avisou que instalou ou a pessoa tocou em Já instalei (no iPhone o Safari não tem como saber) */
const instJa=()=>!!store.get('ddb_instalado',false);
function instRender(){ const b=$('#goInstalar'); if(b) b.hidden=SIM!=null||instAberto()||!(instPedido||(avIOS()&&!avInApp()&&!instJa())); }
async function instTocar(){
  if(instPedido){ const p=instPedido; instPedido=null; instRender(); p.prompt(); try{ const r=await p.userChoice; if(r&&r.outcome==='accepted') toast('📲 Jogo instalado! Procure o ícone na tela.'); }catch(e){} return; }
  openEnd(`<h2>📲 Instalar no iPhone</h2><p class="muted">Assim o jogo ganha um ícone na tela, abre em tela cheia e funciona sem internet. No iPhone, é também o único jeito de receber os avisos 🔔.</p>
    <ol class="muted" style="text-align:left;line-height:1.6;padding-left:22px;margin:10px 0"><li>Abra o jogo no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima ⬆️, embaixo ou no topo da tela).</li><li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>. Pronto: é só abrir pelo ícone.</li></ol>`,[{t:'Entendi',cls:'primary',on:closeEnd},{t:'✅ Já instalei',cls:'',on:()=>{ store.set('ddb_instalado',true); closeEnd(); instRender(); toast('Pronto! Abra o jogo pelo ícone na tela.'); }}]);
}
$('#goInstalar').addEventListener('click',instTocar);
/* o Chrome só oferece instalar quando o jogo não está instalado: então desinstalaram, e o botão volta */
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); instPedido=e; store.del('ddb_instalado'); instRender(); });
window.addEventListener('appinstalled',()=>{ instPedido=null; store.set('ddb_instalado',true); instRender(); });
if(SIM==null&&instAberto()) store.set('ddb_instalado',true);
instRender();
/* guarda o jogo no aparelho (sw.js): da próxima vez, abre mesmo sem internet. Em ?sim (aparelho de teste) não precisa. */
if(SIM==null&&'serviceWorker' in navigator&&window.isSecureContext) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(r=>{ if(typeof avReg!=='undefined'&&!avReg) avReg=r; }).catch(()=>{}));
/* sem internet / internet de volta: avisa, para saber que o progresso vai para a nuvem depois */
window.addEventListener('offline',()=>toast('📴 Sem internet. Dá para continuar jogando; o progresso vai para a nuvem quando voltar.'));
