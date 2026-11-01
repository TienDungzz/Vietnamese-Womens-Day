"""Clean straight trousers and loose, textured 7/3 hair from the supplied style reference."""
import bpy,math,random,importlib.util
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def trousers(s,rig):
    old=s.objects['RW Relaxed cream trousers'];material=old.data.materials[0]
    verts=[];faces=[];nu=48
    def rings(profiles):
        start=len(verts)
        for cx,cy,z,rx,ry in profiles:
            for i in range(nu):
                a=i/nu*math.tau
                crease=.0007*math.cos(a*4)
                verts.append((cx+math.cos(a)*(rx+crease),cy+math.sin(a)*(ry+crease),z))
        for j in range(len(profiles)-1):
            for i in range(nu):
                a=start+j*nu+i;b=start+j*nu+(i+1)%nu;faces.append((a,b,b+nu,a+nu))
        faces.append(tuple(reversed([start+i for i in range(nu)])))
        end=start+(len(profiles)-1)*nu;faces.append(tuple(end+i for i in range(nu)))
    for side in ('l','r'):
        knee=rig.data.bones['calf_'+side].head_local;ankle=rig.data.bones['calf_'+side].tail_local;hip=rig.data.bones['thigh_'+side].head_local
        profiles=[]
        for j in range(49):
            z=.105+j/48*(.865-.105)
            if z<knee.z:
                t=max(0,min(1,(z-ankle.z)/(knee.z-ankle.z)));center=ankle.lerp(knee,t)
                rx=.062+.003*t;ry=.073+.003*t
            else:
                t=max(0,min(1,(z-knee.z)/(hip.z-knee.z)));center=knee.lerp(hip,t)
                rx=.065+.006*t;ry=.076+.006*t
            profiles.append((center.x,center.y,z,rx,ry))
        rings(profiles)
    # The fly recedes into the crotch saddle rather than ending in a flat ledge.
    rings([(0,0,z,rx,ry) for z,rx,ry in [
        (.800,.150,.006),(.815,.154,.025),(.830,.157,.050),
        (.850,.158,.075),(.875,.157,.090),(.900,.153,.098),
        (.940,.145,.101),(.990,.139,.101)]])
    data=bpy.data.meshes.new('RW Straight trouser pattern');data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new('RW New straight trouser shell',data);s.collection.objects.link(obj);obj.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    remesh=obj.modifiers.new('Join pelvis and clean leg tubes','REMESH')
    modes=[e.identifier for e in remesh.bl_rna.properties['mode'].enum_items]
    if 'VOXEL' not in modes:raise RuntimeError('Voxel remesh unavailable')
    remesh.mode='VOXEL';remesh.voxel_size=.0065
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    mod=obj.modifiers.new('Soften pattern seams','SMOOTH');mod.factor=.45;mod.iterations=8;bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:p.use_smooth=True
    obj.parent=rig
    groups={n:obj.vertex_groups.new(name=n) for n in ['pelvis','thigh_l','thigh_r','calf_l','calf_r']}
    for v in obj.data.vertices:
        side='l' if v.co.x>0 else 'r';knee=rig.data.bones['calf_'+side].head_local.z
        upper=smooth((v.co.z-knee+.035)/.12);waist=smooth((v.co.z-.75)/.10)
        for n,w in [('pelvis',waist),('thigh_'+side,(1-waist)*upper),('calf_'+side,(1-waist)*(1-upper))]:
            if w>.0001:groups[n].add([v.index],w,'REPLACE')
    mod=obj.modifiers.new('Straight leg skinning','ARMATURE');mod.object=rig
    bpy.data.objects.remove(old,do_unlink=True);obj.name='RW Relaxed cream trousers';obj['pattern']='continuous straight leg; rebuilt, not deformed source mesh'
    print('NEW_TROUSERS',len(obj.data.vertices),'vertices')

def hair(s,rig):
    for o in list(s.objects):
        if o.name.startswith(('RW Side part','RW Soft 73')):bpy.data.objects.remove(o,do_unlink=True)
    spec=importlib.util.spec_from_file_location('rw_hair_coordinates',str(ROOT/'scripts/blender/refine_male.py'));coord=importlib.util.module_from_spec(spec);spec.loader.exec_module(coord)
    rng=random.Random(7304)
    # Each card contains fine tapered strands, with soft irregular tips and gaps.
    w,h=512,1024;u,v=np.meshgrid(np.linspace(0,1,w),np.linspace(0,1,h));density=np.zeros((h,w),dtype=np.float32)
    for i in range(84):
        center=(i+.5)/84+rng.uniform(-.004,.004);phase=rng.uniform(0,math.tau);end=rng.uniform(.76,1.0)
        curve=center+.009*np.sin(v*7+phase)+.004*np.sin(v*19+phase)
        width=rng.uniform(.0028,.0045)*np.sqrt(np.clip((end-v)/.20,.025,1))
        line=np.exp(-((u-curve)/width)**2)*np.clip((end-v)*45,0,1)*np.clip(v*35,0,1)
        density+=line.astype(np.float32)
    alpha=1-np.exp(-density*3)
    pixels=np.ones((h,w,4),dtype=np.float32)
    grain=np.random.default_rng(73).normal(0,.00045,(h,w)).astype(np.float32)
    value=np.clip(.014+grain+.005*np.sin(u*91+v*5),.006,.024)
    pixels[:,:,0]=value;pixels[:,:,1]=value*.84;pixels[:,:,2]=value*.73;pixels[:,:,3]=alpha
    image=bpy.data.images.new('RW Soft hair tapered strands',width=w,height=h,alpha=True);image.colorspace_settings.name='sRGB';image.pixels.foreach_set(pixels.ravel())
    folder=ROOT/'art/characters/textures';folder.mkdir(parents=True,exist_ok=True)
    image.filepath_raw=str(folder/'soft-hair-strands.png');image.file_format='PNG';image.save();image.pack()
    dy,dx=np.gradient(density)
    normals=np.stack((-dx*1.6,-dy*.25,np.ones_like(dx)),axis=-1);normals/=np.linalg.norm(normals,axis=-1,keepdims=True)
    normal_pixels=np.ones((h,w,4),dtype=np.float32);normal_pixels[:,:,:3]=normals*.5+.5
    normal_image=bpy.data.images.new('RW Soft hair fiber normals',width=w,height=h,alpha=True);normal_image.colorspace_settings.name='Non-Color';normal_image.pixels.foreach_set(normal_pixels.ravel());normal_image.pack()
    def material(name,texture=False):
        mat=bpy.data.materials.new(name);mat.use_nodes=True;bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        bs.inputs['Base Color'].default_value=(.009,.0075,.0065,1);bs.inputs['Roughness'].default_value=.78;bs.inputs['Specular IOR Level'].default_value=.12
        if texture:
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Alpha'],bs.inputs['Alpha'])
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=normal_image;normal=mat.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.22
            mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
            if bs.inputs.get('Anisotropic'):bs.inputs['Anisotropic'].default_value=.5
            if bs.inputs.get('Anisotropic Rotation'):bs.inputs['Anisotropic Rotation'].default_value=.25
            modes=[e.identifier for e in mat.bl_rna.properties['surface_render_method'].enum_items]
            if 'DITHERED' in modes:mat.surface_render_method='DITHERED'
        return mat
    base=material('RW Soft hair undercoat');cards=material('RW Soft hair cards',True)
    def mesh(name,verts,faces,uv,mat):
        d=bpy.data.meshes.new(name);d.from_pydata([coord.shape(p) for p in verts],[],faces);d.update();layer=d.uv_layers.new(name='UVMap')
        for f in d.polygons:
            f.use_smooth=True
            for i in f.loop_indices:layer.data[i].uv=uv[d.loops[i].vertex_index]
        o=bpy.data.objects.new(name,d);s.collection.objects.link(o);d.materials.append(mat);o.parent=rig;group=o.vertex_groups.new(name='head');group.add(list(range(len(verts))),1,'REPLACE');mod=o.modifiers.new('Follow head','ARMATURE');mod.object=rig
    verts=[];faces=[];uv=[];nu,nv=80,26
    for j in range(nv+1):
        for i in range(nu+1):
            a=i/nu*math.tau
            part_angle=math.atan2(math.sin(a+.35),math.cos(a+.35))
            boundary=1.08+.37*(1-math.cos(a))+.28*math.sin(a)**2-.36*math.exp(-(part_angle/.20)**2)
            theta=.005+j/nv*boundary
            x=.081*math.sin(theta)*math.sin(a);y=-.035-.104*math.sin(theta)*math.cos(a);z=1.585+.104*math.cos(theta)
            z+=.009*math.exp(-((x-.018)/.06)**2-((y+.06)/.08)**2)*smooth((z-1.62)/.065)
            verts.append((x,y,z));uv.append((i/nu,j/nv))
    for j in range(nv):
        for i in range(nu):
            q=j*(nu+1)+i;faces.append((q+nu+1,q+nu+2,q+1,q))
    mesh('RW Side part 73 cap',verts,faces,uv,base)
    def top(x,y):return 1.585+.106*math.sqrt(max(.02,1-(x/.083)**2-((y+.035)/.107)**2))
    def bezier(a,b,c,d,t):return a*(1-t)**3+b*3*t*(1-t)**2+c*3*t*t*(1-t)+d*t**3
    def make_cards(name,paths):
        verts=[];faces=[];uv=[];nu,nv=6,32
        for controls,width,phase in paths:
            a,b,c,d=map(Vector,controls);start=len(verts)
            for j in range(nv+1):
                t=j/nv;p=bezier(a,b,c,d,t);tangent=(bezier(a,b,c,d,min(1,t+.004))-bezier(a,b,c,d,max(0,t-.004))).normalized()
                normal=Vector((p.x/.083,(p.y+.035)/.107,max(.35,(p.z-1.585)/.106))).normalized();side=tangent.cross(normal).normalized()
                side=(side+normal*.15*math.sin(t*5+phase)).normalized()
                p+=side*.0013*math.sin(t*6+phase)*math.sin(t*math.pi)
                for i in range(nu+1):
                    u=i/nu*2-1;q=p+side*u*width*(.45+.55*math.sin(t*math.pi))
                    q+=normal*.001*(1-u*u)*math.sin(t*math.pi);verts.append(tuple(q));uv.append((i/nu,t))
            for j in range(nv):
                for i in range(nu):
                    q=start+j*(nu+1)+i;faces.append((q,q+1,q+nu+2,q+nu+1))
        mesh(name,verts,faces,uv,cards)
    paths=[]
    # Asymmetric, loose root: long sweep on the right, short sweep on the left.
    for side,count in [(1,24),(-1,14)]:
        for k in range(count):
            y=-.108+(k%12)/11*.135+rng.uniform(-.006,.006);x=-.026+rng.uniform(-.006,.006)
            endx=side*rng.uniform(.059,.078);endy=y+rng.uniform(.020,.047)
            a=(x,y,top(x,y)+.003);d=(endx,endy,top(endx,endy)+.002)
            lift=.052 if side==1 else .028
            b=(x+side*.028,y-.020,max(a[2],d[2])+lift);c=(endx-side*.015,endy-.004,d[2]+lift*.8)
            paths.append(((a,b,c,d),rng.uniform(.010,.017),rng.random()*math.tau))
    for side in (-1,1):
        for k in range(20):
            y=-.095+k/19*.155;x=side*rng.uniform(.042,.060)
            a=(x,y,top(x,y)+.002);d=(side*.079,y+.012,1.565+rng.uniform(-.008,.015))
            b=(side*.083,y-.006,a[2]+.012);c=(side*.094,y+.005,d[2]+.025)
            paths.append(((a,b,c,d),rng.uniform(.008,.013),rng.random()*math.tau))
    # Thin lifted bundles break the smooth outline without inflating the sides.
    for k in range(22):
        x=rng.uniform(-.046,.048);y=rng.uniform(-.103,.025);z=top(x,y)+.003
        side=1 if x>-.024 else -1
        a=(x,y,z);b=(x+side*.012,y-.012,z+rng.uniform(.018,.030))
        c=(x+side*.024,y+.013,z+rng.uniform(.011,.022));d=(x+side*.030,y+.025,z-.006)
        paths.append(((a,b,c,d),rng.uniform(.0018,.0032),rng.random()*math.tau))
    make_cards('RW Side part 73 sweep',paths)
    fringe=[]
    for k in range(8):
        side=1 if k<5 else -1;endx=side*rng.uniform(.034,.063)
        a=(-.026+rng.uniform(-.006,.006),-.101,1.683+rng.uniform(-.004,.004))
        b=(side*.008,-.144,1.718+rng.uniform(-.005,.005));c=(endx,-.151,1.65);d=(endx-side*.009,-.137,1.606+rng.uniform(-.008,.012))
        fringe.append(((a,b,c,d),rng.uniform(.005,.008),rng.random()*math.tau))
    make_cards('RW Soft 73 fringe',fringe)
    print('SOFT_HAIR: layered alpha strands, loose asymmetric root and forehead wisps')

def build():
    s=bpy.data.scenes['Rose Wishes - Character Atelier'];bpy.context.window.scene=s;rig=next(o for o in s.objects if o.type=='ARMATURE')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/characters/before-reference-v4.blend'),copy=True,compress=True)
    trousers(s,rig);hair(s,rig);rig.animation_data.action=bpy.data.actions['Idle_Standing'];s.frame_set(30)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/characters/male-cardigan.blend'),compress=True)
