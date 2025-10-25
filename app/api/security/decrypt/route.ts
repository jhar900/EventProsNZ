import { NextRequest, NextResponse } from 'next/server';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';
import { withSecurity } from '@/lib/security/security-middleware';

export async function POST(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const { encrypted } = await req.json();

      if (!encrypted) {
        return NextResponse.json(
          { success: false, message: 'Encrypted data is required' },
          { status: 400 }
        );
      }

      const encryptionService = new DataEncryptionService();
      const decryptedData = await encryptionService.decrypt(encrypted);

      // Log decryption operation
      await encryptionService.logEncryptionOperation('decrypt', 'admin', true, {
        keyId: encrypted.keyId,
      });

      return NextResponse.json({
        success: true,
        data: decryptedData,
      });
    } catch (error) {
      console.error('Decryption error:', error);
      return NextResponse.json(
        { success: false, message: 'Decryption failed' },
        { status: 500 }
      );
    }
  });
}
