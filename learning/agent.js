class Agent {

    constructor(scene) {
        let config = {};
        this.config = {
            "seed": config.seed || 0,
            "batchSize": config.batchSize || 2,
            "memorySize": config.memorySize || 30000,
            "actorLearningRate": config.LearningRate || 0.01,
            "criticLearningRate": config.LearningRate || 0.01,
            "gamma": config.gamma || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "epochs": config.epochs || 100,
            "nbEpochsCycle": config.nbEpochsCycle || 1,
            "trainSteps": config.nbTrainSteps || 110,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "desiredActionStddev": config.desiredActionStddev || 0.1,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "maxStep": config.maxStep || 10,
            "saveInterval": config.saveInterval || 1,
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
    stepTrain(prevStateTensor, expanded_prevStateTensor) {
        // Get actions
        // expanded_prevStateTensor.print();
        const actionTensor = this.ddpg.noisyPredict(expanded_prevStateTensor);
        // actionTensor.print();

        // TODO: this is where the training interacts with the environment
        let reward = this.scene.run_simulation(100, 0.01, actionTensor.buffer().values, this.scene.Spikey.intent);
        let tensorDict = this.scene.Spikey.get_rl_tensors();
        let newStateTensor = tensorDict.global_52;

        this.rewardsList.push(reward);
        // Add the new tuple to the buffer
        this.ddpg.memory.pushExperience(prevStateTensor, expanded_prevStateTensor, actionTensor, newStateTensor, reward);
        // Dispose tensors
        // prevStateTensor.dispose();
        // actionTensor.dispose();

        return newStateTensor;
    }

    /**
     * Optimize models and log states
     */
    _optimize() {
        this.ddpg.noise.desiredActionStddev = Math.max(0.1, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
        let lossValuesCritic = [];
        let lossValuesActor = [];
        console.time("Training");
        for (let t = 0; t < this.config.trainSteps; t++) {
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
                this.scene.get_random_intent();
                let tensorDict = this.scene.Spikey.get_rl_tensors();
                let prevStepTensor = tensorDict.global_52;
                let expanded_prevStepTensor = tensorDict.split_324;

                console.time("LoopTime");
                for (let step = 0; step < this.config.maxStep; step++) {
                    prevStepTensor = this.stepTrain(prevStepTensor, expanded_prevStepTensor);
                    this.stepList.push(step);
                    let distance = this.ddpg.adaptNoise();
                    this.distanceList.push(distance[0]);

                    // prevStepTensor.dispose();
                    // expanded_prevStepTensor.dispose();

                    console.log("e=" + this.epoch + ", c=" + c);

                    await tf.nextFrame();
                }
                console.timeEnd("LoopTime");
                if (this.epoch > 0) {
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
