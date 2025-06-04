# OSRS Research Prompt Templates

# For use with advanced MCP research ecosystem

## 🏦 **Grand Exchange Economy Analysis**

### Deep Research Template (GPT Researcher)

```
Conduct comprehensive research on the current Old School RuneScape Grand Exchange economy:

**Primary Research Areas:**
1. **Market Trends (June 2025)**:
   - Top 20 most traded items and their price movements
   - Seasonal patterns affecting item values
   - Impact of recent game updates on economy

2. **High-Value Items Analysis**:
   - Rare item price fluctuations (Party hats, 3rd age equipment)
   - Weapon and armor market stability
   - Resource and commodity pricing trends

3. **Player Behavior Patterns**:
   - Trading volume analysis by time of day/week
   - Geographic trading patterns (world-specific trends)
   - Bot activity impact on market prices

4. **Economic Indicators**:
   - Inflation/deflation trends
   - Gold sink effectiveness
   - New content impact on economy

**Research Requirements:**
- Use multiple data sources and cross-reference findings
- Include price charts and trend analysis where available
- Cite official Jagex announcements and community sources
- Provide 3-month and 1-year trend comparisons
```

### Advanced Scraping Template (Firecrawl)

```
Extract comprehensive Grand Exchange data using structured scraping:

**Target Sites:**
- Official OSRS Grand Exchange (secure.runescape.com/m=itemdb_oldschool)
- OSRS Wiki Grand Exchange pages
- Third-party price tracking sites (GE Tracker, OSRS Exchange)

**Data Extraction Schema:**
{
  "item_name": "string",
  "current_price": "number",
  "price_change_24h": "number",
  "price_change_percentage": "number",
  "volume_traded": "number",
  "high_alch_value": "number",
  "category": "string",
  "last_updated": "datetime",
  "trend_direction": "string",
  "market_cap_estimate": "number"
}

**Scraping Instructions:**
- Extract data for top 100 most traded items
- Handle JavaScript-rendered content
- Capture historical price charts if available
- Monitor for anti-bot measures and adjust accordingly
```

---

## ⚔️ **Item Meta Analysis**

### Combat Equipment Research

```
Research current combat equipment meta for Old School RuneScape:

**Analysis Focus:**
1. **Weapon Tier Analysis**:
   - DPS calculations for popular weapon combinations
   - Cost-effectiveness of different tier equipment
   - Niche weapon applications and market prices

2. **Armor Market Analysis**:
   - Tank vs. DPS armor price comparisons
   - Fashionscape items and their premium pricing
   - Set effect items vs. individual pieces

3. **Special Attack Weapons**:
   - PvP weapon demand and pricing
   - Boss-specific weapon markets
   - Rare drop weapon economics

**Sources to Research:**
- Official OSRS combat formulas
- DPS calculator websites
- PvP community discussions
- Speedrunning community equipment choices
```

---

## 📊 **Market Prediction Research**

### Trend Forecasting Template

```
Analyze factors that could influence OSRS economy in the next 3-6 months:

**Prediction Factors:**
1. **Upcoming Game Updates**:
   - Announced content releases
   - Potential new items and their market impact
   - Balance changes affecting existing items

2. **Seasonal Events**:
   - Holiday event impacts on cosmetic items
   - Double XP weekend effects on consumables
   - Summer/winter player activity patterns

3. **External Factors**:
   - Real-world economic conditions affecting RWT
   - Competitor game releases
   - Streaming/content creator influence on trends

4. **Technical Analysis**:
   - Support and resistance levels for major items
   - Volume analysis for market manipulation detection
   - Correlation analysis between different item categories

**Deliverables:**
- 3-month price predictions for top 20 items
- Risk assessment for each prediction
- Investment opportunities and warnings
```

---

## 🤖 **Bot Detection & Market Manipulation**

### Advanced Pattern Analysis

```
Investigate potential market manipulation and bot activity:

**Research Areas:**
1. **Trading Pattern Analysis**:
   - Unusual volume spikes and their sources
   - Price manipulation indicators
   - Bot trading signatures vs. human trading

2. **Cross-Reference Investigation**:
   - Compare multiple data sources for discrepancies
   - Identify coordinated buying/selling patterns
   - Track suspicious account clusters

3. **Historical Manipulation Cases**:
   - Document past market manipulation events
   - Analyze Jagex's response to manipulation
   - Learn from community-detected bot operations

**Tools for Investigation:**
- Statistical analysis of trading patterns
- Cross-platform price comparison
- Volume-price relationship analysis
- Time-series anomaly detection
```

---

## 🏗️ **Skill Economy Analysis**

### Resource Market Research

```
Analyze the economics of skill-related resources and outputs:

**Research Categories:**
1. **Gathering Skills**:
   - Mining: Ore prices vs. mining effort
   - Fishing: Food prices and fishing profitability
   - Woodcutting: Log values and processing margins

2. **Processing Skills**:
   - Smithing: Raw material costs vs. finished product values
   - Cooking: Raw food vs. cooked food profit margins
   - Crafting: Component costs vs. finished item prices

3. **Service Skills**:
   - Construction: Material costs for popular room setups
   - Prayer: Bone/ash prices and XP efficiency
   - Magic: Rune costs for popular spells

**Analysis Framework:**
- Profit per hour calculations
- XP cost analysis
- Market saturation indicators
- Skill requirement barriers affecting supply
```

---

## 📱 **Multi-Platform Data Integration**

### Comprehensive Data Pipeline

```
Create a unified view of OSRS economy data from multiple sources:

**Data Sources Integration:**
1. **Official Sources**:
   - Jagex Grand Exchange API
   - Official game statistics
   - Developer blog announcements

2. **Community Sources**:
   - OSRS Wiki price data
   - Reddit community discussions
   - Discord server trading channels

3. **Third-Party Tools**:
   - Price tracking websites
   - DPS calculators
   - XP efficiency calculators

**Integration Strategy:**
- Real-time data synchronization
- Historical data preservation
- Cross-source validation
- Automated anomaly detection
```

---

## 🎯 **Quick Research Templates**

### Daily Market Check (Tavily)

```
Quick daily check: "What are the current OSRS Grand Exchange trending items and any major price changes in the last 24 hours?"
```

### Update Impact Assessment (GPT Researcher)

```
"Analyze the economic impact of [specific OSRS update] on the Grand Exchange market, including affected items and predicted long-term effects."
```

### Real-time Price Extraction (Firecrawl)

```
"Extract current prices for [item list] from the OSRS Grand Exchange and compare with historical averages."
```

---

**Usage Notes:**

- Use GPT Researcher for comprehensive, multi-source analysis
- Use Firecrawl for structured data extraction from gaming websites
- Use Tavily for quick fact-checking and recent news
- Combine all three for complete market research pipelines
- Customize prompts based on specific research goals

**Remember**: Always respect website terms of service and rate limits when scraping data!
