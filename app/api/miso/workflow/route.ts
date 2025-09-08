import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { input_text } = await request.json()

    if (typeof input_text !== "string" || input_text.trim().length === 0) {
      return NextResponse.json({ error: "input_text is required" }, { status: 400 })
    }

    const endpoint = process.env.MISO_ENDPOINT
    const apiKey = process.env.MISO_API_KEY

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: "Missing MISO_ENDPOINT or MISO_API_KEY environment variables" },
        { status: 500 },
      )
    }

    // MISO_ENDPOINT already includes "/ext/v1". The workflow run path is "/workflows/run".
    const url = `${endpoint}/workflows/run`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: { input_text },
        mode: "blocking",
        user: "checkmate-ui", // any identifier is fine per guide
      }),
      // next: { revalidate: 0 }, // disable caching if needed
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text || "MISO API error" }, { status: res.status })
    }

    // Expected shape per guide (blocking): { data: { outputs: { result: string } } }
    const data = await res.json()
    const resultText = data?.data?.outputs?.result ?? data?.result ?? ""
    return NextResponse.json({ result: resultText })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}


