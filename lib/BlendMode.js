var BlendMode = {};

//some constants for cleaner code
var gl = {
    ONE: 1,
    ONE_MINUS_CONSTANT_ALPHA: 32772,
    ONE_MINUS_CONSTANT_COLOR: 32770,
    ONE_MINUS_DST_ALPHA: 773,
    ONE_MINUS_DST_COLOR: 775,
    ONE_MINUS_SRC_ALPHA: 771,
    ONE_MINUS_SRC_COLOR: 769,
    SRC_ALPHA: 770,
    SRC_ALPHA_SATURATE: 776,
    SRC_COLOR: 768,
    DST_ALPHA: 772,
    DST_COLOR: 774
};

BlendMode.NORMAL = {
    //For canvas
    operation: 'source-over',

    //standard premultiplied blending for webGL
    src: gl.ONE,
    dst: gl.ONE_MINUS_SRC_ALPHA
};

BlendMode.ADD = {
    operation: 'lighter',
    src: gl.ONE,
    dst: gl.ONE
};

module.exports = BlendMode;