'use strict';
/* BOTÃO VOLTAR DO CELULAR: em vez de sair do jogo, fecha a janela aberta, pausa a partida ou volta para a tela anterior (como o "← Voltar" de cada tela); no menu, pede um segundo toque para sair */
const voltarArmado=()=>!!(history.state&&history.state.ddbVoltar);
/* deixa uma página a mais no histórico do navegador para o voltar do celular cair aqui; o Chrome só respeita a que foi criada depois de um toque, por isso arma no toque */
function voltarArmar(){ if(SIM!=null||voltarArmado()) return; try{ history.pushState({ddbVoltar:1},'',location.href); }catch(e){} }
const voltarVisivel=el=>!!el&&el.offsetParent!==null&&!el.hidden;
/* faz o que o voltar deve fazer agora; devolve false quando não há nada para voltar (menu inicial) */
function voltarAcao(){
  const aberto=id=>$(id)&&$(id).classList.contains('show'), tela=($('.screen.active')||{}).id;
  if(aberto('#scanner')){ $('#scanCancel').click(); return true; }
  const zoom=document.querySelector('.zoomov'); if(zoom){ zoom.remove(); return true; }
  if(aberto('#chatOv')){ chatFechar(); return true; }
  if(aberto('#quitOv')){ $('#qNo').click(); return true; }
  if(aberto('#slOv')){ $('#slNao').click(); return true; }
  if(aberto('#count')) return true;
  if(aberto('#end')){
    /* nas janelas, o botão claro do fim é sempre o de fechar/voltar (Fechar, Voltar, Menu, Agora não…); sem ele, o "Entendi" (ou o único botão) */
    const bs=[...$('#endBtns').children], ghost=bs.filter(b=>b.classList.contains('ghost')).pop(), ok=bs.find(b=>b.textContent==='Entendi'||b.textContent===trTxt('Entendi'));
    if(ghost) ghost.click(); else if(ok) ok.click(); else if(bs.length===1) bs[0].click();
    return true; }
  if(aberto('#pauseOv')){ if(voltarVisivel($('#pResume'))) $('#pResume').click(); return true; }
  if(tela==='game'){ const g=D||SH; if(g&&g.playing&&!g.paused&&!g.over) $('#gPause').click(); return true; }
  if(tela==='lobby'){ if(confirm('Sair da sala? Todos serão desconectados.')) $('#lobbyLeave').click(); return true; }
  if(tela==='spec'){ if(confirm('Parar de assistir?')) $('#spLeave').click(); return true; }
  if(tela&&tela!=='home'){ const b=$$(`#${tela} .back`).find(voltarVisivel); if(b){ b.click(); return true; } show('home'); return true; }
  return false;
}
if(SIM==null){
  document.addEventListener('click',voltarArmar,true);
  document.addEventListener('touchend',voltarArmar,true);
  window.addEventListener('popstate',e=>{
    if(e.state&&e.state.ddbVoltar) return;
    if(voltarAcao()){ voltarArmar(); return; }
    /* no menu: o primeiro voltar só avisa e não arma de novo, então o segundo sai do jogo (qualquer toque na tela arma outra vez) */
    toast('Toque em voltar de novo para sair');
  });
}
