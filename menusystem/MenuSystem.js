class MenuSystem {

    // onEventFunction = ('eventname', parameters) => {}
    constructor(scene, screens, onEventFunction) {
        this.scene = scene
        var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuSystem", true, scene)
        this.gui = gui
        this.screens = screens
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

    // if slider/value is highlighted, turn value up
    turnUp() {
    }

    // if slider/value is highlighted, turn value down
    turnDown() {
    }

    // fire back event (exit menu)
    back() {
    }

//-----------------------------------------------------------------------------

    _build() {
    }

}