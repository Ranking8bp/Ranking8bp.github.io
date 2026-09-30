const guestTopbar=document.getElementById('guestTopbar');
const guestEmpty=document.getElementById('guestEmpty');
const playerDashboard=document.getElementById('playerDashboard');
const guestRankingList=document.getElementById('guestRankingList');
const guestRankingCount=document.getElementById('guestRankingCount');
const guestRankingSearchInput=document.getElementById('guestRankingSearchInput');
let guestRankingPlayers=[];
const guestRankShowcase=document.getElementById('guestRankShowcase');
const loginBtn=document.getElementById('loginBtn');
const registerBtn=document.getElementById('registerBtn');
const logoutBtn=document.getElementById('logoutBtn');
const deleteAccountBtn=document.getElementById('deleteAccountBtn');
const adminModeBtn=document.getElementById('adminModeBtn');
const adminPanel=document.getElementById('adminPanel');
const adminCloseBtn=document.getElementById('adminCloseBtn');
const adminRefreshBtn=document.getElementById('adminRefreshBtn');
const adminMatchList=document.getElementById('adminMatchList');
const adminPlayerList=document.getElementById('adminPlayerList');
const adminVsTab=document.getElementById('adminVsTab');
const adminPlayersTab=document.getElementById('adminPlayersTab');
const adminModerationTab=document.getElementById('adminModerationTab');
const adminModeration=document.getElementById('adminModeration');
const adminGeneralMessages=document.getElementById('adminGeneralMessages');
const adminPrivateMessages=document.getElementById('adminPrivateMessages');
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
const dashboardPlayBtn=document.getElementById('dashboardPlayBtn');
const matchmakingModal=document.getElementById('matchmakingModal');
const matchmakingClose=document.getElementById('matchmakingClose');
const matchmakingSearching=document.getElementById('matchmakingSearching');
const matchmakingVersus=document.getElementById('matchmakingVersus');
const versusMe=document.getElementById('versusMe');
const versusMyElo=document.getElementById('versusMyElo');
const versusOpponent=document.getElementById('versusOpponent');
const versusOpponentElo=document.getElementById('versusOpponentElo');
const versusMyAvatar=document.getElementById('versusMyAvatar'),versusOpponentAvatar=document.getElementById('versusOpponentAvatar');
const versusMyRank=document.getElementById('versusMyRank'),versusOpponentRank=document.getElementById('versusOpponentRank');
const versusMyPosition=document.getElementById('versusMyPosition'),versusOpponentPosition=document.getElementById('versusOpponentPosition');
const pendingMatchesCount=document.getElementById('pendingMatchesCount');
const abandonRankedBtn=document.getElementById('abandonRankedBtn');
const confirmedMatchWarning=document.getElementById('confirmedMatchWarning');
let pendingMatchesTimer=null;
let matchmakingTimer=null,currentRankedMatchId=null,matchmakingHeartbeatTimer=null;
const gamesPlayed=document.getElementById('gamesPlayed');
const winRate=document.getElementById('winRate');
const currentStreak=document.getElementById('currentStreak');
const bestElo=document.getElementById('bestElo');
const dashboardMessage=document.getElementById('dashboardMessage');
const rankBadgeImage=document.getElementById('rankBadgeImage');
const rankingList=document.getElementById('rankingList');
const rankingCount=document.getElementById('rankingCount');
const rankingSearchInput=document.getElementById('rankingSearchInput');
let rankingPlayersCache=[];
const playerDetailModal=document.getElementById('playerDetailModal');
const closePlayerDetail=document.getElementById('closePlayerDetail');
const playerDetailAvatar=document.getElementById('playerDetailAvatar');
const playerDetailName=document.getElementById('playerDetailName');
const playerDetailFlag=document.getElementById('playerDetailFlag');
const playerDetailCountry=document.getElementById('playerDetailCountry');
const playerDetailGameId=document.getElementById('playerDetailGameId');
const playerDetailElo=document.getElementById('playerDetailElo');
const playerDetailWins=document.getElementById('playerDetailWins');
const playerDetailLosses=document.getElementById('playerDetailLosses');
const playerDetailRank=document.getElementById('playerDetailRank');
const playerDetailRankBadge=document.getElementById('playerDetailRankBadge');
const playerHeartBtn=document.getElementById('playerHeartBtn');
const playerHeartCount=document.getElementById('playerHeartCount');
const playerHeartCountLabel=document.getElementById('playerHeartCountLabel');
const playerFollowBtn=document.getElementById('playerFollowBtn');
const playerPlayBtn=document.getElementById('playerPlayBtn');
const playerMessageBtn=document.getElementById('playerMessageBtn');
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
if(cloudReady){supabaseClient=window.supabase.createClient(cloudConfig.url,cloudConfig.key)}


const RANKS=[
  {min:0,name:'Latón',image:'assets/ranks/01_Laton.png'},
  {min:230,name:'Bronce I',image:'assets/ranks/02_Bronce_I.png'},
  {min:300,name:'Bronce II',image:'assets/ranks/03_Bronce_II.png'},
  {min:380,name:'Bronce III',image:'assets/ranks/04_Bronce_III.png'},
  {min:470,name:'Plata I',image:'assets/ranks/05_Plata_I.png'},
  {min:570,name:'Plata II',image:'assets/ranks/06_Plata_II.png'},
  {min:680,name:'Plata III',image:'assets/ranks/07_Plata_III.png'},
  {min:800,name:'Oro I',image:'assets/ranks/08_Oro_I.png'},
  {min:930,name:'Oro II',image:'assets/ranks/09_Oro_II.png'},
  {min:1070,name:'Oro III',image:'assets/ranks/10_Oro_III.png'},
  {min:1220,name:'Amatista I',image:'assets/ranks/11_Amatista_I.png'},
  {min:1380,name:'Amatista II',image:'assets/ranks/12_Amatista_II.png'},
  {min:1550,name:'Amatista III',image:'assets/ranks/13_Amatista_III.png'},
  {min:1730,name:'Esmeralda I',image:'assets/ranks/14_Esmeralda_I.png'},
  {min:1920,name:'Esmeralda II',image:'assets/ranks/15_Esmeralda_II.png'},
  {min:2120,name:'Esmeralda III',image:'assets/ranks/16_Esmeralda_III.png'},
  {min:2330,name:'Diamante I',image:'assets/ranks/17_Diamante_I.png'},
  {min:2550,name:'Diamante II',image:'assets/ranks/18_Diamante_II.png'},
  {min:2770,name:'Diamante III',image:'assets/ranks/19_Diamante_III.png'},
  {min:3000,name:'Diamante Negro',image:'assets/ranks/20_Diamante_Negro.png'}
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
  img.src=rank.image+'?v=20261001-original';
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
  img.src=rank.image+'?v=20260930-hq1';
  img.alt='Insignia '+rank.name;
  if(name)name.textContent=rank.name.toUpperCase();
  if(stats&&player)stats.textContent='ELO '+(Number(player.elo_points)||200)+' · '+(Number(player.wins)||0)+' victorias · '+(Number(player.losses)||0)+' derrotas';
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}
function closeRankZoom(){const modal=document.getElementById('rankZoomModal');if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}}
document.addEventListener('click',e=>{if(e.target?.id==='rankZoomClose'||e.target?.id==='rankZoomModal')closeRankZoom()});

async function renderPlayerDetailRankBadge(rank){
  if(!playerDetailRankBadge)return;
  if(!currentDetailPlayer)return;
  applyRankImage(playerDetailRankBadge,rank);
}



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

async function updatePendingMatchesCount(){
 if(!currentUser||!supabaseClient||!pendingMatchesCount)return;
 try{const {data,error}=await supabaseClient.rpc('get_pending_ranked_matches_count');if(error)throw error;const n=Number(data)||0;pendingMatchesCount.textContent=n+' '+(n===1?'PARTIDO PENDIENTE':'PARTIDOS PENDIENTES')}catch(e){console.error(e)}
}

function showRankedMatch(match){
 if(!matchmakingModal)return;
 currentRankedMatchId=match.match_id;
 matchmakingSearching.hidden=true;matchmakingVersus.hidden=false;
 versusMe.textContent=String(currentProfile?.account_name||currentProfile?.username||'TÚ').toUpperCase();
 versusMyElo.textContent='ELO '+String(match.my_elo||200);
 versusOpponent.textContent=String(match.opponent_name||'RIVAL').toUpperCase();
 versusOpponentElo.textContent='ELO '+String(match.opponent_elo||200);
 if(versusMyRank)versusMyRank.textContent=String(match.my_rank_name||getRankByElo(match.my_elo).name).toUpperCase();
 if(versusOpponentRank)versusOpponentRank.textContent=String(match.opponent_rank_name||getRankByElo(match.opponent_elo).name).toUpperCase();
 if(versusMyPosition)versusMyPosition.textContent='RANKING #'+String(match.my_position||'--');
 if(versusOpponentPosition)versusOpponentPosition.textContent='RANKING #'+String(match.opponent_position||'--');
 const setVsAvatar=(el,path,name)=>{if(!el)return;el.replaceChildren();if(path){const {data}=supabaseClient.storage.from('profile-photos').getPublicUrl(path);if(data?.publicUrl){const img=document.createElement('img');img.src=data.publicUrl;img.alt=name;el.appendChild(img);return}}const s=document.createElement('span');s.textContent=String(name||'?').charAt(0).toUpperCase();el.appendChild(s)};
 setVsAvatar(versusMyAvatar,match.my_avatar_path,currentProfile?.account_name||currentProfile?.username||'TÚ');
 setVsAvatar(versusOpponentAvatar,match.opponent_avatar_path,match.opponent_name);
 if(confirmedMatchWarning)confirmedMatchWarning.hidden=!match.admin_confirmed;if(abandonRankedBtn){abandonRankedBtn.hidden=!!match.admin_confirmed;abandonRankedBtn.disabled=!!match.admin_confirmed}if(matchmakingClose){matchmakingClose.hidden=!!match.admin_confirmed;matchmakingClose.disabled=!!match.admin_confirmed}
 updatePendingMatchesCount();
 clearInterval(pendingMatchesTimer);pendingMatchesTimer=setInterval(()=>{updatePendingMatchesCount();watchCurrentRankedMatch()},2000);
}
async function watchCurrentRankedMatch(){
 if(!currentRankedMatchId||!supabaseClient)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_my_active_ranked_match');if(error)throw error;
  if(data&&data.length&&Number(data[0].match_id)===Number(currentRankedMatchId)){const confirmed=!!data[0].admin_confirmed;if(confirmedMatchWarning)confirmedMatchWarning.hidden=!confirmed;if(abandonRankedBtn){abandonRankedBtn.hidden=confirmed;abandonRankedBtn.disabled=confirmed}if(matchmakingClose){matchmakingClose.hidden=confirmed;matchmakingClose.disabled=confirmed}}
  if(!data||!data.length||Number(data[0].match_id)!==Number(currentRankedMatchId)){
   currentRankedMatchId=null;clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
   if(matchmakingModal)matchmakingModal.hidden=false;if(matchmakingSearching)matchmakingSearching.hidden=false;if(matchmakingVersus)matchmakingVersus.hidden=true;
   showToast('Tu rival abandonó. Buscando un nuevo rival...');
   await startRankedMatchmaking();return;
  }
 }catch(e){console.error(e)}
}

async function pollRankedMatch(){
 if(!currentUser||!supabaseClient)return;
 try{const {data,error}=await supabaseClient.rpc('get_my_active_ranked_match');if(error)throw error;const m=Array.isArray(data)?data[0]:data;if(m){clearInterval(matchmakingTimer);matchmakingTimer=null;showRankedMatch(m)}}catch(e){console.error(e)}
}
async function heartbeatRankedSearch(){
 if(currentRankedMatchId||!currentUser||!supabaseClient)return;
 try{await supabaseClient.rpc('heartbeat_ranked_matchmaking')}catch(e){console.error(e)}
}
async function startRankedMatchmaking(){
 if(!currentUser||!supabaseClient)return;
 matchmakingModal.hidden=false;matchmakingSearching.hidden=false;matchmakingVersus.hidden=true;
 try{
  const {data,error}=await supabaseClient.rpc('join_ranked_matchmaking');if(error)throw error;const m=Array.isArray(data)?data[0]:data;
  if(m?.matched){showRankedMatch(m);return}
  clearInterval(matchmakingTimer);matchmakingTimer=setInterval(pollRankedMatch,1500);
  clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=setInterval(heartbeatRankedSearch,3000);heartbeatRankedSearch();
 }catch(e){console.error(e);matchmakingModal.hidden=true;showToast('No se pudo iniciar la búsqueda de rival.')}
}
async function closeRankedMatchmaking(){
 if(currentRankedMatchId&&supabaseClient){try{const {data}=await supabaseClient.rpc('get_my_active_ranked_match');const m=Array.isArray(data)?data[0]:data;if(m?.admin_confirmed){showToast('Este VS está confirmado. Debes esperar el resultado.');return}}catch(e){console.error(e)}}
 clearInterval(matchmakingTimer);matchmakingTimer=null;clearInterval(matchmakingHeartbeatTimer);matchmakingHeartbeatTimer=null;clearInterval(pendingMatchesTimer);pendingMatchesTimer=null;
 if(matchmakingModal)matchmakingModal.hidden=true;
 if(!currentRankedMatchId&&currentUser&&supabaseClient)await supabaseClient.rpc('cancel_ranked_matchmaking');
}



async function loadAdminPlayers(){
 if(!adminPlayerList||!supabaseClient)return;adminPlayerList.innerHTML='<div class="admin-empty">Cargando jugadores...</div>';
 try{
  const {data,error}=await supabaseClient.rpc('get_ranking');if(error)throw error;const players=Array.isArray(data)?data:[];adminPlayerList.replaceChildren();
  players.forEach((p,index)=>{const card=document.createElement('article');card.className='admin-player-card';
   const head=document.createElement('div');head.className='admin-player-head';const av=document.createElement('div');av.className='admin-edit-avatar';av.textContent=String(p.account_name||p.username||'?').charAt(0).toUpperCase();if(p.avatar_path){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(p.avatar_path);if(u?.publicUrl){const im=document.createElement('img');im.src=u.publicUrl;av.replaceChildren(im)}}const title=document.createElement('div');title.innerHTML='<strong></strong><span></span>';title.children[0].textContent=p.account_name||p.username||'Jugador';title.children[1].textContent='Ranking #'+(index+1)+' · '+p.player_id;head.append(av,title);card.append(head);
   const fields=document.createElement('div');fields.className='admin-edit-grid';const defs=[['Nombre','account_name',p.account_name||p.username||''],['ID juego','game_id',p.game_id||''],['País','country',p.country||''],['ELO','elo_points',p.elo_points??200,'number'],['Victorias','wins',p.wins??0,'number'],['Derrotas','losses',p.losses??0,'number'],['Rango','rank_name',p.rank_name||getRankByElo(p.elo_points).name]];
   const inputs={};defs.forEach(([label,key,val,type])=>{const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.type=type||'text';i.value=val;l.append(i);fields.append(l);inputs[key]=i});card.append(fields);
   const save=document.createElement('button');save.className='admin-save-player';save.textContent='GUARDAR CAMBIOS';save.onclick=async()=>{save.disabled=true;const args={p_user_id:p.player_id,p_account_name:inputs.account_name.value,p_game_id:inputs.game_id.value,p_country:inputs.country.value,p_elo:Number(inputs.elo_points.value)||0,p_wins:Number(inputs.wins.value)||0,p_losses:Number(inputs.losses.value)||0,p_rank_name:inputs.rank_name.value};const {error:e}=await supabaseClient.rpc('admin_update_profile',args);save.disabled=false;if(e){console.error(e);showToast('No se pudieron guardar los cambios.');return}showToast('Perfil actualizado.');await loadAdminPlayers()};card.append(save);
   const pw=document.createElement('button');pw.className='admin-password-btn';pw.textContent='CAMBIAR CONTRASEÑA';pw.onclick=()=>adminResetPlayerPassword(p.player_id);card.append(pw);adminPlayerList.append(card)})
 }catch(e){console.error(e);adminPlayerList.innerHTML='<div class="admin-empty">No se pudieron cargar los jugadores.</div>'}
}
function showAdminModeration(){
 if(adminMatchList)adminMatchList.hidden=true;
 if(adminPlayerList)adminPlayerList.hidden=true;
 if(adminModeration)adminModeration.hidden=false;
 if(adminGeneralMessages)adminGeneralMessages.innerHTML='<div class="admin-empty">Moderación disponible para el administrador.</div>';
 if(adminPrivateMessages)adminPrivateMessages.innerHTML='<div class="admin-empty">Moderación disponible para el administrador.</div>';
}
function showAdminVs(){if(adminMatchList)adminMatchList.hidden=false;if(adminPlayerList)adminPlayerList.hidden=true;if(adminModeration)adminModeration.hidden=true;loadAdminMatches()}
function showAdminPlayers(){if(adminMatchList)adminMatchList.hidden=true;if(adminPlayerList)adminPlayerList.hidden=false;if(adminModeration)adminModeration.hidden=true;loadAdminPlayers()}

async function setupAdminMode(){
 if(!currentUser||!supabaseClient||!adminModeBtn)return;
 try{const {data,error}=await supabaseClient.from('profiles').select('is_admin').eq('id',currentUser.id).single();if(error)throw error;adminModeBtn.hidden=!data?.is_admin}catch(e){adminModeBtn.hidden=true}
}
async function loadAdminMatches(){
 if(!adminMatchList||!supabaseClient)return;
 adminMatchList.innerHTML='<div class="admin-empty">Cargando...</div>';
 try{
  const {data,error}=await supabaseClient.rpc('admin_get_ranked_matches');if(error)throw error;
  const rows=(Array.isArray(data)?data:[]).filter(m=>m.status==='matched');adminMatchList.replaceChildren();
  if(!rows.length){adminMatchList.innerHTML='<div class="admin-empty">No hay partidos en espera.</div>';return}
  for(const m of rows){
   const row=document.createElement('article');row.className='admin-match '+m.status;
   const title=document.createElement('div');title.className='admin-match-vs admin-match-vs-rich';
   const makePlayer=(side)=>{const name=m[side+'_name'],elo=Number(m[side+'_elo']||200),gameId=m[side+'_game_id']||'--',pos=m[side+'_position']||'--',rank=getRankByElo(elo),avatar=m[side+'_avatar_path'];const card=document.createElement('div');card.className='admin-vs-player';const av=document.createElement('div');av.className='admin-vs-avatar';if(avatar){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(avatar);if(u?.publicUrl)av.style.backgroundImage='url("'+u.publicUrl+'")'}if(!avatar)av.textContent=String(name||'?').charAt(0).toUpperCase();const info=document.createElement('div');info.className='admin-vs-info';const nm=document.createElement('strong');nm.textContent=name;const id=document.createElement('span');id.textContent='ID '+gameId;const rp=document.createElement('span');rp.textContent='RANKING #'+pos;const el=document.createElement('span');el.textContent=elo+' ELO';const badge=document.createElement('div');badge.className='admin-vs-rank-badge';renderRankBadgeOn(badge,rank);const rn=document.createElement('b');rn.textContent=rank.name;info.append(nm,id,rp,el,rn);card.append(av,badge,info);return card};title.append(makePlayer('player1'));const vs=document.createElement('b');vs.className='admin-vs-word';vs.textContent='VS';title.append(vs,makePlayer('player2'));
   const meta=document.createElement('small');meta.textContent='#'+m.match_id+' · '+String(m.status).toUpperCase()+' · '+formatCommentDate(m.created_at);
   row.append(title,meta);
   if(m.status==='matched'){
    const actions=document.createElement('div');actions.className='admin-match-actions';
    if(!m.admin_confirmed){
     const confirmBtn=document.createElement('button');confirmBtn.className='confirm-vs';confirmBtn.textContent='CONFIRMAR VS';
     confirmBtn.onclick=async()=>{if(!confirm('¿Confirmar este VS? Después de confirmarlo los jugadores ya no podrán abandonar.'))return;const {error}=await supabaseClient.rpc('admin_confirm_ranked_match',{p_match_id:m.match_id});if(error){showToast('No se pudo confirmar el VS.');return}await loadAdminMatches();showToast('VS confirmado. Ahora selecciona quién ganó.')};
     actions.appendChild(confirmBtn);
    }else{
     const winnerTitle=document.createElement('strong');winnerTitle.className='admin-result-title';winnerTitle.textContent='DEFINIR GANADOR';
     actions.appendChild(winnerTitle);
     for(const [id,name] of [[m.player1_id,m.player1_name],[m.player2_id,m.player2_name]]){
      const winBtn=document.createElement('button');winBtn.className='admin-winner-btn';winBtn.textContent='GANA '+name;
      winBtn.onclick=async()=>{if(!confirm('¿Confirmar a '+name+' como ganador? Se aplicará +15 ELO al ganador y -15 ELO al perdedor.'))return;const {error}=await supabaseClient.rpc('admin_resolve_ranked_match',{p_match_id:m.match_id,p_winner_id:id});if(error){showToast('No se pudo guardar el resultado.');return}await loadAdminMatches();showToast('Resultado aplicado.')};
      actions.appendChild(winBtn);
     }
    }
    const cancel=document.createElement('button');cancel.className='cancel';cancel.textContent='ANULAR VS';
    cancel.onclick=async()=>{if(!confirm('¿Anular este VS sin cambiar ELO?'))return;const {error}=await supabaseClient.rpc('admin_cancel_ranked_match',{p_match_id:m.match_id});if(error){showToast('No se pudo anular.');return}await loadAdminMatches();showToast('VS anulado.')};
    actions.appendChild(cancel);row.appendChild(actions);
   }
   adminMatchList.appendChild(row);
  }
 }catch(e){console.error(e);adminMatchList.innerHTML='<div class="admin-empty">No se pudo cargar el modo administrador.</div>'}
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
 if(!guestRankShowcase||guestRankShowcase.dataset.ready)return;
 guestRankShowcase.dataset.ready='1';
 const order=[10,11,12,13,14,15,16,17,18,19,0,1,2,3,4,5,6,7,8,9];
 order.forEach(rankIndex=>{
   const badge=document.createElement('span');
   badge.className='guest-showcase-badge';
   renderRankBadgeOn(badge,RANKS[rankIndex]);
   guestRankShowcase.appendChild(badge);
 });
}

async function loadGuestRanking(){
 if(!guestRankingList)return;
 guestRankingList.innerHTML='<div class="ranking-loading">Cargando clasificación...</div>';
 try{
  const {data,error}=await supabaseClient.rpc('get_public_ranking');
  if(error)throw error;
  guestRankingPlayers=(Array.isArray(data)?data:[]).slice(0,100);
  renderGuestRanking();
 }catch(e){
  console.error('Ranking público:',e);
  guestRankingList.innerHTML='<div class="ranking-loading ranking-error">No se pudo cargar la clasificación.</div>';
 }
}
function renderGuestRanking(){
 if(!guestRankingList)return;
 const q=String(guestRankingSearchInput?.value||'').trim().toLocaleLowerCase('es');
 const players=guestRankingPlayers.filter(p=>{
   const name=(String(p?.username||'')+' '+String(p?.account_name||'')).toLocaleLowerCase('es');
   return !q||name.includes(q);
 });
 guestRankingList.replaceChildren();
 if(guestRankingCount)guestRankingCount.textContent=q?String(players.length)+' RESULTADOS':'TOP '+Math.min(100,players.length);
 if(!players.length){
   const empty=document.createElement('div');empty.className='ranking-loading';empty.textContent=q?'No se encontró ningún jugador.':'Todavía no hay jugadores registrados.';guestRankingList.appendChild(empty);return;
 }
 players.forEach((player,index)=>{
   const row=document.createElement('div');row.className='guest-ranking-row';
   const pos=document.createElement('strong');pos.className='guest-ranking-pos';pos.textContent=String(index+1);
   const name=document.createElement('div');name.className='guest-ranking-player';
   const avatar=document.createElement('span');avatar.className='guest-ranking-avatar';avatar.textContent=String(player.username||player.account_name||'J').charAt(0).toUpperCase();
   if(player.avatar_path&&supabaseClient){
    const {data:avatarData}=supabaseClient.storage.from('profile-photos').getPublicUrl(player.avatar_path);
    if(avatarData?.publicUrl){const img=document.createElement('img');img.src=avatarData.publicUrl;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();avatar.appendChild(img)}
   }
   const info=document.createElement('div');info.className='guest-ranking-player-info';
   const n=document.createElement('b');n.textContent=String(player.username||player.account_name||'Jugador').toUpperCase();
   const rank=getRankByElo(player.elo_points);const rankLine=document.createElement('span');rankLine.className='guest-ranking-rank';rankLine.textContent=rank.name.toUpperCase();
   const miniBadge=document.createElement('span');miniBadge.className='guest-ranking-rank-badge';renderRankBadgeOn(miniBadge,rank);
   miniBadge.setAttribute('role','button');miniBadge.tabIndex=0;miniBadge.title='Ver perfil y estadísticas';
   const openBadgeProfile=event=>{event.stopPropagation();openRankingPlayer(player)};
   miniBadge.addEventListener('click',openBadgeProfile);
   miniBadge.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBadgeProfile(event)}});
   info.append(n,rankLine);name.append(avatar,miniBadge,info);
   const country=document.createElement('div');country.className='guest-ranking-country';country.textContent=getFlag(player.country)+' '+String(player.country||'País');
   const elo=document.createElement('strong');elo.className='guest-ranking-elo';elo.textContent=String(Number(player.elo_points)||200);
   row.append(pos,name,country,elo);guestRankingList.appendChild(row);
 });
}

function setGuestUI(){
  currentUser=null;currentProfile=null;guestTopbar.hidden=false;guestEmpty.hidden=false;playerDashboard.hidden=true;settingsMenu.hidden=true;clearAvatar();
  renderGuestRankShowcase().catch(()=>{});
  loadGuestRanking().catch(()=>{});
}
function clearAvatar(){
  if(avatarPreviewUrl){URL.revokeObjectURL(avatarPreviewUrl);avatarPreviewUrl=''}
  profileAvatar.hidden=true;profileAvatar.removeAttribute('src');avatarPlaceholder.hidden=false
}
async function loadAvatar(path){
  if(!supabaseClient||!path){clearAvatar();return}
  const {data,error}=await supabaseClient.storage.from('profile-photos').createSignedUrl(path,3600);
  if(error||!data?.signedUrl){clearAvatar();return}
  profileAvatar.src=data.signedUrl;profileAvatar.hidden=false;avatarPlaceholder.hidden=true
}

async function setPlayerUI(profile,user){
  currentUser=user||currentUser;currentProfile=profile||currentProfile;
  guestTopbar.hidden=true;guestEmpty.hidden=true;playerDashboard.hidden=false;

  const playerName=profile?.username||user?.user_metadata?.username||profile?.account_name||'Jugador';
  const elo=Number.isFinite(Number(profile?.elo_points))?Number(profile.elo_points):200;
  const rank=getRankByElo(elo);
  const rankName=rank.name;
  const wins=Number.isFinite(Number(profile?.wins))?Number(profile.wins):0;
  const losses=Number.isFinite(Number(profile?.losses))?Number(profile.losses):0;
  const games=wins+losses;
  const rate=games>0?Math.round((wins/games)*100):0;

  dashboardPlayerName.textContent=String(playerName).toUpperCase();
  countryName.textContent=profile?.country||'País';
  countryFlag.textContent=getFlag(profile?.country);
  const isAdminDashboard=profile?.is_admin===true||String(profile?.username||'').toLowerCase()==='ikar8bp';
  const rankHero=document.querySelector('#playerDashboard .rank-hero-card');
  const winLossGrid=document.querySelector('#playerDashboard .win-loss-grid');
  if(isAdminDashboard){
    if(rankHero){rankHero.hidden=false;rankHero.classList.add('admin-only-card');rankHero.innerHTML='<div class="admin-only-title">ADMINISTRADOR</div>';}
    if(winLossGrid)winLossGrid.hidden=true;
  }else{
    if(rankHero){rankHero.hidden=false;rankHero.classList.remove('admin-only-card');}
    if(winLossGrid)winLossGrid.hidden=false;
    dashboardElo.textContent=elo;
    dashboardWins.textContent=wins;
    dashboardLosses.textContent=losses;
  }
  gamesPlayed.textContent=isAdminDashboard?'—':games;
  winRate.textContent=isAdminDashboard?'—':rate+'%';
  currentStreak.textContent=isAdminDashboard?'—':'0';
  bestElo.textContent=isAdminDashboard?'—':elo;
  dashboardMessage.textContent='';

  const rankingTask=loadRanking();
  const rankTask=isAdminDashboard?Promise.resolve():renderRankBadge(rank);
  const avatarTask=profile?.avatar_path?loadAvatar(profile.avatar_path):Promise.resolve(clearAvatar());
  const followTask=loadDashboardFollowStats(profile?.id||user?.id);
  await Promise.allSettled([rankingTask,rankTask,avatarTask,followTask]);
}


async function loadDashboardFollowStats(profileId){
 if(!profileId||!supabaseClient)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_follow_stats',{p_profile_id:profileId});if(error)throw error;
  const s=Array.isArray(data)?data[0]:data;
  if(dashboardFollowersCount)dashboardFollowersCount.textContent=String(s?.followers||0);
  if(dashboardFollowingCount)dashboardFollowingCount.textContent=String(s?.following||0);
 }catch(e){console.error('Error cargando seguidores del perfil:',e)}
}

function createRankingAvatar(player){
  const wrap=document.createElement('div');
  wrap.className='ranking-avatar';
  const fallback=document.createElement('span');
  const displayName=player?.username||player?.account_name||'J';
  fallback.textContent=String(displayName).trim().charAt(0).toUpperCase()||'J';
  wrap.appendChild(fallback);

  if(player?.avatar_path&&supabaseClient){
    supabaseClient.storage.from('profile-photos').createSignedUrl(player.avatar_path,3600)
      .then(({data,error})=>{
        if(error||!data?.signedUrl)return;
        const img=document.createElement('img');
        img.src=data.signedUrl;
        img.alt='';
        img.onload=()=>{wrap.replaceChildren(img)};
      })
      .catch(()=>{});
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
async function loadGlobalActivity(){if(!currentUser||!supabaseClient||!activityList)return;try{const {data,error}=await supabaseClient.rpc('get_global_activity');if(error)throw error;renderGlobalActivity(Array.isArray(data)?data:[])}catch(e){console.error(e);activityList.innerHTML='<div class="notification-empty">No se pudo cargar la actividad.</div>'}}
async function toggleGlobalActivity(){if(!activityPanel)return;const opening=activityPanel.hidden;activityPanel.hidden=!opening;if(notificationPanel)notificationPanel.hidden=true;if(settingsMenu)settingsMenu.hidden=true;if(opening)await loadGlobalActivity()}
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
async function openRankingPlayer(player){
  if(!playerDetailModal)return;
  currentDetailPlayer=player;

  const displayName=String(player?.username||player?.account_name||'Jugador').toUpperCase();
  const country=player?.country||'País';
  const elo=Number.isFinite(Number(player?.elo_points))?Number(player.elo_points):200;
  const wins=Number.isFinite(Number(player?.wins))?Number(player.wins):0;
  const losses=Number.isFinite(Number(player?.losses))?Number(player.losses):0;
  const gameId=String(player?.game_id||'—');
  const rank=getRankByElo(elo);

  playerDetailName.textContent=displayName;
  playerDetailFlag.textContent=getFlag(country);
  playerDetailCountry.textContent=country;
  playerDetailGameId.textContent=gameId;
  const isAdminProfile=String(player?.username||'').toLowerCase()==='ikar8bp'||player?.is_admin===true;
  const eloStat=playerDetailElo?.closest('.player-detail-stat');
  const winStat=playerDetailWins?.closest('.player-detail-stat');
  const lossStat=playerDetailLosses?.closest('.player-detail-stat');
  const idStat=playerDetailGameId?.closest('.player-detail-stat');
  if(isAdminProfile){
    if(playerDetailRank)playerDetailRank.hidden=true;
    if(idStat)idStat.hidden=true;
    if(eloStat){eloStat.hidden=false;eloStat.classList.add('admin-profile-label');const label=eloStat.querySelector('small');if(label)label.textContent='';playerDetailElo.textContent='ADMINISTRADOR';}
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

  if(player?.avatar_path&&supabaseClient){
    try{
      const {data,error}=await supabaseClient.storage.from('profile-photos').createSignedUrl(player.avatar_path,3600);
      if(!error&&data?.signedUrl&&playerDetailModal.classList.contains('open')){
        const img=document.createElement('img');
        img.src=data.signedUrl;
        img.alt='Foto de '+displayName;
        img.onload=()=>playerDetailAvatar.replaceChildren(img);
      }
    }catch(error){
      console.error('No se pudo cargar la foto del jugador:',error);
    }
  }
}

function buildRankingRow(player,index){
  const row=document.createElement('button');
  row.type='button';
  row.className='ranking-row'+(index===0?' ranking-first':index===1?' ranking-second':index===2?' ranking-third':'');
  row.setAttribute('aria-label','Ver perfil de '+String(player?.username||player?.account_name||'Jugador'));
  row.addEventListener('click',()=>openRankingPlayer(player));
  
  const position=document.createElement('div');
  position.className='ranking-position';
  if(index<3){
    const medal=document.createElement('span');
    medal.className='ranking-medal ranking-medal-'+(index+1);
    medal.textContent=String(index+1);
    position.appendChild(medal);
  }else{
    position.textContent=String(index+1);
  }

  const playerCell=document.createElement('div');
  playerCell.className='ranking-player';
  playerCell.appendChild(createRankingAvatar(player));
  const name=document.createElement('span');
  name.className='ranking-player-name';
  name.textContent=String(player?.username||player?.account_name||'Jugador').toUpperCase();
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
  elo.textContent=String(Number.isFinite(Number(player?.elo_points))?Number(player.elo_points):200);

  row.append(position,playerCell,countryCell,elo);
  return row;
}

async function loadRanking(attempt=0){
  if(!rankingList||!rankingCount||!supabaseClient)return;
  if(attempt===0){
    rankingList.innerHTML='<div class="ranking-loading">Cargando clasificación...</div>';
    rankingCount.textContent='';
  }

  try{
    // La clasificación debe ser visible también para visitantes no registrados.
    const {data,error}=await supabaseClient.rpc('get_ranking');
    if(error){
      if(attempt<8&&(error.code==='42501'||/jwt|session|permission|authorized/i.test(error.message||''))){
        await new Promise(resolve=>setTimeout(resolve,250));
        return loadRanking(attempt+1);
      }
      throw error;
    }

    const players=Array.isArray(data)?data:[];
    rankingPlayersCache=players;
    renderFilteredRanking();


    // renderFilteredRanking() ya se encarga de pintar la lista y el estado vacío.

  }catch(error){
    console.error('Error cargando clasificación:',error);
    rankingList.innerHTML='<div class="ranking-loading ranking-error">No se pudo cargar la clasificación. Toca aquí para reintentar.</div>';
    rankingList.onclick=()=>{rankingList.onclick=null;loadRanking()};
  }
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
  rankingCount.textContent=filtered.length+' '+(filtered.length===1?'JUGADOR':'JUGADORES');
  if(!filtered.length){
    const empty=document.createElement('div');empty.className='ranking-loading';
    empty.textContent=query?'No se encontró ningún jugador.':'Todavía no hay jugadores registrados.';
    rankingList.appendChild(empty);return;
  }
  filtered.forEach(player=>{
    const originalIndex=rankingPlayersCache.indexOf(player);
    rankingList.appendChild(buildRankingRow(player,originalIndex));
  });
}

async function getProfile(userId){
  if(!supabaseClient||!userId)return null;
  const {data,error}=await supabaseClient.from('profiles')
    .select('id, username, game_id, account_name, country, screenshot_path, avatar_path, rank_name, elo_points, wins, losses, created_at')
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

// Mostrar siempre la interfaz pública inmediatamente. La sesión, si existe,
// se restaura después sin bloquear la clasificación ni el resto del sitio.
setGuestUI();
restoreSession().catch(error=>console.error('Error restaurando sesión:',error));

loginBtn.addEventListener('click',()=>{loginError.textContent='';openModal(loginModal,loginUsername)});
registerBtn.addEventListener('click',()=>{registerError.textContent='';openModal(registerModal,username)});
closeRegisterModalBtn.addEventListener('click',()=>closeModal(registerModal));
closeLoginModalBtn.addEventListener('click',()=>closeModal(loginModal));
[registerModal,loginModal].forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)closeModal(modal)}));
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal(registerModal);closeModal(loginModal);closeRankingPlayer();settingsMenu.hidden=true}});
backBtn.addEventListener('click',()=>showToast('Perfil del jugador'));
settingsBtn.addEventListener('click',()=>{settingsMenu.hidden=!settingsMenu.hidden});
if(closePlayerDetail)closePlayerDetail.addEventListener('click',closeRankingPlayer);
if(playerHeartBtn)playerHeartBtn.addEventListener('click',togglePlayerHeart);
if(playerFollowBtn)playerFollowBtn.addEventListener('click',toggleFollow);
if(adminModeBtn)adminModeBtn.addEventListener('click',async()=>{adminPanel.hidden=false;settingsMenu.hidden=true;await loadAdminMatches()});
if(adminCloseBtn)adminCloseBtn.addEventListener('click',()=>adminPanel.hidden=true);
if(adminRefreshBtn)adminRefreshBtn.addEventListener('click',()=>adminPlayerList&&!adminPlayerList.hidden?loadAdminPlayers():loadAdminMatches());
if(adminVsTab)adminVsTab.addEventListener('click',showAdminVs);
if(adminPlayersTab)adminPlayersTab.addEventListener('click',showAdminPlayers);
if(adminModerationTab)adminModerationTab.addEventListener('click',showAdminModeration);
if(dashboardPlayBtn)dashboardPlayBtn.addEventListener('click',async()=>{
  try{
    const {data,error}=await supabaseClient.from('profiles').select('is_admin').eq('id',currentUser.id).single();
    if(error)throw error;
    if(data?.is_admin){
      if(adminPanel)adminPanel.hidden=false;
      if(settingsMenu)settingsMenu.hidden=true;
      await loadAdminMatches();
      return;
    }
  }catch(e){console.error('Comprobación admin:',e)}
  await startRankedMatchmaking();
});
if(matchmakingClose)matchmakingClose.addEventListener('click',closeRankedMatchmaking);
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
function openConversation(userId,userName){
 activeConversationUser={id:userId,name:userName};if(inboxPanel)inboxPanel.hidden=true;if(conversationPanel)conversationPanel.hidden=false;if(conversationTitle)conversationTitle.textContent=String(userName||'Jugador').toUpperCase();renderConversation();
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
async function loadInbox(){
 if(!currentUser||!supabaseClient||!inboxList)return;
 try{
  const {data,error}=await supabaseClient.rpc('get_my_private_messages');if(error)throw error;
  const items=Array.isArray(data)?data:[];inboxMessagesCache=items;renderInbox(items);
  const unread=items.filter(m=>m.recipient_id===currentUser.id&&!m.is_read);
  if(unread.length)await supabaseClient.from('private_messages').update({is_read:true}).eq('recipient_id',currentUser.id).eq('is_read',false);
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
    notificationRefreshTimer=setInterval(()=>{if(currentUser)loadNotifications().catch(()=>{})},15000);
  }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&currentUser)loadNotifications().catch(()=>{})});
setTimeout(startNotificationRefresh,1000);
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
    const {error:uploadError}=await supabaseClient.storage.from('profile-photos').upload(newPath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
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
  if(passwordValue.length<6){registerError.textContent='La contraseña debe tener al menos 6 caracteres.';return}
  if(!idValue||!countryValue){registerError.textContent='Completa todos los datos.';return}

  setRegisterBusy(true);
  try{
    const {data:registerData,error:registerFunctionError}=await supabaseClient.functions.invoke('register-user',{body:{username:usernameValue,password:passwordValue}});
    if(registerFunctionError||!registerData?.ok)throw new Error(registerData?.error||'No se pudo crear la cuenta.');

    const {data:loginData,error:loginAfterRegisterError}=await supabaseClient.auth.signInWithPassword({email:usernameToInternalEmail(usernameValue),password:passwordValue});
    if(loginAfterRegisterError||!loginData?.session||!loginData?.user)throw new Error('La cuenta se creó, pero no se pudo iniciar la sesión automáticamente.');

    const userId=loginData.user.id;
    const {data:newProfile,error:profileError}=await supabaseClient.from('profiles').insert({
      id:userId,username:normalizeUsername(usernameValue),game_id:idValue,account_name:usernameValue.trim(),country:countryValue,screenshot_path:null,avatar_path:null
    }).select('id, username, game_id, account_name, country, screenshot_path, avatar_path, rank_name, elo_points, wins, losses, created_at').single();
    if(profileError)throw new Error('No se pudo guardar el perfil: '+profileError.message);

    registerForm.reset();closeModal(registerModal);await setPlayerUI(newProfile,loginData.user);showToast('Cuenta creada. Rango inicial: Latón · ELO 200.')
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
    const profile=await getProfile(data.user.id);loginForm.reset();closeModal(loginModal);await setPlayerUI(profile,data.user);showToast('Sesión iniciada correctamente.')
  }catch(error){console.error(error);loginError.textContent=error?.message||'No se pudo iniciar sesión.'}
  finally{setLoginBusy(false)}
});

logoutBtn.addEventListener('click',async()=>{settingsMenu.hidden=true;if(supabaseClient)await supabaseClient.auth.signOut();setGuestUI();showToast('Sesión cerrada.')});

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
    if(!session||event==='SIGNED_OUT'){setGuestUI();return}
    if(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'){const profile=await getProfile(session.user.id);await setPlayerUI(profile,session.user)}
  })
}
setTimeout(()=>{if(guestEmpty&&!guestEmpty.hidden)renderGuestRankShowcase().catch(()=>{})},300);

const dashboardChatBtn=document.getElementById('dashboardChatBtn'),generalChatModal=document.getElementById('generalChatModal'),generalChatClose=document.getElementById('generalChatClose'),generalChatMessages=document.getElementById('generalChatMessages'),generalChatForm=document.getElementById('generalChatForm'),generalChatInput=document.getElementById('generalChatInput');
let generalChatTimer=null;
async function loadGeneralChat(){
 if(!generalChatMessages||!supabaseClient)return;
 const {data,error}=await supabaseClient.rpc('get_general_chat_messages');if(error){console.error(error);return}
 const rows=(Array.isArray(data)?data:[]).reverse();generalChatMessages.replaceChildren();
 for(const m of rows){const item=document.createElement('div');item.className='general-chat-message'+(m.user_id===currentUser?.id?' mine':'');const av=document.createElement('div');av.className='general-chat-avatar';if(m.avatar_path){const {data:u}=supabaseClient.storage.from('profile-photos').getPublicUrl(m.avatar_path);if(u?.publicUrl)av.style.backgroundImage='url("'+u.publicUrl+'")'}if(!m.avatar_path)av.textContent=String(m.author_name||'?').charAt(0).toUpperCase();const openChatProfile=async()=>{try{const {data,error}=await supabaseClient.rpc('get_profile_by_id',{p_player_id:m.user_id});if(error)throw error;const player=Array.isArray(data)?data[0]:null;if(player){closeGeneralChat();openRankingPlayer(player)}else showToast('No se encontró ese perfil.')}catch(err){console.error(err);showToast('No se pudo abrir el perfil.')}};av.classList.add('general-chat-profile-link');av.setAttribute('role','button');av.tabIndex=0;av.addEventListener('click',openChatProfile);av.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChatProfile()}});const box=document.createElement('div');const head=document.createElement('strong');head.textContent=m.author_name;head.classList.add('general-chat-profile-link');head.setAttribute('role','button');head.tabIndex=0;head.addEventListener('click',openChatProfile);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openChatProfile()}});const body=document.createElement('p');body.textContent=m.body;const time=document.createElement('small');time.textContent=formatCommentDate(m.created_at);box.append(head,body,time);item.append(av,box);generalChatMessages.append(item)}
 generalChatMessages.scrollTop=generalChatMessages.scrollHeight;
}
function openGeneralChat(){if(!currentUser){showToast('Inicia sesión para usar el chat.');return}generalChatModal.hidden=false;loadGeneralChat();clearInterval(generalChatTimer);generalChatTimer=setInterval(loadGeneralChat,2500);setTimeout(()=>generalChatInput?.focus(),50)}
function closeGeneralChat(){generalChatModal.hidden=true;clearInterval(generalChatTimer);generalChatTimer=null}
dashboardChatBtn?.addEventListener('click',openGeneralChat);generalChatClose?.addEventListener('click',closeGeneralChat);
generalChatForm?.addEventListener('submit',async e=>{e.preventDefault();const body=generalChatInput.value.trim();if(!body||!currentUser)return;const {error}=await supabaseClient.from('general_chat_messages').insert({user_id:currentUser.id,body});if(error){showToast('No se pudo enviar el mensaje.');return}generalChatInput.value='';await loadGeneralChat()});

const PUSH_VAPID_PUBLIC='BJ5JeRALHigbb-mAs1abfCn1vpMo8Z4QI2puRD2PXcM8MLRXEqeRMfbfW0NNugIkrN3xilbKXhuFNmUrX-8ptIs';
const pushEnableBtn=document.getElementById('pushEnableBtn');
function vapidBytes(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(x=>x.charCodeAt(0)))}
async function enablePushNotifications(){
 if(!currentUser){showToast('Inicia sesión primero.');return}
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){showToast('Este navegador no permite notificaciones push.');return}
 try{const permission=await Notification.requestPermission();if(permission!=='granted'){showToast('Debes permitir las notificaciones.');return}const reg=await navigator.serviceWorker.register('./sw.js?v=1');await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(PUSH_VAPID_PUBLIC)});const j=sub.toJSON();const {error}=await supabaseClient.from('push_subscriptions').upsert({user_id:currentUser.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth},{onConflict:'endpoint'});if(error)throw error;pushEnableBtn.textContent='🔔 NOTIFICACIONES ACTIVADAS';pushEnableBtn.classList.add('enabled');showToast('Notificaciones activadas en este dispositivo.')}catch(e){console.error(e);showToast('No se pudieron activar las notificaciones.')}
}
pushEnableBtn?.addEventListener('click',enablePushNotifications);

if(rankingSearchInput) rankingSearchInput.addEventListener('input',renderFilteredRanking);

if(guestRankingSearchInput)guestRankingSearchInput.addEventListener('input',renderGuestRanking);
