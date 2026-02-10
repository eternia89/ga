# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`)
- Config: No separate config file (runner invoked directly)

**Assertion Library:**
- `node:assert` (built-in)

**Run Commands:**
```bash
# No test scripts in package.json
# Tests are located in .claude/get-shit-done/bin/gsd-tools.test.js
# Run via: node <test-file>
```

## Test File Organization

**Location:**
- Co-located with source: `.claude/get-shit-done/bin/gsd-tools.test.js` next to `gsd-tools.js`
- No tests for main application code (`app/`) detected

**Naming:**
- Pattern: `*.test.js`
- Alternative patterns (`.spec.js`, `.test.ts`, `.test.tsx`) not used

**Structure:**
```
.claude/get-shit-done/bin/
├── gsd-tools.js
└── gsd-tools.test.js
```

## Test Structure

**Suite Organization:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('feature name', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('specific behavior', () => {
    // Arrange
    const result = runCommand(args, tmpDir);

    // Assert
    assert.ok(result.success, 'should succeed');
    assert.strictEqual(output.field, 'expected');
  });
});
```

**Patterns:**
- Setup in `beforeEach`, teardown in `afterEach`
- Descriptive test names using plain English
- Assertions use `assert.ok()`, `assert.strictEqual()`, `assert.deepStrictEqual()`
- Error messages provided as second argument to assertions

## Mocking

**Framework:** Not applicable (integration tests)

**Patterns:**
- Tests use real filesystem via temporary directories
- `fs.mkdtempSync()` creates isolated test environments
- `fs.rmSync()` cleans up after tests
- No mocking libraries detected

**What to Mock:**
- Not applicable (integration testing approach)

**What NOT to Mock:**
- Filesystem operations (tests use real fs in temp dirs)
- Child processes (tests invoke real commands via `execSync`)

## Fixtures and Factories

**Test Data:**
```javascript
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Inline fixtures for markdown content
fs.writeFileSync(
  path.join(phaseDir, '01-01-SUMMARY.md'),
  `---
one-liner: Set up database
key-files:
  - prisma/schema.prisma
---`
);
```

**Location:**
- Inline within test files (no separate fixtures directory)
- Factory functions defined at top of test file

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:**
- Not present for main application code

**Integration Tests:**
- All tests in `gsd-tools.test.js` are integration tests
- Test full command execution with real filesystem
- Verify command output (JSON parsing)
- Check file creation/modification side effects

**E2E Tests:**
- Not used

## Common Patterns

**Async Testing:**
- Not needed (commands are synchronous via `execSync`)
- Tests are synchronous

**Error Testing:**
```javascript
test('fails for nonexistent resource', () => {
  const result = runCommand('invalid-arg', tmpDir);
  assert.ok(!result.success, 'should fail');
  assert.ok(result.error.includes('expected message'), 'error mentions issue');
});
```

**File System Testing:**
```javascript
// Verify file exists
assert.ok(
  fs.existsSync(path.join(tmpDir, '.planning', 'file.md')),
  'file should be created'
);

// Verify file content
const content = fs.readFileSync(path.join(tmpDir, 'file.md'), 'utf-8');
assert.ok(content.includes('expected'), 'content should match');
```

**JSON Output Testing:**
```javascript
const result = runCommand('json-command', tmpDir);
assert.ok(result.success, `Command failed: ${result.error}`);

const output = JSON.parse(result.output);
assert.strictEqual(output.field, 'value', 'field should match');
```

## Application Testing Status

**Main Application (`app/`):**
- No tests detected
- No testing framework configured for Next.js/React components
- No test runner scripts in `package.json`

**Recommended Setup (Not Currently Implemented):**
- Jest or Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

---

*Testing analysis: 2026-02-10*
