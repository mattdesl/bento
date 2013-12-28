var topiarist = require("topiarist");

var MyClass = function() {

};

MyClass.prototype.constructor = MyClass;
MyClass.prototype.method = function () {

};
Object.defineProperty(MyClass.prototype, "test", {
    get: function() {
        return "foo"
    },
    set: function() {

    }
});


var SubClass = function() {

};
topiarist.extend(SubClass, MyClass);

console.log(SubClass.prototype);