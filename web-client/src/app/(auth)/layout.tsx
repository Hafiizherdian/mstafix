import { HiOutlineLightningBolt } from 'react-icons/hi';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(13, 119, 119, 0.45))] z-0"></div>
      
      <div className="w-full max-w-md mx-auto z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="h-12 w-12 bg-cyan-600 rounded-xl flex items-center justify-center">
            <HiOutlineLightningBolt className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MSTA</h1>
        </div>
        
        <div className="bg-black p-8 rounded-2xl shadow-lg border border-gray-700">
          {children}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          © {new Date().getFullYear()} MSTA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
