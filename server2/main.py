import redis
import time
import numpy as np
from datetime import datetime

r = redis.Redis(host='localhost', port=6379, db=0)

def sendFeed():
    T = 2 
    mu = 0.001 
    sigma = 0.1 
    dt = 0.01
    S0 = 20
    S_feed = [S0]
    while True:
        N = round(T/dt)
        t = np.linspace(0, T, N)
        W = np.random.standard_normal(size = N) 
        W = np.cumsum(W)*np.sqrt(dt) ### standard brownian motion ###
        X = (mu-0.5*sigma**2)*t + sigma*W 
        S = S_feed[-1]*np.exp(X) ### geometric brownian motion ###
        S_feed.append(round((S[0]),2))
        S_feed.pop(0)
        final_S = S_feed[-1]
        date_time = datetime.now()
        
        current_time = date_time.strftime("%m/%d/%Y, %H:%M:%S")
        print(current_time)
        time.sleep(1)
        r.set(current_time, final_S)



sendFeed()
