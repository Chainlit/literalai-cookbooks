import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();

export async function POST(req: Request) {
  const { stepId, score } = await req.json();

  await literalClient.api.createScore({
    stepId,
    name: "test-scoring",
    type: "HUMAN",
    value: score,
  });

  return Response.json({ ok: true });
}
