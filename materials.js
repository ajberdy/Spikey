class Material {
    constructor(mu_s, mu_d, e, shader_mat) {
        this.mu_s = mu_s;
        this.mu_d = mu_d;
        this.e = e;
        this.shader_mat = shader_mat;
    }

    static of(mu_s, mu_d, e, shader_mat) {
        return new Material(mu_s, mu_d, e, shader_mat);
    }

    override(properties) {
        const copied = new this.constructor();
        Object.assign(copied, this);
        Object.assign(copied, properties);
        return copied;
    }
}