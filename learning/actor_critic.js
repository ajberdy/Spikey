class SingleActor{
  constructor(config){
    this.stateSize = config.stateSize;
    this.actionSize = config.actionSize;
    this.layerNorm = config.layerNorm;
    this.firstLayerSize = config.actorFirstLayerSize;
    this.secondLayerSize = config.actorSecondLayerSize;

    this.seed = config.seed;
    this.config = config;
    this.observation = null;
  }

  buildModel(observation){
    this.observation = observation;
    this.layer1 = tf.layers.dense({
      units: this.firstLayerSize,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'relu',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.layer2 = tf.layers.dense({
      units: this.secondLayerSize,
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
    })

    this.predict = (tfState) => {
      return tf.tidy(() => {
        if (tfState){
          observation = tfState;
        }
        return this.outputLayer.apply(this.layer2.apply(this.layer1.apply(input)));
      });
    }
    const output = this.predict();
    this.model = tf.model({
      inputs: observation,
      outputs: output
    })
  }
}
class Critic{
  constructor(config){
    this.stateSize = config.stateSize;
    this.actionSize = config.actionSize;
    this.layerNorm = config.layerNorm;

    this.firstLayerStateSize = config.criticFirstLayerStateSize;
    this.firstLayerActionSize = config.criticFirstLayerActionSize;
    this.secondLayerSize = config.criticSecondLayerSize;

    this.seed = config.seed;
    this.config = config;
    this.observation = null;
    this.action = null;
  }

  buildModel(observation, action){
    this.observation = observation;
    this.action = action;

    this.add = tf.layers.add();

    this.firstLayerState = tf.layers.dense({
      units: this.firstLayerStateSize,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.firstLayerAction = tf.layers.dense({
      units: this.firstLayerActionSize,
      kernelInitializer: tf.initializers.glorotUniform({seed: this.seed}),
      activation: 'linear',
      useBias: true,
      biasInitializer: "zeros"
    });
    this.secondLayer = tf.layers.dense({
      units:this.secondLayerSize,
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
        }
        let l1 = this.add.apply([this.firstLayerAction.apply(action), this.firstLayerState.apply(observation)]);
        return this.outputLayer.apply(this.secondLayer.apply(l1));
      })
    }
    const output = this.predict();
    this.model = tf.model({inputs: [observation, action], outputs: output});
  }

}