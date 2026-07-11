# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture
- Design WhatsApp bot to be strictly reactive (never initiate messages first) to stay within free 24-hour service window and maintain ₹0 cost. Confidence: 0.85

# workflow
- Use spec-kit driven development: /speckit-plan → /speckit-task → /speckit-checklist (security, performance, UX, testing) → /speckit-implement, with loop engineering until completion. Confidence: 0.70
- During spec-kit cycles, pause for user clarity only in plan through checklist phases; after checklist is complete, run autonomously without further questions. Confidence: 0.70
