# LangChain and LangGraph examples

This repository contains examples demonstrating the integration of LangChain and LangGraph for building advanced language models and graph-based workflows.



- [LangChain and LangGraph examples](#langchain-and-langgraph-examples)
    - [Setup](#setup)
    - [Dependencies](#dependencies)
    - [Environment Variables](#environment-variables)
    - [Run the examples](#run-the-examples)

### Setup

Before running the examples, make sure you have the necessary dependencies installed and environment variables set up.

### Dependencies

Install the required packages:

```bash
pip install langchain langgraph
```

### Environment Variables

Set up the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `LITERALAI_API_KEY`: Your Literal AI API key
- `TAVILY_API_KEY`: Your Tavily API key (optional for multi-agent example)
- `LITERAL_API_URL`: The URL of the Literal API


### Run the examples

You can execute the `lclg.py` file to see the working example by running:

```bash
python3 lclg.py
```

It is also possible to run the example in the LangGraph integration notebook, to get a step by step explanation of the literal's integration in the LangGraph workflow.