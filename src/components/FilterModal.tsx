import * as P from '../lib/parser';
import type { DateOrder } from '../lib/parser';

export interface ChatFilter { sender: string; from: string; to: string; mediaOnly: boolean }
export const EMPTY_FILTER: ChatFilter = { sender: '', from: '', to: '', mediaOnly: false };

interface Props {
  open: boolean;
  onClose: () => void;
  senders: string[];
  dates: string[];            // unique chat dates, in chronological order
  dateOrder: DateOrder;
  value: ChatFilter;
  onChange: (f: ChatFilter) => void;
  onClear: () => void;
  visibleCount: number;
  totalCount: number;
}

/** Filter the chat view by sender, date range, or media-only — without altering the data. */
export default function FilterModal({ open, onClose, senders, dates, dateOrder, value, onChange, onClear, visibleCount, totalCount }: Props) {
  const set = (patch: Partial<ChatFilter>) => onChange({ ...value, ...patch });
  const label = (d: string) => P.formatDay(d, dateOrder);

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-box flt-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>🔎 Filter chat</h3>

        <label className="flt-row">
          <span className="flt-lbl">Sender</span>
          <select value={value.sender} onChange={(e) => set({ sender: e.target.value })}>
            <option value="">Everyone</option>
            {senders.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="flt-row">
          <span className="flt-lbl">From date</span>
          <select value={value.from} onChange={(e) => set({ from: e.target.value })}>
            <option value="">Beginning</option>
            {dates.map((d) => <option key={d} value={d}>{label(d)}</option>)}
          </select>
        </label>

        <label className="flt-row">
          <span className="flt-lbl">To date</span>
          <select value={value.to} onChange={(e) => set({ to: e.target.value })}>
            <option value="">End</option>
            {dates.map((d) => <option key={d} value={d}>{label(d)}</option>)}
          </select>
        </label>

        <label className="flt-check">
          <input type="checkbox" checked={value.mediaOnly} onChange={(e) => set({ mediaOnly: e.target.checked })} />
          <span>Show only messages with media 📎</span>
        </label>

        <div className="flt-count">Showing <b>{visibleCount.toLocaleString()}</b> of {totalCount.toLocaleString()} messages</div>

        <div className="flt-actions">
          <button className="flt-clear" onClick={onClear}>Clear all</button>
          <button className="flt-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
