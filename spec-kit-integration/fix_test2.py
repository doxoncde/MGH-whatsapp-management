# Fix the agent config consistency test file
# Only insert cmdc in ISSUE_TEMPLATE_AGENT_KEYS, nowhere else.

path = r"Z:\DEVELOPMENT\Razi\spec-kit\tests\test_agent_config_consistency.py"
lines = open(path, encoding="utf-8").readlines()

# First, remove ALL "cmdc" entries (clean slate)
lines_clean = [l for l in lines if l.strip() != '"cmdc",']

# Now insert once after the first "claude" in the ISSUE_TEMPLATE_AGENT_KEYS list
# The key is that the first "claude" is around line 17 (in the list)
output = []
inserted = False
for line in lines_clean:
    output.append(line)
    if not inserted and line.strip() == '"claude",':
        output.append('    "cmdc",\n')
        inserted = True

open(path, "w", encoding="utf-8").writelines(output)

# Verify
for i, line in enumerate(open(path, encoding="utf-8").readlines()):
    if "cmdc" in line:
        print(f"Line {i+1}: {line.rstrip()}")

print(f"\nTotal cmdc lines: {sum(1 for l in open(path, encoding='utf-8') if 'cmdc' in l)}")
