import {
  Home,
  Images,
  MessagesSquare,
  Megaphone,
  Users,
  CalendarDays,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/album', label: '앨범', icon: Images },
  { href: '/board', label: '게시판', icon: MessagesSquare },
  { href: '/notices', label: '공지사항', icon: Megaphone },
  { href: '/members', label: '반 친구들', icon: Users },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
];

export const ACCOUNT_ITEMS = (userId: string): NavItem[] => [
  { href: `/profile/${userId}`, label: '내 미니홈', icon: User },
  { href: '/settings', label: '설정', icon: Settings },
];

/** Bottom bar on phones keeps five destinations; the rest live behind 더보기. */
export const MOBILE_ITEMS: NavItem[] = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/album', label: '앨범', icon: Images },
  { href: '/board', label: '게시판', icon: MessagesSquare },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/members', label: '친구들', icon: Users },
];
