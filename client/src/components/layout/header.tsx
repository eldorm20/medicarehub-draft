import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { useTheme } from '@/components/ui/theme-provider';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  User, 
  LogOut, 
  Shield, 
  Settings, 
  Menu,
  Home,
  Search,
  MessageCircle,
  ShoppingCart,
  Sun,
  Moon,
  Globe,
  Package,
  Building2,
  Store,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const logoutMutation = useLogout();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, availableLanguages, t } = useLanguage();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Role-based navigation
  const getNavigationForRole = (role?: string) => {
    const baseNav = [
      { name: t('navigation.home'), href: '/', icon: Home },
      { name: t('navigation.medicines'), href: '/medicine-search', icon: Search },
    ];

    if (!isAuthenticated) return baseNav;

    switch (role) {
      case 'client':
        return [
          ...baseNav,
          { name: t('navigation.consultation'), href: '/ai-consultation', icon: MessageCircle },
          { name: t('navigation.orders'), href: '/orders', icon: ShoppingCart },
          { name: 'Dashboard', href: '/dashboard', icon: User }
        ];
      case 'pharmacy_seller':
        return [
          ...baseNav,
          { name: 'Orders', href: '/orders', icon: ShoppingCart },
          { name: 'Inventory', href: '/inventory', icon: Package },
          { name: 'Dashboard', href: '/dashboard', icon: Store }
        ];
      case 'pharmacy_owner':
        return [
          ...baseNav,
          { name: 'Management', href: '/pharmacy-management', icon: Building2 },
          { name: 'Analytics', href: '/analytics', icon: BarChart3 },
          { name: 'Dashboard', href: '/dashboard', icon: Building2 }
        ];
      default:
        return [...baseNav, { name: 'Dashboard', href: '/dashboard', icon: User }];
    }
  };

  const navigation = getNavigationForRole(user?.role);

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">UzPharm Digital</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="language-selector">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Actions */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <a className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      {t('navigation.dashboard')}
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {t('navigation.profile')}
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('navigation.settings')}
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? t('auth.signing_out') : t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">{t('header.login')}</Button>
              </Link>
              <Link href="/register">
                <Button>{t('auth.register')}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                <Link href="/">
                  <a className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-accent">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">UzPharm Digital</span>
                  </a>
                </Link>
                
                <div className="border-t pt-4">
                  {navigation.map((item) => {
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>

                {isAuthenticated && user && (
                  <div className="border-t pt-4">
                    <div className="px-4 py-2 text-sm">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <Link href="/dashboard">
                      <a className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm hover:bg-accent">
                        <Home className="w-5 h-5" />
                        <span>Dashboard</span>
                      </a>
                    </Link>
                    
                    <Link href="/profile">
                      <a className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm hover:bg-accent">
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                      </a>
                    </Link>
                    
                    <Link href="/settings">
                      <a className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm hover:bg-accent">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </a>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>
                    </button>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="border-t pt-4 space-y-2">
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full justify-start">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}