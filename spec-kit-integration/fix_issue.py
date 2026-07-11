content = open(r'Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\agent_request.yml', 'r', encoding='utf-8').read()
content = content.replace('Claude Code, Cline', 'Claude Code, Command Code, Cline')
open(r'Z:\DEVELOPMENT\Razi\spec-kit\.github\ISSUE_TEMPLATE\agent_request.yml', 'w', encoding='utf-8').write(content)
print('done')
