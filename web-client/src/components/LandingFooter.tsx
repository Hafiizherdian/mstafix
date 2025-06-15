const LandingFooter = () => {
  return (
    <footer className="bg-zinc-900/50 border-t border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center text-zinc-400">
        <p>&copy; {new Date().getFullYear()} MSTA. All rights reserved.</p>
        <p className="mt-2 text-sm">
          Ditenagai oleh AI untuk Pendidikan yang Lebih Baik.
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
