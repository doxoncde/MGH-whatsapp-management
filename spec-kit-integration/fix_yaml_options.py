# Read and fix bug_report.yml and agent_request.yml
path1 = r"Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\bug_report.yml"
path2 = r"Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\agent_request.yml"

for path in [path1, path2]:
    content = open(path, "r", encoding="utf-8").read()
    
    # Fix: YAML list items use "        - Claude Code" format
    # We need "        - Claude Code\n        - Command Code" between Claude Code and Cline
    
    before = "        - Claude Code\n        - Cline"
    after = "        - Claude Code\n        - Command Code\n        - Cline"
    
    if before in content:
        content = content.replace(before, after)
        open(path, "w", encoding="utf-8").write(content)
        print(f"Fixed {path.split(chr(92))[-1]}: OK")
    else:
        print(f"Fixed {path.split(chr(92))[-1]}: pattern not found, checking...")
        # Check what we have
        idx = content.find("Claude Code")
        if idx > 0:
            print(f"  Found at {idx}: {repr(content[idx-5:idx+60])}")
        else:
            print("  Claude Code NOT FOUND")
