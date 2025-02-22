import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Container, Database } from "@azure/cosmos";
import { getClients } from "../../services/clients";

// Interface for submission document
interface SubmissionDocument {
    id: string;
    studentId: string;
    worksheetId: string;
    dateSubmitted: string;
    score: number;
    answers: Array<{ isCorrect: boolean }>;
}


// Interfaces
interface ExportRequest {
    teacherId: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
    format: 'json' | 'csv';
}

interface GradeReport {
    studentId: string;
    worksheetId: string;
    dateSubmitted: string;
    score: number;
    totalProblems: number;
    correctAnswers: number;
}

// Helper functions
function formatAsCSV(reports: GradeReport[]): string {
    const headers = ["Student ID", "Worksheet ID", "Date Submitted", "Score", "Total Problems", "Correct Answers"];
    const rows = reports.map(report => [
        report.studentId,
        report.worksheetId,
        report.dateSubmitted,
        report.score.toString(),
        report.totalProblems.toString(),
        report.correctAnswers.toString()
    ]);

    return [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");
}

export async function ExportGrades(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Parse request parameters
        const params = await request.json() as ExportRequest;

        if (!params.teacherId) {
            return {
                status: 400,
                body: JSON.stringify({ error: "teacherId is required" })
            };
        }

        // Get database client
        const { cosmosClient } = getClients();
        const database: Database = cosmosClient.database("math-worksheet-db");
        const container: Container = database.container("submissions");

        // Query submissions
        const querySpec = {
            query: "SELECT * FROM c WHERE c.teacherId = @teacherId",
            parameters: [{ name: "@teacherId", value: params.teacherId }]
        };
        const queryIterator = container.items.query<SubmissionDocument>(querySpec);
        const { resources: submissions } = await queryIterator.fetchAll();

        // Transform submissions into grade reports
        const reports: GradeReport[] = submissions.map(sub => ({
            studentId: sub.studentId,
            worksheetId: sub.worksheetId,
            dateSubmitted: sub.dateSubmitted,
            score: sub.score,
            totalProblems: sub.answers.length,
            correctAnswers: sub.answers.filter((a: any) => a.isCorrect).length
        }));

        // Filter by date if specified
        const filteredReports = reports.filter(report => {
            const reportDate = new Date(report.dateSubmitted);
            let include = true;

            if (params.startDate) {
                include = include && reportDate >= new Date(params.startDate);
            }
            if (params.endDate) {
                include = include && reportDate <= new Date(params.endDate);
            }

            return include;
        });

        // Format response based on requested format
        if (params.format === 'csv') {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename=grades.csv'
                },
                body: formatAsCSV(filteredReports)
            };
        }

        // Default to JSON format
        return {
            status: 200,
            jsonBody: {
                totalReports: filteredReports.length,
                reports: filteredReports
            }
        };

    } catch (error) {
        context.error('Error in ExportGrades:', error);
        return {
            status: 500,
            body: JSON.stringify({
                error: "Failed to export grades",
                details: error instanceof Error ? error.message : "Unknown error"
            })
        };
    }
}

app.http('ExportGrades', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: ExportGrades
});
