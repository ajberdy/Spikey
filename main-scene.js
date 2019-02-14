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

        this.gravity_off = true;

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
            this.apply_forces();
            this.update_entities(dt);
        }

        this.draw_entities(graphics_state);

    }

    initialize_entities() {
        this.entities.push(new Ball(this, Vec.of(15, 5, 0), Vec.of(-20, 0, 0), Vec.of(0, 0, 0), 10, 5));
        this.entities.push(new Ball(this, Vec.of(-15, 5, 0), Vec.of(20, 0, 0), Vec.of(0, 0, 0), 10, 5, this.clay));
    }

    apply_forces() {
        for (let e in this.entities) {
            for (var i = 0; i < e; ++i){
                var impacts = Collision_Detection.get_impacts(this.entities[e], this.entities[i]);
                
                for (var F in impacts.i_to_e) {
                    this.entities[e].force(impacts.i_to_e.force, impacts.i_to_e.contact);
                }

                for (var F in impacts.e_to_i) {
                    this.entities[e].force(impacts.e_to_i.force, impacts.e_to_i.contact);
                }
            }
            let entity = this.entities[e];
            if (!this.gravity_off) {
                entity.force(Vec.of(0, -G, 0), Vec.of(0, 0, 0));
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

class Physics_Object {
    constructor(scene, pos, vel, w, mass) {
        this.scene = scene;

        this.pos = pos;
        this.momentum;
        this.orientation = Quaternion.of(1, 0, 0, 0);
        this.angular_momentum = w.times(this.I);


        this.vel = vel;
        this.w = w;

        this.b = .0;
        this.m = mass;
        this.I;

        this.F = Vec.of(0, 0, 0);
        this.T = Vec.of(0, 0, 0);
    }

    get x() { return this.pos[0]; }
    get y() { return this.pos[1]; }
    get z() { return this.pos[2]; }

    get spin() {return Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(this.orientation.normalized()).times(0.5); }

    force(F, r) {
        this.F = this.F.plus(F);
        this.T = this.T.plus(r.cross(F));
    }

    update(dt) {
        let a = this.F.times(1/this.m);
        this.vel = this.vel.plus(a.times(dt));
        this.pos = this.pos.plus(this.vel.times(dt));
        this.F = Vec.of(0, 0, 0);

        let a_ = this.T.times(1/this.I);
        this.w = this.w.plus(a_.times(dt));
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
        console.log(this.orientation);
    }
}


class Ball extends Physics_Object {
    constructor(scene, pos, vel, w, mass, radius, material) {
        super(scene, pos, vel, w, mass);
        this.mat = material;
        this.r = radius;
        this.I = 2/5*this.m*Math.pow(this.r, 2);
    }

    draw(graphics_state) {
//         console.log(Mat4.quaternion_rotation(this.orientation));
        this.scene.shapes.ball.draw(
            graphics_state,
            Mat4.translation(Vec.of(this.x, this.y, this.z)).times(
                Mat4.quaternion_rotation(this.orientation.normalized())).times(
                Mat4.scale(Vec.of(this.r, this.r, this.r))),
            this.mat ? this.mat : this.scene.materials.soccer);
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