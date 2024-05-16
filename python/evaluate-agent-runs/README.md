# Agent Runs - Evaluation

In this guide, we build a simple agent which can use two tools.  
We run the agent against a couple of user queries and monitor the agent runs via Literal AI.  
Finally, we retrieve the agent runs and check the number of tools they called.

## Setup

To install dependencies, run: 
```bash
pip install -r requirements.txt
``` 

Create and set your Literal AI and OpenAI API keys in `.env`:
```bash
cp .env.example .env
```