import { NextRequest, NextResponse } from 'next/server';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';
import { withSecurity } from '@/lib/security/security-middleware';

export async function POST(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const { data, keyType = 'data' } = await req.json();

      if (!data) {
        return NextResponse.json(
          { success: false, message: 'Data is required' },
          { status: 400 }
        );
      }

      const encryptionService = new DataEncryptionService();
      const encryptedData = await encryptionService.encrypt(data, keyType);

      // Log encryption operation
      await encryptionService.logEncryptionOperation('encrypt', keyType, true, {
        dataLength: data.length,
      });

      return NextResponse.json({
        success: true,
        encrypted: encryptedData,
      });
    } catch (error) {
      console.error('Encryption error:', error);
      return NextResponse.json(
        { success: false, message: 'Encryption failed' },
        { status: 500 }
      );
    }
  });
}
