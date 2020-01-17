// BABYLON port of https://github.com/InfiniteLee/ammo-debug-drawer
// by @BitOfGold

AmmoDebugConstants = {
  NoDebug: 0,
  DrawWireframe: 1,
  DrawAabb: 2,
  DrawFeaturesText: 4,
  DrawContactPoints: 8,
  NoDeactivation: 16,
  NoHelpText: 32,
  DrawText: 64,
  ProfileTimings: 128,
  EnableSatComparison: 256,
  DisableBulletLCP: 512,
  EnableCCD: 1024,
  DrawConstraints: 1 << 11, //2048
  DrawConstraintLimits: 1 << 12, //4096
  FastWireframe: 1 << 13, //8192
  DrawNormals: 1 << 14, //16384
  DrawOnTop: 1 << 15, //32768
  MAX_DEBUG_DRAW_MODE: 0xffffffff
}

class BabylonAmmoDebugDrawer {

    constructor(scene, world, options={}) {
        this.options = options

        this.scene = scene
        this.world = world
        this.enabled = false
        this.lineCache = {}
        this.lines = []
        this.colors = []

        this.debugDrawer = new Ammo.DebugDrawer()
        this.debugDrawer.drawLine = this.drawLine.bind(this)
        this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this)
        this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this)
        this.debugDrawer.draw3dText = this.draw3dText.bind(this)
        this.debugDrawer.setDebugMode = this.setDebugMode.bind(this)
        this.debugDrawer.getDebugMode = this.getDebugMode.bind(this)
        this.debugDrawer.enable = this.enable.bind(this)
        this.debugDrawer.disable = this.disable.bind(this)
        this.debugDrawer.update = this.update.bind(this)
      
        this.debugDrawMode = options.debugDrawMode || 1
        this.drawOnTop = options.drawOnTop || false
      
        this.world.setDebugDrawer(this.debugDrawer)
    }

    enable() {
      this.enabled = true
      if (this.debugObject) {
        this.debugObject.setEnabled(true)
      }
    }
      
    disable()  {
      this.enabled = false
      if (this.debugObject) {
        this.debugObject.setEnabled(false)
      }
    }
    
    update() {
      if (!this.enabled) {
        return
      }
      this.clearDebug = true
      this.world.debugDrawWorld()
      if (this.lines.length > 0 && this.colors.length > 0) {
        if (this.debugObject) {
          this.debugObject = BABYLON.MeshBuilder.CreateLineSystem("Ammo-Debug", {lines: this.lines, colors: this.colors, instance: this.debugObject})
        } else {
          this.debugObject = BABYLON.MeshBuilder.CreateLineSystem("Ammo-Debug", {lines: this.lines, colors: this.colors, updatable: true}, this.scene)
        }
      }
    }
    
    drawLine(from, to, color) {
      if (this.clearDebug) {
          this.lines = []
          this.colors = []
          this.clearDebug = false
          this.lidx = 0
      }
    
      if (!this.enabled) {
        return
      }
    
      const heap = Ammo.HEAPF32
      const r = heap[(color + 0) / 4]
      const g = heap[(color + 4) / 4]
      const b = heap[(color + 8) / 4]
      const bcolor = new BABYLON.Color4(r, g, b, 1)

      const fromX = heap[(from + 0) / 4]
      const fromY = heap[(from + 4) / 4]
      const fromZ = heap[(from + 8) / 4]
      const bfrom = new BABYLON.Vector3(fromX, fromY, fromZ)
    
      const toX = heap[(to + 0) / 4]
      const toY = heap[(to + 4) / 4]
      const toZ = heap[(to + 8) / 4]
      const bto = new BABYLON.Vector3(toX, toY, toZ)
    
      this.lines.push([bfrom, bto])
      this.colors.push([bcolor, bcolor])
      
      this.lidx++
    }
    
    drawContactPoint(pointOnB, normalOnB, distance, lifeTime, color) {
      const heap = Ammo.HEAPF32;
      const r = heap[(color + 0) / 4];
      const g = heap[(color + 4) / 4];
      const b = heap[(color + 8) / 4];
      const bcolor = new BABYLON.Color4(r, g, b, 1)
    
      const x = heap[(pointOnB + 0) / 4];
      const y = heap[(pointOnB + 4) / 4];
      const z = heap[(pointOnB + 8) / 4];
      const bfrom = new BABYLON.Vector3(x, y, z)
    
      const dx = heap[(normalOnB + 0) / 4] * distance;
      const dy = heap[(normalOnB + 4) / 4] * distance;
      const dz = heap[(normalOnB + 8) / 4] * distance;
      const bto = new BABYLON.Vector3(x + dx ,y + dy, z + dz)

      this.lines.push([bfrom, bto])
      this.colors.push([bcolor, bcolor])
    }
    
    reportErrorWarning(warningString) {
      if (Ammo.hasOwnProperty("Pointer_stringify")) {
        console.warn(Ammo.Pointer_stringify(warningString))
      } else if (!this.warnedOnce) {
        this.warnedOnce = true
        console.warn("Cannot print warningString, please rebuild Ammo.js using 'debug' flag")
      }
    }
    
    draw3dText(location, textString) {
      //TODO
      //console.log("draw3dText", location, textString)
    }
    
    setDebugMode = function(debugMode) {
      this.debugDrawMode = debugMode
    }
    
    getDebugMode = function() {
      return this.debugDrawMode
    }
}