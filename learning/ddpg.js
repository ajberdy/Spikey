class DDPG {

  constructor(actor, critic, replay_buffer, noise, config){
    this.actor = actor;
    this.critic = critic;
    this.memory = replay_buffer;
    this.noise = noise;
    this.config = config;
    this.gamma = tf.scalar(config.gamma);

    this.modelObservationInput = tf.input({batchShape: [null, 52]});
    this.singleObservationInput = tf.input({batchShape: [null, 28]});
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
    this.criticWithActor = (observation, expanded_observation) => {
      return tf.tidy(() => {
        const action = this.actor.predict(expanded_observation);
        return this.critic.predict(observation, action);
      });
    };

    this.criticTargetWithActorTarget = (observation, expanded_observation) => {
      return tf.tidy(() => {
        const actions = this.actorTarget.predict(expanded_observation);
        return this.criticTarget.predict(observation, actions);
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
  trainActor(observations, expanded_observations){
    const actorLoss = this.actorOptimizer.minimize(() => {
      const predQ = this.criticWithActor(observations, expanded_observations);
      return tf.mean(predQ).mul(tf.scalar(-1.))
    }, true, this.actorWeights);

    const loss = actorLoss.buffer().values[0];
    actorLoss.dispose();

    return loss;
  }

  /**
   * Does a single batch worth of training on the critic model, loss function being mean-square loss between target
   * network and regular network
   * @param states
   * @param expanded_states
   * @param actions
   * @param new_states
   * @param expanded_new_states
   * @param rewards
   * @returns {*}
   */
  trainCritic(states, expanded_states, actions, new_states, expanded_new_states, rewards){
    const criticLoss = this.criticOptimizer.minimize(() => {
      const predQ = this.critic.predict(states, actions);
      const new_state_Q = this.criticTargetWithActorTarget(new_states, expanded_new_states);

      const Q = rewards.add(this.gamma.mul(new_state_Q));
      const meanSquareLoss = tf.sub(Q, predQ).square();

      return meanSquareLoss.mean();
    }, true, this.criticWeights);

    const loss = criticLoss.buffer().values[0];
    criticLoss.dispose();

    return loss;

  }

  targetUpdate(){
    // Define in js/DDPG/models.js
    targetUpdate(this.criticTarget, this.critic, this.config);
    targetUpdate(this.actorTarget, this.actor, this.config);
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
   * Takes in observation in tensor format of size 162
   * @param observations
   * @returns {*}
   */
  noiseDistance(expanded_observations) {
    return tf.tidy(() => {
      const noisyPredictions = this.noisyActor.predict(expanded_observations);
      const predictions = this.actor.predict(expanded_observations);
      return tf.square(noisyPredictions.sub(predictions)).mean().sqrt();
    })
  }

  /**
   * Changes the given standard deviation to help match the ideal standard deviation
   * @returns {*}
   */
  adaptNoise(){
    const batch = this.memory.sample_batch(this.config.batchSize);
    if(batch.states.length == 0 || batch.states.size == 0){
      addNoise(this.actor, this.noisyActor, this.noise.currentStddev, this.config.seed);
      return [0]
    }

    const distance = this.noiseDistance(batch.expanded_states);
    addNoise(this.actor, this.noisyActor, this.noise.currentStddev, this.config.seed);

    let distanceV = distance.buffer().values;
    this.noise.adapt(distanceV[0]);

    // Dispose our created tensors
    batch.states.dispose();
    batch.expanded_states.dispose();
    batch.actions.dispose();
    batch.rewards.dispose();
    batch.new_states.dispose();
    distance.dispose();

    return distanceV;
  }

  /**
   * Returns a Q-value for a (state,action) pair
   * @param state
   * @param action
   * @returns {*}
   */
  getQ(state, action){
    const q = this.critic.model.predict([state, action]);
    const v =q.buffer().values;
    q.dispose();
    return v[0];
  }


  optimizeActorCritic(){
    const batch = this.memory.sample_batch(this.config.batchSize);

    const criticLoss = this.trainCritic(batch.states,
                                        batch.expanded_states,
                                        batch.actions,
                                        batch.new_states,
                                        batch.expanded_new_states,
                                        batch.rewards);
    const actorLoss = this.trainActor(batch.states, batch.expanded_states);

    batch.actions.dispose();
    batch.expanded_states.dispose();
    batch.states.dispose();
    batch.new_states.dispose();
    batch.rewards.dispose();

    return {lossC: criticLoss, lossA: actorLoss};

  }



}