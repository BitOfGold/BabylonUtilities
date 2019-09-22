class MenuSystem {

    // onEventFunction = ('eventname', 'field_id', parameters) => {}
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
        this.selectedScreen = name
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
    back(id=null) {
        this.onEventFunction('back', id)
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

    _onevent(type, id, e) {
        let c
        //console.log('EVENT', type, id, e)
        if (type == 'enter') {
            c = this._getSelectable(id)
        } else if (type == 'up') {
            c = this._fields[id]
            if (c.back) {this.back(id)}
            this.onEventFunction('click', id, e)
        }
    }

    _getSelectable(id) {
        let allsel = this._selectable[this.selectedScreen]
        return allsel[id]
    }

    _getSelectableN(id) {
        let elem,prev,next,first,last,found=false
        let allsel = this._selectable[this.selectedScreen]
        for (let fid in allsel) {
            let field = allsel[fid]
            if (!first) {
                first = field
            }
            if (fid==id) {
                elem = field
                if (last) {
                    prev = last
                }
            }
            last = field
        }
        return allsel[id]
    }
    _select(id) {
        let allsel = this._selectable[this.selectedScreen]
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
        this._selectable = {}
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
            this._selectable[sid] = {}
            this._sid = sid
            this._buildControls(pscreen, screen.c, _options)
        }
        this.screen(firstscreen)
    }

    _buildControls(parent, list, options) {
        let c, _options
        for (let fid in list) {
            let field = list[fid]
            _options = this._mixOptions(options, field)
            switch(field.type) {
                case 'title':
                    c = new BABYLON.GUI.TextBlock()
                    c.type = field.type
                    c.text = field.text;
                    this._controlSetTextAlign(c, _options)
                    this._controlSetFieldOptions(c, field)
                    c.textVerticalAlignment	= BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
                    this._controlSetTextOptions(c, _options)
                    c.fontSize = _options.titleSize
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
                case 'text':
                case 'menu':
                    c = new BABYLON.GUI.TextBlock()
                    c.type = field.type
                    c.text = field.text
                    this._controlSetFieldOptions(c, field)
                    if (!field.height) {
                        c.resizeToFit = true
                    }
                    this._controlSetAlign(c, _options)
                    this._controlSetTextAlign(c, _options)
                    this._controlSetTextOptions(c, _options)
                    if (field.type == 'menu') {
                        this._controlSetEvents(c, fid)
                        this._selectable[this._sid][fid] = c
                    } else if (field.clickable) {
                        this._controlSetEvents(c, fid)
                    }
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
                case 'image':
                    c = new BABYLON.GUI.Image("image-"+fid, field.src);
                    c.type = field.type
                    c.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM
                    if (field.cellWidth || field.cellHeight) {
                        c.cellWidth = field.cellWidth
                        c.cellHeight = field.cellHeight
                        c.cellId = field.cellId
                    }
                    if (field.pixelated) {
                        c.pixelated = true
                    }
                    this._controlSetFieldOptions(c, field)
                    this._controlSetAlign(c, _options)
                    if (field.clickable) {
                        this._controlSetEvents(c, fid)
                    }
                    parent.addControl(c)
                    this._fields[fid] = c
                    break;
               case 'stack':
               case 'scroll':
                    if (field.type == 'stack') {
                        c = new BABYLON.GUI.StackPanel()
                    } else {
                        c = new BABYLON.GUI.ScrollViewer()
                    }
                    c.type = field.type
                    c.isVertical = true
                    this._controlSetFieldOptions(c, field)
                    this._controlSetAlign(c, _options)
                    parent.addControl(c)
                    this._buildControls(c, field.c, _options)
                    break;
                default:
                    console.error(`[MenuSystem] Unknown type: ${field.type}`)
            }
        }
    }

    _controlSetAlign(c, options) {
        if (options.align == 'center') {
            c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
        } else if (options.align == 'right') {
            c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
        } else {
            c.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        }                    
        if (options.valign == 'center') {
            c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        } else if (options.valign == 'bottom') {
            c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
        } else {
            c.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
        }
    }

    _controlSetTextAlign(c, options) {
        if (options.align == 'left') {
            c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        } else if (options.align == 'right') {
            c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
        } else {
            c.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
        }                    
        if (options.valign == 'top') {
            c.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
        } else if (options.valign == 'bottom') {
            c.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
        } else {
            c.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        }
    }

    _controlSetTextOptions(c, options) {
        ['fontFamily','fontSize','fontStyle','fontWeight','selectedColor','color','alpha','paddingTop','paddingBottom','paddingLeft','paddingRight'].forEach(o => {
            if (typeof(options[o]) != 'undefined') {c[o] = options[o]}
        })
        if (options.shadow) {
            c.shadowOffsetX = 1
            c.shadowOffsetY = 1
            c.shadowColor = "rgba(0,0,0,0.4)"
            c.shadowBlur = 2
        }
    }

    _controlSetFieldOptions(c, options) {
        ['width','height','left','right','top','bottom','background','thickness','cornerRadius','back'].forEach(o => {
            if (typeof(options[o]) != 'undefined') {c[o] = options[o]}
        })
    }

    _controlSetEvents(c, fid) {
        c.hoverCursor = 'pointer'
        c.isPointerBlocker = true 
        c.onPointerEnterObservable.add((e) => {
            this._onevent('enter', fid,  e)
        });
        c.onPointerOutObservable.add((e) => {
            this._onevent('out', fid, e)
        })
        c.onPointerUpObservable.add((e) => {
            this._onevent('up', fid, e)
        })
    }

}

//hack to draw pixelated GUI images
BABYLON.GUI.Image.prototype.__original_draw = BABYLON.GUI.Image.prototype._draw
BABYLON.GUI.Image.prototype._draw = function (context) {
    context.webkitImageSmoothingEnabled = !this.pixelated;
    context.mozImageSmoothingEnabled = !this.pixelated;
    context.msImageSmoothingEnabled = !this.pixelated;
    context.imageSmoothingEnabled = !this.pixelated;
    this.__original_draw(context)
}
