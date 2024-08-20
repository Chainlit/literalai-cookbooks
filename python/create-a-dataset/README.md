---
title: Create and Populate a Dataset
---

In this Python example, you will learn how to create a Dataset and Populate it with example items. We will create items from a list of values. If you want to create a Dataset from existing Runs, Steps or Generations from production data, check the API reference ([Python](/python-client/api-reference), [TypeScript](typescript-client/api-reference/dataset#add-a-step-to-a-dataset)).

Let's create a dataset consisting of questions and answers to movie titles.

# 1. Connect to the client

```Python Python
from literalai import LiteralClient
import os

literal_client = LiteralClient(api_key=os.getenv("LITERAL_API_KEY"))
```

# 2. Create a Dataset

Before we can add items to a Dataset, we need to create one. 

```Python Python
dataset = literal_client.api.create_dataset(
  name = "movie_titles", 
  description = "Gold standard dataset of movie title q&a", 
  type = "key_value"
)
```

# 3. Populate the Dataset

Next, we add local items to this dataset 

```python Python
# example items
items = [
    {"input": "A movie about love", "expected_output": "Love Actually"},
    {"input": "A movie about space travel", "expected_output": "Interstellar"},
    {"input": "A movie about science fiction", "expected_output": "Dune"},
    {"input": "A movie about superheroes", "expected_output": "The Avengers"},
    {"input": "A movie about adventure", "expected_output": "The Lord of the Rings"},
    {"input": "A movie about vikings", "expected_output": "Vikings"},
]

# upload to Literal AI
for item in items:
    literal_client.api.create_dataset_item(
        dataset_id = dataset.id,
        input = { "content": item["input"] },
        expected_output = { "content": item["expected_output"] }
    )
```