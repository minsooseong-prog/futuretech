import {
  CalendarDays,
  House,
  Images,
  Megaphone,
  MessagesSquare,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; match: string };

export function navItems(userId: string): NavItem[] {
  return [
    { href: '/home', label: '홈', icon: House, match: '/home' },
    { href: '/album', label: '앨범', icon: Images, match: '/album' },
    { href: '/board', label: '게시판', icon: MessagesSquare, match: '/board' },
    { href: '/notices', label: '공지사항', icon: Megaphone, match: '/notices' },
    { href: '/members', label: '멤버', icon: Users, match: '/members' },
    { href: '/calendar', label: '캘린더', icon: CalendarDays, match: '/calendar' },
    { href: `/profile/${userId}`, label: '내 프로필', icon: UserRound, match: '/profile' },
    { href: '/settings', label: '설정', icon: Settings, match: '/settings' },
  ];
}

export const isActive = (pathname: string, match: string) => pathname === match || pathname.startsWith(`${match}/`);
