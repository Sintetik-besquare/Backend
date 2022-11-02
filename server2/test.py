from flask import Flask
from flask_socketio import SocketIO, send
import time
import random
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*') # instantiate socketio

@socketio.on('message') # listen for the particular event specified
def sendFeed(num):
    while True:
        value = json.dumps(random.random()).encode('utf8')
        contract_price = json.dumps(100 * random.random()).encode('utf8')
        # value = random.random()
        # contract_price = 100 * random.random()
        time.sleep(1)
        send(value, broadcast = True)
        send(contract_price, broadcast = True)

if __name__ == '__main__':
    socketio.run(app)