/* Ranking8BP: Duelo de Trickshot, integrado en el Chat General.
   El chat original sigue gestionando los comentarios, la audiencia mira arriba. */
(()=>{'use strict';
const init=()=>{
 const chat=document.getElementById('communityChatModal');
 const challenge=document.getElementById('communityChallengeArea');
 const history=document.getElementById('communityChatList');
 if(!chat||!challenge||!history)return;
 const byId=id=>document.getElementById(id);
 const button=document.createElement('button');
 button.id='trickshotLaunch';button.type='button';button.textContent='🎱 DUELO DE TRICKSHOT';
 challenge.appendChild(button);
 const live=document.createElement('section');
 live.id='trickshotLive';live.hidden=true;
 live.innerHTML=`<div class="ts-live-head"><strong>🎱 DUELO DE TRICKSHOT</strong><span class="ts-live-indicator">● EN VIVO</span></div>
 <div class="ts-names"><span id="tsYellowPlayer">🟡 AMARILLAS</span><span id="tsTimer">15 s</span><span id="tsRedPlayer">ROJAS 🔴</span></div>
 <div class="ts-stage"><iframe id="tsGame" title="Duelo de Trickshot en vivo" allow="autoplay" loading="lazy"></iframe><div id="tsWaiting" class="ts-waiting" hidden></div></div>
 <div class="ts-scores"><span id="tsYellowScore">🟡 0/3</span><span id="tsTurnLabel">Esperando partida...</span><span id="tsRedScore">🔴 0/3</span></div>
 <div id="tsResult" class="ts-result" hidden></div>`;
 history.before(live);
 const prompt=document.createElement('div');
 prompt.id='tsChooseOverlay';prompt.hidden=true;
 prompt.innerHTML=`<div class="ts-choose-panel"><header>🎱 DUELO DE TRICKSHOT</header>
 <p>ESCOGE CON QUÉ BOLAS QUIERES JUGAR</p>
 <div class="ts-choose-buttons"><button type="button" data-ts-color="amarilla">🟡 AMARILLAS</button>
 <button type="button" data-ts-color="roja">🔴 ROJAS</button></div>
 <button type="button" id="tsChooseCancel">CANCELAR</button></div>`;
 chat.appendChild(prompt);
 let state=null,role='spectator',currentMatch=0,realtime=null,gameReady=false,busy=false,lastFrameAt=0;
 let lastCheck=0,lastAdvance=0,lastSync=0,lastShotReq=false,updating=false;
 const client=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
 const user=()=>typeof currentUser!=='undefined'?currentUser:null;
 const ui=(id,text)=>{const e=byId(id);if(e)e.textContent=text;};
 function alertMsg(s){const t=byId('communityChatInfo');if(t)t.textContent=s;}
 async function rpc(name,args={}){if(!client())throw Error('Conexión no disponible.');const {data,error}=await client().rpc(name,args);if(error)throw error;return data;}
 const isPlayer=()=>state&&user()&&[state.player1_id,state.player2_id].includes(user().id);
 const myColor=()=>!state||!user()?null:state.yellow_id===user().id?'amarilla':state.red_id===user().id?'roja':null;
 const active=()=>state&&['active','shot'].includes(state.phase);
 const canShoot=()=>active()&&state.phase==='active'&&state.turn_id===user()?.id&&role!=='spectator';
 function timeRemaining(){if(!state||!state.turn_until)return 15;return Math.max(0,Math.ceil((new Date(state.turn_until).getTime()-Date.now())/1000))}
 function sendToGame(data){const f=byId('tsGame');if(gameReady&&f?.contentWindow)f.contentWindow.postMessage({source:'ranking8bp-parent',...data},location.origin)}
 function render(){
  if(!state||state.phase==='empty'||state.phase==='cancelled'){live.hidden=true;return;}
  live.hidden=false;
  ui('tsYellowPlayer','🟡 '+(state.yellow_id===state.player1_id?state.player1_name:state.player2_name||'AMARILLAS'));
  ui('tsRedPlayer',(state.red_id===state.player1_id?state.player1_name:state.player2_name||'ROJAS')+' 🔴');
  ui('tsYellowScore','🟡 '+(state.yellow_scored||0)+'/3');ui('tsRedScore','🔴 '+(state.red_scored||0)+'/3');
  const f=byId('tsGame'), w=byId('tsWaiting'),r=byId('tsResult');
  if(state.phase==='waiting'){
    f.hidden=true;w.hidden=false;w.textContent='⏳ ESPERANDO JUGADOR...';
    ui('tsTurnLabel','El primer jugador eligió '+(state.player1_color==='amarilla'?'amarillas':'rojas'));
    r.hidden=true;ui('tsTimer','ESPERA');
  }else{
    f.hidden=false;w.hidden=true;
    if(!f.dataset.started){f.dataset.started='yes';f.src='./trickshot/index.html?ranking8bp=1';gameReady=false;}
    ui('tsTurnLabel',state.phase==='finished'?'PARTIDA FINALIZADA':state.turn_id===state.yellow_id?'TURNO: AMARILLAS':'TURNO: ROJAS');
    ui('tsTimer',state.phase==='shot'?'TIRO':timeRemaining()+' s');
    r.hidden=state.phase!=='finished';
    if(state.phase==='finished'){r.textContent='🏆 '+(state.winner_id===state.yellow_id?'¡AMARILLAS GANAN!':'¡ROJAS GANAN!')+' · RESULTADO PROVISIONAL · ELO EN VALIDACIÓN';}
    sendToGame({type:'sync',state,role:canShoot()?'shooter':'viewer',color:myColor()});
  }
 }
 function subscribe(id){
  if(currentMatch===id)return;
  const oldFrame=byId('tsGame');if(oldFrame){oldFrame.dataset.started='';oldFrame.removeAttribute('src');}
  if(realtime&&client())client().removeChannel(realtime);
  realtime=null;currentMatch=id;gameReady=false;
  if(!id)return;
  realtime=client().channel('trickshot-game-'+id);
  realtime.on('broadcast',{event:'frame'},({payload})=>{
    if(!payload||payload.match!==currentMatch||payload.by===user()?.id)return;
    sendToGame({type:'frame',frame:payload.frame});
  });
  realtime.on('postgres_changes',{event:'UPDATE',schema:'public',table:'trickshot_duels',filter:'id=eq.'+id},()=>refresh(false));
  realtime.subscribe();
 }
 async function refresh(force=false){
  if(updating)return;const now=Date.now();if(!force&&now-lastCheck<700)return;
  updating=true;lastCheck=now;
  try{
   const s=await rpc('trickshot_public_state');
   if(!s||s.phase==='empty'){state=s||{phase:'empty'};subscribe(0);render();return;}
   if(s.id!==currentMatch)subscribe(s.id);
   state=s;role=isPlayer()?'player':'spectator';render();
  }catch(e){alertMsg('Duelo de Trickshot: '+(e.message||e))}
  finally{updating=false;}
 }
 async function join(color=null){
  if(busy)return;if(!user()){alertMsg('Inicia sesión para participar.');return;}
  busy=true;button.disabled=true;prompt.hidden=true;
  try{
   const data=await rpc('trickshot_join',{p_color:color});
   if(data?.role==='choose'){prompt.hidden=false;return;}
   await refresh(true);
   if(data?.role==='spectator')alertMsg('Duelo en curso: estás viendo como espectador.');
  }catch(e){alertMsg(e.message||'No se pudo entrar al duelo.');}
  finally{busy=false;button.disabled=false;}
 }
 button.addEventListener('click',()=>join(null));
 prompt.querySelectorAll('[data-ts-color]').forEach(b=>b.onclick=()=>join(b.dataset.tsColor));
 byId('tsChooseCancel').onclick=()=>prompt.hidden=true;
 const open=byId('communityChatOpen');
 if(open)open.addEventListener('click',()=>setTimeout(()=>refresh(true),350));
 window.addEventListener('message',async e=>{
  if(e.origin!==location.origin||e.source!==byId('tsGame')?.contentWindow||!e.data||e.data.source!=='ranking8bp-game')return;
  const data=e.data;
  if(data.type==='ready'){gameReady=true;render();return;}
  if(!state||!active()||currentMatch!==state.id||!isPlayer())return;
  if(data.type==='shot-start'){
   if(!canShoot())return;
   try{state=await rpc('trickshot_start',{p_match:currentMatch});lastShotReq=true;render();sendToGame({type:'shot-authorized'});}
   catch(error){alertMsg('No se autorizó el tiro: '+(error.message||error));sendToGame({type:'reject-shot'});}
   return;
  }
  if(data.type==='frame'){
   if(state.phase!=='shot'||state.turn_id!==user()?.id||!realtime)return;
   const now=performance.now();
   if(now-lastFrameAt<110)return;lastFrameAt=now;
   realtime.send({type:'broadcast',event:'frame',payload:{match:currentMatch,by:user().id,frame:data.frame}});
   return;
  }
  if(data.type==='shot-end'){
   if(state.phase!=='shot'||state.turn_id!==user()?.id)return;
   try{state=await rpc('trickshot_finish',{p_match:currentMatch,p_events:data.events||[],p_frame:data.frame||{}});render();}
   catch(error){alertMsg('Error registrando tiro: '+(error.message||error));await refresh(true);}
  }
 });
 setInterval(()=>{
  if(chat.hidden||!user())return;
  const now=Date.now();
  if(state&&state.phase==='active'){
   ui('tsTimer',timeRemaining()+' s');
   if(isPlayer()&&timeRemaining()<=0&&now-lastAdvance>3000){
    lastAdvance=now;rpc('trickshot_advance').then(s=>{state=s;render()}).catch(()=>{});
   }
  }
  if(state?.phase==='waiting'&&state.player1_id===user()?.id&&now-lastSync>30000){lastSync=now;rpc('trickshot_join',{p_color:null}).catch(()=>{});}
  if(now-lastCheck>14000)refresh(true);
 },1000);
 refresh(true);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();