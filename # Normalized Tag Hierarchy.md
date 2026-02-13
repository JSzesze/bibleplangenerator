# Normalized Tag Hierarchy

This document defines the canonical category and system tag structure for product organization.

## Tag Format

- All tags are lowercase, hyphenated

- Categories: `cat-{category}`

- Systems: `system-{system}`

- Brands: `brand-{brand}`

- Series: `series-{series}` (engine platforms only)

- Types: `type-{type}`

---

## Categories & Systems

### cat-engines

Engine & Power Plant

| System Tag | Display Name |

|------------|--------------|

| system-fuel-and-air | Fuel & Air |

| system-ignition-electrical | Ignition & Electrical |

| system-battery-charger | Battery & Chargers |

| system-assembly-timing | Assembly & Timing |

| system-carburetor | Carburetor |

| system-clutch-group | Clutch Group |

| system-gearbox | Gearbox |

| system-crankcase-crankshaft | Crankcase & Crankshaft |

| system-exhaust | Exhaust |

| system-cylinder-head | Cylinder & Head |

| system-piston | Piston |

| system-shifting-group | Shifting Group (KZ & DD2) |

| system-cooling | Cooling |

| system-intake-airbox | Intake & Airbox |

| system-engine-accessories | Mounting & Accessories |

| system-engine-tools | Tools |

| system-e-rave | E-Rave (Rotax) |

---

### cat-components

Chassis Components

| System Tag | Display Name |

|------------|--------------|

| system-axle-group | Axle Group |

| system-bodywork | Bodywork |

| system-braking-group | Braking Group |

| system-bumpers | Bumpers |

| system-cables-clamps | Cables & Clamps |

| system-chain | Chain |

| system-decals | Decals & Stickers |

| system-engine-mounts | Engine Mounts & Chain Guard |

| system-exhaust-supports | Exhaust Support |

| system-floor-trays | Floor Trays |

| system-fuel-systems | Fuel Systems |

| system-pedal-group | Pedal Group |

| system-seat-supports | Seat & Supports |

| system-sprocket-group | Sprocket Group |

| system-frame-structure | Frame & Structure |

| system-steering-group | Steering Group |

| system-torsion-bars | Torsion Bar |

| system-water-pump-cooling | Water Pumps & Cooling Equipment |

| system-wheels-hubs | Wheels & Hubs |

| system-hardware | Hardware |

| system-ballast | Lead & Ballast |

---

### cat-chassis

Chassis (Kart Builder Flow)

*&gt;* **Note:** *Chassis products trigger a Kart Builder wizard flow rather than standard filtering.*

| System Tag | Display Name | Builder Flow |

|------------|--------------|--------------|

| system-karts | Karts | → Seat Size → Seat Upgrade → Frame Protectors → Assembled |

| system-kart-engine-packages | Kart & Engine Packages | → Seat Size → Seat Upgrade → Frame Protectors → Assembled → Tires |

| system-kart-bundles | Kart & Equipment Bundles | Special Packages (pre-configured) |

**Builder Flow Steps:**

1. **Seat Size** - Select seat size (25T, 27, 28SB, 30, 31, 32, 34, 35)

2. **Seat Upgrade** - Optional seat upgrade (standard, M7, racing)

3. **Frame Protectors** - Add frame protection kit

4. **Assembled** - Assembly service option

5. **Tires** - Tire package selection (packages only)

---

### cat-tires

Tires

| System Tag | Display Name |

|------------|--------------|

| system-slick-tires | Slick Tires |

| system-rain-tires | Rain Tires |

| system-tire-accessories | Tire Accessories |

---

### cat-telemetry

Telemetry & Data Systems

| System Tag | Display Name |

|------------|--------------|

| system-data-systems | Systems |

| system-data-cables | Cables |

| system-sensors | Sensors |

| system-data-battery | Battery & Chargers |

---

### cat-safety-gear

Driver Safety Gear

| System Tag | Display Name |

|------------|--------------|

| system-helmets | Helmets |

| system-suits | Suits |

| system-rib-chest-protection | Rib & Chest Protection |

| system-neck-head-restraints | Neck & Head Restraints |

| system-gloves | Gloves |

| system-shoes | Shoes |

| system-rain-gear | Rain Gear |

---

### cat-lubricants-consumables

Lubricants & Consumables

| System Tag | Display Name |

|------------|--------------|

| system-oil | Oil |

| system-cleaners | Cleaners |

| system-sealants | Sealants |

| system-lubricants | Lubricant & Threadlocker |

---

### cat-tools

Tools & Service

| System Tag | Display Name |

|------------|--------------|

| system-hand-tools | Hand Tools |

| system-specialty-kart-tools | Specialty Kart Tools |

| system-measuring-setup-tools | Measuring & Setup Tools |

| system-engine-service-tools | Engine Service Tools |

| system-shop-supplies | Shop Supplies |

| system-toolboxes | Toolboxes |

---

### cat-pit-equipment

Pit Equipment / Shop

| System Tag | Display Name |

|------------|--------------|

| system-kart-trolleys | Kart Trolleys |

| system-fuel-containers | Fuel Jugs & Containers |

| system-tie-downs | Tie-Downs & Strapping |

| system-work-tables-lighting | Work Tables & Lighting |

---

## Summary

| Category | Tag | Systems | Flow |

|----------|-----|---------|------|

| Engines | cat-engines | 17 | Standard filter |

| Components | cat-components | 21 | Standard filter |

| Chassis | cat-chassis | 3 | **Kart Builder Wizard** |

| Tires | cat-tires | 3 | Standard filter |

| Telemetry | cat-telemetry | 4 | Standard filter |

| Safety Gear | cat-safety-gear | 7 | Standard filter |

| Lubricants | cat-lubricants-consumables | 4 | Standard filter |

| Tools | cat-tools | 6 | Standard filter |

| Pit Equipment | cat-pit-equipment | 4 | Standard filter |

| **Total** | **9 categories** | **69 systems** | |

---

## Migration Notes

### Current → Normalized Mapping

#### Categories

| Current | Normalized | Notes |

|---------|------------|-------|

| cat-engines | cat-engines | Keep |

| cat-components | cat-components | Keep |

| cat-chassis | cat-chassis | Keep - triggers Kart Builder wizard |

| cat-tires | cat-tires | Keep |

| cat-accessories | Split to multiple | → cat-lubricants-consumables, cat-tools, cat-pit-equipment, cat-safety-gear, cat-telemetry |

| (new) | cat-telemetry | Data systems, sensors, etc. |

| (new) | cat-safety-gear | Helmets, suits, protection |

| (new) | cat-lubricants-consumables | Oils, cleaners, sealants |

| (new) | cat-tools | Hand tools, specialty tools |

| (new) | cat-pit-equipment | Trolleys, fuel jugs, shop equipment |

#### Systems (sample mappings)

| Current | Normalized |

|---------|------------|

| system-braking-systems | system-braking-group |

| system-braking-system | system-braking-group |

| system-brake-group | system-braking-group |

| system-steering-group | system-steering-group |

| system-steering-systems | system-steering-group |

| system-wheels-and-hubs | system-wheels-hubs |

| system-wheels-hubs | system-wheels-hubs |

| system-wheel-hubs | system-wheels-hubs |

| system-seats-and-supports | system-seat-supports |

| system-seat-supports | system-seat-supports |

| system-seats | system-seat-supports |

| system-pedal-systems | system-pedal-group |

| system-pedal-group | system-pedal-group |

| system-carburetor | system-carburetor |

| system-carburettor-* | system-carburetor |

| system-crankcase | system-crankcase-crankshaft |

| system-crankcase-and-crankshaft | system-crankcase-crankshaft |

| system-crankshaft-and-piston | system-crankcase-crankshaft |

---

## Series Tags (Racing Classes)

Series tags represent racing classes/age groups, not specific engines. Products are tagged with the class(es) they're compatible with.

### Racing Classes

| Series Tag | Class | Age/Description |

|------------|-------|-----------------|

| series-bambino | Bambino | 5-7 years, 60cc restricted |

| series-micro | Micro | 7-9 years, 60cc |

| series-mini | Mini | 8-11 years, 60cc |

| series-cadet | Cadet | 9-12 years, various engines |

| series-junior | Junior | 12-15 years |

| series-senior | Senior | 15+ years |

| series-master | Master | 32+ years |

| series-shifter | Shifter/KZ | Gearbox karts, 125cc 6-speed |

| series-dd2 | DD2 | Rotax 2-speed automatic shifter |

### Chassis Series

| Series Tag | Chassis |

|------------|---------|

| series-105r | Birel 105R |

| series-196r | Birel 196R |

| series-kr1 | Birel KR1 |

| series-kr2 | Birel KR2 |

### Migration Mapping

| Current Tag | → Normalized | Reason |

|-------------|--------------|--------|

| series-seniormax | series-senior | Class-based |

| series-juniormax | series-junior | Class-based |

| series-minimax | series-mini | Class-based |

| series-micromax | series-micro | Class-based |

| series-rotax-max | series-senior | Most common class |

| series-x30 | series-senior | Senior class engine |

| series-ka100 | series-senior | Senior class engine |

| series-swift-60cc | series-cadet | 60cc cadet engine |

| series-t225rs | series-senior | Senior class engine |

| series-t4bambino | series-bambino | Class-based |

| series-t4cadet | series-cadet | Class-based |

| series-t4junior | series-junior | Class-based |

| series-t4senior | series-senior | Class-based |

| series-m1-bambino | series-bambino | Class-based |

| series-kz | series-shifter | Shifter class |

| series-175cc-super-shifter | series-shifter | Shifter class |

| series-sse-175cc | series-shifter | Shifter class |

| series-rotax-dd2 | series-dd2 | Consolidate alias |

| series-kart-tec | (remove) | Brand, not class |

---

## Type Tags (Part Types)

Common part types that cross categories:

| Type Tag | Description |

|----------|-------------|

| type-bearing | Bearings |

| type-gasket | Gaskets |

| type-o-ring | O-Rings |

| type-screw | Screws |

| type-nut | Nuts |

| type-washer | Washers |

| type-bushing | Bushings |

| type-spring | Springs |

| type-seal | Seals |

| type-filter | Filters |

| type-hose | Hoses |

| type-clamp | Clamps |

| type-cable | Cables |

| type-sprocket | Sprockets |

| type-spacer | Spacers |