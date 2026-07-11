path = r"Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\feature_request.yml"
content = open(path, "r", encoding="utf-8").read()
content = content.replace(
    "        - Claude Code\n        - Cline",
    "        - Claude Code\n        - Command Code\n        - Cline"
)
open(path, "w", encoding="utf-8").write(content)
print("Fixed feature_request.yml")
