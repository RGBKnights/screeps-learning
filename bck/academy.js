import assert from 'assert'
// import fs from 'fs-extra-promise'
// import path from 'path'
// import _ from 'lodash'
// import { ScreepsServer, stdHooks } from 'screeps-server-mockup'
import { NeuralNetwork, Model, Academy } from "reimprovejs/dist/reimprove.js"

const MAP_SIZE = 10;

function randomPoint()
{
  let min = 0;
  let max = MAP_SIZE;
  return Math.floor(Math.random()*(max-min+1)+min);
}

function jumpDistance(x1, y1, x2, y2) {
  return Math.abs(x2-x1) + Math.abs(y2-y1);
}

describe('Academy tests', function () {
  this.timeout("60s");

  it('setup academy and train students', async function () {
    this.skip(); // skip this test for now

    let actor = {x: 1, y: 1};
    let target = {x: 5, y: 7};
    let distance = jumpDistance(actor.x, actor.y, target.x, target.y);
    let steps = 0;

    const modelFitConfig = {
        epochs: 1,
        stepsPerEpoch: 16
    };

    const numActions = 8;
    const inputSize = 4;
    // The window of data which will be sent yo your agent. For instance the x previous inputs, and what actions the agent took  
    const temporalWindow = 1;

    const totalInputSize = inputSize * temporalWindow + numActions * temporalWindow + inputSize;

    const network = new NeuralNetwork();
    network.InputShape = [totalInputSize];
    network.addNeuralNetworkLayers([
        {type: 'dense', units: 32, activation: 'relu'},
        {type: 'dense', units: numActions, activation: 'softmax'}
    ]);
    // Now we initialize our model, and start adding layers
    const model = new Model.FromNetwork(network, modelFitConfig);

    // Finally compile the model, we also exactly use tfjs's optimizers and loss functions
    // (So feel free to choose one among tfjs's)
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'})

    // Every single field here is optionnal, and has a default value. Be careful, it may not fit your needs ...
    const teacherConfig = {
      lessonsQuantity: 10000,
      lessonLength: 20,                
      lessonsWithRandom: 2,
      epsilon: 0.5,
      epsilonDecay: 0.995,                
      epsilonMin: 0.05,
      gamma: 0.9                     
    };
  
    const agentConfig = {
        model: model,
        agentConfig: {
            memorySize: 1000,                      // The size of the agent's memory (Q-Learning)
            batchSize: 128,                        // How many tensors will be given to the network when fit
            temporalWindow: temporalWindow         // The temporal window giving previous inputs & actions
        }
    };

    // First we need an academy to host everything
    const academy = new Academy();
    const teacher = academy.addTeacher(teacherConfig);
    const agent = academy.addAgent(agentConfig);

    academy.assignTeacherToAgent(agent, teacher);

    while(true) {
      // Gather inputs
      let distance_before = Math.hypot(target.x-actor.x, target.y-actor.y);
      let inputs = [actor.x, actor.y, target.x, target.y];

      assert.equal(inputs.length, inputSize, "The Input Size dose not match the Inputs Array length");

      // Step the learning
      let result = await academy.step([{teacherName: teacher, agentsInput: inputs}]);

      // Take Action
      if(result !== undefined) {
        steps++;
        var action = result.get(agent);
        if(action === 0) {
          actor.x++; // Right
        } else if(action === 1) {
          actor.x--; // Left
        } else if(action === 2) {
          actor.y++; // Down
        } else if(action === 3) {
          actor.y--; // Up
        } else if(action === 4) {
          actor.x++; // Right Down
          actor.y++;
        } else if(action === 5) {
          actor.x--; // Left Up
          actor.y--;
        } else if(action === 6) {
          actor.x++; // Right Up
          actor.y--;
        } else if(action === 7) {
          actor.x--; // Left Down
          actor.y++;
        }
      }

      if(actor.x < 0) 
        actor.x = 0;
      else if(actor.x > MAP_SIZE) 
        actor.x = MAP_SIZE;
      
      if(actor.y < 0)
        actor.y = 0;
      else if(actor.y > MAP_SIZE) 
        actor.y = MAP_SIZE;

      let distance_after = Math.hypot(target.x-actor.x, target.y-actor.y)
      let reward = (distance_before == distance_after) ? -0.01 : distance_before - distance_after;
      academy.addRewardToAgent(agent, reward);
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