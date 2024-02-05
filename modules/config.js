"use strict";
require('dotenv').config({ override: true });
process.on('warning', (warning) => {
    console.warn('warning', warning.name); // Print the warning name
    console.warn('warning', warning.message); // Print the warning message
    console.warn('warning', warning.stack); // Print the stack trace
  });
  
  process.stdout.on('error', function (err) {
    if (err.code == "EPIPE") {
      console.log('EPIPE err:', err);
    }
  });
  