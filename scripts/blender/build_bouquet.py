"""Rose Wishes bouquet atelier. Run functions in Blender 4.5 via MCP.

Coordinates are authored in the website's Y-up frame and converted to Blender
Z-up by W(). glTF export converts them back, preserving the existing hand anchors.
The user's scene is preserved; all new work lives in separate named scenes.
"""
import bpy
import math
import random
import json
from pathlib import Path
from mathutils import Vector, Quaternion
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art' / 'bouquet'
RAW = ROOT / '.qa' / 'bouquet' / 'raw'
TEX = ART / 'textures'
for folder in (ART, RAW, TEX):
    folder.mkdir(parents=True, exist_ok=True)

C = {}
COLORS = ['#a92846','#efa6b8','#f4e7d7','#71152f','#edb1c2','#9e2441','#ed9b8c','#f4e7d7','#ce557e','#b32449']

def W(p):
    return (float(p[0]), -float(p[2]), float(p[1]))

def linear(hex_color):
    rgb = [int(hex_color[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb)

def image(name, pixels, colorspace='sRGB'):
    h,w,_ = pixels.shape
    img = bpy.data.images.new(name, width=w, height=h, alpha=True)
    img.colorspace_settings.name = colorspace
    img.pixels.foreach_set(np.asarray(pixels,dtype=np.float32).reshape(-1))
    img.filepath_raw = str(TEX / (name+'.png'))
    img.file_format = 'PNG'
    img.save()
    img.pack()
    return img

def rgba(rgb):
    out=np.ones((*rgb.shape[:2],4),dtype=np.float32)
    out[:,:,:3]=rgb
    return out

def normal_image(name, height, strength):
    dy,dx=np.gradient(height.astype(np.float32))
    n=np.stack((-dx*strength,-dy*strength,np.ones_like(dx)),axis=-1)
    n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return image(name,rgba(n*.5+.5),'Non-Color')

def textures():
    rng=np.random.default_rng(20102026)
    n=2048
    u,v=np.meshgrid(np.linspace(0,1,n,dtype=np.float32),np.linspace(0,1,n,dtype=np.float32))
    grain=rng.normal(0,1,(n,n)).astype(np.float32)
    veins=np.sin(u*math.pi*74+np.sin(v*8)*.6)*.5+.5
    veins=np.power(veins,16)*(.2+.8*v)
    soft=np.sin(u*11+v*6)*np.sin(v*15-u*5)
    # Gradual darkening at the attached base, delicate veins and velvety granules.
    albedo=np.clip(.66+.24*np.sqrt(v)+soft*.016+grain*.006-veins*.012,0,1)
    C['petal_color']=image('RW_Petal_Luminance_2K',rgba(np.repeat(albedo[:,:,None],3,axis=2)))
    C['petal_normal']=normal_image('RW_Petal_Veins_2K',grain*.012+veins*.22+soft*.03,1.5)
    rough=np.clip(.50+grain*.025+soft*.025+veins*.025,0,1)
    C['petal_rough']=image('RW_Petal_Roughness_2K',rgba(np.repeat(rough[:,:,None],3,axis=2)),'Non-Color')
    n=1024
    u,v=np.meshgrid(np.linspace(-1,1,n,dtype=np.float32),np.linspace(0,1,n,dtype=np.float32))
    grain=rng.normal(0,1,(n,n)).astype(np.float32)
    mid=np.exp(-np.square(u/.023))
    branches=np.power(.5+.5*np.cos((v-np.abs(u)*.38)*math.pi*22),24)*np.exp(-np.abs(u)*.5)
    veining=np.clip(mid+branches*.45,0,1)
    value=.80+grain*.025+np.sin(v*18+u*5)*.04
    leaf=np.stack((value*.25+veining*.10,value*.40+veining*.11,value*.20+veining*.06),axis=-1)
    C['leaf_color']=image('RW_Leaf_Botanical_1K',rgba(np.clip(leaf,0,1)))
    C['leaf_normal']=normal_image('RW_Leaf_Veins_1K',veining*.38+grain*.015,2.2)
    C['leaf_rough']=image('RW_Leaf_Roughness_1K',rgba(np.repeat(np.clip(.39+grain*.02-veining*.05,0,1)[:,:,None],3,axis=2)),'Non-Color')
    paper=grain*.06+np.sin(u*480+np.sin(v*140))*.025
    C['paper_normal']=normal_image('RW_Paper_Fibers_1K',paper,1.25)
    satin=np.sin(u*math.pi*690)*.11+np.sin(v*math.pi*220)*.025+grain*.012
    C['satin_normal']=normal_image('RW_Satin_Weave_1K',satin,1.1)
    print('TEXTURES_READY',len([k for k in C if 'color' in k or 'normal' in k or 'rough' in k]))

def material(name, color='#ffffff',roughness=.5, texture=None, normal=None, rough=None, sheen=.0, coat=.0, subsurface=.0, anisotropy=.0):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    tint=(*linear(color),1)
    mat.diffuse_color=tint;bsdf.inputs['Base Color'].default_value=tint
    bsdf.inputs['Roughness'].default_value=roughness
    bsdf.inputs['IOR'].default_value=1.40
    bsdf.inputs['Sheen Weight'].default_value=sheen
    bsdf.inputs['Sheen Roughness'].default_value=.65
    bsdf.inputs['Coat Weight'].default_value=coat
    bsdf.inputs['Coat Roughness'].default_value=.38
    bsdf.inputs['Subsurface Weight'].default_value=subsurface
    bsdf.inputs['Subsurface Radius'].default_value=(1,.45,.3)
    bsdf.inputs['Subsurface Scale'].default_value=.008
    bsdf.inputs['Anisotropic'].default_value=anisotropy
    if texture:
        tex=nodes.new('ShaderNodeTexImage');tex.image=texture
        mult=nodes.new('ShaderNodeMixRGB');mult.blend_type='MULTIPLY';mult.inputs[0].default_value=1
        mult.inputs[2].default_value=tint
        links.new(tex.outputs['Color'],mult.inputs[1]);links.new(mult.outputs['Color'],bsdf.inputs['Base Color'])
    if normal:
        tex=nodes.new('ShaderNodeTexImage');tex.image=normal
        node=nodes.new('ShaderNodeNormalMap');node.inputs['Strength'].default_value=.35
        links.new(tex.outputs['Color'],node.inputs['Color']);links.new(node.outputs['Normal'],bsdf.inputs['Normal'])
    if rough:
        tex=nodes.new('ShaderNodeTexImage');tex.image=rough
        sep=nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],sep.inputs[0]);links.new(sep.outputs['Green'],bsdf.inputs['Roughness'])
    return mat

def materials():
    C['petal']=material('RW_Petal_Neutral',texture=C['petal_color'],normal=C['petal_normal'],rough=C['petal_rough'],sheen=.22,subsurface=.07)
    C['leaf']=material('RW_Leaf_Cuticle',texture=C['leaf_color'],normal=C['leaf_normal'],rough=C['leaf_rough'],coat=.12,sheen=.05)
    C['stem']=material('RW_Stem',color='#426044',roughness=.68)
    C['paper_ivory']=material('RW_Paper_Ivory',color='#edddcb',roughness=.86,normal=C['paper_normal'])
    C['paper_blush']=material('RW_Paper_Blush',color='#cfaaa8',roughness=.84,normal=C['paper_normal'])
    C['paper_tissue']=material('RW_Paper_Tissue',color='#f4e9db',roughness=.93,normal=C['paper_normal'])
    C['satin']=material('RW_Satin_DustyRose',color='#b36d82',roughness=.3,normal=C['satin_normal'],sheen=.72,anisotropy=.65)

def make_mesh(name,verts,faces,uvs,mat,scene=None):
    mesh=bpy.data.meshes.new(name+'_Mesh');mesh.from_pydata([W(v) for v in verts],[],faces);mesh.update()
    layer=mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for index in poly.loop_indices:
            layer.data[index].uv=uvs[mesh.loops[index].vertex_index]
    obj=bpy.data.objects.new(name,mesh);(scene or C['assets']).collection.objects.link(obj);obj.data.materials.append(mat)
    return obj

def solid(obj, thickness):
    modifier=obj.modifiers.new('Physical thin surface','SOLIDIFY');modifier.thickness=thickness;modifier.offset=0;modifier.use_rim=True
    # Bake a true back surface and a closed edge into both the GLB and master mesh.
    bpy.context.window.scene=C['assets']
    depsgraph=bpy.context.evaluated_depsgraph_get()
    evaluated=obj.evaluated_get(depsgraph)
    baked=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    obj.modifiers.clear();old=obj.data;obj.data=baked
    if old.users==0:bpy.data.meshes.remove(old)
    return obj

def rose(variant,quality):
    rng=random.Random(51020+variant*773)
    nu,nv=(24,26) if quality=='high' else (12,14)
    verts=[];faces=[];uv=[]
    # Dense spiral heart opening into individually cupped, reflexed outer petals.
    layers=8 if variant==2 else 10 if variant==1 else 12
    for layer in range(layers):
        q=layer/(layers-1)
        count=3+int(q*6)
        for p in range(count):
            angle=p/count*math.tau+layer*2.399+rng.uniform(-.11,.11)
            radial=(.025+q*.265)*( .74 if variant==2 else .87 if variant==1 else 1.06 if variant==4 else 1)
            radial*=rng.uniform(.94,1.06)
            width=(.038+q*.215)*rng.uniform(.88,1.12)
            height=.405-q*.025+rng.uniform(-.014,.014)
            bend=rng.uniform(.85,1.15); lean=rng.uniform(-.10,.10)
            phase=rng.uniform(0,math.tau);start=len(verts)
            for j in range(nv+1):
                v=j/nv
                for i in range(nu+1):
                    s=i/nu*2-1;t=.012+v*(.84+.148*math.sqrt(max(0,1-s*s)))
                    x=s*width*math.pow(max(.0001,math.sin(v*math.pi*.64)),.72)
                    # Smooth S-shaped profile and a crosswise bowl, rather than flat blades.
                    r=.014+q*.025+radial*math.sin(t*math.pi*.53)-s*s*(.025+q*.045)*math.sin(t*math.pi*.8)
                    z=-.145+height*(1-math.cos(t*math.pi*.5))-q*.047*t**4
                    z+=s*s*(.018+q*.040)*math.sin(t*math.pi*.85)
                    roll=max(0,(v-(.76-q*.12))/(.24+q*.12))
                    r+=roll*roll*(.008+q*.022)*bend*(1-.45*s*s)
                    z-=roll*roll*(.012+q*.030)*bend*(1-.35*s*s)
                    # Broad low-frequency waves and asymmetric folds; very fine edge ripples.
                    wave=math.sin(s*4.5+phase+t*2.2)
                    z+=wave*(.003+q*.009)*v*v+math.sin(s*13+phase)*.0005*v**5
                    x+=lean*width*math.sin(t*math.pi)+math.sin(t*3+phase)*.007*v
                    if variant==3:r*=1+.055*math.sin(angle)
                    a=angle+t*(.22+lean)+math.sin(t*math.pi)*.06
                    verts.append((x*math.cos(a)-r*math.sin(a),x*math.sin(a)+r*math.cos(a),z))
                    uv.append(((s+1)/2,v))
            for j in range(nv):
                for i in range(nu):
                    a=start+j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
    obj=make_mesh(f'Rose_{variant}_{quality}_Petals',verts,faces,uv,C['petal'])
    solid(obj,.00065)
    parts=[obj]
    verts=[];faces=[];uv=[]
    for j in range(19):
        t=.001+.998*j/18
        for i in range(25):
            a=i/24*math.tau;r=.024*math.pow(math.sin(t*math.pi),.5)*(1+.08*math.cos(a*3+t*8))
            verts.append((r*math.cos(a),r*math.sin(a),-.05+t*.305));uv.append((i/24,t))
    for j in range(18):
        for i in range(24):
            a=j*25+i;faces.append((a,a+1,a+26,a+25))
    faces.append(tuple(reversed(range(25))));faces.append(tuple(18*25+i for i in range(25)))
    parts.append(make_mesh(f'Rose_{variant}_{quality}_InnerBud',verts,faces,uv,C['petal']))
    # Sculpted tapered receptacle, completely closing the petal bases.
    verts=[];faces=[];uv=[]
    for j in range(13):
        t=j/12;r=.035+.07*math.sin(t*math.pi*.77)
        for i in range(33):
            a=i/32*math.tau;verts.append((math.cos(a)*r,math.sin(a)*r,-.25+t*.14));uv.append((i/32,t))
    for j in range(12):
        for i in range(32):
            a=j*33+i;faces.append((a,a+1,a+34,a+33))
    faces.append(tuple(reversed(range(33))));faces.append(tuple(12*33+i for i in range(33)))
    parts.append(make_mesh(f'Rose_{variant}_{quality}_Receptacle',verts,faces,uv,C['stem']))
    verts=[];faces=[];uv=[]
    for leaf in range(5):
        start=len(verts);angle=leaf/5*math.tau+.4
        for j in range(17):
            t=j/16
            for i in range(7):
                s=i/6*2-1;r=.035+t*.17;w=math.sin(t*math.pi)*.028*s
                verts.append((math.cos(angle)*r-math.sin(angle)*w,math.sin(angle)*r+math.cos(angle)*w,-.18+.055*math.sin(t*math.pi)-.018*t*t+s*s*.009))
                uv.append(((s+1)/2,t))
        for j in range(16):
            for i in range(6):
                a=start+j*7+i;faces.append((a,a+1,a+8,a+7))
    sepal=make_mesh(f'Rose_{variant}_{quality}_Sepals',verts,faces,uv,C['leaf']);solid(sepal,.0012);parts.append(sepal)
    C.setdefault('templates',{})[(variant,quality)]=parts
    print('ROSE_READY',variant,quality,sum(len(o.data.polygons) for o in parts),'faces')

def curve_tube(name,points,radius,mat,scene=None):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=16;curve.bevel_depth=radius;curve.bevel_resolution=3
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=W(co);p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);(scene or C['assets']).collection.objects.link(obj);obj.data.materials.append(mat);return obj

def leaf_mesh(name,length,width):
    verts=[];faces=[];uv=[];nu,nv=8,36
    for j in range(nv+1):
        t=.006+.988*j/nv
        for i in range(nu+1):
            s=i/nu*2-1;serration=1+.035*math.sin(t*math.pi*40)*math.pow(abs(s),6)
            x=s*width*math.pow(math.sin(t*math.pi),.8)*serration
            z=.018*math.sin(t*math.pi)+.009*math.pow(1-abs(s),4)+s*s*.008*math.sin(t*5)
            verts.append((x,t*length,z));uv.append(((s+1)/2,t))
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
    return solid(make_mesh(name,verts,faces,uv,C['leaf']),.0013)

def wrapper(name,center_angle,span,top,bottom,mat,phase):
    verts=[];faces=[];uv=[];nu,nv=96,36
    for j in range(nv+1):
        t=j/nv
        for i in range(nu+1):
            u=i/nu;a=center_angle+(u-.5)*span
            r=.13+.91*math.pow(t,.84)
            r+=.025*math.sin(a*7+phase)*t*t+.012*math.sin(t*13+a*3)*t
            y=bottom+(top-bottom)*t+.07*math.sin(a*2+phase)*t**5
            edge=(math.exp(-u*35)+math.exp(-(1-u)*35))*.035*t*t
            verts.append((math.sin(a)*(r+edge),y,math.cos(a)*(r+edge)*.92));uv.append((u,t))
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
    return solid(make_mesh(name,verts,faces,uv,mat),.004)

def bezier(a,b,c,d,t):
    return (1-t)**3*Vector(a)+3*(1-t)**2*t*Vector(b)+3*(1-t)*t*t*Vector(c)+t**3*Vector(d)

def ribbon_strip(name,control,width,twist=0,tail=False):
    verts=[];faces=[];uv=[];n=80;m=8
    for j in range(n+1):
        t=j/n;p=bezier(*control,t)
        tangent=(bezier(*control,min(1,t+.001))-bezier(*control,max(0,t-.001))).normalized()
        side=tangent.cross(Vector((0,0,1))).normalized()
        side=side*math.cos(twist*math.sin(t*math.pi))+tangent.cross(side)*math.sin(twist*math.sin(t*math.pi))
        for i in range(m+1):
            u=i/m*2-1;point=p+side*u*width*.5
            point.z+=.012*(1-u*u)*math.sin(t*math.pi)
            if tail and j==n:point.y+=.055*(1-abs(u))
            verts.append(tuple(point));uv.append((i/m,t*2))
    for j in range(n):
        for i in range(m):
            a=j*(m+1)+i;faces.append((a,a+1,a+m+2,a+m+1))
    return solid(make_mesh(name,verts,faces,uv,C['satin']),.002)

def layout():
    flowers=json.loads((ROOT/'src/data/bouquet-layout.json').read_text(encoding='utf-8'))
    return [(i,tuple(f['position']),Vector(f['direction']).normalized(),f['size']) for i,f in enumerate(flowers)]

def accessories():
    parts=[]
    for i,pos,d,size in layout():
        end=Vector(pos)-d*(.24*size)
        parts.append(curve_tube(f'Stem_{i+1:02d}',[(math.sin(i)*.045,-1.08,math.cos(i)*.045),(end.x*.3,.18,end.z*.3),tuple(end)],.013,C['stem']))
    for k in range(10):
        a=k/10*math.tau+.14
        base=Vector((math.sin(a)*.36,.3,math.cos(a)*.36));tip=Vector((math.sin(a)*.91,1.02+math.sin(k*2)*.06,math.cos(a)*.91))
        parts.append(curve_tube(f'Foliage_Branch_{k:02d}',[tuple(base),tuple((base+tip)*.5),tuple(tip)],.007,C['stem']))
        for j in range(5):
            t=.53+j*.105;p=base.lerp(tip,t);side=-1 if j%2 else 1
            leaf=leaf_mesh(f'Serrated_Leaf_{k:02d}_{j}',.24 if j<4 else .3,.068 if j<4 else .085)
            leaf.location=W(p)
            direction=Vector((math.sin(a+.65*side)*.65,.7,math.cos(a+.65*side)*.65)).normalized()
            leaf.rotation_mode='QUATERNION';leaf.rotation_quaternion=Vector((0,0,1)).rotation_difference(Vector(W(direction)))
            parts.append(leaf)
    parts.append(wrapper('Tissue_Back',math.pi,math.radians(220),1.03,-1.11,C['paper_tissue'],.8))
    parts.append(wrapper('Paper_Blush_Left',2.0,math.radians(230),.83,-1.17,C['paper_blush'],1.5))
    parts.append(wrapper('Paper_Ivory_Right',-1.5,math.radians(230),.78,-1.16,C['paper_ivory'],.4))
    parts.append(wrapper('Paper_Ivory_Front',0,math.radians(145),.64,-1.15,C['paper_ivory'],2.2))
    for side in (-1,1):
        control=[(side*.03,-.47,.49),(side*.78,-.04,.53),(side*.68,-.77,.61),(side*.025,-.48,.51)]
        parts.append(ribbon_strip(f'Satin_Loop_{side}',control,.145,twist=1.0*side))
        control=[(side*.04,-.51,.51),(side*.15,-.68,.55),(side*.36,-.91,.36),(side*.22,-1.14,.25)]
        parts.append(ribbon_strip(f'Satin_Tail_{side}',control,.13,twist=1.4*side,tail=True))
    verts=[];faces=[];uv=[]
    for j in range(9):
        y=-.51+(j/8-.5)*.11
        for i in range(97):
            a=i/96*math.tau;r=.49+.004*math.sin(a*11)
            verts.append((math.sin(a)*r,y,math.cos(a)*r*.92));uv.append((i/96,j/8))
    for j in range(8):
        for i in range(96):a=j*97+i;faces.append((a,a+1,a+98,a+97))
    parts.append(solid(make_mesh('Satin_Waist_Band',verts,faces,uv,C['satin']),.002))
    # Folded cloth knot, not a round plastic bead.
    parts.append(ribbon_strip('Satin_Folded_Knot',[(-.09,-.51,.54),(-.04,-.35,.61),(.06,-.63,.6),(.09,-.47,.54)],.125,twist=.35))
    C['accessories']=parts
    print('ACCESSORIES_READY',len(parts))

def init_atelier():
    backup=ART/'session-before-bouquet.blend'
    if not backup.exists():bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True,compress=True)
    C['original_scene']=bpy.context.scene
    C['assets']=bpy.data.scenes.new('Rose Wishes - Asset Masters')
    C['atelier']=bpy.data.scenes.new('Rose Wishes - Bouquet Atelier')
    C['atelier']['rose_wishes_generated']=True
    C['atelier'].world=bpy.data.worlds.new('RW Studio World');C['atelier'].world.use_nodes=True
    bg=next(n for n in C['atelier'].world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.08,.06,.07,1);bg.inputs[1].default_value=.45
    bpy.context.window.scene=C['assets']
    print('ATELIER_INITIALIZED',str(ART))

def assemble():
    scene=C['atelier'];bpy.context.window.scene=scene
    root=bpy.data.objects.new('Rose Wishes - 10 Roses',None);scene.collection.objects.link(root);root['interactive_rose_count']=10
    for i,pos,d,size in layout():
        rose_root=bpy.data.objects.new(f'rose-{i+1:02d}',None);scene.collection.objects.link(rose_root);rose_root.parent=root;rose_root.location=W(pos)
        rose_root.rotation_mode='QUATERNION';rose_root.rotation_quaternion=Vector((0,-1,0)).rotation_difference(Vector(W(d)));rose_root.rotation_quaternion @= Quaternion((0,-1,0),json.loads((ROOT/'src/data/bouquet-layout.json').read_text(encoding='utf-8'))[i]['twist']);rose_root.scale=(size,)*3
        petal=C['petal'].copy();tint=next(n for n in petal.node_tree.nodes if n.type=='MIX_RGB');tint.inputs[2].default_value=(*linear(COLORS[i]),1);petal.diffuse_color=(*linear(COLORS[i]),1)
        for template in C['templates'][(i%5,'high')]:
            obj=template.copy();scene.collection.objects.link(obj);obj.parent=rose_root
            if obj.data.materials[0]==C['petal']:
                obj.data=template.data.copy();obj.data.materials[0]=petal
    for template in C['accessories']:
        obj=template.copy();scene.collection.objects.link(obj);obj.parent=root
    C['root']=root
    # Camera and large soft boxes for judging real surface detail.
    camera=bpy.data.objects.new('RW Portrait Camera',bpy.data.cameras.new('RW Portrait Lens'));scene.collection.objects.link(camera)
    camera.location=W((3.1,2.25,5.8));target=Vector(W((0,.45,0)));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.lens=55;scene.camera=camera
    for name,position,power,size,color in [('Key',(2.5,4.5,3.5),650,4.0,(1,.87,.76)),('Fill',(-3,2,1),280,3.0,(.83,.9,1)),('Rim',(.3,3,-3),750,2.7,(1,.82,.83))]:
        data=bpy.data.lights.new('RW '+name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new('RW '+name,data);scene.collection.objects.link(obj);obj.location=W(position);obj.rotation_euler=(target-obj.location).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
    scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    for area in bpy.context.screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active;space.shading.type='MATERIAL';space.shading.use_scene_lights=True;space.shading.use_scene_world=True;space.region_3d.view_distance=5.8;space.region_3d.view_location=target
            space.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True);bpy.context.view_layer.objects.active=root
    print('BOUQUET_ASSEMBLED',len(scene.objects),'objects')

def export_group(objects,path):
    bpy.context.window.scene=C['assets'];bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)

def export_variant(variant,quality):
    export_group(C['templates'][(variant,quality)],RAW/f'rose-{variant}-{quality}.glb')
    print('EXPORTED',variant,quality)

def export_accessories():
    export_group(C['accessories'],RAW/'accessories.glb');bpy.context.window.scene=C['atelier'];print('ACCESSORIES_EXPORTED')

def save():
    bpy.context.window.scene=C['atelier']
    bpy.ops.wm.save_as_mainfile(filepath=str(ART/'rose-wishes-bouquet.blend'),compress=True)
    print('SAVED',str(ART/'rose-wishes-bouquet.blend'))

def refresh_flowers():
    scene=C['atelier'];bpy.context.window.scene=scene
    for parent in list(C['root'].children):
        if not parent.name.startswith('rose-'):continue
        i=int(parent.name.split('-')[1])-1
        for old in list(parent.children):bpy.data.objects.remove(old,do_unlink=True)
        petal=C['petal'].copy();tint=next(n for n in petal.node_tree.nodes if n.type=='MIX_RGB');tint.inputs[2].default_value=(*linear(COLORS[i]),1);petal.diffuse_color=(*linear(COLORS[i]),1)
        for template in C['templates'][(i%5,'high')]:
            obj=template.copy();scene.collection.objects.link(obj);obj.parent=parent
            if obj.data.materials[0]==C['petal']:obj.data=template.data.copy();obj.data.materials[0]=petal
    bpy.context.view_layer.update()
    print('FLOWERS_REFRESHED')

