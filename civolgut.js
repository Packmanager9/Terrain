
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } 
    
    class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.dot = new Circle(x,y, size/6, "brown")
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size + (size * .193), "transparent")
            this.bigbody = new Circle(x, y, (size - (size * .293))*8.9, "transparent")
            this.smallbody = new Circle(x, y, (size - (size * .293))*3.5, "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }

            this.farmvalue = (Math.random()*19)+5
            this.pollution = 0
            this.minerals = (Math.random()*19)+5
            this.population = 0
            if(Math.random()<.006){
                this.minerals+=worldflood*3
                // this.farmvalue-=worldflood*3
            }
            if(Math.random()<.05){
                this.farmvalue+=worldflood/20
            }
            if(Math.random()<.001){
                this.farmvalue+=worldflood*2
            }
            this.color = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`
            this.colorsto = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`
            this.strokecolor = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`

            this.info = {}
            this.info.Farmability = this.farmvalue*10
            this.info.Moisture = this.minerals*10
            // this.info.Region = 'a'
        }
        name(){
            RegionNamer(this)
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .00293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.info.Farmability = this.farmvalue*10
            this.info.Moisture = this.minerals*10
            this.info.Inhabited = this.population
            this.info.Pollution = this.pollution
            if(this.info.Farmability < this.info.Moisture){
                if(this.population == 0){
                    this.info.Farmability = 0
                }
            }
            if(this.info.Farmability > this.info.Moisture){
                this.info.Moisture *= .7
            }
            this.info.Region = this.name
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            map_context.strokeStyle = this.color
            map_context.fillStyle = this.color
            map_context.lineWidth = 0
            map_context.beginPath()
            map_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                map_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            map_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            map_context.stroke()
            map_context.fill()
            if(this.strokecolor == "red"){
                map_context.strokeWidth = .5
            }else{
                map_context.strokeWidth = 1
            }
            map_context.strokeStyle = this.strokecolor
            map_context.stroke()
            map_context.closePath()
            if(this.population > 0){
                map_context.lineWidth = this.dot.strokeWidth
                map_context.strokeStyle = this.dot.color
                map_context.beginPath();
                if (this.dot.radius > 0) {
                    map_context.arc(this.dot.x, this.dot.y, this.dot.radius, 0, (Math.PI * 2), true)
                    map_context.fillStyle = this.dot.color
                    map_context.fill()
                    map_context.stroke();
                } 
                let growth = this.farmvalue
                let drop = this.farmvalue*.001
                this.population+=growth
                this.pollution+=drop
                this.farmvalue*=.9999
            }
        }
    }
    class Polygonlocal {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.bigbody = new Circle(x, y, (size - (size * .293))*8.9, "transparent")
            this.smallbody = new Circle(x, y, (size - (size * .293))*3.5, "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }

            this.farmvalue = (Math.random()*19)+5
            this.minerals = (Math.random()*19)+5
            if(Math.random()<.009){
                this.minerals+=worldflood*3
            }
            if(Math.random()<.05){
                this.farmvalue+=worldflood/20
            }
            if(Math.random()<.001){
                this.farmvalue+=worldflood*2
            }
            this.color = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`
            this.colorsto = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`
            this.strokecolor = `rgb(${this.minerals*5},${this.farmvalue*10}, ${this.minerals*5})`

        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size + (this.size * 1.3293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {

            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.stroke()
            canvas_context.fill()
            canvas_context.strokeWidth = .5
            canvas_context.strokeStyle = this.strokecolor
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        map_context = map_canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        canvas.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


            for(let t = 0;t<grid.blocks.length;t++){
                if(grid.blocks[t].isPointInside(TIP_engine)){
                    selected.strokecolor = selected.color
                    selected.draw()
                    selected.draw()
                    selected.draw()
                    selected = grid.blocks[t]
                    break
                }
            }

            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[2] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed * gamepadAPI.axesStatus[0]
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document
    let map_canvas = document.getElementById('map') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 


class HexGrid{
    constructor(size) {
        this.blocks = []
        this.count = 0
        for (let t = 0; t < canvas.width+1; t += Math.floor(size*1.6)) {
            // this.holdblocks = []
            let y = 0
            for (let k = 0; k <900; k += Math.floor(size*1.6)) {
                if(y%2==0){
                    const rect = new Polygon(k, t, size, "white", 6)
                    // rect.draw()
                    rect.t = Math.floor(t / Math.floor(size*1.6))
                    rect.k = Math.floor(k / Math.floor(size*1.6))
                    rect.count = this.count
                    this.count++
                    this.blocks.push(rect)

                }else{

                const rect = new Polygon(k, t+Math.floor(size*.8), size, "red", 6)
                // rect.draw()
                rect.t = Math.floor(t / Math.floor(size*1.6))
                rect.k = Math.floor(k / Math.floor(size*1.6))
                rect.count = this.count
                this.count++
                this.blocks.push(rect)
                }
                y++
            }


            // this.blocks.push([...this.holdblocks])
        }
        

        for (let t = 0; t < this.blocks.length; t++) {
            this.blocks[t].avgr = {}
            this.blocks[t].avgr.c = 0
            this.blocks[t].avgr.m = 0
            this.blocks[t].avgr.f = 0
            for (let k = 0; k < this.blocks.length; k++) {
                if(this.blocks[t].bigbody.isPointInside(this.blocks[k].body)){
                    this.blocks[t].avgr.m += this.blocks[k].minerals
                    this.blocks[t].avgr.f += this.blocks[k].farmvalue
                    this.blocks[t].avgr.c++
                }
            }

        }



        for (let t = 0; t < this.blocks.length; t++) {
        this.blocks[t].avgr.m /=  this.blocks[t].avgr.c
        this.blocks[t].avgr.f /=  this.blocks[t].avgr.c
        this.blocks[t].farmvalue =  this.blocks[t].avgr.f
        this.blocks[t].minerals =  this.blocks[t].avgr.m
        }

        for (let t = 0; t < this.blocks.length; t++) {
            this.blocks[t].avgr = {}
            this.blocks[t].avgr.c = 0
            this.blocks[t].avgr.m = 0
            this.blocks[t].avgr.f = 0
            for (let k = 0; k < this.blocks.length; k++) {
                if(this.blocks[t].bigbody.isPointInside(this.blocks[k].body)){
                    this.blocks[t].avgr.m += this.blocks[k].minerals
                    this.blocks[t].avgr.f += this.blocks[k].farmvalue
                    this.blocks[t].avgr.c++
                }
            }

        }



        for (let t = 0; t < this.blocks.length; t++) {
        this.blocks[t].avgr.m /=  this.blocks[t].avgr.c
        this.blocks[t].avgr.f /=  this.blocks[t].avgr.c
        this.blocks[t].farmvalue =  this.blocks[t].avgr.f
        this.blocks[t].farmvaluex =  this.blocks[t].avgr.f
        this.blocks[t].minerals =  this.blocks[t].avgr.m
        this.blocks[t].wet =  1
        if(this.blocks[t].farmvalue > this.blocks[t].minerals){
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
            this.blocks[t].wet =  0
        }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 1){
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *7}, ${this.blocks[t].minerals *7.5})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *7}, ${this.blocks[t].minerals *7.5})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *7}, ${this.blocks[t].minerals *7.5})`
        }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 2){
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
        }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 3){
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *9.3})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *9.3})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *9.3})`
        }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 4){
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *3}, ${this.blocks[t].minerals *9.5})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *3}, ${this.blocks[t].minerals *9.5})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *3}, ${this.blocks[t].minerals *9.5})`
        }else{
            this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *2}, ${this.blocks[t].minerals *10})`
            this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *2}, ${this.blocks[t].minerals *10})`
            this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *2}, ${this.blocks[t].minerals *10})`
        }
        }

        for (let t = 0; t < this.blocks.length; t++) {
            this.blocks[t].name()
        }
    }
    draw() {

        for (let t = 0; t < this.blocks.length; t++) {
            // this.blocks[t].minerals += .5
            if(this.blocks[t].farmvalue > this.blocks[t].minerals){
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *5},${this.blocks[t].farmvalue *10}, ${this.blocks[t].minerals *.5})`
            }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 1){
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *9}, ${this.blocks[t].minerals *6.5})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *9}, ${this.blocks[t].minerals *6.5})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.8},${this.blocks[t].farmvalue *9}, ${this.blocks[t].minerals *6.5})`
            }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 2){
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *8}, ${this.blocks[t].minerals *7.5})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *8}, ${this.blocks[t].minerals *7.5})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.6},${this.blocks[t].farmvalue *8}, ${this.blocks[t].minerals *7.5})`
            }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 3){
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.4},${this.blocks[t].farmvalue *6}, ${this.blocks[t].minerals *8.5})`
            }else if(Math.abs(this.blocks[t].farmvalue - this.blocks[t].minerals) <= 4){
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *5}, ${this.blocks[t].minerals *9.5})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *5}, ${this.blocks[t].minerals *9.5})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.2},${this.blocks[t].farmvalue *5}, ${this.blocks[t].minerals *9.5})`
            }else{
                this.blocks[t].color = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *10})`
                this.blocks[t].colorsto = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *10})`
                this.blocks[t].strokecolor = `rgb(${this.blocks[t].minerals *1.0},${this.blocks[t].farmvalue *4}, ${this.blocks[t].minerals *10})`
            }
            }
        for (let t = 0; t < this.blocks.length; t++) {
            // for (let k = 0; k < this.blocks[t].length; k++) { 
                if(this.blocks[t] == selected){
                    this.blocks[t].strokecolor = "red"
                }else{
                    this.blocks[t].strokecolor = this.blocks[t].colorsto
                }
                this.blocks[t].draw()
               
            // }
        }
    }
}

class UI{
    constructor(){
        this.box = new Rectangle(900, 0, 380, 900, "gray")
        this.info = Object.keys(selected.info)
    }
    draw(){
        this.info = Object.keys(selected.info)
        this.box.draw()
        let x = 940
        let y = 40
        canvas_context.fillStyle =  "black"
        canvas_context.font =  "20px arial"
        for(let t = 0;t<this.info.length;t++){
            if(typeof selected.info[this.info[t]] == "number"){
                canvas_context.fillText(`${this.info[t]} : ${Math.round(selected.info[this.info[t]])}`, x,y)
            }else{
                canvas_context.fillText(`${this.info[t]} : ${(selected.info[this.info[t]])}`, x,y)
            }
            y+=40
        }

    }
}

class City{
    constructor(tile, society){
        this.tile = tile
        this.society = society
        this.smallbody = tile.smallbody
        this.bigbody = tile.bigbody
        this.dot = tile.dot
        this.body = new Circle(this.society.x, this.society.y, 2, this.society.color)
    }
    draw(){
        this.body.draw()
    }



}


class Society{
    constructor(color){
        this.color = color
        this.cities = []
        this.roads = []
        this.roadlength = 50
    }
    draw(){
        for(let t = 0;t<this.cities.length;t++){
            this.cities[t].draw()
        }
       
        for(let t = 0;t<this.roads.length;t++){
            this.roads[t].draw()
        }
    }

}


let selected = {}
let kingdoms = []
let intimates = new Society('pink')
let pinwheel = new Society('#00aaaa')
let adobrasig = new Society('orange')
let earth = new Society('blue')
kingdoms.push(intimates)
kingdoms.push(pinwheel)
kingdoms.push(earth)
kingdoms.push(adobrasig)
selected.info = {}
let ui = new UI()
let worldflood = 40
function duura(){
}
selected.draw = duura
let grid = new HexGrid(12)
grid.draw()

// canvas_context.scale(2,2)

let teamcounterdemo = -1
let teamnum = 0
    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        teamcounterdemo++
        if(teamcounterdemo > 1){
            if(keysPressed['t']){
                teamnum++
                teamnum%=kingdoms.length
                teamcounterdemo = -30
            }
        }
        // game code goes here
        canvas_context.drawImage(map_canvas, 0,0)
        selected.strokecolor = "red"
        selected.draw() 
        // grid = new HexGrid(6)
        ui.draw()
        for(let d = 0;d<kingdoms.length;d++){
            kingdoms[d].draw()
        }

        // for(let d = 0;d<kingdoms.length;d++){
        if(keysPressed[' ']){
            if((selected.farmvaluex - selected.minerals) >= 0){
            if(selected.population == 0){
                selected.population = 100
                if(!kingdoms[teamnum].cities.includes(selected)){
                    let city = new City(selected, kingdoms[teamnum])
                    kingdoms[teamnum].cities.push(city)

                    kingdoms[teamnum].roads = []
                    for(let t = 0;t<kingdoms[teamnum].cities.length;t++){
                        for(let k = 0;k<kingdoms[teamnum].cities.length;k++){
                            if(t!=k){
                                if(kingdoms[teamnum].cities[t].smallbody.doesPerimeterTouch(kingdoms[teamnum].cities[k].smallbody)){
                                    let wet = 0
                                    let link = new LineOP(kingdoms[teamnum].cities[k].dot, kingdoms[teamnum].cities[t].dot)
                                    let ball = new Circle(kingdoms[teamnum].cities[t].body.x, kingdoms[teamnum].cities[t].body.y, 1, "transparent", (kingdoms[teamnum].cities[k].body.x-kingdoms[teamnum].cities[t].body.x)/100,  (kingdoms[teamnum].cities[k].body.y-kingdoms[teamnum].cities[t].body.y)/100)
                                    let ft = 102
                                    while(!kingdoms[teamnum].cities[t].smallbody.doesPerimeterTouch(ball)){
                                        ft--
                                        ball.move()
                                        for(let g = 0;g<grid.blocks.length;g++){
                                            if(grid.blocks[g].body.isPointInside(ball)){
                                                    if((grid.blocks[g].wet) == 1 ){
                                                        wet = 1
                                                    }
                                            }
                                        }
                                        if(ft<0){
                                            break
                                        }
                                    }
                                    if(wet!=1){
                                        kingdoms[teamnum].roads.push(link)
                                    }
                                }
                            }
                        }
                    }
                    for(let t = 0;t<kingdoms[teamnum].cities.length-1;t++){
                        
            
                        // if(society.cities[t].smallbody.doesPerimeterTouch(society.cities[t+1].smallbody)){
                            if(kingdoms[teamnum].cities[t+1]){


                            let wet = 0
                            let link = new LineOP(kingdoms[teamnum].cities[t].dot, kingdoms[teamnum].cities[t+1].dot)
                            if(link.hypotenuse()<kingdoms[teamnum].roadlength){

                                let ball = new Circle(kingdoms[teamnum].cities[t].body.x, kingdoms[teamnum].cities[t].body.y, 1, "transparent", (kingdoms[teamnum].cities[t+1].body.x-kingdoms[teamnum].cities[t].body.x)/100,  (kingdoms[teamnum].cities[t+1].body.y-kingdoms[teamnum].cities[t].body.y)/100)
                                let ft = 102
                                while(!kingdoms[teamnum].cities[t+1].smallbody.doesPerimeterTouch(ball)){
                                    ft--
                                    ball.move()
                                    for(let g = 0;g<grid.blocks.length;g++){
                                        if(grid.blocks[g].body.isPointInside(ball)){
                                                if((grid.blocks[g].wet == 1) ){
                                                    wet = 1
                                                }
                                        }
                                    }
    
                                    if(ft<0){
                                        break
                                    }
                                }
                                if(wet!=1){
                                    kingdoms[teamnum].roads.push(link)
                                }
                            // }
                
                
                                }

                            }
                    }
                }
            }
        }
    }

    canvas_context.fillStyle = kingdoms[teamnum].color
    canvas_context.fillRect(950, 600, 50,50)
// }
    }

    function RegionNamer(region){

        let vowels = 'aeiouy'.split('')
        let consonants = 'bcdfghjklmnpqrstvwxz'.split('')
        region.name = ''

        let namelength = (Math.random()*6)+2
        for(let t = 0;t<namelength;t++){
            if(Math.random()<.6){
                region.name+=vowels[Math.floor(Math.random()*vowels.length)]
            }else{
                region.name+=consonants[Math.floor(Math.random()*consonants.length)]
            }
            if(t == 0){
                region.name = region.name.toUpperCase()
            }
        }


        if(region.farmvalue > region.minerals){
            if(Math.random()<.1){
                region.name += ' County'
            }else if(Math.random()<.1){
                region.name += ' Valley'
            }else if(Math.random()<.11){
                region.name += ' Foothills'
            }else if(Math.random()<.13){
                region.name += ' Plateau'
            }else if(Math.random()<.16){
                region.name += ' Forest'
            }else if(Math.random()<.2){
                region.name += ' Jungle'
            }else if(Math.random()<.24){
                region.name += ' Tundra'
            }else if(Math.random()<.3){
                region.name += ' Marsh'
            }else if(Math.random()<.36){
                region.name += ' Swamp'
            }else{        
            if(Math.random()<.1){
                region.name += ' County'
            }else if(Math.random()<.1){
                region.name += ' Valley'
            }else if(Math.random()<.11){
                region.name += ' Foothills'
            }else if(Math.random()<.13){
                region.name += ' Plateau'
            }else if(Math.random()<.16){
                region.name += ' Forest'
            }else if(Math.random()<.2){
                region.name += ' Jungle'
            }else if(Math.random()<.24){
                region.name += ' Tundra'
            }else if(Math.random()<.3){
                region.name += ' Marsh'
            }else if(Math.random()<.36){
                region.name += ' Swamp'
            }else{
                region.name += ' Plain'
            }
            }
            
        }else if(Math.abs(region.farmvalue - region.minerals) <= 1){
            region.name += ' Coastal Sea'
        }else if(Math.abs(region.farmvalue - region.minerals) <= 2){
            region.name += ' Deep Sea'
        }else if(Math.abs(region.farmvalue - region.minerals) <= 3){
            region.name += ' Ocean'
        }else if(Math.abs(region.farmvalue - region.minerals) <= 4){
            region.name += ' Open Water'
        }else{
            region.name += ' Depths'
        }
    }
})