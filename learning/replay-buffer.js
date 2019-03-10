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

    /**
     * Clears the internal buffer and resets the count to zero.
     */
    clear(){
        this.buffer.length = 0;
        this.count = 0;
    }
}