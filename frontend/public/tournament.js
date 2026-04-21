// ============================================================
// SUECA TOURNAMENT ENGINE
// Handles: knockout brackets, round-robin league, groups+knockout
// Persists to localStorage. Pure JS (no React).
// ============================================================

const STORAGE_KEY = "sueca_tournament_v1";

// -------- Defaults --------
const DEFAULT_STATE = {
  setup: {
    name: "Torneio de Sueca · S. Cibrão",
    edition: "Edição 2026",
    format: "knockout", // knockout | league | groups
    teamCount: 8,
    pointsToWin: 10, // pedras para ganhar um jogo
    liveScore: true, // marcar vazas/pedras a vivo
    groupsOf: 4, // para format=groups
    qrUrl: "",
  },
  teams: [],        // [{id, name, p1, p2, wins, losses, pedras, points}]
  matches: [],      // [{id, round, bracketSlot, teamA, teamB, scoreA, scoreB, status, winner, startedAt, finishedAt, mvp}]
  history: [],      // finished matches, most recent first
  rounds: [],       // [{name, matchIds}]
  format: null,     // the format being run, for safety
  currentMatchId: null,
  createdAt: null,
  mvpVotes: {},     // {playerName: count}
};

// -------- Storage --------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...clone(DEFAULT_STATE), ...parsed };
  } catch (e) {
    console.warn("loadState failed", e);
    return clone(DEFAULT_STATE);
  }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
}
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return clone(DEFAULT_STATE);
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

// -------- ID --------
let _uid = 1;
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${(_uid++).toString(36)}`;
}

// -------- Team helpers --------
function makeTeam(name = "", p1 = "", p2 = "") {
  return {
    id: uid("t"),
    name: name || "Equipa",
    p1, p2,
    wins: 0, losses: 0,
    pedras: 0, // total pedras won
    points: 0, // tournament points
    eliminated: false,
  };
}

// -------- Bracket (single elimination) --------
// Creates a bracket with power-of-2 rounded up; byes auto-advance.
function buildKnockout(state) {
  const teams = [...state.teams];
  if (teams.length < 2) return { matches: [], rounds: [] };
  // shuffle seed (deterministic-ish)
  // We DO NOT reshuffle if matches already exist.
  const size = nextPow2(teams.length);
  const byes = size - teams.length;
  const padded = [...teams];
  for (let i = 0; i < byes; i++) padded.push(null); // BYE
  // interleave so byes distribute: top-seed vs bye pattern (simple: put byes every other)
  const seeded = seedBracket(padded);

  const matches = [];
  const rounds = [];
  const totalRounds = Math.log2(size);

  // Round 1
  const r1 = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const a = seeded[i], b = seeded[i+1];
    const m = {
      id: uid("m"),
      round: 1,
      bracketSlot: i/2,
      teamA: a?.id || null,
      teamB: b?.id || null,
      scoreA: 0, scoreB: 0,
      status: (a && b) ? "pending" : "bye",
      winner: (!a && b) ? b.id : (a && !b ? a.id : null),
      startedAt: null, finishedAt: null,
      mvp: null,
    };
    matches.push(m);
    r1.push(m.id);
  }
  rounds.push({ name: roundName(1, totalRounds), matchIds: r1 });

  // Subsequent rounds (empty placeholders, filled as winners advance)
  let prev = r1;
  for (let r = 2; r <= totalRounds; r++) {
    const thisRound = [];
    for (let i = 0; i < prev.length; i += 2) {
      const m = {
        id: uid("m"),
        round: r,
        bracketSlot: i/2,
        teamA: null, teamB: null,
        scoreA: 0, scoreB: 0,
        status: "locked",
        winner: null,
        startedAt: null, finishedAt: null,
        mvp: null,
        feedFromA: prev[i],
        feedFromB: prev[i+1],
      };
      matches.push(m);
      thisRound.push(m.id);
    }
    rounds.push({ name: roundName(r, totalRounds), matchIds: thisRound });
    prev = thisRound;
  }

  return { matches, rounds };
}

function nextPow2(n){ let p = 1; while (p < n) p *= 2; return p; }

function seedBracket(teams) {
  // Simple seed: fold so that seed1 plays lowest, etc. Teams already in input order.
  // We'll just return as-is for now; setup screen lets you reorder.
  return teams;
}

function roundName(r, total) {
  const fromEnd = total - r;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Meia-Final";
  if (fromEnd === 2) return "Quartos";
  if (fromEnd === 3) return "Oitavos";
  return `Ronda ${r}`;
}

// -------- League (round robin) --------
function buildLeague(state) {
  const teams = [...state.teams];
  if (teams.length < 2) return { matches: [], rounds: [] };
  // Circle method
  const list = [...teams];
  if (list.length % 2 === 1) list.push({ id: null, _bye: true });
  const n = list.length;
  const roundsCount = n - 1;
  const half = n / 2;
  const fixed = list[0];
  let rotating = list.slice(1);

  const matches = [];
  const rounds = [];
  for (let r = 0; r < roundsCount; r++) {
    const arrangement = [fixed, ...rotating];
    const ids = [];
    for (let i = 0; i < half; i++) {
      const a = arrangement[i];
      const b = arrangement[n - 1 - i];
      if (a.id && b.id) {
        const m = {
          id: uid("m"),
          round: r + 1,
          teamA: a.id, teamB: b.id,
          scoreA: 0, scoreB: 0,
          status: "pending", winner: null,
          startedAt: null, finishedAt: null, mvp: null,
        };
        matches.push(m);
        ids.push(m.id);
      }
    }
    rounds.push({ name: `Jornada ${r+1}`, matchIds: ids });
    // rotate
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }
  return { matches, rounds };
}

// -------- Groups + Knockout (simple: groups of N, top 2 advance) --------
function buildGroups(state) {
  const teams = [...state.teams];
  const size = Math.max(2, state.setup.groupsOf || 4);
  const groupCount = Math.ceil(teams.length / size);
  // Distribute snake-style
  const groups = Array.from({length: groupCount}, () => []);
  teams.forEach((t, i) => { groups[i % groupCount].push(t); });

  const matches = [];
  const rounds = [];
  groups.forEach((g, gi) => {
    const ids = [];
    for (let i = 0; i < g.length; i++) {
      for (let j = i+1; j < g.length; j++) {
        const m = {
          id: uid("m"),
          round: 1, group: gi,
          teamA: g[i].id, teamB: g[j].id,
          scoreA: 0, scoreB: 0,
          status: "pending", winner: null,
          startedAt: null, finishedAt: null, mvp: null,
        };
        matches.push(m);
        ids.push(m.id);
      }
    }
    rounds.push({ name: `Grupo ${String.fromCharCode(65+gi)}`, matchIds: ids, group: gi });
  });
  return { matches, rounds, groups: groups.map(g => g.map(t => t.id)) };
}

// -------- Start tournament --------
function startTournament(state) {
  let built;
  if (state.setup.format === "knockout") built = buildKnockout(state);
  else if (state.setup.format === "league") built = buildLeague(state);
  else built = buildGroups(state);

  state.matches = built.matches;
  state.rounds = built.rounds;
  state.groups = built.groups || null;
  state.format = state.setup.format;
  state.createdAt = Date.now();
  // set first match
  const first = state.matches.find(m => m.status === "pending");
  state.currentMatchId = first ? first.id : null;
  return state;
}

// -------- Match operations --------
function getMatch(state, id) { return state.matches.find(m => m.id === id); }
function getTeam(state, id) { return state.teams.find(t => t.id === id); }

function setMatchScore(state, matchId, scoreA, scoreB) {
  const m = getMatch(state, matchId);
  if (!m) return;
  m.scoreA = scoreA;
  m.scoreB = scoreB;
  if (!m.startedAt) m.startedAt = Date.now();
  m.status = "live";
}

function finishMatch(state, matchId, winnerId, mvp) {
  const m = getMatch(state, matchId);
  if (!m) return;
  m.winner = winnerId;
  m.status = "done";
  m.finishedAt = Date.now();
  if (mvp) m.mvp = mvp;

  const a = getTeam(state, m.teamA);
  const b = getTeam(state, m.teamB);
  if (a && b) {
    if (winnerId === a.id) { a.wins++; b.losses++; a.points += 3; }
    else { b.wins++; a.losses++; b.points += 3; }
    a.pedras += m.scoreA;
    b.pedras += m.scoreB;
  }
  // knockout: advance winner
  if (state.format === "knockout") {
    const next = state.matches.find(n => n.feedFromA === m.id || n.feedFromB === m.id);
    if (next) {
      if (next.feedFromA === m.id) next.teamA = winnerId;
      if (next.feedFromB === m.id) next.teamB = winnerId;
      if (next.teamA && next.teamB) next.status = "pending";
      // if next has a bye (shouldn't, but safe)
    }
    // mark loser eliminated
    const loserId = winnerId === m.teamA ? m.teamB : m.teamA;
    const loser = getTeam(state, loserId);
    if (loser) loser.eliminated = true;
  }

  // MVP votes
  if (mvp) state.mvpVotes[mvp] = (state.mvpVotes[mvp] || 0) + 1;

  // history
  state.history.unshift({
    id: m.id,
    at: m.finishedAt,
    round: m.round,
    teamAName: a?.name, teamBName: b?.name,
    scoreA: m.scoreA, scoreB: m.scoreB,
    winnerName: winnerId === a?.id ? a?.name : b?.name,
    mvp: m.mvp,
  });

  // handle any BYE downstream auto-advances (knockout)
  if (state.format === "knockout") {
    state.matches.forEach(n => {
      if (n.status === "bye" && n.winner && !n.finishedAt) {
        n.finishedAt = Date.now();
        const feed = state.matches.find(x => x.feedFromA === n.id || x.feedFromB === n.id);
        if (feed) {
          if (feed.feedFromA === n.id) feed.teamA = n.winner;
          if (feed.feedFromB === n.id) feed.teamB = n.winner;
          if (feed.teamA && feed.teamB) feed.status = "pending";
        }
      }
    });
  }

  // pick next match for projection
  const next = state.matches.find(x => x.status === "pending");
  state.currentMatchId = next ? next.id : null;
  return state;
}

// -------- Standings --------
function standings(state) {
  return [...state.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pedras - a.pedras;
  });
}

function groupStandings(state, groupIdx) {
  if (!state.groups) return [];
  const ids = state.groups[groupIdx] || [];
  return ids.map(id => getTeam(state, id)).filter(Boolean).sort((a,b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pedras - a.pedras;
  });
}

function mvpLeaderboard(state) {
  return Object.entries(state.mvpVotes)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function nextMatches(state, limit = 3) {
  return state.matches.filter(m => m.status === "pending" || m.status === "live").slice(0, limit);
}

function currentMatch(state) {
  const live = state.matches.find(m => m.status === "live");
  if (live) return live;
  return state.matches.find(m => m.id === state.currentMatchId) ||
         state.matches.find(m => m.status === "pending");
}

function liveMatches(state) {
  return state.matches.filter(m => m.status === "live");
}

// Export to global
Object.assign(window, {
  SuecaEngine: {
    loadState, saveState, resetState, clone,
    makeTeam, startTournament,
    getMatch, getTeam,
    setMatchScore, finishMatch,
    standings, groupStandings, mvpLeaderboard,
    nextMatches, currentMatch, liveMatches,
    roundName, uid,
  }
});
