# import redis
# # connect with redis server as Bob
# bob_p = redis.Redis(host='localhost', port=6379, db=0)
# bob_p = bob_p.pubsub()
# # subscribe to classical music
# bob_p.subscribe('price feed')

# # connect with redis server as Alice
# alice_r = redis.Redis(host='localhost', port=6379, db=0)
# # publish new music in the channel epic_music
# alice_r.publish('classical_music', 'Alice Music')


# # ignore Bob subscribed message
# bob_p.get_message()
# # now bob can find alice’s music by simply using get_message()
# new_music = bob_p.get_message()['data']
# print(new_music)

# # Alice published another
# alice_r.publish('classical_music', 'Alice 2nd Music')
# #Lets grab it!
# another_music = bob_p.get_message()['data']
# print(another_music)


import os
import redis
import json

# from twilio.rest import Client
from multiprocessing import Process

redis_conn = redis.Redis(charset="utf-8", decode_responses=True) # create Redis connection

# instantiate a pub/sub object and subscribe to a channel.
def sub(name: str):
    pubsub = redis_conn.pubsub()
    pubsub.subscribe("price feed")
    for message in pubsub.listen(): # continuously listens to subcribed channels
        if message.get("type") == "message": # blocks execution and waits for a new message to arrive on the channel.
            data = json.loads(message.get("data"))

            price = data.get("price")
            time = data.get("timestamp")

            print(price, time)

# To run the sub:
if __name__ == "__main__":
    Process(target=sub, args=("reader1",)).start()

# use Process here because the event loop generated when we call listen() is blocking, 
# meaning that we can't do anything else other than waiting for new messages. 
# For this simple example this blocking is not a problem, 
# but in a real application where you want to work on other things at the same time it could be.

# OR:
# sub("reader1")