class Physics_Object {
    constructor(scene, pos, vel, w, orientation, mass, mat, d=Vec.of(0, 0, 0)) {
        if (mass == Infinity && (vel.norm() != 0 || w.norm() != 0))
            throw new Error("Infinitely massive objects cannot move");
        // scene which the object exists in
        this.scene = scene;

        // constant properties
        this.m = mass;
        this.m_inv = 1 / mass;  // for efficiency
        this.restitution = mat.e;
        this.mu_s = mat.mu_s;
        this.mu_d = mat.mu_d;

        this.I = Mat.of(
            [2/3*mass, 0, 0],
            [0, 2/3*mass, 0],
            [0, 0, 2/3*mass]
        );
        this.I_inv = Mat.of(
            [1/(2/3*mass), 0, 0],
            [0, 1/(2/3*mass), 0],
            [0, 0, 1/(2/3*mass)]
        );   // for efficiency

        // direct properties
        this._d = d;
        this.com = pos.minus(d);
        this.momentum;

        this.orientation = orientation.normalized();
        this.L;

        // first time derivatives
        this.vel = vel;

        this.spin;
        this.w = w;

        this.F = Vec.of(0, 0, 0);
        this.T = Vec.of(0, 0, 0);

        // geometric props
        this.base_points;
        this.base_normals;

        this.shader_mat = mat.shader_mat;

        this.bounding_radius;

        this.convex = true;
        this.shape;


//         // hacky stuff
//         this.resting = false;

        // initialize
//         this.initialize();
    }

    get d() {
        return this._d;
    }

    get pos() {
        return this.com.plus(this.R.times(this.d));
    }

    get transform() { 
        return Mat4.translation(this.com).times(
               Mat4.quaternion_rotation(this.orientation.normalized())).times(
               Mat4.translation(this.d));

        return Mat4.translation(this.pos).times(
               Mat4.quaternion_rotation(this.orientation.normalized()));
    }

    get R() { 
        var R = Mat4.quaternion_rotation(this.orientation.normalized());
        return Mat.of(
            [R[0][0], R[0][1], R[0][2]],
            [R[1][0], R[1][1], R[1][2]],
            [R[2][0], R[2][1], R[2][2]]
        )
     }

     get R_inv() { 
        var R = Mat4.quaternion_rotation(this.orientation.normalized());
        return Mat.of(
            [R[0][0], R[1][0], R[2][0]],
            [R[0][1], R[1][1], R[2][1]],
            [R[0][2], R[1][2], R[2][2]]
        )
     }

    get points() { return this.base_points.map(x => this.transform.times(x.to4(1))); }

    get normals() { return this.base_points.map(x => this.transform.times(x.to4(1))); }

    get x() { return this.pos[0]; }
    get y() { return this.pos[1]; }
    get z() { return this.pos[2]; }

    get concave() { return !this.convex; }

    point_vel(x_r, count_actuation) {
        return this.vel.plus(this.w.cross(x_r))
    }

    get actuation_impulse() {
        return Vec.of(0, 0, 0);
    }

    I_of(d) {
        return this.I.plus(
            Mat3.sym_product(d, d).times(this.m)).minus(
            Mat3.sym_product(d, this.d.times(1)).times(2*this.m));
    }

    initialize() {
        this.momentum = this.vel.norm() ? this.vel.times(this.m) : Vec.of(0, 0, 0);
        this.L = this.w.norm() ? this.R.times(this.I).times(this.R_inv).times(this.w) : Vec.of(0, 0, 0);
    }

    recalc() {
        this.vel = this.momentum.times(this.m_inv);

        this.w = this.R.times(this.I_inv).times(this.R_inv).times(this.L);

        this.orientation.normalize();
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(0.5).times(this.orientation);
    }

    shift(vec) {
        this.com = this.com.plus(vec);
    }

//     rotate(q) {
//         this.orientation = this.orientation.times(q);
//         this.L = this.R.times(this.L);
//         this.d = this.R.times(this.d);
//     }

    force(F, r) {

        if (this.m == Infinity)
            return;

        this.F = this.F.plus(F);

        if (r.norm())
            this.T = this.T.plus(r.cross(F));
    }

    impulse(J, r) {
        if (this.m == Infinity)
            return;

        this.momentum = this.momentum.plus(J);
        this.L = this.L.plus(r.cross(J));
    }

    update(dt) {

        this.momentum = this.momentum.plus(this.F.times(dt));
        this.L = this.L.plus(this.T.times(dt));

        this.recalc();

        this.com = this.com.plus(this.vel.times(dt));
        if(isNaN(this.spin[0])){
            console.log();
        }
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
    
        this.F = Vec.of(0, 0, 0);
        this.T = Vec.of(0, 0, 0);
    }

    support(d) {
        var max_v, max_dot = -Infinity;
        for (var v_base of this.base_points) {
            let v = this.transform.times(v_base.to4(1)).to3(),
                dot = v.dot(d);

            if (dot >= max_dot) {
                max_v = v;
                max_dot = dot;
            }
        }

        return max_v;
    }

    chill() {
        this.momentum = this.L = Vec.of(0, 0, 0);
        this.resting = true;
    }

    unchill() {
        this.resting = false;
    }

    is_chill() {
        return this.resting;
    }
}


class Ball extends Physics_Object {
    constructor(scene, pos, vel, w, orientation, mass, radius, material) {
        super(scene, pos, vel, w, orientation, mass, material);
        this.r = radius;
        this.I = Mat3.identity().times(2/5*this.m*Math.pow(this.r, 2));
        this.I_inv = Mat3.identity().times(1/(2/5*this.m*Math.pow(this.r, 2)));

        this.initialize();

        this.base_points = scene.shapes.ball.positions;
        this.base_normals = scene.shapes.ball.normals;

        this.bounding_radius = this.r;
        this.shape = this.scene.shapes.ball;
    }

    get transform() {
        return Mat4.translation(this.pos).times(
               Mat4.quaternion_rotation(this.orientation.normalized())).times(
               Mat4.scale(Vec.of(this.r, this.r, this.r)));
    }

    static of(...args) {
        return new Ball(...args);
    }

    draw(graphics_state, light_shader_mat) {
        this.scene.shapes.ball.draw(
            graphics_state,
            this.transform,
            light_shader_mat ? light_shader_mat : this.shader_mat);
    }

    support(d) {
        return this.pos.plus(d.normalized().times(this.r));
    }
}


class Box extends Physics_Object {
    constructor(scene, pos, vel, w, orientation, mass, dims, material) {
        super(scene, pos, vel, w, orientation, mass, material);
        this.dims = dims;
        this.I = Mat3.of(
            [dims[1]**2 + dims[2]**2, 0, 0],
            [0, dims[0]**2 + dims[2]**2, 0],
            [0, 0, dims[0]**2 + dims[1]**2]
        ).times(mass/12);
        this.I_inv = Mat3.of(
            [1/(dims[1]**2 + dims[2]**2), 0, 0],
            [0, 1/(dims[0]**2 + dims[2]**2), 0],
            [0, 0, 1/(dims[0]**2 + dims[1]**2)]
        ).times(12/mass);

        this.initialize();

        this.base_points = scene.shapes.box.positions;
        this.base_normals = scene.shapes.box.normals;

        this.bounding_radius = this.dims.norm();
        this.shape = this.scene.shapes.box;
    }

    get transform() {
        return Mat4.translation(this.com).times(
               Mat4.quaternion_rotation(this.orientation)).times(
               Mat4.scale(this.dims.times(1/2)));
    }

    get width() { return this.dims[0]; }
    get height() { return this.dims[1]; }
    get depth() { return this.dims[2]; }

    static of(...args) {
        return new Box(...args);
    }

    draw(graphics_state, light_shader_mat) {
        this.scene.shapes.box.draw(
            graphics_state,
            this.transform,
            light_shader_mat ? light_shader_mat : this.shader_mat);
    }
}


class Cone_Object extends Physics_Object {
    constructor(scene, pos, vel, w, orientation, mass, radius, height, material) {
        super(scene, pos, vel, w, orientation, mass, material, Vec.of(0, 0, -height/3));
        this.r = radius;
        this.h = height;
        this.I = Mat3.of(
            [2*this.h**2 + 3*this.r**2, 0, 0],
            [0, 2*this.h**2 + 3*this.r**2, 0],
            [0, 0, 6*this.r**2]
        ).times(mass/20);
        this.I_inv = Mat3.of(
            [1/(2*this.h**2 + 3*this.r**2), 0, 0],
            [0, 1/(2*this.h**2 + 3*this.r**2), 0],
            [0, 0, 1/(6*this.r**2)]
        ).times(20/mass);
//         this.I = Mat3.of(
//             [1/4*this.h**2 + this.r**2, 0, 0],
//             [0, 1/4*this.h**2 + this.r**2, 0],
//             [0, 0, 2*this.r**2]
//         ).times(3*mass/20);
//         this.I_inv = Mat3.of(
//             [1/(1/4*this.h**2 + this.r**2), 0, 0],
//             [0, 1/(1/4*this.h**2 + this.r**2), 0],
//             [0, 0, 1/(2*this.r**2)]
//         ).times(20/mass/3);
//         this.I = Mat3.of(
//             [this.h**2 + 1/2*this.r**2, 0, 0],
//             [0, this.h**2 + 1/2*this.r**2, 0],
//             [0, 0, this.r**2]
//         ).times(mass/2);
//         this.I = Mat3.of(
//             [1/(this.h**2 + 1/2*this.r**2), 0, 0],
//             [0, 1/(this.h**2 + 1/2*this.r**2), 0],
//             [0, 0, 1/(this.r**2)]
//         ).times(2/mass);

// //         this.I = this.I_of(Vec.of(0, 0, this.h/4));
//         var I_4 = Mat4.of(
//                 [this.I[0][0], this.I[0][1], this.I[0][2], 0],
//                 [this.I[1][0], this.I[1][1], this.I[1][2], 0],
//                 [this.I[2][0], this.I[2][1], this.I[2][2], 0],
//                 [0, 0, 0, 1]
//             ),
//             I_4_inv = Mat4.inverse(I_4);
//         this.I_inv = Mat3.of(
//             [I_4_inv[0][0], I_4_inv[0][1], I_4_inv[0][2]],
//             [I_4_inv[1][0], I_4_inv[1][1], I_4_inv[1][2]],
//             [I_4_inv[2][0], I_4_inv[2][1], I_4_inv[2][2]],
//         );

//         this.I = this.I_of(Vec.of(0, 0, this.h/3));

        this.initialize();

        this.base_points = scene.shapes.cone.positions;
        this.base_normals = scene.shapes.cone.normals;
        this.base_tip = Vec.of(0, 0, 1, 1);
        this.base_com = Vec.of(0, 0, 1/3, 1);
        this.perp_len = this.h*this.r / Vec.of(this.h, this.r).norm();
        this.vert_perp_theta = Math.acos(this.perp_len/this.h);
        this.perp_onto_vert_len = Math.sin(this.vert_perp_theta);

//         console.log(this.I_of(Vec.of(0, 0, this.h/3)));
//         console.log(this.I);

        this.bounding_radius = Math.max(this.r, this.h);
        this.shape = this.scene.shapes.cone;
    }

//     get com() {
//         return this.transform.times(this.base_com).to3();
//     }

    get tip() {
        return this.transform.times(this.base_tip);
    }

    get transform() {
        return Mat4.translation(this.com).times(
               Mat4.quaternion_rotation(this.orientation.normalized())).times(
               Mat4.translation(Vec.of(0, 0, -1).times(this.h/3))).times(
               Mat4.scale(Vec.of(this.r, this.r, this.h)));
    }

    static of(...args) {
        return new Cone_Object(...args);
    }

    draw(graphics_state, light_shader_mat) {
        this.scene.shapes.cone.draw(
            graphics_state,
            this.transform,
            light_shader_mat ? light_shader_mat : this.shader_mat);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.pos),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.soccer);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.com),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.plastic);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.tip),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.soccer);
    }

    support(d) {
        const epsilon = .1

        var origin = Vec.of(0, 0, 0, 1),
            vert_axis = this.transform.times(this.base_tip.minus(origin)).to3().normalized(),
            tip = this.tip.to3(),
            rim_point = this.pos.plus(d.minus(vert_axis.times(vert_axis.dot(d))).normalized().times(this.r));
 
//         this.scene.shapes.ball.draw(
//                 this.scene.globals.graphics_state,
//                 Mat4.translation(rim_point),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.floor);

        if (d.dot(vert_axis) > d.dot(rim_point))
            return tip;
        return rim_point;
    }
}

class Spike_Object extends Physics_Object {
    constructor(scene, pos, vel, w, orientation, mass, radius, height_range, material, d, submass, strength) {
        super(scene, pos, vel, w, orientation, mass, material, Vec.of(0, 0, -height_range[1]/3));
        this.submass = submass;
        this.strength = strength;
        this.r = radius;
        this.min_h = height_range[0];
        this.max_h = height_range[1];
        this.h = this.max_h;
        this._dh = 0;
        this.max_dh = .5;
        this.I = Mat3.of(
            [2*this.h**2 + 3*this.r**2, 0, 0],
            [0, 2*this.h**2 + 3*this.r**2, 0],
            [0, 0, 6*this.r**2]
        ).times(mass/20);
        this.I_inv = Mat3.of(
            [1/(2*this.h**2 + 3*this.r**2), 0, 0],
            [0, 1/(2*this.h**2 + 3*this.r**2), 0],
            [0, 0, 1/(6*this.r**2)]
        ).times(20/mass);

        this.initialize();

        this.base_points = scene.shapes.cone.positions;
        this.base_normals = scene.shapes.cone.normals;
        this.base_tip = Vec.of(0, 0, 1, 1);
        this.base_com = Vec.of(0, 0, 1/3, 1);
        this.perp_len = this.h*this.r / Vec.of(this.h, this.r).norm();
        this.vert_perp_theta = Math.acos(this.perp_len/this.h);
        this.perp_onto_vert_len = Math.sin(this.vert_perp_theta);

        this.bounding_radius = Math.max(this.r, this.h);

        this._actuation_impulse = Vec.of(0, 0, 0);
    }

    static of(...args) {
        return new Spike_Object(...args);
    }

    get d() {
        return Vec.of(0, 0, -this.h/3);
    }

    get tip() {
        return this.transform.times(this.base_tip);
    }

    get h_axis() {
        return this.tip.to3().minus(this.pos);
    }

    get transform() {
        return Mat4.translation(this.com).times(
               Mat4.quaternion_rotation(this.orientation.normalized())).times(
               Mat4.translation(Vec.of(0, 0, -1).times(this.h/3))).times(
               Mat4.scale(Vec.of(this.r, this.r, this.h)));
    }

    get dh() {
        return this._dh;
    }

    set dh(x) {
        if (x == 0)
            console.log();
        if (x > 0)
            this._dh = Math.min(this.max_dh, x);
        else
            this._dh = Math.max(-this.max_dh, x);
    }

    get actuation_impulse() {
        return this._actuation_impulse;
    }

    set actuation_impulse(ja) {
        this.dh = ja * 3 / this.submass * this.strength;         
//         var j = this.submass/3 * this.dh * this.strength;
//         console.log(ja, j);
        this._actuation_impulse = this.h_axis.normalized().times(ja);
    }

    actuate(ja) {
        this.actuation_impulse = ja;
        this.move_spike();
    }

//     update(dt) {
//         super.update(dt);
//         this.move_spike();
// //         this.h = this.h + this.dh;
//     }

    point_vel(x_r, count_actuation) {
        var actuation = count_actuation ? this.dh*0 : 0;
        return super.point_vel(x_r).plus(x_r.project_onto(this.h_axis).times(actuation));
    }

//     get actuation_impulse() {
//         var dh = this.scene.pulsate ? this.dh : 0,
//             strength = 15;
//         console.log(dh);
//         return this.h_axis.normalized().times(this.submass/3 * dh * strength);
// //         return this._actuation_impulse();
//     }

    static of(...args) {
        return new Spike_Object(...args);
    }

    draw(graphics_state, light_shader_mat) {
        this.scene.shapes.cone.draw(
            graphics_state,
            this.transform,
            light_shader_mat ? light_shader_mat : this.shader_mat);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.pos),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.soccer);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.com),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.plastic);

//         this.scene.shapes.ball.draw(
//                 graphics_state,
//                 Mat4.translation(this.tip),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.soccer);
    }

    support(d) {
        const epsilon = .1

        var origin = Vec.of(0, 0, 0, 1),
            vert_axis = this.transform.times(this.base_tip.minus(origin)).to3().normalized(),
            tip = this.tip.to3(),
            rim_point = this.pos.plus(d.minus(vert_axis.times(vert_axis.dot(d))).normalized().times(this.r));
 
//         this.scene.shapes.ball.draw(
//                 this.scene.globals.graphics_state,
//                 Mat4.translation(rim_point),//.times(Mat4.scale(20, 20, 20)),
//                 this.scene.shader_mats.floor);

        if (d.dot(vert_axis) > d.dot(rim_point))
            return tip;
        return rim_point;
    }

    move_spike(dh) {
        if (dh == undefined)
            dh = this.dh;
        var next_h = this.h + dh;
        if (next_h >= this.min_h && next_h <= this.max_h) {
            this.h = next_h;
            this.dh = dh;
            return dh;
        }
        this.dh = 0;
        return false;
            
    }

}


class Collision_Detection {

    static support(args) {
        args.support_a = args.a.support(args.dir);
        args.support_b = args.b.support(args.dir.times(-1));
        args.support = args.support_a.minus(args.support_b);
        return;
    }

    static do_simplex(args){
        var simplex = args.simplex,
            simplex_a = args.simplex_a,
            simplex_b = args.simplex_b,
            dir = args.dir;
        var a = simplex[0], b = simplex[1],
            a_a = simplex_a[0], a_b = simplex_a[1],
            b_a = simplex_b[0], b_b = simplex_b[1],
            ab = b.minus(a), a0 = a.times(-1);

        switch (simplex.length) {
            case 2:
                if (ab.dot(a0) > 0) {
                    args.simplex = [a, b];
                    args.simplex_a = [a_a, a_b];
                    args.simplex_b = [b_a, b_b];
                    args.dir = ab.cross(a0).cross(ab);
                }
                else {
                    args.simplex = [a];
                    args.simplex_a = [a_a];
                    args.simplex_b = [b_a];
                    args.dir = a0;
                }
                break;

            case 3:
                var c = simplex[2],
                    a_c = simplex_a[2],
                    b_c = simplex_b[2],
                    ac = c.minus(a),
                    abc = ab.cross(ac);
                
                if (abc.cross(ac).dot(a0) > 0)
                    if (ac.dot(a0)) {
                        args.simplex = [a, c];
                        args.simplex_a = [a_a, a_c];
                        args.simplex_b = [b_a, b_c];
                        args.dir = ac.cross(a0).cross(ac);
                    }
                    else if (ab.dot(a0) > 0) {
                        args.simplex = [a, b]
                        args.simplex_a = [a_a, a_b]
                        args.simplex_b = [b_a, b_b]
                        args.dir = ab.cross(a0).cross(ab);
                    }
                    else {
                        args.simplex = [a];
                        args.simplex_a = [a_a];
                        args.simplex_b = [b_a];
                        args.dir = a0;
                    }
                else if (ab.cross(abc).dot(a0) > 0)
                    if (ab.dot(a0) > 0) {
                        args.simplex = [a, b];
                        args.simplex_a = [a_a, a_b];
                        args.simplex_b = [b_a, b_b];
                        args.dir = ab.cross(a0).cross(ab);
                    }
                    else {
                        args.simplex = [a];
                        args.simplex_a = [a_a];
                        args.simplex_b = [b_a];
                        args.dir = a0;
                    }
                else if (abc.dot(a0) > 0) {
                    args.simplex = [a, b, c];
                    args.simplex_a = [a_a, a_b, a_c];
                    args.simplex_b = [b_a, b_b, b_c];
                    args.dir = abc;
                }
                else {
                    args.simplex = [a, c, b];
                    args.simplex_a = [a_a, a_c, a_b];
                    args.simplex_b = [b_a, b_c, b_b];
                    args.dir = abc.times(-1);
                }
                break;

            case 4:
                var c = simplex[2], d = simplex[3],
                    a_c = simplex_a[2], a_d = simplex_a[3],
                    b_c = simplex_b[2], b_d = simplex_b[3],
                    ac = c.minus(a),
                    ad = d.minus(a),
                    abc = ab.cross(ac),
                    acd = ac.cross(ad),
                    adb = ad.cross(ab);

                if (abc.dot(a0) > 0) {
                    args.simplex = [a, b, c];
                    args.simplex_a = [a_a, a_b, a_c];
                    args.simplex_b = [b_a, b_b, b_c];
                    return Collision_Detection.do_simplex(args);
                }
                else if (acd.dot(a0) > 0) {
                    args.simplex = [a, c, d];
                    args.simplex_a = [a_a, a_c, a_d];
                    args.simplex_b = [b_a, b_c, b_d];
                    return Collision_Detection.do_simplex(args);
                }
                else if (adb.dot(a0) > 0) {
                    args.simplex = [a, d, b];
                    args.simplex_a = [a_a, a_d, a_b];
                    args.simplex_b = [b_a, b_d, b_b];
                    return Collision_Detection.do_simplex(args);
                }
                else 
                    return true;
                
        }

        return false;
    }

    static GJK(args) {
        /* GJK for shapes */

        var support_args = {
            a: args.a,
            b: args.b,
            dir: Vec.of(1, 0, 0),
            support_a: null,
            support_b: null,
            support: null
        };

        Collision_Detection.support(support_args);
        args.simplex = [support_args.support],
        args.simplex_a = [support_args.support_a],
        args.simplex_b = [support_args.support_b];

        support_args.dir = support_args.support.times(-1);
//         console.log(support_args.support);
        var simplex_args = {
                simplex: args.simplex,
                simplex_a: args.simplex_a, 
                simplex_b: args.simplex_b, 
                dir: support_args.dir
            },
            result;

        while (args.simplex.length < 4) {
//             support_args.dir = support_args.dir;
            Collision_Detection.support(support_args);

            if (support_args.dir.norm() == 0)
                return true;

            if (support_args.support.dot(support_args.dir) < 0)
                return false;

            args.simplex.unshift(support_args.support);
            args.simplex_a.unshift(support_args.support_a);
            args.simplex_b.unshift(support_args.support_b);

            simplex_args.simplex = args.simplex;
            simplex_args.simplex_a = args.simplex_a;
            simplex_args.simplex_b = args.simplex_b;
            simplex_args.dir = support_args.dir;

            result = Collision_Detection.do_simplex(simplex_args);

            args.simplex = simplex_args.simplex;
            args.simplex_a = simplex_args.simplex_a;
            args.simplex_b = simplex_args.simplex_b;
            support_args.dir = simplex_args.dir;
        }

        return result;
    }

    static EPA(args, epsilon=0.01) {
        /* expanding polytope algorithm */
        if (args.simplex.length != 4) {
            switch(args.simplex.length) {
                case 2:
                    var b, c, v = args.simplex[1].minus(args.simplex[0]).normalized();
                    if (Math.abs(v[0]) >= 0.57735)
                        b = Vec.of(v[1], -v[0], 0);
                    else
                        b = Vec.of(0, v[2], -v[1]);

                    b.normalize();

                    for (var rot = 0; rot < 6; ++rot) {
                        var dir = Mat4.rotation(PI/6*rot, v).times(b),
                            support_args = {
                                a: args.a,
                                b: args.b,
                                dir: dir,
                                support_a: null,
                                support_b: null,
                                support: null
                            }

                        Collision_Detection.support(support_args);

                        if (support_args.support.norm() > epsilon) {
                            args.simplex.push(support_args.support);
                            args.simplex_a.push(support_args.support_a);
                            args.simplex_b.push(support_args.support_b);
                            break;   
                        }
                    }
                case 3:
                    var ab = args.simplex[1].minus(args.simplex[0]),
                        ac = args.simplex[2].minus(args.simplex[0]),
                        dir = ab.cross(ac),
                        support_args = {
                                a: args.a,
                                b: args.b,
                                dir: dir,
                                support_a: null,
                                support_b: null,
                                support: null
                            }

                    Collision_Detection.support(support_args)

                    if (support_args.support.norm() > epsilon) {
                        support_args.dir = support_args.dir.times(-1);
                        Collision_Detection.support(support_args);
                    }

                    args.simplex.push(support_args.support);
                    args.simplex_a.push(support_args.support_a);
                    args.simplex_b.push(support_args.support_b);
                    break;
                    
            }   
        }

        var s = args.simplex,
            sa = args.simplex_a,
            sb = args.simplex_b;

        var triangles = [
                    Triangle.of(s[0], s[1], s[2]),
                    Triangle.of(s[0], s[3], s[1]),
                    Triangle.of(s[0], s[2], s[3]),
                    Triangle.of(s[1], s[3], s[2])
                ],
            triangles_a = [
                    Triangle.of(sa[0], sa[1], sa[2]),
                    Triangle.of(sa[0], sa[3], sa[1]),
                    Triangle.of(sa[0], sa[2], sa[3]),
                    Triangle.of(sa[1], sa[3], sa[2])
                ],
            triangles_b = [
                    Triangle.of(sb[0], sb[1], sb[2]),
                    Triangle.of(sb[0], sb[3], sb[1]),
                    Triangle.of(sb[0], sb[2], sb[3]),
                    Triangle.of(sb[1], sb[3], sb[2])
                ];


        var new_dist = -Infinity,
            min_dist = Infinity,
            min_ix = 0,
            support_args = {
                a: args.a,
                b: args.b,
                dir: triangles[min_ix].normal,
                support_a: null,
                support_b: null,
                support: null
            };

//         console.log("starting epa");
        var max_iters = 10000;
        for (var iter = 0; iter < max_iters; ++iter) {
//             if (iter > 15)
//                 console.log();

            min_ix = 0;
            min_dist = Infinity;
//             console.log("iter");
            for (var i in triangles) {
                var dist = triangles[i].normal.dot(triangles[i].a);
                if (dist < min_dist) {
                    min_dist = dist;
                    min_ix = i;
                }
            }

            support_args.dir = triangles[min_ix].normal;

            Collision_Detection.support(support_args);

            new_dist = support_args.support.dot(support_args.dir);
//             console.log(new_dist, min_dist);
            if (new_dist < min_dist + epsilon)
                break;

//             else
//                 console.log(min_dist, new_dist);

            var edges = [],
                edges_a = [],
                edges_b = [];
            for (var i in triangles) {
                var t = triangles[i],
                    ta = triangles_a[i],
                    tb = triangles_b[i];
//                 console.log(t, t.normal.dot(t.a.minus(support_args.support)));
                if (t.normal.dot(support_args.support.minus(t.a)) >= 0) {
                    delete triangles[i];
                    delete triangles_a[i];
                    delete triangles_b[i];
                    var tedges = [[t.a, t.b], [t.b, t.c], [t.c, t.a]],
                        taedges = [[ta.a, ta.b], [ta.b, ta.c], [ta.c, ta.a]],
                        tbedges = [[tb.a, tb.b], [tb.b, tb.c], [tb.c, tb.a]];

                    for (var j in tedges) {
                        var te = tedges[j],
                            dont_add = false;
                        for (var k in edges) {
                            var e = edges[k];

                            if (e[0].equals(te[1]) && e[1].equals(te[0])) {
                                dont_add = true;
                                delete edges[k];
                                delete edges_a[k];
                                delete edges_b[k];
                            }
                        }
                        if (!dont_add) {
                            edges.push(te);
                            edges_a.push(taedges[j]);
                            edges_b.push(tbedges[j]);
                        }
                    }
                    edges = edges.filter(x => x != undefined);
                    edges_a = edges_a.filter(x => x != undefined);
                    edges_b = edges_b.filter(x => x != undefined);
                }
            }

            triangles = triangles.filter(x => x != undefined);
            triangles_a = triangles_a.filter(x => x != undefined);
            triangles_b = triangles_b.filter(x => x != undefined);

            for (var i in edges) {
                var e = edges[i],
                    ea = edges_a[i],
                    eb = edges_b[i],
                    a = e[0], b = e[1],
                    aa = ea[0], ab = ea[1],
                    ba = eb[0], bb = eb[1];
                if (support_args.support.equals(a) || support_args.support.equals(b))
                    console.log();
                triangles.push(Triangle.of(a, b, support_args.support));
                triangles_a.push(Triangle.of(aa, ab, support_args.support_a));
                triangles_b.push(Triangle.of(ba, bb, support_args.support_b));
            }
        }
        if (iter > 10)
            console.log(iter);


//         if (triangles[min_ix].normal[1] < 0)
//             console.log(triangles[min_ix].normal);

        var t = triangles[min_ix],
            ta = triangles_a[min_ix],
            tb = triangles_b[min_ix],
            normal = t.normal,
            penetration = min_dist;

        var p = normal.times(-min_dist),
                tA = t.b.minus(t.a).cross(t.c.minus(t.a)).norm(),
                barry_coords = Vec.of(
                        t.b.minus(p).cross(t.c.minus(p)).norm()/tA,
                        t.a.minus(p).cross(t.c.minus(p)).norm()/tA,
                        t.a.minus(p).cross(t.b.minus(p)).norm()/tA,
                    ),
                contact_a = ta.a.times(barry_coords[0]).plus(ta.b.times(barry_coords[1])).plus(ta.c.times(barry_coords[2])),
                contact_b = tb.a.times(barry_coords[0]).plus(tb.b.times(barry_coords[1])).plus(tb.c.times(barry_coords[2]));

        var manifold = {
                normal: normal,
                penetration_depth: penetration,
                contact_a: contact_a,
                contact_b: contact_b
            };
        
//         console.log(Math.sign(normal.dot(Vec.of(0, 1, 0))));

        if (isNaN(manifold.contact_b[0]))
            return null;

        return manifold;  
    }

    static collide(a, b) {

        if (b.concave) {
            b = [a, a = b][0];
        }

        if (a.concave) {
            if (b.concave)
                alert("concave - concave collisions not implemented yet");
            var convex_decomposition_a = a.convex_decomposition;

            for (var i in convex_decomposition_a) {
                var a_i = convex_decomposition_a[i].shape,
                    d_i = convex_decomposition_a[i].d;

                var collision_info = Collision_Detection.get_collision_info(a_i, b);

                if (!collision_info) {
                    if (a instanceof Spikey_Object && i != 0)
                        a.update_state(i - 1, a_i.h, Vec.of(0, 0, 0));
                    continue;
                }

                var impulse_a = collision_info.impulse_a.plus(
                                collision_info.friction_impulse_a).plus(
                                collision_info.actuation_impulse_a),
                    impulse_b = collision_info.impulse_b.plus(
                                collision_info.friction_impulse_b).plus(
                                collision_info.actuation_impulse_b);

                a.impulse(impulse_a, collision_info.a_r);
                b.impulse(impulse_b, collision_info.b_r);

                a.shift(collision_info.correction_a);
                b.shift(collision_info.correction_b);

                if (a instanceof Spikey_Object && i != 0) {
                    a.update_state(i - 1, a_i.h, impulse_a);    // i - 1 because body
                }

            }

            return;
        }

        var collision_info = Collision_Detection.get_collision_info(a, b);

        if (!collision_info)
            return;

        a.impulse(collision_info.impulse_a, collision_info.a_r);
        b.impulse(collision_info.impulse_b, collision_info.b_r);

        a.shift(collision_info.correction_a);
        b.shift(collision_info.correction_b);

        a.impulse(collision_info.friction_impulse_a, collision_info.a_r);
        b.impulse(collision_info.friction_impulse_b, collision_info.b_r);

        a.impulse(collision_info.actuation_impulse_a, collision_info.a_r);
        b.impulse(collision_info.actuation_impulse_b, collision_info.b_r);

        return;

    }
    
    static get_collision_info(a, b) {
        /* convex shapes only */
        const epsilon = 1;
        if (a.pos.minus(b.pos).norm() > a.bounding_radius + b.bounding_radius + epsilon)
            return null;

        if (a instanceof Ball && b instanceof Ball) {
            return Collision_Detection.ball_collision_info(a, b);
        }

        var GJK_args = {a: a, b: b, simplex: null, simplex_a: null, simplex_b: null};
        if (Collision_Detection.GJK(GJK_args)) {

            var manifold = Collision_Detection.EPA(GJK_args, .0001);

            var a_contact = manifold.contact_a,
                b_contact = manifold.contact_b;

            var a_r = a_contact.minus(a.com),
                b_r = b_contact.minus(b.com);


            var rest = Math.min(a.restitution, b.restitution),
                normal = manifold.normal;

            var actuation_impulse_a = a.actuation_impulse,
                actuation_impulse_b = b.actuation_impulse;
            
            var ja = actuation_impulse_a.minus(actuation_impulse_b);
            actuation_impulse_a = ja.times(-1);
            actuation_impulse_b = ja;

            if (a.scene.debug)
                a.scene.shapes.vector.draw(
                        a.scene.globals.graphics_state,
                        Mat4.y_to_vec(actuation_impulse_a.times(1000), a.com.plus(a_r)),
                        a.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
                        "LINES");

            var rel_vel = a.point_vel(a_r).minus(b.point_vel(b_r)),
                vel_along_normal = rel_vel.dot(normal);
            
            var actuated_rel_vel = a.point_vel(a_r, true).minus(b.point_vel(b_r, true)),
                actuated_vel_along_normal = actuated_rel_vel.dot(normal);

            const percent = .8;
            var penetration_depth = manifold.penetration_depth,
                slop = .01,
                correction = normal.times(Math.max(penetration_depth - slop, 0) / (a.m_inv + b.m_inv) * percent);

            var correction_a = correction.times(-a.m_inv),
                correction_b = correction.times(b.m_inv);

            if (vel_along_normal < 0)
                return {
                    impulse_a: Vec.of(0, 0, 0),
                    impulse_b: Vec.of(0, 0, 0),
                    a_r: a_r,
                    b_r: b_r,
                    friction_impulse_a: Vec.of(0, 0, 0),
                    friction_impulse_b: Vec.of(0, 0, 0),
                    correction_a: correction_a,
                    correction_b: correction_b,
                    actuation_impulse_a: actuation_impulse_a,
                    actuation_impulse_b: actuation_impulse_b
                };
            if (vel_along_normal < 20)
                rest = 0;

            var j = vel_along_normal*(-(1 + rest));
                j /= a.m_inv + b.m_inv + 
                     a.R.times(a.I_inv).times(a.R_inv).times(a_r.cross(normal)).cross(a_r).dot(normal) + 
                     b.R.times(b.I_inv).times(b.R_inv).times(b_r.cross(normal)).cross(b_r).dot(normal);
                
            var impulse_a = normal.times(j),
                impulse_b = normal.times(-j);

            if (a.scene.debug)
                a.scene.shapes.vector.draw(
                    a.scene.globals.graphics_state,
                    Mat4.y_to_vec(impulse_a.times(1000), a.com.plus(a_r)),
                    a.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
                    "LINES");

            if (a.scene.friction_off)
                return {
                    impulse_a: impulse_a,
                    impulse_b: impulse_b,
                    a_r: a_r,
                    b_r: b_r,
                    friction_impulse_a: Vec.of(0, 0, 0),
                    friction_impulse_b: Vec.of(0, 0, 0),
                    correction_a: correction_a,
                    correction_b: correction_b,
                    actuation_impulse_a: actuation_impulse_a,
                    actuation_impulse_b: actuation_impulse_b
                };

//             var post_impulse_a_mom = a.momentum.plus(impulse_a).plus(actuation_impulse_a),
//                 post_impulse_a_L = a.L.plus(a_r.cross(impulse_a)).plus(a_r.cross(actuation_impulse_a)),
//                 post_impulse_a_vel = post_impulse_a_mom.times(a.m_inv),
//                 post_impulse_a_w = a.I_inv.times(post_impulse_a_vel),

//                 post_impulse_b_mom = b.momentum.plus(impulse_b).plus(actuation_impulse_b),
//                 post_impulse_b_L = b.L.plus(a_r.cross(impulse_b)).plus(b_r.cross(actuation_impulse_b)),
//                 post_impulse_b_vel = post_impulse_b_mom.times(b.m_inv),
//                 post_impulse_b_w = b.I_inv.times(post_impulse_b_vel);

//             rel_vel = post_impulse_b_vel.plus(post_impulse_b_w.cross(b_r)).minus(
//                       post_impulse_a_vel.plus(post_impulse_a_w.cross(a_r)));

            rel_vel = a.point_vel(a_r, true).minus(b.point_vel(b_r, true));
//             console.log(rel_vel);
            if (normal.times(rel_vel.dot(normal)).equals(rel_vel))
                return {
                    impulse_a: impulse_a,
                    impulse_b: impulse_b,
                    a_r: a_r,
                    b_r: b_r,
                    friction_impulse_a: Vec.of(0, 0, 0),
                    friction_impulse_b: Vec.of(0, 0, 0),
                    correction_a: correction_a,
                    correction_b: correction_b,
                    actuation_impulse_a: actuation_impulse_a,
                    actuation_impulse_b: actuation_impulse_b
                };

            var tangent = rel_vel.minus(rel_vel.project_onto(normal)).normalized();

            var jt = -rel_vel.dot(tangent);

            jt /= a.m_inv + b.m_inv + 
                     a.R.times(a.I_inv).times(a.R_inv).times(a_r.cross(tangent)).cross(a_r).dot(tangent) + 
                     b.R.times(b.I_inv).times(b.R_inv).times(b_r.cross(tangent)).cross(b_r).dot(tangent);

            var mu_s = Math.sqrt(a.mu_s**2 + b.mu_s**2);

            var friction_impulse;
            var jn = j + normal.dot(ja);
//             console.log(rel_vel.dot(tangent));
//             console.log(a.w.norm());
            var friction_color = Color.of(1, 0, 0, 1);

//             console.log(jt, jn);

            if (Math.abs(jt) < Math.abs(jn * mu_s)) {
                friction_impulse = tangent.times(jt);
            }
            else {
                var mu_d = Math.sqrt(a.mu_d**2 + b.mu_d**2);
                friction_impulse = tangent.times(-jn * mu_d);
                friction_color = Color.of(0, 0, 1, 1);
            }

            var friction_impulse_a = friction_impulse.times(-1),
                friction_impulse_b = friction_impulse.times(1);

//             console.log(friction_impulse_a.norm());

            if (a.scene.debug)
                a.scene.shapes.vector.draw(
                    a.scene.globals.graphics_state,
                    Mat4.y_to_vec(friction_impulse_a.times(10), a.com.plus(a_r).plus(Vec.of(0, 3, 0))),
                    a.scene.physics_shader.material(friction_color),
                    "LINES");

            if (a.scene.debug)
                a.scene.shapes.vector.draw(
                    a.scene.globals.graphics_state,
                    Mat4.y_to_vec(tangent.times(rel_vel.dot(tangent)).times(10), a.com.plus(a_r).plus(Vec.of(0, 3, 0))),
                    a.scene.physics_shader.material(Color.of(0, 1, 0, 1)),
                    "LINES");

            return {
                impulse_a: impulse_a,
                impulse_b: impulse_b,
                a_r: a_r,
                b_r: b_r,
                friction_impulse_a: friction_impulse_a,
                friction_impulse_b: friction_impulse_b,
                correction_a: correction_a,
                correction_b: correction_b,
                actuation_impulse_a: actuation_impulse_a,
                actuation_impulse_b: actuation_impulse_b
            }       

        }
        return null;
    }

    static ball_collision_info(a, b) {
        /* convex shapes only */
        var contact = a.com.times(a.r).plus(b.com.times(b.r)).times(1/(a.r + b.r));

        var a_r = contact.minus(a.com),
            b_r = contact.minus(b.com);


        var rest = Math.min(a.restitution, b.restitution),
            normal = a_r.normalized();

        var rel_vel = a.point_vel(a_r).minus(b.point_vel(b_r)),
            vel_along_normal = rel_vel.dot(normal);
            
        const percent = .2;
        var penetration_depth = a.r + b.r - a.com.minus(b.com).norm(),
            slop = .01,
            correction = normal.times(Math.max(penetration_depth - slop, 0) / (a.m_inv + b.m_inv) * percent);

        var correction_a = correction.times(-a.m_inv),
            correction_b = correction.times(b.m_inv);

        var actuation_impulse_a = Vec.of(0, 0, 0),
            actuation_impulse_b = Vec.of(0, 0, 0);

        if (vel_along_normal < 0)
            return {
                impulse_a: Vec.of(0, 0, 0),
                impulse_b: Vec.of(0, 0, 0),
                a_r: a_r,
                b_r: b_r,
                friction_impulse_a: Vec.of(0, 0, 0),
                friction_impulse_b: Vec.of(0, 0, 0),
                correction_a: correction_a,
                correction_b: correction_b,
                actuation_impulse_a: actuation_impulse_a,
                actuation_impulse_b: actuation_impulse_b
            };
        if (vel_along_normal < 20)
            rest = 0;

        var j = vel_along_normal*(-(1 + rest));
            j /= a.m_inv + b.m_inv + 
                 a.R.times(a.I_inv).times(a.R_inv).times(a_r.cross(normal)).cross(a_r).dot(normal) + 
                 b.R.times(b.I_inv).times(b.R_inv).times(b_r.cross(normal)).cross(b_r).dot(normal);

        var impulse_a = normal.times(j),
            impulse_b = normal.times(-j);

        if (a.scene.debug)
            a.scene.shapes.vector.draw(
                a.scene.globals.graphics_state,
                Mat4.y_to_vec(impulse_a.times(1000), a.com.plus(a_r)),
                a.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
                "LINES");

        if (a.scene.friction_off)
            return {
                impulse_a: impulse_a,
                impulse_b: impulse_b,
                a_r: a_r,
                b_r: b_r,
                friction_impulse_a: Vec.of(0, 0, 0),
                friction_impulse_b: Vec.of(0, 0, 0),
                correction_a: correction_a,
                correction_b: correction_b,
                actuation_impulse_a: actuation_impulse_a,
                actuation_impulse_b: actuation_impulse_b
            };

        rel_vel = b.point_vel(b_r).minus(a.point_vel(a_r));
        if (normal.times(rel_vel.dot(normal)).equals(rel_vel))
            return {
                impulse_a: impulse_a,
                impulse_b: impulse_b,
                a_r: a_r,
                b_r: b_r,
                friction_impulse_a: Vec.of(0, 0, 0),
                friction_impulse_b: Vec.of(0, 0, 0),
                correction_a: correction_a,
                correction_b: correction_b,
                actuation_impulse_a: actuation_impulse_a,
                actuation_impulse_b: actuation_impulse_b
            };

        var tangent = rel_vel.minus(normal.times(rel_vel.dot(normal))).normalized();

        var jt = -rel_vel.dot(tangent);
        jt /= a.m_inv + b.m_inv + 
                 a.R.times(a.I_inv).times(a.R_inv).times(a_r.cross(tangent)).cross(a_r).dot(tangent) + 
                 b.R.times(b.I_inv).times(b.R_inv).times(b_r.cross(tangent)).cross(b_r).dot(tangent);

        var mu_s = Math.sqrt(a.mu_s**2 + b.mu_s**2);

        var friction_impulse;
        if (Math.abs(jt) < j*mu_s)
            friction_impulse = tangent.times(jt);
        else {
            var mu_d = Math.sqrt(a.mu_d**2 + b.mu_d**2);
            friction_impulse = tangent.times(-j * mu_d);
        }

        var friction_impulse_a = friction_impulse,
            friction_impulse_b = friction_impulse.times(-1);

        if (a.scene.debug)
            a.scene.shapes.vector.draw(
                a.scene.globals.graphics_state,
                Mat4.y_to_vec(friction_impulse_a.times(1000), a.com.plus(a_r)),
                a.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
                "LINES");

        return {
            impulse_a: impulse_a,
            impulse_b: impulse_b,
            a_r: a_r,
            b_r: b_r,
            friction_impulse_a: friction_impulse_a,
            friction_impulse_b: friction_impulse_b,
            correction_a: correction_a,
            correction_b: correction_b,
            actuation_impulse_a: actuation_impulse_a,
            actuation_impulse_b: actuation_impulse_b
        };
    }

}
