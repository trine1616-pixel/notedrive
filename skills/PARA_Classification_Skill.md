# Skill: PARA Classification & Note Organization

This skill defines the logic and rules for organizing notes into the PARA system. It is used by the Classification Agent to maintain consistency across the vault.

## Objective
To ensure every note is placed in one of the following categories:
1. **01_Projects**: Active projects with a deadline or specific goal.
2. **02_Areas**: Long-term responsibilities or areas of interest (e.g., Health, Finance).
3. **03_Resources**: Reference materials, topics of interest, or snippets.
4. **04_Archives**: Completed projects or inactive areas.

## Classification Logic
- **Priority 1: Keywords**. If a filename contains project codes like 'DS15' or 'PMDS', it belongs to `01_Projects`.
- **Priority 2: Context**. AI analyzes the first 500 characters to determine the intent.
- **Format**: All folders must follow the `XX_Category/Subcategory` pattern using NFC normalization.

## Formatting Rules
- **Hashtags**: All hashtags not in the whitelist must be escaped (`\#`).
- **Images**: Paths must be adjusted as `../Files/` or `../../Files/` based on folder depth.
