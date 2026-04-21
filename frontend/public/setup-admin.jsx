// ============================================================
// SETUP & ADMIN UI
// - SetupScreen: first-run wizard
// - AdminPanel: slide-over for mid-tournament edits & score entry
// ============================================================

function SetupScreen({ state, setState, onStart }) {
  const [name, setName] = React.useState(state.setup.name);
  const [edition, setEdition] = React.useState(state.setup.edition);
  const [format, setFormat] = React.useState(state.setup.format);
  const [teamCount, setTeamCount] = React.useState(state.setup.teamCount || 8);
  const [groupsOf, setGroupsOf] = React.useState(state.setup.groupsOf || 4);
  const [pointsToWin, setPointsToWin] = React.useState(state.setup.pointsToWin || 12);
  const [pointsPerWin, setPointsPerWin] = React.useState(state.setup.pointsPerWin || 3);
  const [tiebreaker, setTiebreaker] = React.useState(state.setup.tiebreaker || "pedras");
  const [slideSeconds, setSlideSeconds] = React.useState(state.setup.slideSeconds || 24);
  const [liveScore, setLiveScore] = React.useState(state.setup.liveScore);
  const [sponsors, setSponsors] = React.useState(state.setup.sponsors || []);

  const [teams, setTeams] = React.useState(() => {
    const n = state.setup.teamCount || 8;
    return Array.from({length: n}, (_, i) => ({
      name: state.teams[i]?.name || "",
      p1: state.teams[i]?.p1 || "",
      p2: state.teams[i]?.p2 || "",
    }));
  });

  React.useEffect(() => {
    setTeams(prev => {
      const next = Array.from({length: teamCount}, (_, i) =>
        prev[i] || { name: "", p1: "", p2: "" });
      return next;
    });
  }, [teamCount]);

  function updateTeam(i, field, val) {
    setTeams(prev => prev.map((t, idx) => idx === i ? {...t, [field]: val} : t));
  }

  function start() {
    const filled = teams.filter(t => t.name.trim() !== "");
    if (filled.length < 2) { alert("Precisas de pelo menos 2 equipas."); return; }
    const next = window.SuecaEngine.clone(state);
    next.setup = { name, edition, format, teamCount: filled.length, pointsToWin, pointsPerWin, tiebreaker, slideSeconds, liveScore, groupsOf, sponsors };
    next.teams = filled.map(t => window.SuecaEngine.makeTeam(t.name, t.p1, t.p2));
    next.matches = []; next.rounds = []; next.history = [];
    const started = window.SuecaEngine.startTournament(next);
    setState(started);
    window.SuecaEngine.saveState(started);
    try { window.history.replaceState(null, "", `/t/${started.tournamentId}`); } catch(e){}
    onStart();
  }

  function fillExamples() {
    const examples = [
      ["Os Ases do Cais","Tó Zé","Manel"],
      ["Reis da Taberna","Joaquim","Serafim"],
      ["Damas de Copas","Maria","Lurdes"],
      ["Valetes do Norte","Bruno","Rui"],
      ["Naipes do Minho","Alberto","Henrique"],
      ["Sete de Ouros","Fernando","Carlos"],
      ["Manilha Velha","João","Artur"],
      ["Trunfo de Espadas","Paulo","Miguel"],
      ["Às de Copas","Elsa","Cátia"],
      ["Rainhas do Douro","Isabel","Teresa"],
      ["Coringas","Diogo","Tiago"],
      ["Os Vazados","Nuno","Hugo"],
      ["Três Setes","Ricardo","Pedro"],
      ["Naipe Forte","Vitor","André"],
      ["Copas Altas","Sandro","Filipe"],
      ["S. Cibrão FC","Dário","Bernardo"],
    ];
    setTeams(Array.from({length: teamCount}, (_, i) => ({
      name: examples[i]?.[0] || `Equipa ${i+1}`,
      p1: examples[i]?.[1] || "",
      p2: examples[i]?.[2] || "",
    })));
  }

  return (
    <div className="setup-wrap">
      <div className="setup-grid">
        <div className="setup-hero">
          <div className="eyebrow">Comissão de Festas · S. Cibrão</div>
          <h1 className="display">Torneio de <em>Sueca</em></h1>
          <div className="deck">
            {[0,1,2,3].map(i => (
              <div key={i} className={`deck-card deck-card-${i}`}>
                <Card suit={SUITS[i]} rank={["A","K","Q","J"][i]} size={110} />
              </div>
            ))}
          </div>
          <p className="lead">
            Configura o torneio abaixo. Depois liga o projetor, carrega em <b>Começar</b>, e nunca mais te preocupas —
            o ecrã roda sozinho entre o jogo atual, bracket, ranking e próximos jogos.
          </p>
          <div className="corner-ornament">♠ ♥ ♦ ♣</div>
        </div>

        <div className="setup-form">
          <section>
            <h3>Identidade</h3>
            <label>Nome do torneio
              <input value={name} onChange={e=>setName(e.target.value)} />
            </label>
            <label>Edição
              <input value={edition} onChange={e=>setEdition(e.target.value)} />
            </label>
          </section>

          <section>
            <h3>Formato</h3>
            <div className="seg">
              {[
                ["knockout","Eliminatória"],
                ["league","Liga"],
                ["groups","Grupos + Final"],
              ].map(([v,l]) => (
                <button key={v}
                  className={format===v?"on":""}
                  onClick={()=>setFormat(v)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="row">
              <label>Nº equipas
                <input type="number" min="2" max="32" value={teamCount}
                       onChange={e=>setTeamCount(Math.max(2, +e.target.value||2))}/>
              </label>
              <label>Máx. de pontos por jogo
                <input type="number" min="1" max="12" value={pointsToWin}
                       onChange={e=>setPointsToWin(Math.min(12, Math.max(1, +e.target.value || 12)))}/>
              </label>
              <label>Pontos de torneio por vitória
                <input type="number" min="1" max="10" value={pointsPerWin}
                       onChange={e=>setPointsPerWin(+e.target.value||3)}/>
              </label>
              {format === "groups" && (
                <label>Equipas / grupo
                  <input type="number" min="3" max="6" value={groupsOf}
                         onChange={e=>setGroupsOf(+e.target.value||4)}/>
                </label>
              )}
            </div>
            <label>Desempate
              <select value={tiebreaker} onChange={e=>setTiebreaker(e.target.value)}>
                <option value="pedras">Pontos totais</option>
                <option value="pedrasDiff">Diferença de pontos</option>
                <option value="headToHead">Confronto directo</option>
              </select>
            </label>
            <label>Duração de cada slide (segundos)
              <input type="number" min="5" max="120" value={slideSeconds}
                     onChange={e=>setSlideSeconds(Math.max(5, +e.target.value||24))}/>
            </label>
            <label className="check">
              <input type="checkbox" checked={liveScore}
                     onChange={e=>setLiveScore(e.target.checked)} />
              Marcar pontos/vazas ao vivo durante o jogo
            </label>
          </section>

          <section>
            <h3>Patrocinadores <span className="hint">(opcional)</span></h3>
            <SponsorsEditor sponsors={sponsors} setSponsors={setSponsors} />
          </section>

          <section>
            <div className="section-head">
              <h3>Equipas</h3>
              <button className="ghost" onClick={fillExamples}>Exemplos</button>
            </div>
            <div className="teams-list">
              {teams.map((t, i) => (
                <div key={i} className="team-row">
                  <div className="team-num">{String(i+1).padStart(2,"0")}</div>
                  <input className="team-name" placeholder="Nome da equipa"
                         value={t.name} onChange={e=>updateTeam(i,"name",e.target.value)} />
                  <input placeholder="Jogador 1"
                         value={t.p1} onChange={e=>updateTeam(i,"p1",e.target.value)} />
                  <input placeholder="Jogador 2"
                         value={t.p2} onChange={e=>updateTeam(i,"p2",e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          <div className="setup-actions">
            <button className="primary big" onClick={start}>
              Começar torneio →
            </button>
            <button className="ghost" onClick={()=>{
              if (confirm("Apagar tudo e recomeçar?")) {
                const fresh = window.SuecaEngine.resetState();
                setState(fresh);
              }
            }}>Limpar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Admin Panel ----------------
function AdminPanel({ state, setState, open, setOpen }) {
  const [tab, setTab] = React.useState("live");

  function update(mutator) {
    setState(prev => {
      const next = window.SuecaEngine.clone(prev);
      mutator(next);
      window.SuecaEngine.saveState(next);
      return next;
    });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sueca-${state.setup.edition}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        setState(parsed);
        window.SuecaEngine.saveState(parsed);
        alert("Importado.");
      } catch (e) { alert("Ficheiro inválido."); }
    };
    r.readAsText(f);
  }

  if (!open) return (
    <button className="admin-toggle" onClick={()=>setOpen(true)} title="Painel de administração">
      ⚙
    </button>
  );

  return (
    <>
      <div className="admin-backdrop" onClick={()=>setOpen(false)} />
      <div className="admin-panel">
        <div className="admin-head">
          <h2>Admin</h2>
          <button className="ghost" onClick={()=>setOpen(false)}>Fechar ✕</button>
        </div>
        <div className="admin-tabs">
          {[["live","Jogos atuais"],["matches","Jogos"],["teams","Equipas"],["sponsors","Patrocinadores"],["data","Dados"]].map(([k,l]) => (
            <button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="admin-body">
          {tab === "live" && <AdminLive state={state} update={update} />}
          {tab === "matches" && <AdminMatches state={state} update={update} />}
          {tab === "teams" && <AdminTeams state={state} update={update} />}
          {tab === "sponsors" && (
            <SponsorsEditor
              sponsors={state.setup.sponsors || []}
              setSponsors={v => update(s => { s.setup.sponsors = typeof v === "function" ? v(s.setup.sponsors || []) : v; })}
            />
          )}
          {tab === "data" && (
            <div className="admin-data">
              {state.tournamentId && (
                <div className="tournament-url">
                  <div className="tu-label">URL para espectadores</div>
                  <div className="tu-row">
                    <input readOnly value={`${window.SuecaEngine.getPublicBase()}/view/${state.tournamentId}`} onFocus={e=>e.target.select()} />
                    <button className="ghost" onClick={()=>{
                      const url = `${window.SuecaEngine.getPublicBase()}/view/${state.tournamentId}`;
                      navigator.clipboard?.writeText(url).then(()=>{}, ()=>{});
                    }}>Copiar</button>
                    <a className="ghost" href={`/view/${state.tournamentId}`} target="_blank" rel="noopener">Abrir</a>
                  </div>
                </div>
              )}
              <label>Duração de cada slide (segundos)
                <input type="number" min="5" max="120"
                       value={state.setup.slideSeconds || 24}
                       onChange={e=>update(s=>{ s.setup.slideSeconds = Math.max(5, +e.target.value||24); })}/>
              </label>
              <button className="primary" onClick={exportData}>Exportar backup (.json)</button>
              <label className="file-btn">
                Importar backup
                <input type="file" accept="application/json" onChange={importData}/>
              </label>
              <button className="danger" onClick={()=>{
                if (confirm("Tens a certeza? Isto apaga TUDO e volta ao setup.")) {
                  const fresh = window.SuecaEngine.resetState();
                  setState(fresh);
                }
              }}>Reiniciar torneio</button>
              <div className="data-stats">
                <div><span>Criado</span><b>{state.createdAt ? new Date(state.createdAt).toLocaleString("pt-PT") : "—"}</b></div>
                <div><span>Jogos totais</span><b>{state.matches.length}</b></div>
                <div><span>Jogos concluídos</span><b>{state.matches.filter(m=>m.status==="done").length}</b></div>
                <div><span>Equipas</span><b>{state.teams.length}</b></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AdminLive({ state, update }) {
  const current = window.SuecaEngine.activeStageMatches(state);
  const max = state.setup.pointsToWin || 12;
  if (!current.length) return <div className="empty">Sem jogos em curso. 🏆</div>;

  function stageLabel(match) {
    if (state.format === "knockout") {
      return window.SuecaEngine.roundName(match.round, Math.log2(window.nextPow2?.(state.teams.length) || state.teams.length));
    }
    const meta = state.rounds.find(r => r.matchIds.includes(match.id));
    return meta?.name || `Ronda ${match.round}`;
  }

  const titleLabel = Array.from(new Set(current.map(stageLabel))).length === 1 ? stageLabel(current[0]) : "Fase atual";

  function setScore(matchId, side, delta) {
    update(s => {
      const m = window.SuecaEngine.getMatch(s, matchId);
      if (!m) return;
      if (side === "A") m.scoreA = Math.max(0, Math.min(max, m.scoreA + delta));
      else m.scoreB = Math.max(0, Math.min(max, m.scoreB + delta));
      if (!m.startedAt) m.startedAt = Date.now();
      m.status = "live";
    });
  }

  function declareWinner(matchId, winnerId) {
    update(s => { window.SuecaEngine.finishMatch(s, matchId, winnerId); });
    window.dispatchEvent(new CustomEvent("sueca:jumpView", { detail: { key: "now" } }));
  }

  return (
    <div className="admin-live">
      <div className="live-title">{titleLabel} · Jogos atuais</div>
      <div className="live-score-cards">
        {current.map(match => {
          const A = window.SuecaEngine.getTeam(state, match.teamA);
          const B = window.SuecaEngine.getTeam(state, match.teamB);
          return (
            <div key={match.id} className={`live-score-card stage-${match.status}`}>
              <div className="live-score-card-head">
                <div className="lsc-round">{stageLabel(match)}</div>
                <div className={`lsc-status status-${match.status}`}>{match.status === "live" ? "Ao vivo" : "A iniciar"}</div>
              </div>
              <div className="live-score-match">{A?.name || "—"} <span>vs.</span> {B?.name || "—"}</div>
              <div className="live-score-cards-inner">
                {[{ t: A, s: match.scoreA, side: "A" }, { t: B, s: match.scoreB, side: "B" }].map(({ t, s, side }) => (
                  <div key={side} className="live-side-card">
                    <div className="lsc-name">{t?.name || "—"}</div>
                    <div className="lsc-score">{s}</div>
                    <div className="lsc-btns">
                      <button onClick={() => setScore(match.id, side, -1)}>−</button>
                      <button className="primary" onClick={() => setScore(match.id, side, +1)}>+1</button>
                    </div>
                    <button className="declare" disabled={!t} onClick={() => declareWinner(match.id, t.id)}>
                      ✓ Ganha
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminMatches({ state, update }) {
  const max = state.setup.pointsToWin || 12;
  return (
    <div className="admin-matches">
      {state.rounds.map((r, ri) => (
        <div key={ri} className="admin-round">
          <h4>{r.name}</h4>
          {r.matchIds.map(mid => {
            const m = window.SuecaEngine.getMatch(state, mid);
            if (!m) return null;
            const A = window.SuecaEngine.getTeam(state, m.teamA);
            const B = window.SuecaEngine.getTeam(state, m.teamB);
            return (
              <div key={m.id} className={`admin-m row-${m.status}`}>
                <span className="status-dot" data-s={m.status}></span>
                <span className="ta">{A?.name || <em>—</em>}</span>
                <input type="number" min="0" value={m.scoreA}
                       disabled={!A || !B}
                       onChange={e=>update(s=>{
                         const mm = window.SuecaEngine.getMatch(s, m.id);
                         window.SuecaEngine.setMatchScore(s, m.id, Math.max(0, Math.min(max, +e.target.value || 0)), mm?.scoreB || 0);
                       })}/>
                <span className="vs">–</span>
                <input type="number" min="0" value={m.scoreB}
                       disabled={!A || !B}
                       onChange={e=>update(s=>{
                         const mm = window.SuecaEngine.getMatch(s, m.id);
                         window.SuecaEngine.setMatchScore(s, m.id, mm?.scoreA || 0, Math.max(0, Math.min(max, +e.target.value || 0)));
                       })}/>
                <span className="tb">{B?.name || <em>—</em>}</span>
                <button className="mini"
                  disabled={!A || !B}
                  onClick={()=>{
                    if (m.status === "done") {
                      if (!confirm("Refazer resultado?")) return;
                    }
                    if (m.scoreA === m.scoreB) {
                      alert("Empates nao podem ser fechados. Ajusta o vencedor primeiro.");
                      return;
                    }
                    const winnerId = m.scoreA > m.scoreB ? A.id : B.id;
                    update(s => window.SuecaEngine.finishMatch(s, m.id, winnerId));
                  }}>
                  {m.status === "done" ? "↻" : "✓"}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AdminTeams({ state, update }) {
  return (
    <div className="admin-teams">
      {state.teams.map((t, i) => (
        <div key={t.id} className="admin-team">
          <div className="num">{String(i+1).padStart(2,"0")}</div>
          <input value={t.name}
            onChange={e=>update(s=>{ s.teams[i].name = e.target.value; })} />
          <input value={t.p1} placeholder="Jogador 1"
            onChange={e=>update(s=>{ s.teams[i].p1 = e.target.value; })} />
          <input value={t.p2} placeholder="Jogador 2"
            onChange={e=>update(s=>{ s.teams[i].p2 = e.target.value; })} />
          <div className="mini-stats">
            <span>{t.wins}V</span><span>{t.losses}D</span><span>{t.pedras} pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Sponsors Editor ----------------
function SponsorsEditor({ sponsors, setSponsors }) {
  const MAX = 10;
  const MAX_BYTES = 200 * 1024;

  function handleFile(ev) {
    const files = Array.from(ev.target.files || []);
    ev.target.value = "";
    files.forEach(f => {
      if (f.size > MAX_BYTES) {
        if (!confirm(`${f.name} tem ${Math.round(f.size/1024)} KB. Logos grandes atrasam o projetor. Continuar?`)) return;
      }
      const r = new FileReader();
      r.onload = () => {
        setSponsors(prev => {
          if (prev.length >= MAX) { alert(`Máximo ${MAX} patrocinadores.`); return prev; }
          return [...prev, { name: f.name.replace(/\.[^.]+$/, ""), logo: r.result }];
        });
      };
      r.readAsDataURL(f);
    });
  }

  function remove(i) {
    setSponsors(prev => prev.filter((_, idx) => idx !== i));
  }

  function rename(i, name) {
    setSponsors(prev => prev.map((s, idx) => idx === i ? { ...s, name } : s));
  }

  return (
    <div className="sponsors-editor">
      <div className="sponsors-list">
        {sponsors.map((s, i) => (
          <div key={i} className="sponsor-row">
            <div className="sponsor-thumb">
              {s.logo ? <img src={s.logo} alt=""/> : <span>—</span>}
            </div>
            <input value={s.name || ""} placeholder="Nome"
                   onChange={e=>rename(i, e.target.value)} />
            <button className="mini danger" onClick={()=>remove(i)}>✕</button>
          </div>
        ))}
        {sponsors.length === 0 && (
          <div className="empty sponsors-empty">
            <span className="sponsors-empty-icon">+</span>
            <span className="sponsors-empty-text">Sem patrocinadores.</span>
          </div>
        )}
      </div>
      <label className="file-btn">
        <span className="file-btn-plus">+</span>
        <span className="file-btn-copy">
          <strong>Adicionar logo</strong>
          <small>{sponsors.length}/{MAX} logos</small>
        </span>
        <input type="file" accept="image/*" multiple onChange={handleFile}
               disabled={sponsors.length >= MAX} />
      </label>
      <div className="hint">Até {MAX} logos, idealmente PNG/SVG com fundo transparente.</div>
    </div>
  );
}

// Helper used by admin
window.nextPow2 = function(n){ let p = 1; while (p < n) p *= 2; return p; };

Object.assign(window, { SetupScreen, AdminPanel, SponsorsEditor });
