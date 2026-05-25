import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@prisma/client';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export const authOptions: NextAuthOptions = {
  adapter: {
    // Custom adapter using Prisma directly
    createUser: async (data) => {
      const user = await db.user.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
        },
      });
      return user as any;
    },
    getUser: async (id) => {
      const user = await db.user.findUnique({ where: { id } });
      return user as any;
    },
    getUserByEmail: async (email) => {
      const user = await db.user.findUnique({ where: { email } });
      return user as any;
    },
    getUserByAccount: async ({ providerAccountId, provider }) => {
      const account = await db.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account?.user as any ?? null;
    },
    updateUser: async ({ id, ...data }) => {
      const user = await db.user.update({ where: { id }, data: data as any });
      return user as any;
    },
    linkAccount: async (data) => {
      await db.account.create({ data: data as any });
    },
    createSession: async (data) => {
      const session = await db.session.create({ data });
      return session as any;
    },
    getSessionAndUser: async (sessionToken) => {
      const session = await db.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) return null;
      return { session, user: session.user } as any;
    },
    updateSession: async ({ sessionToken, ...data }) => {
      const session = await db.session.update({
        where: { sessionToken },
        data,
      });
      return session as any;
    },
    deleteSession: async (sessionToken) => {
      await db.session.delete({ where: { sessionToken } });
    },
    createVerificationToken: async (data) => {
      const token = await db.verificationToken.create({ data });
      return token;
    },
    useVerificationToken: async ({ identifier, token }) => {
      try {
        const verificationToken = await db.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return verificationToken;
      } catch {
        return null;
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  providers: [
    // Email magic link via Resend
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: 'Davinci AI <noreply@davinci.ai>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendVerificationEmail(email, url);
      },
    }),
    // Credentials (email + password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Simple password check (in production, use bcrypt)
        if (user.password !== credentials.password) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'davinci-ai-secret-key-change-in-production',
};
