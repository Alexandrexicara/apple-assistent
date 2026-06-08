import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16 lg:py-24">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-8">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Apple ID Assistant
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Assistente profissional de recuperação e suporte para Apple ID. 
          Fluxos guiados seguindo os processos oficiais da Apple.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/recovery"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Iniciar Recuperação
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 border-2 border-gray-600 hover:border-blue-500 rounded-xl font-semibold transition-all"
          >
            Acessar Painel
          </Link>
        </div>
      </section>

      {/* Warning Banner */}
      <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-6 mb-16">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-amber-400 mb-2">Aviso Importante</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Este sistema é um <strong>assistente de suporte guiado</strong>. Não realizamos 
              bypass ou desbloqueio ilegal de iCloud. Todas as recuperações seguem os processos 
              oficiais da Apple. Serviços que prometem "desbloqueio iCloud" são fraudulentos.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <FeatureCard
          icon={<Lock className="w-8 h-8" />}
          title="Recuperação de Senha"
          description="Fluxo guiado para redefinir senha esquecida do Apple ID"
        />
        <FeatureCard
          icon={<Shield className="w-8 h-8" />}
          title="Verificação 2FA"
          description="Suporte para recuperação com verificação em duas etapas"
        />
        <FeatureCard
          icon={<FileText className="w-8 h-8" />}
          title="Bloqueio de Ativação"
          description="Orientação para casos de Activation Lock"
        />
        <FeatureCard
          icon={<Clock className="w-8 h-8" />}
          title="Acompanhamento"
          description="Painel completo para acompanhar solicitações"
        />
      </section>

      {/* How it Works */}
      <section className="bg-gray-900 rounded-2xl p-8 lg:p-12 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
        
        <div className="grid md:grid-cols-5 gap-8">
          <Step number={1} title="Entrada" description="Informe seu Apple ID e tipo de problema" />
          <Step number={2} title="Consentimento" description="Confirme propriedade e aceite os termos" />
          <Step number={3} title="Diagnóstico" description="Sistema analisa seu caso automaticamente" />
          <Step number={4} title="Recuperação" description="Siga o fluxo guiado específico" />
          <Step number={5} title="Acompanhamento" description="Monitore o progresso em tempo real" />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="text-center py-12 border-t border-gray-800">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Processos Oficiais Apple</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Sem Bypass ou Golpes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Privacidade Garantida</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Suporte Técnico</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group">
    <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="text-center">
    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
      {number}
    </div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

export default Home;
