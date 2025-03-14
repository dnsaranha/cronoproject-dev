import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SubscriptionProvider } from '@/providers/SubscriptionProvider';
import { AppLayout } from '@/components/AppLayout';

// Importações das páginas
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import GanttView from '@/pages/GanttView';
import BoardView from '@/pages/BoardView';
import GridView from '@/pages/GridView';
import TimelineView from '@/pages/TimelineView';
import WBSView from '@/pages/WBSView';
import NotFound from '@/pages/NotFound';
import ProjectView from '@/pages/ProjectView';
import CriticalPathView from '@/pages/CriticalPathView';
import MembersView from '@/pages/MembersView';
import ProfilePage from '@/pages/ProfilePage';

// Componente de rota protegida
import ProtectedRoute from '@/components/ProtectedRoute';

// Componente de rota protegida com layout
function ProtectedRouteWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            
            {/* Rotas protegidas com layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRouteWithLayout>
                  <Dashboard />
                </ProtectedRouteWithLayout>
              } 
            />
            
            {/* Nova rota para o perfil */}
            <Route 
              path="/perfil" 
              element={
                <ProtectedRouteWithLayout>
                  <ProfilePage />
                </ProtectedRouteWithLayout>
              } 
            />

            {/* Rotas de projeto com layout */}
            <Route 
              path="/project/:projectId" 
              element={
                <ProtectedRouteWithLayout>
                  <ProjectView />
                </ProtectedRouteWithLayout>
              }
            >
              <Route path="gantt" element={<GanttView />} />
              <Route path="board" element={<BoardView />} />
              <Route path="grid" element={<GridView />} />
              <Route path="timeline" element={<TimelineView />} />
              <Route path="wbs" element={<WBSView />} />
              <Route path="critical-path" element={<CriticalPathView />} />
              <Route path="members" element={<MembersView />} />
              <Route path="equipe" element={<MembersView />} />
              <Route index element={<GanttView />} />
            </Route>
            
            {/* Todas as outras rotas protegidas com layout */}
            <Route 
              path="/gantt" 
              element={
                <ProtectedRouteWithLayout>
                  <GanttView />
                </ProtectedRouteWithLayout>
              } 
            />
            <Route 
              path="/board" 
              element={
                <ProtectedRouteWithLayout>
                  <BoardView />
                </ProtectedRouteWithLayout>
              } 
            />
            <Route 
              path="/grid" 
              element={
                <ProtectedRouteWithLayout>
                  <GridView />
                </ProtectedRouteWithLayout>
              } 
            />
            <Route 
              path="/timeline" 
              element={
                <ProtectedRouteWithLayout>
                  <TimelineView />
                </ProtectedRouteWithLayout>
              } 
            />
            <Route 
              path="/wbs" 
              element={
                <ProtectedRouteWithLayout>
                  <WBSView />
                </ProtectedRouteWithLayout>
              } 
            />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster />
        </Router>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}

export default App;
