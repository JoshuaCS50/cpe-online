"""Renders top views of the boards in Autodesk Fusion for the pinout pages.

Each board from cpe-parts.py is built alone in a new design, given Fusion
appearances by material, and saved from straight above (orthographic, framed
exactly to the board's outline, transparent background) as
public/boards/<board>-top.png, with a <board>-top.json beside it giving the
area the image covers in millimetres, so the page can put labels on the pins.
"""

import json
import os
import runpy

import adsk.core
import adsk.fusion

HERE = r"C:\Users\joshu\Downloads\CPE Online"
OUT = os.path.join(HERE, "public", "boards")
WIDTH_PX = 2400
MARGIN_MM = 1.0

app = adsk.core.Application.get()
parts = runpy.run_path(os.path.join(HERE, "scripts", "fusion", "cpe-parts.py"))

# Material name -> (library appearance to start from, colour or None to keep it).
LOOKS = {
    "pcb": ("Plastic - Matte (Blue)", (38, 104, 196)),
    "pcb-black": ("Plastic - Matte (Black)", (44, 50, 62)),
    "module-pcb": ("Plastic - Matte (Black)", (30, 44, 66)),
    "plastic-black": ("Plastic - Glossy (Black)", (34, 36, 42)),
    "chip": ("Plastic - Matte (Black)", (26, 27, 31)),
    "capacitor": ("Plastic - Matte (Black)", (52, 56, 66)),
    "metal": ("Aluminum - Satin", None),
    "gold": ("Gold - Polished", None),
    "red": ("Plastic - Glossy (Red)", (222, 64, 48)),
    "led-l": ("Plastic - Glossy (Yellow)", (236, 170, 60)),
    "led-tx": ("Plastic - Glossy (Yellow)", (220, 186, 92)),
    "led-rx": ("Plastic - Glossy (Yellow)", (220, 186, 92)),
    "led-on": ("Plastic - Glossy (Green)", (72, 184, 106)),
    "smd-dark": ("Plastic - Matte (Black)", (58, 62, 72)),
    "smd-tan": ("Plastic - Matte (Yellow)", (214, 182, 128)),
}


def appearance_for(design, material, cache):
    if material in cache:
        return cache[material]
    base_name, colour = LOOKS.get(material, ("Plastic - Matte (Gray)", None))
    library = app.materialLibraries.itemByName("Fusion Appearance Library")
    base = library.appearances.itemByName(base_name)
    look = design.appearances.addByCopy(base, "cpe " + material)
    if colour:
        prop = adsk.core.ColorProperty.cast(look.appearanceProperties.itemByName("Color"))
        if prop:
            prop.value = adsk.core.Color.create(colour[0], colour[1], colour[2], 255)
    cache[material] = look
    return look


def render(board, build):
    document = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
    document.name = "CPE pinout render: " + board
    design = adsk.fusion.Design.cast(app.activeProduct)
    design.designType = adsk.fusion.DesignTypes.DirectDesignType
    root = design.rootComponent
    cache = {}
    for material, temporary in build():
        body = root.bRepBodies.add(temporary)
        body.name = material
        body.appearance = appearance_for(design, material, cache)

    box = root.boundingBox
    x0, y0 = box.minPoint.x * 10 - MARGIN_MM, box.minPoint.y * 10 - MARGIN_MM
    x1, y1 = box.maxPoint.x * 10 + MARGIN_MM, box.maxPoint.y * 10 + MARGIN_MM
    width_mm, height_mm = x1 - x0, y1 - y0

    viewport = app.activeViewport
    viewport.visualStyle = adsk.core.VisualStyles.ShadedWithVisibleEdgesOnlyVisualStyle
    camera = viewport.camera
    camera.cameraType = adsk.core.CameraTypes.OrthographicCameraType
    camera.isSmoothTransition = False
    centre = adsk.core.Point3D.create((x0 + x1) / 20, (y0 + y1) / 20, 0)
    camera.target = centre
    camera.eye = adsk.core.Point3D.create(centre.x, centre.y, 50)
    camera.upVector = adsk.core.Vector3D.create(0, 1, 0)
    viewport.camera = camera
    # The extents only stick on the viewport's own camera, after it is set up.
    camera = viewport.camera
    camera.setExtents(width_mm / 10, height_mm / 10)
    viewport.camera = camera
    viewport.refresh()
    _ok, seen_w, seen_h = viewport.camera.getExtents()
    print(board, "camera sees", round(seen_w * 10, 2), "x", round(seen_h * 10, 2), "mm")

    os.makedirs(OUT, exist_ok=True)
    options = adsk.core.SaveImageFileOptions.create(os.path.join(OUT, board + "-top.png"))
    options.width = WIDTH_PX
    options.height = round(WIDTH_PX * height_mm / width_mm)
    options.isBackgroundTransparent = True
    options.isAntiAliased = True
    viewport.saveAsImageFileWithOptions(options)
    with open(os.path.join(OUT, board + "-top.json"), "w", encoding="utf-8") as file:
        json.dump({"x0": round(x0, 2), "y0": round(y0, 2), "x1": round(x1, 2), "y1": round(y1, 2), "width": options.width, "height": options.height}, file)
    print(board, round(width_mm, 1), "x", round(height_mm, 1), "mm ->", options.width, "x", options.height)


def run(_context: str):
    render("uno", parts["build_uno"])
    render("esp32", parts["build_esp32"])
