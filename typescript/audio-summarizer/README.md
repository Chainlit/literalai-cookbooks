# Emojifier 🤖🎨 - A simple audio summarizer with observability on Literal AI

In this cookbook, we will start with a simple audio summarizer using the Web Speech API and Next.js. We will then add observability to the application using Literal AI.

The base application converts audio to text and summarize the text as a sequence of emojis. It consists of :

- A web page with a simple UI to record audio, using the [AudioRecorder](https://www.npmjs.com/package/react-audio-voice-recorder) React component.
- A Next.js API route to convert the audio to text using OpenAI's [Whisper API](https://openai.com/index/whisper/).
- A Next.js API route to summarize the text using OpenAI's [GPT-4](https://openai.com/index/gpt-4/).

You can test the base application by running the development server. The only pre-requisite is to have Node.js installed on your machine.

```bash
cd without-literal
npm install
npm run dev
```

## Prerequisites

Before we get started, you will need to create a free account on [Literal AI](https://cloud.getliteral.ai/). You will also need to create a new project and generate an API key from your project's "Settings > General" section.

For the OpenAI calls to work, you will also need to generate an OpenAI API key from the [OpenAI API](https://platform.openai.com/api-keys) platform.

You can now copy the provided `.env.example` file to a new `.env` file and fill in the required environment variables.

## Adding Literal AI to the application

We will start by adding the Literal AI SDK to the application. You can install the SDK using npm:

```bash
npm install @literalai/client
```

## Decoupling the prompt from our code

Having prompts in the code can get unwieldy with time, those big templated strings get hard to read and maintain (although YMMV on this). For this project I have opted to manage them entirely on Literal AI, which allows me to iterate on the prompt's messages and settings without having to redeploy my application.

I have created a new prompt on Literal AI with the following steps :

- Navigate to my project on Literal AI
- Click on the "Prompts" tab
- Click on the "New Prompt" button
- Click on the "+ Message" button in the "Template" section
- Copy my prompt from the code to the editor
- Adjust models, temperatures and other settings as needed
- Save the prompt with the name "Emojifier Prompt" (be sure to copy this exact name as it will be used to retrieve the prompt through the API)

Now I will edit the `src/app/api/emojify/route.ts` file and add the following :

```ts
import { LiteralClient } from "@literalai/client";

const openai = new OpenAI();
// Init the Literal client
const literalClient = new LiteralClient();

export async function POST(req: NextRequest) {
  // ...

  // Get the prompt from the Literal API
  const promptName = "Emojifier Prompt";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Call the LLM API
  const completion = await openai.chat.completions.create({
    ...prompt.settings,
    messages: [...promptMessages, { role: "user", content: text }],
  });

  // ...
}
```

## Logging the requests

I want to log each request as a [Run](https://docs.getliteral.ai/concepts/observability/run) which will contain two [steps](https://docs.getliteral.ai/concepts/observability/step) :

- One step for the audio transcription
- One step for the summarization

Here is what it will look like on Literal AI :

[![Literal AI Run]](01-requests-logging.png)

### Logging the run

To facilitate its use, i will generate the Run ID from the frontend using `crypto.randomUUID()` and pass it to the backend. This ensures that my run IDs are unique and fully compatible with Literal AI. I then simply add `runId` to the payload of the API requests.

In the `src/app/api/transcribe/route.ts` I will then create a [thread](https://docs.getliteral.ai/concepts/observability/thread) for each run. This is a bit of a hack as the interaction is not really a threaded conversation, however it is necessary so that I can upload Audio files.

```ts
// We receive the file from the frontend as a Blob, however Literal expects a ReadableStream so we have to convert it
const nodeStream = Readable.fromWeb(formAudio.stream() as ReadableStream<any>);

// Upload the file to Literal and add it as an attachment
const { objectKey } = await literalClient.api.uploadFile({
  content: nodeStream,
  threadId: thread.id,
  mime: "audio/webm",
});
const attachment = new Attachment({
  name: "Audio file",
  objectKey,
  mime: "audio/webm",
});

// Create the run with the attached audio file
const run = await thread
  .step({
    id: runId,
    type: "run",
    name: "Emojifier 🤖🎨",
    input: {
      input: { content: "Audio file" },
      attachments: [attachment],
    },
  })
  .send();
```

### Logging the steps

Still in `src/app/api/transcribe/route.ts`, I then add the first step for the audio transcription. Please note that I am measuring start and end time, which will allow me to monitor latency from Literal AI.

```ts
await run
  .step({
    type: "llm",
    name: "Audio transcription",
    input: { content: "Audio file" },
    output: { content: transcribedText },
    attachments: [attachment],
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    generation: {
      provider: "openai",
      model: "whisper-1",
      prompt: "See attached audio file",
      completion: transcribedText,
    },
  })
  .send();
```

Next in `src/app/api/emojify/route.ts`, I need to fetch the run and add the second step for the summarization. To capture the run time of the LLM call and a host of other informations such as token counts, I will use the built-in OpenAI instrumentation exposed by the Literal AI SDK.

```ts
// Fetch the run
const runData = await literalClient.api.getStep(runId);
if (!runData) {
  return new NextResponse("Run not found", { status: 404 });
}
// This step will just instantiate the run data as a new Step instance so it can be used later
const run = literalClient.step(runData);

// Call the LLM API
const completion = await openai.chat.completions.create({
  ...prompt.settings,
  messages: [...promptMessages, { role: "user", content: text }],
});
// Instrument the call to OpenAI using Literal AI SDK
await literalClient.instrumentation.openai(completion, run);
```

Lastly, I will patch the Run by providing it the end time and the completion data. This will allow me to monitor the overall latency of each run, including the network latency from one call to the other.

```ts
run.endTime = new Date().toISOString();
run.output = {
  role: "assistant",
  content: completion.choices[0].message.content,
};
run.send();
```

## Conclusion

With this setup, I can now monitor the performance of my application and the quality of the responses from OpenAI. This is just a starting point, once my application hits production and has a few runs logged, I can start to analyze the data and optimize the performance of my application :

- by improving the prompt and settings. This will then allow me to compare performance using different system prompts, models, temperatures etc... by re-running actual runs.
- because all the audio is logged, I can also experiment on other STT models and compare their performance.

I hope this cookbook was helpful to you ! I've included both the base version of the application and the version with Literal AI in the `without-literal` and `with-literal` folders. You can simply use `diff` to compare the two versions and see the changes I made.

Feel free to reach out to me on damien@chainlit.io if you have any questions or feedback. Happy coding! 🖖
