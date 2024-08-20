---
title: Multimodal Conversations with OpenAI
---

Literal AI offers multimodal logging. In this example, you see how an image is logged by Literal AI in an application using OpenAI's GPT4-Turbo model. A chat Thread is initiated, in which the assistent start with a welcome message. Then, a user query comes in, with a photo as attachment. In this example, this is hardcoded, but of course you can implement similar behavior in your chatbot. The attachment is added to the user message Step. This picture is then sent to the multimodal AI model, and the response is logged in Literal AI as well. 

```python multimodal.py
import os
from literalai import LiteralClient
from openai import OpenAI
import base64
import requests
import time

openai_client = OpenAI()

literal_client = LiteralClient(api_key=os.getenv("LITERAL_API_KEY"))
literal_client.instrument_openai()

def encode_image(url):
    return base64.b64encode(requests.get(url).content)

@literal_client.step(type="run")
def generate_answer(user_query, image_url):
    completion = openai_client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_query},
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                ],
            },
        ],
        max_tokens=300,
    )
    return completion.choices[0].message.content

def main():
    with literal_client.thread(name="Meal Analyzer") as thread:
        welcome_message = "Welcome to the meal analyzer, please upload an image of your plate!"
        literal_client.message(content=welcome_message, type="assistant_message", name="My Assistant")

        user_query = "Is this a healthy meal?"
        user_image = "https://www.eatthis.com/wp-content/uploads/sites/4/2021/05/healthy-plate.jpg"
        user_step = literal_client.message(content=user_query, type="user_message", name="User")

        time.sleep(1) # to make sure the user step has arrived at Literal AI

        # create and link the image attachment to the user message step
        literal_client.api.create_attachment(
            thread_id = thread.id,
            step_id = user_step.id,
            name = "meal_image",
            content = encode_image(user_image)
        )

        answer = generate_answer(user_query=user_query, image_url=user_image)
        literal_client.message(content=answer, type="assistant_message", name="My Assistant")


main()
# Network requests by the SDK are performed asynchronously.
# Invoke flush_and_stop() to guarantee the completion of all requests prior to the process termination.
# WARNING: If you run a continuous server, you should not use this method.
literal_client.flush_and_stop()
```

Here's an example of how different kinds of attachments are displayed in Literal.
![example](/img/attachments.png)
