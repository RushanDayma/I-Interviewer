import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin h-7 w-7 border-2 border-zinc-200 border-t-zinc-700 rounded-full"></div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to='/login' />;
};

export default PrivateRoute;
