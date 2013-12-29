var Class = require('klasse');
var BaseRenderer = require('../BaseRenderer');
var colorString = require('color-string');
var TintCache = require('./TintCache');

var drawTintedImage = require('./tint').drawTintedImage;

var Image2D = require('../Image2D');

var CanvasRenderer = new Class({

    Mixins: BaseRenderer,

    initialize: function CanvasRenderer(width, height, view) {
        BaseRenderer.call(this);
        
        /**
         * The canvas DOM element for this context.
         * @property {Number} view
         */
        this.view = view || document.createElement("canvas");

        //default size as per spec:
        //http://www.w3.org/TR/2012/WD-html5-author-20120329/the-canvas-element.html#the-canvas-element
        
        /**
         * The width of this canvas.
         *
         * @property width
         * @type {Number}
         */
        this.width = this.view.width = width || 300;

        /**
         * The height of this canvas.
         * @property height
         * @type {Number}
         */
        this.height = this.view.height = height || 150;

        this.context = this.view.getContext("2d");

        this.currentContext = this.context;

        //to reduce redunant context calls...
        this.__lastTint = null;
        this.__lastAlpha = null;
        this.__lastFillStyle = null;
        this.__lastStrokeStyle = null;
        
        this.tinting = true;
        this.tintCaching = true;

        this.buffer = null;
        this.bufferContext = null;
    },


    blendMode: {
        get: function() {
            return this.__blendMode;
        },

        set: function(val) {
            if (!val || !val.operation)
                throw new Error("invalid blend mode; doesn't contain 'operation' value for canvas"); 
            this.__blendMode = val;
            this.currentContext.globalCompositeOperation = val.operation;
        } 
    },

    /**
     * Flushes the renderer, ensuring that its state is set correctly (e.g. fill styles).
     * If you want to operate directly on the currentContext, you should call this first to
     * ensure the colors are set correctly.
     * 
     * @return {[type]} [description]
     */
    flush: function() {
        this.__updateColors(true, true);

        this.currentContext.globalCompositeOperation = this.blendMode.operation;
    },

    setTint: function(r, g, b) {
        BaseRenderer.prototype.setTint.call(this, r, g, b);
        this.__updateColors(true, true);
    },


    setAlpha: function(a) {
        BaseRenderer.prototype.setAlpha.call(this, a);
        this.__updateColors(false, false);
    },

    /**
     * Updates the width and height of this renderer and
     * resizes the underlying DOM view.
     * 
     * @param  {Number} width  the new width
     * @param  {Number} height the new height
     */
    resize: function(width, height) {
        this.width = width;
        this.height = height;

        this.view.width = width;
        this.view.height = height;
    },

    clear: function(x, y, width, height) {
        x = x || 0;
        y = y || 0;
        width = (width===0 || width) ? width : this.width;
        height = (height===0 || height) ? height : this.height;
        this.currentContext.clearRect(x, y, width, height);
    },

    __updateColors: function(fill, stroke) {
        var lt = this.__lastTint,
            t  = this.tint,
            la = this.__lastAlpha,
            a  = this.alpha,
            ctx = this.currentContext;

        if ((la!==0 && !la) || a !== la) { //we have a new alpha...
            ctx.globalAlpha = a;
            this.__lastAlpha = a;
        }

        if (!fill && !stroke)
            return;

        //We'll have to handle this a bit differently with pattern & gradients

        //now update fill and stroke colors
        if (!lt  //no last tint, e.g. on context switch
            || lt.r !== t.r
            || lt.g !== t.g
            || lt.b !== t.b) { //we have a new tint
            //parse the string, make sure we're giving ints to color-string for correct output
            var str = colorString.rgbString([ ~~t.r, ~~t.g, ~~t.b]);

            //update context fill/stroke style
            if (fill) 
                ctx.fillStyle = this.__lastFillStyle = str;
            if (stroke)
                ctx.strokeStyle = this.__lastStrokeStyle = str;

            //save our new bytes
            if (!lt)
                lt = { r: t.r, g: t.g, b: t.b };
            else {
                lt.r = t.r;
                lt.g = t.g;
                lt.b = t.b;    
            }
        }
    },

    fillRect: function(x, y, width, height) {
        this.__updateColors(true, false);
        this.currentContext.fillRect(x, y, width, height);
    },

    drawRect: function(x, y, width, height) {
        this.__updateColors(false, true);
        this.currentContext.strokeRect(x, y, width, height);
    },

    __tint: function(image) {
        if (this.buffer === null) {
            this.buffer = document.createElement("canvas");
            this.bufferContext = this.buffer.getContext("2d");
        }

        var width = image.width,
            height = image.height;

        this.buffer.width = width;
        this.buffer.height = height;

        //update the colors
        this.__updateColors(true, false);

        var bctx = this.bufferContext;
        bctx.fillStyle = this.__lastFillStyle; //the RGB tint
        bctx.fillRect(0, 0, width, height);
        bctx.globalCompositeOperation = 'destination-atop';
        bctx.drawImage(image, 0, 0);

        
    },

    drawImage: function(image, x, y, width, height) {
        var src = image.source,
            ctx = this.currentContext;
        if (!src)
            return;

        x = x || 0;
        y = y || 0;
        width = (width===0 || width) ? width : src.width;
        height = (height===0 || height) ? height : src.height;



        var tint = this.tint,
            r = ~~tint.r,
            g = ~~tint.g,
            b = ~~tint.b;

        this.__updateColors(true, false);

        //if we are tinting something other than white (default)
        if (this.tinting && image.tinting && (r !== 255 || g !== 255 || b !== 255)) {
            //cheap tinting is enabled... dooo it
            if (!this.tintCaching) {
                drawTintedImage(ctx, src, this.__lastFillStyle, x, y, width, height);
                return;
            }

            //OK.. we need to tint the image..
            if (!image.tintCache)
                image.tintCache = new TintCache(image);

            src = image.tintCache.tinted( r, g, b, this.__lastFillStyle );
        }
            
        ctx.drawImage(src, x, y, width, height);
    },




    /**
     * Pre-populates an image's tint cache with a list of
     * colors. This will skip entries that already exist
     * in the tint cache, unless overwrite is specified as true.
     * Also, #fff is skipped. 
     *
     * This is independent of the tintCaching and tinting properties.
     * 
     */
    // generateTints: function(image, colors, overwrite) {
    //     if (!image.tintCache)
    //         image.tintCache = new TintCache();

    //     var len = image.tintCache.tints.length;
    //     var src = image.source;

    //     for (var i=0; i<colors.length && i<len; i++) {
    //         var t = colorString.getRgb(colors[i]);
    //         var r = t[0],
    //             g = t[1],
    //             b = t[2];

    //         if (!overwrite && this.contains(r, g, b))
    //             continue;

    //         var tintedSrc = createTintedCanvas(src, r, g, b);
    //         var tinted = new Image2D( this, tintedSrc );
    //         image.tintCache.put(r, g, b, tinted);
    //     }
    // }


});

module.exports = CanvasRenderer;