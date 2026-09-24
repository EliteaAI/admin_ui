import {
  GENERAL_TASK_GROUPS,
  GENERAL_UNGROUPED_GROUP,
} from '@/pages/SchedulesTasksPage/components/TasksTab/helpers/taskGroups.constants';

/**
 * Groups task names by their group label and returns them in display order:
 *   1. "General - ..." functional sub-groups (order from GENERAL_TASK_GROUPS)
 *   2. "General - Ungrouped" for "General" tasks missing from the mapping
 *   3. "R-X.Y.Z" groups sorted descending by semver
 *   4. Any other groups alphabetically
 *   5. "Older" (always last)
 * Tasks within each group are sorted alphabetically. Empty groups are omitted.
 */

const parseSemver = label => {
  const m = label.match(/^R-(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};

const compareSemverDesc = (a, b) => {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] - a[i];
  }
  return 0;
};

const GENERAL_SUBGROUP_BY_TASK = GENERAL_TASK_GROUPS.reduce((acc, { group, tasks }) => {
  tasks.forEach(name => {
    acc[name] = group;
  });
  return acc;
}, {});

const GENERAL_GROUP_ORDER = [...GENERAL_TASK_GROUPS.map(({ group }) => group), GENERAL_UNGROUPED_GROUP];

export const groupTasks = (taskNames, groupsMap) => {
  const buckets = {};

  taskNames.forEach(name => {
    const backendGroup = groupsMap[name] || 'General';
    const group =
      backendGroup === 'General' ? GENERAL_SUBGROUP_BY_TASK[name] || GENERAL_UNGROUPED_GROUP : backendGroup;
    if (!buckets[group]) buckets[group] = [];
    buckets[group].push(name);
  });

  Object.values(buckets).forEach(items => items.sort((a, b) => a.localeCompare(b)));

  const releaseGroups = [];
  const otherGroups = [];

  Object.keys(buckets).forEach(g => {
    if (GENERAL_GROUP_ORDER.includes(g) || g === 'Older') return;
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

  GENERAL_GROUP_ORDER.forEach(group => {
    if (buckets[group]) result.push({ group, items: buckets[group] });
  });

  releaseGroups.forEach(({ group, items }) => result.push({ group, items }));
  otherGroups.forEach(({ group, items }) => result.push({ group, items }));

  if (buckets.Older) {
    result.push({ group: 'Older', items: buckets.Older });
  }

  return result;
};
