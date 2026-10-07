#!/usr/bin/env python3
"""Сверяет #let v-* в templates/*.typ с DATA_KEYS в app.js."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ok = True
app = (ROOT / "app.js").read_text(encoding="utf-8")
for name in ["trebovanie", "proverka", "otstranenie"]:
    src = (ROOT / "templates" / f"{name}.typ").read_text(encoding="utf-8")
    block = re.search(r"// <OSB-DATA>\n(.*?)\n// </OSB-DATA>", src, re.S).group(1)
    typ_keys = re.findall(r"#let (v-\S+) =", block)
    m = re.search(rf"{name}: \[(.*?)\]", app, re.S)
    js_keys = re.findall(r"'(v-[a-z-]+)'", m.group(1))
    only_typ = [k for k in typ_keys if k not in js_keys]
    only_js = [k for k in js_keys if k not in typ_keys]
    dup = len(typ_keys) != len(set(typ_keys)) or len(js_keys) != len(set(js_keys))
    status = "OK" if not (only_typ or only_js or dup) else "FAIL"
    if status == "FAIL":
        ok = False
    print(f"[{name}] {status} typ={len(typ_keys)} js={len(js_keys)}"
          + (f" only_typ={only_typ}" if only_typ else "")
          + (f" only_js={only_js}" if only_js else "")
          + (" DUP" if dup else ""))
print("ALL OK" if ok else "FAILURES")
sys.exit(0 if ok else 1)
