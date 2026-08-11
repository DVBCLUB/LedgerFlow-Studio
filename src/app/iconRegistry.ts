/**
 * Icon registry for workspace navigation
 * Extracted to avoid circular imports between ErpApp and components
 */
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  Rocket,
  Settings,
  UsersRound,
} from 'lucide-react';

export const IconMap: Record<string, typeof Building2> = {
  Building2,
  BookOpen,
  BarChart3,
  UsersRound,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  Rocket,
  Bot,
  Settings,
};
