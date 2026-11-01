"""Straight tapered lower trouser legs, with calf-only weights below the knee."""
import bpy,math

def apply(scene,rig):
    obj=scene.objects['RW Relaxed cream trousers']
    if obj.get('straight_calves_v3'):raise RuntimeError('Calves already corrected.')
    def smooth(t):
        t=max(0,min(1,t));return t*t*(3-2*t)
    used={i for f in obj.data.polygons for i in f.vertices}
    for i in used:
        v=obj.data.vertices[i];p=v.co;side='l' if p.x>0 else 'r'
        bone=rig.data.bones['calf_'+side];a,b=bone.head_local,bone.tail_local
        if p.z>a.z+.09:continue
        t=max(0,min(1,(p.z-b.z)/(a.z-b.z)))
        center=b.lerp(a,t)
        dx,dy=p.x-center.x,p.y-center.y
        rx=.048+.007*t;ry=.056+.009*t
        radius=math.sqrt((dx/rx)**2+(dy/ry)**2)
        weight=1-smooth((p.z-a.z)/.09)
        if radius>.001:
            ripple=1+.009*math.sin(p.z*45+math.atan2(dy,dx)*3)
            scale=(1-weight)+weight*ripple/radius
            p.x=center.x+dx*scale;p.y=center.y+dy*scale
        if p.z<a.z+.045:
            blend=smooth((p.z-a.z+.025)/.070)
            for group in [g.group for g in v.groups]:obj.vertex_groups[group].remove([i])
            for name,w in [('calf_'+side,1-blend),('thigh_'+side,blend)]:
                if w>.0001:
                    group=obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name);group.add([i],w,'REPLACE')
    obj.data.update();obj['straight_calves_v3']=True
    blend_upper(scene,rig)
    print('Lower trousers: straight taper; calf weights isolated below knee')

def blend_upper(scene,rig):
    obj=scene.objects['RW Relaxed cream trousers']
    if obj.get('straight_thigh_transition_v3'):return
    for i in {i for f in obj.data.polygons for i in f.vertices}:
        p=obj.data.vertices[i].co;side='l' if p.x>0 else 'r'
        knee=rig.data.bones['calf_'+side].head_local
        hip=rig.data.bones['thigh_'+side].head_local
        if p.z<=knee.z or p.z>=.82:continue
        t=max(0,min(1,(p.z-knee.z)/(hip.z-knee.z)));center=knee.lerp(hip,t)
        rx=.055+.021*t;ry=.065+.016*t
        dx,dy=p.x-center.x,p.y-center.y;radius=math.sqrt((dx/rx)**2+(dy/ry)**2)
        fade=max(0,min(1,(p.z-.72)/.10));fade=fade*fade*(3-2*fade)
        if radius>.001:
            scale=fade+(1-fade)/radius;p.x=center.x+dx*scale;p.y=center.y+dy*scale
    obj.data.update();obj['straight_thigh_transition_v3']=True
