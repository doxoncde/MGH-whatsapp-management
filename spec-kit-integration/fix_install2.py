import sys

path = r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 6: add Command Code after GitHub Copilot in prerequisites 
for i, line in enumerate(lines):
    if "GitHub Copilot" in line and "CodeBuddy" in line:
        lines[i] = line.replace(
            "GitHub Copilot](https://code.visualstudio.com/), [CodeBuddy",
            "GitHub Copilot](https://code.visualstudio.com/), [Command Code](https://commandcode.ai), [CodeBuddy"
        )
        print(f"Line {i+1}: added Command Code")
        break

# Line 51-52 area: add cmdc after copilot
for i, line in enumerate(lines):
    if line.strip() == "specify init <project_name> --integration copilot" and i > 40:
        lines.insert(i + 1, "specify init <project_name> --integration cmdc\n")
        print(f"Line {i+1}: added cmdc integration line")
        break

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)

# Verify
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
print(f"cmdc count: {content.count('cmdc')}")
print(f"Command Code count: {content.count('Command Code')}")
sys.exit(0 if content.count("cmdc") >= 2 else 1)
