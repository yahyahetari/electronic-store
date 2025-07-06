import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Menu, Search, UserCircle2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CartContext } from "./CartContext";
import { useSession, signOut } from "next-auth/react";
import Auth from "./Auth";

const navLinks = [
  { url: "/", label: "الصفحة الرئيسية" },
  { url: "/shop", label: "المتجر" },
  { url: "/categories", label: "الفئات" },
];

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { cart } = useContext(CartContext);
  const { data: session } = useSession();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const debounceTimer = useRef(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  const handleUserDropdown = (event) => {
    event.stopPropagation();
    setUserDropdownOpen(!userDropdownOpen);
    setMenuOpen(false);
  };

  const toggleMenu = (event) => {
    event.stopPropagation();
    setMenuOpen(!menuOpen);
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      const isSearchPage = router.pathname.startsWith('/search/');

      if (isSearchPage) {
        const searchQuery = router.asPath.split('/search/')[1] || '';
        setQuery(decodeURIComponent(searchQuery));
      } else {
        setQuery("");
      }
    };

    handleRouteChange();

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const debouncedSearch = useCallback((value) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (value.trim() !== "") {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          const data = await response.json();
          setSearchResults(data.results.map(result => result.title));
        } catch (error) {
          console.error("Error fetching search results:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 100);
  }, []);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim() !== "") {
      router.push(`/search/${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 shadow-lg bg-white flex items-center justify-between text-lg font-medium text-black p-2">
      <div className="flex items-center w-full md:w-auto">
        <div className="md:hidden flex items-center">
          {session ? (
            <div className="relative" ref={userDropdownRef}>
              <button onClick={handleUserDropdown} className="flex items-center ml-3">
                <Image
                  src={session.user.image || '/user.jpg'}
                  alt="المستخدم"
                  width={40}
                  height={40}
                  className="rounded-full h-12 w-12 object-cover object-top"
                  unoptimized
                />
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="font-semibold">{session.user.name}</p>
                    <p className="text-sm -mr-2 text-gray-500">{session.user.email}</p>
                  </div>
                  <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">حسابي</Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100">طلباتي</Link>
                  <button onClick={handleSignOut} className="block w-full text-right px-4 py-2 hover:bg-gray-100">تسجيل الخروج</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleSignIn} className="md:hidden">
              <UserCircle2 className="w-8 h-8 ml-3" />
            </button>
          )}
          <Menu onClick={toggleMenu} className="cursor-pointer ml-3" />
        </div>
        <div className="flex-grow flex justify-center md:justify-end">
          <Link href='/'>
            <Image src="/logo.png" alt="الشعار" width={70} height={30} />
          </Link>
        </div>
      </div>

      <nav className="hidden md:flex gap-4 items-center">
        {navLinks.map((link) => (
          <div key={link.label} className="relative">
            <Link href={link.url || "#"}
              className={`flex items-center hover:text-gray-600 cursor-pointer ${router.pathname === link.url ? "font-bold text-red-600" : ""}`}
              onClick={handleLinkClick}
            >
              {link.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button onClick={toggleSearch} className="p-1">
          <Search className="h-7 w-7" />
        </button>

        <Link href="/cart" className="flex items-center p-1 hover:text-gray-600 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-7" viewBox="0 0 576 512">
            <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
          </svg>
          {cart?.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
              {cart.length}
            </span>
          )}
        </Link>

        {session ? (
          <div className="relative hidden md:block" ref={userDropdownRef}>
            <button onClick={handleUserDropdown} className="flex items-center">
              <Image
                src={session.user.image || '/user.jpg'}
                alt="المستخدم"
                width={40}
                height={40}
                className="rounded-full h-12 w-12 object-cover object-top"
                unoptimized
              />
            </button>
            {userDropdownOpen && (
  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
    <div className="px-4 py-2 border-b text-center border-gray-200">
      <p className="font-semibold">{session.user.name}</p>
      <p className="text-sm -mr-2 text-gray-500">{session.user.email}</p>
    </div>
    <Link 
      href="/account" 
      className="block px-4 py-2 hover:bg-gray-100"
      onClick={() => setUserDropdownOpen(false)}
    >
      حسابي
    </Link>
    <Link 
      href="/orders" 
      className="block px-4 py-2 hover:bg-gray-100"
      onClick={() => setUserDropdownOpen(false)}
    >
      طلباتي
    </Link>
    <button onClick={handleSignOut} className="block w-full text-right px-4 py-2 hover:bg-gray-100">
      تسجيل الخروج
    </button>
  </div>
)}

          </div>
        ) : (
          <button onClick={handleSignIn} className="hidden md:block">
            <UserCircle2 className="w-8 h-8 " />
          </button>
        )}
      </div>

      {menuOpen && (
        <div ref={menuRef} className="absolute top-20 right-0 w-full p-4 shadow-lg bg-white flex flex-col items-center gap-4 md:hidden z-50">
          {navLinks.map((link) => (
            <div key={link.label} className="w-full text-center">
              <Link href={link.url || "#"}
                className={`flex justify-center items-center p-2 hover:text-gray-600 cursor-pointer ${router.pathname === link.url ? "font-bold text-red-600" : ""}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            </div>
          ))}
          {!session && (
            <button onClick={handleSignIn} className="w-full text-center p-2">
              تسجيل الدخول
            </button>
          )}
        </div>
      )}

      {searchOpen && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <form onSubmit={handleSearch} className="w-full flex items-center px-4">
            <input
              ref={searchInputRef}
              className="w-full h-full px-4 py-2 outline-none"
              placeholder="بحث..."
              value={query}
              onChange={handleSearchInput}
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="p-7">
              <X className="h-6 w-6" />
            </button>
          </form>
          {query.trim() !== "" && searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto"
              style={{ maxHeight: `${Math.min(searchResults.length * 40, 240)}px` }}>
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  href={`/search/${encodeURIComponent(result)}`}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setSearchOpen(false)}
                >
                  {result}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white  relative w-full mx-auto">
            <button
              onClick={handleCloseAuthModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <Auth onClose={handleCloseAuthModal} />
          </div>
        </div>
      )}
    </header>
  );
}
