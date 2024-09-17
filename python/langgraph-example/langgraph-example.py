from typing import Annotated
from langchain_core.messages import HumanMessage

from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from typing_extensions import TypedDict
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from dotenv import load_dotenv
from langchain.schema.runnable.config import RunnableConfig

from literalai import LiteralClient

load_dotenv()
literal_client = LiteralClient()

class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)


tool = TavilySearchResults(max_results=2, k=2)
tools = [tool]
llm = ChatOpenAI(model="gpt-4o-mini")
llm_with_tools = llm.bind_tools(tools)


def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}


graph_builder.add_node("chatbot", chatbot)

tool_node = ToolNode(tools=[tool])
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
# Any time a tool is called, we return to the chatbot to decide the next step
graph_builder.add_edge("tools", "chatbot")
graph_builder.set_entry_point("chatbot")
graph = graph_builder.compile()


# wait for user input and then run the graph
with literal_client.thread(name="Weather in Paris") as thread:
    user_input = "What is the weather in Paris?"
    cb = literal_client.langchain_callback()
    res = graph.invoke({"messages": [HumanMessage(content=user_input)]}, config=RunnableConfig(callbacks=[cb]))
    print(res["messages"][-1].content)