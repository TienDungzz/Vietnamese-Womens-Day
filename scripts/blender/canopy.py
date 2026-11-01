"""Conservative rose silhouettes used to keep decorative heads out of roses."""
import math
import numpy as np

def hull(points):
    points=sorted(set(points))
    def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];hi=[]
    for p in points:
        while len(lo)>1 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
        lo.append(p)
    for p in reversed(points):
        while len(hi)>1 and cross(hi[-2],hi[-1],p)<=0:hi.pop()
        hi.append(p)
    return lo[:-1]+hi[:-1]

def rose_hulls(m):
    m.bpy.context.window.scene=m.C['atelier'];m.bpy.context.view_layer.update()
    result=[]
    for parent in m.C['root'].children:
        if not parent.name.startswith('rose-'):continue
        points=[]
        for o in parent.children:
            if 'Petals' not in o.name:continue
            for v in list(o.data.vertices)[::4]:
                p=o.matrix_world@v.co;points.append((float(p.x),float(-p.y)))
        result.append(hull(points))
    return result

def clearance(x,z,hulls):
    closest=100.
    for h in hulls:
        inside=True;distance=100.
        for a,b in zip(h,h[1:]+h[:1]):
            dx=b[0]-a[0];dz=b[1]-a[1]
            if dx*(z-a[1])-dz*(x-a[0])<0:inside=False
            t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
            distance=min(distance,math.hypot(x-a[0]-t*dx,z-a[1]-t*dz))
        if inside:return -distance
        closest=min(closest,distance)
    return closest

def coverage(hulls,radius=1.04):
    x,z=np.meshgrid(np.linspace(-radius,radius,220),np.linspace(-radius*.92,radius*.92,220))
    opening=x*x+(z/.92)**2<=radius*radius
    occupied=np.zeros(x.shape,dtype=bool)
    for h in hulls:
        inside=np.ones(x.shape,dtype=bool)
        for a,b in zip(h,h[1:]+h[:1]):inside&=(b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])>=0
        occupied|=inside
    return float((occupied&opening).sum()/opening.sum())
