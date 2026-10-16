/* Ranking8BP: reparación del Duelo de Trickshot en dispositivos móviles. */
(()=>{'use strict';
if(!window.__trickshotOnline?.embedded)return;
let matchId=null,lastRevision=-1,initialised=false,lastState=null,tries=0;
const game=window.__trickshotOnline;
const $=id=>document.getElementById(id);
const style=document.createElement('style');
style.id='trickshot-online-fix-css';
style.textContent='#ultimateMarcadorTurnos{display:none!important}html.ts-readonly #tacoBasicoUltimate,html.ts-readonly #tacoPrincipianteUltimate{pointer-events:none!important}';
document.head.append(style);
function initialise(state){
 const stage=$('pantallaMesaMaestra');
 if(!stage)return false;
 stage.classList.remove('oculto');
 if(stage.getBoundingClientRect().width<100||stage.getBoundingClientRect().height<100)return false;
 if(typeof nuevaPartidaTrickshotUltimate!=='function'||typeof bolasUltimate==='undefined')return false;
 if(matchId!==state.id){matchId=state.id;initialised=false;lastRevision=-1;}
 if(!initialised){
   nuevaPartidaTrickshotUltimate(state.distribution);
   const white=bolasUltimate[0];
   if(white&&Number.isFinite(Number(state.white_x))&&Number.isFinite(Number(state.white_y))){
     white.x=Number(state.white_x);white.y=Number(state.white_y);
   }
   initialised=true;
 }
 if(Array.isArray(state.distribution)&&state.distribution.length===6){
   bolasUltimate.slice(1).forEach((ball,i)=>{
     if(!ball)return;
     const col=state.distribution[i];
     if((col==='roja'||col==='amarilla')&&ball.color!==col){
       ball.color=col;ball.el.src=col==='roja'?'BOLA_ROJA.webp':'BOLA_AMARILLA.webp';
     }
     ball.boca=i;
   });
 }
 const frame=state.frame;
 if((!frame||!Array.isArray(frame.balls))&&state.phase!=='shot'&&(lastRevision!==state.revision||!bolasUltimate.slice(1).every(b=>b&&b.el.style.display!=='none'))){
   const d=dimensionesMesaUltimate(),pocketed=new Set(state.pocketed_indices||[]);
   bolasUltimate.slice(1).forEach((ball,i)=>{
     if(!ball)return;
     const loc=BOCAS_TRICKSHOT_ULTIMATE[i],xy=puntoOriginalLimitesUltimate(loc.x,loc.y,d);
     ball.x=xy.x/d.w;ball.y=xy.y/d.h;ball.vx=0;ball.vy=0;
     ball.entronerando=false;ball.entronerada=pocketed.has(i);
     ball.el.style.display=ball.entronerada?'none':'block';
     ball.el.style.opacity=ball.entronerada?'0':'1';ball.el.style.visibility='visible';
   });
 }
 lastRevision=state.revision;
 if(white){white.el.style.display='block';white.el.style.visibility='visible';white.el.style.opacity='1';}
 for(const ball of bolasUltimate){
   if(!ball?.el)continue;
   if(!ball.entronerada){ball.el.style.display='block';ball.el.style.visibility='visible';ball.el.style.opacity='1';}
   const file=ball===white?'BOLA_BLANCA.webp':ball.color==='amarilla'?'BOLA_AMARILLA.webp':'BOLA_ROJA.webp';
   const assets=window.__trickshotAssets;
   if(assets?.[file] && (!ball.el.currentSrc||!ball.el.currentSrc.startsWith('data:')))ball.el.src=assets[file];
 }
 if(typeof renderBolasUltimate==='function')renderBolasUltimate();
 return true;
}
function sync(state){
 lastState=state;
 if(initialise(state))return;
 // La mesa puede empezar oculta mientras el iframe calcula sus medidas.
 // Reintentar hasta que el diseño horizontal esté listo.
 if(tries++<120)requestAnimationFrame(()=>{if(lastState)sync(lastState)});
}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.source!=='ranking8bp-parent')return;
 if(event.data.type==='sync'&&event.data.state){tries=0;sync(event.data.state);return;}
 if(event.data.type==='mobile-shoot'){
   if(game.role!=='shooter'||game.localShooting||document.documentElement.classList.contains('ts-readonly'))return;
   const taco=$('tacoBasicoUltimate');if(!taco)return;
   const box=taco.getBoundingClientRect();
   const x=box.left+box.width/2,y=box.top+Math.min(12,box.height/4);
   const power=Math.max(5,Math.min(100,Number(event.data.power)||60));
   const opts={pointerId:9012,pointerType:'touch',button:0,buttons:1,clientX:x,clientY:y,bubbles:true,cancelable:true};
   taco.dispatchEvent(new PointerEvent('pointerdown',opts));
   const moved=y+box.height*.97*power/100;
   taco.dispatchEvent(new PointerEvent('pointermove',{...opts,clientY:moved}));
   taco.dispatchEvent(new PointerEvent('pointerup',{...opts,clientY:moved,buttons:0}));
 }
});
// Asegurar inicialización aunque el primer sync llegó antes de cargar este parche.
 parent.postMessage({source:'ranking8bp-game',type:'fix-ready'},location.origin);
})();