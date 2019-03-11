SHADOW_DEPTH_TEXTURE_SIZE = 2048;


// Subclasses of Shader each store and manage a complete GPU program.  This Shader is 
// the simplest example of one.  It samples pixels from colors that are directly assigned 
// to the vertices.  Materials here are minimal, without any settings.
window.Basic_Shader = window.classes.Basic_Shader = class Basic_Shader extends Shader {
    material() {
        return {
            shader: this
        }
    }
    
    // The shader will pull single entries out of the vertex arrays, by their data fields'
    // names.  Map those names onto the arrays we'll pull them from.  This determines
    // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
    // Vertex buffers in the GPU can get their pointers matched up with pointers to 
    // attribute names in the GPU.  Shapes and Shaders can still be compatible even
    // if some vertex data feilds are unused. 
    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            color: "colors"
        }[name];
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        const PCM = g_state.projection_transform.times(g_state.camera_transform).times(model_transform);
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    }

    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    shared_glsl_code() {
        return `
            precision mediump float;
            varying vec4 VERTEX_COLOR;`;
    }

    // ********* VERTEX SHADER *********
    vertex_glsl_code() {
        return `
            attribute vec4 color;
            attribute vec3 object_space_pos;
            uniform mat4 projection_camera_model_transform;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);

                // Use the hard-coded color of the vertex.
                VERTEX_COLOR = color;
            }`;
    }

    // ********* FRAGMENT SHADER *********
    fragment_glsl_code() {
        return `
            void main() {
                // The interpolation gets done directly on the per-vertex colors.
                gl_FragColor = VERTEX_COLOR;
            }`;
    }
}


window.Physics_Shader = window.classes.Physics_Shader = class Physics_Shader extends Shader {
    // Define an internal class "Material" that stores the standard settings found in Phong lighting.
    material(color) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(1, 0, 0, 1)) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color
                });
            }

        }
        (this,color);
    }
    
    // The shader will pull single entries out of the vertex arrays, by their data fields'
    // names.  Map those names onto the arrays we'll pull them from.  This determines
    // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
    // Vertex buffers in the GPU can get their pointers matched up with pointers to 
    // attribute names in the GPU.  Shapes and Shaders can still be compatible even
    // if some vertex data feilds are unused. 
    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions"
        }[name];
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        const PCM = g_state.projection_transform.times(g_state.camera_transform).times(model_transform);
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));


        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
    }

    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    shared_glsl_code() {
        return `
            precision mediump float;
            varying vec4 VERTEX_COLOR;

            uniform vec4 shapeColor;`;
    }

    // ********* VERTEX SHADER *********
    vertex_glsl_code() {
        return `
            attribute vec4 color;
            attribute vec3 object_space_pos;
            uniform mat4 projection_camera_model_transform;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
                gl_PointSize = 10.;
//                 gl_LineWidth = 10.;

                // Use the hard-coded color of the vertex.
//                 VERTEX_COLOR = color;
                VERTEX_COLOR = shapeColor;
            }`;
    }

    // ********* FRAGMENT SHADER *********
    fragment_glsl_code() {
        return `
            void main() {
                // The interpolation gets done directly on the per-vertex colors.
                gl_FragColor = VERTEX_COLOR;
            }`;
    }
}



window.Light_Shader = window.classes.Light_Shader = class Light_Shader extends Shader {
    constructor(gl) {
        super(gl);
        this.shadowDepthTextureSize = SHADOW_DEPTH_TEXTURE_SIZE;

        this.shadowFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);

        this.shadowDepthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.shadowDepthTextureSize, 
            this.shadowDepthTextureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

        this.renderBuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
            this.shadowDepthTextureSize, this.shadowDepthTextureSize)

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowDepthTexture, 0)
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer)

        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindRenderbuffer(gl.RENDERBUFFER, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    }

    material(color) {
        return new class Material {
            constructor(shader, color=Color.of(1, 0, 0, 1)) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color
                });
            }

        }
        (this, color);
    }

    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions"
        }[name];
    }

    vertex_glsl_code() {
        return `

        attribute vec3 object_space_pos;

//         uniform mat4 projection_camera_model_transform;
//         uniform mat4 LightMatrix;

        uniform mat4 uPMatrix;
        uniform mat4 uMVMatrix;

        void main (void) {
          gl_Position = uPMatrix * uMVMatrix * vec4(object_space_pos, 1.0);
        }
        `;
    }

    fragment_glsl_code() {
        return `

        precision mediump float;

        vec4 encodeFloat (float depth) {
          const vec4 bitShift = vec4(
            256 * 256 * 256,
            256 * 256,
            256,
            1.0
          );
          const vec4 bitMask = vec4(
            0,
            1.0 / 256.0,
            1.0 / 256.0,
            1.0 / 256.0
          );
          vec4 comp = fract(depth * bitShift);
          comp -= comp.xxyz * bitMask;
          return comp;
        }

        void main (void) {
            gl_FragColor = encodeFloat(gl_FragCoord.z);
//             gl_FragColor = vec4(0., 0., 1., 1.);
        }
        `
    }

    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        gl.uniformMatrix4fv(gpu.uPMatrix_loc, false, Mat.flatten_2D_to_1D(g_state.light_projection_transform.transposed()))
//         gl.uniformMatrix4fv(gpu.uMVMatrix_loc, false, Mat.flatten_2D_to_1D(g_state.light_view_matrix))

        gl.uniformMatrix4fv(gpu.uMVMatrix_loc, false, 
            Mat.flatten_2D_to_1D(g_state.light_view_matrix.times(model_transform).transposed()))


//         let light_pos = g_state.lights[0].position,
// //             model_pos = model_transform.times(Vec.of(0, 0, 0, 1)),
//             model_pos = Vec.of(0, 0, 0),
//             up_dir = light_pos.minus(model_pos).cross(model_pos);

//         if (up_dir.dot(up_dir))
//             gl.uniformMatrix4fv(gpu.lightMVMatrix_loc, false, 
//             Mat.flatten_2D_to_1D(Mat4.look_at(light_pos, model_pos, up_dir).transposed()));
        
        


//         const PCM = g_state.projection_transform.times(g_state.camera_transform).times(model_transform);
//         const PLM = g_state.light_projection_transform.times(g_state.light_transform).times(model_transform);
//         gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
//         gl.uniformMatrix4fv(gpu.LightMatrix_loc, false, Mat.flatten_2D_to_1D(PLM.transposed()));
    }
}


window.Camera_Shader = window.classes.Camera_Shader = class Camera_Shader extends Shader {
    load_light_shader(light_shader) {
        this.light_shader = light_shader;
    }
    get shadowDepthTexture() {
        return this.light_shader.shadowDepthTexture;
    }
    get shadowDepthTextureSize() {
        return SHADOW_DEPTH_TEXTURE_SIZE;
    }
    material(color) {
        return new class Material {
            constructor(shader, color=Color.of(1, 0, 0, 1)) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color
                });
            }

            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }

        }
        (this, color);

        
    }

   map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }

    vertex_glsl_code() {
        return `
        attribute vec3 object_space_pos;
        attribute vec2 tex_coord;

//         uniform mat4 projection_camera_model_transform;
//         uniform mat4 LightMatrix;

        uniform mat4 uPMatrix;
        uniform mat4 uMVMatrix;
        uniform mat4 lightPMatrix;
        uniform mat4 lightMVMatrix;

        varying vec2 f_tex_coord;

         const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 
         0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

//         const mat4 texUnitConverter = mat4(1., 0.0, 0.0, 0.0, 0.0, 1., 
//         0.0, 0.0, 0.0, 0.0, 1., 0.0, 1., 1., 1., 1.0);

        varying vec4 shadowPos;

        void main (void) {
           gl_Position = uPMatrix * uMVMatrix * vec4(object_space_pos, 1.0);
//             gl_Position = vec4(object_space_pos, 1.0);

           shadowPos = texUnitConverter * lightPMatrix * lightMVMatrix * vec4(object_space_pos, 1.0);
           f_tex_coord = tex_coord;

        }
        `;
    }

    fragment_glsl_code() {
        return `
        precision mediump float;

        varying vec4 shadowPos;
        varying vec2 f_tex_coord;

        uniform sampler2D depthColorTexture;
        uniform vec3 uColor;

        float decodeFloat (vec4 color) {
          const vec4 bitShift = vec4(
            1.0 / (256.0 * 256.0 * 256.0),
            1.0 / (256.0 * 256.0),
            1.0 / 256.0,
            1
          );
          return dot(color, bitShift);
        }

        void main(void) {
          vec3 fragmentDepth = shadowPos.xyz;
          float shadowAcneRemover = 0.007;
          fragmentDepth.z -= shadowAcneRemover;

          float texelSize = 1.0 / ${this.shadowDepthTextureSize}.0;
          float amountInLight = 0.0;

          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              float texelDepth = decodeFloat(texture2D(depthColorTexture,
              fragmentDepth.xy + vec2(x, y) * texelSize));
              if (fragmentDepth.z < texelDepth) {
                amountInLight += 1.0;
              }
            }
          }
          amountInLight /= 9.0;

          gl_FragColor = vec4(amountInLight * uColor, 1.0);
//           gl_FragColor = shadowPos * .01;
//           gl_FragColor = vec4(fragmentDepth*.008, 1.0);
//           gl_FragColor = texture2D(depthColorTexture, f_tex_coord);
//           gl_FragColor = vec4(uColor, 1.);
//          gl_FragColor = vec4(decodeFloat(texture2D( depthColorTexture, f_tex_coord)) * vec3(1., 0., 1.), 1.0);
//           vec4 tex_color = texture2D( depthColorTexture, shadowPos.xy * vec2(.01, .005) ); 
//            gl_FragColor = vec4( ( tex_color.xyz ), tex_color.w ); 
        }
        `;
    }

    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        gl.uniformMatrix4fv(gpu.uPMatrix_loc, false, 
            Mat.flatten_2D_to_1D(g_state.projection_transform.transposed()));
        gl.uniformMatrix4fv(gpu.uMVMatrix_loc, false,
            Mat.flatten_2D_to_1D(g_state.camera_transform.times(model_transform).transposed()))

        gl.uniformMatrix4fv(gpu.lightPMatrix_loc, false, 
            Mat.flatten_2D_to_1D(g_state.light_projection_transform.transposed()));
        gl.uniformMatrix4fv(gpu.lightMVMatrix_loc, false, 
            Mat.flatten_2D_to_1D(g_state.light_view_matrix.times(model_transform).transposed()));


//         console.log(g_state.light_projection_transform.times(g_state.light_view_matrix.times(model_transform)));
       
        gl.uniform3fv(gpu.uColor_loc, material.color.to3())

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture);
        gl.uniform1i(gpu.depthColorTexture_loc, 0);
    }
}

window.Phong_Shadow_Shader = window.classes.Phong_Shadow_Shader = class Phong_Shadow_Shader extends Camera_Shader {
    material(color, properties) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness
                });

                // Optionally override defaults.
                Object.assign(this, properties);
            }

            // Easily make temporary overridden versions of a base material, such as
            // of a different color or diffusivity.  Use "opacity" to override only that.
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }

    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }

    shared_glsl_code() 
    {
        return `
            precision mediump float;

            // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
            const int N_LIGHTS = 2;
            uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];

            // Flags for alternate shading methods
            uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;
            uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
            
            // Specifier "varying" means a variable's final value will be passed from the vertex shader
            // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).       
            varying vec3 N, E;                     
            varying vec2 f_tex_coord;             
            varying vec4 VERTEX_COLOR;            
            varying vec3 L[N_LIGHTS];
            varying float dist[N_LIGHTS];

            vec3 phong_model_lights( vec3 N ) {
                vec3 result = vec3(0.0);
                for(int i = 0; i < N_LIGHTS; i++) {
                    vec3 H = normalize( L[i] + E );
                    
                    float attenuation_multiplier = 1.0;// / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                    float diffuse  =      max( dot(N, L[i]), 0.0 );
                    float specular = pow( max( dot(N, H), 0.0 ), smoothness );

                    result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
                }
                return result;
            }`;
    }

    vertex_glsl_code() {
        return `
            attribute vec3 object_space_pos, normal;
            attribute vec2 tex_coord;

            uniform mat4 uPMatrix;
            uniform mat4 uMVMatrix;
            uniform mat4 lightPMatrix;
            uniform mat4 lightMVMatrix;

            const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 
                0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
            varying vec4 shadowPos;


            uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
            uniform mat3 inverse_transpose_modelview;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
                
                // The final normal vector in screen space.
                N = normalize( inverse_transpose_modelview * normal );
                
                // Directly use original texture coords and interpolate between.
                f_tex_coord = tex_coord;

                // Bypass all lighting code if we're lighting up vertices some other way.
                if( COLOR_NORMALS ) {
                    // In "normals" mode, rgb color = xyz quantity. Flash if it's negative.
                    VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             
                                         N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],
                                         N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );
                    return;
                }
                
                // The rest of this shader calculates some quantities that the Fragment shader will need:
                vec3 camera_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
                E = normalize( -camera_space_pos );

                // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
                for( int i = 0; i < N_LIGHTS; i++ ) {
                    L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * camera_space_pos );

                    // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
                    dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, camera_space_pos)
                                                        : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
                }

                // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader,
                // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
                if( GOURAUD ) {
                    VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
                    VERTEX_COLOR.xyz += phong_model_lights( N );
                }
                shadowPos = texUnitConverter * lightPMatrix * lightMVMatrix * vec4(object_space_pos, 1.0);
            }`;
    }

    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    fragment_glsl_code() {
        return `
            varying vec4 shadowPos;

            uniform sampler2D depthColorTexture;
            uniform vec3 uColor;

            uniform sampler2D texture;

            float decodeFloat (vec4 color) {
              const vec4 bitShift = vec4(
                1.0 / (256.0 * 256.0 * 256.0),
                1.0 / (256.0 * 256.0),
                1.0 / 256.0,
                1
              );
              return dot(color, bitShift);
            }

            vec4 phong() {
                vec4 color;
                // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
                // Otherwise, we already have final colors to smear (interpolate) across vertices.
                if( GOURAUD || COLOR_NORMALS ) {
                    color = VERTEX_COLOR;
                    return color;
                }                                 
                // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                // Phong shading is not to be confused with the Phong Reflection Model.

                // Sample the texture image in the correct place.
                vec4 tex_color = texture2D( texture, f_tex_coord );                    

                // Compute an initial (ambient) color:
                if( USE_TEXTURE )
                    color = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
                else
                    color = vec4( shapeColor.xyz * ambient, shapeColor.w );
                
                // Compute the final color with contributions from lights.
                color.xyz += phong_model_lights( N );

                return color;
            }


            void main(void) {
              vec3 fragmentDepth = shadowPos.xyz;
              float shadowAcneRemover = 0.007;
              fragmentDepth.z -= shadowAcneRemover;

              float texelSize = 1.0 / ${this.shadowDepthTextureSize}.0;
              float amountInLight = 0.0;

              for (int x = -1; x <= 1; x++) {
                for (int y = -1; y <= 1; y++) {
                  float texelDepth = decodeFloat(texture2D(depthColorTexture,
                  fragmentDepth.xy + vec2(x, y) * texelSize));
                  if (fragmentDepth.z < texelDepth) {
                    amountInLight += 1.0;
                  }
                }
              }
              amountInLight /= 9.0;

              vec4 phong_color = phong();
              gl_FragColor = vec4(amountInLight * phong_color.xyz, phong_color.w);
            }
        `;
    }

    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        super.update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl)

        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }

        // Keep the flags seen by the shader program up-to-date and make sure they are declared.
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);

        // Send the desired shape-wide material qualities to the graphics card, where they will
        // tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
        gl.uniform1f( gpu.ambient_loc,     material.ambient);
        gl.uniform1f( gpu.diffusivity_loc, material.diffusivity);
        gl.uniform1f( gpu.specularity_loc, material.specularity);
        gl.uniform1f( gpu.smoothness_loc,  material.smoothness);

        // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        if (material.texture) {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        }
        else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = [],
            lightColors_flattened = [],
            lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);


//         let light_pos = g_state.lights[0].position,
// //             model_pos = model_transform.times(Vec.of(0, 0, 0, 1)),
//             model_pos = Vec.of(0, 0, 0),
//             up_dir = light_pos.minus(model_pos).cross(model_pos);

//         if (up_dir.dot(up_dir))
//             gl.uniformMatrix4fv(gpu.lightMVMatrix_loc, false, 
//                 Mat.flatten_2D_to_1D(Mat4.look_at(light_pos, model_pos, up_dir).transposed()));
    }

    // Helper function for sending matrices to GPU.
    update_matrices(g_state, model_transform, gpu, gl) {
        // (PCM will mean Projection * Camera * Model)
        let [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
            CM = C.times(M),
            PCM = P.times(CM),
            inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.                                  
        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

window.Perlin_Shader = window.classes.Perlin_Shader = class Perlin_Shader extends Camera_Shader {
    material(color, properties) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40, shadows=true,
                do_perlin = true, color1=Color.of(0, 0, 0, 1), scale1=0, freq1=1, color2=Color.of(0, 0, 0, 1), scale2=0,
                freq2=1, scaleb=1, freq_global=1) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness,
                    shadows,
                    do_perlin,
                    color1,
                    scale1,
                    freq1,
                    color2,
                    scale2,
                    freq2,
                    scaleb,
                    freq_global
                });

                // Optionally override defaults.
                Object.assign(this, properties);
            }

            // Easily make temporary overridden versions of a base material, such as
            // of a different color or diffusivity.  Use "opacity" to override only that.
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }

    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }

    shared_glsl_code() 
    {
        return `
            precision mediump float;

            // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
            const int N_LIGHTS = 2;
            uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];

            // Flags for alternate shading methods
            uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;
            uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
            
            // Specifier "varying" means a variable's final value will be passed from the vertex shader
            // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).       
            varying vec3 N, E;                     
            varying vec2 f_tex_coord;             
            varying vec4 VERTEX_COLOR;            
            varying vec3 L[N_LIGHTS];
            varying float dist[N_LIGHTS];

            vec3 phong_model_lights( vec3 N ) {
                vec3 result = vec3(0.0);
                for(int i = 0; i < N_LIGHTS; i++) {
                    vec3 H = normalize( L[i] + E );
                    
                    float attenuation_multiplier = 1.0;// / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                    float diffuse  =      max( dot(N, L[i]), 0.0 );
                    float specular = pow( max( dot(N, H), 0.0 ), smoothness );

                    result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
                }
                return result;
            }`;
    }

    vertex_glsl_code() {
        return `
            attribute vec3 object_space_pos, normal;
            attribute vec2 tex_coord;

            uniform mat4 uPMatrix;
            uniform mat4 uMVMatrix;
            uniform mat4 lightPMatrix;
            uniform mat4 lightMVMatrix;

            const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 
                0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
            varying vec4 shadowPos;


            uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
            uniform mat3 inverse_transpose_modelview;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
                
                // The final normal vector in screen space.
                N = normalize( inverse_transpose_modelview * normal );
                
                // Directly use original texture coords and interpolate between.
                f_tex_coord = tex_coord;

                // Bypass all lighting code if we're lighting up vertices some other way.
                if( COLOR_NORMALS ) {
                    // In "normals" mode, rgb color = xyz quantity. Flash if it's negative.
                    VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             
                                         N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],
                                         N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );
                    return;
                }
                
                // The rest of this shader calculates some quantities that the Fragment shader will need:
                vec3 camera_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
                E = normalize( -camera_space_pos );

                // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
                for( int i = 0; i < N_LIGHTS; i++ ) {
                    L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * camera_space_pos );

                    // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
                    dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, camera_space_pos)
                                                        : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
                }

                // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader,
                // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
                if( GOURAUD ) {
                    VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
                    VERTEX_COLOR.xyz += phong_model_lights( N );
                }
                shadowPos = texUnitConverter * lightPMatrix * lightMVMatrix * vec4(object_space_pos, 1.0);
            }`;
    }

    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    fragment_glsl_code() {
        return `
            varying vec4 shadowPos;

            uniform sampler2D depthColorTexture;
            uniform vec3 uColor;
            uniform bool shadows, do_perlin;

            uniform float scale1, scale2, scaleb, freq1, freq2, freq_global;
            uniform vec4 color1, color2, backdrop;

            uniform sampler2D texture;

            float decodeFloat (vec4 color) {
              const vec4 bitShift = vec4(
                1.0 / (256.0 * 256.0 * 256.0),
                1.0 / (256.0 * 256.0),
                1.0 / 256.0,
                1
              );
              return dot(color, bitShift);
            }

            vec4 phong(vec4 color) {
                // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
                // Otherwise, we already have final colors to smear (interpolate) across vertices.
                if( GOURAUD || COLOR_NORMALS ) {
                    color = VERTEX_COLOR;
                    return color;
                }                                 
                // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                // Phong shading is not to be confused with the Phong Reflection Model.

                // Sample the texture image in the correct place.
                vec4 tex_color = texture2D( texture, f_tex_coord );                    

                // Compute an initial (ambient) color:
                if( USE_TEXTURE )
                    color = vec4( ( tex_color.xyz + color.xyz ) * ambient, tex_color.w * color.w ); 
                else
                    color = vec4( color.xyz * ambient, color.w );
                
                // Compute the final color with contributions from lights.
                color.xyz += phong_model_lights( N );

                return color;
            }

            #define NOISE_PASSES 6

             float Hash(in float n)
             {
                 return fract(sin(n)*43758.5453123);
             }

             float Noise(in vec2 x)
             {
                 vec2 p = floor(x);
                 vec2 f = fract(x);
                 f = f*f*(3.0-2.0*f);
                 float n = p.x + p.y*57.0;
                 float res = mix(mix( Hash(n+  0.0), Hash(n+  1.0),f.x),
                                 mix( Hash(n+ 57.0), Hash(n+ 58.0),f.x),f.y);
                 return res;
             }

             //	FAST32_hash
             //	A very fast hashing function.  Requires 32bit support.
             //	http://briansharpe.wordpress.com/2011/11/15/a-fast-and-simple-32bit-floating-point-hash-function/
             void FAST32_hash_2D( vec2 gridcell, out vec4 hash_0, out vec4 hash_1 )
             {
                // gridcell is assumed to be an integer coordinate
                const vec2 OFFSET = vec2( 26.0, 61.0 );
                const float DOMAIN = 71.0;
                const vec2 SOMELARGEFLOATS = vec2( 2356.121616126, 982.126616 );
                vec4 P = vec4( gridcell.xy, gridcell.xy + 1.0 );
                P = P - floor(P * ( 1.0 / DOMAIN )) * DOMAIN;
                P += OFFSET.xyxy;
                P *= P;
                P = P.xzxz * P.yyww;
                hash_0 = fract( P * ( 1.0 / SOMELARGEFLOATS.x ) );
                hash_1 = fract( P * ( 1.0 / SOMELARGEFLOATS.y ) );
             }

             vec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }

             //	Perlin Noise 2D  ( gradient noise )
             //	Return value range of -1.0->1.0
             //	http://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg
             float Perlin2D( vec2 P )
             {
                 //	establish our grid cell and unit position
                 vec2 Pi = floor(P);
                 vec4 Pf_Pfmin1 = P.xyxy - vec4( Pi, Pi + 1.0 );

                 //	calculate the hash.
                 vec4 hash_x, hash_y;
                 FAST32_hash_2D( Pi, hash_x, hash_y );

                 //	calculate the gradient results
                 vec4 grad_x = hash_x - 0.49999;
                 vec4 grad_y = hash_y - 0.49999;
                 vec4 grad_results = inversesqrt( grad_x * grad_x + grad_y * grad_y ) * ( grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww );

                 //	Classic Perlin Interpolation
                 grad_results *= 1.4128755925912787125195287;
                 vec2 blend = Interpolation_C2( Pf_Pfmin1.xy );
                 vec4 blend2 = vec4( blend, vec2( 1.0 - blend ) );
                 return dot( grad_results, blend2.zxzx * blend2.wwyy );
             }

             // Octave transform matrix from Alexander Alekseev aka TDM 
                mat2 octave_m = mat2(1.8,1.2,-1.2,1.8);

                // FBM Noise - mixing Value noise and Perlin Noise - also ridged turbulence at smaller octaves
                float FractalNoise(in vec2 xy)
                {
                   float m = 1.00;
                   float w = 0.6;
                   float f = 0.0;
                   float time = animation_time*1.0;
                   for (int i = 0; i < NOISE_PASSES; i++)
                   {
                      f += Noise(xy.xy+time*0.755) * m * 0.25;
                      if (i < 3)
                      {
                         f += Perlin2D(xy.yx-sin(time)*0.533) * w * 0.1;
                      }
                      else
                      {
                         // ridged turbulence at smaller scales - moves 4x faster
                         f += abs(Perlin2D(xy.yx-sin(time)*1.932) * w * 0.05)*1.75;
                      }
                      w *= 0.45;
                      m *= 0.35;
                      xy *= octave_m;
                   }
                   return f * (abs(sin(1.0-time * 0.025)) * 0.5 + 0.5) * (1.0*0.5);  // modulate overall noise
                }

            vec4 perlin(float u, float v) {
                u *= freq_global;
                v *= freq_global;

                return scale1 * color1 * FractalNoise(freq1 * vec2(u, v)) + 
                       scale2 * color2 * FractalNoise(freq2 * vec2(u, v)) + 
                       scaleb * shapeColor;
            }

            void main(void) {
              vec3 fragmentDepth = shadowPos.xyz;
              float shadowAcneRemover = 0.007;
              fragmentDepth.z -= shadowAcneRemover;

              float texelSize = 1.0 / ${this.shadowDepthTextureSize}.0;
              float amountInLight = 0.0;

              vec4 perlin_color;
              if (!do_perlin)
                  perlin_color = shapeColor;
              else
                  perlin_color = perlin(f_tex_coord.x, f_tex_coord.y);
              vec4 phong_color = phong(perlin_color);

              if (!shadows || length(shadowPos.xy) > 1.) {
                  gl_FragColor = phong_color;
                  return;
              }

              for (int x = -1; x <= 1; x++) {
                for (int y = -1; y <= 1; y++) {
                  float texelDepth = decodeFloat(texture2D(depthColorTexture,
                  fragmentDepth.xy + vec2(x, y) * texelSize));
                  if (fragmentDepth.z < texelDepth) {
                    amountInLight += 1.0;
                  }
                }
              }
              amountInLight /= 9.0;

              gl_FragColor = vec4(amountInLight * phong_color.xyz, phong_color.w);
            }
        `;
    }

    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        super.update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl)

        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }

        // Keep the flags seen by the shader program up-to-date and make sure they are declared.
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);

        // Send the desired shape-wide material qualities to the graphics card, where they will
        // tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
        gl.uniform1f( gpu.ambient_loc,     material.ambient);
        gl.uniform1f( gpu.diffusivity_loc, material.diffusivity);
        gl.uniform1f( gpu.specularity_loc, material.specularity);
        gl.uniform1f( gpu.smoothness_loc,  material.smoothness);
        gl.uniform1f( gpu.shadows_loc,     g_state.shadows);
        gl.uniform1f( gpu.do_perlin_loc,      g_state.perlin && material.do_perlin);

        // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        if (material.texture) {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        }
        else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = true;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = [],
            lightColors_flattened = [],
            lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);

        if (material.do_perlin) {
            gl.uniform4fv(gpu.color1_loc, material.color1);
        gl.uniform4fv(gpu.color2_loc, material.color2);
        gl.uniform1f(gpu.scale1_loc, material.scale1);
        gl.uniform1f(gpu.scale1_loc, material.scale2);
        gl.uniform1f(gpu.scaleb_loc, material.scaleb);
        gl.uniform1f(gpu.freq1_loc, material.freq1);
        gl.uniform1f(gpu.freq2_loc, material.freq2);
        gl.uniform1f(gpu.freq_global_loc, material.freq_global);
        }
        



//         let light_pos = g_state.lights[0].position,
// //             model_pos = model_transform.times(Vec.of(0, 0, 0, 1)),
//             model_pos = Vec.of(0, 0, 0),
//             up_dir = light_pos.minus(model_pos).cross(model_pos);

//         if (up_dir.dot(up_dir))
//             gl.uniformMatrix4fv(gpu.lightMVMatrix_loc, false, 
//                 Mat.flatten_2D_to_1D(Mat4.look_at(light_pos, model_pos, up_dir).transposed()));
    }

    // Helper function for sending matrices to GPU.
    update_matrices(g_state, model_transform, gpu, gl) {
        // (PCM will mean Projection * Camera * Model)
        let [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
            CM = C.times(M),
            PCM = P.times(CM),
            inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.                                  
        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

window.Perlin_Shader_ = window.classes.Perlin_Shader_ = class Perlin_Shader_ extends Shader {
    material(color, properties) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40,
                shadows=true) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness,
                    shadows
                });

                // Optionally override defaults.
                Object.assign(this, properties);
            }

            // Easily make temporary overridden versions of a base material, such as
            // of a different color or diffusivity.  Use "opacity" to override only that.
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }

    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }

    shared_glsl_code()
      { return `
          precision mediump float;
          const int N_LIGHTS = 2;                                                         // Be sure to keep this line up to date as you add more lights
          uniform float ambient, diffusivity, shininess, smoothness, animation_time, attenuation_factor[N_LIGHTS];
          uniform bool GOURAUD, COLOR_NORMALS, COLOR_VERTICES, USE_TEXTURE;               // Flags for alternate shading methods
          uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
          varying vec3 N, E, screen_space_pos;            // Spefifier "varying" means it will be passed from the vertex shader on to the fragment shader,
          varying vec2 f_tex_coord;                       // then interpolated per-fragment, weighted by the pixel fragment's proximity to each of the 3 vertices.
          varying vec4 VERTEX_COLOR;
          varying vec3 L[N_LIGHTS], H[N_LIGHTS];
          varying float dist[N_LIGHTS];

          vec3 phong_model_lights( vec3 N )
            { vec3 result = vec3(0.0);
              for(int i = 0; i < N_LIGHTS; i++)
                {
                  float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                  float diffuse  =      max( dot(N, L[i]), 0.0 );
                  float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                  result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
                }
              return result;
            }
          `;
      }

    vertex_glsl_code()
      { return `
          attribute vec4 color;
          attribute vec3 object_space_pos, normal;
          attribute vec2 tex_coord;

          uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
          uniform mat3 inverse_transpose_modelview;

          void main()
          { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);      // The vertex's final resting place onscreen in normalized coords.
            N = normalize( inverse_transpose_modelview * normal );                              // The final normal vector in screen space.
            f_tex_coord = tex_coord;                                                            // Directly use original texture coords to make a "varying" texture coord.

            if( COLOR_NORMALS || COLOR_VERTICES )                                               // Bypass all lighting code if we're lighting up vertices some other way.
            { VERTEX_COLOR   = COLOR_NORMALS ? ( vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In normals mode, rgb color = xyz quantity.
                                                       N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // Flash if it's negative.
                                                       N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 ) ) : color;
              return;
            }
                                                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
            screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
            E = normalize( -screen_space_pos );

            for( int i = 0; i < N_LIGHTS; i++ )
            {
              L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );   // Use w = 0 for a directional light source -- a
              H[i] = normalize( L[i] + E );                                                                              // vector instead of a point.
                                                      // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
              dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                  : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
            }

            if( GOURAUD )         // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, one per vertex, before we even
            {                     // break it down to pixels in the fragment shader.   As opposed to Smooth "Phong" Shading, where we do calculate it afterwards.
              VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
              VERTEX_COLOR.xyz += phong_model_lights( N );
            }
          }`;
      }    

    fragment_glsl_code()
      { return `
         #define NOISE_PASSES 6

         float Hash(in float n)
         {
             return fract(sin(n)*43758.5453123);
         }

         float Noise(in vec2 x)
         {
             vec2 p = floor(x);
             vec2 f = fract(x);
             f = f*f*(3.0-2.0*f);
             float n = p.x + p.y*57.0;
             float res = mix(mix( Hash(n+  0.0), Hash(n+  1.0),f.x),
                             mix( Hash(n+ 57.0), Hash(n+ 58.0),f.x),f.y);
             return res;
         }

         //	FAST32_hash
         //	A very fast hashing function.  Requires 32bit support.
         //	http://briansharpe.wordpress.com/2011/11/15/a-fast-and-simple-32bit-floating-point-hash-function/
         void FAST32_hash_2D( vec2 gridcell, out vec4 hash_0, out vec4 hash_1 )
         {
            // gridcell is assumed to be an integer coordinate
            const vec2 OFFSET = vec2( 26.0, 161.0 );
            const float DOMAIN = 71.0;
            const vec2 SOMELARGEFLOATS = vec2( 951.135664, 642.949883 );
            vec4 P = vec4( gridcell.xy, gridcell.xy + 1.0 );
            P = P - floor(P * ( 1.0 / DOMAIN )) * DOMAIN;
            P += OFFSET.xyxy;
            P *= P;
            P = P.xzxz * P.yyww;
            hash_0 = fract( P * ( 1.0 / SOMELARGEFLOATS.x ) );
            hash_1 = fract( P * ( 1.0 / SOMELARGEFLOATS.y ) );
         }

         vec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }

         //	Perlin Noise 2D  ( gradient noise )
         //	Return value range of -1.0->1.0
         //	http://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg
         float Perlin2D( vec2 P )
         {
             //	establish our grid cell and unit position
             vec2 Pi = floor(P);
             vec4 Pf_Pfmin1 = P.xyxy - vec4( Pi, Pi + 1.0 );

             //	calculate the hash.
             vec4 hash_x, hash_y;
             FAST32_hash_2D( Pi, hash_x, hash_y );

             //	calculate the gradient results
             vec4 grad_x = hash_x - 0.49999;
             vec4 grad_y = hash_y - 0.49999;
             vec4 grad_results = inversesqrt( grad_x * grad_x + grad_y * grad_y ) * ( grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww );

             //	Classic Perlin Interpolation
             grad_results *= 1.4142135623730950488016887242097;
             vec2 blend = Interpolation_C2( Pf_Pfmin1.xy );
             vec4 blend2 = vec4( blend, vec2( 1.0 - blend ) );
             return dot( grad_results, blend2.zxzx * blend2.wwyy );
         }

         // Octave transform matrix from Alexander Alekseev aka TDM 
            mat2 octave_m = mat2(1.8,1.2,-1.2,1.8);

            // FBM Noise - mixing Value noise and Perlin Noise - also ridged turbulence at smaller octaves
            float FractalNoise(in vec2 xy)
            {
               float m = 1.00;
               float w = 0.6;
               float f = 0.0;
               float time = animation_time*1.0;
               for (int i = 0; i < NOISE_PASSES; i++)
               {
                  f += Noise(xy.xy+time*0.755) * m * 0.25;
                  if (i < 3)
                  {
                     f += Perlin2D(xy.yx-time*0.533) * w * 0.1;
                  }
                  else
                  {
                     // ridged turbulence at smaller scales - moves 4x faster
                     f += abs(Perlin2D(xy.yx-time*1.932) * w * 0.05)*1.75;
                  }
                  w *= 0.45;
                  m *= 0.35;
                  xy *= octave_m;
               }
               return f * (abs(sin(1.0-time * 0.025)) * 0.5 + 0.5) * (1.0*0.5);  // modulate overall noise
            }

       float DistWater(vec3 pos)
            {
            return dot(pos-vec3(0.0,-FractalNoise(pos.xz),0.0), vec3(1.0,1.,0.0));
            }

        void main()
        {
          float a = animation_time, u = f_tex_coord.x, v = f_tex_coord.y;

          gl_FragColor = vec4(1., 0., 0., 1.);
          return;

         gl_FragColor = vec4(.76, .60, .5, .6) * 3.0*FractalNoise(20.0*vec2(u, v))  + 1.5*vec4(0.91, 0.9, 0.335, .2) + 
                        10.0*vec4(.0, .0, 0., .6) * 0.5*FractalNoise(180.0*vec2(u,v));
         return;

         gl_FragColor = vec4(0.0, 0.0, 0.0, .6);
          for (int i = 0; i < 1; i++) {
                  float k = float(i);
                  gl_FragColor += vec4(0.0, 0.0, DistWater(vec3(u, v, 40.0*sin(.2*animation_time - u) + 
                       30.0*sin(.2*animation_time - .4*v))), .3);
          }
//              gl_FragColor = vec4(0.0, 0.0, DistWater(vec3(u, v, 40.0*sin(.2*animation_time - u) + 
//              30.0*sin(.2*animation_time - .4*v))), 1.0);

        }`;
    }

    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        super.update_GPU(g_state, model_transform, material, gpu, gl)

        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }

        // Keep the flags seen by the shader program up-to-date and make sure they are declared.
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);

        // Send the desired shape-wide material qualities to the graphics card, where they will
        // tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
        gl.uniform1f( gpu.ambient_loc,     material.ambient);
        gl.uniform1f( gpu.diffusivity_loc, material.diffusivity);
        gl.uniform1f( gpu.specularity_loc, material.specularity);
        gl.uniform1f( gpu.smoothness_loc,  material.smoothness);

        // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        if (material.texture) {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        }
        else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = [],
            lightColors_flattened = [],
            lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);


//         let light_pos = g_state.lights[0].position,
// //             model_pos = model_transform.times(Vec.of(0, 0, 0, 1)),
//             model_pos = Vec.of(0, 0, 0),
//             up_dir = light_pos.minus(model_pos).cross(model_pos);

//         if (up_dir.dot(up_dir))
//             gl.uniformMatrix4fv(gpu.lightMVMatrix_loc, false, 
//                 Mat.flatten_2D_to_1D(Mat4.look_at(light_pos, model_pos, up_dir).transposed()));
    }

    // Helper function for sending matrices to GPU.
    update_matrices(g_state, model_transform, gpu, gl) {
        // (PCM will mean Projection * Camera * Model)
        let [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
            CM = C.times(M),
            PCM = P.times(CM),
            inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.                                  
        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

// THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading. 
// Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store 
// and manage a complete GPU program.  This particular one is a big "master shader" meant to 
// handle all sorts of lighting situations in a configurable way. 
// Phong Shading is the act of determining brightness of pixels via vector math.  It compares
// the normal vector at that pixel to the vectors toward the camera and light sources.
//
// *** How Shaders Work:
// The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime, 
// where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw 
// shapes will launch the vertex shader program once per vertex in the shape (three times per 
// triangle), sending results on to the next phase.  The purpose of this vertex shader program 
// is to calculate the final resting place of vertices in screen coordinates; each vertex 
// starts out in local object coordinates and then undergoes a matrix transform to get there.
//
// Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets 
// sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a 
// triangle / element finish their vertex shader programs, and thus have finished finding out 
// where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment) 
// overlapping where the triangle landed.  It retrieves different values (such as vectors) that 
// are stored at three extreme points of the triangle, and then interpolates the values weighted 
// by the pixel's proximity to each extreme point, using them in formulas to determine color.
// The fragment colors may or may not become final pixel colors; there could already be other 
// triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the 
// new triangle is closer to the camera, and even if so, blending settings may interpolate some 
// of the old color into the result.  Finally, an image is displayed onscreen.
window.Phong_Shader = window.classes.Phong_Shader = class Phong_Shader extends Shader {

    // Define an internal class "Material" that stores the standard settings found in Phong lighting.
    material(color, properties) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness
                });

                // Optionally override defaults.
                Object.assign(this, properties);
            }

            // Easily make temporary overridden versions of a base material, such as
            // of a different color or diffusivity.  Use "opacity" to override only that.
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }

    // We'll pull single entries out per vertex by field name.  Map
    // those names onto the vertex array names we'll pull them from.
    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }
    
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    shared_glsl_code() 
    {
        return `
            precision mediump float;

            // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
            const int N_LIGHTS = 2;
            uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];

            // Flags for alternate shading methods
            uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;
            uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
            
            // Specifier "varying" means a variable's final value will be passed from the vertex shader
            // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).       
            varying vec3 N, E;                     
            varying vec2 f_tex_coord;             
            varying vec4 VERTEX_COLOR;            
            varying vec3 L[N_LIGHTS];
            varying float dist[N_LIGHTS];

            vec3 phong_model_lights( vec3 N ) {
                vec3 result = vec3(0.0);
                for(int i = 0; i < N_LIGHTS; i++) {
                    vec3 H = normalize( L[i] + E );
                    
                    float attenuation_multiplier = 1.0;// / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                    float diffuse  =      max( dot(N, L[i]), 0.0 );
                    float specular = pow( max( dot(N, H), 0.0 ), smoothness );

                    result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
                }
                return result;
            }`;
    }

    // ********* VERTEX SHADER *********
    vertex_glsl_code() {
        return `
            attribute vec3 object_space_pos, normal;
            attribute vec2 tex_coord;

            uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
            uniform mat3 inverse_transpose_modelview;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
                
                // The final normal vector in screen space.
                N = normalize( inverse_transpose_modelview * normal );
                
                // Directly use original texture coords and interpolate between.
                f_tex_coord = tex_coord;

                // Bypass all lighting code if we're lighting up vertices some other way.
                if( COLOR_NORMALS ) {
                    // In "normals" mode, rgb color = xyz quantity. Flash if it's negative.
                    VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             
                                         N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],
                                         N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );
                    return;
                }
                
                // The rest of this shader calculates some quantities that the Fragment shader will need:
                vec3 camera_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
                E = normalize( -camera_space_pos );

                // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
                for( int i = 0; i < N_LIGHTS; i++ ) {
                    L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * camera_space_pos );

                    // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
                    dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, camera_space_pos)
                                                        : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
                }

                // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader,
                // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
                if( GOURAUD ) {
                    VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
                    VERTEX_COLOR.xyz += phong_model_lights( N );
                }
            }`;
    }

    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    fragment_glsl_code() {
        return `
            uniform sampler2D texture;

            void main() {
                // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
                // Otherwise, we already have final colors to smear (interpolate) across vertices.
                if( GOURAUD || COLOR_NORMALS ) {
                    gl_FragColor = VERTEX_COLOR;
                    return;
                }                                 
                // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                // Phong shading is not to be confused with the Phong Reflection Model.

                // Sample the texture image in the correct place.
                vec4 tex_color = texture2D( texture, f_tex_coord );                    

                // Compute an initial (ambient) color:
                if( USE_TEXTURE )
                    gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
                else
                    gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
                
                // Compute the final color with contributions from lights.
                gl_FragColor.xyz += phong_model_lights( N );
            }`;
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {

        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }

        // Keep the flags seen by the shader program up-to-date and make sure they are declared.
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);

        // Send the desired shape-wide material qualities to the graphics card, where they will
        // tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
        gl.uniform1f( gpu.ambient_loc,     material.ambient);
        gl.uniform1f( gpu.diffusivity_loc, material.diffusivity);
        gl.uniform1f( gpu.specularity_loc, material.specularity);
        gl.uniform1f( gpu.smoothness_loc,  material.smoothness);

        // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        if (material.texture) {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        }
        else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = [],
            lightColors_flattened = [],
            lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
    }

    // Helper function for sending matrices to GPU.
    update_matrices(g_state, model_transform, gpu, gl) {
        // (PCM will mean Projection * Camera * Model)
        let [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
            CM = C.times(M),
            PCM = P.times(CM),
            inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.                                  
        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

// Movement_Controls is a Scene_Component that can be attached to a canvas, like any 
// other Scene, but it is a Secondary Scene Component -- meant to stack alongside other
// scenes.  Rather than drawing anything it embeds both first-person and third-person
// style controls into the website.  These can be uesd to manually move your camera or
// other objects smoothly through your scene using key, mouse, and HTML button controls
// to help you explore what's in it.
window.Movement_Controls = window.classes.Movement_Controls = class Movement_Controls extends Scene_Component {
    constructor(context, control_box, canvas=context.canvas) {
        super(context, control_box);
        
        // Data members
        [this.context,this.roll,this.look_around_locked,this.invert] = [context, 0, true, true];
        [this.thrust,this.pos,this.z_axis] = [Vec.of(0, 0, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0)];

        // The camera matrix is not actually stored here inside Movement_Controls; instead, track
        // an external matrix to modify. This target is a reference (made with closures) kept
        // in "globals" so it can be seen and set by other classes.  Initially, the default target
        // is the camera matrix that Shaders use, stored in the global graphics_state object.
        this.target = function() {
            return context.globals.movement_controls_target()
        };
        context.globals.movement_controls_target = function(t) {
            return context.globals.graphics_state.camera_transform
        };
        context.globals.movement_controls_invert = this.will_invert = ()=>true;
        context.globals.has_controls = true;

        [this.radians_per_frame,this.meters_per_frame,this.speed_multiplier] = [1 / 200, 20, 1];

        // *** Mouse controls: ***
        this.mouse = { "from_center": Vec.of(0, 0) };

        // Measure mouse steering, for rotating the flyaround camera:
        const mouse_position = ( e, rect=canvas.getBoundingClientRect() ) => Vec.of(
            e.clientX - (rect.left + rect.right) / 2,
            e.clientY - (rect.bottom + rect.top) / 2);

        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
        document.addEventListener("mouseup", e=>{
            this.mouse.anchor = undefined;
        });
        canvas.addEventListener("mousedown", e=>{
            e.preventDefault();
            this.mouse.anchor = mouse_position(e);
        });
        canvas.addEventListener("mousemove", e=>{
            e.preventDefault();
            this.mouse.from_center = mouse_position(e);
        }
        );
        canvas.addEventListener("mouseout", e=>{
            if (!this.mouse.anchor)
                this.mouse.from_center.scale(0)
        });
    }

    show_explanation(document_element) {}
    
    // This function of a scene sets up its keyboard shortcuts.
    make_control_panel() {
        const globals = this.globals;
        this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
        this.key_triggered_button("Up", [" "], ()=>this.thrust[1] = -1, undefined, ()=>this.thrust[1] = 0);
        this.key_triggered_button("Forward", ["w"], ()=>this.thrust[2] = 1, undefined, ()=>this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Left", ["a"], ()=>this.thrust[0] = 1, undefined, ()=>this.thrust[0] = 0);
        this.key_triggered_button("Back", ["s"], ()=>this.thrust[2] = -1, undefined, ()=>this.thrust[2] = 0);
        this.key_triggered_button("Right", ["d"], ()=>this.thrust[0] = -1, undefined, ()=>this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("Down", ["z"], ()=>this.thrust[1] = 1, undefined, ()=>this.thrust[1] = 0);

        const speed_controls = this.control_panel.appendChild(document.createElement("span"));
        speed_controls.style.margin = "30px";
        this.key_triggered_button("-", ["o"], ()=>this.speed_multiplier /= 1.2, "green", undefined, undefined, speed_controls);
        this.live_string(box=>{
            box.textContent = "Speed: " + this.speed_multiplier.toFixed(2)
        }, speed_controls);
        this.key_triggered_button("+", ["p"], ()=>this.speed_multiplier *= 1.2, "green", undefined, undefined, speed_controls);
        this.new_line();
        this.key_triggered_button("Roll left", [","], ()=>this.roll = 1, undefined, ()=>this.roll = 0);
        this.key_triggered_button("Roll right", ["."], ()=>this.roll = -1, undefined, ()=>this.roll = 0);
        this.new_line();
        this.key_triggered_button("(Un)freeze mouse look around", ["f"], ()=>this.look_around_locked ^= 1, "green");
        this.new_line();
        this.live_string(box=>box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) + ", " + this.pos[2].toFixed(2));
        this.new_line();
        // The facing directions are actually affected by the left hand rule:
        this.live_string(box=>box.textContent = "Facing: "
            + ((this.z_axis[0] > 0 ? "West " : "East ")
            + (this.z_axis[1] > 0 ? "Down " : "Up ")
            + (this.z_axis[2] > 0 ? "North" : "South")));
        this.new_line();
        this.key_triggered_button("Go to world origin", ["r"], ()=>this.target().set_identity(4, 4), "orange");
        this.new_line();
        this.key_triggered_button("Attach to global camera", ["Shift", "R"],
            () => globals.movement_controls_target = ()=>globals.graphics_state.camera_transform, "blue");
        this.new_line();
    }

    first_person_flyaround(radians_per_frame, meters_per_frame, leeway=70) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
        // Compare mouse's location to all four corners of a dead box.
        const offsets_from_dead_box = {
            plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
            minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
        };
        // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
        if (!this.look_around_locked) {
            // start increasing until outside a leeway window from the center.
            // Steer according to "mouse_from_center" vector, but don't
            for (let i = 0; i < 2; i++) {
                let o = offsets_from_dead_box,
                    velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                    do_operation(Mat4.rotation(sign * velocity, Vec.of(i, 1 - i, 0)));
            }
        }

        if (this.roll != 0)
            do_operation(Mat4.rotation(sign * .1, Vec.of(0, 0, this.roll)));
        
        // Now apply translation movement of the camera, in the newest local coordinate frame.
        do_operation(Mat4.translation(this.thrust.times(sign * meters_per_frame)));
    }
    third_person_arcball(radians_per_frame) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());

        // Spin the scene around a point on an axis determined by user mouse drag.
        const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);
        if (dragging_vector.norm() <= 0)
            return;

        // The presumed distance to the scene is a hard-coded 25 units.
        do_operation(Mat4.translation([0, 0, sign * 25]));
        do_operation(Mat4.rotation(radians_per_frame * dragging_vector.norm(), Vec.of(dragging_vector[1], dragging_vector[0], 0)));
        do_operation(Mat4.translation([0, 0, sign * -25]));
    }

    // Camera code starts here.
    display(graphics_state, dt=graphics_state.animation_delta_time / 1000) {
        const m = this.speed_multiplier * this.meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;
        
        // Do first-person.  Scale the normal camera aiming speed by dt for smoothness.
        this.first_person_flyaround(dt * r, dt * m);

        // Also apply third-person "arcball" camera mode if a mouse drag is occurring.
        if (this.mouse.anchor)
            this.third_person_arcball(dt * r);

        const inv = Mat4.inverse(this.target());
        this.pos = inv.times(Vec.of(0, 0, 0, 1));
        this.z_axis = inv.times(Vec.of(0, 0, 1, 0));
    }
}
