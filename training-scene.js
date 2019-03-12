class Training_Scene extends Assignment_Two_Skeleton{
    constructor(context, control_box) {
        super(context, control_box);
        this.spikey_starting_pos = Vec.of(0, spikey_consts.sphere_radius + spikey_consts.max_spike_protrusion, 0);
        var floor_material = Material.of(.35, .1, .01, this.shader_mats.floor);
        // this.shader_mats = {spikey: null};
        this.Spikey = Spikey_Object.of(this, this.spikey_starting_pos, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), RL_AGENT);
        this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(100000, 100, 100000), floor_material);
        this.entities = [this.Spikey, this.floor];
        this.scale = 1;
        this.num_steps_left = 0;
        this.dt = 0.02;
    }

    async run_simulation(num_steps, dt, actuation, intent) {
        this.give_intent(this.global_intent.minus(this.plane_pos));
        this.give_actuation(actuation);



        this.step(dt);
        var original_pos = this.Spikey.pos;


        for(var i=0; i<num_steps;){
            if(this.objects_to_render){
                await null;
            }
            else{
                this.step(dt);
                i++;
            }
        }
      // for(var i=0; i<Math.floor(num_steps/2);){
      //   if(this.objects_to_render){
      //     await null;
      //   }
      //   else{
      //     this.step(dt);
      //     i++;
      //   }
      // }
      // this.give_actuation(actuation.map(x => -x));
      // for(var i=0; i<Math.ceil(num_steps/2);){
      //   if(this.objects_to_render){
      //     await null;
      //   }
      //   else{
      //     this.step(dt);
      //     i++;
      //   }
      // }
        // for (var i in Array.apply(null, Array(Math.floor(num_steps/2)))) {
        //     this.step(dt);
        // }
        // this.give_actuation(actuation.map(x => -x));
        // for (var i in Array.apply(null, Array(Math.ceil(num_steps/2)))) {
        //     this.step(dt);
        // }

        var final_pos = this.Spikey.pos;

        return this.reward(original_pos, final_pos);
    }

    display(graphics_state){
        this.draw_with_shadows(graphics_state);
        this.draw_entities(graphics_state);
        this.objects_to_render = false;

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

    // reward(original_pos, final_pos) {
    //     // console.log(final_pos);
    //     let displacement = Vec.of(final_pos[0], 0, final_pos[2]).minus(Vec.of(0, 0, 0)),
    //         on_intent = displacement.project_onto(this.global_intent),
    //         off_intent = displacement.minus(on_intent).norm();
    //
    //     on_intent = Math.sign(displacement.dot(this.global_intent)) * on_intent.norm();
    //
    //     // console.log(off_intent, on_intent)
    //     let reward = Math.floor(on_intent / 4);
    //     let terminal = off_intent > 15 || (on_intent < -15);
    //
    //     return {
    //         reward,
    //         terminal
    //     }
    // }
    reward(original_pos, final_pos){
      let displacement = Vec.of(final_pos[0], 0, final_pos[2]).minus(Vec.of(0, 0, 0)),
                on_intent = displacement.project_onto(this.global_intent),
                off_intent = displacement.minus(on_intent).norm();
      on_intent = Math.sign(displacement.dot(this.global_intent)) * on_intent.norm();
      return {
        reward: on_intent - 0.5 * off_intent,
        terminal: false
      }
    }

    get_random_intent() {
        var random_intent = Vec.of(Math.random() - 0.5, 0, Math.random() - 0.5).times(this.scale * 2);
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
        this.Spikey.spike_vector = Vec.of(1, 1, 1, 1,
          1, 1, 1, 1,
          1, 1, 1, 1).times(spikey_consts.min_spike_protrusion);
        this.Spikey.intent = this.global_intent;
        this.Spikey.momentum = Vec.of(0, 0, 0);
        this.Spikey.L = Vec.of(0, 0, 0);
        this.Spikey.orientation = Quaternion.unit();
        this.Spikey.recalc();
    }

    update_intent_scale(newScale){
        this.scale = Math.min(newScale, 100);
    }

    get plane_pos(){
        return Vec.of(this.Spikey.pos[0], 0, this.Spikey.pos[2]);
    }
}
window.Training_Scene = window.classes.Training_Scene = Training_Scene;