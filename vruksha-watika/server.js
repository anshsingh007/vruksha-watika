// Vruksha Watika backend: zero dependencies (Node built-ins only). JSON-file database.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=path.join(__dirname,'data'),DBF=path.join(DIR,'db.json'),PUB=path.join(__dirname,'public');
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
let db;
function init(){try{db=JSON.parse(fs.readFileSync(DBF,'utf8'))}catch{
 const plants=fs.readFileSync(path.join(DIR,'seed.txt'),'utf8').split('\n').map((l,i)=>{const[n,b,c,p,s,w]=l.split('|');return{id:i+1,n,b,c,p:+p,sale:0,stock:+s,low:5,w:+w,on:1}});
 db={plants,orders:[],tasks:[{id:1,t:'Water plants in the morning',who:'Staff',due:iso(),pri:'High',st:'To Do'}],moves:[],admin:null,secret:crypto.randomBytes(32).toString('hex'),nid:1};persist()}}
function persist(){fs.writeFileSync(DBF+'.tmp',JSON.stringify(db,null,1));fs.renameSync(DBF+'.tmp',DBF)}
const J=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const readBody=req=>new Promise(ok=>{let b='';req.on('data',d=>{b+=d;if(b.length>2e6){req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(b||'{}'))}catch{ok({})}})});
const hmac=s=>crypto.createHmac('sha256',db.secret).update(s).digest('base64url');
const sign=p=>{const s=Buffer.from(JSON.stringify(p)).toString('base64url');return s+'.'+hmac(s)};
function authed(req){const t=(req.headers.authorization||'').replace('Bearer ','');const[s,g]=t.split('.');if(!s||!g)return false;
 const a=Buffer.from(g),b=Buffer.from(hmac(s));if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
 try{return JSON.parse(Buffer.from(s,'base64url')).exp>Date.now()}catch{return false}}
const tries={};function limited(ip){const t=tries[ip]=(tries[ip]||[]).filter(x=>Date.now()-x<6e4);t.push(Date.now());return t.length>8}
const price=p=>p.sale>0&&p.sale<p.p?p.sale:p.p, str=(v,n)=>String(v||'').trim().slice(0,n);
const live=()=>db.orders.filter(o=>o.status!=='Cancelled'),sum=l=>l.reduce((a,o)=>a+o.total,0);
function dashboard(){const t=iso(),L=live(),td=L.filter(o=>o.date===t),days=[];
 for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=iso(d);days.push({d:k.slice(5),v:sum(L.filter(o=>o.date===k)),n:L.filter(o=>o.date===k).length})}
 const cat={},best={};L.forEach(o=>o.items.forEach(x=>{const p=db.plants.find(q=>q.id===x.id);cat[p?p.c:'Other']=(cat[p?p.c:'Other']||0)+x.price*x.q;best[x.n]=(best[x.n]||0)+x.q}));
 return{kpi:{today:sum(td),collected:sum(td.filter(o=>o.status==='Delivered')),ordersToday:db.orders.filter(o=>o.date===t).length,pending:db.orders.filter(o=>o.status==='Pending').length,cancelled:db.orders.filter(o=>o.status==='Cancelled').length,month:sum(L.filter(o=>o.date.slice(0,7)===t.slice(0,7))),overall:sum(L),plants:db.plants.length,openTasks:db.tasks.filter(k=>k.st!=='Completed').length},
 days,cats:Object.entries(cat).map(([c,v])=>({c,v})),best:Object.entries(best).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,q])=>({n,q})),
 low:db.plants.filter(p=>p.on&&p.stock<=p.low).map(p=>({n:p.n,stock:p.stock,low:p.low})),recent:db.orders.slice(-6).reverse().map(o=>({no:o.no,name:o.name,total:o.total,status:o.status}))}}
async function api(req,res,url){const m=req.method,p=url.pathname,ip=req.socket.remoteAddress;
 if(p==='/api/plants'&&m==='GET')return J(res,200,{plants:db.plants.filter(x=>x.on),adminSet:!!db.admin});
 if(p==='/api/orders'&&m==='POST'){const b=await readBody(req),name=str(b.name,80),ph=str(b.phone,10),addr=str(b.addr,300);
  if(name.length<2||!/^\d{10}$/.test(ph)||addr.length<8)return J(res,400,{error:'Enter a name, 10-digit phone and full address'});
  const items=[];for(const x of Array.isArray(b.items)?b.items.slice(0,50):[]){const pl=db.plants.find(q=>q.id===+x.id),q=Math.floor(+x.q);
   if(!pl||!pl.on||!(q>0)||q>pl.stock)return J(res,409,{error:(pl?pl.n:'A plant')+' is not available in that quantity'});items.push({id:pl.id,n:pl.n,price:price(pl),q})}
  if(!items.length)return J(res,400,{error:'Cart is empty'});
  const no='VW'+iso().replace(/-/g,'')+db.nid++;items.forEach(x=>{db.plants.find(q=>q.id===x.id).stock-=x.q;db.moves.push({d:new Date().toLocaleString(),n:x.n,t:'Sale',q:-x.q,r:no})});
  db.orders.push({no,date:iso(),items,total:items.reduce((a,x)=>a+x.price*x.q,0),status:'Pending',back:false,name,phone:ph,addr});persist();return J(res,201,{no})}
 if(p==='/api/admin/login'&&m==='POST'){if(limited(ip))return J(res,429,{error:'Too many attempts. Wait a minute.'});const v=str((await readBody(req)).passcode,100);if(v.length<6)return J(res,400,{error:'Use at least 6 characters'});
  if(!db.admin){const salt=crypto.randomBytes(16).toString('hex');db.admin={salt,hash:crypto.scryptSync(v,salt,64).toString('hex')};persist()}
  else{const h=crypto.scryptSync(v,db.admin.salt,64);if(!crypto.timingSafeEqual(h,Buffer.from(db.admin.hash,'hex')))return J(res,401,{error:'Wrong passcode'})}
  return J(res,200,{token:sign({exp:Date.now()+12*36e5})})}
 if(p.startsWith('/api/admin/')){if(!authed(req))return J(res,401,{error:'Unauthorized'});
  if(p==='/api/admin/data'&&m==='GET')return J(res,200,{plants:db.plants,orders:db.orders,tasks:db.tasks,moves:db.moves.slice(-200)});
  if(p==='/api/admin/dashboard'&&m==='GET')return J(res,200,dashboard());
  if(p==='/api/admin/sync'&&m==='PUT'){const b=await readBody(req);for(const k of['plants','orders','tasks','moves'])if(Array.isArray(b[k]))db[k]=b[k].slice(-5000);persist();return J(res,200,{ok:true})}}
 J(res,404,{error:'Not found'})}
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','same-origin');
 try{const url=new URL(req.url,'http://x');if(url.pathname.startsWith('/api/'))return await api(req,res,url);
  const f=path.normalize(path.join(PUB,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname)));
  if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}catch(e){console.error(e);J(res,500,{error:'Server error'})}
}).listen(PORT,()=>console.log('Vruksha Watika running on http://localhost:'+PORT));
init();
