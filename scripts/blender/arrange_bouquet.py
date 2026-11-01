"""Apply the shared hand-arranged layout and rebuild gap-constrained accents."""
import bpy, importlib.util, json
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT=Path(__file__).resolve().parents[2]

def load_module(name,path):
    spec=importlib.util.spec_from_file_location(name,str(path));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def remove_tree(obj):
    for child in list(obj.children):remove_tree(child)
    bpy.data.objects.remove(obj,do_unlink=True)

def run():
    if 'Rose Wishes - Bouquet Atelier' not in bpy.data.scenes:
        with bpy.data.libraries.load(str(ROOT/'art/bouquet/rose-wishes-bouquet.blend'),link=False) as (src,dst):
            dst.scenes=[n for n in src.scenes if n.startswith('Rose Wishes -')]
    m=load_module('rw_arrangement_builder',ROOT/'scripts/blender/build_bouquet.py')
    s=bpy.data.scenes['Rose Wishes - Bouquet Atelier'];assets=bpy.data.scenes['Rose Wishes - Asset Masters']
    root=next(o for o in s.objects if o.type=='EMPTY' and not o.parent and o.name.startswith('Rose Wishes -'))
    bpy.context.window.scene=s
    for child in list(root.children):
        if not child.name.startswith('rose-') or int(child.name.split('-')[1])>10:remove_tree(child)
    root.name='Rose Wishes - 10 Roses';root['interactive_rose_count']=10
    flowers=json.loads((ROOT/'src/data/bouquet-layout.json').read_text(encoding='utf-8'))
    for i,f in enumerate(flowers):
        flower=next(o for o in root.children if o.name==f'rose-{i+1:02d}')
        flower.location=m.W(f['position']);flower.scale=(f['size'],)*3;flower.rotation_mode='QUATERNION'
        flower.rotation_quaternion=Vector((0,-1,0)).rotation_difference(Vector(m.W(f['direction'])).normalized()) @ Quaternion((0,-1,0),f['twist'])
    for o in list(assets.objects):
        if not o.name.startswith('Rose_'):bpy.data.objects.remove(o,do_unlink=True)
    m.C.update(atelier=s,assets=assets,root=root)
    for key,name in {'leaf':'RW_Leaf_Cuticle','stem':'RW_Stem','paper_ivory':'RW_Paper_Ivory','paper_blush':'RW_Paper_Blush','paper_tissue':'RW_Paper_Tissue','satin':'RW_Satin_DustyRose'}.items():m.C[key]=bpy.data.materials[name]
    m.accessories();m.export_accessories()
    for template in m.C['accessories']:
        o=template.copy();s.collection.objects.link(o);o.parent=root
    fillers=load_module('rw_arrangement_fillers',ROOT/'scripts/blender/build_fillers.py');fillers.build(m)
    bpy.context.window.scene=s
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/bouquet/rose-wishes-natural.blend'),compress=True,copy=True)
    print('HAND_ARRANGED_TEN_ROSES_READY')

if __name__=='__main__':run()
