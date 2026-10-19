# Target understanding checklist — RVU Camp
By: Ramez Medhat · rv-u.tech

Build a small map, prioritized questions and evidence for each test before expanding your toolchain.

## 1. Boundaries
- [ ] Record allowed assets, exclusions, account rules and request limits.
- [ ] Verify newly discovered assets are in scope before interacting.
- [ ] Identify your test accounts and available roles.

## 2. Normal behavior
- [ ] Use core features: create, read, update and cancel.
- [ ] Follow requests and responses in Burp Suite.
- [ ] Identify session storage and changes during login and logout.
- [ ] Map workflow steps and allowed state transitions.

## 3. Application map
Create columns for: feature, path, method, role, resource, potential impact and notes.
- [ ] Map relevant paths from application traffic, JavaScript and available documentation.
- [ ] Link identifiers to resources and owners.
- [ ] Identify sensitive features such as recovery, email changes, roles and payments.
- [ ] Record uncertainties instead of assuming answers.

## 4. Testable hypotheses
- [ ] Are roles and resource ownership checked at each step?
- [ ] Does the server validate prices, quantities and state?
- [ ] Do the UI and corresponding API enforce the same rules?
- [ ] Can a state transition happen before its prerequisites?
- [ ] Give each test a baseline, one controlled change, expected outcome and evidence requirement.

## 5. Prioritize and review
- [ ] Start with sensitive features you can verify using appropriate test accounts and resources.
- [ ] Record negative results too.
- [ ] Distinguish server-side impact from local interface changes.
- [ ] Leave yourself a clear next step before stopping.

Measure progress by whether you can explain what you are testing, why it matters and which evidence would confirm the result.
