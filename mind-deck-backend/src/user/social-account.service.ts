import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SocialAccount, AuthProvider } from '@prisma/client';

interface CreateSocialAccountDto {
  provider: AuthProvider;
  providerId: string;
  userId: string;
}

@Injectable()
export class SocialAccountService {
  constructor(private prisma: PrismaService) {}

    async upsertSocialAccount(data: CreateSocialAccountDto): Promise<SocialAccount> {
    return this.prisma.socialAccount.upsert({
      where: {
        provider_providerId: {
          provider: data.provider,
          providerId: data.providerId,
        },
      },
      update: {
        userId: data.userId,
      },
      create: data,
    });
  }

  async findByUserId(userId: string): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: { userId },
    });
  }

  async findByProviderAndId(provider: AuthProvider, providerId: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: { provider, providerId },
      },
    });
  }

  async disconnect(userId: string, provider: AuthProvider): Promise<void> {
    await this.prisma.socialAccount.deleteMany({
      where: { userId, provider },
    });
  }

  async getConnectionStats(userId: string) {
    const accounts = await this.findByUserId(userId);
    return {
      total: accounts.length,
      providers: accounts.map(acc => acc.provider),
      hasGoogle: accounts.some(acc => acc.provider === AuthProvider.GOOGLE),
    };
  }
}