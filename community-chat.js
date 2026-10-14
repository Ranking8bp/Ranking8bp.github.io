/* Chat general independiente: no modifica el controlador principal. */
(() => {
 'use strict';
 const ready = () => {
  const $ = id => document.getElementById(id);
  const button=$('communityChatOpen'),modal=$('communityChatModal'),close=$('communityChatClose'),list=$('communityChatList'),form=$('communityChatForm'),input=$('communityChatInput'),info=$('communityChatInfo');
  if(!button||!modal||!close||!list||!form||!input||!info)return;
  let client=null,interval=null,busy=false,previous='',profiles=new Map(),lastSent=0;
  try{const config=window.SUPABASE_CONFIG;if(config?.url&&config?.key&&window.supabase?.createClient)client=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,storageKey:'ranking8bp-community-chat-auth'}})}catch(e){console.warn('Chat init:',e)}
  const say=s=>{info.textContent=s||''};
  const closeChat=()=>{modal.hidden=true;clearInterval(interval);interval=null};
  const load=async()=>{
   if(modal.hidden||busy||!client)return;
   busy=true;
   try{
    const {data,error}=await client.from('lobby_chat_messages').select('id,sender_id,body,created_at').order('created_at',{ascending:false}).limit(50);
    if(error)throw error;
    const rows=(data||[]).reverse(),sig=rows.map(x=>x.id).join(',');
    if(sig===previous)return;
    const missing=[...new Set(rows.map(x=>x.sender_id))].filter(id=>!profiles.has(id));
    if(missing.length){const {data:ps}=await client.from('profiles').select('id,account_name,username,avatar_path').in('id',missing);for(const p of ps||[])profiles.set(p.id,p)}
    const bottom=list.scrollHeight-list.scrollTop-list.clientHeight<90;
    const fragment=document.createDocumentFragment();
    for(const m of rows){
     const p=profiles.get(m.sender_id)||{},name=p.account_name||p.username||'Jugador';
     const item=document.createElement('div');item.className='community-chat-item';
     const avatar=document.createElement('div');avatar.className='community-chat-avatar';avatar.textContent=name.slice(0,1).toUpperCase();
     if(p.avatar_path){const raw=String(p.avatar_path),clean=raw.replace(/^profile-photos\//,'').replace(/^\/+/,''),url=/^https?:\/\//i.test(raw)?raw:client.storage.from('profile-photos').getPublicUrl(clean).data?.publicUrl;if(url){const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();avatar.replaceChildren(img)}}
     const bubble=document.createElement('div');bubble.className='community-chat-bubble';const nameEl=document.createElement('strong');nameEl.textContent=name;const body=document.createElement('span');body.textContent=m.body;bubble.append(nameEl,body);item.append(avatar,bubble);fragment.append(item);
    }
    list.replaceChildren(fragment);previous=sig;if(bottom)list.scrollTop=list.scrollHeight;say('');
   }catch(e){say('No se pudieron cargar los mensajes. '+(e.message||''))}
   finally{busy=false}
  };
  button.addEventListener('click',async()=>{
   modal.hidden=false;list.textContent='Cargando mensajes...';previous='';say('');
   if(!client){say('No se pudo conectar al servidor.');return}
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
