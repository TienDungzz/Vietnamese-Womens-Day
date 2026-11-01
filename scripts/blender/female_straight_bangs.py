"""Shoulder-length straight hair, inward tips and airy brow-length fringe."""
import bpy, math, random, json
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]

def apply(scene,rig):
    for o in list(scene.objects):
        if o.name.startswith(('RW Female parted hair','RW Female long wavy','RW Female flowing hair','RW Female swept part','RW Female straight','RW Female airy')):
            bpy.data.objects.remove(o,do_unlink=True)
    for m in list(bpy.data.materials):
        if m.name.startswith(('RW Female espresso waves','RW Female straight','RW Soft hair cards female')) and m.users==0:bpy.data.materials.remove(m)
    rng=random.Random(201001)
    # Subtle dark-brown fiber color; the wispy fringe is actual geometry.
    w,h=512,1024;u,v=np.meshgrid(np.linspace(0,1,w),np.linspace(0,1,h));density=np.zeros((h,w),dtype=np.float32)
    for i in range(58):
        center=(i+.5)/58+rng.uniform(-.003,.003);phase=rng.random()*math.tau;end=rng.uniform(.86,1)
        curve=center+.0018*np.sin(v*4+phase)
        width=rng.uniform(.0037,.0052)*np.sqrt(np.clip((end-v)/.17,.01,1))
        density+=np.exp(-((u-curve)/width)**2)*np.clip((end-v)*48,0,1)*np.clip(v*40,0,1)
    alpha=1-np.exp(-density*3.4)
    pixels=np.ones((h,w,4),dtype=np.float32);value=.085+.008*np.sin(u*math.pi*89)+.003*np.sin(v*4+u*11)
    pixels[:,:,0]=value;pixels[:,:,1]=value*.69;pixels[:,:,2]=value*.48;pixels[:,:,3]=1
    image=bpy.data.images.new('RW Female straight fiber atlas',width=w,height=h,alpha=True);image.pixels.foreach_set(pixels.ravel())
    folder=ROOT/'art/characters/textures';folder.mkdir(parents=True,exist_ok=True)
    image.filepath_raw=str(folder/'female-straight-strands.png');image.file_format='PNG';image.save();image.pack()
    def material(name,texture=False):
        m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(.02,.012,.008,1);m.use_backface_culling=False
        bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Base Color'].default_value=(.02,.012,.008,1);bs.inputs['Roughness'].default_value=.73;bs.inputs['Specular IOR Level'].default_value=.10
        if bs.inputs.get('Sheen Weight'):bs.inputs['Sheen Weight'].default_value=0
        if texture:
            tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        return m
    base=material('RW Female straight undercoat',True);strands=material('RW Female straight fiber detail')
    def mesh(name,verts,faces,uv,mat):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();layer=data.uv_layers.new(name='UVMap')
        for p in data.polygons:
            p.use_smooth=True
            for i in p.loop_indices:layer.data[i].uv=uv[data.loops[i].vertex_index]
        o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);data.materials.append(mat);o.parent=rig
        group=o.vertex_groups.new(name='head');group.add(list(range(len(verts))),1,'REPLACE');mod=o.modifiers.new('Follow head rig','ARMATURE');mod.object=rig;return o
    def smooth(t):
        t=max(0,min(1,t));return t*t*(3-2*t)
    # Soft rounded crown, open above the forehead. Crown fibers hide the shell edge.
    verts=[];faces=[];uv=[];nu,nv=80,28
    for j in range(nv+1):
        for i in range(nu+1):
            a=i/nu*math.tau;front=max(0,math.cos(a));p=.012+j/nv*(1.1-.13*front**3-.012)
            verts.append((.100*math.sin(p)*math.sin(a),-.040-.125*math.sin(p)*math.cos(a),1.65+.125*math.cos(p)))
            uv.append((i/nu*5,j/nv))
    for j in range(nv):
        for i in range(nu):q=j*(nu+1)+i;faces.append((q,q+nu+1,q+nu+2,q+1))
    mesh('RW Female straight crown',verts,faces,uv,base)
    def curtain(a,t,offset=0):
        curl=smooth((t-.78)/.22);p=1.1-.13*max(0,math.cos(a))**3;rx=.100*math.sin(p)+.035*smooth(t)-.013*curl;ry=.125*math.sin(p)+.032*smooth(t)-.012*curl
        length=.407+.025*max(0,math.cos(a))+.008*math.sin(a*3)
        return Vector(((rx+offset)*math.sin(a),-.038-(ry+offset)*math.cos(a),1.65+.125*math.cos(p)-t*length+.008*math.sin(a*5)*t**8))
    verts=[];faces=[];uv=[];nu,nv=100,45;lo=.70;hi=math.tau-.70
    for j in range(nv+1):
        for i in range(nu+1):
            a=lo+(hi-lo)*i/nu;verts.append(tuple(curtain(a,j/nv)));uv.append((i/nu,j/nv))
    for j in range(nv):
        for i in range(nu):q=j*(nu+1)+i;faces.append((q,q+nu+1,q+nu+2,q+1))
    shell=mesh('RW Female straight shoulder curtain',verts,faces,uv,base)
    solid=shell.modifiers.new('Thin closed hair edge','SOLIDIFY');solid.thickness=.0015
    def fibers(name,paths):
        verts=[];faces=[];uv=[];sides=5
        for points,radii in paths:
            start=len(verts)
            for j,p in enumerate(points):
                tangent=(points[min(j+1,len(points)-1)]-points[max(j-1,0)]).normalized();cross=tangent.cross(Vector((0,1,0))).normalized();normal=tangent.cross(cross).normalized()
                for k in range(sides):
                    a=k/sides*math.tau;q=p+radii[j]*(cross*math.cos(a)+normal*math.sin(a));verts.append(tuple(q));uv.append((k/sides,j/(len(points)-1)))
            for j in range(len(points)-1):
                for k in range(sides):q=start+j*sides+k;r=start+j*sides+(k+1)%sides;faces.append((q,r,r+sides,q+sides))
        return mesh(name,verts,faces,uv,strands)
    lengths=[]
    for k in range(210):
        a=lo+(hi-lo)*k/209+rng.uniform(-.003,.003);radius=rng.uniform(.00023,.00038)
        points=[curtain(a,j/32,.001) for j in range(33)];radii=[radius*(1-.93*(j/32)**9) for j in range(33)];lengths.append((points,radii))
    for k in range(64):
        a=k/64*math.tau;end=1.1-.13*max(0,math.cos(a))**3;points=[]
        for j in range(29):
            p=.025+j/28*(end-.025);points.append(Vector((.101*math.sin(p)*math.sin(a),-.04-.126*math.sin(p)*math.cos(a),1.65+.126*math.cos(p))))
        lengths.append((points,[.00024]*29))
    fibers('RW Female straight fine fibers',lengths)
    fringe=[]
    for k in range(84):
        x=-.069+k/83*.138+rng.uniform(-.00065,.00065);end=1.656+rng.uniform(0,.015)-.001*(abs(x)/.07)
        a=Vector((x*.72,-.104,1.742-.012*(abs(x)/.07)));b=Vector((x*.95,-.143,1.724));c=Vector((x,-.159,1.687));d=Vector((x+rng.uniform(-.002,.002),-.151,end));points=[];radii=[];radius=rng.uniform(.00045,.00072)
        for j in range(29):
            t=j/28;points.append(a*(1-t)**3+b*3*(1-t)**2*t+c*3*(1-t)*t*t+d*t**3);radii.append(radius*(.75+.25*math.sin(t*math.pi))*max(.025,(1-t)**.65))
        fringe.append((points,radii))
    o=fibers('RW Female airy fringe',fringe);o['hairstyle']='straight shoulder length with geometric wispy bangs';o['interactive']=False
    print('STRAIGHT_HAIR_READY: shoulder length, inward tips, airy fringe above eyelashes')

def update_existing():
    scene=bpy.data.scenes.get('Rose Wishes - Female Atelier')
    if scene is None:
        with bpy.data.libraries.load(str(ROOT/'art/characters/female-grey-jeans.blend'),link=False) as (src,dst):dst.scenes=['Rose Wishes - Female Atelier']
        scene=dst.scenes[0]
    bpy.context.window.scene=scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
    # Appending creates an unused source-library ID; do not save a self reference.
    source_path=(ROOT/'art/characters/female-grey-jeans.blend').resolve()
    for lib in list(bpy.data.libraries):
        if Path(bpy.path.abspath(lib.filepath)).resolve()==source_path and not bpy.data.user_map(subset={lib}).get(lib):bpy.data.libraries.remove(lib)
    apply(scene,rig)
    for o in scene.objects:o.select_set(False)
    for o in scene.objects:
        if o==rig or (o.type=='MESH' and not o.hide_render and o.find_armature()==rig):o.hide_set(False);o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/characters/female-grey-jeans.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=True,export_nla_strips=True,export_apply=False)
    stage=ROOT/'.qa/characters';stage.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(stage/'female-hair-update.blend'),copy=True,compress=True)
    print('FEMALE_HAIR_UPDATE_EXPORTED')

if __name__=='__main__':update_existing()
