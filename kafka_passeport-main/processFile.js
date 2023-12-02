const fs = require('fs');
const readline = require('readline');
const path = require('path');

function processFile(inputFilePath, outputFilePath) {
    const readInterface = readline.createInterface({
        input: fs.createReadStream(inputFilePath),
        output: process.stdout,
        console: false
    });

    const outputStream = fs.createWriteStream(outputFilePath);

    readInterface.on('line', function(line) {
        if (line.trim().length > 0) { // Process only non-empty lines
            const { timestampBefore, numeroOrdre, timestampAfter } = parseLine(line);
            const timeDiffSeconds = calculateTimeDifference(timestampBefore, timestampAfter);

            const outputLine = `timeDiffSeconds: ${timeDiffSeconds.toFixed(3)}, timestampBefore: ${timestampBefore}, timestampAfter: ${timestampAfter}, numeroOrdre: ${numeroOrdre}\n`;
            outputStream.write(outputLine);
        }
    });

    readInterface.on('close', function() {
        console.log('File processing complete.');
        outputStream.close();
    });
}

function parseLine(line) {
    const regex = /timestampBefore: (.*),\s+numeroOrdre: (.*),\s+timestampAfter: (.*)/;
    const match = line.match(regex);

    if (match && match.length === 4) {
        const timestampBefore = match[1].trim();
        const numeroOrdre = match[2].trim();
        const timestampAfter = match[3].trim();

        return { timestampBefore, numeroOrdre, timestampAfter };
    }

    return null;
}

function calculateTimeDifference(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (endDate - startDate) / 1000; // Convert milliseconds to seconds
}

// Example usage
const inputFilePath = path.join(__dirname, 'inputFile.txt'); // Adjust the path to your input file
const outputFilePath = path.join(__dirname, 'outputFile.txt'); // Adjust the path to your output file

processFile(inputFilePath, outputFilePath);
