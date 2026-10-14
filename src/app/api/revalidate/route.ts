import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  let token: string | null = null;
  try {
    const body = await request.json();
    token = body?.secret ?? null;
  } catch {
    token = new URL(request.url).searchParams.get("secret");
  }
  if (secret && token !== secret) {
    return Response.json({ error: "Invalid secret." }, { status: 401 });
  }
  revalidatePath("/", "layout");
  revalidatePath("/projects");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

export async function GET(request: Request) {
  return POST(request);
}
