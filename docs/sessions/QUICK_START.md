# RuneRogue - Next Session Quick Start

## 🚨 CRITICAL ISSUES (Fix First)

1. **Missing Module**: `packages/osrs-data/src/skills/gathering-data`

   - 71 test suites failing due to this
   - Check if file exists or fix import paths

2. **Colyseus Schema Errors**:

   - `view.isChangeTreeVisible is not a function`
   - `encoder.hasChanges is not a function`
   - Version compatibility issues

3. **Test Server Setup**: ColyseusTestServer transport layer missing

## 🔧 First Commands to Run

```bash
# Check project state
cd runerogue
ls -la packages/osrs-data/src/skills/
pnpm list @colyseus/schema

# Try to fix
pnpm install
pnpm run build
pnpm test --testPathPattern=osrs-data
```

## 📊 Current Status

- **Tests**: 71 failed, 36 passed (107 total)
- **Issue**: Infrastructure broken, but architecture is solid
- **Goal**: Stabilize test suite, then build features

## 🎯 Success Criteria

- [ ] Fix missing module errors
- [ ] Get test pass rate above 50%
- [ ] Restore ECS functionality
- [ ] Multiplayer server working

See `NEXT_SESSION_PROMPT.md` for complete details.
