function parseCommandText(text = '') {
  const [command, ...rest] = text.trim().split(/\s+/);
  return { command: command || '', args: rest };
}

function joinArgs(args = []) {
  return args.join(' ').trim();
}

module.exports = { parseCommandText, joinArgs };
