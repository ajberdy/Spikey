class ReplayBuffer {

    /**
     * Constructs a new replay buffer
     * @param max_size
     */
    constructor(max_size){
        this.max_size = max_size;
        this.count = 0;
        this.buffer = [];
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
    pushExperience(state, expanded_state, action, new_state, reward){
        if(this.count == this.max_size){
            this.buffer.shift();
            self.count -= 1;
        }
        this.buffer.push({
           state: state,
           expanded_state: expanded_state,
           action: action,
           new_state: new_state,
           reward: reward,
        });
        self.count += 1;
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
        const batch = {
            'states': [],
            'actions': [],
            'new_states': [],
            'rewards': []
        };
        if(batch_size > this.count) {
            console.warn("Batch size greater than buffer size, returning empty batch.");
            return batch;
        }
        const sample_bucket = Array.from(Array(this.count).keys());
        for (let i = 0; i < batch_size; i++){
            let idx = Math.floor(Math.random() * sample_bucket.length);
            batch['states'].push(this.buffer[sample_bucket[idx]].state);
            batch['expanded_states'].push(this.buffer[sample_bucket[idx]].expanded_state);
            batch['actions'].push(this.buffer[sample_bucket[idx]].action);
            batch['new_states'].push(this.buffer[sample_bucket[idx]].new_state);
            batch['rewards'].push(this.buffer[sample_bucket[idx]].reward);
            sample_bucket.splice(idx, 1);
        }
        let ret_batch = {
            states: tf.tensor([batch_size, 13, 4], batch['states']),
            expanded_states: tf.tensor([batch_size, 12, 7, 4], batch['expanded_states']),
            actions: tf.tensor([batch_size, 12], batch['actions']),
            new_states: tf.tensor([batch_size, 13, 4], batch['new_states']),
            rewards: tf.tensor([batch_size, 1], batch['rewards'])
        }
        return ret_batch;
    }

    /**
     * Clears the internal buffer and resets the count to zero.
     */
    clear(){
        this.buffer.length = 0;
        this.count = 0;
    }
}