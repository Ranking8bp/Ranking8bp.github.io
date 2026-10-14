/* Chat general independiente: no modifica el controlador principal. */
(() => {
 'use strict';
 const ready = () => {
  const $ = id => document.getElementById(id);
  const button=$('communityChatOpen'),modal=$('communityChatModal'),close=$('communityChatClose'),list=$('communityChatList'),form=$('communityChatForm'),input=$('communityChatInput'),info=$('communityChatInfo');
  if(!button||!modal||!close||!list||!form||!input||!info)return;
  let client=null,interval=null,busy=false,previous='',profiles=new Map(),lastSent=0,viewerId=null,readBusy=false,readTimer=null;const readSent=new Set();
  try{const config=window.SUPABASE_CONFIG;if(config?.url&&config?.key&&window.supabase?.createClient)client=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,storage:window.localStorage,storageKey:'ranking8bp-auth'}})}catch(e){console.warn('Chat init:',e)}
  const say=s=>{info.textContent=s||''};
  const badge=document.createElement('span');badge.className='community-chat-unread-badge';badge.hidden=true;badge.setAttribute('aria-label','Mensajes sin leer');button.appendChild(badge);
  let unreadBusy=false;
  const refreshUnread=async()=>{
   if(!client||unreadBusy||document.hidden)return;
   unreadBusy=true;
   try{
    const {data:{user}}=await client.auth.getUser();
    viewerId=user?.id||null;
    if(!viewerId){badge.hidden=true;return}
    const {data,error}=await client.rpc('lobby_chat_unread_count');
    if(error)throw error;
    const count=Math.max(0,Number(data)||0);
    badge.textContent=String(count);badge.hidden=count===0;
    button.setAttribute('aria-label',count?'Chat general, '+count+' mensajes sin leer':'Chat general, sin mensajes pendientes');
   }catch(e){console.warn('Chat unread counter:',e)}
   finally{unreadBusy=false}
  };
  setInterval(refreshUnread,8000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshUnread()});
  refreshUnread();
  const readersOverlay=document.createElement('div');readersOverlay.className='community-readers-overlay';readersOverlay.hidden=true;
  const readersPanel=document.createElement('section');readersPanel.className='community-readers-panel';
  const readersHeader=document.createElement('header');readersHeader.textContent='Leído por';
  const readersClose=document.createElement('button');readersClose.type='button';readersClose.textContent='✕';readersClose.setAttribute('aria-label','Cerrar lectores');readersHeader.append(readersClose);
  const readersList=document.createElement('div');readersList.className='community-readers-list';readersPanel.append(readersHeader,readersList);readersOverlay.append(readersPanel);document.body.append(readersOverlay);
  const hideReaders=()=>{readersOverlay.hidden=true};
  readersClose.addEventListener('click',hideReaders);
  readersOverlay.addEventListener('click',e=>{if(e.target===readersOverlay)hideReaders()});
  const showReaders=async messageId=>{
   readersOverlay.hidden=false;readersList.textContent='Cargando lectores...';
   try{
    const {data,error}=await client.from('lobby_chat_reads').select('reader_id').eq('message_id',messageId).order('read_at',{ascending:true});
    if(error)throw error;
    const ids=[...new Set((data||[]).map(x=>x.reader_id))];
    if(!ids.length){readersList.textContent='Nadie ha leído este mensaje todavía.';return}
    const results=await Promise.allSettled(ids.map(async id=>{
     let p=profiles.get(String(id));
     if(!p){const {data:profile,error:err}=await client.rpc('get_profile_by_id',{p_player_id:id});if(err)throw err;p=Array.isArray(profile)?profile[0]:profile;if(p)profiles.set(String(id),p)}
     return p;
    }));
    readersList.replaceChildren();
    for(let i=0;i<ids.length;i++){
     const p=results[i].status==='fulfilled'?results[i].value:null;
     const entry=document.createElement('div');entry.className='community-readers-entry';
     const name=document.createElement('span');name.textContent=p?.account_name||p?.username||'Jugador';
     entry.append(name);readersList.append(entry);
    }
   }catch(err){readersList.textContent='No se pudo cargar la lista de lectores.';console.warn('Chat readers:',err)}
  };
  const challengeArea=$('communityChallengeArea')||document.createElement('div');challengeArea.className='community-challenge-area';
  const challengeToggle=$('communityChallengeToggle')||document.createElement('button');challengeToggle.type='button';challengeToggle.className='community-challenge-toggle';challengeToggle.textContent='⚔ DESAFÍO';
  const challengeOptions=$('communityChallengeOptions')||document.createElement('div');challengeOptions.className='community-challenge-options';challengeOptions.hidden=true;
  challengeToggle.addEventListener('click',()=>{challengeOptions.hidden=!challengeOptions.hidden});
  const sendChallenge=async(type,control)=>{
   if(!client||!window.rankingChatChallengeBridge){say('El sistema de desafíos todavía no está listo.');return}
   control.disabled=true;say('');
   try{
    const {data:{user}}=await client.auth.getUser();
    if(!user)throw new Error('Inicia sesión para enviar desafíos.');
    const challenge=await window.rankingChatChallengeBridge(type);
    const {error}=await client.from('lobby_chat_messages').insert({sender_id:user.id,body:challenge});
    if(error)throw error;
    challengeOptions.hidden=true;previous='';await load();
   }catch(e){say('No se pudo enviar el desafío: '+(e.message||'Inténtalo nuevamente'))}
   finally{control.disabled=false}
  };
  if(!challengeOptions.children.length)for(const [type,title] of [['ranking','RANKING'],['daily','CLASIFICACIÓN']]){
   const option=document.createElement('button');option.type='button';option.textContent=title;
   option.addEventListener('click',()=>sendChallenge(type,option));challengeOptions.append(option);
  }
  challengeArea.append(challengeToggle,challengeOptions);if(!challengeArea.isConnected)form.after(challengeArea);for(const option of challengeOptions.querySelectorAll('[data-challenge]'))option.addEventListener('click',()=>sendChallenge(option.dataset.challenge,option));
  const markChatOpenedRead=async()=>{
   if(!client||modal.hidden||!viewerId)return;
   try{
    const {error}=await client.rpc('lobby_chat_mark_all_read');
    if(error)throw error;
    await refreshUnread();
    await updateReadCounts();
   }catch(e){console.warn('Chat mark all read:',e)}
  };
  const closeChat=()=>{hideReaders();modal.hidden=true;clearInterval(interval);clearTimeout(readTimer);interval=null};
  const updateReadCounts=async()=>{
   if(!client||modal.hidden)return;
   const ids=[...list.querySelectorAll('[data-chat-message-id]')].map(x=>Number(x.dataset.chatMessageId));
   if(!ids.length)return;
   const {data,error}=await client.rpc('chat_read_counts',{p_message_ids:ids});
   if(error){console.warn('Chat read counts:',error);return}
   const counts=new Map((data||[]).map(x=>[String(x.message_id),Number(x.readers)]));
   for(const el of list.querySelectorAll('[data-chat-message-id] .community-chat-read'))el.textContent='Leído por: '+(counts.get(el.closest('[data-chat-message-id]').dataset.chatMessageId)||0);
  };
  const recordVisibleReads=async()=>{
   if(!client||modal.hidden||readBusy||!viewerId)return;
   const container=list.getBoundingClientRect();
   const visible=[...list.querySelectorAll('[data-chat-message-id]')].filter(el=>{
    const r=el.getBoundingClientRect();
    return r.bottom>container.top+4&&r.top<container.bottom-4&&el.dataset.senderId!==viewerId&&!readSent.has(el.dataset.chatMessageId);
   });
   if(!visible.length)return;
   readBusy=true;
   try{
    const payload=visible.map(el=>({message_id:Number(el.dataset.chatMessageId),reader_id:viewerId}));
    const {error}=await client.from('lobby_chat_reads').upsert(payload,{onConflict:'message_id,reader_id',ignoreDuplicates:true});
    if(error)throw error;
    visible.forEach(el=>readSent.add(el.dataset.chatMessageId));
    await updateReadCounts();await refreshUnread();
   }catch(err){console.warn('Chat read receipts:',err)}
   finally{readBusy=false}
  };
  const queueReads=()=>{clearTimeout(readTimer);readTimer=setTimeout(recordVisibleReads,350)};
  list.addEventListener('scroll',queueReads,{passive:true});
  const load=async()=>{
   if(modal.hidden||busy||!client)return;
   busy=true;
   try{
    const {data,error}=await client.from('lobby_chat_messages').select('id,sender_id,body,created_at').order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    const rows=(data||[]).reverse(),sig=rows.map(x=>x.id).join(',');
    if(sig===previous){await updateReadCounts();queueReads();return;}
    const missing=[...new Set(rows.map(x=>x.sender_id))].filter(id=>!profiles.has(id));
    if(missing.length){
     const results=await Promise.allSettled(missing.map(async id=>{
      const {data,error}=await client.rpc('get_profile_by_id',{p_player_id:id});
      if(error)throw error;
      const p=Array.isArray(data)?data[0]:data;
      return p?{...p,id:p.player_id||id}:null;
     }));
     for(const result of results)if(result.status==='fulfilled'&&result.value)profiles.set(String(result.value.id),result.value);
    }
    const bottom=list.scrollHeight-list.scrollTop-list.clientHeight<90;
    const fragment=document.createDocumentFragment();
    for(const m of rows){
     const p=profiles.get(String(m.sender_id))||{},name=p.account_name||p.username||'Jugador';
     const item=document.createElement('div');item.className='community-chat-item';item.dataset.chatMessageId=String(m.id);item.dataset.senderId=m.sender_id;const rank=document.createElement('img');rank.className='community-chat-rank';const rankInfo=window.rankingChatProfileBridge?.rank?.(p.elo_points??200);if(rankInfo?.image){rank.src=rankInfo.image;rank.alt=rankInfo.name;rank.title=rankInfo.name;}else rank.style.visibility='hidden';
     const avatar=document.createElement('div');avatar.className='community-chat-avatar';avatar.textContent=name.slice(0,1).toUpperCase();
     if(p.avatar_path){const raw=String(p.avatar_path),clean=raw.replace(/^profile-photos\//,'').replace(/^\/+/,''),url=/^https?:\/\//i.test(raw)?raw:client.storage.from('profile-photos').getPublicUrl(clean).data?.publicUrl;if(url){const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();avatar.replaceChildren(img)}}avatar.classList.add('community-chat-avatar-clickable');avatar.title='Ver perfil de '+name;avatar.setAttribute('role','button');avatar.tabIndex=0;const view=async()=>{try{const {data,error}=await client.rpc('get_profile_by_id',{p_player_id:m.sender_id});if(error)throw error;const player=Array.isArray(data)?data[0]:data;if(player&&window.rankingChatProfileBridge?.open)window.rankingChatProfileBridge.open({...player,id:player.player_id||m.sender_id,player_id:player.player_id||m.sender_id});else say('No se pudo abrir el perfil.')}catch(e){say('No se pudo abrir el perfil.')}};avatar.addEventListener('click',view);avatar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();view()}});
     const bubble=document.createElement('div');bubble.className='community-chat-bubble';const nameEl=document.createElement('strong');nameEl.textContent=name;const body=document.createElement('span');const linkRegex=/https?:\/\/[^\s<>"']+/gi;const source=String(m.body||'');let cursor=0,match;while((match=linkRegex.exec(source))!==null){if(match.index>cursor)body.append(document.createTextNode(source.slice(cursor,match.index)));const raw=match[0];const trimmed=raw.replace(/[.,;!?)}\]]+$/,'');let safe=null;try{const parsed=new URL(trimmed);if(['https:','http:'].includes(parsed.protocol))safe=parsed.href}catch(e){}if(safe){const link=document.createElement('a');link.href=safe;link.target='_blank';link.rel='noopener noreferrer';link.textContent=trimmed;link.className='community-chat-link';body.append(link)}else body.append(document.createTextNode(trimmed));if(raw.length>trimmed.length)body.append(document.createTextNode(raw.slice(trimmed.length)));cursor=match.index+raw.length}if(cursor<source.length)body.append(document.createTextNode(source.slice(cursor)));const readEl=document.createElement('button');readEl.type='button';readEl.className='community-chat-read';readEl.textContent='Leído por: 0';readEl.title='Ver quién leyó este mensaje';readEl.addEventListener('click',()=>showReaders(m.id));const messageTime=document.createElement('time');messageTime.className='community-chat-time';const sentAt=new Date(m.created_at);if(!Number.isNaN(sentAt.getTime())){messageTime.dateTime=sentAt.toISOString();messageTime.textContent=new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false}).format(sentAt);messageTime.title=sentAt.toLocaleString('es-MX',{dateStyle:'full',timeStyle:'short'});}const meta=document.createElement('div');meta.className='community-chat-meta';meta.append(messageTime,readEl);bubble.append(nameEl,body,meta);item.append(rank,avatar,bubble);fragment.append(item);
    }
    list.replaceChildren(fragment);previous=sig;if(bottom)list.scrollTop=list.scrollHeight;say('');await updateReadCounts();queueReads();
   }catch(e){say('No se pudieron cargar los mensajes. '+(e.message||''))}
   finally{busy=false}
  };
  button.addEventListener('click',async()=>{
   modal.hidden=false;if(!list.children.length)list.textContent='Cargando historial...';say('');
   if(!client){say('No se pudo conectar al servidor.');return}
   try{const {data}=await client.auth.getUser();viewerId=data?.user?.id||null}catch(e){viewerId=null}
   await load();await markChatOpenedRead();clearInterval(interval);interval=setInterval(async()=>{await load();await markChatOpenedRead()},8000);
  });
  close.addEventListener('click',closeChat);
  modal.addEventListener('click',e=>{if(e.target===modal)closeChat()});
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(!client)return;
   const message=input.value.trim();if(!message)return;
   if(Date.now()-lastSent<3000){say('Espera unos segundos para enviar otro mensaje.');return}
   const submit=form.querySelector('button');submit.disabled=true;
   try{
    const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user){say('Inicia sesión para enviar mensajes.');return}
    const {error}=await client.from('lobby_chat_messages').insert({sender_id:user.id,body:message});
    if(error)throw error;
    lastSent=Date.now();input.value='';previous='';await load();
   }catch(err){say('Error al enviar: '+(err.message||'Inténtalo otra vez'))}
   finally{submit.disabled=false}
  });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
