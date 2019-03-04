class ReplayBuffer {

    /**
     *
     * @param max_size
     */
    constructor(max_size){
        this.max_size = max_size;
        this.count = 0;
        this.buffer = [];
    }

    _insert(state, action, new_state, reward){
        if(this.count == this.max_size){
            this.buffer.shift();
        }
        this.buffer.push({
           state: state,
           action: action,
           new_state: new_state,
           reward: reward,
        });
    }

    size(){
        return this.count;
    }

    sample_batch(batch_size){
        const batch = {
            'states': [],
            'actions': [],
            'new_states': [],
            'rewards': []
        };
        if(batch_size > this.count) {
            console.warn("Batch size greater than buffer size, returning empty batch.");
            return
        }
        for (let i = 0; i < batch_size/2; i++){

        }
    }
}