import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { RunnableConfig } from "@langchain/core/runnables";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { END, StateGraphArgs } from "@langchain/langgraph";
import { START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { createCanvas } from "canvas";
import "dotenv/config";
import { writeFileSync } from "fs";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { JsonOutputToolsParser } from "langchain/output_parsers";
import { z } from "zod";

import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();
const cb = literalClient.instrumentation.langchain.literalCallback({
  threadId: "Jokes",
  chainTypesToIgnore: ["ChatPromptTemplate"],
});

interface AgentStateChannels {
  messages: BaseMessage[];
  // The agent node that last performed work
  next: string;
}

// This defines the object that is passed between each node
// in the graph. We will create different nodes for each agent and tool
const agentStateChannels: StateGraphArgs<AgentStateChannels>["channels"] = {
  messages: {
    value: (x?: BaseMessage[], y?: BaseMessage[]) => (x ?? []).concat(y ?? []),
    default: () => [],
  },
  next: {
    value: (x?: string, y?: string) => y ?? x ?? END,
    default: () => END,
  },
};

const chartTool = new DynamicStructuredTool({
  name: "generate_bar_chart",
  description:
    "Generates a bar chart from an array of data points using D3.js and displays it for the user.",
  schema: z.object({
    data: z
      .object({
        label: z.string(),
        value: z.number(),
      })
      .array(),
  }),
  func: async ({ data }) => {
    const d3 = await import("d3");

    console.log("test test test");

    const width = 500;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const colorPalette = [
      "#e6194B",
      "#3cb44b",
      "#ffe119",
      "#4363d8",
      "#f58231",
      "#911eb4",
      "#42d4f4",
      "#f032e6",
      "#bfef45",
      "#fabebe",
    ];

    data.forEach((d, idx) => {
      ctx.fillStyle = colorPalette[idx % colorPalette.length];
      ctx.fillRect(
        x(d.label) ?? 0,
        y(d.value),
        x.bandwidth(),
        height - margin.bottom - y(d.value)
      );
    });

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    x.domain().forEach((d) => {
      const xCoord = (x(d) ?? 0) + x.bandwidth() / 2;
      ctx.fillText(d, xCoord, height - margin.bottom + 6);
    });

    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ticks = y.ticks();
    ticks.forEach((d) => {
      const yCoord = y(d); // height - margin.bottom - y(d);
      ctx.moveTo(margin.left, yCoord);
      ctx.lineTo(margin.left - 6, yCoord);
      ctx.stroke();
      ctx.fillText(d.toString(), margin.left - 8, yCoord);
    });
    console.log(canvas.toBuffer());
    writeFileSync("chart.png", canvas.toBuffer());

    return "Chart has been generated and displayed to the user!";
  },
});

const tavilyTool = new TavilySearchResults();

async function createAgent(
  llm: ChatOpenAI,
  tools: any[],
  systemPrompt: string
): Promise<Runnable> {
  // Each worker node will be given a name and some tools.
  const prompt = await ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);
  const agent = await createOpenAIToolsAgent({
    llm: llm as any,
    tools,
    prompt: prompt as any,
  });

  return new AgentExecutor({ agent, tools }) as any;
}

const members = ["researcher", "chart_generator"];

const systemPrompt =
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH.";
const options = [END, ...members];

// Define the routing function
const functionDef = {
  name: "route",
  description: "Select the next role.",
  parameters: {
    title: "routeSchema",
    type: "object",
    properties: {
      next: {
        title: "Next",
        anyOf: [{ enum: options }],
      },
    },
    required: ["next"],
  },
};

const toolDef = {
  type: "function",
  function: functionDef,
} as const;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "system",
    "Given the conversation above, who should act next?" +
      " Or should we FINISH? Select one of: {options}",
  ],
]);

async function main() {
  const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
  });

  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  });

  const supervisorChain = formattedPrompt
    .pipe(
      llm.bindTools([toolDef], {
        tool_choice: { type: "function", function: { name: "route" } },
      })
    )
    .pipe(new JsonOutputToolsParser() as any)
    // select the first one
    .pipe((x) => (x as Array<any>)[0].args);

  // Recall llm was defined as ChatOpenAI above
  // It could be any other language model
  const researcherAgent = await createAgent(
    llm,
    [tavilyTool],
    "You are a web researcher. You may use the Tavily search engine to search the web for" +
      " important information, so the Chart Generator in your team can make useful plots."
  );

  const researcherNode = async (
    state: AgentStateChannels,
    config?: RunnableConfig
  ) => {
    const result = await researcherAgent.invoke(state, {
      ...config,
      callbacks: [cb],
      runName: "Researcher",
      configurable: { thread_id: "42" },
    });
    return {
      messages: [
        new HumanMessage({ content: result.output, name: "Researcher" }),
      ],
    };
  };

  const chartGenAgent = await createAgent(
    llm,
    [chartTool],
    "You excel at generating bar charts. Use the researcher's information to generate the charts."
  );

  const chartGenNode = async (
    state: AgentStateChannels,
    config?: RunnableConfig
  ) => {
    const result = await chartGenAgent.invoke(state, {
      ...config,
      callbacks: [cb],
      runName: "Chart Generator",
      configurable: { thread_id: "42" },
    });

    return {
      messages: [
        new HumanMessage({ content: result.output, name: "ChartGenerator" }),
      ],
    };
  };

  // 1. Create the graph
  const workflow = new StateGraph<AgentStateChannels, unknown, string>({
    channels: agentStateChannels as any,
  }) // 2. Add the nodes; these will do the work
    .addNode("researcher", researcherNode as any)
    .addNode("chart_generator", chartGenNode as any)
    .addNode("supervisor", supervisorChain);
  // 3. Define the edges. We will define both regular and conditional ones
  // After a worker completes, report to supervisor
  members.forEach((member) => {
    workflow.addEdge(member as any, "supervisor");
  });

  workflow.addConditionalEdges(
    "supervisor",
    ((x: AgentStateChannels) => x.next) as any
  );

  workflow.addEdge(START, "supervisor");

  const graph = workflow.compile();

  const visu = await graph.getGraph().drawMermaidPng();
  const arrayBuffer = await visu.arrayBuffer();
  writeFileSync("graph.png", Buffer.from(arrayBuffer));

  // literalClient.run({ name: 'Multi-agent' }).wrap(async () => {
  const streamResults = graph.stream(
    {
      messages: [
        new HumanMessage({
          content: "What were the 3 most popular tv shows in 2023?",
        }),
      ],
    },
    {
      recursionLimit: 100,
      configurable: { thread_id: "42" },
      runName: "supervisor",
      callbacks: [cb],
    }
  );

  for await (const output of await streamResults) {
    if (!output?.__end__) {
      console.log(output);
      console.log("----");
    }
  }
  // });
}

main();
