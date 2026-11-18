const {chromium}=require('playwright');const L=require('./list.json');(async()=>{const b=await chromium.launch();
for(const f of L){const p=await b.newPage();await p.goto('file://'+__dirname+'/'+f+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 await p.pdf({path:f+'.pdf',width:'500mm',height:'700mm',printBackground:true});
 const q=await b.newPage({viewport:{width:1000,height:1400},deviceScaleFactor:1});await q.goto('file://'+__dirname+'/'+f+'.html');await q.evaluate(()=>document.fonts.ready);await q.emulateMedia({media:'print'});
 await q.addStyleTag({content:'body{zoom:'+(1000/(500*96/25.4))+'}'});await q.waitForTimeout(300);await q.screenshot({path:f+'.png'});}
await b.close()})()
