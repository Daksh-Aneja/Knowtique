import os

dirs = [
    r"c:\Knowtique\backend\app\services",
    r"c:\Knowtique\backend\app\api\routes",
]
changed = []
for d in dirs:
    for fname in os.listdir(d):
        if not fname.endswith(".py"):
            continue
        fpath = os.path.join(d, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        original = content
        content = content.replace('model="gpt-4o-mini"', 'model_tier="fast"')
        content = content.replace('model="gpt-4o"', 'model_tier="classification"')
        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            changed.append(fname)

print(f"Fixed {len(changed)} files: {changed}")
