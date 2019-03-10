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
        this.shader_mats = {spikey: null};
        this.Spikey = Spikey_Object.of(this, this.spikey_starting_pos, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), RL_AGENT);
        this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(100000, 100, 100000), floor_material);
        this.entities = [this.Spikey, this.floor];
    }

    run_simulation(num_steps, dt, actuation, intent) {
        this.give_intent(this.global_intent.minus(this.Spikey.pos));
        this.give_actuation(actuation);

        var original_pos = this.Spikey.pos;

        for (var i in Array.apply(null, Array(Math.floor(num_steps/2)))) {
            this.step(dt);
        }
        this.give_actuation(actuation.map(x => -x));
        for (var i in Array.apply(null, Array(Math.ceil(num_steps/2)))) {
            this.step(dt);
        }

        var final_pos = this.Spikey.pos;

        let reward = this.reward();
        return {
            reward: reward,
            terminal: reward ? 1 : 0
        };
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

    reward() {
        if(this.Spikey.pos.minus(this.spikey_starting_pos).norm() > this.global_intent.norm()){
            return 50 + -1 * Vec.of(this.Spikey.pos[0], 0, this.Spikey.pos[2]).minus(this.global_intent).norm();
        }
        return 0;
    }

    get_random_intent() {
        const scale = 50;
        var random_intent = Vec.of(Math.random(), 0, Math.random()).normalized().times(scale);
        this.give_intent(random_intent);
        console.log(random_intent);
        return random_intent;
    }

    reset_spiky_pos(reset_y=false) {
        // only reset position in xz plane
        this.Spikey.com[0] = this.spikey_starting_pos[0];
        this.Spikey.com[2] = this.spikey_starting_pos[2];

        // unless specified
        if (reset_y)
            this.Spikey.com[1] = this.spikey_starting_pos[1];
    }

    start_new_trajectory(){
        this.reset_spiky_pos(true);
        this.global_intent = this.get_random_intent();
        this.Spikey.momentum = Vec.of(0, 0, 0);
        this.Spikey.L = Vec.of(0, 0, 0);
        this.Spikey.recalc();
    }
}