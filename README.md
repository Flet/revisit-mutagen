revisit-mutagen
===============

A hapi plugin to easily expose a http://revisit.link mutation as a service that adheres to http://revisit.link/spec.html

This can be used to quickly spin up a server to serve


the plugin options is expected to be an object with the key representing the base
path and the value being the 'mutator' function/module. Pass in one or many of these!
Some example mutator npm modules: butts-gm, trippyshift

```javascript
var options = {
    'trippyshift': require('trippyshift'),
    'butts': require('butts-gm'),
    'mylittlemutant': function(buffer, callback) {
        //awesome goes here
        callback(null, someMutatedbuffer)
    }
};
```

The mutator should be a function that takes a buffer and a callback. It
should then execute the callback with a buffer as the second argument
or an error as the first argument.


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
        'myglitch': function(buffer, callback) {
            // you can just write your own glitch inline or require() it in

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




