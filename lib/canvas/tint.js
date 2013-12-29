var buffer = null,
    bufferContext = null;

//null => not yet checked
var multiplyDetected = null;

function isMultiplySupported() {
    if (multiplyDetected === null) { //we haven't checked yet
        if (!buffer) { //shared buffer...
            buffer = document.createElement("canvas");
            bufferContext = buffer.getContext("2d");
        }
        buffer.width = 1;
        buffer.height = 1;
        bufferContext.clearRect(0, 0, 1, 1);
        bufferContext.globalCompositeOperation = 'source-over';
        bufferContext.fillStyle = "#000"; //black
        bufferContext.fillRect(0, 0, 1, 1);
        bufferContext.globalCompositeOperation = 'multiply';
        bufferContext.fillStyle = "#fff"; //white
        bufferContext.fillRect(0, 0, 1, 1);

        multiplyDetected = bufferContext.getImageData(0, 0, 1, 1).data[0] === 0;
    }
    return multiplyDetected;
}

/**
 * Draws a tinted image to the given context. This assumes
 * that the canvas has already been resized correctly.
 * 
 * @param  {[type]} context   [description]
 * @param  {[type]} image     [description]
 * @param  {[type]} fillStyle [description]
 * @param  {[type]} x         [description]
 * @param  {[type]} y         [description]
 * @param  {[type]} width     [description]
 * @param  {[type]} height    [description]
 * @return {[type]}           [description]
 */
function tint(useMultiply, context, image, fillStyle, x, y, width, height) {
    context.clearRect(0, 0, width, height);
    // context.globalAlpha = 1.0;
    context.fillStyle = fillStyle;
    context.fillRect(0, 0, width, height);

    if (useMultiply && isMultiplySupported()) {
        context.globalCompositeOperation = 'multiply';
        context.drawImage(image, 0, 0, width, height); 
    }
    context.globalCompositeOperation = 'destination-atop';
    context.drawImage(image, 0, 0, width, height); 
}

function drawTintedImage(useMultiply, context, image, fillStyle, x, y, width, height) {
    if (!buffer) {
        buffer = document.createElement("canvas");
        bufferContext = buffer.getContext("2d");
    }
    var srcwidth = image.width,
        srcheight = image.height; 

    buffer.width = width;
    buffer.height = height;

    tint(useMultiply, bufferContext, image, fillStyle, x, y, width, height);
    
    context.drawImage(buffer, x, y, width, height);
}

module.exports = {
    isMultiplySupported: isMultiplySupported,
    tint: tint,
    drawTintedImage: drawTintedImage
}