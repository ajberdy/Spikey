class DDPG {

  constructor(actor, critic, replay_buffer, noise, config){
    this.actor = actor;
    this.critic = critic;
    this.memory = replay_buffer;
    this.noise = noise;
    this.config = config;
    this.gamma = tf.scalar(config.gamma);

    this.modelObservationInput = tf.input({batchShape: [null, 51]});
    this.singleObservationInput = tf.input({batchShape: [null, 27]});
    this.actionInput = tf.input({batchShape: [null, 12]});

    // randomly initialize actor
    this.actor.buildModel(this.singleObservationInput);
    // Randomly Initialize critic
    this.critic.buildModel(this.modelObservationInput, this.actionInput);

    this.actorTarget = copyModel(this.actor, Actor);
    this.criticTarget = copyModel(this.critic, Critic);

    this.noisyActor = copyModel(this.actor, Actor);

    this.setLearningOp();
  }

  /**
   * Sets operations necessary to perform training steps
   */
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
    addNoise(this.actor, this.noisyActor, this.noise.currentStddev, this.config.seed);
  }

  /**
   * Single step of actor training, loss function is to maximize predicted Q-value
   * @param observations
   * @returns {*}
   */
  trainActor(observations){
    const actorLoss = this.actorOptimizer.minimize(() => {
      const predQ = this.criticWithActor(observations);
      return tf.mean(predQ).mul(tf.scalar(-1.))
    }, true, this.actorWeights);

    targetUpdate(this.actorTarget, this.actor, this.config);

    const loss = actorLoss.buffer().values[0];
    actorLoss.dispose();

    return loss;
  }

  /**
   * Does a single batch worth of training on the critic model, loss function being mean-square loss between target
   * network and regular network
   * @param states
   * @param actions
   * @param new_states
   * @param rewards
   * @returns {*}
   */
  trainCritic(states, actions, new_states, rewards){
    const criticLoss = this.criticOptimizer.minimize(() => {
      const predQ = this.critic.model.predict([states, actions]);
      const targetPredQ = this.criticTargetWithActorTarget(new_states);

      const Q = rewards.add(this.gamma.mul(targetPredQ));
      const meanSquareLoss = tf.sub(Q, predQ).square();

      return meanSquareLoss.mean();
    }, true, this.criticWeights);

    const loss = criticLoss.buffer().values[0];
    criticLoss.dispose();

    targetUpdate(this.criticTarget, this.critic, this.config);

    return loss;

  }

  /**
   * Runs a single prediction on an observation in object list form
   * @param observation
   * @returns {*|void}
   */
  predict(observation){
    return this.actor.predict(observation);
  }

  /**
   * Runs a noisy predction on the noisy actor
   * @param observation
   * @returns {*|void}
   */
  noisyPredict(observation){
    return this.noisyActor.predict(observation);
  }

  /**
   * Update the target networks with the current weights
   */
  targetUpdate(){
    targetUpdate(this.criticTarget, this.critic, this.config);
    targetUpdate(this.actorTarget, this.actor, this.config);
  }

  /**
   * Takes in observations, list of lists
   * @param observations
   * @returns {*}
   */
  noiseDistance(observations) {
    return tf.tidy(() => {
      const noisyPredictions = this.noisyActor.predict(observations);
      const predictions = this.actor.model.predict(observations);
      return tf.square(noisyPredictions.sub(predictions)).mean().sqrt();
    })
  }

  /**
   * Changes the given standard deviation to help match the ideal standard deviation
   * @returns {*}
   */
  adaptNoise(){
    const batch = this.memory.sample_batch(this.config.batchSize);
    if(batch.states.length == 0){
      addNoise(this.actor, this.noisyActor, this.noise.currentStddev, this.config.seed);
      return [0]
    }

    let distanceV = null;
    if (batch.states.length > 0){
      const distance = this.noiseDistance(batch.states);
      addNoise(this.actor, this.noisyActor, this.noise.currentStddev, this.config.seed);

      distanceV = distance.buffer().values;
      this.noise.adapt(distanceV[0]);

      distance.dispose();
    }
    return distanceV;
  }
}