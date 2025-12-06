# Agent Instructions

## Memory Management
- Add new rules to this file instead of using memory tools
- Check existing rules for combination possibilities and clean up duplicates
- Style: expressive but compact - for agents, not humans

## Git Workflow
Before committing:
1. Check `git status` and `git diff --cached`
2. Stage only related changes with `git add <specific-files>`
3. Don't use `git add .` - be selective
4. Keep commits focused on one logical change

## Testing Rules
- Never delete unit tests - deletion is a failure
- If tests get complex, ask before simplifying
- Work process: write one basic test first, make it work, then add all other tests
- Don't oversimplify tests - ask if considering this

## Cleanup Rules
- Clean up after yourself - delete temp files
- After larger changes, check project for cleanup needs
- Always remove dead code

## Solution Principles
- Follow KISS (Keep It Simple, Stupid) rules
- Prefer simple solutions with clearly defined edge cases
- Avoid over-engineering - simple > perfect but complex

## Rule Adherence
- Read rules after every compact/summarization
- If considering deviating from rules, ask first
