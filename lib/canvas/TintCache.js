var Class = require('klasse');

var createTintedCanvas = require('./tint').createTintedCanvas;
var Image2D = require('../Image2D');
var ImageBuffer = require('imagebuffer');

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

        //Each TintCache uses at least 1 canvas to grab the 'original' data
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

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
    tinted: function(r, g, b) {
        var ctx = this.context,
            src = this.image.source,
            canvas = this.canvas;

        var i = -1;


        //First we check to see if our current image is "dirty"
        //If so, then we need to grab its pixel data
        if (this.image.tintDirty || !this.buffer) {
            //Since the image is dirty, so are all the tints!
            this.reset();

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

            this.image.tintDirty = false;
        }
        //The image isn't dirty, so we might have a cached tint...
        else {
            i = this.indexOf(r, g, b); 
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
                //The size doesn't match, so can't re-use the ImageData :( 
                if (descriptor.width !== width
                        || descriptor.height !== height) {
                    var tmpImageData = descriptor.context.createImageData(width, height);

                    descriptor.buffer = new ImageBuffer(tmpImageData);
                    descriptor.canvas.width = width;
                    descriptor.canvas.height = height;
                    descriptor.width = width;
                    descriptor.height = height;
                }

                otherBuffer = descriptor.buffer;
            }
            //We can't reuse the data, so we need to allocate a new canvas
            else {
                var dcanvas = document.createElement("canvas");
                var dcontext = dcanvas.getContext("2d");
                var dImgData = dcontext.createImageData(width, height);

                otherBuffer = new ImageBuffer(dImgData);

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

            //Multiplies the input by the RGBA and places it into the output (our tint)
            ImageBuffer.multiply( this.buffer, otherBuffer, r, g, b, 255 );

            //put the image data onto the canvas
            descriptor.context.putImageData( otherBuffer.imageData, 0, 0 );

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


TintCache.DEFAULT_MAX_TINTS = 10;
TintCache.DEFAULT_FUZZINESS = 0;

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


