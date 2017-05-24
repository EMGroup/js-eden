# Construit [![Build Status](https://secure.travis-ci.org/EMGroup/js-eden.png?branch=master)](https://travis-ci.org/EMGroup/js-eden)



# Local Installation

Reasons to install locally?
1) You prefer not to allow students internet access.
2) Have a poor/unreliable internet connection.
3) Wish to access local hardware such as Arduino.

A locally installed version can still connect to the online repository if
there is an internet connection, but it will work without this and is presented
as a desktop application instead of a web-site.

Download the [latest release](https://github.com/EMGroup/js-eden/releases) and
extract it from the zip or tar.gz.

Install [Node.js](https://nodejs.org) version 6.10 or newer.

Afterwards, open a command line terminal into the folder extracted from the
download and enter the following commands:

```
npm install
```

And to start Construit use:
```
npm start
```

# Developers

A developer should fork the git repo or use `git clone` to get the latest but
unstable version. Then, with nodejs installed, do an `npm install`.

You can then either test using the local app version with `npm start` or use
`npm run devserver` to start a local web server on port 8000.

