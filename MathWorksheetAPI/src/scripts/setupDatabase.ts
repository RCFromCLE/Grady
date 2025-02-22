import { CosmosClient, Database, Container, IndexingPolicy } from "@azure/cosmos";

async function setupDatabase() {
    try {
        // Get configuration from environment variables
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;

        if (!endpoint || !key) {
            throw new Error("COSMOS_ENDPOINT and COSMOS_KEY environment variables are required");
        }

        // Initialize the Cosmos client
        const client = new CosmosClient({ endpoint, key });

        // Create database
        console.log("Creating database...");
        const { database } = await client.databases.createIfNotExists({
            id: "math-worksheet-db"
        });

        // Create containers
        await Promise.all([
            createContainer(database, "worksheets", "/teacherId"),
            createContainer(database, "submissions", "/worksheetId"),
            createContainer(database, "users", "/role"),
            createContainer(database, "classes", "/teacherId")
        ]);

        console.log("Database setup completed successfully");

    } catch (error) {
        console.error("Error setting up database:", error);
        process.exit(1);
    }
}

async function createContainer(database: Database, id: string, partitionKey: string) {
    console.log(`Creating container: ${id}`);
    const { container } = await database.containers.createIfNotExists({
        id,
        partitionKey,
        indexingPolicy: {
            indexingMode: "consistent",
            automatic: true,
            includedPaths: [
                {
                    path: "/*"
                }
            ]
        }
    });

    // Create indexes based on container type
    switch (id) {
        case "worksheets":
            await updateWorksheetIndexes(container);
            break;
        case "submissions":
            await updateSubmissionIndexes(container);
            break;
        case "users":
            await updateUserIndexes(container);
            break;
        case "classes":
            await updateClassIndexes(container);
            break;
    }
}

async function updateWorksheetIndexes(container: Container) {
    const response = await container.read();
    const indexingPolicy: IndexingPolicy = {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/*" }],
        compositeIndexes: [
            [
                {
                    path: "/teacherId",
                    order: "ascending"
                },
                {
                    path: "/dateCreated",
                    order: "descending"
                }
            ]
        ]
    };
    
    await container.replace({
        ...response.resource,
        indexingPolicy
    });
}

async function updateSubmissionIndexes(container: Container) {
    const response = await container.read();
    const indexingPolicy: IndexingPolicy = {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/*" }],
        compositeIndexes: [
            [
                {
                    path: "/worksheetId",
                    order: "ascending"
                },
                {
                    path: "/score",
                    order: "descending"
                }
            ]
        ]
    };
    
    await container.replace({
        ...response.resource,
        indexingPolicy
    });
}

async function updateUserIndexes(container: Container) {
    const response = await container.read();
    const indexingPolicy: IndexingPolicy = {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
            {
                path: "/email/?",
                indexes: [
                    {
                        dataType: "String",
                        precision: -1,
                        kind: "Range"
                    }
                ]
            },
            { path: "/*" }
        ]
    };
    
    await container.replace({
        ...response.resource,
        indexingPolicy
    });
}

async function updateClassIndexes(container: Container) {
    const response = await container.read();
    const indexingPolicy: IndexingPolicy = {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/*" }],
        compositeIndexes: [
            [
                {
                    path: "/teacherId",
                    order: "ascending"
                },
                {
                    path: "/grade",
                    order: "ascending"
                }
            ]
        ]
    };
    
    await container.replace({
        ...response.resource,
        indexingPolicy
    });
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error("Failed to set up database:", error);
            process.exit(1);
        });
}

export { setupDatabase };
