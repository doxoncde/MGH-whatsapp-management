import shutil

src = r"Z:\DEVELOPMENT\Razi\spec-kit\tests\test_agent_config_consistency.py"
lines = open(src, encoding="utf-8").readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if line.strip() == '"claude",':
        new_lines.append('    "cmdc",\n')

open(src, "w", encoding="utf-8").writelines(new_lines)

# Verify
for i, line in enumerate(open(src, encoding="utf-8").readlines()):
    if "cmdc" in line:
        print(f"Line {i+1}: {line.rstrip()}")
