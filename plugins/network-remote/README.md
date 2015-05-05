# Network-Remote
This plugin allows JS-Eden interactions to be recorded and played back.

This plugin has a server component, which needs to be installed separately. To do this, cd into this directory and run:
```shell
$ npm install
```

## Recording Interactions

After you have installed, you can run the server by running:
```shell
$ node network-remote-server.js FILENAME
```
which will write (append) all received statements into FILENAME

You can optionally specify the port for the server using ```shell --port=PORTNUMBER```

You can then use the Network-Remote plugin in JS-Eden to connect to the server (you need to specify the host address and port number, and choose a session key). All interactions will be logged into the server's output file.

By default, the data will only be written into the output file, to also see this output, you can use --debug

## Playing back Interactions

After you have recorded a session into a file, you can play it back by connecting to a running network-remote-server (as above), and then running:
```shell
$ node network-remote-parser.js FILENAME SESSION
```
where FILENAME is the file you recorded the session into (as above), and SESSION is the session key (by default 'abcde'). By default the parser will send the data to 127.0.0.1 on port 8001, but this can be overridden using --host=HOST or --port=PORT
