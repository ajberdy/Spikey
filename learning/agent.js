// This class is called from js/DDPG/index.js
class Agent {

    constructor(config){

        this.stopTraining = false;

        config = config || {};
        this.config = {
            "seed": config.seed || 0,
            "batchSize": config.batchSize || 128,
            "memorySize": config.memorySize || 30000,
            "actorLearningRate": config.actorLr || 0.0001,
            "criticLearningRate": config .criticLr || 0.001,
            "gamma": config.gamma || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "epochs": config.epochs || 5,
            "nbEpochsCycle": config.nbEpochsCycle || 10,
            "TrainSteps": config.nbTrainSteps || 110,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "desiredActionStddev": config.desiredActionStddev || 0.1,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "maxStep": config.maxStep || 800
        };

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
        this.epiDuration = [];
        console.log(this.config);
        // DDPG
        this.ddpg = new DDPG(this.actor, this.critic, this.memory, this.noise, this.config);
    }

    save(name){
        /*
            Save the network
        */
       this.ddpg.critic.model.save('downloads://critic-' + name);
       this.ddpg.actor.model.save('downloads://actor-'+ name);
    }

    async restore(folder, name){
        /*
            Restore the weights of the network
        */
        const critic = await tf.loadModel('https://metacar-project.com/public/models/'+folder+'/critic-'+name+'.json');
        const actor = await tf.loadModel("https://metacar-project.com/public/models/"+folder+"/actor-"+name+".json");

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
     * Get the estimation of the Q value given the state
     * and the action
     * @param state number[]
     * @param action [a, steering]
     */
    getQvalue(state, a){
        return this.ddpg.getQvalue(state, a);
    }

    stop(){
        this.stopTraining = true;
    }

    /**
     * Step into the training environement
     * @param tfPreviousStep (tf.tensor2d) Current state
     * @param mPreviousStep number[]
     * @return {done, state} One boolean and the new state
     */
    stepTrain(tfPreviousStep, mPreviousStep){
        // Get actions
        const tfActions = this.ddpg.perturbedPrediction(tfPreviousStep);
        // Step in the environment with theses actions
        let mAcions = tfActions.buffer().values;
        let mReward = this.env.step([mAcions[0], mAcions[1]]);
        this.rewardsList.push(mReward);
        // Get the new observations
        let mState = this.env.getState().linear;
        let tfState = tf.tensor2d([mState]);
        let mDone = 0;
        if (mReward == -1 && this.config.stopOnRewardError){
            mDone = 1;
        }
        // Add the new tuple to the buffer
        this.ddpg.memory.append(mPreviousStep, [mAcions[0], mAcions[1]], mReward, mState, mDone);
        // Dispose tensors
        tfPreviousStep.dispose();
        tfActions.dispose();

        return {mDone, mState, tfState};
    }

    /**
     * Optimize models and log states
     */
    _optimize(){
        this.ddpg.noise.desiredActionStddev = Math.max(0.1, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
        let lossValuesCritic = [];
        let lossValuesActor = [];
        console.time("Training");
        for (let t=0; t < this.config.nbTrainSteps; t++){
            let {lossC, lossA} = this.ddpg.optimizeCriticActor();
            lossValuesCritic.push(lossC);
            lossValuesActor.push(lossA);
        }
        setMetric("CriticLoss", mean(lossValuesCritic));
        setMetric("ActorLoss", mean(lossValuesActor));
    }

    /**
     * Train DDPG Agent
     */
    async train(realTime){
        this.stopTraining = false;
        // One epoch
        for (this.epoch; this.epoch < this.config.nbEpochs; this.epoch++){
            // Perform cycles.
            this.rewardsList = [];
            this.stepList = [];
            this.distanceList = [];
            document.getElementById("trainingProgress").innerHTML = "Progression: "+this.epoch+"/"+this.config.nbEpochs+"<br>";
            for (let c=0; c < this.config.nbEpochsCycle; c++){
                if (c%10==0){ logTfMemory(); }
                let mPreviousStep = this.env.getState().linear;
                let tfPreviousStep = tf.tensor2d([mPreviousStep]);
                let step = 0;

                console.time("LoopTime");
                for (step=0; step < this.config.maxStep; step++){
                    let rel = this.stepTrain(tfPreviousStep, mPreviousStep);
                    mPreviousStep = rel.mState;
                    tfPreviousStep = rel.tfState;
                    if (rel.mDone && this.config.stopOnRewardError){
                        break;
                    }
                    if (this.stopTraining){
                        this.env.render(true);
                        return;
                    }
                    if (realTime && step % 10 == 0)
                        await tf.nextFrame();
                }
                this.stepList.push(step);
                console.timeEnd("LoopTime");
                let distance = this.ddpg.adaptParamNoise();
                this.distanceList.push(distance[0]);

                if (this.config.resetEpisode){
                    this.env.reset();
                }
                this.env.shuffle({cars: false});
                tfPreviousStep.dispose();
                console.log("e="+ this.epoch +", c="+c);

                await tf.nextFrame();
            }
            if (this.epoch > 5){
                this._optimize();
            }
            if (this.config.saveDuringTraining && this.epoch % this.config.saveInterval == 0 && this.epoch != 0){
                this.save("model-ddpg-traffic-epoch-"+this.epoch);
            }
            setMetric("Reward", mean(this.rewardsList));
            setMetric("EpisodeDuration", mean(this.stepList));
            setMetric("NoiseDistance", mean(this.distanceList));
            await tf.nextFrame();
        }
    }

};