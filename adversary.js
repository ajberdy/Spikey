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

const default_parameterization = {
    'LA' : {'base': {rad: .5, axis: Vec.of(0,-1,0,0)}, 
            'arm': {rad: 1, axis: Vec.of(0,-1,0,0)},
            'lower_claw': {rad: 1, axis: Vec.of(0,-1,0,0)},
            'upper_claw': {rad: .1, axis: Vec.of(0,-1,0,0)}},

    'L1' : {'base': {rad: 0, axis: Vec.of(0,-1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,-1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,-1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,-1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,-1,0)},},

    'L2' : {'base': {rad: 0, axis: Vec.of(0,-1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,-1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,-1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,-1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,-1,0)},},

    'L3' : {'base': {rad: 0, axis: Vec.of(0,-1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,-1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,-1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,-1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,-1,0)},},

    'L4' : {'base': {rad: 0, axis: Vec.of(0,-1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,-1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,-1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,-1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,-1,0)},},

    'RA' : {'base': {rad: .5, axis: Vec.of(0,1,0,0)}, 
            'arm': {rad: 1, axis: Vec.of(0,1,0,0)},
            'lower_claw': {rad: 1, axis: Vec.of(0,1,0,0)},
            'upper_claw': {rad: .1, axis: Vec.of(0,1,0,0)}},

    'R1' : {'base': {rad: 0, axis: Vec.of(0,1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,1,0)},},

    'R2' : {'base': {rad: 0, axis: Vec.of(0,1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,1,0)},},

    'R3' : {'base': {rad: 0, axis: Vec.of(0,1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,1,0)},},

    'R4' : {'base': {rad: 0, axis: Vec.of(0,1,0,0)}, 
            'foot': {rad: .5, axis: Vec.of(0,0,1,0)},
            'lower_leg': {rad: 1.5, axis: Vec.of(0,0,1,0)},
            'mid_leg': {rad: -.5, axis: Vec.of(0,0,1,0)},
            'upper_leg': {rad: .2, axis: Vec.of(0,0,1,0)},},
};

class Adversary extends Box{
    constructor(scene, pos, vel, w, orientation, mass, dims, material, crab) {
        super(scene, pos, vel, w, orientation, mass, dims.times(crab.scale/2), material);
        this.crab = crab;
        this.tip_positions = {};
        this.t = 1.2;   // used this for fitting motion
        this.param = default_parameterization;
        this.leg_names = ['LA', 'L1', 'L2', 'L3', 'L4', 
                          'RA', 'R1', 'R2', 'R3', 'R4']
        this.init_param();
    }

    get initialized() {
        return this.crab.initialized;
    }

    get_tip_positions(){
        return this.tip_positions;
    }

    update(dt) {
        if (!this.initialized)
            return

        this.t += dt;
        let dparam = this.get_dparam();

//         if (this.tip_positions["L1"])
//             console.log(this.tip_positions["L1"]["foot"][1], this.t);
        for (var leg of this.leg_names) {
            for (var subleg of Object.keys(this.param[leg])) {
                this.param[leg][subleg].rad += dparam[leg][subleg]*dt;
            }
        }

        let vel = Math.sin(this.t - 3*PI/8)*Math.cos(this.t - 3*PI/8) < 0 ? Vec.of(0, 0, 10) : Vec.of(0, 0, 6);
        vel = Vec.of(-1, 0, 5);
        this.w = Vec.of(0, .01, 0);

        this.orientation.normalize();
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(0.5).times(this.orientation);
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
        this.com = this.com.plus(vel.times(dt));
    }
    
    draw(graphics_state, light_shader_mat){
        let param = this.param;
        let rotations = Adversary.rotation_from_params(param);
        this.tip_positions = this.crab.draw(graphics_state, Mat4.translation(this.pos).times(Mat4.quaternion_rotation(this.orientation)),
            rotations, light_shader_mat);
        return;


//         let shader_mat = light_shader_mat ? light_shader_mat : this.shader_mat;

//         let param = default_parameterization;
// //         for (var leg of ['L1', 'L2', 'L3', 'L4'])
// //             Adversary.bend(leg, PI/2, param);
//         let rotations = Adversary.rotation_from_params(param);
//         this.crab.draw(graphics_state, shader_mat, Mat4.translation(this.pos), default_rotations);
    }

    get_dparam() {
        let cos = Math.cos, sin = Math.sin, t = this.t,
            t2 = t + PI/8, t3 = t2 + PI/8, t4 = t3 + PI/8;
        return {
            'LA' : {'base': 0, 
                    'arm': 1/4*cos(t - 1),
                    'lower_claw': 2*1/4*sin(2*t),
                    'upper_claw': 2*.4*cos(2*t)},
            'L1' : {'base': .3*sin(t)*cos(t), 
                    'foot': sin(t)*cos(t) > 0 ? 2*sin(2*t)*cos(2*t) : 0,
                    'lower_leg': sin(t)*cos(t) > 0 ? -1*sin(2*t)*cos(2*t) : 0,
                    'mid_leg': sin(t)*cos(t) > 0 ? sin(2*t - PI)*cos(2*t - PI) : 0,
                    'upper_leg': sin(t)*cos(t) > 0 ? -2*sin(2*t)*cos(2*t) : 0},
            'L2' : {'base': .3*sin(t2)*cos(t2), 
                    'foot': sin(t2)*cos(t2) > 0 ? 2*sin(2*t2)*cos(2*t2) : 0,
                    'lower_leg': sin(t2)*cos(t2) > 0 ? -1*sin(2*t2)*cos(2*t2) : 0,
                    'mid_leg': sin(t2)*cos(t2) > 0 ? sin(2*t2 - PI)*cos(2*t2 - PI) : 0,
                    'upper_leg': sin(t2)*cos(t2) > 0 ? -2*sin(2*t2)*cos(2*t2) : 0},
            'L3' : {'base': .3*sin(t3)*cos(t3), 
                    'foot': sin(t3)*cos(t3) > 0 ? 2*sin(2*t3)*cos(2*t3) : 0,
                    'lower_leg': sin(t3)*cos(t3) > 0 ? -1*sin(2*t3)*cos(2*t3) : 0,
                    'mid_leg': sin(t3)*cos(t3) > 0 ? sin(2*t3 - PI)*cos(2*t3 - PI) : 0,
                    'upper_leg': sin(t3)*cos(t3) > 0 ? -2*sin(2*t3)*cos(2*t3) : 0},
            'L4' : {'base': .3*sin(t4)*cos(t4), 
                    'foot': sin(t4)*cos(t4) > 0 ? 2*sin(2*t)*cos(2*t) : 0,
                    'lower_leg': sin(t4)*cos(t4) > 0 ? -1*sin(2*t4)*cos(2*t4) : 0,
                    'mid_leg': sin(t4)*cos(t4) > 0 ? sin(2*t4 - PI)*cos(2*t4 - PI) : 0,
                    'upper_leg': sin(t4)*cos(t4) > 0 ? -2*sin(2*t4)*cos(2*t4) : 0},
            'RA' : {'base': 0, 
                    'arm': 1/4*cos(t - 1),
                    'lower_claw': 2*1/4*sin(2*t),
                    'upper_claw': 2*.4*cos(2*t)},
            'R1' : {'base': .3*sin(t)*cos(t), 
                    'foot': sin(t)*cos(t) > 0 ? 2*sin(2*t)*cos(2*t) : 0,
                    'lower_leg': sin(t)*cos(t) > 0 ? -1*sin(2*t)*cos(2*t) : 0,
                    'mid_leg': sin(t)*cos(t) > 0 ? sin(2*t - PI)*cos(2*t - PI) : 0,
                    'upper_leg': sin(t)*cos(t) > 0 ? -2*sin(2*t)*cos(2*t) : 0},
            'R2' : {'base': .3*sin(t2)*cos(t2), 
                    'foot': sin(t2)*cos(t2) > 0 ? 2*sin(2*t2)*cos(2*t2) : 0,
                    'lower_leg': sin(t2)*cos(t2) > 0 ? -1*sin(2*t2)*cos(2*t2) : 0,
                    'mid_leg': sin(t2)*cos(t2) > 0 ? sin(2*t2 - PI)*cos(2*t2 - PI) : 0,
                    'upper_leg': sin(t2)*cos(t2) > 0 ? -2*sin(2*t2)*cos(2*t2) : 0},
            'R3' : {'base': .3*sin(t3)*cos(t3), 
                    'foot': sin(t3)*cos(t3) > 0 ? 2*sin(2*t3)*cos(2*t3) : 0,
                    'lower_leg': sin(t3)*cos(t3) > 0 ? -1*sin(2*t3)*cos(2*t3) : 0,
                    'mid_leg': sin(t3)*cos(t3) > 0 ? sin(2*t3 - PI)*cos(2*t3 - PI) : 0,
                    'upper_leg': sin(t3)*cos(t3) > 0 ? -2*sin(2*t3)*cos(2*t3) : 0},
            'R4' : {'base': .3*sin(t4)*cos(t4), 
                    'foot': sin(t4)*cos(t4) > 0 ? 2*sin(2*t)*cos(2*t) : 0,
                    'lower_leg': sin(t4)*cos(t4) > 0 ? -1*sin(2*t4)*cos(2*t4) : 0,
                    'mid_leg': sin(t4)*cos(t4) > 0 ? sin(2*t4 - PI)*cos(2*t4 - PI) : 0,
                    'upper_leg': sin(t4)*cos(t4) > 0 ? -2*sin(2*t4)*cos(2*t4) : 0},
        };

    }

    init_param() {
        let cos = Math.cos, sin = Math.sin, t = this.t;
//             t2 = t - PI/8, t3 = t2 - PI/8, t4 = t3 - PI/8;
        let dparam_0 =  {
            'LA' : {'base': 0, 
                    'arm': 0,
                    'lower_claw': 0,
                    'upper_claw': 0},
            'L1' : {'base': 0, 
                    'foot': 0,
                    'lower_leg': 0,
                    'mid_leg': 0,
                    'upper_leg': -.2},
            'L2' : {'base': 0*-1/2*cos(2*PI/8)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
            'L3' : {'base': -1/2*cos(2*PI/4)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
            'L4' : {'base': -1/2*cos(3*2*PI/8)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
            'RA' : {'base': 0, 
                    'arm': 0,
                    'lower_claw': 0,
                    'upper_claw': 0},
            'R1' : {'base': 0, 
                    'foot': 0,
                    'lower_leg': 0,
                    'mid_leg': 0,
                    'upper_leg': -.2},
            'R2' : {'base': 0*-1/2*cos(2*PI/8)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
            'R3' : {'base': -1/2*cos(2*PI/4)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
            'R4' : {'base': -1/2*cos(3*2*PI/8)**2, 
                    'foot': -1/4*cos(2*PI/8)**2,
                    'lower_leg': 1/8*cos(4*PI/8),
                    'mid_leg': -1/8*cos(4*PI/8),
                    'upper_leg': 1/4*cos(4*PI/8)},
        };
        for (var leg of this.leg_names) {
            for (var subleg of Object.keys(this.param[leg])) {
                this.param[leg][subleg].rad += dparam_0[leg][subleg];
            }
        }
    }

    static rotation_from_params(param) {
        var leg_names = ['LA', 'L1', 'L2', 'L3', 'L4', 
                         'RA', 'R1', 'R2', 'R3', 'R4']
        var rotations_list = leg_names.map(leg =>
            [Mat4.rotation(param[leg].base.rad, param[leg].base.axis),
            leg == 'LA' || leg == 'RA' ?
            {'arm': Mat4.rotation(param[leg].arm.rad, param[leg].arm.axis),
             'lower_claw': Mat4.rotation(param[leg].lower_claw.rad, param[leg].lower_claw.axis),
             'upper_claw': Mat4.rotation(param[leg].upper_claw.rad, param[leg].upper_claw.axis)} :
            {'foot': Mat4.rotation(param[leg].foot.rad, param[leg].foot.axis),
             'lower_leg': Mat4.rotation(param[leg].lower_leg.rad, param[leg].lower_leg.axis),
             'mid_leg': Mat4.rotation(param[leg].mid_leg.rad, param[leg].mid_leg.axis),
             'upper_leg': Mat4.rotation(param[leg].upper_leg.rad, param[leg].upper_leg.axis)}]);

         var rotations_obj = {};
         for (var i in leg_names)
            rotations_obj[leg_names[i]] = rotations_list[i];
        return rotations_obj;
    }

    static bend(leg, radians, param) {
        /* uniform bending (doesn't look as good as default) */
        var num_sublegs = ['LA', 'RA'].includes(leg) ? 4 : 5;

        for (var subleg of Object.keys(param[leg])) {
            if (subleg == 'base')
                continue;
            
            param[leg][subleg].rad = radians / (num_sublegs - 1);
//             console.log(subleg);
        }
//         return param;
    }

    support(d) {
        /* return the point on the crab furthest in the direction of d */
        return super.support(d);

        // TODO: when d.dot(y_axis) < 0, return the lowest leg tip.

//         let candidates = [...Vec.cast(
//             [-15, -12, -10],
//             [-15, -12,   0],
//             [-15, -12,  10],
//             [-15, -12,  20],
           
//             [ 15, -12, -10],
//             [ 15, -12,   0],
//             [ 15, -12,  10],
//             [ 15, -12,  20],

//             [-15, 2, -10],
//             [-15, 2,   0],
//             [-15, 2,  10],
//             [-15, 2,  20],
           
//             [ 15, 2, -10],
//             [ 15, 2,   0],
//             [ 15, 2,  10],
//             [ 15, 2,  20],
//         )]

//          not sure the best way to get the lef tips, ^ is just 
//          filler and not correct

//         var max_v, max_dot = -Infinity;
//         for (var v of candidates) {
//             let p = this.com.plus(v),
//                 dot = p.dot(d);

//             if (dot >= max_dot) {
//                 max_v = v;
//                 max_dot = dot;
//             }
//         }

//         return max_v;
    }
}

class Crab{
    constructor(scene_component, context, shaders, scale = 1){
        this.limbs = {};
        this.scene_component = scene_component;
        this.gl = context.globals.gl;
        this.context = context;
        this.scale = scale;
        this.origin = Vec.of(0,0,0,0);
        this.shaders = shaders;

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
    draw_limb_segment ( graphics_state, socket_center, rotation, limb, right, light_shader_mat = null){
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
                light_shader_mat ? light_shader_mat : this.shaders[limb]
        );
        return rotation.times(ball_vec);
    }
    draw_leg(graphics_state, socket_center, rotations, right, light_shader_mat = null){
        var result_positions = {};
        var limbs = ['upper_leg', 'mid_leg', 'lower_leg', 'foot'];
        for(var i = 0; i < limbs.length; i+=1){
            var ball_vec = this.draw_limb_segment(graphics_state, socket_center, rotations[limbs[i]], limbs[i], right, light_shader_mat);
            socket_center = socket_center.times(Mat4.translation(ball_vec)).times(rotations[limbs[i]]);
            result_positions[limbs[i]] = socket_center.times(Vec.of(0,0,0,1));
        }
        return result_positions;
    }

    draw_arm(graphics_state, socket_center, rotations, right, light_shader_mat = null){
        var result_positions = {};
        var limbs = ['arm', 'lower_claw', 'upper_claw'];
        for(var i = 0; i < limbs.length; i+=1){
            var ball_vec = this.draw_limb_segment(graphics_state, socket_center, rotations[limbs[i]], limbs[i], right, light_shader_mat);
            socket_center = socket_center.times(Mat4.translation(ball_vec)).times(rotations[limbs[i]]);
            result_positions[limbs[i]] = socket_center.times(Vec.of(0,0,0,1));
        }
        return result_positions;
    }

    //rotations has the structure {'L1' : [ <rotation about y>, {'upper_leg' : <rotation_matrix>, 'mid_leg' .. }, ... }]
    //theta in radians
    draw ( graphics_state, origin_translation = Mat4.translation(Vec.of(0,0,0,0)), rotations = default_rotations, light_shader_mat = null){
        if (this.initialized){
            var result_positions = {};
            this.limbs['body'].draw(
                graphics_state,
                origin_translation.times(Mat4.scale(this.scale)),
                light_shader_mat ? light_shader_mat : this.shaders['body']
            );
            for(var i = 0; i < 2; i +=1){
                for(var leg in {'1': 0, '2': 0, '3': 0, '4': 0}){
                    result_positions[(!!i ? 'R' : 'L') + leg] = this.draw_leg(
                        graphics_state, 
                        origin_translation.times(Mat4.translation(this.ball_vectors['body'][(!!i ? 'R' : 'L') + leg])).times(rotations[(!!i ? 'R' : 'L') + leg][0]), 
                        rotations[(!!i ? 'R' : 'L') + leg][1], 
                        !!i, light_shader_mat);
                }              
            }      
            result_positions['LA'] = this.draw_arm(graphics_state, origin_translation.times(Mat4.translation(this.ball_vectors['body']['LA'])).times(rotations['LA'][0]), rotations['LA'][1], false, light_shader_mat);
            result_positions['RA'] = this.draw_arm(graphics_state, origin_translation.times(Mat4.translation(this.ball_vectors['body']['RA'])).times(rotations['RA'][0]), rotations['RA'][1], true, light_shader_mat);
            return result_positions;
        }
        return {};
    }
}

window.BlenderObject = window.classes.BlenderObject = class BlenderObject extends Shape {
    constructor(mesh){
        super("positions", "normals", "texture_coords");
        // super("positions", "normals");


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

function create_vectors( values, vec_length, zeros){
    var vecs = new Array();
    var i = 0;
    while(i < values.length){
        var j = 0;
        var vec = new Array();
        while(j < vec_length){
            vec.push(parseFloat(values[i + j]));
            j += 1;
        }
        if (zeros)
            vec = [0, 0];
        vecs.push(vec);
        i += vec_length;
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
