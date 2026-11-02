export async function visit(request,env){
 const origin=new URL(request.url).origin;
 if(request.method!=='POST')return new Response(null,{status:405});
 if(request.headers.get('Origin')!==origin||request.headers.get('Content-Type')!=='application/json')return new Response(null,{status:403});
 if(Number(request.headers.get('Content-Length')||0)>200)return new Response(null,{status:413});
 try{const raw=await request.text();if(raw.length>200)return new Response(null,{status:413});const {id}=JSON.parse(raw);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return new Response(null,{status:400});
  // Atomic insert + trigger; a session UUID can only increment once. No URLs or IPs stored.
  const rows=await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO visits (id, created_at) VALUES (?, ?)').bind(id,Date.now()),env.DB.prepare('SELECT count FROM totals WHERE id = 1')]);
  const count=rows[1].results?.[0]?.count;if(!Number.isSafeInteger(count))throw Error();return Response.json({count},{headers:{'Cache-Control':'no-store'}});
 }catch{return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});}
}
