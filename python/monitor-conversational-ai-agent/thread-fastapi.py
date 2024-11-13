import json
from openai import AsyncOpenAI
from openai.types.chat import *
from literalai import LiteralClient
from fastapi import FastAPI
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()


client = AsyncOpenAI()
literalai_client = LiteralClient()
literalai_client.instrument_openai()

MAX_ITER = 5


# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API
@literalai_client.step(type="tool", name="get_current_weather")
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


@literalai_client.step(type="run")
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
        
        response: ChatCompletion = await client.chat.completions.create(
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

    with literalai_client.thread(thread_id=input.thread_id, name="demo_thread") as thread:
        message_history = input.message_history
        literalai_client.message(content=message_history[-1]["content"], name="user", type="user_message")
        message_history = await run(message_history)
        literalai_client.message(content=message_history[-1].content, name="assistant", type="assistant_message")
        
    return {"message_history": message_history}