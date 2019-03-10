const PI = Math.PI,
      G = 5*9.8,
      PHI = (1 + Math.sqrt(5)) / 2;

const NULL_AGENT = 0,
      CHAOS_AGENT = 1,
      THROB_AGENT = 2,
      RL_AGENT = 3,
      CONSTANT_AGENT = 4;

const TOWER = 0,
      CHAOS = 1,
      PLANETS = 2,
      ADVERSARY = 3;


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
        // console.log(context.globals.gl);
        // var crab_limbs = {};
        // loadCrab(context.globals.gl, crab_limbs);
        // // for ( limb in crab_limbs ){
        // //     console.log(limb);
        // // }

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

            'spikey': new Spikey_Shape(spikey_consts)
        };
        this.submit_shapes(context, shapes);
        this.shape_count = Object.keys(shapes).length;

        this.crab = new Crab(this, context, 2);

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
            circle: "assets/hypnosis.jpg"
        };
        for (let t in shape_textures)
            this.shape_materials[t] = this.texture_base.override({
                texture: context.get_instance(shape_textures[t])
            });

        this.light_shader = context.get_instance(Light_Shader);
        this.camera_shader = context.get_instance(Phong_Shadow_Shader);
//         this.camera_shader = context.get_instance(Camera_Shader);

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
            spikey: context.get_instance(Phong_Shader).material(Color.of(.398, .199, .598, 1), {
                ambient: .2,
                diffusivity: .9,
                specularity: .2,
                smoothness: 20
            }),
            shadow_spikey: context.get_instance(Phong_Shadow_Shader).material(Color.of(.398, .199, .598, 1), {
                ambient: .2,
                diffusivity: .9,
                specularity: .2,
                smoothness: 20
            })
        };

        this.materials = {
            wood: Material.of(.35, .1, .01, context.get_instance(Phong_Shader).material(Color.of(1, .96, .86, 1), {
                ambient: 0,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20
            })),
            shadow_wood: Material.of(.35, .1, .01, this.camera_shader.material(Color.of(1, .96, .86, 1), {
                ambient: 0,
                diffusivity: .4,
                specularity: .5,
                smoothness: 20
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
        }
        
        this.lights = [new Light(Vec.of(0, 100, 0, .1), Color.of(1, 1, .7, 1), 100000),
                       new Light(Vec.of(0, 10, 100, .1), Color.of(1, 1, .7, 1), 1000)];

        this.t = 0;

//         this.gravity_off = true;
//         this.use_octree = false;
        this.debug = false;
//         this.paused = true;

        this.friction_off = false;
        this.pulsate = false;

        this.entities = [];
        this.gcenters = [];
        this.initialize_entities(ADVERSARY);
        this.initialize_gcenters()

//         this.octree = new myOctree(Vec.of(octree_coord,octree_coord,octree_coord), Vec.of(octree_size,octree_size,octree_size),0.01);
//         this.octree.initialize(this.entities);

        this.physics_shader = context.get_instance(Physics_Shader);

//         this.shadowDepthTexture = context.gl.createTexture()

//         this.shadowMat = this.texture_base.override({
//                 texture: this.shadowDepthTexture
//             });


//         context.globals.graphics_state.light_view_matrix = Mat4.look_at(Vec.of(20, 50, 70), Vec.of(0, 0, 0), Vec.of(0, 1, 0));
//         context.globals.graphics_state.light_projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        context.globals.graphics_state.light_view_matrix = Mat4.look_at(this.lights[0].position, Vec.of(0, 0, 0), Vec.of(0, 0, -1))
//         context.globals.graphics_state.light_view_matrix = Mat4.look_at(Vec.of(100, 200, 0), Vec.of(0, 0, 0), Vec.of(0, 0, -1));
//         context.globals.graphics_state.light_projection_transform = Mat4.orthographic(-1000, 1000, -1000, 1000, -900, 500);
        context.globals.graphics_state.light_projection_transform = Mat4.orthographic(-200, 200, -200, 200, -100, 150);

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

//         this.key_triggered_button("Toggle Pulsate", ["x"], () => {
//             this.pulsate = !this.pulsate;
//         });

//         this.key_triggered_button("Toggle Octree", ["c"], () => {
//             this.use_octree = !this.use_octree;
//         });

        this.key_triggered_button("Toggle Debug Mode", ["q"], () => {
            this.debug = !this.debug;
        });
    }


    display(graphics_state, nothing) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;
//         var sx = this.entities[1].x, sz = this.entities[1].z;
//         var camera_location = Vec.of(0, 30, 150).minus(Vec.of(sx, 30, sz)).normalized().times(200).plus(Vec.of(sx, 30, sz));
//         camera_location[1] = 30;
//         this.globals.graphics_state.camera_transform = Mat4.look_at(camera_location, this.entities[1].pos, Vec.of(0,1,0));//Mat4.translation([0, 0, -35]);

                
        // Find how much time has passed in seconds, and use that to place shapes.
        let old_t = this.t;
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;
        let dt = t - old_t;

        if (dt) {

            this.apply_forces();
//             this.apply_gravity();

            if (this.use_octree) {
                this.octree.collide_entities(this.entities, this.collide);
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

    }

    draw_with_shadows(graphics_state) {
        var gl = this.light_shader.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.light_shader.shadowFramebuffer)

        gl.viewport(0, 0, this.light_shader.shadowDepthTextureSize, this.light_shader.shadowDepthTextureSize)
        gl.clearColor(0, 0, 0, 1)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        for (var e of this.entities) {
            e.draw(graphics_state, this.light_shader.material());
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, ...this.canvas_dims);
    }

    draw_with_camera(graphics_state) {
        var transform = Mat4.translation(Vec.of(10*Math.cos(t), 30, 10*Math.sin(t))).times(
            Mat4.rotation(0*PI/2, Vec.of(-1, 0, 0))).times(
                Mat4.scale(Vec.of(10, 10, 10).times(.1)));

        this.shapes.spikey.draw(
            graphics_state, 
            transform,
//             this.plastic);
            this.shader_mats.shadow_spikey);

        this.shapes.square.draw(
            graphics_state,
            Mat4.translation(Vec.of(0, 1, 0)).times(Mat4.scale(Vec.of(100, 100, 100))).times(
                Mat4.rotation(-PI/2, Vec.of(1, 0, 0))),
            this.camera_shader.material(Color.of(.7, 1, .9, 1)));
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

        if (scene_type == TOWER) {
            let num_blocks = 30,
                base_pos = Vec.of(0, 0, 0),
                side_length = 10,
                mass = 10,
                spacing = 5,
                epsilon = .1,
                mat = this.materials.shadow_wood.override({e: .7});

            for (var i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(0, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(Math.random(), 0, Math.random()), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            for (var i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(-side_length - epsilon, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            for (var i in Array.apply(null, Array(num_blocks))) {
                this.entities.push(Ball.of(this, base_pos.plus(Vec.of(side_length + epsilon, side_length/2 + epsilon, 0)).plus(
                    Vec.of(0, (side_length + spacing)*i, 0)), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    mass, side_length/2, mat));//Vec.of(1, 1, 1).times(side_length), mat));
            }
            return;
        }
        
        if (scene_type == ADVERSARY) {
            this.entities.push(new Adversary(this, Vec.of(-45, 20, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 
                50, Vec.of(10, 25, 10), this.materials.crab, this.crab));
            this.entities.push(Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 
                Infinity, Vec.of(3000, 100, 5000), this.materials.shadow_wood));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));

            return;
        }

        if (scene_type == CHAOS) {
          this.entities.push(new Box(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(3000, 100, 5000), this.materials.shadow_wood));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));
          this.entities.push(new Spikey_Object(this, Vec.of(-20, 40, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(1), Quaternion.unit(),
            CHAOS_AGENT));
          return;
        }
        if(scene_type == 'rl_render'){
            this.agent = new Agent(this);
            this.agent.restore();
            this.spikey_starting_pos = Vec.of(0, spikey_consts.sphere_radius + spikey_consts.max_spike_protrusion, 0);
            let floor_material = this.materials.shadow_wood;
            this.Spikey = Spikey_Object.of(this, this.spikey_starting_pos, Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), RL_AGENT);
            this.floor = Box.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(100000, 100, 100000), floor_material);
            this.entities = [this.Spikey, this.floor];
            this.Spikey.brain.load_agent(this.agent, true);
            return;
        }

        if (scene_type == PLANETS) {
//             this.entities.push(Ball.of(this, Vec.of(10, 110, 10), Vec.of(-30, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 50, 20, Material.of(.5, .7, .9, this.shader_mats.soccer)));
            this.entities.push(Planet.of(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(),
                    Infinity, 100, this.materials.wood, 10));
            this.entities.push(new Spikey_Object(this, Vec.of(0, 50, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(0), Quaternion.unit(),
                                             CHAOS_AGENT));
            return;
        }
        return;
        // this.entities.push(new Box(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(300, 100, 500), this.materials.wood));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));
//         this.entities.push(new Box(this, Vec.of(0, 25, -50), Vec.of(0, 0, 10), Vec.of(0.2, 1, 0.1).times(1), 50, Vec.of(10, 10, 10), .05, Material.of(.5, .1, this.plastic)));

        this.entities.push(Ball.of(this, Vec.of(45, 40, 0), Vec.of(-10, 0, 0), Vec.of(0, 10, 0), Quaternion.unit(), 50, 15, Material.of(.5, .7, .9, this.shader_mats.soccer)));
        this.entities.push(Ball.of(this, Vec.of(-45, 5, 0), Vec.of(60, 0, 0), Vec.of(0, 0, 50), Quaternion.unit(), 50, 5, Material.of(.5, .3, .9, this.shader_mats.soccer)));
        this.entities.push(Box.of(this, Vec.of(-45, 10, 0), Vec.of(10, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 100, Vec.of(10, 10, 10), this.materials.rubber));
        this.entities.push(new Box(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), Infinity, Vec.of(300, 100, 500), this.materials.wood));//Material.of(.2, .05, this.shader_mats.floor.override({diffusivity: .7, specularity: .1}))));
        // this.entities.push(new Box(this, Vec.of(0, 25, -50), Vec.of(0, 0, 10), Vec.of(0.2, 1, 0.1).times(1), 50, Vec.of(10, 10, 10), .05, Material.of(.5, .1, this.plastic)));

        // this.entities.push(Ball.of(this, Vec.of(45, 10, 0), Vec.of(-10, 0, 0), Vec.of(0, 0, 10), Quaternion.unit(), 50, 5, Material.of(.5, .7, .9, this.shader_mats.soccer)));
//         this.entities.push(Ball.of(this, Vec.of(-45, 5, 0), Vec.of(10, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 50, 5, Material.of(.5, .7, .9, this.shader_mats.soccer)));
        // this.entities.push(Box.of(this, Vec.of(-45, 20, 0), Vec.of(10, 0, 0), Vec.of(0, 0, 0), Quaternion.unit(), 50, Vec.of(10, 10, 10), Material.of(.5, .7, .9, this.shader_mats.soccer)));


//         this.entities.push(new Cone_Object(this, Vec.of(0, 40, 0), Vec.of(0, 0, 0), Vec.of(0, 30, 1), Quaternion.of(.7, .7, 0, 0).normalized(),
//             20, 10, 30, Material.of(1, .9, .01, this.plastic)));
//         for (var i in [...Array(3).keys()])
//             for (var j in [...Array(3).keys()]) {
//                 this.entities.push(new Cone_Object(this, Vec.of(-30 + 30*i, 40, -30 + 30*j), Vec.of(0, 0, 0), Vec.of(Math.random(), 15, Math.random()), 
//                     20, 10, 30, Material.of(1, .9, .01, this.plastic)));
//                 this.entities[this.entities.length-1].orientation = Quaternion.of(5*PI/4, 5*PI/4, 0, PI/4).normalized();
//             }

//         this.entities.push(new Ball(this, Vec.of(-60, 15, 60), Vec.of(20, 0, -20), Vec.of(0, 0, 0),
//             50, 10, this.materials.rubber.override({shader_mat: this.shader_mats.soccer})));
//         this.entities[1].rotate(Quaternion.of(5*PI/4, 5*PI/4, 0, PI/4).normalized());


        this.entities.push(new Spikey_Object(this, Vec.of(-20, 40, 0), Vec.of(1, 0, 0), Vec.of(-1, 0, 0).times(1), Quaternion.unit(),
                                             NULL_AGENT));
        this.entities.push(new Spikey_Object(this, Vec.of(-20, 40, 0), Vec.of(1, 0, 0), Vec.of(1, 0, 0).times(1), Quaternion.unit(),
                                             CHAOS_AGENT));
        // this.entities.push(new Spikey_Object(this, Vec.of(-50, 30, 0), Vec.of(10, 0, 0), Vec.of(0, 1, 0), Quaternion.unit()));


// //         for (var i = -1; i < 2; ++i) {
//             for (var j = -1; j < 2; ++j) {
//                 this.entities.push(new Box(this, Vec.of(20*i, 10, 20*j), Vec.of(Math.random()*10, 10, Math.random()*10), 
//                     Vec.of(0, 0, 0), 20*Math.random(), Vec.of(Math.random()*10, Math.random()*10, Math.random()*10), 1, this.plastic));
//             }
//         }

        
//         this.entities.push(new Box(this, Vec.of(11, 0, 0), Vec.of(-20, 0, 0), Vec.of(0, 0, 0), 10, Vec.of(10, 10, 10), 1, this.shader_mats.floor));
//         this.entities.push(new Box(this, Vec.of(-11, 0, -3), Vec.of(20, 0, 0), Vec.of(0, 0, 0), 10, Vec.of(10, 10, 10), 1, this.clay));
//         this.entities[1].orientation = Quaternion.of(5*PI/4, 5*PI/4, 0, PI/4).normalized();
//         this.entities[0].orientation = Quaternion.of(.5, 0, 0, 1).normalized();
    }

    initialize_gcenters() {
        for (var e of this.entities) {
            if (e instanceof Planet) {
                this.gcenters.push(e);
            }
        }
    }

    apply_gravity() {
        for (var e of this.entities) {
            for (var p of this.gcenters) {
                if (!this.gravity_off) {
                    e.force(p.com.minus(e.com).normalized().times(p.g*e.m), Vec.of(0, 0, 0));
                }
            }
        }
        
    }

    apply_forces() {
        for (let e in this.entities) {
            let entity = this.entities[e];
            if (!this.gravity_off) {
                entity.force(Vec.of(0, -entity.m*G, 0), Vec.of(0, 0, 0));
            }
        }
    }

    apply_impulses(dt) {
        for (let e in this.entities) {
            let entity = this.entities[e];
            if (!this.gravity_off) {
                entity.impulse(Vec.of(0, -entity.m*G, 0).times(dt), Vec.of(0, 0, 0));
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
            this.entities[e].draw(graphics_state);
        
        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.scale(Vec.of(.001,.001,100)).times(Mat4.identity()),
        //     this.plastic.override({color: Color.of(1,0,1,1)})
        // );    
        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.translation(Vec.of(0,0,0)).times(Mat4.scale(Vec.of(.001,100,.001))).times(Mat4.identity()),
        //     this.plastic.override({color: Color.of(0,1,1,1)})
        // );

        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.translation(Vec.of(0,0,0)).times(Mat4.scale(Vec.of(100,.001,.001))).times(Mat4.identity()),
        //     this.plastic.override({color: Color.of(0,1,0,1)})
        // );
        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.translation(Vec.of(-0.9704800248146057, 1.5378700494766235, -0.004470000043511391)).times(Mat4.scale(Vec.of(100,.001,.001))).times(Mat4.identity()),
        //     this.plastic.override({color: Color.of(0,1,0,1)})
        // );
        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.translation(Vec.of(-0.9704800248146057, 1.5378700494766235, -0.004470000043511391)).times(Mat4.scale(Vec.of(.001,.001,100)).times(Mat4.identity())),
        //     this.plastic.override({color: Color.of(1,0,1,1)})
        // );    
        // this.shapes.box.draw(
        //     graphics_state,
        //     Mat4.translation(Vec.of(-0.9704800248146057, 1.5378700494766235, -0.004470000043511391)).times(Mat4.scale(Vec.of(.001,100,.001))).times(Mat4.identity()),
        //     this.plastic.override({color: Color.of(0,1,1,1)})
        // );
        
//             this.shapes.vector.draw(
//                 graphics_state,
//                     Mat4.y_to_vec(this.entities[e].momentum, this.entities[e].com).times(
//                     Mat4.scale(Vec.of(1, .03, 1))),
//                 this.physics_shader.material(Color.of(1, 0, 0, 1)),
//                 "LINES");

//             this.shapes.vector.draw(
//                 graphics_state,
//                     Mat4.y_to_vec(this.entities[e].L.times(.05), this.entities[e].com).times(
//                     Mat4.scale(Vec.of(1, .03, 1))),
//                 this.physics_shader.material(Color.of(1, 1, 0, 1)),
//                 "LINES");

//             this.shapes.vector.draw(
//                 graphics_state,
//                     Mat4.y_to_vec(this.entities[e].w.times(1000), this.entities[e].com).times(
//                     Mat4.scale(Vec.of(1, .03, 1))),
//                 this.physics_shader.material(Color.of(1, 0, 0, 1)),
//                 "LINES");
        }
    }

    draw_entities_with_shadows(graphics_state) {
        this.draw_with_shadows(graphics_state, this.entities);
    }
}

window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;