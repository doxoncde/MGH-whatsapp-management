c = open(r"Z:\DEVELOPMENT\Razi\spec-kit\docs\installation.md", "r", encoding="utf-8").read()
idx = c.find("copilot")
f = open(r"Z:\DEVELOPMENT\Razi\MGH automated reply\install_snippet.txt", "w", encoding="utf-8")
f.write(f"idx={idx}\n")
if idx >= 0:
    f.write(repr(c[idx-5:idx+150]) + "\n")
f.close()
print("done")
