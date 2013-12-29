var Class = require('klasse');

var createTintedCanvas = require('./tint').createTintedCanvas;
var Image2D = require('../Image2D');
var ImageBuffer = require('imagebuffer');

var colorString = require('color-string');
var tint = require('./tint').tint;

var TintCache = new Class({
	
	initialize: function(image, maxTints) {
        if (!image)
            throw new Error("TintCache must be tied to a single Image2D");
        this.image = image;

        var maxTints = maxTints || TintCache.DEFAULT_MAX_TINTS;

        //We can optimize further by using a true hash table
        //and storing the hex code as integer. 
        //But for now a simple parallel array and indexOf will do the trick
        this.tints = new Array(maxTints);
        this.descriptors = new Array(maxTints); //stores objects containing ImageData, Canvas, Context

        this.fuzziness = TintCache.DEFAULT_FUZZINESS || 0;
        this.pointer = 0;

        //We only use pixel data when compositing is false... 
        this.__usePixelData = !TintCache.DEFAULT_COMPOSITING;

        this.canvas = this.__usePixelData ? document.createElement("canvas") : null;
        this.context = this.__usePixelData ? this.canvas.getContext("2d") : null;

        //the ImageBuffer tied to the original data
        this.buffer = null;
	},

    /**
     * Returns a tinted canvas for the image associated
     * with this TintCache.
     * 
     * @param  {[type]} r [description]
     * @param  {[type]} g [description]
     * @param  {[type]} b [description]
     * @return {[type]}   [description]
     */
    tinted: function(r, g, b, fillStyle) {
        var src = this.image.source;

        var i = -1;

        var usePixelData = this.__usePixelData;

        //In pixel multiply mode, we need to cache the ImageData whenever it changes
        if (usePixelData && (this.image.tintDirty || !this.buffer)) {
            var canvas = this.canvas, 
                ctx = this.context;

            var w = src.width, h = src.height;

            canvas.width = w;
            canvas.height = h;

            //draw the image to the off-screen canvas
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(src, 0, 0);

            //get its image data
            var imageData = ctx.getImageData(0, 0, w, h);

            //get a new ImageBuffer for fast pixel ops
            this.buffer = new ImageBuffer(imageData);
        }
        //The image isn't dirty, so we might have a cached tint...
        else {
            i = this.indexOf(r, g, b); 
        }

        //If the tint is dirty, we need to reset this cache of tints
        //This is done in both compositing & pixel multiply mode
        if (this.image.tintDirty) {
            this.reset();
            this.image.tintDirty = false;
        }

        var ret = i !== -1 ? this.descriptors[i] : null;

        //Couldn't find a tint by that color.
        if (!ret) {
            //check to see if we've hit our max...
            if (this.pointer > this.tints.length - 1)
                this.pointer = 0; 

            var width = src.width,
                height = src.height;

            //Get the canvas at the current spot in our circular stack...
            var descriptor = this.descriptors[ this.pointer ];
            var otherBuffer = null;

            //We can re-use the Canvas !
            if (descriptor) {
                //The size doesn't match, update the descriptor
                if (descriptor.width !== width
                        || descriptor.height !== height) {
                    //We can't re-use the ImageData.. gotta grab new object
                    if ( usePixelData ) {
                        var tmpImageData = descriptor.context.createImageData(width, height);
                        descriptor.buffer = new ImageBuffer(tmpImageData);
                    }
                    descriptor.canvas.width = width;
                    descriptor.canvas.height = height;
                    descriptor.width = width;
                    descriptor.height = height;
                }

                otherBuffer = descriptor.buffer;
            }
            //We need to create a new canvas
            else {
                var dcanvas = document.createElement("canvas");
                var dcontext = dcanvas.getContext("2d");

                if (usePixelData) {
                    var dImgData = dcontext.createImageData(width, height);
                    otherBuffer = new ImageBuffer(dImgData);
                }

                dcanvas.width = width;
                dcanvas.height = height;

                descriptor = {
                    width: width,
                    height: height,
                    canvas: dcanvas,
                    context: dcontext,
                    buffer: otherBuffer
                };

                //store the new canvas in the array
                this.descriptors[ this.pointer ] = descriptor;
            }

            if (usePixelData) {
                //Multiplies the input by the RGBA and places it into the output (our tint)
                ImageBuffer.multiply( this.buffer, otherBuffer, r, g, b, 255 );

                //put the image data onto the canvas
                descriptor.context.putImageData( otherBuffer.imageData, 0, 0 );
            } else {
                //if no fill style is passed, we need to convert the rgb into a string
                if (!fillStyle)
                    fillStyle = colorString.rgbString([ ~~r, ~~g, ~~b ]);
                
                //now tint the cached canvas
                tint( descriptor.context, src, fillStyle, 0, 0, width, height );
            }
                
            //Store the new tint
            this.tints[ this.pointer ] = (r << 16) | (g << 8) | b;

            //Increment the pointer for next lookup..
            this.pointer++;

            //return the newly cached canvas
            return descriptor.canvas;
        } else {
            //Return the cached canvas
            return this.descriptors[ i ].canvas;
        }
    },

    /**
     * This softly resets the cache by simply defaulting all
     * of the hex codes to TintCache.NONE (a mask higher than anything
     * that will be added to the cache). This will not destroy descriptors
     * or their ImageData references. For that, you should
     * use clear().
     */
    reset: function() {
        for (var i=0; i<this.tints.length; i++) {
            this.tints[i] = TintCache.NONE;
        }
        this.pointer = 0;
    },

    // /**
    //  * Puts the r,g,b tinted canvas into the cache. 
    //  */
    // put: function(r, g, b, buffer) {
    //     var i = this.indexOf(r, g, b);
    //     if (i === -1) { //does not yet exist
    //         //first check to see if we've hit our max..
    //         if (this.pointer >= this.tints.length - 1)
    //             this.pointer = 0;

    //         //store the tint and buffer
    //         this.tints[ this.pointer ] = (r << 16) | (g << 8) | b;
    //         this.descriptors[ this.pointer ] = buffer;

    //         this.pointer++;
    //     } else { //it DOES exist.. so let's just overwrite it
    //         this.descriptors[ i ] = buffer;
    //     }
    // },

    indexOf: function(r, g, b) {
        var fuzz = this.fuzziness;

        if (fuzz === 0) {
            var hex = (r << 16) | (g << 8) | b;
            return this.tints.indexOf(hex);
        } else {
            for (var i=0; i<this.tints.length; i++) {
                var rgb = this.tints[i];
                if (rgb === TintCache.NONE)
                    continue;

                var r2 = ((rgb & 0xff0000) >>> 16);
                    g2 = ((rgb & 0x00ff00) >>> 8);
                    b2 = ((rgb & 0x0000ff));

                
                if (Math.abs(r2 - r) <= fuzz
                    && Math.abs(g2 - g) <= fuzz
                    && Math.abs(b2 - b) <= fuzz) {
                    return i;
                }
            }
        }
        return -1;
    },

    // contains: function(r, g, b) {
    //     var t = this.indexOf(r, g, b);
    //     return t !== -1 && t;
    // },

    // get: function(r, g, b) {
    //     var i = this.indexOf(r, g, b);
    //     if (i === -1)
    //         return null;
    //     else
    //         return this.descriptors[i].canvas;
    // },

    remove: function(r, g, b) {
        var i = this.indexOf(r, g, b);
        if (i === -1)
            return null;
        var old = this.descriptors[i].canvas;
        this.tints[i] = TintCache.NONE;
        return old;
    },

    clear: function() {
        for (var i=0; i<this.tints.length; i++) {
            this.tints[i] = TintCache.NONE;
            this.descriptors[i] = null;
        }
        this.pointer = 0;
    },

    /**
     * This is only useful for debugging purposes;
     * it will tell you the "active" number of tints,
     * i.e. those containing Images or descriptors.
     * 
     * @return {[type]} [description]
     */
    countActiveTints: function() {
        var count = 0;
        for (var i=0; i<this.tints.length; i++) 
            if (this.descriptors[i])
                count++
        return count;
    },

});


TintCache.DEFAULT_MAX_TINTS = 15;
TintCache.DEFAULT_FUZZINESS = 0;
TintCache.DEFAULT_COMPOSITING = true;

//We can't use 0 for default since that will be found as (0x000000),
//so instead we use a number that is larger than anything that we will use.
TintCache.NONE = 0xFFFFFFFF;

module.exports = TintCache;



// Tricky thing is to support async load for Image.
// We need to pull an image's data and do it only once,
// but we can only do this once the image has completed loading.

// How about using dataDirty to flag that we need to re-grab our image data
// This gets set to true after an image has completed loading, which will re-grab 
// the data.


// var image = new Image2D(renderer, "test.png");
// image.maxTints = 250;


