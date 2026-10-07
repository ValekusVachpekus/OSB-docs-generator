#!/usr/bin/env python3
"""Встраивает gerb.svg и подпись по умолчанию в assets/*.js (base64),
чтобы сайт работал даже при открытии через file:// (без fetch)."""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "assets"

def embed(src: Path, dst: Path, var: str):
    b64 = base64.b64encode(src.read_bytes()).decode()
    dst.write_text(f'// Сгенерировано tools/make-assets.py. Не править вручную.\nwindow.{var} = "{b64}";\n',
                   encoding="utf-8")
    print(f"{dst.name}: {len(b64)//1024} КБ base64 из {src.name}")

embed(A / "gerb.svg", A / "gerb.js", "OSB_GERB_B64")
embed(A / "sign-default.png", A / "sign-default.js", "OSB_SIGN_DEFAULT_B64")
embed(A / "Pechat_GU_MVD.png", A / "seal.js", "OSB_SEAL_B64")

FONTS = ["Regular", "Bold", "Italic", "BoldItalic"]
parts = ["// Сгенерировано tools/make-assets.py. Не править вручную.", "window.OSB_FONTS_B64 = {};"]
for w in FONTS:
    import base64 as _b64
    b64 = _b64.b64encode((A / "fonts" / f"LiberationSerif-{w}.ttf").read_bytes()).decode()
    parts.append(f'window.OSB_FONTS_B64["{w}"] = "{b64}";')
(A / "fonts.js").write_text("\n".join(parts) + "\n", encoding="utf-8")
print(f"fonts.js: {(A / 'fonts.js').stat().st_size // 1024} КБ base64")
