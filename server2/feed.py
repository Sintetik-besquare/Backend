# !!!note to self: this model still has a drift denoted by mu which is NOT preferable!!!
# update: the drift can be removed by equating the mu to 0, making it a martigale. However, more research should be done before finalising this value

import time
import random
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import redis
import json


redis_feed = redis.Redis(host='localhost', port=6379, db=0)
# publish new music in the channel epic_music

def brownianMotion(T, mu, sigma, dt, S0):
    N = round(T/dt)
    t = np.linspace(0, T, N)
    W = np.random.standard_normal(size = N) 
    W = np.cumsum(W)*np.sqrt(dt) ### standard brownian motion ###
    X = (mu-0.5*sigma**2)*t + sigma*W 
    S = S_feed[-1]*np.exp(X) ### geometric brownian motion ###
    return S

S0 = 20000
S_feed = [S0]
while True:
    S = brownianMotion(2, 0, 0.1, 0.01, 20000)
    S_feed.append(round((S[0]),2))
    S_feed.pop(0)
    final_S = S_feed[-1]

    time.sleep(1)
    date_time = datetime.now()
    current_time = date_time.strftime("%m/%d/%Y, %H:%M:%S")
    feed = {
        'price': final_S,
        'timestamp': current_time
        }
    print(feed)
    redis_feed.publish('price feed', json.dumps(feed))
    stream_name="sintetik_feed"
    redis_feed.xadd(stream_name,feed)
    #plt.scatter(current_time, final_S, linestyle='--')
    # plt.pause(1)

plt.show()


# in terminal:
# cd server2
# python3 -m venv venv
# . venv/bin/activate


# in another terminal:
    # python test_feed_sender.py