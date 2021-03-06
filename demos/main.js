var domready = require('domready');
var CanvasRenderer = require('bento').CanvasRenderer;
var BlendMode = require('bento').BlendMode;
var Image2D = require('bento').Image2D;
var ImageBuffer = require('imagebuffer');

var TintCache = require('bento').TintCache;

var stats = require('stats');
var PerspectiveCamera = require('cam3d').PerspectiveCamera;

var Vector3 = require('vecmath').Vector3;
var Vector4 = require('vecmath').Vector4;
var Matrix4 = require('vecmath').Matrix4;

console.log( 0xFFFFFFFF );

function createRandomParticles(r, n) {
    var points = [];

    r = r||50;
    n = n||200;
    for (var i=0; i<n; i++) {
        points.push(new Vector3().random(r));
    }
    return points;
}

domready(function() {
    var renderer = new CanvasRenderer(500, 500);
    document.body.appendChild(renderer.view);
    document.body.style.margin = "0";
    document.body.style.background = "gray";

    var img = new Image2D(renderer, "img/particle.png", render);

    var fps = stats.create();
    fps.style.position = "fixed";
    fps.style.top = "0";
    fps.style.color = "#fff";
    document.body.appendChild(fps);


    // function render() {
    //     renderer.setTint(255, 0, 0);
    //     renderer.drawImage(img, 100, 100);

    //     renderer.flush();
    // }

    var camera = new PerspectiveCamera(85 * Math.PI/180, renderer.width, renderer.height)
    camera.translate(new Vector3(0, 0, 100));
    camera.update();

    var sphereRadius = 100,
        numPoints = 100,
        orbitRadius = 200,
        rot = 0;
    var points = createRandomParticles(sphereRadius, numPoints);
    var tmp4 = new Vector4();
    var tmp = new Vector3();

    

    setInterval(function() {
        console.log(img.tintCache != null ? img.tintCache.countActiveTints() : "");
    }, 1000);

    img.tintCaching = true;
    img.tintCacheSize = 300;
    img.tintCacheFuzziness = 15;
    img.tintMode = Image2D.TintMode.BEST;

    var rVal = 0,
        gVal = 0,
        bVal = 0,
        aVal = 0;

    // function render() {
    //     // setTimeout(render, 1000);
    //     requestAnimationFrame(render);

    //     stats.begin();

    //     renderer.clear();



    //     // console.profile("tint");
    //     // var start = performance.now();
    //     renderer.setTint( ~~(Math.random()*255), ~~(Math.random()*255), ~~(Math.random()*255) );
    //     // renderer.setTint(255, 0, 0);
    //     renderer.drawImage(img, 0, 0);
    //     // var t = (performance.now() - start);
    //     // console.profileEnd("tint");

    //     // console.log("Total time:", t);

    //     renderer.flush();

    //     stats.end(fps);
    // }

    function render() {
        requestAnimationFrame(render);
        // setTimeout(render, 1000);

        

        stats.begin();

        renderer.clear();
        // renderer.setTint("red");
        // renderer.drawImage(img);


        //radius to rotate around centre
        var r = orbitRadius;

        //orbit our camera a little around center 
        var x = Math.cos(rot) * r,
            z = Math.sin(rot) * r;

        camera.position.y = -100;
        camera.position.x = x;
        camera.position.z = z;
        // camera.position.y = z*0.5;

        rot += 0.01;

        //keep the camera looking at centre of world
        camera.lookAt(new Vector3(0, 0, 0));
        camera.up.set(0, 1, 0);

        //call update() to create the combined matrix
        camera.update();

        var imgwidth = img.width,
            imgheight = img.height;

        //draw our sphere of particles
        for (var i=0; i<points.length; i++) {
            
            var col = Math.sin(rot)/2+0.5;

            renderer.setTint(
                ~~((Math.sin((rot*i*0.005))/2+0.5) * 255), 
                ~~((Math.sin((rot*i*0.05))/2+0.5) * 255),
                ~~((Math.sin(Math.cos(rot*i*0.05))/2+0.5) * 255));
                // ~~(Math.random()*255),
                // ~~(Math.random()*255),
                // ~~(i/points.length*255), 
                
                // ~~(Math.random()*255));
        
            var p = points[i];
            camera.project(p, tmp);
            
            // renderer.setAlpha(((Math.sin((rot*i*0.025))/2+0.5)));    
            renderer.drawImage(img, tmp.x, tmp.y, imgwidth, imgheight);
            //Draw the point at center.
            // renderer.context.fillRect(tmp.x-2.5, tmp.y-2.5, 5, 5);
        }


        // renderer.setTint("#fff");
        renderer.alpha = 1.0;
        // renderer.drawImage(img);

        renderer.flush();

        stats.end(fps);

        if (img.tintCache) {
            // console.log("TINTS: "+img.tintCache.countActiveTints());
        }
    }

    // var img = new Image2D(renderer, "img/grass.png", function() {
    //     console.log("LOADED")
    // }, function() {
    //     console.log("ERR LOAD")
    // });
    // var img2 = new Image2D(renderer, 1, 1, [0,0,255,255], function() {
    //     console.log("LOADED")
    // }, function() {
    //     console.log("ERR LOAD")
    // });
    
    // renderer.fillRect(10, 10, 25, 25);
    


    // renderer.blendMode = BlendMode.ADD;
    // renderer.setTint("red");
    // renderer.fillRect(15, 15, 200, 200);

    // renderer.drawRect(10, 10, 25, 25);
    // renderer.drawRect(1, 1, 4, 4);
    // renderer.drawRect(1, 1, 8, 8);
    // renderer.fillRect(1, 1, 1, 1);


});