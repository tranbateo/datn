module.exports = {
  'code/backend/**/*.ts': (filenames) => {
    return `npm --prefix code/backend run lint:staged -- ${filenames.join(' ')}`;
  },
  'code/frontend/**/*.{ts,tsx}': (filenames) => {
    return `npm --prefix code/frontend run lint:staged -- ${filenames.join(' ')}`;
  }
};
