import { Priority } from './appointment.model';
import { BadgeTone, BadgeVariant } from '../../shared/ui/badge/badge.component';

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

export const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  low: 'secondary',
  medium: 'tertiary',
  high: 'danger',
  urgent: 'danger'
};

export const PRIORITY_VARIANT: Record<Priority, BadgeVariant> = {
  low: 'soft',
  medium: 'soft',
  high: 'soft',
  urgent: 'solid'
};

export const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-secondary',
  medium: 'bg-tertiary',
  high: 'bg-red-500',
  urgent: 'bg-red-600'
};
