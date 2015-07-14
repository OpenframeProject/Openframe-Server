# OpenFrame

Openframe is an **open source** platform for artists, developers, curators, and everyone else to explore new ways of consuming and interacting with art in our personal environment.

Openframe is **free**. Anyone can set up a frame using a display and a Raspberry Pi, and following these simple instructions.

Openframe is a **collaborative**, on-going project.

## System Requirements
- Python 3
- MongoDB

## Server Setup

### Installing Dependencies
Install the python dependencies using pip (this assumes you're using Python 3.4, but other 3.x versions should work too):

```
$ pip3.4 install -r requirements.txt
```

Then install the node and bower requirements:

```
$ sudo npm install -g gulp
$ npm install
$ bower install
```

Then try starting the server:

```
$ python3 server.py
```

### Front-end Build

Gulp is used for the front-end build. The default gulp task watches the .less and .js files in `openframe/static/src/less` and `openframe/static/src/js` dirs and compiles them into the appropriate `openframe/static/dist` locations. Just run:

```
$ gulp
```

### Local Config
There are some default settings located in `openframe/settings.py`. You can create your own `openframe/settings_local.py` and override any of these settings.

Additionally, you can pass a couple commandline arguments when starting the server:

```
$ python3 server.py --port=6666 --debug=True
```

The should be self explanatory (defaults are port=8888, debug=False).

