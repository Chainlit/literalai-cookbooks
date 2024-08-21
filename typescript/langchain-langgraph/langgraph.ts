import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { MemorySaver, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { green, yellow } from "cli-color";
import "dotenv/config";
import { z } from "zod";

import { LiteralClient } from "@literalai/client";

// Create a new Literal Client and a Langchain compatible callback
const literalClient = new LiteralClient();
const cb = literalClient.instrumentation.langchain.literalCallback();

// Define the state interface
interface AgentState {
  messages: BaseMessage[];
}

// Define the graph state
const graphState: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
  },
};

// Define the tools for the agent to use
const weatherTool = tool(
  async ({ query }) => {
    if (
      query.toLowerCase().includes("sf") ||
      query.toLowerCase().includes("san francisco")
    ) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: "weather",
    description: "Call to get the current weather for a location.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);

const tools = [weatherTool];
const toolNode = new ToolNode<AgentState>(tools);

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: AgentState) {
  const messages = state.messages;
  const response = await model.invoke(messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph<AgentState>({ channels: graphState })
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
const app = workflow.compile({ checkpointer });

async function main() {
  console.log(green("> what is an LLM"));
  const response = await model.invoke([new HumanMessage("what is an LLM")], {
    callbacks: [cb],
  });
  console.log(yellow(response.content));

  literalClient.thread({ name: "Weather Wrap" }).wrap(async () => {
    console.log(green("> what is the weather in sf"));
    // Use the Runnable
    const finalState = await app.invoke(
      { messages: [new HumanMessage("what is the weather in sf")] },
      {
        configurable: { thread_id: "Weather Thread" },
        runName: "weather",
        callbacks: [cb],
      }
    );

    console.log(
      yellow(finalState.messages[finalState.messages.length - 1].content)
    );

    console.log(green("> what about ny"));
    const nextState = await app.invoke(
      { messages: [new HumanMessage("what about ny")] },
      {
        configurable: { thread_id: "Weather Thread" },
        runName: "weather",
        callbacks: [cb],
      }
    );
    console.log(
      yellow(nextState.messages[nextState.messages.length - 1].content)
    );
  });
}

main();
