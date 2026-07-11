import json

path = r"Z:\DEVELOPMENT\Razi\spec-kit\integrations\catalog.json"

with open(path, "r", encoding="utf-8") as f:
    catalog = json.load(f)

integrations = catalog["integrations"]

# Build new dict with cmdc inserted alphabetically
new = {}
added = False
for key in sorted(list(integrations.keys()) + ["cmdc"]):
    if key == "cmdc" and not added:
        new["cmdc"] = {
            "id": "cmdc",
            "name": "Command Code",
            "version": "1.0.0",
            "description": "Command Code CLI skills-based integration",
            "author": "spec-kit-core",
            "repository": "https://github.com/github/spec-kit",
            "tags": ["cli", "skills"]
        }
        added = True
    else:
        new[key] = integrations[key]

catalog["integrations"] = new

with open(path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2)
    f.write("\n")

# Verify
with open(path, "r", encoding="utf-8") as f:
    verify = json.load(f)

print("Total integrations:", len(verify["integrations"]))
print("cmdc present:", "cmdc" in verify["integrations"])
print("cmdc verified OK!" if "cmdc" in verify["integrations"] else "FAILED")
