import assert from 'assert'
import { School } from "../src/school"

const MAP_SIZE = 10;

function randomPoint() {
  let min = 0;
  let max = MAP_SIZE;
  return Math.floor(Math.random()*(max-min+1)+min);
}

function jumpDistance(x1, y1, x2, y2) {
  return Math.abs(x2-x1) + Math.abs(y2-y1);
}

function limitBounds(actor) {
  if(actor.x < 0) 
    actor.x = 0;
  else if(actor.x > MAP_SIZE) 
    actor.x = MAP_SIZE;

  if(actor.y < 0)
    actor.y = 0;
  else if(actor.y > MAP_SIZE) 
    actor.y = MAP_SIZE;
}

describe('Academy tests', function () {
  this.timeout("60s");

  it('setup academy and train students', async function () {
    // this.skip(); // skip this test for now

    let actor = {x: 1, y: 1};
    let target = {x: 5, y: 7};
    let distance = jumpDistance(actor.x, actor.y, target.x, target.y);
    let steps = 0;

    const school = new School(4, 4);
    school.setup();

    while(true) {
      steps++;

      // Gather inputs
      let distance_before = Math.hypot(target.x-actor.x, target.y-actor.y);
      let inputs = [actor.x, actor.y, target.x, target.y];

      // Learn form input
      await school.learn(inputs);

      // Take action
      let action = school.action();
      if(action === 0) {
        actor.x++; // Right
      } else if(action === 1) {
        actor.x--; // Left
      } else if(action === 2) {
        actor.y++; // Down
      } else if(action === 3) {
        actor.y--; // Up
      }

      limitBounds(actor);

      let distance_after = Math.hypot(target.x-actor.x, target.y-actor.y)
      let reward = (distance_before == distance_after) ? -1 : distance_before - distance_after;
      school.reward(reward);

      // console.info(`Target: (${target.x}, ${target.y}) Location: (${actor.x}, ${actor.y}) Reward: ${reward}`);

      if(actor.x === target.x && actor.y === target.y) {
        console.info(`Target: ${distance} Steps: ${steps} Delta: ${(steps-distance)}`);

        target = { x: randomPoint(), y: randomPoint() };
        steps = 0;
        distance = jumpDistance(actor.x, actor.y, target.x, target.y);
      }
    }
  });

  after(async function () {
    // Do Nothing...
  });
});