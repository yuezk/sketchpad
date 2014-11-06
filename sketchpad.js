(function (doc, win, undefined) {

    var Sketchpad = function (el, options) {
        this.options = {
            background: '#ccc',
            penColor: '#000',
            penWidth: 5,
            width: 300,
            height: 200
        };
        this.options = extend(this.options, options);

        this.ongoingTouches = []; //缓存在屏幕上面的touch
        this.initialized = false;
        this.canvas = document.getElementById(el);
        if (this.canvas === null) return new Error('cannot find canvas on the document');

        this.ctx = this.canvas.getContext('2d');

        this.init();
    };

    Sketchpad.prototype.init = function () {
        if (this.initialized) return;

        this._prepare();
        this._paint();
        this._bindEvents();
        this.initialized = true;
    };

    Sketchpad.prototype._prepare = function () {
        //ie mobile stop swipe;
        this.canvas.style.msTouchAction = 'none';
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
    };

    Sketchpad.prototype._paint = function () {
        this.ctx.fillStyle = this.options.background;
        this.ctx.fillRect(0, 0, this.options.width, this.options.height);
    };

    Sketchpad.prototype._getStartTouch = function(event) {
        var touches = [];

        if (event.changedTouches) {
            return event.changedTouches;
        }

        //ie mobile first touch
        if (this.ongoingTouches.length === 0) {
            touches.push({identifier: event.pointerId, pageX: event.pageX, pageY: event.pageY});
        }

        return touches;
    };

    Sketchpad.prototype._copyTouch = function (touch) {
        return {identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY};
    };

    /**
     * 得到手指位置相对于canvas的坐标
     */
    Sketchpad.prototype.getRelativePosition = function (touch) {
        var offset = getOffset(this.canvas);
        var computed = win.getComputedStyle(this.canvas);

        return {
            top: touch.pageY - offset.top - this.canvas.clientTop - parseInt(computed.paddingTop),
            left: touch.pageX - offset.left - this.canvas.clientLeft - parseInt(computed.paddingLeft)
        };
    };

    /**
     * 根据identifier获取缓存的touch
     */
    Sketchpad.prototype.getOngoingTouchIndex = function (id) {
        for (var i = 0; i < this.ongoingTouches.length; i++) {
            var identifier = this.ongoingTouches[i].identifier;
            if (identifier == id) {
                return i;
            }
        }

        return -1; //not found
    };

    Sketchpad.prototype._bindEvents = function () {
        var self = this;
        var ctx = self.ctx;

        if (win.navigator.msPointerEnabled) { //ie mobile
            this.canvas.addEventListener('MSPointerDown', handleStart, false);
            this.canvas.addEventListener('MSPointerMove', handleMove, false);
            this.canvas.addEventListener('MSPointerUp', handleEnd, false);
            //处理手指滑出canvas之后，并离开屏幕的事件
            this.canvas.ownerDocument.addEventListener('MSPointerUp', handleCancel, false);
            this.canvas.ownerDocument.addEventListener('MSPointerCancel', handleCancel, false);
        }

        this.canvas.addEventListener('touchstart', handleStart, false);
        this.canvas.addEventListener('touchmove', handleMove, false);
        this.canvas.addEventListener('touchend', handleEnd, false);
        this.canvas.addEventListener('touchcancel', handleCancel, false)

        function handleStart(e) {
            e.preventDefault();

            //新加入的touch
            var touches = self._getStartTouch(e);
            for(var i = 0; i < touches.length; i++) {
                self.ongoingTouches.push(self._copyTouch(touches[i]));
                /*
                var pos = self.getRelativePosition(touches[i]);
                ctx.beginPath();
                ctx.arc(pos.left, pos.top, 4, 0, 2 * Math.PI, false);
                ctx.fillStyle = '#000';
                ctx.fill();*/
            }
        }

        function handleMove(e) {
            e.preventDefault();

            var touches = e.changedTouches || [{identifier: e.pointerId, pageY: e.pageY, pageX: e.pageX}];

            for (var i = 0; i < touches.length; i++) {
                var id = self.getOngoingTouchIndex(touches[i].identifier);

                if (id >= 0) {

                    var touch = self.ongoingTouches[id]; //cached touch
                    var pos = self.getRelativePosition(touch); //起点
                    var newPos = self.getRelativePosition(touches[i]); //终点

                    //画线
                    ctx.beginPath();
                    ctx.moveTo(pos.left, pos.top);
                    ctx.lineTo(newPos.left, newPos.top);

                    ctx.strokeStyle = self.options.penColor;
                    ctx.lineWidth = self.options.penWidth;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    self.ongoingTouches.splice(id, 1, self._copyTouch(touches[i])); //换成新的
                } else {
                    //之前没有缓存过 
                    //console.log('no cached touch');
                }
            }
        }

        function handleEnd(e) {
            e.preventDefault();

            var touches = e.changedTouches || [{identifier: e.pointerId, pageY: e.pageY, pageX: e.pageX}];
            for (var i = 0; i < touches.length; i++) {
                var id = self.getOngoingTouchIndex(touches[i].identifier);

                if (id >= 0) {
                    self.ongoingTouches.splice(id, 1); //移除
                } else {

                }
            }
        }

        function handleCancel(e) {
            e.preventDefault();

            var touches = e.changedTouches || [{identifier: e.pointerId, pageY: e.pageY, pageX: e.pageX}];
            for (var i = 0; i < touches.length; i++) {
                self.ongoingTouches.splice(i, 1); //全部移除
            }
        }
    };

    Sketchpad.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.options.width, this.options.height);
        this._paint();
    };

    Sketchpad.prototype.getDataURI = function () {
        return this.canvas.toDataURL();
    };

    /**
     * utils
     */
    function extend(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }

        return target;
    }

    function getOffset(ele) {
        var box = {top: 0, left: 0};
        var doc = ele.ownerDocument;
        var docElem = doc.documentElement;
        var win = doc.defaultView;

        if (ele.getBoundingClientRect) {
            box = ele.getBoundingClientRect();
        }

        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    win.Sketchpad = Sketchpad;
})(document, window);