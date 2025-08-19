#!/usr/bin/env python3
"""
Generate SVG calendar grids for 2026 with Russian public holidays and selected
industry/professional days relevant to manufacturing and engineering.

Output: one SVG per month saved into /workspace/calendar_2026_svg.

Design notes:
- Monday-first week (ru locale): ПН ВТ СР ЧТ ПТ СБ ВС
- Saturdays and Sundays are colored red (#E53935)
- Public holidays and professional days are marked in the grid with a small
  dot and listed at the bottom as text entries "dd/mm – name".

This script focuses on producing a clean, reusable calendar grid that can be
embedded into any design. It does not attempt to recreate complex background
graphics from raster sources; instead, it outputs vector-only calendar layers
ready for composition.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Tuple


@dataclass(frozen=True)
class Event:
    name: str
    color: str = "#E53935"  # Default red for holidays


YEAR = 2026


def nth_weekday_of_month(year: int, month: int, weekday: int, n: int) -> date:
    """Return the date of the n-th weekday (0=Mon..6=Sun) in given month.

    Raises ValueError if n is invalid.
    """
    if n <= 0:
        raise ValueError("n must be positive")
    first = date(year, month, 1)
    first_weekday = first.weekday()  # 0=Mon..6=Sun
    delta_days = (weekday - first_weekday) % 7
    day = 1 + delta_days + (n - 1) * 7
    # Validate
    last_day = calendar.monthrange(year, month)[1]
    if day > last_day:
        raise ValueError("Requested n-th weekday does not exist in this month")
    return date(year, month, day)


def last_weekday_of_month(year: int, month: int, weekday: int) -> date:
    """Return the date of the last weekday (0=Mon..6=Sun) in given month."""
    last_day = calendar.monthrange(year, month)[1]
    last = date(year, month, last_day)
    delta_days = (last.weekday() - weekday) % 7
    return last - timedelta(days=delta_days)


def first_weekday_of_month(year: int, month: int, weekday: int) -> date:
    """Return the date of the first given weekday (0=Mon..6=Sun) in month."""
    return nth_weekday_of_month(year, month, weekday, 1)


def first_sunday_of_september(year: int) -> date:
    return first_weekday_of_month(year, 9, 6)


def third_sunday_of_july(year: int) -> date:
    return nth_weekday_of_month(year, 7, 6, 3)


def last_sunday_of_september(year: int) -> date:
    return last_weekday_of_month(year, 9, 6)


def last_sunday_of_august(year: int) -> date:
    return last_weekday_of_month(year, 8, 6)


def last_friday_of_july(year: int) -> date:
    return last_weekday_of_month(year, 7, 4)


def build_events(year: int) -> Dict[date, List[Event]]:
    """Return a mapping from date to events for the given year.

    Contains official public holidays and a curated set of professional days
    commonly used in industrial calendars.
    """
    events: Dict[date, List[Event]] = {}

    def add(d: date, name: str, color: str = "#E53935") -> None:
        events.setdefault(d, []).append(Event(name=name, color=color))

    # New Year holidays (Jan 1–8). Official transfer details are defined by
    # the government later each year; we mark the traditional block.
    for day in range(1, 9):
        add(date(year, 1, day), "Новогодние дни")

    # Fixed-date public holidays
    add(date(year, 2, 23), "День защитника Отечества")
    add(date(year, 3, 8), "Международный женский день")
    add(date(year, 5, 1), "Праздник Весны и Труда")
    add(date(year, 5, 9), "День Победы")
    add(date(year, 6, 12), "День России")
    add(date(year, 11, 4), "День народного единства")

    # Popular/industry professional days (non-official days off)
    add(date(year, 6, 1), "Междунар. день защиты детей", color="#1976D2")
    add(date(year, 6, 29), "День кораблестроителя", color="#1976D2")
    add(third_sunday_of_july(year), "День металлурга", color="#1976D2")
    add(last_friday_of_july(year), "День системного администратора", color="#1976D2")
    add(last_sunday_of_august(year), "День шахтёра", color="#1976D2")
    add(first_sunday_of_september(year), "День нефтяной и газовой пром.", color="#1976D2")
    add(last_sunday_of_september(year), "День машиностроителя", color="#1976D2")
    add(date(year, 12, 22), "День энергетика", color="#1976D2")
    # Traditional year-end notes
    add(date(year, 12, 29), "Новогодние дни", color="#E53935")
    add(date(year, 12, 30), "Новогодние дни", color="#E53935")
    add(date(year, 12, 31), "Новогодние дни", color="#E53935")

    # Optional: Cosmonautics Day (April 12)
    add(date(year, 4, 12), "День космонавтики", color="#1976D2")

    return events


RU_MONTHS = [
    "ЯНВАРЬ",
    "ФЕВРАЛЬ",
    "МАРТ",
    "АПРЕЛЬ",
    "МАЙ",
    "ИЮНЬ",
    "ИЮЛЬ",
    "АВГУСТ",
    "СЕНТЯБРЬ",
    "ОКТЯБРЬ",
    "НОЯБРЬ",
    "ДЕКАБРЬ",
]

EN_MONTHS = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
]

WEEKDAYS_RU = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"]


def generate_month_svg(year: int, month: int, month_events: Dict[date, List[Event]]) -> str:
    """Return SVG markup for a single month grid."""
    cal = calendar.Calendar(firstweekday=0)  # Monday first
    weeks: List[List[int]] = []
    for week in cal.monthdayscalendar(year, month):
        weeks.append(week)

    # Layout constants (in pixels)
    width = 1900
    height = 1300
    margin = 80
    header_h = 180
    weekday_h = 100
    grid_h = 760
    cell_w = (width - 2 * margin) / 7
    cell_h = grid_h / 6
    footer_h = height - margin - (margin + header_h + weekday_h + grid_h)

    # Colors
    bg = "#0F2A5A"  # deep blue background panel for the calendar area
    text = "#FFFFFF"
    weekend_text = "#FF3B30"  # red
    minor_text = "#B0C4DE"

    # Header text
    header_ru = RU_MONTHS[month - 1]
    header_en = EN_MONTHS[month - 1]

    # Build SVG
    svg_parts: List[str] = []
    svg_parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
    )

    # Background
    svg_parts.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="#FFFFFF"/>')
    # Main blue panel
    panel_y = margin
    panel_h = header_h + weekday_h + grid_h + footer_h
    svg_parts.append(
        f'<rect x="{margin}" y="{panel_y}" width="{width - 2 * margin}" height="{panel_h}" rx="8" fill="{bg}"/>'
    )

    # Header
    header_group_y = margin + 20
    svg_parts.append(
        f'<text x="{margin + 40}" y="{header_group_y + 70}" font-family="Montserrat,Arial" font-weight="700" font-size="64" fill="{text}">{header_ru}|{year}|{header_en}</text>'
    )

    # Weekday row background accent for weekends
    weekday_y = margin + header_h
    # Highlight Sat/Sun header strip in red
    sat_x = margin + 5 * cell_w
    sun_x = margin + 6 * cell_w
    svg_parts.append(f'<rect x="{sat_x}" y="{weekday_y}" width="{2 * cell_w}" height="{weekday_h}" fill="{weekend_text}" opacity="0.22"/>')

    # Weekday labels
    for i, wd in enumerate(WEEKDAYS_RU):
        color = weekend_text if i >= 5 else text
        x = margin + i * cell_w + cell_w / 2
        y = weekday_y + weekday_h / 2 + 18
        svg_parts.append(
            f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Montserrat,Arial" font-weight="700" font-size="40" fill="{color}">{wd}</text>'
        )

    # Grid numbers
    grid_y = weekday_y + weekday_h
    for row, week in enumerate(weeks):
        for col, day in enumerate(week):
            if day == 0:
                continue
            x = margin + col * cell_w + 22
            y = grid_y + row * cell_h + 56
            color = weekend_text if col >= 5 else text
            svg_parts.append(
                f'<text x="{x}" y="{y}" font-family="Montserrat,Arial" font-weight="600" font-size="44" fill="{color}">{day}</text>'
            )
            d = date(year, month, day)
            if d in month_events:
                # Draw a small marker dot in the cell
                cx = margin + col * cell_w + cell_w - 18
                cy = grid_y + row * cell_h + 20
                # Use the color of the first event for the dot
                dot_color = month_events[d][0].color
                svg_parts.append(f'<circle cx="{cx}" cy="{cy}" r="6" fill="{dot_color}" />')

    # Footer: list monthly events
    footer_y = grid_y + grid_h + 30
    month_event_items: List[Tuple[int, str, str]] = []
    for d, es in sorted(month_events.items()):
        if d.month == month:
            for e in es:
                month_event_items.append((d.day, e.name, e.color))

    # Render event lines
    if month_event_items:
        start_x = margin + 20
        cur_x = start_x
        cur_y = footer_y
        gap = 30
        for day_num, title, color in month_event_items:
            item = f"{day_num:02d}/{month:02d} – {title}"
            svg_parts.append(
                f'<text x="{cur_x}" y="{cur_y}" font-family="Montserrat,Arial" font-size="28" fill="{minor_text}">{item}</text>'
            )
            cur_y += gap

    svg_parts.append("</svg>")
    return "".join(svg_parts)


def main() -> None:
    out_dir = Path("/workspace/calendar_2026_svg")
    out_dir.mkdir(parents=True, exist_ok=True)

    events = build_events(YEAR)

    for month in range(1, 13):
        # Filter events for month for efficient lookup
        month_events: Dict[date, List[Event]] = {
            d: es for d, es in events.items() if d.month == month
        }
        svg = generate_month_svg(YEAR, month, month_events)
        out_path = out_dir / f"{YEAR}_{month:02d}.svg"
        out_path.write_text(svg, encoding="utf-8")

    print(f"Generated SVG calendars in {out_dir}")


if __name__ == "__main__":
    main()

