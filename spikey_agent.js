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
        else if (agent_type == CONSTANT_AGENT)
            return new Constant_Agent();

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

class Constant_Agent {
    constructor() {
        this.actuation = [0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0];
    }

    get_actuation() {
        return this.actuation;
    }

    update_actuation(new_actuation) {
        this.actuation = new_actuation;
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

        var symmetric_states = this.get_symmetric_states(state, intent);
        var rl_tensors = this.get_rl_tensors(state, intent, symmetric_states);

        // symmetric_states is the input to the NN

//         return this.get_rl_actuation(symmetric_states, intent);

        
        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*20;
        return actuation;

    }

    symmetrify_state(state, spike_ix, intent) {
//         console.log(state, intent, spike_ix);
        var spikey_orientation = state.orientation;

        var spike_0_q = spikey_orientation.times(this.subshapes[spike_ix].q).normalized(),
            spike_0_q_inv = spike_0_q.inverse();

        var q_transform_0 = Quaternion.of(0.7071, 0.7071, 0, 0).normalized().times(spike_0_q_inv);
//         var q_transform = Quaternion.unit().times(spike_0_q_inv);


        var neighborhood = this.neighborhoods[spike_ix],
            orientations = neighborhood.map(i => spikey_orientation.times(this.subshapes[i].q).normalized()),
            filtered_subshapes = neighborhood.map(i => this.subshapes[i]);

        var impulses = neighborhood.map(i => state.spikes[i].impulse),
            relative_impulses = impulses.map((impulse, i) => 
                Mat4.quaternion_rotation(orientations[i]).times(impulse));
//         console.log(relative_impulses);

        var transformed_1 = Mat4.quaternion_rotation(q_transform_0.times(orientations[1]).normalized()).times(
            Vec.of(0, 0, 1)).to3(),
            flat_1 = transformed_1.minus(transformed_1.project_onto(Vec.of(0, 1, 0))).normalized(),
            theta = Math.atan(flat_1[0]/flat_1[2]) + (flat_1[2] < 0 ? PI : 0),
            q_flat_transform = Quaternion.from(Math.cos(theta/2), Vec.of(0, 1, 0).times(Math.sin(-theta/2))),

            q_transform = q_flat_transform.times(q_transform_0),
            R_transform = Mat4.quaternion_rotation(q_transform),
            Rinv_transform = Mat4.quaternion_rotation(q_transform.inverse());

        var transformed_orientations = orientations.map(orientation => q_transform.times(orientation)),
            transformed_impulses = impulses.map((impulse, i) => Rinv_transform.times(impulse).to3()),
            transformed_intent = Rinv_transform.times(intent).to3();

        var symmetric_state = {
            transformed_spikes: [],
            intent: transformed_intent
        }

        for (var i in neighborhood) {
            symmetric_state.transformed_spikes.push({
                impulse: transformed_impulses[i],
                h: filtered_subshapes[i].shape.h
            });
        }

        return symmetric_state;
            

//         for (var i in relative_impulses) {
//             if (!transformed_impulses[0].norm())
//                 continue;
//             state.scene.shapes.vector.draw(
//                 state.scene.globals.graphics_state,
//                 Mat4.y_to_vec(transformed_impulses[0], Vec.of(20, 20, 20)),
// //                     state.scene.entities[1].com.plus(filtered_subshapes[i].d)),
//                 state.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
//                 "LINES");
//         }
        
//         console.log(spike_0_q);
    

        
//         for (var i in orientations)
//             state.scene.shapes.cone.draw(
//                 state.scene.globals.graphics_state,
//                 Mat4.translation(Vec.of(0, 20, 20)).times(//).plus(
// //                     R.times(this.filtered_subshapes[i].d).minus(filtered_subshapes[i].shape.R.times(filtered_subshapes[i].shape.d)))).times(
//                 Mat4.quaternion_rotation(q_transform.times(orientations[i]).normalized())).times(
//                 Mat4.translation(filtered_subshapes[i].shape.d)).times(
//                 Mat4.scale(Vec.of(2, 2, 20))),
//                 state.scene.shader_mats.floor
//                 );

//         for (var i in orientations)
//             state.scene.shapes.cone.draw(
//                 state.scene.globals.graphics_state,
//                 Mat4.translation(Vec.of(20, 20, 20)).times(//).plus(
// //                     R.times(this.filtered_subshapes[i].d).minus(filtered_subshapes[i].shape.R.times(filtered_subshapes[i].shape.d)))).times(
//                 Mat4.quaternion_rotation(q_transform.times(orientations[i]).normalized())).times(
//                 Mat4.translation(filtered_subshapes[i].shape.d)).times(
//                 Mat4.scale(Vec.of(2, 2, 20))),
//                 state.scene.shader_mats.floor
//                 );
    }

    get_symmetric_states(state, intent) {
        var symmetric_states = Array.apply(null, Array(num_spikes));
        return symmetric_states.map((x, i) => this.symmetrify_state(state, i, intent));
    }

    get_rl_actuation(symmetric_states, intent) {
        return Vec.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    get_rl_tensors(state, intent, symmetric_states) {
        var rl_tensors = {
            global_52: null,
            split_324: null
        };

        var transformed_intent = Mat4.quaternion_rotation(state.orientation.inverse()).times(intent);

        var global_13x4 = state.spikes.map(spike => [...spike.impulse, spike.h]);
        global_13x4.push([...transformed_intent]);

        var split_12x7x4 = symmetric_states.map(sym_state =>
            sym_state.transformed_spikes.map(spike => [...spike.impulse, spike.h]).concat([[...sym_state.intent.to4(0)]]));

        rl_tensors.global_52 = tf.tensor(global_13x4);
//         rl_tensors.global_52.print();

        rl_tensors.split_324 = tf.tensor(split_12x7x4);
//         console.log(rl_tensors.split_324[0]);        

        return rl_tensors;
    }

}