import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, TextField, Box, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Accordion, AccordionSummary, AccordionDetails,
  Chip, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
  ApiService, ProblemType, DifficultyLevel, ProblemConfig,
  WorksheetSection, ProblemCategory, ProblemCategories,
  WorksheetTemplate
} from '../services/api';

interface WorksheetDesignerProps {
  teacherId: string;
  onWorksheetGenerated?: () => void;
}

export const WorksheetDesigner: React.FC<WorksheetDesignerProps> = ({ 
  teacherId,
  onWorksheetGenerated 
}) => {
  // State for worksheet configuration
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<WorksheetSection[]>([]);
  const [templates, setTemplates] = useState<WorksheetTemplate[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // State for section being edited
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  
  // State for problem configuration
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | null>(null);
  const [selectedType, setSelectedType] = useState<ProblemType | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [problemCount, setProblemCount] = useState(5);
  
  // Advanced options
  const [maxNumber, setMaxNumber] = useState(100);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [includeFractions, setIncludeFractions] = useState(false);
  const [includeNegatives, setIncludeNegatives] = useState(false);
  const [wordProblemContext, setWordProblemContext] = useState('');
  
  // Dialog states
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templates = await ApiService.getTemplates(teacherId);
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleAddSection = () => {
    setSections([...sections, {
      title: `Section ${sections.length + 1}`,
      problems: []
    }]);
    setEditingSectionIndex(sections.length);
  };

  const handleAddProblemType = () => {
    if (!selectedType || editingSectionIndex === null) return;

    const newProblemConfig: ProblemConfig = {
      type: selectedType,
      difficulty,
      count: problemCount,
      options: {
        maxNumber,
        decimalPlaces,
        includeFractions,
        includeNegatives,
        wordProblemContext: wordProblemContext || undefined
      }
    };

    const updatedSections = [...sections];
    updatedSections[editingSectionIndex].problems.push(newProblemConfig);
    setSections(updatedSections);

    // Reset problem configuration
    setSelectedType(null);
    setProblemCount(5);
    setWordProblemContext('');
  };

  const handleRemoveProblemType = (sectionIndex: number, problemIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].problems.splice(problemIndex, 1);
    setSections(updatedSections);
  };

  const handleSaveSection = () => {
    if (editingSectionIndex === null) return;

    const updatedSections = [...sections];
    updatedSections[editingSectionIndex].title = sectionTitle;
    updatedSections[editingSectionIndex].description = sectionDescription || undefined;
    setSections(updatedSections);
    setEditingSectionIndex(null);
    setSectionTitle('');
    setSectionDescription('');
  };

  const handleSaveTemplate = async () => {
    try {
      await ApiService.saveTemplate({
        teacherId,
        name: templateName,
        description: templateDescription,
        sections
      });
      setSaveTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleGenerateWorksheet = async () => {
    try {
      await ApiService.generateWorksheet({
        teacherId,
        title: title || undefined,
        sections
      });
      onWorksheetGenerated?.();
    } catch (error) {
      console.error('Error generating worksheet:', error);
    }
  };

  const handleLoadTemplate = (template: WorksheetTemplate) => {
    setTitle(template.name);
    setSections(template.sections);
  };

  const renderProblemOptions = () => {
    if (!selectedCategory) return null;

    const showDecimalOptions = selectedCategory.id === 'decimals';
    const showFractionOptions = selectedCategory.id === 'fractions';
    const showWordProblemOptions = selectedType === 'word_problems';

    return (
      <Grid container spacing={3}>
        {showDecimalOptions && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Decimal Places"
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(Number(e.target.value))}
              inputProps={{ min: 0, max: 3 }}
            />
          </Grid>
        )}
        
        {(showDecimalOptions || showFractionOptions) && (
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeNegatives}
                  onChange={(e) => setIncludeNegatives(e.target.checked)}
                />
              }
              label="Include Negative Numbers"
            />
          </Grid>
        )}

        {showWordProblemOptions && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Word Problem Context"
              value={wordProblemContext}
              onChange={(e) => setWordProblemContext(e.target.value)}
              placeholder="e.g., Sports, Shopping, Travel"
              helperText="Provide context for generating relevant word problems"
            />
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Worksheet Designer
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(_: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Design" />
          <Tab label="Templates" />
        </Tabs>

        {activeTab === 0 ? (
          <>
            <TextField
              fullWidth
              label="Worksheet Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 3 }}
            />

            {sections.map((section, sectionIndex) => (
              <Paper key={sectionIndex} elevation={1} sx={{ mt: 3, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {section.title}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setEditingSectionIndex(sectionIndex);
                      setSectionTitle(section.title);
                      setSectionDescription(section.description || '');
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                
                {section.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {section.description}
                  </Typography>
                )}

                <List>
                  {section.problems.map((problem, problemIndex) => (
                    <ListItem key={problemIndex}>
                      <ListItemText
                        primary={`${problem.count}x ${problem.type} (${problem.difficulty})`}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {problem.options?.maxNumber && (
                              <Chip 
                                size="small" 
                                label={`Max: ${problem.options.maxNumber}`}
                                sx={{ mr: 1 }}
                              />
                            )}
                            {problem.options?.decimalPlaces && (
                              <Chip 
                                size="small" 
                                label={`Decimals: ${problem.options.decimalPlaces}`}
                                sx={{ mr: 1 }}
                              />
                            )}
                            {problem.options?.includeFractions && (
                              <Chip 
                                size="small" 
                                label="Fractions"
                                sx={{ mr: 1 }}
                              />
                            )}
                            {problem.options?.includeNegatives && (
                              <Chip 
                                size="small" 
                                label="Negatives"
                                sx={{ mr: 1 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveProblemType(sectionIndex, problemIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSection}
              sx={{ mt: 3 }}
            >
              Add Section
            </Button>

            {editingSectionIndex !== null && (
              <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Edit Section
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Section Title"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Section Description"
                      value={sectionDescription}
                      onChange={(e) => setSectionDescription(e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory?.id || ''}
                        label="Category"
                        onChange={(e) => {
                          const category = ProblemCategories.find(c => c.id === e.target.value);
                          setSelectedCategory(category || null);
                          setSelectedType(null);
                        }}
                      >
                        {ProblemCategories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Problem Type</InputLabel>
                      <Select
                        value={selectedType || ''}
                        label="Problem Type"
                        onChange={(e) => setSelectedType(e.target.value as ProblemType)}
                        disabled={!selectedCategory}
                      >
                        {selectedCategory?.types.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                      value={problemCount}
                      onChange={(e) => setProblemCount(Number(e.target.value))}
                      inputProps={{ min: 1, max: 20 }}
                    />
                  </Grid>

                  {renderProblemOptions()}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleAddProblemType}
                        disabled={!selectedType}
                      >
                        Add Problem Type
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleSaveSection}
                      >
                        Save Section
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateWorksheet}
                disabled={sections.length === 0}
              >
                Generate
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => setSaveTemplateDialogOpen(true)}
                disabled={sections.length === 0}
              >
                Save as Template
              </Button>
            </Box>
          </>
        ) : (
          <List>
            {templates.map((template) => (
              <ListItem key={template.id}>
                <ListItemText
                  primary={template.name}
                  secondary={
                    <>
                      <Typography variant="body2">{template.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last used: {new Date(template.lastUsed).toLocaleDateString()}
                        {' • '}
                        Used {template.timesUsed} times
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    Load
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog
        open={saveTemplateDialogOpen}
        onClose={() => setSaveTemplateDialogOpen(false)}
      >
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Template Description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!templateName}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
