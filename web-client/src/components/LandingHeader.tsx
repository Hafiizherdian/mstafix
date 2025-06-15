import Link from 'next/link';
import { HiOutlineSparkles } from 'react-icons/hi';

const LandingHeader = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <HiOutlineSparkles className="h-8 w-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">MSTA</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-4">
          <Link href="#features" className="text-zinc-300 hover:text-white transition-colors">
            Fitur
          </Link>
          <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            href="/register"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg px-5 py-2.5 transition-colors"
          >
            Register
          </Link>
        </nav>
        <div className="md:hidden">
          <Link
            href="/login"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Mulai
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
