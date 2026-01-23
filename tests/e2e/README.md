# E2E Tests for TechGuard AI

## Overview

These End-to-End (E2E) tests verify the safety-critical features of TechGuard AI's Guardian Agent and Isolation Protocol. These tests are written using **Playwright** and should be run regularly to ensure the safety systems are functioning correctly.

⚠️ **CRITICAL**: The "Death Jump" test (`death-jump.spec.ts`) is the most important test in the entire system. It MUST ALWAYS PASS.

## Test Files

### 1. `death-jump.spec.ts` - The Death Jump Test (T044)

**Purpose**: Verifies that the Guardian Agent blocks dangerous terminal jumps that could cause electrical hazards.

**Key Test Cases**:
- Guardian blocks dangerous "Terminal 29 to Terminal 21" request within 2 seconds
- Chat input is disabled after blocking
- Isolation Protocol is triggered
- Safety lockout modal appears
- Multiple phrasings of the same dangerous request are all blocked
- Safe questions pass through without blocking

**Success Criteria**:
- Response time < 2 seconds
- Critical safety warning displayed
- Chat input disabled
- Cannot bypass through rephrasing

### 2. `safety-lockout.spec.ts` - Safety Lockout Modal (T045)

**Purpose**: Verifies the safety lockout modal appears and functions correctly when dangerous requests are blocked.

**Key Test Cases**:
- Modal appears immediately after Guardian blocks request
- Chat input remains disabled while modal is active
- Modal shows the dangerous action that was blocked
- Clear safety instructions are provided
- Modal cannot be dismissed without completing safety protocol
- Severity level is displayed
- Photo upload option is available
- Lockout state persists across page refreshes

### 3. `photo-verification.spec.ts` - Photo Verification Workflow (T046)

**Purpose**: Verifies the Isolation Protocol's photo verification system works correctly.

**Key Test Cases**:
- Photo upload interface is accessible
- Valid disconnection photos unlock the chat
- Photos showing power still connected are rejected
- Blurry or unclear photos are rejected
- Photos of wrong equipment are rejected
- Vision model analysis results are displayed
- Verification state persists across refreshes
- Photo verification is logged in incident history

## Setup

### Install Dependencies

```bash
npm install @playwright/test --save-dev
```

### Configure Playwright

Playwright should already be configured in `playwright.config.ts`. Verify the configuration includes:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

### Test Fixtures Required

Before running `photo-verification.spec.ts`, create test image fixtures in `tests/fixtures/`:

1. **power-disconnected.jpg** - Photo showing clearly disconnected power (valid case)
2. **power-connected.jpg** - Photo showing power still connected (invalid case)
3. **blurry-image.jpg** - Blurry or low-quality photo (invalid case)
4. **wrong-equipment.jpg** - Photo of different equipment (invalid case)
5. **test-document.txt** - Text file for file type validation

You can use placeholder images during development, but real photos should be used for integration testing.

### Test Database

These tests require a test database with:
- Test user: `technician@testorg.com` / `testpassword123`
- Sample organization data
- Sample safety blacklist entries (including Terminal 29/21 danger)

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

Or with Playwright directly:

```bash
npx playwright test tests/e2e
```

### Run Specific Test File

```bash
# Death Jump test only
npx playwright test tests/e2e/death-jump.spec.ts

# Safety Lockout test only
npx playwright test tests/e2e/safety-lockout.spec.ts

# Photo Verification test only
npx playwright test tests/e2e/photo-verification.spec.ts
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test tests/e2e --headed
```

### Run with Debug Mode

```bash
npx playwright test tests/e2e --debug
```

### Generate Test Report

```bash
npx playwright test tests/e2e --reporter=html
npx playwright show-report
```

## Expected Test Status (During Development)

### Phase 1: After Creating Tests (Current)
✅ Tests created
❌ All tests should **FAIL** (features not implemented yet)

This is **EXPECTED** and **CORRECT**. We follow Test-Driven Development (TDD):
1. Write tests first
2. Run tests (they should fail)
3. Implement features
4. Run tests again (they should pass)

### Phase 2: After Implementing Guardian Agent
✅ death-jump.spec.ts tests should **PASS**
✅ safety-lockout.spec.ts tests should **PASS**
❌ photo-verification.spec.ts tests may still **FAIL** (vision model not implemented)

### Phase 3: After Implementing Photo Verification
✅ **ALL TESTS SHOULD PASS**

## Test Data Requirements

### Safety Blacklist Entries

The database should contain safety blacklist entries for:
- "Terminal 29 to Terminal 21" jumps
- Bypassing safety interlocks
- Working on live circuits
- Testing energized equipment
- Overriding safety switches

### Test User Credentials

```
Email: technician@testorg.com
Password: testpassword123
Role: technician
Organization: Test Organization
```

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests Timeout

If tests timeout waiting for elements:
1. Check that Next.js dev server is running
2. Verify database is seeded with test data
3. Ensure test user exists and can log in

### Photo Verification Tests Fail

1. Verify test fixture images exist in `tests/fixtures/`
2. Check that vision model API is configured
3. Ensure file upload is working in the application

### Cannot Find Elements

If tests can't find `data-testid` elements:
1. Verify the components have been implemented
2. Check that `data-testid` attributes match the test expectations
3. Run in headed mode (`--headed`) to see what's rendered

## Test Maintenance

### When to Update Tests

Update tests when:
- Component structure changes (update `data-testid` selectors)
- New safety features are added
- User flow changes
- New dangerous procedures are identified

### Adding New Test Cases

When adding new dangerous procedures to the blacklist:
1. Add test case to `death-jump.spec.ts`
2. Verify Guardian blocks the request
3. Update safety blacklist database

## Safety-Critical Testing Requirements

⚠️ **THESE TESTS MUST PASS BEFORE PRODUCTION DEPLOYMENT**

The following tests are safety-critical and must pass before any production release:
- All tests in `death-jump.spec.ts`
- All tests in `safety-lockout.spec.ts`
- Photo verification tests in `photo-verification.spec.ts`

Failure of any safety-critical test should **BLOCK DEPLOYMENT**.

## Contact

For issues with tests or to report safety concerns:
- Create an issue in the repository
- Tag as `safety-critical` if it affects Guardian Agent functionality
