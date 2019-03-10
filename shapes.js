window.Square = window.classes.Square = class Square extends Shape {
    constructor(color) {
        super("positions", "normals", "texture_coords");
        this.positions.push(     ...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0] ));
        this.normals.push(       ...Vec.cast([ 0,  0, 1], [0,  0, 1], [ 0, 0, 1], [0, 0, 1] ));
        this.texture_coords.push(...Vec.cast([ 0, 0],     [1, 0],     [ 0, 1],    [1, 1]   ));
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

window.MySquare = window.classes.MySquare = class MySquare extends Shape {
    constructor(color) {
        super("positions", "normals", "texture_coords", "colors");
        this.positions.push(     ...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0] ));
        this.normals.push(       ...Vec.cast([ 0,  0, 1], [0,  0, 1], [ 0, 0, 1], [0, 0, 1] ));
        this.texture_coords.push(...Vec.cast([ 0, 0],     [1, 0],     [ 0, 1],    [1, 1]   ));
        this.indices.push(0, 1, 2, 1, 3, 2);
        for (var i in this.positions)
            this.colors.push(color);
    }
}

window.LineSegment = window.classes.LineSegment = class LineSegment extends Shape {
    constructor() {
        super("positions");
        this.positions.push(     ...Vec.cast([0, 0, 0], [0, 1, 0] ));
        this.indices.push(0, 1, 0);
    }
}

window.Vector = window.classes.Vector = class Vector extends Shape {
    constructor() {
        super("positions");
        LineSegment.insert_transformed_copy_into( this, [], Mat4.identity() );

//         this.positions.push(Vec.of(0, 0, 0), Vec.of(1, 0, 0), Vec.of(1, 1, 0));
//         this.indices.push(2, 4, 3);

        
        let head_length = .1,
            angle = Math.PI/8,
            radius = Math.atan(angle) * head_length,
            y = 1 - head_length;

        let n = 8;
        for (var i = 0; i < n; ++i) {
            var theta = 2*(i+1)/n*Math.PI,
                x = radius*Math.sin(theta),
                z = radius*Math.cos(theta);

            this.positions.push(     ...Vec.cast([x, y, z]));

            if (i == n - 1)
                this.indices.push(1, i + 2, 2);
            else
                this.indices.push(1, i + 2, i + 3);
        }
    }
}

window.Circle = window.classes.Circle = class Circle extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([0, 0, 0], [1, 0, 0]));
        this.normals.push(...Vec.cast(  [0, 0, 1], [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([0.5, 0.5], [1, 0.5]));

        for (let i = 0; i < sections; ++i) {
            const angle = 2 * Math.PI * (i + 1) / sections,
                v = Vec.of(Math.cos(angle), Math.sin(angle)),
                id = i + 2;

            this.positions.push(...Vec.cast([v[0], v[1], 0]));
            this.normals.push(...Vec.cast(  [0,    0,    1]));
            this.texture_coords.push(...Vec.cast([(v[0] + 1) / 2, (v[1] + 1) / 2]));
            this.indices.push(
                0, id - 1, id);
        }
    }
}

window.Cube = window.classes.Cube = class Cube extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast(
            [-1,  1, -1], [-1, -1, -1], [ 1,  1, -1], [ 1, -1, -1],
            [-1, -1,  1], [ 1, -1,  1], [-1,  1,  1], [ 1,  1,  1],
            [-1,  1,  1], [ 1,  1,  1], [-1,  1, -1], [ 1,  1, -1],
            [-1, -1, -1], [ 1, -1, -1], [-1, -1,  1], [ 1, -1,  1],
            [-1, -1, -1], [-1, -1,  1], [-1,  1, -1], [-1,  1,  1],
            [ 1, -1, -1], [ 1, -1,  1], [ 1,  1, -1], [ 1,  1,  1] 
        ));

        this.texture_coords.push(...Vec.cast(
            [0,    2/3], [0.25, 2/3], [0,    1/3], [0.25, 1/3],
            [0.5,  2/3], [0.5,  1/3], [0.75, 2/3], [0.75, 1/3],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ]
        )); 

        this.normals.push(...Vec.cast(
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([ 1,  0,  0])
        ));

        this.indices.push(
            0, 2, 1, 1, 2, 3,
            4, 5, 6, 5, 7, 6,
            8, 9, 10, 9, 11, 10,    
            12, 13, 14, 13, 15, 14,
            16, 19, 18, 16, 17, 19,
            20, 22, 21, 21, 22, 23
        );
    }
}


window.SimpleCube = window.classes.SimpleCube = class SimpleCube extends Shape {
    constructor() {
      super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )                    
        for( var j = 0; j < 2; j++ ) {
          var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
      }
    }
}

window.Tetrahedron = window.classes.Tetrahedron = class Tetrahedron extends Shape {
    constructor(using_flat_shading) {
        super("positions", "normals", "texture_coords");
        const s3 = Math.sqrt(3) / 4,
            v1 = Vec.of(Math.sqrt(8/9), -1/3, 0),
            v2 = Vec.of(-Math.sqrt(2/9), -1/3, Math.sqrt(2/3)),
            v3 = Vec.of(-Math.sqrt(2/9), -1/3, -Math.sqrt(2/3)),
            v4 = Vec.of(0, 1, 0);

        this.positions.push(...Vec.cast(
            v1, v2, v3,
            v1, v3, v4,
            v1, v2, v4,
            v2, v3, v4));

        this.normals.push(...Vec.cast(
            ...Array(3).fill(v1.plus(v2).plus(v3).normalized()),
            ...Array(3).fill(v1.plus(v3).plus(v4).normalized()),
            ...Array(3).fill(v1.plus(v2).plus(v4).normalized()),
            ...Array(3).fill(v2.plus(v3).plus(v4).normalized())));

        this.texture_coords.push(...Vec.cast(
            [0.25, s3], [0.75, s3], [0.5, 0], 
            [0.25, s3], [0.5,  0 ], [0,   0],
            [0.25, s3], [0.75, s3], [0.5, 2 * s3], 
            [0.75, s3], [0.5,  0 ], [1,   0]));

        this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
    }
}

window.Cylinder = window.classes.Cylinder = class Cylinder extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([1, 0, 1], [1, 0, -1]));
        this.normals.push(...Vec.cast(  [1, 0, 0], [1, 0,  0]));
        this.texture_coords.push(...Vec.cast([0, 1], [0, 0]));

        for (let i = 0; i < sections; ++i) {
            const ratio = (i + 1) / sections,
                angle = 2 * Math.PI * ratio,
                v = Vec.of(Math.cos(angle), Math.sin(angle)),
                id = 2 * i + 2;

            this.positions.push(...Vec.cast([v[0], v[1], 1], [v[0], v[1], -1]));
            this.normals.push(...Vec.cast(  [v[0], v[1], 0], [v[0], v[1],  0]));
            this.texture_coords.push(...Vec.cast([ratio, 1], [ratio, 0]));
            this.indices.push(
                id, id - 1, id + 1,
                id, id - 1, id - 2);
        }
    }
}

window.Cone = window.classes.Cone = class Cone extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([1, 0, 0]));
        this.normals.push(...Vec.cast(  [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([1, 0.5]));

        let t = Vec.of(0, 0, 1);
        for (let i = 0; i < sections; ++i) {
            const angle = 2 * Math.PI * (i + 1) / sections,
                v = Vec.of(Math.cos(angle), Math.sin(angle), 0),
                id = 2 * i + 1;

            this.positions.push(...Vec.cast(t, v));
            this.normals.push(...Vec.cast(
                v.mix(this.positions[id - 1], 0.5).plus(t).normalized(),
                v.plus(t).normalized()));
            this.texture_coords.push(...Vec.cast([0.5, 0.5], [(v[0] + 1) / 2, (v[1] + 1) / 2]));
            this.indices.push(
                id - 1, id, id + 1);
        }
    }
}


window.Closed_Cone = window.classes.Closed_Cone = class Closed_Cone extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        Cone.insert_transformed_copy_into(this, [sections], Mat4.identity());
        Circle.insert_transformed_copy_into(this, [sections], Mat4.identity());
    }
}

// This Shape defines a Sphere surface, with nice (mostly) uniform triangles.  A subdivision surface
// (see) Wikipedia article on those) is initially simple, then builds itself into a more and more 
// detailed shape of the same layout.  Each act of subdivision makes it a better approximation of 
// some desired mathematical surface by projecting each new point onto that surface's known 
// implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
// face, connect the midpoints of each edge together to make more faces.  Repeat recursively until 
// the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the
// unit sphere) and group them into triangles by following the predictable pattern of the recursion.
window.Subdivision_Sphere = window.classes.Subdivision_Sphere = class Subdivision_Sphere extends Shape {
    constructor(max_subdivisions) {
        super("positions", "normals", "texture_coords");

        // Start from the following equilateral tetrahedron:
        this.positions.push(...Vec.cast([0, 0, -1], [0, .9428, .3333], [-.8165, -.4714, .3333], [.8165, -.4714, .3333]));

        // Begin recursion.
        this.subdivideTriangle(0, 1, 2, max_subdivisions);
        this.subdivideTriangle(3, 2, 1, max_subdivisions);
        this.subdivideTriangle(1, 0, 3, max_subdivisions);
        this.subdivideTriangle(0, 2, 3, max_subdivisions);

        for (let p of this.positions) {
            this.normals.push(p.copy());
            this.texture_coords.push(Vec.of(
                0.5 + Math.atan2(p[2], p[0]) / (2 * Math.PI),
                0.5 - Math.asin(p[1]) / Math.PI));
        }

        // Fix the UV seam by duplicating vertices with offset UV
        let tex = this.texture_coords;
        for (let i = 0; i < this.indices.length; i += 3) {
            const a = this.indices[i], b = this.indices[i + 1], c = this.indices[i + 2];
            if ([[a, b], [a, c], [b, c]].some(x => (Math.abs(tex[x[0]][0] - tex[x[1]][0]) > 0.5))
                && [a, b, c].some(x => tex[x][0] < 0.5))
            {
                for (let q of [[a, i], [b, i + 1], [c, i + 2]]) {
                    if (tex[q[0]][0] < 0.5) {
                        this.indices[q[1]] = this.positions.length;
                        this.positions.push(this.positions[q[0]].copy());
                        this.normals.push(this.normals[q[0]].copy());
                        tex.push(tex[q[0]].plus(Vec.of(1, 0)));
                    }
                }
            }
        }
    }

    subdivideTriangle(a, b, c, count) {
        if (count <= 0) {
            this.indices.push(a, b, c);
            return;
        }

        let ab_vert = this.positions[a].mix(this.positions[b], 0.5).normalized(),
            ac_vert = this.positions[a].mix(this.positions[c], 0.5).normalized(),
            bc_vert = this.positions[b].mix(this.positions[c], 0.5).normalized();

        let ab = this.positions.push(ab_vert) - 1,
            ac = this.positions.push(ac_vert) - 1,
            bc = this.positions.push(bc_vert) - 1;

        this.subdivideTriangle( a, ab, ac, count - 1);
        this.subdivideTriangle(ab,  b, bc, count - 1);
        this.subdivideTriangle(ac, bc,  c, count - 1);
        this.subdivideTriangle(ab, bc, ac, count - 1);
    }
}


window.Spikey_Shape = window.classes.Spikey_Shape = class Spikey_Shape extends Shape {
    constructor(spikey_consts) {
        super("positions", "normals", "texture_coords", "tips");
        Subdivision_Sphere.insert_transformed_copy_into(this, [4], Mat4.scale(1, 1, 1).times(spikey_consts.sphere_radius));

        var spike_vectors = [],
            r = spikey_consts.sphere_radius / Math.sqrt(PHI + 2),
            R = r * PHI;

        for (var s1 = -1; s1 < 2; s1 += 2){
            for (var s2 = -1; s2 < 2; s2 += 2) {
                spike_vectors.push(Vec.of(0, s1*r, s2*R));
                spike_vectors.push(Vec.of(s1*r, s2*R, 0));
                spike_vectors.push(Vec.of(s2*R, 0, s1*r));
            }
        }

        var r2 = Math.sqrt(r**2 + R**2);

        for (var spike of spike_vectors) {

            var x = spike[0],
                y = spike[1],
                z = spike[2];

            var phi = Math.atan(y/Math.sqrt(x**2 + z**2)),
                theta = Math.atan(x/z) + (z < 0 ? PI : 0);

            var spike_rotate_v = Mat4.rotation(phi, Vec.of(-1, 0, 0)),
                spike_rotate_h = Mat4.rotation(theta, Vec.of(0, 1, 0)),
                spike_translate = Mat4.translation(spike.normalized().times(R)),
                spike_scale = Mat4.scale(Vec.of(spikey_consts.spike_base_radius,
                                                spikey_consts.spike_base_radius,
                                                spikey_consts.max_spike_protrusion));


            var transform = spike_translate.times(
                spike_rotate_h).times(
                spike_rotate_v).times(
                spike_scale);

            Cone.insert_transformed_copy_into(this, [20], transform);

            var tip_transform = spike_translate;
            this.tips.push(transform.times(Vec.of(0, 0, 1, 1)));
        }
    }
}