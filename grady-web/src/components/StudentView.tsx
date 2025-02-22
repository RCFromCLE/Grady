import * as React from 'react';
import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import Webcam from 'react-webcam';
import { ApiService } from '../services/api';

export const StudentView: React.FC = () => {
  const { worksheetId } = useParams<{ worksheetId: string }>();
  const webcamRef = useRef<Webcam>(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhotoTaken(true);
        handleSubmit(imageSrc);
      }
    }
  };

  const handleSubmit = async (imageData: string) => {
    if (!worksheetId) return;

    setSubmitting(true);
    try {
      await ApiService.processSubmission({
        worksheetId,
        imageData
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting worksheet:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Thank you for submitting!
          </Typography>
          <Typography>
            Your worksheet has been submitted for grading.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Submit Your Math Worksheet
        </Typography>

        <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            height="auto"
            videoConstraints={{
              facingMode: "environment"
            }}
            forceScreenshotSourceSize={true}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleCapture}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Take Photo & Submit'}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Position your completed worksheet in the camera view and click the button to submit
        </Typography>
      </Paper>
    </Container>
  );
};
