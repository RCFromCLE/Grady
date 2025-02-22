import React from 'react';
import { 
  Container, AppBar, Toolbar, Typography, Button, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { useMsal } from '@azure/msal-react';

const App: React.FC = () => {
  const { accounts } = useMsal();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const userName = accounts[0]?.name || 'Teacher';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Grady Math Worksheets
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem button onClick={() => setDrawerOpen(false)}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for AppBar height
          minHeight: '100vh',
          backgroundColor: (theme) => theme.palette.grey[100]
        }}
      >
        <TeacherDashboard userName={userName} />
      </Box>
    </Box>
  );
};

export default App;
