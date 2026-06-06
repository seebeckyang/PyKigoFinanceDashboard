#!/usr/bin/env python3
# 將 out/ 內所有 HTML 的資產絕對路徑改為「相對於該檔案深度」的相對路徑，
# 讓站台可掛載在任意子路徑（pplx.app 代理）下仍正確載入 _next 資產。
import os, re

OUT = "/home/user/workspace/PyKigoFinanceDashboard/out"

for root, _, files in os.walk(OUT):
    for fn in files:
        if not fn.endswith(".html"):
            continue
        path = os.path.join(root, fn)
        # 計算此 HTML 相對 out/ 的目錄深度
        rel_dir = os.path.relpath(root, OUT)
        depth = 0 if rel_dir == "." else len(rel_dir.split(os.sep))
        prefix = "./" if depth == 0 else "../" * depth
        with open(path, encoding="utf-8") as f:
            html = f.read()
        # 1) 先把 build 產生的 "./_next/" 還原成統一基準再處理
        html = html.replace('"./_next/', '"/_next/').replace("'./_next/", "'/_next/")
        # 2) 將根絕對資產路徑改為相對
        html = re.sub(r'(["\'])/_next/', lambda m: m.group(1) + prefix + "_next/", html)
        html = re.sub(r'(["\'])/(manifest\.json|favicon\.ico|icon-\d+\.png|icon\.svg|apple-touch-icon\.png|sw\.js)', 
                      lambda m: m.group(1) + prefix + m.group(2), html)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"fixed depth={depth} prefix={prefix} -> {os.path.relpath(path, OUT)}")
