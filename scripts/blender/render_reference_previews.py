import bpy,runpy
from pathlib import Path
root=Path(__file__).resolve().parents[2]
s=bpy.data.scenes['Rose Wishes - Character Atelier'];bpy.context.window.scene=s
s.render.filepath=str(root/'art/characters/male-reference-v4-preview.png')
bpy.ops.render.render(write_still=True)
runpy.run_path(str(root/'scripts/blender/render_character_head.py'),run_name='__main__')
