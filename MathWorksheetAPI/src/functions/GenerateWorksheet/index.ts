import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Container, Database } from "@azure/cosmos";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from 'uuid';
import { getClients } from "../../services/clients";

// Valid operation types
export type BasicOperationType = 'addition' | 'subtraction';
export type WorksheetType = BasicOperationType | 'mixed';
export type SubmissionMethod = 'web' | 'print' | 'both';

interface WorksheetDocument {
    id: string;
    teacherId: string;
    dateCreated: string;
    title: string;
    header: string;
    problems: MathProblem[];
    submissionMethod: SubmissionMethod;
    allowCalculator: boolean;
    showAnswers: boolean;
}

interface MathProblem {
    id: number;
    question: string;
    answer: number;
    operation: BasicOperationType;
    difficulty: number;
    category: string;
}

interface Worksheet extends WorksheetDocument {
    qrCode: string;
}

interface WorksheetRequest {
    type: WorksheetType;
    teacherId: string;
    numberOfProblems?: number;
}

// Helper function to generate appropriate number ranges
function getNumberRange(operation: BasicOperationType): { min: number; max: number } {
    // Numbers that sum to 18 or less
    return { min: 1, max: 18 };
}

// Main problem generation function
async function generateMathProblem(
    operation: BasicOperationType,
    index: number
): Promise<MathProblem> {
    const range = getNumberRange(operation);
    let num1: number, num2: number, answer: number;

    switch (operation) {
        case 'addition': {
            // Generate numbers that sum to 18 or less
            num1 = Math.floor(Math.random() * (range.max - 1)) + 1;
            num2 = Math.floor(Math.random() * (range.max - num1)) + 1;
            answer = num1 + num2;
            break;
        }
        case 'subtraction': {
            // Generate numbers where result is positive and both numbers <= 18
            num1 = Math.floor(Math.random() * (range.max - 1)) + 1;
            num2 = Math.floor(Math.random() * num1) + 1;
            answer = num1 - num2;
            break;
        }
        default: {
            throw new Error(`Invalid operation type: ${operation}`);
        }
    }

    const operatorMap = {
        'addition': '+',
        'subtraction': '-'
    } as const;

    // Format with right-aligned numbers and inline operator
    const num1Str = num1.toString().padStart(2, ' ');
    const num2Str = num2.toString().padStart(2, ' ');
    const formattedQuestion = `${num1Str} ${operatorMap[operation]}${num2Str}`;

    return {
        id: Math.floor(Math.random() * 1000000),
        question: formattedQuestion,
        answer,
        operation,
        difficulty: 1,
        category: 'Basic Operation'
    };
}

export async function GenerateWorksheet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Parse request body
        const body = await request.json() as WorksheetRequest;
        const { type, teacherId, numberOfProblems } = body;

        if (!teacherId || !type || !['addition', 'subtraction', 'mixed'].includes(type)) {
            return {
                status: 400,
                body: JSON.stringify({ error: "teacherId and valid type (addition, subtraction, mixed) are required" })
            };
        }

        // Generate worksheet ID and QR code for submission
        const worksheetId = uuidv4();
        const qrCodeData = await QRCode.toDataURL(worksheetId);

        // Generate requested number of problems
        const numProblems = Math.min(Math.max(10, numberOfProblems || 20), 100);
        const problems: MathProblem[] = [];
        for (let i = 0; i < numProblems; i++) {
            const operation = type === 'mixed'
                ? i % 2 === 0 ? 'addition' : 'subtraction'
                : type as BasicOperationType;
            const problem = await generateMathProblem(operation, i);
            problems.push(problem);
        }

        // Create worksheet object
        const worksheet: Worksheet = {
            id: worksheetId,
            teacherId,
            dateCreated: new Date().toISOString(),
            title: "ADDITION AND SUBTRACTION TO 18 (Form A)",
            header: "Name___________________ Grade _________________ Room _________",
            problems,
            submissionMethod: 'both',
            allowCalculator: false,
            showAnswers: true,
            qrCode: qrCodeData
        };

        // Save to database
        const { cosmosClient } = getClients();
        const database: Database = cosmosClient.database("math-worksheet-db");
        const container: Container = database.container("worksheets");
        await container.items.create(worksheet);

        // Return the worksheet data
        return {
            status: 200,
            jsonBody: worksheet
        };

    } catch (error) {
        context.error('Error in GenerateWorksheet:', error);
        return {
            status: 500,
            body: JSON.stringify({
                error: "Failed to generate worksheet",
                details: error instanceof Error ? error.message : "Unknown error"
            })
        };
    }
}

app.http('GenerateWorksheet', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: GenerateWorksheet
});
