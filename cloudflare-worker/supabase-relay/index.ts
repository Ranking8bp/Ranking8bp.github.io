// Supabase Database Webhook -> Cloudflare event relay (deploy only after secret setup).
// Never forwards row data, messages, passwords or videos.
const enc = new TextEncoder();
function eq(a,b){
  if(!a||!b)return false;
  const x=enc.encode(a),y=enc.encode(b);let d=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);
  return d===0;
}
const answer=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json"}});
function changed(newRow,oldRow,fields){
  if(!oldRow)return true;
  return fields.some(k=>JSON.stringify(newRow?.[k])!==JSON.stringify(oldRow?.[k]));
}
function eventsFor(p){
  if(p?.schema!=="public"||!["INSERT","UPDATE","DELETE"].includes(p.type))return [];
  const n=p.record||p.old_record||{},o=p.old_record||null,e=[];
  switch(p.table){
    case "profiles":
      if(changed(n,o,["elo_points","rank_name","wins","losses","avatar_path","username","account_name","country"]))
        e.push({feed:"ranking"},{feed:"daily"});
      break;
    case "ranked_matches":
      if(changed(n,o,["status","winner_id","loser_id","finished_at"]))e.push({feed:"ranking"});
      if(n.id)e.push({mode:"ranked",room:Number(n.id),type:"room.changed"});
      break;
    case "daily_classification_matches":
      if(changed(n,o,["status","player1_claim","player2_claim","winner_id","finished_at"]))e.push({feed:"daily"});
      if(n.id)e.push({mode:"daily",room:Number(n.id),type:"room.changed"});
      break;
    case "ranked_match_messages":
      if(p.type==="INSERT"&&n.match_id)e.push({mode:"ranked",room:Number(n.match_id),type:"chat.changed"});
      break;
    case "daily_classification_chat":
      if(p.type==="INSERT"&&n.match_id)e.push({mode:"daily",room:Number(n.match_id),type:"chat.changed"});
      break;
    case "daily_classification_winners":
      e.push({feed:"daily"});
  }
  return e;
}
Deno.serve(async request=>{
  if(request.method!=="POST")return answer({error:"Method not allowed"},405);
  const secret=Deno.env.get("SUPABASE_WEBHOOK_SECRET");
  const eventSecret=Deno.env.get("EVENT_SECRET");
  const workerUrl=Deno.env.get("WORKER_URL");
  if(!secret||!eventSecret||!workerUrl)return answer({error:"Missing server configuration"},503);
  if(!eq(request.headers.get("x-ranking-webhook-secret"),secret))return answer({error:"Unauthorized"},401);
  const raw=await request.text();
  if(raw.length>65536)return answer({error:"Too large"},413);
  let payload;try{payload=JSON.parse(raw)}catch(_){return answer({error:"Invalid JSON"},400)}
  const events=eventsFor(payload);
  if(!events.length)return answer({delivered:0});
  const url=workerUrl.replace(/\/+$/,"")+"/internal/event";
  const results=await Promise.allSettled(events.map(async event=>{
    const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json","x-event-secret":eventSecret},body:JSON.stringify(event),signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw Error("Event gateway HTTP "+r.status);
  }));
  const failed=results.filter(r=>r.status==="rejected").length;
  return answer({delivered:events.length-failed,failed},failed?502:200);
});
