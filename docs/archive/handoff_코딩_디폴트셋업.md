# Handoff Document

Last Updated: 2026-02-15 10:52:54 Session Context: LLM Multi-IDE
Continuity System Design

------------------------------------------------------------------------

## 1. Project Direction

The goal is to build an LLM-independent development continuity system
that:

-   Works across IDEs (VS Code, Antigravity, etc.)
-   Works across LLMs (GPT Codex, Claude Code, Gemini Pro)
-   Maintains continuity even when sessions reset
-   Uses GitHub as single source of truth
-   Avoids reliance on chat history

This system is intended to be universal and environment-agnostic.

------------------------------------------------------------------------

## 2. Architectural Decisions Made

### ADR-001

GitHub is the single source of truth.

### ADR-002

Single `project_context.md` for all LLMs. No model-specific duplicated
context files.

### ADR-003

No symbolic links for context management. Reason: OS portability and
stability.

### ADR-004

Session continuity is guaranteed through: - project_context.md -
architecture.md - tasks.md - decisions.md - handoff.md

------------------------------------------------------------------------

## 3. Folder Schema Designed

project-root/ │ ├─ docs/ │ ├─ project_context.md │ ├─ architecture.md │
├─ decisions.md │ ├─ handoff.md │ ├─ tasks.md │ └─ changelog.md │ ├─
prompts/ │ ├─ base_prompt.md │ ├─ session_start.md │ └─ session_end.md │
├─ scripts/ │ └─ update_handoff.py │ └─ src/

------------------------------------------------------------------------

## 4. Automation Implemented

A Python script was designed:

`scripts/update_handoff.py`

Purpose: - Read current branch - Read latest commit message - Detect
changed files - Auto-generate handoff.md

Git hook strategy: - post-commit hook - Automatically runs
update_handoff.py - Ensures handoff is always current

------------------------------------------------------------------------

## 5. Current Focus

Testing whether:

-   A new ChatGPT session
-   With only this handoff file uploaded
-   Can reconstruct project context correctly
-   And continue development without chat history

------------------------------------------------------------------------

## 6. Known Constraints

-   Phone-based workflow
-   Need portability
-   Must avoid complex OS-dependent features
-   Keep system simple and maintainable

------------------------------------------------------------------------

## 7. Next Immediate Action

1.  Start a new session.
2.  Upload this handoff.md file.
3.  Ask the assistant to:
    -   Reconstruct project structure.
    -   Explain current architecture.
    -   Propose next development step.

Test whether continuity works.

------------------------------------------------------------------------

## 8. Continuity Rule

When starting a new session:

Always instruct the LLM to:

-   Treat GitHub as source of truth.
-   Respect architecture and decisions.
-   Continue development without redesign unless justified.
