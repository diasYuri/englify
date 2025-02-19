import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/chat/:path*',
    '/api/chat/:path*',
    '/api/conversations/:path*',
  ],
};
