import NextAuth from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import { compare } from 'bcryptjs'

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const usersCollection = client.db().collection("users");
        
        const user = await usersCollection.findOne({ email: credentials.email });
        
        if (user && await compare(credentials.password, user.password)) {
          if (!user.isVerified) {
            throw new Error("يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول");
          }
          return { id: user._id.toString(), name: user.name, email: user.email, isVerified: user.isVerified };
        } else {
          return null;
        }
      }
    })
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isVerified = user.isVerified;
        // إضافة الصورة إلى الtoken
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token.id;
      session.user.isVerified = token.isVerified;
      // إضافة الصورة إلى session
      session.user.image = token.picture;

      // تحديث الصورة من قاعدة البيانات
      const client = await clientPromise;
      const usersCollection = client.db().collection("users");
      const dbUser = await usersCollection.findOne({ email: session.user.email });
      if (dbUser?.image) {
        session.user.image = dbUser.image;
      }

      return session;
    },
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 * 200000, 
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
