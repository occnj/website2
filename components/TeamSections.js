import LeaderGrid from '@/components/LeaderGrid';

// The team, split into the sections defined in the admin (About → Leadership
// and /leadership). Styles: app/leadership/leadership.css.

// Build the ordered list of { name, description, members } groups for the
// leadership area. Preserves each section's admin-defined order and each
// member's own sort_order within it.
export function buildTeamGroups(team, sections) {
  const members = team || [];
  if (!sections || sections.length === 0) {
    return members.length ? [{ name: null, description: null, members }] : [];
  }
  const byName = new Map();
  const groups = sections.map((s) => {
    const g = { name: s.name, description: s.description || null, members: [] };
    byName.set((s.name || '').trim().toLowerCase(), g);
    return g;
  });
  const leftovers = [];
  members.forEach((m) => {
    const key = (m.grouping || '').trim().toLowerCase();
    const g = byName.get(key);
    if (g) g.members.push(m);
    else leftovers.push(m);
  });
  if (leftovers.length) groups.push({ name: 'More of our team', description: null, members: leftovers });
  // Drop empty sections so we never render a heading with no people under it.
  return groups.filter((g) => g.members.length > 0);
}

// Big groups (the ministry leaders) get the compact six-per-row cards with a
// "Show all" button, so the page doesn't spill every bio at once, and are shown
// in a random order so the list doesn't read as a ranking.
export function isBigGroup(group) {
  return group.members.length > 8 || /ministry leaders/i.test(group.name || '');
}

// Fisher–Yates shuffle (a copy). The pages render on every request, so each
// visitor gets a new order and no ministry leader always comes first.
function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TeamSections({ groups }) {
  return groups.map((group, gi) => (
    <div className="leader-section" key={group.name || gi}>
      {group.name && (
        <div className="leader-section-head">
          <h3 className="leader-section-title">{group.name}</h3>
          {group.description ? <p className="leader-section-desc">{group.description}</p> : null}
        </div>
      )}
      {isBigGroup(group)
        ? <LeaderGrid members={shuffled(group.members)} compact />
        : <LeaderGrid members={group.members} />}
    </div>
  ));
}
