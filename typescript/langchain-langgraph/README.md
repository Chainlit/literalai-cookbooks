# LangChain and LangGraph examples

Those examples are based on guides from the official LangChain/LangGraph documentation :

- `langchain-rag.ts·` : A simple RAG workflow, based on [this cookbook](https://js.langchain.com/v0.1/docs/expression_language/cookbook/retrieval/)
- `langgraph.ts` : A basic LangGraph flow using one tool, based on [this cookbook](https://langchain-ai.github.io/langgraphjs/#example)
- `multi-agent.ts` : A more involved example involving 2 agents and a supervisor, based on [this cookbook](https://langchain-ai.github.io/langgraphjs/tutorials/multi_agent/agent_supervisor/)

## Usage

- Install dependencies with `npm install`
- Copy the `.env.example` file as `.env`
- Input your Literal AI and OpenAI API keys
  - If you want to test the multi-agent flow, you will need to create a free account on [Tavily](https://tavily.com/) and input your `TAVILY_API_KEY` in `.env`
- Run the scripts with npx : `npx ts-node langgraph.ts`
