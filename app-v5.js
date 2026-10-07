/* Ventana de LOGROS desde el botón cuadrado */
document.addEventListener('DOMContentLoaded',()=>{
 const modal=document.getElementById('achievementsModal');
 const close=document.getElementById('achievementsModalClose');
 document.querySelector('[data-menu="logros"]')?.addEventListener('click',()=>{if(modal)modal.hidden=false});
 close?.addEventListener('click',()=>{if(modal)modal.hidden=true});
 modal?.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
});


/* Sonidos globales: clic normal y regresar/salir/abandonar */
(()=>{
 const CLICK_SRC='Botones/clic.wav?v=4';
 const BACK_SRC='Botones/Regresar.wav?v=1';
 const selector='button,a,input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],label,[role="button"],[role="checkbox"],[role="radio"],.dashboard-menu-tile';
 let touch=null;
 const play=src=>{try{const a=new Audio(src);a.volume=1;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(_){}};
 const isBackControl=el=>{
  if(!el)return false;
  const id=String(el.id||'').toLowerCase(), cls=String(el.className||'').toLowerCase();
  const txt=String(el.getAttribute?.('aria-label')||el.getAttribute?.('title')||el.textContent||'').trim().toLowerCase();
  return /close|cancel|back|exit|leave|abandon|cerrar|regresar|volver|salir|anular/.test(id+' '+cls+' '+txt) || txt==='×' || txt==='✕' || txt==='✖' || txt==='❌';
 };
 const fire=el=>play(isBackControl(el)?BACK_SRC:CLICK_SRC);
 document.addEventListener('touchstart',e=>{
  const el=e.target?.closest?.(selector);if(!el||el.disabled||el.getAttribute('aria-disabled')==='true'){touch=null;return}
  const t=e.changedTouches?.[0];if(!t){touch=null;return}
  touch={el,x:t.clientX,y:t.clientY,moved:false};
 },{passive:true,capture:true});
 document.addEventListener('touchmove',e=>{
  if(!touch)return;const t=e.changedTouches?.[0];if(!t)return;
  if(Math.hypot(t.clientX-touch.x,t.clientY-touch.y)>10)touch.moved=true;
 },{passive:true,capture:true});
 document.addEventListener('touchend',e=>{
  if(!touch)return;const data=touch;touch=null;
  const t=e.changedTouches?.[0];if(t&&Math.hypot(t.clientX-data.x,t.clientY-data.y)>10)data.moved=true;
  if(!data.moved)fire(data.el);
 },{passive:true,capture:true});
 document.addEventListener('touchcancel',()=>{touch=null},{passive:true,capture:true});
 document.addEventListener('click',e=>{
  if('ontouchstart' in window)return;
  const el=e.target?.closest?.(selector);if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;fire(el);
 },{capture:true});
})();

/* Reglas obligatorias antes de buscar rival */
const rulesImageModal=document.getElementById('rulesImageModal');
const rulesImageClose=document.getElementById('rulesImageClose');
const rulesReadCheckbox=document.getElementById('rulesReadCheckbox');
const rulesAcceptBtn=document.getElementById('rulesAcceptBtn');
const rulesReadWarning=document.getElementById('rulesReadWarning');
window.rankingRulesAccepted=localStorage.getItem('ranking8bp_rules_accepted_v1')==='1';
window.openRankingRules=(fromPlay=false)=>{if(!rulesImageModal)return;rulesImageModal.hidden=false;rulesImageModal.dataset.fromPlay=fromPlay?'1':'0';if(rulesReadCheckbox)rulesReadCheckbox.checked=window.rankingRulesAccepted;if(rulesReadWarning){rulesReadWarning.hidden=!fromPlay; if(fromPlay)setTimeout(()=>{if(rulesReadWarning)rulesReadWarning.hidden=true},2600)}};
window.closeRankingRules=()=>{if(rulesImageModal)rulesImageModal.hidden=true;if(rulesReadWarning)rulesReadWarning.hidden=true};
document.querySelector('[data-menu="reglas"]')?.addEventListener('click',()=>window.openRankingRules(false));
const saveRulesRead=()=>{if(rulesReadCheckbox?.checked){window.rankingRulesAccepted=true;localStorage.setItem('ranking8bp_rules_accepted_v1','1')}};
rulesReadCheckbox?.addEventListener('change',()=>{if(rulesReadCheckbox.checked){window.rankingRulesAccepted=true;localStorage.setItem('ranking8bp_rules_accepted_v1','1');if(rulesReadWarning)rulesReadWarning.hidden=true}else{window.rankingRulesAccepted=false;localStorage.removeItem('ranking8bp_rules_accepted_v1')}});
rulesImageClose?.addEventListener('click',()=>{saveRulesRead();window.closeRankingRules()});
rulesImageModal?.addEventListener('click',e=>{if(e.target===rulesImageModal){saveRulesRead();window.closeRankingRules()}});
rulesAcceptBtn?.addEventListener('click',()=>{if(!rulesReadCheckbox?.checked){if(rulesReadWarning){rulesReadWarning.textContent='LEE LAS REGLAS Y MARCA “HE LEÍDO LAS REGLAS” PARA CONTINUAR.';rulesReadWarning.hidden=false}return}window.rankingRulesAccepted=true;localStorage.setItem('ranking8bp_rules_accepted_v1','1');window.closeRankingRules();showToast('✅ Reglas aceptadas. Ya puedes jugar.')});

const GLOBAL_DESIGN_DEFAULTS={badgeSize:170,badgeX:-8,badgeY:-35,cardHeight:180,textX:0,textY:-39,titleSize:15,rankSize:16,eloLabelSize:28,eloNumberSize:48,progressSize:9,barHeight:9,cardWidth:94,artWidth:43};
let globalDesignSettings={...GLOBAL_DESIGN_DEFAULTS};
// Force badge motion with Web Animations API so CSS/inline transforms cannot stop it.
let rankBadgeMotion=null;
function forceRankBadgeMotion(){
 const badge=document.querySelector('#playerDashboard .rank-badge-image');
 if(!badge)return;
 if(rankBadgeMotion){try{rankBadgeMotion.cancel()}catch(_){} rankBadgeMotion=null;}
 badge.style.setProperty('animation','none','important');
 badge.style.setProperty('transform','none','important');badge.style.setProperty('top','-38px','important');
}

function applyGlobalDesign(s){
 globalDesignSettings={...GLOBAL_DESIGN_DEFAULTS,...(s||{})};let d=globalDesignSettings;
 // Embedded browsers (TikTok/Instagram/Facebook WebView) can report a narrow CSS viewport differently. Clamp the saved desktop-like design to the stable mobile proportions.

 const card=document.querySelector('#playerDashboard .rank-hero-card');
 const art=document.querySelector('#playerDashboard .rank-art');
 const badge=document.querySelector('#playerDashboard .rank-badge-image');
 const eloBlock=document.querySelector('#playerDashboard .elo-block');
 const title=document.querySelector('#playerDashboard .rank-competitive-title');
 const rankName=document.querySelector('#playerDashboard .dashboard-rank-name');
 const eloWord=document.querySelector('#playerDashboard .elo-word');
 const eloNumber=document.querySelector('#playerDashboard .elo-number');
 const progressText=document.querySelector('#playerDashboard .rank-progress-text');
 const track=document.querySelector('#playerDashboard .rank-progress-track');
 if(card){card.style.removeProperty('width');card.style.removeProperty('height');card.style.removeProperty('min-height');card.style.removeProperty('grid-template-columns')}
 if(art)art.style.setProperty('height',d.cardHeight+'px','important');
 if(badge){badge.removeAttribute('style')}
 if(eloBlock)eloBlock.style.removeProperty('transform');
 if(title)title.style.setProperty('font-size',d.titleSize+'px','important');
 if(rankName)rankName.style.setProperty('font-size',d.rankSize+'px','important');
 if(eloWord)eloWord.style.setProperty('font-size',d.eloLabelSize+'px','important');
 if(eloNumber)eloNumber.style.setProperty('font-size',d.eloNumberSize+'px','important');
 if(progressText)progressText.style.setProperty('font-size',d.progressSize+'px','important');
 if(track)track.style.setProperty('height',d.barHeight+'px','important');
 const box=document.getElementById('globalDesignControls');if(box)box.querySelectorAll('input[data-k]').forEach(i=>{if(document.activeElement!==i&&d[i.dataset.k]!=null)i.value=d[i.dataset.k]});
}
async function loadGlobalDesign(){
 // Diseño oficial fijo: no leer posiciones guardadas por editores desde la nube.
 applyGlobalDesign(GLOBAL_DESIGN_DEFAULTS);
 setTimeout(()=>applyGlobalDesign(GLOBAL_DESIGN_DEFAULTS),300);
 setTimeout(()=>applyGlobalDesign(GLOBAL_DESIGN_DEFAULTS),1200);
}
function setupGlobalDesignEditor(profile){
 // Eliminación total del editor global, incluso si quedó HTML antiguo en caché/DOM.
 const panel=document.getElementById('globalDesignEditor');
 if(panel)panel.remove();
 const controls=document.getElementById('globalDesignControls');
 if(controls)controls.remove();
 const save=document.getElementById('saveGlobalDesign');
 if(save)save.remove();
}
loadGlobalDesign();

const guestTopbar=document.getElementById('guestTopbar');
const guestEmpty=document.getElementById('guestEmpty');
const playerDashboard=document.getElementById('playerDashboard');
const guestRankingList=document.getElementById('guestRankingList');
const guestRankingCount=document.getElementById('guestRankingCount');
const guestRankingSearchInput=document.getElementById('guestRankingSearchInput');
const guestRankingSearchWrap=document.getElementById('guestRankingSearchWrap');
let guestRankingPlayers=[];
let totalRegisteredPlayers=0;
let realRegisteredCountLoading=false;
async function refreshRealRegisteredCount(){
 if(!supabaseClient||realRegisteredCountLoading)return totalRegisteredPlayers;
 realRegisteredCountLoading=true;
 try{
  const {data,error}=await supabaseClient.rpc('get_real_registered_count');
  if(error)throw error;
  const n=Number(data);
  if(Number.isFinite(n)){totalRegisteredPlayers=n;try{localStorage.setItem('ranking8bp_real_registered_count',String(n))}catch(_){}}
  return totalRegisteredPlayers;
 }catch(e){
  try{const n=Number(localStorage.getItem('ranking8bp_real_registered_count'));if(Number.isFinite(n)&&n>0)totalRegisteredPlayers=n}catch(_){}
  return totalRegisteredPlayers;
 }finally{realRegisteredCountLoading=false}
}
const guestRankShowcase=document.getElementById('guestRankShowcase');
const loginBtn=document.getElementById('loginBtn');
const registerBtn=document.getElementById('registerBtn');
const guestHeroRegisterBtn=document.getElementById('guestHeroRegisterBtn');
const logoutBtn=document.getElementById('logoutBtn');
const deleteAccountBtn=document.getElementById('deleteAccountBtn');
const adminModeBtn=document.getElementById('adminModeBtn');
const ikarModeratorArea=document.getElementById('ikarModeratorArea');
const ikarModeratorBtn=document.getElementById('ikarModeratorBtn');
const adminPanel=document.getElementById('adminPanel');
const adminCloseBtn=document.getElementById('adminCloseBtn');
const adminRefreshBtn=document.getElementById('adminRefreshBtn');
const adminProofsBtn=document.getElementById('adminProofsBtn');
const adminProofsCount=document.getElementById('adminProofsCount');
const adminVsSearch=document.getElementById('adminVsSearch');
const adminVsSearchInput=document.getElementById('adminVsSearchInput');
let adminMatchView='all';
let adminMatchesLoading=false,adminMatchesCache=[],adminVideosCache=[];
const adminMatchList=document.getElementById('adminMatchList');
const adminPlayerList=document.getElementById('adminPlayerList');
const adminPlayerSearch=document.getElementById('adminPlayerSearch');
const adminPlayerSearchInput=document.getElementById('adminPlayerSearchInput');
const adminVsTab=document.getElementById('adminVsTab');
const adminPlayersTab=document.getElementById('adminPlayersTab');
const adminModerationTab=document.getElementById('adminModerationTab');
const adminModeration=document.getElementById('adminModeration');

const adminPrivateMessages=document.getElementById('adminPrivateMessages');
const dynamicArea=document.getElementById('dynamicArea'),dynamicVideoInput=document.getElementById('dynamicVideoInput'),dynamicStatus=document.getElementById('dynamicStatus'),adminDynamicsBtn=document.getElementById('adminDynamicsBtn');let currentDynamic=null,pendingDynamicUpload=null;
async function refreshDynamic(){if(!supabaseClient||!dynamicArea)return;try{const {data,error}=await supabaseClient.rpc('list_player_dynamics');if(error)throw error;const rows=Array.isArray(data)?data:[];dynamicArea.querySelectorAll('.dynamic-generated-btn').forEach(x=>x.remove());dynamicStatus.textContent='';currentDynamic=null;if(!rows.length){dynamicArea.hidden=true;return}dynamicArea.hidden=false;for(const d of rows){const btn=document.createElement('button');btn.type='button';btn.className='dynamic-btn dynamic-generated-btn';btn.dataset.dynamicId=String(d.dynamic_id);const pending=d.status==='pending',ended=d.status==='closed'||d.status==='judged'||Number(d.entry_count)>=Number(d.max_entries);btn.textContent=d.my_entry_position?'VIDEO ENVIADO ✓':('DINÁMICA #'+d.dynamic_number+(pending?' 🔒':''));if(pending)btn.classList.add('dynamic-pending');if(d.my_entry_position)btn.classList.add('dynamic-sent');if(ended&&!d.my_entry_position)btn.classList.add('dynamic-finished');if(ended&&d.my_entry_position)btn.classList.add('dynamic-sent-finished');if(ended||d.my_entry_position)btn.disabled=true;btn.onclick=()=>{if(pending){const original='DINÁMICA #'+d.dynamic_number+' 🔒';btn.textContent='ESTA DINÁMICA AÚN NO EMPIEZA';clearTimeout(btn._pendingMessageTimer);btn._pendingMessageTimer=setTimeout(()=>btn.textContent=original,3000);return}if(ended)return;currentDynamic=d;dynamicStatus.textContent=d.my_entry_position?'VIDEO ENVIADO · FUISTE #'+d.my_entry_position:'PRIMEROS '+d.max_entries+' VIDEOS · '+d.entry_count+'/'+d.max_entries;if(!d.my_entry_position){if(!currentUser){showToast('Inicia sesión para enviar tu video.');return}pendingDynamicUpload={...d};dynamicVideoInput.value='';dynamicVideoInput?.click()}};dynamicArea.insertBefore(btn,dynamicVideoInput);if(ended){const msg=document.createElement('div');msg.className='dynamic-ended dynamic-generated-btn';msg.textContent='LA DINÁMICA '+d.dynamic_number+' HA TERMINADO.';dynamicArea.insertBefore(msg,dynamicVideoInput)}}}catch(e){console.error('Dinámicas:',e);dynamicArea.hidden=true}}
dynamicVideoInput?.addEventListener('change',async()=>{const file=dynamicVideoInput.files?.[0],targetDynamic=pendingDynamicUpload||currentDynamic;if(!file){dynamicStatus.textContent='No seleccionaste ningún video.';return}if(!targetDynamic){dynamicStatus.textContent='No se pudo identificar la dinámica. Tócala otra vez.';return}currentDynamic=targetDynamic;dynamicStatus.textContent='CARGANDO VIDEO...';try{dynamicStatus.textContent='Comprobando video...';const mime=String(file.type||'').toLowerCase(),fname=String(file.name||'').toLowerCase();const knownVideo=/^video\//.test(mime)||/\.(mp4|mov|m4v|webm|3gp|3g2|mkv|avi)$/i.test(fname);const genericProvider=!mime||mime==='application/octet-stream'||mime==='application/binary'||mime==='application/x-download';if(!knownVideo&&!genericProvider)throw new Error('El archivo seleccionado no parece ser un video.');if(!Number.isFinite(Number(file.size))||file.size<=0)throw new Error('El gestor no entregó el video correctamente. Prueba otro gestor o Galería.');if(file.size>80*1024*1024)throw new Error('El video supera 80 MB.');let duration=null;try{duration=await Promise.race([getVideoDuration(file),new Promise((_,reject)=>setTimeout(()=>reject(new Error('metadata-timeout')),5000))])}catch(err){console.warn('No se pudo validar metadata del video; se intentará subir igualmente.',err)}if(Number.isFinite(duration)&&duration>30.05)throw new Error('El video debe durar máximo 30 segundos.');const ext=getVideoExtension(file),path=String(currentDynamic.dynamic_id)+'/'+currentUser.id+'/dynamic-'+Date.now()+'.'+ext;dynamicStatus.textContent='Subiendo video...';const up=await supabaseClient.storage.from('dynamic-videos').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;const r=await supabaseClient.rpc('submit_dynamic_video',{p_dynamic_id:Number(currentDynamic.dynamic_id),p_video_path:path});if(r.error){await supabaseClient.storage.from('dynamic-videos').remove([path]).catch(()=>{});throw r.error}const row=Array.isArray(r.data)?r.data[0]:r.data;const sentDynamicId=Number(currentDynamic.dynamic_id),sentDynamicNumber=currentDynamic.dynamic_number;currentDynamic.my_entry_position=Number(row?.entry_position)||1;const sentBtn=dynamicArea.querySelector('button.dynamic-generated-btn[data-dynamic-id="'+sentDynamicId+'"]');if(sentBtn){sentBtn.textContent='VIDEO ENVIADO ✓';sentBtn.disabled=true;sentBtn.classList.add('dynamic-sent')}dynamicStatus.textContent='VIDEO ENVIADO ✓ · FUISTE #'+currentDynamic.my_entry_position;showToast('✅ VIDEO ENVIADO · DINÁMICA #'+sentDynamicNumber);setTimeout(()=>refreshDynamic().catch(()=>{}),300)}catch(e){console.error(e);dynamicStatus.textContent=String(e?.message||'No se pudo enviar el video.').includes('ALREADY_SUBMITTED')?'Ya enviaste tu video en esta dinámica.':String(e?.message||'No se pudo enviar el video.');await refreshDynamic()}finally{dynamicVideoInput.value=''}});
async function loadAdminDynamics(){if(!adminMatchList||!supabaseClient)return;adminMatchView='dynamics';adminMatchList.hidden=false;if(adminPlayerList)adminPlayerList.hidden=true;if(adminModeration)adminModeration.hidden=true;adminMatchList.innerHTML='<div class="admin-empty">Cargando dinámicas...</div>';const r=await supabaseClient.rpc('admin_list_dynamics');if(r.error){console.error(r.error);adminMatchList.innerHTML='<div class="admin-empty">No se pudieron cargar las dinámicas.</div>';return}const dynamics=Array.isArray(r.data)?r.data:[];adminMatchList.replaceChildren();const top=document.createElement('div');top.className='dynamic-admin-toolbar';const createBtn=document.createElement('button');createBtn.type='button';createBtn.className='admin-refresh';createBtn.textContent='＋ CREAR NUEVA';top.append(createBtn);adminMatchList.append(top);const form=document.createElement('div');form.className='dynamic-create-form';form.hidden=true;form.innerHTML='<label>NOMBRE:<input type="text" maxlength="80" id="dynamicCreateName" placeholder="Nombre de la dinámica"></label><label>MÁXIMO DE VIDEOS QUE ACEPTARÁ ESA DINÁMICA:<input type="number" min="1" max="100" id="dynamicCreateMax" value="10"></label><button type="button" id="dynamicCreateSave">GUARDAR</button>';adminMatchList.append(form);createBtn.onclick=()=>{form.hidden=!form.hidden};form.querySelector('#dynamicCreateSave').onclick=async()=>{const name=form.querySelector('#dynamicCreateName').value.trim(),max=Number(form.querySelector('#dynamicCreateMax').value);if(!name){showToast('Escribe el nombre de la dinámica.');return}if(!Number.isInteger(max)||max<1||max>100){showToast('El máximo debe ser entre 1 y 100 videos.');return}const x=await supabaseClient.rpc('admin_create_dynamic',{p_title:name,p_max_entries:max});if(x.error){console.error(x.error);showToast('No se pudo crear la dinámica.');return}showToast('✅ Dinámica creada.');await refreshDynamic();await loadAdminDynamics()};if(!dynamics.length){const empty=document.createElement('div');empty.className='admin-empty';empty.textContent='No hay dinámicas creadas.';adminMatchList.append(empty);return}for(const d of dynamics){const card=document.createElement('div');card.className='dynamic-admin-entry dynamic-admin-manager-card';const info=document.createElement('div');info.className='dynamic-admin-info';const state=d.status==='pending'?'NO INICIADA':d.status==='open'?'ACTIVA':d.status==='judged'?'FINALIZADA · GANADOR ELEGIDO':'FINALIZADA';const name=document.createElement('strong');name.textContent='DINÁMICA #'+d.dynamic_number+' · '+String(d.title||'SIN NOMBRE').toUpperCase();const meta=document.createElement('small');meta.textContent=state+' · '+d.entry_count+'/'+d.max_entries+' VIDEOS';info.append(name,meta);const actions=document.createElement('div');actions.className='dynamic-admin-actions';if(d.status==='pending'){const start=document.createElement('button');start.type='button';start.textContent='▶ INICIAR';start.onclick=async()=>{if(!confirm('¿Iniciar DINÁMICA #'+d.dynamic_number+'? Los jugadores podrán enviar videos.'))return;const x=await supabaseClient.rpc('admin_start_dynamic',{p_dynamic_id:Number(d.dynamic_id)});if(x.error){showToast(String(x.error.message||'').includes('ANOTHER_DYNAMIC_ACTIVE')?'Ya hay otra dinámica activa.':'No se pudo iniciar la dinámica.');return}showToast('✅ DINÁMICA #'+d.dynamic_number+' INICIADA');await refreshDynamic();await loadAdminDynamics()};actions.append(start)}else{const view=document.createElement('button');view.type='button';view.textContent='▶ VER VIDEOS';view.onclick=()=>loadAdminDynamicVideos(d);actions.append(view)}const del=document.createElement('button');del.type='button';del.className='dynamic-delete-btn';del.textContent='🗑️';del.title='Borrar dinámica';del.onclick=async()=>{if(!confirm('¿BORRAR DINÁMICA #'+d.dynamic_number+'? Se eliminarán también sus registros y videos.'))return;const x=await supabaseClient.rpc('admin_delete_dynamic',{p_dynamic_id:Number(d.dynamic_id)});if(x.error){console.error(x.error);showToast('No se pudo borrar la dinámica.');return}const paths=Array.isArray(x.data)?x.data:[];if(paths.length)await supabaseClient.storage.from('dynamic-videos').remove(paths).catch(()=>{});showToast('🗑️ Dinámica borrada.');await refreshDynamic();await loadAdminDynamics()};actions.append(del);card.append(info,actions);adminMatchList.append(card)}}
async function loadAdminDynamicVideos(d){if(!adminMatchList||!supabaseClient)return;adminMatchList.innerHTML='<div class="admin-empty">Cargando videos...</div>';const r=await supabaseClient.rpc('admin_get_dynamic_entries',{p_dynamic_id:Number(d.dynamic_id)});if(r.error){console.error(r.error);adminMatchList.innerHTML='<div class="admin-empty">No se pudieron cargar los videos.</div>';return}const rows=Array.isArray(r.data)?r.data:[];adminMatchList.replaceChildren();const back=document.createElement('button');back.type='button';back.className='admin-refresh';back.textContent='← VOLVER A DINÁMICAS';back.onclick=loadAdminDynamics;const head=document.createElement('div');head.className='admin-result-title';head.textContent='DINÁMICA #'+d.dynamic_number+' · '+String(d.title||'')+' · '+rows.length+'/'+d.max_entries+' VIDEOS';adminMatchList.append(back,head);if(!rows.length){const empty=document.createElement('div');empty.className='admin-empty';empty.textContent='Aún no han enviado videos.';adminMatchList.append(empty);return}for(const e of rows){const card=document.createElement('div');card.className='dynamic-admin-entry';const title=document.createElement('strong');title.textContent='#'+e.entry_position+' · '+String(e.player_name||'JUGADOR').toUpperCase();const actions=document.createElement('div');actions.className='dynamic-admin-actions';const video=document.createElement('button');video.type='button';video.textContent='▶ VER VIDEO';video.onclick=async()=>{const s=await supabaseClient.storage.from('dynamic-videos').createSignedUrl(e.video_path,300);if(s.error){showToast('No se pudo abrir el video.');return}window.open(s.data.signedUrl,'_blank')};const win=document.createElement('button');win.type='button';win.textContent=e.is_winner?'🏆 GANADOR':'ELEGIR GANADOR';win.disabled=!!e.is_winner;win.onclick=async()=>{if(!confirm('¿Elegir a '+e.player_name+' como ganador? El ganador se elige por el video correcto, no por el orden de envío.'))return;const x=await supabaseClient.rpc('admin_set_dynamic_winner',{p_dynamic_id:Number(d.dynamic_id),p_player_id:e.player_id});if(x.error){showToast('No se pudo elegir ganador.');return}showToast('🏆 Ganador seleccionado. Se le envió un mensaje a su bandeja.');d.status='judged';await loadAdminDynamicVideos(d);await refreshDynamic()};actions.append(video,win);if(e.is_winner){const msg=document.createElement('button');msg.type='button';msg.textContent='💬 ENVIAR MENSAJE';msg.onclick=async()=>{if(adminPanel)adminPanel.hidden=true;await loadInbox();openConversation(e.player_id,e.player_name)};actions.append(msg)}card.append(title,actions);adminMatchList.append(card)}}
adminDynamicsBtn?.addEventListener('click',loadAdminDynamics);

const backBtn=document.getElementById('backBtn');
const settingsBtn=document.getElementById('settingsBtn');
const settingsMenu=document.getElementById('settingsMenu');
const activityBtn=document.getElementById('activityBtn');
const activityPanel=document.getElementById('activityPanel');
const activityList=document.getElementById('activityList');
const refreshActivityBtn=document.getElementById('refreshActivityBtn');

const profileAvatar=document.getElementById('profileAvatar');
const avatarPlaceholder=document.getElementById('avatarPlaceholder');
const profilePhotoInput=document.getElementById('profilePhotoInput');
const dashboardPlayerName=document.getElementById('dashboardPlayerName');
const dashboardFollowersCount=document.getElementById('dashboardFollowersCount');
const dashboardFollowingCount=document.getElementById('dashboardFollowingCount');
const countryFlag=document.getElementById('countryFlag');
const countryName=document.getElementById('countryName');
const dashboardElo=document.getElementById('dashboardElo');
const dashboardWins=document.getElementById('dashboardWins');
const dashboardLosses=document.getElementById('dashboardLosses');
const competitiveWins=document.getElementById('competitiveWins'),competitiveLosses=document.getElementById('competitiveLosses');
const dashboardPlayBtn=document.getElementById('dashboardPlayBtn');
const playersOnlineCount=document.getElementById('playersOnlineCount');
const playersSearchingCount=document.getElementById('playersSearchingCount'),playersSearchingText=document.getElementById('playersSearchingText');
const playersOnlineNow=document.getElementById('playersOnlineNow'),playingVsModal=document.getElementById('playingVsModal'),playingVsClose=document.getElementById('playingVsClose'),playingVsList=document.getElementById('playingVsList');
const eloDailyLimitModal=document.getElementById('eloDailyLimitModal'),eloDailyLimitClose=document.getElementById('eloDailyLimitClose'),eloDailyCountdown=document.getElementById('eloDailyCountdown');
let eloDailyResetAt=null,eloDailyCountdownTimer=null;
const matchmakingModal=document.getElementById('matchmakingModal');
const matchmakingClose=document.getElementById('matchmakingClose');
const matchmakingSearching=document.getElementById('matchmakingSearching');
const matchmakingVersus=document.getElementById('matchmakingVersus');
const versusMe=document.getElementById('versusMe');
const versusMyElo=document.getElementById('versusMyElo');
const versusMyGameId=document.getElementById('versusMyGameId'),versusOpponentGameId=document.getElementById('versusOpponentGameId');
const copyMyGameId=document.getElementById('copyMyGameId'),copyOpponentGameId=document.getElementById('copyOpponentGameId');
const versusOpponent=document.getElementById('versusOpponent');
const versusOpponentElo=document.getElementById('versusOpponentElo');
const versusMyAvatar=document.getElementById('versusMyAvatar'),versusOpponentAvatar=document.getElementById('versusOpponentAvatar');
const versusMyRank=document.getElementById('versusMyRank'),versusOpponentRank=document.getElementById('versusOpponentRank');
const versusMyRankBadge=document.getElementById('versusMyRankBadge'),versusOpponentRankBadge=document.getElementById('versusOpponentRankBadge');
const versusMyPosition=document.getElementById('versusMyPosition'),versusOpponentPosition=document.getElementById('versusOpponentPosition');
const pendingMatchesCount=document.getElementById('pendingMatchesCount');
const abandonRankedBtn=document.getElementById('abandonRankedBtn');
const confirmedMatchWarning=document.getElementById('confirmedMatchWarning');
const rankedMatchRules=document.getElementById('rankedMatchRules');
const rankedVsChat=document.getElementById('rankedVsChat'),rankedVsChatMessages=document.getElementById('rankedVsChatMessages'),rankedVsChatInput=document.getElementById('rankedVsChatInput'),rankedVsChatSend=document.getElementById('rankedVsChatSend');
let rankedVsChatMatchId=null,rankedVsChatTimer=null,rankedChatResponseTimer=null,rankedChatResponseSyncTimer=null,rankedChatResponseExpiresAt=0,rankedChatResponseExpiring=false;
// Prevent slow Supabase responses from stacking duplicate polling requests.
let rankedVsChatLoading=false,rankedVsChatSending=false,rankedChatStatusLoading=false,activeRankedMatchLoading=false,matchmakingPollLoading=false,matchmakingHeartbeatLoading=false,matchmakingStartLoading=false,playersPlayingLoading=false,playersSearchingLoading=false;
const rankedMatchCountdown=document.getElementById('rankedMatchCountdown'),rankedMatchCountdownValue=document.getElementById('rankedMatchCountdownValue');
const rankedPlayerConfirmBtn=document.getElementById('rankedPlayerConfirmBtn'),rankedPlayerConfirmStatus=document.getElementById('rankedPlayerConfirmStatus');
const playerVsSafety=document.getElementById('playerVsSafety'),playerCancelVsBtn=document.getElementById('playerCancelVsBtn'),playerPlayingBtn=document.getElementById('playerPlayingBtn'),playerPlayingLocked=document.getElementById('playerPlayingLocked'),playerVsSafetyNotice=document.getElementById('playerVsSafetyNotice');
const playerPlayingConfirmBox=document.getElementById('playerPlayingConfirmBox'),playerPlayingYesBtn=document.getElementById('playerPlayingYesBtn'),playerPlayingNoBtn=document.getElementById('playerPlayingNoBtn');
let rankedMatchCountdownTimer=null;
const rankedPlayTimer=document.getElementById('rankedPlayTimer'),rankedPlayTimerValue=document.getElementById('rankedPlayTimerValue'),rankedPlayTimerNote=document.getElementById('rankedPlayTimerNote');
let rankedPlayTimerInterval=null,rankedPlayTimerMatchId=null,rankedPlayTimerState={myEvidence:false,opponentEvidence:false};
const rankedResultReport=document.getElementById('rankedResultReport'),rankedClaimWon=document.getElementById('rankedClaimWon'),rankedClaimLost=document.getElementById('rankedClaimLost'),rankedResultStatus=document.getElementById('rankedResultStatus');
const rankedVideoProof=document.getElementById('rankedVideoProof');
const rankedVideoModal=document.getElementById('rankedVideoModal'),rankedVideoPlayer=document.getElementById('rankedVideoPlayer'),rankedVideoClose=document.getElementById('rankedVideoClose'),rankedVideoTitle=document.getElementById('rankedVideoTitle'),rankedVideoStatus=document.getElementById('rankedVideoStatus');
const rankedWinnerVideoInput=document.getElementById('rankedWinnerVideoInput');
const rankedWinnerVideoBtn=document.getElementById('rankedWinnerVideoBtn');
const rankedForgotRecordingBtn=document.getElementById('rankedForgotRecordingBtn');
const rankedWinnerVideoStatus=document.getElementById('rankedWinnerVideoStatus');
const rankedReviewNotice=document.getElementById('rankedReviewNotice'),rankedReviewOkBtn=document.getElementById('rankedReviewOkBtn');
let pendingMatchesTimer=null;
let matchmakingTimer=null,currentRankedMatchId=null,matchmakingHeartbeatTimer=null,rankedSearchActive=false,currentRankedMatchData=null,rankedSearchLoopToken=0;
const gamesPlayed=document.getElementById('gamesPlayed');
const winRate=document.getElementById('winRate');
const currentStreak=document.getElementById('currentStreak');
const bestElo=document.getElementById('bestElo');
const dashboardMessage=document.getElementById('dashboardMessage');
const rankBadgeImage=document.getElementById('rankBadgeImage');
const rankingList=document.getElementById('rankingList');
const rankingCount=document.getElementById('rankingCount');
const rankingSearchInput=document.getElementById('rankingSearchInput');
const rankingSearchWrap=document.getElementById('rankingSearchWrap');
let rankingPlayersCache=[];
let guestRankingLoading=false,rankingLoading=false,latestResultLoading=false,rankingStreaksLoading=false;
const PUBLIC_CACHE_TTL=6*60*60*1000;
function readPublicCacheEntry(key){
 try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&Date.now()-Number(x.savedAt||0)<PUBLIC_CACHE_TTL?x:null}catch(_){return null}
}
function readPublicCache(key){return readPublicCacheEntry(key)?.data??null}
function publicCacheFresh(key,maxAge=120000){const x=readPublicCacheEntry(key);return Boolean(x&&Date.now()-Number(x.savedAt||0)<maxAge)}
function writePublicCache(key,data){try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}))}catch(_){}}
function burstJitter(max=2500){return new Promise(resolve=>setTimeout(resolve,Math.floor(Math.random()*max)))}
const avatarUrlCache=new Map();
async function getCachedAvatarUrl(path){
 const key=String(path||'');if(!key||!supabaseClient)return null;
 const cached=avatarUrlCache.get(key);if(cached&&cached.expiresAt>Date.now())return cached.url;
 // profile-photos is public: use the stable public URL so browser/CDN caching works.
 const {data}=supabaseClient.storage.from('profile-photos').getPublicUrl(key);
 const url=data?.publicUrl||null;if(url)avatarUrlCache.set(key,{url,expiresAt:Date.now()+6*60*60*1000});return url;
}
function paintLatestRankingResult(r){
 const boxes=[document.getElementById('latestRankingResult'),document.getElementById('guestLatestRankingResult')].filter(Boolean);
 if(!r){boxes.forEach(x=>x.textContent='Aún no hay resultados en el Ranking.');return}
 const d=new Date(r.finished_at),time=new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',hour:'numeric',minute:'2-digit',hour12:true}).format(d),date=new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',day:'numeric',month:'long'}).format(d);
 boxes.forEach(x=>{x.replaceChildren();const tag=document.createElement('small');tag.textContent='ÚLTIMO RESULTADO';const line=document.createElement('strong');const winner=document.createElement('span');winner.className='latest-result-winner';winner.textContent=String(r.winner_name);const loser=document.createElement('span');loser.className='latest-result-loser';loser.textContent=String(r.loser_name);line.append(winner,document.createTextNode(' ganó a '),loser,document.createTextNode(' a las '+time+' el '+date));x.append(tag,line)})
}
let onlinePlayerIds=new Set(),onlinePresenceTimer=null,rankingStreaks=new Map();
let explicitLogoutRequested=false;
let playerUiLoadingFor=null;
let playerUiReadyFor=null;
const playerDetailModal=document.getElementById('playerDetailModal');
const closePlayerDetail=document.getElementById('closePlayerDetail');
const playerDetailAvatar=document.getElementById('playerDetailAvatar');
const playerDetailName=document.getElementById('playerDetailName');
const playerDetailFlag=document.getElementById('playerDetailFlag');
const playerDetailCountry=document.getElementById('playerDetailCountry');
const playerDetailGameId=document.getElementById('playerDetailGameId');
const playerDetailElo=document.getElementById('playerDetailElo');
const playerDetailPosition=document.getElementById('playerDetailPosition');
const playerDetailPositionStat=document.getElementById('playerDetailPositionStat');
const playerDetailWins=document.getElementById('playerDetailWins');
const playerDetailLosses=document.getElementById('playerDetailLosses');
const playerDetailDynamicWins=document.getElementById('playerDetailDynamicWins');
const playerDetailRank=document.getElementById('playerDetailRank');
const playerDetailRankBadge=document.getElementById('playerDetailRankBadge');
const playerHeartBtn=document.getElementById('playerHeartBtn');
const playerHeartCount=document.getElementById('playerHeartCount');
const playerHeartCountLabel=document.getElementById('playerHeartCountLabel');
const playerFollowBtn=document.getElementById('playerFollowBtn');
const playerPlayBtn=document.getElementById('playerPlayBtn');
const playerMessageBtn=document.getElementById('playerMessageBtn');
const playerAdminBtn=document.getElementById('playerAdminBtn');
const privateMessageModal=document.getElementById('privateMessageModal');
const privateMessageClose=document.getElementById('privateMessageClose');
const privateMessageTo=document.getElementById('privateMessageTo');
const privateMessageInput=document.getElementById('privateMessageInput');
const privateMessageSend=document.getElementById('privateMessageSend');
const playerFollowersCount=document.getElementById('playerFollowersCount');
const playerFollowingCount=document.getElementById('playerFollowingCount');
const profileCommentForm=document.getElementById('profileCommentForm');
const profileCommentInput=document.getElementById('profileCommentInput');
const profileCommentSubmit=document.getElementById('profileCommentSubmit');
const profileCommentsList=document.getElementById('profileCommentsList');
const profileCommentCount=document.getElementById('profileCommentCount');
const inboxBtn=document.getElementById('inboxBtn');
const inboxBadge=document.getElementById('inboxBadge');
const inboxPanel=document.getElementById('inboxPanel');
const inboxList=document.getElementById('inboxList');
const refreshInboxBtn=document.getElementById('refreshInboxBtn');
const conversationPanel=document.getElementById('conversationPanel');
const conversationTitle=document.getElementById('conversationTitle');
const conversationMessages=document.getElementById('conversationMessages');
const conversationInput=document.getElementById('conversationInput');
const conversationSendBtn=document.getElementById('conversationSendBtn');
const conversationBackBtn=document.getElementById('conversationBackBtn');
const conversationCloseBtn=document.getElementById('conversationCloseBtn');
let inboxMessagesCache=[],activeConversationUser=null;
const notificationBtn=document.getElementById('notificationBtn');
const notificationBadge=document.getElementById('notificationBadge');
const notificationPanel=document.getElementById('notificationPanel');
const notificationList=document.getElementById('notificationList');
const markNotificationsRead=document.getElementById('markNotificationsRead');

const registerModal=document.getElementById('registerModal');
const closeRegisterModalBtn=document.getElementById('closeRegisterModal');
const registerForm=document.getElementById('registerForm');
const registerSubmit=document.getElementById('registerSubmit');
const registerError=document.getElementById('registerError');
const username=document.getElementById('username');
const password=document.getElementById('password');
const gameId=document.getElementById('gameId');
const country=document.getElementById('country');
const loginModal=document.getElementById('loginModal');
const closeLoginModalBtn=document.getElementById('closeLoginModal');
const loginForm=document.getElementById('loginForm');
const loginSubmit=document.getElementById('loginSubmit');
const loginError=document.getElementById('loginError');
const loginUsername=document.getElementById('loginUsername');
const loginPassword=document.getElementById('loginPassword');
const toast=document.getElementById('toast');

let supabaseClient=null;
let currentUser=null;
let currentProfile=null;
let avatarPreviewUrl='';
let toastTimer;
let currentDetailPlayer=null;
let currentDetailHearted=false;
let currentDetailHeartBusy=false;

const cloudConfig=window.SUPABASE_CONFIG||{};
const cloudReady=typeof window.supabase!=='undefined'&&typeof cloudConfig.url==='string'&&cloudConfig.url.startsWith('https://')&&typeof cloudConfig.key==='string'&&cloudConfig.key.length>20;
if(cloudReady){supabaseClient=window.supabase.createClient(cloudConfig.url,cloudConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:'ranking8bp-auth'}})}


const RANKS=[
  {min:0,name:'Latón I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/LatonI.png'},
  {min:15,name:'Latón II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/LatonII.png'},
  {min:30,name:'Latón III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/LatonIII.png'},
  {min:45,name:'Latón IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/LatonIV.png'},
  {min:60,name:'Latón V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/LatonV.png'},
  {min:80,name:'Bronce I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/bronceI.png'},
  {min:100,name:'Bronce II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/BronceII.png'},
  {min:120,name:'Bronce III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/BronceIII.png'},
  {min:140,name:'Bronce IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/BronceIV.png'},
  {min:160,name:'Bronce V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/BronceV.png'},
  {min:185,name:'Plata I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlataI.png'},
  {min:210,name:'Plata II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlataII.png'},
  {min:235,name:'Plata III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlataIII.png'},
  {min:260,name:'Plata IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlataIV.png'},
  {min:285,name:'Plata V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlataV.png'},
  {min:315,name:'Oro I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/OroI.png'},
  {min:345,name:'Oro II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/OroII.png'},
  {min:375,name:'Oro III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/OroIII.png'},
  {min:405,name:'Oro IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/OroIV.png'},
  {min:435,name:'Oro V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/OroV.png'},
  {min:475,name:'Platino I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlatinoI.png'},
  {min:515,name:'Platino II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlatinoII.png'},
  {min:555,name:'Platino III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlatinoIII.png'},
  {min:595,name:'Platino IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlatinoIV.png'},
  {min:635,name:'Platino V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/PlatinoV.png'},
  {min:685,name:'Titanio I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/TitanioI.png'},
  {min:735,name:'Titanio II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/TitanioII.png'},
  {min:785,name:'Titanio III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/TitanioIII.png'},
  {min:835,name:'Titanio IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/TitanioIV.png'},
  {min:885,name:'Titanio V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/TitanioV.png'},
  {min:950,name:'Diamante I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamanteI.png'},
  {min:1015,name:'Diamante II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamanteII.png'},
  {min:1080,name:'Diamante III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamanteIII.png'},
  {min:1145,name:'Diamante IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamanteIV.png'},
  {min:1210,name:'Diamante V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamanteV.png'},
  {min:1300,name:'Diamante Negro I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamantenegroI.png'},
  {min:1390,name:'Diamante Negro II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamantenegroII.png'},
  {min:1480,name:'Diamante Negro III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamantenegroIII.png'},
  {min:1570,name:'Diamante Negro IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamantenegroIV.png'},
  {min:1660,name:'Diamante Negro V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/DiamantenegroV.png'},
  {min:1800,name:'Élite I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/EliteI.png'},
  {min:1940,name:'Élite II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/EliteII.png'},
  {min:2080,name:'Élite III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/EliteIII.png'},
  {min:2220,name:'Élite IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/EliteIV.png'},
  {min:2360,name:'Élite V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/EliteV.png'},
  {min:2600,name:'Maestro I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MaestroI.png'},
  {min:2840,name:'Maestro II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MaestroII.png'},
  {min:3080,name:'Maestro III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MaestroIII.png'},
  {min:3320,name:'Maestro IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MaestroIV.png'},
  {min:3560,name:'Maestro V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MaestroV.png'},
  {min:4000,name:'Gran Maestro I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/GranmaestroI.png'},
  {min:4450,name:'Gran Maestro II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/GranmaestroII.png'},
  {min:4900,name:'Gran Maestro III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/GranmaestroIII.png'},
  {min:5350,name:'Gran Maestro IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/GranmaestroIV.png'},
  {min:5800,name:'Gran Maestro V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/GranmaestroV.png'},
  {min:6500,name:'MÍTICO I',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MiticoI.png'},
  {min:7300,name:'MÍTICO II',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MiticoII.png'},
  {min:8150,name:'MÍTICO III',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MiticoIII.png'},
  {min:9050,name:'MÍTICO IV',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MiticoIV.png'},
  {min:10000,name:'MÍTICO V',image:'https://raw.githubusercontent.com/Ranking8bp/RANKINGIKAR8BP/main/rangos/MiticoV.png'}
];

function getRankByElo(value){
  const elo=Number.isFinite(Number(value))?Number(value):200;
  let index=0;
  for(let i=0;i<RANKS.length;i++){
    if(elo>=RANKS[i].min)index=i;
    else break;
  }
  return {...RANKS[index],index};
}

function applyRankImage(element,rank){
  if(!element||!rank)return;
  element.setAttribute('aria-label','Insignia '+rank.name);
  element.title='Rango '+rank.name;
  element.style.backgroundImage='none';
  element.replaceChildren();
  const img=document.createElement('img');
  img.src=rank.image;
  img.alt='Insignia '+rank.name;
  img.className='rank-original-img';
  img.decoding='async';
  img.draggable=false;
  element.appendChild(img);
}

async function renderRankBadge(rank){
  if(!rankBadgeImage)return;
  applyRankImage(rankBadgeImage,rank);
}

function renderRankBadgeOn(element,rankOrElo){
  const rank=(rankOrElo&&typeof rankOrElo==='object')?rankOrElo:getRankByElo(rankOrElo);
  applyRankImage(element,rank);
}

function openRankZoom(rank,player){
  const modal=document.getElementById('rankZoomModal'),img=document.getElementById('rankZoomImage'),name=document.getElementById('rankZoomName'),stats=document.getElementById('rankZoomStats');
  if(!modal||!img||!rank)return;
  img.src=rank.image;
  img.alt='Insignia '+rank.name;
  if(name)name.textContent=rank.name.toUpperCase();
  if(stats&&player)stats.textContent='ELO '+(Number(player.elo_points)||0)+' · '+(Number(player.wins)||0)+' victorias · '+(Number(player.losses)||0)+' derrotas';
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}
function closeRankZoom(){const modal=document.getElementById('rankZoomModal');if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}}
document.addEventListener('click',e=>{if(e.target?.id==='rankZoomClose'||e.target?.id==='rankZoomModal')closeRankZoom()});

async function renderPlayerDetailRankBadge(rank){
  if(!playerDetailRankBadge)return;
  if(!currentDetailPlayer)return;
  applyRankImage(playerDetailRankBadge,rank);
}



async function copyGameIdValue(value){
 const id=String(value||'').trim();
 if(!id||id==='NO REGISTRADO'){showToast('No hay un ID registrado.');return}
 try{await navigator.clipboard.writeText(id);showToast('ID copiado: '+id)}
 catch(e){const ta=document.createElement('textarea');ta.value=id;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('ID copiado: '+id)}
}
if(copyMyGameId)copyMyGameId.addEventListener('click',()=>copyGameIdValue(copyMyGameId.dataset.gameId||versusMyGameId?.textContent));
if(copyOpponentGameId)copyOpponentGameId.addEventListener('click',()=>copyGameIdValue(copyOpponentGameId.dataset.gameId||versusOpponentGameId?.textContent));

async function abandonRankedMatch(){
 if(!currentRankedMatchId||!supabaseClient)return;
 if(!confirm('¿Abandonar este emparejamiento? Tu rival volverá automáticamente a buscar rival.'))return;
 const id=currentRankedMatchId;
 try{
  const {error}=await supabaseClient.rpc('abandon_ranked_match',{p_match_id:id});if(error)throw error;
  currentRankedMatchId=null;clearInterval(matchmakingTimer);clearInterval(pendingMatchesTimer);matchmakingTimer=null;pendingMatchesTimer=null;
  if(matchmakingModal)matchmakingModal.hidden=true;showToast('Abandonaste el emparejamiento.');
 }catch(e){console.error(e);const msg=String(e?.message||'');if(msg.includes('match locked')){showToast('VS confirmado por el administrador. Ya no puedes abandonar.');if(abandonRankedBtn){abandonRankedBtn.disabled=true;abandonRankedBtn.textContent='VS CONFIRMADO · NO SE PUEDE ABANDONAR'}}else showToast('No se pudo abandonar el emparejamiento.')}
}

let rankedVsBothMessaged=false,lastVsSafetyRpcAt=0,rankedPlayingLockedLocally=false;
function paintPlayerVsSafety(st){
 if(!st)return;
 const ready=!!st.both_messaged;
 /* New flow: once both players have written, result actions unlock immediately.
    No "YA ESTAMOS JUGANDO" confirmation is required. */
 if(playerVsSafety){playerVsSafety.hidden=true;playerVsSafety.style.display='none'}
 if(playerPlayingBtn){playerPlayingBtn.hidden=true;playerPlayingBtn.disabled=true;playerPlayingBtn.style.display='none'}
 if(playerCancelVsBtn){playerCancelVsBtn.hidden=ready;playerCancelVsBtn.disabled=ready;playerCancelVsBtn.style.display=ready?'none':''}
 if(playerPlayingLocked)playerPlayingLocked.hidden=true;
 if(ready){
  stopRankedChatResponseTimer();
  if(abandonRankedBtn){abandonRankedBtn.hidden=true;abandonRankedBtn.disabled=true;abandonRankedBtn.style.display='none'}
  updateRankedResultReport(currentRankedMatchData);
 }
}
function safetyFromRealtimeRow(row){
 if(!row||!currentUser)return null;
 const uid=String(currentUser.id),p1=String(row.player1_id||''),mineIsP1=uid===p1;
 const my=mineIsP1?!!row.player1_playing_confirmed:!!row.player2_playing_confirmed,other=mineIsP1?!!row.player2_playing_confirmed:!!row.player1_playing_confirmed,playing=!!row.players_playing;return {both_messaged:rankedVsBothMessaged,my_playing_confirmed:my,opponent_playing_confirmed:other,players_playing:playing};
}
async function refreshPlayerVsSafety(force=false){
 if(!currentRankedMatchId||!supabaseClient||!playerVsSafety)return;
 const local=safetyFromRealtimeRow(currentRankedMatchData);if(local)paintPlayerVsSafety(local);
 if(!force&&Date.now()-lastVsSafetyRpcAt<120000)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_player_action_status',{p_match_id:Number(currentRankedMatchId)});if(error)throw error;
  const st=Array.isArray(data)?data[0]:data;if(st){rankedVsBothMessaged=!!st.both_messaged;paintPlayerVsSafety(st);lastVsSafetyRpcAt=Date.now()}
 }catch(e){console.error('Seguridad VS:',e)}
}
async function cancelVsByPlayers(){
 if(!currentRankedMatchId||!supabaseClient)return;
 if(!confirm('¿ANULAR ESTE VS? Solo hazlo si todavía NO han comenzado a jugar.'))return;
 try{const {error}=await supabaseClient.rpc('player_cancel_ranked_match',{p_match_id:Number(currentRankedMatchId)});if(error)throw error;showToast('VS anulado.');await watchCurrentRankedMatch()}catch(e){console.error(e);showToast(String(e?.message||'').includes('MATCH_PLAYING_LOCKED')?'Este VS ya está jugando y no puede anularse.':'No se pudo anular el VS.')}
}
async function markVsPlaying(){
 if(!currentRankedMatchId||!supabaseClient)return;
 if(playerPlayingConfirmBox){playerPlayingConfirmBox.hidden=false;playerPlayingConfirmBox.style.display='flex'}
 return;
}
async function confirmVsPlayingYes(){
 if(!currentRankedMatchId||!supabaseClient)return;
 if(playerPlayingConfirmBox){playerPlayingConfirmBox.hidden=true;playerPlayingConfirmBox.style.display='none'}
 rankedPlayingLockedLocally=true;
 if(playerPlayingBtn){playerPlayingBtn.hidden=true;playerPlayingBtn.disabled=true;playerPlayingBtn.style.display='none'}
 if(playerCancelVsBtn){playerCancelVsBtn.hidden=true;playerCancelVsBtn.disabled=true;playerCancelVsBtn.style.display='none'}
 if(abandonRankedBtn){abandonRankedBtn.hidden=true;abandonRankedBtn.disabled=true;abandonRankedBtn.style.display='none'}
 try{
  const matchId=Number(currentRankedMatchId);
  const {error}=await supabaseClient.rpc('mark_ranked_match_playing',{p_match_id:matchId});if(error)throw error;
  /* The successful write is authoritative. Do not undo the UI just because a
     second read is slow on mobile. Realtime/watch will reconcile the full row. */
  currentRankedMatchData={...(currentRankedMatchData||{}),match_id:matchId,players_playing:true,admin_confirmed:true,players_playing_at:currentRankedMatchData?.players_playing_at||new Date().toISOString()};
  rankedVsBothMessaged=true;
  stopRankedChatResponseTimer();
  updateRankedResultReport(currentRankedMatchData);
  updateRankedVideoProof(currentRankedMatchData);
  paintPlayerVsSafety(safetyFromRealtimeRow(currentRankedMatchData));
  if(playerPlayingBtn){playerPlayingBtn.hidden=true;playerPlayingBtn.style.display='none'}
  if(playerCancelVsBtn){playerCancelVsBtn.hidden=true;playerCancelVsBtn.style.display='none'}
  if(rankedResultReport){rankedResultReport.hidden=false;rankedResultReport.style.display='block'}
  if(rankedClaimWon){rankedClaimWon.hidden=false;rankedClaimWon.style.display=''}
  if(rankedClaimLost){rankedClaimLost.hidden=false;rankedClaimLost.style.display=''}
  startRankedPlayTimer(currentRankedMatchData);
  showToast('🔒 VS EN JUEGO. Marca GANÉ o PERDÍ al terminar.');
  setTimeout(()=>rankedResultReport?.scrollIntoView({behavior:'smooth',block:'center'}),60);
 }catch(e){
  console.error(e);const msg=String(e?.message||'');
  rankedPlayingLockedLocally=false;
  if(playerPlayingBtn){playerPlayingBtn.disabled=false;playerPlayingBtn.hidden=false;playerPlayingBtn.style.display=''}
  if(playerCancelVsBtn){playerCancelVsBtn.disabled=false;playerCancelVsBtn.hidden=false;playerCancelVsBtn.style.display=''}
  msg.includes('CHAT_NOT_READY')?showToast('Ambos jugadores deben escribir en el chat antes de confirmar que ya están jugando.'):showToast('No se pudo marcar el VS como jugando.');
 }
}
playerCancelVsBtn?.addEventListener('click',cancelVsByPlayers);
playerPlayingBtn?.addEventListener('click',markVsPlaying);
playerPlayingYesBtn?.addEventListener('click',confirmVsPlayingYes);
playerPlayingNoBtn?.addEventListener('click',()=>{if(playerPlayingConfirmBox){playerPlayingConfirmBox.hidden=true;playerPlayingConfirmBox.style.display='none'}});


async function updatePendingMatchesCount(){
 if(!currentUser||!supabaseClient||!pendingMatchesCount)return;
 try{const {data,error}=await supabaseClient.rpc('get_pending_ranked_matches_count');if(error)throw error;const n=Number(data)||0;pendingMatchesCount.textContent=n+' '+(n===1?'PARTIDO PENDIENTE':'PARTIDOS PENDIENTES')}catch(e){console.error(e)}
}

function updateRankedResultReport(match){
 if(!rankedResultReport)return;
 const resultPhase=rankedVsBothMessaged||rankedPlayingLockedLocally||!!match?.players_playing;
 rankedResultReport.hidden=!resultPhase;rankedResultReport.style.display=resultPhase?'block':'none';
 if(resultPhase){
   if(playerCancelVsBtn){playerCancelVsBtn.hidden=true;playerCancelVsBtn.disabled=true;playerCancelVsBtn.style.display='none'}
   if(playerPlayingBtn){playerPlayingBtn.hidden=true;playerPlayingBtn.disabled=true;playerPlayingBtn.style.display='none'}
 }
 if(!resultPhase)return;
 const mine=String(match?.my_result_claim||'').toUpperCase(),other=String(match?.opponent_result_claim||'').toUpperCase();
 if(rankedNoTrickBtn){const hasMyResult=!!mine;rankedNoTrickBtn.hidden=hasMyResult;rankedNoTrickBtn.style.display=hasMyResult?'none':'block';rankedNoTrickBtn.disabled=hasMyResult}
 if(rankedClaimWon){rankedClaimWon.disabled=!!mine;rankedClaimWon.textContent=mine==='WON'?'✓ MARCASTE GANÉ':'🏆 GANÉ'}
 if(rankedClaimLost){rankedClaimLost.disabled=!!mine;rankedClaimLost.textContent=mine==='LOST'?'✓ MARCASTE PERDÍ':'PERDÍ'}
 if(match?.result_disputed&&mine==='WON'&&other==='WON'){
   rankedResultStatus.textContent='⚠️ AMBOS MARCARON GANÉ. Deben subir evidencia; el administrador definirá al ganador.';
   updateRankedVideoProof({...match,admin_confirmed:true});
 }else if(mine&&!other) rankedResultStatus.textContent='Resultado enviado. Esperando que tu rival indique su resultado.';
 else if(!mine&&other) rankedResultStatus.textContent='Tu rival ya indicó su resultado. Marca GANÉ o PERDÍ.';
 else rankedResultStatus.textContent='Esperando tu resultado.';
}
async function submitRankedResultClaim(claim){
 if(!currentRankedMatchId||!supabaseClient)return;
 const won=claim==='WON';
 if(!confirm(won?'¿Confirmas que GANASTE este partido? Marca GANÉ únicamente si realmente fuiste el ganador.':'¿Confirmas que PERDISTE este partido?'))return;
 stopRankedPlayTimer();
 if(rankedPlayTimer){rankedPlayTimer.hidden=true;rankedPlayTimer.style.display='none'}
 if(rankedClaimWon)rankedClaimWon.disabled=true;if(rankedClaimLost)rankedClaimLost.disabled=true;
 if(rankedNoTrickBtn){rankedNoTrickBtn.hidden=true;rankedNoTrickBtn.style.display='none';rankedNoTrickBtn.disabled=true}
 try{
  const {data,error}=await supabaseClient.rpc('submit_ranked_result_claim',{p_match_id:Number(currentRankedMatchId),p_claim:claim});if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(row?.resolved){rankedReviewTransitionPending=false;showToast(claim==='LOST'?'✅ Derrota confirmada. Tu rival ganó automáticamente.':'✅ Resultado confirmado. ELO aplicado automáticamente.');await stopActiveVsRealtime().catch(()=>{});currentRankedMatchId=null;currentRankedMatchData=null;rankedPlayingLockedLocally=false;stopRankedPlayTimer();stopRankedChatResponseTimer();if(rankedVsChatTimer){clearInterval(rankedVsChatTimer);rankedVsChatTimer=null}rankedVsChatMatchId=null;if(rankedVsChat)rankedVsChat.hidden=true;if(matchmakingModal){matchmakingModal.hidden=true;matchmakingModal.style.removeProperty('display')}await updateRankedDailyStatus();loadRanking().catch(()=>{});return}
  if(row?.disputed){showToast('⚠️ Ambos marcaron GANÉ. Suban evidencia para que el administrador decida.')}
  await watchCurrentRankedMatch();
 }catch(e){console.error(e);showToast('No se pudo registrar tu resultado.');if(rankedClaimWon)rankedClaimWon.disabled=false;if(rankedClaimLost)rankedClaimLost.disabled=false;if(rankedNoTrickBtn){rankedNoTrickBtn.hidden=false;rankedNoTrickBtn.style.display='block';rankedNoTrickBtn.disabled=false}}
}
rankedClaimWon?.addEventListener('click',()=>submitRankedResultClaim('WON'));
rankedClaimLost?.addEventListener('click',()=>submitRankedResultClaim('LOST'));
const rankedNoTrickBtn=document.getElementById('rankedNoTrickBtn');
rankedNoTrickBtn?.addEventListener('click',async()=>{
 if(!currentRankedMatchId||!supabaseClient)return;
 rankedNoTrickBtn.disabled=true;
 rankedReviewTransitionPending=true;
 showRankedReviewNotice();
 if(activeVsRealtimeRefreshTimer){clearTimeout(activeVsRealtimeRefreshTimer);activeVsRealtimeRefreshTimer=null}
 stopActiveVsRealtime().catch(()=>{});
 stopRankedPlayTimer();
 if(rankedPlayTimer){rankedPlayTimer.hidden=true;rankedPlayTimer.style.display='none'}
 try{
  const {data,error}=await supabaseClient.rpc('cancel_ranked_no_trick',{p_match_id:Number(currentRankedMatchId)});
  if(error)throw error;
  if(data===true){showToast('VS anulado: ambos confirmaron que nadie hizo trickshot con la 8.');showRankedReviewNotice();return}
  else{stopRankedChatResponseTimer();stopRankedPlayTimer();if(rankedChatResponseBox){rankedChatResponseBox.hidden=true;rankedChatResponseBox.style.display='none'}if(rankedResultReport){rankedResultReport.hidden=true;rankedResultReport.style.display='none'}if(rankedVideoProof){rankedVideoProof.hidden=true;rankedVideoProof.style.display='none'}if(matchmakingModal){matchmakingModal.hidden=false;matchmakingModal.style.display='flex'}showRankedReviewNotice();}
 }catch(e){console.error(e);rankedNoTrickBtn.disabled=false;showRankedReviewNotice();showToast('No se pudo confirmar el estado del VS. Pulsa OK para salir y vuelve a intentarlo si es necesario.')}
});

async function updateRankedVideoProof(match){
 if(!rankedVideoProof||!supabaseClient||!match?.match_id)return;
 if(rankedReviewTransitionPending){rankedVideoProof.hidden=false;if(rankedForgotRecordingBtn)rankedForgotRecordingBtn.hidden=true;if(rankedWinnerVideoStatus)rankedWinnerVideoStatus.textContent='✅ VIDEO ENVIADO · PARTIDO EN REVISIÓN.';if(rankedWinnerVideoBtn){rankedWinnerVideoBtn.textContent='🎥 VIDEO ENVIADO';rankedWinnerVideoBtn.disabled=true}return}
 if(!match.admin_confirmed&&!match.players_playing){rankedVideoProof.hidden=true;return}
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_result_wait_status',{p_match_id:Number(match.match_id)});if(error)throw error;
  const st=Array.isArray(data)?data[0]:data,mine=String(st?.my_claim||'').toUpperCase(),other=String(st?.opponent_claim||'').toUpperCase();
  if(mine!=='WON'||other==='LOST'){rankedVideoProof.hidden=true;if(rankedForgotRecordingBtn)rankedForgotRecordingBtn.hidden=true;return}
  rankedVideoProof.hidden=false;
  if(match.my_video_uploaded){
   if(rankedForgotRecordingBtn)rankedForgotRecordingBtn.hidden=true;
   if(rankedWinnerVideoStatus)rankedWinnerVideoStatus.textContent='✅ Evidencia enviada. Pendiente de revisión.';
   if(rankedWinnerVideoBtn){rankedWinnerVideoBtn.textContent='🎥 VIDEO ENVIADO';rankedWinnerVideoBtn.disabled=true}
   return;
  }
  if(rankedForgotRecordingBtn)rankedForgotRecordingBtn.hidden=false;
  if(rankedWinnerVideoStatus)rankedWinnerVideoStatus.textContent='⚠️ SUBE EL VIDEO QUE DEMUESTRE QUE GANASTE PARA QUE EL ADMINISTRADOR PUEDA REVISARLO.';
  if(rankedWinnerVideoBtn){rankedWinnerVideoBtn.textContent='🎥 SUBIR VIDEO DEL TIRO GANADOR';rankedWinnerVideoBtn.disabled=false}
 }catch(e){console.error('Estado evidencia VS:',e)}
}
rankedForgotRecordingBtn?.addEventListener('click',async()=>{
 if(!currentRankedMatchId||!supabaseClient)return;
 if(!confirm('¿SALIR PORQUE OLVIDASTE GRABAR? El VS pasará a REVISIÓN y tu rival podrá enviar su evidencia.'))return;
 rankedForgotRecordingBtn.disabled=true;
 try{
  const {data,error}=await supabaseClient.rpc('exit_ranked_forgot_recording',{p_match_id:Number(currentRankedMatchId)});
  if(error)throw error;
  if(data===true){showToast('VS enviado a revisión. Tu rival podrá enviar su evidencia.');if(rankedReviewNotice){rankedReviewNotice.hidden=false;rankedReviewNotice.style.display='flex'}return}
  throw new Error('No se pudo cerrar el VS');
 }catch(e){console.error(e);rankedForgotRecordingBtn.disabled=false;showToast('No se pudo salir del VS.')}
});

function getVideoExtension(file){
  const t=String(file?.type||'').toLowerCase(),n=String(file?.name||'').toLowerCase();
  const m=n.match(/\.([a-z0-9]{2,5})$/i),ext=m?.[1];
  if(['mp4','mov','m4v','webm','3gp','3g2','mkv','avi'].includes(ext))return ext;
  return t.includes('webm')?'webm':t.includes('quicktime')?'mov':t.includes('x-m4v')?'m4v':t.includes('3gpp')?'3gp':'mp4';
}
async function getVideoDuration(file){
  return await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const video=document.createElement('video');
    video.preload='metadata';
    video.onloadedmetadata=()=>{const d=Number(video.duration);URL.revokeObjectURL(url);resolve(d)};
    video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la duración del video.'))};
    video.src=url;
  });
}
async function uploadLargeRankedEvidence(file,path,onProgress){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session?.access_token)throw new Error('Tu sesión caducó. Inicia sesión nuevamente.');
 if(!window.tus?.Upload)throw new Error('No se pudo iniciar la subida de video grande. Actualiza la página e inténtalo otra vez.');
 return await new Promise((resolve,reject)=>{
  const upload=new window.tus.Upload(file,{endpoint:cloudConfig.url+'/storage/v1/upload/resumable',retryDelays:[0,1000,3000,5000,10000],headers:{authorization:'Bearer '+session.access_token,apikey:cloudConfig.key,'x-upsert':'false'},uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,metadata:{bucketName:'ranked-match-videos',objectName:path,contentType:file.type||'video/mp4',cacheControl:'3600'},chunkSize:6*1024*1024,onError:reject,onProgress:(sent,total)=>{if(onProgress)onProgress(sent,total)},onSuccess:()=>resolve(path)});
  upload.findPreviousUploads().then(prev=>{if(prev?.length)upload.resumeFromPreviousUpload(prev[0]);upload.start()}).catch(()=>upload.start());
 })
}
let rankedReviewTransitionPending=false;
async function uploadRankedWinnerVideo(){
  if(!currentUser||!supabaseClient||!currentRankedMatchId)return;
  const {data:permission,error:permissionError}=await supabaseClient.rpc('get_ranked_result_wait_status',{p_match_id:Number(currentRankedMatchId)});
  if(permissionError){showToast('No se pudo comprobar el estado del VS.');return}
  const permissionRow=Array.isArray(permission)?permission[0]:permission;
  if(!permissionRow?.evidence_required){showToast('No necesitas subir evidencia para este resultado.');return}
  const file=rankedWinnerVideoInput?.files?.[0];
  if(!file)return;
  try{
    rankedWinnerVideoBtn.disabled=true;
    rankedWinnerVideoStatus.textContent='Comprobando video...';
    if(!/^video\/(mp4|webm|quicktime|x-m4v)$/.test(String(file.type||'')))throw new Error('Formato no permitido. Usa MP4, WEBM o MOV.');
    if(file.size>500*1024*1024)throw new Error('El video no puede superar 500 MB.');
    const duration=await getVideoDuration(file);
    if(!Number.isFinite(duration)||duration>60.05)throw new Error('El video debe durar máximo 1 minuto.');
    if(duration<0.1)throw new Error('El video no es válido.');
    const ext=getVideoExtension(file);
    const path=String(currentRankedMatchId)+'/'+currentUser.id+'/winner-'+Date.now()+'.'+ext;
    rankedWinnerVideoStatus.textContent='Subiendo video...';
    if(file.size>45*1024*1024){
      await uploadLargeRankedEvidence(file,path,(sent,total)=>{const pct=total?Math.floor(sent*100/total):0;rankedWinnerVideoStatus.textContent='Subiendo video... '+pct+'%'});
    }else{
      const {error:uploadError}=await supabaseClient.storage.from('ranked-match-videos').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
      if(uploadError)throw uploadError;
    }
    rankedReviewTransitionPending=true;
    const {error:saveError}=await supabaseClient.rpc('save_ranked_match_video',{p_match_id:Number(currentRankedMatchId),p_video_path:path});if(saveError){rankedReviewTransitionPending=false;throw saveError;}
    rankedWinnerVideoStatus.textContent='✅ Video enviado correctamente. El administrador lo revisará.';
    rankedWinnerVideoBtn.textContent='🎥 VIDEO ENVIADO';
    rankedWinnerVideoBtn.disabled=true;
    if(rankedForgotRecordingBtn){rankedForgotRecordingBtn.hidden=true;rankedForgotRecordingBtn.style.display='none'}
    rankedWinnerVideoInput.value='';
    showToast('Video del tiro ganador enviado.');
    showRankedReviewNotice()
  }catch(e){
    console.error('Video del ganador:',e);
    rankedWinnerVideoStatus.textContent=e?.message||'No se pudo subir el video.';
    rankedWinnerVideoInput.value='';
  }finally{if(!rankedReviewTransitionPending)rankedWinnerVideoBtn.disabled=false}
}
async function finishRankedReviewNotice(){
 rankedReviewTransitionPending=false;
 const reviewNoticeNow=document.getElementById('rankedReviewNotice');if(reviewNoticeNow){reviewNoticeNow.hidden=true;reviewNoticeNow.style.setProperty('display','none','important')}
 clearInterval(matchmakingTimer);matchmakingTimer=null;clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=null;clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
 await stopActiveVsRealtime().catch(()=>{});
 await stopMatchmakingRealtime().catch(()=>{});
 currentRankedMatchId=null;currentRankedMatchData=null;rankedPlayingLockedLocally=false;
 if(matchmakingModal)matchmakingModal.hidden=true;
 await updateRankedDailyStatus().catch(()=>{});
 showToast('Puedes seguir jugando mientras se revisa el resultado.');
}
rankedReviewOkBtn?.addEventListener('click',finishRankedReviewNotice);

async function openAdminRankedVideo(matchId,uploaderId,name){
  if(!rankedVideoModal||!rankedVideoPlayer||!supabaseClient)return;
  try{
    rankedVideoStatus.textContent='Obteniendo video...';
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session?.access_token)throw new Error('La sesión del administrador ha caducado. Inicia sesión nuevamente.');
    const response=await fetch(cloudConfig.url+'/functions/v1/get-ranked-match-video',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':cloudConfig.key},
      body:JSON.stringify({match_id:Number(matchId),uploader_id:String(uploaderId)})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.ok)throw new Error(data?.error||'No se pudo cargar el video.');
    rankedVideoTitle.textContent='VIDEO DEL JUGADOR: '+String(name||'').toUpperCase();
    rankedVideoPlayer.pause();
    rankedVideoPlayer.removeAttribute('src');
    rankedVideoPlayer.load();
    rankedVideoPlayer.src=data.url;
    rankedVideoPlayer.load();
    rankedVideoModal.hidden=false;
    rankedVideoStatus.textContent='Video listo. Pulsa ▶ para reproducir.';
  }catch(e){
    console.error('Video ganador:',e);
    rankedVideoStatus.textContent=e?.message||'No se pudo cargar el video.';
    showToast(e?.message||'No se pudo cargar el video.');
  }
}
function closeAdminRankedVideo(){
 if(rankedVideoPlayer){rankedVideoPlayer.pause();rankedVideoPlayer.removeAttribute('src');rankedVideoPlayer.load()}
 if(rankedVideoModal)rankedVideoModal.hidden=true;
}


function stopRankedMatchCountdown(){
 if(rankedMatchCountdownTimer){clearInterval(rankedMatchCountdownTimer);rankedMatchCountdownTimer=null}
 if(rankedMatchCountdown)rankedMatchCountdown.hidden=true;
}
function updateRankedPlayerConfirm(match){
 if(!rankedPlayerConfirmBtn||!rankedPlayerConfirmStatus)return;
 if(match?.admin_confirmed){rankedPlayerConfirmBtn.disabled=true;rankedPlayerConfirmBtn.textContent='✓ PARTIDA CONFIRMADA';rankedPlayerConfirmStatus.textContent='El VS ya está confirmado.';return}
 const mine=!!match?.my_player_confirmed,other=!!match?.opponent_player_confirmed;
 rankedPlayerConfirmBtn.disabled=mine;
 rankedPlayerConfirmBtn.textContent=mine?'✓ CONFIRMADO':'✓ CONFIRMAR PARTIDA';
 rankedPlayerConfirmStatus.textContent=mine?(other?'Ambos confirmaron. Iniciando VS...':'Esperando confirmación del rival...'):(other?'Tu rival ya confirmó. Confirma para iniciar inmediatamente.':'Si ambos confirman, el VS inicia inmediatamente.');
}
async function confirmRankedMatchPlayer(){
 if(!currentRankedMatchId||!supabaseClient||!rankedPlayerConfirmBtn)return;
 rankedPlayerConfirmBtn.disabled=true;
 try{
  const {data,error}=await supabaseClient.rpc('confirm_ranked_match_player',{p_match_id:currentRankedMatchId});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(row?.admin_confirmed){stopRankedMatchCountdown();showToast('⚔️ AMBOS CONFIRMARON · PARTIDA INICIADA');await watchCurrentRankedMatch()}
  else{rankedPlayerConfirmBtn.textContent='✓ CONFIRMADO';rankedPlayerConfirmStatus.textContent='Esperando confirmación del rival...'}
 }catch(e){console.error(e);rankedPlayerConfirmBtn.disabled=false;showToast('No se pudo confirmar la partida.')}
}
rankedPlayerConfirmBtn?.addEventListener('click',confirmRankedMatchPlayer);
function startRankedMatchCountdown(match){
 stopRankedMatchCountdown();
 if(!match?.match_id||match.admin_confirmed)return;
 const startedAt=match.created_at?new Date(match.created_at).getTime():Date.now();
 const tick=async()=>{
   const remaining=Math.max(0,15000-(Date.now()-startedAt));
   const sec=Math.ceil(remaining/1000);
   if(rankedMatchCountdown)rankedMatchCountdown.hidden=remaining<=0;
   if(rankedMatchCountdownValue)rankedMatchCountdownValue.textContent=String(sec);
   if(remaining<=0){
     stopRankedMatchCountdown();
     if(supabaseClient&&currentRankedMatchId){
       try{
         const {data,error}=await supabaseClient.rpc('auto_confirm_ranked_match',{p_match_id:currentRankedMatchId});
         if(error)throw error;
         if(data){showToast('⚔️ ENFRENTAMIENTO CONFIRMADO AUTOMÁTICAMENTE');watchCurrentRankedMatch()}
       }catch(e){console.error('Auto confirm:',e)}
     }
   }
 };
 tick();
 rankedMatchCountdownTimer=setInterval(tick,250);
}
function stopRankedPlayTimer(){
 if(rankedPlayTimerInterval){clearInterval(rankedPlayTimerInterval);rankedPlayTimerInterval=null}
 rankedPlayTimerMatchId=null;
 if(rankedPlayTimer)rankedPlayTimer.hidden=true;
}
function startRankedPlayTimer(match){
 // Las partidas no tienen límite de tiempo. Nunca se anulan por duración.
 stopRankedPlayTimer();
 return;
}
function ensureRankedChatResponseWarning(){
 if(!rankedVsChat)return null;
 let box=document.getElementById('rankedChatResponseWarning');
 if(!box){
  box=document.createElement('div');box.id='rankedChatResponseWarning';box.className='ranked-chat-response-warning';box.hidden=true;
  box.innerHTML='<strong>⚠️ RESPONDE EN EL CHAT</strong><span id="rankedChatResponseValue">01:00</span><p>Escribe un mensaje antes de que termine el tiempo o el VS será anulado.</p>';
  rankedVsChat.insertBefore(box,rankedVsChat.firstChild);
 }
 return box;
}
function stopRankedChatResponseTimer(){
 if(rankedChatResponseTimer){clearInterval(rankedChatResponseTimer);rankedChatResponseTimer=null} if(rankedChatResponseSyncTimer){clearInterval(rankedChatResponseSyncTimer);rankedChatResponseSyncTimer=null} rankedChatResponseExpiresAt=0;
 const box=document.getElementById('rankedChatResponseWarning');if(box)box.hidden=true;
 rankedChatResponseExpiring=false;
}
async function updateRankedChatResponseCountdown(matchId){
 if(!supabaseClient||!matchId||rankedChatStatusLoading)return;
 rankedChatStatusLoading=true;
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_chat_response_status',{p_match_id:Number(matchId)});if(error)throw error;
  const st=Array.isArray(data)?data[0]:data,box=ensureRankedChatResponseWarning(),value=document.getElementById('rankedChatResponseValue');
  if(!st){if(box){box.hidden=false;box.classList.remove('waiting-on-me');const title=box.querySelector('strong'),p=box.querySelector('p');if(title)title.textContent='⏱️ TIEMPO DE RESPUESTA';if(p)p.textContent='Tienen 1 minuto desde que se arma el VS para enviar sus mensajes.'}if(value)value.textContent='01:00';return}
  if(st.replied){rankedVsBothMessaged=true;stopRankedChatResponseTimer();const local=safetyFromRealtimeRow(currentRankedMatchData);if(local)paintPlayerVsSafety({...local,both_messaged:true});return}
  rankedChatResponseExpiresAt=st.expires_at?new Date(st.expires_at).getTime():(Date.now()+Math.max(0,Number(st.seconds_left)||0)*1000); const left=Math.max(0,Number(st.seconds_left)||0);
  if(box){box.hidden=false;box.classList.toggle('waiting-on-me',!!st.waiting_for_me);const title=box.querySelector('strong'),p=box.querySelector('p');if(title)title.textContent=st.waiting_for_me?'⚠️ RESPONDE EN EL CHAT':'⏱️ ESPERANDO RESPUESTA';if(p)p.textContent=st.waiting_for_me?'Tienes 1 minuto para responder o el VS será anulado.':'Tu rival tiene 1 minuto para responder.'}
  if(value)value.textContent='00:'+String(left).padStart(2,'0');
  if(left<=0&&!rankedChatResponseExpiring){
   rankedChatResponseExpiring=true;
   const {data:result,error:expireError}=await supabaseClient.rpc('auto_cancel_unanswered_ranked_chat',{p_match_id:Number(matchId)});
   if(expireError)throw expireError;
   if(result==='cancelled'){
    stopRankedChatResponseTimer();
    clearInterval(matchmakingTimer);matchmakingTimer=null;
    clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=null;
    clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
    await stopActiveVsRealtime().catch(()=>{});
    currentRankedMatchId=null;currentRankedMatchData=null;rankedVsChatMatchId=null;rankedVsBothMessaged=false;rankedPlayingLockedLocally=false;
    if(matchmakingVersus){matchmakingVersus.hidden=true;matchmakingVersus.style.display='none'}
    if(matchmakingSearching){matchmakingSearching.hidden=true;matchmakingSearching.style.display='none'}
    if(matchmakingModal)matchmakingModal.hidden=true;
    showToast('⏱️ No enviaron ambos mensajes a tiempo. El VS fue anulado sin afectar el ELO.');
    await updateRankedDailyStatus().catch(()=>{});
   } else rankedChatResponseExpiring=false;
  }
 }catch(e){console.error('Contador respuesta chat VS:',e);rankedChatResponseExpiring=false}finally{rankedChatStatusLoading=false}
}
function startRankedChatResponseTimer(matchId){
 if(rankedChatResponseTimer)clearInterval(rankedChatResponseTimer);
 if(rankedChatResponseSyncTimer)clearInterval(rankedChatResponseSyncTimer);
 updateRankedChatResponseCountdown(matchId);
 rankedChatResponseTimer=setInterval(()=>{
  if(document.hidden||!rankedChatResponseExpiresAt)return;
  const box=ensureRankedChatResponseWarning(),value=document.getElementById('rankedChatResponseValue');
  const left=Math.max(0,Math.ceil((rankedChatResponseExpiresAt-Date.now())/1000));
  if(box)box.hidden=false;
  if(value)value.textContent='00:'+String(left).padStart(2,'0');
  if(left<=0&&!rankedChatResponseExpiring)updateRankedChatResponseCountdown(matchId);
 },1000);
 rankedChatResponseSyncTimer=setInterval(()=>{if(!document.hidden)updateRankedChatResponseCountdown(matchId)},10000);
}
async function loadRankedVsChat(matchId){
 if(!supabaseClient||!matchId||!rankedVsChatMessages||rankedVsChatLoading)return;
 rankedVsChatLoading=true;
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_match_chat',{p_match_id:Number(matchId)});
  if(error)throw error;
  const hasUnreadIncoming=Array.isArray(data)&&data.some(m=>m.sender_id!==currentUser?.id&&!m.is_admin&&!m.read_by_other);
  const participantSenders=new Set((Array.isArray(data)?data:[]).filter(m=>!m.is_admin&&m.sender_id).map(m=>String(m.sender_id)));rankedVsBothMessaged=participantSenders.size>=2;if(rankedVsBothMessaged){stopRankedChatResponseTimer();updateRankedResultReport(currentRankedMatchData)}const localSafety=safetyFromRealtimeRow(currentRankedMatchData);if(localSafety)paintPlayerVsSafety(localSafety);
  if(hasUnreadIncoming){try{await supabaseClient.rpc('mark_ranked_match_chat_read',{p_match_id:Number(matchId)})}catch(_){}}
  rankedVsChatMessages.replaceChildren();
  if(!data?.length){const e=document.createElement('div');e.className='ranked-vs-chat-empty';e.textContent='Todavía no hay mensajes. Escribe para coordinar el partido.';rankedVsChatMessages.appendChild(e);return}
  for(const m of data){
   const d=document.createElement('div');d.className='ranked-vs-chat-msg'+(m.sender_id===currentUser?.id?' mine':'')+(m.is_admin?' admin':'');
   const n=document.createElement('b');n.textContent=(m.is_admin?'ADMIN · ':'')+String(m.sender_name||'Jugador');
   const body=document.createElement('div');body.textContent=m.message;
   const tm=document.createElement('small');tm.textContent=new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
   const seen=document.createElement('small');seen.className='chat-seen';seen.textContent=m.read_by_other?'✓✓ LEÍDO':'✓ ENVIADO';d.append(n,body,tm);if(m.sender_id===currentUser?.id||m.is_admin)d.append(seen);rankedVsChatMessages.appendChild(d);
  }
  rankedVsChatMessages.scrollTop=rankedVsChatMessages.scrollHeight;
 }catch(e){console.error('Chat VS:',e)}finally{rankedVsChatLoading=false}
}
function startRankedVsChat(match){
 const id=Number(match?.match_id||currentRankedMatchId||0);
 const active=id>0;
 if(rankedVsChat){
   rankedVsChat.hidden=!active;
   if(active){rankedVsChat.removeAttribute('hidden');rankedVsChat.style.display='block'}
   else rankedVsChat.style.removeProperty('display');
 }
 if(!active){if(rankedVsChatTimer)clearInterval(rankedVsChatTimer);rankedVsChatTimer=null;rankedVsChatMatchId=null;return}
 if(rankedVsChatMatchId===id&&rankedVsChatTimer)return;
 if(rankedVsChatTimer)clearInterval(rankedVsChatTimer);
 rankedVsChatMatchId=id;
 loadRankedVsChat(id);
 startRankedChatResponseTimer(id);
 rankedVsChatTimer=setInterval(()=>{if(!document.hidden){loadRankedVsChat(id);updateRankedChatResponseCountdown(id)}},60000);
}
async function sendRankedVsChat(){
 const message=String(rankedVsChatInput?.value||'').trim();
 if(!message||!currentUser||!supabaseClient||rankedVsChatSending)return;
 rankedVsChatSending=true;
 if(!rankedVsChatMatchId){
   try{const {data,error}=await supabaseClient.rpc('get_my_active_ranked_match');if(error)throw error;const m=Array.isArray(data)?data[0]:data;if(m?.match_id){currentRankedMatchId=m.match_id;rankedVsChatMatchId=Number(m.match_id)}}catch(e){console.error('Recuperar VS para chat:',e)}
 }
 if(!rankedVsChatMatchId){showToast('No se encontró el VS activo.');return}
 rankedVsChatSend.disabled=true;
 try{
  const {error}=await supabaseClient.rpc('send_ranked_match_chat',{p_match_id:Number(rankedVsChatMatchId),p_message:message});
  if(error)throw error;
  rankedVsChatInput.value='';
  rankedVsChatInput.blur();
  await loadRankedVsChat(rankedVsChatMatchId);
  await updateRankedChatResponseCountdown(rankedVsChatMatchId);
 }catch(e){console.error('Enviar chat VS:',e);if(String(e?.message||'').includes('VS_CHAT_RESPONSE_TIMEOUT')){showToast('⏱️ El minuto terminó. El VS fue anulado.');await watchCurrentRankedMatch()}else showToast('No se pudo enviar el mensaje. Intenta nuevamente.')}finally{rankedVsChatSending=false;rankedVsChatSend.disabled=false}
}
rankedVsChatSend?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();sendRankedVsChat()});

rankedVsChatInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendRankedVsChat()}});
function showRankedMatch(match){currentRankedMatchData=match;rankedVsBothMessaged=false;lastVsSafetyRpcAt=0;rankedPlayingLockedLocally=!!match?.players_playing;
 if(!matchmakingModal||!matchmakingSearching||!matchmakingVersus)return;
 matchmakingModal.hidden=false;
 rankedSearchActive=false;syncRankedSearchPresence(false);stopRankedSearchLoop();
 currentRankedMatchId=match.match_id;
 startActiveVsRealtime(currentRankedMatchId);
 matchmakingSearching.hidden=true;matchmakingSearching.style.display='none';
 matchmakingVersus.hidden=false;matchmakingVersus.style.removeProperty('display');
 /* The VS chat must be visible immediately on every device as soon as a match exists. */
 startRankedVsChat(match);
 versusMe.textContent=String(currentProfile?.account_name||currentProfile?.username||'TÚ').toUpperCase();
 const myGameId=String(match.my_game_id??'').trim();
 const opponentGameId=String(match.opponent_game_id??'').trim();
 if(versusMyGameId)versusMyGameId.textContent=myGameId||'NO REGISTRADO';
 if(versusOpponentGameId)versusOpponentGameId.textContent=opponentGameId||'NO REGISTRADO';
 if(copyMyGameId)copyMyGameId.dataset.gameId=myGameId;
 if(copyOpponentGameId)copyOpponentGameId.dataset.gameId=opponentGameId;
 versusMyElo.textContent='ELO '+String(match.my_elo||200);
 versusOpponent.textContent=String(match.opponent_name||'RIVAL').toUpperCase();
 versusOpponentElo.textContent='ELO '+String(match.opponent_elo||200);
 if(versusMyRank)versusMyRank.textContent=String(match.my_rank_name||getRankByElo(match.my_elo).name).toUpperCase();
 if(versusOpponentRank)versusOpponentRank.textContent=String(match.opponent_rank_name||getRankByElo(match.opponent_elo).name).toUpperCase();
 const myVsRank=getRankByElo(match.my_elo??0),opponentVsRank=getRankByElo(match.opponent_elo??0);if(versusMyRankBadge)renderRankBadgeOn(versusMyRankBadge,myVsRank);if(versusOpponentRankBadge)renderRankBadgeOn(versusOpponentRankBadge,opponentVsRank);
 if(versusMyPosition)versusMyPosition.textContent='RANKING #'+String(match.my_position||'--');
 if(versusOpponentPosition)versusOpponentPosition.textContent='RANKING #'+String(match.opponent_position||'--');
 const setVsAvatar=(el,path,name)=>{if(!el)return;el.replaceChildren();if(path){const {data}=supabaseClient.storage.from('profile-photos').getPublicUrl(path);if(data?.publicUrl){const img=document.createElement('img');img.src=data.publicUrl;img.alt=name;el.appendChild(img);return}}const s=document.createElement('span');s.textContent=String(name||'?').charAt(0).toUpperCase();el.appendChild(s)};
 setVsAvatar(versusMyAvatar,match.my_avatar_path,currentProfile?.account_name||currentProfile?.username||'TÚ');
 setVsAvatar(versusOpponentAvatar,match.opponent_avatar_path,match.opponent_name);
 stopRankedMatchCountdown();if(rankedMatchCountdown){rankedMatchCountdown.hidden=true;rankedMatchCountdown.style.display='none'}if(match.admin_confirmed)startRankedPlayTimer(match);else stopRankedPlayTimer();if(confirmedMatchWarning)confirmedMatchWarning.hidden=!match.admin_confirmed;if(rankedMatchRules)rankedMatchRules.hidden=!match.admin_confirmed;startRankedVsChat(match);updateRankedResultReport(match);updateRankedVideoProof(match);if(abandonRankedBtn){const canAbandon=!confirmed&&!rankedPlayingLockedLocally;abandonRankedBtn.hidden=!canAbandon;abandonRankedBtn.style.display=canAbandon?'block':'none';abandonRankedBtn.disabled=!canAbandon;abandonRankedBtn.textContent='ABANDONAR VS'}refreshPlayerVsSafety();if(matchmakingClose){matchmakingClose.hidden=!!match.admin_confirmed;matchmakingClose.disabled=!!match.admin_confirmed}
 updatePendingMatchesCount();
 clearInterval(pendingMatchesTimer);pendingMatchesTimer=setInterval(()=>{if(!document.hidden){updatePendingMatchesCount();watchCurrentRankedMatch()}},60000);
}
function showRankedReviewNotice(){
 let notice=document.getElementById('rankedReviewNotice');
 if(!notice){
  notice=document.createElement('div');
  notice.id='rankedReviewNotice';
  notice.innerHTML='<div style="width:min(92vw,620px);background:#07131d;border:2px solid #21d35b;border-radius:18px;padding:28px 22px;text-align:center;box-shadow:0 0 35px rgba(0,0,0,.8)"><strong style="display:block;color:#fff;font-size:clamp(22px,3vw,34px);line-height:1.15;margin-bottom:18px">ESTE PARTIDO SE ESTÁ REVISANDO</strong><p style="color:#fff;font-size:clamp(15px,1.7vw,20px);font-weight:700;line-height:1.45;margin:0 0 24px">PUEDES SEGUIR JUGANDO MIENTRAS SE TOMA UNA DECISIÓN. LOS RESULTADOS SE REFLEJARÁN EN TUS PUNTOS CUANDO SE TERMINE DE REVISAR.</p><button type="button" id="rankedReviewOkBtn" style="width:100%;max-width:300px;background:#13b94f;color:#fff;border:0;border-radius:12px;padding:15px;font-size:20px;font-weight:900;cursor:pointer">OK</button></div>';
  document.body.appendChild(notice);
  document.getElementById('rankedReviewOkBtn')?.addEventListener('click',finishRankedReviewNotice);
 }
 notice.hidden=false;notice.removeAttribute('hidden');
 notice.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,.92)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;visibility:visible!important;opacity:1!important;';
 document.body.appendChild(notice);
 void notice.offsetHeight;
 notice.style.setProperty('display','flex','important');
 notice.style.setProperty('visibility','visible','important');
 notice.style.setProperty('opacity','1','important');
}


async function watchCurrentRankedMatch(){
 if(!currentRankedMatchId||!supabaseClient||activeRankedMatchLoading)return;
 activeRankedMatchLoading=true;
 try{
  const {data,error}=await supabaseClient.rpc('get_my_active_ranked_match');if(error)throw error;
  if(data&&data.length&&Number(data[0].match_id)===Number(currentRankedMatchId)){currentRankedMatchData=data[0];if(String(data[0].status||'').toLowerCase()==='review'&&data[0].my_video_uploaded){rankedReviewTransitionPending=true;showRankedReviewNotice()}if(data[0].players_playing)rankedPlayingLockedLocally=true;const confirmed=!!data[0].admin_confirmed;stopRankedMatchCountdown();if(rankedMatchCountdown){rankedMatchCountdown.hidden=true;rankedMatchCountdown.style.display='none'}if(confirmed)startRankedPlayTimer(data[0]);else stopRankedPlayTimer();updateRankedResultReport(data[0]);updateRankedVideoProof(data[0]);if(confirmedMatchWarning)confirmedMatchWarning.hidden=!confirmed;if(rankedMatchRules)rankedMatchRules.hidden=!confirmed;startRankedVsChat(data[0]);if(abandonRankedBtn){const locked=rankedPlayingLockedLocally||!!data[0].players_playing;abandonRankedBtn.hidden=locked;abandonRankedBtn.style.display=locked?'none':'block';abandonRankedBtn.disabled=locked;abandonRankedBtn.textContent='ABANDONAR VS'}refreshPlayerVsSafety();if(matchmakingClose){matchmakingClose.hidden=confirmed;matchmakingClose.disabled=confirmed}}
  if(!data||!data.length||Number(data[0].match_id)!==Number(currentRankedMatchId)){
   if(rankedReviewTransitionPending){showRankedReviewNotice();return}
   await stopActiveVsRealtime();currentRankedMatchId=null;clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
   stopRankedPlayTimer();
   stopRankedChatResponseTimer();
   if(rankedVsChatTimer){clearInterval(rankedVsChatTimer);rankedVsChatTimer=null}rankedVsChatMatchId=null;
   if(rankedVsChat)rankedVsChat.hidden=true;
   if(matchmakingModal)matchmakingModal.hidden=true;if(matchmakingSearching)matchmakingSearching.hidden=false;if(matchmakingVersus)matchmakingVersus.hidden=true;
   showToast('VS finalizado o anulado. Toca JUGAR cuando quieras buscar otro rival.');
   await updateRankedDailyStatus();return;
  }
 }catch(e){console.error(e)}finally{activeRankedMatchLoading=false}
}

let matchmakingRealtimeChannel=null;
let activeVsRealtimeChannel=null;
let activeVsRealtimeMatchId=null;
let activeVsRealtimeRefreshTimer=null;
async function stopActiveVsRealtime(){
 if(activeVsRealtimeRefreshTimer){clearTimeout(activeVsRealtimeRefreshTimer);activeVsRealtimeRefreshTimer=null}
 if(activeVsRealtimeChannel&&supabaseClient){try{await supabaseClient.removeChannel(activeVsRealtimeChannel)}catch(e){console.error('Realtime VS stop:',e)}}
 activeVsRealtimeChannel=null;activeVsRealtimeMatchId=null;
}
function queueActiveVsRealtimeRefresh(kind){
 if(activeVsRealtimeRefreshTimer)return;
 activeVsRealtimeRefreshTimer=setTimeout(async()=>{
  activeVsRealtimeRefreshTimer=null;
  if(document.hidden||!currentRankedMatchId)return;
  if(kind==='chat'){await loadRankedVsChat(currentRankedMatchId);await updateRankedChatResponseCountdown(currentRankedMatchId);}
  else{await watchCurrentRankedMatch();}
 },120);
}
function startActiveVsRealtime(matchId){
 const id=Number(matchId||0);if(!id||!supabaseClient)return;
 if(activeVsRealtimeChannel&&activeVsRealtimeMatchId===id)return;
 stopActiveVsRealtime().catch(()=>{});
 activeVsRealtimeMatchId=id;
 activeVsRealtimeChannel=supabaseClient.channel('active-vs-'+id+'-'+String(currentUser?.id||'guest'))
  .on('postgres_changes',{event:'*',schema:'public',table:'ranked_matches',filter:'id=eq.'+id},payload=>{if(payload?.new){currentRankedMatchData={...(currentRankedMatchData||{}),...payload.new};if(String(payload.new.status||'').toLowerCase()==='finished'){rankedReviewTransitionPending=false}if(payload.new.players_playing)rankedPlayingLockedLocally=true;const st=safetyFromRealtimeRow(payload.new);if(st)paintPlayerVsSafety(st);if(payload.new.players_playing||payload.new.admin_confirmed){updateRankedResultReport(currentRankedMatchData);updateRankedVideoProof(currentRankedMatchData);if(rankedResultReport){rankedResultReport.hidden=false;rankedResultReport.style.display='block'}if(confirmedMatchWarning)confirmedMatchWarning.hidden=false;if(rankedMatchRules)rankedMatchRules.hidden=false;startRankedPlayTimer(currentRankedMatchData)}}queueActiveVsRealtimeRefresh('match');refreshPlayersPlayingCount().catch(()=>{})})
  .on('postgres_changes',{event:'*',schema:'public',table:'ranked_match_messages',filter:'match_id=eq.'+id},()=>queueActiveVsRealtimeRefresh('chat'))
  .subscribe();
}

async function stopMatchmakingRealtime(){
 if(matchmakingRealtimeChannel&&supabaseClient){
  try{await supabaseClient.removeChannel(matchmakingRealtimeChannel)}catch(e){console.error('Realtime matchmaking stop:',e)}
 }
 matchmakingRealtimeChannel=null;
}
/* MATCHMAKING REMOVED COMPLETELY — rebuilding from zero. */
function stopRankedSearchLoop(){rankedSearchLoopToken++}

function closeEloDailyLimit(){if(eloDailyCountdownTimer){clearInterval(eloDailyCountdownTimer);eloDailyCountdownTimer=null}if(eloDailyLimitModal)eloDailyLimitModal.hidden=true}
function formatEloCountdown(){
 if(!eloDailyResetAt)return;
 const ms=Math.max(0,new Date(eloDailyResetAt).getTime()-Date.now());
 const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
 if(eloDailyCountdown)eloDailyCountdown.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
 if(ms<=0){closeEloDailyLimit();updateRankedDailyStatus().catch(()=>{})}
}
function showEloDailyLimit(resetAt){
 eloDailyResetAt=resetAt||new Date(Date.now()+86400000).toISOString();
 if(eloDailyLimitModal)eloDailyLimitModal.hidden=false;
 formatEloCountdown();
 if(eloDailyCountdownTimer)clearInterval(eloDailyCountdownTimer);
 eloDailyCountdownTimer=setInterval(formatEloCountdown,1000);
}
async function updateRankedDailyStatus(){
 if(dashboardPlayBtn){
  dashboardPlayBtn.classList.remove('elo-daily-limited');
  dashboardPlayBtn.textContent='JUGAR';
  dashboardPlayBtn.setAttribute('aria-label','Jugar por ELO');
  try{
   if(currentUser&&supabaseClient){
    const {data:pendingId,error}=await supabaseClient.rpc('get_my_pending_ranked_room');
    if(!error&&Number(pendingId)>0){
     dashboardPlayBtn.textContent='REGRESAR A LA SALA';
     dashboardPlayBtn.setAttribute('aria-label','Regresar a la sala del VS pendiente');
    }
   }
  }catch(e){console.error('Comprobar sala pendiente:',e)}
 }
 closeEloDailyLimit();
 return {games_today:0,games_remaining:null,reset_at:null};
}

function hasDirectMatchmakingRequest(){
  try{return new URLSearchParams(window.location.search).get('mode')==='ranking-matchmaking'||sessionStorage.getItem('ranking_direct_matchmaking')==='1'}catch(e){return false}
}
function consumeDirectMatchmakingUrl(){
  try{
    const url=new URL(window.location.href);
    if(url.searchParams.get('mode')==='ranking-matchmaking'){
      url.searchParams.delete('mode');
      history.replaceState(null,'',url.pathname+(url.search?url.search:'')+(url.hash||''));
    }
  }catch(e){}
}
function maybeOpenDirectMatchmaking(){
  if(!hasDirectMatchmakingRequest())return;
  consumeDirectMatchmakingUrl();
  if(!currentUser){
    try{sessionStorage.setItem('ranking_direct_matchmaking','1')}catch(e){}
    if(loginModal){
      loginError.textContent='';
      openModal(loginModal,loginUsername);
    }
    return;
  }
  try{sessionStorage.removeItem('ranking_direct_matchmaking')}catch(e){}
  showToast('Emparejamiento temporalmente desactivado.');
}

async function renderSearchingPlayerProfile(){const n=document.getElementById('searchingPlayerName'),e=document.getElementById('searchingPlayerElo'),r=document.getElementById('searchingPlayerRank'),av=document.getElementById('searchingPlayerAvatar');if(!n||!currentProfile)return;const name=String(currentProfile.account_name||currentProfile.username||'JUGADOR').toUpperCase();const elo=Number(currentProfile.elo_points)||0;n.textContent=name;if(e)e.textContent='ELO '+elo;if(r)r.textContent=getRankByElo(elo).name.toUpperCase();if(av){av.replaceChildren();const f=document.createElement('span');f.textContent=name.charAt(0)||'J';av.appendChild(f);if(currentProfile.avatar_path&&supabaseClient){try{const url=await getCachedAvatarUrl(currentProfile.avatar_path);if(url){const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=url;img.alt='Foto de '+name;img.onload=()=>av.replaceChildren(img)}}catch(x){}}}}


async function renderLiveSearchingPlayers(){
 const box=document.getElementById('liveSearchingPlayers');if(!box||!supabaseClient)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_searching_players_v2');if(error)throw error;
  const rows=Array.isArray(data)?data:[];box.replaceChildren();box.hidden=!rows.length;
  if(!rows.length)return;
  box.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 10px;margin:5px 0;border-radius:14px;background:rgba(8,22,34,.78);border:1px solid rgba(255,255,255,.08);overflow-x:auto';
  const avatars=document.createElement('div');avatars.style.cssText='display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:nowrap';
  for(const p of rows){
   const av=document.createElement('div');av.style.cssText='width:38px;height:38px;min-width:38px;border-radius:50%;overflow:hidden;background:#172a3a;display:grid;place-items:center;font-weight:900;flex:0 0 38px';
   if(p.avatar_path){const raw=String(p.avatar_path);const clean=raw.replace(/^profile-photos\//,'').replace(/^\/+/, '');const src=/^https?:\/\//i.test(raw)?raw:supabaseClient.storage.from('profile-photos').getPublicUrl(clean).data?.publicUrl;if(src){const img=document.createElement('img');img.src=src;img.alt='';img.style.cssText='width:100%;height:100%;object-fit:cover';img.onerror=()=>{av.textContent=String(p.player_name||'?').charAt(0).toUpperCase()};av.appendChild(img)}}else av.textContent=String(p.player_name||'?').charAt(0).toUpperCase();
   avatars.appendChild(av);
  }
  const txt=document.createElement('span');txt.textContent='Buscando...';txt.style.cssText='font-weight:800;color:#fff;white-space:nowrap;flex:0 0 auto';
  box.append(avatars,txt);
 }catch(e){console.error('Lista buscando:',e)}
}
// Sin sondeo global: la barra Buscando se actualiza solo cuando cambia la cola.
// Sin llamada automática al cargar/actualizar la página.
async function refreshPlayersSearchingCount(){
 if(!supabaseClient||!playersSearchingCount||playersSearchingLoading)return;
 playersSearchingLoading=true;
 try{const {data,error}=await supabaseClient.rpc('get_ranked_searching_count_v2');if(error)throw error;const n=Math.max(0,Number(data)||0);playersSearchingCount.textContent=String(n)+' BUSCANDO RIVAL'}catch(e){console.error('Buscando rival v2:',e)}finally{playersSearchingLoading=false}
}
async function syncRankedSearchPresence(active){
 if(!supabaseClient||!currentUser)return;
 try{await supabaseClient.rpc('set_ranked_search_presence',{p_searching:!!active});if(active){renderLiveSearchingPlayers().catch(()=>{});refreshPlayersSearchingCount().catch(()=>{})}}catch(e){console.error('Presencia búsqueda:',e)}
}
setInterval(()=>{if(!document.hidden&&currentUser&&rankedSearchActive)syncRankedSearchPresence(true)},60000);
// El conteo se refresca por eventos de entrada/salida, no al recargar.
async function startRankedMatchmaking(){
 if(!currentUser||!supabaseClient||matchmakingStartLoading)return;
 matchmakingStartLoading=true;
 const modal=document.getElementById('freshMatchmakingModal'),search=document.getElementById('freshSearching'),vs=document.getElementById('freshVersus');
 if(!modal||!search||!vs){matchmakingStartLoading=false;return}
 modal.hidden=false;search.hidden=false;vs.hidden=true;rankedSearchActive=true;syncRankedSearchPresence(true);
 const token=++rankedSearchLoopToken;
 matchmakingStartLoading=false;
 while(rankedSearchActive&&token===rankedSearchLoopToken){
  try{
   const {data,error}=await supabaseClient.rpc('find_ranked_opponent');if(error)throw error;
   const st=Array.isArray(data)?data[0]:data;
   if(st?.state==='matched'&&st?.out_match_id){
    if(!rankedSearchActive||token!==rankedSearchLoopToken){
     await Promise.allSettled([supabaseClient.rpc('set_ranked_search_presence',{p_searching:false}),supabaseClient.rpc('matchmaking_v2_cancel')]);
     return;
    }
    const {data:room,error:roomError}=await supabaseClient.rpc('get_fresh_ranked_room',{p_match_id:Number(st.out_match_id)});if(roomError)throw roomError;
    const m=Array.isArray(room)?room[0]:room;if(!m)throw new Error('ROOM_NOT_READY');
    currentRankedMatchId=Number(m.match_id);rankedSearchActive=false;syncRankedSearchPresence(false);
    document.getElementById('freshMe').textContent=String(m.my_name||'TÚ').toUpperCase();
    document.getElementById('freshOpponent').textContent=String(m.opponent_name||'RIVAL').toUpperCase();
    document.getElementById('freshMyElo').textContent='ELO '+m.my_elo;
    document.getElementById('freshOpponentElo').textContent='ELO '+m.opponent_elo;const ms=document.getElementById('freshMyStreak'),os=document.getElementById('freshOpponentStreak');if(ms){ms.textContent='🔥 RACHA +'+Number(m.my_streak||0);ms.hidden=Number(m.my_streak||0)<=0}if(os){os.textContent='🔥 RACHA +'+Number(m.opponent_streak||0);os.hidden=Number(m.opponent_streak||0)<=0}
    document.getElementById('freshMyId').textContent='ID: '+(m.my_game_id||'NO REGISTRADO');
    document.getElementById('freshOpponentId').textContent=(m.opponent_game_id||'NO REGISTRADO');
    document.getElementById('freshMyId').textContent=(m.my_game_id||'NO REGISTRADO');
    document.getElementById('freshMyRank').textContent=String(m.my_rank_name||'LATÓN').toUpperCase();
    document.getElementById('freshOpponentRank').textContent=String(m.opponent_rank_name||'LATÓN').toUpperCase();
    document.getElementById('freshMyPosition').textContent='RANKING #'+(m.my_position||'--');
    document.getElementById('freshOpponentPosition').textContent='RANKING #'+(m.opponent_position||'--');
    const setFreshAvatar=(id,path,name)=>{const el=document.getElementById(id);if(!el)return;el.replaceChildren();const fallback=()=>{el.replaceChildren();const sp=document.createElement('span');sp.textContent=String(name||'?').charAt(0).toUpperCase();el.appendChild(sp)};if(path){const img=document.createElement('img');const raw=String(path).trim();let src=raw;if(!/^https?:\/\//i.test(raw)){const clean=raw.replace(/^profile-photos\//,'').replace(/^\/+/, '');const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(clean);src=u?.publicUrl||''}img.src=src;img.alt=String(name||'Jugador');img.onerror=fallback;el.appendChild(img)}else fallback()};
    const setFreshRankBadge=(id,elo)=>{const el=document.getElementById(id);if(!el)return;renderRankBadgeOn(el,Number(elo)||0)};
    setFreshAvatar('freshMyAvatar',m.my_avatar_path,m.my_name);setFreshAvatar('freshOpponentAvatar',m.opponent_avatar_path,m.opponent_name);setFreshRankBadge('freshOpponentRankBadge',m.opponent_elo);
    
    search.hidden=true;vs.hidden=false;startFreshRankedRoom(Number(m.match_id),Number(m.chat_seconds_left??60));return;
   }
  }catch(e){console.error('Emparejamiento nuevo:',e);rankedSearchActive=false;search.hidden=true;modal.hidden=true;showToast('No se pudo entrar a la cola: '+String(e?.message||'ERROR DE CONEXIÓN'));return}
  await new Promise(r=>setTimeout(r,5000));
 }
}
async function leaveRankedRoom(){
 if(!currentRankedMatchId)return closeRankedMatchmaking();
 const leavingMatchId=Number(currentRankedMatchId);
 try{const {error}=await supabaseClient.rpc('leave_ranked_room',{p_match_id:leavingMatchId});if(error)throw error}catch(e){console.error('Guardar salida de sala:',e);showToast('No se pudo guardar la salida. Intenta otra vez.');return}
 rankedSearchActive=false;stopRankedSearchLoop();
 clearInterval(matchmakingTimer);matchmakingTimer=null;
 clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=null;
 clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
 stopRankedChatResponseTimer();
 await stopActiveVsRealtime().catch(()=>{});
 await stopMatchmakingRealtime().catch(()=>{});
 /* Deliberately keep the match open in Supabase. Leaving the room is not
    a cancellation, concession or protection from a later evidence decision. */
 currentRankedMatchId=null;currentRankedMatchData=null;rankedVsChatMatchId=null;rankedVsBothMessaged=false;rankedPlayingLockedLocally=false;
 if(matchmakingModal)matchmakingModal.hidden=true;
 showToast('Saliste de la sala. El VS sigue activo y el resultado podrá aplicarse después.');
}
async function closeRankedMatchmaking(){
 rankedSearchActive=false;stopRankedSearchLoop();
 if(currentRankedMatchId&&supabaseClient){try{const {data}=await supabaseClient.rpc('get_my_active_ranked_match');const m=Array.isArray(data)?data[0]:data;if(m?.admin_confirmed){showToast('Este VS está confirmado. Debes esperar el resultado.');return}}catch(e){console.error(e)}}
 clearInterval(matchmakingTimer);matchmakingTimer=null;clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=null;clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;await stopMatchmakingRealtime();
 if(matchmakingModal)matchmakingModal.hidden=true;
 if(!currentRankedMatchId&&currentUser&&supabaseClient)await supabaseClient.rpc('matchmaking_v2_cancel');
}



async function loadAdminPlayers(){
 if(!adminPlayerList||!supabaseClient)return;adminPlayerList.innerHTML='<div class="admin-empty">Cargando jugadores...</div>';
 try{
  const {data,error}=await supabaseClient.rpc('get_ranking');if(error)throw error;const players=Array.isArray(data)?data:[];let modRows=[];try{const mr=await supabaseClient.rpc('admin_get_moderator_statuses');if(!mr.error&&Array.isArray(mr.data))modRows=mr.data;else if(mr.error)console.error('MOD status:',mr.error)}catch(modErr){console.error('MOD status:',modErr)}const modMap=new Map(modRows.map(r=>[String(r.player_id||r.id||'').toLowerCase(),r.is_moderator===true]));adminPlayerList.replaceChildren();
  players.forEach((p,index)=>{const card=document.createElement('article');card.className='admin-player-card';
   card.dataset.searchName=String(p.account_name||p.username||'').trim().toLowerCase();const head=document.createElement('div');head.className='admin-player-head';const av=document.createElement('div');av.className='admin-edit-avatar';av.textContent=String(p.account_name||p.username||'?').charAt(0).toUpperCase();if(p.avatar_path){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(p.avatar_path);if(u?.publicUrl){const im=document.createElement('img');im.src=u.publicUrl;av.replaceChildren(im)}}const title=document.createElement('div');title.innerHTML='<strong></strong><span></span>';title.children[0].textContent=p.account_name||p.username||'Jugador';title.children[1].textContent='Ranking #'+(index+1)+' · '+p.player_id;head.append(av,title);card.append(head);
   const fields=document.createElement('div');fields.className='admin-edit-grid';const defs=[['Nombre','account_name',p.account_name||p.username||''],['ID juego','game_id',p.game_id||''],['País','country',p.country||''],['ELO','elo_points',p.elo_points??200,'number'],['Victorias','wins',p.wins??0,'number'],['Derrotas','losses',p.losses??0,'number'],['Rango','rank_name',p.rank_name||getRankByElo(p.elo_points).name]];
   const inputs={};defs.forEach(([label,key,val,type])=>{const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.type=type||'text';i.value=val;l.append(i);fields.append(l);inputs[key]=i});const modLabel=document.createElement('label');modLabel.className='admin-mod-label';modLabel.textContent='MOD';const modControl=document.createElement('div');modControl.className='admin-mod-control';const modOff=document.createElement('button');modOff.type='button';modOff.textContent='OFF';const modOn=document.createElement('button');modOn.type='button';modOn.textContent='ON';let modValue=modMap.get(String(p.player_id||p.id||'').toLowerCase())===true;const paintMod=()=>{modOff.classList.toggle('active',!modValue);modOn.classList.toggle('active',modValue)};modOff.onclick=()=>{modValue=false;paintMod()};modOn.onclick=()=>{modValue=true;paintMod()};paintMod();modControl.append(modOff,modOn);modLabel.append(modControl);fields.append(modLabel);inputs.is_moderator={get value(){return modValue?'true':'false'}};card.append(fields);
   const save=document.createElement('button');save.className='admin-save-player';save.textContent='GUARDAR CAMBIOS';save.onclick=async()=>{save.disabled=true;const args={p_user_id:p.player_id,p_account_name:inputs.account_name.value,p_game_id:inputs.game_id.value,p_country:inputs.country.value,p_elo:Number(inputs.elo_points.value)||0,p_wins:Number(inputs.wins.value)||0,p_losses:Number(inputs.losses.value)||0,p_rank_name:inputs.rank_name.value};const {error:e}=await supabaseClient.rpc('admin_update_profile',args);if(e){save.disabled=false;console.error(e);showToast('No se pudieron guardar los cambios.');return}const {error:me}=await supabaseClient.rpc('ikar_set_moderator',{p_player_id:p.player_id,p_enabled:inputs.is_moderator.value==='true'});save.disabled=false;if(me){console.error(me);showToast('Perfil guardado, pero no se pudo cambiar MOD.');return}showToast('Perfil y MOD actualizados.');await loadAdminPlayers()};card.append(save);
   const modAction=document.createElement('button');modAction.type='button';modAction.className='admin-moderator-action';const syncModAction=()=>{const on=inputs.is_moderator.value==='true';modAction.textContent=on?'MOD ON — QUITAR MODERADOR':'MOD OFF — HACER MODERADOR';modAction.classList.toggle('is-on',on)};syncModAction();modAction.onclick=async()=>{modAction.disabled=true;const enable=inputs.is_moderator.value!=='true';const {error:me}=await supabaseClient.rpc('ikar_set_moderator',{p_player_id:p.player_id,p_enabled:enable});modAction.disabled=false;if(me){console.error(me);showToast('No se pudo cambiar el moderador.');return}modValue=enable;paintMod();syncModAction();showToast(enable?'Moderador activado.':'Moderador desactivado.')};card.append(modAction);const pw=document.createElement('button');pw.className='admin-password-btn';pw.textContent='CAMBIAR CONTRASEÑA';pw.onclick=()=>openAdminPlayerEditor(p);card.append(pw);adminPlayerList.append(card)})
 }catch(e){console.error(e);adminPlayerList.innerHTML='<div class="admin-empty">No se pudieron cargar los jugadores.</div>'}
}
function showAdminModeration(){
 if(adminMatchList)adminMatchList.hidden=true;
 if(adminPlayerList)adminPlayerList.hidden=true;
 if(adminModeration)adminModeration.hidden=false;

 if(adminPrivateMessages)adminPrivateMessages.innerHTML='<div class="admin-empty">Moderación disponible para el administrador.</div>';
}
function showAdminVs(){adminMatchView='all';if(adminMatchList)adminMatchList.hidden=false;if(adminPlayerList)adminPlayerList.hidden=true;if(adminPlayerSearch)adminPlayerSearch.hidden=true;if(adminModeration)adminModeration.hidden=true;loadAdminMatches()}
function showAdminPlayers(){if(adminMatchList)adminMatchList.hidden=true;if(adminPlayerList)adminPlayerList.hidden=false;if(adminPlayerSearch)adminPlayerSearch.hidden=false;if(adminModeration)adminModeration.hidden=true;loadAdminPlayers()}
let adminPlayerSearchTimer=null;
if(adminPlayerSearchInput)adminPlayerSearchInput.addEventListener('input',()=>{
 clearTimeout(adminPlayerSearchTimer);
 adminPlayerSearchTimer=setTimeout(async()=>{
  const q=adminPlayerSearchInput.value.trim();
  if(!q){await loadAdminPlayers();return}
  if(!adminPlayerList||!supabaseClient)return;
  adminPlayerList.innerHTML='<div class="admin-empty">Buscando en todos los jugadores...</div>';
  const {data,error}=await supabaseClient.rpc('admin_search_players',{p_query:q});
  if(error){console.error(error);adminPlayerList.innerHTML='<div class="admin-empty">No se pudo realizar la búsqueda.</div>';return}
  const players=Array.isArray(data)?data:[];
  adminPlayerList.replaceChildren();
  if(!players.length){adminPlayerList.innerHTML='<div class="admin-empty">No se encontró ningún jugador.</div>';return}
  players.forEach(p=>{
   const card=document.createElement('article');card.className='admin-player-card';card.dataset.searchName=String(p.account_name||p.username||'').toLowerCase();
   const head=document.createElement('div');head.className='admin-player-head';const av=document.createElement('div');av.className='admin-edit-avatar';av.textContent=String(p.account_name||p.username||'?').charAt(0).toUpperCase();
   if(p.avatar_path){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(p.avatar_path);if(u?.publicUrl){const im=document.createElement('img');im.src=u.publicUrl;av.replaceChildren(im)}}
   const title=document.createElement('div');title.innerHTML='<strong></strong><span></span>';title.children[0].textContent=p.account_name||p.username||'Jugador';title.children[1].textContent='Ranking #'+p.global_position+' · ID '+(p.game_id||'--');head.append(av,title);card.append(head);
   const open=document.createElement('button');open.type='button';open.className='admin-save-player';open.textContent='ABRIR / ADMINISTRAR JUGADOR';open.onclick=async()=>{adminPlayerSearchInput.value='';await loadAdminPlayers();const cards=[...adminPlayerList.querySelectorAll('.admin-player-card')];const target=cards.find(x=>String(x.textContent).includes(String(p.player_id)));if(target)target.scrollIntoView({behavior:'smooth',block:'center'})};card.append(open);adminPlayerList.append(card);
  });
 },250);
});

async function setupAdminMode(){
 if(!currentUser||!supabaseClient||!adminModeBtn)return;
 try{const {data,error}=await supabaseClient.from('profiles').select('is_admin').eq('id',currentUser.id).single();if(error)throw error;adminModeBtn.hidden=!data?.is_admin}catch(e){adminModeBtn.hidden=true}
}
async function cleanupRankedMatchVideos(matchId){
 try{
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session?.access_token)return;
  const response=await fetch(cloudConfig.url+'/functions/v1/cleanup-ranked-match-videos',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':cloudConfig.key},body:JSON.stringify({match_id:Number(matchId)})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data?.ok)console.error('No se pudieron eliminar videos del VS:',data?.error||response.status);
 }catch(e){console.error('Limpieza videos VS:',e)}
}
async function openAdminVsChat(matchId,p1,p2){const modal=document.getElementById('adminVsChatModal'),box=document.getElementById('adminVsChatMessages'),title=document.getElementById('adminVsChatTitle');if(!modal||!box||!supabaseClient)return;if(title)title.textContent=String(p1||'Jugador')+' VS '+String(p2||'Jugador');modal.hidden=false;modal.removeAttribute('hidden');modal.style.display='grid';modal.style.zIndex='2147483647';modal.dataset.matchId=String(matchId);box.textContent='Cargando conversación...';try{const res=await supabaseClient.rpc('admin_get_ranked_chat',{p_match_id:Number(matchId)});if(res.error)throw res.error;try{await supabaseClient.rpc('mark_ranked_match_chat_read',{p_match_id:Number(matchId)})}catch(_){};box.replaceChildren();const messages=Array.isArray(res.data)?res.data:[];if(!messages.length)box.textContent='Todavía no han enviado mensajes en este VS.';else messages.forEach(m=>{const d=document.createElement('div');d.className='admin-vs-chat-message';const h=document.createElement('b');h.textContent=String(m.sender_name||'Jugador')+' · '+new Date(m.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});const body=document.createElement('p');body.textContent=String(m.message||'');const seen=document.createElement('small');seen.className='chat-seen';seen.textContent=m.read_by_other?'✓✓ LEÍDO':'✓ ENVIADO';d.append(h,body);if(m.sender_id===currentUser?.id)d.append(seen);box.appendChild(d)});
const vr=await supabaseClient.rpc('admin_get_ranked_videos');if(!vr.error){const vids=(Array.isArray(vr.data)?vr.data:[]).filter(v=>Number(v.match_id)===Number(matchId));for(const v of vids){const ev=document.createElement('div');ev.className='admin-vs-chat-message evidence';const who=(v.uploader_id===window.__adminChatP1Id?p1:v.uploader_id===window.__adminChatP2Id?p2:'JUGADOR');const h=document.createElement('b');h.textContent='🎥 EVIDENCIA DE '+String(who||'JUGADOR').toUpperCase();const btn=document.createElement('button');btn.type='button';btn.className='chat-evidence-btn';btn.textContent='▶ VER VIDEO';btn.onclick=()=>openAdminRankedVideo(matchId,v.uploader_id,who);ev.append(h,btn);box.appendChild(ev)}}box.scrollTop=box.scrollHeight}catch(e){console.error('Chat admin:',e);box.textContent='No se pudo cargar el chat.'}}
async function sendAdminVsChat(){const modal=document.getElementById('adminVsChatModal'),input=document.getElementById('adminVsChatInput'),btn=document.getElementById('adminVsChatSend'),id=Number(modal?.dataset.matchId||0),msg=String(input?.value||'').trim();if(!id||!msg)return;if(btn)btn.disabled=true;try{const res=await supabaseClient.rpc('send_ranked_match_chat',{p_match_id:id,p_message:msg});if(res.error)throw res.error;input.value='';await openAdminVsChat(id,document.getElementById('adminVsChatTitle')?.textContent?.split(' VS ')[0],document.getElementById('adminVsChatTitle')?.textContent?.split(' VS ')[1])}catch(e){showToast('No se pudo enviar el mensaje.')}finally{if(btn)btn.disabled=false}}
document.addEventListener('click',e=>{if(e.target?.id==='adminVsChatSend'){e.preventDefault();sendAdminVsChat()}});
function closeAdminVsChat(){const m=document.getElementById('adminVsChatModal');if(m){m.hidden=true;m.style.removeProperty('display')}}
document.addEventListener('click',e=>{if(e.target&&['adminVsChatClose','adminVsChatModal'].includes(e.target.id))closeAdminVsChat()});

async function loadModeratorMatches(){
 if(!adminMatchList||!supabaseClient)return;
 adminMatchList.innerHTML='<div class="admin-empty">Cargando VS...</div>';
 try{
  const {data,error}=await supabaseClient.rpc('moderator_get_ranked_matches');if(error)throw error;
  const rows=(Array.isArray(data)?data:[]).filter(m=>m.status==='matched');adminMatchList.replaceChildren();
  if(!rows.length){adminMatchList.innerHTML='<div class="admin-empty">No hay VS activos para moderar.</div>';return}
  for(const m of rows){
   const row=document.createElement('article');row.className='admin-match matched';
   const title=document.createElement('div');title.className='admin-match-vs admin-match-vs-rich';
   const makePlayer=(side)=>{const name=m[side+'_name'],rawElo=m[side+'_elo'],elo=(rawElo===null||rawElo===undefined||rawElo==='')?0:Number(rawElo),gameId=m[side+'_game_id']||'--',pos=m[side+'_position']||'--',rank=getRankByElo(elo),avatar=m[side+'_avatar_path'];const card=document.createElement('div');card.className='admin-vs-player';const av=document.createElement('div');av.className='admin-vs-avatar';if(avatar){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(avatar);if(u?.publicUrl)av.style.backgroundImage='url("'+u.publicUrl+'")'}if(!avatar)av.textContent=String(name||'?').charAt(0).toUpperCase();const info=document.createElement('div');info.className='admin-vs-info';const nm=document.createElement('strong');nm.textContent=name;const id=document.createElement('span');id.textContent='ID '+gameId;const rp=document.createElement('span');rp.textContent='RANKING #'+pos;const el=document.createElement('span');el.textContent=elo+' ELO';const badge=document.createElement('div');badge.className='admin-vs-rank-badge';renderRankBadgeOn(badge,rank);const rn=document.createElement('b');rn.textContent=rank.name;info.append(nm,id,rp,el,rn);if(left){const out=document.createElement('span');out.className='admin-player-left-room';out.textContent='SALIÓ DE ESTA SALA';info.append(out);card.classList.add('admin-vs-player-left')}card.append(av,badge,info);return card};title.append(makePlayer('player1'));const vs=document.createElement('b');vs.className='admin-vs-word';vs.textContent='VS';title.append(vs,makePlayer('player2'));row.append(title);
   const meta=document.createElement('small');meta.textContent='#'+m.match_id+' · VS ACTIVO · '+formatCommentDate(m.created_at);row.append(meta);
   const videoProof=document.createElement('div');videoProof.className='admin-video-proof';if(m.player1_video_path){const b=document.createElement('button');b.className='received';b.textContent='🎥 VIDEO '+m.player1_name;b.onclick=()=>openAdminRankedVideo(m.match_id,m.player1_id,m.player1_name);videoProof.append(b)}if(m.player2_video_path){const b=document.createElement('button');b.className='received';b.textContent='🎥 VIDEO '+m.player2_name;b.onclick=()=>openAdminRankedVideo(m.match_id,m.player2_id,m.player2_name);videoProof.append(b)}if(videoProof.children.length)row.append(videoProof);
   const actions=document.createElement('div');actions.className='admin-match-actions';const chat=document.createElement('button');chat.className='admin-chat-btn';chat.textContent='VER CHAT';chat.onclick=async()=>{const modal=document.getElementById('adminVsChatModal'),box=document.getElementById('adminVsChatMessages'),t=document.getElementById('adminVsChatTitle');if(!modal||!box)return;if(t)t.textContent=m.player1_name+' VS '+m.player2_name;modal.hidden=false;modal.style.display='grid';box.textContent='Cargando conversación...';const r=await supabaseClient.rpc('moderator_get_ranked_chat',{p_match_id:Number(m.match_id)});box.replaceChildren();if(r.error){box.textContent='No se pudo cargar el chat.';return}const msgs=Array.isArray(r.data)?r.data:[];if(!msgs.length)box.textContent='Todavía no hay mensajes.';msgs.forEach(v=>{const d=document.createElement('div');d.className='admin-chat-message';d.textContent=String(v.sender_name||'Jugador')+': '+String(v.body||'');box.append(d)})};actions.append(chat);
   const wt=document.createElement('strong');wt.className='admin-result-title';wt.textContent='DEFINIR GANADOR';actions.append(wt);
   for(const [id,name] of [[m.player1_id,m.player1_name],[m.player2_id,m.player2_name]]){const b=document.createElement('button');b.className='admin-winner-btn';b.textContent='GANA '+name;b.onclick=async()=>{if(!confirm('¿Confirmar a '+name+' como ganador?'))return;const r=await supabaseClient.rpc('moderator_resolve_ranked_match',{p_match_id:Number(m.match_id),p_winner_id:id});if(r.error){console.error(r.error);showToast('No se pudo guardar el resultado.');return}await loadModeratorMatches();showToast('Resultado aplicado.')};actions.append(b)}
   row.append(actions);adminMatchList.append(row);
  }
 }catch(e){console.error(e);adminMatchList.innerHTML='<div class="admin-empty">No se pudo cargar la sala de moderación.</div>'}
}

async function loadAdminMatches(){
 if(!adminMatchList||!supabaseClient||adminMatchesLoading)return;
 adminMatchesLoading=true;
 adminMatchList.innerHTML='<div class="admin-empty">Cargando...</div>';
 try{
  let data=[],videos=[];
  if(adminMatchView==='proofs'){
    const mr=await supabaseClient.rpc('admin_get_ranked_matches_with_evidence');if(mr.error)throw mr.error;
    data=Array.isArray(mr.data)?mr.data:[];
  }else{
    data=adminMatchesCache;
    if(!data.length){const mr=await supabaseClient.rpc('admin_get_ranked_matches');if(mr.error)throw mr.error;data=Array.isArray(mr.data)?mr.data:[];adminMatchesCache=data}
  }
  const allRows=adminMatchView==='proofs'?data:data.filter(m=>m.status==='matched'&&!m.player1_video_path&&!m.player2_video_path&&!m.player1_left_room&&!m.player2_left_room);
  const proofRows=adminMatchView==='proofs'?allRows:allRows.filter(m=>m.player1_video_path||m.player2_video_path);
  if(adminMatchView==='proofs'&&adminProofsCount)adminProofsCount.textContent=String(proofRows.length);
  const q=String(adminVsSearchInput?.value||'').trim().toLowerCase();
  const sourceRows=adminMatchView==='proofs'?proofRows:[...allRows].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
  const filteredRows=!q?sourceRows:sourceRows.filter(m=>[m.player1_name,m.player2_name,m.player1_game_id,m.player2_game_id,m.match_id].some(v=>String(v??'').toLowerCase().includes(q)));
  const rows=adminMatchView==='proofs'?filteredRows.slice(0,6):filteredRows;
  adminMatchList.replaceChildren();
  if(!rows.length){adminMatchList.innerHTML='<div class="admin-empty">'+(adminMatchView==='proofs'?'No hay VS con pruebas pendientes.':'No hay partidos en espera.')+'</div>';return}
  for(const m of rows){
   const row=document.createElement('article');row.className='admin-match '+m.status;
   const title=document.createElement('div');title.className='admin-match-vs admin-match-vs-rich';
   const makePlayer=(side)=>{const name=m[side+'_name'],elo=Number(m[side+'_elo']||200),gameId=m[side+'_game_id']||'--',pos=m[side+'_position']||'--',rank=getRankByElo(elo),avatar=m[side+'_avatar_path'],left=!!m[side+'_left_room'];const card=document.createElement('div');card.className='admin-vs-player admin-vs-player-open-profile';card.setAttribute('role','button');card.tabIndex=0;card.title='Abrir perfil de '+String(name||'Jugador');const openProfile=async(e)=>{e?.preventDefault?.();e?.stopPropagation?.();try{const pid=m[side+'_id'];const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:pid});if(error)throw error;const p=Array.isArray(data)?data[0]:data;if(p)openRankingPlayer({...p,id:p.player_id,player_id:p.player_id});else showToast('No se pudo abrir el perfil.')}catch(err){console.error(err);showToast('No se pudo abrir el perfil.')}};card.addEventListener('click',openProfile);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProfile(e)}});const av=document.createElement('div');av.className='admin-vs-avatar';if(avatar){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(avatar);if(u?.publicUrl)av.style.backgroundImage='url("'+u.publicUrl+'")'}if(!avatar)av.textContent=String(name||'?').charAt(0).toUpperCase();const info=document.createElement('div');info.className='admin-vs-info';const nm=document.createElement('strong');nm.textContent=name;const id=document.createElement('span');id.textContent='ID '+gameId;const rp=document.createElement('span');rp.textContent='RANKING #'+pos;const el=document.createElement('span');el.textContent=elo+' ELO';const badge=document.createElement('div');badge.className='admin-vs-rank-badge';renderRankBadgeOn(badge,rank);const rn=document.createElement('b');rn.textContent=rank.name;info.append(nm,id,rp,el,rn);card.append(av,badge,info);return card};title.append(makePlayer('player1'));const vs=document.createElement('b');vs.className='admin-vs-word';vs.textContent='VS';title.append(vs,makePlayer('player2'));
   const meta=document.createElement('small');meta.textContent='#'+m.match_id+' · '+String(m.status).toUpperCase()+' · '+formatCommentDate(m.created_at);
   row.append(title,meta);
   const playingState=document.createElement('div');playingState.className='admin-result-title';playingState.style.marginTop='10px';playingState.style.textAlign='center';playingState.style.fontWeight='800';
   const p1Playing=!!m.player1_playing_confirmed,p2Playing=!!m.player2_playing_confirmed;
   if(p1Playing||p2Playing||m.players_playing){
    const who=[];if(p1Playing)who.push(String(m.player1_name||'JUGADOR 1'));if(p2Playing)who.push(String(m.player2_name||'JUGADOR 2'));
    playingState.textContent='🟢 YA ESTAMOS JUGANDO · '+(who.length?who.join(' Y ')+' PRESIONÓ'+(who.length>1?'N':'')+' SÍ':'VS EN JUEGO');
    playingState.style.color='#34d058';
   }else{playingState.textContent='🟡 NADIE HA PRESIONADO “YA ESTAMOS JUGANDO”';playingState.style.color='#ffd33d'}
   row.appendChild(playingState);
   const timer=document.createElement('div');timer.className='admin-vs-time-left';row.appendChild(timer);
   const updateTime=()=>{const start=new Date(m.players_playing_at||m.confirmed_at||m.created_at).getTime();const p1Won=String(m.player1_claim||'').toUpperCase()==='WON',p2Won=String(m.player2_claim||'').toUpperCase()==='WON';const wonAt=p1Won&&m.player1_claimed_at?new Date(m.player1_claimed_at).getTime():p2Won&&m.player2_claimed_at?new Date(m.player2_claimed_at).getTime():null;const end=wonAt||Date.now();const total=Math.max(0,Math.floor((end-start)/1000)),hh=Math.floor(total/3600),mm=Math.floor((total%3600)/60),ss=total%60;timer.textContent=(wonAt?'🏁 TIEMPO HASTA GANÉ ':'⏱️ TIEMPO EN PARTIDA ')+(hh>0?String(hh).padStart(2,'0')+':':'')+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');timer.classList.toggle('expired',!!wonAt)};updateTime();const timerId=setInterval(()=>{if(!row.isConnected){clearInterval(timerId);return}updateTime()},1000);
   const videoProof=document.createElement('div');videoProof.className='admin-video-proof';const p1v=m.player1_video_path;const p2v=m.player2_video_path;
   if(p1v){const b=document.createElement('button');b.className='received';b.textContent='🎥 VIDEO '+m.player1_name;b.onclick=()=>openAdminRankedVideo(m.match_id,m.player1_id,m.player1_name);videoProof.appendChild(b)}
   if(p2v){const b=document.createElement('button');b.className='received';b.textContent='🎥 VIDEO '+m.player2_name;b.onclick=()=>openAdminRankedVideo(m.match_id,m.player2_id,m.player2_name);videoProof.appendChild(b)}
   if(p1v||p2v){row.appendChild(videoProof);const sent=document.createElement('div');sent.className='admin-video-sent-summary';const parts=[];if(p1v)parts.push('🎥 '+m.player1_name+' ENVIÓ EVIDENCIA');if(p2v)parts.push('🎥 '+m.player2_name+' ENVIÓ EVIDENCIA');sent.textContent=parts.join('  ·  ');row.appendChild(sent)}
   if(m.status==='matched'||m.status==='review'){
    const actions=document.createElement('div');actions.className='admin-match-actions';
    const actionStatus=document.createElement('div');actionStatus.className='admin-result-title';
    const actionLabel=(claim,noTrick,forgot)=>forgot?'SALIR · OLVIDÓ GRABAR':(noTrick?'NADIE HIZO TRICK':(String(claim||'').toLowerCase()==='won'?'GANÉ':(String(claim||'').toLowerCase()==='lost'?'PERDÍ':'NO HA PRESIONADO')));
    const p1Action=actionLabel(m.player1_claim,m.player1_no_trick,m.player1_forgot_recording),p2Action=actionLabel(m.player2_claim,m.player2_no_trick,m.player2_forgot_recording);
    actionStatus.innerHTML='<div>'+String(m.player1_name||'Jugador')+': <b>'+p1Action+'</b></div><div>'+String(m.player2_name||'Jugador')+': <b>'+p2Action+'</b></div>';
    actions.appendChild(actionStatus);const chatBtn=document.createElement('button');chatBtn.className='admin-chat-btn';chatBtn.textContent='VER CHAT';chatBtn.onclick=e=>{e.preventDefault();e.stopPropagation();window.__adminChatP1Id=m.player1_id;window.__adminChatP2Id=m.player2_id;openAdminVsChat(m.match_id,m.player1_name,m.player2_name)};chatBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();window.__adminChatP1Id=m.player1_id;window.__adminChatP2Id=m.player2_id;openAdminVsChat(m.match_id,m.player1_name,m.player2_name)},{passive:false});actions.appendChild(chatBtn);
    if(!m.admin_confirmed&&m.status==='matched'){
     const confirmBtn=document.createElement('button');confirmBtn.className='confirm-vs';confirmBtn.textContent='CONFIRMAR VS';
     confirmBtn.onclick=async()=>{if(!confirm('¿Confirmar este VS? Después de confirmarlo los jugadores ya no podrán abandonar.'))return;const {error}=await supabaseClient.rpc('admin_confirm_ranked_match',{p_match_id:m.match_id});if(error){showToast('No se pudo confirmar el VS.');return}adminMatchesCache=[];adminVideosCache=[];await loadAdminMatches();showToast('VS confirmado. Ahora selecciona quién ganó.')};
     actions.appendChild(confirmBtn);
    }else{
     const winnerTitle=document.createElement('strong');winnerTitle.className='admin-result-title';winnerTitle.textContent='DEFINIR GANADOR';
     actions.appendChild(winnerTitle);
     for(const [id,name] of [[m.player1_id,m.player1_name],[m.player2_id,m.player2_name]]){
      const winBtn=document.createElement('button');winBtn.className='admin-winner-btn';winBtn.textContent='GANA '+name;
      winBtn.onclick=async()=>{if(!confirm('¿Confirmar a '+name+' como ganador? Se aplicará +15 ELO al ganador y la penalización correspondiente al perdedor.'))return;const {error}=await supabaseClient.rpc('admin_resolve_ranked_match',{p_match_id:m.match_id,p_winner_id:id});if(error){showToast('No se pudo guardar el resultado.');return}await cleanupRankedMatchVideos(m.match_id);adminMatchesCache=[];adminVideosCache=[];await loadAdminMatches();showToast('Resultado aplicado. Evidencias eliminadas.')};
      actions.appendChild(winBtn);
     }
    }
    const cancel=document.createElement('button');cancel.className='cancel';cancel.textContent='ANULAR VS';
    cancel.onclick=async()=>{if(!confirm('¿Anular este VS sin cambiar ELO?'))return;const {error}=await supabaseClient.rpc('admin_cancel_ranked_match',{p_match_id:m.match_id});if(error){showToast('No se pudo anular.');return}await cleanupRankedMatchVideos(m.match_id);adminMatchesCache=[];adminVideosCache=[];await loadAdminMatches();showToast('VS anulado. Evidencias eliminadas.')};
    actions.appendChild(cancel);row.appendChild(actions);
   }
   adminMatchList.appendChild(row);
  }
  if(adminMatchView==='proofs'&&filteredRows.length>rows.length){
    const more=document.createElement('button');more.type='button';more.className='admin-refresh';more.textContent='VER MÁS PRUEBAS ('+(filteredRows.length-rows.length)+')';
    more.onclick=()=>{showToast('Mostrando primero las 6 pruebas más recientes para evitar sobrecargar el sitio.')};
    adminMatchList.appendChild(more);
  }
 }catch(e){console.error(e);adminMatchList.innerHTML='<div class="admin-empty">No se pudo cargar el modo administrador.</div>'}
 finally{adminMatchesLoading=false}
}

function normalizeUsername(value){return value.trim().toLowerCase()}
function usernameToInternalEmail(value){return normalizeUsername(value)+'@login.rankingikar8bp.com'}
function validUsername(value){return /^[a-zA-Z0-9._-]{3,30}$/.test(value)}


function showToast(message){
  toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),3000)
}
function openModal(modal,focusTarget){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>focusTarget?.focus(),60)}
function closeModal(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');if(!document.querySelector('.modal-backdrop.open'))document.body.classList.remove('modal-open')}
function setRegisterBusy(busy){registerSubmit.disabled=busy;registerSubmit.textContent=busy?'Guardando...':'Crear cuenta'}
function setLoginBusy(busy){loginSubmit.disabled=busy;loginSubmit.textContent=busy?'Entrando...':'Entrar'}

function getFlag(value){
  const c=(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const flags={
    mexico:'🇲🇽',ecuador:'🇪🇨',colombia:'🇨🇴',argentina:'🇦🇷',peru:'🇵🇪',chile:'🇨🇱',venezuela:'🇻🇪',
    espana:'🇪🇸',spain:'🇪🇸',brasil:'🇧🇷',brazil:'🇧🇷',uruguay:'🇺🇾',paraguay:'🇵🇾',bolivia:'🇧🇴',
    'estados unidos':'🇺🇸',usa:'🇺🇸','united states':'🇺🇸','republica dominicana':'🇩🇴',dominicana:'🇩🇴',
    guatemala:'🇬🇹',honduras:'🇭🇳','el salvador':'🇸🇻',nicaragua:'🇳🇮','costa rica':'🇨🇷',panama:'🇵🇦',
    cuba:'🇨🇺','puerto rico':'🇵🇷',francia:'🇫🇷',italia:'🇮🇹',alemania:'🇩🇪',canada:'🇨🇦'
  };
  return flags[c]||'🌎'
}



async function renderGuestRankShowcase(){
 const top=document.getElementById('guestWorldTop3'),total=document.getElementById('guestWorldTotal');
 if(total)total.textContent=String(totalRegisteredPlayers||guestRankingPlayers.length||'—');
 if(!top)return;
 const players=guestRankingPlayers.slice(0,3);
 top.replaceChildren();
 if(!players.length){top.innerHTML='<div class="ranking-loading">Cargando TOP 3...</div>';return}
 const order=[1,0,2];
 order.forEach(i=>{
  const p=players[i];if(!p)return;
  const card=document.createElement('button');card.type='button';card.className='guest-world-player guest-world-player-'+(i+1);
  card.addEventListener('click',()=>openRankingPlayer(p));
  const medal=document.createElement('img');medal.className='guest-world-medal guest-world-medal-image';medal.src='assets/M'+String(i+1)+'.png?v=20261005-transparent52';medal.alt='Puesto '+String(i+1);medal.loading='eager';
  const avatar=document.createElement('span');avatar.className='guest-world-avatar';avatar.textContent=String(p.username||p.account_name||'J').charAt(0).toUpperCase();
  if(p.avatar_path&&supabaseClient){const {data}=supabaseClient.storage.from('profile-photos').getPublicUrl(p.avatar_path);if(data?.publicUrl){avatar.textContent='';const img=document.createElement('img');img.src=data.publicUrl;img.alt='';img.loading='lazy';img.onerror=()=>{img.remove();avatar.textContent=String(p.username||p.account_name||'J').charAt(0).toUpperCase()};avatar.appendChild(img)}}
  const name=document.createElement('b');name.textContent=String(p.username||p.account_name||'Jugador').toUpperCase();
  const badge=document.createElement('span');badge.className='guest-world-rank-badge';renderRankBadgeOn(badge,getRankByElo(Number.isFinite(Number(p.elo_points))?Number(p.elo_points):200));
  const meta=document.createElement('span');meta.className='guest-world-meta';meta.textContent=getFlag(p.country)+'  ELO: '+String(Number.isFinite(Number(p.elo_points))?Number(p.elo_points):200);
  const identity=document.createElement('div');identity.className='guest-world-identity';identity.append(avatar,badge);
  card.append(medal,identity,name,meta);top.appendChild(card);
 });
}

async function loadGuestRanking(){
 if(!guestRankingList||guestRankingLoading)return;
 const cached=readPublicCache('ranking8bp_public_ranking');
 if(cached?.length){guestRankingPlayers=cached.slice(0,100);renderGuestRanking();renderGuestRankShowcase()}
 else guestRankingList.innerHTML='<div class="ranking-loading">Cargando clasificación...</div>';
 if(!supabaseClient)return;
 // Always refresh ranking so new/changed profile photos are received from Supabase.
 guestRankingLoading=true;
 try{
  if(cached?.length)await burstJitter();
  const {data,error}=await supabaseClient.rpc('get_cached_public_home');
  if(error)throw error;
  const snapshot=data&&typeof data==='object'?data:{};
  if(Array.isArray(snapshot.streaks))rankingStreaks=new Map(snapshot.streaks.map(x=>[String(x.player_id),Number(x.streak)||0]));
  const snapshotTotal=Number(snapshot.total_players);
  if(Number.isFinite(snapshotTotal)){totalRegisteredPlayers=snapshotTotal;try{localStorage.setItem('ranking8bp_real_registered_count',String(snapshotTotal))}catch(_){}}
  guestRankingPlayers=(Array.isArray(snapshot.ranking)?snapshot.ranking:[]).slice(0,100);
  if(snapshot.latest_result){writePublicCache('ranking8bp_latest_result',snapshot.latest_result);paintLatestRankingResult(snapshot.latest_result)};
  writePublicCache('ranking8bp_public_ranking',guestRankingPlayers);
  renderGuestRanking();
  renderGuestRankShowcase();
 }catch(e){
  console.error('Ranking público:',e);
  if(!guestRankingPlayers.length)guestRankingList.innerHTML='<div class="ranking-loading ranking-error">Servidor ocupado. Reintentando…</div>';
 }finally{guestRankingLoading=false}
}
function onlineDotFor(){return null}
function patchOnlineDots(){document.querySelectorAll('.online-player-dot').forEach(x=>x.remove())}
async function refreshOnlinePlayers(){onlinePlayerIds=new Set();patchOnlineDots()}
async function openPlayingVs(){if(!supabaseClient||!playingVsModal||!playingVsList)return;playingVsModal.hidden=false;playingVsList.innerHTML='<div class="ranking-loading">Cargando VS...</div>';try{const {data,error}=await supabaseClient.rpc('get_public_active_ranked_matches');if(error)throw error;const rows=Array.isArray(data)?data:[];playingVsList.replaceChildren();if(!rows.length){const e=document.createElement('div');e.className='playing-vs-empty';e.textContent='No hay VS jugándose ahora.';playingVsList.appendChild(e);return}rows.forEach(m=>{const row=document.createElement('div');row.className='playing-vs-item';const p1=document.createElement('strong');p1.textContent=String(m.player1_name||'Jugador');const vs=document.createElement('span');vs.textContent='VS';const p2=document.createElement('strong');p2.textContent=String(m.player2_name||'Jugador');row.append(p1,vs,p2);playingVsList.appendChild(row)})}catch(e){playingVsList.textContent='No se pudieron cargar los VS.'}}
if(playersOnlineNow){playersOnlineNow.style.cursor='default';playersOnlineNow.setAttribute('aria-disabled','true');}if(playingVsClose)playingVsClose.addEventListener('click',()=>playingVsModal.hidden=true);if(playingVsModal)playingVsModal.addEventListener('click',e=>{if(e.target===playingVsModal)playingVsModal.hidden=true});
async function refreshPlayersPlayingCount(force=false){if(!supabaseClient||!playersOnlineCount||playersPlayingLoading)return;if(!force&&Date.now()-lastPlayingCountFetch<90000)return;playersPlayingLoading=true;try{const {data,error}=await supabaseClient.rpc('get_ranked_players_playing_count');if(error)throw error;const count=Number(data)||0;playersOnlineCount.textContent=String(count);const row=document.getElementById('playersOnlineNow');if(row)row.hidden=count<=0;lastPlayingCountFetch=Date.now()}catch(e){console.error('Jugadores jugando:',e)}finally{playersPlayingLoading=false}}
async function touchOnlinePresence(){}
function startOnlinePresence(){clearInterval(onlinePresenceTimer)}

function renderGuestRanking(){
 if(!guestRankingList)return;
 const q=String(guestRankingSearchInput?.value||'').trim().toLocaleLowerCase('es');
 const players=guestRankingPlayers.filter(p=>{
   const name=(String(p?.username||'')+' '+String(p?.account_name||'')).toLocaleLowerCase('es');
   return !q||name.includes(q);
 });
 guestRankingList.replaceChildren();
 if(guestRankingCount)guestRankingCount.textContent=q?String(players.length)+' RESULTADOS':'LOS 100 MEJORES DEL MUNDO EN EL RANKING · TOTAL REGISTRADOS: '+(totalRegisteredPlayers||players.length);
 if(!players.length){
   const empty=document.createElement('div');empty.className='ranking-loading';empty.textContent=q?'No se encontró ningún jugador.':'Todavía no hay jugadores registrados.';guestRankingList.appendChild(empty);return;
 }
 players.forEach((player,index)=>{
   const row=document.createElement('div');row.className='guest-ranking-row';row.dataset.playerId=String(player?.player_id||player?.id||'');
   const pos=document.createElement('strong');pos.className='guest-ranking-pos';pos.textContent=String(index+1);
   const name=document.createElement('div');name.className='guest-ranking-player';
   const avatar=document.createElement('span');avatar.className='guest-ranking-avatar';avatar.textContent=String(player.username||player.account_name||'J').charAt(0).toUpperCase();
   if(player.avatar_path&&supabaseClient){
    const base=String(window.SUPABASE_CONFIG?.url||'').replace(/\/$/,'');
    const publicUrl=base+'/storage/v1/object/public/profile-photos/'+String(player.avatar_path).split('/').map(encodeURIComponent).join('/');
    if(base){const img=document.createElement('img');img.src=publicUrl;img.alt=String(player.username||player.account_name||'Jugador');img.loading='eager';img.decoding='async';img.referrerPolicy='no-referrer';img.style.cssText='display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;z-index:3!important';img.onload=()=>{avatar.style.color='transparent'};img.onerror=()=>{console.warn('Avatar ranking no cargó',player.avatar_path)};avatar.appendChild(img)}
   }
   const info=document.createElement('div');info.className='guest-ranking-player-info';
   const n=document.createElement('b');n.className='ranking-player-name';n.textContent=String(player.username||player.account_name||'Jugador').toUpperCase();const sid=String(player?.player_id||player?.id||'');const sv=Number(rankingStreaks.get(sid)||0);if(sv>0){const ss=document.createElement('span');ss.className='ranking-streak';ss.textContent=' +'+sv;ss.title='Racha de '+sv+' victoria'+(sv===1?'':'s');n.appendChild(ss)}const od=onlineDotFor(player);if(od)n.appendChild(od);
   const rank=getRankByElo(player.elo_points);const rankLine=document.createElement('span');rankLine.className='guest-ranking-rank';rankLine.textContent=rank.name.toUpperCase();
   const miniBadge=document.createElement('span');miniBadge.className='guest-ranking-rank-badge';renderRankBadgeOn(miniBadge,rank);
   miniBadge.setAttribute('role','button');miniBadge.tabIndex=0;miniBadge.title='Ver perfil y estadísticas';
   const openBadgeProfile=event=>{event.stopPropagation();openRankingPlayer(player)};
   miniBadge.addEventListener('click',openBadgeProfile);
   miniBadge.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBadgeProfile(event)}});
   info.append(n,rankLine);name.append(avatar,miniBadge,info);
   const country=document.createElement('div');country.className='guest-ranking-country';country.textContent=getFlag(player.country)+' '+String(player.country||'País');
   const elo=document.createElement('strong');elo.className='guest-ranking-elo';const guestElo=Number.isFinite(Number(player.elo_points))?Number(player.elo_points):200;elo.textContent=String(guestElo);elo.classList.toggle('negative-elo',guestElo<0);
   row.append(pos,name,country,elo);guestRankingList.appendChild(row);
 });
}

function setGuestUI(){
  currentUser=null;currentProfile=null;if(rankingSearchWrap)rankingSearchWrap.hidden=true;if(guestRankingSearchWrap)guestRankingSearchWrap.hidden=true;if(activityBtn)activityBtn.hidden=true;if(activityPanel)activityPanel.hidden=true;guestTopbar.hidden=false;guestEmpty.hidden=false;playerDashboard.hidden=true;settingsMenu.hidden=true;clearAvatar();
  renderGuestRankShowcase().catch(()=>{});
  loadGuestRanking().catch(()=>{});
}
function clearAvatar(){
  if(avatarPreviewUrl){URL.revokeObjectURL(avatarPreviewUrl);avatarPreviewUrl=''}
  profileAvatar.hidden=true;profileAvatar.removeAttribute('src');avatarPlaceholder.hidden=false
}
async function loadAvatar(path){
  if(!supabaseClient||!path){clearAvatar();return}
  const url=await getCachedAvatarUrl(path);
  if(!url){clearAvatar();return}
  if(profileAvatar.src!==url)profileAvatar.src=url;profileAvatar.hidden=false;avatarPlaceholder.hidden=true
}

async function setPlayerUI(profile,user){
  const uiUserId=String(user?.id||currentUser?.id||'');
  if(uiUserId&&playerUiLoadingFor===uiUserId)return;
  playerUiLoadingFor=uiUserId;
  currentUser=user||currentUser;currentProfile=profile||currentProfile;
  guestTopbar.hidden=true;guestEmpty.hidden=true;playerDashboard.hidden=false;

  const playerName=profile?.username||user?.user_metadata?.username||profile?.account_name||'Jugador';
  setupGlobalDesignEditor(profile);
  await loadGlobalDesign();
  const elo=Number.isFinite(Number(profile?.elo_points))?Number(profile.elo_points):200;
  const rank=getRankByElo(elo);
  const rankName=rank.name;
  const wins=Number.isFinite(Number(profile?.wins))?Number(profile.wins):0;
  const losses=Number.isFinite(Number(profile?.losses))?Number(profile.losses):0;
  const games=wins+losses;
  const rate=games>0?Math.round((wins/games)*100):0;

  dashboardPlayerName.textContent=String(playerName).toUpperCase();const selfDot=document.createElement('span');selfDot.className='online-player-dot';selfDot.title='En línea';dashboardPlayerName.appendChild(selfDot);
  countryName.textContent=profile?.country||'País';
  countryFlag.textContent=getFlag(profile?.country);
  const isAdminDashboard=profile?.is_admin===true||String(profile?.username||'').toLowerCase()==='ikar8bp';
  if(rankingSearchWrap)rankingSearchWrap.hidden=!isAdminDashboard;
  if(activityBtn)activityBtn.hidden=!isAdminDashboard;
  if(activityPanel&&!isAdminDashboard)activityPanel.hidden=true;
  if(guestRankingSearchWrap)guestRankingSearchWrap.hidden=true;
  const rankHero=document.querySelector('#playerDashboard .rank-hero-card');
  const winLossGrid=document.querySelector('#playerDashboard .win-loss-grid');
  if(isAdminDashboard){
    if(rankHero){rankHero.hidden=true;rankHero.classList.remove('admin-only-card');rankHero.replaceChildren();}
    if(winLossGrid)winLossGrid.hidden=true;
  }else{
    if(rankHero){rankHero.hidden=false;rankHero.classList.remove('admin-only-card');}
    if(winLossGrid)winLossGrid.hidden=false;
    dashboardElo.textContent=elo;dashboardElo.classList.toggle('negative-elo',elo<0);
    const dashboardRankName=document.getElementById('dashboardRankName');
    const rankProgressFill=document.getElementById('rankProgressFill');
    const rankProgressText=document.getElementById('rankProgressText');
    const nextRank=RANKS[rank.index+1]||null;
    const rankStart=Math.max(200,Number(rank.min)||200);
    const rankEnd=nextRank?Number(nextRank.min):rankStart;
    const rankSpan=Math.max(1,rankEnd-rankStart);
    const rankPct=nextRank?Math.max(0,Math.min(100,((elo-rankStart)/rankSpan)*100)):100;
    if(dashboardRankName)dashboardRankName.textContent=String(rank.name||'').toUpperCase();
    if(rankProgressFill)rankProgressFill.style.width=rankPct+'%';
    if(rankProgressText)rankProgressText.textContent=nextRank?(elo+' / '+rankEnd):(elo+' · MÁXIMO');
    dashboardWins.textContent=wins;
    dashboardLosses.textContent=losses;
  }
  gamesPlayed.textContent=isAdminDashboard?'—':games;
  winRate.textContent=isAdminDashboard?'—':rate+'%';
  currentStreak.textContent=isAdminDashboard?'—':'0';
  bestElo.textContent=isAdminDashboard?'—':elo;
  dashboardMessage.textContent='';
  const showIkarModerator=String(profile?.username||user?.user_metadata?.username||'').trim().toLowerCase()==='ikar8bp'||profile?.is_moderator===true;
  if(ikarModeratorArea)ikarModeratorArea.hidden=!showIkarModerator;

  // HIGH TRAFFIC MODE: render the account immediately. Secondary Supabase reads are staggered
  // so a wave of logins/refreshes does not hit every RPC in the same second.
  const rankTask=isAdminDashboard?Promise.resolve():renderRankBadge(rank);
  if(!isAdminDashboard){
    const syncRank=getRankByElo(elo);
    const syncName=document.getElementById('dashboardRankName');
    if(syncName)syncName.textContent=String(syncRank.name||'').toUpperCase();
    renderRankBadge(syncRank);
  }
  const avatarTask=profile?.avatar_path?loadAvatar(profile.avatar_path):Promise.resolve(clearAvatar());
  const competitiveHub=document.getElementById('competitiveHub');if(competitiveHub)competitiveHub.hidden=isAdminDashboard;
  Promise.allSettled([rankTask,avatarTask]).catch(()=>{});
  const spread=(fn,min,max)=>setTimeout(()=>{if(currentUser?.id===user?.id&&!document.hidden)Promise.resolve(fn()).catch(()=>{})},min+Math.floor(Math.random()*(max-min)));
  spread(()=>loadDashboardFollowStats(profile?.id||user?.id),2500,7000);
  // Los datos personales visibles deben estar correctos desde el primer render.
  if(!isAdminDashboard)loadCompetitiveHub(profile?.id||user?.id).catch(e=>console.error('Carga inicial logros:',e));
  // La clasificación debe aparecer de inmediato; loadRanking pinta primero el caché local y refresca detrás.
  loadRanking().catch(()=>{});
  maybeOpenDirectMatchmaking();
  // El punto rojo de mensajes debe restaurarse inmediatamente al recargar la página.
  refreshInboxBadge().catch(e=>console.error('Carga inicial contador mensajes:',e));
  // Una sola carga de dinámicas al restaurar la sesión; evita 5 RPC por usuario.
  refreshDynamic().catch(e=>console.error('Carga inicial de dinámicas:',e));
  playerUiReadyFor=uiUserId;playerUiLoadingFor=null;
}


let top3CardsCache=null,top3CardsCacheAt=0;
async function getTop3CardsCached(){if(top3CardsCache&&Date.now()-top3CardsCacheAt<60000)return {data:top3CardsCache};const r=await supabaseClient.rpc('get_ranking_top3_cards');if(!r.error){top3CardsCache=Array.isArray(r.data)?r.data:[];top3CardsCacheAt=Date.now()}return r}
async function loadCompetitiveHub(profileId){if(!supabaseClient||!profileId)return;try{const [{data:cp},{data:top},{data:dynamicWins}]=await Promise.all([supabaseClient.rpc('get_player_competitive_profile',{p_profile_id:profileId}),getTop3CardsCached(),supabaseClient.rpc('get_dynamic_wins_row',{p_profile_id:profileId})]);const dw=document.querySelector('#dynamicWinsProfile b');if(dw){const winsRow=Array.isArray(dynamicWins)?dynamicWins[0]:dynamicWins;dw.textContent=String(Number(winsRow?.dynamic_wins)||0)}const d=cp||{};const completedHistory=Array.isArray(d.history)?d.history:[];const historyWins=completedHistory.filter(v=>String(v?.result||'').toUpperCase()==='WON').length;const historyLosses=completedHistory.filter(v=>String(v?.result||'').toUpperCase()==='LOST').length;if(competitiveWins)competitiveWins.textContent=String(historyWins);if(competitiveLosses)competitiveLosses.textContent=String(historyLosses);const st=document.getElementById('competitiveStreak'),be=document.getElementById('competitiveBestElo'),sn=document.getElementById('seasonName'),sc=document.getElementById('seasonCountdown'),ts=document.getElementById('top3Showcase'),ah=document.getElementById('competitiveAchievements'),hh=document.getElementById('competitiveHistory');if(st)st.textContent=String(d.current_streak||0);if(be)be.textContent=String(d.max_elo||200);if(sn)sn.textContent=d.season?.name||'TEMPORADA 1';if(sc&&d.season?.ends_at){const days=Math.max(0,Math.ceil((new Date(d.season.ends_at)-Date.now())/86400000));sc.textContent=days+' DÍAS RESTANTES'}if(ts){ts.replaceChildren();(top||[]).forEach((p,n)=>{const x=document.createElement('div');x.className='top3-player top3-card';const pos=document.createElement('span');pos.className='top3-position';pos.textContent=String(n+1);const center=document.createElement('div');center.className='top3-center';const av=createRankingAvatar({username:p.player_name,avatar_path:p.avatar_path});av.classList.add('top3-avatar');const name=document.createElement('strong');name.className='top3-name';name.textContent=String(p.player_name||'Jugador').toUpperCase();center.append(av,name);x.append(pos,center);ts.appendChild(x)})}if(ah){ah.replaceChildren();(d.achievements||[]).forEach(v=>{const x=document.createElement('span');x.className='achievement '+(v.unlocked?'unlocked':'locked');x.textContent=(v.unlocked?'🏆 ':'🔒 ')+v.name;ah.appendChild(x)})}if(hh){hh.replaceChildren();const h=d.history||[];if(!h.length)hh.textContent='Aún no hay partidas terminadas.';h.slice(0,10).forEach(v=>{const x=document.createElement('div');x.className='history-row '+(v.result==='WON'?'won':'lost');x.innerHTML='<b>'+(v.result==='WON'?'GANÓ':'PERDIÓ')+'</b><span>vs '+escapeHtml(v.rival)+'</span><strong>'+(v.elo_change>0?'+':'')+v.elo_change+' ELO</strong>';hh.appendChild(x)})}}catch(e){console.error('Panel competitivo:',e)}}
async function loadDashboardFollowStats(profileId){
 if(!profileId||!supabaseClient)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_follow_stats',{p_profile_id:profileId});if(error)throw error;
  const s=Array.isArray(data)?data[0]:data;
  if(dashboardFollowersCount)dashboardFollowersCount.textContent=String(s?.followers||0);
  if(dashboardFollowingCount)dashboardFollowingCount.textContent=String(s?.following||0);
 }catch(e){console.error('Error cargando seguidores del perfil:',e)}
}

// Do not persist failed avatar loads across visits: a temporary network/storage error must not hide a valid photo forever.
try{localStorage.removeItem('ranking8bp_broken_avatars')}catch(_){}
const brokenAvatarPaths=new Set();
function avatarIsBroken(path){return !!path&&brokenAvatarPaths.has(String(path))}
function markAvatarBroken(path){if(!path)return;brokenAvatarPaths.add(String(path))}
function attachAvatarFallback(img,path){if(!img)return img;img.onerror=()=>{markAvatarBroken(path);img.remove()};return img}

function createRankingAvatar(player){
  const wrap=document.createElement('div');
  wrap.className='ranking-avatar';
  const fallback=document.createElement('span');
  const displayName=player?.username||player?.account_name||'J';
  fallback.textContent=String(displayName).trim().charAt(0).toUpperCase()||'J';
  wrap.appendChild(fallback);
  if(player?.avatar_path){
    const base=String(window.SUPABASE_CONFIG?.url||'').replace(/\/$/,'');
    if(base){
      const img=document.createElement('img');
      const encoded=String(player.avatar_path).split('/').map(encodeURIComponent).join('/');
      img.src=base+'/storage/v1/object/public/profile-photos/'+encoded;
      img.alt='Foto de '+String(displayName);
      img.loading='eager';
      img.decoding='async';
      img.style.cssText='display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important';
      img.onload=()=>{wrap.replaceChildren(img)};
      img.onerror=()=>{console.warn('Foto de ranking no cargó:',player.avatar_path)};
    }
  }
  return wrap;
}


function updateHeartUI(count,hearted,isOwn=false){
  const total=Math.max(0,Number(count)||0);
  if(playerHeartCount)playerHeartCount.textContent=String(total);
  if(playerHeartCountLabel)playerHeartCountLabel.textContent=total===1?'jugador le dio un corazón':'jugadores le dieron un corazón';
  if(!playerHeartBtn)return;
  playerHeartBtn.classList.toggle('hearted',Boolean(hearted));
  playerHeartBtn.setAttribute('aria-pressed',hearted?'true':'false');
  playerHeartBtn.disabled=Boolean(isOwn)||currentDetailHeartBusy;
  const label=playerHeartBtn.querySelector('.player-heart-label');
  if(label)label.textContent=isOwn?'Tu perfil':hearted?'Quitar corazón':'Dar corazón';
}

async function loadPlayerHeartState(player){
  if(!playerHeartBtn||!player?.player_id||!currentUser||!supabaseClient)return;
  const isOwn=player.player_id===currentUser.id;
  let hearted=false;

  if(!isOwn){
    const {data,error}=await supabaseClient
      .from('profile_hearts')
      .select('target_id')
      .eq('liker_id',currentUser.id)
      .eq('target_id',player.player_id)
      .maybeSingle();
    if(error)console.error('Error consultando corazón:',error);
    else hearted=Boolean(data);
  }

  currentDetailHearted=hearted;
  updateHeartUI(player.heart_count||0,hearted,isOwn);
}

async function togglePlayerHeart(){
  const player=currentDetailPlayer;
  if(!player?.player_id||!currentUser||!supabaseClient||currentDetailHeartBusy)return;
  if(player.player_id===currentUser.id)return;

  currentDetailHeartBusy=true;
  updateHeartUI(player.heart_count||0,currentDetailHearted,false);

  try{
    if(currentDetailHearted){
      const {error}=await supabaseClient
        .from('profile_hearts')
        .delete()
        .eq('liker_id',currentUser.id)
        .eq('target_id',player.player_id);
      if(error)throw error;
      currentDetailHearted=false;
      player.heart_count=Math.max(0,(Number(player.heart_count)||0)-1);
    }else{
      const {error}=await supabaseClient
        .from('profile_hearts')
        .insert({liker_id:currentUser.id,target_id:player.player_id});
      if(error)throw error;
      currentDetailHearted=true;
      player.heart_count=(Number(player.heart_count)||0)+1;
    }
  }catch(error){
    console.error('Error actualizando corazón:',error);
    showToast('No se pudo actualizar el corazón.');
  }finally{
    currentDetailHeartBusy=false;
    updateHeartUI(player.heart_count||0,currentDetailHearted,false);
  }
}



function renderGlobalActivity(items){
 if(!activityList)return;
 activityList.replaceChildren();
 if(!items.length){activityList.innerHTML='<div class="notification-empty">Todavía no hay actividad.</div>';return}
 items.forEach(n=>{
  const item=document.createElement('button');item.type='button';item.className='notification-item global-activity-item';
  const icon=document.createElement('span');icon.className='notification-type-icon';
  const box=document.createElement('span');box.className='notification-copy';
  const p=document.createElement('span');p.className='global-activity-text';
  const actor=document.createElement('b');actor.className='global-activity-name';actor.textContent=String(n.actor_name||'Alguien');
  const targetId=n.type==='registration'?n.actor_id:n.recipient_id;
  if(n.type==='registration'){
    icon.textContent='🌎';p.append(actor,document.createTextNode(' se ha registrado en Ranking8BP.'));
  }else if(n.type==='comment'){
    icon.textContent='💬';p.append(actor,document.createTextNode(' comentó en el perfil de '));
    const target=document.createElement('b');target.className='global-activity-name';target.textContent=String(n.recipient_name||'un jugador');p.append(target,document.createTextNode('.'));
    if(n.comment_body){const q=document.createElement('span');q.className='global-activity-comment';q.textContent=' “'+String(n.comment_body)+'”';p.append(q)}
  }else if(n.type==='comment_heart'){
    icon.textContent='♥';p.append(actor,document.createTextNode(' dio corazón a un comentario de '));
    const target=document.createElement('b');target.className='global-activity-name';target.textContent=String(n.recipient_name||'un jugador');p.append(target,document.createTextNode('.'));
  }else{
    icon.textContent='♥';p.append(actor,document.createTextNode(' dio corazón al perfil de '));
    const target=document.createElement('b');target.className='global-activity-name';target.textContent=String(n.recipient_name||'un jugador');p.append(target,document.createTextNode('.'));
  }
  const t=document.createElement('time');t.textContent=formatCommentDate(n.created_at);box.append(p,t);item.append(icon,box);
  item.setAttribute('aria-label','Abrir perfil relacionado con esta actividad');
  item.addEventListener('click',async()=>{if(!targetId)return;try{const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:targetId});if(error)throw error;const player=Array.isArray(data)?data[0]:data;if(player)await openRankingPlayer(player);else showToast('No se encontró ese perfil.')}catch(e){console.error(e);showToast('No se pudo abrir el perfil.')}});
  activityList.appendChild(item);
 });
}
async function loadGlobalActivity(){if(!currentUser||!supabaseClient||!activityList||String(currentProfile?.username||'').toLowerCase()!=='ikar8bp'||currentProfile?.is_admin!==true)return;try{const {data,error}=await supabaseClient.rpc('get_global_activity');if(error)throw error;renderGlobalActivity(Array.isArray(data)?data:[])}catch(e){console.error(e);activityList.innerHTML='<div class="notification-empty">No se pudo cargar la actividad.</div>'}}
async function toggleGlobalActivity(){if(!activityPanel||String(currentProfile?.username||'').toLowerCase()!=='ikar8bp'||currentProfile?.is_admin!==true)return;const opening=activityPanel.hidden;activityPanel.hidden=!opening;if(notificationPanel)notificationPanel.hidden=true;if(settingsMenu)settingsMenu.hidden=true;if(opening)await loadGlobalActivity()}
function updateNotificationBadge(count){
  if(!notificationBadge)return;
  const n=Number(count)||0;
  notificationBadge.textContent=n>99?'99+':String(n);
  notificationBadge.hidden=n<1;
}
function renderNotifications(items){
  if(!notificationList)return;
  notificationList.replaceChildren();
  if(!items.length){
    const e=document.createElement('div');e.className='notification-empty';e.textContent='No tienes notificaciones.';notificationList.appendChild(e);return;
  }
  items.forEach(n=>{
    const item=document.createElement('article');item.className='notification-item'+(n.is_read?'':' unread');
    const icon=document.createElement('span');icon.className='notification-type-icon';icon.textContent=(n.type==='comment'||n.type==='thread_comment')?'💬':'♥';
    const box=document.createElement('div');box.className='notification-copy';
    const p=document.createElement('p');
    if(n.type==='comment'||n.type==='thread_comment'){
      p.append(document.createTextNode(String(n.actor_name||'Alguien')+(n.type==='thread_comment'?' también comentó en un perfil donde participaste: ':' comentó en tu perfil: ')));
      const q=document.createElement('b');q.textContent='“'+String(n.comment_body||'')+'”';p.appendChild(q);
    }else{
      p.textContent=String(n.actor_name||'Alguien')+(n.type==='comment_heart'?' dio corazón a tu comentario.':' dio corazón a tu perfil.');
    }
    const t=document.createElement('time');t.textContent=formatCommentDate(n.created_at);
    box.append(p,t);item.append(icon,box);
    item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label','Abrir lugar de esta notificación');
    const go=()=>openNotificationTarget(n);
    item.addEventListener('click',go);
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
    notificationList.appendChild(item);
  });
}
async function openNotificationTarget(n){
  if(!n?.target_profile_id||!supabaseClient)return;
  try{
    const {data,error}=await supabaseClient.rpc('get_ranking');
    if(error)throw error;
    const player=(Array.isArray(data)?data:[]).find(x=>x.player_id===n.target_profile_id);
    if(!player){showToast('No se encontró ese perfil.');return}
    if(notificationPanel)notificationPanel.hidden=true;
    if(!n.is_read){
      await supabaseClient.from('notifications').update({is_read:true}).eq('id',n.notification_id).eq('recipient_id',currentUser.id);
      n.is_read=true;loadNotifications().catch(()=>{});
    }
    await openRankingPlayer(player);
    setTimeout(()=>{
      const target=n.comment_id&&profileCommentsList?.querySelector('[data-comment-id="'+n.comment_id+'"]');
      const el=target||document.getElementById('profileComments')||playerDetailModal;
      el?.scrollIntoView({behavior:'smooth',block:'center'});
      if(target){
        target.classList.remove('notification-target-focus');
        void target.offsetWidth;
        target.classList.add('notification-target-focus');
        target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
        setTimeout(()=>target.classList.remove('notification-target-focus'),5000);
      }
    },500);
  }catch(error){console.error(error);showToast('No se pudo abrir la notificación.')}
}

async function loadNotifications(){
  if(!currentUser||!supabaseClient)return;
  try{
    const {data,error}=await supabaseClient.rpc('get_my_notifications');
    if(error)throw error;
    const items=Array.isArray(data)?data:[];
    renderNotifications(items);
    updateNotificationBadge(items.filter(x=>!x.is_read).length);
  }catch(error){console.error('Error cargando notificaciones:',error)}
}
async function markAllNotificationsRead(){
  if(!currentUser||!supabaseClient)return;
  const {error}=await supabaseClient.from('notifications').update({is_read:true}).eq('recipient_id',currentUser.id).eq('is_read',false);
  if(error){console.error(error);showToast('No se pudieron marcar como leídas.');return}
  await loadNotifications();
}
async function toggleNotifications(){
  if(!notificationPanel)return;
  const opening=notificationPanel.hidden;
  notificationPanel.hidden=!opening;
  if(settingsMenu)settingsMenu.hidden=true;
  if(opening)await loadNotifications();
}
function formatCommentDate(value){
  try{return new Intl.DateTimeFormat('es',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
  catch{return ''}
}

function renderProfileComments(comments){
  if(!profileCommentsList)return;
  profileCommentsList.replaceChildren();
  profileCommentCount.textContent=String(comments.length);
  if(!comments.length){
    const empty=document.createElement('div');
    empty.className='profile-comments-empty';
    empty.textContent='Todavía no hay comentarios. Sé el primero en comentar.';
    profileCommentsList.appendChild(empty);
    return;
  }
  comments.forEach(comment=>{
    const item=document.createElement('article');
    item.className='profile-comment-item';item.dataset.commentId=String(comment.comment_id||'');
    const head=document.createElement('div');head.className='profile-comment-head';
    const author=document.createElement('strong');author.textContent=String(comment.author_name||'Jugador').toUpperCase();author.className='profile-comment-author';author.tabIndex=0;author.setAttribute('role','button');author.setAttribute('aria-label','Abrir perfil de '+String(comment.author_name||'Jugador'));
    const openAuthorProfile=async()=>{if(!comment.author_id||!supabaseClient)return;try{let {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:comment.author_id});if(error)throw error;const player=Array.isArray(data)?data[0]:data;if(!player){showToast('No se encontró ese perfil.');return}await openRankingPlayer(player)}catch(e){console.error(e);showToast('No se pudo abrir el perfil.')}};
    author.addEventListener('click',openAuthorProfile);author.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAuthorProfile()}});
    const date=document.createElement('time');date.textContent=formatCommentDate(comment.created_at);
    head.append(author,date);
    const body=document.createElement('p');body.textContent=comment.body;
    const actions=document.createElement('div');actions.className='profile-comment-actions';
    const heart=document.createElement('button');heart.type='button';heart.className='comment-heart-btn'+(comment.viewer_liked?' liked':'');
    heart.innerHTML='<span>♥</span> <b>'+Number(comment.heart_count||0)+'</b>';
    heart.setAttribute('aria-label',comment.viewer_liked?'Quitar corazón':'Dar corazón');
    heart.addEventListener('click',()=>toggleCommentHeart(comment,heart));
    actions.appendChild(heart);
    if(currentProfile?.is_admin){
      const del=document.createElement('button');del.type='button';del.className='admin-comment-delete';del.textContent='BORRAR';del.title='Borrar comentario';
      del.onclick=async()=>{if(!confirm('¿Borrar este comentario?'))return;const {error}=await supabaseClient.rpc('admin_delete_comment',{p_comment_id:comment.comment_id});if(error){console.error(error);showToast('No se pudo borrar el comentario.');return}item.remove();showToast('Comentario borrado.');if(profileCommentCount)profileCommentCount.textContent=String(Math.max(0,Number(profileCommentCount.textContent||0)-1))};
      actions.appendChild(del);
    }
    item.append(head,body,actions);
    profileCommentsList.appendChild(item);
  });
}

async function loadProfileComments(){
  if(!currentDetailPlayer?.player_id||!supabaseClient||!profileCommentsList)return;
  const targetId=currentDetailPlayer.player_id;
  profileCommentsList.innerHTML='<div class="profile-comments-empty">Cargando comentarios...</div>';
  try{
    const {data,error}=await supabaseClient.rpc('get_profile_comments',{p_profile_id:targetId});
    if(error)throw error;
    if(currentDetailPlayer?.player_id!==targetId)return;
    renderProfileComments(Array.isArray(data)?data:[]);
  }catch(error){
    console.error('Error cargando comentarios:',error);
    profileCommentsList.innerHTML='<div class="profile-comments-empty">No se pudieron cargar los comentarios.</div>';
  }
}

async function toggleCommentHeart(comment,button){
  if(!currentUser||!supabaseClient||!comment?.comment_id||button.disabled)return;
  button.disabled=true;
  try{
    if(comment.viewer_liked){
      const {error}=await supabaseClient.from('profile_comment_hearts').delete().eq('comment_id',comment.comment_id).eq('user_id',currentUser.id);
      if(error)throw error;
      comment.viewer_liked=false;comment.heart_count=Math.max(0,Number(comment.heart_count||0)-1);
    }else{
      const {error}=await supabaseClient.from('profile_comment_hearts').insert({comment_id:comment.comment_id,user_id:currentUser.id});
      if(error)throw error;
      comment.viewer_liked=true;comment.heart_count=Number(comment.heart_count||0)+1;
    }
    button.classList.toggle('liked',comment.viewer_liked);
    button.querySelector('b').textContent=String(comment.heart_count);
    button.setAttribute('aria-label',comment.viewer_liked?'Quitar corazón':'Dar corazón');
  }catch(error){console.error(error);showToast('No se pudo actualizar el corazón.')}
  finally{button.disabled=false}
}

async function submitProfileComment(event){
  event.preventDefault();
  if(!currentUser||!currentDetailPlayer?.player_id||!supabaseClient)return;
  const body=profileCommentInput.value.trim();
  if(!body)return;
  profileCommentSubmit.disabled=true;
  try{
    const {error}=await supabaseClient.from('profile_comments').insert({
      profile_id:currentDetailPlayer.player_id,
      author_id:currentUser.id,
      body
    });
    if(error)throw error;
    profileCommentInput.value='';
    showToast('Comentario publicado.');
    await loadProfileComments();
  }catch(error){console.error(error);showToast('No se pudo publicar el comentario.')}
  finally{profileCommentSubmit.disabled=false}
}

function closeRankingPlayer(){
  if(!playerDetailModal)return;
  currentDetailPlayer=null;
  playerDetailModal.classList.remove('open');
  playerDetailModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('player-detail-open');
}

async function loadFollowStats(player){
 if(!supabaseClient||!player?.player_id)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_follow_stats',{p_profile_id:player.player_id});if(error)throw error;
  const s=Array.isArray(data)?data[0]:data;
  if(playerFollowersCount)playerFollowersCount.textContent=String(s?.followers||0);
  if(playerFollowingCount)playerFollowingCount.textContent=String(s?.following||0);
  if(playerFollowBtn){const own=player.player_id===currentUser?.id;playerFollowBtn.hidden=own;playerFollowBtn.dataset.following=s?.viewer_follows?'1':'0';playerFollowBtn.dataset.friend=s?.is_friend?'1':'0';playerFollowBtn.textContent=s?.is_friend?'AMIGOS':(s?.viewer_follows?'SIGUIENDO':'SEGUIR');playerFollowBtn.classList.toggle('following',!!s?.viewer_follows);playerFollowBtn.classList.toggle('friends',!!s?.is_friend)}
 }catch(e){console.error('Error seguidores:',e)}
}
function openPrivateMessage(event){
 if(event){event.preventDefault();event.stopPropagation()}
 const player=currentDetailPlayer;
 if(!player||player.player_id===currentUser?.id)return;
 if(!privateMessageModal||!privateMessageInput||!privateMessageSend){showToast('No se pudo abrir el mensaje.');return}
 privateMessageTo.textContent='Para: '+String(player.username||player.account_name||'Jugador');
 privateMessageInput.value='';
 privateMessageModal.hidden=false;
 privateMessageModal.style.display='grid';
 privateMessageInput.disabled=false;
 privateMessageInput.readOnly=false;
 privateMessageInput.style.pointerEvents='auto';
 privateMessageInput.style.userSelect='text';
 setTimeout(()=>{privateMessageInput.focus();privateMessageInput.click()},100);
}
function closePrivateMessage(){if(privateMessageModal){privateMessageModal.hidden=true;privateMessageModal.style.display=''}}
async function sendPrivateMessage(){
 const target=currentDetailPlayer?.player_id,body=privateMessageInput?.value.trim();
 if(!target||!body||!currentUser||!supabaseClient)return;
 privateMessageSend.disabled=true;
 try{
  const {data:sent,error}=await supabaseClient.from('private_messages').insert({sender_id:currentUser.id,recipient_id:target,body}).select('id').single();if(error)throw error;if(sent?.id)supabaseClient.functions.invoke('send-private-push',{body:{message_id:sent.id}}).catch(console.error);
  closePrivateMessage();showToast('Mensaje privado enviado.');
 }catch(e){console.error(e);showToast('No se pudo enviar el mensaje.')}
 finally{privateMessageSend.disabled=false}
}
async function toggleFollow(){
 const player=currentDetailPlayer;if(!currentUser||!supabaseClient||!player?.player_id||player.player_id===currentUser.id)return;
 const following=playerFollowBtn?.dataset.following==='1';
 try{
  if(following){const {error}=await supabaseClient.from('profile_follows').delete().eq('follower_id',currentUser.id).eq('following_id',player.player_id);if(error)throw error}
  else{const {error}=await supabaseClient.from('profile_follows').insert({follower_id:currentUser.id,following_id:player.player_id});if(error)throw error}
  await loadFollowStats(player);
 }catch(e){console.error(e);showToast('No se pudo actualizar el seguimiento.')}
}
function isCurrentUserAdmin(){
  return !!currentProfile && (currentProfile.is_admin===true || String(currentProfile.username||'').toLowerCase()==='ikar8bp');
}
function closeAdminPlayerEditor(){
  const modal=document.getElementById('adminPlayerEditorModal');
  if(modal)modal.remove();
}
function openAdminPlayerEditor(player){
  if(!isCurrentUserAdmin()||!player?.player_id){showToast('Solo el administrador puede usar esta función.');return}
  closeAdminPlayerEditor();
  const modal=document.createElement('div');modal.id='adminPlayerEditorModal';modal.className='admin-player-editor-backdrop';
  modal.innerHTML=`<section class="admin-player-editor" role="dialog" aria-modal="true">
    <div class="admin-player-editor-head"><div><small>ADMINISTRAR JUGADOR</small><h2>Editar perfil</h2></div><button type="button" class="admin-editor-close">×</button></div>
    <div class="admin-player-editor-grid">
      <label class="field"><span class="field-label">Nombre de usuario</span><input id="adminEditUsername" maxlength="30"></label>
      <label class="field"><span class="field-label">Nombre visible</span><input id="adminEditAccountName" maxlength="80"></label>
      <label class="field"><span class="field-label">Contraseña nueva</span><input id="adminEditPassword" type="password" minlength="6" placeholder="Dejar vacío = no cambiar"></label>
      <label class="field"><span class="field-label">ID 8 Ball Pool</span><input id="adminEditGameId" maxlength="80"></label>
      <label class="field"><span class="field-label">País</span><input id="adminEditCountry" maxlength="80"></label>
      <label class="field"><span class="field-label">ELO</span><input id="adminEditElo" type="number" min="0"></label>
      <label class="field"><span class="field-label">Victorias</span><input id="adminEditWins" type="number" min="0"></label>
      <label class="field"><span class="field-label">Derrotas</span><input id="adminEditLosses" type="number" min="0"></label>
      <label class="field"><span class="field-label">Rango</span><input id="adminEditRank" maxlength="80"></label>
      <label class="field admin-editor-photo-field"><span class="field-label">Foto de perfil</span><input id="adminEditAvatar" type="file" accept="image/png,image/jpeg,image/webp"><small>JPG, PNG o WEBP · máximo 5 MB</small></label>
    </div>
    <div class="admin-editor-preview"><div id="adminEditAvatarPreview"></div><span id="adminEditStatus"></span></div>
    <div class="admin-editor-actions"><button type="button" class="admin-editor-delete" style="background:#8b1111;color:#fff;border:1px solid #ff4d4d;font-weight:900">ELIMINAR CUENTA</button><button type="button" class="admin-editor-cancel">CANCELAR</button><button type="button" class="admin-editor-save">GUARDAR TODO</button></div>
  </section>`;
  document.body.appendChild(modal);
  const q=id=>modal.querySelector('#'+id);
  q('adminEditUsername').value=player.username||'';
  q('adminEditAccountName').value=player.account_name||player.username||'';
  q('adminEditGameId').value=player.game_id||'';
  q('adminEditCountry').value=player.country||'';
  q('adminEditElo').value=Number(player.elo_points)||0;
  q('adminEditWins').value=Number(player.wins)||0;
  q('adminEditLosses').value=Number(player.losses)||0;
  q('adminEditRank').value=getRankByElo(Number(player.elo_points)||0).name;
  const preview=q('adminEditAvatarPreview');
  if(player.avatar_path&&supabaseClient){
    const {data}=supabaseClient.storage.from('profile-photos').getPublicUrl(player.avatar_path);
    if(data?.publicUrl)preview.style.backgroundImage='url("'+data.publicUrl+'")';
  }
  q('adminEditAvatar').addEventListener('change',e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>5*1024*1024){q('adminEditStatus').textContent='La foto supera 5 MB.';e.target.value='';return}
    preview.style.backgroundImage='url("'+URL.createObjectURL(file)+'")';q('adminEditStatus').textContent='';
  });
  modal.querySelector('.admin-editor-close').onclick=closeAdminPlayerEditor;
  modal.querySelector('.admin-editor-cancel').onclick=closeAdminPlayerEditor;
  modal.addEventListener('click',e=>{if(e.target===modal)closeAdminPlayerEditor()});
  modal.querySelector('.admin-editor-delete').onclick=async()=>{
    const btn=modal.querySelector('.admin-editor-delete');
    const name=player.account_name||player.username||'este jugador';
    if(!confirm('¿ELIMINAR DEFINITIVAMENTE la cuenta de '+name+'? Esta acción no se puede deshacer.'))return;
    if(!confirm('ÚLTIMA CONFIRMACIÓN: se eliminará la cuenta completa del jugador. ¿Continuar?'))return;
    btn.disabled=true;q('adminEditStatus').textContent='Eliminando cuenta...';
    try{
      const {error}=await supabaseClient.rpc('ikar_delete_player_account',{p_player_id:player.player_id});
      if(error)throw error;
      closeAdminPlayerEditor();showToast('Cuenta eliminada definitivamente.');
      await loadRanking().catch(()=>{});
      await loadAdminPlayers().catch(()=>{});
    }catch(error){console.error(error);q('adminEditStatus').textContent='No se pudo eliminar la cuenta.';showToast('No se pudo eliminar la cuenta.');btn.disabled=false}
  };
  modal.querySelector('.admin-editor-save').onclick=async()=>{
    const save=modal.querySelector('.admin-editor-save');save.disabled=true;q('adminEditStatus').textContent='Guardando...';
    try{
      if(!supabaseClient||!currentUser)throw new Error('Sesión no disponible');
      const username=q('adminEditUsername').value.trim().toLowerCase();
      if(!/^[a-z0-9._-]{3,30}$/.test(username))throw new Error('El nombre de usuario no es válido.');
      const file=q('adminEditAvatar').files?.[0];
      if(file&&file.size>5*1024*1024)throw new Error('La foto supera 5 MB.');
      let avatar_base64='';
      let avatar_mime='';
      if(file){
        avatar_mime=file.type;
        avatar_base64=await new Promise((resolve,reject)=>{
          const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);
        });
      }
      const body={
        user_id:player.player_id,username,account_name:q('adminEditAccountName').value.trim(),
        game_id:q('adminEditGameId').value.trim(),country:q('adminEditCountry').value.trim(),
        elo_points:Number(q('adminEditElo').value)||0,wins:Number(q('adminEditWins').value)||0,
        losses:Number(q('adminEditLosses').value)||0,rank_name:q('adminEditRank').value.trim(),
        password:q('adminEditPassword').value,avatar_base64,avatar_mime
      };
      const {data,error}=await supabaseClient.functions.invoke('admin-update-user',{body});
      if(error||!data?.ok)throw new Error(data?.error||error?.message||'No se pudieron guardar los cambios.');
      const {data:updated,error:readError}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:player.player_id});
      if(readError)throw readError;
      const updatedPlayer=Array.isArray(updated)?updated[0]:updated;
      if(updatedPlayer){currentDetailPlayer=updatedPlayer;await openRankingPlayer(updatedPlayer)}
      closeAdminPlayerEditor();showToast('Perfil del jugador actualizado.');
      if(typeof loadRanking==='function')loadRanking().catch(()=>{});
    }catch(error){console.error(error);q('adminEditStatus').textContent=error?.message||'No se pudo guardar.';showToast(error?.message||'No se pudo guardar.')}
    finally{save.disabled=false}
  };
}
async function loadPlayerDetailCompetitive(player){const streak=document.getElementById('playerDetailStreak'),label=document.getElementById('playerDetailStreakLabel'),box=document.getElementById('playerDetailMatchHistory');if(!streak||!box||!supabaseClient)return;streak.textContent='0';if(label)label.textContent='victorias seguidas';box.innerHTML='<div class="profile-comments-empty">Cargando historial...</div>';const id=player?.player_id||player?.id;if(!id){box.textContent='No hay historial disponible.';return}try{const {data,error}=await supabaseClient.rpc('get_player_competitive_profile',{p_profile_id:id});if(error)throw error;streak.textContent=String(data?.current_streak||0);box.replaceChildren();const h=Array.isArray(data?.history)?data.history:[];if(!h.length){box.textContent='Aún no tiene partidas terminadas.';return}h.slice(0,6).forEach(v=>{const row=document.createElement('div');row.className='player-history-row '+(v.result==='WON'?'won':'lost');const result=document.createElement('b');result.textContent=v.result==='WON'?'GANÓ':'PERDIÓ';const rival=document.createElement('span');rival.textContent='vs '+String(v.rival||'Jugador');const meta=document.createElement('div');meta.className='player-history-meta';const elo=document.createElement('strong');elo.textContent=(Number(v.elo_change)>0?'+':'')+String(v.elo_change)+' ELO';const date=document.createElement('small');if(v.finished_at){date.textContent=new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(v.finished_at))}else{date.textContent='Fecha no disponible'}meta.append(elo,date);row.append(result,rival,meta);box.appendChild(row)})}catch(e){console.error('Historial del jugador:',e);box.textContent='No se pudo cargar el historial.'}}

async function openRankingPlayer(player){
  if(!playerDetailModal)return;
  if(supabaseClient&&player&&(player.game_id===undefined||player.game_id===null||String(player.game_id).trim()==='')){
    const profileId=player.player_id||player.id;
    if(profileId){
      try{
        const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:profileId});
        if(!error&&data){
          const full=Array.isArray(data)?data[0]:data;
          if(full)player={...player,...full,player_id:full.player_id||profileId,id:full.player_id||profileId};
        }
        if(player.game_id===undefined||player.game_id===null||String(player.game_id).trim()===''){
          const {data:directProfile,error:directError}=await supabaseClient.from('profiles').select('game_id').eq('id',profileId).maybeSingle();
          if(!directError&&directProfile?.game_id)player={...player,game_id:directProfile.game_id};
        }
      }catch(error){console.error('No se pudo cargar el ID 8 Ball Pool del perfil:',error)}
    }
  }
  currentDetailPlayer=player;
  if(playerAdminBtn){
    playerAdminBtn.hidden=!isCurrentUserAdmin() || String(player?.username||'').toLowerCase()==='ikar8bp';
    playerAdminBtn.onclick=()=>openAdminPlayerEditor(player);
  }

  const displayName=String(player?.username||player?.account_name||'Jugador').toUpperCase();
  const country=player?.country||'País';
  const elo=Number.isFinite(Number(player?.elo_points))?Number(player.elo_points):200;
  const wins=Number.isFinite(Number(player?.wins))?Number(player.wins):0;
  const losses=Number.isFinite(Number(player?.losses))?Number(player.losses):0;
  const gameId=String(player?.game_id||'—');
  const rank=getRankByElo(elo);
  const isAdminProfile=String(player?.username||'').toLowerCase()==='ikar8bp'||player?.is_admin===true;
  const profileIdForDynamicWins=player?.player_id||player?.id;let dynamicWins=0;if(profileIdForDynamicWins&&supabaseClient){try{const {data,error}=await supabaseClient.rpc('get_dynamic_wins_row',{p_profile_id:profileIdForDynamicWins});if(!error){const row=Array.isArray(data)?data[0]:data;dynamicWins=Number(row?.dynamic_wins)||0}}catch(_){}}if(playerDetailDynamicWins)playerDetailDynamicWins.textContent=String(dynamicWins);

  if(playerDetailPositionStat)playerDetailPositionStat.hidden=isAdminProfile;
  if(playerDetailPosition&&!isAdminProfile){
    const supplied=Number(player?.global_position||0);
    playerDetailPosition.textContent=supplied>0?'#'+supplied:'…';
    if(!supplied&&supabaseClient&&player?.player_id){
      supabaseClient.rpc('get_player_global_position',{p_profile_id:player.player_id}).then(({data,error})=>{
        if(!error&&playerDetailModal?.classList.contains('open')&&currentDetailPlayer?.player_id===player.player_id){
          const pos=Number(data||0);playerDetailPosition.textContent=pos>0?'#'+pos:'—';
        }
      }).catch(()=>{playerDetailPosition.textContent='—'});
    }
  }

  playerDetailName.textContent=displayName;
  playerDetailFlag.textContent=getFlag(country);
  playerDetailCountry.textContent=country;
  playerDetailGameId.textContent=gameId;
  const eloStat=playerDetailElo?.closest('.player-detail-stat');
  const winStat=playerDetailWins?.closest('.player-detail-stat');
  const lossStat=playerDetailLosses?.closest('.player-detail-stat');
  const idStat=playerDetailGameId?.closest('.player-detail-stat');
  if(isAdminProfile){
    if(playerDetailRank)playerDetailRank.hidden=true;
    if(idStat)idStat.hidden=true;
    if(eloStat){eloStat.hidden=true;eloStat.classList.remove('admin-profile-label');const label=eloStat.querySelector('small');if(label)label.textContent='';playerDetailElo.textContent='';}
    if(winStat)winStat.hidden=true;
    if(lossStat)lossStat.hidden=true;
  }else{
    if(idStat)idStat.hidden=false;
    if(eloStat)eloStat.classList.remove('admin-profile-label');
    if(playerDetailRank)playerDetailRank.hidden=false;
    if(eloStat){eloStat.hidden=false;const label=eloStat.querySelector('small');if(label)label.textContent='ELO';playerDetailElo.textContent=String(elo);}
    if(winStat){winStat.hidden=false;const label=winStat.querySelector('small');if(label)label.textContent='VICTORIAS';playerDetailWins.textContent=String(wins);}
    if(lossStat){lossStat.hidden=false;const label=lossStat.querySelector('small');if(label)label.textContent='DERROTAS';playerDetailLosses.textContent=String(losses);}
    if(playerDetailRank){const rankName=playerDetailRank.querySelector('strong');if(rankName)rankName.textContent=rank.name.toUpperCase();}
    renderPlayerDetailRankBadge(rank);
    playerDetailRankBadge.style.cursor='zoom-in';
    playerDetailRankBadge.onclick=event=>{event.stopPropagation();openRankZoom(rank,player);};
    playerDetailRankBadge.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openRankZoom(rank,player);}};
    playerDetailRankBadge.tabIndex=0;
  }

  updateHeartUI(player?.heart_count||0,false,player?.player_id===currentUser?.id);

  playerDetailAvatar.replaceChildren();
  const fallback=document.createElement('span');
  fallback.textContent=displayName.charAt(0)||'J';
  playerDetailAvatar.appendChild(fallback);

  playerDetailModal.classList.add('open');
  playerDetailModal.setAttribute('aria-hidden','false');
  document.body.classList.add('player-detail-open');

  loadPlayerHeartState(player).catch(error=>console.error('Error cargando corazones:',error));
  loadFollowStats(player).catch(error=>console.error('Error cargando seguidores:',error));
  loadProfileComments().catch(error=>console.error('Error cargando comentarios:',error));
  loadPlayerDetailCompetitive(player).catch(error=>console.error('Error cargando historial:',error));

  if(player?.avatar_path&&supabaseClient){
    try{
      const url=await getCachedAvatarUrl(player.avatar_path);
      if(url&&playerDetailModal.classList.contains('open')){
        const img=document.createElement('img');
        img.loading='lazy';img.decoding='async';img.src=url;
        img.alt='Foto de '+displayName;
        img.onload=()=>playerDetailAvatar.replaceChildren(img);
      }
    }catch(error){
      console.error('No se pudo cargar la foto del jugador:',error);
    }
  }
}

function buildRankingRow(player,index,displayPosition=null){
  const row=document.createElement('button');
  row.type='button';
  row.className='ranking-row'+(index===0?' ranking-first':index===1?' ranking-second':index===2?' ranking-third':'');
  row.setAttribute('aria-label','Ver perfil de '+String(player?.username||player?.account_name||'Jugador'));
  row.dataset.playerId=String(player?.player_id||player?.id||'');
  row.addEventListener('click',()=>openRankingPlayer(player));
  
  const position=document.createElement('div');
  position.className='ranking-position';
  if(index<3){
    const medal=document.createElement('span');
    medal.className='ranking-medal ranking-medal-'+(index+1);
    medal.textContent=String(index+1);
    position.appendChild(medal);
  }else{
    position.textContent=String(displayPosition??(index+1));
  }

  const playerCell=document.createElement('div');
  playerCell.className='ranking-player';
  playerCell.appendChild(createRankingAvatar(player));
  const name=document.createElement('span');
  name.className='ranking-player-name';
  name.textContent=String(player?.username||player?.account_name||'Jugador').toUpperCase();
  const sid=String(player?.player_id||player?.id||'');const sv=Number(rankingStreaks.get(sid)||0);if(sv>0){const ss=document.createElement('span');ss.className='ranking-streak';ss.textContent=' +'+sv;ss.title='Racha de '+sv+' victoria'+(sv===1?'':'s');name.appendChild(ss)}
  const od=onlineDotFor(player);if(od)name.appendChild(od);
  playerCell.appendChild(name);
  const countryCell=document.createElement('div');
  countryCell.className='ranking-country';
  const flag=document.createElement('span');
  flag.className='ranking-flag';
  flag.textContent=getFlag(player?.country);
  const countryText=document.createElement('span');
  countryText.className='ranking-country-name';
  countryText.textContent=player?.country||'País';
  countryCell.append(flag,countryText);

  const elo=document.createElement('div');
  elo.className='ranking-elo';
  const eloValue=Number.isFinite(Number(player?.elo_points))?Number(player.elo_points):200;
  const rank=getRankByElo(eloValue);
  const miniRank=document.createElement('button');
  miniRank.type='button';miniRank.className='ranking-elo-rank';miniRank.title='Ver insignia '+rank.name;
  miniRank.addEventListener('click',e=>{e.stopPropagation();openRankZoom(rank,player)});
  applyRankImage(miniRank,rank);
  const eloNumber=document.createElement('span');eloNumber.className='ranking-elo-number';eloNumber.textContent=String(eloValue);eloNumber.classList.toggle('negative-elo',eloValue<0);
  elo.append(miniRank,eloNumber);

  row.append(position,playerCell,countryCell,elo);
  return row;
}

async function refreshRankingStreaks(){if(!supabaseClient||rankingStreaksLoading)return;rankingStreaksLoading=true;try{const {data,error}=await supabaseClient.rpc('get_ranked_current_streaks');if(error)throw error;rankingStreaks=new Map((data||[]).map(x=>[String(x.player_id),Number(x.streak)||0]));renderFilteredRanking();renderGuestRanking()}catch(e){console.error('Rachas:',e)}finally{rankingStreaksLoading=false}}

let latestResultRealtimeChannel=null,latestResultRefreshTimer=null;
function startLatestResultRealtime(){
 if(!supabaseClient||latestResultRealtimeChannel)return;
 latestResultRealtimeChannel=supabaseClient.channel('public-latest-ranking-result')
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'ranked_matches'},payload=>{
   const n=payload?.new||{},o=payload?.old||{};
   // Solo reaccionar cuando el partido realmente termina con ganador y ELO aplicado.
   if(String(n.status||'').toLowerCase()!=='finished'||!n.winner_id||!n.loser_id||!n.finished_at)return;
   if(String(o.status||'').toLowerCase()==='finished'&&String(o.winner_id||'')===String(n.winner_id||''))return;
   if(latestResultRefreshTimer)clearTimeout(latestResultRefreshTimer);
   latestResultRefreshTimer=setTimeout(async()=>{
    try{
     // Una única lectura del snapshot compartido; no sondeo continuo.
     const {data,error}=await supabaseClient.rpc('get_cached_public_home');if(error)throw error;
     const snap=data&&typeof data==='object'?data:{};
     if(snap.latest_result){writePublicCache('ranking8bp_latest_result',snap.latest_result);paintLatestRankingResult(snap.latest_result)}
    }catch(e){console.error('Último resultado Realtime:',e)}
   },350);
  }).subscribe();
}
startLatestResultRealtime();

async function loadLatestRankingResult(){
 const cached=readPublicCache('ranking8bp_latest_result');
 if(cached)paintLatestRankingResult(cached);
 else{
  const boxes=[document.getElementById('latestRankingResult'),document.getElementById('guestLatestRankingResult')].filter(Boolean);
  boxes.forEach(x=>x.textContent='Último resultado disponible al cargar la clasificación');
 }
}

async function loadRanking(){
 if(!rankingList||!rankingCount||!supabaseClient||rankingLoading)return;
 const cached=readPublicCache('ranking8bp_full_ranking');
 if(cached?.length){rankingPlayersCache=cached;renderFilteredRanking()}
 else{rankingList.innerHTML='<div class="ranking-loading">Cargando clasificación...</div>';rankingCount.textContent=''}
 if(cached?.length&&publicCacheFresh('ranking8bp_full_ranking')&&totalRegisteredPlayers>100)return;
 rankingLoading=true;
 try{
  if(cached?.length)await burstJitter();
  const {data,error}=await supabaseClient.rpc('get_cached_public_home');if(error)throw error;
  const snapshot=data&&typeof data==='object'?data:{};
  if(Array.isArray(snapshot.streaks))rankingStreaks=new Map(snapshot.streaks.map(x=>[String(x.player_id),Number(x.streak)||0]));
  const snapshotTotal=Number(snapshot.total_players);if(Number.isFinite(snapshotTotal)){totalRegisteredPlayers=snapshotTotal;try{localStorage.setItem('ranking8bp_real_registered_count',String(snapshotTotal))}catch(_){}}
  rankingPlayersCache=Array.isArray(snapshot.ranking)?snapshot.ranking:[];
  if(snapshot.latest_result){writePublicCache('ranking8bp_latest_result',snapshot.latest_result);paintLatestRankingResult(snapshot.latest_result)};
  writePublicCache('ranking8bp_full_ranking',rankingPlayersCache);
  renderFilteredRanking();
 }catch(error){
  console.error('Error cargando clasificación:',error);
  if(!rankingPlayersCache.length){rankingList.innerHTML='<div class="ranking-loading ranking-error">Servidor ocupado. Toca aquí para reintentar.</div>';rankingList.onclick=()=>{rankingList.onclick=null;loadRanking()}}
 }finally{rankingLoading=false}
}
function renderFilteredRanking(){
  if(!rankingList||!rankingCount)return;
  const query=String(rankingSearchInput?.value||'').trim().toLocaleLowerCase('es');
  const filtered=rankingPlayersCache.filter(player=>{
    const username=String(player?.username||'').toLocaleLowerCase('es');
    const accountName=String(player?.account_name||'').toLocaleLowerCase('es');
    const name=username+' '+accountName;
    return !query||name.includes(query);
  });
  rankingList.replaceChildren();
  rankingCount.textContent=query?filtered.length+' RESULTADOS':'LOS 100 MEJORES DEL MUNDO EN EL RANKING · TOTAL REGISTRADOS: '+(totalRegisteredPlayers||rankingPlayersCache.length);
  if(!filtered.length){
    const empty=document.createElement('div');empty.className='ranking-loading';
    empty.textContent=query?'No se encontró ningún jugador.':'Todavía no hay jugadores registrados.';
    rankingList.appendChild(empty);return;
  }
  filtered.forEach(player=>{
    const originalIndex=rankingPlayersCache.indexOf(player);
    rankingList.appendChild(buildRankingRow(player,originalIndex));
  });
  if(!query&&currentUser&&currentProfile&&currentProfile.is_admin!==true){
    const myId=String(currentUser.id||'');
    const inTop100=rankingPlayersCache.some(p=>String(p?.player_id||p?.id||'')===myId);
    if(!inTop100){
      const mine={...currentProfile,player_id:currentProfile.id||currentUser.id};
      supabaseClient.rpc('get_player_global_position',{p_profile_id:currentUser.id}).then(({data,error})=>{
        if(error||!rankingList||!currentUser||String(currentUser.id)!==myId)return;
        const pos=Number(data||0);if(pos<=100)return;
        const existing=rankingList.querySelector('.ranking-current-player-row');if(existing)existing.remove();
        const row=buildRankingRow(mine,pos-1,pos);row.classList.add('ranking-current-player-row');
        rankingList.appendChild(row);
      }).catch(()=>{});
    }
  }
}

async function getProfile(userId){
  if(!supabaseClient||!userId)return null;
  const {data,error}=await supabaseClient.from('profiles')
    .select('id, username, game_id, account_name, country, screenshot_path, avatar_path, rank_name, elo_points, wins, losses, is_admin, is_moderator, created_at')
    .eq('id',userId).maybeSingle();
  if(error){console.error('Error cargando perfil:',error);return null}
  return data
}

async function restoreSession(){
  if(!cloudReady){return}
  try{
    const {data,error}=await supabaseClient.auth.getSession();
    if(error||!data.session)return;
    const profile=await getProfile(data.session.user.id);
    await setPlayerUI(profile,data.session.user);
  }catch(error){
    console.error('Error restaurando sesión:',error);
  }
}

// Do not force guest mode on every refresh. Supabase persists the session in
// localStorage and restores it automatically. Guest UI is shown only when
// there is genuinely no saved session.
(async()=>{
  if(!cloudReady){document.documentElement.classList.remove('auth-checking');setGuestUI();return}
  let session=null;
  try{
    const result=await supabaseClient.auth.getSession();
    session=result?.data?.session||null;
  }catch(e){console.error('Restaurar sesión inicial:',e);return}
  if(!session){document.documentElement.classList.remove('auth-checking');setGuestUI();return}
  currentUser=session.user;
  // Una sesión válida nunca debe verse como cerrada solo porque el perfil tarde
  // o falle temporalmente al recargar. Conservamos la UI autenticada y reintentamos.
  let profile=null;
  for(let attempt=0;attempt<3&&!profile;attempt++){
    try{profile=await getProfile(session.user.id)}catch(_){}
    if(!profile&&attempt<2)await new Promise(r=>setTimeout(r,450*(attempt+1)));
  }
  if(profile){
    try{await setPlayerUI(profile,session.user)}catch(e){console.error('Cargar UI de sesión:',e)}
    document.documentElement.classList.remove('auth-checking');
    return;
  }
  console.warn('Sesión válida restaurada; perfil pendiente. No se cerrará la sesión.');
  // No llamar setGuestUI(): eso hacía parecer que la sesión se cerraba al actualizar.
  setTimeout(()=>restoreSession(),1200);
})();

loginBtn.addEventListener('click',()=>{loginError.textContent='';openModal(loginModal,loginUsername)});
registerBtn.addEventListener('click',()=>{registerError.textContent='';openModal(registerModal,username)});
if(guestHeroRegisterBtn)guestHeroRegisterBtn.addEventListener('click',()=>registerBtn.click());
closeRegisterModalBtn.addEventListener('click',()=>closeModal(registerModal));
closeLoginModalBtn.addEventListener('click',()=>closeModal(loginModal));
[registerModal,loginModal].forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)closeModal(modal)}));
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal(registerModal);closeModal(loginModal);closeRankingPlayer();settingsMenu.hidden=true}});
backBtn.addEventListener('click',()=>showToast('Perfil del jugador'));
settingsBtn.addEventListener('click',()=>{settingsMenu.hidden=!settingsMenu.hidden});
const editProfileBtn=document.getElementById('editProfileBtn'),editProfileModal=document.getElementById('editProfileModal'),editProfileName=document.getElementById('editProfileName'),editProfileGameId=document.getElementById('editProfileGameId'),editProfileCountry=document.getElementById('editProfileCountry'),editProfilePassword=document.getElementById('editProfilePassword'),editProfileCancel=document.getElementById('editProfileCancel'),editProfileSave=document.getElementById('editProfileSave'),editProfileMessage=document.getElementById('editProfileMessage');
editProfileBtn?.addEventListener('click',()=>{settingsMenu.hidden=true;editProfileName.value=currentProfile?.account_name||currentProfile?.username||'';editProfileGameId.value=currentProfile?.game_id||'';editProfileCountry.value=currentProfile?.country||'';editProfilePassword.value='';editProfileMessage.textContent='';editProfileModal.hidden=false});
editProfileCancel?.addEventListener('click',()=>{editProfileModal.hidden=true});
editProfileModal?.addEventListener('click',e=>{if(e.target===editProfileModal)editProfileModal.hidden=true});
editProfileSave?.addEventListener('click',async()=>{if(!supabaseClient||!currentUser)return;const name=editProfileName.value.trim(),gameId=editProfileGameId.value.trim(),country=editProfileCountry.value.trim(),password=editProfilePassword.value;if(!name||!gameId||!country){editProfileMessage.textContent='Nombre, ID y país son obligatorios.';return}if(password&&password.length<6){editProfileMessage.textContent='La contraseña debe tener al menos 6 caracteres.';return}editProfileSave.disabled=true;editProfileMessage.textContent='Guardando...';try{const {error}=await supabaseClient.rpc('update_my_profile',{p_account_name:name,p_game_id:gameId,p_country:country});if(error)throw error;if(password){const {error:pwError}=await supabaseClient.auth.updateUser({password});if(pwError)throw pwError}const updated=await getProfile(currentUser.id);currentProfile=updated;await setPlayerUI(updated,currentUser);editProfileModal.hidden=true;showToast('Perfil actualizado correctamente.')}catch(e){console.error(e);editProfileMessage.textContent=e?.message||'No se pudo actualizar el perfil.'}finally{editProfileSave.disabled=false}});

if(closePlayerDetail)closePlayerDetail.addEventListener('click',closeRankingPlayer);
if(playerHeartBtn)playerHeartBtn.addEventListener('click',togglePlayerHeart);
if(playerFollowBtn)playerFollowBtn.addEventListener('click',toggleFollow);
if(adminModeBtn)adminModeBtn.addEventListener('click',async()=>{adminPanel.hidden=false;settingsMenu.hidden=true;await loadAdminMatches()});
if(ikarModeratorBtn)ikarModeratorBtn.addEventListener('click',async()=>{adminPanel.hidden=false;if(settingsMenu)settingsMenu.hidden=true;const isIkar=String(currentProfile?.username||'').trim().toLowerCase()==='ikar8bp'&&currentProfile?.is_admin===true;if(adminVsTab)adminVsTab.hidden=false;if(adminPlayersTab)adminPlayersTab.hidden=!isIkar;if(adminModerationTab)adminModerationTab.hidden=!isIkar;if(adminProofsBtn)adminProofsBtn.hidden=false;if(adminPlayerSearch)adminPlayerSearch.hidden=true;if(adminPlayerList)adminPlayerList.hidden=true;if(adminModeration)adminModeration.hidden=true;if(adminMatchList)adminMatchList.hidden=false;await loadAdminMatches()});
if(adminCloseBtn)adminCloseBtn.addEventListener('click',()=>{adminPanel.hidden=true;refreshDynamic().catch(()=>{});setTimeout(()=>refreshDynamic().catch(()=>{}),150)});
if(adminRefreshBtn)adminRefreshBtn.addEventListener('click',()=>{if(adminPlayerList&&!adminPlayerList.hidden)return loadAdminPlayers();adminMatchesCache=[];adminVideosCache=[];loadAdminMatches()});
if(adminVsSearchInput)adminVsSearchInput.addEventListener('input',()=>loadAdminMatches());
if(adminProofsBtn)adminProofsBtn.addEventListener('click',()=>{adminMatchView='proofs';if(adminMatchList)adminMatchList.hidden=false;if(adminPlayerList)adminPlayerList.hidden=true;if(adminPlayerSearch)adminPlayerSearch.hidden=true;if(adminModeration)adminModeration.hidden=true;loadAdminMatches()});
const adminCorrectionsBtn=document.getElementById('adminCorrectionsBtn');
async function loadLastFiveCorrections(){
 if(!adminMatchList||!supabaseClient)return;
 adminMatchView='corrections';adminMatchList.hidden=false;if(adminPlayerList)adminPlayerList.hidden=true;if(adminModeration)adminModeration.hidden=true;
 adminMatchList.innerHTML='<div class="admin-empty">Cargando últimos 5 resultados...</div>';
 const {data,error}=await supabaseClient.rpc('admin_get_last_finished_matches');
 if(error){console.error(error);adminMatchList.innerHTML='<div class="admin-empty">No se pudieron cargar los resultados.</div>';return}
 const rows=Array.isArray(data)?data:[];
 adminMatchList.replaceChildren();
 if(!rows.length){adminMatchList.innerHTML='<div class="admin-empty">No hay resultados para corregir.</div>';return}
 for(const m of rows){
  const card=document.createElement('article');card.className='admin-match finished';
  const winner=m.winner_id===m.player1_id?m.player1_name:m.player2_name;
  const title=document.createElement('strong');title.textContent='#'+m.match_id+' · '+m.player1_name+' VS '+m.player2_name;
  const state=document.createElement('div');state.className='admin-result-title';state.textContent='GANADOR ACTUAL: '+winner;
  const actions=document.createElement('div');actions.className='admin-match-actions';
  for(const [id,name] of [[m.player1_id,m.player1_name],[m.player2_id,m.player2_name]]){
   if(id===m.winner_id)continue;
   const b=document.createElement('button');b.className='admin-winner-btn';b.textContent='CORREGIR: GANA '+name;
   b.onclick=async()=>{if(!confirm('¿Corregir el resultado y poner a '+name+' como ganador? El ELO, victoria y derrota se corregirán automáticamente.'))return;b.disabled=true;const r=await supabaseClient.rpc('admin_correct_ranked_match',{p_match_id:Number(m.match_id),p_winner_id:id});if(r.error){console.error(r.error);showToast('No se pudo corregir el resultado.');b.disabled=false;return}adminMatchesCache=[];showToast('Resultado corregido correctamente.');await loadLastFiveCorrections();loadRanking().catch(()=>{})};
   actions.appendChild(b);
  }
  card.append(title,state,actions);adminMatchList.appendChild(card);
 }
}
adminCorrectionsBtn?.addEventListener('click',loadLastFiveCorrections);
if(adminVsTab)adminVsTab.addEventListener('click',showAdminVs);
if(adminPlayersTab)adminPlayersTab.addEventListener('click',showAdminPlayers);
if(adminModerationTab)adminModerationTab.addEventListener('click',showAdminModeration);
if(dashboardPlayBtn)dashboardPlayBtn.addEventListener('click',async()=>{if(!window.rankingRulesAccepted){window.openRankingRules?.(true);return;}
  // A pending unanswered VS must be reopened directly, never sent through matchmaking.
  try{
    if(currentUser&&supabaseClient){
      const {data:pendingId,error}=await supabaseClient.rpc('get_my_pending_ranked_room');
      if(!error&&Number(pendingId)>0){
        const matchId=Number(pendingId);
        const {data:room,error:roomError}=await supabaseClient.rpc('get_fresh_ranked_room',{p_match_id:matchId});
        if(roomError)throw roomError;
        const m=Array.isArray(room)?room[0]:room;
        if(m){
          currentRankedMatchId=matchId;rankedSearchActive=false;
          const modal=document.getElementById('freshMatchmakingModal'),search=document.getElementById('freshSearching'),vs=document.getElementById('freshVersus');
          if(modal)modal.hidden=false;if(search)search.hidden=true;if(vs)vs.hidden=false;
          document.getElementById('freshMe').textContent=String(m.my_name||'TÚ').toUpperCase();
          document.getElementById('freshOpponent').textContent=String(m.opponent_name||'RIVAL').toUpperCase();
          document.getElementById('freshMyElo').textContent='ELO '+m.my_elo;
          document.getElementById('freshOpponentElo').textContent='ELO '+m.opponent_elo;const ms=document.getElementById('freshMyStreak'),os=document.getElementById('freshOpponentStreak');if(ms){ms.textContent='🔥 RACHA +'+Number(m.my_streak||0);ms.hidden=Number(m.my_streak||0)<=0}if(os){os.textContent='🔥 RACHA +'+Number(m.opponent_streak||0);os.hidden=Number(m.opponent_streak||0)<=0}
          document.getElementById('freshMyId').textContent='ID: '+(m.my_game_id||'NO REGISTRADO');
          document.getElementById('freshOpponentId').textContent='ID: '+(m.opponent_game_id||'NO REGISTRADO');
          const paintAvatar=(el,path,name)=>{if(!el)return;el.replaceChildren();const fallback=()=>{el.replaceChildren();const s=document.createElement('span');s.textContent=String(name||'?').charAt(0).toUpperCase();el.appendChild(s)};if(!path)return fallback();const img=document.createElement('img');let src=String(path).trim();if(!/^https?:\/\//i.test(src)){const clean=src.replace(/^profile-photos\//,'').replace(/^\/+/, '');src=supabaseClient.storage.from('profile-photos').getPublicUrl(clean).data?.publicUrl||''}img.src=src;img.alt=String(name||'Jugador');img.onerror=fallback;el.appendChild(img)};
          const rankFile=(rank)=>{const k=String(rank||'LATÓN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,'_');const a=['LATON','BRONCE_I','BRONCE_II','BRONCE_III','PLATA_I','PLATA_II','PLATA_III','ORO_I','ORO_II','ORO_III','AMATISTA_I','AMATISTA_II','AMATISTA_III','ESMERALDA_I','ESMERALDA_II','ESMERALDA_III','DIAMANTE_I','DIAMANTE_II','DIAMANTE_III','DIAMANTE_NEGRO'];const files=['01_Laton.png','02_Bronce_I.png','03_Bronce_II.png','04_Bronce_III.png','05_Plata_I.png','06_Plata_II.png','07_Plata_III.png','08_Oro_I.png','09_Oro_II.png','10_Oro_III.png','11_Amatista_I.png','12_Amatista_II.png','13_Amatista_III.png','14_Esmeralda_I.png','15_Esmeralda_II.png','16_Esmeralda_III.png','17_Diamante_I.png','18_Diamante_II.png','19_Diamante_III.png','20_Diamante_Negro.png'];return files[Math.max(0,a.indexOf(k))]};
          const paintRank=(el,rank)=>{if(!el)return;el.replaceChildren();const img=document.createElement('img');img.src='assets/ranks/'+rankFile(rank);img.alt=String(rank||'LATÓN');el.appendChild(img)};
          paintAvatar(document.getElementById('freshMyAvatar'),m.my_avatar_path,m.my_name);
          paintAvatar(document.getElementById('freshOpponentAvatar'),m.opponent_avatar_path,m.opponent_name);
          renderRankBadgeOn(document.getElementById('freshOpponentRankBadge'),Number(m.opponent_elo)||0);
          
          document.getElementById('freshMyRank').textContent=String(m.my_rank_name||'LATÓN').toUpperCase();
          document.getElementById('freshOpponentRank').textContent=String(m.opponent_rank_name||'LATÓN').toUpperCase();
          document.getElementById('freshMyPosition').textContent='RANKING #'+(m.my_position||'--');
          document.getElementById('freshOpponentPosition').textContent='RANKING #'+(m.opponent_position||'--');
          await restorePersistentFreshRoom(matchId);
          startFreshRankedRoom(matchId,Number(m.chat_seconds_left??0));
          setTimeout(()=>restorePersistentFreshRoom(matchId),50);
          return;
        }
      }
    }
  }catch(e){console.error('Regresar a sala pendiente:',e);showToast('No se pudo recuperar la sala. Intenta nuevamente.');return}
  await startRankedMatchmaking();
});
if(matchmakingClose)matchmakingClose.addEventListener('click',()=>currentRankedMatchId?leaveRankedRoom():closeRankedMatchmaking());
const leaveRankedRoomBtn=document.getElementById('leaveRankedRoomBtn');
if(leaveRankedRoomBtn)leaveRankedRoomBtn.addEventListener('click',leaveRankedRoom);
if(rankedWinnerVideoBtn)rankedWinnerVideoBtn.addEventListener('click',()=>rankedWinnerVideoInput?.click());
if(rankedWinnerVideoInput)rankedWinnerVideoInput.addEventListener('change',uploadRankedWinnerVideo);
if(rankedVideoClose)rankedVideoClose.addEventListener('click',closeAdminRankedVideo);
if(rankedVideoModal)rankedVideoModal.addEventListener('click',e=>{if(e.target===rankedVideoModal)closeAdminRankedVideo()});
if(rankedVideoPlayer)rankedVideoPlayer.addEventListener('click',e=>e.stopPropagation());
if(eloDailyLimitClose)eloDailyLimitClose.addEventListener('click',closeEloDailyLimit);
if(abandonRankedBtn)abandonRankedBtn.addEventListener('click',abandonRankedMatch);
if(playerMessageBtn)playerMessageBtn.addEventListener('click',openPrivateMessage);
if(playerPlayBtn)playerPlayBtn.addEventListener('click',()=>showToast('Próximamente podrás desafiar a este jugador.'));
if(privateMessageClose)privateMessageClose.addEventListener('click',closePrivateMessage);
if(privateMessageSend)privateMessageSend.addEventListener('click',sendPrivateMessage);
if(privateMessageModal)privateMessageModal.addEventListener('click',e=>{if(e.target===privateMessageModal)closePrivateMessage()});
if(profileCommentForm)profileCommentForm.addEventListener('submit',submitProfileComment);
function renderInbox(items){
 if(!inboxList)return;inboxList.replaceChildren();inboxMessagesCache=items||[];
 if(!items.length){inboxList.innerHTML='<div class="notification-empty">No tienes mensajes.</div>';return}
 const conversations=new Map();
 items.forEach(m=>{const incoming=m.recipient_id===currentUser?.id;const otherId=incoming?m.sender_id:m.recipient_id;const otherName=incoming?m.sender_name:m.recipient_name;if(!conversations.has(otherId))conversations.set(otherId,{id:otherId,name:otherName,last:m,unread:0});if(incoming&&!m.is_read)conversations.get(otherId).unread++});
 conversations.forEach(c=>{
  const item=document.createElement('button');item.type='button';item.className='notification-item inbox-message'+(c.unread?' unread':'');
  const icon=document.createElement('span');icon.className='notification-type-icon';icon.textContent='💬';
  const box=document.createElement('div');box.className='notification-copy';const p=document.createElement('p');const b=document.createElement('b');b.textContent=String(c.name||'Jugador');p.append(b,document.createElement('br'),document.createTextNode(String(c.last.body||'')));
  const t=document.createElement('time');t.textContent=formatCommentDate(c.last.created_at);box.append(p,t);item.append(icon,box);item.addEventListener('click',()=>openConversation(c.id,c.name));inboxList.appendChild(item);
 });
}
async function openConversation(userId,userName){
 activeConversationUser={id:userId,name:userName};if(inboxPanel)inboxPanel.hidden=true;if(conversationPanel)conversationPanel.hidden=false;if(conversationTitle)conversationTitle.textContent=String(userName||'Jugador').toUpperCase();renderConversation();
 if(currentUser&&supabaseClient){
  const unread=inboxMessagesCache.filter(m=>m.sender_id===userId&&m.recipient_id===currentUser.id&&!m.is_read);
  if(unread.length){
   const ids=unread.map(m=>m.message_id).filter(Boolean);
   if(ids.length){const {error}=await supabaseClient.from('private_messages').update({is_read:true}).eq('recipient_id',currentUser.id).in('id',ids);if(error)console.error('Marcar conversación leída:',error)}
   unread.forEach(m=>m.is_read=true);renderInbox(inboxMessagesCache);await refreshInboxBadge();
  }
 }
}
function renderConversation(){
 if(!conversationMessages||!activeConversationUser)return;conversationMessages.replaceChildren();
 const msgs=inboxMessagesCache.filter(m=>(m.sender_id===activeConversationUser.id&&m.recipient_id===currentUser.id)||(m.sender_id===currentUser.id&&m.recipient_id===activeConversationUser.id)).slice().reverse();
 msgs.forEach(m=>{const bubble=document.createElement('div');bubble.className='conversation-bubble '+(m.sender_id===currentUser.id?'mine':'theirs');const body=document.createElement('p');body.textContent=m.body;const time=document.createElement('time');time.textContent=formatCommentDate(m.created_at);bubble.append(body,time);conversationMessages.appendChild(bubble)});
 conversationMessages.scrollTop=conversationMessages.scrollHeight;
}
async function sendConversationMessage(){
 const body=conversationInput?.value.trim();if(!body||!activeConversationUser||!currentUser||!supabaseClient)return;conversationSendBtn.disabled=true;
 try{const {data:sent,error}=await supabaseClient.from('private_messages').insert({sender_id:currentUser.id,recipient_id:activeConversationUser.id,body}).select('id').single();if(error)throw error;if(sent?.id)supabaseClient.functions.invoke('send-private-push',{body:{message_id:sent.id}}).catch(console.error);conversationInput.value='';await loadInbox();renderConversation()}catch(e){console.error(e);showToast('No se pudo enviar el mensaje.')}finally{conversationSendBtn.disabled=false}
}
function updateInboxBadge(count){if(!inboxBadge)return;const n=Number(count)||0;inboxBadge.textContent=n>99?'99+':String(n);inboxBadge.hidden=n<1}
async function refreshInboxBadge(){if(!currentUser||!supabaseClient){updateInboxBadge(0);return}try{const {data,error}=await supabaseClient.rpc('get_my_private_messages');if(error)throw error;const items=Array.isArray(data)?data:[];updateInboxBadge(items.filter(m=>m.recipient_id===currentUser.id&&!m.is_read).length)}catch(e){console.error('Contador mensajes:',e)}}
async function loadInbox(){
 if(!currentUser||!supabaseClient||!inboxList)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_my_private_messages');if(error)throw error;
  const items=Array.isArray(data)?data:[];inboxMessagesCache=items;renderInbox(items);
  const unread=items.filter(m=>m.recipient_id===currentUser.id&&!m.is_read);
  updateInboxBadge(unread.length);
 }catch(e){console.error(e);inboxList.innerHTML='<div class="notification-empty">No se pudo cargar la bandeja.</div>'}
}
async function toggleInbox(){
 if(!inboxPanel)return;const opening=inboxPanel.hidden;closeHeaderMenus(inboxPanel);inboxPanel.hidden=!opening;if(opening)await loadInbox();
}
function closeHeaderMenus(except=null){
  const menus=[inboxPanel,conversationPanel,notificationPanel,activityPanel,settingsMenu];
  menus.forEach(menu=>{if(menu&&menu!==except)menu.hidden=true});
}
document.addEventListener('click',event=>{
  const insideNotification=notificationPanel?.contains(event.target)||notificationBtn?.contains(event.target);
  const insideActivity=activityPanel?.contains(event.target)||activityBtn?.contains(event.target);
  const insideSettings=settingsMenu?.contains(event.target)||settingsBtn?.contains(event.target);
  const insideInbox=inboxPanel?.contains(event.target)||inboxBtn?.contains(event.target);
  const insideConversation=conversationPanel?.contains(event.target);
  if(!insideNotification&&!insideActivity&&!insideSettings&&!insideInbox&&!insideConversation)closeHeaderMenus();
});
if(inboxBtn)inboxBtn.addEventListener('click',toggleInbox);
if(refreshInboxBtn)refreshInboxBtn.addEventListener('click',loadInbox);
if(conversationSendBtn)conversationSendBtn.addEventListener('click',sendConversationMessage);
if(conversationBackBtn)conversationBackBtn.addEventListener('click',()=>{conversationPanel.hidden=true;inboxPanel.hidden=false});
if(conversationCloseBtn)conversationCloseBtn.addEventListener('click',()=>{conversationPanel.hidden=true});
if(notificationBtn)notificationBtn.addEventListener('click',toggleNotifications);
if(activityBtn)activityBtn.addEventListener('click',toggleGlobalActivity);
if(refreshActivityBtn)refreshActivityBtn.addEventListener('click',loadGlobalActivity);
if(markNotificationsRead)markNotificationsRead.addEventListener('click',markAllNotificationsRead);
let notificationRefreshTimer=null;
function startNotificationRefresh(){
  if(notificationRefreshTimer)clearInterval(notificationRefreshTimer);
  if(currentUser){
    loadNotifications().catch(()=>{});
    notificationRefreshTimer=setInterval(()=>{if(currentUser&&!document.hidden)loadNotifications().catch(()=>{})},180000);
  }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&currentUser){loadNotifications().catch(()=>{});updateRankedDailyStatus().catch(()=>{})}});
window.addEventListener('pageshow',()=>{if(currentUser){updateRankedDailyStatus().catch(()=>{})}});
window.addEventListener('focus',()=>{if(currentUser)updateRankedDailyStatus().catch(()=>{})});
async function restoreActiveRankedVs(){
 if(!currentUser||!supabaseClient)return;
 try{
   const {data,error}=await supabaseClient.rpc('get_my_active_ranked_match');
   if(error)throw error;
   const m=Array.isArray(data)?data[0]:data;
   if(!m?.match_id)return;
   const {data:leftRoom}=await supabaseClient.rpc('has_left_ranked_room',{p_match_id:Number(m.match_id)});
   if(leftRoom===true)return;
   if(matchmakingModal)matchmakingModal.hidden=false;
   showRankedMatch(m);
   startRankedVsChat(m);
 }catch(e){console.error('Restaurar VS activo:',e)}
}
setTimeout(startNotificationRefresh,6000+Math.floor(Math.random()*6000));
// Show live player activity immediately; keep later refreshes light to avoid DB load.
refreshOnlinePlayers(true).catch(()=>{});
refreshPlayersPlayingCount(true).catch(()=>{});
setTimeout(()=>{startOnlinePresence()},1500);
setInterval(()=>{if(!document.hidden){refreshOnlinePlayers().catch(()=>{});refreshPlayersPlayingCount().catch(()=>{})}},180000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshOnlinePlayers().catch(()=>{});refreshPlayersPlayingCount().catch(()=>{});if(currentUser)touchOnlinePresence()}});
if(playerDetailModal)playerDetailModal.addEventListener('click',event=>{if(event.target===playerDetailModal)closeRankingPlayer()});

profilePhotoInput.addEventListener('change',async()=>{
  dashboardMessage.textContent='';const file=profilePhotoInput.files?.[0];
  if(!file||!currentUser||!supabaseClient)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){dashboardMessage.textContent='La foto debe ser JPG, PNG o WEBP.';profilePhotoInput.value='';return}
  if(file.size>5*1024*1024){dashboardMessage.textContent='La foto no puede pesar más de 5 MB.';profilePhotoInput.value='';return}

  if(avatarPreviewUrl)URL.revokeObjectURL(avatarPreviewUrl);
  avatarPreviewUrl=URL.createObjectURL(file);profileAvatar.src=avatarPreviewUrl;profileAvatar.hidden=false;avatarPlaceholder.hidden=true;

  try{
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
    const newPath=currentUser.id+'/avatar-'+Date.now()+'.'+ext;
    const {error:uploadError}=await supabaseClient.storage.from('profile-photos').upload(newPath,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
    if(uploadError)throw uploadError;
    const oldPath=currentProfile?.avatar_path||null;
    const {data:updatedProfile,error:updateError}=await supabaseClient.from('profiles').update({avatar_path:newPath}).eq('id',currentUser.id)
      .select('id, username, game_id, account_name, country, screenshot_path, avatar_path, rank_name, elo_points, wins, losses, created_at').single();
    if(updateError)throw updateError;
    if(oldPath&&oldPath!==newPath)await supabaseClient.storage.from('profile-photos').remove([oldPath]);
    currentProfile=updatedProfile;profilePhotoInput.value='';await loadAvatar(newPath);showToast('Foto de perfil actualizada.')
  }catch(error){console.error(error);dashboardMessage.textContent='No se pudo guardar la foto de perfil.'}
});

registerForm.addEventListener('submit',async event=>{
  event.preventDefault();registerError.textContent='';
  if(!cloudReady){registerError.textContent='La nube todavía no está configurada.';return}

  const usernameValue=username.value.trim(),passwordValue=password.value,idValue=gameId.value.trim(),countryValue=country.value.trim();
  if(!validUsername(usernameValue)){registerError.textContent='El usuario solo puede tener letras, números, punto, guion o guion bajo.';return}
  if(usernameValue.toLowerCase().includes('ikar')){registerError.textContent='No está permitido usar IKAR en ninguna parte del nombre o usuario.';return}
  if(passwordValue.length<6){registerError.textContent='La contraseña debe tener al menos 6 caracteres.';return}
  if(!idValue||!countryValue){registerError.textContent='Completa todos los datos.';return}

  setRegisterBusy(true);
  try{
    registerSubmit.textContent='Creando cuenta...';
    const {data:registerData,error:registerFunctionError}=await supabaseClient.functions.invoke('register-user',{body:{username:usernameValue,password:passwordValue}});
    if(registerFunctionError||!registerData?.ok){let serverMsg=registerData?.error||'';if(!serverMsg&&registerFunctionError?.context){try{const response=registerFunctionError.context;const payload=typeof response?.json==='function'?await response.clone().json():null;serverMsg=payload?.error||''}catch(_){}}if(!serverMsg)serverMsg=registerFunctionError?.message||'';throw new Error(serverMsg||'No se pudo crear la cuenta.')}

    const {data:loginData,error:loginAfterRegisterError}=await supabaseClient.auth.signInWithPassword({email:usernameToInternalEmail(usernameValue),password:passwordValue});
    if(loginAfterRegisterError||!loginData?.session||!loginData?.user)throw new Error('La cuenta se creó, pero no se pudo iniciar la sesión automáticamente.');

    const userId=loginData.user.id;
    const {data:newProfile,error:profileError}=await supabaseClient.from('profiles').insert({
      id:userId,username:normalizeUsername(usernameValue),game_id:idValue,account_name:usernameValue.trim(),country:countryValue,screenshot_path:null,avatar_path:null
    }).select('id, username, game_id, account_name, country, screenshot_path, avatar_path, rank_name, elo_points, wins, losses, created_at').single();
    if(profileError)throw new Error('No se pudo guardar el perfil: '+profileError.message);

    registerForm.reset();closeModal(registerModal);await setPlayerUI(newProfile,loginData.user);showToast('Cuenta creada. Rango inicial: Latón · ELO 0.')
  }catch(error){console.error(error);registerError.textContent=error?.message||'No se pudo crear la cuenta.'}
  finally{setRegisterBusy(false)}
});

loginForm.addEventListener('submit',async event=>{
  event.preventDefault();loginError.textContent='';
  if(!cloudReady){loginError.textContent='La nube todavía no está configurada.';return}
  const usernameValue=loginUsername.value.trim(),passwordValue=loginPassword.value;
  if(!usernameValue||!passwordValue){loginError.textContent='Escribe tu usuario y contraseña.';return}

  setLoginBusy(true);
  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({email:usernameToInternalEmail(usernameValue),password:passwordValue});
    if(error||!data.session)throw new Error('Usuario o contraseña incorrectos.');
    const profile=await getProfile(data.user.id);
    try{let deviceId=localStorage.getItem('ranking8bp_device_id');if(!deviceId){deviceId=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));localStorage.setItem('ranking8bp_device_id',deviceId)}const bytes=new TextEncoder().encode(deviceId);const digest=await crypto.subtle.digest('SHA-256',bytes);const deviceHash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');await supabaseClient.rpc('claim_my_registration_device',{p_device_hash:deviceHash})}catch(e){console.warn('No se pudo vincular el dispositivo',e)}
    loginForm.reset();closeModal(loginModal);setLoginBusy(false);showToast('Sesión iniciada correctamente.');setPlayerUI(profile,data.user).catch(e=>console.error('Carga posterior al login:',e))
  }catch(error){console.error(error);loginError.textContent=error?.message||'No se pudo iniciar sesión.'}
  finally{setLoginBusy(false)}
});

logoutBtn.addEventListener('click',async()=>{explicitLogoutRequested=true;settingsMenu.hidden=true;clearInterval(onlinePresenceTimer);onlinePresenceTimer=null;if(supabaseClient)await supabaseClient.auth.signOut();setGuestUI();explicitLogoutRequested=false;showToast('Sesión cerrada.')});

if(deleteAccountBtn)deleteAccountBtn.addEventListener('click',async()=>{
  settingsMenu.hidden=true;
  if(!supabaseClient||!currentUser){showToast('No hay una sesión activa.');return}

  const confirmed=window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.');
  if(!confirmed)return;

  const confirmedAgain=window.confirm('ÚLTIMA CONFIRMACIÓN: se eliminarán tu cuenta, perfil, ELO, estadísticas, corazones y fotos asociadas. ¿Eliminar definitivamente?');
  if(!confirmedAgain)return;

  deleteAccountBtn.disabled=true;
  dashboardMessage.textContent='Eliminando cuenta...';

  try{
    const pathsByBucket={};
    if(currentProfile?.avatar_path)(pathsByBucket['profile-photos']??=[]).push(currentProfile.avatar_path);
    if(currentProfile?.screenshot_path)(pathsByBucket['account-captures']??=[]).push(currentProfile.screenshot_path);

    for(const [bucket,paths] of Object.entries(pathsByBucket)){
      if(paths.length){
        const {error:storageError}=await supabaseClient.storage.from(bucket).remove(paths);
        if(storageError)console.warn('No se pudo borrar un archivo de '+bucket+':',storageError);
      }
    }

    const {error}=await supabaseClient.rpc('delete_my_account');
    if(error)throw error;

    await supabaseClient.auth.signOut().catch(()=>{});
    setGuestUI();
    showToast('Tu cuenta fue eliminada permanentemente.');
  }catch(error){
    console.error('Error eliminando cuenta:',error);
    dashboardMessage.textContent='No se pudo eliminar la cuenta. Inténtalo de nuevo.';
    showToast('No se pudo eliminar la cuenta.');
  }finally{
    deleteAccountBtn.disabled=false;
  }
});

if(cloudReady){
  supabaseClient.auth.onAuthStateChange(async(event,session)=>{
    // Never throw a player back to guest mode because Supabase temporarily
    // failed to restore/refresh a session. Only an explicit SIGNED_OUT event
    // is allowed to close the UI session.
    if(event==='SIGNED_OUT'){if(explicitLogoutRequested){setGuestUI()}return}
    if(!session)return;
    if(event==='TOKEN_REFRESHED'){currentUser=session.user;return}
    if(event==='SIGNED_IN'||event==='INITIAL_SESSION'){
      const uid=String(session.user.id||'');
      if((currentUser?.id===session.user.id&&currentProfile)||playerUiLoadingFor===uid||playerUiReadyFor===uid)return;
      try{
        const profile=await getProfile(session.user.id);
        await setPlayerUI(profile,session.user);
      }catch(error){
        console.error('Recuperar sesión/perfil:',error);
      }
    }
  })
}
setTimeout(()=>{if(guestEmpty&&!guestEmpty.hidden)renderGuestRankShowcase().catch(()=>{})},300);

const PUSH_VAPID_PUBLIC='BJ5JeRALHigbb-mAs1abfCn1vpMo8Z4QI2puRD2PXcM8MLRXEqeRMfbfW0NNugIkrN3xilbKXhuFNmUrX-8ptIs';
const pushEnableBtn=document.getElementById('pushEnableBtn');
function vapidBytes(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(x=>x.charCodeAt(0)))}
async function enablePushNotifications(){
 if(!currentUser){showToast('Inicia sesión primero.');return}
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){showToast('Este navegador no permite notificaciones push.');return}
 try{const permission=await Notification.requestPermission();if(permission!=='granted'){showToast('Debes permitir las notificaciones.');return}const reg=await navigator.serviceWorker.register('./sw.js?v=1');await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(PUSH_VAPID_PUBLIC)});const j=sub.toJSON();const {error}=await supabaseClient.from('push_subscriptions').upsert({user_id:currentUser.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth},{onConflict:'endpoint'});if(error)throw error;pushEnableBtn.textContent='🔔 NOTIFICACIONES ACTIVADAS';pushEnableBtn.classList.add('enabled');showToast('Notificaciones activadas en este dispositivo.')}catch(e){console.error(e);showToast('No se pudieron activar las notificaciones.')}
}
pushEnableBtn?.addEventListener('click',enablePushNotifications);

let mainRankingSearchTimer=null;
if(rankingSearchInput) rankingSearchInput.addEventListener('input',()=>{
 clearTimeout(mainRankingSearchTimer);
 mainRankingSearchTimer=setTimeout(async()=>{
  const q=String(rankingSearchInput.value||'').trim();
  if(!q){renderFilteredRanking();return}
  if(!supabaseClient||!rankingList)return;
  rankingList.innerHTML='<div class="ranking-loading">Buscando en todos los jugadores...</div>';
  const {data,error}=await supabaseClient.rpc('search_all_ranking_players',{p_query:q});
  if(error){console.error('Búsqueda global:',error);renderFilteredRanking();return}
  const rows=Array.isArray(data)?data:[];
  rankingList.replaceChildren();rankingCount.textContent=rows.length+' RESULTADOS EN TODOS LOS REGISTRADOS';
  if(!rows.length){rankingList.innerHTML='<div class="ranking-loading">No se encontró ningún jugador.</div>';return}
  rows.forEach(p=>rankingList.appendChild(buildRankingRow(p,Math.max(0,Number(p.global_position||1)-1),Number(p.global_position||1))));
 },180);
});

if(guestRankingSearchInput)guestRankingSearchInput.addEventListener('input',renderGuestRanking);

/* Fresh matchmaking room controls */
document.addEventListener('click',async e=>{if(e.target?.id==='freshMatchmakingClose'){
 const wasSearching=rankedSearchActive&&!freshRoomMatchId;
 rankedSearchActive=false;stopRankedSearchLoop();stopFreshRoomRealtime().catch(()=>{});
 // Salir mientras BUSCA debe retirar la cola en servidor antes de ocultar la ventana.
 if(wasSearching&&currentUser&&supabaseClient){
  try{
   await Promise.allSettled([
    supabaseClient.rpc('set_ranked_search_presence',{p_searching:false}),
    supabaseClient.rpc('matchmaking_v2_cancel')
   ]);
  }catch(err){console.error('Cancelar búsqueda:',err)}
 }
 const m=document.getElementById('freshMatchmakingModal');if(m)m.hidden=true;
}});

let freshRoomTimer=null,freshRoomChatPoll=null,freshRoomMatchId=null,freshRoomExpiresAt=0,freshRoomRealtimeChannel=null,freshRoomRealtimeRefreshTimer=null;
async function stopFreshRoomRealtime(){
 if(freshRoomRealtimeRefreshTimer){clearTimeout(freshRoomRealtimeRefreshTimer);freshRoomRealtimeRefreshTimer=null}
 const channel=freshRoomRealtimeChannel;freshRoomRealtimeChannel=null;
 if(channel&&supabaseClient){try{await supabaseClient.removeChannel(channel)}catch(e){console.error('Realtime sala VS stop:',e)}}
}
function queueFreshRoomRealtimeRefresh(kind){
 if(freshRoomRealtimeRefreshTimer)return;
 freshRoomRealtimeRefreshTimer=setTimeout(async()=>{
  freshRoomRealtimeRefreshTimer=null;
  if(document.hidden||!freshRoomMatchId)return;
  try{
   if(kind==='chat')await loadFreshRankedChat();
   else{await restorePersistentFreshRoom(freshRoomMatchId);await loadFreshRankedChat()}
  }catch(e){console.error('Realtime sala VS:',e)}
 },100);
}
let freshLastIncomingSoundId=null;
let freshChatAudioCtx=null;
function unlockFreshChatAudio(){
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
  if(!freshChatAudioCtx)freshChatAudioCtx=new AudioCtx();
  if(freshChatAudioCtx.state==='suspended')freshChatAudioCtx.resume().catch(()=>{});
  if(freshChatAudioCtx.state==='running'){
   const o=freshChatAudioCtx.createOscillator(),g=freshChatAudioCtx.createGain();g.gain.value=.00001;o.connect(g);g.connect(freshChatAudioCtx.destination);o.start();o.stop(freshChatAudioCtx.currentTime+.01);
  }
 }catch(_){}
}
['pointerdown','touchstart','click','keydown'].forEach(ev=>document.addEventListener(ev,unlockFreshChatAudio,{passive:true}));
function playFreshIncomingChatSound(row){
 if(!row||String(row.sender_id)===String(currentUser?.id)||row.is_admin)return;
 const id=String(row.id??'');if(id&&freshLastIncomingSoundId===id)return;if(id)freshLastIncomingSoundId=id;
 try{if(typeof navigator.vibrate==='function')navigator.vibrate([140,70,140]);}catch(_){}
 try{
  unlockFreshChatAudio();const ctx=freshChatAudioCtx;if(!ctx||ctx.state!=='running')return;
  const now=ctx.currentTime;
  [[880,0,.13],[1174,.15,.32]].forEach(([hz,start,end])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,now+start);g.gain.exponentialRampToValueAtTime(.45,now+start+.015);g.gain.exponentialRampToValueAtTime(.0001,now+end);o.connect(g);g.connect(ctx.destination);o.start(now+start);o.stop(now+end+.01);});
 }catch(_){}
}
async function startFreshRoomRealtime(matchId){
 const id=Number(matchId||0);if(!id||!supabaseClient)return;
 await stopFreshRoomRealtime();
 if(Number(freshRoomMatchId)!==id)return;
 const channel=supabaseClient.channel('fresh-vs-'+id+'-'+String(currentUser?.id||'guest')+'-'+Date.now())
  .on('postgres_changes',{event:'*',schema:'public',table:'ranked_matches',filter:'id=eq.'+id},()=>queueFreshRoomRealtimeRefresh('match'))
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'ranked_match_messages',filter:'match_id=eq.'+id},payload=>{
   const row=payload?.new;
   if(row&&Number(row.match_id)===id){
    playFreshIncomingChatSound(row);
    const box=document.getElementById('freshChatMessages');
    if(box&&!box.querySelector('[data-chat-id="'+String(row.id)+'"]')){
     const d=document.createElement('div');d.dataset.chatId=String(row.id);d.className='ranked-vs-chat-message'+(String(row.sender_id)===String(currentUser?.id)?' mine':'');
     const n=document.createElement('strong');
     if(String(row.sender_id)===String(currentUser?.id)) n.textContent=String(currentProfile?.account_name||currentProfile?.username||'TÚ');
     else n.textContent=String(document.getElementById('freshOpponent')?.textContent||'JUGADOR').trim();
     const b=document.createElement('p');b.textContent=row.message||'';d.append(n,b);box.appendChild(d);box.scrollTop=box.scrollHeight;
    }
   }
   queueFreshRoomRealtimeRefresh('chat');
  })
;
 freshRoomRealtimeChannel=channel;
 channel.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.error('Realtime sala VS:',status)});
}
async function loadFreshRankedChat(){
 if(!freshRoomMatchId||!supabaseClient)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_ranked_match_chat',{p_match_id:Number(freshRoomMatchId)});if(error)throw error;
  const rows=Array.isArray(data)?data:[];
  const incomingRows=rows.filter(m=>String(m.sender_id)!==String(currentUser?.id)&&!m.is_admin);
  const newestIncoming=incomingRows.length?incomingRows[incomingRows.length-1]:null;
  if(newestIncoming){
   const incomingId=String(newestIncoming.id??'');
   if(freshLastIncomingSoundId===null){freshLastIncomingSoundId=incomingId;}
   else if(incomingId&&incomingId!==freshLastIncomingSoundId){playFreshIncomingChatSound(newestIncoming);}
  }
  const hasUnreadIncoming=rows.some(m=>String(m.sender_id)!==String(currentUser?.id)&&!m.is_admin&&!m.read_by_other);
  if(hasUnreadIncoming){try{await supabaseClient.rpc('mark_ranked_match_chat_read',{p_match_id:Number(freshRoomMatchId)})}catch(_){}}
  const box=document.getElementById('freshChatMessages');if(!box)return;box.replaceChildren();
  const senders=new Set();
  rows.forEach(m=>{
   if(m.sender_id&&!m.is_admin)senders.add(String(m.sender_id));
   const mine=String(m.sender_id)===String(currentUser?.id);
   const d=document.createElement('div');d.className='ranked-vs-chat-message'+(mine?' mine':'')+(m.is_admin?' admin':'');
   const avatar=document.createElement('span');avatar.className='fresh-chat-avatar';
   const sourceAvatar=mine?document.querySelector('#freshMyAvatar img'):document.querySelector('#freshOpponentAvatar img');
   if(sourceAvatar?.src){const ai=document.createElement('img');ai.src=sourceAvatar.src;ai.alt=String(m.sender_name||'Jugador');avatar.appendChild(ai)}
   else{avatar.textContent=String(m.sender_name||'J').charAt(0).toUpperCase()}
   const content=document.createElement('div');content.className='fresh-chat-message-content';
   const n=document.createElement('strong');n.textContent=(m.is_admin?'ADMIN · ':'')+String(m.sender_name||'Jugador');
   if(!mine&&!m.is_admin&&m.sender_id){
    const openChatPlayerProfile=async(e)=>{e?.preventDefault?.();e?.stopPropagation?.();try{const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:m.sender_id});if(error)throw error;const p=Array.isArray(data)?data[0]:data;if(p)openRankingPlayer({...p,id:p.player_id,player_id:p.player_id});else showToast('No se pudo abrir el perfil.')}catch(err){console.error('Abrir perfil desde chat VS:',err);showToast('No se pudo abrir el perfil.')}};
    avatar.classList.add('fresh-chat-profile-link');avatar.setAttribute('role','button');avatar.tabIndex=0;avatar.title='Ver perfil de '+String(m.sender_name||'Jugador');
    n.classList.add('fresh-chat-profile-link');n.setAttribute('role','button');n.tabIndex=0;n.title='Ver perfil de '+String(m.sender_name||'Jugador');
    avatar.addEventListener('click',openChatPlayerProfile);n.addEventListener('click',openChatPlayerProfile);
    avatar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChatPlayerProfile(e)}});
    n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChatPlayerProfile(e)}});
   }
   const body=document.createElement('p');body.textContent=m.message||'';
   content.append(n,body);d.append(avatar,content);
   if(String(m.sender_id)===String(currentUser?.id)||m.is_admin){const seen=document.createElement('small');seen.className='fresh-chat-seen';seen.textContent=m.read_by_other?'✓✓ LEÍDO':'✓ ENVIADO';d.appendChild(seen)}
   box.appendChild(d);
  });
  // Mantener siempre visible el mensaje más reciente del VS.
  const lastMessage=box.lastElementChild;
  if(lastMessage){requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;});}
  const bothMessaged=senders.size>=2;
  const abandon=document.getElementById('freshAbandonPending');if(abandon)abandon.hidden=bothMessaged;
  if(bothMessaged){
   clearInterval(freshRoomTimer);freshRoomTimer=null;
   const w=document.getElementById('freshResponseWarning');if(w)w.hidden=true;
   const chat=document.getElementById('freshRankedChat');if(chat)chat.classList.add('fresh-chat-top');
   const ready=document.getElementById('freshReadyActions');if(ready){ready.hidden=false;ready.classList.add('fresh-actions-chat-place')}
   const results=document.getElementById('freshResultActions');if(results)results.hidden=false;
  }
 }catch(e){console.error('Chat sala nueva:',e)}
}
async function sendFreshRankedChat(){
 const input=document.getElementById('freshChatInput'),btn=document.getElementById('freshChatSend'),msg=String(input?.value||'').trim();
 if(!msg||!freshRoomMatchId||!supabaseClient)return;
 if(btn)btn.disabled=true;
 try{
  const {error}=await supabaseClient.rpc('send_ranked_match_chat',{p_match_id:Number(freshRoomMatchId),p_message:msg});if(error)throw error;
  input.value='';
  await loadFreshRankedChat();
 }catch(e){console.error('Enviar chat sala:',e);showToast('No se pudo enviar el mensaje.')}
 finally{if(btn)btn.disabled=false;if(input){input.focus({preventScroll:true})}}
}
async function restorePersistentFreshRoom(id){
 try{
  const {data,error}=await supabaseClient.rpc('get_my_ranked_room_state');if(error)throw error;
  const st=Array.isArray(data)?data[0]:data;if(!st||Number(st.match_id)!==Number(id))return;
  if(String(st.status)==='review'||st.both_messaged||st.opponent_claim){
   clearInterval(freshRoomTimer);freshRoomTimer=null;
   const warning=document.getElementById('freshResponseWarning');if(warning)warning.hidden=true;
   const abandon=document.getElementById('freshAbandonPending');if(abandon){abandon.hidden=true;abandon.disabled=true}
   const leave=document.getElementById('freshLeaveRoom');if(leave){leave.hidden=true;leave.disabled=true}
   const ready=document.getElementById('freshReadyActions');if(ready){ready.hidden=false;ready.classList.add('fresh-actions-chat-place')}
   const results=document.getElementById('freshResultActions');if(results)results.hidden=false;
   if(st.my_claim==='WON'){const evidence=document.getElementById('freshEvidenceBox');if(evidence)evidence.hidden=false;const readyBox=document.getElementById('freshReadyActions');if(readyBox)readyBox.hidden=true;}
   const input=document.getElementById('freshChatInput');if(input)input.disabled=false;
   const send=document.getElementById('freshChatSend');if(send)send.disabled=false;
   const rs=document.getElementById('freshResultStatus');if(rs)rs.textContent=String(st.status)==='review'?'Tu rival envió evidencia. Indica GANÉ, PERDÍ o NADIE HIZO TRICKSHOT.':'Indica GANÉ, PERDÍ o NADIE HIZO TRICKSHOT.';
   if(st.opponent_claim && (String(st.status)==='review' || st.opponent_claim!=='WON' || st.opponent_left)){
    const chat=document.getElementById('freshRankedChat');if(chat)chat.hidden=true;
    const label=st.opponent_claim==='WON'?'GANÉ':st.opponent_claim==='LOST'?'PERDÍ':'NADIE HIZO TRICKSHOT CON LA 8';
    let notice=document.getElementById('freshOpponentClaimNotice');
    if(!notice){notice=document.createElement('div');notice.id='freshOpponentClaimNotice';notice.className='fresh-opponent-claim-notice'} if(ready?.parentNode)ready.parentNode.insertBefore(notice,ready);
    const rival=document.getElementById('freshOpponent')?.textContent||'TU RIVAL';
    notice.textContent=(st.opponent_claim==='WON'&&String(st.status)==='review') ? rival+' TOCÓ GANÉ, ENVIÓ VIDEO DE PRUEBA Y SALIÓ DEL CHAT' : (st.opponent_claim==='WON'&&st.opponent_left) ? rival+' TOCÓ GANÉ Y LUEGO SALIR, OLVIDÉ GRABAR. SALIÓ DE LA SALA SIN ENVIAR EVIDENCIA.' : rival+' TOCÓ '+label+' Y SALIÓ DEL CHAT';
    notice.hidden=false;
   }else{
    const chat=document.getElementById('freshRankedChat');if(chat)chat.hidden=false;
    const notice=document.getElementById('freshOpponentClaimNotice');if(notice)notice.hidden=true;
   }
  }
 }catch(e){console.error('Restaurar estado persistente VS:',e)}
}
async function awaitRestoreFreshRoom(id){try{await restorePersistentFreshRoom(id)}catch(e){console.error(e)}}
function startFreshRankedRoom(id,secondsLeft=60){
 freshRoomMatchId=id;stopFreshRoomRealtime().catch(()=>{});freshRoomExpiresAt=Date.now()+Math.max(0,Number(secondsLeft)||0)*1000;
 clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);
 const warning=document.getElementById('freshResponseWarning');if(warning)warning.hidden=false;
 const oldNotice=document.getElementById('freshOpponentClaimNotice');if(oldNotice){oldNotice.hidden=true;oldNotice.textContent=''}
 const freshChat=document.getElementById('freshRankedChat');if(freshChat)freshChat.hidden=false;
 const abandon=document.getElementById('freshAbandonPending');if(abandon){abandon.hidden=false;abandon.disabled=false}
 const ready=document.getElementById('freshReadyActions');if(ready){ready.hidden=true;ready.classList.remove('fresh-actions-chat-place')}
 const results=document.getElementById('freshResultActions');if(results)results.hidden=true;
 const evidence=document.getElementById('freshEvidenceBox');if(evidence)evidence.hidden=true; /* persistent renderer restores it only when WON is confirmed */
 const noTrick=document.getElementById('freshNoTrick');if(noTrick){noTrick.disabled=false;noTrick.textContent='NADIE HIZO TRICKSHOT CON LA 8'}
 const won=document.getElementById('freshWon');if(won){won.disabled=false;won.textContent='🏆 GANÉ'}
 const lost=document.getElementById('freshLost');if(lost){lost.disabled=false;lost.textContent='PERDÍ'}
 const leave=document.getElementById('freshLeaveRoom');if(leave)leave.disabled=false;
 const resultStatus=document.getElementById('freshResultStatus');if(resultStatus)resultStatus.textContent='';
 const videoStatus=document.getElementById('freshWinnerVideoStatus');if(videoStatus)videoStatus.textContent='';
 const videoBtn=document.getElementById('freshWinnerVideoBtn');if(videoBtn){videoBtn.disabled=false;videoBtn.textContent='🎥 SELECCIONAR VIDEO'}
 const videoInput=document.getElementById('freshWinnerVideoInput');if(videoInput)videoInput.value='';
 const chat=document.getElementById('freshRankedChat');if(chat)chat.classList.remove('fresh-chat-top');
 /* Hide the room body until persisted state is restored, preventing a visible jump after refresh. */
 const roomBody=document.querySelector('#freshMatchmakingModal .fresh-match-body')||document.querySelector('#freshMatchmakingModal .fresh-room-body');
 if(roomBody)roomBody.style.visibility='hidden';
 awaitRestoreFreshRoom(id).finally(()=>{if(roomBody)roomBody.style.visibility='visible'});
 const tick=()=>{const left=Math.max(0,Math.ceil((freshRoomExpiresAt-Date.now())/1000)),t=document.getElementById('freshChatTimer');if(t)t.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=0){clearInterval(freshRoomTimer);freshRoomTimer=null;(async()=>{try{const {data,error}=await supabaseClient.rpc('auto_cancel_unanswered_ranked_chat',{p_match_id:freshRoomMatchId,p_force:false});if(error)throw error;if(data==='cancelled'){clearInterval(freshRoomChatPoll);freshRoomChatPoll=null;freshRoomMatchId=null;const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;showToast('VS anulado: ambos jugadores debían enviar un mensaje antes de terminar el minuto.')}}catch(e){console.error('Auto cancelar VS:',e)}})()}};
 // If the room was restored while the match is already under REVIEW, the other
 // player must answer the result immediately; do not restart the 1-minute chat phase.
 (async()=>{try{
   const {data:initialStatus,error:initialStatusError}=await supabaseClient.rpc('get_ranked_match_live_status',{p_match_id:id});
   if(initialStatusError)throw initialStatusError;
   if(String(initialStatus||'')==='review'){
     clearInterval(freshRoomTimer);freshRoomTimer=null;
     if(warning)warning.hidden=true;
     if(abandon){abandon.hidden=true;abandon.disabled=true}
     if(leave){leave.hidden=true;leave.disabled=true}
     if(chat)chat.classList.add('fresh-chat-top');
     await restorePersistentFreshRoom(id);
     const chatInput=document.getElementById('freshChatInput');if(chatInput)chatInput.disabled=false;
     const chatSend=document.getElementById('freshChatSend');if(chatSend)chatSend.disabled=false;
     if(resultStatus)resultStatus.textContent='Tu rival envió evidencia. Indica GANÉ, PERDÍ o NADIE HIZO TRICKSHOT.';
     await loadFreshRankedChat();
     return;
   }
   tick();freshRoomTimer=setInterval(tick,250);await loadFreshRankedChat();
 }catch(e){console.error('Estado inicial sala:',e);tick();freshRoomTimer=setInterval(tick,250);loadFreshRankedChat()}})();
 freshRoomChatPoll=setInterval(async()=>{if(!freshRoomMatchId)return;const checkingId=Number(freshRoomMatchId);try{const {data:status,error}=await supabaseClient.rpc('get_ranked_match_live_status',{p_match_id:checkingId});if(error)throw error;
const liveStatus=String(status||'');
if(liveStatus==='review'){
 clearInterval(freshRoomTimer);freshRoomTimer=null;
 const warning=document.getElementById('freshResponseWarning');if(warning)warning.hidden=true;
 const abandon=document.getElementById('freshAbandonPending');if(abandon){abandon.hidden=true;abandon.disabled=true}
 const leave=document.getElementById('freshLeaveRoom');if(leave){leave.hidden=true;leave.disabled=true}
 const chatInput=document.getElementById('freshChatInput');if(chatInput)chatInput.disabled=false;
 const chatSend=document.getElementById('freshChatSend');if(chatSend)chatSend.disabled=false;
 const resultStatus=document.getElementById('freshResultStatus');if(resultStatus&&!resultStatus.textContent)resultStatus.textContent='Tu rival envió evidencia. Indica GANÉ, PERDÍ o NADIE HIZO TRICKSHOT.';
}
if(!['matched','review'].includes(liveStatus)){clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomTimer=null;freshRoomChatPoll=null;if(Number(freshRoomMatchId)===Number(checkingId))freshRoomMatchId=null;const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;showToast('VS ANULADO. Ambos jugadores quedaron libres.');return}if(!document.hidden)await loadFreshRankedChat()}catch(e){console.error('Estado sala:',e)}},2000);
}
window.abandonFreshVsNow=async function(btn){
 if(!freshRoomMatchId)return;
 const matchId=Number(freshRoomMatchId);if(btn)btn.disabled=true;
 try{
  const {data,error}=await supabaseClient.rpc('auto_cancel_unanswered_ranked_chat',{p_match_id:matchId,p_force:true});
  if(error)throw error;
  if(data==='cancelled'||data==='missing'){
   clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomTimer=null;freshRoomChatPoll=null;
   if(Number(freshRoomMatchId)===matchId)freshRoomMatchId=null;
   const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;
   showToast('VS ANULADO PARA AMBOS JUGADORES.');
  }else if(data==='replied'){if(btn)btn.hidden=true;showToast('El VS ya está activo porque ambos enviaron un mensaje.')}
  else{if(btn)btn.disabled=false;showToast('No se pudo anular el VS. Estado: '+String(data||''))}
 }catch(x){console.error('Anular VS:',x);if(btn)btn.disabled=false;showToast('No se pudo anular el VS.')}
}
document.addEventListener('DOMContentLoaded',()=>{
 const b=document.getElementById('freshAbandonPending');
 if(b)b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();abandonFreshVsNow(b)});
});
document.addEventListener('click',async e=>{
 const clicked=e.target?.closest?.('button');
 if(clicked?.id==='freshChatSend')return sendFreshRankedChat();
 if(clicked?.id==='freshAbandonPending')return;
 if(clicked?.id==='freshLeaveRoom'){if(!freshRoomMatchId)return;try{const {error}=await supabaseClient.rpc('leave_ranked_room',{p_match_id:freshRoomMatchId});if(error)throw error;clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomTimer=null;freshRoomChatPoll=null;freshRoomMatchId=null;const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;showToast('Saliste de la sala. El VS sigue activo.');}catch(x){console.error(x);showToast('No se pudo salir de la sala.')}return;}
 if(!freshRoomMatchId)return;
 const map={freshWon:'WON',freshLost:'LOST'};
 if(clicked&&map[clicked.id]){
  const btn=clicked,claim=map[btn.id],matchId=Number(freshRoomMatchId);btn.disabled=true;btn.classList.add('fresh-action-pending');
  await new Promise(requestAnimationFrame);
  const st=document.getElementById('freshResultStatus');
  if(claim==='WON'){
   const ev=document.getElementById('freshEvidenceBox');if(ev)ev.hidden=false;
   if(st)st.textContent='Sube el video del tiro con la 8 que demuestre que ganaste. El video puede durar máximo 1 minuto.';
   btn.textContent='✓ MARCASTE GANÉ';
  }
  try{
   const {data,error}=await supabaseClient.rpc('submit_ranked_result_claim',{p_match_id:matchId,p_claim:claim});if(error)throw error;
   if(claim==='LOST'){btn.textContent='✓ MARCASTE PERDÍ';if(st)st.textContent='Derrota confirmada.'}
   showToast(claim==='WON'?'Ahora sube tu video de evidencia.':'Derrota confirmada.');
  }catch(x){
   console.error(x);
   if(claim==='WON'){const ev=document.getElementById('freshEvidenceBox');if(ev)ev.hidden=false;btn.textContent='🏆 GANÉ';if(st)st.textContent='El video sigue disponible para subir. Intenta marcar GANÉ nuevamente si fue necesario.'}
   btn.disabled=false;btn.classList.remove('fresh-action-pending');showToast('No se pudo registrar el resultado.');
  }return;
 }
 if(clicked?.id==='freshNoTrick'){
  const btn=clicked,matchId=Number(freshRoomMatchId);btn.classList.add('fresh-action-pending');
  await new Promise(requestAnimationFrame);
  try{
   btn.disabled=true;
   const {data,error}=await supabaseClient.rpc('submit_ranked_no_trick',{p_match_id:matchId});if(error)throw error;
   if(!['released','cancelled'].includes(String(data||'')))throw new Error('NO_TRICK_NOT_RELEASED');
   clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomTimer=null;freshRoomChatPoll=null;
   if(Number(freshRoomMatchId)===matchId)freshRoomMatchId=null;
   currentRankedMatchId=null;rankedSearchActive=false;
   const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;
   showToast(data==='cancelled'?'VS ANULADO: ambos indicaron que nadie hizo trickshot.':'Saliste de esta sala. Ya puedes buscar otro rival.');
  }catch(x){console.error(x);btn.disabled=false;showToast('No se pudo registrar.')}
  return;
 }
});
async function uploadFreshWinnerEvidence(file){
 if(!file||!freshRoomMatchId||!currentUser)return;
 const box=document.getElementById('freshEvidenceBox'),status=document.getElementById('freshWinnerVideoStatus'),btn=document.getElementById('freshWinnerVideoBtn');
 try{
  if(btn)btn.disabled=true;if(status)status.textContent='Comprobando video...';
  const mime=String(file.type||'').toLowerCase(),name=String(file.name||'').toLowerCase();
  if(!(/^video\/(mp4|webm|quicktime|x-m4v)$/.test(mime)||/\.(mp4|mov|m4v|webm)$/i.test(name)))throw new Error('Formato no permitido. Usa MP4, WEBM o MOV.');
  if(file.size>500*1024*1024)throw new Error('El video no puede superar 500 MB.');
  const duration=await getVideoDuration(file);if(!Number.isFinite(duration)||duration>60.05)throw new Error('El video debe durar máximo 1 minuto.');
  const matchId=Number(freshRoomMatchId),ext=getVideoExtension(file),path=matchId+'/'+currentUser.id+'/winner-'+Date.now()+'.'+ext;
  if(status)status.textContent='Subiendo video...';
  if(file.size>45*1024*1024)await uploadLargeRankedEvidence(file,path,(sent,total)=>{if(status)status.textContent='Subiendo video... '+(total?Math.floor(sent*100/total):0)+'%'});
  else{const {error}=await supabaseClient.storage.from('ranked-match-videos').upload(path,file,{contentType:file.type||'video/mp4',upsert:false,cacheControl:'3600'});if(error)throw error}
  const {error:saveError}=await supabaseClient.rpc('save_ranked_match_video',{p_match_id:matchId,p_video_path:path});if(saveError)throw saveError;
  if(status)status.textContent='✅ VIDEO ENVIADO AL ADMINISTRADOR PARA REVISIÓN.';if(btn){btn.textContent='🎥 VIDEO ENVIADO';btn.disabled=true}
  // La evidencia ya quedó guardada: liberar al jugador de esta sala para que pueda seguir jugando.
  clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomTimer=null;freshRoomChatPoll=null;
  if(Number(freshRoomMatchId)===matchId)freshRoomMatchId=null;
  if(Number(currentRankedMatchId)===matchId)currentRankedMatchId=null;
  rankedSearchActive=false;rankedPlayingLockedLocally=false;
  stopRankedPlayTimer();stopRankedChatResponseTimer();
  const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;
  const evidenceInput=document.getElementById('freshWinnerVideoInput');if(evidenceInput)evidenceInput.value='';
  showToast('PARTIDO EN REVISIÓN, PUEDES SEGUIR JUGANDO MIENTRAS SE DEFINE QUIÉN GANÓ.');
  setTimeout(()=>alert('PARTIDO EN REVISIÓN\n\nPUEDES SEGUIR JUGANDO MIENTRAS SE DEFINE QUIÉN GANÓ.'),120);
  updateRankedDailyStatus().catch(()=>{});loadRanking().catch(()=>{});
 }catch(e){console.error('Evidencia VS:',e);if(status)status.textContent=e?.message||'No se pudo subir el video.';if(btn)btn.disabled=false}
}
document.addEventListener('click',e=>{if(e.target?.id==='freshWinnerVideoBtn'){document.getElementById('freshWinnerVideoInput')?.click()}});
document.addEventListener('click',async e=>{if(e.target?.id==='freshForgotVideoBtn'){
 if(!freshRoomMatchId||!confirm('¿Salir de la sala sin enviar evidencia?'))return;
 try{const matchId=Number(freshRoomMatchId);const {error}=await supabaseClient.rpc('leave_winner_without_evidence',{p_match_id:matchId});if(error)throw error;clearInterval(freshRoomTimer);clearInterval(freshRoomChatPoll);freshRoomMatchId=null;const modal=document.getElementById('freshMatchmakingModal');if(modal)modal.hidden=true;await updateRankedDailyStatus();showToast('Saliste de la sala sin enviar evidencia.')}catch(err){console.error(err);showToast('No se pudo salir de la sala.')}
}});

document.addEventListener('change',e=>{if(e.target?.id==='freshWinnerVideoInput'){const file=e.target.files?.[0];if(file)uploadFreshWinnerEvidence(file)}});
document.addEventListener('keydown',e=>{if(e.target?.id==='freshChatInput'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendFreshRankedChat()}});

document.addEventListener('click',e=>{if(e.target?.id==='freshCopyMyId'||e.target?.id==='freshCopyOpponentId'){const id=e.target.id==='freshCopyMyId'?'freshMyId':'freshOpponentId',raw=document.getElementById(id)?.textContent?.trim(),v=String(raw||'').replace(/^ID\s*:\s*/i,'').trim();if(v&&navigator.clipboard)navigator.clipboard.writeText(v).then(()=>showToast('ID copiado.')).catch(()=>{})}});

async function openFreshOpponentProfile(){
 if(!freshRoomMatchId||!supabaseClient)return;
 try{
  const {data:room,error:roomError}=await supabaseClient.rpc('get_fresh_ranked_room',{p_match_id:Number(freshRoomMatchId)});if(roomError)throw roomError;
  const m=Array.isArray(room)?room[0]:room;if(!m?.opponent_id)throw new Error('OPPONENT_NOT_FOUND');
  const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:m.opponent_id});if(error)throw error;
  const p=Array.isArray(data)?data[0]:data;if(!p)throw new Error('PROFILE_NOT_FOUND');
  openRankingPlayer({...p,id:p.player_id,player_id:p.player_id});
 }catch(err){console.error('Abrir perfil rival desde tarjeta VS:',err);showToast('No se pudo abrir el perfil.')}
}
document.addEventListener('click',e=>{if(e.target?.closest?.('#freshOpponentAvatar'))openFreshOpponentProfile()});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.id==='freshOpponentAvatar'){e.preventDefault();openFreshOpponentProfile()}});



/* Ranking8BP PWA install */
function syncRankingInstallButton(){
 const area=document.getElementById('rankingInstallArea');
 const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 if(area)area.style.setProperty('display',standalone?'none':'block','important');
}
document.addEventListener('DOMContentLoaded',syncRankingInstallButton);
window.matchMedia('(display-mode: standalone)').addEventListener?.('change',syncRankingInstallButton);
let rankingInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();rankingInstallPrompt=e;});
window.addEventListener('appinstalled',()=>{rankingInstallPrompt=null;syncRankingInstallButton();showToast('Ranking8BP instalado correctamente.');});
document.addEventListener('click',async e=>{
 if(e.target?.id!=='installRankingAppBtn')return;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 if(ios){
  if(window.navigator.standalone===true){showToast('Estás usando Ranking8BP desde el acceso de la pantalla de inicio.');return}
  alert('INSTALAR RANKING8BP EN IPHONE\n\n1. Abre este sitio en Safari.\n2. Toca Compartir.\n3. Toca “Añadir a pantalla de inicio”.\n4. Toca “Añadir”.');return;
 }
 if(rankingInstallPrompt){
  const prompt=rankingInstallPrompt;rankingInstallPrompt=null;
  await prompt.prompt();
  const choice=await prompt.userChoice;
  if(choice?.outcome==='accepted')showToast('Instalando Ranking8BP...');
  else showToast('Instalación cancelada.');
  return;
 }
 /* No asumir que está instalado: Android puede conservar temporalmente display-mode tras desinstalar. */
 alert('El navegador todavía no ofrece la instalación.\n\nEn Chrome toca ⋮ y busca “Instalar aplicación” o “Añadir a pantalla de inicio”. Si acabas de desinstalar Ranking8BP, cierra esta pestaña, vuelve a abrir ranking8bp.github.io y prueba otra vez.');
});
