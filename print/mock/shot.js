const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [f,w,h,s] of [['notes',1600,1100,1],['shirt',1600,1100,1]]){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});await p.goto('file://'+__dirname+'/'+f+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);await p.screenshot({path:'uhr-mockup-'+f+'.png'})}
// a close-up of the embroidery
const p=await b.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:4});await p.goto('file://'+__dirname+'/shirt.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:'uhr-mockup-shirt-detail.png',clip:{x:440,y:280,width:150,height:110}});
await b.close()})()
