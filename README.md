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
Follow the instructions below to create a new hapi server using this plugin.

You can also just go and take a look at or clone [my personal version](https://github.com/Flet/technodrome).



1) Make a new directory, create a package.json and install some modules:
```
mkdir myserver
cd myserver
npm init
<<fill things in, press enter a lot>>
npm install --save hapi revisit-mutagen trippyshift butts-gm
```

2) create **index.js** in that directory with this content:

```javascript
var Hapi = require('hapi');

var server = Hapi.createServer('localhost', process.env.PORT || 8080);

server.pack.register({
    plugin: require('revisit-mutagen'),

    // the 'key' is the route to expose and the 'value' is a mutator function/module
    options: {
        'trippyshift': require('trippyshift'),
        'butts': require('butts-gm'),
        'echoplease': function (buffer, callback) {
            // you can just write your own 'mutator' inline too!
            callback(null, buffer);
        }
    }

}, function (err) {
    if (err) throw err;
    server.start(function () {

        // list out all the routes for verification
        server.table().forEach(function (row) {
            console.log(server.info.uri + row.path + ' (' + row.method + ')');
        });

        console.log('Hapi server started @', server.info.uri);
    });

});
```

3) Start the server up and check the output:
```
node index.js

...

http://localhost:8080/butts/ (head)
http://localhost:8080/echoplease/ (head)
http://localhost:8080/trippyshift/ (head)
http://localhost:8080/butts/service (post)
http://localhost:8080/echoplease/service (post)
http://localhost:8080/trippyshift/service (post)
Hapi server started @ http://localhost:8080
```
