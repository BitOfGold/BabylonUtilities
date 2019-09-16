class PrefilteredReflectionProbe {

constructor(scene, size=512, renderList=[], options = {}) {
    this.scene = scene
    this.size = size
    this.options = options
    this.isBusy = false
    this.phase = 1
    this.renderList = renderList

    this.dummymesh = BABYLON.MeshBuilder.CreateBox('dummy', {
            width: 0.001,
            height: 0.001,
            depth: 0.001,
            updatable: false
        }, this.scene)
    this.dummymesh.material = new BABYLON.PBRMaterial("pbrdummy", this.scene)

    // Secondary reflection is a dummy texture
    this.secondaryReflection = new BABYLON.EquiRectangularCubeTexture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpX5UFKwg4pChOlkQFXHUKhShQqgVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi4uqk6CIl/i8ptIj14Lgf7+497t4BQrXINKttHNB020zEomIqvSoGXtGJIPowgG6ZWcacJMXRcnzdw8fXuwjPan3uz9GjZiwG+ETiWWaYNvEG8fSmbXDeJw6xvKwSnxOPmXRB4keuKx6/cc65LPDMkJlMzBOHiMVcEytNzPKmRjxFHFY1nfKFlMcq5y3OWrHM6vfkLwxm9JVlrtMcRgyLWIIEEQrKKKAIGxFadVIsJGg/2sI/5PolcinkKoCRYwElaJBdP/gf/O7Wyk5OeEnBKND+4jgfI0BgF6hVHOf72HFqJ4D/GbjSG/5SFZj5JL3S0MJHQO82cHHd0JQ94HIHGHwyZFN2JT9NIZsF3s/om9JA/y3Qteb1Vt/H6QOQpK7iN8DBITCao+z1Fu/uaO7t3zP1/n4AFENygT82rs8AAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfjCQwQJQmWy9V2AAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAACpJREFUCNdjDNTX//T3Hx8zExrJhFWUj5mJ5T273HsGBgYWBjSSiQEHAAAHCx2CO4UrdwAAAABJRU5ErkJggg==", this.scene, 512);
   
}

async _sleep(m) { return new Promise(r => setTimeout(r, m)) }

async render() {
    this.tStart = performance.now()
    console.log("Prefiltering starts")

    if (!this.rp) {
        this._createRP()
        this._createCascade()
        this._attachCascade(true)
    }

    if (this.isBusy) {throw("PrefilteredReflectionProbe is busy right now.")}
    this.isBusy = true

    // getting downscaled reflections
    this.phase = 1
    this.rp.refreshRate = 1
    while (this.phase == 1) {
        await this._sleep(50)
    }
    this.rp.refreshRate = -1
    await this._savePhase1()

    let pfTexture = await this._createPrefilteredTexture()

    console.log("Prefiltering finished")

    this.dummymesh.reflectionTexture = this.secondaryReflection
    this.isBusy = false
    this.tEnd = performance.now()
    this.tTime = (this.tEnd - this.tStart)

    return pfTexture
}

get position() {
    return this.rp.position
}

set position(npos) {
    this.rp.position.copyFrom(npos)
    this.rp._renderTargetTexture.boundingBoxPosition.copyFrom(npos)
}

_createRP() {
    console.log("Creating ReflectionProbe...")
    let self = this

    if (this.rp) {this.rp.dispose()}

    // Reflection probe
    var rp = new BABYLON.ReflectionProbe('ref', this.size * 2, this.scene, true, true)
    this.rp = rp
    rp.refreshRate = -1
    rp.invertYAxis = true
    rp.position = new BABYLON.Vector3(0, 1, 0)
    rp.cubeTexture.boundingBoxPosition.copyFrom(rp.position)
    rp.cubeTexture.boundingBoxSize = new BABYLON.Vector3(500, 500, 500)
    this.renderList.forEach(function(mesh){
        rp.renderList.push(mesh)
    })
    rp._renderTargetTexture.onBeforeRenderObservable.add((f) => {
        rp._rface = f
        if (f == 0) {
            self.scene.environmentTexture = self.secondaryReflection
            rp.renderList.forEach((mesh) => {
                if (!mesh.dontreflect) {
                    mesh.material._rt = mesh.material.reflectionTexture
                    mesh.material.reflectionTexture = self.secondaryReflection
                }
            })
        }
    })

    rp._renderTargetTexture.onAfterRenderObservable.add((f) => {
        if (f == 5) {
            if (self.isBusy) {
                console.log("RP finished phase", self.phase)
                if (self.phase == 1) {
                    self.phase = 2
                    rp.renderList.forEach((mesh) => {
                        if (!mesh.dontreflect) {
                            mesh.material.reflectionTexture = mesh.material._rt
                        }
                    })
                }
            } else {
                this.dummymesh.material.reflectionTexture = rp.cubeTexture
            }
        }
    })
    
    this.dummymesh.material.reflectionTexture = this.rp.cubeTexture
}

_createCascade() {
    console.log("Creating Downscaling cascade...")

    // Renderprobe postprocess (cascaded downscale and blur)
    BABYLON.Effect.ShadersStore["rpblurFragmentShader"] =
    `#ifdef GL_ES
    precision highp float;
    #endif
    
    // Samplers
    varying vec2 vUV;
    uniform sampler2D textureSampler;
    
    //Parameters
    uniform float fromUp;
    uniform vec2 screenSize;
    uniform sampler2D upSampler;

    vec4 toRGBE(vec3 color) {
        float maxrgb = max(max(color.r, color.g), color.b);
        float D = min(1.0, 1.0 / maxrgb);
        vec4 rgbe = vec4(color * vec3(D), 1.0 / D);
        rgbe = pow(rgbe, vec4(0.4545));
        return(rgbe);
    }

    vec3 fromRGBE(vec4 rgbe, float scale) {
        vec4 rgben = pow(rgbe, vec4(2.2));
        vec3 color = rgben.rgb / rgben.a * vec3(scale);
        return(color);
    }

    vec3 getHDRPixel(sampler2D s) {
        vec3 color = texture2D(s, vUV).rgb;
        return(color);
    }

    vec3 getBlurPixel(sampler2D s, vec2 texelSize) {
        vec3 color = fromRGBE(texture2D(s, vUV + vec2(-1.0, -1.0) * texelSize), 0.0625);
        color += fromRGBE(texture2D(s, vUV + vec2(0.0, -1.0) * texelSize), 0.125);
        color += fromRGBE(texture2D(s, vUV + vec2(1.0, -1.0) * texelSize), 0.0625);

        color += fromRGBE(texture2D(s, vUV + vec2(-1.0, 0.0) * texelSize), 0.125);
        color += fromRGBE(texture2D(s, vUV + vec2(0.0, 0.0) * texelSize), 0.25);
        color += fromRGBE(texture2D(s, vUV + vec2(1.0, 0.0) * texelSize), 0.125);

        color += fromRGBE(texture2D(s, vUV + vec2(-1.0, 1.0) * texelSize), 0.0625);
        color += fromRGBE(texture2D(s, vUV + vec2(0.0, 1.0) * texelSize), 0.125);
        color += fromRGBE(texture2D(s, vUV + vec2(1.0, 1.0) * texelSize), 0.0625);

        return(color);
    }
    
    void main(void)
    {
        vec2 texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
        vec3 color;
        if (fromUp > 0.5) {
            color = getBlurPixel(upSampler, texelSize);
        } else {
            color = getHDRPixel(textureSampler);
        }
        gl_FragColor = toRGBE(color);
    }
    `;
    
    console.log("RP Size", this.size)
    
    var cascade = []
    this.cascade = cascade
    let prevrppp = false
    let ppscale = 1.0
    let ppsize = this.size * 2
    for (let i = 0; i < 16; i++) {
        let samplers = []
        if (prevrppp) {
            samplers = ['upSampler']
        }
        let rppp = new BABYLON.PostProcess("RPBlur"+i, 'rpblur', ['fromUp','screenSize'], samplers, ppscale, this.scene.activeCamera, BABYLON.Texture.BILINEAR_SAMPLINGMODE)
        let size = Math.round(ppsize * ppscale);
        let level = {
            level: i,
            pp: rppp,
            scale: ppscale,
            size: size,
            data: [
                new Uint8Array(size*size*4),
                new Uint8Array(size*size*4),
                new Uint8Array(size*size*4),
                new Uint8Array(size*size*4),
                new Uint8Array(size*size*4),
                new Uint8Array(size*size*4)
            ]
        }
        cascade.push(level)
        rppp.level = level
        rppp.onApply = (effect) => {
            rppp.level.width = rppp.width
            rppp.level.height = rppp.height
            effect.setFloat("fromUp", prevrppp ? 1.0 : 0.0);
            effect.setFloat2("screenSize", rppp.width, rppp.height);
            if (prevrppp) {
                effect.setTextureFromPostProcess("upSampler", prevrppp)
            }
        }
        if (size > 1) {
            rppp.onAfterRender = (effect) => {
                let nlev = cascade[rppp.level.level + 1]
                engine._gl.readPixels(0, 0, nlev.size, nlev.size, engine._gl.RGBA, engine._gl.UNSIGNED_BYTE, nlev.data[this.rp._rface]);
            }
        }
        this.scene.activeCamera.detachPostProcess(rppp)
        prevrppp = rppp;
        console.log("Cascade "+i,"scale:",ppscale,"size:",ppsize * ppscale)
        ppscale /= 2;
        if ((ppsize * ppscale) < 1) {
            i = 100
        }
    }
}

_attachCascade(enable) {
    console.log("Attaching cascade",enable)
    if (enable) {
        for (let l = 0; l < this.cascade.length;l++) {
            this.rp._renderTargetTexture.addPostProcess(this.cascade[l].pp)
        }
    } else {
        this.rp._renderTargetTexture.clearPostProcesses()
    }

}

_savePhase1() {
    console.log("Phase 1 Cascade:",this.cascade)
    return true
}

// Texture creation & uploading
async _createPrefilteredTexture() {
    let rawTex
    let mipmaplist = []
    let mdata = []
    let mlevel = 0
    let sizenow = this.size
    let cbuf

    while (sizenow > 0) {
        mdata[mlevel] = []
        let buffers = this.cascade[mlevel+1].data
        /*if (mlevel != 0) {
            let ft = buffers[2]
            buffers[2] = buffers[3]
            buffers[3] = ft
        }*/
        for (let f = 0; f < 6; f++) {
            cbuf = buffers[f]
            let png = await this._bufferToPNGData(cbuf)
            mipmaplist.push(png)
            mdata[mlevel].push(png)
        }
        
        //if (mlevel == 0) {
            let ft = mdata[mlevel][2]
            mdata[mlevel][2] = mdata[mlevel][3]
            mdata[mlevel][3] = ft
        //}
        console.log("Level "+mlevel+", size "+sizenow+" ready.")
        sizenow >>= 1
        mlevel++
    }
    try {
        let lowdata = [mdata[mdata.length-2]]
        this.spTex = new BABYLON.RawCubeTexture(this.scene, null, 2)
        await this.spTex.updateRGBDAsync(lowdata)
        this.spTex.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE)
        let sp = BABYLON.CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this.spTex)
        this.spTex.dispose()

        this.rawTex = new BABYLON.RawCubeTexture(this.scene, null, this.size)
        await this.rawTex.updateRGBDAsync(mdata, sp, 0.9)
        this.rawTex.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE)
        this.rawTex.gammaSpace = false
        this.rawTex._isRGBD = true
        this.rawTex._prefiltered = true
        this.rawTex._sphericalReady = true
        this.rawTex.boundingBoxPosition.copyFrom(this.rp.cubeTexture.boundingBoxPosition)
        this.rawTex.boundingBoxSize = this.rp.cubeTexture.boundingBoxSize.clone()
    } catch(err) {
        console.error('[_createPrefilteredTexture]',err)
        return null
    }

    console.log("Uploading prefiltered data")
    return(this.rawTex)
}

// texture buffer must be N^2 size, byte RGBE buffer
async _bufferToPNGData(buffer) {
    let len = buffer.length
    let size = Math.ceil(Math.sqrt(len >> 2)) | 0
    if (size < 1) {size = 1}
    
    let canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    let ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size);
    let idata = ctx.getImageData(0, 0, size, size)
    idata.data.set(buffer)
    ctx.putImageData(idata, 0, 0)

    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    let pngbuffer = new Uint8Array(await new Response(blob).arrayBuffer())  
    return(pngbuffer)
}

}
