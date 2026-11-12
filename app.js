// ühr v6 — a dynamic grid.
// home: one week as a week, scrolled forever; pinch (or ctrl+scroll) between 2 · 4 · 8 squares a row, like photos on the iphone.
// create: tapping a square stretches the grid around it until the hour is the screen; four isolated steps live inside it.
// ring: real. the alarm's square stretches the same way; the name moves with the sound. a once-alarm leaves when it's done.
// every measure is read from the tokens (tokens.css), so changing one changes everything — see tokens.html.
(()=>{
const V=n=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
const EASE='cubic-bezier(.7,0,.2,1)';
let MOVE=V('--move')||640;const STEP=V('--step')||40,THICK=V('--thicken')||1500,TSPL=V('--t-splash')||120;
const p2=n=>String(n).padStart(2,'0');
const el=(c,p,tag='div')=>{const e=document.createElement(tag);if(c)e.className=c;if(p)p.appendChild(e);return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W=402;
const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],DS=['su','mo','tu','we','th','fr','sa'];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMBED=new URLSearchParams(location.search).has('embed');
document.documentElement.classList.toggle('embed',EMBED);
const ymd=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
const day0=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const addDays=(d,n)=>{const x=day0(d);x.setDate(x.getDate()+n);return x};
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// ---------- data (kept in this browser) + the log of everything that happens ----------
const KEY='uhr5',LOG='uhr5log';
function sample(){const n=new Date(),t=day0(n),h=(n.getHours()+2)%24,dt=h<n.getHours()?addDays(t,1):t;
  return[{id:1,h,m:0,name:'training',sound:'drop',days:[],date:ymd(dt)},{id:2,h:20,m:0,name:'pill',sound:'glass',days:[0,1,2,3,4,5,6],date:null},
    {id:3,h:7,m:0,name:'wake up',sound:'rise',days:[],date:ymd(addDays(t,1))},{id:4,h:18,m:30,name:'babysitter',sound:'tick',days:[],date:ymd(addDays(t,3))}]}
let alarms=null;try{alarms=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!Array.isArray(alarms))alarms=sample();
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(alarms))}catch(e){}};
function logEv(type,a,extra){if(EMBED)return;try{const L=JSON.parse(localStorage.getItem(LOG)||'[]');
  L.push({t:Date.now(),type,name:a?a.name:'',at:a?p2(a.h)+':'+p2(a.m):'',repeat:a?(a.days&&a.days.length?a.days.map(d=>DS[d]).join(' '):'once'):'',...(extra||{})});
  localStorage.setItem(LOG,JSON.stringify(L.slice(-2000)))}catch(e){}}
const at=(d,h,m)=>{const x=day0(d);x.setHours(h,m,0,0);return x};
const occ=d=>{const now=Date.now(),k=ymd(d);return alarms.filter(a=>(a.date===k&&!a.days.length)||(a.days.length&&a.days.includes(d.getDay())))
  .filter(a=>at(d,a.h,a.m).getTime()+60000>now).sort((a,b)=>a.h*60+a.m-(b.h*60+b.m))};

// ---------- stage ----------
const root=document.getElementById('app'),ph=el('phone',root);
let S=1,PH=874;
function fit(){const mob=innerWidth<=520||EMBED;if(mob){S=innerWidth/W;PH=Math.round(innerHeight/S)}else{PH=874;S=Math.min(1,(innerWidth-32)/W,(innerHeight-60)/874)}
  ph.style.height=PH+'px';ph.style.transform=`scale(${S})`;root.style.width=W*S+'px';root.style.height=PH*S+'px'}
fit();
const rel=e=>{const a=e.getBoundingClientRect(),b=ph.getBoundingClientRect();return{x:(a.left-b.left)/S,y:(a.top-b.top)/S,w:a.width/S,h:a.height/S}};

// ---------- layout: one rule for every zoom level, read from the tokens ----------
const LEVELS=[2,4,8];let N=4;
function lay(n=N){const M=V('--margin')||21,Gb=V('--gap')||24,g=n===8?Math.round(Gb/3):Gb,F=(W-2*M-(n-1)*g)/n,head=n===8?46:62,row=F+g;
  return{n,M,g,F,head,row,rows:24/n,dayH:head+24/n*row,x:c=>M+c*(F+g)}}
let Lc=lay();
const sc=el('scroll drawing',ph),track=el('track',sc),vl=el('vl',ph);
const VLS=[...Array(16)].map((_,i)=>{const l=el('',vl,'i');l.style.setProperty('--d',i*STEP+'ms');return l});
function setVL(){VLS.forEach((l,k)=>{const c=k>>1,on=c<Lc.n;l.style.left=(on?Lc.x(c)+(k&1?Lc.F:0):W/2)+'px';l.style.opacity=on?'':'0'})}
function zclass(){ph.classList.remove('z2','z4','z8');ph.classList.add('z'+N)}

// ---------- the week, as a week: today and six days by name, then round again ----------
let base=day0(new Date()),days=[];
function layoutDay(D,i){const de=D.de;de.style.top=i*Lc.dayH+'px';de.style.height=Lc.dayH+'px';
  while(D.bands.length>Lc.rows)D.bands.pop().remove();while(D.bands.length<Lc.rows)D.bands.push(el('band',de));
  D.bands.forEach((b,r)=>{b.style.top=Lc.head+r*Lc.row+'px';b.style.height=Lc.F+'px'});
  D.sqs.forEach((q,h)=>{q.style.left=Lc.x(h%Lc.n)+'px';q.style.top=Lc.head+Math.floor(h/Lc.n)*Lc.row+'px';q.style.width=q.style.height=Lc.F+'px'})}
function addDay(){const i=days.length,d=addDays(base,i%7),de=el('day',track);
  const hd=el('dh',de);hd.innerHTML=`<b>${i%7===0?'today':DAYS[d.getDay()]}</b>`;
  const sqs=[];for(let h=0;h<24;h++){const q=el('sq',de);q.dataset.i=i;q.dataset.h=h;sqs.push(q)}
  const D={d,de,sqs,bands:[],hd};days.push(D);layoutDay(D,i);track.style.height=days.length*Lc.dayH+Lc.row+'px';paint(i)}
function layoutAll(){days.forEach(layoutDay);track.style.height=days.length*Lc.dayH+Lc.row+'px';setVL();zclass()}
function paint(i){const {d,sqs}=days[i],now=new Date();
  sqs.forEach(q=>{q.className='sq';q.innerHTML='';delete q.dataset.id;q.removeAttribute('aria-label')});
  const by={};occ(d).forEach(a=>(by[a.h]=by[a.h]||[]).push(a));
  Object.entries(by).forEach(([h,list])=>{const q=sqs[h];q.dataset.id=list[0].id;
    if(list.length===1){const a=list[0];q.classList.add('al',a.days.length?'fixed':'temp');q.innerHTML=`<span class="t"><b>${p2(a.h)}</b><b>${p2(a.m)}</b></span><span class="n">${esc(a.name)}</span>`;q.setAttribute('aria-label',`${p2(a.h)}:${p2(a.m)} ${a.name}`);return}
    // two or more in one hour: the square splits into bands, one per alarm, in time order
    q.classList.add('al','multi');const k=100/list.length;
    q.innerHTML=list.map((a,j)=>`<div class="part ${a.days.length?'fixed':'temp'}${list.length>2?' thin':''}" data-id="${a.id}" style="top:${j*k}%;height:${k}%"><b>:${p2(a.m)}</b><span>${esc(a.name)}</span></div>`).join('');
    q.setAttribute('aria-label',list.map(a=>`${p2(a.h)}:${p2(a.m)} ${a.name}`).join(', '))});
  if(i%7===0){const h=now.getHours(),q=sqs[h];q.classList.add('now');
    if(!q.dataset.id)q.insertAdjacentHTML('beforeend',`<span class="nt"><b>${p2(h)}</b><b>${p2(now.getMinutes())}</b></span>`);
    q.insertAdjacentHTML('beforeend',`<i class="nb" style="width:${(now.getMinutes()+1)/60*100}%"></i>`)}
  if(beck&&beck.i===i)sqs[beck.h].classList.add('beckon')}
let beck=null;
const paintAll=()=>days.forEach((_,i)=>paint(i));
function rebuild(){track.innerHTML='';days=[];base=day0(new Date());for(let k=0;k<14;k++)addDay();setVL();zclass()}
rebuild();
const yOf=(i,h)=>i*Lc.dayH+Lc.head+Math.floor(h/Lc.n)*Lc.row;
sc.scrollTop=Math.max(0,yOf(0,new Date().getHours())-Math.round(PH*.3));
sc.addEventListener('scroll',()=>{if(sc.scrollTop+PH>(days.length-2)*Lc.dayH)for(let k=0;k<7;k++)addDay()},{passive:true});
const sqAt=(i,h)=>days[i]&&days[i].sqs[h];
const indexOf=a=>{const now=new Date();if(!a.days.length)return Math.max(0,Math.round((parse(a.date)-base)/864e5));
  for(let i=0;i<8;i++){const d=addDays(base,i);if(a.days.includes(d.getDay())&&at(d,a.h,a.m)>now)return i}return 0};
function reveal(i,h){while(i+1>=days.length)addDay();sc.scrollTop=Math.max(0,yOf(i,h)-Math.round(PH*.32))}
const nearby=()=>{const i0=Math.floor(sc.scrollTop/Lc.dayH);return days.slice(Math.max(0,i0-1),i0+3)};

// ---------- zoom: pinch between 2 · 4 · 8 squares a row; everything glides to its new place (flip) ----------
function zoomTo(n,anchorY){if(n===N||busy())return;tipDone('pinch');const Ds=nearby();
  const els=Ds.flatMap(D=>[...D.sqs,D.hd]);const old=new Map(els.map(e=>[e,e.getBoundingClientRect()]));
  const ay=anchorY==null?PH/2:anchorY;
  const anchor=Ds.flatMap(D=>D.sqs).map(q=>[q,rel(q)]).filter(([,r])=>r.y<=ay+r.h).sort((a,b)=>Math.abs(a[1].y+a[1].h/2-ay)-Math.abs(b[1].y+b[1].h/2-ay))[0];
  const aq=anchor?anchor[0]:sqAt(0,new Date().getHours()),aOld=rel(aq).y;
  track.style.transform='';N=n;Lc=lay();layoutAll();sc.scrollTop+=rel(aq).y-aOld;
  vl.classList.add('glide');setTimeout(()=>vl.classList.remove('glide'),MOVE);
  els.forEach(e=>{const a=old.get(e),b=e.getBoundingClientRect();if(!b.width||!a.width)return;
    const t=e.classList.contains('dh')?`translate(${(a.left-b.left)/S}px,${(a.top-b.top)/S}px)`:`translate(${(a.left-b.left)/S}px,${(a.top-b.top)/S}px) scale(${a.width/b.width},${a.height/b.height})`;
    e.animate([{transform:t,transformOrigin:'0 0'},{transform:'none',transformOrigin:'0 0'}],{duration:reduce?1:MOVE,easing:EASE})});
  Ds.forEach(D=>D.bands.forEach((b,r)=>b.animate([{transform:'scaleX(0)'},{transform:'none'}],{duration:reduce?1:MOVE,delay:r*STEP,easing:EASE,fill:'backwards'})));
  buzz(8)}
const zoomStep=(dir,y)=>{const k=LEVELS.indexOf(N)+dir;if(k>=0&&k<LEVELS.length)zoomTo(LEVELS[k],y)};
let pz=null;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
const midP=t=>{const b=ph.getBoundingClientRect();return{x:((t[0].clientX+t[1].clientX)/2-b.left)/S,y:((t[0].clientY+t[1].clientY)/2-b.top)/S}};
ph.addEventListener('touchstart',e=>{if(e.touches.length===2&&!ringing){pz={d:dist(e.touches),c:midP(e.touches),k:1};
  if(!sh.classList.contains('on'))track.style.transformOrigin=`${pz.c.x}px ${pz.c.y+sc.scrollTop}px`}},{passive:true});
ph.addEventListener('touchmove',e=>{if(!pz||e.touches.length!==2)return;e.preventDefault();pz.k=dist(e.touches)/pz.d;
  if(sh.classList.contains('on')){if(pz.k<.75&&!pz.done){pz.done=true;closeSheet(null)}return}
  track.style.transform=`scale(${Math.max(.55,Math.min(1.8,pz.k))})`},{passive:false});
ph.addEventListener('touchend',e=>{if(!pz||e.touches.length>=2)return;const {k,c,done}=pz;pz=null;if(done||sh.classList.contains('on'))return;
  // pinch open past the largest squares = open that hour
  if(k>1.2&&N===2){track.style.transform='';const q=document.elementsFromPoint(...client(c)).find(n=>n.classList&&n.classList.contains('sq'));if(q)q.click();return}
  // zoom only when a level exists that way; otherwise the grid always glides back to its true size
  const j=LEVELS.indexOf(N)+(k>1.18?-1:k<.85?1:0);
  if(j!==LEVELS.indexOf(N)&&j>=0&&j<LEVELS.length&&!busy())zoomTo(LEVELS[j],c.y);else unpinch()});
ph.addEventListener('touchcancel',()=>{pz=null;unpinch()});
function unpinch(){const t=track.style.transform;if(!t)return;track.style.transform='';track.animate([{transform:t},{transform:'none'}],{duration:240,easing:EASE})}
// the browser's own page zoom fights ours and breaks the proportions — keep it off
['gesturestart','gesturechange'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
const client=p=>{const b=ph.getBoundingClientRect();return[b.left+p.x*S,b.top+p.y*S]};
// trackpad pinch on a laptop (ctrl + wheel) and + / − keys do the same
let wacc=0,wT;sc.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();wacc+=e.deltaY;clearTimeout(wT);wT=setTimeout(()=>wacc=0,200);
  if(Math.abs(wacc)>36){const b=ph.getBoundingClientRect();zoomStep(wacc<0?-1:1,(e.clientY-b.top)/S);wacc=wacc<0?-999:999}},{passive:false});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||sh.classList.contains('on'))return;if(e.key==='+'||e.key==='=')zoomStep(-1);if(e.key==='-')zoomStep(1)});

// ---------- the stretch: the grid pulls apart around one square until that hour is the whole screen ----------
let held=[];
function stretch(q,open){const r=rel(q),sx=W/r.w,sy=PH/r.h,map=(x,y)=>[(x-r.x)*sx,(y-r.y)*sy],an=[],o={duration:reduce?1:MOVE,easing:EASE,fill:'both'};
  const kf=(A,B)=>open?[A,B]:[B,A];
  nearby().forEach(D=>{D.sqs.forEach(e=>{const a=rel(e);if(a.y>PH*1.5||a.y+a.h<-PH*.5)return;const [nx,ny]=map(a.x,a.y),L0=parseFloat(e.style.left),T0=parseFloat(e.style.top);
      an.push(e.animate(kf({left:L0+'px',top:T0+'px',width:a.w+'px',height:a.h+'px'},{left:L0+nx-a.x+'px',top:T0+ny-a.y+'px',width:a.w*sx+'px',height:a.h*sy+'px'}),o))});
    D.bands.forEach(b=>{const a=rel(b);if(a.y>PH*1.5||a.y+a.h<-PH*.5)return;const ny=(a.y-r.y)*sy,T0=parseFloat(b.style.top);
      an.push(b.animate(kf({top:T0+'px',height:a.h+'px'},{top:T0+ny-a.y+'px',height:a.h*sy+'px'}),o))});
    const a=rel(D.hd);const [nx,ny]=map(a.x,a.y);an.push(D.hd.animate(kf({transform:'none',opacity:1},{transform:`translate(${nx-a.x}px,${ny-a.y}px)`,opacity:0}),o))});
  VLS.forEach(l=>{if(l.style.opacity==='0')return;const x=parseFloat(l.style.left),nx=(x-r.x)*sx;an.push(l.animate(kf({left:x+'px'},{left:nx+'px'}),o))});
  return an}
const settle=an=>Promise.all(an.map(a=>a.finished.catch(()=>{})));
async function stretchOpen(q){sc.classList.add('held');q.classList.add('hot');held=stretch(q,true);await wait(MOVE*.72)}
async function stretchClose(target,cover){held.forEach(a=>a.cancel());held=[];document.querySelectorAll('.sq.hot').forEach(x=>x.classList.remove('hot'));
  if(!target){cover.classList.remove('on');sc.classList.remove('held');return}
  target.classList.add('hot');const an=stretch(target,false);an.forEach(a=>a.pause());cover.classList.remove('on');await wait(200);an.forEach(a=>a.play());await settle(an);
  an.forEach(a=>a.cancel());target.classList.remove('hot');sc.classList.remove('held')}

// ---------- sound: four tones, synthesised; each one also moves the name its own way ----------
let ac=null;
const ctx=()=>{try{if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C()}if(ac&&ac.state==='suspended')ac.resume()}catch(e){}return ac};
function env(g,t,vol,att,dur){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
function tone(t,f,dur,type='sine',vol=.3,att=.008){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;env(g,t,vol,att,dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}
function sweep(t,f0,f1,dur,vol){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,vol,.004,dur+.06);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.12)}
function bell(t,f,dur,vol){const c=ac.createOscillator(),m=ac.createOscillator(),mg=ac.createGain(),g=ac.createGain();c.frequency.value=f;m.frequency.value=f*3.5;
  mg.gain.setValueAtTime(f*2.2,t);mg.gain.exponentialRampToValueAtTime(1,t+dur);m.connect(mg).connect(c.frequency);env(g,t,vol,.003,dur);c.connect(g).connect(ac.destination);c.start(t);m.start(t);c.stop(t+dur+.05);m.stop(t+dur+.05)}
function click(t,vol){const n=Math.floor(ac.sampleRate*.02),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(n*.12));
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=b;f.type='highpass';f.frequency.value=3000;g.gain.value=vol;s.connect(f).connect(g).connect(ac.destination);s.start(t)}
const SND={
  rise:(t,v)=>[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(t+i*.12,f,1.1-i*.15,'sine',.22*v,.02)),
  drop:(t,v)=>[[0,1500],[.2,1150],[.34,1320]].forEach(([o,f])=>sweep(t+o,f,f*.3,.09,.3*v)),
  glass:(t,v)=>{bell(t,880,1.7,.2*v);bell(t+.34,1318.5,1.5,.14*v)},
  tick:(t,v)=>{[0,.17,.32,.44,.54,.62,.69].forEach(o=>click(t+o,.5*v));tone(t+.8,2093,.3,'sine',.18*v)}};
const SOUNDS=Object.keys(SND),OLD={radar:'tick',chime:'glass',pulse:'drop'},snd=s=>SND[s]?s:OLD[s]||'rise';
const play=(s,v=1)=>{const c=ctx();if(!c)return;try{SND[snd(s)](c.currentTime+.03,v)}catch(e){}};
const tick=()=>{const c=ctx();if(c)try{click(c.currentTime,.25)}catch(e){};buzz(6)};
ph.addEventListener('pointerdown',ctx,{passive:true});
function setName(e,s,max=360){const txt=s||'ühr';e.innerHTML=[...txt].map((ch,i)=>`<i style="--i:${i}">${ch===' '?' ':esc(ch)}</i>`).join('');
  const longest=Math.max(...txt.split(' ').map(w=>w.length),1);e.style.setProperty('--fs',Math.max(40,Math.min(112,max/(longest*.6)))+'px')}
function animName(e,s){e.classList.remove(...SOUNDS.map(k=>'an-'+k));void e.offsetWidth;e.classList.add('an-'+snd(s))}

// ---------- create: four isolated steps inside the stretched hour ----------
const sh=el('sheet',ph);
sh.innerHTML=`<div class="sv"></div>
<div class="top"><div class="dots"></div><div class="lab"></div></div><div class="body"></div>
<div class="acts"><button type="button" class="b-del">delete</button><button type="button" class="b-go">continue</button></div>`;
const sv=sh.querySelector('.sv'),dots=sh.querySelector('.dots'),lab=sh.querySelector('.lab'),body=sh.querySelector('.body'),bDel=sh.querySelector('.b-del'),bGo=sh.querySelector('.b-go');
const svLines=()=>{const l=lay(4);sv.innerHTML=[0,1,2,3].flatMap(c=>[l.x(c),l.x(c)+l.F]).map((x,i)=>`<i style="left:${x}px;--d:${i*STEP}ms"></i>`).join('')};
const LABELS=['time','name','sound','repeat'];
let draft=null,step=0,origin=null,opening=false;
async function openSheet(i,h,a,from){if(opening||sh.classList.contains('on'))return;opening=true;origin=from||sqAt(i,h);const d=days[i].d;
  draft=a?{id:a.id,h:a.h,m:a.m,name:a.name,sound:snd(a.sound),days:[...a.days],once:!a.days.length,date:a.date||ymd(d),edit:true}
         :{id:Date.now(),h,m:0,name:'',sound:'rise',days:[d.getDay()],once:true,date:ymd(d),edit:false};
  buzz(10);tipDone('tap');svLines();await stretchOpen(origin.closest('.sq'));step=-1;go(0,0);sh.classList.add('on');opening=false;tipSwipe()}
async function closeSheet(target,after){if(!sh.classList.contains('on'))return;await stretchClose(target||origin.closest('.sq'),sh);body.innerHTML='';after&&after()}
function go(n,dir){if(n>0)tipDone('swipe');const from=dir===undefined?(n>step?1:n<step?-1:0):dir;step=n;sh.classList.add('fall');void sh.offsetWidth;sh.classList.remove('fall');
  dots.innerHTML=LABELS.map((l,k)=>`<button type="button" aria-label="${l}" class="${k<n?'done':k===n?'cur':''}"></button>`).join('');
  [...dots.children].forEach((b,k)=>b.onclick=()=>{if(k!==step)go(k)});
  lab.textContent=n===LABELS.length-1?'swipe ← to set':LABELS[n];body.innerHTML='';const inn=el('in'+(from>0?' from-r':from<0?' from-l':''),body);STEPS[n](inn);
  bGo.textContent=n===LABELS.length-1?'set':'continue'}
const effDate=()=>{let d=parse(draft.date);if(draft.once&&at(d,draft.h,draft.m)<=new Date())d=addDays(d,1);return d};
const dayWord=d=>{const k=Math.round((day0(d)-day0(new Date()))/864e5);return k===0?'today':DAYS[d.getDay()]};
function wheel(inn,{get,set,fmt=p2,step:st=1,mod,onchange}){const w=el('wheel',inn);w.tabIndex=0;w.setAttribute('role','spinbutton');
  const pv=el('',w,'span'),cu=el('',w,'b'),nx=el('',w,'span');
  const draw=()=>{const v=get();pv.textContent=fmt(((v-st)%mod+mod)%mod);cu.textContent=fmt(v);nx.textContent=fmt((v+st)%mod);w.setAttribute('aria-valuenow',v);onchange&&onchange()};
  const bump=dir=>{const v=get(),nv=dir>0?(Math.floor(v/st)*st+st)%mod:((Math.ceil(v/st)*st-st)%mod+mod)%mod;set(nv);draw();tick();
    cu.style.setProperty('--k',(dir>0?-8:8)+'px');cu.classList.add('kick');setTimeout(()=>cu.classList.remove('kick'),90)};
  let y0=null,acc=0;
  w.addEventListener('pointerdown',e=>{y0=e.clientY;acc=0;try{w.setPointerCapture(e.pointerId)}catch(_){}});
  w.addEventListener('pointermove',e=>{if(y0==null||(sw&&sw.on))return;acc+=(e.clientY-y0)/S;y0=e.clientY;while(Math.abs(acc)>=40){bump(acc>0?-1:1);acc+=acc>0?-40:40}});
  w.addEventListener('pointerup',()=>y0=null);w.addEventListener('pointercancel',()=>y0=null);
  pv.addEventListener('click',()=>bump(-1));nx.addEventListener('click',()=>bump(1));
  let wa=0;w.addEventListener('wheel',e=>{e.preventDefault();wa+=e.deltaY;if(Math.abs(wa)>30){bump(wa>0?1:-1);wa=0}},{passive:false});
  w.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();bump(-1)}if(e.key==='ArrowDown'){e.preventDefault();bump(1)}});
  draw();return draw}
const chip=(p,txt,cls='')=>{const b=el('chip '+cls,p,'button');b.type='button';b.textContent=txt;return b};
const STEPS=[
  inn=>{const pr=el('pair',inn),note=el('hint',inn,'p');const upd=()=>note.textContent=dayWord(effDate());
    const dh=wheel(pr,{get:()=>draft.h,set:v=>draft.h=v,mod:24,onchange:upd});pr.firstChild.setAttribute('aria-label','hour');
    el('colon',pr).innerHTML='<i></i><i></i>';
    const dm=wheel(pr,{get:()=>draft.m,set:v=>draft.m=v,step:5,mod:60,onchange:upd});pr.lastChild.setAttribute('aria-label','minutes');
    inn.appendChild(note);const ch=el('chips',inn);
    [['in 1 minute','soon'],['00',0],['15',15],['30',30],['45',45]].forEach(([t,v])=>{const b=chip(ch,v==='soon'?t:':'+t,v==='soon'?'or':'');
      b.onclick=()=>{if(v==='soon'){const n=new Date(Date.now()+60000);draft.h=n.getHours();draft.m=n.getMinutes();draft.date=ymd(n);draft.once=true}else draft.m=v;dh();dm();tick()}});
    el('hint',inn,'p').textContent='drag each number up or down'},
  inn=>{el('cap',inn).textContent=p2(draft.h)+':'+p2(draft.m);const nm=el('nm',inn,'input');nm.id='uhr-name';nm.maxLength=16;nm.placeholder='name it';nm.autocomplete='off';nm.value=draft.name;
    nm.setAttribute('aria-label','name');const fitIn=()=>nm.style.setProperty('--fs',Math.max(36,Math.min(72,360/(Math.max(nm.value.length,6)*.58)))+'px');fitIn();
    nm.addEventListener('input',()=>{draft.name=nm.value;fitIn()});nm.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next()}});
    el('hint',inn,'p').textContent='one or two words';setTimeout(()=>{try{nm.focus({preventScroll:true})}catch(e){}},300)},
  inn=>{el('cap',inn).textContent=p2(draft.h)+':'+p2(draft.m);const big=el('big',inn);setName(big,draft.name);
    const ch=el('chips',inn);SOUNDS.forEach(s=>{const b=chip(ch,s,draft.sound===s?'on':'');
      b.onclick=()=>{draft.sound=s;[...ch.children].forEach(x=>x.classList.toggle('on',x===b));play(s,.9);animName(big,s)}});
    el('hint',inn,'p').textContent='tap to hear it';setTimeout(()=>{play(draft.sound,.6);animName(big,draft.sound)},420)},
  inn=>{const cap=el('cap',inn),big=el('big',inn);setName(big,draft.name);big.style.setProperty('--fs',Math.min(72,parseFloat(big.style.getPropertyValue('--fs')))+'px');
    const ch=el('chips',inn),dch=el('chips',inn),note=el('hint',inn,'p');
    const draw=()=>{cap.textContent=p2(draft.h)+':'+p2(draft.m);note.textContent=draft.once?dayWord(effDate()):'every '+(draft.days.length===7?'day':draft.days.map(d=>DS[d]).join(' '));
      [...ch.children].forEach((b,k)=>b.classList.toggle('on',k===(draft.once?0:1)));dch.hidden=draft.once;[...dch.children].forEach((b,k)=>b.classList.toggle('on',draft.days.includes(k)))};
    ['once','every week'].forEach((t,k)=>{chip(ch,t).onclick=()=>{draft.once=!k;if(!draft.days.length)draft.days=[effDate().getDay()];draw();tick()}});
    DS.forEach((t,k)=>{chip(dch,t,'sqd').onclick=()=>{const i=draft.days.indexOf(k);i<0?draft.days.push(k):draft.days.length>1&&draft.days.splice(i,1);draft.days.sort();draw();tick()}});
    draw()}];
function next(){if(step<STEPS.length-1){go(step+1);return}commit()}
function commit(){const d=effDate(),a={id:draft.id,h:draft.h,m:draft.m,name:(draft.name.trim()||'ühr').split(/\s+/).slice(0,2).join(' '),sound:draft.sound,
    days:draft.once?[]:[...draft.days],date:draft.once?ymd(d):null};
  logEv(draft.edit?'changed':'set',a);
  alarms=alarms.filter(x=>x.id!==a.id);alarms.push(a);store();paintAll();buzz([10,40,10]);
  const i=indexOf(a);held.forEach(x=>x.cancel());held=[];reveal(i,a.h);const q=sqAt(i,a.h);
  closeSheet(q,()=>{if(q){q.classList.add('pop');setTimeout(()=>q.classList.remove('pop'),700)}setTimeout(tipPinch,900)})}
bGo.addEventListener('click',next);
// carousel: swipe left = confirm and go on (on the last step it sets the alarm); swipe right = back, to change something
let sw=null;
body.addEventListener('pointerdown',e=>{sw={x:e.clientX,y:e.clientY,on:false}},true);
body.addEventListener('pointermove',e=>{if(!sw)return;const dx=(e.clientX-sw.x)/S,dy=(e.clientY-sw.y)/S;
  if(!sw.on&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.4)sw.on=true;
  if(sw.on){const inn=body.firstChild,edge=dx>0&&step===0;inn.style.animation='none';inn.style.transform=`translateX(${edge?dx*.25:dx}px)`;inn.style.opacity=1-Math.min(.5,Math.abs(dx)/600)}},true);
const swEnd=e=>{if(!sw)return;const dx=(e.clientX-sw.x)/S,on=sw.on;sw=null;if(!on)return;const inn=body.firstChild;
  if(dx<-70){tick();next()}else if(dx>70&&step>0){tick();go(step-1,-1)}
  else{inn.style.transition='transform 240ms var(--ease),opacity 240ms';inn.style.transform='';inn.style.opacity=''}};
body.addEventListener('pointerup',swEnd,true);body.addEventListener('pointercancel',()=>{sw=null},true);
bDel.addEventListener('click',()=>{const q=origin&&origin.closest('.sq');
  if(draft&&draft.edit){const a=alarms.find(x=>x.id===draft.id);logEv('deleted',a);alarms=alarms.filter(x=>x.id!==draft.id);store();
    closeSheet(q,()=>{const g=origin.classList.contains('part')?origin:q;g.classList.add('vanish');setTimeout(paintAll,700)})}else closeSheet(q)});
sc.addEventListener('click',e=>{if(lpFired){lpFired=false;return}const q=e.target.closest('.sq');if(!q||busy())return;
  const pt=e.target.closest('.part'),id=pt?pt.dataset.id:q.dataset.id,i=+q.dataset.i,h=+q.dataset.h,a=id?alarms.find(x=>String(x.id)===id):null;openSheet(i,h,a,pt||q)});
let lpT=null,lpFired=false;
sc.addEventListener('pointerdown',e=>{const q=e.target.closest('.sq');if(!q)return;clearTimeout(lpT);
  lpT=setTimeout(()=>{if(busy())return;lpFired=true;buzz(20);openSheet(+q.dataset.i,+q.dataset.h,null,q)},550)});
['pointerup','pointercancel','pointerleave'].forEach(t=>sc.addEventListener(t,()=>clearTimeout(lpT)));
sc.addEventListener('scroll',()=>clearTimeout(lpT),{passive:true});
const busy=()=>sh.classList.contains('on')||!!ringing||opening;

// ---------- ring: the alarm's square stretches into the screen; the grid stays ----------
const rg=el('ring',ph);
rg.innerHTML=`<div class="sv"></div><div class="rh"></div><div class="rtime"></div><div class="rname"><div class="big"></div></div>
<div class="acts"><button type="button" class="b-del">snooze · 9 min</button><button type="button" class="b-go">stop</button></div>`;
const rsv=rg.querySelector('.sv'),rh=rg.querySelector('.rh'),rtime=rg.querySelector('.rtime'),rname=rg.querySelector('.rname .big');
let ringing=null,rLoop=null,firedAt='';
async function ring(a){if(ringing)return;if(sh.classList.contains('on')){held.forEach(x=>x.cancel());held=[];sh.classList.remove('on');body.innerHTML='';sc.classList.remove('held')}
  ringing=a;logEv('rang',a);const i=Math.max(0,Math.round((day0(new Date())-base)/864e5));reveal(i,a.h);paint(i);const q=sqAt(i,a.h);
  const l=lay(4);rsv.innerHTML=[0,1,2,3].flatMap(c=>[l.x(c),l.x(c)+l.F]).map(x=>`<i style="left:${x}px"></i>`).join('');
  rh.innerHTML=[...Array(Math.ceil(PH/l.row)+1)].map((_,k)=>`<i style="top:${40+k*l.row}px"></i><i style="top:${40+k*l.row+l.F}px"></i>`).join('');
  rg.className='ring '+(a.days.length?'fixed':'temp');rtime.innerHTML=`${p2(a.h)}<span class="cd"></span>${p2(a.m)}`;setName(rname,a.name);
  await stretchOpen(q);rg.classList.add('on');
  let cyc=0;const beat=()=>{play(a.sound,Math.min(1,.4+cyc*.12));animName(rname,a.sound);buzz([280,120,280]);cyc++};
  setTimeout(beat,200);rLoop=setInterval(beat,2000)}
async function stopRing(snooze){const a=ringing;if(!a)return;clearInterval(rLoop);buzz(0);logEv(snooze?'snoozed':'stopped',a);
  const i=Math.max(0,Math.round((day0(new Date())-base)/864e5)),q=sqAt(i,a.h);
  if(a.id>0&&!a.days.length)alarms=alarms.filter(x=>x.id!==a.id);
  let sn=null;if(snooze){const t=new Date(Date.now()+9*60000);sn={id:Date.now(),h:t.getHours(),m:t.getMinutes(),name:a.name,sound:a.sound,days:[],date:ymd(t)};alarms.push(sn)}
  store();await stretchClose(q,rg);ringing=null;
  // done is done: a once-alarm leaves its square — no list keeps it
  const gone=q&&(q.querySelector(`.part[data-id="${a.id}"]`)||(q.dataset.id===String(a.id)?q:null));
  const popSn=()=>{if(!sn)return;const s=sqAt(indexOf(sn),sn.h);if(s){s.classList.add('pop');setTimeout(()=>s.classList.remove('pop'),700)}};
  if(gone&&!a.days.length){gone.classList.add('vanish');setTimeout(()=>{paintAll();popSn()},700)}else{paintAll();popSn()}}
rg.querySelector('.b-go').addEventListener('click',()=>stopRing(false));
rg.querySelector('.b-del').addEventListener('click',()=>stopRing(true));
let sy=null;rg.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))sy=e.clientY});
addEventListener('pointerup',e=>{if(sy!=null&&ringing&&(sy-e.clientY)/S>PH*.2)stopRing(false);sy=null});

// ---------- the clock: repaint each minute; ring what is due ----------
let lastMin=-1;
setInterval(()=>{const n=new Date(),mk=n.getHours()*60+n.getMinutes();
  if(ymd(day0(n))!==ymd(base)&&!busy()){const y=sc.scrollTop;rebuild();sc.scrollTop=Math.max(0,y-Lc.dayH)}
  if(mk!==lastMin){lastMin=mk;days.forEach((_,i)=>i%7===0&&paint(i))}
  if(ringing||EMBED)return;const key=ymd(n)+' '+mk;if(firedAt===key)return;
  const due=alarms.find(a=>a.h===n.getHours()&&a.m===n.getMinutes()&&((a.date===ymd(n)&&!a.days.length)||a.days.includes(n.getDay())));
  if(due){firedAt=key;ring(due)}},1000);

// ---------- splash: ühr (under) breathes thin → black; then now falls into its own square and the grid draws itself ----------
function umlaut(u){const cs=getComputedStyle(u),fs=parseFloat(cs.fontSize),c=umlaut.c||(umlaut.c=document.createElement('canvas').getContext('2d'));
  c.font=`${Math.round(parseFloat(cs.fontWeight))} ${fs}px ${cs.fontFamily}`;const m=c.measureText('u');
  const b=(fs-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent,mid=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2,d=fs*.12,g=d*.6,top=b-m.actualBoundingBoxAscent-g-d;
  u.querySelectorAll('i').forEach((i,k)=>Object.assign(i.style,{width:d+'px',height:d+'px',top:top+'px',left:mid+(k?g/2:-g/2-d)+'px'}))}
function drawGrid(){const top=sc.scrollTop;let k=0;
  days.forEach(D=>D.bands.forEach(b=>{const y=parseFloat(D.de.style.top)+parseFloat(b.style.top)-top;b.style.setProperty('--d',(y>-80&&y<PH?(8*STEP+(k++)*STEP*1.5):0)+'ms')}));
  void sc.offsetWidth;sc.classList.remove('drawing')}
function land(){const q=sqAt(0,new Date().getHours()),r=rel(q),n=new Date(),L=el('land',ph);L.innerHTML=`<span>${p2(n.getHours())}</span><span>${p2(n.getMinutes())}</span>`;
  ph.classList.add('landing');L.style.transition='none';const w0=L.offsetWidth,k=(W-2*Lc.M)/w0;
  L.style.fontSize=parseFloat(getComputedStyle(L).fontSize)*k+'px';L.style.left=Lc.M+'px';L.style.top=Math.round(PH*.24)+'px';void L.offsetWidth;
  const nt=q.querySelector('.nt'),tr=nt?rel(nt):{x:r.x+8,y:r.y+9};
  L.style.transition='';setTimeout(()=>{L.style.transform=`translate(${tr.x-Lc.M}px,${tr.y-Math.round(PH*.24)}px) scale(${1/k})`;drawGrid()},500);
  setTimeout(()=>{ph.classList.remove('landing');L.remove()},500+MOVE*1.4+60)}
function splash(){const sp=el('splash',ph);sp.innerHTML='<div class="sw"><span class="u">u<i></i><i></i></span><span>h</span><span>r</span></div>';
  const sw2=sp.firstChild,ls=[...sw2.children],TOP=Math.round(PH*.36),G=Lc.g;sw2.style.top=TOP+'px';
  const gv=ls.flatMap(()=>[el('gv',sp),el('gv',sp)]),gh=[el('gh',sp),el('gh',sp)];gv.forEach(g=>{g.style.top=TOP-2*G+'px';g.style.height=TSPL+4*G+'px'});
  let BL=0,XH=0;const trk=()=>{ls.forEach((s,i)=>{gv[2*i].style.left=s.offsetLeft+'px';gv[2*i+1].style.left=s.offsetLeft+s.offsetWidth+'px'});umlaut(ls[0]);gh[0].style.top=TOP+BL+'px';gh[1].style.top=TOP+BL-XH+'px'};
  const go2=()=>{const c=document.createElement('canvas').getContext('2d');c.font=`100 ${TSPL}px ${getComputedStyle(sw2).fontFamily}`;const m=c.measureText('x');
    BL=(TSPL-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent;XH=m.actualBoundingBoxAscent;trk();sp.classList.add('ready');
    const t0=performance.now(),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,stepF=n=>{const t=Math.min(1,(n-t0)/THICK);sw2.style.fontWeight=Math.round(100+800*ease(t));trk();if(t<1)requestAnimationFrame(stepF)};
    requestAnimationFrame(stepF);
    setTimeout(()=>{sp.classList.add('out');land();setTimeout(()=>sp.remove(),400)},THICK+1000)};
  (document.fonts&&document.fonts.load?document.fonts.load(`100 ${TSPL}px under`).then(()=>document.fonts.ready):Promise.resolve()).then(go2,go2)}
if(reduce||EMBED){sc.classList.remove('drawing')}else splash();

// ---------- first time: the app teaches by doing — one hint at a time, each gone for good once done ----------
const TIPS='uhr5tips';let tips={};try{tips=JSON.parse(localStorage.getItem(TIPS))||{}}catch(e){}
const seen=k=>EMBED||tips[k];
function tipDone(k){if(tips[k]||EMBED)return;tips[k]=1;try{localStorage.setItem(TIPS,JSON.stringify(tips))}catch(e){}
  document.querySelectorAll(`.tip[data-k="${k}"]`).forEach(t=>{t.classList.add('out');setTimeout(()=>t.remove(),300)});
  if(k==='tap'&&beck){const q=sqAt(beck.i,beck.h);beck=null;q&&q.classList.remove('beckon')}
  if(k==='now')setTimeout(tipTap,350)}
function tipAt(k,html,q,parent){const t=el('tip',parent||q.closest('.day'));t.dataset.k=k;t.innerHTML=html;
  const x=Math.min(Math.max(parseFloat(q.style.left)-4,8),W-246),y=parseFloat(q.style.top)+Lc.F+10;t.style.left=x+'px';t.style.top=y+'px';return t}
function tipNow(){if(seen('now')){tipTap();return}const q=sqAt(0,new Date().getHours());q.classList.add('pulse');
  tipAt('now','every square is an hour.<br><b>this one is now.</b>',q);
  // the tap that dismisses the hint only dismisses it — it doesn't also open a square
  const done=()=>{removeEventListener('pointerdown',done,true);lpFired=true;setTimeout(()=>lpFired=false,600);q.classList.remove('pulse');tipDone('now')};
  setTimeout(()=>addEventListener('pointerdown',done,true),400);setTimeout(()=>{if(!tips.now)done()},7000)}
function tipTap(){if(seen('tap'))return;if(busy()){setTimeout(tipTap,800);return}const h0=new Date().getHours();let i=0,h=h0+2;if(h>23){i=1;h-=24}
  while(sqAt(i,h)&&sqAt(i,h).dataset.id){h++;if(h>23){i++;h=0}}
  beck={i,h};const q=sqAt(i,h);q.classList.add('beckon');tipAt('tap','<b>tap an hour</b> to set an ühr.',q)}
function tipSwipe(){if(seen('swipe'))return;const t=el('tip swipe',sh);t.dataset.k='swipe';t.innerHTML='<i></i><b>swipe</b> to continue';}
function tipPinch(){if(seen('pinch')||busy())return;const t=el('tip pinch',ph);t.dataset.k='pinch';t.innerHTML='<span class="pd"><i></i><i></i></span><b>pinch</b> to see the whole week';
  setTimeout(()=>{const off=()=>{removeEventListener('pointerdown',off,true);if(!tips.pinch){t.classList.add('out');setTimeout(()=>t.remove(),300)}};addEventListener('pointerdown',off,true)},600)}
if(!EMBED)setTimeout(tipNow,reduce?400:THICK+1000+500+MOVE*1.4+400);

addEventListener('resize',()=>{fit();if(!busy())layoutAll()});
// presenting + the live system page
window.uhr={ring:()=>{const n=new Date(),a=alarms.slice().sort((x,y)=>(indexOf(x)*1440+x.h*60+x.m)-(indexOf(y)*1440+y.h*60+y.m))[0];
    ring(a?{...a,id:-1,h:n.getHours(),m:n.getMinutes()}:{id:-1,h:n.getHours(),m:n.getMinutes(),name:'ühr',sound:'rise',days:[]})},
  reset:()=>{alarms=sample();store();paintAll()},
  first:()=>{alarms=[];store();try{localStorage.removeItem(TIPS)}catch(e){}location.reload()},
  zoom:n=>zoomTo(n),
  relayout:()=>{MOVE=V('--move')||640;const y=sc.scrollTop/Lc.dayH;Lc=lay();layoutAll();sc.scrollTop=y*Lc.dayH}};
if(location.hash==='#ring')setTimeout(()=>window.uhr.ring(),reduce?300:THICK+3200);
})();
