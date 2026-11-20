export interface Env {
 TELEGRAM_BOT_TOKEN:string;
 TELEGRAM_WEBHOOK_SECRET?:string;
 WEB_URL?:string;
 DB?:D1Database;
}
type TgUpdate={message?:{chat:{id:number};text?:string}};
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
async function send(env:Env,chat_id:number,text:string,keyboard?:unknown){
 return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id,text,...(keyboard?{reply_markup:keyboard}:{})})});
}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url);
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(url.pathname==='/health')return Response.json({ok:true,service:'HEIYIN TV API',database:!!env.DB},{headers:cors});
 if(url.pathname==='/api/catalog'&&req.method==='GET'){
  if(!env.DB)return Response.json({ok:false,error:'D1 database is not bound'},{status:500,headers:cors});
  const q=(url.searchParams.get('q')||'').trim();
  const type=(url.searchParams.get('type')||'').trim().toUpperCase();
  let sql='SELECT id,title,type,year,description,poster_url FROM titles WHERE 1=1';
  const params:(string|number)[]=[];
  if(q){sql+=' AND title LIKE ?';params.push('%'+q+'%');}
  if(type&&type!=='HAMMASI'){sql+=' AND UPPER(type)=?';params.push(type);}
  sql+=' ORDER BY created_at DESC LIMIT 50';
  const result=await env.DB.prepare(sql).bind(...params).all();
  return Response.json({ok:true,results:result.results||[]},{headers:cors});
 }
 if(url.pathname==='/telegram/webhook'&&req.method==='POST'){
  if(env.TELEGRAM_WEBHOOK_SECRET&&req.headers.get('x-telegram-bot-api-secret-token')!==env.TELEGRAM_WEBHOOK_SECRET)return new Response('Unauthorized',{status:401});
  const update=await req.json() as TgUpdate;const msg=update.message;if(!msg?.chat?.id)return Response.json({ok:true});
  const chat=msg.chat.id;const text=(msg.text||'').trim();
  if(!env.TELEGRAM_BOT_TOKEN)return Response.json({ok:false,error:'Telegram token missing'},{status:500});
  if(text==='/start')await send(env,chat,'🎬 HEIYIN TV\nAnime, film va seriallarni katalogdan qidiring.\n\nNomini yuboring — mavjud katalogdan izlayman.',{inline_keyboard:[[{text:'🌐 Sayt',url:env.WEB_URL||'https://heiyin-tv.pages.dev'}]]});
  else if(text==='/help')await send(env,chat,'🔎 Anime, film yoki serial nomini yozing.\n/start — boshlash');
  else if(text){
   if(!env.DB)await send(env,chat,'Katalog bazasi hozir ulanmagan.');
   else {
    const result=await env.DB.prepare('SELECT title,type,year,description FROM titles WHERE title LIKE ? LIMIT 10').bind('%'+text+'%').all();
    const rows=result.results||[];
    if(rows.length)await send(env,chat,'🔎 Qidiruv natijalari:\n\n'+rows.map((x:any)=>'🎬 '+x.title+' ('+x.type+(x.year?', '+x.year:'')+')\n'+(x.description||'')).join('\n\n'));
    else await send(env,chat,'🔎 "'+text+'" bo‘yicha topilmadi. Boshqa nom bilan urinib ko‘ring.');
   }
  }
  return Response.json({ok:true});
 }
 return new Response('Not found',{status:404});
}};