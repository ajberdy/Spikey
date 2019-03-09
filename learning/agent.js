class Agent {

    constructor(scene) {
        let config = {};
        this.config = {
            "seed": config.seed || 123,
            "batchSize": config.batchSize || 128,
            "memorySize": config.memorySize || 30000,
            "actorLearningRate": config.LearningRate || 0.005,
            "criticLearningRate": config.LearningRate || 0.005,
            "gamma": config.gamma || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "epochs": config.epochs || 100,
            "nbEpochsCycle": config.nbEpochsCycle || 10,
            "trainSteps": config.nbTrainSteps || 100,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "desiredActionStddev": config.desiredActionStddev || 0.1,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "maxStep": config.maxStep || 30,
            "saveInterval": config.saveInterval || 10,
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

    async save(name) {
        await this.ddpg.critic.model.save('downloads://critic-' + name);
        await this.ddpg.actor.model.save('downloads://actor-' + name);
    }

    async restore(folder, name) {
        /*
            Restore the weights of the network
        */
        const critic = await tf.loadModel('https://metacar-project.com/public/models/' + folder + '/critic-' + name + '.json');
        const actor = await tf.loadModel("https://metacar-project.com/public/models/" + folder + "/actor-" + name + ".json");

        this.ddpg.critic = this.copyFromSave(critic, Critic, this.config, this.ddpg.obsInput, this.ddpg.actionInput);
        this.ddpg.actor = this.copyFromSave(actor, Actor, this.config, this.ddpg.obsInput, this.ddpg.actionInput);

        // Define in js/DDPG/models.js
        // Init target network Q' and μ' with the same weights
        this.ddpg.actorTarget = copyModel(this.ddpg.actor, Actor);
        this.ddpg.criticTarget = copyModel(this.ddpg.critic, Critic);
        // Perturbed Actor (See parameter space noise Exploration paper)
        this.ddpg.noisyActor = copyModel(this.ddpg.actor, Actor);
        //this.adaptivePerturbedActor = copyModel(this.actor, Actor);
        this.ddpg.setLearningOp();
    }

    copyFromSave(model, instance, config, obs, action){
        return tf.tidy(() => {
            let newModel = new instance(config);
            // action might be not required
            newModel.buildModel(obs, action);
            const weights = model.weights;
            for (let m=0; m < weights.length; m++){
                newModel.model.weights[m].val.assign(weights[m].val);
            }
            return newModel;
        })
    }

    /**
     *
     * @param prevStateTensor
     * @param expanded_prevStateTensor
     * @returns {{newState: (Chart.Ticks.generators.linear|Chart.Ticks.formatters.linear|Chart.easingEffects.linear|linear|*|M.easing.linear), newStateTensor: *}}
     */
    stepTrain(prevStateTensor, expanded_prevStateTensor) {
        // Get actions
        let prevStateBuffer = prevStateTensor.buffer().values;
        let expanded_prevStateBuffer = expanded_prevStateTensor.buffer().values;
        // expanded_prevStateTensor.print();
        const actionTensor = this.ddpg.noisyPredict(expanded_prevStateTensor);
        let actionTensorBuffer = actionTensor.buffer().values;
        // actionTensor.print();

        // TODO: this is where the training interacts with the environment
        let reward = this.scene.run_simulation(25, 0.02, actionTensor.buffer().values, this.scene.Spikey.intent);
        let tensorDict = this.scene.Spikey.get_rl_tensors();

        let newStateTensor = tensorDict.global_52;
        let newStateBuffer = newStateTensor.buffer().values;

        let expanded_newStateTensor = tensorDict.split_336;
        let expanded_newStateBuffer = expanded_newStateTensor.buffer().values;

        this.rewardsList.push(reward);
        // Add the new tuple to the buffer
        this.ddpg.memory.pushExperience(prevStateBuffer,
                                        expanded_prevStateBuffer,
                                        actionTensorBuffer,
                                        newStateBuffer,
                                        expanded_newStateBuffer,
                                        reward);
        // Dispose tensors
        prevStateTensor.dispose();
        actionTensor.dispose();

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
            let losses = this.ddpg.optimizeActorCritic();
            lossValuesCritic.push(losses.lossC);
            lossValuesActor.push(losses.lossA);
        }
        console.timeEnd("Training");
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
                this.scene.get_random_intent();
                this.scene.reset_spiky_pos();
                let tensorDict = this.scene.Spikey.get_rl_tensors();
                let prevStepTensor = tensorDict.global_52.reshape([1, 52]);
                let expanded_prevStepTensor = tensorDict.split_336.reshape([1, 336]);

                console.time("LoopTime");
                for (let step = 0; step < this.config.maxStep; step++) {
                    prevStepTensor = this.stepTrain(prevStepTensor, expanded_prevStepTensor);
                    this.stepList.push(step);
                    let distance = this.ddpg.adaptNoise();
                    this.distanceList.push(distance[0]);

                    console.log("e=" + this.epoch + ", c=" + c);

                    await tf.nextFrame();
                }

                prevStepTensor.dispose();
                expanded_prevStepTensor.dispose();

                console.timeEnd("LoopTime");
                if (this.epoch > 0) {
                    this._optimize();
                    this.ddpg.targetUpdate();
                }
                setMetric("Reward", mean(this.rewardsList));
                setMetric("EpisodeDuration", mean(this.stepList));
                setMetric("NoiseDistance", mean(this.distanceList));
                await tf.nextFrame();
            }
            if (this.epoch % this.config.saveInterval == 0 && this.epoch != 0) {
                await this.save("model-ddpg-epoch-" + this.epoch);
            }
        }
    }

    act(inputTensor){
        return this.ddpg.actor.predict(inputTensor);
    }

}
