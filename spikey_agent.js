class Spikey_Agent {
    constructor() {
        
    }

    static new_agent(agent_type, arg1) {
        if (agent_type == CHAOS_AGENT)
            return new Chaos_Agent();
        else if (agent_type == THROB_AGENT)
            return new Throb_Agent();
        else if (agent_type == RL_AGENT)
            return new RL_Agent(arg1);

        return new Null_Agent();
    }

    get_actuation() {
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];
    }
}

class Null_Agent {
    constructor() {
        
    }

    get_actuation() {
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];
    }
}

class Chaos_Agent extends Spikey_Agent {

    get_actuation(state) {
        var t = state.t;

        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*40;
        return actuation;
    }
}

class Throb_Agent extends Spikey_Agent {

    get_actuation(state) {
        var t = state.t;

        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t)*20;
        return actuation;
    }
}

class RL_Agent extends Spikey_Agent {
    constructor(subshapes) {
        super();
        this.subshapes = subshapes;
        this.neighborhoods = Mat.of(
            [0, 1, 2, 6, 5, 7],
            [1, 0, 7, 3, 8, 2],
            [2, 0, 1, 8, 4, 6],
            [3, 1, 7, 11, 9, 8],
            [4, 2, 8, 9, 10, 6],
            [5, 0, 6, 10, 11, 7],
            [6, 0, 2, 4, 10, 5],
            [7, 0, 5, 11, 3, 1],
            [8, 1, 3, 9, 4, 2],
            [9, 3, 11, 10, 4, 8],
            [10, 4, 9, 11, 5, 6],
            [11, 3, 7, 5, 10, 9]
        );
    }

    get_actuation(state, intent) {
        /*
        state: {
            t: time,
            spikes: [{
                        impulse: Vec(3),
                        h: Float32
                    }],
            orientation: Quaternion
        }
        
        intent: Vec(3)
        */
        var t = state.t;

        this.symmetrify_state(state, intent, 11);
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];

        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*20;
        return actuation;
    }

    symmetrify_state(state, intent, spike_ix) {
        var spikey_orientation = state.orientation;

        var spike_0_q = spikey_orientation.times(this.subshapes[spike_ix].q).normalized(),
            spike_0_q_inv = spike_0_q.inverse();

        var q_transform_0 = spike_0_q_inv;

        var neighborhood = this.neighborhoods[spike_ix],
            orientations = neighborhood.map(i => spikey_orientation.times(this.subshapes[i].q).normalized());

//         var s0_aligned_neighborhood = neighborhood.map(i => )
        console.log(neighborhood);
        
//         console.log(spike_0_q);

        var filtered_subshapes = neighborhood.map(i => this.subshapes[i]);
        
        for (var i in orientations)
            state.scene.shapes.cone.draw(
                state.scene.globals.graphics_state,
                Mat4.translation(Vec.of(20, 20, 20).plus(filtered_subshapes[i].shape.com)).times(
                Mat4.quaternion_rotation(orientations[i])).times(
                Mat4.scale(Vec.of(2, 2, 20))),
                state.scene.shader_mats.floor
                );
    }


}