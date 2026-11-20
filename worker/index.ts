export interface Env { TELEGRAM_BOT_TOKEN:string; TELEGRAM_WEBHOOK_SECRET?:string; WEB_URL?:string; DB?:D1Database }
type TgUpdate={message?:{chat:{id:number};text?:string}};
async function send(env:Env,chat_id:number,text:string,keyboard?:unknown){return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id,text, ...(keyboard?{reply_markup:keyboard}:{})})});}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url);
 if(url.pathname==='/health')return Response.json({ok:true,service:'Heiyin TV API'});
 if(url.pathname==='/telegram/webhook'&&req.method==='POST'){
  if(env.TELEGRAM_WEBHOOK_SECRET&&req.headers.get('x-telegram-bot-api-secret-token')!==env.TELEGRAM_WEBHOOK_SECRET)return new Response('Unauthorized',{status:401});
  const update=await req.json() as TgUpdate;const msg=update.message;if(!msg?.chat?.id)return Response.json({ok:true});
  const text=(msg.text||'').trim();
  if(text==='/start'){await send(env,msg.chat.id,'🎬 HEIYIN TV\nAnime, film va seriallar katalogiga xush kelibsiz!',{inline_keyboard:[[{text:'🌐 Saytni ochish',url:env.WEB_URL||'https://heiyin-tv.pages.dev'}]]});}
  else if(text==='/help'){await send(env,msg.chat.id,'Anime, film yoki serial nomini yozib qidirishingiz mumkin. Katalog tez orada ulanadi.');}
  else {await send(env,msg.chat.id,'🔎 Qidiruv: '+text+'\nKatalog integratsiyasi keyingi bosqichda ulanadi.');}
  return Response.json({ok:true});
 }
 return new Response('Not found',{status:404});
}};
