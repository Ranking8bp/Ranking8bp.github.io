/* Ranking8BP: salas VS creadas por IKAR8BP, espectadores y ELO normal. */
(() => {
 'use strict';
 const start=()=>{
  const chat=document.getElementById('communityChatModal');
  const launch=document.getElementById('communityChatOpen');
  const challenge=document.querySelector('#communityChatModal .community-challenge-area');
  const history=document.getElementById('communityChatList');
  if(!chat||!launch||!history)return;
  const panel=history.parentElement;
  const conf=window.SUPABASE_CONFIG||{};
  if(!window.supabase?.createClient||!conf.url||!conf.key)return;
  const db=window.supabase.createClient(conf.url,conf.key,{auth:{persistSession:true,autoRefreshToken:true,storage:localStorage,storageKey:'ranking8bp-auth'}});
  const h=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el};
  const b=(label,action,cls)=>{const x=h('button',cls,label);x.type='button';x.addEventListener('click',action);return x};
  const msg=(s)=>{status.textContent=s||'';if(s)console.warn('Stream VS:',s)};
  const api=async(name,args)=>{
   const {data,error}=await db.rpc(name,args);
   if(error)throw error;
   return data;
  };
  const errorText=error=>{
   const code=String(error?.message||error||'');
   const codes={
    YA_EXISTE_SALA_ACTIVA:'Primero finaliza o anula la sala actual.',
    SOLO_IKAR8BP:'Solo ikar8bp puede gestionar salas.',
    INICIA_SESION:'Inicia sesión para participar.',
    TIENES_VS_RANKING_PENDIENTE:'Ya tienes un partido de ranking pendiente.',
    TIENES_VS_DIARIO_PENDIENTE:'Ya tienes una clasificatoria diaria pendiente.',
    YA_PARTICIPAS_EN_OTRA_SALA:'Ya participas en otra sala.',
    CUENTA_BLOQUEADA:'Tu cuenta está bloqueada.',
    SOLO_JUGADORES_Y_ADMIN:'Solo los jugadores y el administrador pueden comentar.',
    PARTIDO_NO_DISPONIBLE:'Este VS ya fue finalizado o no tiene dos jugadores.',
    SALA_CERRADA:'La sala ya está cerrada.'
   };
   return Object.keys(codes).find(k=>code.includes(k))?codes[Object.keys(codes).find(k=>code.includes(k))]:(code||'No se pudo completar la operación.');
  };
  let uid=null,admin=false,rooms=[],roomId=null,room=null,role='spectator',polling=false,messagesBusy=false,realtime=null,timer=null,changeTimer=null,oldMessageSignature='';
  const fixed=h('div','sv-fixed');fixed.hidden=true;
  const feed=h('section','sv-feed');feed.hidden=true;
  panel.insertBefore(fixed,history);
  panel.insertBefore(feed,history);
  const create=b('＋ ENVIAR SALA VS',()=>{},'sv-create');create.hidden=true;
  create.onclick=async()=>{
   create.disabled=true;
   try{
    const id=await api('stream_vs_create');
    msg('✅ Sala creada. Esperando a los dos primeros jugadores.');
    await refresh();
    open(Number(id),false);
   }catch(e){msg(errorText(e))}
   finally{create.disabled=false}
  };
  // Este botón queda debajo de DESAFÍO, no mezclado con los desafíos individuales.
  const attachButton=()=>{
   const anchor=document.querySelector('#communityChatModal .community-challenge-area');
   if(anchor&&!create.isConnected)anchor.after(create);
  };
  attachButton();
  const bannerOutside=b('🎱 VS POR RANKING EN VIVO · VER PARTIDO',()=>{launch.click();if(rooms[0])open(Number(rooms[0].room_id),false)},'sv-global');
  bannerOutside.hidden=true;document.body.appendChild(bannerOutside);
  const overlay=h('div','sv-overlay');overlay.hidden=true;
  const sheet=h('section','sv-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Sala versus de Ranking8BP');
  const top=h('header','sv-head');
  const label=h('strong','','🎱 VERSUS POR RANKING');
  const timerLabel=h('span','sv-timer','00:00');
  top.append(label,timerLabel,b('✕',closeRoom,'sv-close'));
  const banner=h('div','sv-room-banner');
  const stage=h('div','sv-stage');
  const notice=h('div','sv-notice');
  const joins=h('div','sv-room-actions');
  const messages=h('div','sv-messages');
  const sendForm=h('form','sv-send-form');
  const input=h('input','');input.type='text';input.maxLength=500;input.placeholder='Mensaje para los jugadores...';input.setAttribute('aria-label','Enviar mensaje de la sala');
  const sendBtn=h('button','','ENVIAR');sendBtn.type='submit';sendForm.append(input,sendBtn);
  const judge=h('div','sv-judge');
  const status=h('small','sv-status');
  sheet.append(top,banner,stage,notice,joins,messages,sendForm,judge,status);overlay.append(sheet);
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeRoom()});
  function closeRoom(){overlay.hidden=true;roomId=null;room=null;oldMessageSignature='';clearInterval(timer)}
  function elapsed(){
   if(!room||!room.started_at||room.status!=='playing'){timerLabel.textContent=room?.status==='finished'?'FINALIZADO':'ESPERANDO';return}
   const secs=Math.max(0,Math.floor((Date.now()-new Date(room.started_at).getTime())/1000));
   const hours=Math.floor(secs/3600),min=Math.floor(secs%3600/60),s=secs%60;
   timerLabel.textContent='⏱ '+(hours?String(hours).padStart(2,'0')+':':'')+String(min).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }
  function imageFor(path){
   if(!path)return '';
   if(/^https:\/\//i.test(path))return path;
   const clean=String(path).replace(/^profile-photos\//,'').replace(/^\/+/,'');
   return db.storage.from('profile-photos').getPublicUrl(clean).data?.publicUrl||'';
  }
  function profileCard(p,side,isWinner=false){
   const card=h('div','sv-person'+(isWinner?' winner':''));
   const avatar=h('div','sv-avatar',p.name?.slice(0,1)||'?');
   const src=imageFor(p.avatar);
   if(src){const im=h('img');im.src=src;im.alt=p.name||'Jugador';im.onerror=()=>{im.remove();avatar.textContent=(p.name||'?').slice(0,1)};avatar.replaceChildren(im)}
   const rank=window.rankingChatProfileBridge?.rank?.(Number(p.elo)||0);
   if(rank?.image){const im=h('img','sv-rank-img');im.src=rank.image;im.alt=rank.name;card.appendChild(im)}
   card.append(avatar,h('strong','sv-name',p.name||'ESPERANDO...'),h('small','',rank?.name||'—'));
   card.append(h('b','sv-elo',p.id==null?'—':(p.elo??0)+' ELO'));
   if(admin&&p.gameId){card.append(b('ID '+p.gameId+' 📋',()=>copy(p.gameId),'sv-copy'))}
   else if(uid===p.id&&p.gameId){card.append(b('COPIAR MI ID 📋',()=>copy(p.gameId),'sv-copy'))}
   if(isWinner)card.append(h('strong','sv-crown','🏆 GANADOR'));
   return card;
  }
  async function copy(value){
   try{await navigator.clipboard.writeText(String(value));msg('ID copiado: '+value)}
   catch(_){const temp=h('textarea');temp.value=String(value);document.body.appendChild(temp);temp.select();document.execCommand('copy');temp.remove();msg('ID copiado.')}
  }
  function side(r,index){
   return {id:r['player'+index+'_id'],name:r['player'+index+'_name'],elo:r['player'+index+'_elo'],avatar:r['player'+index+'_avatar'],gameId:r['player'+index+'_game_id']};
  }
  function winner(r){return r.winner_id===r.player1_id?1:2}
  function isParticipant(r){return !!uid&&(uid===r.player1_id||uid===r.player2_id)}
  function renderRoom(){
   if(!room)return;
   elapsed();
   const full=!!room.player1_id&&!!room.player2_id;
   const finished=room.status==='finished',playing=room.status==='playing';
   const text=finished?'🏆 PARTIDA FINALIZADA':playing?'🔴 PARTIDO JUGÁNDOSE EN VIVO':'🟡 SALA CREADA · ESPERANDO JUGADORES';
   banner.textContent=text+(playing?' · '+timerLabel.textContent:'');
   stage.replaceChildren(profileCard(side(room,1),'left',finished&&winner(room)===1),h('b','sv-versus','VS'),profileCard(side(room,2),'right',finished&&winner(room)===2));
   notice.replaceChildren();
   if(finished){
    const n=winner(room),w=side(room,n),l=side(room,n===1?2:1);
    notice.append(h('strong','sv-finished','🏆 GANADOR: '+w.name),h('div','',w.name+' +'+room.winner_delta+' ELO · '+l.name+' '+room.loser_delta+' ELO'));
   }else if(room.status==='open'&&!full){
    notice.textContent='Los dos primeros que se unan jugarán el partido de ranking.';
   }else if(!admin&&!isParticipant(room)){
    notice.textContent='SALA LLENA · EL VS YA ESTÁ ARMADO. Puedes ver la conversación y reaccionar, pero no comentar. Espera a que ikar8bp cree otra sala.';
   }else if(admin){
    notice.textContent='Solo tú y los dos jugadores podéis escribir. Los espectadores solo reaccionan.';
   }else{
    notice.textContent='Estás dentro del VS. Coordina aquí el partido con ikar8bp.';
   }
   joins.replaceChildren();
   if(room.status==='open'&&!admin&&!isParticipant(room)){
    joins.append(b('⚔ UNIRME COMO JUGADOR',()=>join(room.room_id),'sv-join'));
   }else if(playing&&!isParticipant(room)&&!admin){
    joins.append(h('span','sv-spectator','👀 MODO ESPECTADOR · REACCIONES ACTIVADAS'));
   }
   sendForm.hidden=!(admin||isParticipant(room))||!['open','playing'].includes(room.status);
   judge.replaceChildren();
   if(admin&&playing&&full){
    judge.append(h('strong','', 'DEFINIR GANADOR'));
    for(const ix of [1,2]){
     const p=side(room,ix);
     judge.append(b('🏆 GANA '+p.name,()=>finish(room.room_id,p.id,p.name),'sv-judge-winner'));
    }
   }
   if(admin&&['open','playing'].includes(room.status))judge.append(b('ANULAR SALA (SIN ELO)',()=>cancel(room.room_id),'sv-cancel'));
  }
  async function finish(id,playerId,name){
   if(!confirm('¿CONFIRMAR GANADOR '+name+'? Se aplicará +15 ELO al ganador y hasta −15 ELO al perdedor. No se podrá volver a aplicar.'))return;
   [...judge.querySelectorAll('button')].forEach(x=>x.disabled=true);
   try{
    await api('stream_vs_finish',{p_room_id:id,p_winner_id:playerId});
    msg('🏆 Resultado confirmado. ELO actualizado.');
    await refresh();await loadMessages(true);
    if(typeof window.loadRanking==='function')window.loadRanking(true).catch(()=>{});
   }catch(e){msg(errorText(e));renderRoom()}
  }
  async function cancel(id){
   if(!confirm('¿ANULAR ESTE VS SIN CAMBIAR ELO?'))return;
   try{await api('stream_vs_cancel',{p_room_id:id});msg('Sala anulada sin cambiar el ELO.');closeRoom();await refresh()}
   catch(e){msg(errorText(e))}
  }
  async function join(id){
   try{
    role=await api('stream_vs_join',{p_room_id:id});
    await refresh();
    if(role==='spectator')msg('Sala llena: puedes mirar y reaccionar, pero no comentar.');
    else if(role==='player1'||role==='player2')msg('✅ ¡Te has unido como jugador!');
    renderRoom();
   }catch(e){msg(errorText(e))}
  }
  function showRoom(r){
   room=r;
   role=admin?'admin':uid===r.player1_id?'player1':uid===r.player2_id?'player2':'spectator';
   renderRoom();
  }
  function open(id,tryJoin){
   roomId=Number(id);
   const r=rooms.find(x=>Number(x.room_id)===roomId);
   if(!r){msg('No se encontró esta sala.');return}
   overlay.hidden=false;msg('');
   showRoom(r);oldMessageSignature='';loadMessages(true);
   clearInterval(timer);timer=setInterval(()=>{if(!overlay.hidden)elapsed()},1000);
   if(tryJoin&&!admin&&!isParticipant(r)&&r.status==='open')join(id);
  }
  function renderFeed(){
   const active=rooms.find(r=>['open','playing'].includes(r.status));
   const finished=rooms.filter(r=>r.status==='finished');
   fixed.replaceChildren();
   fixed.hidden=!active;
   bannerOutside.hidden=!active;
   if(active){
    const p1=active.player1_name||'Jugador 1',p2=active.player2_name||'Esperando rival';
    fixed.append(h('strong','',active.status==='playing'?'🔴 PARTIDO JUGÁNDOSE EN VIVO':'🎱 SE CREÓ UNA SALA DE VERSUS PARA RANKING'));
    const pair=h('div','sv-banner-pair');
    for(const ix of [1,2]){
     if(ix===2)pair.append(h('b','sv-banner-vs','VS'));
     const p=side(active,ix),card=h('div','sv-banner-person');
     const src=imageFor(p.avatar);
     if(src){const img=h('img','sv-banner-photo');img.src=src;img.alt=p.name;img.onerror=()=>img.remove();card.append(img)}
     const rank=window.rankingChatProfileBridge?.rank?.(Number(p.elo)||0);
     if(rank?.image){const img=h('img','sv-banner-rank');img.src=rank.image;img.alt=rank.name;card.append(img)}
     card.append(h('b','',p.name||'ESPERANDO...'));pair.append(card);
    }
    fixed.append(pair);
    if(active.status==='playing'){
     const clock=h('span','sv-live-elapsed','⏱ 00:00');clock.dataset.started=active.started_at||'';fixed.append(clock);
    }
    fixed.append(b(active.status==='open'?'⚔ UNIRME':'👀 VER VS EN VIVO',()=>open(active.room_id,active.status==='open'),'sv-join'));
    bannerOutside.dataset.base='🎱 '+(active.status==='playing'?'VS EN VIVO · '+p1+' VS '+p2:'SALA DE RANKING ABIERTA · UNIRME');
    bannerOutside.dataset.started=active.status==='playing'?active.started_at||'':'';
    bannerOutside.textContent=bannerOutside.dataset.base;
   }
   feed.replaceChildren();
   feed.hidden=!finished.length;
   for(const r of finished.slice(0,3)){
    const win=side(r,winner(r)),lose=side(r,winner(r)===1?2:1);
    const result=h('article','sv-result');
    const title=h('strong','','🏆 PARTIDA FINALIZADA · IKAR8BP');
    const duel=h('div','sv-result-players');
    for(const [p,won] of [[win,true],[lose,false]]){
     const x=h('div','sv-result-person'+(won?' winning':''));
     const imsrc=imageFor(p.avatar);
     if(imsrc){const im=h('img','sv-result-avatar');im.src=imsrc;im.alt=p.name;im.onerror=()=>im.remove();x.append(im)}
     const badge=window.rankingChatProfileBridge?.rank?.(Number(p.elo)||0);
     if(badge?.image){const im=h('img','sv-result-rank');im.src=badge.image;im.alt=badge.name;x.append(im)}
     x.append(h('b','',p.name),h('strong',won?'sv-plus':'sv-minus',(won?'+':'')+(won?r.winner_delta:r.loser_delta)+' ELO'));
     duel.append(x);
    }
    result.append(title,duel,b('VER RESULTADO Y CHAT',()=>open(r.room_id,false),'sv-result-open'));
    feed.append(result);
   }
  }
  const updatePublicClock=()=>{
   const clock=fixed.querySelector('.sv-live-elapsed');
   if(!clock||!clock.dataset.started)return;
   const seconds=Math.max(0,Math.floor((Date.now()-new Date(clock.dataset.started).getTime())/1000));
   if(!Number.isFinite(seconds))return;
   const hh=Math.floor(seconds/3600),mm=Math.floor((seconds%3600)/60),ss=seconds%60;
   const formatted=(hh?String(hh).padStart(2,'0')+':':'')+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
   clock.textContent='⏱ TIEMPO TRANSCURRIDO '+formatted;
   bannerOutside.textContent=bannerOutside.dataset.base+' · '+formatted;
  };
  setInterval(updatePublicClock,1000);
  async function refresh(){
   if(!uid||polling)return;
   polling=true;
   try{
    rooms=await api('stream_vs_feed')||[];
    renderFeed();
    if(roomId){
     const next=rooms.find(x=>Number(x.room_id)===roomId);
     if(next){const changed=JSON.stringify(room)!==JSON.stringify(next);showRoom(next);if(changed&&next.status==='finished')loadMessages(true)}
     else if(room?.status!=='cancelled'){closeRoom();msg('La sala dejó de estar disponible.')}
    }
   }catch(e){console.warn('Actualizar salas:',e)}
   finally{polling=false}
  }
  async function loadMessages(force=false){
   if(!roomId||overlay.hidden||messagesBusy)return;
   messagesBusy=true;
   try{
    const rows=await api('stream_vs_messages_read',{p_room_id:roomId})||[];
    // La lectura solo se confirma cuando la sala está abierta en pantalla.
    try{await api('stream_vs_mark_read',{p_room_id:roomId})}catch(e){console.warn('Marcar leído VS:',e)}
    let receipts=[];
    try{receipts=await api('stream_vs_read_receipts',{p_room_id:roomId})||[]}catch(e){console.warn('Lectores VS:',e)}
    const readerMap=new Map(receipts.map(x=>[Number(x.message_id),x.reader_names||[]]));
    const signature=JSON.stringify(rows.map(m=>[m.message_id,m.reactions,m.my_reaction,readerMap.get(Number(m.message_id))||[]]));
    if(!force&&signature===oldMessageSignature)return;
    const bottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<90;
    oldMessageSignature=signature;
    messages.replaceChildren();
    if(!rows.length)messages.append(h('p','sv-empty','Todavía no hay mensajes. Los jugadores y el administrador pueden escribir aquí.'));
    for(const m of rows){
     const mine=uid===m.sender_id;
     const item=h('div','sv-message'+(mine?' mine':''));
     item.append(h('strong','',m.sender_name),h('p','',m.body));
     const row=h('div','sv-reactions');
     for(const emoji of ['👍','😂','❤️','🔥','👏','😮']){
      const n=Number(m.reactions?.[emoji]||0);
      const reaction=b(emoji+(n?' '+n:''),async()=>{
       reaction.disabled=true;
       try{await api('stream_vs_react',{p_message_id:m.message_id,p_emoji:emoji});await loadMessages(true)}
       catch(e){msg(errorText(e))}
       finally{reaction.disabled=false}
      },m.my_reaction===emoji?'active':'');
      row.append(reaction);
     }
     item.append(row);
     const names=readerMap.get(Number(m.message_id))||[];
     const read=h('small','sv-readers',names.length?'✓✓ Leído por: '+names.join(', '):'✓ Enviado · Sin lecturas todavía');
     item.append(read);
     messages.append(item);
    }
    if(bottom)messages.scrollTop=messages.scrollHeight;
   }catch(e){console.warn('Mensajes VS:',e);msg('No se pudieron cargar los mensajes de la sala.')}
   finally{messagesBusy=false}
  }
  sendForm.addEventListener('submit',async e=>{
   e.preventDefault();
   const value=input.value.trim();
   if(!value||!roomId||sendBtn.disabled)return;
   sendBtn.disabled=true;
   try{await api('stream_vs_send',{p_room_id:roomId,p_body:value});input.value='';await loadMessages(true)}
   catch(e){msg(errorText(e))}
   finally{sendBtn.disabled=false}
  });
  async function checkSession(){
   try{
    const {data}=await db.auth.getUser();
    const old=uid;uid=data?.user?.id||null;
    if(!uid){admin=false;rooms=[];create.hidden=true;fixed.hidden=true;feed.hidden=true;bannerOutside.hidden=true;return}
    if(old!==uid||!admin){
     admin=(await api('stream_vs_is_ikar'))===true;
    }
    create.hidden=!admin;attachButton();
    await refresh();
   }catch(e){console.warn('Sesión VS:',e)}
  }
  let refreshSoon=null;
  const queue=()=>{clearTimeout(refreshSoon);refreshSoon=setTimeout(async()=>{await refresh();if(roomId)loadMessages()},180)};
  try{
   realtime=db.channel('ranking8bp-stream-vs-room')
    .on('postgres_changes',{event:'*',schema:'public',table:'stream_vs_rooms'},queue)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'stream_vs_messages'},payload=>{if(Number(payload.new?.room_id)===Number(roomId))queue()})
    .on('postgres_changes',{event:'*',schema:'public',table:'stream_vs_reactions'},()=>{if(roomId)queue()})
    .subscribe();
  }catch(e){console.warn('VS Realtime:',e)}
  launch.addEventListener('click',()=>{setTimeout(()=>{attachButton();checkSession();if(roomId)loadMessages(true)},250)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkSession()});
  db.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'){uid=s?.user?.id||null;admin=false;setTimeout(checkSession,450)}});
  // Realtime es el canal principal. Sondeo espaciado como respaldo para no saturar Supabase.
  let lastRoomFallback=0,lastMessagesFallback=0,lastBackgroundFallback=0;
  setInterval(()=>{
   if(document.hidden||!uid)return;
   const now=Date.now();
   if(!chat.hidden||!overlay.hidden){
    if(now-lastRoomFallback>=30000){lastRoomFallback=now;refresh()}
    if(roomId&&!overlay.hidden&&now-lastMessagesFallback>=20000){
     lastMessagesFallback=now;loadMessages();
    }
   }else if(now-lastBackgroundFallback>=60000){
    lastBackgroundFallback=now;refresh();
   }
  },8000);
  setTimeout(checkSession,650);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();