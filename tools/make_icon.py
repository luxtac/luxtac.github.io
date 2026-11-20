import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import colorsys
S=1024
def hue_grad(h0,h1,n):
    return [tuple(int(255*c) for c in colorsys.hsv_to_rgb((h0+(h1-h0)*t)%1,1,1)) for t in np.linspace(0,1,n)]
def lines_layer(width):
    L=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(L)
    a,b=int(S*0.18),int(S*0.82)          # line extent
    p1,p2=int(S*0.385),int(S*0.615)       # grid positions
    # each line: rainbow gradient along its length, distinct hue ranges
    segs=[('v',p1,0.00,0.18),('v',p2,0.50,0.68),('h',p1,0.25,0.43),('h',p2,0.75,0.93)]
    for o,p,h0,h1 in segs:
        cols=hue_grad(h0,h1,200)
        for i,c in enumerate(cols):
            t0=a+(b-a)*i/200; t1=a+(b-a)*(i+1)/200+1
            box=[p-width/2,t0,p+width/2,t1] if o=='v' else [t0,p-width/2,t1,p+width/2]
            d.rectangle(box,fill=c+(255,))
    # round the ends
    for o,p,h0,h1 in segs:
        cs=hue_grad(h0,h1,2)
        for t,c in ((a,cs[0]),(b,cs[1])):
            x,y=(p,t) if o=='v' else (t,p)
            d.ellipse([x-width/2,y-width/2,x+width/2,y+width/2],fill=c+(255,))
    return L
def make(width, glow):
    bg=Image.new('RGBA',(S,S),(0,0,0,0))
    m=Image.new('L',(S,S),0); ImageDraw.Draw(m).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.22),fill=255)
    base=Image.new('RGBA',(S,S),(10,12,24,255)); bg.paste(base,(0,0),m)
    core=lines_layer(width)
    out=bg.copy()
    for r,k in glow:
        g=lines_layer(width*1.0).filter(ImageFilter.GaussianBlur(r))
        a=np.array(g).astype(float); a[...,3]*=k; g=Image.fromarray(a.clip(0,255).astype('uint8'))
        out=Image.alpha_composite(out,g)
    out=Image.alpha_composite(out,core)
    # white-hot centre of each tube
    hot=lines_layer(width*0.35); a=np.array(hot).astype(float); a[...,:3]=a[...,:3]*0.35+255*0.65; a[...,3]*=0.85
    out=Image.alpha_composite(out,Image.fromarray(a.clip(0,255).astype('uint8')))
    # clip glow to rounded square
    o=np.array(out); o[...,3]=np.minimum(o[...,3],np.array(m)); return Image.fromarray(o)
big=make(S*0.075,[(70,1.6),(30,1.4),(12,1.0)])
big.save('icon_1024.png')
small=make(S*0.11,[(40,1.3),(14,1.0)])   # thicker lines for tiny sizes
for n,src in [(512,big),(180,big),(128,big),(64,small),(48,small),(32,small),(16,small)]:
    src.resize((n,n),Image.LANCZOS).save(f'icon_{n}.png')
# preview sheet
sheet=Image.new('RGBA',(900,300),(255,255,255,255)); x=20
for n in (256,128,64,32,16):
    im=(big if n>=128 else small).resize((n,n),Image.LANCZOS); sheet.alpha_composite(im,(x,20)); x+=n+20
dark=Image.new('RGBA',(900,140),(40,40,46,255)); x=20
for n in (64,32,16):
    im=small.resize((n,n),Image.LANCZOS); dark.alpha_composite(im,(x,20)); x+=n+20
sheet.alpha_composite(dark,(0,300-140)) if False else None
full=Image.new('RGBA',(900,440),(255,255,255,255)); full.alpha_composite(sheet,(0,0)); full.alpha_composite(dark,(0,300))
full.save('preview.png')
