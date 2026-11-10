// ühr v5 — one thing at a time.
// home: an endless vertical grid of hours (a day = its name + six bands of four squares; a square is an hour).
// create: a square opens into five isolated steps — hour · minutes · name · sound · repeat.
// ring: real. when an alarm comes due its square grows to the screen, the grid stays, the name moves with the sound.
(()=>{
const V=n=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
const MOVE=V('--move')||640,FALL=V('--fall')||460,STEP=V('--step')||40,THICK=V('--thicken')||1500,TSPL=V('--t-splash')||120;
const p2=n=>String(n).padStart(2,'0');
const el=(c,p,tag='div')=>{const e=document.createElement(tag);if(c)e.className=c;if(p)p.appendChild(e);return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W=402,M=21,F=72,G=24,HEAD=60,ROW=F+G,DAYH=HEAD+6*ROW-G+G;
const colX=c=>M+c*(F+G);
const DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],DS=['su','mo','tu','we','th','fr','sa'];
const MON=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ymd=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
const day0=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const addDays=(d,n)=>{const x=day0(d);x.setDate(x.getDate()+n);return x};
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

// ---------- data (kept in this browser) ----------
const KEY='uhr5';
function sample(){const n=new Date(),t=day0(n),h=(n.getHours()+2)%24,dt=h<n.getHours()?addDays(t,1):t;
  return[{id:1,h,m:0,name:'training',sound:'pulse',days:[],date:ymd(dt)},{id:2,h:20,m:0,name:'pill',sound:'chime',days:[0,1,2,3,4,5,6],date:null},
    {id:3,h:7,m:0,name:'wake up',sound:'radar',days:[],date:ymd(addDays(t,1))},{id:4,h:18,m:30,name:'babysitter',sound:'radar',days:[],date:ymd(addDays(t,3))}]}
let alarms=null;try{alarms=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!Array.isArray(alarms))alarms=sample();
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(alarms))}catch(e){}};
const at=(d,h,m)=>{const x=day0(d);x.setHours(h,m,0,0);return x};
// what shows on a given day: once-alarms on their date, weekly ones on their weekdays — and only while still to come
const occ=d=>{const now=Date.now(),k=ymd(d);return alarms.filter(a=>(a.date===k&&!a.days.length)||(a.days.length&&a.days.includes(d.getDay())))
  .filter(a=>at(d,a.h,a.m).getTime()+60000>now).sort((a,b)=>a.h*60+a.m-(b.h*60+b.m))};

// ---------- stage ----------
const root=document.getElementById('app'),ph=el('phone',root);
let S=1,PH=874;
function fit(){const mob=innerWidth<=520;if(mob){S=innerWidth/W;PH=Math.round(innerHeight/S)}else{PH=874;S=Math.min(1,(innerWidth-32)/W,(innerHeight-60)/874)}
  ph.style.height=PH+'px';ph.style.transform=`scale(${S})`;root.style.width=W*S+'px';root.style.height=PH*S+'px'}
fit();
const sc=el('scroll drawing',ph),track=el('track',sc),vl=el('vl',ph);
const VX=[0,1,2,3].flatMap(c=>[colX(c),colX(c)+F]);
VX.forEach((x,i)=>{const l=el('',vl,'i');l.style.left=x+'px';l.style.setProperty('--d',i*STEP+'ms')});
const rel=e=>{const a=e.getBoundingClientRect(),b=ph.getBoundingClientRect();return{x:(a.left-b.left)/S,y:(a.top-b.top)/S,w:a.width/S,h:a.height/S}};
const clip=r=>`inset(${r.y}px ${W-r.x-r.w}px ${PH-r.y-r.h}px ${r.x}px)`;

// ---------- the endless grid ----------
let base=day0(new Date()),days=[];
// one week, as a week: today and the six days after it, by name only — then it rolls round to today again
function addDay(){const i=days.length,d=addDays(base,i%7),de=el('day',track);de.style.top=i*DAYH+'px';de.style.height=DAYH+'px';
  const hd=el('dh',de);hd.innerHTML=`<b>${i%7===0?'today':DAYS[d.getDay()]}</b>`;
  const bands=[];for(let r=0;r<6;r++){const b=el('band',de);b.style.top=HEAD+r*ROW+'px';bands.push(b)}
  const sqs=[];for(let h=0;h<24;h++){const q=el('sq',de);q.style.left=colX(h%4)+'px';q.style.top=HEAD+(h>>2)*ROW+'px';q.dataset.i=i;q.dataset.h=h;sqs.push(q)}
  days.push({d,de,sqs,bands});track.style.height=days.length*DAYH+ROW+'px';paint(i)}
function paint(i){const {d,sqs}=days[i],now=new Date();
  sqs.forEach(q=>{q.className='sq';q.innerHTML='';delete q.dataset.id;q.removeAttribute('aria-label')});
  occ(d).forEach(a=>{const q=sqs[a.h];if(q.dataset.id){q.dataset.more=(+q.dataset.more||1)+1;q.querySelector('.more')||q.insertAdjacentHTML('beforeend','<span class="more">+</span>');return}
    q.dataset.id=a.id;q.classList.add('al',a.days.length?'fixed':'temp');q.innerHTML=`<span class="t">${p2(a.h)}<br>${p2(a.m)}</span><span class="n">${esc(a.name)}</span>`;q.setAttribute('aria-label',`${p2(a.h)}:${p2(a.m)} ${a.name}`)});
  if(i%7===0){const h=now.getHours(),q=sqs[h];q.classList.add('now');
    if(!q.dataset.id)q.insertAdjacentHTML('beforeend',`<span class="nt">${p2(h)}<br>${p2(now.getMinutes())}</span>`);
    q.insertAdjacentHTML('beforeend',`<i class="nb" style="width:${(now.getMinutes()+1)/60*100}%"></i>`)}}
const paintAll=()=>days.forEach((_,i)=>paint(i));
function rebuild(){track.innerHTML='';days=[];base=day0(new Date());for(let k=0;k<14;k++)addDay()}
rebuild();
const nowY=()=>Math.max(0,HEAD+(new Date().getHours()>>2)*ROW-Math.round(PH*.3));
sc.scrollTop=nowY();
sc.addEventListener('scroll',()=>{if(sc.scrollTop+PH>days.length*DAYH-2*DAYH)for(let k=0;k<7;k++)addDay()},{passive:true});
const sqAt=(i,h)=>days[i]&&days[i].sqs[h];
const indexOf=a=>{const now=new Date();if(!a.days.length)return Math.round((parse(a.date)-base)/864e5);
  for(let i=0;i<8;i++){const d=addDays(base,i);if(a.days.includes(d.getDay())&&at(d,a.h,a.m)>now)return i}return 0};
function reveal(i,h){while(i>=days.length)addDay();sc.scrollTop=Math.max(0,i*DAYH+HEAD+(h>>2)*ROW-Math.round(PH*.32))}

// ---------- sound (synthesised) ----------
let ac=null;
const ctx=()=>{try{if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C()}if(ac&&ac.state==='suspended')ac.resume()}catch(e){}return ac};
function tone(t,f,dur,type='sine',vol=.3){const c=ac,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.05)}
const SND={radar:(t,v)=>{for(let k=0;k<4;k++)tone(t+k*.13,1568,.1,'sine',.32*v)},
  chime:(t,v)=>[523.25,659.25,783.99].forEach((f,i)=>tone(t+i*.15,f,1.3,'triangle',.28*v)),
  pulse:(t,v)=>{tone(t,220,.2,'square',.12*v);tone(t+.28,220,.2,'square',.12*v)}};
const play=(s,v=1)=>{const c=ctx();if(!c)return;try{SND[s](c.currentTime+.02,v)}catch(e){}};
const tick=()=>{const c=ctx();if(c)try{tone(c.currentTime,2400,.03,'square',.05)}catch(e){};buzz(6)};
ph.addEventListener('pointerdown',ctx,{passive:true});

// the name, set letter by letter so the sound can move through it
function setName(e,s,max=360){const txt=s||'ühr';e.innerHTML=[...txt].map((ch,i)=>`<i style="--i:${i}">${ch===' '?' ':esc(ch)}</i>`).join('');
  const longest=Math.max(...txt.split(' ').map(w=>w.length),1);e.style.setProperty('--fs',Math.max(40,Math.min(118,max/(longest*.58)))+'px')}
function animName(e,s){e.classList.remove('an-radar','an-chime','an-pulse');void e.offsetWidth;e.classList.add('an-'+s)}

// ---------- create: five isolated steps ----------
const sh=el('sheet',ph);
sh.innerHTML=`<div class="sv">${VX.map((x,i)=>`<i style="left:${x}px;--d:${i*STEP}ms"></i>`).join('')}</div>
<div class="top"><div class="dots"></div><div class="lab"></div></div><div class="body"></div>
<div class="acts"><button type="button" class="b-del">delete</button><button type="button" class="b-go">continue</button></div>`;
const dots=sh.querySelector('.dots'),lab=sh.querySelector('.lab'),body=sh.querySelector('.body'),bDel=sh.querySelector('.b-del'),bGo=sh.querySelector('.b-go');
const LABELS=['time','name','sound','repeat'];
let draft=null,step=0,origin=null;
function openSheet(i,h,a){origin=sqAt(i,h);const d=days[i].d;
  draft=a?{id:a.id,h:a.h,m:a.m,name:a.name,sound:a.sound,days:[...a.days],once:!a.days.length,date:a.date||ymd(d),edit:true}
         :{id:Date.now(),h,m:0,name:'',sound:'radar',days:[d.getDay()],once:true,date:ymd(d),edit:false};
  sh.classList.add('on');sh.style.transition='none';sh.style.clipPath=clip(rel(origin));void sh.offsetWidth;sh.style.transition='';sh.style.clipPath='inset(0px)';
  buzz(10);go(0)}
function closeSheet(target,after){const r=target?rel(target):{x:W/2-10,y:PH/2-10,w:20,h:20};sh.style.clipPath=clip(r);
  setTimeout(()=>{sh.classList.remove('on');body.innerHTML='';after&&after()},MOVE)}
function go(n,dir){const from=dir||(n>step?1:n<step?-1:0);step=n;sh.classList.add('fall');void sh.offsetWidth;sh.classList.remove('fall');
  dots.innerHTML=LABELS.map((l,k)=>`<button type="button" aria-label="${l}" class="${k<n?'done':k===n?'cur':''}"></button>`).join('');
  [...dots.children].forEach((b,k)=>b.onclick=()=>{if(k!==step)go(k)});
  lab.textContent=LABELS[n];body.innerHTML='';const inn=el('in'+(from>0?' from-r':from<0?' from-l':''),body);STEPS[n](inn);bGo.textContent='continue'}
// when a once-alarm's chosen time has already passed that day, it moves to the next day
const effDate=()=>{let d=parse(draft.date);if(draft.once&&at(d,draft.h,draft.m)<=new Date())d=addDays(d,1);return d};
const dayWord=d=>{const k=Math.round((day0(d)-day0(new Date()))/864e5);return k===0?'today':DAYS[d.getDay()]};
function wheel(inn,{get,set,fmt=p2,step:st=1,mod,onchange}){const w=el('wheel',inn);w.tabIndex=0;w.setAttribute('role','spinbutton');
  const pv=el('',w,'span'),cu=el('',w,'b'),nx=el('',w,'span');
  const draw=()=>{const v=get();pv.textContent=fmt((v-st+mod*st)%mod);cu.textContent=fmt(v);nx.textContent=fmt((v+st)%mod);w.setAttribute('aria-valuenow',v);onchange&&onchange()};
  const bump=dir=>{const v=get(),nv=dir>0?(Math.floor(v/st)*st+st)%mod:((Math.ceil(v/st)*st-st)%mod+mod)%mod;set(nv);draw();tick();
    cu.style.setProperty('--k',(dir>0?-8:8)+'px');cu.classList.add('kick');setTimeout(()=>cu.classList.remove('kick'),90)};
  let y0=null,acc=0;
  w.addEventListener('pointerdown',e=>{y0=e.clientY;acc=0;try{w.setPointerCapture(e.pointerId)}catch(_){}});
  w.addEventListener('pointermove',e=>{if(y0==null||(sw&&sw.on))return;acc+=(e.clientY-y0)/S;y0=e.clientY;while(Math.abs(acc)>=40){bump(acc>0?-1:1);acc+=acc>0?-40:40}});
  w.addEventListener('pointerup',()=>y0=null);w.addEventListener('pointercancel',()=>y0=null);
  pv.addEventListener('click',()=>bump(-1));nx.addEventListener('click',()=>bump(1));
  let wacc=0;w.addEventListener('wheel',e=>{e.preventDefault();wacc+=e.deltaY;if(Math.abs(wacc)>30){bump(wacc>0?1:-1);wacc=0}},{passive:false});
  w.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();bump(-1)}if(e.key==='ArrowDown'){e.preventDefault();bump(1)}});
  draw();return draw}
const STEPS=[
  // time: hour and minutes on one screen — two wheels, each dragged on its own
  inn=>{const pr=el('pair',inn),note=el('hint',inn,'p');const upd=()=>note.textContent=dayWord(effDate());
    const dh=wheel(pr,{get:()=>draft.h,set:v=>draft.h=v,mod:24,onchange:upd});pr.firstChild.setAttribute('aria-label','hour');
    const co=el('colon',pr);co.innerHTML='<i></i><i></i>';
    const dm=wheel(pr,{get:()=>draft.m,set:v=>draft.m=v,step:5,mod:60,onchange:upd});pr.lastChild.setAttribute('aria-label','minutes');
    inn.appendChild(note);const ch=el('chips',inn);
    [['in 1 minute','soon'],['00',0],['15',15],['30',30],['45',45]].forEach(([t,v])=>{const b=el('chip'+(v==='soon'?' or':''),ch,'button');b.type='button';b.textContent=v==='soon'?t:':'+t;
      b.onclick=()=>{if(v==='soon'){const n=new Date(Date.now()+60000);draft.h=n.getHours();draft.m=n.getMinutes();draft.date=ymd(n);draft.once=true}else draft.m=v;dh();dm();tick()}});
    el('hint',inn,'p').textContent='drag each number up or down'},
  inn=>{const cap=el('cap',inn);cap.textContent=p2(draft.h)+':'+p2(draft.m);const nm=el('nm',inn,'input');nm.id='uhr-name';nm.maxLength=16;nm.placeholder='name it';nm.autocomplete='off';nm.value=draft.name;
    nm.setAttribute('aria-label','name');const fitIn=()=>nm.style.setProperty('--fs',Math.max(36,Math.min(72,360/(Math.max(nm.value.length,6)*.56)))+'px');fitIn();
    nm.addEventListener('input',()=>{draft.name=nm.value;fitIn()});nm.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();next()}});
    el('hint',inn,'p').textContent='one or two words';setTimeout(()=>{try{nm.focus({preventScroll:true})}catch(e){}},MOVE*.6)},
  inn=>{const cap=el('cap',inn);cap.textContent=p2(draft.h)+':'+p2(draft.m);const big=el('big',inn);setName(big,draft.name);
    const ch=el('chips',inn);['radar','chime','pulse'].forEach(s=>{const b=el('chip'+(draft.sound===s?' on':''),ch,'button');b.type='button';b.textContent=s;
      b.onclick=()=>{draft.sound=s;[...ch.children].forEach(x=>x.classList.toggle('on',x===b));play(s,.9);animName(big,s)}});
    el('hint',inn,'p').textContent='tap to hear it';setTimeout(()=>{play(draft.sound,.6);animName(big,draft.sound)},MOVE*.7)},
  inn=>{const cap=el('cap',inn);const big=el('big',inn);setName(big,draft.name);big.style.setProperty('--fs',Math.min(72,parseFloat(big.style.getPropertyValue('--fs')))+'px');
    const ch=el('chips',inn),dch=el('chips',inn),note=el('hint',inn,'p');
    const draw=()=>{cap.textContent=p2(draft.h)+':'+p2(draft.m);note.textContent=draft.once?dayWord(effDate()):'every '+(draft.days.length===7?'day':draft.days.map(d=>DS[d]).join(' '));
      [...ch.children].forEach((b,k)=>b.classList.toggle('on',k===(draft.once?0:1)));dch.hidden=draft.once;[...dch.children].forEach((b,k)=>b.classList.toggle('on',draft.days.includes(k)))};
    ['once','every week'].forEach((t,k)=>{const b=el('chip',ch,'button');b.type='button';b.textContent=t;b.onclick=()=>{draft.once=!k;if(!draft.days.length)draft.days=[effDate().getDay()];draw();tick()}});
    DS.forEach((t,k)=>{const b=el('chip sqd',dch,'button');b.type='button';b.textContent=t;b.onclick=()=>{const i=draft.days.indexOf(k);i<0?draft.days.push(k):draft.days.length>1&&draft.days.splice(i,1);draft.days.sort();draw();tick()}});
    draw()}];
function next(){if(step<STEPS.length-1){go(step+1);return}commit()}
function commit(){const d=effDate(),a={id:draft.id,h:draft.h,m:draft.m,name:(draft.name.trim()||'ühr').split(/\s+/).slice(0,2).join(' '),sound:draft.sound,
    days:draft.once?[]:[...draft.days],date:draft.once?ymd(d):null};
  alarms=alarms.filter(x=>x.id!==a.id);alarms.push(a);store();paintAll();
  const i=indexOf(a);reveal(i,a.h);const q=sqAt(i,a.h);buzz([10,40,10]);
  closeSheet(q,()=>{if(q){q.classList.add('pop');setTimeout(()=>q.classList.remove('pop'),700)}})}
bGo.addEventListener('click',next);
// carousel: swipe the step sideways — left for the next, right for the one before; the page follows the finger
let sw=null;
body.addEventListener('pointerdown',e=>{sw={x:e.clientX,y:e.clientY,on:false}},true);
body.addEventListener('pointermove',e=>{if(!sw)return;const dx=(e.clientX-sw.x)/S,dy=(e.clientY-sw.y)/S;
  if(!sw.on&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.4)sw.on=true;
  if(sw.on){const inn=body.firstChild,edge=(dx>0&&step===0)||(dx<0&&step===STEPS.length-1);inn.style.animation='none';inn.style.transform=`translateX(${edge?dx*.25:dx}px)`;inn.style.opacity=1-Math.min(.5,Math.abs(dx)/600)}},true);
const swEnd=e=>{if(!sw)return;const dx=(e.clientX-sw.x)/S,on=sw.on;sw=null;if(!on)return;const inn=body.firstChild;
  if(dx<-70&&step<STEPS.length-1){tick();go(step+1,1)}else if(dx>70&&step>0){tick();go(step-1,-1)}
  else{inn.style.transition='transform 240ms var(--ease),opacity 240ms';inn.style.transform='';inn.style.opacity=''}};
body.addEventListener('pointerup',swEnd,true);body.addEventListener('pointercancel',()=>{sw=null},true);
bDel.addEventListener('click',()=>{if(draft&&draft.edit){const q=origin;alarms=alarms.filter(x=>x.id!==draft.id);store();
    closeSheet(q,()=>{if(q){q.classList.add('vanish');setTimeout(paintAll,700)}else paintAll()})}else closeSheet(origin)});
sc.addEventListener('click',e=>{const q=e.target.closest('.sq');if(!q||sh.classList.contains('on')||ringing)return;
  const i=+q.dataset.i,h=+q.dataset.h,a=q.dataset.id?alarms.find(x=>String(x.id)===q.dataset.id):null;openSheet(i,h,a)});
// pinch: open on a square = open it; pinch closed on a step = back out
let pz=null;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
ph.addEventListener('touchstart',e=>{if(e.touches.length===2)pz={d:dist(e.touches),x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2,done:false}},{passive:true});
ph.addEventListener('touchmove',e=>{if(!pz||e.touches.length!==2||pz.done)return;e.preventDefault();const k=dist(e.touches)/pz.d;
  if(k>1.3&&!sh.classList.contains('on')&&!ringing){pz.done=true;const q=document.elementsFromPoint(pz.x,pz.y).find(n=>n.classList&&n.classList.contains('sq'));if(q)q.click()}
  if(k<.75&&sh.classList.contains('on')){pz.done=true;closeSheet(origin)}},{passive:false});
ph.addEventListener('touchend',e=>{if(e.touches.length<2)pz=null});

// ---------- ring ----------
const rg=el('ring',ph);
rg.innerHTML=`<div class="sv">${VX.map(x=>`<i style="left:${x}px"></i>`).join('')}</div><div class="rh"></div><div class="rtime"></div><div class="rname"><div class="big"></div></div>
<div class="acts"><button type="button" class="b-del">snooze · 9 min</button><button type="button" class="b-go">stop</button></div>`;
const rh=rg.querySelector('.rh'),rtime=rg.querySelector('.rtime'),rname=rg.querySelector('.rname .big');
let ringing=null,rLoop=null,firedAt='';
function ring(a){if(ringing)return;if(sh.classList.contains('on')){sh.classList.remove('on');body.innerHTML=''}ringing=a;
  const i=a.id<0?0:Math.max(0,Math.round((day0(new Date())-base)/864e5));reveal(i,a.h);paint(i);const q=sqAt(i,a.h);
  rg.className='ring on '+(a.days.length?'fixed':'temp');
  rh.innerHTML='';days[i].bands.concat(days[i+1]?days[i+1].bands:[]).forEach(b=>{const r=rel(b);if(r.y>-80&&r.y<PH)[r.y,r.y+F].forEach(y=>{el('',rh,'i').style.top=y+'px'})});
  rtime.innerHTML=`${p2(a.h)}<span class="cd"></span>${p2(a.m)}`;setName(rname,a.name);
  rg.style.transition='none';rg.style.clipPath=clip(rel(q));void rg.offsetWidth;rg.style.transition='';rg.style.clipPath='inset(0px)';
  let cyc=0;const beat=()=>{play(a.sound,Math.min(1,.4+cyc*.12));animName(rname,a.sound);buzz([280,120,280]);cyc++};
  setTimeout(beat,MOVE*.6);rLoop=setInterval(beat,2000)}
function stopRing(snooze){const a=ringing;if(!a)return;clearInterval(rLoop);buzz(0);
  const i=Math.max(0,Math.round((day0(new Date())-base)/864e5)),q=sqAt(i,a.h);
  if(a.id>0&&!a.days.length)alarms=alarms.filter(x=>x.id!==a.id);
  let sn=null;if(snooze){const t=new Date(Date.now()+9*60000);sn={id:Date.now(),h:t.getHours(),m:t.getMinutes(),name:a.name,sound:a.sound,days:[],date:ymd(t)};alarms.push(sn)}
  store();rg.style.clipPath=clip(rel(q));
  setTimeout(()=>{rg.className='ring';ringing=null;
    // done is done: a once-alarm leaves its square — no list keeps it
    if(q&&q.dataset.id&&!a.days.length){q.classList.add('vanish');setTimeout(()=>{paintAll();popSn()},700)}else{paintAll();popSn()}},MOVE);
  function popSn(){if(!sn)return;const j=indexOf(sn),s=sqAt(j,sn.h);if(s){s.classList.add('pop');setTimeout(()=>s.classList.remove('pop'),700)}}}
rg.querySelector('.b-go').addEventListener('click',()=>stopRing(false));
rg.querySelector('.b-del').addEventListener('click',()=>stopRing(true));
let sy=null;rg.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))sy=e.clientY});
addEventListener('pointerup',e=>{if(sy!=null&&ringing&&(sy-e.clientY)/S>PH*.2)stopRing(false);sy=null});

// ---------- the clock: repaint each minute; ring what is due ----------
let lastMin=-1;
setInterval(()=>{const n=new Date(),mk=n.getHours()*60+n.getMinutes();
  if(ymd(day0(n))!==ymd(base)){const y=sc.scrollTop;rebuild();sc.scrollTop=Math.max(0,y-DAYH)}
  if(mk!==lastMin){lastMin=mk;days.forEach((_,i)=>i%7===0&&paint(i))}
  if(ringing)return;const key=ymd(n)+' '+mk;if(firedAt===key)return;
  const due=alarms.find(a=>a.h===n.getHours()&&a.m===n.getMinutes()&&((a.date===ymd(n)&&!a.days.length)||a.days.includes(n.getDay())));
  if(due){firedAt=key;ring(due)}},1000);

// ---------- splash: ühr breathes thin → black; then now falls into its own square and the grid draws itself ----------
function umlaut(u){const cs=getComputedStyle(u),fs=parseFloat(cs.fontSize),c=umlaut.c||(umlaut.c=document.createElement('canvas').getContext('2d'));
  c.font=`${Math.round(parseFloat(cs.fontWeight))} ${fs}px ${cs.fontFamily}`;const m=c.measureText('u');
  const b=(fs-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent,mid=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2,d=fs*.12,g=d*.6,top=b-m.actualBoundingBoxAscent-g-d;
  u.querySelectorAll('i').forEach((i,k)=>Object.assign(i.style,{width:d+'px',height:d+'px',top:top+'px',left:mid+(k?g/2:-g/2-d)+'px'}))}
function drawGrid(){const top=sc.scrollTop;let k=0;
  days.forEach(D=>D.bands.forEach(b=>{const y=parseFloat(D.de.style.top)+parseFloat(b.style.top)-top;b.style.setProperty('--d',(y>-80&&y<PH?(8*STEP+(k++)*STEP*1.5):0)+'ms')}));
  void sc.offsetWidth;sc.classList.remove('drawing')}
function land(){const q=sqAt(0,new Date().getHours()),r=rel(q),n=new Date(),L=el('land',ph);L.innerHTML=`<span>${p2(n.getHours())}</span><span>${p2(n.getMinutes())}</span>`;
  L.style.left=r.x+8+'px';L.style.top=r.y+9+'px';ph.classList.add('landing');
  const k=(W-2*M)/L.offsetWidth;L.style.transition='none';L.style.transform=`translate(${M-(r.x+8)}px,${PH*.24-(r.y+9)}px) scale(${k})`;void L.offsetWidth;
  L.style.transition='';setTimeout(()=>{L.style.transform='';drawGrid()},500);
  setTimeout(()=>{ph.classList.remove('landing');L.remove()},500+MOVE*1.4+60)}
function splash(){const sp=el('splash',ph);sp.innerHTML='<div class="sw"><span class="u">u<i></i><i></i></span><span>h</span><span>r</span></div>';
  const sw=sp.firstChild,ls=[...sw.children],TOP=Math.round(PH*.36);sw.style.top=TOP+'px';
  const gv=ls.flatMap(()=>[el('gv',sp),el('gv',sp)]),gh=[el('gh',sp),el('gh',sp)];gv.forEach(g=>{g.style.top=TOP-2*G+'px';g.style.height=TSPL+4*G+'px'});
  let BL=0,XH=0;const trk=()=>{ls.forEach((s,i)=>{gv[2*i].style.left=s.offsetLeft+'px';gv[2*i+1].style.left=s.offsetLeft+s.offsetWidth+'px'});umlaut(ls[0]);gh[0].style.top=TOP+BL+'px';gh[1].style.top=TOP+BL-XH+'px'};
  const go2=()=>{const c=document.createElement('canvas').getContext('2d');c.font=`100 ${TSPL}px ${getComputedStyle(sw).fontFamily}`;const m=c.measureText('x');
    BL=(TSPL-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent;XH=m.actualBoundingBoxAscent;trk();sp.classList.add('ready');
    const t0=performance.now(),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,stepF=n=>{const t=Math.min(1,(n-t0)/THICK);sw.style.fontWeight=Math.round(100+800*ease(t));trk();if(t<1)requestAnimationFrame(stepF)};
    requestAnimationFrame(stepF);
    setTimeout(()=>{sp.classList.add('out');land();setTimeout(()=>sp.remove(),400)},THICK+1000)};
  (document.fonts&&document.fonts.load?document.fonts.load(`100 ${TSPL}px under`).then(()=>document.fonts.ready):Promise.resolve()).then(go2,go2)}
if(reduce){sc.classList.remove('drawing')}else splash();

addEventListener('resize',()=>{fit()});
// presenting: ring the next alarm now, or start again from the sample
window.uhr={ring:()=>{const n=new Date(),a=alarms.slice().sort((x,y)=>(indexOf(x)*1440+x.h*60+x.m)-(indexOf(y)*1440+y.h*60+y.m))[0];
    ring(a?{...a,id:-1,h:n.getHours(),m:n.getMinutes(),days:a.days}:{id:-1,h:n.getHours(),m:n.getMinutes(),name:'ühr',sound:'radar',days:[]})},
  reset:()=>{alarms=sample();store();paintAll()}};
if(location.hash==='#ring')setTimeout(()=>window.uhr.ring(),reduce?300:THICK+3200);
})();
