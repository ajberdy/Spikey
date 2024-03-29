const PI = Math.PI,
      G = 5*9.8,
      PHI = (1 + Math.sqrt(5)) / 2,
      octree_size=100000000000,
      octree_coord=-50000000;

const NULL_AGENT = 0,
      CHAOS_AGENT = 1,
      THROB_AGENT = 2,
      RL_AGENT = 3,
      CONSTANT_AGENT = 4,
      EVOLUTIONARY_AGENT = 5;

const TOWER = 0,
      CHAOS = 1,
      PLANETS = 2,
      ADVERSARY = 3,
      MAIN = 4,
      REINFORCEMENT = 5;


class Assignment_Two_Skeleton extends Scene_Component {
    // The scene begins by requesting the camera, shapes, and materials it will need.
    constructor(context, control_box) {
        super(context, control_box);

        // First, include a secondary Scene that provides movement controls:
        if(!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

        // Locate the camera here (inverted matrix).
        const r = context.width / context.height;
        this.canvas_dims = [context.width, context.height];
        context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 30, 150), Vec.of(0, 20,0), Vec.of(0,1,0));//Mat4.translation([0, 0, -35]);
//         context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 0, 500), Vec.of(0, 0,0), Vec.of(0,1,0));//Mat4.translation([0, 0, -35]);

        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);
        context.globals.graphics_state.shadows = true;
        context.globals.graphics_state.perlin = true;

        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
        // design.  Once you've told the GPU what the design of a cube is,
        // it would be redundant to tell it again.  You should just re-use
        // the one called "box" more than once in display() to draw
        // multiple cubes.  Don't define more than one blueprint for the
        // same thing here.
        const shapes = {
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
            'revball': new Reverse_Sphere(4),

            'spikey': new Spikey_Shape(spikey_consts)
        };
        this.submit_shapes(context, shapes);
        this.shape_count = Object.keys(shapes).length;
        // Make some Material objects available to you:
        this.clay = context.get_instance(Phong_Shader).material(Color.of(.9, .5, .9, 1), {
            ambient: .4,
            diffusivity: .4
        });
        this.plastic = this.clay.override({
            specularity: .6
        });
        this.texture_base = context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
            ambient: 1,
            diffusivity: 0.4,
            specularity: 0.3
        });

        // Load some textures for the demo shapes
        this.shape_materials = {};
        const shape_textures = {
            square: "assets/butterfly.png",
            box: "assets/even-dice-cubemap.png",
            ball: "assets/soccer_sph_s_resize.png",
            cylinder: "assets/treebark.png",
            pyramid: "assets/tetrahedron-texture2.png",
            simplebox: "assets/tetrahedron-texture2.png",
            cone: "assets/hypnosis.jpg",
            circle: "assets/hypnosis.jpg",

            arm:'adversary/arm.png',
            body:'adversary/body.png',
            foot: 'adversary/foot.png',
            lower_claw: 'adversary/lower_claw.png',
            lower_leg: 'adversary/lower_leg.png',
            mid_leg: 'adversary/mid_leg.png',
            upper_claw: 'adversary/upper_claw.png',
            upper_leg: 'adversary/upper_leg.png',

            spikey: "assets/spikey_texture.jpg"

        };
        for (let t in shape_textures)
            this.shape_materials[t] = this.texture_base.override({
                texture: context.get_instance(shape_textures[t])
            });

        this.light_shader = context.get_instance(Light_Shader);
        this.camera_shader = context.get_instance(Perlin_Shader);

        this.camera_shader.load_light_shader(this.light_shader);

        this.shader_mats = {
            floor: context.get_instance(Phong_Shader).material(Color.of(.75, .75, .75, 1), {
                ambient: .4,
                diffusivity: .4
            }),
            glass: context.get_instance(Phong_Shader).material(Color.of(.78, .88, .89, 0.1), {
                ambient: .4,
                diffusivity: .4
            }),
            soccer: this.texture_base.override({
                texture: context.get_instance(shape_textures.ball)
            }),
            spikey_textured: this.texture_base.override({
                texture: context.get_instance(shape_textures.spikey)
            }),
            spikey: context.get_instance(Phong_Shader).material(Color.of(.398, .199, .598, 1), {
                ambient: .2,
                diffusivity: .9,
                specularity: .2,
                smoothness: 20,
                texture: context.get_instance[shape_textures.spikey]
            }),
            'arm':this.texture_base.override({
                texture: context.get_instance(shape_textures.arm)
            }),
            'body':this.texture_base.override({
                texture: context.get_instance(shape_textures.body)
            }),
            'foot': this.texture_base.override({
                texture: context.get_instance(shape_textures.foot)
            }),
            'lower_claw': this.texture_base.override({
                texture: context.get_instance(shape_textures.lower_claw)
            }),
            'lower_leg': this.texture_base.override({
                texture: context.get_instance(shape_textures.lower_leg)
            }),
            'mid_leg': this.texture_base.override({
                texture: context.get_instance(shape_textures.mid_leg)
            }),
            'upper_claw': this.texture_base.override({
                texture: context.get_instance(shape_textures.upper_claw)
            }),
            'upper_leg': this.texture_base.override({
                texture: context.get_instance(shape_textures.upper_leg)
            }),
            shadow_spikey: context.get_instance(Phong_Shader).material(Color.of(.398, .199, .598, 1), {
                ambient: .2,
                diffusivity: .9,
                specularity: .2,
                smoothness: 20,
                texture: context.get_instance[shape_textures.ball]
            }),
            ocean: this.camera_shader.material(Color.of(0, 1, 1, .55), {
                ambient: .4,
                diffusivity: .4,
                shadows: 0,
                color1: Color.of(.76, .6, .5, .3),
                scale1: 3,
                freq1: 30,
                color2: Color.of(0, 0, 0, .6),
                scale2: 15,
                freq2: 180,
                scaleb: 1.5,
                freq_global: 5
            })
        };

        this.materials = {
            wood: Material.of(.35, .1, .01, context.get_instance(Phong_Shader).material(Color.of(1, .96, .86, .91), {
                ambient: 0,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20
            })),
            sand: Material.of(.55, .4, .01, this.camera_shader.material(Color.of(.91, .89, .86, .2), {
                ambient: 0,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20,
                shadows: true,
                color1: Color.of(.76, .6, .5, .3),
                scale1: 3,
                freq1: 20,
                color2: Color.of(0, 0, 0, .6),
                scale2: 15,
                freq2: 180,
                scaleb: 1.5,
                freq_global: 150
            })),
            slick_wood: Material.of(0, 0.01, .0, context.get_instance(Phong_Shader).material(Color.of(1, .96, .86, 1), {
                ambient: .3,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20
            })),
            rubber: Material.of(.1, .05, .1, context.get_instance(Phong_Shader).material(Color.of(1, .96, .86, 1), {
                ambient: .3,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20
            })),
            crab:  Material.of(.5, .7, .9, context.get_instance(Phong_Shader).material(Color.of(.0429, .398, .137, 1)))
        };
        
        this.lights = [new Light(Vec.of(0, 100, 0, .01), Color.of(1, 1, .7, 1), 100),
                       new Light(Vec.of(0, 10, 100, .1), Color.of(1, 1, .7, 1), 1000)];

        this.t = 0;
        this.use_octree = false;
        this.debug = false;

        this.friction_off = false;
        this.pulsate = false;

        this.entities = [];
        this.scene_type = MAIN;
        this.initialize_entities(null, context);
//         this.octree = new myOctree(Vec.of(octree_coord,octree_coord,octree_coord), Vec.of(octree_size,octree_size,octree_size),0.01);
//         this.octree.initialize(this.entities);

        this.physics_shader = context.get_instance(Physics_Shader);

        this.SpikeyOctree = new myOctree(Vec.of(octree_coord,octree_coord,octree_coord), Vec.of(octree_size,octree_size,octree_size),0.001);

        this.points_collection=[];

        for (var e = 0; e < this.entities.length; ++e) {
            
           this.temp=Vec.of(this.entities[e].pos[0],this.entities[e].pos[1],this.entities[e].pos[2])
           this.SpikeyOctree.add(this.temp);
           this.points_collection.push(Math.pow(this.entities[e].pos[0],2)+Math.pow(this.entities[e].pos[1],2)+Math.pow(this.entities[e].pos[2],2)+this.entities[e].pos[0]*this.entities[e].pos[1]+this.entities[e].pos[0]*this.entities[e].pos[2]+this.entities[e].pos[2]*this.entities[e].pos[1])
        }

        context.globals.graphics_state.light_view_matrix = Mat4.look_at(this.lights[0].position, Vec.of(0, 0, 0), Vec.of(0, 0, -1));
        context.globals.graphics_state.light_projection_transform = Mat4.orthographic(-300, 300, -300, 300, -100, 110);
        context.globals.graphics_state.lights = this.lights;


        this.volume = 30;
        this.audioPlaying = false;
        this.backgroundMusic = document.getElementById('background');
        this.backgroundMusic.onended = (event) => {
            this.backgroundMusic.play();
        }
        this.backgroundTrack = audioContext.createMediaElementSource(this.backgroundMusic);

        this.gainNode = audioContext.createGain();
        this.backgroundTrack.connect(this.gainNode).connect(audioContext.destination);
        this.gainNode.gain.setValueAtTime(this.volume/100, audioContext.currentTime);

        this.collisionNoises = false;
        this.spline_t = 0;
        this.camera_spline = false;
        this.rev_spline = false;
        this.drawSplinePoints = false;

        this.num_phyics_objects = 0;
        this.paused = true;
    }

    pauseAudio(){
        this.backgroundMusic.pause();
        this.audioPlaying = false;
    }
    playAudio(){
        this.backgroundMusic.play();
        this.audioPlaying = true;
    }


    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        this.key_triggered_button("Pause Time", ["n"], () => {
            this.paused = !this.paused;
        });
        
        this.key_triggered_button("Toggle Gravity", ["g"], () => {
            this.gravity_off = !this.gravity_off;
        });

        this.key_triggered_button("Toggle Friction", ["m"], () => {
            this.friction_off = !this.friction_off;
        });
        this.key_triggered_button("Toggle Shadows", ["h"], () => {
            this.globals.graphics_state.shadows = !this.globals.graphics_state.shadows;
        });
        this.new_line();
        this.key_triggered_button("Toggle Perlin", ["c"], () => {
            this.globals.graphics_state.perlin = !this.globals.graphics_state.perlin;
        });

        this.key_triggered_button("End Simulation", ["0"], () => {
            this.end_simulation();
        });

        this.key_triggered_button("Sound", ["k"], () => {
            if (audioContext.state === 'suspended'){
                audioContext.resume();
            }
            else if (!this.audioPlaying){
                this.playAudio();
            }
            else if (this.audioPlaying){
                this.pauseAudio()
            }
        });

        this.key_triggered_button("Toggle Octree", ["l"], () => {
            this.use_octree = !this.use_octree;
        });

        this.key_triggered_button("Toggle Debug Mode", ["q"], () => {
            this.debug = !this.debug;
        });
        this.new_line();
        this.key_triggered_button("Camera Spline (Spikey)", ["x"], () => {
            this.camera_spline = !this.camera_spline;
            this.crab_camera_spline = false;
            this.spline_t = 0;
            this.rev_spline = false;
        });
        this.key_triggered_button("Draw Spline Points", ["i"], () => {
            this.drawSplinePoints = !this.drawSplinePoints;
        });
        this.key_triggered_button("Camera Spline (Crab)", ["y"], () => {
            this.crab_camera_spline = !this.crab_camera_spline;
            this.camera_spline = false;
            this.spline_t = 0;
            this.rev_spline = false;
        });

        this.new_line();
        this.key_triggered_button("Drop Box", ["9"], () => {
            this.initialize_physics("box");
        });
        this.key_triggered_button("Drop Ball", ["8"], () => {
            this.initialize_physics("ball");
        });
//         this.key_triggered_button("Drop Cone", ["7"], () => {
//             this.initialize_physics("cone");
//         });
        this.key_triggered_button("Phyiscs View", ["7"], () => {
            this.physics = !this.physics;
        });
    }


    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;
        let sx = this.Spikey.x,
            sz = this.Spikey.z;
        graphics_state.light_view_matrix = Mat4.look_at(Vec.of(sx, 100, sz), this.Spikey.pos, Vec.of(0, 0, -1));

        let camera_pos = null;
        let old_t = this.t;
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;
        let dt = t - old_t;

        if (this.physics) {
            let intent = Vec.of(0, 0, 1),
                px = 100, py = 30, pz = 100;
            let frontEdge = Vec.of(px, 0, pz).plus(intent.times(190));
            let point1 = frontEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(300));
            let point4 = frontEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(300));
            let backEdge = Vec.of(px, 0, pz).minus(intent.times(310));
            let point2 = backEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(300)) ;
            let point3 = backEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(300));
            camera_pos = (point1.times((1-this.spline_t)**3))
              .plus(point2.times(3 * ((1-this.spline_t)**2) * this.spline_t))
              .plus(point3.times(3 * (1-this.spline_t) * (this.spline_t**2)))
              .plus(point4.times(this.spline_t**3))
              .plus(Vec.of(0, 75, 0));
            if(this.drawSplinePoints){
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point1).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point2).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 0, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point3).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point4).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 1, 1)})
                );
            }
            if(this.rev_spline && dt){
                this.spline_t -= 0.005
            }
            else if (dt){
                this.spline_t += 0.005
            }
            if(this.spline_t > 1 && dt){
                this.rev_spline = true;
            }
            else if(this.spline_t < 0){
                this.rev_spline = false;
            }
            graphics_state.camera_transform = Mat4.look_at(
              camera_pos,
              Vec.of(px, py, pz),
              Vec.of(0, 1, 0));

        }

        else if(this.camera_spline){
            let intent = Vec.of(0, 0, 1);
            let frontEdge = Vec.of(sx, 0, sz).plus(intent.times(90));
            let point1 = frontEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(150));
            let point4 = frontEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(150));
            let backEdge = Vec.of(sx, 0, sz).minus(intent.times(210));
            let point2 = backEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(150)) ;
            let point3 = backEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(150));
            camera_pos = (point1.times((1-this.spline_t)**3))
              .plus(point2.times(3 * ((1-this.spline_t)**2) * this.spline_t))
              .plus(point3.times(3 * (1-this.spline_t) * (this.spline_t**2)))
              .plus(point4.times(this.spline_t**3))
              .plus(Vec.of(0, 75, 0));
            if(this.drawSplinePoints){
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point1).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point2).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 0, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point3).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point4).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 1, 1)})
                );
            }
            if(this.rev_spline && dt){
                this.spline_t -= 0.005
            }
            else if (dt){
                this.spline_t += 0.005
            }
            if(this.spline_t > 1 && dt){
                this.rev_spline = true;
            }
            else if(this.spline_t < 0){
                this.rev_spline = false;
            }
            graphics_state.camera_transform = Mat4.look_at(
              camera_pos,
              this.Spikey.pos,
              Vec.of(0, 1, 0));
        }
        
        else if(this.crab_camera_spline){
            let intent = Vec.of(1, 0, -1);
            let frontEdge = Vec.of(this.crab.pos[0], 0, this.crab.pos[2]).plus(intent.times(90));
            let point1 = frontEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(150));
            let point4 = frontEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(150));
            let backEdge = Vec.of(this.crab.pos[0], 0, this.crab.pos[2]).minus(intent.times(210));
            let point2 = backEdge.plus(intent.cross(Vec.of(0, 1, 0)).times(150)) ;
            let point3 = backEdge.minus(intent.cross(Vec.of(0, 1, 0)).times(150));
            camera_pos = (point1.times((1-this.spline_t)**3))
              .plus(point2.times(3 * ((1-this.spline_t)**2) * this.spline_t))
              .plus(point3.times(3 * (1-this.spline_t) * (this.spline_t**2)))
              .plus(point4.times(this.spline_t**3))
              .plus(Vec.of(0, 75, 0));
            if(this.drawSplinePoints){
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point1).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point2).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 0, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point3).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 0, 1)})
                );
                this.shapes.ball.draw(
                  graphics_state,
                  Mat4.translation(point4).times(Mat4.scale(Vec.of(10, 10, 10))),
                  this.plastic.override({color: Color.of(1, 1, 1, 1)})
                );
            }
            if(this.rev_spline && dt){
                this.spline_t -= 0.005
            }
            else if (dt){
                this.spline_t += 0.005
            }
            if(this.spline_t > 1 && dt){
                this.rev_spline = true;
            }
            else if(this.spline_t < 0){
                this.rev_spline = false;
            }
            graphics_state.camera_transform = Mat4.look_at(
              camera_pos,
              this.crab.pos,
              Vec.of(0, 1, 0));
        }
        else{
            camera_pos = Vec.of(sx, 0, sz).minus(Vec.of(0, 0, 1).times(300)).plus(Vec.of(0, 75, 0))
            graphics_state.camera_transform = Mat4.look_at(
              camera_pos,
              this.Spikey.pos,
              Vec.of(0, 1, 0));
        }
        
                
        if (dt) {

            this.apply_forces();

            if (this.use_octree) {
                for (var x = 0; x < this.entities.length; ++x) {if (x==0){for (var y=1;y<this.entities.length;++y){this.collide(this.entities[0], this.entities[y])}}else{this.temp_collision=this.SpikeyOctree.point_search(Vec.of(this.entities[x].pos[0],this.entities[x].pos[1],this.entities[x].pos[2]),200).points; for (var k = 0; k < this.temp_collision.length; ++k) {
                     this.check=Math.pow(this.temp_collision[k][0],2)+Math.pow(this.temp_collision[k][1],2)+Math.pow(this.temp_collision[k][2],2)+this.temp_collision[k][0]*this.temp_collision[k][1]+this.temp_collision[k][0]*this.temp_collision[k][2]+this.temp_collision[k][2]*this.temp_collision[k][1]; this.index=this.points_collection.indexOf(this.check); if (x!=this.index && this.index>x){this.collide(this.entities[x], this.entities[this.index])}}}}
            }
            else {
                for (var i in this.entities)
                    for (var j = 0; j < i; ++j) {
                        var a = this.entities[i],
                            b = this.entities[j];
                        this.collide(a, b);
                    }
            }
            
            this.update_entities(dt);
        }

        this.draw_with_shadows(graphics_state);
        this.draw_entities(graphics_state);

        this.shapes.revball.draw(
            graphics_state,
            Mat4.translation(camera_pos).times(Mat4.rotation(PI/4, Vec.of(0, 1, 0))).times(Mat4.scale(Vec.of(1, 1, 1).times(800))),
            this.shader_mats.ocean);
    }

    draw_with_shadows(graphics_state) {
        var gl = this.light_shader.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.light_shader.shadowFramebuffer);

        gl.viewport(0, 0, this.light_shader.shadowDepthTextureSize, this.light_shader.shadowDepthTextureSize);
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (var e of this.entities) {
            e.draw(graphics_state, this.light_shader.material());
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ...this.canvas_dims);
    }
        
    dont_display(dt) {

        const g = this.gravity_off ? 0 : G;

        this.apply_forces();
        for (var i in this.entities)
            for (var j = 0; j < i; ++j) {
                var a = this.entities[i],
                    b = this.entities[j];
                this.collide(a, b);
            }
        this.update_entities(dt)

    }


    collide(a, b) {
        Collision_Detection.collide(a, b);
    }
    initialize_entities(scene_type, context) {

        if (this.scene_type == MAIN) {
            this.Spikey = Spikey_Object.of(this, Vec.of(-20, 50, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(1), Quaternion.unit(),
                EVOLUTIONARY_AGENT);
            this.entities.push(this.Spikey);
            this.entities.push(Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                Infinity, Vec.of(3000, 100, 5000), this.materials.sand));

            let num_crabs = 1;
            let crab = new Crab(this, context, this.shader_mats, 5);
            this.crab = new Adversary(this, Vec.of(0, 10, -300), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    50, Vec.of(10, 13, 10), this.materials.crab, crab)
            this.entities.push(this.crab);
        }

        if (scene_type === TOWER) {
            let num_blocks = 30,
                base_pos = Vec.of(0, 0, 0),
                side_length = 10,
                mass = 10,
                spacing = 5,
                epsilon = .1,
                mat = this.materials.shadow_wood.override({e: .7});

            for (let i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(0, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(Math.random(), 0, Math.random()), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            for (let i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(-side_length - epsilon, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            for (let i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(side_length + epsilon, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            return;
        }
        
        if (scene_type === ADVERSARY) {
            this.entities.push(Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 
                Infinity, Vec.of(3000, 100, 5000), this.materials.sand));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));

            this.entities.push(new Adversary(this, Vec.of(0, 10, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                50, Vec.of(10, 25, 10), this.materials.crab, this.crab));
            return;
        }

        if (this.scene_type === CHAOS) {
          this.entities.push(new Box(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(10000, 100, 10000), this.materials.sand));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));
          this.entities.push(new Spikey_Object(this, Vec.of(-20, 40, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(1), Quaternion.unit(),
            CHAOS_AGENT));
          return;
        }
        if(scene_type === REINFORCEMENT){
            //TENSORFLOW CODE
            // this.agent = new Agent(this);
            // this.agent.restore();
            this.spikey_starting_pos = Vec.of(0, spikey_consts.sphere_radius + spikey_consts.max_spike_protrusion, 0);
            let floor_material = this.materials.shadow_wood;
            this.Spikey = Spikey_Object.of(this, this.spikey_starting_pos, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), RL_AGENT);
            this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(100000, 100, 100000), floor_material);
            this.entities = [this.Spikey, this.floor];
            // this.Spikey.brain.load_agent(this.agent, true);
            return;
        }

        if (scene_type === PLANETS) {
//             this.entities.push(Ball.of(this, Vec.of(10, 110, 10), Vec.of(-30, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 50, 20, Material.of(.5, .7, .9, this.shader_mats.soccer)));
            this.entities.push(Planet.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    Infinity, 100, this.materials.wood, 10));
            this.entities.push(new Spikey_Object(this, Vec.of(0, 50, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(0), Quaternion.unit(),
                                             CHAOS_AGENT));
            return;
        }
    }

    initialize_physics(dropping) {
//         this.num_phyics_objects = 0
        if (dropping == "box") {
            this.entities.push(Box.of(this, Vec.of(100, 150, 100), Vec.of(Math.random()-.5, Math.random()-.5, Math.random()-.5).times(30), 
                            Vec.of(Math.random(), Math.random(), Math.random()), Quaternion.unit(),
                            100, Vec.of(1, 1, 1).times(40), this.materials.wood));
            this.num_phyics_objects += 1;
        }
        else if (dropping == "ball") {
            this.entities.push(Ball.of(this, Vec.of(100, 150, 100), Vec.of(Math.random()-.5, Math.random()-.5, Math.random()-.5).times(100), 
                            Vec.of(Math.random(), Math.random(), Math.random()).times(50), Quaternion.unit(),
                            100, 20, this.materials.wood));
            this.num_phyics_objects += 1;
        }
//         else if (dropping == "cone") {
//             this.entities.push(new Cone_Object(this, Vec.of(100, 40, 100), Vec.of(0, 0, 0), Vec.of(0, 60, 1), Quaternion.of(.7, .7, 0, 0).normalized(),
//                     20, 20, 70, Material.of(.5, .1, .01, this.plastic)));
//         }
//         for (var i = 0; i < 1; ++i) {
//             var entity;
//             let num_blocks = 30,
//                 base_pos = Vec.of(100, 0, 100).plus(Vec.of(Math.cos(2*PI/30*i), 0, Math.sin(2*PI/30*i)).times(20)),
//                 side_length = 10,
//                 mass = 10,
//                 spacing = 5,
//                 epsilon = .1,
//                 mat = this.materials.wood.override({e: .1});
//             if (Math.random() < -.3) {
//                     entity = Box.of(this, base_pos.plus(Vec.of(-side_length - epsilon, side_length/2 + epsilon, 0)).plus(
//                         Vec.of(5*Math.random(), (side_length + spacing)*i, 5*Math.random())), Vec.of(Math.random(), Math.random(), Math.random()), 
//                         Vec.of(0, 0, 0), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             }
//             else {
// //                 this.entities.push(new Cone_Object(this, Vec.of(100, 40, 100), Vec.of(0, 0, 0), Vec.of(0, 60, 1), Quaternion.of(.7, .7, 0, 0).normalized(),
// //                     20, 10, 30, Material.of(.5, .1, .01, this.plastic)));

//                 entity = Box.of(this, Vec.of(100, 40, 100), Vec.of(Math.random(), Math.random(), Math.random()).times(10), 
//                         Vec.of(0, .3, 1), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             entity = Box.of(this, Vec.of(100, 50, 100), Vec.of(Math.random(), Math.random(), Math.random()).times(10), 
//                         Vec.of(0, .3, 1), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             entity = Box.of(this, Vec.of(80, 40, 100), Vec.of(Math.random()-.5, 20, Math.random()-.5).times(30), 
//                         Vec.of(0, .3, 1), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             entity = Box.of(this, Vec.of(100, 40, 90), Vec.of(Math.random()-.5, Math.random()-.5, Math.random()-.5).times(30), 
//                         Vec.of(0, .3, 1), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             entity = Box.of(this, Vec.of(110, 40, 20), Vec.of(Math.random()-.5, Math.random()-.5, Math.random()-.5).times(30), 
//                         Vec.of(0, .3, 1), Quaternion.unit(),
//                         mass, Vec.of(1, 1, 1).times(side_length), mat);
//                 this.entities.push(
//                 entity
//             );
//             }
//             this.num_phyics_objects += 1;
//             }
    }

    apply_forces() {
        for (let e in this.entities) {
            let entity = this.entities[e];
            if (!this.gravity_off) {
                if (e < this.entities.length - this.num_phyics_objects)
                    entity.force(Vec.of(0, -entity.m*G, 0), Vec.of(0, 0, 0));
                else
                    entity.force(Vec.of(0, -entity.m*G/3, 0), Vec.of(0, 0, 0));
            }
        }
    }

    update_entities(dt) {
        for (let e in this.entities) {
            this.entities[e].update(dt);
        }
    }

    draw_entities(graphics_state) {
        for (let e in this.entities) {
            this.entities[e].draw(graphics_state);}
    }

    end_simulation() {
        this.shapes.square.draw(
          this.globals.graphics_state,
          Mat4.scale(Vec.of(100000, 100000, 10000)),
          this.shader_mats.floor.override({color: Color.of(0, 0, 0, 1)})
        );
        alert("Simulation complete.");
    }
}

window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;