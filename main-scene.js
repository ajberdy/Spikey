const PI = Math.PI,
      G = 1*9.8;

const check_octree=true

const octree_size=10000

const octree_coord=-50


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
            glass: context.get_instance(Phong_Shader).material(Color.of(.78, .88, .89, 0.1), {
                ambient: .4,
                diffusivity: .4
            }),
            soccer: this.texture_base.override({
                texture: context.get_instance(shape_textures.ball)
            })
        };
        
        this.lights = [new Light(Vec.of(0, 100, 0, .1), Color.of(1, 1, .7, 1), 100000),
                       new Light(Vec.of(0, 10, 100, .1), Color.of(1, 1, .7, 1), 1000)];

        this.t = 0;

//         this.gravity_off = true;

        this.entities = [];
        this.initialize_entities();

        this.physics_shader = context.get_instance(Physics_Shader);
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
                        let old_t = this.t;
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;
        let dt = t - old_t;
//         console.log(dt);

        const g = this.gravity_off ? 0 : G;

        var points_collection=[];

        var SpikeyOctree = new myOctree(Vec.of(octree_coord,octree_coord,octree_coord), Vec.of(octree_size,octree_size,octree_size),0.01);

        for (var e = 0; e < this.entities.length; ++e) {
            
           this.temp=Vec.of(this.entities[e].pos[0],this.entities[e].pos[1],this.entities[e].pos[2])
           SpikeyOctree.add(this.temp);
           points_collection.push(Math.pow(this.entities[e].pos[0],2)+Math.pow(this.entities[e].pos[1],2)+Math.pow(this.entities[e].pos[2],2)+this.entities[e].pos[0]*this.entities[e].pos[1]+this.entities[e].pos[0]*this.entities[e].pos[2]+this.entities[e].pos[2]*this.entities[e].pos[1])
        }


        if (dt) {

            this.apply_forces();

            if (check_octree){
                var n=this.entities.length; 


             for (var x = 1; x < n; ++x) {

                this.temp_collision=SpikeyOctree.point_search(Vec.of(this.entities[x].pos[0],this.entities[x].pos[1],this.entities[x].pos[2]),80,true).points
                 for (var k = 0; k < this.temp_collision.length; ++k) {

                     this.check=Math.pow(this.temp_collision[k][0],2)+Math.pow(this.temp_collision[k][1],2)+Math.pow(this.temp_collision[k][2],2)+this.temp_collision[k][0]*this.temp_collision[k][1]+this.temp_collision[k][0]*this.temp_collision[k][2]+this.temp_collision[k][2]*this.temp_collision[k][1]
                            
                     this.index=points_collection.indexOf(this.check)

                      this.collide(this.entities[x], this.entities[this.index], dt/n)
                                                  
                      this.update_entities(dt/n); 

                 }

             }

            }

            else{
            var n = 1;
            for (var i = 0; i < n; ++i) {
                this.collide(this.entities[0], this.entities[1], dt/n);
                this.update_entities(dt/n);

            }
            }

        }


        this.draw_entities(graphics_state);

    }

    collide(a, b, dt) {
        Collision_Detection.collide(a, b, dt);
    }

    initialize_entities() {
        this.entities.push(new Box(this, Vec.of(0, -50, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0), Infinity, Vec.of(100, 100, 100), 1, .5, .05, this.materials.floor));
        this.entities.push(new Ball(this, Vec.of(-20, 15, 0), Vec.of(5, 0, 0), Vec.of(0, 0, 0), 2, 5, 1,this.plastic));

        for (var i = 0; i < 2; ++i){

            this.entities.push(new Box(this, Vec.of(i+15, 15, 0), Vec.of(0, -5, 0), Vec.of(0.2, 1, 0.1).times(0), 50, Vec.of(10, 10, 10), .5, .5, .1, this.plastic));
            this.entities.push(new Box(this, Vec.of(i+15, 55, 0), Vec.of(0, -5, 0), Vec.of(0.2, 1, 0.1).times(0), 50, Vec.of(10, 10, 10), .5, .5, .1, this.plastic));
                
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

        }
    }
}


window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;