class OverlayGUI {

constructor(renderCanvas) {
    let canvas = document.createElement("canvas")
    canvas.id = 'GUICanvas'
    this.canvas = canvas
    document.body.appendChild(canvas)
    canvas.style.pointerEvents = 'none'
    canvas.style.left = 0
    canvas.style.top = 0
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.position = 'absolute'
    canvas.style.touchAction = 'none'
    canvas.style.outline = 'none'

    this.forwardEvents = true
    this.renderCanvas = renderCanvas

    this.engine = new BABYLON.Engine(canvas, true)
    this.scene = this._createScene()
    this._initEventForwarders()

    this.lastW = 1
    this.lastH = 1

    this.engine.runRenderLoop(() => {
        if (this.scene) {
            this.resize()
            this.scene.render()
        }
    })
    this.resize()
}

resize() {
    if (this.lastW != this.renderCanvas.clientWidth || this.lastH != this.renderCanvas.clientHeight) {
        this.lastW = this.renderCanvas.clientWidth
        this.lastH = this.renderCanvas.clientHeight
        console.log("resized", this.lastW, this.lastH)
        this.canvas.width = this.lastW
        this.canvas.height = this.lastH
        this.canvas.style.width = this.lastW+'px'
        this.canvas.style.height = this.lastH+'px'
        this.canvas.style.top = this.renderCanvas.offsetTop+'px'
        this.canvas.style.left = this.renderCanvas.offsetLeft+'px'
        this.gui.idealWidth = 1920
        this.gui.idealHeight = 1080
        this.engine.resize()
    }
}

_initEventForwarders() {
    let self = this
    let lo = false

    this.renderCanvas.addEventListener('click', function (e) {
        if (self.forwardEvents) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, e.x, e.y, false, false, false, false, e.buttonIndex, null);
            self.canvas.dispatchEvent(evt)
        }
    }, lo)
    this.renderCanvas.addEventListener('pointermove', function (e) {
        if (self.forwardEvents) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("pointermove", true, true, window, 0, 0, 0, e.x, e.y, false, false, false, false, e.buttonIndex, null);
            self.canvas.dispatchEvent(evt)
        }
    }, lo)
    this.renderCanvas.addEventListener('pointerdown', function (e) {
        if (self.forwardEvents) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("pointerdown", true, true, window, 0, 0, 0, e.x, e.y, false, false, false, false, e.buttonIndex, null);
            self.canvas.dispatchEvent(evt)
        }
    }, lo)
    this.renderCanvas.addEventListener('pointerup', function (e) {
        console.log('UP!')
        if (self.forwardEvents) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("pointerup", true, true, window, 0, 0, 0, e.x, e.y, false, false, false, false, e.buttonIndex, null);
            self.canvas.dispatchEvent(evt)
        }
    }, lo)

    this.canvas.addEventListener('keypress', function (e) {
        if (self.forwardEvents) {
            var evt = new KeyboardEvent('keypress', {bubbles : true, cancelable : true, key : e.key, code : e.code, charCode : e.charCode, keyCode : e.keyCode, shiftKey : e.shiftKey, ctrlKey : e.ctrlKey, altKey : e.altKey})
            self.renderCanvas.dispatchEvent(evt)
        }
    }, lo)
    this.canvas.addEventListener('keyup', function (e) {
        if (self.forwardEvents) {
            var evt = new KeyboardEvent('keyup', {bubbles : true, cancelable : true, key : e.key, code : e.code, charCode : e.charCode, keyCode : e.keyCode, shiftKey : e.shiftKey, ctrlKey : e.ctrlKey, altKey : e.altKey})
            self.renderCanvas.dispatchEvent(evt)
        }
    }, lo)
    this.canvas.addEventListener('keydown', function (e) {
        if (self.forwardEvents) {
            var evt = new KeyboardEvent('keydown', {bubbles : true, cancelable : true, key : e.key, code : e.code, charCode : e.charCode, keyCode : e.keyCode, shiftKey : e.shiftKey, ctrlKey : e.ctrlKey, altKey : e.altKey})
            self.renderCanvas.dispatchEvent(evt)
        }
    }, lo)
}

_createScene() {
    let self = this
    let scene = new BABYLON.Scene(this.engine)
    scene.clearColor = new BABYLON.Color4(0,0,0,0.5)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2, -2), scene)
    camera.setTarget(BABYLON.Vector3.Zero())

    // GUI & control
    var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene)
    this.gui = gui

    var panel = new BABYLON.GUI.StackPanel();
    panel.width = '100%'
    panel.height = '100%'
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
    panel.paddingLeft = '20px'
    panel.paddingTop = '20px'
    panel.fontSize = 24
    panel.isPointerBlocker = true
    gui.addControl(panel)
    this.panel = panel

    return scene
}

}
