const spikey_body_mass = 50,
      spikey_spike_mass = 5,
      spikey_mu_s = .1,
      spikey_mu_d = .05,
      num_spikes = 12,
      spikey_mass = spikey_body_mass + num_spikes*spikey_spike_mass,
      sphere_radius = 10,
      min_spike_protrusion = 5,
      max_spike_protrusion = 15,
      spike_base_radius = 3,
      spikey_restitution = .001;

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

        this.spikey_material = spikey_material;

        this.shape = new Spikey_Shape(spikey_consts);

        this.base_points = this.shape.tips;

        this.initialize();
//         this.convex_decomposition = this.convex_decompose();
        this.convex = false;
    }

    static of(...args) {
        return new Spikey_Shape(...args);
    }

    draw(graphics_state) {
        this.scene.shapes.spikey.draw(
            graphics_state,
            this.transform,
            this.shader_mat);


//         for (var tip of this.base_points)
//             this.scene.shapes.ball.draw(
//                 graphics_state,
//                 this.transform.times(Mat4.translation(tip)).times(Mat4.scale(2, 2, 2)),
//                 this.scene.shader_mats.soccer);
    }

    get convex_decomposition() {
        var spikey_body = Ball.of(this.scene, this.pos, this.vel, this.w, this.orientation, spikey_consts.spikey_mass,
                                  spikey_consts.sphere_radius, this.spikey_material);
        var convex_decomposition = [{shape: spikey_body, d: Vec.of(0, 0, 0)}];

        return convex_decomposition;
    }
}