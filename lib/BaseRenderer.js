var Class = require('klasse');
var Matrix4 = require('vecmath').Matrix4;
var colorString = require('color-string');
var BlendMode = require('./BlendMode');

var BaseRenderer = new Class({
	
    initialize: function() {
        this.transform = null;
        this.projection = null;

        /**
         * The tint is a RGB color that images and
         * graphics will be multiplied by. The RGB components
         * are bytes in the range 0 - 255. 
         *
         * You can modify these directly or use `setTint`
         * for convenience.
         *
         * @property tint
         * @type {Object}
         */
        this.tint = {
            r: 255,
            g: 255,
            b: 255
        };

        /**
         * This is the alpha used when rendering an image or graphics.
         * @type {Number}
         */
        this.alpha = 1.0;

        this.__blendMode = BlendMode.NORMAL;

        /** 
         * Kami WebGLContext for webgl-based renderers,
         * otherwise this is null. Do not modify.
         * @property {Boolean}
         */
        this.gl = null;

        this.Image2D = require('./Image2D').bind(this, this);
    },

    /**
     * A setter/getter for the blend mode of this renderer.
     *
     * @property {BlendMode} blendMode
     */

    // Subclasses should implement this getter/setter
    // blendMode: {}

    resize: function(width, height) {

    },

    //TODO
    setTransform: function(matrix) {
        this.transform = matrix;
    },

    //TODO
    /**
     * Sets the projection matrix. If this is set to
     * null, Canvas will attempt to optimize by not
     * using any projection matrix, and WebGL will use
     * a fallback orthographic 2D matrix that matches
     * the context size. 
     * 
     * @param {Array|Float32Array} matrix an array type for the projection matrix
     */
    setProjection: function(matrix) {
        this.projection = matrix;
    },
        
    /**
     * Sets the current alpha of the renderer.
     * @param {Number} a the new alpha
     */
    setAlpha: function(a) {
        this.alpha = a;
    },

    /**
     * Sets the current color tint; the RGB components are in the range 0 - 255. The alpha 
     * component is optional, and lies in the range 0.0 to 1.0. 
     * 
     * If a string is specified as the first parameter, it will be parsed with the color-string
     * module (alpha ignored). Note that this parsing will incur some slight overhead. 
     *
     * @method setTint
     * @param {Number} r the red component (0 - 255)
     * @param {Number} g the green component (0 - 255)
     * @param {Number} b the blue component (0 - 255)
     */
    setTint: function(r, g, b) {
        var t = this.tint;

        if (typeof r === "string") {
            var rgb = colorString.getRgb(r);
            t.r = rgb[0];
            t.g = rgb[1];
            t.b = rgb[2];
        } else {
            //floor
            t.r = ~~r;
            t.g = ~~g;
            t.b = ~~b;
        }
    },

    
    /**
     * Clears the canvas with the given bounds. Defaults to the
     * whole canvas, if parameters are omitted. 
     *     
     * @param  {Number} x      the x offset to clear, default 0
     * @param  {Number} y      the y offset to clear, default 0
     * @param  {Number} width  the width to clear, default to width of canvas
     * @param  {Number} height the height to clear, default to height of canvas
     */
    clear: function(x, y, width, height) {

    },

    /**
     * Fills a rectangle. 
     * @param  {[type]} x      [description]
     * @param  {[type]} y      [description]
     * @param  {[type]} width  [description]
     * @param  {[type]} height [description]
     * @return {[type]}        [description]
     */
    fillRect: function(x, y, width, height) {

    },

    drawRect: function(x, y, width, height) {

    },

    drawImageTiled: function(image, sx, sy, width, height, xScale, yScale, xOff, yOff) {

    },

    drawImage: function(image, x, y, width, height, sx, sy, swidth, sheight, rotation, rx, ry) {

    },

    drawLine: function(x1, y1, x2, y2) {

    },
});

module.exports = BaseRenderer;