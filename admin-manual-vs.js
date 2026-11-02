/* Sala VS manual, exclusiva del administrador. ELO se actualiza únicamente mediante RPC transaccional. */
(()=>{
 const $=id=>document.getElementById(id);
 const style=document.createElement('style');style.textContent=`
 #manualVsOpen[hidden]{display:none!important}#manualVsOpen{display:block;width:100%;margin:7px 0;padding:12px;border-radius:12px;background:#153b69;border:1px solid #4e9bff;color:white;font-weight:900;cursor:pointer}
 #manualVsOverlay[hidden]{display:none!important}#manualVsOverlay{position:fixed;inset:0;z-index:2147483647;background:#000d;display:flex;align-items:center;justify-content:center;padding:12px}
 #manualVsPanel{width:min(760px,100%);max-height:92vh;overflow:auto;background:#071522;border:1px solid #d5aa54;border-radius:18px;padding:20px;color:white;box-sizing:border-box}
 #manualVsPanel button{cursor:pointer;border-radius:9px;padding:10px;border:1px solid #b6a06b;background:#17334b;color:white;font-weight:bold}
 #manualVsPanel button:disabled{opacity:.4;cursor:not-allowed}#manualVsPanel input{width:100%;box-sizing:border-box;padding:12px;background:#0e2332;color:white;border:1px solid #6c8798;border-radius:9px}
 .manual-vs-grid{display:grid;grid-template-columns:1fr 45px 1fr;gap:8px;align-items:start}.manual-vs-person{min-width:0;text-align:center;border:1px solid #37556a;border-radius:12px;padding:10px}
 .manual-vs-person img{width:75px;height:75px;object-fit:cover;border-radius:50%;display:block;margin:auto}.manual-vs-person strong{display:block;overflow-wrap:anywhere}.manual-vs-results{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:18px}
 .manual-vs-hits{max-height:170px;overflow:auto}.manual-vs-hits button{display:block;width:100%;text-align:left;margin:4px 0}
 @media(max-width:500px){#manualVsPanel{padding:12px}.manual-vs-grid{grid-template-columns:minmax(0,1fr) 25px minmax(0,1fr)}}
 `;document.head.append(style);
 const overlay=document.createElement('div');overlay.id='manualVsOverlay';overlay.hidden=true;
 overlay.innerHTML='<section id="manualVsPanel"><div style="display:flex;justify-content:space-between;align-items:center"><h2>⚔ CREAR UN VERSUS</h2><button id="manualVsClose">✕</button></div><p id="manualVsMsg" role="status"></p><div class="manual-vs-grid"><div class="manual-vs-person"><b>JUGADOR 1</b><div id="manualVsInfo1"></div><input id="manualVsInput1" placeholder="Buscar jugador 1"><div id="manualVsHits1" class="manual-vs-hits"></div><button id="manualVsRemove1">CAMBIAR</button></div><div style="text-align:center;font-weight:900;font-size:22px;margin-top:55px">VS</div><div class="manual-vs-person"><b>JUGADOR 2</b><div id="manualVsInfo2"></div><input id="manualVsInput2" placeholder="Buscar jugador 2"><div id="manualVsHits2" class="manual-vs-hits"></div><button id="manualVsRemove2">CAMBIAR</button></div></div><div class="manual-vs-results"><button id="manualVsSave">CREAR SALA</button><button id="manualVsWin1">🏆 GANÓ JUGADOR 1 (+100)</button><button id="manualVsWin2">🏆 GANÓ JUGADOR 2 (+100)</button><button id="manualVsCancel">NADIE GANÓ · CANCELAR</button></div></section>';
 document.body.append(overlay);
 const selected=[null,null];let room=null,busy=false,searchTimers=[null,null];
 const say=s=>{$('manualVsMsg').textContent=s};
 const client=()=>typeof supabaseClient!=='undefined'?supabaseClient:null;
 const call=async(action,extra={})=>{if(!client())throw Error('Conexión no disponible');const {data,error}=await client().rpc('admin_manual_vs_action',{p_action:action,p_player1:null,p_player2:null,p_winner:null,...extra});if(error)throw error;return data};
 const photo=p=>{if(!p?.avatar_path)return '';const {data}=client().storage.from('profile-photos').getPublicUrl(p.avatar_path);return data?.publicUrl||''};
 const render=()=>{
  for(let i=0;i<2;i++){const p=selected[i],target=$('manualVsInfo'+(i+1));target.replaceChildren();if(p){const img=photo(p);if(img){const image=document.createElement('img');image.src=img;image.alt='Foto de perfil';target.append(image)}const d=document.createElement('div');d.textContent=(p.account_name||p.username||'Jugador')+' · ID '+(p.game_id||'—')+' · #'+(p.position||'—')+' · '+(p.elo_points??0)+' ELO · '+(p.rank_name||'');target.append(d);try{if(typeof getRankByElo==='function'&&typeof renderRankBadgeOn==='function'){const badge=document.createElement('div');renderRankBadgeOn(badge,getRankByElo(p.elo_points));target.prepend(badge)}}catch(_){}}$('manualVsInput'+(i+1)).hidden=!!p;$('manualVsRemove'+(i+1)).hidden=!p}
  $('manualVsSave').textContent=room?'REEMPLAZAR JUGADORES':'CREAR SALA';$('manualVsSave').disabled=busy||!selected[0]||!selected[1]||selected[0].id===selected[1].id;
  for(const id of ['manualVsWin1','manualVsWin2','manualVsCancel'])$(id).disabled=busy||!room;
 };
 const refresh=async()=>{const d=await call('get');room=d.room;if(room){for(let i=0;i<2;i++){selected[i]=d['player'+(i+1)];selected[i].position=d['position'+(i+1)]}say('Sala activa #'+room.id+' · Solo tú puedes administrarla.')}else{selected[0]=null;selected[1]=null;say('No hay sala activa. Busca y selecciona dos jugadores.')}render()};
 const run=async(action,extra={})=>{if(busy)return;busy=true;render();try{await call(action,extra);await refresh()}catch(e){say('Error: '+e.message)}finally{busy=false;render()}};
 for(let i=0;i<2;i++){const n=i+1;const input=$('manualVsInput'+n),hits=$('manualVsHits'+n);
  input.addEventListener('input',()=>{clearTimeout(searchTimers[i]);hits.replaceChildren();const q=input.value.trim();if(q.length<2)return;searchTimers[i]=setTimeout(async()=>{try{const {data,error}=await client().rpc('ikar_search_all_ranking_players',{p_query:q});if(error)throw error;hits.replaceChildren();for(const p of data||[]){const b=document.createElement('button');b.textContent=(p.account_name||p.username)+' · #'+p.global_position+' · '+p.elo_points+' ELO';b.onclick=()=>{selected[i]={...p,id:p.player_id,position:p.global_position};hits.replaceChildren();input.value='';render();client().rpc('get_profile_by_id',{p_player_id:p.player_id}).then(({data})=>{const full=Array.isArray(data)?data[0]:data;if(full&&selected[i]?.id===p.player_id){selected[i]={...selected[i],game_id:full.game_id||'',avatar_path:full.avatar_path||p.avatar_path};render()}}).catch(()=>{})};hits.append(b)}if(!hits.children.length)hits.textContent='Sin resultados'}catch(e){say(e.message)}},250)});
  $('manualVsRemove'+n).onclick=()=>{selected[i]=null;render();input.focus()};
 }
 $('manualVsSave').onclick=()=>{if(!selected[0]||!selected[1])return;run(room?'replace':'create',{p_player1:selected[0].id,p_player2:selected[1].id})};
 for(let i=0;i<2;i++)$('manualVsWin'+(i+1)).onclick=()=>{if(confirm('¿Confirmas ganador y +100 ELO, perdedor -100 ELO?'))run('finish',{p_winner:selected[i].id})};
 $('manualVsCancel').onclick=()=>{if(confirm('¿Cancelar sin modificar ELO?'))run('cancel')};
 $('manualVsClose').onclick=()=>overlay.hidden=true;overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true});
 const open=async()=>{document.body.appendChild(overlay);overlay.hidden=false;say('Cargando...');try{await refresh()}catch(e){say('No autorizado o conexión no disponible: '+e.message)}};
 const place=()=>{const anchor=document.querySelector('.sv-create')||[...document.querySelectorAll('button')].find(b=>/ENVIAR SALA VS/i.test(b.textContent||''));if(!anchor)return;
 let b=$('manualVsOpen');if(!b){b=document.createElement('button');b.id='manualVsOpen';b.textContent='⚔ CREAR UN VERSUS';b.addEventListener('click',open)}
 if(b.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',b);
 const shouldHide=anchor.hidden||getComputedStyle(anchor).display==='none';if(b.hidden!==shouldHide)b.hidden=shouldHide;
 };
 const observer=new MutationObserver(()=>place());document.addEventListener('DOMContentLoaded',()=>{place();observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});setInterval(place,3000)},{once:true});
 if(document.readyState!=='loading'){place();observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});setInterval(place,3000)}

})();