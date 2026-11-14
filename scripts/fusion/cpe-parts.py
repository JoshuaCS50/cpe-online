"""Builds the virtual board and its parts in Autodesk Fusion, then writes
every body's triangle mesh to one JSON file for scripts/pack-models.mjs.

Run it in Fusion (Utilities > Scripts and Add-ins, or through the Fusion MCP).
It opens a new design, so nothing in an open design is touched.

All parts are original designs at real-world sizes: an UNO-style board (our
own layout and markings), a half breadboard, a 5 mm LED, a resistor, a micro
servo and its horn, a buzzer, a knob and a push button.

Coordinates in this file are millimetres, Z up. Each part has its own origin:
  uno          board corner; x along the long edge, y from the digital header edge
  esp32        board corner at the bottom of the header pins; USB at x = 0
  breadboard   corner, top at z = 8.5
  led          centre of the flange's base; legs go below z = 0
  resistor     centre, lying along y; z = 0 is the surface it stands on
  servo        centre of the base; the shaft is at x = 5.5
  servo-horn   centre of the hub's base; the arm points along +y
  buzzer, knob, button   centre of the base
  knob-cap, button-cap   centre of the base; the pointer of knob-cap points along +y
Each body is named after its material; the packer colours by that name.
"""

import json
import math
import os

import adsk.core
import adsk.fusion

OUT = os.path.join(os.path.expanduser("~"), "cpe-parts-raw.json")

app = adsk.core.Application.get()
tb = adsk.fusion.TemporaryBRepManager.get()
CM = 0.1  # Fusion's API works in centimetres
UNION = adsk.fusion.BooleanTypes.UnionBooleanType
CUT = adsk.fusion.BooleanTypes.DifferenceBooleanType


def P(x, y, z):
    return adsk.core.Point3D.create(x * CM, y * CM, z * CM)


def box(x0, y0, z0, x1, y1, z1):
    centre = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    obb = adsk.core.OrientedBoundingBox3D.create(
        centre, adsk.core.Vector3D.create(1, 0, 0), adsk.core.Vector3D.create(0, 1, 0),
        abs(x1 - x0) * CM, abs(y1 - y0) * CM, abs(z1 - z0) * CM)
    return tb.createBox(obb)


def cyl(a, b, r, r2=None):
    return tb.createCylinderOrCone(P(*a), r * CM, P(*b), (r if r2 is None else r2) * CM)


def zcyl(x, y, z0, z1, r):
    return cyl((x, y, z0), (x, y, z1), r)


def sphere(c, r):
    return tb.createSphere(P(*c), r * CM)


def join(first, *others):
    for other in others:
        tb.booleanOperation(first, other, UNION)
    return first


def minus(body, *tools):
    for tool in tools:
        tb.booleanOperation(body, tool, CUT)
    return body


def rounded_box(x0, y0, z0, x1, y1, z1, r):
    """A box with rounded vertical edges."""
    return join(
        box(x0 + r, y0, z0, x1 - r, y1, z1), box(x0, y0 + r, z0, x1, y1 - r, z1),
        zcyl(x0 + r, y0 + r, z0, z1, r), zcyl(x1 - r, y0 + r, z0, z1, r),
        zcyl(x0 + r, y1 - r, z0, z1, r), zcyl(x1 - r, y1 - r, z0, z1, r))


def stadium(cx, cy, z0, z1, length, width):
    """A slot shape along x, like a crystal's can."""
    r = width / 2
    return join(box(cx - length / 2 + r, cy - r, z0, cx + length / 2 - r, cy + r, z1),
                zcyl(cx - length / 2 + r, cy, z0, z1, r), zcyl(cx + length / 2 - r, cy, z0, z1, r))


# ───── The board (UNO-style layout, 68.6 x 53.3 mm) ─────

PITCH = 2.54
TOP = 1.6
HEADERS = [  # first socket's x, y, number of sockets
    (17.8, 2.5, 10), (45.0, 2.5, 8), (27.0, 50.8, 8), (50.0, 50.8, 6),
]
MOUNT_HOLES = [(14, 2.6), (15.3, 50.7), (66.1, 7.6), (66.1, 35.5)]


def build_uno():
    bodies = []
    add = lambda material, body: bodies.append((material, body))

    pcb = rounded_box(0, 0, 0, 68.6, 53.3, TOP, 2.6)
    minus(pcb, *[zcyl(x, y, -1, 3, 1.6) for x, y in MOUNT_HOLES])
    add("pcb", pcb)
    for x, y in MOUNT_HOLES:
        ring = minus(zcyl(x, y, TOP, TOP + 0.05, 2.6), zcyl(x, y, TOP - 1, TOP + 1, 1.6))
        add("metal", ring)

    for x0, y, count in HEADERS:
        start = x0 - PITCH / 2
        header = box(start, y - 1.27, TOP, start + count * PITCH, y + 1.27, TOP + 8.5)
        minus(header, *[box(x0 + i * PITCH - 0.5, y - 0.5, TOP + 3, x0 + i * PITCH + 0.5, y + 0.5, TOP + 9) for i in range(count)])
        add("plastic-black", header)
        for i in range(count):
            add("gold", box(x0 + i * PITCH - 0.35, y - 0.35, TOP + 2.6, x0 + i * PITCH + 0.35, y + 0.35, TOP + 3.2))

    # USB-B socket: a metal shell with a plastic tongue.
    shell = minus(box(-6.2, 8, TOP, 10, 20, TOP + 11), box(-6.5, 9.2, TOP + 1.2, 2, 18.8, TOP + 9.8))
    add("metal", shell)
    add("plastic-black", box(-5.6, 11.5, TOP + 3.6, 2.2, 16.5, TOP + 7.4))

    # Power jack with its centre pin.
    jack = minus(box(-4, 38.5, TOP, 10, 47.5, TOP + 11), cyl((-4.5, 43, TOP + 6), (6, 43, TOP + 6), 3.1))
    add("plastic-black", jack)
    add("metal", cyl((-3, 43, TOP + 6), (6.5, 43, TOP + 6), 1.0))

    # Reset button.
    add("metal", box(3, 1.6, TOP, 9, 7.6, TOP + 1.8))
    add("red", zcyl(6, 4.6, TOP + 1.8, TOP + 3.4, 1.75))

    # The microcontroller in its socket.
    add("plastic-black", box(28.75, 32.5, TOP, 65.25, 41.5, TOP + 1.2))
    chip = box(29.5, 33.3, TOP + 1.2, 64.5, 40.7, TOP + 4.4)
    minus(chip, zcyl(29.5, 37, TOP + 3.9, TOP + 5, 1.0), zcyl(31.5, 34.8, TOP + 4.2, TOP + 5, 0.5))
    add("chip", chip)
    for i in range(14):
        x = 30.5 + i * PITCH
        add("metal", box(x - 0.3, 32.6, TOP + 1.0, x + 0.3, 33.3, TOP + 3.2))
        add("metal", box(x - 0.3, 40.7, TOP + 1.0, x + 0.3, 41.4, TOP + 3.2))

    # Crystal, USB chip, regulator, capacitors.
    add("metal", stadium(20, 28, TOP, TOP + 3.5, 11, 4.6))
    add("chip", box(15.5, 11.5, TOP, 22.5, 18.5, TOP + 1.0))
    add("chip", box(6.25, 29, TOP, 12.75, 35, TOP + 2.3))
    add("metal", box(6.75, 26.5, TOP, 12.25, 29.2, TOP + 0.5))
    for x in (15.5, 22):
        add("capacitor", zcyl(x, 47.6, TOP, TOP + 6.8, 3))
        add("metal", zcyl(x, 47.6, TOP + 6.8, TOP + 7.0, 2.7))

    # 2x3 programming header.
    add("plastic-black", box(61.86, 23.4, TOP, 66.94, 31.02, TOP + 2.5))
    for px in (63.13, 65.67):
        for py in (24.66, 27.2, 29.74):
            add("gold", box(px - 0.32, py - 0.32, TOP, px + 0.32, py + 0.32, TOP + 8.5))

    # Surface LEDs: L (pin 13), TX, RX, ON. Their names let the viewer light them.
    add("led-l", box(30.2, 8.15, TOP, 31.8, 9.05, TOP + 0.8))
    add("led-tx", box(30.2, 10.65, TOP, 31.8, 11.55, TOP + 0.8))
    add("led-rx", box(30.2, 13.05, TOP, 31.8, 13.95, TOP + 0.8))
    add("led-on", box(57.2, 21.55, TOP, 58.8, 22.45, TOP + 0.8))

    # Small surface parts.
    for x, y, w, d, h, material in [
        (25, 14, 2, 1.2, 0.6, "smd-tan"), (25, 16.5, 2, 1.2, 0.6, "smd-tan"), (36, 12, 1.6, 0.8, 0.5, "smd-tan"),
        (38.4, 12, 1.6, 0.8, 0.5, "smd-tan"), (52, 26, 2, 1.2, 0.8, "smd-dark"), (55, 30, 2, 1.2, 0.6, "smd-tan"),
        (12, 19, 3.5, 2.8, 1.2, "smd-dark"), (26, 24, 2, 1.2, 0.6, "smd-tan"), (60, 12, 1.6, 0.8, 0.5, "smd-tan"),
        (44, 46, 2, 1.2, 0.8, "smd-dark"), (40, 44, 3, 1.6, 1.0, "smd-dark"), (26, 30, 1.6, 0.8, 0.5, "smd-tan"),
    ]:
        add(material, box(x, y, TOP, x + w, y + d, TOP + h))
    return bodies


# ───── ESP32 DevKit (our own 38-pin layout, 54.4 x 27.9 mm) ─────
# Origin: board corner at the bottom of the header pins. Two rows of 19 male
# pins, 25.4 mm apart; the PCB sits on plastic spacers above them.

ESP_PCB_Z = 8.5
ESP_TOP = ESP_PCB_Z + 1.6
ESP_ROWS = (1.27, 26.67)
ESP_PIN_X0 = 4.6


def build_esp32():
    bodies = []
    add = lambda material, body: bodies.append((material, body))

    add("pcb-black", rounded_box(0, 0, ESP_PCB_Z, 54.4, 27.9, ESP_TOP, 1.0))
    for y in ESP_ROWS:
        add("plastic-black", box(ESP_PIN_X0 - 1.27, y - 1.27, 6, ESP_PIN_X0 + 18 * PITCH + 1.27, y + 1.27, ESP_PCB_Z))
        for i in range(19):
            x = ESP_PIN_X0 + i * PITCH
            add("gold", box(x - 0.32, y - 0.32, 0, x + 0.32, y + 0.32, ESP_TOP + 1.0))
            # Square pads: round ones would triple the size of the packed model.
            add("metal", box(x - 0.8, y - 0.8, ESP_TOP, x + 0.8, y + 0.8, ESP_TOP + 0.05))

    # The radio module: its own small board, a metal can, and the antenna end.
    add("module-pcb", box(29.0, 4.95, ESP_TOP, 54.4, 22.95, ESP_TOP + 0.8))
    add("metal", box(29.5, 5.5, ESP_TOP + 0.8, 47.4, 22.4, ESP_TOP + 3.1))

    # Micro-USB socket at the other end.
    usb = minus(box(-1.0, 10.2, ESP_TOP, 4.5, 17.7, ESP_TOP + 2.8), box(-1.5, 10.8, ESP_TOP + 0.5, 1.5, 17.1, ESP_TOP + 2.3))
    add("metal", usb)
    add("plastic-black", box(-0.8, 12.2, ESP_TOP + 1.1, 1.6, 15.7, ESP_TOP + 1.6))

    # USB-serial chip and voltage regulator.
    add("chip", box(13, 11.5, ESP_TOP, 18, 16.5, ESP_TOP + 0.9))
    add("chip", box(19, 3.2, ESP_TOP, 25.5, 6.7, ESP_TOP + 1.6))
    add("metal", box(20.5, 6.7, ESP_TOP, 24, 8.4, ESP_TOP + 0.3))

    # EN and BOOT buttons.
    for y0 in (3.4, 21.0):
        add("metal", box(4.8, y0, ESP_TOP, 9.0, y0 + 3.5, ESP_TOP + 1.5))
        add("plastic-black", box(5.9, y0 + 1.0, ESP_TOP + 1.5, 7.9, y0 + 2.5, ESP_TOP + 2.3))

    # Power LED and the blue LED on GPIO 2.
    add("led-on", box(21, 21.3, ESP_TOP, 22.6, 22.1, ESP_TOP + 0.6))
    add("led-l", box(21, 18.5, ESP_TOP, 22.6, 19.3, ESP_TOP + 0.6))

    for x, y, w, d, h, material in [
        (10.5, 12, 1.6, 0.8, 0.5, "smd-tan"), (10.5, 14.5, 1.6, 0.8, 0.5, "smd-tan"), (19.5, 12.5, 2, 1.2, 0.8, "smd-dark"),
        (24, 13, 1.6, 0.8, 0.5, "smd-tan"), (26, 9, 1.6, 0.8, 0.5, "smd-tan"), (26, 18, 1.6, 0.8, 0.5, "smd-tan"),
        (12, 20, 3.2, 1.6, 1.0, "smd-dark"), (12, 6, 3.2, 1.6, 1.0, "smd-dark"),
    ]:
        add(material, box(x, y, ESP_TOP, x + w, y + d, ESP_TOP + h))
    return bodies


# ───── Parts around the board ─────

def build_breadboard():
    body = rounded_box(0, 0, 0, 82.5, 54.6, 8.5, 1.0)
    minus(body, box(-1, 26.3, 7.2, 83.5, 28.3, 9), box(-1, 7.9, 8.1, 83.5, 8.5, 9), box(-1, 46.1, 8.1, 83.5, 46.7, 9))
    return [("breadboard", body)]


def build_breadboard_full():
    """An 830-hole breadboard: 63 columns, two halves of five rows, rails on both sides."""
    body = rounded_box(0, 0, 0, 165.1, 54.6, 8.5, 1.0)
    minus(body, box(-1, 26.3, 7.2, 166.1, 28.3, 9), box(-1, 7.9, 8.1, 166.1, 8.5, 9), box(-1, 46.1, 8.1, 166.1, 46.7, 9))
    return [("breadboard", body)]


def build_ldr():
    """A light-dependent resistor: a flat disc on two legs. The squiggle is drawn by the viewer."""
    disc = zcyl(0, 0, 0, 2.0, 2.6)
    return [
        ("ldr", disc),
        ("metal", box(-1.52, -0.25, -6, -1.02, 0.25, 0)),
        ("metal", box(1.02, -0.25, -6, 1.52, 0.25, 0)),
    ]


def build_rgb_led():
    """A 5 mm RGB LED with a milky lens and four legs (red, common, green, blue)."""
    flange = zcyl(0, 0, 0, 1, 2.9)
    dome = minus(sphere((0, 0, 6), 2.5), box(-3, -3, 3, 3, 3, 6))
    body = join(flange, zcyl(0, 0, 1, 6, 2.5), dome)
    bodies = [("led-milky", body)]
    for x, bottom in ((-3.81, -6), (-1.27, -7.5), (1.27, -6), (3.81, -6)):
        bodies.append(("metal", box(x - 0.25, -0.25, bottom, x + 0.25, 0.25, 0)))
    return bodies


def obox(cx, cy, z0, z1, length, width, angle):
    """A box rotated about Z by `angle` radians around its centre (for fan blades)."""
    centre = P(cx, cy, (z0 + z1) / 2)
    along = adsk.core.Vector3D.create(math.cos(angle), math.sin(angle), 0)
    across = adsk.core.Vector3D.create(-math.sin(angle), math.cos(angle), 0)
    obb = adsk.core.OrientedBoundingBox3D.create(centre, along, across, length * CM, width * CM, abs(z1 - z0) * CM)
    return tb.createBox(obb)


def three_legs(spacing, bottom=-6):
    return [("metal", box(x - 0.25, -0.25, bottom, x + 0.25, 0.25, 0)) for x in (-spacing, 0, spacing)]


def build_tmp36():
    """TMP36 in a TO-92 package: a half-round body, flat side facing -y, three legs."""
    body = minus(zcyl(0, 0, 0, 4.7, 2.4), box(-3, -3, -1, 3, -1.0, 6))
    return [("plastic-black", body)] + three_legs(1.27)


def build_tip120():
    """TIP120 Darlington in a TO-220 package: black body, metal tab with a hole, three legs."""
    tab = minus(box(-5, 0.2, 9, 5, 1.5, 15.5), cyl((0, -1, 12.6), (0, 3, 12.6), 1.8))
    return [("plastic-black", box(-5, -2.25, 0, 5, 2.25, 9)), ("metal", tab)] + three_legs(2.54)


def build_motor():
    """A small DC motor standing on its end, shaft up."""
    return [
        ("metal", zcyl(0, 0, 0, 25, 10)),
        ("motor-cap", zcyl(0, 0, 25, 27, 9)),
        ("metal", zcyl(0, 0, 27, 32, 1.0)),
        ("gold", box(-4, -1.5, 0, -2, 1.5, -3)),
        ("gold", box(2, -1.5, 0, 4, 1.5, -3)),
    ]


def build_fan():
    """Three fan blades on a hub; it turns about its origin."""
    hub = zcyl(0, 0, 0, 4, 3.5)
    for i in range(3):
        angle = i * 2 * math.pi / 3
        join(hub, obox(12 * math.cos(angle), 12 * math.sin(angle), 1, 2.4, 20, 8, angle + 0.25))
    return [("fan", hub)]


def build_stepper():
    """A 28BYJ-48 stepper: round body, blue cap, mounting ears, shaft up at its centre."""
    body = join(zcyl(0, 0, 0, 19, 14), box(-17.5, -3.5, 17, 17.5, 3.5, 18))
    minus(body, zcyl(-15.5, 0, 16, 19, 2.1), zcyl(15.5, 0, 16, 19, 2.1))
    return [("metal", body), ("stepper-cap", box(-8, 12, 2, 8, 17, 17)), ("metal", zcyl(0, 0, 19, 21, 4.5)), ("gold", zcyl(0, 0, 21, 29, 2.5))]


def build_wheel():
    """A prize wheel for the stepper's shaft; the segments are drawn by the viewer."""
    return [("white", zcyl(0, 0, 0, 2, 26)), ("red", box(-1.5, 22, 2, 1.5, 30, 3.5))]


def build_uln2003():
    """A ULN2003 driver board: the chip, four red LEDs, inputs on one edge."""
    bodies = [("pcb-green", rounded_box(0, 0, 0, 35, 32, 1.6, 1.0)), ("chip", box(9, 9, 1.6, 26, 16, 5.2))]
    for i in range(4):
        bodies.append(("led-red", box(10 + i * 4.6, 22, 1.6, 12.4 + i * 4.6, 24, 2.6)))
    for i in range(6):
        bodies.append(("gold", box(3 + i * 2.54 - 0.32, 2.5 - 0.32, 1.6, 3 + i * 2.54 + 0.32, 2.5 + 0.32, 8)))
    bodies.append(("plastic-black", box(1.7, 1.2, 1.6, 17.5, 3.8, 4.1)))
    return bodies


def build_hcsr04():
    """An HC-SR04 ultrasonic sensor lying face up: board, two transducers, four pins."""
    bodies = [("pcb", box(-22.5, -10, 0, 22.5, 10, 1.6))]
    for x in (-13, 13):
        bodies.append(("metal", zcyl(x, 0, 1.6, 13.6, 8)))
        bodies.append(("mesh", zcyl(x, 0, 13.6, 13.8, 6.6)))
    bodies.append(("metal", stadium(0, 6, 1.6, 4.6, 10, 3.6)))
    for i in range(4):
        x = -3.81 + i * 2.54
        bodies.append(("gold", box(x - 0.32, -10 - 6, 0.5, x + 0.32, -10, 1.1)))
    return bodies


def build_oled():
    """A 0.96 inch I2C OLED module lying face up: board, glass, four pins along the top."""
    bodies = [("pcb", rounded_box(-13.5, -13.75, 0, 13.5, 13.75, 1.6, 1.0)), ("screen", box(-13, -9.5, 1.6, 13, 9.5, 2.8))]
    for i in range(4):
        x = -3.81 + i * 2.54
        bodies.append(("gold", zcyl(x, 11.6, 1.6, 2.2, 0.8)))
    return bodies


def build_fsr():
    """A round force-sensing resistor (FSR 402): the pad and its flat tail."""
    return [
        ("fsr", zcyl(0, 0, 0, 0.5, 9.5)),
        ("fsr-ring", minus(zcyl(0, 0, 0.5, 0.6, 9.5), zcyl(0, 0, 0, 1, 7))),
        ("fsr", box(-3, -42, 0, 3, -8, 0.3)),
        ("metal", box(-2.2, -48, 0, -1.2, -42, 0.4)),
        ("metal", box(1.2, -48, 0, 2.2, -42, 0.4)),
    ]


def build_soil_sensor():
    """A capacitive soil-moisture sensor, lying flat: the probe points along -y."""
    probe = box(-11.5, -80, 0, 11.5, 18, 1.6)
    minus(probe, obox(-15, -82, -1, 3, 10, 14, 0.8), obox(15, -82, -1, 3, 10, 14, -0.8))
    return [("pcb-black", probe), ("chip", box(-6, 2, 1.6, 6, 12, 3.4)), ("plastic-white", box(-5, 13, 1.6, 5, 18, 7))]


def build_led():
    flange = zcyl(0, 0, 0, 1, 2.9)
    minus(flange, box(2.4, -3, -0.1, 3.5, 3, 1.1))
    dome = minus(sphere((0, 0, 6), 2.5), box(-3, -3, 3, 3, 3, 6))
    body = join(flange, zcyl(0, 0, 1, 6, 2.5), dome)
    return [
        ("led", body),
        ("metal", box(-1.52, -0.25, -7, -1.02, 0.25, 0)),
        ("metal", box(1.02, -0.25, -7, 1.52, 0.25, 0)),
    ]


def build_resistor():
    z = 2.0
    body = join(cyl((0, -3.2, z), (0, 3.2, z), 1.1), cyl((0, -3.2, z), (0, -1.9, z), 1.3), cyl((0, 1.9, z), (0, 3.2, z), 1.3))
    bodies = [("resistor", body)]
    for y, material in [(-2.6, "band-brown"), (-1.2, "band-black"), (0.1, "band-red"), (2.5, "band-gold")]:
        radius = 1.33 if abs(y) > 1.9 else 1.13
        bodies.append((material, cyl((0, y - 0.3, z), (0, y + 0.3, z), radius)))
    for sign in (-1, 1):
        bodies.append(("metal", cyl((0, sign * 3.2, z), (0, sign * 6.0, z), 0.3)))
        bodies.append(("metal", box(-0.3, sign * 6.0 - 0.3, -4, 0.3, sign * 6.0 + 0.3, z)))
    return bodies


def build_servo():
    body = join(box(-11.4, -6.1, 0, 11.4, 6.1, 22.7), box(-16.15, -6.1, 15.9, 16.15, 6.1, 18.4))
    minus(body, zcyl(-14.15, 0, 15, 19, 1.0), zcyl(14.15, 0, 15, 19, 1.0))
    join(body, zcyl(5.5, 0, 22.7, 26.7, 5.9), zcyl(-0.6, 0, 22.7, 25.2, 3.0))
    return [("servo", body), ("white", zcyl(5.5, 0, 26.7, 29.7, 2.4))]


def build_servo_horn():
    horn = join(zcyl(0, 0, 0, 3.4, 3.5), box(-2.2, 0, 1.8, 2.2, 16, 3.4), zcyl(0, 16, 1.8, 3.4, 2.2))
    minus(horn, *[zcyl(0, y, 1, 4, 0.5) for y in (6, 9, 12, 15)])
    return [("white", horn)]


def build_buzzer():
    body = minus(zcyl(0, 0, 0, 7.5, 6), zcyl(0, 0, 6.5, 8, 1.2))
    return [("plastic-black", body)]


def build_knob():
    return [("pot", box(-5, -5, 0, 5, 5, 6)), ("metal", zcyl(0, 0, 6, 8, 3.5))]


def build_knob_cap():
    cap = zcyl(0, 0, 0, 7, 6.0)
    minus(cap, *[zcyl(6.25 * math.cos(i * math.pi / 10), 6.25 * math.sin(i * math.pi / 10), 0.8, 8, 0.6) for i in range(20)])
    return [("plastic-black", cap), ("white", box(-0.5, 1.2, 6.9, 0.5, 5.0, 7.2))]


def build_button():
    plate = minus(box(-6, -6, 3.5, 6, 6, 3.8), zcyl(0, 0, 3, 4.5, 4.0))
    bodies = [("plastic-black", box(-6, -6, 0, 6, 6, 3.5)), ("metal", plate)]
    for sx in (-1, 1):
        for sy in (-1, 1):
            bodies.append(("plastic-black", zcyl(sx * 4.4, sy * 4.4, 3.8, 4.3, 0.9)))
    return bodies


def build_button_cap():
    return [("button-red", zcyl(0, 0, 0, 3.2, 3.5))]


PARTS = [
    ("uno", build_uno, (0, 0)),
    ("esp32", build_esp32, (0, -45)),
    ("breadboard", build_breadboard, (85, 0)),
    ("breadboard-full", build_breadboard_full, (85, -70)),
    ("ldr", build_ldr, (215, 10)),
    ("rgb-led", build_rgb_led, (230, 10)),
    ("tmp36", build_tmp36, (245, 10)),
    ("tip120", build_tip120, (260, 10)),
    ("motor", build_motor, (280, 10)),
    ("fan", build_fan, (310, 10)),
    ("stepper", build_stepper, (280, 60)),
    ("wheel", build_wheel, (320, 60)),
    ("uln2003", build_uln2003, (350, 40)),
    ("hc-sr04", build_hcsr04, (280, 110)),
    ("oled", build_oled, (340, 110)),
    ("fsr", build_fsr, (380, 110)),
    ("soil-sensor", build_soil_sensor, (420, 110)),
    ("led", build_led, (180, 10)),
    ("resistor", build_resistor, (195, 10)),
    ("servo", build_servo, (100, 80)),
    ("servo-horn", build_servo_horn, (140, 80)),
    ("buzzer", build_buzzer, (165, 80)),
    ("knob", build_knob, (185, 80)),
    ("knob-cap", build_knob_cap, (205, 80)),
    ("button", build_button, (225, 80)),
    ("button-cap", build_button_cap, (245, 80)),
]


def mesh_of(body):
    calculator = body.meshManager.createMeshCalculator()
    calculator.setQuality(adsk.fusion.TriangleMeshQualityOptions.NormalQualityTriangleMesh)
    mesh = calculator.calculate()
    return {
        "positions": [round(v * 10, 3) for v in mesh.nodeCoordinatesAsFloat],
        "normals": [round(v, 4) for v in mesh.normalVectorsAsFloat],
        "indices": list(mesh.nodeIndices),
    }


def run(_context: str):
    document = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
    document.name = "CPE Online board and parts"
    design = adsk.fusion.Design.cast(app.activeProduct)
    design.designType = adsk.fusion.DesignTypes.DirectDesignType
    root = design.rootComponent

    output = {"units": "mm", "up": "z", "parts": {}}
    for name, build, (dx, dy) in PARTS:
        placement = adsk.core.Matrix3D.create()
        placement.translation = adsk.core.Vector3D.create(dx * CM, dy * CM, 0)
        component = root.occurrences.addNewComponent(placement).component
        component.name = name
        meshes = []
        for material, temporary in build():
            body = component.bRepBodies.add(temporary)
            body.name = material
            meshes.append({"material": material, **mesh_of(body)})
        output["parts"][name] = meshes
        print(name, len(meshes), "bodies")

    with open(OUT, "w", encoding="utf-8") as file:
        json.dump(output, file, separators=(",", ":"))
    app.activeViewport.fit()
    print("wrote", OUT)
