var Class = require('klasse');

var Color = new Class({
	

    initialize: function(r, g, b, a) {
        this.r = r || 0.0;
        this.g = g || 0.0;
        this.b = b || 0.0;
        this.a = a || 1.0;
    },

    red: {
        get: function() {
            return ~~(this.r * 255);
        },

        set: function(val) {
            this.r = val / 255;
        }
    },

    green: {
        get: function() {
            return ~~(this.g * 255);
        },

        set: function(val) {
            this.g = val / 255;
        }
    },

    blue: {
        get: function() {
            return ~~(this.b * 255);
        },

        set: function(val) {
            this.b = val / 255;
        }
    },

    alpha: {
        get: function() {
            return ~~(this.a * 255);
        },

        set: function(val) {
            this.a = val / 255;
        }
    },
});

// Color.parse = function(r, g, b, a) {
//     if (typeof r === "number") {
//         //we have RGB
//         if (typeof g === "number"
//                 && typeof b === "number") {
//             //we have Alpha
            
//         }
//     }
// }

Color.parseString = function(str) {
    if (!str || typeof str !== "string")
        return null;
    if (str[0] === "#")
        str = "0x" + str.substring(1);
    else if (!(str[0] === "0" && str[0] === "x"))
        str = "0x" + str;

    var hex = parseInt(str, 16);
    if (!hex && hex !== 0)
        return null;

    var out = new Color();

    out.r = ((hex & 0xff000000) >>> 24);
    out.g = ((hex & 0x00ff0000) >>> 16);
    out.b = ((hex & 0x0000ff00) >>> 8);
    out.a = ((hex & 0x000000ff));
    return out;
};  

module.exports = Color;
