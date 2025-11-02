# Hyperscape Kluster.ai Code Review Rules

## Overview
This document defines project-specific code review rules for Kluster.ai validation in the Hyperscape monorepo. These rules enforce strict development standards for a real-time 3D multiplayer RPG engine with AI agent integration.

---

## 🎯 Critical Validation Rules (Priority: P0-P1)

### TypeScript Strict Typing (P0)

**FORBIDDEN PATTERNS - Auto-reject code containing:**
```typescript
// ❌ NEVER ALLOW
any type usage: let x: any
unknown type usage: let x: unknown
as any casting: value as any
as unknown casting: value as unknown
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Explicit return types on all public methods
- Non-null assertions when type is guaranteed: value!
- Discriminated unions for variant types
- Type imports: import type { TypeName }
- Classes preferred over interfaces for type definitions
```

**Validation Checks:**
- [ ] No `any` or `unknown` types in modified code
- [ ] All public methods have explicit return types
- [ ] Types imported with `import type` syntax
- [ ] No runtime property existence checks (`'property' in object`)
- [ ] No optional chaining for type narrowing

**Severity:** CRITICAL - Reject code immediately if violations found

---

### Testing Requirements (P0)

**FORBIDDEN PATTERNS - Auto-reject code containing:**
```typescript
// ❌ NEVER ALLOW
Mock/spy frameworks: jest.mock(), sinon.stub()
Test framework abstractions: beforeEach with mocks
Simulated data: mockPlayer = { ... }
Skipped tests: it.skip() or test.skip()
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Real Hyperscape instances with Playwright
- Real gameplay testing (spawn players, fight mobs)
- Visual verification with screenshots
- Three.js scene hierarchy validation
- Multi-modal testing (data + visual)
```

**Validation Checks:**
- [ ] Tests use real Hyperscape instances (no mocks)
- [ ] Browser automation with Playwright for integration tests
- [ ] Visual testing with screenshot verification
- [ ] All new features have corresponding tests
- [ ] No test.skip() or it.skip() in production code
- [ ] Tests save error logs to /logs folder

**Test Proxies for Visual Verification:**
- 🔴 Red cubes = Players
- 🟢 Green cubes = Goblins
- 🔵 Blue cubes = Items
- 🟡 Yellow cubes = Trees
- 🟣 Purple cubes = Banks
- 🟨 Yellow-orange cubes = Stores

**Severity:** CRITICAL - Tests must exist and be real, not mocked

---

### Architecture Compliance (P1)

**FORBIDDEN PATTERNS:**
```typescript
// ❌ NEVER ALLOW
- Hardcoded game data in source code
- New abstractions when Hyperscape systems exist
- Direct Three.js usage without Hyperscape wrappers
- Circular dependencies between packages
- RPG code mixed with Hyperscape core
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Use existing Hyperscape systems (ECS, physics, networking)
- Separate data from logic (data in JSON/external files)
- Build features as self-contained modules
- Use workspace imports for package communication
- Keep RPG isolated as standalone .hyp app
```

**Package Structure Validation:**
```
hyperscape/
├── packages/hyperscape/          # Core engine ONLY
├── packages/rpg/                 # RPG as separate .hyp apps
├── packages/generation/          # AI content creation
├── packages/test-framework/      # Visual testing system
└── packages/plugin-hyperscape/   # ElizaOS integration
```

**Validation Checks:**
- [ ] No hardcoded data arrays/objects in TypeScript files
- [ ] Use existing Hyperscape abstractions before creating new ones
- [ ] No circular dependencies (run `madge --circular`)
- [ ] RPG code isolated from Hyperscape core
- [ ] Features are modular and self-contained

---

## 🔒 Security Requirements (Priority: P1-P2)

### API Keys & Credentials (P1)

**FORBIDDEN PATTERNS:**
```typescript
// ❌ NEVER ALLOW
Hardcoded API keys: const API_KEY = "sk-abc123"
Credentials in source: const PASSWORD = "secret"
Tokens in commits: Bearer eyJhbGciOiJIUzI1NiIs...
Database URLs hardcoded: postgresql://user:pass@host
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- All secrets in .env file at root
- Use dotenv package: process.env.API_KEY
- Document required keys in .env.example
- Never commit .env files
```

**Validation Checks:**
- [ ] No API keys or secrets in modified files
- [ ] All credentials loaded from process.env
- [ ] .env.example updated if new secrets added
- [ ] Secrets documented in configuration files

---

### Authentication & Data Protection (P2)

**REQUIRED PATTERNS:**
- Privy handles all authentication (industry-standard)
- JWT tokens for secure session management
- No passwords stored on Hyperscape servers
- Automatic session refresh and token rotation
- Support both Web3 and traditional auth

**Validation Checks:**
- [ ] No custom password storage implementation
- [ ] Use Privy SDK for authentication
- [ ] JWT tokens validated on server
- [ ] Sensitive data encrypted in database

---

## ⚡ Performance Standards (Priority: P2-P3)

### Hyperscape Engine Optimization (P2)

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Use Hyperscape abstractions where possible
- Minimize test-specific code and objects
- Optimize for 50-100 concurrent players
- Implement proper cleanup on unmount
- Use existing scene hierarchy patterns
```

**FORBIDDEN PATTERNS:**
```typescript
// ❌ PERFORMANCE ISSUES
- Memory leaks (missing cleanup)
- Unnecessary object creation in loops
- Synchronous blocking operations
- Unoptimized database queries
```

**Validation Checks:**
- [ ] No memory leaks (proper disposal/cleanup)
- [ ] Database queries use proper indexing
- [ ] Optimized for multiplayer (50-100 players)
- [ ] Three.js objects properly disposed
- [ ] No blocking synchronous operations in hot paths

---

### Database Performance (P3)

**REQUIRED PATTERNS:**
- SQLite handles thousands of players efficiently
- Use proper indexing for player data
- Optimize queries for real-time updates
- Batch operations where possible

**Validation Checks:**
- [ ] Database migrations included for schema changes
- [ ] Indexes created for frequently queried fields
- [ ] No N+1 query patterns
- [ ] Batch updates for bulk operations

---

## 📁 File Management & Code Quality (Priority: P2-P3)

### File Management (P2)

**FORBIDDEN PATTERNS:**
```typescript
// ❌ NEVER ALLOW
- Creating new files when existing can be modified
- Leaving orphaned files (Player_v2.ts alongside Player.ts)
- Missing import updates after file moves
- TODO comments in production code
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Revise existing files instead of creating _v2 versions
- Delete old files completely when replacing
- Update all imports in dependent files
- Implement complete functionality (no TODOs)
```

**Validation Checks:**
- [ ] No duplicate versioned files (e.g., file_v2.ts)
- [ ] All imports updated if files moved/renamed
- [ ] No orphaned files left in codebase
- [ ] No TODO or FIXME comments in new code
- [ ] Complete implementations only

---

### Code Quality Standards (P3)

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Production code only (no example/demo code)
- Complete functionality, no partial implementations
- Fix root causes, not symptoms
- Research existing Hyperscape systems first
```

**FORBIDDEN PATTERNS:**
```typescript
// ❌ NEVER ALLOW
- Example code: // This is just an example
- Placeholder implementations: throw new Error("Not implemented")
- Workarounds: // HACK: This is a temporary fix
- Commented-out code blocks
```

**Validation Checks:**
- [ ] No example or demo code
- [ ] No "Not implemented" errors
- [ ] No commented-out code blocks
- [ ] No HACK or FIXME comments
- [ ] Complete, production-ready implementations

---

## 🔧 Development Workflow (Priority: P3-P4)

### Environment Configuration (P3)

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED
- Environment variables in .env with dotenv
- Hyperscape isolated from RPG code
- Self-contained packages with workspace imports
- Proper package.json workspace configuration
```

**Validation Checks:**
- [ ] Environment variables used correctly
- [ ] Package boundaries respected
- [ ] No cross-package imports without workspace
- [ ] Dependencies properly declared in package.json

---

### API Standards (P4)

**REQUIRED PATTERNS:**
```typescript
// ✅ API ENDPOINT PATTERNS
GET /api/state                           // Available state queries
GET /api/state/player-stats?playerId=123 // Player information
POST /api/actions/attack                 // Execute player actions
GET /api/actions/available?playerId=123  // Available actions
```

**REQUIRED DOCUMENTATION:**
- Document all new API endpoints thoroughly
- Include request/response examples
- Specify required parameters and authentication
- Maintain API versioning for breaking changes

**Validation Checks:**
- [ ] New endpoints follow REST conventions
- [ ] API documentation updated
- [ ] Request validation implemented
- [ ] Error responses are meaningful
- [ ] Authentication/authorization checked

---

## 📊 Pre-Deployment Compliance Checklist

**Before approving ANY code, verify:**

### Critical (P0-P1) - Must Pass
- [ ] No `any` or `unknown` types in production code
- [ ] All tests pass (zero failing tests allowed)
- [ ] All features have real tests (no mocks/spies)
- [ ] No hardcoded API keys or credentials
- [ ] TypeScript strict typing enforced throughout
- [ ] No circular dependencies

### Important (P2-P3) - Should Pass
- [ ] Error logs properly handled and saved to /logs
- [ ] Performance impact assessed for multiplayer
- [ ] Security implications reviewed
- [ ] File dependencies updated (imports, references)
- [ ] No duplicate/versioned files left behind
- [ ] Documentation current and complete

### Recommended (P4-P5) - Good to Have
- [ ] Backward compatibility maintained
- [ ] API documentation updated
- [ ] Code follows existing patterns
- [ ] Memory cleanup implemented

---

## 🚨 Auto-Reject Scenarios

**Immediately reject code (P0) if it contains:**
1. Any use of `any` or `unknown` types
2. Mock/spy test frameworks or simulated data
3. Hardcoded API keys or credentials in source
4. Skipped tests (test.skip or it.skip)
5. Incomplete implementations with TODO comments
6. `as any` or `as unknown` type casting

**Flag for manual review (P1) if it contains:**
1. New abstractions when Hyperscape systems exist
2. Hardcoded game data in source files
3. Missing tests for new features
4. Circular dependencies between packages
5. Performance issues (memory leaks, blocking ops)
6. Duplicate/versioned files (file_v2.ts)

---

## 📚 Technology Stack Context

### Core Technologies
- **Hyperscape** - Real-time 3D metaverse engine (Three.js + PhysX)
- **ElizaOS** - AI agent framework for autonomous players
- **TypeScript** - Strict type-safe development
- **Three.js** - 3D graphics and rendering
- **PhysX** - Physics simulation and collision
- **Playwright** - Browser automation for testing
- **SQLite/PostgreSQL** - Persistent database
- **LiveKit** - Voice chat and WebRTC

### Package Responsibilities
- `packages/hyperscape/` - Core 3D engine, ECS, networking
- `packages/rpg/` - RuneScape-style RPG implementation
- `packages/generation/` - GPT-4 + MeshyAI content generation
- `packages/test-framework/` - Visual testing with Playwright
- `packages/plugin-hyperscape/` - ElizaOS AI agent integration

---

## 🎯 Code Review Focus Areas

### By Issue Type

**Semantic Issues (P0-P1):**
- TypeScript type safety violations
- Incorrect type assertions or casts
- Missing or incorrect type definitions

**Intent Issues (P0-P1):**
- Code doesn't match Hyperscape architecture patterns
- Violates project development principles
- Creates new abstractions unnecessarily

**Logical Issues (P1-P2):**
- Control flow errors
- Incorrect algorithm implementation
- Edge cases not handled

**Security Issues (P1-P2):**
- Exposed credentials or API keys
- Missing authentication checks
- Vulnerable dependencies
- SQL injection risks

**Knowledge Issues (P2-P3):**
- Not using existing Hyperscape systems
- Reinventing functionality
- Ignoring established patterns

**Performance Issues (P2-P3):**
- Memory leaks (missing cleanup)
- Inefficient database queries
- Blocking operations in hot paths
- Unoptimized Three.js usage

**Quality Issues (P3-P4):**
- Incomplete implementations
- Poor code organization
- Missing documentation
- Duplicate code

---

## 💡 Issue Response Format

When reporting issues, use this format:

```json
{
  "type": "Semantic|Intent|Logical|Security|Knowledge|Performance|Quality",
  "severity": "Low|Medium|High|Critical",
  "priority": "P0|P1|P2|P3|P4|P5",
  "file": "path/to/file.ts",
  "line": 42,
  "description": "Clear description of the issue",
  "recommendation": "Specific fix or improvement",
  "code_snippet": "Problematic code excerpt",
  "fix_example": "Suggested corrected code"
}
```

**Priority Mapping:**
- P0: Critical semantic/intent violations (any types, mocks in tests)
- P1: Security issues, architecture violations, missing tests
- P2: Performance issues, file management problems
- P3: Code quality, documentation gaps
- P4: Minor improvements, style issues
- P5: Nice-to-have optimizations

---

## 🔗 Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Complete development guidelines
- [README.md](/README.md) - Project overview and setup
- [LORE.md](/LORE.md) - Game world and lore
- [packages/hyperscape/README.md](/packages/hyperscape/README.md) - Engine docs
- [packages/plugin-hyperscape/README.md](/packages/plugin-hyperscape/README.md) - AI agent integration

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
**Maintainer:** Hyperscape Development Team
