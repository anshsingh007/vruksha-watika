// Animations: preloader, leaf canvas, scroll reveal, tilt, ripple, fly-to-cart, petals, count-up, theme toggle.
(()=>{const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,R=(a,b)=>a+Math.random()*(b-a);
addEventListener('load',()=>setTimeout(()=>document.getElementById('pre').classList.add('done'),RM?0:1100));
addEventListener('scroll',()=>{const h=document.documentElement;pbar.style.width=scrollY/Math.max(1,h.scrollHeight-innerHeight)*100+'%';document.body.classList.toggle('scrolled',scrollY>20)},{passive:true});
// drifting leaves canvas
if(!RM){const c=leaves,x=c.getContext('2d');let w,h,L=[];const fit=()=>{w=c.width=innerWidth;h=c.height=innerHeight};fit();addEventListener('resize',fit);
 for(let i=0;i<16;i++)L.push({x:R(0,w),y:R(0,h),s:R(8,18),v:R(.3,.9),a:R(0,6.3),r:R(-.02,.02),h:R(90,140)});
 (function f(){x.clearRect(0,0,w,h);L.forEach(l=>{l.y+=l.v;l.x+=Math.sin(l.y/60+l.a)*.6;l.a+=l.r;if(l.y>h+20){l.y=-20;l.x=R(0,w)}
  x.save();x.translate(l.x,l.y);x.rotate(l.a);x.fillStyle=`hsla(${l.h},45%,42%,.5)`;x.beginPath();x.ellipse(0,0,l.s/2.4,l.s,0,0,6.3);x.fill();x.restore()});requestAnimationFrame(f)})()}
// scroll reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
const fmt=(n,m)=>m?inr(n):Number(n).toLocaleString('en-IN');
function count(el){const n=+el.dataset.n,m=el.dataset.m;if(RM||!n){el.textContent=fmt(n,m);return}const t0=performance.now();(function s(t){const p=Math.min(1,(t-t0)/1100);el.textContent=fmt(Math.round(n*(1-Math.pow(1-p,3))),m);if(p<1)requestAnimationFrame(s)})(t0)}
window.enhance=()=>{document.querySelectorAll('.card,.stats>div,.cal>div,.hero>*,.panel,.kpi').forEach((e,i)=>{if(!e.classList.contains('rv')){e.classList.add('rv');e.style.transitionDelay=Math.min(i%12,11)*45+'ms';io.observe(e)}});
 document.querySelectorAll('.kpi b[data-n]:not(.cd)').forEach(e=>{e.classList.add('cd');count(e)});
 const h=document.querySelector('.hero h1');if(h&&!h.dataset.sp){h.dataset.sp=1;h.innerHTML=h.textContent.split(' ').map((w,i)=>`<span class="w" style="animation-delay:${.15+i*.12}s">${w}</span>`).join(' ')}
 const hero=document.querySelector('.hero');if(hero&&!document.querySelector('.mq'))hero.insertAdjacentHTML('afterend','<div class="mq" aria-hidden="true"><span>'+'Indoor · Outdoor · Flowering · Medicinal · Fruit · Cash on Delivery · '.repeat(4)+'</span></div>');
 const nav=document.querySelector('header nav');if(nav&&!document.getElementById('tg')){nav.insertAdjacentHTML('beforeend','<button id="tg" aria-label="Toggle theme">◐</button>');tg.onclick=()=>{const d=getComputedStyle(document.body).backgroundColor!=='rgb(244, 239, 226)'&&document.documentElement.dataset.theme!=='light'?'light':'dark';document.documentElement.dataset.theme=d;localStorage.setItem('vw_theme',d)}}};
const th=localStorage.getItem('vw_theme');if(th)document.documentElement.dataset.theme=th;
const _r=render;window.render=()=>{_r();enhance()};const _g=grid;window.grid=()=>{_g();enhance()};
// 3D tilt on plant cards
document.addEventListener('pointermove',e=>{if(RM||e.pointerType!=='mouse')return;const c=e.target.closest&&e.target.closest('#gr .card');document.querySelectorAll('#gr .card.tl').forEach(k=>{if(k!==c){k.style.transform='';k.classList.remove('tl')}});
 if(c){const r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;c.classList.add('tl');c.style.transform=`perspective(700px) rotateY(${px*10}deg) rotateX(${-py*10}deg) translateY(-4px)`}});
// ripple
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.btn');if(!b||RM)return;const r=b.getBoundingClientRect(),s=document.createElement('span'),d=Math.max(r.width,r.height);s.className='rip';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;b.append(s);setTimeout(()=>s.remove(),600)});
const fly=(ch,from,to)=>{if(RM||!from||!to)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),s=document.createElement('div');s.className='fly';s.textContent=ch;s.style.left=a.left+'px';s.style.top=a.top+'px';document.body.append(s);
 s.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${(b.left-a.left)/2}px,${b.top-a.top-90}px) scale(1.4) rotate(120deg)`},{transform:`translate(${b.left-a.left}px,${b.top-a.top}px) scale(.3) rotate(300deg)`,opacity:.2}],{duration:800,easing:'ease-in'}).onfinish=()=>{s.remove();const n=document.querySelector('nav button:nth-child(3)');n&&n.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],300)}};
const _a=addCart;window.addCart=id=>{const ev=window.event;_a(id);ev&&ev.target&&fly('🍃',ev.target,document.querySelector('nav button:nth-child(3)'))};
const _w=water;window.water=id=>{const ev=window.event,t=ev&&ev.target&&ev.target.getBoundingClientRect();if(t&&!RM)for(let i=0;i<10;i++){const d=document.createElement('div');d.className='drop';d.textContent='💧';d.style.left=t.left+R(0,t.width)+'px';d.style.top=t.top+'px';document.body.append(d);d.animate([{transform:'translateY(0)',opacity:1},{transform:`translate(${R(-20,20)}px,${R(60,140)}px)`,opacity:0}],{duration:R(600,1000),delay:i*40}).onfinish=()=>d.remove()}_w(id)};
window.petals=()=>{if(RM)return;for(let i=0;i<45;i++){const p=document.createElement('div');p.className='petal';p.textContent=['🌸','🌼','🍃','🌺'][i%4];p.style.left=R(0,100)+'vw';p.style.top='-30px';document.body.append(p);
 p.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translate(${R(-80,80)}px,105vh) rotate(${R(200,720)}deg)`,opacity:.7}],{duration:R(2200,4200),delay:R(0,900),easing:'ease-in'}).onfinish=()=>p.remove()}};
enhance();
})();
