class MenuSystem {

    // onEventFunction = ('eventname', parameters) => {}
    constructor(scene, screenList, onEventFunction) {
        this.scene = scene
        var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuSystem", true, scene)
        this.gui = gui
        this.screenList = screenList
        this.onEventFunction = onEventFunction
        this._build()
    }

    // switches screen
    screen(name) {
    }

    //highlight next menu option
    next() {
    }

    //highlight previous menu option
    prev() {
    }

    // select highlighted menu option
    select() {
    }

    // fire back event (exit menu)
    back() {
        this.onEventFunction('back')
    }

    // if slider/value is highlighted, turn value up
    turnUp() {
    }

    // if slider/value is highlighted, turn value down
    turnDown() {
    }

    //set text
    setText(id, text) {
    }

    //set value
    setValue(id, value) {
    }

    getValues() {
    }

//-----------------------------------------------------------------------------

    _build() {
        this._screen = false
        this._highlighted = false
        this._screens = {}
        this._fields = {}
        for (let sid in this.screenList) {
            let screen = this.screenList[sid]
            for (let fid in screen) {
                let field = screen[fid]
            }
        }

    }

}