---
title: Multimodal Conversations with OpenAI
---

Literal AI offers multimodal logging. In this example, you see how an image is logged by Literal AI in an application using OpenAI's `gpt-4o` model. A chat Thread is initiated, in which the assistent start with a welcome message. Then, a user query comes in, with a photo as attachment. In this example, this is hardcoded, but of course you can implement similar behavior in your chatbot. The attachment is added to the user message Step. This picture is then sent to the multimodal AI model, and the response is logged in Literal AI as well.

```python multimodal.py
import base64
import requests # type: ignore
import time

from literalai import LiteralClient
from openai import OpenAI

from dotenv import load_dotenv
load_dotenv()

openai_client = OpenAI()

literalai_client = LiteralClient()
literalai_client.instrument_openai()

def encode_image(url):
    return base64.b64encode(requests.get(url).content)

@literalai_client.step(type="run")
def generate_answer(user_query, image_url):
    completion = openai_client.chat.completions.create(
        model="gpt-4o",
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
    with literalai_client.thread(name="Meal Analyzer") as thread:
        welcome_message = "Welcome to the meal analyzer, please upload an image of your plate!"
        literalai_client.message(content=welcome_message, type="assistant_message", name="My Assistant")

        user_query = "Is this a healthy meal?"
        user_image = "https://www.eatthis.com/wp-content/uploads/sites/4/2021/05/healthy-plate.jpg"
        user_step = literalai_client.message(content=user_query, type="user_message", name="User")

        time.sleep(1) # to make sure the user step has arrived at Literal AI

        # create and link the image attachment to the user message step
        literalai_client.api.create_attachment(
            thread_id = thread.id,
            step_id = user_step.id,
            name = "meal_image",
            content = encode_image(user_image)
        )

        answer = generate_answer(user_query=user_query, image_url=user_image)
        literalai_client.message(content=answer, type="assistant_message", name="My Assistant")


main()
# Network requests by the SDK are performed asynchronously.
# Invoke flush_and_stop() to guarantee the completion of all requests prior to the process termination.
# WARNING: If you run a continuous server, you should not use this method.
literalai_client.flush_and_stop()
```

Here's an example of how different kinds of attachments are displayed in Literal.
![example](/img/healthy-meal.png)
