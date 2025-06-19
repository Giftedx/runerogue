# 🚨 AGENT BLOCKERS & ISSUES

**Purpose:** Track blockers that prevent agent progress  
**Action Required:** Master Orchestrator intervention when blockers appear

---

## 🔴 CRITICAL BLOCKERS

_Issues that completely stop progress_

### agent/osrs-data

- **None reported**

### agent/backend-infra

- **None reported**

### agent/qa-tester

- **Status:** Waiting for osrs-data implementation (expected, not a blocker)

---

## 🟡 WARNINGS

_Issues that slow progress but don't stop it_

### agent/osrs-data

- **None reported**

### agent/backend-infra

- **None reported**

---

## 📝 BLOCKER TEMPLATE

When reporting a blocker, use this format:

```
### [AGENT NAME] - [BLOCKER TITLE]
**Severity:** Critical/High/Medium
**Time Blocked:** [Duration]
**Description:** [What is blocking you]
**Attempted Solutions:** [What you've tried]
**Required Action:** [What you need to proceed]
**Impact:** [What this blocks downstream]
```

---

## 🔧 RESOLVED BLOCKERS

_For tracking what was fixed and how_

### Example Format:

```
**Blocker:** [Description]
**Resolution:** [How it was fixed]
**Time to Resolve:** [Duration]
**Resolved By:** [Agent/Orchestrator]
```

---

**Master Orchestrator Monitoring:** Active  
**Response Time Target:** < 1 hour for critical blockers
