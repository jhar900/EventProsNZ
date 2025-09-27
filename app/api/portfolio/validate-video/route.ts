import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const videoValidationSchema = z.object({
  video_url: z.string().url('Invalid video URL'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = videoValidationSchema.parse(body);

    const videoUrl = validatedData.video_url;

    // Check if it's a YouTube URL
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = videoUrl.match(youtubeRegex);

    if (!match) {
      return NextResponse.json({
        valid: false,
        error: 'Only YouTube URLs are supported',
      });
    }

    const videoId = match[5];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    // Optional: Validate that the video exists by making a request to YouTube API
    // For now, we'll just validate the URL format

    return NextResponse.json({
      valid: true,
      embed_url: embedUrl,
      video_id: videoId,
      message: 'Video URL is valid',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
