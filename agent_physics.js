const spikey_body_mass = 10,
      spikey_spike_mass = 1,
      spikey_mu_s = .1,
      spikey_mu_d = .05,
      num_spikes = 12,
      spikey_mass = spikey_body_mass + num_spikes*spikey_spike_mass,
      sphere_radius = 10,
      min_spike_protrusion = 5,
      max_spike_protrusion = 15,
      spike_base_radius = 3,
      spikey_restitution = .01;

const spikey_consts = {
            spikey_body_mass: spikey_body_mass,
            spikey_spike_mass: spikey_spike_mass,
            num_spikes: num_spikes,
            spikey_mass: spikey_mass,
            sphere_radius: sphere_radius,
            min_spike_protrusion: min_spike_protrusion,
            max_spike_protrusion: max_spike_protrusion,
            spike_base_radius: spike_base_radius,
            spikey_restitution: spikey_restitution
        };

class Spikey_Object extends Physics_Object {
    constructor(scene, pos, vel, w, q) {
        

        var spikey_material = Material.of(spikey_mu_s, spikey_mu_d, spikey_consts.spikey_restitution, scene.shader_mats.spikey);

        super(scene, pos, vel, w, q, spikey_consts.spikey_mass, spikey_material);

        
        this.sr = spikey_consts.sphere_radius;
        this.spr = spikey_consts.max_spike_protrusion;
        this.I = Mat3.identity().times(2/3*this.m*Math.pow(this.sr + this.spr/5, 2));
        this.I_inv = Mat3.identity().times(1/(2/3*this.m*Math.pow(this.sr + this.spr/5, 2)));

        this.spikey_material = spikey_material;

        this.shape = new Spikey_Shape(spikey_consts);

        this.base_points = this.shape.tips;

        this.spike_vector = Vec.of(1, 1, 1, 1,
                                   1, 1, 1, 1,
                                   1, 1, 1, 1).times(spikey_consts.max_spike_protrusion);

        this._convex_decomposition = this.init_convex_decomposition();

//         console.log(this.I);
//         for (var i in this._convex_decomposition) {
//             var subshape = this._convex_decomposition[i].shape,
//                 d = this._convex_decomposition[i].d,
//                 q = this._convex_decomposition[i].q;

//             this.I = this.I.plus(subshape.I_of(this.com.minus(this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)))).times(-1)));

//         }
//         console.log(this.I);
//         var I_4 = Mat4.of(
//                 [this.I[0][0], this.I[0][1], this.I[0][2], 0],
//                 [this.I[1][0], this.I[1][1], this.I[1][2], 0],
//                 [this.I[2][0], this.I[2][1], this.I[2][2], 0],
//                 [0, 0, 0, 1]
//             ),
//             I_4_inv = Mat4.inverse(I_4);
//         this.I_inv = Mat3.of(
//             [I_4_inv[0][0], I_4_inv[0][1], I_4_inv[0][2]],
//             [I_4_inv[1][0], I_4_inv[1][1], I_4_inv[1][2]],
//             [I_4_inv[2][0], I_4_inv[2][1], I_4_inv[2][2]],
//         );
        this.convex = false;

        this.initialize();

    }

    get spikes() {
        return this._convex_decomposition.slice(1);
    }

    static of(...args) {
        return new Spikey_Shape(...args);
    }

    draw(graphics_state) {
//         this.scene.shapes.spikey.draw(
//             graphics_state,
//             this.transform,
//             this.shader_mat);


//         for (var tip of this.base_points)
//             this.scene.shapes.ball.draw(
//                 graphics_state,
//                 this.transform.times(Mat4.translation(tip)).times(Mat4.scale(2, 2, 2)),
//                 this.scene.shader_mats.soccer);

        
        for (var i in this.convex_decomposition) {
            var subshape = this._convex_decomposition[i].shape;

             subshape.draw(graphics_state);
        }
    }

    init_convex_decomposition() {
        var spikey_body = Ball.of(this.scene, this.pos, this.vel, this.w, this.orientation, spikey_consts.spikey_mass,
                                  spikey_consts.sphere_radius, this.spikey_material);

        var convex_decomposition = [{
            shape: spikey_body, 
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
                theta = Math.atan(x/z) + (z < 0 ? PI : 0);

            var translate_vec = spike.normalized().times(R);

            var spike_rotate_v = Mat4.rotation(phi, Vec.of(-1, 0, 0)),
                spike_rotate_h = Mat4.rotation(theta, Vec.of(0, 1, 0)),
                spike_translate = Mat4.translation(translate_vec),
                spike_scale = Mat4.scale(Vec.of(spikey_consts.spike_base_radius, 
                                                spikey_consts.spike_base_radius, 
                                                spikey_consts.max_spike_protrusion));

            
            var transform = spike_translate.times(
                spike_rotate_h).times(
                spike_rotate_v).times(
                spike_scale);

            var Rm = spike_rotate_h.times(spike_rotate_v);

            var qh = Quaternion.from(Math.cos(theta/2), Vec.of(0, 1, 0).times(Math.sin(theta/2))),
                qv = Quaternion.from(Math.cos(phi/2), Vec.of(-1, 0, 0).times(Math.sin(phi/2))),
                q = qh.times(qv);

            var cone = Spike_Object.of(this.scene, this.pos, this.vel, this.w, this.orientation.times(q).normalized(), 
                            spikey_consts.spikey_mass,  spikey_consts.spike_base_radius, 
                            Vec.of(spikey_consts.min_spike_protrusion, spikey_consts.max_spike_protrusion), 
                            this.spikey_material, translate_vec.times(-1));

            cone.com = this.pos.plus(this.R.times(translate_vec).minus(cone.R.times(cone.d)));

            convex_decomposition.push({
                shape: cone,
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

//         console.log(d.norm(), this.R.times(d).norm());

//         console.log(subshape.d.norm(), subshape.R.times(subshape.d).dot(subshape.d));

        subshape.com = this.pos.plus(this.R.times(d).minus(subshape.R.times(subshape.d)));

        subshape.recalc();

//         if (subshape.d.norm())
//             this.scene.shapes.ball.draw(
//                 this.scene.globals.graphics_state,
//                 Mat4.translation(subshape.com).times(Mat4.scale(2, 2, 2)),
//                 this.scene.shader_mats.floor);

//         if (subshape.d.norm())
//             this.scene.shapes.cone.draw(
//                     this.scene.globals.graphics_state,
//                     subshape.transform,//.times(Mat4.scale(20, 20, 20)),
//                     this.scene.shader_mats.floor);

    }

    update(dt) {
        super.update(dt);
        if (!this.scene.pulsate)
            return;
        var spike_lens = Vec.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1).times(this.spr/2).plus(
                         Vec.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1).times(Math.cos(1/100*this.scene.globals.graphics_state.animation_time)*5));
        this.set_spike_lengths(spike_lens);
    }

    set_spike_lengths(spike_vector) {
        var dspikes = spike_vector.minus(this.spike_vector);
        for (var i in this.spikes) {
            this.spikes[i].shape.move_spike(dspikes[i]);
            this.spike_vector[i] = this.spikes[i].shape.h;
            this.update_subshape(this.spikes[i].shape, this.spikes[i].d, this.spikes[i].q);
        }

    }
}