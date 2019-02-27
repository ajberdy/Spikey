class Physics_Object {
    constructor(scene, pos, vel, w, mass, e=1, mu_s=0, mu_d=0) {
        if (mass == Infinity && (vel.norm() != 0 || w.norm() != 0))
            throw new Error("Infinitely massive objects cannot move");
        // scene which the object exists in
        this.scene = scene;

        // constant properties
        this.m = mass;
        this.m_inv = 1 / mass;  // for efficiency
        this.restitution = e;
        this.mu_s = mu_s;
        this.mu_d = mu_d;

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

        this.orientation = Quaternion.unit();
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


        // hacky stuff
        this.resting = false;
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

        this.w = this.R.times(this.I_inv).times(this.R_inv).times(this.L);

        this.orientation.normalize()
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(0.5).times(this.orientation);
    }

    shift(vec) {
        this.pos = this.pos.plus(vec);
    }

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

        if (this.resting)
            return;

        this.momentum = this.momentum.plus(this.F.times(dt));
        this.L = this.L.plus(this.T.times(dt));

        this.recalc();

        this.pos = this.pos.plus(this.vel.times(dt));
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
    constructor(scene, pos, vel, w, mass, radius, e, mu_s, mu_d, material) {
        super(scene, pos, vel, w, mass, e, mu_s, mu_d);
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
    constructor(scene, pos, vel, w, mass, dims, e, mu_s, mu_d, material) {
        super(scene, pos, vel, w, mass, e, mu_s, mu_d);
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
//             const epsilon = 0.1,
//                   epsilonSq = epsilon ** 2;
            switch(args.simplex.length) {
                case 2:
                    var b, c, v = args.simplex[1].minus(args.simplex[0]);
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
        var max_iters = 20;
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
//             delete triangles[min_ix];
//             delete triangles_a[min_ix];
//             delete triangles_b[min_ix];
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

        if (isNaN(normal[0])) {
            var indices = t[0] == t[2] ? [0, 1] : [0, 2],
                e = [t[indices[0]], t[indices[1]]],
                ea = [ta[indices[0]], ta[indices[1]]],
                eb = [tb[indices[0]], tb[indices[1]]],
                normal = e[1].minus(e[0]).cross(e[0]).cross(e[1].minus(e[0])).normalized(),
                p = normal.times(-min_dist),
                ratios = [e[0].minus(p).dot(e[0].minus(e[1])),
                          e[1].minus(p).dot(e[1].minus(e[0]))],
                barry_coords = Vec.of(
                        ratios[0]/(ratios[0] + ratios[1]),
                        ratios[1]/(ratios[0] + ratios[1])
                    ),
                contact_a = ea[0].times(barry_coords[0]).plus(ea[1].times(barry_coords[1])),
                contact_b = eb[0].times(barry_coords[0]).plus(eb[1].times(barry_coords[1]));
                
        }
        else {
            var p = normal.times(-min_dist),
                tA = t.b.minus(t.a).cross(t.c.minus(t.a)).norm(),
                barry_coords = Vec.of(
                        t.b.minus(p).cross(t.c.minus(p)).norm()/tA,
                        t.a.minus(p).cross(t.c.minus(p)).norm()/tA,
                        t.a.minus(p).cross(t.b.minus(p)).norm()/tA,
                    ),
                contact_a = ta.a.times(barry_coords[0]).plus(ta.b.times(barry_coords[1])).plus(ta.c.times(barry_coords[2])),
                contact_b = tb.a.times(barry_coords[0]).plus(tb.b.times(barry_coords[1])).plus(tb.c.times(barry_coords[2]));
            }

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

    static collide(a, b, dt) {
        if (a.is_chill() && b.is_chill())
            return;
        a.unchill();
        b.unchill();

        var GJK_args = {a: a, b: b, simplex: null, simplex_a: null, simplex_b: null};
        if (Collision_Detection.GJK(GJK_args)) {

            var manifold = Collision_Detection.EPA(GJK_args, .1);

            if (!manifold) {
                a.chill();
                b.chill();
                console.log("resting...");
                return;
            }

            var a_contact = manifold.contact_a,
                b_contact = manifold.contact_b;

            var a_r = a_contact.minus(a.com),
                b_r = b_contact.minus(b.com);


            var rest = Math.min(a.restitution, b.restitution),
                normal = manifold.normal;

            var rel_vel = a.vel.plus(a.w.cross(a_r)).minus(b.vel.plus(b.w.cross(b_r)));
            var vel_along_normal = rel_vel.dot(normal);
            
            if (vel_along_normal < 0)
                return;
            if (vel_along_normal < .1)
                rest = 0;

            const percent = .2;
            var penetration_depth = manifold.penetration_depth,
                slop = .01,
                correction = normal.times(Math.max(penetration_depth - slop, 0) / (a.m_inv + b.m_inv) * percent);

            var j = vel_along_normal*(-(1 + rest));
                j /= a.m_inv + b.m_inv + 
                     a.R.times(a.I_inv).times(a.R_inv).times(a_r.cross(normal)).cross(a_r).dot(normal) + 
                     b.R.times(b.I_inv).times(b.R_inv).times(b_r.cross(normal)).cross(b_r).dot(normal);
                
            var impulse_a = normal.times(j),
                impulse_b = normal.times(-j);

//             if (correction.norm())
//                 console.log(correction);

            a.impulse(impulse_a, a_r);
            b.impulse(impulse_b, b_r);
            
            var correction_a = correction.times(-a.m_inv),
                correction_b = correction.times(b.m_inv);

            a.shift(correction_a);
            b.shift(correction_b);

            rel_vel = b.vel.plus(b.w.cross(b_r)).minus(a.vel.plus(a.w.cross(a_r)));
            if (normal.times(rel_vel.dot(normal)).equals(rel_vel))
                return;

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

//             console.log(rel_vel.dot(tangent));

            a.impulse(friction_impulse.times(1), a_r);
            b.impulse(friction_impulse.times(-1), b_r);

//             b.scene.shapes.vector.draw(
//                 b.scene.globals.graphics_state,
//                 Mat4.y_to_vec(friction_impulse.times(-1000), b_contact).times(
//                     Mat4.scale(Vec.of(1, .03, 1))),
//                 b.scene.physics_shader.material(Color.of(1, 0, 0, 1)),
//                 "LINES");

        }
    }
    
    static get_impacts(e, i) {
        var impacts = {
            i_to_e: [],

            e_to_i: []
        }

        var GJK_args = {a: e, b: i, simplex: null, simplex_a: null, simplex_b: null};
        if (Collision_Detection.GJK(GJK_args)) {
//             console.log(GJK_args.simplex);

            var manifold = Collision_Detection.EPA(GJK_args);

//             if (manifold.normal.dot(Vec.of(0, 1, 0)) < 0) {
//                 GJK_args.a.resting = true;
//             }



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
                normal = manifold.normal;   //collision_dir,//Vec.of(1, 0, 0),//i_r.normalized(),
            
            if (Math.max(e.vel.norm(), i.vel.norm()) < 100)
                rest = 0;
            
//             console.log(Math.sign(normal.dot(Vec.of(0, 1, 0))));
//             if (normal.dot(Vec.of(0, 1, 0)) > 0)
//                 normal = normal.times(-1);

            var vel_along_normal = (e.vel.plus(e.w.cross(e_r).times(1)).minus(i.vel.plus(i.w.cross(i_r).times(1)))).dot(normal);


//             console.log(normal);
            if (e.momentum.norm() > 1000)
                console.log(i_r, e_r);

            const percent = .2;
            var penetration_depth = manifold.penetration_depth, //i_contact.minus(e_contact).norm(),
                slop = .01,
                correction = normal.times(Math.max(penetration_depth - slop, 0) / (e.m_inv + i.m_inv) * percent);

            if (vel_along_normal < 0){
                impulse_ie = Vec.of(0, 0, 0);
                correction = Vec.of(0, 0, 0);
            }
//                 return impacts;
            else {
                if (vel_along_normal > 100)
                    console.log(e.vel, e.w, e_r);
                var impulse_ie = vel_along_normal*(-(1 + rest));
                impulse_ie /= i.m_inv + e.m_inv + 
                    e.R.times(e.I_inv).times(e.R_inv).times(e_r.cross(normal)).cross(e_r).dot(normal) + 
                    i.R.times(i.I_inv).times(i.R_inv).times(i_r.cross(normal)).cross(i_r).dot(normal);
                impulse_ie = normal.times(impulse_ie);
            }

            

//             console.log(e.R.times(e.I_inv));


            var i_pos_correct = correction.times(i.m_inv),
                e_pos_correct = correction.times(-e.m_inv);
            
//             console.log(normal);
//             console.log(i_pos_correct);

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

