const default_rotations = {
    'LA' : [ Mat4.rotation(.5, Vec.of(0,-1,0,0)), 
            {'arm': Mat4.rotation(.5, Vec.of(0,-1,0,0)),
            'lower_claw': Mat4.rotation(.6, Vec.of(0,-1,0,0)),
            'upper_claw': Mat4.rotation(.1, Vec.of(0,-1,0,0)),}],
    'L1' : [Mat4.rotation(0, Vec.of(0,-1,0,0)), 
            { 'foot': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),}],
    'L2' : [Mat4.rotation(0, Vec.of(0,-1,0,0)), 
            { 'foot': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),}],
    'L3' : [Mat4.rotation(0, Vec.of(0,-1,0,0)), 
            { 'foot': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),}],
    'L4' : [Mat4.rotation(0, Vec.of(0,-1,0,0)),
            { 'foot': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,-1,0)),}],
    'RA' : [Mat4.rotation(.5, Vec.of(0,1,0,0)), 
            { 'arm': Mat4.rotation(.5, Vec.of(0,1,0,0)),
            'lower_claw': Mat4.rotation(.6, Vec.of(0,1,0,0)),
            'upper_claw': Mat4.rotation(.1, Vec.of(0,1,0,0)),}],
    'R1' : [Mat4.rotation(0, Vec.of(0,1,0,0)), 
        { 'foot': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),}],
    'R2' : [Mat4.rotation(0, Vec.of(0,1,0,0)), 
        { 'foot': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),}],
    'R3' : [Mat4.rotation(0, Vec.of(0,1,0,0)), 
        { 'foot': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),}],
    'R4' : [Mat4.rotation(0, Vec.of(0,1,0,0)), 
        { 'foot': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'lower_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'mid_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),
            'upper_leg': Mat4.rotation(.5, Vec.of(0,0,1,0)),}],
};

class Adversary extends Box{
    constructor(scene, pos, vel, w, orientation, mass, dims, material, crab) {
        super(scene, pos, vel, w, orientation, mass, dims, material);
        this.crab = crab;
    }
    
    draw(graphics_state){
        // console.log(this.base_points);
        this.crab.draw(graphics_state, Mat4.translation(this.pos));
    }
}

class Crab{
    constructor(scene_component, context, scale = 1){
        this.limbs = {};
        this.scene_component = scene_component;
        this.gl = context.globals.gl;
        this.context = context;
        this.scale = scale;
        this.origin = Vec.of(0,0,0,0);

        this.socket_vectors = {
            'arm': Vec.of(2.70374, 0, 0.04129, 0),
            'foot': Vec.of(-0.00041, -0.22094, 0, 0),
            'lower_claw': Vec.of(0.25279, 0, 0, 0),
            'lower_leg': Vec.of(0, -0.17191, 0, 0),
            'mid_leg': Vec.of(0.13854, 1.02684, 0, 0),
            'upper_claw' : Vec.of(0.165815, -0.004404, 0.028092, 0),
            'upper_leg': Vec.of(0, -0.65455, 0.05971, 0)
        };        
        this.ball_vectors = {
            'arm': Vec.of(0,0,0,0),
            'body': {
                'LA' : Vec.of(1.38738, -0.23851, 1.82690, 0),
                'L1' : Vec.of(1.69624, -0.38088, 1.10409, 0),
                'L2' : Vec.of(1.69624, -0.38088, 0.07382, 0),
                'L3' : Vec.of(1.72120, -0.37067, -1.02003, 0),
                'L4' : Vec.of(1.69624, -0.35121, -2.02621, 0),
                'RA' : Vec.of(-1.38738, -0.23851, 1.82690, 0),
                'R1' : Vec.of(-1.69624, -0.38088, 1.10409, 0),
                'R2' : Vec.of(-1.69624, -0.38088, 0.07382, 0),
                'R3' : Vec.of(-1.72120, -0.37067, -1.02003, 0),
                'R4' : Vec.of(-1.69624, -0.35121, -2.02621, 0)
            },
            'lower_claw': Vec.of(-0.40478, -0.00053, -0.23466, 0),
            'lower_leg': Vec.of(-0.97048, 1.36596, -0.00447, 0),
            'mid_leg': Vec.of(0.19319, -1.00599, 0.01598, 0),
            'upper_leg': Vec.of(-0.00218, 1.32563, 0.1507, 0)
        };
        this.tip_vectors = {
            'foot': Vec.of(0.29118, 1.26571, 0, 0),
            'upper_claw' : Vec.of(-0.53301, 0, 0.29231, 0),
            'lower_claw' : Vec.of(-1.28784, -0.00468, -0.14784, 0)
        };
        this.parent_ball_radius = {
            'arm': 0 * this.scale,
            'foot':  0 * this.scale,
            'lower_claw':  0 * this.scale,
            'lower_leg':  0 * this.scale,
            'mid_leg':  0 * this.scale,
            'upper_claw':  0* this.scale, //(0.141946/2) 
            'upper_leg':  0 * this.scale
        }

        //apply scale factor
        if(this.scale != 1){
            var tip;
            var socket;
            var ball;
            for(tip in this.tip_vectors){
                this.tip_vectors[tip].scale(this.scale);
            }
            for(ball in this.ball_vectors){
                if(ball == 'body'){
                    var limb;
                    for(limb in this.ball_vectors[ball]){
                        this.ball_vectors[ball][limb].scale(this.scale);
                    }
                }
                else{
                    this.ball_vectors[ball].scale(this.scale);
                }
            }
            for(socket in this.socket_vectors){
                this.socket_vectors[socket].scale(this.scale);
            }
        }
        this.base_orientation = {
            'arm': Mat4.rotation(Math.PI * (180/180), Vec.of(0,1,0)),
            'body': Mat4.identity(),
            'foot':  Mat4.rotation(Math.PI * (-90/180), Vec.of(0,0,1)),
            'lower_claw': Mat4.rotation(Math.PI * (90/180), Vec.of(0,1,0)),
            'lower_leg': Mat4.rotation(Math.PI * (-90/180), Vec.of(0,0,1)).times(Mat4.rotation(Math.PI * (180/180), Vec.of(0,1,0))),
            'mid_leg':   Mat4.rotation(Math.PI * (90/180), Vec.of(0,0,1)).times(Mat4.rotation(Math.PI * (180/180), Vec.of(0,1,0))),
            'upper_claw': Mat4.identity(), //Mat4.rotation(Math.PI * (-90/180), Vec.of(0,0,1)).times(Mat4.rotation(Math.PI * (90/180), Vec.of(0,1,0))),
            'upper_leg': Mat4.rotation(Math.PI * (-90/180), Vec.of(0,0,1)).times(Mat4.rotation(Math.PI * (90/180), Vec.of(0,1,0)))
        }
        for(var part in this.base_orientation){
            var ball_vec;
            if(part != 'body'){
                if(part == 'foot' || part == 'upper_claw'){
                    ball_vec = Vec.of(...this.base_orientation[part].times(this.tip_vectors[part].minus(this.socket_vectors[part])));
                } else{
                    ball_vec = Vec.of(...this.base_orientation[part].times(this.ball_vectors[part].minus(this.socket_vectors[part])));
                }
                var translation = (part == 'upper_claw') ? Vec.of(this.parent_ball_radius[part] * -1,0,0,0) : (part == 'lower_claw') ? Vec.of(0,0,this.parent_ball_radius[part],0) :  Vec.of(this.parent_ball_radius[part],0,0,0);
                this.base_orientation[part] = Mat4.translation(translation).times(arbitrary_rotation(ball_vec, (part == 'upper_claw' || part == 'lower_claw') ? Vec.of(1,0,0,0) : Vec.of(1,0,0,0)).times(this.base_orientation[part]));

            }
        }
        this.limb_length = {
            'arm': this.ball_vectors['arm'].minus(this.socket_vectors['arm']).norm() * this.scale,
            'upper_leg': this.ball_vectors['upper_leg'].minus(this.socket_vectors['upper_leg']).norm() * this.scale,
            'mid_leg': this.ball_vectors['mid_leg'].minus(this.socket_vectors['mid_leg']).norm() * this.scale,
            'lower_leg': this.ball_vectors['lower_leg'].minus(this.socket_vectors['lower_leg']).norm() * this.scale,
            'foot': this.tip_vectors['foot'].minus(this.socket_vectors['foot']).norm() * this.scale,
            'lower_claw': this.tip_vectors['lower_claw'].minus(this.socket_vectors['lower_claw']).norm() * this.scale,        
        }
        this.tot_leg_length = this.limb_length['upper_leg'] + this.limb_length['mid_leg'] + this.limb_length['lower_leg'] + this.limb_length['foot'];

        this.initialized = false;
        this.loadCrab(this);
    }

    loadCrab(self){
        OBJ.downloadMeshes({
            'arm':'adversary/arm.obj',
            'body':'adversary/body.obj',
            'foot': 'adversary/foot.obj',
            'lower_claw': 'adversary/lower_claw.obj',
            'lower_leg': 'adversary/lower_leg.obj',
            'mid_leg': 'adversary/mid_leg.obj',
            'upper_claw': 'adversary/upper_claw.obj',
            'upper_leg': 'adversary/upper_leg.obj',
          },
          (function(args){
              self.initialize(args, self);
          })
        );
    }

    initialize ( meshes, crab ){
        for ( var mesh in meshes ){
            OBJ.initMeshBuffers(crab.gl, meshes[ mesh ]);
            crab.limbs[ mesh ] = new BlenderObject(meshes[ mesh ]);
        }
        crab.scene_component.submit_shapes(crab.context, crab.limbs);
        crab.initialized = true;
    }

    //target position is vector from origin indicating where ball/tip should be (should be homogenous vector)
    //socket center also contains information about orientation of parent
    draw_limb_segment ( graphics_state, socket_center, rotation, limb, right = false){
        var sock_vector;
        var move_center;
        var ball_vec;
        var position;
        sock_vector = this.socket_vectors[limb].times(-1);
        //sock_vector = right ? Vec.of(sock_vector[0] * -1, sock_vector[1] * -1, sock_vector[2], 0) : sock_vector;
        move_center = Mat4.translation(sock_vector).times(Mat4.scale(Vec.of(this.scale, this.scale, this.scale)));
        if(limb == 'foot' || limb == 'upper_claw'){
            ball_vec = Vec.of(...this.base_orientation[limb].times(this.tip_vectors[limb].minus(this.socket_vectors[limb])));
        } else{
            ball_vec = Vec.of(...this.base_orientation[limb].times(this.ball_vectors[limb].minus(this.socket_vectors[limb])));
        }
        if(limb == 'arm' || limb == 'upper_claw' || limb == 'lower_claw'){
            ball_vec = right ? Vec.of(...Mat4.rotation(Math.PI, Vec.of(0,0,1,0)).times(ball_vec)) : ball_vec;
            position = socket_center.times(rotation).times(Mat4.rotation(right ? Math.PI : 0, Vec.of(0,0,1)).times(this.base_orientation[limb]).times(move_center));
        }else{
            ball_vec = right ? Vec.of(...Mat4.rotation(Math.PI, Vec.of(0,1,0,0)).times(ball_vec)) : ball_vec;
            position = socket_center.times(rotation).times(Mat4.rotation(right ? Math.PI : 0, Vec.of(0,1,0)).times(this.base_orientation[limb]).times(move_center));
        }
    
        this.limbs[limb].draw(
                graphics_state,
                position,
                this.scene_component.plastic.override({color: Color.of(1,1,1,1)})
        );
        return rotation.times(ball_vec);
    }
    draw_leg(graphics_state, socket_center, rotations, right = false){
        for(var limb in {'upper_leg':0, 'mid_leg':1, 'lower_leg':2, 'foot': 3}){
            var ball_vec = this.draw_limb_segment(graphics_state, socket_center, rotations[limb], limb, right);
            socket_center = socket_center.times(Mat4.translation(ball_vec)).times(rotations[limb]);
        }
    }

    draw_arm(graphics_state, socket_center, rotations, right = false){
        for(var limb in {'arm': 0, 'lower_claw' : 0, 'upper_claw' : 0}){
            var ball_vec = this.draw_limb_segment(graphics_state, socket_center, rotations[limb], limb, right);
            socket_center = socket_center.times(Mat4.translation(ball_vec)).times(rotations[limb]);
        }
    }

    //rotations has the structure {'L1' : [ <rotation about y>, {'upper_leg' : <rotation_matrix>, 'mid_leg' .. }, ... }]
    //theta in radians
    draw ( graphics_state, origin_translation = Mat4.translation(Vec.of(0,0,0,0)), rotations = default_rotations){
        if (this.initialized){
            var i;
            this.limbs['body'].draw(
                graphics_state,
                origin_translation.times(Mat4.scale(this.scale)),
                this.scene_component.plastic.override({color: Color.of(1,0,1,1)})
            )
            for(var i = 0; i < 2; i +=1){
                for(var leg in {'1': 0, '2': 0, '3': 0, '4': 0}){
                    this.draw_leg(graphics_state, origin_translation.times(Mat4.translation(this.ball_vectors['body'][(!!i ? 'R' : 'L') + leg])).times(rotations[(!!i ? 'R' : 'L') + leg][0]), rotations[(!!i ? 'R' : 'L') + leg][1], !!i);
                }              
            }      
            this.draw_arm(graphics_state, origin_translation.times(Mat4.translation(this.ball_vectors['body']['LA'])).times(rotations['LA'][0]), rotations['LA'][1]);
            this.draw_arm(graphics_state, origin_translation.times(Mat4.translation(this.ball_vectors['body']['RA'])).times(rotations['RA'][0]), rotations['RA'][1], true);
        }
    }

    force(){}
    update(){}
}

window.BlenderObject = window.classes.BlenderObject = class BlenderObject extends Shape {
    constructor(mesh){
        super("positions", "normals", "texture_coords");

        let positions = create_vectors(mesh.vertices, mesh.vertexBuffer.itemSize);
        let normals = create_vectors(mesh.vertexNormals, mesh.normalBuffer.itemSize);
        let textures = create_vectors(mesh.textures, mesh.textureBuffer.itemSize);
        // create_vectors(mesh.indices, mesh.indexBuffer.itemSize);

        this.positions.push(...Vec.cast(...positions));        
        this.normals.push(...Vec.cast(...normals));
        this.texture_coords.push(...Vec.cast(...textures));
        this.indices.push(...mesh.indices);

    }
}

function create_vectors( values, vec_length){
    var vecs = new Array();
    var i = 0;
    while(i < values.length){
        var j = 0;
        var vec = new Array();
        while(j < vec_length){
            vec.push(parseFloat(values[i + j]));
            j += 1;
        }
        vecs.push(vec);
        i += 3;
    }
    return vecs;
}

function arbitrary_rotation( vec1, vec2){
    vec1.normalize();
    vec2.normalize();
    var rot_axis = vec1.cross(vec2);
    rot_axis.normalize();
    var m1 = Mat.of(
        [ ...vec1],
        [ ...rot_axis, 0],
        [...(rot_axis.cross(vec1)), 0],
        [ 0, 0, 0, 1]
    );
    var m2 = Mat.of(
        [...vec2],
        [...rot_axis, 0],
        [...(rot_axis.cross(vec2)), 0],
        [0,0,0,1]
    );
    return (m2.transposed()).times(m1);
}

// const step_size = 5; //degrees
// const movement_threholds = {
//     'upper_leg': 1.0/4, 
//     'mid_leg': 1.0/8, 
//     'lower_leg': 0
// };
// const child_nodes = {
//     'upper_leg': ['mid_leg', 'lower_leg', 'foot'],
//     'mid_leg': ['lower_leg', 'foot'],
//     'lower_leg': ['foot'],
//     'foot': []
// }
   
    // initialize_leg_positions(){
    //     var temp_position;
    //     for (var leg in {'L1': 0, 'L2': 0, 'L3': 0, 'L4': 0}){
    //         this.leg_positions[leg] = {};
    //         temp_position = this.ball_vectors['body'][leg][0];
    //         for( var seg in {"upper_leg": 0, "mid_leg": 0, "lower_leg": 0 , "foot": 0}){
    //             temp_position += this.limb_length[seg];
    //             this.leg_positions[leg][seg] = Vec.of(temp_position, 0, 0, 0);
    //         }
    //         this.target_positions[leg] = Vec.of(temp_position, 0, 0, 0);
    //         console.log(this.leg_positions[leg]);
    //         console.log(this.target_positions[leg]);
    //     }
    // }

    //limb defines which leg and is used to access the current state of the limb
    // find_limb_position(target_position, limb){
    //     var curr_targets = {
    //         'upper_leg': Vec.of(...this.leg_positions[limb]['upper_leg']),
    //         'mid_leg': Vec.of(...this.leg_positions[limb]['mid_leg']),
    //         'lower_leg': Vec.of(...this.leg_positions[limb]['lower_leg']),
    //         'foot': Vec.of(...this.leg_positions[limb]['foot']),
    //     };
    //     // console.log(this.leg_positions[limb]['foot']);
    //     // console.log(Vec.of(...this.leg_positions[limb]['foot']));
    //     // console.log(this.leg_positions[limb]);
    //     // console.log(curr_targets);
    //     var nodes = ['upper_leg', 'mid_leg', 'lower_leg', 'foot'];
    //     for(var i = 0; i < 4; i += 1){
    //         curr_targets[nodes[i]] = Vec.of(...Mat4.translation(this.ball_vectors['body'][limb].times(-1)).times(curr_targets[nodes[i]]));
    //     }
    //     var projection = Vec.of(curr_targets['upper_leg'][0], curr_targets['upper_leg'][1], 0, 0);
    //     var rot = Vec.of(...curr_targets['upper_leg'].cross(projection),0);
    //     var theta = Math.acos(projection.dot(curr_targets['upper_leg'])/(projection.norm()*curr_targets['upper_leg'].norm()));
    //     for(var i = 0; i < 4; i += 1){
    //         curr_targets[nodes[i]] = Vec.of(...Mat4.rotation(theta, rot).times(curr_targets[nodes[i]]));
    //     }
    //     target_position = Vec.of(...Mat4.rotation(theta, rot).times(target_position));
    //     this.find_orientation(target_position, curr_targets, Vec.of(0,0,0,0));

    //     for(var i = 0; i < 4; i += 1){
    //         curr_targets[nodes[i]] = Vec.of(...Mat4.rotation(theta * -1, rot).times(curr_targets[nodes[i]]));
    //     }
    //     for(var i = 0; i < 4; i += 1){
    //         curr_targets[nodes[i]] = Vec.of(...Mat4.translation(this.ball_vectors['body'][limb]).times(curr_targets[nodes[i]]));
    //     }

    //     this.leg_positions[limb] = curr_targets;
    // }

    //Assumes targ_vector has been transformed to be in x-y plane ( will only rotate about the Z axis)
    // find_orientation(targ_vector, curr_targets, origin){
    //     var targ_length = targ_vector.norm();
    //     if(targ_length > this.tot_leg_length){
    //         return;
    //     }
    //     var orig_targets = {
    //         'upper_leg': curr_targets['upper_leg'].slice(),
    //         'mid_leg': curr_targets['mid_leg'].slice(),
    //         'lower_leg': curr_targets['lower_leg'].slice(),
    //         'foot': curr_targets['foot'].slice(),
    //     };
    //     var curr_leg_vec = curr_targets['foot'].minus(origin);
    //     var curr_length = curr_leg_vec.norm();
    //     var curr_node;
    //     while(true){
    //         if(targ_length - (targ_length*success_region) < curr_length && curr_length < targ_length + (targ_length*success_region)){
    //             var angle_between = acos(curr_leg_vec.dot(targ_vector)/ (targ_length * curr_length));
    //             var nodes = ['upper_leg', 'mid_leg', 'lower_leg', 'foot'];
    //             for(var i = 0; i < 4; i += 1){
    //                 curr_targets[nodes[i]] = Vec.of(...Mat4.rotation(angle_between, Vec.of(0,0,1)).times(curr_targets[nodes[i]]));
    //             }
    //             return;
    //         }
    //         var diff = targ_length - curr_length;
    //         var step = step_size * Math.PI / 180;
    //         if (diff < 0){
    //             step *= -1;
    //         }
    //         diff = Math.abs(diff);
    //         var proportion = diff/targ_length;
    //         curr_node = proportion > movement_threholds['upper_leg'] ? 'upper_leg' : proportion > movement_threholds['mid_leg'] ? 'mid_leg' : 'lower_leg';

    //         this.update_targs(curr_node, curr_targets, step);
    //         curr_leg_vec = curr_targets['foot'].minus(origin);
    //         curr_length = curr_leg_vec.norm();
    //     }
    // }

    // update_targs(leg_seg, curr_targets, step){
    //     for(var i = 0; i < child_nodes[leg_seg].length; i += 1){
    //         curr_targets[child_nodes[leg_seg][i]] = Vec.of(...Mat4.translation(curr_targets[leg_seg]).times(Mat4.rotation(step, Vec.of(0,0,1))).times(Mat4.translation(curr_targets[leg_seg].times(-1))).times(curr_targets[child_nodes[leg_seg][i]]));
    //     }
    // }