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
    CUENTA_BLOQUEADA:'Tu cuenta está bloqueada.'
   };
   return Object.keys(mapping).find(k=>t.includes(k))?mapping[Object.keys(mapping).find(k=>t.includes(k))]:(t||'Inténtalo de nuevo.');
  };
  let viewer=null,admin=false,active=null,busy=false,rosterBusy=false,rosterId=null,roster=[],lastPoll=0;
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
  const joinBar=el('div','rw-actions');
  const joinButton=btn('🎡 UNIRME A LA RULETA',join,'rw-join');
  const joined=el('strong','rw-joined','✅ YA ESTÁS EN LA RULETA');joined.hidden=true;
  joinBar.append(joinButton,joined);
  const listTitle=el('h3','rw-list-title','PARTICIPANTES');
  const rosterBox=el('div','rw-roster');
  const status=el('small','rw-status','');
  const adminBar=el('div','rw-adminbar');
  const closeButton=btn('CERRAR INSCRIPCIONES',closeRoulette,'rw-close-roulette');
  adminBar.append(closeButton);
  panel.append(header,description,count,joinBar,listTitle,rosterBox,adminBar,status);
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
  function renderBanner(){
   banner.replaceChildren();
   banner.hidden=!active;
   if(!active)return;
   banner.append(el('strong','rw-banner-title','🎡 RULETA ABIERTA · IKAR8BP'));
   banner.append(el('span','rw-banner-count',active.participants+' jugadores inscritos'));
   if(active.has_joined)banner.append(el('span','rw-banner-confirm','✅ YA ESTÁS INSCRITO'));
   banner.append(btn(active.has_joined?'👀 VER LISTA DE LA RULETA':'🎡 UNIRME A LA RULETA',()=>openOverlay(true),'rw-banner-action'));
  }
  function renderControls(){
   if(!active){closeOverlay();return;}
   const mine=!!active.has_joined;
   joinButton.hidden=mine;
   joinButton.disabled=false;
   joined.hidden=!mine;
   count.textContent=String(active.participants)+' '+(active.participants===1?'JUGADOR INSCRITO':'JUGADORES INSCRITOS');
   adminBar.hidden=!admin;
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
  }
  async function refresh(){
   if(busy||!viewer)return;
   busy=true;
   try{
    const rows=await api('chat_roulette_feed')||[];
    const next=rows[0]||null;
    if(active?.roulette_id!==next?.roulette_id){roster=[];rosterId=null;}
    active=next;
    renderBanner();
    renderControls();
    if(active&&!overlay.hidden)await loadRoster();
   }catch(e){console.warn('Ruleta: actualizar',e);}
   finally{busy=false;}
  }
  async function join(){
   if(!active||joinButton.disabled)return;
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
   if(!active||closeButton.disabled)return;
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