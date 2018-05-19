module.exports = {
  scripts: {
    test: {
      default: {
        script: 'nyc ava',
        description: 'Runs AVA with nyc (which is configured in package.json)',
      },
      watch: {
        description: 'Run AVA in watch mode',
        script: 'ava -w',
      },
    },
    build: {
      description: 'Transpiles es2015 in src to lib for publishing',
      script: 'babel -d lib/ src/',
    },
    lint: {
      description: 'lint the entire project',
      script: 'eslint .',
    },
    reportCoverage: {
      description: 'Report coverage stats to codecov. This should be run after the `test` script',
      script: 'nyc report -r lcovonly && codecov',
    },
    docs: {
      description: 'Checks Atomdoc to make sure it shows the most helpful information',
      script: 'atomdoc src',
    },
    validate: {
      description: 'This runs several scripts to make sure things look good before committing',
      script: 'nps lint build test',
    },
  },
  options: {
    silent: false,
  },
};
