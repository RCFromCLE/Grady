import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function testAPI() {
    const baseUrl = 'http://localhost:7071/api';

    // Test GenerateWorksheet
    console.log('\n1. Testing GenerateWorksheet...');
    const worksheetResponse = await fetch(`${baseUrl}/GenerateWorksheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teacherId: 'teacher123',
            grade: 3,
            numberOfProblems: 5,
            operations: ['addition', 'subtraction']
        })
    });

    if (!worksheetResponse.ok) {
        throw new Error(`GenerateWorksheet failed: ${await worksheetResponse.text()}`);
    }

    const worksheet = await worksheetResponse.json();
    console.log('Worksheet generated:', worksheet);

    // Save QR code to file for testing
    const qrCodeData = worksheet.qrCode.split(',')[1];
    const qrCodePath = path.join(__dirname, 'test-qr.png');
    fs.writeFileSync(qrCodePath, Buffer.from(qrCodeData, 'base64'));
    console.log(`QR code saved to: ${qrCodePath}`);

    // Create a test submission image (in real usage, this would be a photo of the completed worksheet)
    // For testing, we'll use the QR code image itself
    const testImage = fs.readFileSync(qrCodePath);
    const base64Image = `data:image/png;base64,${testImage.toString('base64')}`;

    // Test ProcessSubmission
    console.log('\n2. Testing ProcessSubmission...');
    const submissionResponse = await fetch(`${baseUrl}/ProcessSubmission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: 'student123',
            image: base64Image
        })
    });

    if (!submissionResponse.ok) {
        throw new Error(`ProcessSubmission failed: ${await submissionResponse.text()}`);
    }

    const submission = await submissionResponse.json();
    console.log('Submission processed:', submission);

    // Test ExportGrades
    console.log('\n3. Testing ExportGrades...');
    const exportResponse = await fetch(`${baseUrl}/ExportGrades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teacherId: 'teacher123',
            format: 'json'
        })
    });

    if (!exportResponse.ok) {
        throw new Error(`ExportGrades failed: ${await exportResponse.text()}`);
    }

    const grades = await exportResponse.json();
    console.log('Grades exported:', grades);
}

// Run the tests if this script is executed directly
if (require.main === module) {
    // First check if the API is running
    fetch('http://localhost:7071/api/GenerateWorksheet')
        .then(() => {
            console.log('API is running. Starting tests...');
            testAPI()
                .then(() => {
                    console.log('\nAll tests completed successfully!');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('\nTest failed:', error);
                    process.exit(1);
                });
        })
        .catch(() => {
            console.error('\nError: API is not running. Please start the API first with "npm start"');
            process.exit(1);
        });
}
