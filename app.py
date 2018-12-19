from flask import Flask, render_template, request
from flask_socketio import SocketIO as SocketIO
import config
import secrets
import inspect

import os

async_mode = None

application = Flask(__name__)
APP_DIR = os.path.dirname(os.path.realpath(__file__))
application.config.from_object(config.configuration)
application.config.from_object(secrets.configuration)
socketio = SocketIO(application, async_mode=async_mode)


from views import *
from socketIO import *

if __name__ == '__main__':
    socketio.run(application, debug=True)
