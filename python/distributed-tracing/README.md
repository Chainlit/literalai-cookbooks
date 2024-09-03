---
title: Distributed Tracing
---

Distributed tracing is a method for monitoring and visualizing the flow of requests through a distributed system. This enables the **tracking** of the request as it interacts with an external weather service and the subsequent processing by the AI model. By using **distributed tracing**, developers can gain insights into the **performance** of their system, **debug** issues, and understand the behavior of complex, interconnected services.

## Typescript

In the TypeScript example, a `LiteralClient` is used to create a step that logs a particular action, in this case, fetching weather data. This step is associated with a `parentStepId`, which allows for the **tracing** of the request's journey through the system.

```typescript server.ts
import * as http from "http";
import { Step, LiteralClient } from "@literalai/client";
const literalClient = new LiteralClient();

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/get-weather') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', async () => {
      const { location, unit, parentStepId } = JSON.parse(body);
      console.log(location, unit, parentStepId);

      // Log the step with the received parent_step_id
      const weatherData = literalClient
        .step({
          type: 'tool',
          name: 'get_weather',
          input: { location, unit },
          parentId: parentStepId
        })
        .wrap(() => {
          // Mock API call to the weather service
          const weatherData = mockWeatherApiCall(location, unit);

          return weatherData;
        });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(weatherData));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;

// Mock function to simulate weather API response
function mockWeatherApiCall(location: string, unit = 'celsius') {
  // This is a mock function, replace with actual API call if needed
  const weatherApiResponse = {
    location: location,
    temperature: unit === 'celsius' ? '15°C' : '59°F',
    condition: 'Partly Cloudy',
    humidity: '68%',
    windSpeed: '10 km/h'
  };
  return weatherApiResponse;
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Python

In the Python code, the `LiteralClient` is used to instrument the OpenAI client, and a decorator `@literal_client.step` is used to mark the function `run()` as a traceable step. 

```python app.py
from openai import OpenAI
import json
from literalai import LiteralClient

literal_client = LiteralClient()
literal_client.instrument_openai()
client = OpenAI()

# Example dummy function hard coded to return the same weather
# In production, this could be your backend API or an external API

@literal_client.step(type="run", name="weather_agent")
def run():
    # Step 1: send the conversation and available functions to the model
    step = literal_client.get_current_step()
    messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
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
    response = literal_client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        messages=messages,
        tools=tools,
        tool_choice="auto",  # auto is default, but we'll be explicit
    )
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    # Step 2: check if the model wanted to call a function
    if tool_calls:
        # Step 3: call the function
        # Note: the JSON response may not always be valid; be sure to handle errors
        
        messages.append(response_message)  # extend conversation with assistant's reply
        # Step 4: send the info for each function call and function response to the model
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            import requests

            function_response = requests.post(
                "http://localhost:3000/get-weather",
                headers={"Content-Type": "application/json"},
                json={
                    "location": function_args.get("location"),
                    "unit": function_args.get("unit"),
                    "parent_step_id": step.id
                }
            ).json()

            messages.append(
                {
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": json.dumps(function_response),
                }
            )  # extend conversation with function response
        print(messages)
        second_response = literal_client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=messages,
        )  # get a new response from the model where it can see the function response
        return second_response
    
print(run())

literal_client.flush_and_stop()
```