// MIRROR-SALT-ZONE MSZ28: the Brine King, the Brine Pans' elite. Each beat its tell rises (the ring of brine froth round
// it, the `froth` shared field), it strikes the nearest player (the crush, then the spray, by turns), and the froth falls
// as the blow lands. Engine strike rows own the contact; this source only paces the beats and drives the tell.
import { Actor, Strike, Field, Timer, State, Params, Do, Read, Event } from './generated/mirrorBrinekingDecision';
function quiet():void { Do.field(0,Field.froth,0); Do.timer(Timer.beat,0); Do.timer(Timer.land,0); }
export function onStart():void {
  State.awake=true; State.beat=0;
  Do.timer(Timer.beat,Params.firstBeat);
}
export function onStop():void {
  Do.stop(Actor.boss); quiet(); State.awake=false;
}
export function onDeath(killer:i32):void {
  if(i32(Event.subject)!=Actor.boss) return;
  Do.stop(Actor.boss); quiet(); State.awake=false;
}
export function onTimer(timer:i32):void {
  if(!State.awake) return;
  if(timer==Timer.beat) {
    Do.field(0,Field.froth,1);
    const target=Read.nearestPlayer(Actor.boss);
    if(target!=0) Do.strike(Actor.boss,State.beat==0?Strike.crush:Strike.spray,target);
    State.beat=(State.beat+1)%2;
    Do.timer(Timer.land,Params.windup);
  } else if(timer==Timer.land) {
    Do.field(0,Field.froth,0);
    Do.timer(Timer.beat,Params.rest);
  }
}
