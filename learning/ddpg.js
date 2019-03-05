class DDPG {

  constructor(actor, critic, replay_buffer, noise, config){
    this.actor = actor;
    this.critic = critic;
    this.memory = replay_buffer;
    this.noise = noise;
    this.config = config;
    this.gamma = tf.scalar(config.gamma);

    this.observationInput = tf.input({batchShape: [null, this.config.stateSize]});
    this.actionInput = tf.input({batchShape: [null, this.config.actionSize]});

    // randomly initialize actor
    this.actor.buildModel(this.observationInput);
    // Randomly Initialize critic
    this.critic.buildModel(this.observationInput, this.actionInput);

    this.actorTarget = copyModel(this.actor, predict);
    this.criticTarget = copyModel(this.critic, Critic);

    this.perturbedActor = copyModel(this.actor, predict);

    this.setLearningOp();
  }

  setLearningOp(){
    this.criticWithActor = (observation) => {
      return tf.tidy(() => {
        const action = this.actor.predict(observation);
        return this.critic.predict(observation, action);
      });
    };

    this.criticTargetWithActorTarget = (observation) => {
      return tf.tidy(() => {
        const action = this.actorTarget.predict(observation);
        return this.criticTarget.predict(observation, action);
      });
    };

    this.actorOptimizer = tf.train.adam(this.config.actorLearningRate);
    this.criticOptimizer = tf.train.adam(this.config.criticLearningRate);

    this.criticWeights = [];
    for (let w = 0; w < this.critic.model.trainableWeights.length; w++){
      this.criticWeights.push(this.critic.model.trainableWeights[w].val);
    }
    this.actorWeights = [];
    for (let w = 0; w < this.actor.model.trainableWeights.length; w++){
      this.actorWeights.push(this.actor.model.trainableWeights[w].val);
    }
    assignAndStd(this.actor, this.perturbedActor, this.noise.currentStddev, this.config.seed);
  }

  predict(observation){
    return this.actor.predict(observation);
  }

  noisyPredict(observation){
    return this.perturbedActor.predict(observation);
  }

  targetUpdate(){
    targetUpdate(this.criticTarget, this.critic, this.config);
    targetUpdate(this.actorTarget, this.actor, this.config);
  }
}