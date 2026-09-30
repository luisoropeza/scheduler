import { Component, computed, input, output, signal } from '@angular/core';
import { CalendarDay, buildMonthMatrix, formatMonthLabel, formatShortDate, parseIso, toIso } from '../../../core/utils/calendar.util';

export interface DateRange {
  from: string;
  to: string;
}

interface DayState {
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  isToday: boolean;
}

/** Airbnb-style range popover for the backend's ?from&to filters — replaces raw native date inputs. */
@Component({
  selector: 'app-date-range-picker',
  imports: [],
  templateUrl: './date-range-picker.component.html',
  host: { class: 'relative' }
})
export class DateRangePickerComponent {
  from = input.required<string>();
  to = input.required<string>();

  rangeChange = output<DateRange>();

  protected readonly weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  protected readonly today = toIso(new Date());

  protected readonly isOpen = signal(false);
  private readonly viewDate = signal(new Date());
  protected readonly monthLabel = computed(() => formatMonthLabel(this.viewDate()));
  protected readonly weeks = computed(() => buildMonthMatrix(this.viewDate().getFullYear(), this.viewDate().getMonth()));

  private readonly draftStart = signal<string | null>(null);
  private readonly draftEnd = signal<string | null>(null);
  private readonly hoverIso = signal<string | null>(null);

  protected readonly label = computed(() => {
    const from = this.from();
    const to = this.to();
    return from === to ? formatShortDate(from) : `${formatShortDate(from)} – ${formatShortDate(to)}`;
  });

  protected toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  protected open(): void {
    this.draftStart.set(this.from());
    this.draftEnd.set(this.to());
    this.viewDate.set(parseIso(this.from()));
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.hoverIso.set(null);
  }

  protected previousMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  }

  protected hover(iso: string): void {
    this.hoverIso.set(iso);
  }

  protected clearHover(): void {
    this.hoverIso.set(null);
  }

  protected pick(iso: string): void {
    const start = this.draftStart();

    if (!start || this.draftEnd()) {
      this.draftStart.set(iso);
      this.draftEnd.set(null);
      return;
    }

    this.commit(iso < start ? { from: iso, to: start } : { from: start, to: iso });
  }

  protected presetToday(): void {
    const iso = toIso(new Date());
    this.commit({ from: iso, to: iso });
  }

  protected presetNext7Days(): void {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 6);
    this.commit({ from: toIso(start), to: toIso(end) });
  }

  protected presetThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.commit({ from: toIso(start), to: toIso(end) });
  }

  private commit(range: DateRange): void {
    this.draftStart.set(range.from);
    this.draftEnd.set(range.to);
    this.rangeChange.emit(range);
    this.close();
  }

  protected dayState(day: CalendarDay): DayState {
    const start = this.draftStart();
    const end = this.draftEnd() ?? this.hoverIso();
    const lo = start && end ? (start < end ? start : end) : null;
    const hi = start && end ? (start < end ? end : start) : null;

    return {
      isStart: day.iso === start,
      isEnd: day.iso === this.draftEnd(),
      inRange: !!lo && !!hi && day.iso > lo && day.iso < hi,
      isToday: day.iso === this.today
    };
  }
}
