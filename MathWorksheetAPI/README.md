# Math Worksheet API

Azure Functions-based API for generating, processing, and grading math worksheets with QR code tracking.

## Features

- Generate math worksheets with QR codes
- Process submitted worksheet images using Azure Form Recognizer
- Grade submissions automatically
- Export grades in multiple formats (JSON, CSV)
- Support for multiple math operations (addition, subtraction, multiplication, division)

## Prerequisites

- Node.js 18 or later
- Azure Functions Core Tools v4
- Azure Account with the following services:
  - Azure Functions
  - Azure Cosmos DB
  - Azure Form Recognizer
  - Azure Storage Account

## Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd MathWorksheetAPI
   npm install
   ```

2. Configure environment variables in `local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "<storage-connection-string>",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_ENDPOINT": "<cosmos-db-endpoint>",
       "COSMOS_KEY": "<cosmos-db-key>",
       "FORM_RECOGNIZER_ENDPOINT": "<form-recognizer-endpoint>",
       "FORM_RECOGNIZER_KEY": "<form-recognizer-key>"
     }
   }
   ```

3. Set up the database:
   ```bash
   npm run setup-db
   ```

4. Start the API locally:
   ```bash
   npm start
   ```

## Testing Locally

The project includes a test script that demonstrates the full workflow of the API. The script will:
1. Generate a worksheet with QR code
2. Save the QR code as an image
3. Submit the image for processing
4. Export grades

### Running the Tests

1. Make sure the API is running locally:
   ```bash
   npm start
   ```

2. In a new terminal, run the test script:
   ```bash
   npm test
   ```

### Test Output

The test script will:
1. Generate a worksheet and save its QR code to `dist/src/scripts/test-qr.png`
2. Use this QR code image to simulate a worksheet submission
3. Export grades for the teacher

Expected output will look like:
```
API is running. Starting tests...

1. Testing GenerateWorksheet...
Worksheet generated: { id: '...', problems: [...], qrCode: '...' }
QR code saved to: .../test-qr.png

2. Testing ProcessSubmission...
Submission processed: { id: '...', score: 100, ... }

3. Testing ExportGrades...
Grades exported: { totalReports: 1, reports: [...] }

All tests completed successfully!
```

### Manual Testing

You can also test individual endpoints using curl or Postman:

1. Generate a worksheet:
   ```bash
   curl -X POST http://localhost:7071/api/GenerateWorksheet \
     -H "Content-Type: application/json" \
     -d '{
       "teacherId": "teacher123",
       "grade": 3,
       "numberOfProblems": 5,
       "operations": ["addition", "subtraction"]
     }'
   ```

2. Process a submission:
   ```bash
   curl -X POST http://localhost:7071/api/ProcessSubmission \
     -H "Content-Type: application/json" \
     -d '{
       "studentId": "student123",
       "image": "<base64-encoded-image>"
     }'
   ```

3. Export grades:
   ```bash
   curl -X POST http://localhost:7071/api/ExportGrades \
     -H "Content-Type: application/json" \
     -d '{
       "teacherId": "teacher123",
       "format": "json"
     }'
   ```

## API Endpoints

### GenerateWorksheet

Generates a new math worksheet with QR code.

- **URL**: `/api/GenerateWorksheet`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "teacherId": "string",
    "grade": number,
    "numberOfProblems": number,
    "operations": ["addition", "subtraction", "multiplication", "division"]
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "teacherId": "string",
    "dateCreated": "string",
    "grade": number,
    "problems": [
      {
        "id": number,
        "question": "string",
        "answer": number,
        "operation": "string"
      }
    ],
    "qrCode": "string"
  }
  ```

### ProcessSubmission

Processes a submitted worksheet image.

- **URL**: `/api/ProcessSubmission`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "studentId": "string",
    "image": "string" // base64 encoded image
  }
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "score": number,
    "correctAnswers": number,
    "totalProblems": number,
    "answers": [
      {
        "problemId": number,
        "submittedAnswer": number,
        "isCorrect": boolean
      }
    ]
  }
  ```

### ExportGrades

Exports grades for a teacher's worksheets.

- **URL**: `/api/ExportGrades`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "teacherId": "string",
    "classId": "string", // optional
    "startDate": "string", // optional
    "endDate": "string", // optional
    "format": "json" | "csv"
  }
  ```
- **Response**: JSON or CSV file containing grade reports

## Development

- Build the project:
  ```bash
  npm run build
  ```

- Watch for changes:
  ```bash
  npm run watch
  ```

- Clean build artifacts:
  ```bash
  npm run clean
  ```

## Database Schema

### Worksheets Container
- Partition Key: `/teacherId`
- Properties:
  - id
  - teacherId
  - dateCreated
  - grade
  - problems
  - qrCode

### Submissions Container
- Partition Key: `/worksheetId`
- Properties:
  - id
  - worksheetId
  - studentId
  - dateSubmitted
  - answers
  - score
  - imageUrl

### Users Container
- Partition Key: `/role`
- Properties:
  - id
  - role
  - email
  - name

### Classes Container
- Partition Key: `/teacherId`
- Properties:
  - id
  - teacherId
  - grade
  - name
  - students

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 404: Not Found
- 500: Internal Server Error

Detailed error messages are included in the response body for debugging.

## Production Deployment

1. Create required Azure resources (Cosmos DB, Form Recognizer, Storage)
2. Configure environment variables in Azure Functions app settings
3. Deploy using Azure Functions Core Tools:
   ```bash
   func azure functionapp publish <app-name>
   ```

## Security Considerations

- All endpoints are anonymous for development; implement proper authentication in production
- Store sensitive configuration in Azure Key Vault for production
- Implement rate limiting for production use
- Add input validation and sanitization
- Use HTTPS for all communications
- Implement proper CORS policies

## Performance Optimization

- Cosmos DB containers are indexed for common queries
- Form Recognizer results are cached when possible
- Images should be optimized before upload
- Consider implementing caching for frequently accessed worksheets

## Support

For issues or questions, please contact the development team or create an issue in the repository.
