class Agent {

    constructor(scene) {
        let config = {};
        this.config = {
            "seed": config.seed || 136,
            "batchSize": config.batchSize || 64,
            "memorySize": config.memorySize || 30000,
            "actorLearningRate": config.LearningRate || 0.005,
            "criticLearningRate": config.LearningRate || 0.01,
            "gamma": config.gamma || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "epochs": config.epochs || 100,
            "nbEpochsCycle": config.nbEpochsCycle || 10,
            "trainSteps": config.TrainSteps || 20,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "desiredActionStddev": config.desiredActionStddev || 0.05,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "maxStep": config.maxStep || 30,
            "saveInterval": config.saveInterval || 5,
            "actionReg": config.actionReg || 0.01,
            "goodRatio": config.goodRatio || 0.2
        };

        this.scene = scene;
        this.epoch = 0;
        this.maxStep = this.config.maxStep;
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

    async warmStart_critic() {
        const critic = await tf.loadModel('../models/critic-model-ddpg-epoch-50.json');

        this.ddpg.critic = this.copyFromSave(critic, Critic, this.config, this.ddpg.modelObservationInput, this.ddpg.actionInput);

        this.ddpg.criticTarget = copyModel(this.ddpg.critic, Critic);
    }

    async warmStart_actor() {
        const actor = await tf.loadModel('../models/actor-model-ddpg-epoch-50.json');

        this.ddpg.actor = this.copyFromSave(actor, Actor, this.config, this.ddpg.singleObservationInput, this.ddpg.actionInput);

        this.ddpg.actorTarget = copyModel(this.ddpg.actor, Actor);
        this.ddpg.noisyActor = copyModel(this.ddpg.actor, Actor);

        this.ddpg.setLearningOp();
    }
    async restoreOld(){
        this.oldActor = await tf.loadModel('good_models/actor-model-ddpg-epoch-warm.json');
        // this.oldActor = await tf.loadModel('models/actor-model-ddpg-epoch-70.json')
    }
    async restore(folder, name) {
        /*
            Restore the weights of the network
        */
        const critic = await tf.loadModel('models/critic-model-ddpg-epoch-65.json');
        const actor = await tf.loadModel("models/actor-model-ddpg-epoch-65.json");

        this.ddpg.critic = this.copyFromSave(critic, Critic, this.config, this.ddpg.modelObservationInput, this.ddpg.actionInput);
        this.ddpg.actor = this.copyFromSave(actor, Actor, this.config, this.ddpg.singleObservationInput, this.ddpg.actionInput);

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
    async stepTrain(prevStateTensor, expanded_prevStateTensor) {
        // Get actions
        let prevStateBuffer = prevStateTensor.buffer().values;
        let expanded_prevStateBuffer = expanded_prevStateTensor.buffer().values;
        const actionTensor = this.ddpg.noisyPredict(expanded_prevStateTensor);
        let actionTensorBuffer = actionTensor.buffer().values;
        let resultDict = await this.scene.run_simulation(25, 0.02, actionTensorBuffer, this.scene.Spikey.intent);
        let tensorDict = this.scene.Spikey.get_rl_tensors();

        let newStateTensor = tensorDict.global_52;
        let newStateBuffer = newStateTensor.buffer().values;

        let expanded_newStateTensor = tensorDict.split_336;
        let expanded_newStateBuffer = expanded_newStateTensor.buffer().values;

        this.rewardsList.push(resultDict.reward);
        // Add the new tuple to the buffer
        this.ddpg.memory.pushExperience(prevStateBuffer,
                                        expanded_prevStateBuffer,
                                        actionTensorBuffer,
                                        newStateBuffer,
                                        expanded_newStateBuffer,
                                        resultDict.reward,
                                        resultDict.terminal);
        // Dispose tensors
        prevStateTensor.dispose();
        actionTensor.dispose();
        expanded_prevStateTensor.dispose();

        return {
            newStateTensor: newStateTensor,
            expanded_newStateTensor: expanded_newStateTensor,
            terminal: resultDict.terminal
        };
    }

    /**
     * Optimize models and log states
     */
    _optimize() {
        this.ddpg.noise.desiredActionStddev = Math.max(0.1, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
        let lossValuesCritic = [];
        let lossValuesActor = [];
        console.time("TrainTime");
        for (let t = 0; t < this.config.trainSteps; t++) {
            let losses = this.ddpg.optimizeActorCritic();
            lossValuesCritic.push(losses.lossC);
            lossValuesActor.push(losses.lossA);
        }
        console.timeEnd("TrainTime");
        setMetric("CriticLoss", mean(lossValuesCritic));
        setMetric("ActorLoss", mean(lossValuesActor));
    }

    /**
     * Train DDPG Agent
     */
    async train() {
        for (this.epoch; this.epoch < this.config.epochs; this.epoch++) {
            // Perform cycles.
            this.rewardsList = [];
            this.stepList = [];
            this.distanceList = [];

            document.getElementById("trainingProgress").innerHTML = "Progression: " + this.epoch + "/" + this.config.epochs + "<br>";
            for (let c = 0; c < this.config.nbEpochsCycle; c++) {

                if (c%5==0){ logTfMemory(); }
                this.scene.update_intent_scale(30 + this.epoch);
                this.scene.start_new_trajectory();
                let tensorDict = this.scene.Spikey.get_rl_tensors();
                let prevStepTensor = tensorDict.global_52;
                let expanded_prevStepTensor = tensorDict.split_336;
                let step = 0;
                console.time("EnvLoopTime");
                for (step = 0; step < this.maxStep; step++) {
                    let resultDict = await this.stepTrain(prevStepTensor, expanded_prevStepTensor);
                    prevStepTensor = resultDict.newStateTensor;
                    expanded_prevStepTensor = resultDict.expanded_newStateTensor;
                    if(resultDict.terminal){
                        break;
                    }
                    await tf.nextFrame();
                }
                this.stepList.push(step);
                let distance = this.ddpg.adaptNoise();
                this.distanceList.push(distance[0]);
                console.log("e=" + this.epoch + ", c=" + c);

                prevStepTensor.dispose();
                expanded_prevStepTensor.dispose();

                console.timeEnd("EnvLoopTime");
                if (this.epoch > 4) {
                    this._optimize();
                    this.ddpg.targetUpdate();
                }

            }
            if (this.epoch % this.config.saveInterval == 0 && this.epoch != 0) {
                await this.save("model-ddpg-epoch-" + this.epoch);
            }
            setMetric("Reward", mean(this.rewardsList));
            setMetric("EpisodeDuration", mean(this.stepList));
            setMetric("NoiseDistance", mean(this.distanceList));

            await tf.nextFrame();
        }
    }

    act(inputTensor){
        let actions = this.ddpg.actor.predict(inputTensor);
        actions.print();
        return actions;
    }

    oldAct(inputTensor){
        return tf.tidy(() => {
            let out0 = this.oldActor.predict(inputTensor.slice([0, 0], [-1, 28])).reshape([-1]);
            let out1 = this.oldActor.predict(inputTensor.slice([0, 28], [-1, 28])).reshape([-1]);
            let out2 = this.oldActor.predict(inputTensor.slice([0, 56], [-1, 28])).reshape([-1]);
            let out3 = this.oldActor.predict(inputTensor.slice([0, 84], [-1, 28])).reshape([-1]);
            let out4 = this.oldActor.predict(inputTensor.slice([0, 112], [-1, 28])).reshape([-1]);
            let out5 = this.oldActor.predict(inputTensor.slice([0, 140], [-1, 28])).reshape([-1]);
            let out6 = this.oldActor.predict(inputTensor.slice([0, 168], [-1, 28])).reshape([-1]);
            let out7 = this.oldActor.predict(inputTensor.slice([0, 196], [-1, 28])).reshape([-1]);
            let out8 = this.oldActor.predict(inputTensor.slice([0, 224], [-1, 28])).reshape([-1]);
            let out9 = this.oldActor.predict(inputTensor.slice([0, 252], [-1, 28])).reshape([-1]);
            let out10 = this.oldActor.predict(inputTensor.slice([0, 280], [-1, 28])).reshape([-1]);
            let out11 = this.oldActor.predict(inputTensor.slice([0, 308], [-1, 28])).reshape([-1]);
            return tf.stack([out0, out1, out2, out3, out4, out5, out6, out7, out8, out9, out10, out11], 1);
        })
    }

}
