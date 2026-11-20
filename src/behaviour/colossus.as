// MIRROR-SALT-ZONE MSZ36: the Salt Colossus's fight, in three phases (the Mossgate Warden's pattern). Each beat is one
// blow, told before it lands by the `tell` field's panel: the slam cracks the salt round its feet, the sweep raises a dust
// ring, and from phase 2 the brine spray rings it wider still. Then its core opens (the `core` field's panel) and only then
// does a blow hurt it. At 30% it smashes out of the hollow and bounds down the canyon road in three leaps, the gate open
// behind it, so the challengers drive after it; at bay in the Glass Gorge it fights on, faster, with the gorge's glass
// wisps woken (the encounter's phase-3 adds). Engine strike rows own the contact; this paces the beats, the tells, the
// core and the guard, and runs the leaps. The fight is `resident` (it starts at the first blow and follows the body).
// guard: 0 every hit, 1 none. phase: 0 fresh, 1 to 3 the fight's phases, 4 fallen, 5 the chase.
import { Actor, Strike, Field, Timer, Move, State, Params, Do, Read, Event } from './generated/mirrorColossusDecision';
function atGorge():bool { return Read.x(Actor.boss)<Params.gorgeX; }
function beatSeconds():f64 { return State.phase==3?Params.thirdBeat:State.phase==2?Params.secondBeat:Params.firstBeat; }
function quiet():void {
  Do.field(0,Field.tell,0); Do.field(0,Field.core,0);
  Do.timer(Timer.arm,0); Do.timer(Timer.beat,0); Do.timer(Timer.open,0); Do.timer(Timer.shut,0); Do.timer(Timer.rest,0);
}
function fighting():bool { return State.phase>=1 && State.phase<=3; }
// One blow at the nearest player, its tell raised (plus 3 in the gorge), the core shut; the core opens once the windup is through.
function strike(which:i32, tell:i32):void {
  Do.field(0,Field.tell,tell+(atGorge()?3:0)); Do.encounter(4,1);
  const target=Read.nearestPlayer(Actor.boss);
  if(target!=0) Do.strike(Actor.boss,which,target);
  Do.timer(Timer.open,Params.windup);
}
// The slam, then the sweep; from phase 2 the brine spray follows them.
function next():void {
  const beat=State.beat;
  State.beat=(beat+1)%(State.phase>=2?3:2);
  if(beat==0) strike(Strike.slam,1); else if(beat==1) strike(Strike.sweep,2); else strike(Strike.spray,3);
}
function fight():void { Do.timer(Timer.arm,0.1); Do.timer(Timer.beat,beatSeconds()); }
// The chase: no blow lands on it, the gate opens, and it leaps from stand to stand down the canyon road.
function leap():void {
  State.leg=State.leg+1;
  if(State.leg==1) Do.move(Actor.boss,Move.leap1); else if(State.leg==2) Do.move(Actor.boss,Move.leap2); else Do.move(Actor.boss,Move.leap3);
}
function chase():void { quiet(); State.phase=5; State.leg=0; Do.encounter(4,1); Do.field(0,Field.gate,0); leap(); }
// A phase change stops and restarts the decision, and a retry restarts it at its checkpoint, so a start resumes from the
// Colossus's health (0.6 and 0.3: the phases' `at` in canyon.ts) and from where it stands.
export function onStart():void {
  if(State.phase==4) return;
  const share=Read.hpShare(Actor.boss);
  if(share<=0.3) {
    if(!atGorge()) { chase(); return; }
    State.phase=3; Do.move(Actor.boss,Move.stand,Read.nearestPlayer(Actor.boss)); fight(); return;
  }
  State.phase=share>0.6?1:2;
  if(State.beat>=(State.phase>=2?3:2)) State.beat=0;
  if(atGorge()) Do.move(Actor.boss,Move.home,Read.nearestPlayer(Actor.boss));
  fight();
}
export function onStop():void {
  Do.stop(Actor.boss); quiet(); Do.encounter(4,0); Do.field(0,Field.gate,0);
}
export function onThreshold(index:i32):void {
  if(i32(Event.subject)!=Actor.boss) return;
  if(index==1 && State.phase==1) { State.phase=2; Do.encounterPhase(1); }
  else if(index==2 && fighting()) { Do.encounterPhase(2); chase(); }
}
export function onMoveDone(move:i32, ok:bool):void {
  if(State.phase!=5) return;
  // at bay in the gorge: turn on the nearest challenger and fight on
  if(move==Move.leap3) { State.phase=3; State.beat=0; Do.move(Actor.boss,Move.stand,Read.nearestPlayer(Actor.boss)); fight(); }
  else Do.timer(Timer.rest,Params.catchUp);
}
export function onDeath(killer:i32):void {
  if(i32(Event.subject)!=Actor.boss || !(fighting() || State.phase==5)) return;
  Do.stop(Actor.boss); quiet(); Do.field(0,Field.gate,0); State.phase=4; Do.encounterWin();
}
export function onTimer(timer:i32):void {
  if(timer==Timer.rest) { if(State.phase==5) leap(); return; }
  if(!fighting()) return;
  // the fight's start resets the guard to open, so shut it a beat later; in the hollow the gate shuts behind the challengers
  if(timer==Timer.arm) { Do.encounter(4,1); if(!atGorge()) Do.field(0,Field.gate,1); }
  else if(timer==Timer.beat) next();
  else if(timer==Timer.open) { Do.field(0,Field.tell,0); Do.field(0,Field.core,atGorge()?2:1); Do.encounter(4,0); Do.timer(Timer.shut,Params.window); }
  else if(timer==Timer.shut) { Do.field(0,Field.core,0); Do.encounter(4,1); Do.timer(Timer.beat,beatSeconds()); }
}
