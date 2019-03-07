class Training_Scene {
    constructor() {

        var floor_material = Material.of(.35, .1, .01);

        this.Spikey = Spikey_Object(this, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), CONSTANT_AGENT);
        this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(3000, 100, 5000), floor_material);

    }

    run_simulation(num_steps, dt, actuation, intent) {
        this.give_intent(intent);
        this.give_actuation(actuation);

        var original_pos = this.Spikey.pos;

        for (var i in Array.apply(null, Array(num_steps))) {
            step(dt);
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
        var random_intent = Vec.of(Math.random(), Math.random(), Math.random()).times(scale);
        this.give_intent(random_intent);
    }
}