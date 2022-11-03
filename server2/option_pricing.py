# calculate option pricing in python

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm
from scipy.stats import lognorm
import seaborn as sns
import time
import math

def bs_binary_option(St, K, sigma , delta_t, r, d, option_type):
    
    d1 = 1/(sigma*np.sqrt(delta_t)) * (np.log(St/K) + (r - d + sigma**2/2)*delta_t)
    d2 = d1 - sigma*np.sqrt(delta_t)
    
    if option_type == "call":
        return norm.cdf(d2)*np.exp(-r*delta_t)
    elif option_type == "put":
        return norm.cdf(-d2)*np.exp(-r*delta_t)
    else:
        raise NotImplementedError("Supported option type: 'call', 'put'")


stake = 15
ticks = 1
comm = 0.012
contract_unit_price = bs_binary_option(St = 6135.34, K = 6135.34, sigma = 1, delta_t = ticks/(60*60*24*365), r = 0, d = 0, option_type = "call") + comm
n_contract = stake / contract_unit_price
payout = 1 * n_contract
print("Rise payout = $ {:.2f}".format(payout))