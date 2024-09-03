---
title: Conversational Agent Monitoring - FastAPI 
---

This code integrates an asynchronous OpenAI client with a Literal AI client to create a conversational agent. 
It utilizes Literal AI's step decorators for structured logging and tool orchestration within a conversational flow. 
The agent can process user messages, make decisions on tool usage, and generate responses based on a predefined set of tools and a maximum iteration limit to prevent infinite loops.

**This example demonstrates thread-based monitoring, allowing for detailed tracking and analysis of conversational threads.**

```bash .env
LITERAL_API_KEY=
OPENAI_API_KEY=
```


```bash
pip install uvicorn
```

```python server.py
import json
from openai import AsyncOpenAI
from openai.types.chat import *
from literalai import LiteralClient
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()


client = AsyncOpenAI()
lc = LiteralClient()
lc.instrument_openai()

MAX_ITER = 5


# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
@lc.step(type="tool", name="get_current_weather")
def get_current_weather(location, unit=None):
    """Get the current weather in a given location"""
    unit = unit or "Farenheit"
    weather_info = {
        "location": location,
        "temperature": "72",
        "unit": unit,
        "forecast": ["sunny", "windy"],
    }

    return json.dumps(weather_info)


tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]


@lc.step(type="run")
async def run(message_history):
    
    tool_called = True
    cur_iter = 0
    while tool_called and MAX_ITER:
        settings = {
            "model": "gpt-4-turbo-preview",
            "tools": tools,
            "tool_choice": "auto",
        }
        # https://github.com/openai/openai-python/issues/777
        for message in message_history:
            if "function_call" in message and message["function_call"] is None:
                del message["function_call"]
            if "tool_calls" in message and message["tool_calls"] is None:
                del message["tool_calls"]
        
        response: ChatCompletion = await literalClient.chat.completions.create(
            messages=message_history, **settings
        )

        message: ChatCompletionMessage = response.choices[0].message

        message_history.append(message)
        if not message.tool_calls:
            tool_called = False

        for tool_call in message.tool_calls or []:
            if tool_call.type == "function":
                # print(globals().keys())
                func = globals()[tool_call.function.name]
                res = func(tool_call.function.arguments)
                message_history.append({
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": res,
                    "tool_call_id": tool_call.id,
                })

        cur_iter += 1

    return message_history


# --------------------------------------------------------------
# --------------------------- SERVER ---------------------------
# --------------------------------------------------------------

app = FastAPI()

class ProcessInput(BaseModel):
    message_history: list
    thread_id: str

@app.post("/process/")
async def process_conversation(input: ProcessInput):

    with lc.thread(thread_id=input.thread_id, name="demo_thread") as thread:
        message_history = input.message_history
        lc.message(content=message_history[-1]["content"], name="user", type="user_message")
        message_history = await run(message_history)
        lc.message(content=message_history[-1].content, name="assistant", type="assistant_message")
        
    return {"message_history": message_history}

```


```bash
uvicorn thread-fastapi:app --reload
```

Then, you can send requests from a client:

```python client.py
import requests

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
```