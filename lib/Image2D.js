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

        this._tintCaching = true;
        this._tintCacheSize = Image2D.DEFAULT_TINT_CACHE_SIZE;
        this._tintCacheFuzziness = Image2D.DEFAULT_TINT_CACHE_FUZZINESS;
        this._tintMode = Image2D.DEFAULT_TINT_MODE;

        /**
         * Images being tinted with the CanvasRenderer can use
         * a TintCache to improve performance, at the cost of memory
         * usage. A tint cache is created lazily, when a tint is necessary.
         *
         * Users should not modify this object. 
         * 
         * @property {TintCache} tintCache
         * @private
         */
        this.tintCache = null;

        /**
         * This is a canvas-only flag to notify the tint
         * manager that our ImageData is 'dirty'. This could
         * happen if we are using a dynamic Image source (like
         * a <video> tag or <canvas>). When an Image is loaded
         * asynchronously, `tintDirty` will be set to true for us.
         *
         * When the tint manager notices the image data is dirty,
         * it clears the current cache of tints and starts over.
         * 
         * @property {Boolean} tintCache
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

    

    /**
     * This is a canvas-only property which enables or disables
     * "tint caching." This is a technique to improve performance,
     * at the cost of memory usage. If this is set to false, any current
     * tint cache will be destroyed.
     * 
     * @property {Boolean} tintCaching
     * @default  true
     */
    tintCaching: {
        set: function(val) {
            if (!val && this.tintCache) {
                this.tintCache.destroy();
                this.tintCache = null; 
            }
            this._tintCaching = !!val;
        },

        get: function() {
            return this._tintCaching;
        }
    },

    /**
     * This is a canvas-only property which sets the size of the 
     * tint cache backing this image. 
     * 
     * Note: If the newly requested size is different from the old size, 
     * this will clear the current tint cache. So it should not be changed
     * frequently.
     * 
     * @property {Number} tintCacheSize
     * @default  5
     */
    tintCacheSize: {
        set: function(val) {
            if (val <= 0)
                throw new Error("tintCacheSize must be > 0");
            if (this.tintCache && val !== this._tintCacheSize) {
                this.tintCache.destroy();
                this.tintCache = null;
            }
            this._tintCacheSize = val;
        },

        get: function() {
            return this._tintCacheSize;
        }
    },

    /**
     * This is a canvas-only property which adjusts the fuzziness of
     * the associated tint cache. This decreases the memory usage 
     * of the tint cache, at the cost of color precision.
     *
     * @property {Number} tintCacheFuzziness
     * @default  3
     */
    tintCacheFuzziness: {
        set: function(val) {
            if (val < 0)
                throw new Error("tintCacheFuzziness must be >= 0");
            if (this.tintCache) {
                this.tintCache.fuzziness = val;
            }
            this._tintCacheFuzziness = val;
        },

        get: function() {
            return this._tintCacheFuzziness;
        }
    },

    /**
     * This is a canvas-only property which sets the tinting 
     * method for this image. 
     *
     * If TintMode.FASTEST is used, we will try to render
     * the tint using the 'multiply' blend mode. However, if
     * that is not supported (currently IE, Opera, and Safari
     * don't support it), we will fall back to the COLORIZE method,
     * which uses a simple 'destination-atop' composite to colorize
     * a sprite. 
     * 
     * Note that even with the 'multiply' mode, this is not a completely
     * accurate color multiply operation.
     *
     * If TintMode.BEST is used, we will use per-pixel processing
     * to ensure that we achieve a true color multiply across browsers. 
     * __This currently only works when tintCaching is enabled.__ If caching is 
     * disabled, this mode will have the same effect as TintMode.FASTEST.
     * 
     * If TintMode.COLORIZE is used, we will simply use 'destination-atop'.
     * This may be useful if you want consistent tint across all browsers,
     * and you're more concerned with performance than the actual multiply
     * operation.
     *
     * Note that this will clear the current tint cache, so it's best
     * not to change this frequently.
     * 
     * @property {TintMode} tintMode
     * @default  TintMode.FASTEST
     */
    tintMode: {
        set: function(val) {
            if (val !== Image2D.TintMode.FASTEST
                    && val !== Image2D.TintMode.BEST
                    && val !== Image2D.TintMode.COLORIZE)
                throw new Error("invalid parameters to tintMode");

            if (this.tintCache) {
                this.tintCache.destroy();
                this.tintCache = null;
            }
            this._tintMode = val;
        },

        get: function() {
            return this._tintMode;
        }
    },
});

/**
 * These are canvas-only flags to indicate how to tint the sprite.
 * 
 * ```
 *     TintMode.BEST
 *     TintMode.FASTEST
 *     TintMode.COLORIZE
 * ```
 *
 * See
 * {{#crossLink "Image2D/tintMode:property"}}{{/crossLink}} for details.
 * 
 * @attribute {Object} TintMode
 */
Image2D.TintMode = {
    BEST: "BEST",
    FASTEST: "FASTEST",
    COLORIZE: "COLORIZE"
};

Image2D.DEFAULT_TINT_CACHE_FUZZINESS = 3;
Image2D.DEFAULT_TINT_CACHE_SIZE = 5;
Image2D.DEFAULT_TINT_MODE = Image2D.TintMode.FASTEST;

module.exports = Image2D;



///