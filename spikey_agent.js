class Spikey_Agent {
    constructor(){}

    static new_agent(agent_type, arg1) {
        if (agent_type === CHAOS_AGENT)
            return new Chaos_Agent();
        else if (agent_type === THROB_AGENT)
            return new Throb_Agent();
        else if (agent_type === RL_AGENT)
            return new RL_Agent(arg1);
        else if (agent_type === EVOLUTIONARY_AGENT)
            return new Evolutionary_Agent(arg1);
        else if (agent_type === CONSTANT_AGENT)
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
    constructor() {}

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
        let t = state.t;
        let actuation = Array.apply(null, Array(num_spikes));
        for (let i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*40;
        return actuation;
    }
}

class Fake_Agent extends Spikey_Agent {

    get_actuation(state) {
        let t = state.t;
        let actuation = Array.apply(null, Array(num_spikes));
        for (let i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2);
        return actuation;
    }
}

class Throb_Agent extends Spikey_Agent {

    get_actuation(state) {
        let t = state.t;
        let actuation = Array.apply(null, Array(num_spikes));
        for (let i in actuation)
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

        this.actuation = [0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0];
        this.policy = null;
        this.on_policy = false;
        this.timesteps_since_last_update = 0;
    }

    load_agent(agent, set_policy_mode) {
        this.agent = agent;
        if (set_policy_mode)
            this.on_policy = true;
    }

    get_actuation(state, intent) {
        if (!this.on_policy){
            state.scene.shapes.vector.draw(
              state.scene.globals.graphics_state,
              Mat4.y_to_vec(state.intent.times(10), state.scene.Spikey.com),
              state.scene.physics_shader.material(Color.of(0, 1, 1, 1)),
              "LINES");
            state.scene.shapes.ball.draw(
              state.scene.globals.graphics_state,
              Mat4.translation(state.scene.Spikey.pos.plus(state.intent)).times(Mat4.scale(2, 2, 2)),
              state.scene.plastic
            );
            return this.actuation;
        }
        // TENSORFLOW STUFF
        // let rl_tensors = this.get_rl_tensors(state),
        //   split_tensor = rl_tensors.split_336;

        // if (state.scene instanceof Assignment_Two_Skeleton) {
        //     state.scene.shapes.vector.draw(
        //       state.scene.globals.graphics_state,
        //       Mat4.y_to_vec(intent.times(-50), state.scene.Spikey.com),
        //       state.scene.physics_shader.material(Color.of(0, 1, 1, 1)),
        //       "LINES");
        // }
        // if(this.agent instanceof Agent) {
        //   if (this.timesteps_since_last_update == 25) {
        //     split_tensor.print();
        //     let actuation = this.agent.oldAct(split_tensor);
        //     actuation.print();
        //     let actBuf = actuation.buffer().values;
        //     let processed_actBuf = actBuf.map(x => Math.sign(x-0.25) ? 4*x : -1);
        //     if(this.prev_actuation) {
        //       let actBufDiff = processed_actBuf.map((element, idx) => {
        //         return Math.abs(element) - Math.abs(this.prev_actuation[idx])
        //       });
        //       if (actBufDiff.reduce((accum, elem) => {return accum + Math.abs(elem)}) < 0.3) {
        //         processed_actBuf = processed_actBuf.map(x => Math.random() * 2 - 1);
        //       }
        //     }
        //     // let processed_actBuf = actBuf;
        //     this.update_actuation(processed_actBuf);
        //     this.prev_actuation = processed_actBuf;
        //     actuation.dispose();
        //     // console.log(this.actuation);
        //     this.timesteps_since_last_update = 0;
        //   } else {
        //     this.timesteps_since_last_update += 1
        //   }
        // }
        return this.regression.get_actuation(state);
    }

    update_actuation(new_actuation) {
        this.actuation = new_actuation;
    }

    symmetrify_state(state, spike_ix) {

        const intent = state.intent;
        let spikey_orientation = state.orientation;

        let spike_0_q = spikey_orientation.times(this.subshapes[spike_ix].q).normalized(),
            spike_0_q_inv = spike_0_q.inverse();

        let q_transform_0 = Quaternion.of(0.7071, 0.7071, 0, 0).normalized().times(spike_0_q_inv);

        let neighborhood = this.neighborhoods[spike_ix],
            orientations = neighborhood.map(i => spikey_orientation.times(this.subshapes[i].q).normalized()),
            filtered_subshapes = neighborhood.map(i => this.subshapes[i]);

        let impulses = neighborhood.map(i => state.spikes[i].impulse),
            relative_impulses = impulses.map((impulse, i) => 
                Mat4.quaternion_rotation(orientations[i]).times(impulse));

        let transformed_1 = Mat4.quaternion_rotation(q_transform_0.times(orientations[1]).normalized()).times(
            Vec.of(0, 0, 1)).to3(),
            flat_1 = transformed_1.minus(transformed_1.project_onto(Vec.of(0, 1, 0))).normalized(),
            theta = Math.atan(flat_1[0]/flat_1[2]) + (flat_1[2] < 0 ? PI : 0),
            q_flat_transform = Quaternion.from(Math.cos(theta/2), Vec.of(0, 1, 0).times(Math.sin(-theta/2))),

            q_transform = q_flat_transform.times(q_transform_0),
            R_transform = Mat4.quaternion_rotation(q_transform),
            Rinv_transform = Mat4.quaternion_rotation(q_transform.inverse());

        let transformed_orientations = orientations.map(orientation => q_transform.times(orientation)),
            transformed_impulses = impulses.map((impulse, i) => Rinv_transform.times(impulse).to3()),
            transformed_intent = Rinv_transform.times(intent).to3();

        let symmetric_state = {
            transformed_spikes: [],
            intent: transformed_intent
        }

        for (let i in neighborhood) {
            symmetric_state.transformed_spikes.push({
                impulse: transformed_impulses[i],
                h: filtered_subshapes[i].shape.h
            });
        }

        return symmetric_state;
    }

    get_symmetric_states(state) {
        let symmetric_states = Array.apply(null, Array(num_spikes));
        return symmetric_states.map((x, i) => this.symmetrify_state(state, i));
    }

    get_rl_tensors(state) {
        let intent = state.intent,
            symmetric_states = this.get_symmetric_states(state);

        let rl_tensors = {
            global_52: null,
            split_336: null
        };

        let transformed_intent = Mat4.quaternion_rotation(state.orientation.inverse()).times(intent);

        let global_13x4 = state.spikes.map(spike => [...spike.impulse, spike.h]);
        global_13x4.push([...transformed_intent]);

        let split_12x7x4 = symmetric_states.map(sym_state =>
            sym_state.transformed_spikes.map(spike => [...spike.impulse, spike.h]).concat([[...sym_state.intent.to4(0)]]));

        // TENSORFLOW STUFF
        // rl_tensors.global_52 = tf.tensor(global_13x4.flat(), [1, 52]);
        //
        // rl_tensors.split_336 = tf.tensor(split_12x7x4.flat(2), [1, 336]);

        return rl_tensors;
    }

}

class Evolutionary_Agent extends RL_Agent {
    constructor(subshapes) {
        super(subshapes);
        this.sigma = 1;
        this.mu = 1;
        this.global_mu = 0;
        this.weight = 100;
        this.reward = 0;
    }
    
    get_actuation(state) {
        state.scene.shapes.vector.draw(
            state.scene.globals.graphics_state,
            Mat4.y_to_vec(state.intent.normalized().times(100), state.scene.Spikey.com),
            state.scene.physics_shader.material(Color.of(1, 1, 0, 1)),
            "TRIANGLES");
        state.scene.shapes.vector.draw(
            state.scene.globals.graphics_state,
            Mat4.y_to_vec(state.intent.normalized().times(100), state.scene.Spikey.com),
            state.scene.physics_shader.material(Color.of(1, 1, 0, 1)),
            "LINES");

        let axes = this.subshapes.map(x => x.shape.h_axis),
            intent = state.intent;

        return Vec.of(...axes.map(x => this.mu*x.dot(intent)));
    }

    get_reward(displacement, intent) {
        let d_par = displacement.project_onto(intent),
            d_perp = displacement.minus(d_par),
            gamma = .5;

          return d_par.dot(intent) - d_perp.dot(intent);
    }

    sample_normal(mu, sigma) {
        let z = Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*PI*Math.random());
        return sigma*z + mu;
    }

    update_distribution() {
        this.global_mu = this.global_mu*this.weight + this.mu*this.reward;
        this.weight += Math.abs(this.reward);
        this.global_mu /= this.weight;
        this.sigma = this.sigma * (this.weight/(this.weight + 1));
        this.mu = this.sample_normal(this.global_mu, this.sigma);
    }

    learn(info) {
        this.reward = this.get_reward(info.displacement, info.intent);
        this.update_distribution();
        console.log(`Weight:${this.mu.toFixed(3)} Reward:${this.reward.toFixed(3)}\n(Mean:${this.global_mu.toFixed(3)} StdDev:${this.sigma.toFixed(3)})`);
        this.reward = 0;
    }
}