class Physics_Object {
    constructor(scene, pos, vel, w, mass, e) {
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
    }

    get x() { return this.pos[0]; }
    get y() { return this.pos[1]; }
    get z() { return this.pos[2]; }

    initialize() {
        this.momentum = this.vel.times(this.m);
        this.L = this.I.times(this.w);
    }

    recalc() {
        this.vel = this.momentum.times(this.m_inv);

        this.w = this.I_inv.times(this.L);

        this.orientation.normalize()
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(this.orientation).times(0.5);
    }

    force(F, r) {
        this.F = this.F.plus(F);
        this.T = this.T.plus(r.cross(F));
    }

    impulse(J, r) {
        this.momentum = this.momentum.plus(J);
        this.L = this.L.plus(J.cross(r));
    }

    update(dt) {

        this.momentum = this.momentum.plus(this.F.times(dt));
        this.L = this.L.plus(this.T.times(dt));

        this.recalc();

        this.pos = this.pos.plus(this.vel.times(dt));
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
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
    }

    draw(graphics_state) {
        this.scene.shapes.ball.draw(
            graphics_state,
            Mat4.translation(Vec.of(this.x, this.y, this.z)).times(
                Mat4.quaternion_rotation(this.orientation.normalized())).times(
                Mat4.scale(Vec.of(this.r, this.r, this.r))),
            this.mat ? this.mat : this.scene.materials.soccer);
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
            [0, 0, 1/(dims[0]**2 + dims[1]**2)]);

        this.initialize();
    }

    get width() { return this.dims[0]; }
    get height() { return this.dims[1]; }
    get depth() { return this.dims[2]; }

    draw(graphics_state) {
        this.scene.shapes.box.draw(
            graphics_state,
            Mat4.translation(Vec.of(this.x, this.y, this.z)).times(
                Mat4.quaternion_rotation(this.orientation)).times(
                Mat4.scale(this.dims.times(1/2))),
            this.mat);
    }
}



class Collision_Detection {
    
    static get_impacts(e, i) {
        var impacts = {
            i_to_e: [],
            e_to_i: []
        }

        // both are spheres, no friction/spinning
        if (e instanceof Ball && i instanceof Ball) {
            if (e.pos.minus(i.pos).norm() <= e.r + i.r) {
                var contact = i.pos.times(i.r).plus(e.pos.times(e.r)).times(1/(e.r + i.r)),
                    i_contact = i.pos.minus(contact),
                    e_contact = e.pos.minus(contact);


                var rest = Math.min(e.restitution, i.restitution),
                    normal = i_contact.normalized(),
                    vel_along_normal = (e.vel.dot(normal) - i.vel.dot(normal));
            }

            else
                return impacts;
        }
        
        else if (e instanceof Box && i instanceof Ball) {
            e = [i, i = e][0];
        }

        if (e instanceof Ball && i instanceof Box) {
            if (e.pos.minus(i.pos).norm() <= e.r + i.width/2) {
                var contact = i.pos.times(i.width/2).plus(e.pos.times(e.r)).times(1/(e.r + i.width/2));
                    contact[1] = e.pos[1];
                    contact[2] = e.pos[2];
//                     contact = contact.times(-1);
                var i_contact = i.pos.minus(contact),
                    e_contact = e.pos.minus(contact);

                var rest = Math.min(e.restitution, i.restitution),
                    normal = i_contact.normalized(),
                    vel_along_normal = (e.vel.dot(normal) - i.vel.dot(normal));
                
            }
            
            else
                return impacts;
        }

        if (vel_along_normal < 0)
            return impacts;

        var impulse_ie = vel_along_normal*(-(1 + rest));
            impulse_ie /= i.m_inv + e.m_inv;
            impulse_ie = normal.times(impulse_ie);

        impacts.i_to_e.push({
            impulse: impulse_ie,
            contact: i_contact
        });

        impacts.e_to_i.push({
            impulse: impulse_ie.times(-1),
            contact: e_contact
        });

        return impacts;
    }
}

