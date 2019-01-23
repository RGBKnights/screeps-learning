import assert from 'assert'
// import fs from 'fs-extra-promise'
// import path from 'path'
// import _ from 'lodash'
// import { ScreepsServer, stdHooks } from 'screeps-server-mockup'
import { NeuralNetwork, Model, Academy } from "reimprovejs/dist/reimprove.js"

const TIMEOUT = 1; // mins

function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

suite('Academy tests', function () {
  this.timeout(TIMEOUT * 60 * 1000);

  test('setup academy and train students', async function () {
    let actor = {x: 1, y: 1};
    let target = {x: 5, y: 7};

    const modelFitConfig = {              // Exactly the same idea here by using tfjs's model's
        epochs: 1,                        // fit config.
        stepsPerEpoch: 16
    };

    const numActions = 4;
    const inputSize = 4;                
    const temporalWindow = 1;             // The window of data which will be sent yo your agent. For instance the x previous inputs, and what actions the agent took

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
      lessonsWithRandom: 0,
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

    var lastUpdate = Date.now();

    let steps = 0;
    while((actor.x == target.x && actor.y == target.y) == false) {
      // Gather inputs
      let distance_before = Math.hypot(target.x-actor.x, target.y-actor.y);
      let inputs = [actor.x, actor.y, target.x, target.y];

      // Step the learning
      let result = await academy.step([{teacherName: teacher, agentsInput: inputs}]);

      // Take Action
      if(result !== undefined) {
        steps++;
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

      //TODO: Create a bounds that the actor can not moved beyond...

      let distance_after = Math.hypot(target.x-actor.x, target.y-actor.y)
      let reward = (distance_before == distance_after) ? -0.5 : distance_before - distance_after;
      academy.addRewardToAgent(agent, reward);
      // console.info("Actor", `Location: (${actor.x}, ${actor.y}) Reward: ${reward}`);
    }

    var now = Date.now();
    var dt = Math.abs(now - lastUpdate) / 1000;

    console.info(`Actor took ${(dt % 60)}s and ${steps} steps.`);

  });

  teardown(async function () {
    // Do Nothing...
  });
});