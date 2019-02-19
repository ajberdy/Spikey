class Physics_Object {
    constructor(scene, pos, vel, w, mass, e) {
        if (mass == Infinity && (vel.norm() != 0 || w.norm() != 0))
            throw new Error("Infinitely massive objects cannot move");
        // scene which the object exists in
        this.scene = scene;

        // constant properties
        this.m = mass;
        this.m_inv = 1 / mass;  // for efficiency
        this.restitution = e;

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
        this.pos = pos;
        this.momentum;

        this.orientation = Quaternion.of(1, 0, 0, 0);
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
    }

    get transform() { return Mat4.identity(); }

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

    get com() { return this.pos; }

    get x() { return this.pos[0]; }
    get y() { return this.pos[1]; }
    get z() { return this.pos[2]; }

    initialize() {
        this.momentum = this.vel.norm() ? this.vel.times(this.m) : Vec.of(0, 0, 0);
        this.L = this.w.norm() ? this.I.times(this.w) : Vec.of(0, 0, 0);
    }

    recalc() {
        this.vel = this.momentum.times(this.m_inv);

        this.w = this.I_inv.times(this.L);

        this.orientation.normalize()
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(this.orientation).times(0.5);
    }

    shift(vec) {
        this.pos = this.pos.plus(vec);
    }

    force(F, r) {
        this.F = this.F.plus(F);
        this.T = this.T.plus(r.cross(F));
    }

    impulse(J, r) {
        this.momentum = this.momentum.plus(J);
        this.L = this.L.plus(r.cross(J));
    }

    update(dt) {

        this.momentum = this.momentum.plus(this.F.times(dt));
        this.L = this.L.plus(this.T.times(dt));

        this.recalc();

//         console.log(this.spin.times(dt));

        this.pos = this.pos.plus(this.vel.times(dt));
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
    }

    support(d, used) {
        var max_v, max_dot = -Infinity;
        for (var v_base of this.base_points) {
            let v = this.transform.times(v_base.to4(1)).to3(),
                dot = v.dot(d);

            if (dot >= max_dot) {
                if (dot == max_dot && used != undefined && used.includes(v))
                    continue;
                max_v = v;
                max_dot = dot;
            }
        }

        return max_v;
    }
}


class Ball extends Physics_Object {
    constructor(scene, pos, vel, w, mass, radius, e, material) {
        super(scene, pos, vel, w, mass, e);
        this.mat = material;
        this.r = radius;
        this.I = Mat3.identity().times(2/5*this.m*Math.pow(this.r, 2));
        this.I_inv = Mat3.identity().times(1/(2/5*this.m*Math.pow(this.r, 2)));

        this.initialize();

        this.base_points = scene.shapes.ball.positions;
        this.base_normals = scene.shapes.ball.normals;
    }

    get transform() {
        return Mat4.translation(Vec.of(this.x, this.y, this.z)).times(
               Mat4.quaternion_rotation(this.orientation.normalized())).times(
               Mat4.scale(Vec.of(this.r, this.r, this.r)));
    }

    draw(graphics_state) {
        this.scene.shapes.ball.draw(
            graphics_state,
            this.transform,
            this.mat ? this.mat : this.scene.materials.soccer);
    }

    support(d) {
        return this.pos.plus(d.normalized().times(this.r));
    }
}


class Box extends Physics_Object {
    constructor(scene, pos, vel, w, mass, dims, e, material) {
        super(scene, pos, vel, w, mass, e);
        this.mat = material;
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
    }

    get transform() {
        return Mat4.translation(Vec.of(this.x, this.y, this.z)).times(
               Mat4.quaternion_rotation(this.orientation)).times(
               Mat4.scale(this.dims.times(1/2)));
    }

    get width() { return this.dims[0]; }
    get height() { return this.dims[1]; }
    get depth() { return this.dims[2]; }

    draw(graphics_state) {
        this.scene.shapes.box.draw(
            graphics_state,
            this.transform,
            this.mat);
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
                    args.simplex_a = [b_a, b_c, b_b];
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
        var simplex_args = {
                simplex: args.simplex,
                simplex_a: args.simplex_a, 
                simplex_b: args.simplex_b, 
                dir: support_args.dir
            },
            result;

        while (args.simplex.length < 4) {
            support_args.dir = support_args.dir.normalized();
            Collision_Detection.support(support_args);

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
            support_args.dir = simplex_args.dir.normalized();
        }

        return result;
    }

    static EPA(args, epsilon=0.0001) {
        /* expanding polytope algorithm */
        if (args.simplex.length != 4)
            throw new Error("I don't think this should happen");

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
                dir: triangles[min_ix].normal.times(-1),
                support_a: null,
                support_b: null,
                support: null
            };

        while (new_dist + epsilon < min_dist) {
            for (var i in triangles) {
                var dist = Math.abs(triangles[i].normal.dot(triangles[i].a));
                if (dist < min_dist) {
                    min_dist = dist;
                    min_ix = i;
                }
            }

            Collision_Detection.support(support_args);

            new_dist = support_args.support.norm();
            if (new_dist + epsilon >= min_dist) {
                break;
            }

            var edges = [];
            for (var i in triangles) {
                var t = triangles[i];
                if (t.normal.dot(t.a.minus(support_args.support)) > 0) {
                    triangles.splice(i, 1);
                    var te = [[t.a, t.b], [t.b, t.c], [t.c, t.a]];

                    for (var i in edges) {
                        var e = edges[i];
                
                        if (e[0].equals(te[1]) && e[1].equals(te[2]))
                            delete edges[i];
                        else
                            edges.push(e);
                    }
                    edges = edges.filter(x => x != undefined);
                }
            }


        }

        var t = triangles[min_ix],
            ta = triangles_a[min_ix],
            tb = triangles_b[min_ix],
            normal = t.normal,
            penetration = min_dist,
            p = normal.times(-min_dist),
            tA = t.b.minus(t.a).cross(t.c.minus(t.a)).norm(),
            barry_coords = Vec.of(
                    t.b.minus(p).cross(t.c.minus(p)).norm()/tA,
                    t.a.minus(p).cross(t.c.minus(p)).norm()/tA,
                    t.a.minus(p).cross(t.b.minus(p)).norm()/tA,
                ),
            contact_a = ta.a.times(barry_coords[0]).plus(ta.b.times(barry_coords[1])).plus(ta.c.times(barry_coords[2])),
            contact_b = tb.a.times(barry_coords[0]).plus(tb.b.times(barry_coords[1])).plus(tb.c.times(barry_coords[2])),
            manifold = {
                normal: normal,
                penetration_depth: penetration,
                contact_a: contact_a,
                contact_b: contact_b
            };
        
        return manifold;  
    }
    
    static get_impacts(e, i) {
        var impacts = {
            i_to_e: [],

            e_to_i: []
        }

        var GJK_args = {a: e, b: i, simplex: null, simplex_a: null, simplex_b: null};
        if (Collision_Detection.GJK(GJK_args)) {
            console.log(GJK_args.simplex);

            var manifold = Collision_Detection.EPA(GJK_args);



//             var normals = i.normals.concat(e.normals),
//                 collision_dir,
//                 smol_ones = [null, null, null],
//                 smallest_mink_norm = Infinity;
//             for (var dir of normals) {//Collision_Detection.icosohedron_normals()) {
//                 var mink = e.support(dir.times(1)).minus(i.support(dir.times(-1)));
// //                 for (var ix in smallest_mink_norms) {
// //                     if (mink.norm() < smallest_mink_norms[ix] && smallest_mink_norms[ix] == Math.max.apply(null, smallest_mink_norms)) {
// //                         smallest_mink_norms[ix] = mink.norm();
// //                         smol_ones[ix] = dir;
// //                         break;
// //                     }
// //                 }
//                 if (mink.norm() < smallest_mink_norm) {
//                     smallest_mink_norm = mink.norm();
//                     collision_dir = dir;
//                 }
//             }

// //             collision_dir = smol_ones[0].plus(smol_ones[1]).plus(smol_ones[2]).times(1/3);
            
//             var i_contact = i.support(collision_dir.times(-1)),
//                 e_contact = e.support(collision_dir.times(1));

//             var e_r = e_contact.minus(e.com),
//                 i_r = i_contact.minus(i.com);

            var i_contact = manifold.contact_b,
                e_contact = manifold.contact_a;

            var e_r = e_contact.minus(e.com),
                i_r = e_contact.minus(i.com);


            var rest = Math.min(e.restitution, i.restitution),
                normal = manifold.normal,   //collision_dir,//Vec.of(1, 0, 0),//i_r.normalized(),
                vel_along_normal = (e.vel.plus(e.w.cross(e_r)).minus(i.vel.plus(i.w.cross(i_r)))).dot(normal);

            const percent = 0.00;
            var penetration_depth = manifold.penetration_depth, //i_contact.minus(e_contact).norm(),
                slop = 0.1,
                correction = normal.times(Math.max(penetration_depth - slop, 0) / (e.m_inv + i.m_inv) * percent);

            if (vel_along_normal < 0)
                return impacts;

            var impulse_ie = vel_along_normal*(-(1 + rest));
                impulse_ie /= i.m_inv + e.m_inv + 
                    e.R.times(e.I_inv).times(e.R_inv).times(e_r.cross(normal)).cross(e_r).dot(normal) + 
                    i.R.times(i.I_inv).times(i.R_inv).times(i_r.cross(normal)).cross(i_r).dot(normal);
                impulse_ie = normal.times(impulse_ie);

            console.log(e.R.times(e.I_inv));


            var i_pos_correct = correction.times(i.m_inv),
                e_pos_correct = correction.times(-e.m_inv);

            impacts.i_to_e.push({
                impulse: impulse_ie,
                contact: e_r,
                pos_correction: e_pos_correct
            });

            impacts.e_to_i.push({
                impulse: impulse_ie.times(-1),
                contact: i_r,
                pos_correction: i_pos_correct
            });
            
        }

        return impacts;
    }


}


class Collision_Detection_ {

    static icosohedron_normals() {
        return Vec.cast(
            [0.1876, -0.7947, 0.5774],
            [0.6071, -0.7947, 0.0000],
            [-0.4911, -0.7947, 0.3568],
            [-0.4911, -0.7947, -0.3568],
            [0.1876, -0.7947, -0.5774],
            [0.9822, -0.1876, 0.0000],
            [0.3035, -0.1876, 0.9342],
            [-0.7946, -0.1876, 0.5774],
            [-0.7946, -0.1876, -0.5774],
            [0.3035, -0.1876, -0.9342],
            [0.7946, 0.1876, 0.5774],
            [-0.3035, 0.1876, 0.9342],
            [-0.9822, 0.1876, 0.0000],
            [-0.3035, 0.1876, -0.9342],
            [0.7946, 0.1876, -0.5774],
            [0.4911, 0.7947, 0.3568],
            [-0.1876, 0.7947, 0.5774],
            [-0.6071, 0.7947, 0.0000],
            [-0.1876, 0.7947, -0.5774],
            [0.4911, 0.7947, -0.3568]
        )
    }

    static support(args) {
        args.support_a = args.a.support(args.dir);
        args.support_b = args.b.support(args.dir.times(-1));
        args.support = args.support_b.minus(args.support_a);

        return;
    }

    static do_simplex(args){
        var simplex = args.simplex,
            dir = args.dir;
        var a = simplex[0], b = simplex[1],
            ab = b.minus(a), a0 = a.times(-1);

        switch (simplex.length) {
            case 2:
                if (ab.dot(a0) > 0) {
                    args.simplex = [a, b];
                    args.dir = ab.cross(a0).cross(ab);
                }
                else {
                    args.simplex = [a];
                    args.dir = a0;
                }
                break;

            case 3:
                var c = simplex[2],
                    ac = c.minus(a),
                    abc = ab.cross(ac);
                
                if (abc.cross(ac).dot(a0) > 0)
                    if (ac.dot(a0)) {
                        args.simplex = [a, c];
                        args.dir = ac.cross(a0).cross(ac);
                    }
                    else if (ab.dot(a0) > 0) {
                        args.simplex = [a, b]
                        args.dir = ab.cross(a0).cross(ab);
                    }
                    else {
                        args.simplex = [a];
                        args.dir = a0;
                    }
                else if (ab.cross(abc).dot(a0) > 0)
                    if (ab.dot(a0) > 0) {
                        args.simplex = [a, b];
                        args.dir = ab.cross(a0).cross(ab);
                    }
                    else {
                        args.simplex = [a];
                        args.dir = a0;
                    }
                else if (abc.dot(a0) > 0) {
                    args.simplex = [a, b, c];
                    args.dir = abc;
                }
                else {
                    args.simplex = [a, c, b];
                    args.dir = abc.times(-1);
                }
                break;

            case 4:
                var c = simplex[2],
                    d = simplex[3],
                    ac = c.minus(a),
                    ad = d.minus(a),
                    abc = ab.cross(ac),
                    acd = ac.cross(ad),
                    adb = ad.cross(ab);

                if (abc.dot(a0) > 0) {
                    args.simplex = [a, b, c];
                    return Collision_Detection.do_simplex(args);
                }
                else if (acd.dot(a0) > 0) {
                    args.simplex = [a, c, d];
                    return Collision_Detection.do_simplex(args);
                }
                else if (adb.dot(a0) > 0) {
                    args.simplex = [a, d, b];
                    return Collision_Detection.do_simplex(args);
                }
                else 
                    return true;
                
        }

        return false;
    }


    static GJK(s1, s2) {
        /* GJK for shapes */
        var d = Vec.of(1, 0, 0),
            s = s1.support(d).minus(s2.support(d.times(-1))),
            simplex = [s];

        d = s.times(-1);
        var args = {simplex: simplex, dir: d},
            result;

        while (simplex.length < 4) {
            d = d.normalized();
            var A = s1.support(d).minus(s2.support(d.times(-1)));

//             console.log(A, d);
            if (A.dot(d) < 0)
                return false;
//             if (d.norm() == 0)
//                 return true;

            simplex.unshift(A);

            args.simplex = simplex;
            args.dir = d;

            result = Collision_Detection.do_simplex(args);

            simplex = args.simplex;
            d = args.dir;
        }

        return result;
    }
    
    static get_impacts(e, i) {
        var impacts = {
            i_to_e: [],

            e_to_i: []
        }

        if (Collision_Detection.GJK(e, i)) {
            var normals = i.normals.concat(e.normals),
                collision_dir,
                smol_ones = [null, null, null],
                smallest_mink_norm = Infinity;
            for (var dir of normals) {//Collision_Detection.icosohedron_normals()) {
                var mink = e.support(dir.times(1)).minus(i.support(dir.times(-1)));
//                 for (var ix in smallest_mink_norms) {
//                     if (mink.norm() < smallest_mink_norms[ix] && smallest_mink_norms[ix] == Math.max.apply(null, smallest_mink_norms)) {
//                         smallest_mink_norms[ix] = mink.norm();
//                         smol_ones[ix] = dir;
//                         break;
//                     }
//                 }
                if (mink.norm() < smallest_mink_norm) {
                    smallest_mink_norm = mink.norm();
                    collision_dir = dir;
                }
            }

//             collision_dir = smol_ones[0].plus(smol_ones[1]).plus(smol_ones[2]).times(1/3);
            
            var i_contact = i.support(collision_dir.times(-1)),
                e_contact = e.support(collision_dir.times(1));

            var e_r = e_contact.minus(e.com),
                i_r = i_contact.minus(i.com);


            var rest = Math.min(e.restitution, i.restitution),
                normal = collision_dir,//Vec.of(1, 0, 0),//i_r.normalized(),
                vel_along_normal = (e.vel.plus(e.w.cross(e_r)).minus(i.vel.plus(i.w.cross(i_r)))).dot(normal);

            const percent = 0.00;
            var penetration_depth = i_contact.minus(e_contact).norm(),
                slop = 0.1,
                correction = normal.times(Math.max(penetration_depth - slop, 0) / (e.m_inv + i.m_inv) * percent);

            if (vel_along_normal < 0)
                return impacts;

            var impulse_ie = vel_along_normal*(-(1 + rest));
                impulse_ie /= i.m_inv + e.m_inv + 
                    e.R.times(e.I_inv).times(e.R_inv).times(e_r.cross(normal)).cross(e_r).dot(normal) + 
                    i.R.times(i.I_inv).times(i.R_inv).times(i_r.cross(normal)).cross(i_r).dot(normal);
                impulse_ie = normal.times(impulse_ie);

            console.log(e.R.times(e.I_inv));


            var i_pos_correct = correction.times(i.m_inv),
                e_pos_correct = correction.times(-e.m_inv);

            impacts.i_to_e.push({
                impulse: impulse_ie,
                contact: e_r,
                pos_correction: e_pos_correct
            });

            impacts.e_to_i.push({
                impulse: impulse_ie.times(-1),
                contact: i_r,
                pos_correction: i_pos_correct
            });
            
        }

        return impacts;


//         // both are spheres, no friction/spinning
//         if (e instanceof Ball && i instanceof Ball) {
//             if (e.pos.minus(i.pos).norm() <= e.r + i.r) {
//                 var contact = i.pos.times(i.r).plus(e.pos.times(e.r)).times(1/(e.r + i.r)),
//                     i_contact = i.pos.minus(contact),
//                     e_contact = e.pos.minus(contact);


//                 var rest = Math.min(e.restitution, i.restitution),
//                     normal = i_contact.normalized(),
//                     vel_along_normal = (e.vel.dot(normal) - i.vel.dot(normal));

                
//                 const percent = 0.1;
//                 var penetration_depth = i_contact.minus(e_contact).norm() - (e.r + i.r),
//                     slop = 0.01,
//                     correction = normal.times(Math.max(penetration_depth - slop, 0) / (e.m_inv + i.m_inv) * percent);
//             }

//             else
//                 return impacts;
//         }
        
//         else if (e instanceof Box && i instanceof Ball) {
//             e = [i, i = e][0];
//         }

//         if (e instanceof Ball && i instanceof Box) {
//             if (e.pos.minus(i.pos).norm() <= e.r + i.width/2) {
//                 var contact = i.pos.times(i.width/2).plus(e.pos.times(e.r)).times(1/(e.r + i.width/2));
//                     contact[1] = e.pos[1];
//                     contact[2] = e.pos[2];
// //                     contact = contact.times(-1);
//                 var i_contact = i.pos.minus(contact),
//                     e_contact = e.pos.minus(contact);

//                 var rest = Math.min(e.restitution, i.restitution),
//                     normal = i_contact.normalized(),
//                     vel_along_normal = (e.vel.dot(normal) - i.vel.dot(normal));

//                 var correction = Vec.of(0, 0, 0);
                
//             }
            
//             else
//                 return impacts;
//         }

//         if (vel_along_normal < 0)
//             return impacts;

//         var impulse_ie = vel_along_normal*(-(1 + rest));
//             impulse_ie /= i.m_inv + e.m_inv;
//             impulse_ie = normal.times(impulse_ie);

        
//         var i_pos_correct = correction.times(i.m_inv),
//             e_pos_correct = correction.times(-e.m_inv);

//         impacts.i_to_e.push({
//             impulse: impulse_ie,
//             contact: i_contact,
//             pos_correction: e_pos_correct
//         });

//         impacts.e_to_i.push({
//             impulse: impulse_ie.times(-1),
//             contact: e_contact,
//             pos_correction: i_pos_correct
//         });

//         return impacts;
    }
}

