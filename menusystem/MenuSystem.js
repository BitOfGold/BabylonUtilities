class MenuSystem {

    // onEventFunction = ('eventname', parameters) => {}
    constructor(scene, nodes, onEventFunction) {
        this.scene = scene
        var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuSystem", true, scene)
        gui.idealWidth = 1920
        gui.idealHeight = 1080
        gui.renderAtIdealSize = true
        gui.useSmallestIdeal = true
        this.gui = gui
        this.nodes = nodes
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


    //get Control by id
    getControl(id) {
        return(this._fields[id])
    }

    //set text
    setText(id, text) {
        let c = this.getControl(id)
        c.text = text
    }

    //set value
    setValue(id, value) {
    }

    getValues() {
    }

//-----------------------------------------------------------------------------

    _onevent(id, type, e) {
        console.log('EVENT', id, type, e)
    }

    
    _mixOptions(baseo, addo) {
        let neo = JSON.parse(JSON.stringify(baseo))        
        delete neo.c
        for (let k in addo) {
            if (k != 'c') {
                neo[k] = addo[k]
            }
        }
        return neo
    }
    
    _build() {
        let c, _options
        this._screen = false
        this._highlighted = false
        this._screens = {}
        this._fields = {}
        let firstscreen = false
        for (let sid in this.nodes.c) {
            if (!firstscreen) {firstscreen = sid}
            let screen = this.nodes.c[sid]
            this.options = this._mixOptions(this.nodes, {})
            _options = this._mixOptions(this.options, screen)
            let pscreen = new BABYLON.GUI.Rectangle()
            pscreen.width = 1.0;
            pscreen.height = 1.0;
            pscreen.cornerRadius = 0;
            pscreen.thickness = 0;
            if (_options.color) {
                pscreen.color = _options.color
            }
            if (_options.background) {
                pscreen.background = _options.background
            }
            pscreen.fontFamily = this.options.fontFamily
            pscreen.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
            pscreen.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
            this.gui.addControl(pscreen)
            this._screens[sid] = pscreen

            this._buildControls(pscreen, screen.c, _options)
        }
        this.screen(firstscreen)
    }

    _buildControls(parent, list, _options) {
        let c
        for (let fid in list) {
            let field = list[fid]
            switch(field.type) {
                case 'title':
                    console.log('title');
                    c = new BABYLON.GUI.TextBlock()
                    c.type = field.type
                    c.text = field.text;
                    c.textVerticalAlignment	= BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                    c.fontFamily = this.options.fontFamily
                    c.fontSize = this.options.titleSize
                    if (field.color) {
                        c.color = field.color
                    }
                    if (field.background) {
                        c.background = field.background
                    }
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
                case 'text':
                case 'menu':
                    console.log(field.type)
                    c = new BABYLON.GUI.TextBlock()
                    c.type = field.type
                    c.text = field.text
                    if (field.height) {
                        c.height = field.height
                    } else {
                        c.resizeToFit = true
                    }
                    if (field.left) {c.left = field.left}
                    if (field.top) {c.top = field.top}
                    if (field.align == 'center') {
                        c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
                        c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
                    } else if (field.align == 'right') {
                        c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
                        c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
                    } else {
                        c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
                        c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
                    }                    
                    if (field.valign == 'top') {
                        c.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                        c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                    } else {
                        c.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
                        c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
                    }
                    c.fontFamily = this.options.fontFamily
                    c.fontSize = field.fontSize ? field.fontSize : this.options.fontSize
                    if (field.color) {
                        c.color = field.color
                    }
                    if (field.background) {
                        c.background = field.background
                    }
                    if (field.type == 'menu') {
                        c.isPointerBlocker = true 
                        c.onPointerEnterObservable.add((e) => {
                            this._onevent(fid, 'enter', e)
                        });
                        c.onPointerOutObservable.add((e) => {
                            this._onevent(fid, 'out', e)
                        })
                        c.onPointerUpObservable.add((e) => {
                            this._onevent(fid, 'up', e)
                        })
                    }
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
                case 'image':
                    console.log('image')
                    c = new BABYLON.GUI.Image("image-"+fid, field.src);
                    c.type = field.type
                    c.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM
                    if (field.width) {c.width = field.width}
                    if (field.height) {c.height = field.height}
                    c.left = field.left ? field.left : 0
                    c.top = field.top ? field.top : 0
                    if (field.align == 'center') {
                        c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
                    } else {
                        c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
                    }                    
                    if (field.valign == 'center') {
                        c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
                    } else {
                        c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                    }
                    if (field.cellWidth || field.cellHeight) {
                        c.cellWidth = field.cellWidth
                        c.cellHeight = field.cellHeight
                        c.cellId = field.cellId
                    }
                    console.log(c)
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
               case 'stack':
                    console.log('stack')
                    let stack = new BABYLON.GUI.StackPanel()
                    stack.type = field.type
                    stack.isVertical = true
                    if (field.align == 'center') {
                        stack.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
                    } else if (field.align == 'right') {
                        stack.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
                    } else {
                        stack.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
                    }                    
                    stack.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                    if (field.left) {stack.left = field.left}
                    if (field.top) {stack.top = field.top}
                    if (field.width) {
                        stack.width = field.width
                    }
                    if (field.height) {
                        stack.height = field.height
                    } else {
                        stack.adaptHeightToChildren = true
                    }
                    if (field.color) {
                        stack.color = field.color
                    }
                    if (field.background) {
                        stack.background = field.background
                    }
                    parent.addControl(stack)
                    this._buildControls(stack, field.c)
                    break;
                default:
                    console.error(`[MenuSystem] Unknown type: ${field.type}`)
            }
        }
    }

}