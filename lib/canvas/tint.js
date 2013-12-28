var ImageBuffer = require('imagebuffer');
var totalCount = 0;


/**
 * Returns a tinted canvas using the image source. 
 * If canvas is null or undefined, a new one will be created. 
 * 
 * @param  {[type]} canvas [description]
 * @param  {[type]} image  [description]
 * @param  {[type]} r      [description]
 * @param  {[type]} g      [description]
 * @param  {[type]} b      [description]
 * @param  {[type]} a      [description]
 * @return {[type]}        [description]
 */
module.exports.tinted = function(canvas, image, r, g, b, a) {
    var width = image.width,
        height = image.height;

    a = (a===0 || a) ? a : 255;

    if (!canvas) {
        canvas = document.createElement("canvas");
    }
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, width, height);
    var buffer = new ImageBuffer(imageData);
    buffer.multiply( r, g, b, a );

    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

module.exports.createTintedCanvas = function(image, r, g, b, a) {
    var width = image.width,
        height = image.height;

        // console.log("TOTATL COUNT:", totalCount++)

    a = (a===0 || a) ? a : 255;

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, width, height);
    var buffer = new ImageBuffer(imageData);
    buffer.multiply( r, g, b, a );

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

//This is useful when the canvas is already set to the correct size,
//and only needs to be tinted.
module.exports.tintCanvas = function(canvas, image, r, g, b, a) {
    var ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, image.width, image.height);
    var buffer = new ImageBuffer(imageData);
    buffer.multiply( r, g, b, a );

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

var buffer = null,
    bufferContext = null;

module.exports.fastTint = function(context, image, fillStyle, x, y, width, height) {
    if (!buffer) {
        buffer = document.createElement("canvas");
        bufferContext = buffer.getContext("2d");

    }
    var srcwidth = image.width,
        srcheight = image.height; 

    buffer.width = width;
    buffer.height = height;

    
    bufferContext.fillStyle = fillStyle;
    bufferContext.fillRect(0, 0, width, height);
    bufferContext.globalCompositeOperation = 'destination-atop';    
    bufferContext.drawImage(image, 0, 0, width, height);

    context.drawImage(buffer, x, y, width, height);
}