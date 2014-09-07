revisit-mutagen
===============

A hapi plugin to easily expose a http://revisit.link mutation as a service that adheres to http://revisit.link/spec.html

This can be used to quickly spin up a server to serve


the plugin options is expected to be an object with the key representing the base
path and the value being the 'mutator' function/module. Pass in one or many of these!
Some example mutator npm modules: butts-gm, trippyshift

```javascript
var options = {
    glitches: {
        trippyshift: require('trippyshift'),
        butts: require('butts-gm'),
        mylittlemutant: function(buffer, callback) {
            //awesome goes here
            callback(null, someMutatedbuffer);
        }
    }
};
```

The mutator should be a function that takes a buffer and a callback. It
should then execute the callback with a buffer as the second argument
or an error as the first argument.

Additional Options
------------------
**maxDataSize** (number) - set the max size of data that can be POSTed to the service. Default 2000000 (2MB).
**sampleGif** (string) - file path to a gif image to override the default sample.gif. Note that the guideline is a 60x60 image for samples on the hub.
**sampleJpg** (string) - file path to a gif image to override the default sample.jpg
**moreSamples** (array of strings) - array of file paths to additional images to expose as GET urls. The url will be derived from the file name: /myglitch/**pug.gif**. Be sure that your custom file names will not conflict with existing paths (i.e. don't name them sample.jpg or sample.gif)

Here is an example options object with all these options enabled:

```javascript
var options = {
    maxDataSize: 1000000,
    sampleGif: './waybettersample.gif',
    sampleJpg: './anothersample.jpg',
    moreSamples: ['./pug.gif', './face.jpg'],
    glitches: {
        myglitch: function(buffer, callback) {
            //awesome goes here
            callback(null, someMutatedbuffer);
        }
    }
};
```

Full example Server
-------------------
Follow the instructions below to create a new hapi server using this plugin. This also shows how to create a simple glitch using `glitcher`.

You can also just go and take a look at or clone [my personal version](https://github.com/Flet/technodrome).



1) Make a new directory, create a package.json and install some modules:
```
mkdir myserver
cd myserver
npm init
<<fill things in, press enter a lot>>
npm install --save hapi revisit-mutagen readimage glitcher writegif
```

2) create **index.js** in that directory with this content:

```javascript
var Hapi = require('hapi'),
    server = Hapi.createServer('0.0.0.0', process.env.PORT || 8080);

server.pack.register({
    plugin: require('revisit-mutagen'),
    options: {
        glitches: {
            myglitch: function(buffer, callback) {
                // you can just write your own glitch inline or require() it in...

                var readimage = require('readimage'),
                    glitcher = require('glitcher'),
                    gifWriter = require('writegif');

                readimage(buffer, function(err, image) {
                    if (err) {
                        return callback(err);
                    }

                    if (image.frames.length == 1) {
                        glitcher.rainbowClamp(image.frames[0].data);
                    } else {
                        glitcher.rainbow(image.frames);
                    }

                    gifWriter(image, function(err, finalgif) {
                        return callback(null, finalgif);
                    });

                });
            }
        }
    }
}, function(err) {
    if (err) throw err;
    server.start(function() {

        // list out all the routes for verification
        server.table().forEach(function(row) {
            console.log(server.info.uri + row.path + " (" + row.method + ")");
        });

        console.log("Hapi server started @", server.info.uri);
    });

});
```

3) Start the server up and check the output:
```
npm start

...

http://0.0.0.0:8080/{anything?} (head)
http://0.0.0.0:8080/myglitch/sample.gif (get)
http://0.0.0.0:8080/myglitch/sample.jpg (get)
http://0.0.0.0:8080/myglitch/livesample.gif (get)
http://0.0.0.0:8080/myglitch/livesample.jpg (get)
http://0.0.0.0:8080/myglitch/service (post)
Hapi server started @ http://0.0.0.0:8080
```

Now you can visit either of these URLs to see your glitch:
```
http://localhost:8080/myglitch/livesample.gif
http://localhost:8080/myglitch/livesample.jpg
```

Cool! Now, for faster iteration, using something like `nodemon` will help. It will basically restart the server whenever it detects a change. This means you can tweak your glitch and quickly see the results after saving:
```
npm install -g nodemon
```
Now start the server with the `nodemon` command:
```
nodemon
```

Leave a browser window open pointing to `http://localhost:8080/myglitch/livesample.gif` and whenever you want to see the latest iteration just refresh the window.

Even better: add your own image via the **moreSamples** option explained above to use a bigger and better image during development!


Modularize
----------

Eventually you will want to just work with the glitch itself. Just pull it into its own file:

**myglitch.js**
```
var readimage = require('readimage'),
    glitcher = require('glitcher'),
    gifWriter = require('writegif');

module.exports = function(buffer, callback) {

    readimage(buffer, function(err, image) {
        if (err) {
            return callback(err);
        }

        if (image.frames.length == 1) {
            glitcher.rainbowClamp(image.frames[0].data);
        } else {
            glitcher.rainbow(image.frames);
        }

        gifWriter(image, function(err, finalgif) {
            return callback(null, finalgif);
        });

    });
};
```

Then, just update the `options.glitches` in **index.js** to require in your new file.
```
server.pack.register({
    plugin: require('revisit-mutagen'),
    options: {
        glitches: {
            'myglitch': require('./myglitch.js')
        }
    }
}, function(err) {
    if (err) throw err;
    server.start(function() {

        // list out all the routes for verification
        server.table().forEach(function(row) {
            console.log(server.info.uri + row.path + " (" + row.method + ")");
        });

        console.log("Hapi server started @", server.info.uri);
    });

});
```

**Extra Credit:** publish your glitch as a standalone module and publish it to npm!
