import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow p-4">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;

// Placeholder components (will create separate files for these next)
const Header = () => <header className="bg-blue-500 text-white p-4">Header</header>;
const Sidebar = () => <aside className="bg-gray-200 w-64 p-4">Sidebar</aside>;
const Footer = () => <footer className="bg-gray-700 text-white p-4 text-center">Footer</footer>; 