"""Second-pass proportions, narrow stance and a swept 70/30 side part.

Run on the first cardigan master once. Hair can be rebuilt independently.
"""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def shape(p):
    x,y,z=p
    head=smooth((z-1.42)/.10)
    sx=.84+head*.12
    sy=.86+head*.12+(.12*(1-smooth((z-.10)/.10)))
    inward=.062*max(0,min(1,(.88-z)/.80))
    return Vector((x*sx-(1 if x>0 else -1 if x<0 else 0)*inward,
                   y*sy,z*1.055 if z<=1.48 else 1.48*1.055+z-1.48))

def refine():
    s=bpy.data.scenes['Rose Wishes - Character Atelier'];bpy.context.window.scene=s
    if s.get('slim_sidepart_v2'):raise RuntimeError('Proportions already refined; rebuild hair separately.')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/characters/before-slim-sidepart.blend'),copy=True,compress=True)
    rig=next(o for o in s.objects if o.type=='ARMATURE');rig.animation_data.action=None;rig.data.pose_position='REST'
    arm={side:tuple(Vector(p) for p in (rig.data.bones['upperarm_'+side].head_local,rig.data.bones['lowerarm_'+side].head_local,rig.data.bones['lowerarm_'+side].tail_local)) for side in ('l','r')}
    meshes=[o for o in s.objects if o.type=='MESH' and o.parent==rig]
    for o in meshes:
        for v in o.data.vertices:
            p=v.co.copy()
            if o.name.startswith('RW Dropped knit sleeve'):
                a,b,c=arm[o.name[-1]];t=(v.index//33)/30
                center=a.lerp(b,t/.47) if t<.47 else b.lerp(c,(t-.47)/.53)
                p=center+(p-center)*.80
            if o.name=='RW Relaxed cream trousers' and p.z<.84:
                t=max(0,min(1,(p.z-.074)/.81));cx=(1 if p.x>=0 else -1)*(.188*(1-t)+.105*t)
                p.x=cx+(p.x-cx)*.89;p.y=-.012+(p.y+.012)*.89
            v.co=shape(p)
        o.data.update()
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for bone in rig.data.edit_bones:
        head,tail=shape(bone.head.copy()),shape(bone.tail.copy())
        bone.head=head;bone.tail=tail
    bpy.ops.object.mode_set(mode='OBJECT')
    # The clip's rotational gait is retained; reduce translational hip sway.
    for action in bpy.data.actions:
        for curve in action.fcurves:
            if curve.data_path.endswith('.location'):
                scale=(.80,.86,1.055)[curve.array_index]
                for key in curve.keyframe_points:
                    key.co.y*=scale;key.handle_left.y*=scale;key.handle_right.y*=scale
    rig.data.pose_position='POSE';s['slim_sidepart_v2']=True
    hair(s,rig)
    rig.animation_data.action=bpy.data.actions['Idle_Standing'];s.frame_set(30)
    print('SLIM_RIG_READY: +body height, narrower shoulders/sleeves, close parallel legs')

def hair(s,rig):
    for o in list(s.objects):
        if o.name in ('short01','Hairline | fine scalp roots') or o.name.startswith(('RW Swept hair','RW Side part')):
            bpy.data.objects.remove(o,do_unlink=True)
    def color(h):
        a=[int(h[i:i+2],16)/255 for i in (1,3,5)]
        return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in a)
    def material(name,h,rough):
        m=bpy.data.materials.new(name);m.use_nodes=True;b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value=(*color(h),1);b.inputs['Roughness'].default_value=rough;b.inputs['Specular IOR Level'].default_value=.12;m.diffuse_color=(*color(h),1);return m
    dark=material('RW 73 espresso hair','#211b19',.80)
    accent=material('RW 73 soft strand highlights','#27201c',.85)
    part=material('RW 73 narrow scalp part','#725344',.84)
    def mesh(name,verts,faces,mat):
        d=bpy.data.meshes.new(name);d.from_pydata([shape(v) for v in verts],[],faces);d.update()
        for f in d.polygons:f.use_smooth=True
        o=bpy.data.objects.new(name,d);s.collection.objects.link(o);d.materials.append(mat);o.parent=rig
        g=o.vertex_groups.new(name='head');g.add(list(range(len(verts))),1,'REPLACE');mod=o.modifiers.new('Follow head','ARMATURE');mod.object=rig;return o
    def lift(x,y,z):return .026*math.exp(-((x+.020)/.058)**2-((y+.055)/.09)**2)*smooth((z-1.61)/.075)
    def top(x,y):
        z=1.585+.110*math.sqrt(max(.012,1-(x/.084)**2-((y+.035)/.108)**2))
        return z+lift(x,y,z)
    # Fitted scalp, lower back and tapered temples; no floating quiff slab.
    verts=[];faces=[];nu,nv=96,30
    for j in range(nv+1):
        for i in range(nu+1):
            a=i/nu*math.tau;boundary=1.10+.37*(1-math.cos(a))+.30*math.sin(a)**2
            theta=.005+j/nv*boundary
            x=.083*math.sin(theta)*math.sin(a);y=-.035-.107*math.sin(theta)*math.cos(a);z=1.585+.110*math.cos(theta)
            z+=lift(x,y,z)
            z-=.0025*math.exp(-((x-.028)/.003)**2)*smooth((z-1.63)/.03)
            verts.append((x,y,z))
    for j in range(nv):
        for i in range(nu):
            q=j*(nu+1)+i;faces.append((q,q+1,q+nu+2,q+nu+1))
    mesh('RW Side part 73 cap',verts,[tuple(reversed(f)) for f in faces],dark)
    # Broad 70% sweep and a shorter, lower 30% sweep, with individually curved ridges.
    allverts=[];allfaces=[];fineverts=[];finefaces=[]
    rng=random.Random(73)
    for side,count in [(-1,11),(1,7)]:
        for k in range(count):
            y=-.112+k/(count-1)*.135;startx=.025 if side<0 else .032
            endx=-.077 if side<0 else .078
            def path(t):
                x=startx+(endx-startx)*smooth(t)
                yy=y+.030*t-.014*math.sin(t*math.pi)
                bound=.084*math.sqrt(max(.012,1-((yy+.035)/.108)**2))
                x=max(-bound*.975,min(bound*.975,x))
                zz=top(x,yy)+(.013 if side<0 else .006)*math.sin(t*math.pi)+.0005
                return Vector((x,yy,zz))
            width=.009 if side<0 else .008
            base=len(allverts);nu2,nv2=6,30
            for j in range(nv2+1):
                t=j/nv2;p=path(t);direction=(path(min(1,t+.005))-path(max(0,t-.005))).normalized();cross=Vector((-direction.y,direction.x,0)).normalized()
                for i in range(nu2+1):
                    u=i/nu2*2-1;v=p+cross*u*width*(.06+.94*math.sin(t*math.pi)**.7)
                    bound=.084*math.sqrt(max(.012,1-((v.y+.035)/.108)**2));v.x=max(-bound*.985,min(bound*.985,v.x))
                    v.z=max(v.z,top(v.x,v.y)+.0004)+.0008*(1-u*u)*math.sin(t*math.pi);allverts.append(tuple(v))
            for j in range(nv2):
                for i in range(nu2):
                    q=base+j*(nu2+1)+i;allfaces.append((q,q+1,q+nu2+2,q+nu2+1))
            for strand in range(3):
                base=len(fineverts)
                for j in range(25):
                    t=.03+j/24*.94;p=path(t);p.y+=(strand-1)*.002*math.sin(t*math.pi);p.z=max(p.z,top(p.x,p.y))+.0006
                    for edge in (-1,1):fineverts.append(tuple(p+Vector((0,edge*.00024,0))))
                for j in range(24):q=base+j*2;finefaces.append((q,q+1,q+3,q+2))
    mesh('RW Side part 73 sweep',allverts,[tuple(reversed(f)) for f in allfaces],dark)
    mesh('RW Side part 73 fine strands',fineverts,finefaces,accent)
    verts=[];faces=[]
    for j in range(37):
        y=-.118+j/36*.148;x=.027+j/36*.004
        for edge in (-1,1):
            xx=x+edge*.0013;verts.append((xx,y,top(xx,y)+.0012))
    for j in range(36):q=j*2;faces.append((q,q+1,q+3,q+2))
    mesh('RW Side part 73 part line',verts,faces,part)

def audit():
    s=bpy.context.scene;rig=next(o for o in s.objects if o.type=='ARMATURE')
    rig.animation_data.action=bpy.data.actions['Walk_Relaxed'];distances=[]
    for frame in range(0,49,4):
        s.frame_set(frame);bpy.context.view_layer.update()
        a=rig.matrix_world@rig.pose.bones['foot_l'].head;b=rig.matrix_world@rig.pose.bones['foot_r'].head
        distances.append(abs(a.x-b.x))
    rig.animation_data.action=bpy.data.actions['Idle_Standing'];s.frame_set(30)
    print('WALK_LATERAL_FOOT_SPACING_METRES',round(min(distances),3),round(max(distances),3))
