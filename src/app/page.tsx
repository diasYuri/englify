import Link from 'next/link';
import { Navbar } from './components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl md:text-6xl">
              Master English with
              <span className="text-primary-600"> AI-Powered</span> Conversations
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
              Practice English naturally through interactive conversations with our advanced AI language partner.
              Perfect your speaking, writing, and comprehension skills at your own pace.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className="rounded-lg bg-primary-600 px-8 py-3 text-base font-medium text-white hover:bg-primary-700 transition-colors"
              >
                Start Learning Now
              </Link>
              <Link
                href="/login"
                className="ml-4 rounded-lg bg-white px-8 py-3 text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors border border-primary-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Natural Conversations</h3>
              <p className="text-gray-600">Practice real-world conversations with our AI that adapts to your level and learning style.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Instant Feedback</h3>
              <p className="text-gray-600">Get real-time corrections and suggestions to improve your grammar and vocabulary.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalized Learning</h3>
              <p className="text-gray-600">Learn at your own pace with customized topics and difficulty levels that match your interests.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-600 rounded-2xl px-6 py-16 sm:p-16">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Ready to improve your English?
              </h2>
              <p className="mt-4 text-lg text-primary-100">
                Join thousands of learners who are already enhancing their English skills with Englify.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
