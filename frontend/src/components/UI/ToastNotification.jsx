const ToastNotification = ({ message }) => {
  if (!message) return null;

  return (
    <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all animate-bounce">
      {message}
    </div>
  );
};

export default ToastNotification;
