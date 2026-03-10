import { NextRequest } from "next/server";
import { handleMethodWithId } from "@/feature/meetings/api/apiMeetings";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Params) {
  const params = await context.params;
  return handleMethodWithId(req, params.id);
}
export async function PATCH(req: NextRequest, context: Params) {
  const params = await context.params;
  return handleMethodWithId(req, params.id);
}
export async function DELETE(req: NextRequest, context: Params) {
  const params = await context.params;
  return handleMethodWithId(req, params.id);
}
