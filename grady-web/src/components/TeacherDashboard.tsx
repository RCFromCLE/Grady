import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Button, Grid, FormControl, 
  InputLabel, Select, MenuItem, TextField, Box, Link,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  ApiService, WorksheetRequest, Worksheet, MathProblem,
  ProblemType, DifficultyLevel, WorksheetSection
} from '../services/api';
import { useMsal } from '@azure/msal-react';

interface TeacherDashboardProps {
  userName: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ userName }) => {
  const { accounts } = useMsal();
  
  // Basic settings
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [problems, setProblems] = useState(20);
  const [teacherId, setTeacherId] = useState<string>('');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState<Worksheet | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setTeacherId('development-teacher-id');
    } else if (accounts.length > 0) {
      setTeacherId(accounts[0].localAccountId);
    }
  }, [accounts]);

  useEffect(() => {
    if (teacherId) {
      loadWorksheets();
    }
  }, [teacherId]);

  const loadWorksheets = async () => {
    try {
      const worksheets = await ApiService.getTeacherWorksheets(teacherId);
      setWorksheets(worksheets);
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
  };

  const handleGenerateWorksheet = async () => {
    try {
      if (!teacherId) {
        console.error('No teacher ID available');
        return;
      }

      // Create a basic section with the specified number of problems
      const section: WorksheetSection = {
        title: 'Basic Operations',
        problems: [{
          type: 'addition',
          difficulty,
          count: problems
        }]
      };

      // Create request
      const request: WorksheetRequest = {
        teacherId,
        title: title || undefined,
        sections: [section]
      };

      // Generate worksheet
      const worksheet = await ApiService.generateWorksheet(request);
      setWorksheets(prev => [worksheet, ...prev]);
      setTitle(''); // Clear title after generation

    } catch (error) {
      console.error('Error generating worksheet:', error);
    }
  };

  const handleShowQR = (worksheet: Worksheet) => {
    setSelectedWorksheet(worksheet);
    setQrDialogOpen(true);
  };

  const handleDeleteClick = (worksheet: Worksheet) => {
    setWorksheetToDelete(worksheet);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!worksheetToDelete) return;

    try {
      await ApiService.deleteWorksheet(worksheetToDelete.id, teacherId);
      setWorksheets(prev => prev.filter(w => w.id !== worksheetToDelete.id));
      setDeleteDialogOpen(false);
      setWorksheetToDelete(null);
    } catch (error) {
      console.error('Error deleting worksheet:', error);
    }
  };

  const handlePrint = (worksheet: Worksheet) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${worksheet.title}</title>
          <style>
            @page { 
              size: portrait;
              margin: 1cm;
            }
            body { 
              font-family: Arial, sans-serif;
              width: 100%;
              height: 100vh;
              margin: 0;
              padding: 1cm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              margin-bottom: 2cm;
            }
            .header h2 {
              margin-bottom: 1cm;
            }
            .header p {
              text-align: left;
              margin-bottom: 1cm;
            }
            .problems-grid {
              display: grid;
              grid-template-columns: repeat(10, 1fr);
              grid-template-rows: repeat(${Math.ceil(worksheet.sections[0].problems.length / 10)}, 1fr);
              gap: 1cm;
              flex: 1;
              margin: 0;
            }
            .problem {
              font-family: "Courier New", monospace;
              font-size: 14pt;
              white-space: pre;
              text-align: right;
              display: flex;
              align-items: center;
              justify-content: flex-end;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${worksheet.title}</h2>
            <p>${worksheet.header}</p>
          </div>
          <div class="problems-grid">
          ${worksheet.sections[0].problems.map((problem: MathProblem) => `
            <div class="problem">${problem.question}</div>
          `).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {userName}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Worksheet Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Addition Practice - Week 1"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Number of Problems"
              value={problems}
              onChange={(e) => setProblems(Number(e.target.value))}
              inputProps={{ min: 10, max: 100, step: 10 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleGenerateWorksheet}
          >
            Generate
          </Button>
        </Box>

        {worksheets.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Generated Worksheets
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Problems</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {worksheets.map((worksheet) => (
                    <TableRow key={worksheet.id}>
                      <TableCell>
                        {new Date(worksheet.dateCreated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{worksheet.title}</TableCell>
                      <TableCell>{worksheet.sections[0].problems[0].type}</TableCell>
                      <TableCell>{worksheet.sections[0].problems.length}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Print Worksheet">
                          <IconButton onClick={() => handlePrint(worksheet)}>
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Show QR Code">
                          <IconButton onClick={() => handleShowQR(worksheet)}>
                            <QrCode2Icon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Worksheet">
                          <IconButton onClick={() => handleDeleteClick(worksheet)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Scan to Submit Worksheet
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 3
          }}>
            <img 
              src={selectedWorksheet?.qrCode} 
              alt="QR Code"
              style={{ width: '400px', height: '400px' }}
            />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Use your phone's camera to scan this QR code
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Or visit:{' '}
              <Link href={`${window.location.origin}/student/${selectedWorksheet?.id}`}>
                {`${window.location.origin}/student/${selectedWorksheet?.id}`}
              </Link>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Worksheet</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this worksheet? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
