"""Reference-inspired knit cardigan and relaxed trousers on the CC0 Sam rig."""
import bpy,math,random,bmesh
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'art/characters';ART.mkdir(parents=True,exist_ok=True)
SCENE='Rose Wishes - Character Atelier'

def build():
    s=bpy.data.scenes[SCENE];bpy.context.window.scene=s
    rig=next(o for o in s.objects if o.type=='ARMATURE')
    rig.animation_data_clear();rig.data.pose_position='REST'
    source=s.objects['male_casualsuit02']
    body=s.objects['Sam | anatomical body']
    def rgb(h):
        values=[int(h[i:i+2],16)/255 for i in (1,3,5)]
        return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in values)
    def mat(name,color,rough=.8):
        m=bpy.data.materials.new(name);m.use_nodes=True
        bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        bs.inputs['Base Color'].default_value=(*rgb(color),1);bs.inputs['Roughness'].default_value=rough
        m.diffuse_color=(*rgb(color),1);return m
    knit=mat('RW Charcoal rib knit','#454849');cream=mat('RW Warm ivory cotton','#e6dfd0');pants=mat('RW Sand wide-leg twill','#d4cbb9');hair=mat('RW Soft espresso hair','#29211e',.62)
    # Original woven normal map, embedded in the exported material.
    n=512;u,v=np.meshgrid(np.arange(n)/n,np.arange(n)/n)
    height=np.sin(u*math.pi*96)*.55+np.sin((u*64+v*128)*math.pi)*.10
    dy,dx=np.gradient(height);normal=np.stack((-dx*2,-dy*2,np.ones_like(dx)),axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    pixels=np.ones((n,n,4),dtype=np.float32);pixels[:,:,:3]=normal*.5+.5
    image=bpy.data.images.new('RW Knit stitches 512',width=n,height=n,alpha=True);image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels.ravel());image.pack()
    nodes=knit.node_tree.nodes;links=knit.node_tree.links;tex=nodes.new('ShaderNodeTexImage');tex.image=image;nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.32
    bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Sheen Weight'].default_value=.22
    links.new(tex.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],bs.inputs['Normal'])
    # Preserve the existing anatomical face, eyes and their skin deformation.
    for o in s.objects:
        if o.type!='MESH' or o==source:continue
        if o.name=='Icosphere':o.hide_render=True;o.hide_set(True)
        if o.name.startswith('Original skinned ankle'):
            o.data.materials.clear();o.data.materials.append(pants)
    shoe=s.objects['shoes01'];canvas=mat('RW Charcoal canvas sneakers','#2b2d2d',.78)
    shoe.data.materials.clear();shoe.data.materials.append(canvas)
    for slot in body.material_slots:
        bs=next(n for n in slot.material.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Roughness'].default_value=.64
    # Split the original skinned underlayer and trousers without losing weights.
    garments=[]
    for index,name,material in [(0,'RW Ivory crewneck underlayer',cream),(1,'RW Relaxed cream trousers',pants)]:
        o=source.copy();o.data=source.data.copy();o.name=name;s.collection.objects.link(o)
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index!=index],context='FACES');bm.to_mesh(o.data);bm.free()
        o.data.materials.clear();o.data.materials.append(material)
        for f in o.data.polygons:f.material_index=0;f.use_smooth=True
        if index==1:
            for vert in o.data.vertices:
                p=vert.co
                if p.z>.83:continue
                sign=1 if p.x>=0 else -1
                t=max(0,min(1,(p.z-.074)/(.884-.074)));cx=sign*(.188*(1-t)+.105*t)
                factor=1.60 if p.z<.70 else 1+(1.60-1)*(.83-p.z)/.13
                p.x=cx+(p.x-cx)*factor;p.y=(p.y+.012)*factor-.012
                p.y+=math.sin(p.z*54+p.x*19)*.0025
        sub=o.modifiers.new('Soft garment silhouette','SUBSURF');sub.levels=1;sub.render_levels=1
        garments.append(o)
    bpy.data.objects.remove(source,do_unlink=True)
    # Skin new garments by the nearest anatomical vertices, using normalized groups.
    tree=KDTree(len(body.data.vertices))
    for v in body.data.vertices:tree.insert(v.co,v.index)
    tree.balance()
    def skin(o,head=False):
        o.parent=rig
        if head:
            group=o.vertex_groups.new(name='head');group.add(list(range(len(o.data.vertices))),1,'REPLACE')
        else:
            groups={g.index:o.vertex_groups.new(name=g.name) for g in body.vertex_groups}
            for v in o.data.vertices:
                weights={}
                for _,index,dist in tree.find_n(v.co,3):
                    for g in body.data.vertices[index].groups:weights[g.group]=weights.get(g.group,0)+g.weight/max(.003,dist)**2
                total=sum(weights.values())
                for i,w in weights.items():
                    if w/total>.001:groups[i].add([v.index],w/total,'REPLACE')
        mod=o.modifiers.new('Follow anatomical rig','ARMATURE');mod.object=rig
    def mesh(name,verts,faces,uv,material,head=False):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
        layer=data.uv_layers.new(name='UVMap')
        for f in data.polygons:
            f.use_smooth=True
            for j in f.loop_indices:layer.data[j].uv=uv[data.loops[j].vertex_index]
        o=bpy.data.objects.new(name,data);s.collection.objects.link(o);data.materials.append(material);skin(o,head);return o
    # Open-front cardigan; fine ribbing comes from geometry and the woven normal.
    verts=[];faces=[];uv=[];nu,nv=80,36
    for j in range(nv+1):
        t=j/nv
        for i in range(nu+1):
            a=.30+i/nu*(math.tau-.60)
            top=1.445-.012*abs(math.sin(a));z=.925+(top-.925)*t
            rx=.225+.015*math.sin(t*math.pi);ry=.180+.010*math.sin(t*math.pi)
            neck=max(0,min(1,(t-.80)/.20));neck=neck*neck*(3-2*neck)
            rx=rx*(1-neck)+.078*neck;ry=ry*(1-neck)+.077*neck
            rib=.0013*math.cos(a*100)+.002*math.sin(t*14+a*4)
            verts.append((math.sin(a)*(rx+rib),-math.cos(a)*(ry+rib),z));uv.append((i/nu*3,t*3))
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
    cardigan=mesh('RW Oversized open charcoal cardigan',verts,faces,uv,knit)
    thick=cardigan.modifiers.new('Real knitted edge thickness','SOLIDIFY');thick.thickness=.005
    # Relaxed sleeves follow the shoulder/elbow/wrist rest chain.
    for side in ('l','r'):
        bones=[rig.data.bones[n+'_'+side] for n in ('upperarm','lowerarm')]
        a,b,c=bones[0].head_local,bones[1].head_local,bones[1].tail_local
        verts=[];faces=[];uv=[];nu,nv=32,30
        for j in range(nv+1):
            t=j/nv
            center=a.lerp(b,t/.47) if t<.47 else b.lerp(c,(t-.47)/.53)
            direction=(b-a if t<.47 else c-b).normalized();u=direction.cross(Vector((0,1,0))).normalized();v=direction.cross(u)
            radius=.071+.016*math.sin(t*math.pi)-.025*t**4
            for i in range(nu+1):
                angle=i/nu*math.tau;r=radius+.0012*math.cos(angle*20)+.002*math.sin(t*24+angle*2)
                p=center+(u*math.cos(angle)+v*math.sin(angle))*r
                verts.append(tuple(p));uv.append((i/nu*2,t*3))
        for j in range(nv):
            for i in range(nu):
                q=j*(nu+1)+i;faces.append((q,q+1,q+nu+2,q+nu+1))
        mesh('RW Dropped knit sleeve '+side,verts,faces,uv,knit)
    # Swept locks sit over the original textured cap and are bound to the head.
    rng=random.Random(1010)
    for k in range(9):
        x=-.065+k*.015
        center=Vector((x,-.080+abs(x)*.20,1.665+rng.uniform(-.005,.005)))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=center)
        o=bpy.context.object;o.name=f'RW Swept hair lock {k:02d}'
        o.scale=(.017,.064,.021);o.rotation_euler=(.12,-.25,.28+x*2)
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        o.data.materials.append(hair)
        for p in o.data.polygons:p.use_smooth=True
        skin(o,True)
    details(s,rig,knit)
    fit_weights(s,rig)
    # Restore imported clips as NLA strips, retaining their bone names for runtime IK.
    rig.data.pose_position='POSE';rig.animation_data_create()
    for name in ('Idle_Standing','Walk_Relaxed','Walk_Carry'):
        action=bpy.data.actions.get(name)
        if not action:continue
        track=rig.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,int(action.frame_range[0]),action);track.mute=True
    s.world=bpy.data.worlds.new('RW Character studio');s.world.use_nodes=True
    for area in bpy.context.screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.shading.use_scene_lights=False;area.spaces.active.shading.use_scene_world=False
    bpy.ops.object.select_all(action='DESELECT')
    for o in s.objects:
        if o.name!='Icosphere':o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    raw=ROOT/'.qa/characters';raw.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(raw/'male-cardigan.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=True,export_nla_strips=True,export_apply=False)
    bpy.ops.wm.save_as_mainfile(filepath=str(ART/'male-cardigan.blend'),compress=True)
    print('CHARACTER_SAVED',len(s.objects),'objects; original CC0 rig and face; authored outfit and hair')

def details(s,rig,knit):
    """Closed shoulder yokes and curved patch pockets over the open knit shell."""
    for side in (-1,1):
        for pocket in (True,):
            verts=[];faces=[];uv=[];nu,nv=12,10
            for j in range(nv+1):
                for i in range(nu+1):
                    u=i/nu;v=j/nv
                    if pocket:
                        x=.078+u*.118;z=.955+v*.145;y=-math.sqrt(max(.05,1-(x/.237)**2))*.193-.006
                    else:
                        a=u*math.tau;theta=v*math.pi
                        x=.184+.085*math.sin(theta)*math.cos(a)
                        y=-.014+.095*math.sin(theta)*math.sin(a)
                        z=1.328+.087*math.cos(theta)
                    verts.append((x*side,y,z));uv.append((u,v))
            for j in range(nv):
                for i in range(nu):
                    a=j*(nu+1)+i;faces.append((a,a+1,a+nu+2,a+nu+1))
            data=bpy.data.meshes.new('Knit detail');data.from_pydata(verts,[],faces);data.update()
            layer=data.uv_layers.new(name='UVMap')
            for f in data.polygons:
                f.use_smooth=True
                for q in f.loop_indices:layer.data[q].uv=uv[data.loops[q].vertex_index]
            o=bpy.data.objects.new(('RW Patch pocket ' if pocket else 'RW Soft shoulder yoke ')+str(side),data);s.collection.objects.link(o);data.materials.append(knit);o.parent=rig
            spine=o.vertex_groups.new(name='spine_03' if not pocket else 'spine_01')
            arm=o.vertex_groups.new(name='upperarm_'+('l' if side==1 else 'r'))
            for v in data.vertices:
                weight=0 if pocket else max(0,min(.85,(abs(v.co.x)-.10)/.15))
                spine.add([v.index],1-weight,'REPLACE')
                if weight:arm.add([v.index],weight,'REPLACE')
            mod=o.modifiers.new('Follow rig','ARMATURE');mod.object=rig
            mod=o.modifiers.new('Knitted thickness','SOLIDIFY');mod.thickness=.003

def fit_weights(s,rig):
    """Garment-specific weights avoid accidental arm influence on the torso."""
    def assign(o,names,weights):
        o.vertex_groups.clear();groups=[o.vertex_groups.new(name=n) for n in names]
        for v in o.data.vertices:
            for g,w in zip(groups,weights(v)):
                if w>.0001:g.add([v.index],w,'REPLACE')
    o=s.objects['RW Oversized open charcoal cardigan']
    def torso(v):
        t=max(0,min(1,(v.co.z-1.02)/.15));return (1-t,t)
    assign(o,['spine_01','spine_03'],torso)
    for side in ('l','r'):
        o=s.objects['RW Dropped knit sleeve '+side]
        def sleeve(v):
            t=(v.index//33)/30
            w=max(0,min(1,(t-.30)/.36));w=w*w*(3-2*w)
            return (1-w,w)
        assign(o,['upperarm_'+side,'lowerarm_'+side],sleeve)
    for o in s.objects:
        if o.name.startswith('RW Soft shoulder yoke'):assign(o,['spine_03'],lambda v:(1,))
    # A clean crewneck replaces the old collared shirt, including covered shoulders.
    o=s.objects['RW Ivory crewneck underlayer'];verts=[];faces=[];uv=[]
    profiles=[(.89,.15,.11),(.98,.165,.122),(1.20,.17,.132),(1.30,.19,.13),(1.345,.21,.115),(1.39,.13,.09),(1.43,.063,.065)]
    for j,(z,rx,ry) in enumerate(profiles):
        for i in range(65):
            a=i/64*math.tau;verts.append((math.sin(a)*rx,-math.cos(a)*ry,z));uv.append((i/64,j/6))
    for j in range(6):
        for i in range(64):
            q=j*65+i;faces.append((q,q+1,q+66,q+65))
    o.data.clear_geometry();o.data.from_pydata(verts,[],faces);o.data.update()
    layer=o.data.uv_layers.new(name='UVMap')
    for p in o.data.polygons:
        p.use_smooth=True
        for q in p.loop_indices:layer.data[q].uv=uv[o.data.loops[q].vertex_index]
    assign(o,['spine_01','spine_03'],torso)
    hair=bpy.data.materials['RW Soft espresso hair'];bs=next(n for n in hair.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Roughness'].default_value=.82;bs.inputs['Specular IOR Level'].default_value=.25
    locks=sorted([o for o in s.objects if o.name.startswith('RW Swept hair lock')],key=lambda o:o.name)
    for o in locks[1:]:bpy.data.objects.remove(o,do_unlink=True)
    o=locks[0];verts=[];faces=[]
    for j in range(17):
        t=j/16*math.pi
        for i in range(49):
            a=i/48*math.tau;x=.075*math.sin(t)*math.cos(a);y=-.078+.050*math.sin(t)*math.sin(a)
            z=1.668+.019*math.cos(t)+.0011*math.sin(x*180+y*26)*math.sin(t)
            verts.append((x,y,z))
    for j in range(16):
        for i in range(48):
            q=j*49+i;faces.append((q,q+1,q+50,q+49))
    o.data.clear_geometry();o.data.from_pydata(verts,[],faces);o.data.update()
    for p in o.data.polygons:p.use_smooth=True
    assign(o,['head'],lambda v:(1,))
    # Covered anatomy is not rendered through the garments at shoulder creases.
    # Keep the original face/neck and hands, including their UVs and rig weights.
    body=s.objects['Sam | anatomical body'];bm=bmesh.new();bm.from_mesh(body.data)
    remove=[]
    for f in bm.faces:
        p=f.calc_center_median()
        visible=p.z>1.49 or (p.z>1.39 and abs(p.x)<.075) or (abs(p.x)>.405 and p.z<1.15)
        if not visible:remove.append(f)
    bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(body.data);bm.free()
