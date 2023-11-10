// require modules
const fs = require('fs');
const archiver = require('archiver');

// create a file to stream archive data to.
const output = fs.createWriteStream(__dirname + '/cookies-extension.zip');
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on('end', function() {
    console.log('Data has been drained');
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        // log warning
        console.error(err);
    } else {
        // throw error
        throw err;
    }
});

// good practice to catch this error explicitly
archive.on('error', function(err) {
    throw err;
});

// pipe archive data to the file
archive.pipe(output);

// add files
archive.directory('dist/', 'dist');
archive.directory('docs/', 'docs');

const imagesToAdd = ['icon16', 'icon32', 'icon48', 'icon128'];
for (const imageName of imagesToAdd) {
    const finalName = `images/${imageName}.png`;
    archive.file(finalName, { name: finalName });
}

const rootFiles = ['devtools.html', 'index.js', 'manifest.json', 'panel.html', 'PRIVACY.MD', 'README.MD', 'CHANGELOG.MD'];
for (const fileName of rootFiles) {
    archive.file(fileName, { name: fileName });
}

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();