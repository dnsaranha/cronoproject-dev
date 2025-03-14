import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLoginClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    // Iniciar slider automático
    const interval = setInterval(() => {
      const dots = document.querySelectorAll('.dot');
      const activeDot = document.querySelector('.dot.active');
      if (activeDot && dots.length > 0) {
        const currentIndex = Array.from(dots).indexOf(activeDot);
        const nextIndex = (currentIndex + 1) % dots.length;
        
        activeDot.classList.remove('active');
        dots[nextIndex].classList.add('active');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border">
        <nav className="navbar">
          <div className="container">
            <div className="logo">
              <img src="/logo-cronoproject.png" alt="CronoProject Logo" className="logo-img" />
              <span className="text-foreground">CronoProject</span>
            </div>
            <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
              <li><a href="#recursos" className="text-foreground hover:text-primary">Recursos</a></li>
              <li><a href="#planos" className="text-foreground hover:text-primary">Planos</a></li>
              <li><a href="#contato" className="text-foreground hover:text-primary">Contato</a></li>
              <li><button onClick={handleLoginClick} className="btn btn-outline text-foreground">Entrar</button></li>
              <li><Link to="/signup" className="btn btn-primary">Cadastrar</Link></li>
            </ul>
            <div className="hamburger" onClick={toggleMenu}>
              <span className="bg-foreground"></span>
              <span className="bg-foreground"></span>
              <span className="bg-foreground"></span>
            </div>
          </div>
        </nav>
      </header>

      <section className="hero bg-background">
        <div className="container">
          <div className="hero-content">
            <h1 className="text-foreground">Gerencie seus cronogramas com eficiência</h1>
            <p className="text-muted-foreground">Planejamento, WBS e gráficos de Gantt integrados em uma plataforma intuitiva</p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-lg">Comece Grátis</Link>
              <a href="#demo" className="btn btn-outline btn-lg text-foreground">Ver Demo</a>
            </div>
          </div>
          <div className="hero-image">
            <img src="/cronoproject-dashboard.png" alt="Dashboard CronoProject" />
          </div>
        </div>
      </section>

      <section id="exemplos" className="examples bg-background">
        <div className="container">
          <h2 className="section-title text-foreground">Exemplos de Uso</h2>
          <p className="section-subtitle text-muted-foreground">Veja como o CronoProject transforma o gerenciamento de projetos</p>
          
          <div className="examples-slider">
            <div className="slider-container">
              <div className="slider-item bg-card">
                <img src="/exemplo-gantt.png" alt="Exemplo de Gráfico de Gantt" />
                <div className="slider-caption">
                  <h3 className="text-foreground">Gráfico de Gantt</h3>
                  <p className="text-muted-foreground">Visualize o cronograma completo com dependências e caminho crítico</p>
                </div>
              </div>
              <div className="slider-item bg-card">
                <img src="/exemplo-wbs.png" alt="Exemplo de WBS" />
                <div className="slider-caption">
                  <h3 className="text-foreground">Estrutura Analítica do Projeto (WBS)</h3>
                  <p className="text-muted-foreground">Organize as entregas e pacotes de trabalho hierarquicamente</p>
                </div>
              </div>
              <div className="slider-item bg-card">
                <img src="/exemplo-dashboard.png" alt="Exemplo de Dashboard" />
                <div className="slider-caption">
                  <h3 className="text-foreground">Dashboard de Projetos</h3>
                  <p className="text-muted-foreground">Acompanhe o progresso de todos os seus projetos em um só lugar</p>
                </div>
              </div>
            </div>
            <div className="slider-controls">
              <button className="slider-prev text-foreground"><i className="fas fa-chevron-left"></i></button>
              <div className="slider-dots">
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <button className="slider-next text-foreground"><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Planos */}
      <section id="planos" className="pricing bg-background">
        <div className="container">
          <h2 className="section-title text-foreground">Nossos Planos</h2>
          <p className="section-subtitle text-muted-foreground">Escolha o plano ideal para suas necessidades</p>
          
          <div className="pricing-cards">
            <div className="pricing-card bg-card border border-border">
              <div className="pricing-header">
                <h3 className="text-foreground">Free</h3>
                <p className="price text-foreground">R$ 0<span className="text-muted-foreground">/mês</span></p>
                <p className="subtitle text-muted-foreground">Para pequenos times e projetos simples</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Máximo de 3 projetos ativos</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Até 5 usuários por projeto</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> 100MB de armazenamento por usuário</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Recursos básicos de cronograma</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> WBS básico</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Gráfico de Gantt sem edição avançada</li>
                </ul>
              </div>
              <div className="pricing-cta">
                <Link to="/signup?plan=free" className="btn btn-outline btn-block text-foreground">Começar Grátis</Link>
              </div>
            </div>
            
            <div className="pricing-card featured bg-card border border-primary">
              <div className="pricing-badge">Popular</div>
              <div className="pricing-header">
                <h3 className="text-foreground">Premium</h3>
                <p className="price text-foreground">R$ 49<span className="text-muted-foreground">/mês</span></p>
                <p className="subtitle text-muted-foreground">Para equipes e projetos complexos</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Projetos ilimitados</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Usuários ilimitados por projeto</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> 5GB de armazenamento por usuário</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Personalização avançada do Gantt</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Integrações (Google Drive, Trello, Jira)</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Relatórios e dashboards avançados</li>
                  <li className="text-foreground"><i className="fas fa-check text-success-color"></i> Suporte prioritário</li>
                </ul>
              </div>
              <div className="pricing-cta">
                <Link to="/signup?plan=premium" className="btn btn-primary btn-block">Teste Grátis por 14 dias</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Seção de Comparação de Planos */}
      <section id="comparativo" className="comparison bg-background">
        <div className="container">
          <h2 className="section-title text-foreground">Comparativo de Planos</h2>
          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Recursos</th>
                  <th>Free</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Projetos</td>
                  <td>3 máximo</td>
                  <td>Ilimitado</td>
                </tr>
                <tr>
                  <td>Usuários por projeto</td>
                  <td>5 máximo</td>
                  <td>Ilimitado</td>
                </tr>
                <tr>
                  <td>Armazenamento</td>
                  <td>100MB por usuário</td>
                  <td>5GB por usuário</td>
                </tr>
                <tr>
                  <td>Gráfico de Gantt avançado</td>
                  <td><i className="fas fa-times"></i></td>
                  <td><i className="fas fa-check"></i></td>
                </tr>
                <tr>
                  <td>Integrações</td>
                  <td><i className="fas fa-times"></i></td>
                  <td><i className="fas fa-check"></i></td>
                </tr>
                <tr>
                  <td>Relatórios avançados</td>
                  <td><i className="fas fa-times"></i></td>
                  <td><i className="fas fa-check"></i></td>
                </tr>
                <tr>
                  <td>Suporte prioritário</td>
                  <td><i className="fas fa-times"></i></td>
                  <td><i className="fas fa-check"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="bg-background dark:bg-dark-color">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <img src="/src/assets/logo-cronoproject-white.png" alt="CronoProject Logo" className="logo-img-small" />
                <span className="text-foreground">CronoProject</span>
              </div>
              <p className="text-muted-foreground">Solução completa para gerenciamento de cronogramas de projetos.</p>
            </div>
            <div className="footer-col">
              <h4 className="text-foreground">Produto</h4>
              <ul>
                <li><a href="#recursos" className="text-muted-foreground hover:text-foreground">Recursos</a></li>
                <li><a href="#planos" className="text-muted-foreground hover:text-foreground">Planos e Preços</a></li>
                <li><a href="/roadmap" className="text-muted-foreground hover:text-foreground">Roadmap</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="text-foreground">Empresa</h4>
              <ul>
                <li><a href="/sobre" className="text-muted-foreground hover:text-foreground">Sobre nós</a></li>
                <li><a href="/blog" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="/cases" className="text-muted-foreground hover:text-foreground">Casos de Sucesso</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="text-foreground">Suporte</h4>
              <ul>
                <li><a href="/ajuda" className="text-muted-foreground hover:text-foreground">Central de Ajuda</a></li>
                <li><a href="/contato" className="text-muted-foreground hover:text-foreground">Contato</a></li>
                <li><a href="/status" className="text-muted-foreground hover:text-foreground">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom border-t border-border">
            <p className="text-muted-foreground">&copy; 2023 CronoProject. Todos os direitos reservados.</p>
            <div className="footer-links">
              <a href="/termos" className="text-muted-foreground hover:text-foreground">Termos de Uso</a>
              <a href="/privacidade" className="text-muted-foreground hover:text-foreground">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;