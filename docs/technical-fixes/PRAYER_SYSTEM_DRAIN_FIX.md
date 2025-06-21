# PrayerSystem Drain Logic Fix - Technical Analysis

## Issue Summary

The PrayerSystem drain logic was not working correctly in unit tests. Prayer points never drained and the drain timer never accumulated, remaining at 0 after each system tick.

## Root Cause Analysis

The issue was discovered through systematic debugging and minimal test case creation. The root cause was **improper bitECS component initialization**.

### The Problem

In bitECS, components must be **explicitly added to entities** using `addComponent(world, Component, eid)` before the component data can be reliably accessed and persisted. The original test was:

```typescript
// INCORRECT - Component not properly registered
const eid = addEntity(world);
Prayer.current[eid] = 10; // Setting data directly
Prayer.activeMask[eid] = 1 << 0; // Without addComponent first
// Prayer.drainTimer[eid] remains undefined/not persistent
```

This resulted in:

- Component data appearing to be set initially
- Data not persisting between system calls
- `Prayer.drainTimer[eid]` always returning 0
- No actual prayer drain occurring

### The Solution

```typescript
// CORRECT - Component properly registered first
const eid = addEntity(world);
addComponent(world, Prayer, eid); // Register component with entity
Prayer.current[eid] = 10; // Now data persists correctly
Prayer.activeMask[eid] = 1 << 0;
// Prayer.drainTimer[eid] now accumulates properly
```

## Diagnostic Process

### Step 1: Identified Symptoms

- Debug output showed `drainTimer(before/after): 0 -> 0` consistently
- Timer never accumulated despite system logic appearing correct
- Prayer points never decreased

### Step 2: Created Minimal Test Cases

Created two test cases to isolate the issue:

1. **Working case**: Properly using `addComponent`
2. **Broken case**: Setting component data without `addComponent`

### Step 3: Confirmed Root Cause

The minimal tests proved that:

- With `addComponent`: Timer accumulates correctly (0 → 600 → 1200 → 1800)
- Without `addComponent`: Timer remains at 0 permanently

## bitECS Best Practices

### Component Lifecycle Management

1. **Always call `addComponent` first**:

   ```typescript
   const eid = addEntity(world);
   addComponent(world, SomeComponent, eid);
   SomeComponent.field[eid] = value;
   ```

2. **Component queries only work on properly registered components**:

   ```typescript
   const query = defineQuery([Prayer]);
   // Only returns entities that have had addComponent called
   ```

3. **Data persistence requires proper registration**:
   - Direct field assignment without `addComponent` may work initially
   - But data won't persist across system calls
   - This can create subtle, hard-to-debug issues

### Common Pitfalls

1. **Setting component data without addComponent**
2. **Assuming direct field access is sufficient**
3. **Not understanding the difference between component definition and registration**

## OSRS Authenticity Maintained

The fix ensures proper OSRS prayer mechanics:

- **THICK_SKIN Prayer**: drainRate = 1/6 points per 3 seconds
- **Converted to system format**: 1/6 × 20 = 3.33 points per minute
- **Proper timing**: 600ms ticks (OSRS game tick)
- **Equipment bonuses**: +1 prayer bonus = +3.333% duration

### Test Results After Fix

Both tests now pass correctly:

1. **Basic drain test**: Prayer depletes at correct OSRS rate
2. **Equipment bonus test**: +15 prayer bonus properly extends duration by 50%

## Files Modified

### Fixed Files

- `packages/game-server/src/ecs/systems/__tests__/PrayerSystem.test.ts`
  - Added `addComponent(world, Prayer, eid)` calls
  - Both test cases now pass

### Enhanced Documentation

- `packages/game-server/src/ecs/systems/PrayerSystem.ts`
  - Added comprehensive JSDoc warning about component registration requirement

## Prevention Measures

1. **Always follow the bitECS component pattern**:

   ```typescript
   // Create entity
   const eid = addEntity(world);

   // Add component
   addComponent(world, ComponentName, eid);

   // Set component data
   ComponentName.field[eid] = value;
   ```

2. **Component setup helpers could be created**:

   ```typescript
   function createPlayerEntity(world: IWorld, sessionId: string): number {
     const eid = addEntity(world);
     addComponent(world, Player, eid);
     addComponent(world, Position, eid);
     addComponent(world, Health, eid);
     addComponent(world, Prayer, eid);
     // ... set initial values
     return eid;
   }
   ```

3. **Test patterns should always use proper component setup**

## Conclusion

This fix resolves the PrayerSystem drain logic completely while maintaining full OSRS authenticity. The root cause was a subtle but critical bitECS usage pattern that affects component data persistence. The solution is simple but essential: always call `addComponent` before setting component data.

**All prayer drain logic now works correctly with authentic OSRS timing and mechanics.**
