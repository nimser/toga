# AI Workflow: Test-Driven Development (TDD)

Follow the RED->GREEN->REFACTOR cycle for all coding tasks:

1.  **RED**:
    - AI: Write a single, small test for the next piece of functionality.
    - AI: Confirm with user, then run tests. Verify the new test FAILS for the EXPECTED reason. Show user.
2.  **GREEN**:
    - AI: Write the MINIMAL code to make the failing test (and all others) PASS.
    - AI: Confirm with user, then run tests. Verify ALL tests now PASS. Show user.
3.  **REFACTOR**:
    - AI: If needed, propose specific code improvements (clarity, duplication, style).
    - AI: Confirm with user. After each small refactor, run tests and ensure ALL PASS. Show user.

**Key AI Actions**:

- Always confirm phase transitions (RED->GREEN, GREEN->REFACTOR) with the user.
- Show test results to the user after each RED and GREEN step.
- Take small, incremental steps.
