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

from twilio.rest import Client
from multiprocessing import Process

redis_conn = redis.Redis(charset="utf-8", decode_responses=True) # create Redis connection

# instantiate a pub/sub object and subscribe to a channel.
def sub(name: str):
    pubsub = redis_conn.pubsub()
    pubsub.subscribe("price feed")
    for message in pubsub.listen(): # continuously listens to subcribed channels
        if message.get("type") == "message":
            data = json.loads(message.get("data"))
            print("%s : %s" % (name, data))

            # account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            # auth_token = os.environ.get("TWILIO_AUTH_TOKEN")

            # body = data.get("message")
            # from_ = data.get("from")
            # to = data.get("to")
            price = data.get("price")
            time = data.get("timestamp")

            # client = Client(account_sid, auth_token)
            # message = client.messages.create(price = price, time = time)
            print(price, time)


if __name__ == "__main__":
    Process(target=sub, args=("reader1",)).start()