const spikey_body_mass = 20,
      spikey_spike_mass = 5,
      spikey_mu_s = .1,
      spikey_mu_d = .05,
      num_spikes = 12,
      spikey_mass = spikey_body_mass + num_spikes*spikey_spike_mass,
      sphere_radius = 10,
      min_spike_protrusion = 5,
      max_spike_protrusion = 20,
      spike_base_radius = 3,
      spikey_restitution = .01,
      spikey_strength = 2;

const spikey_consts = {
            spikey_body_mass: spikey_body_mass,
            spikey_spike_mass: spikey_spike_mass,
            num_spikes: num_spikes,
            spikey_mass: spikey_mass,
            sphere_radius: sphere_radius,
            min_spike_protrusion: min_spike_protrusion,
            max_spike_protrusion: max_spike_protrusion,
            spike_base_radius: spike_base_radius,
            spikey_restitution: spikey_restitution,
            spikey_strength: spikey_strength
        };

class Spikey_Object extends Physics_Object {
    constructor(scene, pos, vel, w, q, agent_type) {
        var spikey_material = Material.of(spikey_mu_s, spikey_mu_d, spikey_consts.spikey_restitution, scene.shader_mats.spikey);

        super(scene, pos, vel, w, q, spikey_consts.spikey_mass, spikey_material);
        
        this.sr = spikey_consts.sphere_radius;
        this.spr = spikey_consts.max_spike_protrusion;
        this.I = Mat3.identity().times(2/3*this.m*Math.pow(this.sr + this.spr/5, 2));
        this.I_inv = Mat3.identity().times(1/(2/3*this.m*Math.pow(this.sr + this.spr/5, 2)));

        this.spikey_material = spikey_material;

        this.shape = this.scene.shapes.spikey;//new Spikey_Shape(spikey_consts);

        this.base_points = this.shape.tips;

        this.spike_vector = Vec.of(1, 1, 1, 1,
                                   1, 1, 1, 1,
                                   1, 1, 1, 1).times(spikey_consts.max_spike_protrusion);

        this._convex_decomposition = this.init_convex_decomposition();

        this.brain = Spikey_Agent.new_agent(agent_type, this.spikes);

        for (var i in this._convex_decomposition) {
            var subshape = this._convex_decomposition[i].shape,
                submass = this._convex_decomposition[i].submass,
                d = this._convex_decomposition[i].d,
                q = this._convex_decomposition[i].q;

            this.I = this.I.plus(subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)).times(submass/this.m));
        }
        var I_4 = Mat4.of(
                [this.I[0][0], this.I[0][1], this.I[0][2], 0],
                [this.I[1][0], this.I[1][1], this.I[1][2], 0],
                [this.I[2][0], this.I[2][1], this.I[2][2], 0],
                [0, 0, 0, 1]
            ),
            I_4_inv = Mat4.inverse(I_4);
        this.I_inv = Mat3.of(
            [I_4_inv[0][0], I_4_inv[0][1], I_4_inv[0][2]],
            [I_4_inv[1][0], I_4_inv[1][1], I_4_inv[1][2]],
            [I_4_inv[2][0], I_4_inv[2][1], I_4_inv[2][2]],
        );
        this.convex = false;

        this.initialize();

//         this.state = {
//             t: 0,
//             spikes: Array.apply(null, Array(num_spikes)),
//             orientation: this.orientation,
//             scene: this.scene   // for debugging
//         }

        this._intent = Vec.of(1, 0, 0);
        this.last_intent = Vec.of(1, 0, 0);
        
        this.state = {
            t: 0,
            spikes: Array.apply(null, Array(num_spikes)),
            orientation: this.orientation,
            intent: this.intent
        }

        for (var i in this.state.spikes)
            this.state.spikes[i] = {
                impulse: Vec.of(0, 0, 0),
                h:       this.spr
            };

    }

    get spikes() {
        return this._convex_decomposition.slice(1);
    }

    static of(...args) {
        return new Spikey_Object(...args);
    }

    get_rl_tensors() {
        return this.brain.get_rl_tensors(this.state);
    }

    draw(graphics_state, light_shader_mat) {
//         this.scene.shapes.spikey.draw(
//             graphics_state,
//             this.transform,
//             this.shader_mat);


//         for (var i in this.base_points)
//             this.scene.shapes.ball.draw(
//                 graphics_state,
//                 this.transform.times(Mat4.translation(this.base_points[i])).times(Mat4.scale(2, 2, 2)),
//                 this.scene.shader_mats.soccer);

//         return;

//         this.scene.shapes.ball.draw(
//             this.scene.globals.graphics_state,
//             Mat4.translation(this.com).times(Mat4.scale(2, 2, 2)),
//             this.scene.plastic);

//         this.scene.shapes.ball.draw(
//             this.scene.globals.graphics_state,
//             Mat4.translation(this.pos).times(Mat4.scale(2, 2, 2)),
//             this.scene.shader_mats.floor);

//         if (this.scene.debug)
//             this.scene.shapes.vector.draw(
//                 this.scene.globals.graphics_state,
//                 Mat4.y_to_vec(this.d, this.com).times(10000000),
//                 this.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
//                 "LINES");

//         console.log(this.d);

        for (var i in this.convex_decomposition) {
            var subshape = this._convex_decomposition[i].shape;
//             if (this._convex_decomposition[i].d.norm()) {
//                 this.scene.shapes.ball.draw(
//                     this.scene.globals.graphics_state,
//                     Mat4.translation(subshape.com).times(Mat4.scale(2, 2, 2)),
//                     this.scene.shader_mats.floor);
//             } 
            subshape.draw(graphics_state, light_shader_mat);

        }
        
    }

    update_state(i, h, impulse, actuation, moving_avg = true) {
        if (impulse != undefined) {
            if (moving_avg) {
                const alpha = .9;
                this.state.spikes[i].impulse = this.state.spikes[i].impulse * alpha + impulse * (1 - decay);
            }
            else
                this.state.spikes[i].impulse = impulse;
        }
            
        
        this.state.spikes[i].h = h;
        this.state.orientation = this.orientation;
    }

    init_convex_decomposition() {
        var spikey_body = Ball.of(this.scene, this.pos, this.vel, this.w, this.orientation, spikey_consts.spikey_mass,
                                  spikey_consts.sphere_radius, this.spikey_material);

        var convex_decomposition = [{
            shape: spikey_body, 
            submass: spikey_consts.spikey_body_mass,
            d: Vec.of(0, 0, 0), 
            q: Quaternion.unit()
        }];

        var spike_vectors = [],
            r = spikey_consts.sphere_radius / Math.sqrt(PHI + 2),
            R = r * PHI;

        for (var s1 = -1; s1 < 2; s1 += 2){
            for (var s2 = -1; s2 < 2; s2 += 2) {
                spike_vectors.push(Vec.of(0, s1*r, s2*R));
                spike_vectors.push(Vec.of(s1*r, s2*R, 0));
                spike_vectors.push(Vec.of(s2*R, 0, s1*r));
            }
        }

        var r2 = Math.sqrt(r**2 + R**2);

        for (var spike of spike_vectors) {
                       
            var x = spike[0],
                y = spike[1],
                z = spike[2];

            var phi = Math.atan(y/Math.sqrt(x**2 + z**2)),
                theta = Math.atan(x/z) + (z < 0 ? PI : 0),
                axis_angle = PI/5;

            var translate_vec = spike.normalized().times(R);

            var spike_rotate_v = Mat4.rotation(phi, Vec.of(-1, 0, 0)),
                spike_rotate_h = Mat4.rotation(theta, Vec.of(0, 1, 0)),
                spike_translate = Mat4.translation(translate_vec),
                spike_scale = Mat4.scale(Vec.of(spikey_consts.spike_base_radius, 
                                                spikey_consts.spike_base_radius, 
                                                spikey_consts.max_spike_protrusion));

            var spike_axis_rotate = Mat4.rotation(axis_angle, Vec.of(0, 0, 1));

            
            var transform = spike_translate.times(
                spike_rotate_h).times(
                spike_rotate_v).times(
                spike_axis_rotate).times(
                spike_scale);

            var Rm = spike_rotate_h.times(spike_rotate_v);

            var qh = Quaternion.from(Math.cos(theta/2), Vec.of(0, 1, 0).times(Math.sin(theta/2))),
                qv = Quaternion.from(Math.cos(phi/2), Vec.of(-1, 0, 0).times(Math.sin(phi/2))),
                qa = Quaternion.from(Math.cos(axis_angle/2), Vec.of(0, 0, 1).times(Math.sin(axis_angle/2))),
                q = qh.times(qv.times(qa));

            var cone = Spike_Object.of(this.scene, this.pos, this.vel, this.w, this.orientation.times(q).normalized(), 
                            spikey_consts.spikey_mass,  spikey_consts.spike_base_radius, 
                            Vec.of(spikey_consts.min_spike_protrusion, spikey_consts.max_spike_protrusion), 
                            this.spikey_material, translate_vec.times(-1), spikey_consts.spikey_spike_mass, 
                            spikey_consts.spikey_strength);

            cone.com = this.pos.plus(this.R.times(translate_vec).minus(cone.R.times(cone.d)));

            convex_decomposition.push({
                shape: cone,
                submass: spikey_consts.spikey_spike_mass,
                d: translate_vec,
                q: q
            });

        }

        return convex_decomposition;
    }

    get convex_decomposition() {
        for (var i in this._convex_decomposition) {
            var subshape = this._convex_decomposition[i].shape,
                d = this._convex_decomposition[i].d,
                q = this._convex_decomposition[i].q;

            this.update_subshape(subshape, d, q);
        }
        return this._convex_decomposition;
    }

    update_subshape(subshape, d, q) {
        subshape.momentum = this.momentum;
        subshape.L = this.L;

        subshape.orientation = this.orientation.times(q).normalized();

        subshape.com = this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)));

        subshape.recalc();

    }

    get intent() {
        return this._intent;
    }

    set intent(intent) {
        this.last_intent = this.intent;
        this._intent = intent;
    }

    update(dt) {
        super.update(dt);
        this.convex_decomposition;
        
        this.actuate(this.get_actuation(this.intent));

        var new_com = this.convex_decomposition.reduce(
            (a, b) => a.plus(b.shape.com.times(b.submass)), Vec.of(0, 0, 0)).times(1/this.m);
        this._d = this.R_inv.times(this.pos.minus(new_com));
        this.state.t = this.scene.globals.graphics_state.animation_time;
        
    }

    get_actuation(intent_vector) {
        return this.brain.get_actuation(this.state, intent_vector);
    }

    set_spike_lengths(spike_vector) {
        var dspikes = spike_vector.minus(this.spike_vector);
        for (var i in this.spikes) {
            var subshape = this.spikes[i].shape,
                submass = this.spikes[i].submass,
                d = this.spikes[i].d,
                I_0 = subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)).times(submass/this.m);
            if (this.spikes[i].shape.move_spike(dspikes[i])) {
                this.spike_vector[i] = this.spikes[i].shape.h;
                var I_1 = subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)).times(submass/this.m),
                    dI = I_1.minus(I_0);
                this.I = this.I.plus(dI);
                this.update_subshape(this.spikes[i].shape, this.spikes[i].d, this.spikes[i].q);
            }
            
        }
        var I_4 = Mat4.of(
                [this.I[0][0], this.I[0][1], this.I[0][2], 0],
                [this.I[1][0], this.I[1][1], this.I[1][2], 0],
                [this.I[2][0], this.I[2][1], this.I[2][2], 0],
                [0, 0, 0, 1]
            ),
            I_4_inv = Mat4.inverse(I_4);
        this.I_inv = Mat3.of(
            [I_4_inv[0][0], I_4_inv[0][1], I_4_inv[0][2]],
            [I_4_inv[1][0], I_4_inv[1][1], I_4_inv[1][2]],
            [I_4_inv[2][0], I_4_inv[2][1], I_4_inv[2][2]],
        );
//         console.log(this.I);

    }

    actuate(spike_impulse_vector) {
        for (var i in this.spikes) {
            var subshape = this.spikes[i].shape,
                submass = this.spikes[i].submass,
                d = this.spikes[i].d,
                I_0 = subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)).times(submass/this.m);
            
//             var actuation = 0;
//             if (this.scene.pulsate)
//                 actuation = Math.cos(.4/100*this.scene.globals.graphics_state.animation_time + i*2)*20;
            this.spikes[i].shape.actuate(spike_impulse_vector[i]);

            if (true) {
                this.spike_vector[i] = this.spikes[i].shape.h;
                var I_1 = subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)).times(submass/this.m),
                    dI = I_1.minus(I_0);
                this.I = this.I.plus(dI);
                this.update_subshape(this.spikes[i].shape, this.spikes[i].d, this.spikes[i].q);
            }
            
        }
        var I_4 = Mat4.of(
                [this.I[0][0], this.I[0][1], this.I[0][2], 0],
                [this.I[1][0], this.I[1][1], this.I[1][2], 0],
                [this.I[2][0], this.I[2][1], this.I[2][2], 0],
                [0, 0, 0, 1]
            ),
            I_4_inv = Mat4.inverse(I_4);
        this.I_inv = Mat3.of(
            [I_4_inv[0][0], I_4_inv[0][1], I_4_inv[0][2]],
            [I_4_inv[1][0], I_4_inv[1][1], I_4_inv[1][2]],
            [I_4_inv[2][0], I_4_inv[2][1], I_4_inv[2][2]],
        );
    }
}