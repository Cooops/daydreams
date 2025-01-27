# Kamigotchi Game Overview

## Core Concept
Kamigotchi is an on-chain resource gathering game where every action requires a blockchain transaction. Players (Operators) manage creatures (Kamis) to harvest MUSU, the main resource.

## Key Elements
- **MUSU**: Primary resource and currency
- **ONYX**: Required for blockchain transactions
- **Stamina**: Movement resource (max 20, regenerates 1/300s)
- **Time**: 36-hour days (8h Daylight, 8h Evenfall, 8h Moonside)

## Kamigotchi (Kami)
- **Traits**: Body, hands, face, color, background
- **Types**: Normal, Insect, Scrap, Eerie (Type effectiveness: Scrap > Insect > Eerie > Scrap)
- **Stats**: HP, Power, Violence, Harmony
- **Growth**: 1 MUSU = 1 XP, level ups grant skill points

## Core Mechanics
- **Moving**: Use stamina to traverse tiles
- **Harvesting**: Deploy Kamis on nodes to gather MUSU
- **Liquidating**: Defeat other Kamis to steal MUSU
- **Resting**: Regenerate HP while idle
- **Cooldown**: 180s after major actions
- **Scavenging**: Trade harvesting XP for items

## Shop Items
Item | MUSU | Effect
-----|------|--------
Red Gakki Ribbon | 100 | Revive
Ghost Gum | 60 | +25 HP
Fruit Candy | 100 | +50 HP
Cookie Sticks | 160 | +100 HP
Ice Cream | 150-450 | Stamina restore

## Example Basic Harvesting Strategies

### GUM Strategy (25 HP cycles)
- Best for: High-power, low-HP Kamis
- Cost: 2.4 MUSU/HP
- Frequent healing, highest cost

### CANDY Strategy (50 HP cycles)
- Best for: Normal types, (MaxHP - 50) > (HP/2)
- Cost: 2.0 MUSU/HP
- Balanced approach

### COOKIE Strategy (100 HP cycles)
- Best for: Sturdy Kamis, (MaxHP - 100) > (HP/2)
- Cost: 1.6 MUSU/HP
- Most efficient, requires durability

### REST Strategy
- Best for: High Harmony Kamis or low-musu farmers
- No MUSU cost
- Lowest long-term gains

### Core Functions
- `echoKamis` -> gets state for a specific kami
- `feedKami` -> feeds a kami with a specific item
- `movePlayer` -> moves a player to a specific room
- `harvest` -> harvests a node
- `harvest.liquidate` -> stops a kami from harvesting and liquidates the node with rewards
- `rest` -> rests a kami to regenerate hp
- `scavenge` -> scavenges a node for rewards
- `useItem` -> uses an item on a kami

All core functions are mapped in the actions folder. An example of how to use the functions is in the strategies/simple_strategy.ts file. The tests are in tests/testRunner.ts and are integration, example tests right now.
