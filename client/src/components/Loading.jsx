function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Yükleniyor...</p>
    </div>
  );
}

export default Loading;

