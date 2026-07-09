import type { Stats } from '../lib/stats';
import type { DateOrder } from '../lib/parser';
import { formatDay } from '../lib/parser';

interface Props {
  open: boolean;
  onClose: () => void;
  stats: Stats | null;
  dateOrder: DateOrder;
  title: string;
}

export default function StatsModal({ open, onClose, stats, dateOrder, title }: Props) {
  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>📊 {title} · stats</h3>
        {!stats ? <p className="hist-sub">No data.</p> : (
          <>
            <div className="stat-grid">
              <div className="stat-card"><div className="num">{stats.total.toLocaleString()}</div><div className="lbl">Messages</div></div>
              <div className="stat-card"><div className="num">{stats.mediaCount.toLocaleString()}</div><div className="lbl">Media</div></div>
              <div className="stat-card"><div className="num">{stats.wordCount.toLocaleString()}</div><div className="lbl">Words</div></div>
              <div className="stat-card"><div className="num">{stats.emojiCount.toLocaleString()}</div><div className="lbl">Emojis</div></div>
              <div className="stat-card"><div className="num">{stats.days}</div><div className="lbl">Active days</div></div>
              <div className="stat-card"><div className="num">{stats.avgPerDay}</div><div className="lbl">Msgs / day</div></div>
            </div>

            {stats.perSender.length > 0 && (
              <div className="stat-bars">
                <div className="stat-sec">Who talked most</div>
                {stats.perSender.slice(0, 8).map((s) => {
                  const top = stats.perSender[0].count || 1;
                  const pct = Math.max(4, Math.round((s.count / top) * 100));
                  return (
                    <div className="stat-bar-row" key={s.name}>
                      <div className="nm"><span>{s.name}</span><span>{s.count.toLocaleString()}</span></div>
                      <div className="stat-bar"><i style={{ width: pct + '%' }} /></div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="stat-foot">
              📅 {formatDay(stats.firstDate, dateOrder)} → {formatDay(stats.lastDate, dateOrder)}<br />
              🔥 Busiest day: {formatDay(stats.busiestDate, dateOrder)} ({stats.busiestCount.toLocaleString()} messages)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
