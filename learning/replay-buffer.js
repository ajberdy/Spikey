class ReplayBuffer {

    /**
     * Constructs a new replay buffer
     * @param max_size
     */
    constructor(max_size){
        this.max_size = max_size;
        this.count = 0;
        this.buffer = [];
        this.noRewardBuffer = [];
        this.withRewardBuffer = [];
    }

    /**
     * Function for inserting a new experience into the replay buffer
     * @param state
     * @param expanded_state
     * @param action
     * @param new_state
     * @param reward
     * @private
     */
    pushExperience(state, expanded_state, action, new_state, expanded_new_state, reward, terminal){
        if(this.count == this.max_size){
            this.buffer.shift();
            self.count -= 1;
        }
        this.buffer.push({
           state: state,
           expanded_state: expanded_state,
           action: action,
           new_state: new_state,
           expanded_new_state: expanded_new_state,
           reward: reward,
           terminal: terminal
        });
        this.count += 1;
    }

    pushExperiencePlus(state, expanded_state, action, new_state, expanded_new_state, reward, terminal){
        // console.log(reward);
        if(reward != 0){
            if(this.withRewardBuffer.length == this.max_size){
                this.withRewardBuffer.shift();
            }
            this.withRewardBuffer.push({
                state: state,
                expanded_state: expanded_state,
                action: action,
                new_state: new_state,
                expanded_new_state: expanded_new_state,
                reward: reward,
                terminal: terminal
            })
        }
        else{
            if(this.noRewardBuffer.length == this.max_size){
                this.noRewardBuffer.shift();
            }
            this.noRewardBuffer.push({
                state: state,
                expanded_state: expanded_state,
                action: action,
                new_state: new_state,
                expanded_new_state: expanded_new_state,
                reward: reward,
                terminal: terminal
            })
        }
    }

    /**
     * Function to get the number of experiences currently in the buffer
     * @returns {number}
     */
    size(){
        return this.count;
    }

    /**
     * Returns a randomly sampled batch of size batch_size. If the buffer doesn't have enough experiences, return
     * an empty batch.
     * @param batch_size
     * @returns {{new_states: Array, actions: Array, rewards: Array, states: Array}}
     */
    sample_batch(batch_size){
        // console.log(batch_size, this.count);
        const batch = {
            'states': [],
            'expanded_states': [],
            'actions': [],
            'new_states': [],
            'expanded_new_states': [],
            'rewards': [],
            'terminals': []
        };
        if(batch_size > this.count) {
            // console.warn("Batch size greater than buffer size, returning empty batch.");
            return batch;
        }
        const sample_bucket = Array.from(Array(this.count).keys());
        for (let i = 0; i < batch_size; i++){
            let idx = Math.floor(Math.random() * sample_bucket.length);
            batch['states'].push(Array.from(this.buffer[sample_bucket[idx]].state));
            batch['expanded_states'].push(Array.from(this.buffer[sample_bucket[idx]].expanded_state));
            batch['actions'].push(Array.from(this.buffer[sample_bucket[idx]].action));
            batch['new_states'].push(Array.from(this.buffer[sample_bucket[idx]].new_state));
            batch['expanded_new_states'].push(Array.from(this.buffer[sample_bucket[idx]].expanded_new_state));
            batch['rewards'].push(this.buffer[sample_bucket[idx]].reward);
            batch['terminals'].push(this.buffer[sample_bucket[idx]].terminal);
            sample_bucket.splice(idx, 1);
        }
        // console.log(Array.from(batch['states']));
        // console.log(batch.states.flat(1));
        // tf.tensor2d(batch.states, [batch_size, 52]).print();
        return batch;
    }

    sample_batch_plus(batch_size, good_ratio) {
        // console.log(batch_size, this.count);
        const batch = {
            'states': [],
            'expanded_states': [],
            'actions': [],
            'new_states': [],
            'expanded_new_states': [],
            'rewards': [],
            'terminals': []
        };
        if (batch_size > this.noRewardBuffer.length + this.withRewardBuffer.length) {
            // console.warn("Batch size greater than buffer size, returning empty batch.");
            return batch;
        }
        if (this.withRewardBuffer.length == 0 || this.noRewardBuffer.length == 0) {
            return batch;
        }
        let sample_bucket = null;
        if (this.withRewardBuffer.length != 0) {
            sample_bucket = Array.from(Array(this.withRewardBuffer.length).keys());
            for (let i = 0; i < Math.floor(batch_size * good_ratio); i++) {
                let idx = Math.floor(Math.random() * sample_bucket.length);
                batch['states'].push(Array.from(this.withRewardBuffer[sample_bucket[idx]].state));
                batch['expanded_states'].push(Array.from(this.withRewardBuffer[sample_bucket[idx]].expanded_state));
                batch['actions'].push(Array.from(this.withRewardBuffer[sample_bucket[idx]].action));
                batch['new_states'].push(Array.from(this.withRewardBuffer[sample_bucket[idx]].new_state));
                batch['expanded_new_states'].push(Array.from(this.withRewardBuffer[sample_bucket[idx]].expanded_new_state));
                batch['rewards'].push(this.withRewardBuffer[sample_bucket[idx]].reward);
                batch['terminals'].push(this.withRewardBuffer[sample_bucket[idx]].terminal);
                }
            for (let i = 0; i < Math.ceil(batch_size * (1-good_ratio)); i++){
                let idx = Math.floor(Math.random() * sample_bucket.length);
                batch['states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].state));
                batch['expanded_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].expanded_state));
                batch['actions'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].action));
                batch['new_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].new_state));
                batch['expanded_new_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].expanded_new_state));
                batch['rewards'].push(this.noRewardBuffer[sample_bucket[idx]].reward);
                batch['terminals'].push(this.noRewardBuffer[sample_bucket[idx]].terminal);
            }
        }else{
            sample_bucket = Array.from(Array(this.noRewardBuffer.length).keys());
            for (let i = 0; i < Math.ceil(batch_size); i++){
                let idx = Math.floor(Math.random() * sample_bucket.length);
                batch['states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].state));
                batch['expanded_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].expanded_state));
                batch['actions'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].action));
                batch['new_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].new_state));
                batch['expanded_new_states'].push(Array.from(this.noRewardBuffer[sample_bucket[idx]].expanded_new_state));
                batch['rewards'].push(this.noRewardBuffer[sample_bucket[idx]].reward);
                batch['terminals'].push(this.noRewardBuffer[sample_bucket[idx]].terminal);
            }
        }

        return batch;
    }

    /**
     * Clears the internal buffer and resets the count to zero.
     */
    clear(){
        this.buffer.length = 0;
        this.count = 0;
    }
}