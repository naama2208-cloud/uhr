# three 50×70 cm posters, in the share poster's language (frame 07), on the app's grid. vector PDF + PNG previews.
import subprocess,json
W,H=500,700                                   # mm
M=25.4;G=11.1;F=(W-2*M-3*G)/4;P=F+G;T0=(H-(5*F+4*G))/2     # the grid: four columns of squares, five rows
X=lambda c:M+c*P; Y=lambda r:T0+r*P
C={'paper':'#E6E4DB','ink':'#20201E','red':'#D50023','blue':'#0052B5','yellow':'#EEA700'}
posters=[
 dict(file='uhr-poster-blue',sq='blue',at=(2,1),name='Training',ncol='red',h='17',m='00',often='',facts=['monday','once','sound: glass']),
 dict(file='uhr-poster-red',sq='red',at=(3,2),name='Submission',ncol='blue',h='14',m='00',often='',facts=['today','now','sound: rise']),
 dict(file='uhr-poster-yellow',sq='yellow',at=(1,0),name='Lunch with Noa',ncol='ink',h='12',m='30',often='',facts=['wednesday','shared with you','sound: glass']),
]
def page(p):
    lines=''.join(f'<i class="v" style="left:{x}mm"></i>' for c in range(4) for x in (X(c),X(c)+F))
    lines+=''.join(f'<i class="h" style="top:{y}mm"></i>' for r in range(5) for y in (Y(r),Y(r)+F))
    longest=max(len(w) for w in p['name'].split())
    NS=min(60.1*W/463.2,(3*F+G)/(0.58*longest))      # frame 07's size; a long word shrinks to stay clear of the time column; long names break into lines
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:S;src:url(sans-400.ttf);font-weight:400}}@font-face{{font-family:S;src:url(sans-700.ttf);font-weight:700}}
@font-face{{font-family:U;src:url(under.woff2);font-weight:100 900}}
@page{{size:{W}mm {H}mm;margin:0}}*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}mm;height:{H}mm;background:{C['paper']};color:{C['ink']};font-family:S;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.p{{position:relative;width:{W}mm;height:{H}mm;overflow:hidden}}
i{{position:absolute;background:{C['red']};opacity:.75}}.v{{top:0;bottom:0;width:.35mm;margin-left:-.175mm}}.h{{left:0;right:0;height:.35mm;margin-top:-.175mm}}
.a{{position:absolute}}
.logo{{font-family:U;font-weight:700;letter-spacing:-.045em;line-height:1}}
.dot{{position:absolute;border-radius:50%;background:{C['red']}}}
.cd{{display:inline-block;position:relative;width:.32em;height:.7em}}.cd b{{position:absolute;left:50%;width:.13em;height:.13em;margin-left:-.065em;border-radius:50%;background:{C['red']}}}
</style></head><body><div class="p">{lines}
<div class="a logo" style="left:{X(0)}mm;top:{Y(0)+1}mm;font-size:{35*W/463.2}mm">uhr</div>
<span class="dot" style="left:{X(0)+0.118*35*W/463.2}mm;top:{Y(0)+1-0.0*35}mm;width:{0.145*35*W/463.2}mm;height:{0.145*35*W/463.2}mm"></span>
<span class="dot" style="left:{X(0)+0.342*35*W/463.2}mm;top:{Y(0)+1}mm;width:{0.145*35*W/463.2}mm;height:{0.145*35*W/463.2}mm"></span>
<div class="a" style="left:{X(p['at'][0])}mm;top:{Y(p['at'][1])}mm;width:{F}mm;height:{F}mm;background:{C[p['sq']]}"></div>
<div class="a" style="left:{X(0)}mm;top:{Y(1)+F}mm;height:{Y(3)+F-(Y(1)+F)}mm;width:{3*F+G}mm;display:flex;flex-direction:column;justify-content:flex-end"><div style="font-weight:700;font-size:{NS}mm;letter-spacing:-.035em;line-height:.95;color:{C[p['ncol']]}">{p['name']}</div></div>
<div class="a" style="left:{X(3)}mm;top:{Y(3)}mm;font-weight:700;font-size:{29*W/463.2}mm;letter-spacing:-.03em;line-height:1;white-space:nowrap">{p['h']}<span class="cd"><b style="top:.2em"></b><b style="top:.5em"></b></span>{p['m']}</div>
<div class="a" style="left:{X(3)}mm;top:{Y(3)+29*W/463.2*1.35}mm;font-size:{9.2*W/463.2}mm;line-height:1.5">{'<br>'.join(p['facts'])}</div>
<div class="a" style="left:{X(0)}mm;top:{Y(4)+F-30}mm;font-weight:700;font-size:{14*W/463.2}mm;letter-spacing:-.02em;line-height:1.15">your hour, on a grid.<br><span style="font-weight:400">naama2208-cloud.github.io/uhr</span></div>
<img class="a" src="qr.svg" style="left:{X(3)}mm;top:{Y(4)}mm;width:{F}mm;height:{F}mm">
</div></body></html>'''
for p in posters:open(p['file']+'.html','w').write(page(p))
json.dump([p['file'] for p in posters],open('list.json','w'))
