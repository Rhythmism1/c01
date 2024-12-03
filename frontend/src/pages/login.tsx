import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/button/Button';
import { LoadingSVG } from '@/components/button/LoadingSVG';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: isLogin ? 'login' : 'register',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred');
      }

      if (data.success || data.message === 'User created successfully') {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            email: data.user.email
          }));
        }

        if (!isLogin) {
          setIsLogin(true);
          setEmail('');
          setPassword('');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-lg border-2 border-black">
        <h2 className="text-center font-mono font-semibold text-2xl text-black">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md font-mono text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full p-3 border-2 border-black rounded-md font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cartesia-500 focus:border-transparent"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full p-3 border-2 border-black rounded-md font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cartesia-500 focus:border-transparent"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            state="primary"
            size="large"
            className="w-full relative"
            disabled={isLoading}
          >
            <div className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}>
              {isLogin ? 'Sign in' : 'Register'}
            </div>
            {isLoading && (
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
                <LoadingSVG diameter={24} strokeWidth={4} />
              </div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            className="font-mono text-sm text-cartesia-500 hover:text-cartesia-600"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}