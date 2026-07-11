import yaml

paths = [
    r"Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\bug_report.yml",
    r"Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\agent_request.yml",
]

for path in paths:
    # Read as raw text to preserve formatting
    content = open(path, "r", encoding="utf-8").read()
    
    # Update the paragraph text
    content = content.replace("Claude Code, Cline", "Claude Code, Command Code, Cline")
    
    # Update dropdown options if present  
    content = content.replace("'Claude Code', 'Cline'", "'Claude Code', 'Command Code', 'Cline'")
    
    open(path, "w", encoding="utf-8").write(content)
    print(f"Updated: {path}")

print("Done")
