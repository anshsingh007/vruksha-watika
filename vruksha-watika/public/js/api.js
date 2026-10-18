// Connects the original UI to the backend + adds the animated admin dashboard.
let TOK=sessionStorage.getItem('vw_tok')||'';AT='dash';
async function api(u,m='GET',b){try{const r=await fetch(u,{method:m,headers:{'Content-Type':'application/json',...(TOK?{Authorization:'Bearer '+TOK}:{})},body:b?JSON.stringify(b):undefined}),j=await r.json();
 if(r.status==401&&TOK&&!u.includes('login')){TOK='';sessionStorage.removeItem('vw_tok');A=0;render()}return j}catch(e){return{error:'Server not reachable'}}}
const push=()=>api('/api/admin/sync','PUT',{plants:S.plants,orders:S.orders,tasks:S.tasks,moves:S.moves});
window.save=()=>{try{localStorage.setItem(K,JSON.stringify({cart:S.cart,mine:S.mine,nid:S.nid}))}catch(x){}if(A){clearTimeout(window._pt);window._pt=setTimeout(push,300)}};
async function loadPlants(){const r=await api('/api/plants');if(r.plants){if(!A)S.plants=r.plants;S.admin=r.adminSet;for(const id in S.cart)if(!pl(id))delete S.cart[id]}}
async function pull(){const r=await api('/api/admin/data');if(r.plants){S.plants=r.plants;S.orders=r.orders;S.tasks=r.tasks;S.moves=r.moves;return true}return false}
window.login=async()=>{const v=$('#pw').value;if(v.length<6)return toast('Use at least 6 characters');const r=await api('/api/admin/login','POST',{passcode:v});
 if(!r.token)return toast(r.error||'Login failed');TOK=r.token;sessionStorage.setItem('vw_tok',TOK);await pull();A=1;S.admin=1;render()};
window.logout=async()=>{TOK='';sessionStorage.removeItem('vw_tok');A=0;S.orders=[];S.tasks=[];S.moves=[];await loadPlants();render()};
window.order=async()=>{const name=$('#cn').value.trim(),phone=$('#cp').value.trim(),addr=$('#ca').value.trim();
 if(name.length<2||!/^\d{10}$/.test(phone)||addr.length<8)return toast('Enter a name, 10-digit phone and full address');
 const r=await api('/api/orders','POST',{name,phone,addr,items:Object.entries(S.cart).map(([id,q])=>({id:+id,q}))});if(!r.no)return toast(r.error||'Could not place order');
 S.cart={};save();await loadPlants();V='shop';render();toast('Order '+r.no+' placed. Pay on delivery.');window.petals&&petals()};
// ---- Animated dashboard ----
const PAL=['#6aa84f','#d9a21b','#b5532a','#4f8a43','#8a6fb3'];
function dashHTML(d){const k=d.kpi,K=[['Today gross',k.today,1],['Today collected',k.collected,1],['Orders today',k.ordersToday],['Pending',k.pending],['Cancelled',k.cancelled],['This month',k.month,1],['Overall revenue',k.overall,1],['Plants',k.plants],['Open tasks',k.openTasks]];
 const mx=Math.max(1,...d.days.map(x=>x.v)),W=560,H=170,pts=d.days.map((x,i)=>[20+i*(W-40)/13,H-20-x.v/mx*(H-50)]),line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
 const tot=d.cats.reduce((a,c)=>a+c.v,0)||1;let acc=0;const C=2*Math.PI*40;
 const seg=d.cats.map((c,i)=>{const l=c.v/tot*C,s=`<circle class="seg" cx="60" cy="60" r="40" fill="none" stroke="${PAL[i%5]}" stroke-width="18" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-acc}" transform="rotate(-90 60 60)"><title>${E(c.c)}: ${inr(c.v)}</title></circle>`;acc+=l;return s}).join('');
 return`<div class="kpis">${K.map(x=>`<div class="kpi"><b data-n="${x[1]}" ${x[2]?'data-m="1"':''}>0</b><span>${x[0]}</span></div>`).join('')}</div>
<div class="dgrid"><div class="panel wide"><h3>Revenue, last 14 days</h3><svg viewBox="0 0 ${W} ${H}" class="area"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--l)" stop-opacity=".45"/><stop offset="1" stop-color="var(--l)" stop-opacity="0"/></linearGradient></defs><path d="${line}L${pts[13][0]} ${H-20}L20 ${H-20}Z" fill="url(#ag)" class="fadein"/><path d="${line}" fill="none" stroke="var(--g)" stroke-width="3" stroke-linecap="round" pathLength="1" class="ln"/>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--card)" stroke="var(--g)" stroke-width="2" class="dot" style="animation-delay:${.9+i*.05}s"><title>${d.days[i].d}: ${inr(d.days[i].v)} (${d.days[i].n} orders)</title></circle>`).join('')}${d.days.map((x,i)=>i%2?'':`<text x="${pts[i][0]}" y="${H-4}" font-size="10" text-anchor="middle" fill="var(--mut)">${x.d}</text>`).join('')}</svg></div>
<div class="panel"><h3>Sales by category</h3>${d.cats.length?`<div class="row"><svg viewBox="0 0 120 120" width="130">${seg}</svg><div>${d.cats.map((c,i)=>`<p class="lg"><i style="background:${PAL[i%5]}"></i>${E(c.c)} ${Math.round(c.v/tot*100)}%</p>`).join('')}</div></div>`:'<p class="note">No sales yet. Place a test order from the shop.</p>'}</div>
<div class="panel"><h3>Best sellers</h3>${d.best.map(b=>`<div class="bar"><span>${E(b.n)}</span><i style="--w:${b.q/d.best[0].q*100}%"></i><b>${b.q}</b></div>`).join('')||'<p class="note">No sales yet.</p>'}</div>
<div class="panel"><h3>Low-stock alerts</h3>${d.low.map(p=>`<div class="bar low"><span>${E(p.n)}</span><i style="--w:${Math.max(6,p.stock/Math.max(1,p.low)*100)}%"></i><b>${p.stock}</b></div>`).join('')||'<p class="note">All plants have healthy stock.</p>'}</div>
<div class="panel wide"><h3>Recent orders</h3>${d.recent.map(o=>`<p class="rec"><b>${o.no}</b> ${E(o.name)} <span>${inr(o.total)}</span><em class="pill ${o.status}">${o.status}</em></p>`).join('')||'<p class="note">No orders yet.</p>'}</div></div>
<p class="note">Live data from the server, refreshed every 15 seconds. Gross = non-cancelled orders; collected = Delivered only. Revenue, not profit.</p>`}
async function loadDash(){const d=await api('/api/admin/dashboard'),el=$('#dsh');if(el&&d.kpi){el.innerHTML=dashHTML(d);window.enhance&&enhance()}}
window.aDash=()=>{setTimeout(loadDash,0);return'<div id="dsh"><p class="note">Loading dashboard…</p></div>'};
setInterval(()=>{if(A&&V=='admin'&&AT=='dash'&&$('#dsh'))loadDash()},15000);
(async()=>{await loadPlants();if(TOK){if(await pull())A=1;else TOK=''}render()})();
