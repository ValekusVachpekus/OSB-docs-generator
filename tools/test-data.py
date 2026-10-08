#!/usr/bin/env python3
"""Проверка параметрических шаблонов: подмена OSB-DATA + компиляция typst.
Использование: python3 tools/test-data.py [trebovanie|proverka|otstranenie|all]
Проверяет: дефолтный блок, блок с выключенными штампами/без подписи/герба,
блок с "опасными" символами (кавычки, бэкслэш) — escaping должен держать компиляцию.
"""
import re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "templates"
WORK = Path("/tmp/osbtest")
MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня",
              "июля","августа","сентября","октября","ноября","декабря"]

def esc(s: str) -> str:
    s = re.sub(r"\s+", " ", s)
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def data_block(mapping: dict) -> str:
    lines = []
    for k, v in mapping.items():
        if isinstance(v, bool):
            lines.append(f"#let {k} = {'true' if v else 'false'}")
        elif isinstance(v, (int, float)):
            lines.append(f"#let {k} = {v}")
        elif isinstance(v, str) and re.fullmatch(r"[0-9.]+mm", v):
            lines.append(f"#let {k} = {v}")
        else:
            lines.append(f"#let {k} = {esc(str(v))}")
    return "// <OSB-DATA>\n" + "\n".join(lines) + "\n// </OSB-DATA>"

def defaults_of(name: str) -> dict:
    src = (TPL / f"{name}.typ").read_text(encoding="utf-8")
    m = re.search(r"// <OSB-DATA>\n(.*?\n)// </OSB-DATA>", src, re.S)
    out = {}
    for line in m.group(1).strip().splitlines():
        mm = re.match(r"#let (\S+) = (.*)", line.strip())
        k, v = mm.group(1), mm.group(2)
        if v in ("true", "false"):
            out[k] = v == "true"
        elif re.fullmatch(r"-?\d+", v):
            out[k] = int(v)
        elif re.fullmatch(r"[0-9.]+mm", v):
            out[k] = v
        elif v.startswith('"'):
            out[k] = v[1:-1].replace('\\"', '"').replace("\\\\", "\\")
        else:
            out[k] = v
    return out, src

def compile_with(name: str, mapping: dict, tag: str) -> bool:
    defaults, src = defaults_of(name)
    merged = {**defaults, **mapping}
    new = re.sub(r"// <OSB-DATA>\n.*?\n// </OSB-DATA>",
                 data_block(merged), src, flags=re.S)
    (WORK / "t").mkdir(parents=True, exist_ok=True)
    (WORK / "t" / f"{name}.typ").write_text(new, encoding="utf-8")
    out = WORK / f"{name}_{tag}.pdf"
    p = subprocess.run(["typst", "compile", "--root", str(WORK),
                        str(WORK / "t" / f"{name}.typ"), str(out)],
                       capture_output=True, text=True, cwd=str(WORK))
    ok = p.returncode == 0 and out.exists()
    print(f"[{name}/{tag}] {'OK' if ok else 'FAIL'} {out.stat().st_size if ok else ''}B")
    if not ok:
        print(p.stderr[:2000])
    return ok

def main():
    names = sys.argv[1:] or ["all"]
    if names == ["all"]:
        names = ["trebovanie", "proverka", "otstranenie", "unsp", "uksp", "protokol_oprosa"]
    shutil.rmtree(WORK, ignore_errors=True)
    (WORK).mkdir(parents=True)
    shutil.copy(ROOT / "assets/gerb.svg", WORK / "gerb.svg")
    shutil.copy(ROOT / "assets/sign-default.png", WORK / "sign.png")
    shutil.copy(ROOT / "assets/Pechat_GU_MVD.png", WORK / "seal.png")
    ok = True
    tricky = 'Иванов "Вихрь" \\ Петров'
    for n in names:
        ok &= compile_with(n, {}, "defaults")
        off, _ = defaults_of(n)
        for k in off:
            if k.startswith("v-show-"):
                off[k] = False
        off["v-has-sign"] = False
        off["v-has-gerb"] = False
        off["v-subject"] = tricky if "v-subject" in off else off.get("v-violator", "")
        off["v-violator"] = tricky
        if "v-suspend-word" in off:
            off["v-suspend-word"] = "не отстранять"
        ok &= compile_with(n, off, "minimal")
    print("ALL OK" if ok else "FAILURES")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
