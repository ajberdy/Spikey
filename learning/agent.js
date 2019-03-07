class Agent {

    constructor(config, scene) {
        config = config || {};
        this.config = {
            "seed": config.seed || 0,
            "batchSize": config.batchSize || 128,
            "memorySize": config.memorySize || 30000,
            "actorLearningRate": config.LearningRate || 0.0001,
            "criticLearningRate": config.LearningRate || 0.001,
            "gamma": config.gamma || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "epochs": config.epochs || 100,
            "nbEpochsCycle": config.nbEpochsCycle || 10,
            "TrainSteps": config.nbTrainSteps || 110,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "desiredActionStddev": config.desiredActionStddev || 0.1,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "maxStep": config.maxStep || 800,
            "saveInterval": config.saveInterval || 5,
        };

        this.scene = scene;
        this.epoch = 0;
        // From js/DDPG/noise.js
        this.noise = new Noise(this.config);

        // Configure components.

        // Buffer replay
        // The baseline use 1e6 but this size should be enough for this problem
        this.memory = new ReplayBuffer(this.config.memorySize);
        // Actor and Critic are from js/DDPG/models.js
        this.actor = new Actor(this.config);
        this.critic = new Critic(this.config);

        // Seed javascript
        Math.seedrandom(0);

        this.rewardsList = [];
        this.ddpg = new DDPG(this.actor, this.critic, this.memory, this.noise, this.config);
    }

    save(name) {
        /*
            Save the network
        */
        this.ddpg.critic.model.save('downloads://critic-' + name);
        this.ddpg.actor.model.save('downloads://actor-' + name);
    }

    async restore(folder, name) {
        /*
            Restore the weights of the network
        */
        const critic = await tf.loadModel('https://metacar-project.com/public/models/' + folder + '/critic-' + name + '.json');
        const actor = await tf.loadModel("https://metacar-project.com/public/models/" + folder + "/actor-" + name + ".json");

        this.ddpg.critic = copyFromSave(critic, Critic, this.config, this.ddpg.obsInput, this.ddpg.actionInput);
        this.ddpg.actor = copyFromSave(actor, Actor, this.config, this.ddpg.obsInput, this.ddpg.actionInput);

        // Define in js/DDPG/models.js
        // Init target network Q' and μ' with the same weights
        this.ddpg.actorTarget = copyModel(this.ddpg.actor, Actor);
        this.ddpg.criticTarget = copyModel(this.ddpg.critic, Critic);
        // Perturbed Actor (See parameter space noise Exploration paper)
        this.ddpg.noisyActor = copyModel(this.ddpg.actor, Actor);
        //this.adaptivePerturbedActor = copyModel(this.actor, Actor);
        this.ddpg.setLearningOp();
    }

    /**
     *
     * @param prevStateTensor
     * @param prevStateArray
     * @returns {{newState: (Chart.Ticks.generators.linear|Chart.Ticks.formatters.linear|Chart.easingEffects.linear|linear|*|M.easing.linear), newStateTensor: *}}
     */
    stepTrain(prevStateTensor, prevStateArray) {
        // Get actions
        const actionTensor = this.ddpg.noisyPredict(prevStateTensor);
        // Step in the environment with theses actions
        let actionArray = actions.buffer().values;

        // TODO: this is where the training interacts with the environment
        let reward = this.env.step([mActions[0], mActions[1]]);
        this.rewardsList.push(reward);
        let newState = this.env.getState().linear;
        let newStateTensor = tf.tensor2d([newState]);


        // Add the new tuple to the buffer
        this.ddpg.memory.pushExperience(prevStateArray, expandedState, actionArray, reward, newState);
        // Dispose tensors
        prevStateTensor.dispose();
        actionTensor.dispose();

        return {newState, newStateTensor};
    }

    /**
     * Optimize models and log states
     */
    _optimize() {
        this.ddpg.noise.desiredActionStddev = Math.max(0.1, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
        let lossValuesCritic = [];
        let lossValuesActor = [];
        console.time("Training");
        for (let t = 0; t < this.config.nbTrainSteps; t++) {
            let {lossC, lossA} = this.ddpg.optimizeActorCritic();
            lossValuesCritic.push(lossC);
            lossValuesActor.push(lossA);
        }
        setMetric("CriticLoss", mean(lossValuesCritic));
        setMetric("ActorLoss", mean(lossValuesActor));
    }

    /**
     * Train DDPG Agent
     */
    async train() {
        console.log("Training Time!");
        for (this.epoch; this.epoch < this.config.epochs; this.epoch++) {
            // Perform cycles.
            this.rewardsList = [];
            this.stepList = [];
            this.distanceList = [];
            document.getElementById("trainingProgress").innerHTML = "Progression: " + this.epoch + "/" + this.config.epochs + "<br>";
            for (let c = 0; c < this.config.nbEpochsCycle; c++) {
                // if (c%10==0){ logTfMemory(); }

                // TODO: INITIALIZE NEW INSTANCE;
                this.scene.get_random_intent();
                let prevStepTensor = this.scene.Spikey.brain.get_rl_tensors(this.scene.Spikey.intent);


                console.time("LoopTime");
                for (let step = 0; step < this.config.maxStep; step++) {
                    let rel = this.stepTrain(prevStepTensor);
                    prevStepTensor = rel.tfState;
                    this.stepList.push(step);
                    console.timeEnd("LoopTime");
                    let distance = this.ddpg.adaptNoise();
                    this.distanceList.push(distance[0]);
                    tfPreviousStep.dispose();

                    console.log("e=" + this.epoch + ", c=" + c);

                    await tf.nextFrame();
                }
                if (this.epoch > 5) {
                    this._optimize();
                }
                if (this.config.saveDuringTraining && this.epoch % this.config.saveInterval == 0 && this.epoch != 0) {
                    this.save("model-ddpg-epoch-" + this.epoch);
                }
                setMetric("Reward", mean(this.rewardsList));
                setMetric("EpisodeDuration", mean(this.stepList));
                setMetric("NoiseDistance", mean(this.distanceList));
                await tf.nextFrame();
            }
        }
    }

}