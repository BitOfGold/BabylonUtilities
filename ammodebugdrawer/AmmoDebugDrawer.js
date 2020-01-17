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

        this.debugObject = BABYLON.MeshBuilder.CreateLines("Ammo-Debug", {points: [], updatable: true}, scene)
        this.
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
        this.debugObject.setEnabled(true)
      }
      
    disable()  {
      this.enabled = false
      this.debugObject.setEnabled(false)
    }
    
    update() {
      if (!this.enabled) {
        return
      }
      this.clearDebug = true
      this.world.debugDrawWorld()
      this.debugObject = BABYLON.MeshBuilder.CreateLineSystem("Ammo-Debug", {lines: this.lines, colors: this.colors, instance: this.debugObject});
    }
    
    drawLine(from, to, color) {
      if (this.clearDebug) {
          this.lines = []
          this.colors = []
          this.clearDebug = false
      }
    
      if (!this.enabled) {
        return
      }

      var colorVector = Ammo.wrapPointer(color, Ammo.btVector3)
      var bcolor = new BABYLON.Color4(colorVector.x(), colorVector.y(), colorVector.z(), 1)
      var fromVector = Ammo.wrapPointer(from, Ammo.btVector3)
      var bfrom = new BABYLON.Vector3(fromVector.x(), fromVector.y(), fromVector.z())
      var toVector = Ammo.wrapPointer(to, Ammo.btVector3)
      var bto = new BABYLON.Vector3(toVector.x(), toVector.y(), toVector.z())
      this.lines.push([bfrom, bto])
      this.colors.push([bcolor, bcolor])
    }
    
    drawContactPoint(pointOnB, normalOnB, distance, lifeTime, color) {
      //TODO
      //console.log("drawContactPoint")
    }
    
    reportErrorWarning(warningString) {
      console.warn(warningString);
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