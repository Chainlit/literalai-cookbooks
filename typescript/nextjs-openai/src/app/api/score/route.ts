import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();

export async function POST(req: Request) {
  const { runId, score } = await req.json();

  // Right now we have the ID for the Run however what we're really scoring is the Step
  // We fetch it simply as it should be the only child Step of the Run
  const res = await literalClient.api.getSteps({
    filters: [{ field: "parentId", operator: "eq", value: runId }],
  });

  const step = res.data[0];

  if (!step) {
    throw new Error("No step was found for the given runId");
  }

  // Send a score for the step
  await literalClient.api.createScore({
    stepId: step.id,
    name: "simple-chatbot-score",
    type: "HUMAN",
    value: score,
  });

  return Response.json({ ok: true });
}
