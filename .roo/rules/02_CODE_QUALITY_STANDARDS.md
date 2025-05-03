# CODE_QUALITY_STANDARDS.md

## Code Quality Standards (MANDATORY)

ALL AGENTS **MUST** STRICTLY ADHERE TO THE FOLLOWING RULES:

### 01. Prioritize Readability
- Code must be explicitly clear and self-describing.
- Write meaningful variable/function/component names.
- Comments explain **why**, not **what**.

### 02. Explicit Assertions
- Clearly document and enforce all assumptions with strict types and runtime checks.
- Avoid implicit logic.

### 03. Minimize Complexity
- Simplify control flows and reduce nested conditions.
- Prefer straightforward solutions.

### 04. Favor Immutability
- Prevent unintended mutations.
- Use const, immutable structures, and immutable state updates.

### 05. Ensure Modularity
- Write independent, reusable components and functions.
- Keep components/functions small and focused.

### 06. Eliminate Redundancy
- Reuse common logic via shared utilities.
- Never duplicate code.

### 07. Limit Cognitive Load
- Code must be instantly understandable without needing external references.
- Avoid complex logic within a single file/component.

### 08. Implement Strict Typing
- Use explicit types/interfaces for all variables, functions, props, and return values.
- Set `strict: true` in TypeScript and adhere without exceptions.

### 09. Enforce Single Responsibility
- Functions and components should do one clearly defined thing.
- Avoid multi-purpose functions/components.

### 10. Maintain Symmetry and Consistency
- Apply consistent coding patterns, naming conventions, and structures across the entire project.
- Similar logic must always appear in similar forms.

### 11. Zero Tolerance for Hardcoding
- NEVER hardcode values (colors, URLs, keys, text).
- Always reference from centralized config files (`/lib/config.ts`, `/tailwind.config.js`, `/styles/globals.css`).