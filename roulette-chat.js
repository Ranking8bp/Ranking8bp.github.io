/* Ranking8BP: selector aleatorio de inscritos del chat general administrado por IKAR8BP. */
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
    SOLO_IKAR8BP:'Solo IKAR8BP puede crear o cerrar selecciones.',
    RULETA_YA_ABIERTA:'Ya hay un selector abierto. Ciérralo antes de crear otro.',
    RULETA_CERRADA:'Esta selección ya está cerrada.',
    INICIA_SESION:'Debes iniciar sesión para participar.',
    PERFIL_NO_DISPONIBLE:'No se encontró tu perfil registrado.',
    CUENTA_BLOQUEADA:'Tu cuenta está bloqueada.',
    RULETA_YA_GIRADA_O_CERRADA:'Esta selección ya terminó.',
    MINIMO_DOS_JUGADORES:'Necesitas al menos dos jugadores inscritos para seleccionar.',
    SIN_JUGADORES:'No hay jugadores disponibles.',
    EXPULSADO_DEL_SELECTOR:'El administrador te quitó de este selector. No puedes volver a inscribirte aquí.',
    JUGADOR_NO_INSCRITO:'Este jugador ya no está inscrito.',
    SELECTOR_CERRADO:'Esta selección ya terminó y no permite eliminar participantes.'
   };
   return Object.keys(mapping).find(k=>t.includes(k))?mapping[Object.keys(mapping).find(k=>t.includes(k))]:(t||'Inténtalo de nuevo.');
  };
  let viewer=null,admin=false,active=null,busy=false,rosterBusy=false,rosterId=null,roster=[],lastPoll=0;
  let spinningId=null,spinTimeout=null,spinTick=null,removingPlayerId=null;
  let dismissedSelectors=new Set(),dismissalsLoadedFor=null;
  const animationsPlayed=new Set();
  const container=history.parentElement;
  const banner=el('section','rw-banner');banner.hidden=true;
  container.insertBefore(banner,container.querySelector('.sv-feed')||history);
  const create=btn('🎯 CREAR SELECTOR',()=>createRoulette(),'rw-create');create.hidden=true;
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
  panel.setAttribute('aria-label','Selector aleatorio de participantes');
  const header=el('header','rw-header');
  const title=el('strong','', '🎯 SELECTOR ALEATORIO · IKAR8BP');
  const exit=btn('✕',closeOverlay,'rw-exit');
  header.append(title,exit);
  const description=el('p','rw-description','Inscríbete para participar en la selección aleatoria.');
  const count=el('div','rw-count','0 JUGADORES INSCRITOS');
  const selector=el('div','rw-selector');selector.hidden=true;
  const selectorTop=el('div','rw-selector-top','🎯 SELECCIÓN ALEATORIA');
  const selectorName=el('strong','rw-selector-name','ESPERANDO PARTICIPANTES');
  const selectorHint=el('span','rw-selector-hint','Todos los inscritos participan por igual');
  selector.append(selectorTop,selectorName,selectorHint);
  const winnerCard=el('div','rw-winner');winnerCard.hidden=true;
  const joinBar=el('div','rw-actions');
  const joinButton=btn('✅ INSCRIBIRME',join,'rw-join');
  const joined=el('strong','rw-joined','✅ YA ESTÁS INSCRITO');joined.hidden=true;
  joinBar.append(joinButton,joined);
  const listTitle=el('h3','rw-list-title','PARTICIPANTES');
  const rosterBox=el('div','rw-roster');
  const status=el('small','rw-status','');
  const adminBar=el('div','rw-adminbar');
  const spinButton=btn('🎯 SELECCIONAR GANADOR',spinRoulette,'rw-spin');
  const closeButton=btn('CANCELAR SELECCIÓN',closeRoulette,'rw-close-roulette');
  adminBar.append(spinButton,closeButton);
  panel.append(header,description,count,selector,winnerCard,joinBar,listTitle,rosterBox,adminBar,status);
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
    const winning=active?.status==='finished'&&!spinningId&&active.winner_id===p.player_id;
    if(winning){
     item.classList.add('rw-player-winner','rw-winner-profile-link');
     item.setAttribute('role','button');
     item.tabIndex=0;
     item.title='Ver perfil del ganador';
     item.addEventListener('click',openWinnerProfile);
     item.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openWinnerProfile();}
     });
    }
    item.append(el('span','rw-number',String(index+1)),avatar(p));
    const rank=window.rankingChatProfileBridge?.rank?.(Number(p.elo_points??200));
    if(rank?.image){
     const img=el('img','rw-rank');img.src=rank.image;img.alt=rank.name||'Insignia';
     img.loading='lazy';img.onerror=()=>img.remove();item.append(img);
    }
    item.append(el('span','rw-player-name',p.player_name||'Jugador'));
    if(viewer===p.player_id)item.append(el('span','rw-you','TÚ'));
    if(winning)item.append(el('span','rw-profile-symbol','VER PERFIL ›'));
    if(admin&&active?.status==='open'){
     const removeBtn=btn('✕',()=>removePlayer(p),'rw-remove-player');
     removeBtn.title='Quitar a '+(p.player_name||'Jugador')+' de esta selección';
     removeBtn.setAttribute('aria-label','Quitar a '+(p.player_name||'Jugador')+' de la lista');
     removeBtn.disabled=removingPlayerId!==null;
     item.append(removeBtn);
    }
    rosterBox.append(item);
   });
  }

  async function removePlayer(player){
   if(!admin||!active||active.status!=='open'||removingPlayerId!==null||!player?.player_id)return;
   const name=String(player.player_name||'Jugador');
   if(!window.confirm('¿QUITAR A '+name+' DE ESTA SELECCIÓN?\\nNo podrá volver a inscribirse en esta misma selección, pero sí en las siguientes.'))return;
   const id=active.roulette_id;
   removingPlayerId=player.player_id;
   rosterBox.querySelectorAll('.rw-remove-player').forEach(button=>button.disabled=true);
   try{
    await api('chat_roulette_remove',{p_roulette_id:id,p_player_id:player.player_id});
    if(active&&active.roulette_id===id){
     roster=roster.filter(p=>p.player_id!==player.player_id);
     active.participants=roster.length;
     if(active.has_joined&&viewer===player.player_id)active.has_joined=false;
     count.textContent=roster.length+' '+(roster.length===1?'JUGADOR INSCRITO':'JUGADORES INSCRITOS');
     renderRoster();renderSelector();renderBanner();renderControls();
    }
    notice('✅ '+name+' fue quitado. No podrá volver a este selector.');
    await refresh();
    await loadRoster();
   }catch(error){
    notice('No se pudo quitar al jugador: '+friendlyError(error));
    console.error('Eliminar inscrito del selector:',error);
    await loadRoster();
   }finally{
    removingPlayerId=null;
    renderRoster();
   }
  }
  // No rueda, círculo, aguja o iconos de azar: solo nombres en un panel.
  function renderSelector(){
   if(spinningId||overlay.hidden)return;
   const enabled=roster.length>0&&active?.status==='open';
   selector.hidden=!enabled;
   if(enabled)winnerCard.hidden=true;
   if(enabled){
    selector.classList.remove('rw-selecting');
    selectorName.textContent=roster.length+' PARTICIPANTES';
    selectorHint.textContent='Cada participante tiene la misma posibilidad';
   }
  }
  // Abre la ficha original de Ranking8BP: desde allí funciona ✉️ MENSAJE.
  // Se obtiene el perfil actual por UUID, nunca se busca solo por nombre.
  let openingWinner=false;
  async function openWinnerProfile(){
   if(openingWinner||!active||active.status!=='finished'||!active.winner_id)return;
   const id=String(active.winner_id);
   const expectedRoulette=active.roulette_id;
   openingWinner=true;
   const openButtons=[...winnerCard.querySelectorAll('button')];
   openButtons.forEach(button=>button.disabled=true);
   try{
    if(typeof window.rankingChatProfileBridge?.open!=='function')
     throw new Error('La ficha del jugador todavía no está disponible.');
    const {data,error}=await db.rpc('get_profile_by_id',{p_player_id:id});
    if(error)throw error;
    const p=Array.isArray(data)?data[0]:data;
    if(!p)throw new Error('No se encontró el perfil del ganador.');
    if(!active||active.roulette_id!==expectedRoulette||active.winner_id!==id)return;
    // El perfil queda accesible también en celulares, sin la capa del selector encima.
    closeOverlay();
    await window.rankingChatProfileBridge.open({...p,id,player_id:id});
   }catch(error){
    console.error('Abrir perfil del ganador:',error);
    notice('No se pudo abrir el perfil: '+(error?.message||'Inténtalo de nuevo.'));
   }finally{
    openingWinner=false;
    openButtons.forEach(button=>button.disabled=false);
   }
  }
  function showWinner(){
   if(!active||active.status!=='finished'||spinningId)return;
   const p=roster.find(x=>x.player_id===active.winner_id);
   selector.hidden=true;
   winnerCard.replaceChildren();
   winnerCard.append(el('div','rw-winner-label','🏆 ¡JUGADOR SELECCIONADO!'));
   const winnerProfile=btn('',openWinnerProfile,'rw-winner-profile');
   winnerProfile.title='Ver el perfil y enviar un mensaje al ganador';
   winnerProfile.setAttribute('aria-label','Ver perfil de '+(active.winner_name||p?.player_name||'jugador seleccionado')+' y enviar mensaje');
   if(p)winnerProfile.append(avatar(p));
   winnerProfile.append(el('strong','rw-winner-name',active.winner_name||p?.player_name||'Jugador'));
   winnerProfile.append(el('span','rw-profile-open','👤 VER PERFIL Y ENVIAR MENSAJE ›'));
   winnerCard.append(winnerProfile,el('span','rw-winner-sub','Elegido aleatoriamente entre '+active.participants+' participantes'));
   winnerCard.hidden=false;
   renderRoster();
   renderBanner();
  }
  function stopSelectorAnimation(){
   clearTimeout(spinTimeout);clearTimeout(spinTick);
   spinTimeout=null;spinTick=null;
   spinningId=null;
   selector.classList.remove('rw-selecting');
  }
  function animateWinner(){
   if(!active||active.status!=='finished'||overlay.hidden)return showWinner();
   const id=Number(active.roulette_id);
   if(animationsPlayed.has(id))return showWinner();
   if(!roster.length)return showWinner();
   animationsPlayed.add(id);
   stopSelectorAnimation();
   spinningId=id;
   winnerCard.hidden=true;
   selector.hidden=false;
   selector.classList.add('rw-selecting');
   selectorTop.textContent='🎯 SELECCIONANDO JUGADOR...';
   selectorHint.textContent='Buscando entre '+roster.length+' nombres inscritos';
   const started=Date.now(),duration=4900;
   let position=0;
   function next(){
    if(spinningId!==id||overlay.hidden||!active||Number(active.roulette_id)!==id){
     stopSelectorAnimation();
     return;
    }
    const elapsed=Date.now()-started;
    if(elapsed>=duration){
     stopSelectorAnimation();
     selectorTop.textContent='🎯 SELECCIÓN ALEATORIA';
     showWinner();
     notice('🏆 ¡Jugador seleccionado: '+(active.winner_name||'Jugador')+'!');
     return;
    }
    // Los nombres que pasan son una animación; el ganador real lo fija Supabase.
    const player=roster[position++%roster.length];
    selectorName.textContent=player?.player_name||'Jugador';
    const delay=elapsed>3500?230:elapsed>2500?150:85;
    spinTick=setTimeout(next,delay);
   }
   next();
  }
  async function spinRoulette(){
   if(!admin||!active||active.status!=='open'||spinButton.disabled)return;
   if(Number(active.participants)<2){notice('Se necesitan al menos 2 inscritos.');return;}
   if(!window.confirm('¿SELECCIONAR UN GANADOR ENTRE '+active.participants+' JUGADORES?\\nEl resultado será definitivo y se cerrarán las inscripciones.'))return;
   const id=active.roulette_id;
   spinButton.disabled=true;notice('🎯 Seleccionando un jugador al azar...');
   try{
    await api('chat_roulette_spin',{p_roulette_id:id});
    await refresh();
   }catch(e){notice(friendlyError(e));await refresh();}
   finally{spinButton.disabled=false;}
  }
  async function loadDismissedSelectors(force=false){
   if(!viewer||(!force&&dismissalsLoadedFor===viewer))return;
   const requestedUser=viewer;
   try{
    const rows=await api('chat_result_dismissed')||[];
    if(viewer!==requestedUser)return;
    dismissedSelectors=new Set(rows.filter(row=>row.result_type==='selector').map(row=>Number(row.result_id)));
    dismissalsLoadedFor=requestedUser;
    renderBanner();
   }catch(error){console.warn('Resultados cerrados del selector:',error)}
  }
  async function dismissFinishedSelector(id){
   const selectedId=Number(id);
   if(!viewer||dismissedSelectors.has(selectedId))return;
   dismissedSelectors.add(selectedId);
   if(active&&Number(active.roulette_id)===selectedId)closeOverlay();
   renderBanner();
   try{
    await api('chat_result_dismiss',{p_result_type:'selector',p_result_id:selectedId});
   }catch(error){
    dismissedSelectors.delete(selectedId);
    renderBanner();
    console.error('Cerrar resultado del selector:',error);
    alert('No se pudo guardar el resultado como leído. Inténtalo de nuevo.');
   }
  }
  function renderBanner(){
   banner.replaceChildren();
   const finished=active?.status==='finished';
   const hiddenResult=finished&&dismissedSelectors.has(Number(active.roulette_id));
   banner.hidden=!active||hiddenResult;
   if(!active||hiddenResult)return;
   if(finished){
    const dismiss=btn('✕',()=>dismissFinishedSelector(active.roulette_id),'rw-result-dismiss');
    dismiss.title='Ocultar este resultado solo para mí';
    dismiss.setAttribute('aria-label','Cerrar resultado finalizado del selector');
    banner.append(dismiss);
   }
   banner.append(el('strong','rw-banner-title',finished?'🏆 RESULTADO DEL SELECTOR':'🎯 SELECTOR ABIERTO · IKAR8BP'));
   banner.append(el('span','rw-banner-count',finished?(spinningId===Number(active.roulette_id)?'🎯 Seleccionando...':'🏆 '+(active.winner_name||'Jugador ganador')):active.participants+' jugadores inscritos'));
   if(!finished&&active.has_joined)banner.append(el('span','rw-banner-confirm','✅ YA ESTÁS INSCRITO'));
   banner.append(btn(finished?'🏆 VER RESULTADO':active.has_joined?'👀 VER INSCRITOS':'✅ INSCRIBIRME',()=>{
    openOverlay(false);
    if(active?.status==='open'&&!active.has_joined){if(!viewer){document.getElementById('registerBtn')?.click();return;}join();}else loadRoster();
   },'rw-banner-action'));
  }
  function renderControls(){
   if(!active){closeOverlay();return;}
   const open=active.status==='open',mine=!!active.has_joined;
   joinButton.hidden=mine||!open;
   joinButton.textContent=viewer?'INSCRIBIRME':'REGÍSTRATE PARA PARTICIPAR';
   joinButton.disabled=false;
   joined.hidden=!mine;
   description.textContent=open?'Inscríbete para participar en la selección aleatoria.':'Inscripciones cerradas. El resultado está guardado y no puede cambiarse.';
   count.textContent=String(active.participants)+' '+(active.participants===1?'JUGADOR INSCRITO':'JUGADORES INSCRITOS');
   adminBar.hidden=!admin||!open;
   spinButton.hidden=!open;
   spinButton.disabled=!open||Number(active.participants)<2;
   spinButton.title=Number(active.participants)<2?'Se necesitan al menos dos inscritos':'Elegir un ganador al azar y cerrar inscripciones';
  }
  async function loadRoster(allowWinner=true){
   if(!active||overlay.hidden||rosterBusy)return;
   const id=active.roulette_id;
   rosterBusy=true;
   try{
    const rows=await api('chat_roulette_players',{p_roulette_id:id})||[];
    if(!active||active.roulette_id!==id)return;
    rosterId=id;
    roster=rows;
    renderRoster();
    renderSelector();
    if(allowWinner&&active.status==='finished'&&!spinningId)showWinner();
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
   if(active.status==='finished'&&!spinningId)showWinner();else renderSelector();
  }
  async function refresh(){
   if(busy)return;
   busy=true;
   try{
    const rows=await api('chat_roulette_feed')||[];
    const next=rows[0]||null;
    const previous=active;
    if(active?.roulette_id!==next?.roulette_id){
     roster=[];rosterId=null;winnerCard.hidden=true;
     stopSelectorAnimation();selector.hidden=true;
    }
    active=next;
    renderBanner();
    renderControls();
    if(active&&!overlay.hidden){
     const newResult=previous?.roulette_id===active.roulette_id&&previous.status==='open';
     await loadRoster(!newResult);
     if(active.status==='finished'){
      if(newResult&&!spinningId)animateWinner();
      else if(!spinningId)showWinner();
     }else{winnerCard.hidden=true;renderSelector();}
    }
   }catch(e){console.warn('Ruleta: actualizar',e);}
   finally{busy=false;}
  }
  async function join(){
   if(!active||active.status!=='open'||joinButton.disabled)return;
   if(!viewer){document.getElementById('registerBtn')?.click();return;}
   joinButton.disabled=true;notice('Registrando tu inscripción...');
   try{
    const id=active.roulette_id;
    const result=await api('chat_roulette_join',{p_roulette_id:id});
    notice(result==='already_joined'?'Ya estabas inscrito.':'✅ Inscripción completada.');
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
   if(!window.confirm('¿Cerrar este selector? Los jugadores ya no podrán inscribirse.'))return;
   closeButton.disabled=true;
   try{
    await api('chat_roulette_close',{p_roulette_id:active.roulette_id});
    notice('Selección cerrada. Puedes crear otra.');
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
     admin=false;dismissedSelectors=new Set();dismissalsLoadedFor=null;create.hidden=true;
     attachButton();await refresh();return;
    }
    if(before!==viewer||!admin)admin=(await api('stream_vs_is_ikar'))===true;
    create.hidden=!admin;
    attachButton();
    await loadDismissedSelectors(before!==viewer);
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
    .on('postgres_changes',{event:'*',schema:'public',table:'chat_roulette_entries'},soon)
    .subscribe();
  }catch(e){console.warn('Ruleta: Realtime',e);}
  chatOpen.addEventListener('click',()=>setTimeout(()=>checkSession().then(()=>loadDismissedSelectors(true)),200));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkSession().then(()=>loadDismissedSelectors(true));});
  db.auth.onAuthStateChange((event)=>{
   if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(checkSession,450);
  });
  setInterval(()=>{
   if(document.hidden||(chat.hidden&&overlay.hidden))return;
   const now=Date.now();
   if(now-lastPoll>=12000){lastPoll=now;refresh();}
  },4000);
  setTimeout(checkSession,800);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();