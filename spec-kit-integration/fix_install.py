installdoc = open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "r", encoding="utf-8").read()

# Add cmdc after copilot in the installation examples
installdoc = installdoc.replace(
    "--integration copilot\nspecify init <project_name> --integration gemini",
    "--integration copilot\nspecify init <project_name> --integration cmdc\nspecify init <project_name> --integration gemini"
)

# Also add after the line that says 'install your coding agent'
installdoc = installdoc.replace(
    "--integration copilot\n\n### Alternative Package",
    "--integration copilot\n\nspecify init <project_name> --integration cmdc\n\n### Alternative Package"
)

open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "w", encoding="utf-8").write(installdoc)

# Verify
installdoc2 = open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "r", encoding="utf-8").read()
print("install.md cmdc mentions:", installdoc2.count("cmdc"))
