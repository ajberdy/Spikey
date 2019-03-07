

class Actor{
  constructor(config){
    this.layerNorm = config.layerNorm;

    this.seed = config.seed;
    this.config = config;
    this.observation = null;
  }

  /**
   * Builds a single actor model
   * @param observation
   */
  buildModel(observation){
    this.observation = observation;
    this.layer1 = tf.layers.dense({
      units: 27,
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
    tf.tidy(() => {
      let out0 = this.singlePredict(tf.slice(observation, 0, 27));
      let out1 = this.singlePredict(tf.slice(observation, 27, 27));
      let out2 = this.singlePredict(tf.slice(observation, 54, 27));
      let out3 = this.singlePredict(tf.slice(observation, 81, 27));
      let out4 = this.singlePredict(tf.slice(observation, 108, 27));
      let out5 = this.singlePredict(tf.slice(observation, 135, 27));
      let out6 = this.singlePredict(tf.slice(observation, 162, 27));
      let out7 = this.singlePredict(tf.slice(observation, 189, 27));
      let out8 = this.singlePredict(tf.slice(observation, 216, 27));
      let out9 = this.singlePredict(tf.slice(observation, 243, 27));
      let out10 = this.singlePredict(tf.slice(observation, 270, 27));
      let out11 = this.singlePredict(tf.slice(observation, 297, 27));
      return tf.tensor1d([out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11]);
    })
  }
}


class Critic{
  constructor(config){
    this.stateSize = config.stateSize;
    this.actionSize = config.actionSize;
    this.layerNorm = config.layerNorm;
    this.secondLayerSize = config.criticSecondLayerSize;

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