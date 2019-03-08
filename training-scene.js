class Training_Scene {
    constructor() {
        this.shapes = {
          'square': new Square(),
          'mysquare': new MySquare(Color.of(0, 0, 1, 1)),
          "linesegement": new LineSegment,
          "vector": new Vector,
          'circle': new Circle(15),
          'pyramid': new Tetrahedron(false),
          'simplebox': new SimpleCube(),
          'box': new Cube(),
          'cylinder': new Cylinder(15),
          'cone': new Closed_Cone(20),
          'ball': new Subdivision_Sphere(4),

          'spikey': new Spikey_Shape(spikey_consts)
        };
        this.spikey_starting_pos = Vec.of(0, spikey_consts.sphere_radius + spikey_consts.max_spike_protrusion, 0);
        var floor_material = Material.of(.35, .1, .01);
        this.spikey_starting_pos = 
        this.shader_mats = {spikey: null};
        this.Spikey = Spikey_Object.of(this, this.spikey_starting_pos, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), RL_AGENT);
        this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(100000, 100, 100000), floor_material);
        this.entities = [this.Spikey, this.floor];
    }

    run_simulation(num_steps, dt, actuation, intent, reset) {
        if (reset)
            this.reset_spiky_pos();
        this.give_intent(intent);
        this.give_actuation(actuation);

        var original_pos = this.Spikey.pos;

        for (var i in Array.apply(null, Array(num_steps))) {
            this.step(dt);
        }

        var final_pos = this.Spikey.pos;

        return this.reward(original_pos, final_pos, intent);
    }

    step(dt) {
        this.apply_forces();
        this.collide(this.Spikey, this.floor);
        this.update_entities(dt);
    }

    apply_forces() {
        for (var entity of this.entities) {
            if (!this.gravity_off) {
                entity.force(Vec.of(0, -entity.m*G, 0), Vec.of(0, 0, 0));
            }
        }
    }

    update_entities(dt) {
        for (var entity of this.entities) {
            entity.update(dt);
        }
    }

    collide(a, b) {
        Collision_Detection.collide(a, b);
    }

    give_intent(intent) {
        this.Spikey.intent = intent;
    }

    give_actuation(actuation) {
        this.Spikey.brain.update_actuation(actuation);
    }

    reward(original_pos, final_pos, intent) {
        const regularization = .1;

        const displacement = final_pos.minus(original_pos),
              distance_off = intent.minus(final_pos).norm(),
              directionally_correct_factor = displacement.dot(intent),
              reward = distance_off + directionally_correct_factor * regularization;

        return reward;
    }

    get_random_intent() {
        const scale = 5;
        var random_intent = Vec.of(Math.random(), 0, Math.random()).times(scale);
        this.give_intent(random_intent);
    }

    reset_spiky_pos() {
        // only reset position in xz plane
        this.Spikey.com[0] = this.spikey_starting_pos[0];
        this.Spikey.com[2] = this.spikey_starting_pos[2];
    }
}