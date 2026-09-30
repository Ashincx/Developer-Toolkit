const blank = { number: null, text: '', kind: 'blank' };

export const splitLines = (value) => value ? value.replace(/\r\n/g, '\n').split('\n') : [];

function diffArrays(before, after) {
  const table = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i][j] = before[i] === after[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const parts = [];
  const append = (value, type) => {
    const last = parts.at(-1);
    if (last && Boolean(last.added) === (type === 'added') && Boolean(last.removed) === (type === 'removed')) {
      last.value.push(value);
    } else {
      parts.push({ value: [value], ...(type === 'added' && { added: true }), ...(type === 'removed' && { removed: true }) });
    }
  };

  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      append(before[i], 'same');
      i++;
      j++;
    } else if (j < after.length && (i === before.length || table[i][j + 1] >= table[i + 1][j])) {
      append(after[j++], 'added');
    } else {
      append(before[i++], 'removed');
    }
  }
  return parts;
}

export function compareLines(before, after) {
  const parts = diffArrays(splitLines(before), splitLines(after));
  const rows = [];
  let oldNumber = 1;
  let newNumber = 1;
  let additions = 0;
  let removals = 0;
  let changes = 0;

  for (let i = 0; i < parts.length;) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      for (const text of part.value) {
        rows.push({
          left: { number: oldNumber++, text, kind: 'same' },
          right: { number: newNumber++, text, kind: 'same' },
        });
      }
      i++;
      continue;
    }

    const removed = [];
    const added = [];
    while (i < parts.length && (parts[i].added || parts[i].removed)) {
      if (parts[i].removed) removed.push(...parts[i].value);
      if (parts[i].added) added.push(...parts[i].value);
      i++;
    }

    const paired = Math.min(removed.length, added.length);
    changes += paired;
    removals += removed.length - paired;
    additions += added.length - paired;
    for (let j = 0; j < Math.max(removed.length, added.length); j++) {
      rows.push({
        left: j < removed.length
          ? { number: oldNumber++, text: removed[j], kind: j < paired ? 'change' : 'remove', other: j < paired ? added[j] : undefined }
          : blank,
        right: j < added.length
          ? { number: newNumber++, text: added[j], kind: j < paired ? 'change' : 'add', other: j < paired ? removed[j] : undefined }
          : blank,
      });
    }
  }

  return { rows, additions, removals, changes };
}

export function createPatch(before, after) {
  const diff = compareLines(before, after);
  const lines = ['--- Original', '+++ Updated'];
  for (const row of diff.rows) {
    if (row.left.kind === 'same') lines.push(` ${row.left.text}`);
    else {
      if (row.left.kind !== 'blank') lines.push(`-${row.left.text}`);
      if (row.right.kind !== 'blank') lines.push(`+${row.right.text}`);
    }
  }
  return `${lines.join('\n')}\n`;
}
