import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import type { PrismaService } from '../prisma/prisma.service';

const UPPER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghjkmnpqrstuvwxyz';
const DIGIT_CHARS = '23456789';

function pickChar(alphabet: string): string {
  return alphabet[crypto.randomInt(0, alphabet.length)];
}

/**
 * Generates an unambiguous, cryptographically random temporary password
 * (e.g. "Edu@4K8m") for Admin or Homeroom Teacher to hand over to a user.
 * The user is always forced to change it on next login (mustChangePassword = true).
 */
export function generateTemporaryPassword(): string {
  const digits = `${pickChar(DIGIT_CHARS)}${pickChar(DIGIT_CHARS)}`;
  const letters = `${pickChar(UPPER_CHARS)}${pickChar(LOWER_CHARS)}${pickChar(UPPER_CHARS)}${pickChar(DIGIT_CHARS)}`;
  return `Edu@${digits}${letters}`;
}

/**
 * Hashes a raw password using the exact same pepper + bcrypt cost as AuthService.
 */
export async function hashPasswordWithPepper(
  rawPassword: string,
  pepper?: string,
): Promise<string> {
  const resolvedPepper =
    pepper || process.env.PASSWORD_PEPPER || 'DEFAULT_PEPPER';
  return bcrypt.hash(rawPassword + resolvedPepper, 10);
}

export interface NotifiedParentSummary {
  id: string;
  fullName: string;
  phone: string | null;
}

/**
 * Sends a notification containing the newly issued temporary password directly
 * to all actively linked Parents of a Student (BR-LINK-001 & BR-NOTIFY-001).
 */
export async function notifyLinkedParentsOfPasswordReset(
  prisma: PrismaService,
  params: {
    studentId: string;
    studentName: string;
    studentCode?: string | null;
    className?: string | null;
    issuerLabel: string;
    tempPassword: string;
  },
): Promise<NotifiedParentSummary[]> {
  const links = await prisma.parentStudentLink.findMany({
    where: {
      studentId: params.studentId,
      parent: { isActive: true },
    },
    include: {
      parent: {
        select: { id: true, fullName: true, phone: true },
      },
    },
  });

  if (links.length === 0) {
    return [];
  }

  const studentLabel = `${params.studentName}${
    params.studentCode ? ` (${params.studentCode})` : ''
  }${params.className ? ` - ${params.className}` : ''}`;

  const title = `Cấp lại mật khẩu cho con ${params.studentName}`;
  const body = `${params.issuerLabel} đã cấp mật khẩu tạm mới cho tài khoản ${studentLabel}. Mật khẩu tạm: ${params.tempPassword}. Vui lòng chuyển cho con đăng nhập và đổi mật khẩu mới ngay.`;

  await prisma.notification.createMany({
    data: links.map((l) => ({
      userId: l.parent.id,
      title,
      body,
    })),
  });

  return links.map((l) => ({
    id: l.parent.id,
    fullName: l.parent.fullName || 'Phụ huynh',
    phone: l.parent.phone || null,
  }));
}
