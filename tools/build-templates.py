#!/usr/bin/env python3
"""Вшивает templates/*.typ в templates.js (window.OSB_TEMPLATES),
чтобы сайт работал через file:// без fetch.
Использование: python3 tools/build-templates.py [--check]
--check: только проверить синхронность (для CI/контроля), код возврата 1 при рассинхроне.
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "templates"
OUT = ROOT / "templates.js"

def build() -> str:
    data = {}
    for name in ["trebovanie", "proverka", "otstranenie"]:
        data[name] = (TPL / f"{name}.typ").read_text(encoding="utf-8")
    return ("// Сгенерировано tools/build-templates.py. Не править вручную.\n"
            "window.OSB_TEMPLATES = " + json.dumps(data, ensure_ascii=False) + ";\n")

def main():
    content = build()
    if "--check" in sys.argv:
        cur = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if cur != content:
            print("templates.js рассинхронизирован с templates/*.typ — запусти python3 tools/build-templates.py")
            sys.exit(1)
        print("templates.js OK")
    else:
        OUT.write_text(content, encoding="utf-8")
        print(f"templates.js: {len(content)//1024} КБ")

if __name__ == "__main__":
    main()
