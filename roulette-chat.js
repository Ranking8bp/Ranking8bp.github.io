/* Ranking8BP: ruleta del chat general administrada por IKAR8BP.
 * Fase de inscripción: cada usuario agrega su cuenta una sola vez a la lista. */
(() => {
 'use strict';
 const init=()=>{
  const chat=document.getElementById('communityChatModal');
  const chatOpen=document.getElementById('communityChatOpen');
  const history=document.getElementById('communityChatList');
  if(!chat||!chatOpen||!history)return;
  const conf=window.SUPABASE_CONFIG||{};
  if(!window.supabase?.createClient||!conf.url||!conf.key)return;
  const db=window.supabase.createClient(conf.url,conf.key,{auth:{persistSession:true,autoRefreshToken:true,storage:localStorage,storageKey:'ranking8bp-auth'}});
  const el=(tag,css,label)=>{
   const item=document.createElement(tag);
   if(css)item.className=css;
   if(label!==undefined)item.textContent=String(label);
   return item;
  };
  const btn=(label,fn,css)=>{
   const item=el('button',css,label);item.type='button';
   item.addEventListener('click',fn);return item;
  };
  const api=async(method,args)=>{
   const {data,error}=await db.rpc(method,args);
   if(error)throw error;
   return data;
  };
  const friendlyError=e=>{
   const t=String(e?.message||e||'');
   const mapping={
    SOLO_IKAR8BP:'Solo IKAR8BP puede crear o cerrar ruletas.',
    RULETA_YA_ABIERTA:'Ya hay una ruleta abierta. Ciérrala antes de crear otra.',
    RULETA_CERRADA:'Esta ruleta ya está cerrada.',
    INICIA_SESION:'Debes iniciar sesión para participar.',
    PERFIL_NO_DISPONIBLE:'No se encontró tu perfil registrado.',
    CUENTA_BLOQUEADA:'Tu cuenta está bloqueada.',
    RULETA_YA_GIRADA_O_CERRADA:'Esta ruleta ya terminó.',
    MINIMO_DOS_JUGADORES:'Necesitas por lo menos dos jugadores inscritos para girar.',
    SIN_JUGADORES:'No hay jugadores disponibles.'
   };
   return Object.keys(mapping).find(k=>t.includes(k))?mapping[Object.keys(mapping).find(k=>t.includes(k))]:(t||'Inténtalo de nuevo.');
  };
  let viewer=null,admin=false,active=null,busy=false,rosterBusy=false,rosterId=null,roster=[],lastPoll=0;
  let spinningId=null,spinTimeout=null;
  const animationsPlayed=new Set();
  const container=history.parentElement;
  const banner=el('section','rw-banner');banner.hidden=true;
  container.insertBefore(banner,container.querySelector('.sv-feed')||history);
  const create=btn('🎡 CREAR RULETA',()=>createRoulette(),'rw-create');create.hidden=true;
  function attachButton(){
   const other=chat.querySelector('.sv-create');
   const anchor=other||chat.querySelector('.community-challenge-area');
   if(anchor&&!create.isConnected)anchor.after(create);
  }
  attachButton();

  const overlay=el('div','rw-overlay');overlay.hidden=true;
  const panel=el('section','rw-panel');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Participantes de la ruleta');
  const header=el('header','rw-header');
  const title=el('strong','', '🎡 RULETA DE IKAR8BP');
  const exit=btn('✕',closeOverlay,'rw-exit');
  header.append(title,exit);
  const description=el('p','rw-description','Toca UNIRME para agregar tu nombre a la lista de la ruleta.');
  const count=el('div','rw-count','0 JUGADORES INSCRITOS');
  const wheelBox=el('div','rw-wheelbox');
  wheelBox.hidden=true;
  const wheel=el('canvas','rw-wheel');
  wheel.width=720;wheel.height=720;
  wheel.setAttribute('role','img');
  wheel.setAttribute('aria-label','Ruleta de jugadores inscritos');
  const wheelPointer=el('div','rw-pointer');
  const wheelCircle=el('div','rw-wheel-circle');
  wheelCircle.append(wheel);
  wheelBox.append(wheelPointer,wheelCircle);
  const winnerCard=el('div','rw-winner');winnerCard.hidden=true;
  const joinBar=el('div','rw-actions');
  const joinButton=btn('🎡 UNIRME A LA RULETA',join,'rw-join');
  const joined=el('strong','rw-joined','✅ YA ESTÁS EN LA RULETA');joined.hidden=true;
  joinBar.append(joinButton,joined);
  const listTitle=el('h3','rw-list-title','PARTICIPANTES');
  const rosterBox=el('div','rw-roster');
  const status=el('small','rw-status','');
  const adminBar=el('div','rw-adminbar');
  const spinButton=btn('🎯 GIRAR RULETA',spinRoulette,'rw-spin');
  const closeButton=btn('CANCELAR RULETA',closeRoulette,'rw-close-roulette');
  adminBar.append(spinButton,closeButton);
  panel.append(header,description,count,wheelBox,winnerCard,joinBar,listTitle,rosterBox,adminBar,status);
  overlay.append(panel);document.body.append(overlay);
  overlay.addEventListener('click',event=>{if(event.target===overlay)closeOverlay()});

  function notice(text){status.textContent=text||'';}
  function closeOverlay(){overlay.hidden=true;}
  function picture(path){
   if(!path)return '';
   if(/^https:\/\//i.test(path))return path;
   const key=String(path).replace(/^profile-photos\//,'').replace(/^\/+/,'');
   return db.storage.from('profile-photos').getPublicUrl(key).data?.publicUrl||'';
  }
  function avatar(p){
   const name=p.player_name||'Jugador';
   const wrap=el('span','rw-avatar',name.charAt(0).toUpperCase());
   const url=picture(p.avatar_path);
   if(url){
    const img=el('img');img.src=url;img.alt='Foto de '+name;img.loading='lazy';
    img.onerror=()=>{img.remove();wrap.textContent=name.charAt(0).toUpperCase();};
    wrap.replaceChildren(img);
   }
   return wrap;
  }
  function renderRoster(){
   rosterBox.replaceChildren();
   if(!roster.length){
    rosterBox.append(el('p','rw-empty','Todavía no se ha inscrito nadie. ¡Sé el primero!'));
    return;
   }
   roster.forEach((p,index)=>{
    const item=el('div','rw-player');
    if(active?.status==='finished'&&active.winner_id===p.player_id)item.classList.add('rw-player-winner');
    item.append(el('span','rw-number',String(index+1)),avatar(p));
    const rank=window.rankingChatProfileBridge?.rank?.(Number(p.elo_points??200));
    if(rank?.image){
     const img=el('img','rw-rank');img.src=rank.image;img.alt=rank.name||'Insignia';
     img.loading='lazy';img.onerror=()=>img.remove();item.append(img);
    }
    item.append(el('span','rw-player-name',p.player_name||'Jugador'));
    if(viewer===p.player_id)item.append(el('span','rw-you','TÚ'));
    rosterBox.append(item);
   });
  }

  const palette=['#793bad','#2b7798','#bb5658','#419f82','#bf802b','#7453c9','#bd4787','#387cac','#b58a3d','#497c57'];
  function paintWheel(){
   if(spinningId||overlay.hidden)return;
   wheelBox.hidden=roster.length===0;
   const ctx=wheel.getContext('2d');
   if(!ctx)return;
   ctx.clearRect(0,0,720,720);
   const n=roster.length;
   if(!n)return;
   const radius=346,cx=360,cy=360,unit=2*Math.PI/n;
   for(let i=0;i<n;i++){
    const start=-Math.PI/2+i*unit,end=start+unit;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,start,end);ctx.closePath();
    ctx.fillStyle=palette[i%palette.length];ctx.fill();
    ctx.lineWidth=n>180?0.35:1.6;ctx.strokeStyle='#ffffff90';ctx.stroke();
    if(n<=72){
     const mid=start+unit/2;
     ctx.save();ctx.translate(cx,cy);ctx.rotate(mid);
     ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#fff';
     ctx.shadowColor='#000b';ctx.shadowBlur=4;
     ctx.font='bold '+(n>55?10:n>35?12:n>23?16:n>12?20:26)+'px system-ui, sans-serif';
     const maxLen=n>55?7:n>35?9:n>23?9:n>12?13:18;
     ctx.fillText((roster[i].player_name||'Jugador').slice(0,maxLen),radius-17,0,radius-74);
     ctx.restore();
    }
   }
   ctx.beginPath();ctx.arc(cx,cy,50,0,2*Math.PI);ctx.fillStyle='#101b32';ctx.fill();
   ctx.strokeStyle='#ffe4a8';ctx.lineWidth=9;ctx.stroke();
   ctx.fillStyle='#ffe49d';ctx.font='bold 25px system-ui, sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎱',cx,cy);
  }
  function winningAngle(){
   if(!active||!roster.length)return null;
   const index=roster.findIndex(p=>p.player_id===active.winner_id);
   if(index<0)return null;
   const slice=360/roster.length;
   return (360-(index+0.5)*slice+360)%360;
  }
  function showWinner(){
   if(!active||active.status!=='finished'||spinningId)return;
   const p=roster.find(x=>x.player_id===active.winner_id);
   winnerCard.replaceChildren();
   winnerCard.append(el('div','rw-winner-label','🏆 ¡GANADOR DE LA RULETA!'));
   if(p)winnerCard.append(avatar(p));
   winnerCard.append(el('strong','rw-winner-name',active.winner_name||p?.player_name||'Jugador'));
   winnerCard.append(el('span','rw-winner-sub','Seleccionado aleatoriamente entre '+active.participants+' participantes'));
   winnerCard.hidden=false;
   if(roster.length){
    wheelBox.hidden=false;
    if(!animationsPlayed.has(Number(active.roulette_id))){
     const target=winningAngle();
     if(target!==null){wheel.style.transition='none';wheel.style.transform='rotate('+target+'deg)';}
    }
   }
   renderRoster();
  }
  function animateWinner(){
   if(!active||active.status!=='finished'||overlay.hidden)return showWinner();
   const id=Number(active.roulette_id);
   if(animationsPlayed.has(id))return showWinner();
   const angle=winningAngle();
   if(angle===null)return showWinner();
   animationsPlayed.add(id);spinningId=id;winnerCard.hidden=true;
   wheelBox.hidden=false;
   wheel.style.transition='none';wheel.style.transform='rotate(0deg)';
   // Forzamos el estilo inicial antes de animar el giro.
   void wheel.offsetWidth;
   wheel.style.transition='transform 5.8s cubic-bezier(.12,.72,.12,1)';
   wheel.style.transform='rotate('+(360*8+angle)+'deg)';
   clearTimeout(spinTimeout);
   spinTimeout=setTimeout(()=>{
    if(active&&Number(active.roulette_id)===id){
     spinningId=null;showWinner();notice('🏆 ¡La ruleta eligió a '+(active.winner_name||'un jugador')+'!');
    }else spinningId=null;
   },5900);
  }
  async function spinRoulette(){
   if(!admin||!active||active.status!=='open'||spinButton.disabled)return;
   if(Number(active.participants)<2){notice('Se necesitan al menos 2 inscritos.');return;}
   if(!window.confirm('¿GIRAR LA RULETA ENTRE '+active.participants+' JUGADORES?\nEl ganador será definitivo y se cerrarán las inscripciones.'))return;
   const id=active.roulette_id;
   spinButton.disabled=true;notice('🎡 Preparando el giro aleatorio...');
   try{
    await api('chat_roulette_spin',{p_roulette_id:id});
    await refresh();
   }catch(e){notice(friendlyError(e));await refresh();}
   finally{spinButton.disabled=false;}
  }
  function renderBanner(){
   banner.replaceChildren();
   banner.hidden=!active;
   if(!active)return;
   const finished=active.status==='finished';
   banner.append(el('strong','rw-banner-title',finished?'🏆 ¡GANADOR DE LA RULETA!':'🎡 RULETA ABIERTA · IKAR8BP'));
   banner.append(el('span','rw-banner-count',finished?'🎉 '+(active.winner_name||'Jugador ganador'):active.participants+' jugadores inscritos'));
   if(!finished&&active.has_joined)banner.append(el('span','rw-banner-confirm','✅ YA ESTÁS INSCRITO'));
   banner.append(btn(finished?'🏆 VER GANADOR':active.has_joined?'👀 VER LISTA DE LA RULETA':'🎡 UNIRME A LA RULETA',()=>{
    openOverlay(false);
    if(active?.status==='open'&&!active.has_joined)join();else loadRoster();
   },'rw-banner-action'));
  }
  function renderControls(){
   if(!active){closeOverlay();return;}
   const open=active.status==='open',mine=!!active.has_joined;
   joinButton.hidden=mine||!open;
   joinButton.disabled=false;
   joined.hidden=!mine;
   description.textContent=open?'Toca UNIRME para agregar tu nombre a la lista de la ruleta.':'Inscripciones cerradas. El resultado está guardado y no puede cambiarse.';
   count.textContent=String(active.participants)+' '+(active.participants===1?'JUGADOR INSCRITO':'JUGADORES INSCRITOS');
   adminBar.hidden=!admin||!open;
   spinButton.hidden=!open;
   spinButton.disabled=!open||Number(active.participants)<2;
   spinButton.title=Number(active.participants)<2?'Se necesitan al menos dos inscritos':'Elegir un ganador al azar y cerrar inscripciones';
  }
  async function loadRoster(){
   if(!active||overlay.hidden||rosterBusy)return;
   const id=active.roulette_id;
   rosterBusy=true;
   try{
    const rows=await api('chat_roulette_players',{p_roulette_id:id})||[];
    if(!active||active.roulette_id!==id)return;
    rosterId=id;
    roster=rows;
    renderRoster();
    paintWheel();
    // El ganador definitivo se mostrará después del giro cuando es un resultado nuevo.
    if(active.status==='finished'&&!spinningId)showWinner();
    // El feed actualiza el contador. La lista muestra el total exacto recibido.
    count.textContent=roster.length+' '+(roster.length===1?'JUGADOR INSCRITO':'JUGADORES INSCRITOS');
   }catch(e){notice('No se pudo cargar la lista: '+friendlyError(e));}
   finally{rosterBusy=false;}
  }
  function openOverlay(load){
   if(!active)return;
   overlay.hidden=false;
   notice('');
   renderControls();
   if(rosterId!==active.roulette_id){roster=[];rosterId=null;renderRoster();}
   if(load)loadRoster();
   if(active.status==='finished'&&!spinningId)showWinner();
  }
  async function refresh(){
   if(busy||!viewer)return;
   busy=true;
   try{
    const rows=await api('chat_roulette_feed')||[];
    const next=rows[0]||null;
    const previous=active;
    if(active?.roulette_id!==next?.roulette_id){
     roster=[];rosterId=null;winnerCard.hidden=true;
     spinningId=null;clearTimeout(spinTimeout);
     wheel.style.transition='none';wheel.style.transform='rotate(0deg)';
    }
    active=next;
    renderBanner();
    renderControls();
    if(active&&!overlay.hidden){
     await loadRoster();
     if(active.status==='finished'){
      const newResult=previous?.roulette_id===active.roulette_id&&previous.status==='open';
      if(newResult&&!spinningId)animateWinner();
      else if(!spinningId)showWinner();
     }else winnerCard.hidden=true;
    }
   }catch(e){console.warn('Ruleta: actualizar',e);}
   finally{busy=false;}
  }
  async function join(){
   if(!active||active.status!=='open'||joinButton.disabled)return;
   joinButton.disabled=true;notice('Inscribiéndote en la ruleta...');
   try{
    const id=active.roulette_id;
    const result=await api('chat_roulette_join',{p_roulette_id:id});
    notice(result==='already_joined'?'Ya estabas inscrito.':'✅ Te uniste a la ruleta correctamente.');
    active.has_joined=true;
    renderBanner();renderControls();
    await refresh();
    await loadRoster();
   }catch(e){notice(friendlyError(e));}
   finally{joinButton.disabled=false;}
  }
  async function createRoulette(){
   if(create.disabled)return;
   create.disabled=true;
   try{
    const id=await api('chat_roulette_create');
    await refresh();
    if(active&&Number(active.roulette_id)===Number(id))openOverlay(true);
   }catch(e){window.alert(friendlyError(e));}
   finally{create.disabled=false;}
  }
  async function closeRoulette(){
   if(!active||active.status!=='open'||closeButton.disabled)return;
   if(!window.confirm('¿Cerrar esta ruleta? Los jugadores ya no podrán inscribirse.'))return;
   closeButton.disabled=true;
   try{
    await api('chat_roulette_close',{p_roulette_id:active.roulette_id});
    notice('Ruleta cerrada. Puedes crear una nueva.');
    await refresh();
   }catch(e){notice(friendlyError(e));}
   finally{closeButton.disabled=false;}
  }
  async function checkSession(){
   try{
    const {data,error}=await db.auth.getUser();
    if(error)throw error;
    const before=viewer;
    viewer=data?.user?.id||null;
    if(!viewer){
     admin=false;active=null;
     banner.hidden=true;create.hidden=true;closeOverlay();return;
    }
    if(before!==viewer||!admin)admin=(await api('stream_vs_is_ikar'))===true;
    create.hidden=!admin;
    attachButton();
    await refresh();
   }catch(e){console.warn('Ruleta: sesión',e);}
  }
  // Las actualizaciones de los inscritos llegan por Realtime; sondeo de respaldo
  // únicamente con el chat o la lista abierta para limitar consultas.
  let debounce=null;
  const soon=()=>{clearTimeout(debounce);debounce=setTimeout(()=>refresh(),250);};
  try{
   db.channel('ranking8bp-chat-roulette')
    .on('postgres_changes',{event:'*',schema:'public',table:'chat_roulettes'},soon)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_roulette_entries'},soon)
    .subscribe();
  }catch(e){console.warn('Ruleta: Realtime',e);}
  chatOpen.addEventListener('click',()=>setTimeout(checkSession,200));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkSession();});
  db.auth.onAuthStateChange((event)=>{
   if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(checkSession,450);
  });
  setInterval(()=>{
   if(document.hidden||!viewer||(chat.hidden&&overlay.hidden))return;
   const now=Date.now();
   if(now-lastPoll>=12000){lastPoll=now;refresh();}
  },4000);
  setTimeout(checkSession,800);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();