# Kluster.ai Integration for Hyperscape

## Overview

This directory contains configuration and context files for [Kluster.ai](https://kluster.ai) code review integration with the Hyperscape monorepo. Kluster.ai provides real-time AI-powered code review to catch bugs, security issues, and compliance violations in AI-generated code.

---

## 📁 Directory Structure

```
.kluster/
├── README.md          # This file - integration guide
├── rules.md           # Project-specific validation rules
└── context.md         # Codebase architecture and patterns
```

---

## 🎯 What is Kluster.ai?

Kluster.ai automatically reviews AI-generated code in real-time within your IDE, scanning for:
- **Semantic Issues** - Type safety, incorrect assertions
- **Intent Issues** - Code that doesn't match project patterns
- **Logical Issues** - Control flow errors, edge cases
- **Security Issues** - Exposed credentials, vulnerabilities
- **Knowledge Issues** - Not using existing systems
- **Performance Issues** - Memory leaks, inefficient queries
- **Quality Issues** - Incomplete implementations, poor organization

### Three Review Tools

1. **Auto Review** (`kluster_code_review_auto`) - Real-time review as you code
2. **Manual Review** (`kluster_code_review_manual`) - On-demand file review
3. **Dependency Validator** (`kluster_dependency_validator`) - Package security

---

## 🚀 Setup & Installation

### 1. Install Kluster.ai

**For Claude Code (Terminal):**
```bash
# Installation script provided by Kluster.ai
curl -fsSL https://platform.kluster.ai/install/claude-code.sh | bash
```

**For Cursor/VS Code:**
- Install via extension marketplace
- Search for "Kluster.ai Verify Code"
- Click "Install" and authenticate

### 2. Configure API Key

Sign up at [platform.kluster.ai](https://platform.kluster.ai) and get your API key.

**For Claude Code:**
```bash
# Add to your MCP settings
{
  "mcpServers": {
    "kluster": {
      "command": "kluster-mcp-server",
      "env": {
        "KLUSTER_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**For VS Code/Cursor:**
- Settings → Extensions → Kluster.ai
- Enter your API key when prompted

### 3. Verify Installation

**Claude Code:**
```bash
# In Claude Code chat
/mcp

# Should show:
# ✅ kluster_code_review_auto
# ✅ kluster_code_review_manual
# ✅ kluster_dependency_validator
```

**VS Code/Cursor:**
- Check bottom status bar for Kluster.ai indicator
- Should show "Kluster: Active"

---

## 📝 How to Use with Hyperscape

### Automatic Code Review

Kluster.ai automatically reviews code as it's generated. To provide project context:

#### Option 1: Include Context in Prompt (Recommended)

When asking your AI coding assistant to write code, include:

```
Please implement [feature] following Hyperscape standards.

Review the code against these project rules:
[Paste relevant sections from .kluster/rules.md]

Ensure the implementation follows our architecture:
[Paste relevant sections from .kluster/context.md]
```

#### Option 2: Reference Files Directly

```
Implement [feature] and validate against:
- Project rules: .kluster/rules.md
- Architecture: .kluster/context.md

Ensure zero P0/P1 issues before completing.
```

#### Option 3: Create Custom Prompt Template

Save this as a reusable template in your IDE:

```markdown
# Hyperscape Code Generation Template

## Task
[Describe what you want to build]

## Validation Requirements
Before completing, validate code against:

### Critical Rules (P0-P1 - Must Pass)
- [ ] No `any` or `unknown` types
- [ ] Real tests only (no mocks)
- [ ] No hardcoded API keys
- [ ] TypeScript strict typing enforced
- [ ] All features have tests

### Important Rules (P2-P3 - Should Pass)
- [ ] Use existing Hyperscape systems
- [ ] No hardcoded game data
- [ ] Performance optimized for multiplayer
- [ ] Proper file management (no duplicates)

See `.kluster/rules.md` for complete validation criteria.
See `.kluster/context.md` for architecture patterns.

## Expected Output
- Implementation with zero P0/P1 issues
- Tests passing
- Documentation updated
```

---

### Manual Code Review

To manually review specific files:

**Claude Code:**
```bash
# In chat
Please review this file using kluster_code_review_manual:
packages/rpg/apps/NewFeature.hyp

Validate against our project rules in .kluster/rules.md
```

**VS Code/Cursor:**
- Right-click file → Kluster.ai → Review File
- Or use command palette: "Kluster: Review Current File"

---

### Dependency Validation

Before installing new packages:

**Claude Code:**
```bash
# In chat
Please validate this dependency using kluster_dependency_validator:
package: some-package@1.0.0

Check against our security requirements in .kluster/rules.md
```

**VS Code/Cursor:**
- Automatic when modifying package.json
- Or command palette: "Kluster: Validate Dependencies"

---

## 🎯 Project-Specific Configuration

### Review Sensitivity Settings

**Recommended Settings for Hyperscape:**
```
Minimum Severity: High
Priority: P0, P1, P2
Bug Types: All enabled
- ✅ Semantic
- ✅ Intent
- ✅ Logical
- ✅ Security
- ✅ Knowledge
- ✅ Performance
- ✅ Quality
```

**Why these settings:**
- We have ZERO tolerance for type violations (P0)
- Security is critical (API keys, auth) (P1)
- Performance matters for multiplayer (P2)

### Auto-Reject Scenarios

Code should be automatically rejected if:
1. Contains `any` or `unknown` types (P0)
2. Uses mocks/spies in tests (P0)
3. Hardcoded API keys or credentials (P0)
4. Has `test.skip()` or incomplete implementations (P0)
5. Creates new abstractions when Hyperscape systems exist (P1)
6. Missing tests for new features (P1)

See `.kluster/rules.md` for complete list.

---

## 📋 Common Workflows

### Workflow 1: Implementing New RPG Feature

```markdown
**Prompt:**
Implement a new fishing skill system for the RPG.

Requirements:
- Create Fishing.hyp app in packages/rpg/apps/
- Store fish data in fishing-data.json (no hardcoded data)
- Add real tests with Playwright
- Use existing Hyperscape ECS/networking systems

Validate against:
- Type safety rules: .kluster/rules.md (TypeScript section)
- Architecture patterns: .kluster/context.md (RPG Implementation section)
- Testing standards: .kluster/rules.md (Testing Requirements section)

Ensure zero P0/P1 issues.
```

### Workflow 2: Adding API Endpoint

```markdown
**Prompt:**
Add GET /api/state/fishing-stats endpoint.

Requirements:
- Input validation
- Authentication check with Privy JWT
- Type-safe database query with Drizzle
- Error handling
- Documentation

Validate against:
- API standards: .kluster/rules.md (API Standards section)
- Security requirements: .kluster/rules.md (Security Requirements section)

Ensure zero P0/P1 issues.
```

### Workflow 3: Refactoring Existing Code

```markdown
**Prompt:**
Refactor packages/rpg/apps/Player.hyp to improve performance.

Requirements:
- Maintain existing functionality
- Optimize for 50-100 concurrent players
- Add performance tests
- Keep all existing tests passing

Validate against:
- Performance standards: .kluster/rules.md (Performance section)
- Testing requirements: .kluster/rules.md (Testing section)
- File management: .kluster/rules.md (File Management section)

Ensure zero P0/P1 issues and all tests pass.
```

### Workflow 4: Post-Generation Validation

```markdown
**After code is generated:**

1. Run Kluster.ai manual review
2. Check for P0/P1 issues
3. If issues found:
   - Request fixes from AI agent
   - Re-validate with Kluster.ai
4. If clean:
   - Run tests: npm test
   - If tests pass: commit
   - If tests fail: fix and re-validate
```

---

## 🔧 Integration with Development Workflow

### Pre-Commit Hook (Recommended)

Create `.husky/pre-commit`:
```bash
#!/bin/bash

# Run type check
npm run type-check || exit 1

# Run tests
npm test || exit 1

# Optional: Manual Kluster.ai review via CLI
# (if Kluster.ai provides CLI tool)
# kluster review --files=$(git diff --cached --name-only)
```

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Type Check
        run: npm run type-check

      - name: Tests
        run: npm test

      # Note: Kluster.ai CLI integration when available
      # - name: Kluster.ai Review
      #   env:
      #     KLUSTER_API_KEY: ${{ secrets.KLUSTER_API_KEY }}
      #   run: kluster review --changed-files
```

---

## 📊 Issue Priority Guide

### P0 - Critical (Auto-Reject)
- `any` or `unknown` types
- Mocks in tests
- Hardcoded credentials
- `test.skip()` or TODO comments

**Action:** Reject code immediately, request fixes

### P1 - High Priority (Manual Review Required)
- Architecture violations
- Missing tests
- Security issues
- Hardcoded game data

**Action:** Flag for review, likely reject without fixes

### P2 - Medium Priority (Should Fix)
- Performance issues
- File management problems
- Database query inefficiencies

**Action:** Fix before merge if possible

### P3-P5 - Low Priority (Nice to Have)
- Code quality improvements
- Documentation gaps
- Minor optimizations

**Action:** Can defer to future PR

---

## 🚨 Troubleshooting

### Kluster.ai Not Reviewing Code

**Check:**
1. API key configured correctly
2. MCP tools showing as enabled (`/mcp` in Claude Code)
3. Extension active in VS Code/Cursor status bar
4. Internet connection (Kluster.ai requires API access)

**Solution:**
```bash
# Claude Code: Restart MCP servers
# VS Code/Cursor: Reload window (Cmd+Shift+P → Reload Window)
```

### Getting Too Many Low-Priority Issues

**Adjust Settings:**
- Increase minimum severity to "High" or "Critical"
- Focus on P0-P2 priorities
- Disable Quality checks if needed (keep Semantic, Security, Intent)

### Code Approved but Tests Failing

**This is expected!** Kluster.ai reviews code quality, but:
- Tests still need to run (`npm test`)
- Type checking still required (`npm run type-check`)
- Linting still needed (`npm run lint`)

Kluster.ai is ONE layer of validation, not the only layer.

---

## 🎓 Best Practices

### 1. Always Provide Context

❌ **Bad:**
```
Add a new feature to the RPG
```

✅ **Good:**
```
Add fishing skill to RPG following Hyperscape patterns.

Validate against:
- .kluster/rules.md (Testing, TypeScript, Architecture sections)
- .kluster/context.md (RPG Implementation patterns)

Ensure zero P0/P1 issues.
```

### 2. Validate Before Committing

```bash
# Your workflow should be:
1. Generate code (with AI)
2. Kluster.ai review (automatic or manual)
3. Fix any P0/P1 issues
4. Run tests (npm test)
5. Type check (npm run type-check)
6. Lint (npm run lint)
7. Commit if all pass
```

### 3. Use Manual Review for Existing Code

When refactoring or reviewing legacy code:
```
Review packages/rpg/apps/OldFeature.hyp using kluster_code_review_manual

Check against current standards in .kluster/rules.md
Focus on P0-P1 issues only for now
```

### 4. Keep Rules Updated

When project standards change:
1. Update `.kluster/rules.md`
2. Update `.kluster/context.md` if architecture changes
3. Notify team of changes
4. Re-review critical files against new rules

---

## 📚 File Reference

### `.kluster/rules.md`
**Use for:** Specific validation criteria
**Contains:**
- TypeScript typing rules
- Testing requirements
- Architecture patterns
- Security requirements
- Performance standards
- File management rules
- Pre-deployment checklist

### `.kluster/context.md`
**Use for:** Understanding the codebase
**Contains:**
- Monorepo structure
- Architecture principles
- Technology stack details
- Common patterns
- Code examples
- Anti-patterns to avoid

---

## 🔗 Additional Resources

- [Kluster.ai Documentation](https://docs.kluster.ai)
- [Kluster.ai Code Review Quickstart](https://docs.kluster.ai/code-reviews/quickstart/)
- [MCP Integration Guide](https://docs.kluster.ai/verify/integrations/mcp/)
- [Hyperscape Development Guidelines](../CLAUDE.md)
- [Hyperscape Architecture](../README.md)

---

## 💡 Example: Complete Code Generation Session

```markdown
**User:** I want to add a cooking skill to the RPG

**AI Agent Prompt:**
I'll implement a cooking skill system for the Hyperscape RPG.

Implementation plan:
1. Create Cooking.hyp app in packages/rpg/apps/
2. Define CookingRecipe type in packages/rpg/types.ts
3. Store recipes in packages/rpg/data/cooking-recipes.json
4. Create real tests with Playwright
5. Use existing Hyperscape ECS/networking

Validating against .kluster/rules.md and .kluster/context.md:
- ✅ TypeScript strict typing (no any types)
- ✅ Real tests (no mocks)
- ✅ External data (JSON, not hardcoded)
- ✅ Hyperscape systems (ECS, networking)
- ✅ Architecture patterns (modular .hyp app)

**AI generates code...**

**Kluster.ai Auto Review:**
✅ isCodeCorrect: true
📝 Explanation: Code follows all Hyperscape patterns
🐛 Issues: [] (zero issues)

**AI runs tests:**
```bash
npm test -- packages/rpg/__tests__/cooking.test.ts
✅ All tests pass
```

**AI:**
Implementation complete! The cooking skill:
- Zero P0/P1 issues from Kluster.ai
- All tests passing
- Ready to commit

Would you like me to commit these changes?
```

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
**Maintainer:** Hyperscape Development Team
