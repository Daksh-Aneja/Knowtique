import os, re

dirs = [
    r"c:\Knowtique\backend\app\services",
    r"c:\Knowtique\backend\app\api\routes",
]
changed = []

# Pattern: json.loads(res.get("content", "{}"))
# This is unsafe when res.get("content") returns a dict instead of str
# We need to ensure we only json.loads when the value is actually a string

old_pattern = 'json.loads(res.get("content", "{}"))'
new_pattern = '(json.loads(res.get("content", "{}")) if isinstance(res.get("content", "{}"), str) else res.get("content", {}))'

for d in dirs:
    for fname in os.listdir(d):
        if not fname.endswith(".py"):
            continue
        fpath = os.path.join(d, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        original = content
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            changed.append(fname)

print(f"Fixed {len(changed)} files: {changed}")
