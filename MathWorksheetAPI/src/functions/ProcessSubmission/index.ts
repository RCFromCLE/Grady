import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Container, Database } from "@azure/cosmos";
import jsQR from "jsqr";
import sharp from "sharp";
import { getClients } from "../../services/clients";

// Interface for worksheet document
interface WorksheetDocument {
    id: string;
    problems: Array<{ id: number; answer: number }>;
}


// Interfaces
interface Submission {
    id: string;
    worksheetId: string;
    studentId: string;
    dateSubmitted: string;
    answers: Answer[];
    score: number;
    imageUrl: string;
}

interface Answer {
    problemId: number;
    submittedAnswer: number;
    isCorrect: boolean;
}

interface SubmissionRequest {
    studentId: string;
    image: string; // base64 encoded image
}

interface Point {
    x: number;
    y: number;
}

// Helper functions
async function extractQRCode(imageData: string): Promise<string> {
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    // Process image with sharp
    const { data, info } = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Scan for QR code
    const code = jsQR(
        new Uint8ClampedArray(data),
        info.width,
        info.height
    );
    
    if (!code) {
        throw new Error("No QR code found in image");
    }
    
    return code.data;
}

function getYCoordinate(polygon: Point[]): number {
    // Get the average Y coordinate of the polygon's points
    const sum = polygon.reduce((acc, point) => acc + point.y, 0);
    return sum / polygon.length;
}

async function processHandwrittenAnswers(imageData: string): Promise<Map<number, number>> {
    const { formRecognizerClient } = getClients();

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    // Analyze the document
    const poller = await formRecognizerClient.beginAnalyzeDocument("prebuilt-document", buffer);
    const result = await poller.pollUntilDone();
    
    // Process the results to extract numbers
    const answers = new Map<number, number>();
    
    if (result.pages && result.pages.length > 0) {
        const page = result.pages[0];
        for (const line of page.lines || []) {
            const number = parseInt(line.content);
            if (!isNaN(number) && line.polygon) {
                // Convert points array to Point objects
                const polygon: Point[] = line.polygon.map(point => ({ x: point[0], y: point[1] }));
                const yPosition = getYCoordinate(polygon);
                const problemId = Math.floor(yPosition / 50); // Adjust based on layout
                answers.set(problemId, number);
            }
        }
    }
    
    return answers;
}

export async function ProcessSubmission(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Parse request body
        const body = await request.json() as SubmissionRequest;
        const { studentId, image } = body;

        if (!studentId || !image) {
            return {
                status: 400,
                body: JSON.stringify({ error: "studentId and image are required" })
            };
        }

        // Extract QR code to get worksheet ID
        const worksheetId = await extractQRCode(image);

        // Get original worksheet from database
        const { cosmosClient } = getClients();
        const database: Database = cosmosClient.database("math-worksheet-db");
        const worksheetsContainer: Container = database.container("worksheets");
        
        // Get worksheet by ID
        const { resource: worksheet } = await worksheetsContainer.item(worksheetId, worksheetId).read<WorksheetDocument>();
        
        if (!worksheet) {
            return {
                status: 404,
                body: JSON.stringify({ error: "Worksheet not found" })
            };
        }


        // Process handwritten answers
        const submittedAnswers = await processHandwrittenAnswers(image);
        
        // Grade the submission
        const answers: Answer[] = [];
        let correctAnswers = 0;
        
        worksheet.problems.forEach((problem: { id: number; answer: number }) => {
            const submittedAnswer = submittedAnswers.get(problem.id);
            const isCorrect = submittedAnswer === problem.answer;
            
            if (isCorrect) {
                correctAnswers++;
            }
            
            answers.push({
                problemId: problem.id,
                submittedAnswer: submittedAnswer || 0,
                isCorrect
            });
        });

        const score = (correctAnswers / worksheet.problems.length) * 100;

        // Create submission object
        const submission: Submission = {
            id: `${worksheetId}-${studentId}`,
            worksheetId,
            studentId,
            dateSubmitted: new Date().toISOString(),
            answers,
            score,
            imageUrl: image // In production, you'd store this in Blob storage and save the URL
        };

        // Save submission to database
        const submissionsContainer = database.container("submissions");
        await submissionsContainer.items.create(submission);

        // Return the results
        return {
            status: 200,
            jsonBody: {
                id: submission.id,
                score,
                correctAnswers,
                totalProblems: worksheet.problems.length,
                answers
            }
        };

    } catch (error) {
        context.error('Error in ProcessSubmission:', error);
        return {
            status: 500,
            body: JSON.stringify({
                error: "Failed to process submission",
                details: error instanceof Error ? error.message : "Unknown error"
            })
        };
    }
}

app.http('ProcessSubmission', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: ProcessSubmission
});
