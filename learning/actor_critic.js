

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
      // TODO: PROBABLY DOESN'T WORK
      let out0 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([0, 1, 7, 11, 3, 8, 12]))));
      let out1 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([1, 0, 8, 2, 6, 7, 12]))));
      let out2 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([2, 1, 8, 4, 9, 6, 12]))));
      let out3 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([3, 0, 11, 10, 4, 8, 12]))));
      let out4 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([4, 2, 8, 3, 10, 9, 12]))));
      let out5 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([5, 6, 9, 10, 11, 7, 12]))));
      let out6 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([6, 1, 2, 9, 5, 7, 12]))));
      let out7 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([7, 0, 1, 6, 5, 11, 12]))));
      let out8 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([8, 0, 3, 4, 2, 1, 12]))));
      let out9 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([9, 2, 4, 10, 5, 6, 12]))));
      let out10 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([10, 3, 11, 5, 9, 4, 12]))));
      let out11 = this.singlePredict(observation.filter(flattenToTensor(idxFilter([11, 0, 7, 5, 10, 3, 12]))));
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