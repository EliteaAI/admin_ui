/**
 * Groups task names by their group label and returns them in display order:
 *   1. "General" (always first)
 *   2. "R-X.Y.Z" groups sorted descending by semver
 *   3. Any other groups alphabetically
 *   4. "Older" (always last)
 */

function parseSemver(label) {
  const m = label.match(/^R-(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemverDesc(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] - a[i];
  }
  return 0;
}

export function groupTasks(taskNames, groupsMap) {
  const buckets = {};

  taskNames.forEach((name) => {
    const group = groupsMap[name] || 'General';
    if (!buckets[group]) buckets[group] = [];
    buckets[group].push(name);
  });

  const releaseGroups = [];
  const otherGroups = [];

  Object.keys(buckets).forEach((g) => {
    if (g === 'General' || g === 'Older') return;
    const sv = parseSemver(g);
    if (sv) {
      releaseGroups.push({ group: g, sv, items: buckets[g] });
    } else {
      otherGroups.push({ group: g, items: buckets[g] });
    }
  });

  releaseGroups.sort((a, b) => compareSemverDesc(a.sv, b.sv));
  otherGroups.sort((a, b) => a.group.localeCompare(b.group));

  const result = [];

  if (buckets.General) {
    result.push({ group: 'General', items: buckets.General });
  }

  releaseGroups.forEach(({ group, items }) => result.push({ group, items }));
  otherGroups.forEach(({ group, items }) => result.push({ group, items }));

  if (buckets.Older) {
    result.push({ group: 'Older', items: buckets.Older });
  }

  return result;
}
