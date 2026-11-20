// MIRROR-SALT-ZONE MSZ23 (meta): the cell map. Mirror Salt's 500 m cell as seven regions, the four entry roads, the roads
// between regions and twelve named places. Data only (no three.js), so the ground (MSZ24), the docks (MSZ25), each region's
// file (MSZ26 to MSZ30), the races (MSZ32) and the map tile (MSZ41) all read one plan, and a test reads it without a build.
//
// The frame is the shard's own: the cell's centre at (0, 0), its edges at +-250 m. The compass is the race's: the arch line
// runs north toward the low sun (-z), so south is +z (the GO line), east is +x and west is -x. A gate road reaches the cell
// at the middle of each side, its buffer ends 10 m in and a traveller arrives 14 m in (engine `zoneWalls.ts`
// `ARRIVAL_DEPTH`), on the axis.

/** A point on the cell, in metres. */
export interface Spot { readonly x: number; readonly z: number }
/** An axis-aligned rectangle: x from x0 to x1, z from z0 to z1 (x0 < x1, z0 < z1). */
export interface Rect { readonly x0: number; readonly z0: number; readonly x1: number; readonly z1: number }

export type RegionId = 'yard' | 'arches' | 'mirror' | 'pans' | 'wrecks' | 'rim' | 'canyon';
export interface Region {
  readonly id: RegionId;
  readonly name: string;
  readonly compass: string;
  /** Its ground. The Mesa Rim's is the whole cell: it is whatever no other region claims (the ring of mesas). */
  readonly rect: Rect;
  /** What stands there, as the plan's region rows build it. */
  readonly holds: string;
}

/** The race runs from the start (+z) toward the low sun (-z); a player arrives in the Start Yard, by the GO line. */
export const SPAWN = { x: -14, z: 150, yaw: 0 };
export interface Gate { readonly x: number; readonly z: number; readonly yaw: number; readonly width: number; readonly height: number }
/** The race gates down the Arch Line: gate 0 is the GO line, gate 8 the finish; one arch over each of 1 to 8. */
export const GATES: readonly Gate[] = Array.from({ length: 9 }, (_, i) => ({
  x: Math.sin(i * 0.9) * 14, z: 140 - i * 30, yaw: Math.sin(i) * 0.35, width: 8 + (i % 3), height: 10 + (i % 4),
}));
/** The flood's radius: the shallow mirror over the flat. */
export const FLOOD_RADIUS = 178;

/** Half the cell's side, and how far in a traveller from a gate road arrives (engine `CHUNK_HALF`, `ARRIVAL_DEPTH`). */
export const CELL_HALF = 250;
export const ARRIVAL_IN = 236;
/** The ring of mesas: it rises from this radius (`ground.ts` `mesaHeight`) and the rim road runs round it at `RIM_ROAD`. */
export const RING_INNER = 170;
export const RIM_ROAD = 205;
/** How high the rim road's shelf and the lookout stand over the flat, between the low stretches (MSZ24, `ground.ts`). */
export const RIM_SHELF = 10;

/** The seven regions. Every rect but the rim's is disjoint from the others; `regionAt` gives the rest to the rim. */
export const REGIONS: readonly Region[] = [
  { id: 'yard', name: 'the Start Yard', compass: 'south', rect: { x0: -60, z0: 120, x1: 60, z1: 215 },
    holds: 'the GO line, the Marshal and his board of best times, the garage, the stands, the south road in' },
  { id: 'arches', name: 'the Arch Line', compass: 'middle', rect: { x0: -40, z0: -110, x1: 40, z1: 120 },
    holds: 'the nine gates and eight arches of today\'s race, from the GO line north to the finish arch' },
  { id: 'mirror', name: 'the Mirror', compass: 'west', rect: { x0: -180, z0: -110, x1: -40, z1: 110 },
    holds: 'the deep still flood west of the arches, salt skaters, a sunken sail with a chest' },
  { id: 'pans', name: 'the Brine Pans', compass: 'east', rect: { x0: 40, z0: -110, x1: 180, z1: 120 },
    holds: 'evaporation pans in a grid, the ruined salt works, the Brinewife, brine crabs and their elite' },
  { id: 'wrecks', name: 'the Wreck Field', compass: 'south-west', rect: { x0: -180, z0: 110, x1: -60, z1: 200 },
    holds: 'old land-sail wrecks to weave through, the Scrapper, finds among the wrecks, dust hounds' },
  { id: 'canyon', name: 'the Glass Canyon', compass: 'north', rect: { x0: -40, z0: -240, x1: 180, z1: -110 },
    holds: 'past the finish: the canyon road north-east, glass wisps, the Salt Colossus\'s arena at its end' },
  { id: 'rim', name: 'the Mesa Rim', compass: 'the ring', rect: { x0: -240, z0: -240, x1: 240, z1: 240 },
    holds: 'the ring of mesas and its rim road, the lookout on the north-east mesa, the four passes, mesa vultures' },
];

/** The region a point stands in: the first rect that holds it, else the rim. */
export function regionAt(x: number, z: number): RegionId {
  for (const r of REGIONS) {
    if (r.id !== 'rim' && x >= r.rect.x0 && x <= r.rect.x1 && z >= r.rect.z0 && z <= r.rect.z1) return r.id;
  }
  return 'rim';
}

export type Side = 'north' | 'east' | 'south' | 'west';
/** Where a traveller from each gate road arrives, facing in. */
export const ENTRIES: Readonly<Record<Side, Spot>> = {
  north: { x: 0, z: -ARRIVAL_IN }, east: { x: ARRIVAL_IN, z: 0 }, south: { x: 0, z: ARRIVAL_IN }, west: { x: -ARRIVAL_IN, z: 0 },
};

export type RoadKind = 'entry' | 'link' | 'rim';
export interface Road {
  readonly id: string;
  readonly kind: RoadKind;
  /** A gate road's side, or the region it leaves. */
  readonly from: Side | RegionId;
  readonly to: RegionId;
  /** Its centre line, start to end. */
  readonly line: readonly Spot[];
  readonly width: number;
  /** The height it holds over the flat (m); none, the flat's own 0. The rim road's height is its own profile (`ground.ts`). */
  readonly deck?: number;
}

/** The rim road: a ring at `RIM_ROAD`, 48 points, closed, from the south-east mesa round past each pass on an axis. */
const rimLine: Spot[] = Array.from({ length: 49 }, (_, i) => {
  const a = Math.PI / 4 + (i / 48) * Math.PI * 2, at = (v: number): number => Math.round(v * RIM_ROAD * 10) / 10 + 0;
  return { x: at(Math.sin(a)), z: at(Math.cos(a)) };
});

/** Where the lookout's spur meets the rim road: on the ring, where its shelf stands full height. */
export const LOOKOUT_JOIN: Spot = { x: 167.9, z: -117.6 };

/** Every road: one in from each gate to the Start Yard, the links between regions, the rim road. */
export const ROADS: readonly Road[] = [
  { id: 'south-road', kind: 'entry', from: 'south', to: 'yard', width: 10, line: [ENTRIES.south, { x: 0, z: 200 }, { x: 0, z: 175 }] },
  // the north road comes down the canyon's west side to the finish, then down the arch line's west side to the yard
  { id: 'north-road', kind: 'entry', from: 'north', to: 'yard', width: 10,
    line: [ENTRIES.north, { x: 0, z: -160 }, { x: -28, z: -105 }, { x: -30, z: 0 }, { x: -28, z: 110 }, { x: -20, z: 140 }] },
  // the west road skirts the Mirror's south shore between it and the wrecks
  { id: 'west-road', kind: 'entry', from: 'west', to: 'yard', width: 10,
    line: [ENTRIES.west, { x: -185, z: 10 }, { x: -150, z: 80 }, { x: -110, z: 108 }, { x: -60, z: 125 }, { x: -40, z: 145 }] },
  // the east road is a causeway between the pans
  { id: 'east-road', kind: 'entry', from: 'east', to: 'yard', width: 10,
    line: [ENTRIES.east, { x: 180, z: 0 }, { x: 110, z: 0 }, { x: 70, z: 70 }, { x: 45, z: 125 }, { x: 40, z: 145 }] },
  { id: 'canyon-road', kind: 'link', from: 'arches', to: 'canyon', width: 9,
    line: [{ x: 10, z: -105 }, { x: 35, z: -140 }, { x: 70, z: -170 }, { x: 95, z: -205 }] },
  // the lookout's spur runs level along the north-east mesa onto the rim road's shelf; the Canyon Drop goes on round the rim
  // road, down its ramp into the canyon and down the canyon road
  { id: 'lookout-spur', kind: 'link', from: 'rim', to: 'canyon', width: 8, deck: RIM_SHELF,
    line: [{ x: 195, z: -185 }, { x: 188, z: -150 }, LOOKOUT_JOIN] },
  { id: 'wreck-track', kind: 'link', from: 'yard', to: 'wrecks', width: 7,
    line: [{ x: -45, z: 165 }, { x: -80, z: 160 }, { x: -110, z: 145 }] },
  { id: 'mirror-shore', kind: 'link', from: 'arches', to: 'mirror', width: 7,
    line: [{ x: -30, z: 40 }, { x: -70, z: 50 }, { x: -95, z: 70 }] },
  { id: 'pan-road', kind: 'link', from: 'arches', to: 'pans', width: 8,
    line: [{ x: 30, z: 20 }, { x: 70, z: 20 }, { x: 100, z: 20 }] },
  { id: 'rim-road', kind: 'rim', from: 'rim', to: 'rim', width: 9, line: rimLine },
];

export interface Place { readonly id: string; readonly name: string; readonly region: RegionId; readonly at: Spot; readonly radius: number }
/** The twelve named places a player discovers (MSZ30 lays a region trigger on each). */
export const PLACES: readonly Place[] = [
  { id: 'go-line', name: 'The GO Line', region: 'yard', at: { x: 0, z: 146 }, radius: 14 },
  { id: 'marshals-tent', name: 'Marshal\'s Tent', region: 'yard', at: { x: -30, z: 192 }, radius: 12 },
  { id: 'finish-arch', name: 'The Finish Arch', region: 'arches', at: { x: 11, z: -100 }, radius: 14 },
  { id: 'deep-mirror', name: 'The Deep Mirror', region: 'mirror', at: { x: -125, z: -30 }, radius: 30 },
  { id: 'sunken-sail', name: 'The Sunken Sail', region: 'mirror', at: { x: -95, z: 70 }, radius: 12 },
  { id: 'pan-grid', name: 'The Pan Grid', region: 'pans', at: { x: 100, z: 20 }, radius: 30 },
  { id: 'salt-works', name: 'The Old Salt Works', region: 'pans', at: { x: 150, z: 85 }, radius: 18 },
  { id: 'sail-graveyard', name: 'The Sail Graveyard', region: 'wrecks', at: { x: -112, z: 148 }, radius: 22 },
  { id: 'glass-gorge', name: 'The Glass Gorge', region: 'canyon', at: { x: 45, z: -150 }, radius: 20 },
  { id: 'colossus-hollow', name: 'Colossus Hollow', region: 'canyon', at: { x: 95, z: -215 }, radius: 22 },
  { id: 'sun-lookout', name: 'The Sun Lookout', region: 'rim', at: { x: 195, z: -185 }, radius: 12 },
  { id: 'west-pass', name: 'The West Pass', region: 'rim', at: { x: -210, z: 0 }, radius: 14 },
];

/** MSZ25: where a dock stands (a vehicle's spot, heading `yaw`: it faces (-sin yaw, -cos yaw)), its shelter and sign beside
 *  it, off the road, and what it hands out: each player's own buggy or land-sail. */
export interface DockSpot {
  readonly id: string;
  readonly name: string;
  readonly kind: 'buggy' | 'sail';
  readonly at: Spot;
  readonly yaw: number;
  readonly shelter: Spot;
}
/** How far in from the cell's edge a gate road's dock stands, and how far off the road's centre line. */
export const MOUTH_IN = 222;
const OFF = 7, SHED = 10.8;
/** Facing +z, just short of pi: the SDK rounds a dock's heading to 3 places and pi rounds past the format's bound. */
const FACE_SOUTH = 3.141;
/** A dock at each entry road's mouth (a player from any gate is a few steps from a buggy) and three in the Start Yard. */
export const DOCKS: readonly DockSpot[] = [
  { id: 'north.buggy', name: 'North Road', kind: 'buggy', at: { x: OFF, z: -MOUTH_IN }, yaw: FACE_SOUTH, shelter: { x: SHED, z: -MOUTH_IN } },
  { id: 'east.buggy', name: 'East Road', kind: 'buggy', at: { x: MOUTH_IN, z: OFF }, yaw: Math.PI / 2, shelter: { x: MOUTH_IN, z: SHED } },
  { id: 'south.buggy', name: 'South Road', kind: 'buggy', at: { x: -OFF, z: MOUTH_IN }, yaw: 0, shelter: { x: -SHED, z: MOUTH_IN } },
  { id: 'west.buggy', name: 'West Road', kind: 'buggy', at: { x: -MOUTH_IN, z: -OFF }, yaw: -Math.PI / 2, shelter: { x: -MOUTH_IN, z: -SHED } },
  { id: 'yard.buggy', name: 'Start Yard', kind: 'buggy', at: { x: SPAWN.x - 8, z: SPAWN.z + 4 }, yaw: 0, shelter: { x: SPAWN.x - 8, z: SPAWN.z + 8.5 } },
  { id: 'yard.sail', name: 'Start Yard', kind: 'sail', at: { x: SPAWN.x - 18, z: SPAWN.z + 6 }, yaw: 0, shelter: { x: SPAWN.x - 18, z: SPAWN.z + 11.5 } },
  { id: 'yard.buggy.east', name: 'Start Yard', kind: 'buggy', at: { x: 24, z: 156 }, yaw: 0, shelter: { x: 24, z: 160.5 } },
];
