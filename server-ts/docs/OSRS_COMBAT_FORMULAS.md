# OSRS Combat Formulas - Authoritative Reference

## Overview
This document contains the exact OSRS combat formulas as documented on the Old School RuneScape Wiki. All combat calculations in RuneRogue must follow these formulas precisely.

## Maximum Melee Hit Calculation

### Step 1: Calculate Effective Strength Level
```
Effective Strength = floor((floor(floor(Strength Level + Potion Bonus) × Prayer Bonus) + Style Bonus + 8) × Void Bonus)
```

#### Potion Bonuses (additive)
- Strength potion: 3 + floor(0.10 × level)
- Super strength: 5 + floor(0.15 × level)
- Zamorak brew: 2 + floor(0.12 × level)
- Dragon battleaxe special: 10 + floor(0.25 × (floor(0.10 × magic) + floor(0.10 × ranged) + floor(0.10 × defence) + floor(0.10 × attack)))

#### Prayer Bonuses (multiplicative)
- Burst of Strength: 1.05
- Superhuman Strength: 1.10
- Ultimate Strength: 1.15
- Chivalry: 1.18
- Piety: 1.23

#### Style Bonuses (additive)
- Aggressive: +3
- Controlled: +1
- Accurate/Defensive: +0

#### Void Bonus (multiplicative)
- Void melee: 1.10

### Step 2: Calculate Base Damage
```
Base Damage = 0.5 + (Effective Strength × (Strength Bonus + 64)) / 640
Max Hit = floor(Base Damage)
```

### Step 3: Apply Special Attack/Effect Multipliers
```
Max Hit = floor(floor(Base Damage) × Special Bonus)
```

#### Special Attack Multipliers
- Dragon dagger: 1.15 (hits twice)
- Dragon mace: 1.50
- Dragon warhammer: 1.50
- Armadyl godsword: 1.375
- Bandos godsword: 1.21
- Other godswords: 1.10
- Dragon longsword: 1.25

#### Passive Effect Multipliers
- Black mask/Slayer helm (on task): 7/6 (approximately 1.1667)
- Salve amulet: 1.15
- Salve amulet (e): 1.20
- Berserker necklace + obsidian weapon: 1.20
- Dharok's set: 1 + ((Max HP - Current HP) / 100) × (Max HP / 100)
- Inquisitor's armour (crush): 1.025

## Accuracy Calculation

### Step 1: Calculate Effective Attack Level
```
Effective Attack = floor((floor(floor(Attack Level + Potion Bonus) × Prayer Bonus) + Style Bonus + 8) × Void Bonus)
```

#### Style Bonuses (Attack)
- Accurate: +3
- Controlled: +1
- Aggressive/Defensive: +0

### Step 2: Calculate Attack and Defense Rolls
```
Attack Roll = Effective Attack × (Equipment Attack Bonus + 64)
Defense Roll = Effective Defense × (Equipment Defense Bonus + 64)
```

### Step 3: Calculate Hit Chance
```
if (Attack Roll > Defense Roll):
    Hit Chance = 0.5 + (Attack Roll - Defense Roll) / (2 × Attack Roll)
else:
    Hit Chance = 0.5 × Attack Roll / Defense Roll
```

## Defense Calculation

### Effective Defense Level
```
Effective Defense = floor((floor(floor(Defense Level + Potion Bonus) × Prayer Bonus) + Style Bonus + 8) × Void Bonus)
```

#### Style Bonuses (Defense)
- Defensive: +3
- Controlled: +1
- Long range (ranged): +3
- Accurate/Aggressive: +0

## Magic Defense
Magic defense is calculated differently:
- 70% based on Magic level
- 30% based on Defense level

```
Magic Defense = floor(0.7 × Magic Level + 0.3 × Defense Level)
```

## Protection Prayers
- PvM: Reduces damage by 100% (with some exceptions)
- PvP: Reduces damage by 60% (40% damage taken)

## Experience Calculation
- Melee/Ranged: 4 XP per damage
- Magic: 2 XP per damage + base cast XP
- Hitpoints: 1.33 XP per damage

## Important Notes
1. Always use floor() function (round down) unless specified otherwise
2. Order of operations matters - follow the exact formula structure
3. Special attacks consume special energy (varies by weapon)
4. Some monsters have XP multipliers based on their stats

## References
- https://oldschool.runescape.wiki/w/Combat
- https://oldschool.runescape.wiki/w/Maximum_melee_hit
- https://oldschool.runescape.wiki/w/Damage_per_second/Melee