"""Refresh fictitious demo previews locally from the last native Herdr captures.

This overlays the UI changes made after cf92357 without reading the user's
Herdr profile or sending any images to a service. Requires Pillow.
"""

from pathlib import Path
from io import BytesIO
import subprocess
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
BASE_COMMIT = "cf92357"  # Last native demo captures before the local visual update.
FONTS = Path("C:/Windows/Fonts")
REGULAR = lambda size: ImageFont.truetype(str(FONTS / "arial.ttf"), size)
BOLD = lambda size: ImageFont.truetype(str(FONTS / "arialbd.ttf"), size)
SYMBOL = lambda size: ImageFont.truetype(str(FONTS / "seguisym.ttf"), size)


def sprite_from_header(image):
    sprite = image.crop((322, 91, 356, 131)).convert("RGBA")
    backdrop = image.getpixel((323, 92))[:3]
    result = Image.new("RGBA", sprite.size)
    for y in range(sprite.height):
        for x in range(sprite.width):
            r, g, b, _ = sprite.getpixel((x, y))
            distance = max(abs(r - backdrop[0]), abs(g - backdrop[1]), abs(b - backdrop[2]))
            alpha = max(0, min(255, round((distance - 12) * 255 / 45)))
            if alpha:
                result.putpixel((x, y), (r, g, b, alpha))
    return result.resize((20, 24), Image.Resampling.LANCZOS)


def badge(number, size):
    image = Image.open(ROOT / f"mods/oaklabs-companions/badges/{number}.png").convert("RGBA")
    return image.resize((size, size), Image.Resampling.LANCZOS)


def dim(color):
    return tuple(round(channel * 0.62) for channel in color)


def sidebar(image, veiled=False):
    draw = ImageDraw.Draw(image)
    rows = [(338, "working", 1, "#D48C5C"), (400, "working", 2, "#668EB2"),
            (499, "idle", 2, "#668EB2")]
    for y, state, milestone, accent in rows:
        background = image.getpixel((250, y + 24))[:3]
        draw.rectangle((255, y + 13, 282, y + 47), fill=background)
        line = tuple(bytes.fromhex(accent[1:])[i] for i in range(3))
        if veiled:
            line = dim(line)
        draw.rounded_rectangle((13, y + 9, 17, y + 51), radius=2, fill=line)
        overlay = badge(milestone, 21)
        image.paste(overlay, (38, y + 29), overlay)
        if state == "working":
            color = (182, 125, 11) if not veiled else dim((182, 125, 11))
            draw.text((258, y + 13), "✦", font=SYMBOL(22), fill=color, anchor="lt")
        else:
            blues = [(122, 166, 239), (86, 135, 220), (49, 94, 186)]
            for x, offset, size, blue in zip((254, 261, 270), (24, 20, 17), (9, 11, 13), blues):
                draw.text((x, y + offset), "z", font=BOLD(size), fill=dim(blue) if veiled else blue, anchor="lt")


def tab(image, sprite, light):
    draw = ImageDraw.Draw(image)
    fill = image.getpixel((318, 26))[:3]
    draw.rectangle((324, 19, 428, 45), fill=fill)
    image.paste(sprite, (325, 19), sprite)
    ink = (20, 22, 29) if light else (250, 252, 255)
    draw.text((354, 24), "Application", font=REGULAR(13), fill=ink, anchor="lt")


def demo_space(image, light=False, veiled=False, box_card=False):
    draw = ImageDraw.Draw(image)
    background = image.getpixel((190, 176))[:3]
    ink = (40, 38, 42) if light else ((160, 166, 178) if veiled else (245, 248, 255))
    draw.rectangle((54, 169, 212, 193), fill=background)
    draw.text((55, 174), "PokéLab", font=REGULAR(14), fill=ink, anchor="lt")

    row_background = image.getpixel((180, 379))[:3]
    draw.rectangle((144, 369, 223, 385), fill=row_background)
    detail_ink = (116, 106, 101) if light else ((115, 122, 134) if veiled else (151, 165, 187))
    draw.text((144, 369), "PokéLab", font=REGULAR(12), fill=detail_ink, anchor="lt")

    if box_card:
        card_background = image.getpixel((550, 476))[:3]
        draw.rectangle((398, 468, 554, 491), fill=card_background)
        draw.text((399, 472), "PokéLab", font=REGULAR(12), fill=(20, 22, 29), anchor="lt")


def workspace(name):
    image = Image.open(BytesIO(subprocess.check_output(["git", "show", f"{BASE_COMMIT}:{name}"], cwd=ROOT))).convert("RGB")
    sprite = sprite_from_header(image)
    sidebar(image)
    tab(image, sprite, name == "preview-paper.png")
    demo_space(image, light=name == "preview-paper.png")
    image.save(ROOT / name, optimize=True)


def card_caption(image, text, x, y, width, xp):
    draw = ImageDraw.Draw(image)
    for px in range(x, x + width + 1):
        draw.line((px, y - 3, px, y + 14), fill=image.getpixel((px, y + 15))[:3])
    draw.text((x, y), text, font=REGULAR(12), fill=(20, 22, 29), anchor="lt")
    draw.text((x + width - 2, y), xp, font=REGULAR(12), fill=(20, 22, 29), anchor="rt")


def box():
    image = Image.open(BytesIO(subprocess.check_output(["git", "show", f"{BASE_COMMIT}:preview-box.png"], cwd=ROOT))).convert("RGB")
    sidebar(image, veiled=True)
    draw = ImageDraw.Draw(image)
    # The old manual XP claim is gone; completed turns now credit XP automatically.
    card_blue = image.getpixel((420, 339))[:3]
    draw.rectangle((398, 287, 520, 315), fill=card_blue)
    draw.rounded_rectangle((399, 289, 490, 312), radius=12, fill=(188, 230, 255))
    draw.ellipse((407, 295, 417, 305), outline=(20, 22, 29), width=1)
    draw.line((412, 300, 412, 297), fill=(20, 22, 29), width=1)
    draw.line((412, 300, 415, 302), fill=(20, 22, 29), width=1)
    draw.text((421, 294), "Au repos", font=REGULAR(12), fill=(20, 22, 29), anchor="lt")
    surface = image.getpixel((700, 825))[:3]
    draw.rectangle((482, 813, 613, 858), fill=surface)
    draw.rectangle((941, 710, 1062, 746), fill=surface)
    draw.rounded_rectangle((968, 714, 1059, 740), radius=13, fill=(188, 230, 255))
    draw.ellipse((976, 721, 986, 731), outline=(20, 22, 29), width=1)
    draw.line((981, 726, 981, 723), fill=(20, 22, 29), width=1)
    draw.line((981, 726, 984, 728), fill=(20, 22, 29), width=1)
    draw.text((990, 720), "Au repos", font=REGULAR(12), fill=(20, 22, 29), anchor="lt")

    cards = [
        (399, 338, 298, "Niv. 3 · Compagnon", 2, 677, 294, 0),
        (744, 338, 298, "Niv. 3 · Compagnon", 2, 1022, 294, 50),
        (399, 543, 298, "Niv. 2 · Éclaireur", 1, 677, 499, 75),
        (744, 543, 298, "Niv. 4 · Challenger", 3, 1022, 499, 25),
    ]
    for x, y, width, title, mark, badge_x, badge_y, xp in cards:
        card_caption(image, title, x, y, width, f"{xp} / 100 XP")
        overlay = badge(mark, 30)
        image.paste(overlay, (badge_x, badge_y), overlay)

    draw.rectangle((380, 767, 1059, 786), fill=surface)
    draw.text((381, 771), "Niv. 3 · Compagnon", font=REGULAR(12), fill=(255, 255, 255), anchor="lt")
    draw.text((1059, 771), "0 / 100 XP", font=REGULAR(12), fill=(255, 255, 255), anchor="rt")
    demo_space(image, veiled=True, box_card=True)
    image.save(ROOT / "preview-box.png", optimize=True)


for filename in ("preview.png", "preview-paper.png"):
    workspace(filename)
box()
