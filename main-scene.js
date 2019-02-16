const PI = Math.PI,
      G = 9.8;



class Assignment_Two_Skeleton extends Scene_Component {
    // The scene begins by requesting the camera, shapes, and materials it will need.
    constructor(context, control_box) {
        super(context, control_box);

        // First, include a secondary Scene that provides movement controls:
        if(!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

        // Locate the camera here (inverted matrix).
        const r = context.width / context.height;
        context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 30, 150), Vec.of(0, 20,0), Vec.of(0,1,0));//Mat4.translation([0, 0, -35]);
//         context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 0, 30), Vec.of(0, 0,0), Vec.of(0,1,0));//Mat4.translation([0, 0, -35]);

        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
        // design.  Once you've told the GPU what the design of a cube is,
        // it would be redundant to tell it again.  You should just re-use
        // the one called "box" more than once in display() to draw
        // multiple cubes.  Don't define more than one blueprint for the
        // same thing here.
        const shapes = {
            'square': new Square(),
            'circle': new Circle(15),
            'pyramid': new Tetrahedron(false),
            'simplebox': new SimpleCube(),
            'box': new Cube(),
            'cylinder': new Cylinder(15),
            'cone': new Cone(20),
            'ball': new Subdivision_Sphere(4)
        }
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
            circle: "assets/hypnosis.jpg"
        };
        for (let t in shape_textures)
            this.shape_materials[t] = this.texture_base.override({
                texture: context.get_instance(shape_textures[t])
            });

        
        this.materials = {
            floor: context.get_instance(Phong_Shader).material(Color.of(.75, .75, .75, 1), {
                ambient: .4,
                diffusivity: .4
            }),
            soccer: this.texture_base.override({
                texture: context.get_instance(shape_textures.ball)
            })
        };
        
        this.lights = [new Light(Vec.of(0, 100, 0, .1), Color.of(1, 1, .7, 1), 100000)];

        this.t = 0;

//         this.gravity_off = true;

        this.entities = [];
        this.initialize_entities();
    }


    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        this.key_triggered_button("Pause Time", ["n"], () => {
            this.paused = !this.paused;
        });
        
        this.key_triggered_button("Toggle Gravity", ["g"], () => {
            this.gravity_off = !this.gravity_off;
        });

    }


    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;
                
        // Find how much time has passed in seconds, and use that to place shapes.
        let old_t = this.t;
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;
        let dt = t - old_t;

        const g = this.gravity_off ? 0 : G;

        // Draw some demo textured shapes
//         let spacing = 6;
//         let m = Mat4.translation(Vec.of(-1 * (spacing / 2) * (this.shape_count - 1), 0, 0));
//         for (let k in this.shapes) {
//             this.shapes[k].draw(
//                 graphics_state,
//                 m.times(Mat4.rotation(t, Vec.of(0, 1, 0))),
//                 this.shape_materials[k] || this.plastic);
//             m = m.times(Mat4.translation(Vec.of(spacing, 0, 0)));
//         }

//         this.shapes.square.draw(
//             graphics_state,
//             Mat4.rotation(PI/2, Vec.of(-1, 0, 0)).times(
//             Mat4.scale(100, 100, 1)),
//             this.materials.floor);

        if (dt) {
            this.do_collisions();
//             if (this.entities[0].momentum[0] != -200)
//                 alert();
//             this.apply_forces();
            this.update_entities(dt);
        }


        this.draw_entities(graphics_state);

    }

    initialize_entities() {
//         this.entities.push(new Ball(this, Vec.of(45, -35, 0), Vec.of(-20, 0, 0), Vec.of(0, 0, 0), 10, 5, 1));
//         this.entities.push(new Ball(this, Vec.of(-45, -35, 0), Vec.of(20, 0, 0), Vec.of(0, 0, 0), 10, 5, 1, this.clay));

        this.entities.push(new Ball(this, Vec.of(45, -5, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Infinity, 5, .1));
        this.entities.push(new Ball(this, Vec.of(-45, -5, 0), Vec.of(40, 0, 0), Vec.of(0, 0, 0), 10, 5, 1, this.clay));

//         this.entities.push(new Box(this, Vec.of(45, 25, 0), Vec.of(-20, 0, 0), Vec.of(0, 0, 0), 10, Vec.of(10, 10, 10), 1, this.materials.floor));
//         this.entities.push(new Ball(this, Vec.of(-45, 27, -3), Vec.of(20, 0, 0), Vec.of(0, 0, 0), 10, 5, 1, this.clay));

//         this.entities.push(new Ball(this, Vec.of(45, 45, 0), Vec.of(-50, 0, 0), Vec.of(0, 0, 0), 20, 5, 1));
//         this.entities.push(new Ball(this, Vec.of(-45, 45, 0), Vec.of(20, 0, 0), Vec.of(0, 0, 0), 10, 5, 1, this.clay));

    }

    apply_forces() {
        for (let e in this.entities) {
            let entity = this.entities[e];
            if (!this.gravity_off) {
                entity.force(Vec.of(0, -G, 0), Vec.of(0, 0, 0));
            }
            entity.force(Vec.of(0, G, 0), Mat4.quaternion_rotation(entity.orientation).times(Vec.of(0, 0, 0)));
        }
    }

    do_collisions() {
        for (var e = 0; e < this.entities.length; ++e) {
            for (var i = 0; i < e; ++i){
                var impacts = Collision_Detection.get_impacts(this.entities[e], this.entities[i]);
                if (impacts.i_to_e.length)
                    console.log(impacts);
                
                for (var J in impacts.i_to_e) {
                    this.entities[e].impulse(impacts.i_to_e[J].impulse, impacts.i_to_e[J].contact);
                    this.entities[e].shift(impacts.i_to_e[J].pos_correction);
                }

                for (var J in impacts.e_to_i) {
                    this.entities[i].impulse(impacts.e_to_i[J].impulse, impacts.e_to_i[J].contact);
                    this.entities[i].shift(impacts.e_to_i[J].pos_correction);
                }
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
        }
    }
}

// class Wall extends Physics_Object {
//     constructor(scene, pos, dims) {
//         super(scene, pos, Vec.of(0, 0, 0), Infinity);
//         this.dims = dims;
//     }

//     draw(graphics_state) {
//         this.scene.shapes.square.draw(
//             graphics_state,
//             Mat4.)
//     }
// }

window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;