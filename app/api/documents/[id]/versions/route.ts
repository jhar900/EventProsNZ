import { NextRequest, NextResponse } from 'next/server';
import { VersionService } from '@/lib/documents/version-service';

const versionService = new VersionService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const versions = await versionService.getVersions(id);

    return NextResponse.json({
      versions,
      success: true,
    });
  } catch (error) {
    console.error('GET /api/documents/[id]/versions error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch versions',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const change_summary = formData.get('change_summary') as string;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const version = await versionService.createVersion(
      id,
      file,
      change_summary
    );

    return NextResponse.json({
      version,
      success: true,
    });
  } catch (error) {
    console.error('POST /api/documents/[id]/versions error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create version',
      },
      { status: 500 }
    );
  }
}
