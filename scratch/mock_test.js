// Mock script to check for runtime initialization errors in app.js on node
const fs = require('fs');
const path = require('path');

// Read app.js content
const code = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// Mocks
global.window = {};
global.document = {
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      setTimeout(cb, 0); // trigger immediately
    }
  },
  getElementById: (id) => {
    console.log(`Mock getElementById: ${id}`);
    return {
      addEventListener: (evt, callback) => {},
      classList: {
        add: () => {},
        remove: () => {}
      },
      innerHTML: '',
      innerText: '',
      style: {}
    };
  },
  querySelector: (sel) => {
    console.log(`Mock querySelector: ${sel}`);
    if (sel === '.progress-ring__circle') {
      return {
        r: {
          baseVal: {
            value: 130
          }
        },
        style: {}
      };
    }
    return { style: {} };
  },
  querySelectorAll: (sel) => {
    console.log(`Mock querySelectorAll: ${sel}`);
    return [];
  }
};

// Catch exceptions
try {
  console.log("Starting mock evaluation...");
  // Evaluate the app.js code inside this context
  eval(code);
  console.log("Evaluation finished without immediate errors!");
} catch (e) {
  console.error("CRITICAL RUNTIME ERROR:");
  console.error(e);
  process.exit(1);
}
