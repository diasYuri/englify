import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get model and voice parameters from request
    const { model = 'gpt-4o-realtime-preview-2024-12-17', voice = 'verse' } = await request.json();

    // Make a direct API call instead of using the unsupported realtime property
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    // Return the ephemeral token details
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    );
  }
} 