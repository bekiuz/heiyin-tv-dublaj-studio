export interface Env {
 TELEGRAM_BOT_TOKEN:string;
 TELEGRAM_WEBHOOK_SECRET?:string;
 TELEGRAM_ADMIN_ID?:string;
 WEB_URL?:string;
 DB?:D1Database;
}
type TgMessage={chat:{id:number};text?:string;caption?:string;video?:{file_id:string};document?:{file_id:string;mime_type?:string};};
type TgUpdate={message?:TgMessage};
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Range","Access-Control-Expose-Headers":"Content-Length,Content-Range,Accept-Ranges"};
async function send(env:Env,chat_id:number,text:string,keyboard?:unknown){
 return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id,text,...(keyboard?{reply_markup:keyboard}:{})})});
}
function parseCaption(caption:string){
 const parts=caption.split('|').map(x=>x.trim());
 const type=(parts[0]||'ANIME').toUpperCase();
 return {type:['ANIME','FILM','SERIAL'].includes(type)?type:'ANIME',title:parts[1]||'Telegram video',year:Number(parts[2])||null,description:parts.slice(3).join('|')||caption||''};
}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url);
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(url.pathname==='/health')return Response.json({ok:true,service:'HEIYIN TV API',database:!!env.DB},{headers:cors});
 if(url.pathname==='/api/catalog'&&req.method==='GET'){
  if(!env.DB)return Response.json({ok:false,error:'D1 database is not bound'},{status:500,headers:cors});
  const q=(url.searchParams.get('q')||'').trim();
  const type=(url.searchParams.get('type')||'').trim().toUpperCase();
  let sql='SELECT id,title,type,year,description,poster_url,video_url,featured,CASE WHEN video_file_id IS NOT NULL AND video_file_id != \'\' THEN 1 ELSE 0 END AS has_video FROM titles WHERE 1=1';
  const params:(string|number)[]=[];
  if(q){sql+=' AND title LIKE ?';params.push('%'+q+'%');}
  if(type&&type!=='HAMMASI'){sql+=' AND UPPER(type)=?';params.push(type);}
  sql+=' ORDER BY featured DESC, created_at DESC LIMIT 100';
  const result=await env.DB.prepare(sql).bind(...params).all();
  return Response.json({ok:true,results:result.results||[]},{headers:cors});
 }
 if(url.pathname.startsWith('/api/video/')&&req.method==='GET'){
  if(!env.DB||!env.TELEGRAM_BOT_TOKEN)return new Response('Video service unavailable',{status:503,headers:cors});
  const id=Number(url.pathname.split('/').pop());
  if(!Number.isInteger(id)||id<1)return new Response('Invalid video id',{status:400,headers:cors});
  const row=await env.DB.prepare('SELECT video_file_id,video_url FROM titles WHERE id=?').bind(id).first<{video_file_id:string;video_url:string}>();
  if(!row)return new Response('Video not found',{status:404,headers:cors});
  if(row.video_url)return Response.redirect(row.video_url,302);
  if(!row.video_file_id)return new Response('No video attached',{status:404,headers:cors});
  const fileInfo=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(row.video_file_id)}`);
  if(!fileInfo.ok)return new Response('Telegram file lookup failed',{status:502,headers:cors});
  const info:any=await fileInfo.json();
  const path=info?.result?.file_path;
  if(!path)return new Response('Video file unavailable',{status:502,headers:cors});
  const headers=new Headers();
  const range=req.headers.get('Range');
  if(range)headers.set('Range',range);
  const video=await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${path}`,{headers});
  const outHeaders=new Headers(cors);
  outHeaders.set('Content-Type',video.headers.get('Content-Type')||'video/mp4');
  outHeaders.set('Accept-Ranges',video.headers.get('Accept-Ranges')||'bytes');
  for(const key of ['Content-Length','Content-Range']){const value=video.headers.get(key);if(value)outHeaders.set(key,value);}
  return new Response(video.body,{status:video.status,headers:outHeaders});
 }
 if(url.pathname==='/telegram/webhook'&&req.method==='POST'){
  if(env.TELEGRAM_WEBHOOK_SECRET&&req.headers.get('x-telegram-bot-api-secret-token')!==env.TELEGRAM_WEBHOOK_SECRET)return new Response('Unauthorized',{status:401});
  const update=await req.json() as TgUpdate;const msg=update.message;if(!msg?.chat?.id)return Response.json({ok:true});
  const chat=msg.chat.id;const text=(msg.text||'').trim();
  if(!env.TELEGRAM_BOT_TOKEN)return Response.json({ok:false,error:'Telegram token missing'},{status:500});
  if(text==='/start')await send(env,chat,'🎬 HEIYIN TV\nAnime, film va serial katalogi.\n\nVideo yuborsangiz, u sayt katalogiga qo‘shiladi. Caption format:\nANIME | Nomi | 2026 | Tavsif\n\nFILM yoki SERIAL ham yozishingiz mumkin.',{inline_keyboard:[[{text:'🌐 Sayt',url:env.WEB_URL||'https://heiyin-tv.pages.dev'}]]});
  else if(text==='/help')await send(env,chat,'🎞 Video yuborish: videoga caption yozing.\nANIME | Nomi | yil | tavsif\nFILM | Nomi | yil | tavsif\nSERIAL | Nomi | yil | tavsif\n\n/start — boshlash');
  else if(msg.video||(msg.document?.mime_type||'').startsWith('video/')){
   if(!env.DB){await send(env,chat,'Katalog bazasi hozir ulanmagan.');}
   else if(env.TELEGRAM_ADMIN_ID&&String(chat)!==env.TELEGRAM_ADMIN_ID){await send(env,chat,'Video qo‘shish faqat administrator uchun.');}
   else {
    const fileId=msg.video?.file_id||msg.document?.file_id;
    const meta=parseCaption(msg.caption||'');
    if(!fileId)await send(env,chat,'Video faylni aniqlay olmadim.');
    else {
     const result=await env.DB.prepare('INSERT INTO titles(title,type,year,description,poster_url,video_file_id,featured) VALUES(?,?,?,?,?,?,0)').bind(meta.title,meta.type,meta.year,meta.description,'',fileId).run();
     await send(env,chat,`✅ HEIYIN TV katalogiga qo‘shildi!\n🎬 ${meta.title}\n📂 ${meta.type}\n\nSayt katalogida ko‘rinishi mumkin.`);
    }
   }
  }
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
