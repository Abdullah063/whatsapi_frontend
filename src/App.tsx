import { ThemeProvider } from './components/provider/theme-provider';
import { RouterProvider } from 'react-router';
import router from './routes/Router';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="whatsapi-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
