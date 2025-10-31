import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        socialAccounts: true
      }
    })
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        socialAccounts: true
      }
    })
  }

  async findByMagicLinkToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date()
        }
      }
    })
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        socialAccounts: true
      },
    });
  }

  async update(id: string, data: UpdateUserDto) : Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return this.prisma.user.update({
      where: {id},
      data,
      include: {
        socialAccounts: true
      },
    });
  }

  async updateMagicLinkToken(id: string, token: string, expires: Date): Promise<User> {
    return this.prisma.user.update({
      where: {id},
      data: {
        magicLinkToken: token,
        magicLinkExpires: expires
      }
    })
  }

  async clearMagicLinkToken(id: string) : Promise<User> {
    return this.prisma.user.update({
      where: {id},
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        isEmailVerified: true
      },
    });
  }

  async verifyEmail(id: string): Promise<User> {
    return this.prisma.user.update({
      where: {id},
      data: {
        isEmailVerified: true,
        emailVerifiedToken: null,
        emailVerificationExpires: null
      }
    })
  }

  async updateEmailVerificationToken(id: string, token: string, expires: Date): Promise<User> {
    return this.prisma.user.update({
      where: {id},
      data: {
        emailVerifiedToken: token,
        emailVerificationExpires: expires
      }
    })
  }

  async remove(id: string): Promise<User> {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.prisma.user.delete({
      where: {id}
    })
  }
}
