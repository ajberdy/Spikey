

class Actor{
  constructor(config){
    this.seed = config.seed;
    this.observation = null;
    this.config = config;
  }

  /**
   * Builds a single actor model
   * @param observation
   * @param action
   */
  buildModel(observation){
    this.observation = observation;
    this.layerN = tf.layers.batchNormalization({
      axis: 1
    });
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
          // tfState.print();
          observation = tfState;
        }
        return this.outputLayer.apply(this.layer2.apply(this.layer1.apply(this.layerN.apply(observation))));
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
    return tf.tidy(() => {
      let out0 = this.singlePredict(observation.slice([0, 0], [-1, 28])).reshape([-1]);
      let out1 = this.singlePredict(observation.slice([0, 28], [-1, 28])).reshape([-1]);
      let out2 = this.singlePredict(observation.slice([0, 56], [-1, 28])).reshape([-1]);
      let out3 = this.singlePredict(observation.slice([0, 84], [-1, 28])).reshape([-1]);
      let out4 = this.singlePredict(observation.slice([0, 112], [-1, 28])).reshape([-1]);
      let out5 = this.singlePredict(observation.slice([0, 140], [-1, 28])).reshape([-1]);
      let out6 = this.singlePredict(observation.slice([0, 168], [-1, 28])).reshape([-1]);
      let out7 = this.singlePredict(observation.slice([0, 196], [-1, 28])).reshape([-1]);
      let out8 = this.singlePredict(observation.slice([0, 224], [-1, 28])).reshape([-1]);
      let out9 = this.singlePredict(observation.slice([0, 252], [-1, 28])).reshape([-1]);
      let out10 = this.singlePredict(observation.slice([0, 280], [-1, 28])).reshape([-1]);
      let out11 = this.singlePredict(observation.slice([0, 308], [-1, 28])).reshape([-1]);
      // for(var i in [out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11]){
      //   let list = [out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11];
      //   console.log("out" + i + ":");
      //   list[i].print();
      // }
      return tf.stack([out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11], 1);
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
      units: 10,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.firstLayerAction = tf.layers.dense({
      units: 10,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.secondLayer = tf.layers.dense({
      units:20,
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

    this.predict = (states, actions) => {
      return tf.tidy(() => {
        if (states && actions){
          observation = states;
          action = actions;
        };
        let l1a = this.firstLayerAction.apply(action);
        let l1s = this.firstLayerState.apply(observation);
        let l2concat = tf.layers.add().apply([l1a, l1s]);
        let l2 = this.secondLayer.apply(l2concat);
        return this.outputLayer.apply(l2);
      })
    };
    const output = this.predict();
    this.model = tf.model({inputs: [observation, action], outputs: output});
  }

}