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

        this.backwards = [1, 2, 8, 10, 11];
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

        for (var i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
            this.symmetrify_state(state, intent, i);
        
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];

        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*20;
        return actuation;
    }

    symmetrify_state(state, intent, spike_ix) {
//         console.log(state, intent, spike_ix);
        var spikey_orientation = state.orientation;

        var spike_0_q = spikey_orientation.times(this.subshapes[spike_ix].q).normalized(),
            spike_0_q_inv = spike_0_q.inverse();

        var q_transform = Quaternion.of(0.7071, 0.7071, 0, 0).normalized().times(spike_0_q_inv);
//         var q_transform = Quaternion.unit().times(spike_0_q_inv);


        var neighborhood = this.neighborhoods[spike_ix],
            orientations = neighborhood.map(i => spikey_orientation.times(this.subshapes[i].q).normalized()),
            filtered_subshapes = neighborhood.map(i => this.subshapes[i]);

        var R_transform = Mat4.quaternion_rotation(q_transform);

        var impulses = neighborhood.map(i => state.spikes[i].impulse),
            relative_impulses = impulses.map((impulse, i) => 
                Mat4.quaternion_rotation(orientations[i]).times(impulse));
//         console.log(relative_impulses);

        var transformed_1 = Mat4.quaternion_rotation(q_transform.times(orientations[1]).normalized()).times(
            Vec.of(0, 0, 1)).to3(),
            flat_1 = transformed_1.minus(transformed_1.project_onto(Vec.of(0, 1, 0))).normalized(),
            theta = Math.atan(flat_1[0]/flat_1[2]) + (flat_1[2] < 0 ? PI : 0),
//             normal = flat_1.cross(Vec.of(0, 0, 1)),

//             theta = Math.asin(normal.dot(Vec.of(0, 1, 0))) + (this.backwards.includes(spike_ix) ? PI/5 : 0),
            q_flat_transform = Quaternion.from(Math.cos(theta/2), Vec.of(0, 1, 0).times(Math.sin(-theta/2)));

            console.log(10*theta/PI);
//             transformed_intent = Mat4.quaternion_rotation(q_transform_0.times())

//         console.log(Mat4.quaternion_rotation(q_transform.times(orientations[1]).normalized()))
//         console.log(filtered_subshapes[1].shape.h_axis);
//         console.log(transformed_1, flat_1);

//         console.log(flat_1);

        var R = Mat4.quaternion_rotation(spikey_orientation);

        state.scene.shapes.vector.draw(
            state.scene.globals.graphics_state,
            Mat4.y_to_vec(flat_1.times(10000), Vec.of(0, 20, 20)),
            state.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
            "LINES");
            

//         var s0_aligned_neighborhood = neighborhood.map(i => )
        
//         console.log(spike_0_q);
    

        
        for (var i in orientations.slice(0, 2))
            state.scene.shapes.cone.draw(
                state.scene.globals.graphics_state,
                Mat4.translation(Vec.of(0, 20, 20)).times(//).plus(
//                     R.times(this.filtered_subshapes[i].d).minus(filtered_subshapes[i].shape.R.times(filtered_subshapes[i].shape.d)))).times(
                Mat4.quaternion_rotation(q_flat_transform.times(q_transform.times(orientations[i])).normalized())).times(
                Mat4.translation(filtered_subshapes[i].shape.d)).times(
                Mat4.scale(Vec.of(2, 2, 20))),
                state.scene.shader_mats.floor
                );

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

}