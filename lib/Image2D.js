var Class = require('klasse');
var Signal = require('signals');
var Texture = require('kami').Texture;

//TODO: support <video> and <canvas> for WebGL textures 
//      will need some sort of updateTexture method 

/**
 * Creates an Image2D with the specified context.
 */
var Image2D = new Class({
	
    initialize: function Image2D(renderer, path, onSuccess, onError) {
        this.renderer = renderer;
        this.path = null;
        this.data = null;



        this.tinting = true;

        this.tintCache = null;

        /**
         * This is a canvas-only flag to notify the tint
         * manager that our ImageData is 'dirty'. This could
         * happen if we are using a dynamic Image source (like
         * a <video> tag or <canvas>), or if the image has just
         * finished loading and now has valid pixel data. 
         *
         * When the tint manager notices the image data is dirty,
         * it clears the current tints and starts again.
         * 
         * @type {Boolean}
         */
        this.tintDirty = true;

        var width = 0, height = 0;

        /**
         * The 'source' of an Image2D is either a DOM element like
         * Image, <video> or <canvas>, or it could be a Texture
         * in the case of WebGL support.
         *
         * @property {Object} source
         */
        this.source = null;

        //alternative constructor... just a path or Data URI
        if (typeof path === "string") {
            this.path = path;
        } else if (typeof arguments[1] === "number" && typeof arguments[2] === "number") {
            width = arguments[1];
            height = arguments[2];
            var data = arguments[3];
            if (data) {
                if (data.length !== (width * height * 4)) 
                    throw new Error("data must be an array type with length [width * height * 4]");
                this.data = data;
            }
            onSuccess = arguments[4];
            onError = arguments[5];
        } else if (typeof path === "object") {
            //we assume the object parameter IS the source... e.g. in the case of Texture
            //or <video>
            this.source = path;
            if (typeof onSuccess === "function")
                onSuccess();
        }

        if (!this.source)
            this.create(width, height, onSuccess, onError);
    },

    width: {
        get: function() {
            return this.source.width;
        }
    },

    height: {
        get: function() {
            return this.source.height;
        }
    },

    __onLoad: function(onSuccess) {
        this.tintDirty = true;
        if (typeof onSuccess === 'function')
            onSuccess();
    },

    create: function(width, height, onSuccess, onError) {
        var webgl = !!this.renderer.gl;

        //we have a WebGL context
        if (webgl) {
            //the WebGLContext
            var context = this.renderer.context;

            if (this.path) { //URI
                this.source = new Texture(context, this.path, onSuccess, onError);
            } else { //straight data
                this.source = new Texture(context, width, height, 
                                          Texture.Format.RGBA, Texture.DataType.UNSIGNED_BYTE,
                                          new Uint8Array(this.data));
                if (typeof onSuccess === "function")
                    onSuccess();
            }
        } 
        //we are working with Canvas...
        else {
            if (this.path) {
                this.source = new Image();
                this.source.onload  = this.__onLoad.bind(this, onSuccess);
                this.source.onabort = onError;
                this.source.onerror = onError;

                this.source.src = this.path;
            } else {
                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                var ctx = canvas.getContext("2d");
                var imgData = ctx.createImageData(width, height);
                var pixels = imgData.data;
                if (typeof Uint8ClampedArray !== "undefined" && pixels instanceof Uint8ClampedArray) {
                    var uint = new Uint8ClampedArray(this.data);
                    pixels.set(uint);
                } else {
                    var d = this.data;
                    //what kind of old browser is this !!!
                    for (var i=0; i<pixels.length; i++) {
                        pixels[i] = d[i];
                    }
                }
                ctx.putImageData(imgData, 0, 0);

                this.tintDirty = true;
                this.source = canvas;

                if (typeof onSuccess === "function")
                    onSuccess();
            }
        }
    },

    
});

module.exports = Image2D;



///