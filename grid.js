// one grid, three levels: week (7 cols) → day (4×6 fields) → hour (4 quarters). rows = 4-hour bands.
const V=n=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
const DAYS=['su','mo','tu','we','th','fr','sa'],FULL=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const p2=n=>String(n).padStart(2,'0');
// the umlaut: two true circles centred on the ink of the u (not its box), the same rule in every logo
function umlaut(u){const cs=getComputedStyle(u),fs=parseFloat(cs.fontSize),c=umlaut.c||(umlaut.c=document.createElement('canvas').getContext('2d'));
  c.font=`${Math.round(parseFloat(cs.fontWeight))} ${fs}px ${cs.fontFamily}`;const m=c.measureText('u');
  const base=(fs-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent,mid=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2;
  const d=fs*.12,g=d*.6,top=base-m.actualBoundingBoxAscent-g-d;
  u.querySelectorAll('i').forEach((i,k)=>Object.assign(i.style,{width:d+'px',height:d+'px',top:top+'px',left:mid+(k?g/2:-g/2-d)+'px'}))}
function mountUhr(root){
  const W=402,M=V('--margin'),F=V('--field'),G=V('--gap'),T=V('--top'),R=V('--row'),STEP=V('--step'),MV=V('--move');
  const cw=(W-2*M)/7,rowY=r=>T+r*(R+G),weekX=i=>M+i*cw,dayX=[0,1,2,3].flatMap(c=>[M+c*(F+G),M+c*(F+G)+F]);
  const el=(c,p=root,tag='div')=>{const e=document.createElement(tag);e.className=c;p.appendChild(e);return e};
  root.innerHTML='';const ph=el('phone');
  const lg=el('logo',ph);lg.innerHTML='<span class="u">u<i></i><i></i></span>hr<span class="bp"></span>';const bn=el('bignow',ph);
  // the big now sits on the logo's baseline: both lines are measured, not guessed
  const alignBig=()=>{const a=lg.querySelector('.bp'),b=bn.querySelector('.bp');if(!a||!b)return;bn.style.top=(lg.offsetTop+a.offsetTop+a.offsetHeight)-(b.offsetTop+b.offsetHeight)+'px'};
  // umlaut = two true circles, measured from the u itself: centred on its ink, equal gaps
  umlaut(lg.querySelector('.u'));(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>umlaut(lg.querySelector('.u')));
  const H=[];for(let r=0;r<6;r++)for(const y of[rowY(r),rowY(r)+R]){const h=el('h',ph);h.style.top=y+'px';H.push(h)}
  const vl=[...Array(8)].map(()=>el('v',ph));
  const lab=DAYS.map(d=>el('lab',ph));
  const hrs=[...Array(24)].map((_,h)=>{const n=el('hr',ph);n.textContent=p2(h);n.style.left=dayX[2*(h%4)]+4+'px';n.style.top=rowY(h>>2)+4+'px';return n});
  // week: which hour is which — the band's first hour in the margin, and faint quarter lines (one per hour) inside each band
  for(let r=0;r<6;r++){const n=el('wl',ph);n.textContent=p2(r*4);n.style.top=rowY(r)+3+'px'}
  const wh=el('wh',ph);let revT=null;
  const gr=el('grow',ph),next=el('next',ph),msg=el('msg',ph),hi=el('hi',ph),nf=el('hi nowf',ph);
  // hour level (מדייקת)
  const fm=el('form',ph);fm.innerHTML=`<div class="note"></div><div class="big"></div><div class="mins"><i></i></div>
   <input class="what" placeholder="what? · 2 words" maxlength="14"><div class="type"><b data-t="temp">temporary</b><b data-t="fixed">fixed</b></div>
   <div class="snd"><b data-s="radar">radar</b><b data-s="chime">chime</b><b data-s="pulse">pulse</b></div><div class="days">${DAYS.map((d,i)=>`<b data-d="${i}">${d}</b>`).join('')}</div><div class="del">delete</div>`;
  const q=s=>fm.querySelector(s),big=q('.big'),mins=q('.mins'),what=q('.what');
  // clear actions, on the grid: cancel (outline, 2 squares) · save (solid, 2 squares) · delete stays apart
  const bc=el('bact bcancel',ph,'button'),bs=el('bact bsave',ph,'button'),bd=el('bdel',ph,'button');bc.type=bs.type=bd.type='button';bc.textContent='delete';bd.textContent='delete';
  Object.assign(bc.style,{left:dayX[0]+'px',width:dayX[3]-dayX[0]+'px'});Object.assign(bs.style,{left:dayX[4]+'px',width:dayX[7]-dayX[4]+'px'});
  const place=(e,r,c0=0,c1=3,h=R)=>Object.assign(e.style,{left:dayX[2*c0]+'px',width:dayX[2*c1+1]-dayX[2*c0]+'px',top:rowY(r)+'px',height:h+'px'});
  place(big,0,0,3,R*2+G);place(mins,2);place(what,3,0,3,R/2);place(q('.type'),4,0,3,R/2);place(q('.days'),5,0,3,R/2);
  {const s=q('.snd');place(s,3,0,3,R/2-12);s.style.top=rowY(3)+R/2+12+'px'}
  place(q('.note'),0,0,3,20);Object.assign(q('.del').style,{right:M+'px',bottom:'24px'});
  // long press on a field: edit / delete (the field turns dashed while deciding)
  const menu=el('menu',ph);menu.innerHTML='<b data-a="edit">edit</b><b data-a="del">delete</b>';
  let lpT=null,lp=null,skip=false;
  const closeMenu=()=>{menu.classList.remove('show');if(lp!==null){const e=els.get(day+'-'+lp);e&&e.classList.remove('pending')}lp=null};
  menu.addEventListener('pointerdown',e=>e.stopPropagation());
  menu.addEventListener('click',e=>{e.stopPropagation();const a=e.target.dataset.a,h=lp;if(!a)return;
    if(a==='edit'){closeMenu();openHour(h)}else{menu.classList.remove('show');lp=null;alarms=alarms.filter(x=>!(x.d===day&&x.h===h));render()}});
  ph.addEventListener('contextmenu',e=>e.preventDefault());
  [...Array(4)].forEach((_,c)=>{const t=el('qt',mins);t.textContent=p2(c*15);t.style.left=dayX[2*c]-dayX[0]+4+'px'});

  let alarms=[{d:1,h:17,m:0,t:'temp',l:'training',s:'pulse'},{d:2,h:7,m:0,t:'temp',l:'wake up',s:'chime'},{d:4,h:18,m:0,t:'temp',l:'babysitter',s:'radar'},
    ...DAYS.map((_,d)=>({d,h:20,m:0,t:'fixed',l:'pill'}))];
  const first=location.search.includes('first');if(first)alarms=[];
  const els=new Map(),now=new Date(),today=now.getDay();let day=null,hour=null,draft=null;
  const tm=a=>p2(a.h)+'<em class="cd" aria-label=":"></em>'+p2(a.m);

  function layout(anchor){
    ph.classList.toggle('isday',day!==null);ph.classList.toggle('ishour',hour!==null);
    vl.forEach((v,i)=>{v.style.transitionDelay=Math.abs(i-anchor)*STEP+'ms';v.style.left=(day===null?weekX(i):dayX[i])+'px'});
    lab.forEach((l,i)=>{const on=day===i;l.classList.toggle('on',on);l.textContent=on?FULL[i]:DAYS[i];
      l.style.transitionDelay=Math.abs(i*2-anchor)*STEP+'ms';l.style.left=(day===null?weekX(i)+4:M)+'px';l.style.opacity=day===null||on?1:0});
    hrs.forEach((n,h)=>n.style.transitionDelay=(day===null?0:300+h*12)+'ms');
    render(anchor);
  }
  // מתמקדת / מתרחקת: the grid falls in — verticals from the top, horizontals from the sides — and lands hard
  const FALL=V('--fall');
  function drop(anchor){ph.classList.add('reveal');clearTimeout(revT);revT=setTimeout(()=>ph.classList.remove('reveal'),1700);const VE=8*STEP+FALL;ph.classList.add('dropping');ph.classList.remove('land');layout(anchor);
    vl.forEach((l,i)=>{l.classList.remove('fall');void l.offsetWidth;l.style.animationDelay=Math.abs(i-anchor)*STEP+'ms';l.classList.add('fall')});
    H.forEach((l,i)=>{l.classList.remove('fall','r');void l.offsetWidth;l.style.animationDelay=VE+i*STEP/2+'ms';l.classList.add('fall');if(i%2)l.classList.add('r')});
    const end=VE+12*STEP/2+FALL;
    setTimeout(()=>{ph.classList.remove('dropping');ph.classList.add('land');[...vl,...H].forEach(l=>l.classList.remove('fall','r'))},end)}
  // the time of now is drawn as svg on its own baselines, sized from the real ink of this device's helvetica
  // (pixels, not font metrics): it fills the square, 4px inside, and can never spill out of it
  let NOWFIT=null;
  const nowFit=()=>{if(NOWFIT)return NOWFIT;const fam=getComputedStyle(document.documentElement).getPropertyValue('--font').trim()||'Helvetica',Z=200,c=document.createElement('canvas');c.width=Z*3;c.height=Z*2;
    const x=c.getContext('2d');x.font=`700 ${Z}px ${fam}`;let l=1e9,r=-1e9,a=0,d=0;
    for(const t of ['00','88','44','23','59']){x.clearRect(0,0,c.width,c.height);x.fillText(t,Z*.5,Z*1.4);const im=x.getImageData(0,0,c.width,c.height).data;
      for(let y=0;y<c.height;y++)for(let X=0;X<c.width;X++)if(im[(y*c.width+X)*4+3]>60){if(X<l)l=X;if(X+1>r)r=X+1;if(Z*1.4-y>a)a=Z*1.4-y;if(y+1-Z*1.4>d)d=y+1-Z*1.4}}
    l=(l-Z*.5)/Z;r=(r-Z*.5)/Z;a/=Z;d=Math.max(0,d)/Z;const P=4,GP=.068,h=2*(a+d)+GP,fs=Math.min((F-2*P)/(r-l),(R-2*P)/h);
    return NOWFIT={fs,l,a,d,P,GP,w:(r-l)*fs,h:h*fs}};
  const nowSVG=(hh,mm)=>{const n=nowFit(),x=n.P-n.l*n.fs,y1=n.P+n.a*n.fs,y2=y1+(n.d+n.GP+n.a)*n.fs;
    return `<svg class="nowsvg" width="${F}" height="${R}" viewBox="0 0 ${F} ${R}"><text x="${x}" y="${y1}" font-size="${n.fs}">${hh}</text><text x="${x}" y="${y2}" font-size="${n.fs}">${mm}</text></svg>`};
  const nowLine=(w,h,hh,mm)=>{const n=nowFit(),P=3,dg=.16,gp=.14,c=nowLine.c||(nowLine.c=document.createElement('canvas').getContext('2d'));
    c.font='700 100px '+(getComputedStyle(document.documentElement).getPropertyValue('--font').trim()||'Helvetica');const wh=c.measureText(hh).width/100,wm=c.measureText(mm).width/100,tot=wh+wm+dg+2*gp;
    const fs=Math.min((w-2*P)/tot,(h-2*P)/n.a),xs=(w-tot*fs)/2,y=(h+n.a*fs)/2,rd=dg*fs/2,cx=xs+(wh+gp)*fs+rd;
    return `<svg class="nowsvg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="${xs}" y="${y}" font-size="${fs}">${hh}</text><circle cx="${cx}" cy="${y-n.a*fs*.66}" r="${rd}"/><circle cx="${cx}" cy="${y-rd}" r="${rd}"/><text x="${xs+(wh+dg+2*gp)*fs}" y="${y}" font-size="${fs}">${mm}</text></svg>`};
  (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{NOWFIT=null;render()});
  // week: hour over minutes, filling today's square in the current 4-hour band (the same language as the day)
  const nowStack=(w,h,hh,mm)=>{const n=nowFit(),P=4,wem=n.w/n.fs,hem=2*(n.a+n.d)+n.GP,fs=Math.min((w-2*P)/wem,(h-2*P)/hem),x=P-n.l*fs,y1=P+n.a*fs,y2=y1+(n.d+n.GP+n.a)*fs;
    return `<svg class="nowsvg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="${x}" y="${y1}" font-size="${fs}">${hh}</text><text x="${x}" y="${y2}" font-size="${fs}">${mm}</text></svg>`};
  function render(anchor=0){ph.classList.toggle('first',!alarms.length);
    const keep=new Set();
    alarms.forEach(a=>{const k=a.d+'-'+a.h;keep.add(k);let e=els.get(k);
      if(!e){e=el('al',ph);e.innerHTML='<b></b><span></span>';els.set(k,e);e.classList.add('enter');requestAnimationFrame(()=>requestAnimationFrame(()=>e.classList.remove('enter')))}
      e.classList.remove('temp','fixed');e.classList.add(a.t);e.querySelector('b').innerHTML=day===a.d?`<i>${p2(a.h)}</i><i>${p2(a.m)}</i>`:tm(a);e.querySelector('span').textContent=a.l+(a.w?' · next week':'');
      const s=e.style;s.transitionDelay=Math.abs(a.d*2-anchor)*STEP+'ms';
      if(hour!==null&&a.d===day&&a.h===hour){place(e,0,0,3,R*2+G);s.opacity=0}
      else if(day===null){s.left=weekX(a.d)+2+'px';s.width=cw-4+'px';s.top=rowY(a.h>>2)+(a.h%4)*R/4+'px';s.height=R/4+'px';s.opacity=1}
      else if(a.d===day&&hour===null){place(e,a.h>>2,a.h%4,a.h%4);s.opacity=1}else s.opacity=0;
      e.classList.toggle('big',day===a.d)});
    for(const[k,e]of els)if(!keep.has(k)){e.classList.add('enter');setTimeout(()=>e.remove(),300);els.delete(k)}
    // now stays in its field, always — unless an alarm sits in that same hour (the alarm wins: it is what will ring)
    {const d=new Date();bn.innerHTML=p2(d.getHours())+'<em class="cd"></em>'+p2(d.getMinutes())+'<span class="bp"></span>';alignBig()}
    const nw=new Date(),H0=nw.getHours(),st=nf.style,busy=alarms.some(a=>a.d===today&&a.h===H0);
    nf.classList.toggle('show',hour===null&&(day===null||day===today));void busy;
    const hm=p2(H0)+p2(nw.getMinutes());
    nf.innerHTML=day===today?nowSVG(hm.slice(0,2),hm.slice(2)):'';
    if(day===null){st.left=weekX(today)+'px';st.width=cw+'px';st.top=rowY(H0>>2)+(H0%4+nw.getMinutes()/60)*R/4-1.5+'px';st.height='3px'}else place(nf,H0>>2,H0%4,H0%4);
    if(hour!==null){next.innerHTML='<b class="done">done</b>';return}
    const nk=H0*60+now.getMinutes(),key=a=>{const k=(a.d-today+7)%7*1440+a.h*60+a.m;return k<=nk?k+10080:k};
    const n=alarms.filter(a=>day===null||a.d===day).sort((a,b)=>key(a)-key(b))[0];
    next.innerHTML=n?`<small>next</small>${tm(n)} ${n.l} · ${n.t==='temp'?'temporary':'fixed'}`:'<small>now</small>choose an hour';
  }
  function form(){big.innerHTML=`<i><span>${p2(draft.h)}</span></i><i><span>${p2(draft.m)}</span></i>`;big.className='big s-'+(draft.s||'radar');
    fm.querySelectorAll('.snd b').forEach(b=>b.classList.toggle('on',b.dataset.s===(draft.s||'radar')));mins.querySelector('i').style.left=draft.m/60*(dayX[7]-dayX[0])+'px';
    what.value=draft.l;ph.classList.remove('t-temp','t-fixed','t-none');ph.classList.add('t-'+(draft.t||'none'));
    const nd=new Date(now);nd.setDate(nd.getDate()+7);
    q('.note').textContent=draft.past&&draft.t!=='fixed'?'next week':'';
    q('.del').textContent=draft.isNew?'cancel':'delete';fm.querySelectorAll('.type b').forEach(b=>b.classList.toggle('on',b.dataset.t===draft.t));
    fm.querySelectorAll('.days b').forEach(b=>b.classList.toggle('on',draft.days.includes(+b.dataset.d)));q('.days').classList.toggle('off',draft.t!=='fixed');bs.textContent='continue';bd.hidden=true}
  // מתמקדת בשעה: the field grows to fill the grid (and shrinks back)
  const full=()=>Object.assign(gr.style,{left:dayX[0]-12+'px',width:dayX[7]-dayX[0]+24+'px',top:T-4+'px',height:rowY(5)+R-T+16+'px'}),cell=h=>place(gr,h>>2,h%4,h%4);
  function grow(h,open){gr.style.transition='none';open?cell(h):full();gr.style.opacity=1;void gr.offsetWidth;
    gr.style.transition='';open?full():cell(h);if(!open)setTimeout(()=>{if(hour===null){gr.style.opacity=0;ph.classList.remove('t-temp','t-fixed','t-none')}},MV)}
  function openHour(h){closeMenu();grow(h,true);const a=alarms.find(a=>a.d===day&&a.h===h);hour=h;const past=day===today&&h<now.getHours();
    draft=a?{...a,past,days:a.t==='fixed'?alarms.filter(b=>b.h===h&&b.t==='fixed'&&b.l===a.l).map(b=>b.d):[day]}
      :{d:day,h,m:day===today&&h===now.getHours()?now.getMinutes():0,t:'',l:'',s:'radar',days:[day],past,isNew:true};
    form();layout(h%4*2+1);setTimeout(()=>what.focus({preventScroll:true}),MV)}
  function closeHour(save){const h=hour;
    alarms=alarms.filter(a=>!(a.h===h&&(a.d===day||(draft.t==='fixed'&&a.t==='fixed'&&draft.days.includes(a.d)))));
    if(save){const ds=draft.t==='fixed'?draft.days:[day];const t=draft.t||'temp';ds.forEach(d=>alarms.push({d,h,m:draft.m,t,l:draft.l||'alarm',s:draft.s||'radar',w:t==='temp'&&draft.past?1:0}))}
    hour=null;draft=null;what.blur();grow(h,false);layout(h%4*2+1)}
  // minutes: drag across the 4 quarters
  const setM=e=>{const[x]=at(e);draft.m=Math.max(0,Math.min(59,Math.round((x-dayX[0])/(dayX[7]-dayX[0])*60)));form()};
  mins.addEventListener('pointerdown',e=>{e.stopPropagation();mins.setPointerCapture(e.pointerId);setM(e)});
  mins.addEventListener('pointermove',e=>{if(e.buttons)setM(e)});
  // a name is two words at most, 14 letters: the field has room for that and no more
  what.addEventListener('input',()=>{let v=what.value.replace(/^\s+/,'').replace(/\s+/g,' ');const w=v.split(' ');if(w.length>2)v=w.slice(0,2).join(' ');if(v!==what.value)what.value=v;draft.l=v.trim()});
  fm.addEventListener('click',e=>{e.stopPropagation();const b=e.target;
    if(b.dataset.s){draft.s=b.dataset.s;form();sound(draft.s);big.classList.remove('play');void big.offsetWidth;big.classList.add('play');return}
    if(b.dataset.t){if(b.dataset.t==='fixed'&&draft.t!=='fixed')draft.days=[0,1,2,3,4,5,6];draft.t=b.dataset.t;if(!draft.days.length)draft.days=[day]}
    if(b.dataset.d&&draft.t==='fixed'){const d=+b.dataset.d;draft.days=draft.days.includes(d)?draft.days.filter(x=>x!==d):[...draft.days,d]}
    if(b.classList.contains('del')){draft.days=[];closeHour(false);return}form()});
  next.addEventListener('click',e=>{if(hour!==null){e.stopPropagation();closeHour(true)}});

  const at=e=>{const b=ph.getBoundingClientRect(),s=b.width/W;return[(e.clientX-b.left)/s,(e.clientY-b.top)/s]};
  const field=(x,y)=>{const c=[0,1,2,3].find(c=>x>=dayX[2*c]&&x<=dayX[2*c+1]),r=[0,1,2,3,4,5].find(r=>y>=rowY(r)&&y<=rowY(r)+R);return c===undefined||r===undefined?null:r*4+c};
  ph.addEventListener('pointerdown',e=>{if(day===null||hour!==null)return;const h=field(...at(e));if(h===null)return;
    place(hi,h>>2,h%4,h%4);hi.classList.add('show');skip=false;clearTimeout(lpT);
    if(lp===null&&alarms.some(a=>a.d===day&&a.h===h))lpT=setTimeout(()=>{skip=true;hi.classList.remove('show');lp=h;
      const e=els.get(day+'-'+h);e&&e.classList.add('pending');const c=h%4,ms=menu.style;
      ms.left=(c<2?dayX[2*c+1]+6:dayX[2*c]-116)+'px';ms.top=rowY(h>>2)+'px';menu.classList.add('show')},500)});
  addEventListener('pointerup',()=>{hi.classList.remove('show');clearTimeout(lpT)});
  ph.addEventListener('click',e=>{if(skip){skip=false;return}if(lp!==null){closeMenu();return}
    if(ph.classList.contains('mess')||Date.now()-lastPinch<400)return;const[x,y]=at(e);
    if(hour!==null){if(y<T-8)closeHour(true);return}
    if(day===null){if(y<T-40||y>rowY(5)+R)return;day=Math.min(6,Math.max(0,Math.floor((x-M)/cw)));drop(day*2+1);return}
    if(y<T-8){const d=day;day=null;drop(d*2+1);return}
    const h=field(x,y);if(h===null)return;
    openHour(h)});
  function fail(h,t){msg.textContent=t;msg.style.left=dayX[2*(h%4)]+4+'px';msg.style.top=rowY(h>>2)+R-18+'px';
    msg.classList.remove('show');void msg.offsetWidth;msg.classList.add('show')}
  // pinch: the grid follows the fingers (week ⇄ day, day → hour). past halfway it continues by itself.
  let pz=null,lastPinch=0;const lerp=(a,b,t)=>a+(b-a)*t,dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  ph.addEventListener('touchstart',e=>{if(e.touches.length>1)clearTimeout(lpT);if(e.touches.length!==2||hour!==null||ph.classList.contains('mess'))return;
    const c={clientX:(e.touches[0].clientX+e.touches[1].clientX)/2,clientY:(e.touches[0].clientY+e.touches[1].clientY)/2},[x,y]=at(c);
    pz={d0:dist(e.touches),p:0,mode:day===null?'in':'out',target:day===null?Math.min(6,Math.max(0,Math.floor((x-M)/cw))):field(x,y)};
    ph.classList.add('live')},{passive:false});
  ph.addEventListener('touchmove',e=>{if(!pz||e.touches.length!==2)return;e.preventDefault();const r=dist(e.touches)/pz.d0;
    if(pz.mode==='out'&&r>1&&pz.target!==null)pz.mode='hour';if(pz.mode==='hour'&&r<1)pz.mode='out';
    const p=pz.p=Math.max(0,Math.min(1,pz.mode==='out'?(1-r)/.5:r-1));
    if(pz.mode==='in')vl.forEach((v,i)=>v.style.left=lerp(weekX(i),dayX[i],p)+'px');
    if(pz.mode==='out')vl.forEach((v,i)=>v.style.left=lerp(dayX[i],weekX(i),p)+'px');
    if(pz.mode==='hour'){const h=pz.target,a=[dayX[2*(h%4)],rowY(h>>2),F,R],b=[dayX[0],T,dayX[7]-dayX[0],rowY(5)+R-T];
      Object.assign(gr.style,{transition:'none',opacity:1,left:lerp(a[0],b[0],p)+'px',top:lerp(a[1],b[1],p)+'px',width:lerp(a[2],b[2],p)+'px',height:lerp(a[3],b[3],p)+'px'})}
    ph.style.setProperty('--fade',1-p)},{passive:false});
  ph.addEventListener('touchend',()=>{if(!pz)return;const{mode,p,target}=pz;pz=null;lastPinch=Date.now();ph.classList.remove('live');ph.style.removeProperty('--fade');
    gr.style.transition='';
    if(p<.5){if(mode==='hour')gr.style.opacity=0;layout(0);return}
    if(mode==='in'){day=target;layout(target*2+1)}
    else if(mode==='out'){const d=day;day=null;layout(d*2+1)}
    else{openHour(target)}});
  document.addEventListener('gesturestart',e=>e.preventDefault());
  // on a phone the app is the screen: full width, no frame. on a desktop it stays a framed phone
  const fit=()=>{const s=innerWidth<=520?Math.min(innerWidth/W,innerHeight/874):Math.min(1,(innerWidth-32)/W,(innerHeight-32)/874);ph.style.transform=`scale(${s})`;root.style.height=874*s+'px'};
  day=today;addEventListener('resize',fit);fit();layout(0);
  // פתיחה (under type): ühr breathes from thin to black; orange guides follow each letter's edges
  const O=V('--thicken')+1200,spl=el('splash',ph);spl.innerHTML='<div class="sw"><span class="u">u<i></i><i></i></span><span>h</span><span>r</span></div>';
  const sw=spl.firstChild,ls=[...sw.children],gv=ls.flatMap(()=>[el('gv',spl),el('gv',spl)]),gh=[el('gh',spl),el('gh',spl)];
  let BL=0,XH=0;const FS=V('--t-splash');
  const track=()=>{ls.forEach((s,i)=>{gv[2*i].style.left=s.offsetLeft+'px';gv[2*i+1].style.left=s.offsetLeft+s.offsetWidth+'px'});
    const top=sw.offsetTop;umlaut(ls[0]);
    gh[0].style.top=top+BL+'px';gh[1].style.top=top+BL-XH+'px'};
  track();
  (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{const c=document.createElement('canvas').getContext('2d');
    c.font=`100 ${FS}px ${getComputedStyle(sw).fontFamily}`;const m=c.measureText('x');
    BL=(FS-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent;XH=m.actualBoundingBoxAscent;track();spl.classList.add('ready');
    const t0=performance.now(),D=V('--thicken'),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const step=n=>{const t=Math.min(1,(n-t0)/D);sw.style.fontWeight=Math.round(100+800*ease(t));track();if(t<1)requestAnimationFrame(step)};
    requestAnimationFrame(step)});
  setTimeout(()=>spl.classList.add('out'),O);setTimeout(()=>spl.remove(),O+500);
  setTimeout(()=>{
  // splash: now, big in the middle → falls into its own square (a square is an hour)
  // the opening uses the ringing poster's type: helvetica bold, tabular, hour over minutes, flush left on --margin,
  // filling the width; then it shrinks into the field of this hour
  const H0=now.getHours(),M0=now.getMinutes(),sp=el('sp',ph);
  sp.innerHTML=nowSVG(p2(H0),p2(M0));
  place(sp,H0>>2,H0%4,H0%4);
  const NF=nowFit(),L0=parseFloat(sp.style.left),T0=parseFloat(sp.style.top),S=(W-2*M)/NF.w;
  sp.style.transform=`translate(${M-L0-S*NF.P}px,${365-NF.h*S/2-T0-S*NF.P}px) scale(${S})`;
  // מחליטה: ühr on one line → two lines → full grid
  const K=[H[4],vl[3]],all=[...H,...vl].filter(l=>!K.includes(l));
  ph.classList.add('mess');[...H,...vl].forEach(l=>{l.style.transitionDelay='0ms';l.style.transform=l.classList.contains('h')?'scaleX(0)':'scaleY(0)'});
  const draw=(l,d)=>{l.style.transitionDelay=d+'ms';l.style.transform=''};
  setTimeout(()=>K.forEach((l,i)=>draw(l,i*STEP*4)),400);
  setTimeout(()=>all.forEach((l,i)=>draw(l,i*STEP)),400+MV+300);
  const end=400+MV+300+all.length*STEP+MV;
  const FLY=MV*1.4;
  setTimeout(()=>{sp.classList.add('fly');sp.style.transform=''},end);
  setTimeout(()=>{ph.classList.remove('mess');sp.style.opacity=0;setTimeout(()=>sp.remove(),500)},end+FLY);

  },O-200);
  // זוכרת: the alarm rings — the time opens into stripes (one per weight); stop: temporary goes, fixed stays
  const rg=el('ring',ph);['pointerdown','click','touchstart'].forEach(t=>rg.addEventListener(t,e=>e.stopPropagation()));
  // as on under.bicycle.computer: nine layers, black at the back to thin at the front; every layer swells to 900
  // and opens back to its own weight, one after another (css, so it is smooth). one cycle = two rings.
  const NW=9,WS=Array.from({length:NW},(_,i)=>900-i*100),PAL=['var(--ink)','var(--orange)','var(--paper)','var(--orange)','var(--ink)','var(--orange)','var(--paper)','var(--orange)','var(--ink)'];
  let actx=null,rt=null;
  // radar-like: four bright pulses, then a pause (synthesised, not apple's file)
  const beep=()=>{try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const t0=actx.currentTime;
    [0,.11,.22,.33].forEach(t=>[[1568,.09],[3136,.025]].forEach(([f,v])=>{const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0,t0+t);g.gain.linearRampToValueAtTime(v,t0+t+.005);g.gain.exponentialRampToValueAtTime(.0001,t0+t+.1);
      o.connect(g).connect(actx.destination);o.start(t0+t);o.stop(t0+t+.11)}))}catch(e){}};
  // צליל: three rings. the shape never changes (the digit breaking into the grid's lines); only the rhythm does, and the sound sets it
  const tone=(at,f,v,dur,type,f2)=>{const o=actx.createOscillator(),gn=actx.createGain();o.type=type;o.frequency.value=f;gn.gain.setValueAtTime(0,at);
    gn.gain.linearRampToValueAtTime(v,at+.005);gn.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(gn).connect(actx.destination);o.start(at);o.stop(at+dur+.02);if(f2)tone(at,f2,v*.28,dur*.8,type)};
  const SND={radar:{cy:V('--breath'),play:t0=>[0,.11,.22,.33].forEach(t=>tone(t0+t,1568,.09,.1,'sine',3136))},
    chime:{cy:2000,play:t0=>tone(t0,880,.14,1.8,'sine',1760)},
    pulse:{cy:1200,play:t0=>[0,.2].forEach(t=>tone(t0+t,330,.18,.14,'triangle'))}};
  const sound=s=>{try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();actx.resume();SND[SND[s]?s:'radar'].play(actx.currentTime)}catch(e){}};
  let snT=null;const SNOOZE=9000; // prototype: 9 s stands in for 9 min
  // helvetica, tabular: every digit has the same width, so the minutes sit exactly under the hour.
  // the stripes are the grid's own hairlines: the line thins from solid to 1px and back, digit after digit
  // the grid rings: its own lines, thickening on every pulse and a little more each time
  const RGRID=[W*.27,W*.63].map(x=>`<i class="gv" style="left:${x}px"></i>`).join('')+[874*.36,874*.52].map(y=>`<i class="gh" style="top:${y}px"></i>`).join('');
  const cellR=(ch,i)=>`<div class="c"><span class="w" style="--i:${i}">${ch}</span></div>`;
  // the alarm's own square grows to fill the screen (same motion as zooming into an hour), and shrinks back on stop / snooze
  const rectOf=a=>day===a.d&&hour===null?[dayX[2*(a.h%4)],rowY(a.h>>2),F,R]:day===null?[weekX(a.d)+2,rowY(a.h>>2)+(a.h%4)*R/4,cw-4,R/4]:[W/2-F/2,874/2-R/2,F,R];
  const clip=([x,y,w,h])=>`inset(${y}px ${W-x-w}px ${874-y-h}px ${x}px)`;
  let ringing=null;
  function closeRing(after){const a=ringing;clearInterval(rt);rg.classList.remove('open');rg.style.clipPath=clip(rectOf(a));
    setTimeout(()=>{rg.classList.remove('on');ringing=null;after&&after()},MV)}
  function ringAlarm(a){ringing=a;rg.style.transition='none';rg.style.clipPath=clip(rectOf(a));rg.className='ring on '+a.t+' s-'+(SND[a.s]?a.s:'radar');
    rg.innerHTML=`<div class="rgrid">${RGRID}</div><div class="rbig"><b>${p2(a.h)}</b><b>${p2(a.m)}</b></div><div class="rh">ringing</div><div class="mid"><div class="rt"><div class="rw">${[...p2(a.h)].map((c,i)=>cellR(c,i)).join('')}</div><div class="rw">${[...p2(a.m)].map((c,i)=>cellR(c,i+2)).join('')}</div></div><div class="rl">${a.l}<small>${a.t==='temp'?'temporary · goes after stop':'fixed · stays'}</small></div></div><div class="snooze">snooze · 9 min</div><div class="stop">slide up to stop</div>`;
    rg.querySelector('.snooze').addEventListener('click',()=>{clearTimeout(snT);closeRing(()=>snT=setTimeout(()=>ringAlarm(a),SNOOZE))});
    rg.querySelector('.stop').addEventListener('click',()=>{clearTimeout(snT);closeRing(()=>{if(a.t==='temp')alarms=alarms.filter(x=>x!==a);render()})});
    // the core is driven frame by frame (like the splash), not by a css keyframe: smooth in every browser
    const cores=[...rg.querySelectorAll('.c span.core')],dots=[...rg.querySelectorAll('.dots.core b')],t0=performance.now()+MV,CY=SND[SND[a.s]?a.s:'radar'].cy,B=[0,110,220,330];let last=-1;
    const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    // one ring = one breath: each of the four pulses opens the stripes a step further, the pause closes them
    const tick=n=>{if(ringing!==a)return;const e=n-t0;if(e<0){requestAnimationFrame(tick);return}
      const cyc=Math.floor(e/CY),ms=e%CY;if(cyc!==last){last=cyc;sound(a.s)}
      const k=ms<450?B.reduce((s,b)=>s+io(Math.min(1,Math.max(0,(ms-b)/90))),0)/4:1-io(Math.min(1,(ms-450)/500));
      rg.style.setProperty('--gw',(1+9*Math.min(1,e/14000)+1.5*k).toFixed(2)+'px');rg.style.setProperty('--pulse',(1+.035*k).toFixed(4));
      requestAnimationFrame(tick)};requestAnimationFrame(tick);
    void rg.offsetWidth;rg.style.transition='';requestAnimationFrame(()=>{rg.style.clipPath='inset(0px 0px 0px 0px)';rg.classList.add('open')});
    try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}}
  const ringNext=()=>{const nk=now.getHours()*60+now.getMinutes(),key=a=>{const k=(a.d-today+7)%7*1440+a.h*60+a.m;return k<=nk?k+10080:k};
    ringAlarm([...alarms].sort((a,b)=>key(a)-key(b))[0]||{d:today,h:now.getHours(),m:now.getMinutes(),t:'temp',l:'alarm'})};
  // זוכרת בזמן: every second, an alarm whose minute has come rings by itself (once per minute)
  const fired=new Set();
  ['pointerdown','keydown','touchstart'].forEach(t=>addEventListener(t,()=>{try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}},{once:true,passive:true}));
  setInterval(()=>{if(ringing||!ph.isConnected)return;const n=new Date(),key=n.toDateString()+' '+n.getHours()+':'+n.getMinutes();
    const due=alarms.find(x=>x.d===n.getDay()&&x.h===n.getHours()&&x.m===n.getMinutes());if(due&&!fired.has(key)){fired.add(key);ringAlarm(due)}},1000);
  let lastMin=new Date().getMinutes();setInterval(()=>{const m=new Date().getMinutes();if(m===lastMin)return;lastMin=m;if(hour===null&&!ringing&&ph.isConnected)render()},1000);
  // the grid names its hours only when asked: under the finger (or the mouse), then it goes quiet again
  const quiet=()=>{wh.classList.remove('show');hrs.forEach(n=>n.classList.remove('on'))};
  const peek=e=>{if(hour!==null||ringing||ph.classList.contains('mess'))return quiet();const[x,y]=at(e);
    if(day!==null){const h=field(x,y);hrs.forEach((n,i)=>n.classList.toggle('on',i===h));return}
    const d=Math.floor((x-M)/cw),r=[0,1,2,3,4,5].find(r=>y>=rowY(r)&&y<rowY(r)+R);if(d<0||d>6||r===undefined)return quiet();
    const h=r*4+Math.floor((y-rowY(r))/(R/4));wh.textContent=p2(h);wh.style.left=weekX(d)+3+'px';wh.style.top=rowY(r)+(h%4)*R/4+2+'px';wh.classList.add('show')};
  ph.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)peek(e)});ph.addEventListener('pointerdown',peek);
  ph.addEventListener('pointerleave',quiet);addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')setTimeout(quiet,500)});
  [bc,bs,bd].forEach(b=>['pointerdown','click'].forEach(t=>b.addEventListener(t,e=>e.stopPropagation())));
  bs.addEventListener('click',()=>{if(hour!==null)closeHour(true)});
  bc.addEventListener('click',()=>{if(hour===null)return;draft.days=[];closeHour(false)}); // delete: a new one is discarded, an existing one removed
  bd.addEventListener('click',()=>{if(hour===null)return;draft.days=[];closeHour(false)});
  // slide the ring up to stop it
  let sy=null;rg.addEventListener('pointerdown',e=>{sy=e.clientY;rg.style.transition='none';if(!e.target.closest('.stop,.snooze'))e.preventDefault()});
  rg.addEventListener('pointermove',e=>{if(sy==null||!ringing)return;rg.style.setProperty('--lift',-Math.max(0,sy-e.clientY)*.6+'px')});
  addEventListener('pointerup',e=>{if(sy==null)return;const d=sy-e.clientY;sy=null;rg.style.transition='';rg.style.setProperty('--lift','0px');if(d>ph.getBoundingClientRect().height*.2){const s=rg.querySelector('.stop');s&&s.click()}});
  root.uhr={ring:ringNext};
  const rb=document.getElementById('ringbtn');if(rb)rb.addEventListener('click',e=>{e.preventDefault();ringNext()});
}
