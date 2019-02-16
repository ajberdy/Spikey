class Physics_Object {
    constructor(scene, pos, vel, w, mass, e) {
        // scene which the object exists in
        this.scene = scene;

        // constant properties
        this.m = mass;
        this.m_inv = 1 / mass;  // for efficiency
        this.restitution = e;

        this.I = 2/3*mass;
        this.I_inv = 1 / this.I;    // for efficiency

        // direct properties
        this.pos = pos;
        this.momentum = vel.times(mass);

        this.orientation = Quaternion.of(1, 0, 0, 0);
        this.L = w.times(this.I);

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

    recalc() {
        this.vel = this.momentum.times(this.m_inv);

        this.w = this.L.times(this.I_inv);
        
        this.spin = Quaternion.of(0, this.w[0], this.w[1], this.w[2]).times(this.orientation.normalized()).times(0.5);
    }

    force(F, r) {
        this.F = this.F.plus(F);
        this.T = this.T.plus(r.cross(F));
    }

    impulse(J, r) {
        console.log("momentum was %s", this.momentum[0]);
        this.momentum = this.momentum.plus(J);
        this.L = this.L.plus(r.cross(J));
        console.log("momentum is now %s", this.momentum[0]);
    }

    update(dt) {

        this.momentum = this.momentum.plus(this.F.times(dt));
        this.L = this.L.plus(this.T.times(dt));

        this.recalc();

        this.pos = this.pos.plus(this.vel.times(dt));
        this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();

//         let a = this.F.times(1/this.m);
//         this.vel = this.vel.plus(a.times(dt));
//         this.pos = this.pos.plus(this.vel.times(dt));
//         this.F = Vec.of(0, 0, 0);

//         let a_ = this.T.times(1/this.I);
//         this.w = this.w.plus(a_.times(dt));
//         this.orientation = this.orientation.plus(this.spin.times(dt)).normalized();
//         console.log(this.orientation);
    }
}


class Ball extends Physics_Object {
    constructor(scene, pos, vel, w, mass, radius, e, material) {
        super(scene, pos, vel, w, mass, e);
        this.mat = material;
        this.r = radius;
        this.I = 2/5*this.m*Math.pow(this.r, 2);
        this.I_inv = 1/ this.I;
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
                    impulse_ie = (e.vel.dot(normal) - i.vel.dot(normal))*(-(1 + rest));
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
            }
        }

        return impacts;
    }
}

