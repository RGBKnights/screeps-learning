import { NeuralNetwork, Model, Academy } from "reimprovejs/dist/reimprove.js"

export class School {
  constructor(numInputs, numOutputs) {
    this.numOutputs = numOutputs;
    this.numInputs = numInputs;

    this.academy = null;
    this.model = null;
    this.teacher = '';
    this.agent = '';
    this.lesson = null;
  }

  setup() {
    const modelFitConfig = {
        epochs: 1,
        stepsPerEpoch: 16
    };

    const numActions = this.numOutputs;
    const inputSize = this.numInputs;
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
    this.model = new Model.FromNetwork(network, modelFitConfig);

    // Finally compile the model, we also exactly use tfjs's optimizers and loss functions
    // (So feel free to choose one among tfjs's)
    this.model.compile({loss: 'meanSquaredError', optimizer: 'sgd'})

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
        model: this.model,
        agentConfig: {
            memorySize: 1000,                      // The size of the agent's memory (Q-Learning)
            batchSize: 128,                        // How many tensors will be given to the network when fit
            temporalWindow: temporalWindow         // The temporal window giving previous inputs & actions
        }
    };

    // First we need an academy to host everything
    this.academy = new Academy();
    this.teacher = this.academy.addTeacher(teacherConfig);
    this.agent = this.academy.addAgent(agentConfig);

    this.academy.assignTeacherToAgent(this.agent, this.teacher);
  }

  reward(amount) {
    this.academy.addRewardToAgent(this.agent, amount);
  }

  async learn(inputs) {
    this.lesson = await this.academy.step([{teacherName: this.teacher, agentsInput: inputs}]);
  }

  action() {
    if(this.lesson) {
      return this.lesson.get(this.agent);
    } else {
      return null;
    }
  }
}