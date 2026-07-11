# Find the supported integrations section and add cmdc where needed

readme = open(r"Z:\DEVELOPMENT\Razi\spec-kit\README.md", "r", encoding="utf-8").read()

# 1. In the usage examples section - find existing integrations 
# Replace with cmdc added
readme = readme.replace("--integration copilot", "--integration copilot` or `cmdc")
readme = readme.replace(
    "--integration gemini` or `cmdc",
    "--integration gemini"
)

# Actually let me be more surgical
readme = open(r"Z:\DEVELOPMENT\Razi\spec-kit\README.md", "r", encoding="utf-8").read()

# Find the persistent install section 
idx1 = readme.find("specify init <PROJECT_NAME> --integration copilot")
idx2_before = readme.find("specify init <project_name> --integration claude")
idx2 = readme.find("specify init <project_name> --integration gemini")

# Also update installation.md
install = open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "r", encoding="utf-8").read()

# Add cmdc to integration examples  
def inject_cmdc(text):
    # In the multi-line example blocks after copilot 
    text = text.replace(
        "--integration copilot\nspecify init <project_name> --integration gemini",
        "--integration copilot\nspecify init <project_name> --integration cmdc\nspecify init <project_name> --integration gemini"
    )
    text = text.replace(
        "--integration copilot\n\n### One-time Usage",
        "--integration copilot\n\nspecify init <project_name> --integration cmdc\n\n### One-time Usage"
    )
    return text

readme = inject_cmdc(readme)
install = inject_cmdc(install)

open(r"Z:\DEVELOPMENT\Razi\spec-kit\README.md", "w", encoding="utf-8").write(readme)
open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "w", encoding="utf-8").write(install)

print("Updated README.md and docs/installation.md")
