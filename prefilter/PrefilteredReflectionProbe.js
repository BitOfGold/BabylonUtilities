class PrefilteredReflectionProbe {

constructor(scene, size=512, renderList=[], options = {}) {
    this.scene = scene
    this.engine = scene.getEngine()
    this.size = size
    this.options = options
    this.isBusy = false
    this.phase = 1
    this.renderList = renderList
    this.position = new BABYLON.Vector3(0, 2, 0)
    this.illuminationLevel = 1.0

    self = this

    this.dummymesh = BABYLON.MeshBuilder.CreateBox('dummy', {
            width: 0.001,
            height: 0.001,
            depth: 0.001,
            updatable: false
        }, this.scene)
    this.dummymesh.alwaysSelectAsActiveMesh = true
    this.dummymesh.material = new BABYLON.PBRMaterial("pbrdummy", this.scene)
    // Secondary reflection is a dummy texture    
    this.secondaryReflection = new BABYLON.EquiRectangularCubeTexture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAABmklEQVQozzWSwZEbQQwDAZCzK52cicNxEM6/zpY0O0PCD5X72Y9+NX/++g3Aho3/mCCBgEWA/NgGGkiQbZfhdgNtmBR5p48u0Y5EyOQGYaTELrt7G0W1iIiDPL0edUXXjtvW6Ugay86gGyYJUZIUjLgTj1o/rhl7ztRbt50xAFTloAEjIxSQEBHSXfi6+osz/IpK84EQCaJzuI2OHMpAhEIhneh7+YYtz/BobyRJZiMPbwCZyIMKUUpytO+ogR1Y4dm4RHdo0XnUZOPkOBSZVji6sq+z3qOXWPJCT2GVGKg8a3LXueI+OAA1o7fWK/bf8Ay2uVkv7WclgZVHvXnN24VzeGgFyX1pPrWe9JYANfvF61vBXStHv0c/z41zdeIQwDWxXuwnVRRJo2dc3yBGM0e/h+Ywx2o6ZbMu7ItYEBgATS/uP3KHzoy+zujkUoObgtEFb9KQJBoNw1XooirZKwIBCwstoAWTTZECaQNgw0YbxazeQBKAP0easADYRBMCEDQIu3tN7V3b+Kzdn0z702M3XHIJCJBA7fUPC5MmAq/DE8UAAAAASUVORK5CYII=", this.scene, 4);
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

    this.rp._renderTargetTexture.renderList = []
    this.renderList.forEach((mesh) => {
        if (!mesh.noreflection) {
            this.rp._renderTargetTexture.renderList.push(mesh)
        }
    })

    this.rp.position.copyFrom(this.position)
    this.rp.cubeTexture.boundingBoxPosition.copyFrom(this.position)
    this.rp.cubeTexture.boundingBoxSize = new BABYLON.Vector3(25, 25, 25)

    let reenable = []
    this.renderList.forEach((mesh) => {
        if (mesh.noreflection && mesh.isEnabled()) {
            mesh.setEnabled(false)
            reenable.push(mesh)
        }
    })

    // getting downscaled reflections
    this.phase = 1
    this.rp.refreshRate = 1
    while (this.phase == 1) {
        await this._sleep(50)
    }
    this.rp.refreshRate = -1
    reenable.forEach((mesh) => {
        mesh.setEnabled(true)
    })

    await this._savePhase1()

    let pfTexture = await this._createPrefilteredTexture()


    this.dummymesh.reflectionTexture = this.secondaryReflection
    this.isBusy = false
    this.tEnd = performance.now()
    this.tTime = (this.tEnd - this.tStart)

    console.log("Prefiltering finished.")
    return pfTexture
}

_createRP() {
    let self = this

    if (this.rp) {this.rp.dispose()}

    // Reflection probe
    var rp = new BABYLON.ReflectionProbe('ref', this.size * 2, this.scene, true, true)
    this.rp = rp
    rp.refreshRate = -1
    rp.invertYAxis = true
    rp.position.copyFrom(this.position)
    rp.cubeTexture.boundingBoxPosition.copyFrom(this.position)
    rp.cubeTexture.boundingBoxSize = new BABYLON.Vector3(500, 500, 500)
    rp._renderTargetTexture.onBeforeRenderObservable.add((f) => {
        rp._rface = f
        if (f == 0) {
            self.scene.environmentTexture = self.secondaryReflection
            rp.renderList.forEach((mesh) => {
                if (f == 0) {
                    mesh._normal_material = mesh.material
                }
                if (!mesh._norefl_material) {
                    let matnew = mesh._normal_material.clone('reflection-' + mesh._normal_material.name, true, true);
                    if (matnew.subMaterials) {
                        for (let m = 0; m < matnew.subMaterials.length; m++) {
                            if (matnew.subMaterials[m].reflectionTexture) {
                                matnew.subMaterials[m].reflectionTexture = this.secondaryReflection
                            }
                            matnew.subMaterials[m].normalTexture = null
                            matnew.subMaterials[m].bumpTexture = null
                            matnew.subMaterials[m].useParallax = false
                            matnew.subMaterials[m].useParallaxOcclusion = false
                            matnew.subMaterials[m].forceIrradianceInFragment = false
                            matnew.subMaterials[m].enableSpecularAntiAliasing = false
                        }
                    } else {
                        if (matnew.reflectionTexture) {
                            matnew.reflectionTexture = this.secondaryReflection
                        }
                        matnew.normalTexture = null
                        matnew.bumpTexture = null
                        matnew.useParallax = false
                        matnew.useParallaxOcclusion = false
                        matnew.forceIrradianceInFragment = false
                        matnew.enableSpecularAntiAliasing = false
                    }
                    mesh._norefl_material = matnew
                }
                mesh.material = mesh._norefl_material
            })
        }
    })

    rp._renderTargetTexture.onAfterRenderObservable.add((f) => {
        if (f == 5) {
            if (self.isBusy) {
                if (self.phase == 1) {
                    self.phase = 2
                    rp.renderList.forEach((mesh) => {
                        mesh.material = mesh._normal_material
                    })
                }
            } else {
                this.dummymesh.material.reflectionTexture = rp.cubeTexture
            }
        }
    })
    
    this.dummymesh.material.reflectionTexture = this.rp.cubeTexture
    this.rp.cubeTexture.sphericalPolynomial = this.secondaryReflection.sphericalPolynomial
}

_createCascade() {
    let self = this

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
    uniform float illuminationLevel;
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
        vec3 color = texture2D(s, vUV).rgb * vec3(illuminationLevel);
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
        rppp.engine = this.engine
        rppp.onApply = (effect) => {
            rppp.level.width = rppp.width
            rppp.level.height = rppp.height
            effect.setFloat("fromUp", prevrppp ? 1.0 : 0.0);
            effect.setFloat2("screenSize", rppp.width, rppp.height);
            effect.setFloat("illuminationLevel", this.illuminationLevel);
            if (prevrppp) {
                effect.setTextureFromPostProcess("upSampler", prevrppp)
            }
        }
        if (size > 1) {
            rppp.onAfterRender = (effect) => {
                let nlev = cascade[rppp.level.level + 1]
                let gl = this.engine._gl
                gl.readPixels(0, 0, nlev.size, nlev.size, gl.RGBA, gl.UNSIGNED_BYTE, nlev.data[this.rp._rface]);
            }
        }
        this.scene.activeCamera.detachPostProcess(rppp)
        prevrppp = rppp;
        ppscale /= 2;
        if ((ppsize * ppscale) < 1) {
            i = 100
        }
    }
}

_attachCascade(enable) {
    if (enable) {
        for (let l = 0; l < this.cascade.length;l++) {
            this.rp._renderTargetTexture.addPostProcess(this.cascade[l].pp)
        }
    } else {
        this.rp._renderTargetTexture.clearPostProcesses()
    }

}

_savePhase1() {
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
        for (let f = 0; f < 6; f++) {
            cbuf = buffers[f]
            let png = await this._bufferToPNGData(cbuf)
            mipmaplist.push(png)
            mdata[mlevel].push(png)
        }
        let ft = mdata[mlevel][2]
        mdata[mlevel][2] = mdata[mlevel][3]
        mdata[mlevel][3] = ft
        sizenow >>= 1
        mlevel++
    }
    try {
        let lowdata = [mdata[mdata.length-2]]
        this.spTex = new BABYLON.RawCubeTexture(this.scene, null, 2)
        await this.spTex.updateRGBDAsync(lowdata)
        this.spTex.gammaSpace = false
        this.spTex._isRGBD = true
        this.spTex._prefiltered = true
        let sp = BABYLON.CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this.spTex)
        //sp.scaleInPlace(this.illuminationLevel)
        this.spTex.dispose()

        this.rawTex = new BABYLON.RawCubeTexture(this.scene, null, this.size)
        this.rawTex.name = 'prefilteredReflection'
        await this.rawTex.updateRGBDAsync(mdata, sp, 0.9)
        this.rawTex.gammaSpace = false
        this.rawTex._isRGBD = true
        this.rawTex._prefiltered = true
        this.rawTex.sphericalPolynomial = sp
        this.rawTex.boundingBoxPosition.copyFrom(this.rp.cubeTexture.boundingBoxPosition)
        this.rawTex.boundingBoxSize = this.rp.cubeTexture.boundingBoxSize.clone()
    } catch(err) {
        console.error('[_createPrefilteredTexture]',err)
        return null
    }

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
