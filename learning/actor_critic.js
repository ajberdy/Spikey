

class Actor{
  constructor(config){
    this.seed = config.seed;
    this.observation = null;
    this.config = config;
  }

  /**
   * Builds a single actor model
   * @param observation
   */
  buildModel(observation){
    this.observation = observation;
    this.layer1 = tf.layers.dense({
      units: 28,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'relu',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.layer2 = tf.layers.dense({
      units: 25,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'relu',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.outputLayer = tf.layers.dense({
      units: 1,
      kernelInitializer: tf.initializers.randomUniform({
        minval: 0.003,
        maxval: 0.003,
        seed: this.seed
      }),
      activation: 'tanh',
      useBias: true,
      biasInitializer: "zeros"
    });

    this.singlePredict = (tfState) => {
      return tf.tidy(() => {
        if (tfState){
          observation = tfState;
        }
        return this.outputLayer.apply(this.layer2.apply(this.layer1.apply(observation)));
      });
    };
    const output = this.singlePredict();
    this.model = tf.model({
      inputs: observation,
      outputs: output
    });
  }

  /**
   * Composition of the actor model's outputs into an action tensor
   * @param observation
   */
  predict(observation){
    // observation.print();
    if(observation.rank == 3){
      observation = observation.expandDims();
    }
    return tf.tidy(() => {
      let out0 = this.singlePredict(observation.slice([0, 0, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out1 = this.singlePredict(observation.slice([0, 1, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out2 = this.singlePredict(observation.slice([0, 2, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out3 = this.singlePredict(observation.slice([0, 3, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out4 = this.singlePredict(observation.slice([0, 4, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out5 = this.singlePredict(observation.slice([0, 5, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out6 = this.singlePredict(observation.slice([0, 6, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out7 = this.singlePredict(observation.slice([0, 7, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out8 = this.singlePredict(observation.slice([0, 8, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out9 = this.singlePredict(observation.slice([0, 9, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out10 = this.singlePredict(observation.slice([0, 10, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      let out11 = this.singlePredict(observation.slice([0, 11, 0, 0], [-1, 1, 7, 4]).reshape([-1, 28])).buffer().values[0];
      return tf.tensor([out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11]);
    })
  }
}


class Critic{
  constructor(config){
    this.seed = config.seed;
    this.config = config;
    this.observation = null;
    this.action = null;
  }

  /**
   * Builds the critic model
   * @param observation
   * @param action
   */
  buildModel(observation, action){
    this.observation = observation;
    this.action = action;

    this.firstLayerState = tf.layers.dense({
      units: 50,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.firstLayerAction = tf.layers.dense({
      units: 50,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.secondLayer = tf.layers.dense({
      units:100,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'relu',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.outputLayer = tf.layers.dense({
      units: 1,
      kernelInitializer: tf.initializers.randomUniform({
        minval: 0.003,
        maxval: 0.003,
        seed: this.seed
      }),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });

    this.predict = (tfState, tfActions) => {
      return tf.tidy(() => {
        if (tfState && tfActions){
          observation = tfState;
          action = tfActions;
        };
        let l1 = tf.layers.add().apply([this.firstLayerAction.apply(action), this.firstLayerState.apply(observation)]);
        return this.outputLayer.apply(this.secondLayer.apply(l1));
      })
    };
    const output = this.predict();
    this.model = tf.model({inputs: [observation, action], outputs: output});
  }

}