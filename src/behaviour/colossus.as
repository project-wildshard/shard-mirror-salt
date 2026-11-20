// MIRROR-SALT-ZONE MSZ30: Colossus Hollow's arena. The fight starts; on the first beat, once a challenger is past the
// bars, the gate shuts (the `gate` shared field, whose panel's solid fills the arena's mouth); each beat the Salt Colossus slams the nearest player; the gate opens when the
// fight stops or the Colossus falls. MSZ36 grows this into the three-phase fight. Engine strike rows own the contact.
import { Actor, Strike, Field, Timer, State, Params, Do, Read, Event } from './generated/mirrorColossusDecision';
function open():void { Do.field(0,Field.gate,0); Do.timer(Timer.beat,0); State.awake=false; }
export function onStart():void {
  State.awake=true;
  Do.timer(Timer.beat,Params.firstBeat);
}
export function onStop():void {
  Do.stop(Actor.boss); open();
}
export function onDeath(killer:i32):void {
  if(i32(Event.subject)!=Actor.boss) return;
  Do.stop(Actor.boss); open();
}
export function onTimer(timer:i32):void {
  if(!State.awake||timer!=Timer.beat) return;
  Do.field(0,Field.gate,1);
  const target=Read.nearestPlayer(Actor.boss);
  if(target!=0) Do.strike(Actor.boss,Strike.slam,target);
  Do.timer(Timer.beat,Params.rest);
}
