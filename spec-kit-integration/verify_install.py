path = r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
print(f"Updated install.md: cmdc={content.count('cmdc')}, Command Code={content.count('Command Code')}")
