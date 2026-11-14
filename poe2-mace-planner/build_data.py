#!/usr/bin/env python3
"""Builds data.js for the planner from a Path of Building PoE2 tree.json.
usage: python3 build_data.py path/to/TreeData/0_5/tree.json"""
import json, sys, math, re, heapq, collections

t = json.load(open(sys.argv[1]))
N = {int(k): v for k, v in t['nodes'].items()}
C = t['constants']
START = 47175          # Warrior / Marauder start
TOTAL = 123            # 99 from levels + 24 from campaign quests

def pos(v):
    g = t['groups'][v['group'] - 1]
    r = C['orbitRadii'][v['orbit']]
    a = C['orbitAnglesByOrbit'][v['orbit']][v['orbitIndex']]
    return g['x'] + r * math.sin(a), g['y'] - r * math.cos(a)

starts = {k for k, v in N.items() if 'classesStart' in v}
main = {k for k, v in N.items()
        if 'ascendancyName' not in v and 'unlockConstraint' not in v
        and not v.get('isOnlyImage') and (k == START or k not in starts)}
adj = collections.defaultdict(set)
edges = []
for k, v in N.items():
    for c in v['connections']:
        o = c['id']
        if k in main and o in main:
            adj[k].add(o); adj[o].add(k); edges.append((k, o, c['orbit']))

# ---- stat scoring: rough "% increased damage" equivalents ------------------
def rules(kind):
    dmg = [  # (regex, weight per point)
        (r'(\d+)% more Damage against Heavy Stunned Enemies with Maces', 2.0),
        (r'(\d+)% increased Damage with Maces', 1.0),
        (r'(\d+)% increased Damage with Two Handed Weapons', 1.0),
        (r'(\d+)% increased (?:Melee|Attack|Physical|Global Physical) Damage$', 1.0),
        (r'(\d+)% increased Damage$', 1.0),
        (r'(\d+)% increased Attack Area Damage', 0.9),
        (r'(\d+)% increased Melee Damage against (?:Heavy Stunned|Immobilised)', 0.45),
        (r'(\d+)% increased (?:Damage|Attack Damage|Physical Damage|Melee Damage) (?:against|with Hits against|while|if|when)', 0.45),
        (r'(\d+)% chance for (?:Mace )?Slam Skills you use yourself to cause an additional Aftershock', 2.6),
        (r'(\d+)% increased (?:Attack|Skill) Speed$', 2.6),
        (r'(\d+)% increased Attack Speed with (?:Maces|Two Handed)', 2.6),
        (r'Gain (\d+)% of (?:Physical )?Damage as Extra', 2.4),
        (r'(\d+)% increased Critical Hit Chance$', 0.25),
        (r'(\d+)% increased Critical Hit Chance for Attacks', 0.25),
        (r'(\d+)% increased Critical Damage Bonus$', 0.2),
        (r'(\d+)% increased Area of Effect for Attacks', 0.35),
        (r'Slam Skills have (\d+)% increased Area of Effect', 0.35),
        (r'Break (\d+)% increased Armour', 0.18),
        (r'(\d+)% increased Stun Buildup', 0.12),
        (r'\+(\d+) to Strength$', 0.35),
        (r'(\d+)% increased Strength', 2.0),
        (r'(\d+)% increased Weapon Damage', 1.0),
        (r'Damage Penetrates (\d+)% Fire', 0.3),
    ]
    tank = [
        (r'(\d+)% increased Armour$', 0.30),
        (r'(\d+)% increased Armour from Equipped Body Armour', 0.12),
        (r'(\d+)% increased Block chance', 1.2),
        (r'Regenerate ([\d.]+)% of maximum Life per second', 14),
        (r'(\d+)% increased Stun Threshold', 0.25),
        (r'\+(\d+)% to (?:Fire|Cold|Lightning|Chaos|all Elemental) Resistance', 0.9),
        (r'\+(\d+)% to Maximum (?:Fire|Cold|Lightning) Resistance', 9),
        (r'(\d+)% increased maximum Life', 3.0),
        (r'(\d+)% of Armour also applies to', 0.5),
        (r'(\d+)% increased Life Regeneration rate', 0.25),
        (r'(\d+)% increased Shield', 0.1),
    ]
    stun = [
        (r'(\d+)% increased Stun Buildup', 0.75),
        (r'Break (\d+)% increased Armour', 0.8),
        (r'(\d+)% increased Damage against Enemies with Fully Broken Armour', 0.8),
        (r'(\d+)% increased Melee Damage against (?:Heavy Stunned|Immobilised)', 0.5),
        (r'(\d+)% increased Warcry (?:Speed|Cooldown)', 0.5),
        (r'(\d+)% increased Damage with Warcries', 0.6),
        (r'Empowered Attacks deal (\d+)% increased Damage', 0.8),
        (r'(\d+)% increased (?:Stun|Daze) (?:Duration|Buildup)', 0.3),
    ]
    fire = [
        (r'Gain (\d+)% of (?:Physical )?Damage as Extra', 1.6),
        (r'(\d+)% increased Fire Damage', 0.8),
        (r'(\d+)% increased Elemental Damage(?: with Attacks)?$', 0.8),
        (r'Damage Penetrates (\d+)% (?:Fire|Elemental)', 1.6),
        (r'(\d+)% increased (?:Ignite Magnitude|Magnitude of Ignite)', 0.5),
        (r'(\d+)% increased chance to Ignite', 0.2),
        (r'(\d+)% increased Flammability Magnitude', 0.2),
        (r'(\d+)% of Physical Damage Converted to Fire', 0.6),
    ]
    return {'slam': dmg + [(a, b * .25) for a, b in tank],
            'stun': dmg + stun + [(a, b * .3) for a, b in tank],
            'tank': [(a, b * .8) for a, b in dmg] + tank,
            'fire': dmg + fire + [(a, b * .25) for a, b in tank]}[kind]

BAD = re.compile(r'\b(?:Bow|Crossbow|Spear|Quarterstaff|Quarterstaves|Dagger|Flail|Claw|Unarmed|Projectile|Minion|Spell|Totem|'
                 r'Companion|Shapeshift|Wand|Staff|Trap|Dual Wield|One Handed|Sword|Axe|Offering|Curse|Herald|Mark|'
                 r'Energy Shield|Evasion|Thorns|Ballista|Grenade|Banner|Charm|Flask|Mana|Bleed|Poison|Cold|Lightning|Chaos|Shock|Freeze|Chill|'
                 r'Low Life|Rage|Ancestrally|Parr|Focus|Summon|Ally|Allies|Presence|Remnant|Charge|Volatility|Infus|Elemental Ailment|Deflect|Wither|'
                 r'Archon|Talisman|Plant|Glory|Combo|Surrounded|Dazed|Full Life)', re.I)

def score(v, kind, allow=()):
    if v.get('isJewelSocket'): return 14.0
    if v.get('isAttribute'): return 1.75      # +5 Strength
    s = 0.0
    for st in v.get('stats', []):
        st1 = st
        bad = BAD.search(st)
        if bad and not any(re.search(a, st, re.I) for a in allow): continue
        for rx, w in rules(kind):
            m = re.search(rx, st1)
            if m:
                s += float(m.group(1)) * w
                break
        if re.search(r'^\d+% reduced|^-\d', st): s -= 4
    return s

def solve(kind, budget, forced=(), allow=(), banned=()):
    val = {k: max(0.0, score(N[k], kind, allow)) for k in main}
    for k in main:
        if N[k].get('isKeystone'): val[k] = 0
    for k in forced: val[k] = 500
    for k in banned: val[k] = 0
    A = {START}; order = []
    while len(order) < budget:
        dist = {}; prev = {}; gain = {}
        pq = [(0, 0.0, k, None) for k in A]
        heapq.heapify(pq)
        while pq:
            d, ng, u, p = heapq.heappop(pq)
            if u in dist: continue
            dist[u] = d; prev[u] = p; gain[u] = -ng
            for w in adj[u]:
                if w not in dist and w not in A and w not in banned:
                    heapq.heappush(pq, (d + 1, ng - val[w], w, u))
        room = budget - len(order)
        best = None
        for k, d in dist.items():
            if d == 0 or d > room or d > 9 and val[k] < 400: continue
            v = N[k]
            if not (v.get('isNotable') or v.get('isKeystone') or v.get('isJewelSocket') or d <= 2): continue
            # notables pull their weight: lookahead bonus for the cluster behind them
            r = gain[k] / (d + 0.6)
            if best is None or r > best[0]: best = (r, k)
        if not best or best[0] <= 0.5: break
        path = []; k = best[1]
        while k not in A: path.append(k); k = prev[k]
        for k in reversed(path): A.add(k); order.append(k)
    return order, val

BUILDS = [
 dict(id='slam', name='Two-Hand Mace Slam', asc='Titan', kind='slam',
      tag='Maximum damage',
      blurb='Two-handed mace, slam skills, everything into hit damage. Titan makes every second slam Ancestrally Boosted and adds aftershocks, which multiply the damage you stack on the tree.',
      skills=['Rolling Slam / Earthquake while levelling', 'Sunder and Hammer of the Gods as finishers', 'Seismic Cry to empower slams', 'Leap Slam for movement and stun'],
      ascOrder=[35453, 42275, 38014, 3762, 19424, 60634, 27418, 30115],
      ascNote='Earthbreaker first for aftershocks, then Ancestral Empowerment. Hulking Form last: it boosts every small damage node below by 50%.'),
 dict(id='stun', name='Boneshatter Armour Breaker', asc='Warbringer', kind='stun',
      tag='Stun and armour break',
      blurb='Break armour past zero with Imploding Impacts so every hit lands on a softened target, then chain heavy stuns into Boneshatter. Slower clear than slams, stronger against bosses.',
      skills=['Boneshatter on primed targets', 'Armour Breaker to strip armour', 'Seismic Cry / Infernal Cry with no cooldown', 'Hammer of the Gods on stunned bosses'],
      ascOrder=[38769, 58704, 49380, 36659, 1994, 47097, 18585, 6127],
      ascNote="Anvil's Weight then Imploding Impacts turn armour break into a damage multiplier. Warcaller's Bellow removes warcry cooldowns; Jade Heritage is the defensive finish."),
 dict(id='tank', name="Giant's Blood Mace and Shield", asc='Titan', kind='tank',
      tag='Sturdy alternative', forced=[32349], allow=[r'Shield'],
      blurb="Giant's Blood lets you hold a two-handed mace in one hand with a shield in the other. You give up some tree damage for block, armour and regeneration, and need roughly triple the Strength for your weapon.",
      skills=['Shield Charge to open', 'Rolling Slam / Earthquake', 'Resonating Shield for armour break', 'Sunder as finisher'],
      ascOrder=[29323, 24807, 51690, 12000, 35453, 42275, 19424, 60634],
      ascNote='Stone Skin and Mysterious Lineage first for armour and 15% more life, then Earthbreaker for damage. Swap Colossal Capacity for Hulking Form if you want more stats over inventory.'),
 dict(id='fire', name='Forge-Fire Mace', asc='Smith of Kitava', kind='fire',
      tag='Physical plus fire',
      blurb='Stack extra fire damage on top of physical mace hits and temper the weapon at the anvil. Smith of Kitava covers resistances through the body armour, freeing gear slots for damage.',
      skills=['Molten Blast / Volcanic Fissure', 'Infernal Cry for extra fire', 'Temper Weapon before fights', 'Hammer of the Gods on bosses'],
      ascOrder=[47236, 60298, 5386, 22541, 9988, 49340, 60913, 61039],
      ascNote="Against the Anvil (Temper Weapon) is the main damage node. Smith's Masterwork is free to allocate once connected; Support Straps gives 20% increased Strength."),
]

out_builds = []
used = set()
for b in BUILDS:
    order, val = solve(b['kind'], TOTAL, b.get('forced', ()), b.get('allow', ()))
    used |= set(order)
    b2 = {k: b[k] for k in ('id', 'name', 'asc', 'tag', 'blurb', 'skills', 'ascNote')}
    b2['order'] = order
    b2['asc_nodes'] = [dict(name=N[k]['name'], stats=N[k]['stats'], notable=bool(N[k].get('isNotable'))) for k in b['ascOrder']]
    out_builds.append(b2)
    print('==', b['name'], len(order), file=sys.stderr)
    for i, k in enumerate(order):
        v = N[k]
        if v.get('isNotable') or v.get('isKeystone') or v.get('isJewelSocket'):
            print(f"  {i+1:3d} {v['name']} [{val[k]:.0f}] {' ; '.join(v['stats'])}", file=sys.stderr)

# ---- export nodes near the Warrior's side of the tree ----------------------
P = {k: pos(N[k]) for k in main}
sx, sy = P[START]
xs = [P[k][0] for k in used]; ys = [P[k][1] for k in used]
pad = 1500
box = (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)
keep = {k for k in main if box[0] <= P[k][0] <= box[2] and box[1] <= P[k][1] <= box[3]} | used | {START}
nodes = {}
for k in keep:
    v = N[k]
    ty = 'S' if k == START else 'K' if v.get('isKeystone') else 'J' if v.get('isJewelSocket') else 'N' if v.get('isNotable') else 'A' if v.get('isAttribute') else 's'
    nodes[k] = [round(P[k][0]), round(P[k][1]), ty, 'Warrior' if k == START else v['name'],
                ['+5 to Strength (or any Attribute)'] if ty == 'A' else v.get('stats', [])]
E_ = []
seen = set()
for a, b, o in edges:
    if a in keep and b in keep and (min(a, b), max(a, b)) not in seen:
        seen.add((min(a, b), max(a, b)))
        ga, gb = N[a]['group'], N[b]['group']
        if ga == gb and N[a]['orbit'] == N[b]['orbit'] and N[a]['orbit'] > 0 and o == 0:
            g = t['groups'][ga - 1]
            E_.append([a, b, round(g['x']), round(g['y']), C['orbitRadii'][N[a]['orbit']]])
        else:
            E_.append([a, b])
data = dict(version='0.5', start=START, total=TOTAL, nodes=nodes, edges=E_, builds=out_builds)
open('data.js', 'w').write('window.TREE=' + json.dumps(data, separators=(',', ':')) + ';')
print(len(nodes), 'nodes', len(E_), 'edges', file=sys.stderr)
