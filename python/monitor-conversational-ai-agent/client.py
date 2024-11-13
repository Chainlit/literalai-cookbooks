import requests # type: ignore

url = 'http://127.0.0.1:8000/process/'

import uuid

thread_id = str(uuid.uuid4())

# First query
data1 = {
  "message_history": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "what's the weather in sf"}],
  "thread_id": thread_id
}

response1 = requests.post(url, json=data1)

# Second query
data2 = {
  "message_history": response1.json()["message_history"] + [{"role": "user", "content": "what's the weather in paris"}],
  "thread_id": thread_id
}

response2 = requests.post(url, json=data2)
if response2.status_code == 200:
    print(response2.json())
else:
    print(f"Error: {response2.status_code}, {response2.text}")