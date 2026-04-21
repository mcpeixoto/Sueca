// ============================================================
// PROJECTOR VIEWS
// Rotating screens: NowPlaying → Bracket/League → Ranking → MVP → Upcoming
// ============================================================

// ---- Clock ----
function useClock() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(d){ return d.toLocaleTimeString("pt-PT", {hour:"2-digit", minute:"2-digit"}); }
function fmtDate(d){
  const wd = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][d.getDay()];
  const m = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][d.getMonth()];
  return `${wd}, ${d.getDate()} ${m}`;
}

// ---- Projector Frame (header/footer, kept across views) ----
function ProjectorFrame({ state, children, viewIdx, viewCount, viewLabel, elapsedMs }) {
  const now = useClock();
  const elapsedH = Math.floor(elapsedMs / 3600000);
  const elapsedM = Math.floor((elapsedMs % 3600000) / 60000);
  return (
    <div className="proj-frame">
      <header className="proj-header">
        <div className="ph-left">
          <div className="ph-eyebrow">♠ COMISSÃO DE FESTAS · SÃO CIBRÃO ♠</div>
          <div className="ph-title">{state.setup.name}</div>
          <div className="ph-edition">{state.setup.edition}</div>
        </div>
        <div className="ph-right">
          <div className="ph-clock">{fmtTime(now)}</div>
          <div className="ph-date">{fmtDate(now)}</div>
          <div className="ph-elapsed">Duração · {elapsedH}h {String(elapsedM).padStart(2,"0")}m</div>
        </div>
      </header>
      <div className="pf-views pf-views-top">
        {Array.from({length: viewCount}).map((_, i) => (
          <div key={i} className={`pf-dot ${i===viewIdx?"on":""}`} />
        ))}
      </div>
      {viewLabel && <div key={viewLabel} className="slide-label">{viewLabel}</div>}
      <div className="proj-main">{children}</div>
      <footer className="proj-footer">
        <div className="pf-motto">♦ <em>O trunfo decide.</em> ♦</div>
      </footer>
    </div>
  );
}

// ---- View: Now Playing (current match or simultaneous live matches) ----
function roundLabel(state, m) {
  return state.format === "knockout"
    ? window.SuecaEngine.roundName(m.round, Math.log2(window.nextPow2(state.teams.length)))
    : (state.rounds[m.round-1]?.name || `Ronda ${m.round}`);
}

function ViewNowPlaying({ state }) {
  const live = window.SuecaEngine.liveMatches(state);
  const max = state.setup.pointsToWin || 10;

  if (live.length >= 2) {
    const cols = live.length <= 2 ? 2 : live.length <= 4 ? 2 : 3;
    return (
      <div className="view now-playing np-multi">
        <div className="np-multi-grid" style={{gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
          {live.map(m => (
            <MatchCard key={m.id} state={state} match={m} max={max} roundName={roundLabel(state, m)} />
          ))}
        </div>
      </div>
    );
  }

  const m = live[0] || window.SuecaEngine.currentMatch(state);
  if (!m) return <FinaleView state={state} />;
  const A = window.SuecaEngine.getTeam(state, m.teamA);
  const B = window.SuecaEngine.getTeam(state, m.teamB);

  return (
    <div className="view now-playing">
      <div className="np-round">{roundLabel(state, m)} · <span className={`np-status np-${m.status}`}>{m.status==="live"?"● AO VIVO":"A iniciar"}</span></div>
      <div className="np-teams">
        <TeamBlock team={A} score={m.scoreA} max={max} side="left" />
        <div className="np-vs">
          <div className="np-vs-deck">
            <Card suit={SUITS[0]} rank="A" size={70} style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-60%, -50%) rotate(-14deg)"}}/>
            <Card suit={SUITS[1]} rank="7" size={70} style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-40%, -40%) rotate(6deg)"}}/>
          </div>
          <div className="np-vs-label">vs.</div>
          <div className="np-pedras">até {max} pontos</div>
        </div>
        <TeamBlock team={B} score={m.scoreB} max={max} side="right" />
      </div>
    </div>
  );
}

function MatchCard({ state, match, max, roundName }) {
  const A = window.SuecaEngine.getTeam(state, match.teamA);
  const B = window.SuecaEngine.getTeam(state, match.teamB);
  const pctA = Math.min(1, match.scoreA / max);
  const pctB = Math.min(1, match.scoreB / max);
  return (
    <div className={`match-card status-${match.status}`}>
      <div className="mc-head">
        <span className="mc-round">{roundName}</span>
        <span className="mc-live">● AO VIVO</span>
      </div>
      <div className="mc-body">
        <div className="mc-side">
          <div className="mc-name">{A?.name || "—"}</div>
          <div className="mc-players">{A ? `${A.p1 || "—"} · ${A.p2 || "—"}` : ""}</div>
        </div>
        <div className="mc-scores">
          <div className="mc-score" key={`a${match.scoreA}`}>{match.scoreA}</div>
          <div className="mc-sep">–</div>
          <div className="mc-score" key={`b${match.scoreB}`}>{match.scoreB}</div>
        </div>
        <div className="mc-side mc-side-right">
          <div className="mc-name">{B?.name || "—"}</div>
          <div className="mc-players">{B ? `${B.p1 || "—"} · ${B.p2 || "—"}` : ""}</div>
        </div>
      </div>
      <div className="mc-bars">
        <div className="mc-bar"><div className="mc-bar-fill" style={{width:`${pctA*100}%`}}/></div>
        <div className="mc-pedras">até {max} pontos</div>
        <div className="mc-bar"><div className="mc-bar-fill mc-bar-right" style={{width:`${pctB*100}%`}}/></div>
      </div>
    </div>
  );
}

function TeamBlock({ team, score, max, side }) {
  if (!team) return <div className="team-block empty">TBD</div>;
  const pct = Math.min(1, score / max);
  return (
    <div className={`team-block side-${side}`}>
      <div className="tb-name">{team.name}</div>
      <div className="tb-players">
        <span>{team.p1 || "—"}</span>
        <span className="dot">·</span>
        <span>{team.p2 || "—"}</span>
      </div>
      <div className="tb-score-wrap">
        <div className="tb-score" key={score}>{score}</div>
        <div className="tb-pedras">pontos</div>
      </div>
      <div className="tb-bar">
        <div className="tb-bar-fill" style={{width: `${pct*100}%`}}/>
        <div className="tb-bar-pips">
          {Array.from({length: max}).map((_, i) => (
            <div key={i} className={`pip ${i < score ? "on" : ""}`} />
          ))}
        </div>
      </div>
      <div className="tb-stats">
        <span><b>{team.wins}</b> V</span>
        <span><b>{team.losses}</b> D</span>
        <span><b>{team.pedras}</b> pontos totais</span>
      </div>
    </div>
  );
}

// ---- View: Bracket (knockout) ----
function ViewBracket({ state }) {
  return (
    <div className="view bracket-view">
      <div className="bracket">
        {state.rounds.map((r, ri) => (
          <div key={ri} className="br-col">
            <div className="br-col-title">{r.name}</div>
            <div className="br-matches">
              {r.matchIds.map(mid => {
                const m = window.SuecaEngine.getMatch(state, mid);
                if (!m) return null;
                const A = window.SuecaEngine.getTeam(state, m.teamA);
                const B = window.SuecaEngine.getTeam(state, m.teamB);
                const winA = m.winner && m.winner === m.teamA;
                const winB = m.winner && m.winner === m.teamB;
                return (
                  <div key={m.id} className={`br-match status-${m.status}`}>
                    <div className={`br-row ${winA?"win":""} ${m.winner && !winA?"lose":""}`}>
                      <span className="br-name">{A?.name || <em>—</em>}</span>
                      <span className="br-score">{A ? m.scoreA : ""}</span>
                    </div>
                    <div className={`br-row ${winB?"win":""} ${m.winner && !winB?"lose":""}`}>
                      <span className="br-name">{B?.name || <em>—</em>}</span>
                      <span className="br-score">{B ? m.scoreB : ""}</span>
                    </div>
                    {m.status === "live" && <div className="br-live">● AO VIVO</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- View: Ranking (all teams sorted) ----
function ViewRanking({ state }) {
  const rows = window.SuecaEngine.standings(state);
  return (
    <div className="view ranking">
      <div className="rank-table">
        <div className="rank-head">
          <span>#</span><span>Equipa</span><span>V</span><span>D</span><span>Pontos</span><span>Total</span>
        </div>
        {rows.map((t, i) => (
          <div key={t.id} className={`rank-row pos-${i+1} ${t.eliminated?"elim":""}`}
               style={{animationDelay: `${i*0.08}s`}}>
            <span className="pos">
              {i===0 ? "♠" : i===1 ? "♥" : i===2 ? "♦" : String(i+1).padStart(2,"0")}
            </span>
            <span className="name">
              <b>{t.name}</b>
              <small>{t.p1} · {t.p2}</small>
            </span>
            <span>{t.wins}</span>
            <span>{t.losses}</span>
            <span>{t.pedras}</span>
            <span className="pts">{t.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- View: MVP Leaderboard ----
function ViewMVP({ state }) {
  const rows = window.SuecaEngine.mvpLeaderboard(state);
  return (
    <div className="view mvp-view">
      {rows.length === 0 ? (
        <div className="empty-big">
          <Card suit={SUITS[0]} rank="?" size={160}/>
          <p>Ainda sem MVPs nomeados.<br/>Nomeia um no final de cada jogo.</p>
        </div>
      ) : (
        <div className="mvp-grid">
          {rows.slice(0, 8).map((r, i) => (
            <div key={r.name} className={`mvp-card rank-${i+1}`}
                 style={{animationDelay: `${i*0.1}s`}}>
              <div className="mvp-badge">
                <span className="suit">{SUITS[i%4].s}</span>
                <span className="rank">{i===0?"1º":i===1?"2º":i===2?"3º":`${i+1}º`}</span>
              </div>
              <div className="mvp-name">{r.name}</div>
              <div className="mvp-count"><b>{r.count}</b> <span>{r.count===1?"MVP":"MVPs"}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- View: Upcoming & History ----
function ViewUpcomingHistory({ state }) {
  const upcoming = state.matches.filter(m => m.status === "pending" || m.status === "locked").slice(0, 5);
  const recent = state.history.slice(0, 5);
  return (
    <div className="view upcoming">
      <div className="up-cols">
        <div className="up-col">
          <h3 className="up-col-title">Próximos Jogos</h3>
          {upcoming.length === 0 && <div className="empty">Sem jogos agendados.</div>}
          <div className="up-list">
            {upcoming.map((m, i) => {
              const A = window.SuecaEngine.getTeam(state, m.teamA);
              const B = window.SuecaEngine.getTeam(state, m.teamB);
              const rName = state.format === "knockout"
                ? window.SuecaEngine.roundName(m.round, Math.log2(window.nextPow2(state.teams.length)))
                : (state.rounds[m.round-1]?.name || `Ronda ${m.round}`);
              return (
                <div key={m.id} className="up-row" style={{animationDelay:`${i*0.08}s`}}>
                  <div className="up-round">{rName}</div>
                  <div className="up-match">
                    <span>{A?.name || "—"}</span>
                    <span className="vs">vs.</span>
                    <span>{B?.name || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="up-col">
          <h3 className="up-col-title">Resultados Recentes</h3>
          {recent.length === 0 && <div className="empty">Sem resultados ainda.</div>}
          <div className="hist-list">
            {recent.map((h, i) => (
              <div key={h.id} className="hist-row" style={{animationDelay:`${i*0.08}s`}}>
                <div className="hist-match">
                  <span className={h.winnerName === h.teamAName ? "winner":""}>{h.teamAName}</span>
                  <span className="score">{h.scoreA} – {h.scoreB}</span>
                  <span className={h.winnerName === h.teamBName ? "winner":""}>{h.teamBName}</span>
                </div>
                {h.mvp && <div className="hist-mvp">MVP · {h.mvp}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Finale: champion crowned ----
function FinaleView({ state }) {
  const rows = window.SuecaEngine.standings(state);
  const champ = rows[0];
  if (!champ) return <div className="empty-big">Aguardar resultados...</div>;
  return (
    <div className="view finale">
      <div className="finale-eyebrow">♛ CAMPEÕES ♛</div>
      <div className="finale-deck">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`finale-card fc-${i}`}>
            <Card suit={SUITS[i%4]} rank={["A","K","Q","J","A"][i]} size={140}/>
          </div>
        ))}
      </div>
      <h1 className="finale-name">{champ.name}</h1>
      <div className="finale-players">{champ.p1} · {champ.p2}</div>
      <div className="finale-stats">
        <div><b>{champ.wins}</b><span>vitórias</span></div>
        <div><b>{champ.pedras}</b><span>pontos</span></div>
        <div><b>{champ.points}</b><span>pontos</span></div>
      </div>
    </div>
  );
}

// ---- View: QR for spectators ----
function buildQrSvg(url) {
  if (typeof qrcode !== "function") return "";
  for (let t = 4; t < 41; t++) {
    try {
      const qr = qrcode(t, "M");
      qr.addData(url);
      qr.make();
      return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    } catch (e) {
      if (t === 40) return "";
    }
  }
  return "";
}

function ViewQR({ state }) {
  const tid = state.tournamentId;
  if (!tid) return null;
  const base = window.SuecaEngine.getPublicBase();
  const url = `${base}/view/${tid}`;
  const svg = React.useMemo(() => buildQrSvg(url), [url]);
  return (
    <div className="view qr-view">
      <div className="qr-box">
        <div className="qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="qr-url">{url}</div>
        <div className="qr-hint">Aponta a câmara do telemóvel</div>
      </div>
    </div>
  );
}

// ---- View: Sponsors ----
function ViewSponsors({ state }) {
  const sponsors = (state.setup && state.setup.sponsors) || [];
  if (!sponsors.length) return null;
  const cols = sponsors.length <= 2 ? sponsors.length : sponsors.length <= 4 ? 2 : sponsors.length <= 9 ? 3 : 4;
  return (
    <div className="view sponsors-view">
      <div className="sp-eyebrow">♦ PATROCINADORES ♦</div>
      <div className="sp-grid" style={{gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
        {sponsors.map((s, i) => (
          <div key={i} className="sp-card" style={{animationDelay: `${i*0.08}s`}}>
            {s.logo ? <img src={s.logo} alt={s.name || ""} /> : <div className="sp-name-big">{s.name}</div>}
            {s.logo && s.name && <div className="sp-name">{s.name}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ProjectorFrame,
  ViewNowPlaying, ViewBracket, ViewRanking, ViewMVP, ViewUpcomingHistory, ViewQR, ViewSponsors, FinaleView,
});
