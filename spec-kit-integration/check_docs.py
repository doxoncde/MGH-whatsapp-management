import re

readme = open(r"Z:\DEVELOPMENT\Razi\spec-kit\README.md", "r", encoding="utf-8").read()
installdoc = open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "r", encoding="utf-8").read()

# Find cmdc mentions
rm_cmdc = readme.count("cmdc")
is_cmdc = installdoc.count("cmdc")

# Find integration examples
rm_lines = []
for i, line in enumerate(readme.splitlines()):
    if "integration" in line.lower() and any(t in line for t in ["copilot", "claude", "cmdc", "codex"]):
        rm_lines.append(f"README line {i}: {line.strip()[:120]}")

is_lines = []
for i, line in enumerate(installdoc.splitlines()):
    if "integration" in line.lower() and any(t in line for t in ["copilot", "claude", "cmdc", "codex"]):
        is_lines.append(f"install line {i}: {line.strip()[:120]}")

out = f"""README cmdc mentions: {rm_cmdc}
install.md cmdc mentions: {is_cmdc}

README integration lines:
{chr(10).join(rm_lines[:20])}

install.md integration lines:
{chr(10).join(is_lines[:20])}
"""
open(r"Z:\DEVELOPMENT\Razi\MGH automated reply\doc_check.txt", "w", encoding="utf-8").write(out)
print("Done")
