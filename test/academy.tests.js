import assert from 'assert'
import fs from 'fs'
import progress from 'cli-progress'
import { School } from "../src/school"

const bar = new progress.Bar({}, progress.Presets.shades_classic);

const MAP_SIZE = 10;

function randomPoint() {
  let min = 0;
  let max = MAP_SIZE;
  let x = Math.floor(Math.random()*(max-min+1)+min);
  let y = Math.floor(Math.random()*(max-min+1)+min);
  return {x,y};
}

function jumpDistance(x1, y1, x2, y2) {
  return Math.abs(x2-x1) + Math.abs(y2-y1);
}

describe('Academy tests', function () {
  this.timeout("1000s");

  it('setup academy and train students', async function () {
    // this.skip(); // skip this test for now

    let games = 1000;
    const school = new School(4, 4);
    school.setup();

    bar.start(games, 0);

    for (let i = 0; i < games; i++) {
      // Setup
      let actor = randomPoint();
      let target = randomPoint();
      let limit = jumpDistance(actor.x, actor.y, target.x, target.y) * 10;
      let steps = 0;

      while(true) {
        // Gather inputs
        let inputs = [actor.x, actor.y, target.x, target.y];

        // Learn form input
        await school.learn(inputs);

        // Take action
        steps++;
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

        if(actor.x < 0 || actor.x > MAP_SIZE || actor.y < 0 || actor.y > MAP_SIZE) {
          // Game Over (Adgent Dead - walked outside the play area)
          school.reward(-1);
          break;
        } else if(steps > limit) {
          // Game Over (Adgent Dead - walked to far)
          school.reward(-1);
          break;
        } else if(target.x == actor.x && target.y == actor.y) {
          // Game Over (Agdent reach target)
          school.reward(1);
          break;
        } else {
          school.reward(0.1);
        }
      }

      bar.update(i);
    }

    bar.update(games);
    bar.stop();
  });

  after(async function () {
    // Do Nothing...
  });
});