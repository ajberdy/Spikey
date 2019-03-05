class DDPG {

  constructor(actor, critic, replay_buffer, noise, config){
    this.actor = actor;
    this.critic = critic;
    this.memory = memory;
    this.noise - noise;
    this.config = config;
    this.discount = tf.scalar(config.discount);

    this.observationInput = tf.input({batchShape: [null, this.config.stateSize]});
    this.actionInput = tf.input({batchShape: [null, this.config.actionSize]});

    // randomly initialize actor
    this.actor.buildModel(this.observationInput);
    // Randomly Initialize critic
    this.critic.buildModel(this.observationInput, this.actionInput);

    this.actorTarget = copyModel(this.actor, SingleActor);
    this.criticTarget = copyModel(this.critic, Critic);

    this.perturbedActor = copyModel(this.actor, SingleActor);

    this.setLearningOp();
  }

  setLearningOp(){
    this.criticWithActor = (tfState) => {
      return tf.tidy(() => {
        const tfAct = this.actor.predict(tfState);
        return this.critic.predict(tfState, tfAct);
      });
    };

    this.criticTargetWithActorTarget = (tfState) => {
      return tf.tidy(() => {
        const tfAct = this.actorTarget.predict(tfState);
        return this.criticTarget.predict(tfState, tfAct);
      });
    };

    this.actorOptimizer = tf.train.adam(this.config.actorLearningRate);
    this.criticOptimizer = tf.train.adam(this.config.criticLearningRate);
  }
}