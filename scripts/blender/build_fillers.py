"""Original meadow accents, authored in website coordinates. Run build(builder)."""
import math
import random
import importlib.util
from mathutils import Vector

def build(m):
    rng=random.Random(2010)
    white=m.material('RW_Filler_Ivory',color='#fff5dd',roughness=.74,sheen=.15)
    gold=m.material('RW_Filler_Pollen',color='#dfae32',roughness=.87)
    green=m.material('RW_Filler_Sage',color='#63845d',roughness=.72,
                     normal=next(i for i in m.bpy.data.images if i.name.startswith('RW_Leaf_Veins')))
    buffers={k:[[],[],[]] for k in ('petals','pollen','leaves')}
    parts=[]
    spec=importlib.util.spec_from_file_location('rw_canopy',str(m.ROOT/'scripts/blender/canopy.py'))
    canopy=importlib.util.module_from_spec(spec);spec.loader.exec_module(canopy)
    hulls=canopy.rose_hulls(m)
    gaps=[];placed=[]
    for ix in range(53):
        for iz in range(53):
            x=(ix/52*2-1)*.98;z=(iz/52*2-1)*.90
            if x*x+(z/.92)**2>.98**2:continue
            free=canopy.clearance(x,z,hulls)
            if free>.018:gaps.append((x,z,free))
    def gap_head(p,r):
        choices=[q for q in gaps if q[2]>=r+.008]
        if not choices:return None
        def score(q):
            crowd=sum(max(0,r+oldr+.009-math.hypot(q[0]-x,q[1]-z))**2*30 for x,z,oldr in placed)
            return (q[0]-p.x)**2+(q[1]-p.z)**2+crowd
        x,z,_=min(choices,key=score)
        placed.append((x,z,r))
        # A raised head in a real gap, never above a rose's projected silhouette.
        return Vector((x,1.43-.17*math.hypot(x,z)+rng.uniform(-.035,.035),z))
    def surface(kind,grid,nu,nv):
        verts,faces,uv=buffers[kind];start=len(verts)
        verts.extend(grid)
        uv.extend((i/nu,j/nv) for j in range(nv+1) for i in range(nu+1))
        for j in range(nv):
            for i in range(nu):
                a=start+j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
    def sphere(kind,p,r):
        surface(kind,[tuple(p+Vector((math.sin(j/6*math.pi)*math.cos(i/10*math.tau)*r,
                 math.cos(j/6*math.pi)*r,math.sin(j/6*math.pi)*math.sin(i/10*math.tau)*r)))
                 for j in range(7) for i in range(11)],10,6)
    def stem(name,points,r=.002):
        o=m.curve_tube('Filler_'+name,points,r,green)
        o.data.resolution_u=5;o.data.bevel_resolution=1;parts.append(o)
    def flower(p,r,normal,daisy):
        n=Vector(normal).normalized();u=n.cross(Vector((0,0,1))).normalized();v=n.cross(u)
        count=rng.randint(11,14) if daisy else 5
        phase=rng.random()*math.tau
        for k in range(count):
            a=k/count*math.tau+phase;out=u*math.cos(a)+v*math.sin(a);side=n.cross(out)
            grid=[]
            for j in range(8):
                t=.01+.98*j/7
                for i in range(5):
                    s=i/4*2-1
                    width=r*(.16 if daisy else .34)*math.sin(t*math.pi)**.65
                    pos=p+out*r*(.23+.77*t)+side*s*width+n*r*(.10*math.sin(t*math.pi)-.14*t*t+s*s*.07)
                    grid.append(tuple(pos))
            surface('petals',grid,4,7)
        sphere('pollen' if daisy else 'petals',p+n*r*.06,r*(.24 if daisy else .18))
        if daisy:
            for k in range(12):
                a=k/12*math.tau
                sphere('pollen',p+(u*math.cos(a)+v*math.sin(a))*r*.16+n*r*.24,r*.045)
    # Staggered sprays: lower fillers plus taller accents between the rose rings.
    for k in range(16):
        a=k/16*math.tau+.15
        tier=k%3
        r=rng.uniform(.43,.58) if tier==0 else rng.uniform(.57,.73)
        height=rng.uniform(1.47,1.61) if tier==0 else rng.uniform(1.28,1.43) if tier==1 else rng.uniform(.99,1.16)
        base=Vector((math.sin(a)*.24,.48,math.cos(a)*.24))
        tip=Vector((math.sin(a)*r,height,math.cos(a)*r))
        safe_tip=gap_head(tip,.018)
        if safe_tip is None:continue
        tip=safe_tip
        stem(f'Spray_{k}',[tuple(base),(tip.x,tip.y-.20,tip.z),tuple(tip)],.0028)
        for j in range(6):
            a2=a+rng.uniform(-.42,.42);rr=r+rng.uniform(-.13,.06)
            p=Vector((math.sin(a2)*rr,tip.y+rng.uniform(-.10,.10),math.cos(a2)*rr))
            daisy=j<2
            head_radius=rng.uniform(.045,.060) if daisy else rng.uniform(.012,.019)
            p=gap_head(p,head_radius)
            if p is None:continue
            joint=base.lerp(tip,.58)
            stem(f'Twig_{k}_{j}',[tuple(joint),(p.x,p.y-.16,p.z),tuple(p)],.0013)
            flower(p,head_radius,
                   (math.sin(a2)*.65,1,math.cos(a2)*.65),daisy)
    for k in range(5):
        p=Vector(((k-2)*.145,.97+.035*math.sin(k*1.7),.66+.025*math.cos(k)))
        head_radius=rng.uniform(.055,.065);p=gap_head(p,head_radius)
        if p is None:continue
        stem(f'Front_Daisy_{k}',[(p.x*.4,.53,.30),(p.x,p.y-.16,p.z),tuple(p)],.0022)
        flower(p,head_radius,(p.x*.3,.45,1),True)
    # Narrow, gently curved paired leaflets, like the fine greenery in the reference.
    for k in range(14):
        a=k/14*math.tau+.33
        base=Vector((math.sin(a)*.36,.55,math.cos(a)*.36))
        radius=.70 if k%2==0 else .83
        tip=Vector((math.sin(a)*radius,rng.uniform(1.25,1.40) if k%2==0 else rng.uniform(1.06,1.22),math.cos(a)*radius))
        if k%2==0:
            safe=gap_head(tip,.075)
            if safe is not None:tip=safe-Vector((0,.06,0))
        stem(f'Fern_{k}',[tuple(base),tuple(base.lerp(tip,.55)),tuple(tip)],.002)
        axis=(tip-base).normalized();side=Vector((math.cos(a),0,-math.sin(a)))
        for j in range(9):
            t=.24+j*.077;center=base.lerp(tip,t)
            for sign in (-1,1):
                direction=(side*sign*.85+axis*.5).normalized();cross=direction.cross(Vector((0,1,0))).normalized()
                length=.09*(1-.45*t)*rng.uniform(.85,1.15);grid=[]
                for row in range(9):
                    q=row/8
                    for col in range(5):
                        s=col/4*2-1
                        p=center+direction*length*q+cross*s*.012*math.sin(q*math.pi)**.75
                        p.y+=.014*math.sin(q*math.pi)+.003*(1-s*s)
                        grid.append(tuple(p))
                surface('leaves',grid,4,8)
    for key,mat in [('petals',white),('pollen',gold),('leaves',green)]:
        o=m.make_mesh('Filler_'+key,*buffers[key],mat)
        if key!='pollen':m.solid(o,.0004)
        parts.append(o)
    root=m.bpy.data.objects.new('Decorative meadow fillers',None)
    m.C['atelier'].collection.objects.link(root);root.parent=m.C['root']
    root['interactive']=False
    for template in parts:
        template['decorative']=True
        o=template.copy();m.C['atelier'].collection.objects.link(o);o.parent=root
    m.export_group(parts,m.RAW/'fillers.glb')
    m.bpy.context.window.scene=m.C['atelier']
    root['rose_projected_coverage']=canopy.coverage(hulls)
    root['head_clearance_validated']=True
    root['placed_heads_and_sprays']=len(placed)
    print('FILLERS_READY: gap-constrained heads; rose coverage',round(canopy.coverage(hulls)*100,1),'percent; decorative only')
