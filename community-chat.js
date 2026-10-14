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
  const closeChat=()=>{modal.hidden=true;clearInterval(interval);clearTimeout(readTimer);interval=null};
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
    await updateReadCounts();
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
     const bubble=document.createElement('div');bubble.className='community-chat-bubble';const nameEl=document.createElement('strong');nameEl.textContent=name;const body=document.createElement('span');const linkRegex=/https?:\/\/[^\s<>"']+/gi;const source=String(m.body||'');let cursor=0,match;while((match=linkRegex.exec(source))!==null){if(match.index>cursor)body.append(document.createTextNode(source.slice(cursor,match.index)));const raw=match[0];const trimmed=raw.replace(/[.,;!?)}\]]+$/,'');let safe=null;try{const parsed=new URL(trimmed);if(['https:','http:'].includes(parsed.protocol))safe=parsed.href}catch(e){}if(safe){const link=document.createElement('a');link.href=safe;link.target='_blank';link.rel='noopener noreferrer';link.textContent=trimmed;link.className='community-chat-link';body.append(link)}else body.append(document.createTextNode(trimmed));if(raw.length>trimmed.length)body.append(document.createTextNode(raw.slice(trimmed.length)));cursor=match.index+raw.length}if(cursor<source.length)body.append(document.createTextNode(source.slice(cursor)));const readEl=document.createElement('small');readEl.className='community-chat-read';readEl.textContent='Leído por: 0';bubble.append(nameEl,body,readEl);item.append(rank,avatar,bubble);fragment.append(item);
    }
    list.replaceChildren(fragment);previous=sig;if(bottom)list.scrollTop=list.scrollHeight;say('');await updateReadCounts();queueReads();
   }catch(e){say('No se pudieron cargar los mensajes. '+(e.message||''))}
   finally{busy=false}
  };
  button.addEventListener('click',async()=>{
   modal.hidden=false;if(!list.children.length)list.textContent='Cargando historial...';say('');
   if(!client){say('No se pudo conectar al servidor.');return}
   try{const {data}=await client.auth.getUser();viewerId=data?.user?.id||null}catch(e){viewerId=null}
   await load();clearInterval(interval);interval=setInterval(load,8000);
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
