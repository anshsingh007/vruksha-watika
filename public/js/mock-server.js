// In-browser backend: same API as server.js, data kept in localStorage.
// Auto-disabled when the real Node backend (node server.js) is running.
(()=>{try{const x=new XMLHttpRequest();x.open('GET','/api/plants',false);x.send();if(x.status===200&&JSON.parse(x.responseText).plants)return}catch(e){}
const KEY='vw_db',SEED=`Money Plant|Epipremnum aureum|Indoor|120|40|5
Snake Plant|Dracaena trifasciata|Indoor|250|25|14
Tulsi|Ocimum tenuiflorum|Medicinal|60|60|2
Aloe Vera|Aloe vera|Medicinal|150|30|10
Peace Lily|Spathiphyllum wallisii|Indoor|320|18|5
Areca Palm|Dypsis lutescens|Indoor|380|12|4
Spider Plant|Chlorophytum comosum|Indoor|140|35|6
Rose|Rosa indica|Flowering|180|28|3
Hibiscus|Hibiscus rosa-sinensis|Flowering|200|22|2
Jasmine|Jasminum sambac|Flowering|170|26|3
Marigold|Tagetes erecta|Flowering|40|80|2
Neem|Azadirachta indica|Medicinal|220|15|5
Mango|Mangifera indica|Fruit|450|8|4
Lemon|Citrus limon|Fruit|350|10|4
Bougainvillea|Bougainvillea glabra|Outdoor|240|20|4
Lucky Bamboo|Dracaena sanderiana|Indoor|180|30|7
Jade Plant|Crassula ovata|Indoor|200|24|12
ZZ Plant|Zamioculcas zamiifolia|Indoor|420|9|14
Curry Leaf Plant|Murraya koenigii|Outdoor|130|33|3
Guava Plant|Psidium guajava|Fruit|300|14|4`;
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
let db;try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!db)db={plants:SEED.split('\n').map((l,i)=>{const[n,b,c,p,s,w]=l.split('|');return{id:i+1,n,b,c,p:+p,sale:0,stock:+s,low:5,w:+w,on:1}}),orders:[],tasks:[{id:1,t:'Water plants in the morning',who:'Staff',due:iso(),pri:'High',st:'To Do'}],moves:[],admin:null,nid:1};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};persist();
async function sha(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('vw:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of 'vw:'+s)h=(h*33^c.charCodeAt(0))>>>0;return'f'+h}}
const price=p=>p.sale>0&&p.sale<p.p?p.sale:p.p,str=(v,n)=>String(v||'').trim().slice(0,n),live=()=>db.orders.filter(o=>o.status!=='Cancelled'),sum=l=>l.reduce((a,o)=>a+o.total,0);
function dashboard(){const t=iso(),L=live(),td=L.filter(o=>o.date===t),days=[];
 for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=iso(d);days.push({d:k.slice(5),v:sum(L.filter(o=>o.date===k)),n:L.filter(o=>o.date===k).length})}
 const cat={},best={};L.forEach(o=>o.items.forEach(x=>{const p=db.plants.find(q=>q.id===x.id),c=p?p.c:'Other';cat[c]=(cat[c]||0)+x.price*x.q;best[x.n]=(best[x.n]||0)+x.q}));
 return{kpi:{today:sum(td),collected:sum(td.filter(o=>o.status==='Delivered')),ordersToday:db.orders.filter(o=>o.date===t).length,pending:db.orders.filter(o=>o.status==='Pending').length,cancelled:db.orders.filter(o=>o.status==='Cancelled').length,month:sum(L.filter(o=>o.date.slice(0,7)===t.slice(0,7))),overall:sum(L),plants:db.plants.length,openTasks:db.tasks.filter(k=>k.st!=='Completed').length},
 days,cats:Object.entries(cat).map(([c,v])=>({c,v})),best:Object.entries(best).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,q])=>({n,q})),
 low:db.plants.filter(p=>p.on&&p.stock<=p.low).map(p=>({n:p.n,stock:p.stock,low:p.low})),recent:db.orders.slice(-6).reverse().map(o=>({no:o.no,name:o.name,total:o.total,status:o.status}))}}
async function route(m,p,b,auth){
 if(p==='/api/plants'&&m==='GET')return[200,{plants:db.plants.filter(x=>x.on),adminSet:!!db.admin}];
 if(p==='/api/orders'&&m==='POST'){const name=str(b.name,80),ph=str(b.phone,10),addr=str(b.addr,300);
  if(name.length<2||!/^\d{10}$/.test(ph)||addr.length<8)return[400,{error:'Enter a name, 10-digit phone and full address'}];
  const items=[];for(const x of Array.isArray(b.items)?b.items.slice(0,50):[]){const pl=db.plants.find(q=>q.id===+x.id),q=Math.floor(+x.q);if(!pl||!pl.on||!(q>0)||q>pl.stock)return[409,{error:(pl?pl.n:'A plant')+' is not available in that quantity'}];items.push({id:pl.id,n:pl.n,price:price(pl),q})}
  if(!items.length)return[400,{error:'Cart is empty'}];
  const no='VW'+iso().replace(/-/g,'')+db.nid++;items.forEach(x=>{db.plants.find(q=>q.id===x.id).stock-=x.q;db.moves.push({d:new Date().toLocaleString(),n:x.n,t:'Sale',q:-x.q,r:no})});
  db.orders.push({no,date:iso(),items,total:items.reduce((a,x)=>a+x.price*x.q,0),status:'Pending',back:false,name,phone:ph,addr});persist();return[201,{no}]}
 if(p==='/api/admin/login'&&m==='POST'){const v=str(b.passcode,100);if(v.length<6)return[400,{error:'Use at least 6 characters'}];const h=await sha(v);
  if(!db.admin){db.admin=h;persist()}else if(db.admin!==h)return[401,{error:'Wrong passcode'}];return[200,{token:'mock.'+(Date.now()+12*36e5)}]}
 if(p.startsWith('/api/admin/')){const t=(auth||'').replace('Bearer ','');if(!t.startsWith('mock.')||+t.slice(5)<Date.now())return[401,{error:'Unauthorized'}];
  if(p==='/api/admin/data')return[200,{plants:db.plants,orders:db.orders,tasks:db.tasks,moves:db.moves.slice(-200)}];
  if(p==='/api/admin/dashboard')return[200,dashboard()];
  if(p==='/api/admin/sync'&&m==='PUT'){for(const k of['plants','orders','tasks','moves'])if(Array.isArray(b[k]))db[k]=b[k].slice(-5000);persist();return[200,{ok:true}]}}
 return[404,{error:'Not found'}]}
const rf=window.fetch.bind(window);
window.fetch=async(u,o={})=>{const url=String(u);if(!url.includes('/api/'))return rf(u,o);const p=new URL(url,location.href).pathname.replace(/^.*(\/api\/)/,'/api/');
 let b={};try{b=JSON.parse(o.body||'{}')}catch(e){}const[s,j]=await route((o.method||'GET').toUpperCase(),p,b,(o.headers||{}).Authorization);
 return new Response(JSON.stringify(j),{status:s,headers:{'Content-Type':'application/json'}})};
})();
