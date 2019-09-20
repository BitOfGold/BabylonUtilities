class MenuSystem {

    // onEventFunction = ('eventname', parameters) => {}
    constructor(scene, options, screenList, onEventFunction) {
        this.scene = scene
        this.options = options
        var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuSystem", true, scene)
        gui.idealWidth = 1920
        gui.idealHeight = 1080
        gui.renderAtIdealSize = true
        gui.useSmallestIdeal = true
        this.gui = gui
        this.screenList = screenList
        this.onEventFunction = onEventFunction
        this._build()
    }

    // switches screen
    screen(name) {
        for (let sid in this._screens) {
            let screen = this._screens[sid]
            if (name == sid) {
                screen.isVisible = true
            } else {
                screen.isVisible = false
            }
        }
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
        let c, _options
        this._screen = false
        this._highlighted = false
        this._screens = {}
        this._fields = {}
        let firstscreen = false
        for (let sid in this.screenList) {
            if (!firstscreen) {firstscreen = sid}
            let screen = this.screenList[sid]
            if (screen._options) {
                _options = screen._options
            } else {
                _options = {}
            }
            let pscreen = new BABYLON.GUI.Rectangle()
            pscreen.width = 1.0;
            pscreen.height = 1.0;
            pscreen.cornerRadius = 0;
            pscreen.thickness = 0;
            pscreen.background = _options.background? _options.background : this.options.background
            this.gui.addControl(pscreen)
            this._screens[sid] = pscreen

            for (let fid in screen) {
                if (fid == '_options') {continue;}
                let field = screen[fid]
                switch(field.type) {
                    case 'title':
                        console.log('title');
                        c = new BABYLON.GUI.TextBlock()
                        c.text = field.text;
                        c.fontFamily = this.options.fontFamily
                        c.fontSize = this.options.titleSize
                        c.color = "white";
                        pscreen.addControl(c)
                        break;
                    case 'text':
                        console.log('text');
                        c = new BABYLON.GUI.TextBlock()
                        c.text = field.text;
                        c.fontFamily = this.options.fontFamily
                        c.fontSize = this.options.menuSize
                        c.color = "white";
                        pscreen.addControl(c)
                        break;
                    case 'menu':
                        console.log('menu')
                        break;
                    default:
                        console.error(`[MenuSystem] Unknown type: ${field.type}`)
                }
            }
        }
        this.screen(firstscreen)
    }

}