// ============================================================
// SETUP & ADMIN UI
// - LandingScreen: public entry with start button + code forms
// - SetupScreen: first-run wizard
// - CodesScreen: shows tournament + admin codes after creation
// - AdminPanel: slide-over for mid-tournament edits & score entry
// ============================================================

function sanitizeCode(raw, max) {
  return (raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, max);
}

function MadeByFooter() {
  return (
    <a
      className="made-by-footer"
      href="https://peixotolabs.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      made by <span>peixotolabs.com</span>
    </a>
  );
}

const FORMAT_INFO = {
  knockout: {
    title: "Eliminatória",
    sub: "Torneio de morte súbita.",
    paragraphs: [
      "Cada equipa joga uma vez em cada ronda. Quem perde está fora do torneio. O vencedor avança para a próxima ronda até sobrar apenas um — o campeão.",
      "Se o número de equipas não for potência de 2 (4, 8, 16, 32), algumas equipas recebem \"byes\" — passam directamente à ronda seguinte sem jogar. Distribuição automática.",
      "Rondas típicas: Oitavos → Quartos → Meias-Finais → Final. Com 16 equipas são 4 rondas, com 32 são 5.",
      "Vantagens: torneio curto e intenso, vencedor claro. Desvantagens: equipas eliminadas cedo jogam pouco — um dia mau = fim do torneio.",
    ],
  },
  league: {
    title: "Liga (round-robin)",
    sub: "Todos jogam contra todos.",
    paragraphs: [
      "Cada equipa joga contra todas as outras exactamente uma vez. Os jogos organizam-se em \"jornadas\" — em cada jornada, metade das equipas joga em simultâneo.",
      "Número total de jogos = N × (N − 1) / 2. Com 10 equipas são 45 jogos em 9 jornadas; com 20 equipas são 190 jogos em 19 jornadas.",
      "Vencedor: a equipa com mais pontos de torneio no fim. Desempate configurável — pedras totais, diferença de pedras, ou confronto directo.",
      "Vantagens: mais justo, todas as equipas jogam o mesmo número de jogos contra os mesmos adversários. Desvantagens: torneio longo (precisa de várias sessões), sem emoção de eliminatória.",
    ],
  },
  groups: {
    title: "Grupos + Final",
    sub: "Fase de grupos seguida de eliminatória.",
    paragraphs: [
      "As equipas dividem-se em grupos pequenos (tipicamente 4 por grupo). Dentro de cada grupo joga-se round-robin — todos contra todos.",
      "Depois da fase de grupos, as melhores equipas de cada grupo apuram-se para uma fase final eliminatória.",
      "Com 16 equipas: 4 grupos de 4 (6 jogos cada = 24 jogos de grupo) + eliminatória a 8 (7 jogos) = 31 jogos.",
      "Vantagens: equilibra tempo de jogo (todas jogam na fase de grupos) com a tensão da eliminatória. Formato comum em torneios grandes (Mundial de futebol, Champions League).",
    ],
  },
};

function useTooltipPosition(open, ref) {
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (!open || !ref.current) return;
    function updatePos() {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const MARGIN = 10;
      const maxW = window.innerWidth - MARGIN * 2;
      const width = Math.min(360, maxW);
      const iconCenter = r.left + r.width / 2;
      let left = iconCenter - width / 2;
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
      let arrowLeft = iconCenter - left;
      arrowLeft = Math.max(14, Math.min(arrowLeft, width - 14));
      const below = r.bottom + 8;
      const estHeight = 260;
      const fitsBelow = below + estHeight < window.innerHeight - MARGIN;
      const top = fitsBelow ? below : Math.max(MARGIN, r.top - estHeight - 8);
      const placement = fitsBelow ? "below" : "above";
      setPos({ top, left, width, arrowLeft, placement });
    }
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);
  return pos;
}

function InfoIcon({ title, sub, paragraphs }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const pos = useTooltipPosition(open, btnRef);

  return (
    <span
      className="info-icon-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className="info-icon"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label={`Informação: ${title || ""}`}
        aria-expanded={open}
      >
        ⓘ
      </button>
      {open && pos && (
        <div
          className={`info-tooltip info-tooltip-${pos.placement}`}
          role="tooltip"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
        >
          <span className="info-tooltip-arrow" style={{ left: pos.arrowLeft }} />
          {title && <h4>{title}</h4>}
          {sub && <em className="info-sub">{sub}</em>}
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </span>
  );
}

function FormatInfoButton({ format }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const pos = useTooltipPosition(open, btnRef);
  const info = FORMAT_INFO[format];
  if (!info) return null;
  return (
    <span
      className="format-info-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className="format-info-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label={`Informação sobre ${info.title}`}
        aria-expanded={open}
      >
        ⓘ
      </button>
      {open && pos && (
        <div
          className={`info-tooltip info-tooltip-${pos.placement}`}
          role="tooltip"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
        >
          <span className="info-tooltip-arrow" style={{ left: pos.arrowLeft }} />
          <h4>{info.title}</h4>
          <em className="info-sub">{info.sub}</em>
          {info.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </span>
  );
}

function LandingScreen({ onStart }) {
  const [tCode, setTCode] = React.useState("");
  const [aCode, setACode] = React.useState("");
  const tReady = tCode.length === 4;
  const aReady = aCode.length === 6;

  function goProjector(e) {
    e.preventDefault();
    if (!tReady) return;
    window.location.href = `/t/${tCode}`;
  }
  function goSpectator(e) {
    e.preventDefault();
    if (!tReady) return;
    window.location.href = `/s/${tCode}`;
  }
  function openAdmin(e) {
    e.preventDefault();
    if (!aReady) return;
    window.location.href = `/a/${aCode}`;
  }

  return (
    <div className="landing-wrap">
      <div className="landing-hero">
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
          Cria um novo torneio ou entra num existente com o código.
        </p>
      </div>

      <div className="landing-actions">
        <button className="primary big landing-start" onClick={onStart}>
          Começar novo torneio →
        </button>

        <div className="landing-cards">
          <form className="landing-card" onSubmit={goProjector}>
            <h3>Código do torneio</h3>
            <p className="hint">Mesmo código abre projetor ou vista de telemóvel.</p>
            <input
              className="code-input code-input-4"
              placeholder="ABCD"
              value={tCode}
              onChange={e => setTCode(sanitizeCode(e.target.value, 4))}
              autoComplete="off"
              spellCheck={false}
              maxLength={4}
              aria-label="Código do torneio (4 letras)"
            />
            <div className="landing-card-actions">
              <button type="submit" className="primary" disabled={!tReady}>
                Projetor
              </button>
              <button type="button" className="ghost" disabled={!tReady} onClick={goSpectator}>
                No telemóvel
              </button>
            </div>
          </form>

          <form className="landing-card" onSubmit={openAdmin}>
            <h3>Código de admin</h3>
            <p className="hint">Controla o torneio a partir do telemóvel.</p>
            <input
              className="code-input code-input-6"
              placeholder="ABCDEF"
              value={aCode}
              onChange={e => setACode(sanitizeCode(e.target.value, 6))}
              autoComplete="off"
              spellCheck={false}
              maxLength={6}
              aria-label="Código de admin (6 letras)"
            />
            <div className="landing-card-actions">
              <button type="submit" className="primary" disabled={!aReady}>
                Abrir painel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CodeCard({ label, code, hint, links }) {
  const [copied, setCopied] = React.useState(false);
  const [qrFor, setQrFor] = React.useState(null);
  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, () => {});
  }
  const qrLink = links.find(l => l.href === qrFor);
  const qrUrl = qrLink ? `${window.location.origin}${qrLink.href}` : null;
  const qrSvg = React.useMemo(() => qrUrl && window.buildQrSvg ? window.buildQrSvg(qrUrl) : "", [qrUrl]);
  return (
    <div className="code-card">
      <div className="code-card-label">{label}</div>
      <div className="code-card-value">{code}</div>
      {hint && <div className="code-card-hint">{hint}</div>}
      <div className="code-card-links">
        {links.map(l => (
          <div key={l.href} className="code-card-link-row">
            <a className="ghost" href={l.href} target="_blank" rel="noopener">{l.label}</a>
            <button
              className={`ghost qr-toggle ${qrFor === l.href ? "on" : ""}`}
              onClick={() => setQrFor(qrFor === l.href ? null : l.href)}
              title={`QR: ${l.label}`}
              aria-label={`QR code para ${l.label}`}
            >
              {qrFor === l.href ? "Esconder QR" : "QR"}
            </button>
          </div>
        ))}
      </div>
      <div className="code-card-actions">
        <button className="ghost" onClick={copy}>{copied ? "Copiado!" : "Copiar código"}</button>
      </div>
      {qrLink && qrSvg && (
        <div className="code-card-qr">
          <div className="code-card-qr-svg" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="code-card-qr-label">{qrLink.label}</div>
          <div className="code-card-qr-url">{qrUrl}</div>
        </div>
      )}
    </div>
  );
}

function CodesScreen({ code, adminCode, tournamentName }) {
  return (
    <div className="codes-screen">
      <div className="codes-header">
        <div className="eyebrow">Torneio criado</div>
        <h1 className="display">{tournamentName || "Torneio de Sueca"}</h1>
        <p className="lead">
          Guarda estes códigos. O código do <b>torneio</b> abre o projetor e
          a vista de espectador; o código de <b>admin</b> dá-te controlo total
          a partir do telemóvel.
        </p>
      </div>

      <div className="codes-grid">
        <CodeCard
          label="Código do Torneio"
          code={code}
          hint="Partilha com quem vai ver"
          links={[
            { href: `/t/${code}`, label: "Abrir projetor" },
            { href: `/s/${code}`, label: "Abrir no telemóvel" },
          ]}
        />
        <CodeCard
          label="Código de Admin"
          code={adminCode}
          hint="Guarda em privado — controla tudo"
          links={[
            { href: `/a/${adminCode}`, label: "Abrir painel" },
          ]}
        />
      </div>

      <div className="codes-actions">
        <button
          className="primary big"
          onClick={() => { window.location.href = `/a/${adminCode}`; }}
        >
          Ir para painel de admin →
        </button>
      </div>
    </div>
  );
}

function SetupScreen({ state, setState, onStart, onCreated }) {
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

  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  async function start() {
    if (creating) return;
    const filled = teams.filter(t => t.name.trim() !== "");
    if (filled.length < 2) { alert("Precisas de pelo menos 2 equipas."); return; }
    const next = window.SuecaEngine.clone(state);
    next.setup = { name, edition, format, teamCount: filled.length, pointsToWin, pointsPerWin, tiebreaker, slideSeconds, liveScore, groupsOf, sponsors };
    next.teams = filled.map(t => window.SuecaEngine.makeTeam(t.name, t.p1, t.p2));
    next.matches = []; next.rounds = []; next.history = [];
    next.tournamentId = null;
    const started = window.SuecaEngine.startTournament(next);
    setCreating(true);
    setCreateError(null);
    try {
      const remote = await window.SuecaEngine.createRemote(started);
      started.tournamentId = remote.id;
      started.code = remote.code;
      started.adminCode = remote.adminCode;
      setState(started);
      window.SuecaEngine.saveState(started);
      if (onCreated) onCreated({ code: remote.code, adminCode: remote.adminCode, tournamentName: name });
      else if (onStart) onStart();
    } catch (e) {
      setCreateError(e?.message || "Não foi possível criar o torneio.");
      setCreating(false);
    }
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
            <div className="seg seg-with-info">
              {[
                ["knockout","Eliminatória"],
                ["league","Liga"],
                ["groups","Grupos + Final"],
              ].map(([v,l]) => (
                <div key={v} className="seg-item">
                  <button
                    className={format===v?"on":""}
                    onClick={()=>setFormat(v)}>
                    {l}
                  </button>
                  <FormatInfoButton format={v} />
                </div>
              ))}
            </div>
            <div className="row">
              <label>Nº equipas
                <input type="number" min="2" max="32" value={teamCount}
                       onChange={e=>setTeamCount(Math.max(2, +e.target.value||2))}/>
              </label>
              <label>
                <span className="label-text">
                  Máx. de pontos por jogo
                  <InfoIcon
                    title="Pontos por jogo"
                    sub="Quantas pedras bastam para fechar um jogo"
                    paragraphs={[
                      "Na Sueca tradicional um jogo termina quando uma equipa atinge 10 ou 12 pedras (o total depende das regras locais).",
                      "Aqui limita-se ao máximo configurado — se quiseres jogos mais curtos (ex.: quartos-de-final mais rápidos), baixa este valor.",
                      "Este número define apenas o limite do jogo. Os pontos que contam para o ranking são configurados à parte (ver \"Pontos de torneio por vitória\").",
                    ]}
                  />
                </span>
                <input type="number" min="1" max="12" value={pointsToWin}
                       onChange={e=>setPointsToWin(Math.min(12, Math.max(1, +e.target.value || 12)))}/>
              </label>
              <label>
                <span className="label-text">
                  Pontos de torneio por vitória
                  <InfoIcon
                    title="Pontos de torneio"
                    sub="Pontos de ranking, não pedras"
                    paragraphs={[
                      "Estes não são pedras — são pontos de ranking. Em cada vitória, a equipa vencedora ganha este valor no ranking geral; a perdedora recebe 0.",
                      "Default 3 segue o padrão \"futebol\" (3 pontos por vitória, 0 por derrota).",
                      "Se todas as equipas tiverem pontos iguais, o desempate decide a posição final (ver \"Desempate\").",
                    ]}
                  />
                </span>
                <input type="number" min="1" max="10" value={pointsPerWin}
                       onChange={e=>setPointsPerWin(+e.target.value||3)}/>
              </label>
              {format === "groups" && (
                <label>
                  <span className="label-text">
                    Equipas / grupo
                    <InfoIcon
                      title="Equipas por grupo"
                      sub="Tamanho de cada grupo"
                      paragraphs={[
                        "Tamanho alvo de cada grupo. As equipas são distribuídas em estilo \"snake\" para balancear entre grupos.",
                        "Com 16 equipas e grupos de 4 → 4 grupos de 4.",
                        "Se o número não dividir certo, os últimos grupos ficam menores (ex.: 14 equipas, grupos de 4 → 3 grupos com 4 equipas + 1 grupo com 2).",
                        "Dentro de cada grupo joga-se round-robin (todos contra todos).",
                      ]}
                    />
                  </span>
                  <input type="number" min="3" max="6" value={groupsOf}
                         onChange={e=>setGroupsOf(+e.target.value||4)}/>
                </label>
              )}
            </div>
            <label>
              <span className="label-text">
                Desempate
                <InfoIcon
                  title="Critério de desempate"
                  sub="Como separar equipas com pontos iguais"
                  paragraphs={[
                    "Quando duas ou mais equipas empatam em pontos de torneio, qual critério decide a ordem?",
                    "Pontos totais: soma das pedras ganhas em todos os jogos. Simples — quem marcou mais fica à frente.",
                    "Diferença de pontos: pedras ganhas menos pedras sofridas. Recompensa vitórias folgadas e penaliza derrotas pesadas.",
                    "Confronto directo: vê o resultado do jogo entre as duas equipas empatadas. Se não jogaram ou também empataram, cai para diferença de pedras.",
                  ]}
                />
              </span>
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
              <span className="label-text">
                Marcar pontos/vazas ao vivo durante o jogo
                <InfoIcon
                  title="Pontuação ao vivo"
                  sub="Projetor acompanha o jogo vaza a vaza"
                  paragraphs={[
                    "Se ligado, durante cada jogo o admin pode incrementar +1 a cada vaza/pedra no painel de controlo. O público vê o score crescer em tempo real no projetor.",
                    "Se desligado, introduz-se apenas o resultado final do jogo quando termina. Mais rápido mas menos interactivo — o projetor só mostra marcador após fechares o jogo.",
                    "Recomendado ligar em eventos com público a ver; desligar em torneios puramente internos onde queres avançar rápido.",
                  ]}
                />
              </span>
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
            <button className="primary big" onClick={start} disabled={creating}>
              {creating ? "A criar…" : "Começar torneio →"}
            </button>
            <button className="ghost" onClick={()=>{
              if (confirm("Apagar tudo e recomeçar?")) {
                const fresh = window.SuecaEngine.resetState();
                setState(fresh);
              }
            }}>Limpar</button>
          </div>
          {createError && <div className="setup-error">{createError}</div>}
        </div>
      </div>
    </div>
  );
}

function computeViewKeys(state) {
  const list = [];
  const hasActive = state.matches.some(m => m.status === "pending" || m.status === "live");
  const allDone = state.matches.length > 0 && !hasActive;
  list.push(allDone ? { key: "finale", label: "Campeões" } : { key: "now", label: "Em Jogo" });
  if (state.format === "knockout" || state.format === "groups") {
    list.push({ key: "bracket", label: state.format === "groups" ? "Grupos" : "Bracket" });
  } else if (state.format === "league") {
    list.push({ key: "schedule", label: "Jornadas" });
  }
  list.push({ key: "rank", label: "Ranking" });
  list.push({ key: "upc", label: "Próx/Hist" });
  if (state.code) list.push({ key: "qr", label: "QR" });
  if (state.setup.sponsors && state.setup.sponsors.length > 0) {
    list.push({ key: "sponsors", label: "Patrocinadores" });
  }
  return list;
}

function AdminRemote({ state, update }) {
  const views = computeViewKeys(state);
  const remote = state.remote || { viewKey: null, paused: false, seq: 0 };
  const current = remote.viewKey || views[0]?.key;
  const currentIdx = Math.max(0, views.findIndex(v => v.key === current));

  function pickView(key) { update(s => window.SuecaEngine.remoteSetView(s, key), { immediate: true }); }
  function togglePause() { update(s => window.SuecaEngine.remoteSetPaused(s, !(s.remote?.paused)), { immediate: true }); }
  function step(delta) {
    const next = views[(currentIdx + delta + views.length) % views.length];
    if (next) pickView(next.key);
  }

  return (
    <div className="admin-remote">
      <div className="remote-status">
        <span className="eyebrow">A mostrar no projetor</span>
        <b>{views[currentIdx]?.label || "—"}</b>
        <span className={`remote-dot ${remote.paused ? "paused" : "live"}`}>
          {remote.paused ? "Pausado" : "A rodar"}
        </span>
      </div>
      <div className="remote-playback">
        <button className="ghost big" onClick={() => step(-1)} title="Vista anterior">←</button>
        <button className="primary big" onClick={togglePause}>
          {remote.paused ? "▶ Retomar" : "⏸ Pausar"}
        </button>
        <button className="ghost big" onClick={() => step(+1)} title="Próxima vista">→</button>
      </div>
      <div className="remote-views">
        {views.map(v => (
          <button
            key={v.key}
            className={`remote-view ${v.key === current ? "on" : ""}`}
            onClick={() => pickView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="hint">Comandos chegam ao projetor em 1-3 segundos.</p>
    </div>
  );
}

// ---------------- Admin Panel ----------------
function AdminPanel({ state, setState, open, setOpen, fullPage }) {
  const [tab, setTab] = React.useState("live");

  function update(mutator, opts = {}) {
    setState(prev => {
      const next = window.SuecaEngine.clone(prev);
      mutator(next);
      window.SuecaEngine.saveState(next);
      if (opts.immediate) window.SuecaEngine.flushRemoteSync(next);
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

  if (!fullPage && !open) return (
    <button className="admin-toggle" onClick={()=>setOpen(true)} title="Painel de administração">
      ⚙
    </button>
  );

  const peekProjector = state.code ? `/t/${state.code}` : null;
  const peekSpectator = state.code ? `/s/${state.code}` : null;

  const body = (
    <div className={`admin-panel ${fullPage ? "admin-panel-full" : ""}`}>
      <div className="admin-head">
        <h2>{fullPage ? "Painel de controlo" : "Admin"}</h2>
        <div className="admin-head-actions">
          {peekProjector && (
            <a className="ghost peek" href={peekProjector} target="_blank" rel="noopener" title="Ver projetor">
              👁 Projetor
            </a>
          )}
          {peekSpectator && (
            <a className="ghost peek" href={peekSpectator} target="_blank" rel="noopener" title="Ver vista de espectador">
              👁 Espectador
            </a>
          )}
          {!fullPage && (
            <button className="ghost" onClick={()=>setOpen(false)}>Fechar ✕</button>
          )}
        </div>
      </div>
      <div className="admin-tabs">
        {[["live","Jogos atuais"],["remote","Projetor"],["matches","Jogos"],["teams","Equipas"],["sponsors","Patrocinadores"],["data","Dados"]].map(([k,l]) => (
          <button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="admin-body">
        {tab === "live" && <AdminLive state={state} update={update} />}
        {tab === "remote" && <AdminRemote state={state} update={update} />}
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
              {state.code && (
                <div className="tournament-url">
                  <div className="tu-label">Código do torneio (projetor)</div>
                  <div className="tu-row">
                    <input readOnly value={`${window.SuecaEngine.getPublicBase()}/t/${state.code}`} onFocus={e=>e.target.select()} />
                    <button className="ghost" onClick={()=>{
                      const url = `${window.SuecaEngine.getPublicBase()}/t/${state.code}`;
                      navigator.clipboard?.writeText(url).then(()=>{}, ()=>{});
                    }}>Copiar</button>
                    <a className="ghost" href={`/t/${state.code}`} target="_blank" rel="noopener">Abrir</a>
                  </div>
                  <div className="tu-code">Código: <b>{state.code}</b></div>
                </div>
              )}
              {state.adminCode && (
                <div className="tournament-url">
                  <div className="tu-label">Código de admin (privado)</div>
                  <div className="tu-row">
                    <input readOnly value={`${window.SuecaEngine.getPublicBase()}/a/${state.adminCode}`} onFocus={e=>e.target.select()} />
                    <button className="ghost" onClick={()=>{
                      const url = `${window.SuecaEngine.getPublicBase()}/a/${state.adminCode}`;
                      navigator.clipboard?.writeText(url).then(()=>{}, ()=>{});
                    }}>Copiar</button>
                  </div>
                  <div className="tu-code">Código: <b>{state.adminCode}</b></div>
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
  );

  if (fullPage) return body;
  return (
    <>
      <div className="admin-backdrop" onClick={()=>setOpen(false)} />
      {body}
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
    update(s => {
      window.SuecaEngine.finishMatch(s, matchId, winnerId);
      if (!s.remote?.paused) window.SuecaEngine.remoteSetView(s, "now");
    }, { immediate: true });
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

Object.assign(window, { SetupScreen, AdminPanel, SponsorsEditor, LandingScreen, CodesScreen, MadeByFooter });
