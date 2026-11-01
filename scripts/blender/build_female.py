"""Reference outfit on a separate copy of the existing Sam character and rig."""
import bpy, bmesh, math, random
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[2]

def build():
    source=bpy.data.scenes['Rose Wishes - Character Atelier']
    bpy.context.window.scene=source
    previous=bpy.data.scenes.get('Rose Wishes - Female Atelier')
    if previous:
        for o in list(previous.objects):
            if o.name not in source.objects:bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.scenes.remove(previous)
    modes=[e.identifier for e in bpy.ops.scene.new.get_rna_type().properties['type'].enum_items]
    assert 'FULL_COPY' in modes
    bpy.ops.scene.new(type='FULL_COPY')
    s=bpy.context.scene;s.name='Rose Wishes - Female Atelier'
    rig=next(o for o in s.objects if o.type=='ARMATURE')
    rig.animation_data.action=None;rig.data.pose_position='REST'
    body=next(o for o in s.objects if o.name.startswith('Sam | anatomical body') and o.type=='MESH')
    def rgb(h):
        a=[int(h[i:i+2],16)/255 for i in (1,3,5)]
        return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in a)
    def mat(name,color,rough=.8):
        m=bpy.data.materials.new(name);m.use_nodes=True
        bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        bs.inputs['Base Color'].default_value=(*rgb(color),1);bs.inputs['Roughness'].default_value=rough
        m.diffuse_color=(*rgb(color),1);return m
    top=mat('RW Female heather grey jersey','#777976');denim=mat('RW Female washed blue denim','#93aaba');white=mat('RW Female ivory sneakers','#edeae1');stitch=mat('RW Female denim seam','#c7c6b1');hair=mat('RW Female espresso waves','#211b19',.48)
    # Embedded woven denim map, with fine diagonal twill and uneven wash.
    n=512;u,v=np.meshgrid(np.arange(n)/n,np.arange(n)/n)
    rng=np.random.default_rng(28);grain=rng.random((n,n))*.09
    weave=np.sin((u*170+v*140)*math.tau)*.035+np.sin(u*math.tau*230)*.025
    wash=.91+grain+weave+.035*np.sin(v*19)
    pixels=np.ones((n,n,4),dtype=np.float32);pixels[:,:,:3]=np.clip(np.array(rgb('#93aaba'))[None,None,:]*wash[:,:,None],0,1)
    image=bpy.data.images.new('RW Female denim wash 512',width=n,height=n);image.pixels.foreach_set(pixels.ravel());image.pack()
    tex=denim.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    bs=next(q for q in denim.node_tree.nodes if q.type=='BSDF_PRINCIPLED');denim.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    fibers=.72+.22*np.sin(u*math.tau*241+np.sin(v*11)*.6)**2+.04*np.sin(u*math.tau*73)
    pixels[:,:,:3]=np.array(rgb('#302823'))[None,None,:]*fibers[:,:,None]
    image=bpy.data.images.new('RW Female fine hair fibers 512',width=n,height=n);image.pixels.foreach_set(pixels.ravel());image.pack()
    tex=hair.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    bs=next(q for q in hair.node_tree.nodes if q.type=='BSDF_PRINCIPLED');hair.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.59
    # Remove the cardigan, original trousers and short male hairstyle in this copy only.
    for o in list(s.objects):
        if o.type!='MESH':continue
        if any(o.name.startswith(p) for p in ['RW Ivory','RW Oversized','RW Dropped','RW Patch','RW Relaxed','RW Side part','RW Soft 73','Original skinned ankle']):bpy.data.objects.remove(o,do_unlink=True)
        elif o.name.startswith('Icosphere'):o.hide_render=True;o.hide_set(True)
        elif o.name.startswith('shoes01'):
            o.data.materials.clear();o.data.materials.append(white)
    # Softer jaw and narrower shoulder silhouette; keep the anatomical facial details.
    for o in s.objects:
        if o.type!='MESH' or o.hide_render:continue
        for vert in o.data.vertices:
            p=vert.co
            if p.z>1.50:
                f=.91+.06*min(1,max(0,(p.z-1.55)/.13));p.x*=f
            elif o==body and p.z>1.08:p.x*=.94
    tree=KDTree(len(body.data.vertices))
    for q in body.data.vertices:tree.insert(q.co,q.index)
    tree.balance()
    def skin(o,head=False,legs=False):
        o.parent=rig
        if head:
            g=o.vertex_groups.new(name='head');g.add(list(range(len(o.data.vertices))),1,'REPLACE')
        elif legs:
            groups={n:o.vertex_groups.new(name=n) for n in ['pelvis','thigh_l','thigh_r','calf_l','calf_r']}
            for q in o.data.vertices:
                side='l' if q.co.x>0 else 'r';z=q.co.z;knee=rig.data.bones['calf_'+side].head_local.z
                t=min(1,max(0,(z-knee+.065)/.16));t=t*t*(3-2*t)
                w=min(1,max(0,(z-.78)/.12));w=w*w*(3-2*w)
                for name,value in [('pelvis',w),('thigh_'+side,(1-w)*t),('calf_'+side,(1-w)*(1-t))]:
                    if value>.0001:groups[name].add([q.index],value,'REPLACE')
        else:
            groups={g.index:o.vertex_groups.new(name=g.name) for g in body.vertex_groups}
            for q in o.data.vertices:
                weights={}
                for _,i,d in tree.find_n(q.co,3):
                    for g in body.data.vertices[i].groups:weights[g.group]=weights.get(g.group,0)+g.weight/max(.003,d)**2
                total=sum(weights.values())
                for i,w in weights.items():
                    if w/total>.001:groups[i].add([q.index],w/total,'REPLACE')
        m=o.modifiers.new('Shared character rig','ARMATURE');m.object=rig
    def mesh(name,verts,faces,material,head=False,legs=False):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
        uv=data.uv_layers.new(name='UVMap')
        for p in data.polygons:
            p.use_smooth=True
            for i in p.loop_indices:
                q=data.vertices[data.loops[i].vertex_index].co;uv.data[i].uv=(q.x*3+q.y*2,q.z*2)
        o=bpy.data.objects.new(name,data);s.collection.objects.link(o);data.materials.append(material);skin(o,head,legs);return o
    def tube(name,points,radii,material,head=False,legs=False,flatten=1,segments=12):
        verts=[];faces=[]
        for j,p in enumerate(points):
            tangent=(Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)])).normalized()
            x=tangent.cross(Vector((0,1,0))).normalized();y=tangent.cross(x).normalized()
            for k in range(segments):
                a=k/segments*math.tau;verts.append(Vector(p)+radii[j]*(x*math.cos(a)+y*math.sin(a)*flatten))
        for j in range(len(points)-1):
            for k in range(segments):
                a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
        faces.append(tuple(reversed(range(segments))));faces.append(tuple((len(points)-1)*segments+k for k in range(segments)))
        return mesh(name,verts,faces,material,head,legs)
    def bind(o,bone):
        o.vertex_groups.clear();g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    skinplain=mat('RW Female exposed skin','#c6a48d',.65)
    # Fitted short sleeve scoop-neck top, with a curved neckline and fine soft folds.
    verts=[];faces=[];nu=80;nv=36
    for j in range(nv+1):
        t=j/nv
        for i in range(nu):
            a=i/nu*math.tau;front=max(0,-math.sin(a));neck=1.435-.075*front**3
            z=.995+(neck-.995)*t
            rx=.111+.031*math.sin(t*math.pi*.65);ry=.079+.016*math.sin(t*math.pi)
            x=math.cos(a)*rx;y=math.sin(a)*ry-.008
            y-=front*.018*math.exp(-((z-1.285)/.075)**2)*math.exp(-((abs(x)-.065)/.05)**2)
            y+=math.sin(z*95+a*3)*.0015*(1-t);verts.append((x,y,z))
    for j in range(nv):
        for i in range(nu):a=j*nu+i;b=j*nu+(i+1)%nu;faces.append((a,b,b+nu,a+nu))
    shirt=mesh('RW Female scoop-neck grey top',verts,faces,top)
    shirt.vertex_groups.clear()
    groups={n:shirt.vertex_groups.new(name=n) for n in ['pelvis','spine_01','spine_03']}
    for q in shirt.data.vertices:
        t=min(1,max(0,(q.co.z-1.04)/.17));t=t*t*(3-2*t)
        groups['spine_03'].add([q.index],t,'REPLACE');groups['spine_01'].add([q.index],1-t,'REPLACE')
    solid=shirt.modifiers.new('Jersey thickness','SOLIDIFY');solid.thickness=.003
    for side in ['l','r']:
        b=rig.data.bones['upperarm_'+side];a=b.head_local;end=a.lerp(b.tail_local,.43)
        points=[a.lerp(end,j/12) for j in range(13)];sleeve=tube('RW Female short sleeve '+side,points,[.052-j*.0006 for j in range(13)],top);bind(sleeve,'upperarm_'+side)
        fore=rig.data.bones['lowerarm_'+side]
        points=[a.lerp(b.tail_local,j/20) for j in range(20)]+[fore.head_local.lerp(fore.tail_local,j/20) for j in range(21)]
        radii=[.037-j*.0003 for j in range(20)]+[.031-j*.0005 for j in range(21)]
        arm=tube('RW Female continuous arm '+side,points,radii,skinplain,segments=24);arm.vertex_groups.clear()
        upper=arm.vertex_groups.new(name='upperarm_'+side);lower=arm.vertex_groups.new(name='lowerarm_'+side)
        for q in arm.data.vertices:
            row=q.index//24;t=min(1,max(0,(row-16)/8));t=t*t*(3-2*t)
            upper.add([q.index],1-t,'REPLACE');lower.add([q.index],t,'REPLACE')
    # The original male skin mesh intentionally omitted the covered torso and arms.
    # Add the now exposed collar and neck instead of leaving a gap below the head.
    collar=tube('RW Female neck and collar',[Vector((0,-.015,1.30)),Vector((0,-.012,1.40)),Vector((0,-.008,1.46)),Vector((0,-.009,1.54)),Vector((0,-.015,1.58))],[.115,.126,.058,.039,.038],skinplain,flatten=.68,segments=48);bind(collar,'spine_03')
    # Continuous wide legs and high waist; a small opening only on the right knee.
    verts=[];faces=[];nu=64
    for side in ['l','r']:
        ankle=rig.data.bones['calf_'+side].tail_local;hip=rig.data.bones['thigh_'+side].head_local;start=len(verts);nj=64
        for j in range(nj+1):
            t=j/nj;z=.08+t*.81;center=ankle.lerp(hip,t)
            rx=.101-.014*t;ry=.09+.006*t
            center.x+=(1 if side=='l' else -1)*.016*(1-t)
            for i in range(nu):
                a=i/nu*math.tau;fold=.0018*math.sin(a*5+t*3)*(.4+.6*(1-t))
                verts.append((center.x+math.cos(a)*(rx+fold),center.y+math.sin(a)*(ry+fold),z))
        for j in range(nj):
            for i in range(nu):
                a=i/nu*math.tau;z=.08+j/nj*.81
                q=start+j*nu+i;r=start+j*nu+(i+1)%nu;faces.append((q,r,r+nu,q+nu))
        faces.append(tuple(reversed([start+i for i in range(nu)])));faces.append(tuple(start+nj*nu+i for i in range(nu)))
    # Pelvis overlaps the leg tubes inside the natural crotch fold.
    start=len(verts);profiles=[(.82,.165,.018),(.85,.17,.062),(.89,.17,.095),(.94,.155,.102),(1.015,.13,.091)]
    for z,rx,ry in profiles:
        for i in range(nu):a=i/nu*math.tau;verts.append((math.cos(a)*rx,math.sin(a)*ry,z))
    for j in range(len(profiles)-1):
        for i in range(nu):q=start+j*nu+i;r=start+j*nu+(i+1)%nu;faces.append((q,r,r+nu,q+nu))
    faces.append(tuple(reversed([start+i for i in range(nu)])));faces.append(tuple(start+(len(profiles)-1)*nu+i for i in range(nu)))
    jeans=mesh('RW Female high waist wide leg jeans',verts,faces,denim,legs=True)
    # Unite the pelvis and legs into one fabric shell with a soft crotch saddle.
    bpy.ops.object.select_all(action='DESELECT');jeans.select_set(True);bpy.context.view_layer.objects.active=jeans
    jeans.modifiers.clear();jeans.vertex_groups.clear()
    remesh=jeans.modifiers.new('Continuous denim pattern','REMESH')
    assert 'VOXEL' in [e.identifier for e in remesh.bl_rna.properties['mode'].enum_items]
    remesh.mode='VOXEL';remesh.voxel_size=.0045;bpy.ops.object.modifier_apply(modifier=remesh.name)
    mod=jeans.modifiers.new('Soft denim seams','SMOOTH');mod.factor=.55;mod.iterations=8;bpy.ops.object.modifier_apply(modifier=mod.name)
    bm=bmesh.new();bm.from_mesh(jeans.data)
    cut=[f for f in bm.faces if -.126<f.calc_center_median().x<-.066 and -.115<f.calc_center_median().y<-.072 and .475<f.calc_center_median().z<.525]
    bmesh.ops.delete(bm,geom=cut,context='FACES');bm.to_mesh(jeans.data);bm.free()
    uv=jeans.data.uv_layers.active or jeans.data.uv_layers.new(name='UVMap')
    for loop in jeans.data.loops:
        q=jeans.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(q.x*3+q.y*2,q.z*2)
    skin(jeans,legs=True)
    for p in jeans.data.polygons:p.use_smooth=True
    solid=jeans.modifiers.new('Denim thickness','SOLIDIFY');solid.thickness=.002
    for z in [.983,1.006]:
        points=[(.132*math.cos(i/64*math.tau),.093*math.sin(i/64*math.tau),z) for i in range(65)]
        tube('RW Female waistband stitching',points,[.0011]*65,stitch,legs=True,segments=6)
    # Ragged cotton threads bridge the small worn knee opening.
    for j in range(8):
        z=.48+j*.006;points=[(-.12+i*.008,-.097-.002*math.sin(i),z+math.sin(i*1.3+j)*.0015) for i in range(8)]
        tube('RW Female knee fraying',points,[.00065]*8,stitch,legs=True,segments=5)
    skinmat=body.data.materials[0]
    tube('RW Female knee beneath denim',[(-.092,-.04,.465),(-.092,-.04,.535)],[.053,.053],skinmat,legs=True,flatten=.95)
    # Hair dome: elliptical scalp cover with an open face, followed by long soft waves.
    verts=[];faces=[];nu=80;nv=24
    for j in range(nv+1):
        for i in range(nu):
            a=i/nu*math.tau;front=max(0,-math.sin(a));end=1.9-.65*front
            p=.018+j/nv*(end-.018)
            verts.append((.094*math.sin(p)*math.cos(a),-.04+.123*math.sin(p)*math.sin(a),1.65+.125*math.cos(p)))
    for j in range(nv):
        for i in range(nu):q=j*nu+i;r=j*nu+(i+1)%nu;faces.append((q,r,r+nu,q+nu))
    mesh('RW Female parted hair crown',verts,[tuple(reversed(f)) for f in faces],hair,head=True)
    for side in [-1,1]:
        for k in range(12):
            points=[]
            for j in range(33):
                t=j/32;x=-.014*(1-t)+side*.094*t
                y=-.065-k*.004-.052*t;z=1.765-.115*t+.025*math.sin(t*math.pi)
                points.append((x,y,z))
            tube('RW Female swept part strand',points,[.0045*(1-j/32*.75) for j in range(33)],hair,head=True,flatten=.6,segments=8)
    rng=random.Random(39)
    for k in range(68):
        a=-.08+k/67*(math.pi+ .16);side=1 if math.cos(a)>0 else -1
        front=k<14 or k>54;length=rng.uniform(.43,.61) if front else rng.uniform(.48,.60)
        points=[];radii=[];phase=rng.random()*math.tau;radius=.009+rng.random()*.002
        for j in range(49):
            t=j/48;z=1.70-t*length
            x=.079*math.cos(a)*(1+.65*math.sin(t*math.pi/2))+side*.014*math.sin(t*math.pi*3+phase)*math.sin(t*math.pi)
            y=-.035+.092*math.sin(a)
            if front:y=-.075-.052*math.sin(t*math.pi/2)
            else:y+=.035*math.sin(t*math.pi/2)
            y+=.009*math.sin(t*math.pi*3+phase)*math.sin(t*math.pi)
            points.append((x,y,z));radii.append(radius*( .55+.45*math.sin(t*math.pi))*(1-t**7)+.00025)
        tube('RW Female flowing hair lock %02d'%k,points,radii,hair,head=True,flatten=.55,segments=8)
    # A small pendant on the visible neckline.
    gold=mat('RW Female necklace gold','#bda675',.3)
    points=[(.062*math.cos(i/40*math.pi),-.081-.017*math.sin(i/40*math.pi),1.405-.072*math.sin(i/40*math.pi)) for i in range(41)]
    tube('RW Female fine necklace',points,[.0008]*41,gold)
    bind(s.objects['RW Female fine necklace'],'spine_03')
    bagmat=mat('RW Female warm ivory shoulder bag','#d2c7b6',.72)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=(0,0,0))
    bag=bpy.context.object;bag.name='RW Female ivory shoulder bag'
    for q in bag.data.vertices:q.co=Vector((.227+q.co.x*.055,.035+q.co.y*.055,1.075+q.co.z*.115))
    bag.data.materials.append(bagmat)
    for p in bag.data.polygons:p.use_smooth=True
    skin(bag);bind(bag,'pelvis')
    points=[(.165+.062*math.sin(i/40*math.pi),.033-.073*math.cos(i/40*math.pi),1.12+.33*math.sin(i/40*math.pi)) for i in range(41)]
    strap=tube('RW Female shoulder bag strap',points,[.006]*41,bagmat);bind(strap,'spine_03')
    bpy.ops.object.select_all(action='DESELECT')
    locks=[o for o in s.objects if o.name.startswith(('RW Female flowing hair lock','RW Female swept part strand'))]
    for o in locks:o.select_set(True)
    bpy.context.view_layer.objects.active=locks[0];bpy.ops.object.join();locks[0].name='RW Female long wavy hair'
    # Apply the current reference hairstyle after constructing the base character.
    import importlib.util
    spec=importlib.util.spec_from_file_location('rw_female_hair',str(ROOT/'scripts/blender/female_straight_bangs.py'));hairstyle=importlib.util.module_from_spec(spec);spec.loader.exec_module(hairstyle);hairstyle.apply(s,rig)
    # Keep the same animation names and bone hierarchy expected by the web IK.
    rig.data.pose_position='POSE';rig.animation_data.action=bpy.data.actions.get('Idle_Standing');s.frame_set(30)
    for o in s.objects:o.select_set(False)
    for o in s.objects:
        if o==rig or (o.type=='MESH' and not o.hide_render and o.find_armature()==rig):o.hide_set(False);o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    s['reference']='Female grey scoop-neck tee, washed wide jeans, white shoes, long dark waves; adapted from existing male rig'
    target=ROOT/'public/models/characters/female-grey-jeans.glb'
    bpy.ops.export_scene.gltf(filepath=str(target),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=True,export_nla_strips=True,export_apply=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/characters/female-grey-jeans.blend'),compress=True)
    print('FEMALE_EXPORTED',target,'MESHES',sum(o.type=='MESH' for o in s.objects))

if __name__=='__main__':build()
