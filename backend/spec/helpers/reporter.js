const Jasmine = require('jasmine');
const { JUnitXmlReporter } = require('jasmine-reporters');

const jasmine = new Jasmine();
jasmine.loadConfigFile('spec/support/jasmine.json');

const junitReporter = new JUnitXmlReporter({
  savePath: './',
  consolidateAll: true,
  filePrefix: 'junit-report'
});

jasmine.addReporter(junitReporter);

// Add default console reporter and handle completion
jasmine.env.addReporter({
  jasmineDone: function(result) {
    if(result.overallStatus === 'passed') {
      console.log('All specs have passed');
      process.exit(0);
    } else {
      console.log('At least one spec has failed');
      process.exit(1);
    }
  }
});

jasmine.execute();

