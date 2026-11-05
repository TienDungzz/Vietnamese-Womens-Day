"""Curved, feathered fringe cards for the existing shoulder-length female hair."""
import bpy
import math
import random
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2]

def smooth(value):
    t=max(0.0,min(1.0,value))
    return t*t*(3-2*t)

def apply(scene,rig):
    for obj in list(scene.objects):
        if obj.name.startswith(('RW Female airy fringe','RW Female soft fringe')):
            data=obj.data
            bpy.data.objects.remove(obj,do_unlink=True)
            if data.users==0:bpy.data.meshes.remove(data)
    for material in list(bpy.data.materials):
        if material.name.startswith(('RW Female straight soft fringe','RW Soft hair cards female fringe')) and material.users==0:
            bpy.data.materials.remove(material)
    detail=bpy.data.materials.get('RW Female straight fiber detail')
    if detail and detail.use_nodes:
        shader=next(n for n in detail.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        shader.inputs['Base Color'].default_value=(.0065,.0038,.0026,1)
        shader.inputs['Roughness'].default_value=.70
        shader.inputs['Specular IOR Level'].default_value=.10

    rng=random.Random(201004)
    width,height=2048,1024
    v=np.linspace(0,1,height,dtype=np.float32)
    density=np.zeros((height,width),dtype=np.float32)
    rows=np.arange(height)[:,None]
    for i in range(240):
        center=(i+.5)/240+.0018*math.sin(i*.17)+rng.uniform(-.001,.001)
        phase=math.sin((i//12)*.9)*1.3+rng.uniform(-.15,.15)
        end=.78+.21*rng.random()+.035*math.sin(center*19)
        centers=(center+.008*np.sin(v*3+phase)*v**1.6)*width
        radius=(rng.uniform(.0006,.00095)*width)*np.sqrt(np.clip((end-v)/.10,.008,1))
        columns=np.clip(np.floor(centers[:,None]).astype(np.int32)+np.arange(-7,8)[None,:],0,width-1)
        values=np.exp(-((columns-centers[:,None])/radius[:,None])**2)*np.clip((end-v)*80,0,1)[:,None]
        np.add.at(density,(np.broadcast_to(rows,columns.shape),columns),values)
    root=np.clip((.60-v)/.30,0,1)
    root=root*root*(3-2*root)
    alpha=np.maximum(root[:,None],1-np.exp(-density*3.2))
    u=np.linspace(0,1,width,dtype=np.float32)[None,:]
    pixels=np.ones((height,width,4),dtype=np.float32)
    tone=.072+.026*(1-np.exp(-density*1.2))+.003*np.sin(u*911)
    pixels[:,:,0]=tone;pixels[:,:,1]=tone*.69;pixels[:,:,2]=tone*.48;pixels[:,:,3]=alpha
    old=bpy.data.images.get('RW Female fringe strand atlas')
    if old and old.users==0:bpy.data.images.remove(old)
    image=bpy.data.images.new('RW Female fringe strand atlas',width=width,height=height,alpha=True)
    image.pixels.foreach_set(pixels.ravel());image.update()
    folder=ROOT/'art/characters/textures';folder.mkdir(parents=True,exist_ok=True)
    image.filepath_raw=str(folder/'female-fringe-strands.png')
    image.file_format='PNG';image.save();image.pack()

    normal_pixels=np.ones((height,width,4),dtype=np.float32)
    nx=-np.gradient(density,axis=1)*.35
    ny=-np.gradient(density,axis=0)*.25
    length=np.sqrt(nx*nx+ny*ny+1)
    normal_pixels[:,:,0]=nx/length*.5+.5
    normal_pixels[:,:,1]=ny/length*.5+.5
    normal_pixels[:,:,2]=1/length*.5+.5
    normal_image=bpy.data.images.new('RW Female fringe fiber normal',width=width,height=height,alpha=False)
    normal_image.colorspace_settings.name='Non-Color'
    normal_image.pixels.foreach_set(normal_pixels.ravel());normal_image.update()
    normal_image.filepath_raw=str(folder/'female-fringe-normal.png')
    normal_image.file_format='PNG';normal_image.save();normal_image.pack()

    material=bpy.data.materials.new('RW Soft hair cards female fringe')
    material.use_nodes=True;material.use_backface_culling=False
    shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Roughness'].default_value=.67
    shader.inputs['Specular IOR Level'].default_value=.12
    shader.inputs['Sheen Weight'].default_value=0
    texture=material.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image
    material.node_tree.links.new(texture.outputs['Color'],shader.inputs['Base Color'])
    normal_tex=material.node_tree.nodes.new('ShaderNodeTexImage');normal_tex.image=normal_image
    normal_node=material.node_tree.nodes.new('ShaderNodeNormalMap');normal_node.inputs['Strength'].default_value=.55
    material.node_tree.links.new(normal_tex.outputs['Color'],normal_node.inputs['Color'])
    material.node_tree.links.new(normal_node.outputs['Normal'],shader.inputs['Normal'])
    clip=material.node_tree.nodes.new('ShaderNodeMath')
    operations=[item.identifier for item in clip.bl_rna.properties['operation'].enum_items]
    clip.operation=next(operation for operation in operations if operation=='GREATER_THAN')
    clip.inputs[1].default_value=.28
    material.node_tree.links.new(texture.outputs['Alpha'],clip.inputs[0])
    material.node_tree.links.new(clip.outputs[0],shader.inputs['Alpha'])
    material.diffuse_color=(.007,.004,.0025,1)

    body=next(o for o in scene.objects if o.type=='MESH' and o.name.startswith('Sam | anatomical body'))
    crown=next(o for o in scene.objects if o.name.startswith('RW Female straight crown'))
    skin=BVHTree.FromPolygons([v.co for v in body.data.vertices],[tuple(p.vertices) for p in body.data.polygons])
    cap=BVHTree.FromPolygons([v.co for v in crown.data.vertices],[tuple(p.vertices) for p in crown.data.polygons])
    def forehead(x,z):
        hit=skin.ray_cast(Vector((x,-.5,z)),Vector((0,1,0)))
        skin_y=hit[0].y if hit[0] is not None else -.04-.10*math.sqrt(max(.03,1-(x/.105)**2))
        shell_y=-.040-.127*math.sqrt(max(.015,1-(x/.102)**2-((z-1.65)/.127)**2))
        blend=smooth((1.738-z)/.078)
        y=shell_y*(1-blend)+(skin_y-.0035)*blend-.0015
        hit=cap.ray_cast(Vector((x,-.5,z)),Vector((0,1,0)))
        if hit[0] is not None:y=min(y,hit[0].y-.0017)
        return y
    verts=[];faces=[];uv=[];nu,nv=100,42
    for j in range(nv+1):
        t=j/nv
        for i in range(nu+1):
            u=i/nu;end_x=-.077+.154*u
            root_x=end_x*.40+.002*math.sin(u*7)
            root_z=1.766-.011*(abs(end_x)/.085)**1.4
            end_z=1.658+.002*math.sin(u*19)-.006*(abs(end_x)/.077)**2
            x=root_x*(1-t)**3+end_x*.80*3*(1-t)**2*t+(end_x+.002*math.sin(u*9))*3*(1-t)*t*t+end_x*t**3
            z=root_z*(1-t)**3+(root_z-.008)*3*(1-t)**2*t+(end_z+.028)*3*(1-t)*t*t+end_z*t**3
            y=forehead(x,z)-.0013*math.sin(t*math.pi)+.001*smooth((t-.84)/.16)
            verts.append((x,y,z));uv.append((u,t))
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i;faces.append((a,a+nu+1,a+nu+2,a+1))
    data=bpy.data.meshes.new('RW Female soft fringe curved veil')
    data.from_pydata(verts,[],faces);data.update();data.materials.append(material)
    layer=data.uv_layers.new(name='UVMap')
    for polygon in data.polygons:
        polygon.use_smooth=True
        for loop in polygon.loop_indices:layer.data[loop].uv=uv[data.loops[loop].vertex_index]
    obj=bpy.data.objects.new('RW Female soft fringe feathered strands',data)
    scene.collection.objects.link(obj);obj.parent=rig
    group=obj.vertex_groups.new(name='head');group.add(list(range(len(verts))),1,'REPLACE')
    modifier=obj.modifiers.new('Follow head rig','ARMATURE');modifier.object=rig
    obj['hairstyle']='curved feathered fringe, dense roots and irregular fine tips'
    print('SOFT_FRINGE_READY: curved scalp-fitted veil, 240 irregular tapered fibers, 2K alpha atlas')
    return obj

def update_existing():
    name='Rose Wishes - Female Atelier'
    if name not in bpy.data.scenes:
        with bpy.data.libraries.load(str(ROOT/'art/characters/female-grey-jeans.blend'),link=False) as (src,dst):dst.scenes=[name]
    scene=bpy.data.scenes[name];bpy.context.window.scene=scene
    return apply(scene,next(o for o in scene.objects if o.type=='ARMATURE'))

def export_current():
    scene=bpy.data.scenes['Rose Wishes - Female Atelier']
    bpy.context.window.scene=scene
    rig=next(o for o in scene.objects if o.type=='ARMATURE')
    for obj in scene.objects:obj.select_set(False)
    for obj in scene.objects:
        if obj==rig or (obj.type=='MESH' and not obj.hide_render and obj.find_armature()==rig):
            obj.hide_set(False);obj.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/characters/female-grey-jeans.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=True,export_nla_strips=True,export_apply=False)
    stage=ROOT/'.qa/characters';stage.mkdir(parents=True,exist_ok=True)
    bpy.data.libraries.write(str(stage/'female-soft-fringe.blend'),{scene},compress=True)
    print('FEMALE_SOFT_FRINGE_EXPORTED')

if __name__=='__main__':update_existing()
