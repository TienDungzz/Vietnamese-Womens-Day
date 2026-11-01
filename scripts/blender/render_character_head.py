import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
s=bpy.data.scenes['Rose Wishes - Character Atelier'];bpy.context.window.scene=s
target=Vector((0,-.045,1.765))
camera=s.camera;camera.location=target+Vector((.02,-1.05,.035));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=70
s.render.resolution_x=750;s.render.resolution_y=900;s.render.resolution_percentage=100;s.cycles.samples=32
s.render.filepath=str(root/'art/characters/male-soft73-head.png')
bpy.ops.render.render(write_still=True)
