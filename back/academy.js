// import assert from 'assert'
// import fs from 'fs-extra-promise'
// import path from 'path'
// import _ from 'lodash'
// import { ScreepsServer, stdHooks } from 'screeps-server-mockup'
// import * as ReImprove from 'reimprovejs'

let ReImprove = require('reimprovejs');

const TIMEOUT = 1; // mins

function rescale(r1s,r1e, v, r2s,r2e) {
  let p = ((v - r1s) / (r1e - r1s));
  return((r2e - r2s) * p + r2s);
}

suite('Academy tests', function () {
  this.timeout(TIMEOUT * 60 * 1000);

  test('setup academy and train students', async function () {
    let mapSize = 5;
    let map = [
      1,1,1,1,1,
      1,0,0,0,1,
      1,0,0,0,1,
      1,0,0,0,1,
      1,1,1,1,1,
    ];
    let actor = {x: 0, y: 0};
    let target = {x: 2, y: 2};

    const modelFitConfig = {              // Exactly the same idea here by using tfjs's model's
        epochs: 1,                        // fit config.
        stepsPerEpoch: 16
    };

    const numActions = 4;
    const inputSize = 4;                
    const temporalWindow = 1;             // The window of data which will be sent yo your agent. For instance the x previous inputs, and what actions the agent took

    const totalInputSize = inputSize * temporalWindow + numActions * temporalWindow + inputSize;

    const network = new ReImprove.NeuralNetwork();
    network.InputShape = [totalInputSize];
    network.addNeuralNetworkLayers([
        {type: 'dense', units: 32, activation: 'relu'},
        {type: 'dense', units: numActions, activation: 'softmax'}
    ]);
    // Now we initialize our model, and start adding layers
    const model = new ReImprove.Model.FromNetwork(network, modelFitConfig);

    // Finally compile the model, we also exactly use tfjs's optimizers and loss functions
    // (So feel free to choose one among tfjs's)
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'})

    // Every single field here is optionnal, and has a default value. Be careful, it may not fit your needs ...

    const teacherConfig = {
      lessonsQuantity: 10000,                  
      lessonLength: 20,                    
      lessonsWithRandom: 0,                     // We do not care about full random sessions
      epsilon: 0.5,                             // Maybe a higher random rate at the beginning ?
      epsilonDecay: 0.995,                   
      epsilonMin: 0.05,
      gamma: 0.9                            
    };
  
    const agentConfig = {
        model: model,                             // Our model corresponding to the agent
        agentConfig: {
            memorySize: 1000,                      // The size of the agent's memory (Q-Learning)
            batchSize: 128,                        // How many tensors will be given to the network when fit
            temporalWindow: temporalWindow         // The temporal window giving previous inputs & actions
        }
    };

    // First we need an academy to host everything
    const academy = new ReImprove.Academy();
    const teacher = academy.addTeacher(teacherConfig);
    const agent = academy.addAgent(agentConfig);

    academy.assignTeacherToAgent(agent, teacher);

    while(true) {
      // Gather inputs
      let inputs = [target.x, target.y, actor.x, actor.y]

      // Step the learning
      let result = await academy.step([{teacherName: teacher, agentsInput: inputs}]);

      // Take Action
      if(result !== undefined) {
        var action = result.get(agent);
        switch (action) {
          case 0:
            actor.x++;
            break;
          case 1:
            actor.x--;
            break;
          case 2:
            actor.y++;
            break;
          case 3:
            actor.y--;
            break;
          default:
            break;
        }
      }

      // Cal. Reward
      let i = actor.x + mapSize * actor.y;
      let terain = map[i];
      let distance = Math.hypot(actor.x-target.x, target.y-target.y);
      let distanceScale = rescale(0, 5, distance, -1, 1);
      var reward = terain == 1 ? -1 : distanceScale;

      // Add Reward
      academy.addRewardToAgent(agent, reward);

      // Log results
      console.log(`Actor: (${actor.x}, ${actor.y}) Reward: ${reward}`);

      if(actor.x == target.x && actor.y == target.y) {
        console.log(`Actor at Target`);
        break;
      }
    }

  });

  teardown(async function () {
    // Do Nothing...
  });
});