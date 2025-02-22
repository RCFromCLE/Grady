import fetch from 'node-fetch';

async function getToken() {
    const { execSync } = require('child_process');
    const token = execSync('az account get-access-token --resource api://c1182008-420a-4418-a2c1-eaf8fea8a225 --query accessToken -o tsv').toString().trim();
    return token;
}

async function runTests() {
    const token = await getToken();
    const baseUrl = 'https://func-grady-dev.azurewebsites.net/api';
    
    // Test parameters
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    const grades = [1, 2, 3, 4, 5];
    
    console.log('Starting load test...');
    
    // Generate 10 worksheets with different combinations
    for (let i = 0; i < 10; i++) {
        const teacherId = `teacher-${Math.floor(Math.random() * 5) + 1}`;
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const selectedOps = operations.slice(0, Math.floor(Math.random() * 3) + 1);
        
        const payload = {
            teacherId,
            grade,
            numberOfProblems: Math.floor(Math.random() * 15) + 5,
            operations: selectedOps
        };
        
        try {
            console.log(`Generating worksheet for ${teacherId}, grade ${grade}`);
            const response = await fetch(`${baseUrl}/GenerateWorksheet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const worksheet = await response.json();
            console.log(`Created worksheet ${worksheet.id}`);
            
            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    console.log('Load test completed');
}

runTests().catch(console.error);
