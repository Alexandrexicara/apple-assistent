#!/usr/bin/env python3
"""
Apple ID Assistant - Core Engine
=================================
Motor principal do sistema de assistência de recuperação Apple ID.
Responsável por diagnósticos, análises e integração com serviços.

Autor: Bay Reset Tool
Versão: 1.0.0
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('core_engine.log')
    ]
)

logger = logging.getLogger(__name__)


class ProblemType(Enum):
    """Tipos de problemas suportados"""
    FORGOT_PASSWORD = "forgot-password"
    TWO_FACTOR = "two-factor"
    ACTIVATION_LOCK = "activation-lock"
    ACCOUNT_LOCKED = "account-locked"
    DEVICE_USED = "device-used"
    RESET_WITH_PASSWORD = "reset-with-password"


class SeverityLevel(Enum):
    """Níveis de severidade"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class DiagnosisResult:
    """Resultado de um diagnóstico"""
    type: str
    severity: str
    recoverable: bool
    requires_apple_support: bool
    estimated_time: str
    steps: List[str]
    notes: Optional[str] = None


@dataclass
class UserSession:
    """Sessão de usuário"""
    session_id: str
    email: Optional[str]
    problem_type: Optional[str]
    created_at: datetime
    consent_given: bool = False
    diagnosis: Optional[DiagnosisResult] = None
    status: str = "started"


class DiagnosisEngine:
    """Motor de diagnóstico de casos"""
    
    def __init__(self):
        self.diagnosis_templates = {
            ProblemType.FORGOT_PASSWORD: {
                "type": "Senha Esquecida",
                "severity": SeverityLevel.LOW,
                "recoverable": True,
                "requires_apple_support": False,
                "estimated_time": "15-30 minutos",
                "steps": [
                    "Acessar iforgot.apple.com",
                    "Verificar identidade via e-mail ou telefone",
                    "Redefinir senha com nova senha segura",
                    "Atualizar senha em todos os dispositivos"
                ],
                "notes": "Processo simples e rápido se tiver acesso ao e-mail ou telefone cadastrado"
            },
            ProblemType.TWO_FACTOR: {
                "type": "Verificação em 2 Etapas",
                "severity": SeverityLevel.MEDIUM,
                "recoverable": True,
                "requires_apple_support": True,
                "estimated_time": "1-3 dias",
                "steps": [
                    "Verificar dispositivos confiáveis cadastrados",
                    "Tentar recuperação via número de telefone",
                    "Contatar suporte Apple se necessário",
                    "Aguardar verificação de identidade"
                ],
                "notes": "Processo mais longo devido à segurança adicional"
            },
            ProblemType.ACTIVATION_LOCK: {
                "type": "Bloqueio de Ativação (iCloud)",
                "severity": SeverityLevel.HIGH,
                "recoverable": False,  # Dependendo do contexto
                "requires_apple_support": True,
                "estimated_time": "3-7 dias (com comprovante) / Não recuperável (sem comprovante)",
                "steps": [
                    "Verificar posse do comprovante de compra original",
                    "Preparar documentação (nota fiscal, IMEI)",
                    "Solicitar remoção do bloqueio via Apple",
                    "Aguardar análise e decisão da Apple"
                ],
                "notes": "CRÍTICO: Sem comprovante de compra, a Apple NÃO remove o bloqueio"
            },
            ProblemType.ACCOUNT_LOCKED: {
                "type": "Conta Inacessível",
                "severity": SeverityLevel.MEDIUM,
                "recoverable": True,
                "requires_apple_support": True,
                "estimated_time": "24-48 horas",
                "steps": [
                    "Verificar motivo do bloqueio (e-mail da Apple)",
                    "Seguir instruções de recuperação enviadas",
                    "Verificar identidade conforme solicitado",
                    "Aguardar liberação da conta"
                ],
                "notes": "Bloqueios geralmente são temporários ou por segurança"
            },
            ProblemType.DEVICE_USED: {
                "type": "Dispositivo Usado Comprado",
                "severity": SeverityLevel.HIGH,
                "recoverable": False,  # Geralmente não
                "requires_apple_support": True,
                "estimated_time": "Variável / Não garantido",
                "steps": [
                    "Verificar se dispositivo tem Activation Lock ativo",
                    "Entrar em contato IMEDIATAMENTE com o vendedor",
                    "Solicitar remoção do dispositivo da conta do vendedor",
                    "Se sem sucesso: verificar opções legais"
                ],
                "notes": "ALERTA: Dispositivos com Activation Lock de terceiros são inutilizáveis"
            },
            ProblemType.RESET_WITH_PASSWORD: {
                "type": "Reset Profissional com Senha iCloud",
                "severity": SeverityLevel.LOW,
                "recoverable": True,
                "requires_apple_support": False,
                "estimated_time": "5-10 minutos",
                "steps": [
                    "Acessar Ajustes > [nome] > Sair (Sign Out)",
                    "Digitar a senha do iCloud para desativar Buscar iPhone",
                    "Aguardar a remoção da conta do dispositivo",
                    "Acessar Ajustes > Geral > Transferir ou Redefinir",
                    "Tocar em Apagar Conteúdo e Ajustes",
                    "Confirmar e aguardar o iPhone reiniciar"
                ],
                "notes": "Processo 100% legal. Dispositivo pronto para nova configuração."
            }
        }
    
    def diagnose(self, problem_type: ProblemType, 
                 has_proof_of_purchase: bool = False,
                 has_device_access: bool = False) -> DiagnosisResult:
        """
        Realiza diagnóstico baseado no tipo de problema
        
        Args:
            problem_type: Tipo do problema
            has_proof_of_purchase: Se possui comprovante de compra
            has_device_access: Se tem acesso físico ao dispositivo
            
        Returns:
            DiagnosisResult com análise completa
        """
        logger.info(f"Iniciando diagnóstico: {problem_type.value}")
        
        template = self.diagnosis_templates.get(problem_type)
        if not template:
            raise ValueError(f"Tipo de problema desconhecido: {problem_type}")
        
        # Ajustar baseado no contexto
        recoverable = template["recoverable"]
        estimated_time = template["estimated_time"]
        
        if problem_type == ProblemType.ACTIVATION_LOCK:
            if has_proof_of_purchase:
                recoverable = True
                estimated_time = "3-7 dias úteis"
            else:
                recoverable = False
                estimated_time = "Não recuperável sem comprovante"
        
        result = DiagnosisResult(
            type=template["type"],
            severity=template["severity"].value,
            recoverable=recoverable,
            requires_apple_support=template["requires_apple_support"],
            estimated_time=estimated_time,
            steps=template["steps"],
            notes=template.get("notes")
        )
        
        logger.info(f"Diagnóstico concluído: {result.type} - Severidade: {result.severity}")
        return result


class SessionManager:
    """Gerenciador de sessões de usuário"""
    
    def __init__(self):
        self.sessions: Dict[str, UserSession] = {}
        logger.info("SessionManager inicializado")
    
    def create_session(self, email: Optional[str] = None) -> UserSession:
        """Cria nova sessão"""
        session = UserSession(
            session_id=str(uuid.uuid4()),
            email=email,
            problem_type=None,
            created_at=datetime.now(),
            consent_given=False
        )
        self.sessions[session.session_id] = session
        logger.info(f"Nova sessão criada: {session.session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[UserSession]:
        """Recupera sessão por ID"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, **kwargs) -> bool:
        """Atualiza dados da sessão"""
        session = self.sessions.get(session_id)
        if not session:
            return False
        
        for key, value in kwargs.items():
            if hasattr(session, key):
                setattr(session, key, value)
        
        logger.info(f"Sessão atualizada: {session_id}")
        return True
    
    def save_consent(self, session_id: str, 
                     consent_given: bool,
                     ip_address: str = "unknown") -> bool:
        """Registra consentimento do usuário"""
        if session_id in self.sessions:
            self.sessions[session_id].consent_given = consent_given
            logger.info(f"Consentimento registrado: {session_id} - IP: {ip_address}")
            return True
        return False


class AppleAssistantCore:
    """Classe principal do Core Engine"""
    
    def __init__(self):
        self.diagnosis_engine = DiagnosisEngine()
        self.session_manager = SessionManager()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info("AppleAssistantCore inicializado")
    
    def create_session(self, email: Optional[str] = None) -> Dict[str, Any]:
        """Cria nova sessão de usuário"""
        session = self.session_manager.create_session(email)
        return {
            "session_id": session.session_id,
            "created_at": session.created_at.isoformat(),
            "status": "created"
        }
    
    def diagnose_problem(self, session_id: str,
                        problem_type: str,
                        has_proof_of_purchase: bool = False,
                        has_device_access: bool = False) -> Dict[str, Any]:
        """
        Realiza diagnóstico completo do problema
        
        Args:
            session_id: ID da sessão
            problem_type: Tipo do problema
            has_proof_of_purchase: Possui comprovante
            has_device_access: Tem acesso ao dispositivo
            
        Returns:
            Dicionário com resultado do diagnóstico
        """
        try:
            ptype = ProblemType(problem_type)
        except ValueError:
            return {
                "error": f"Tipo de problema inválido: {problem_type}",
                "valid_types": [t.value for t in ProblemType]
            }
        
        # Verificar sessão
        session = self.session_manager.get_session(session_id)
        if not session:
            return {"error": "Sessão não encontrada"}
        
        # Realizar diagnóstico
        diagnosis = self.diagnosis_engine.diagnose(
            ptype, has_proof_of_purchase, has_device_access
        )
        
        # Atualizar sessão
        session.problem_type = problem_type
        session.diagnosis = diagnosis
        session.status = "diagnosed"
        
        self.logger.info(f"Diagnóstico realizado: {session_id} - {diagnosis.type}")
        
        return {
            "session_id": session_id,
            "diagnosis": asdict(diagnosis),
            "timestamp": datetime.now().isoformat()
        }
    
    def record_consent(self, session_id: str,
                       email: Optional[str],
                       consent_given: bool,
                       ip_address: str = "unknown") -> Dict[str, Any]:
        """Registra consentimento do usuário"""
        success = self.session_manager.save_consent(
            session_id, consent_given, ip_address
        )
        
        if success:
            self.session_manager.update_session(
                session_id, 
                email=email,
                status="consent_given"
            )
            
            self.logger.info(f"Consentimento registrado: {session_id}")
            
            return {
                "session_id": session_id,
                "consent_id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "recorded": True
            }
        
        return {"error": "Falha ao registrar consentimento", "recorded": False}
    
    def get_recovery_guide(self, problem_type: str) -> Dict[str, Any]:
        """Retorna guia de recuperação específico"""
        guides = {
            "forgot-password": {
                "title": "Recuperação de Senha",
                "official_url": "https://iforgot.apple.com",
                "steps": [
                    {
                        "order": 1,
                        "title": "Acessar site oficial",
                        "description": "Visite iforgot.apple.com em um navegador seguro",
                        "action": "external_link",
                        "url": "https://iforgot.apple.com"
                    },
                    {
                        "order": 2,
                        "title": "Digitar Apple ID",
                        "description": "Informe seu e-mail cadastrado como Apple ID"
                    },
                    {
                        "order": 3,
                        "title": "Verificação de identidade",
                        "description": "Escolha entre e-mail ou SMS para receber código"
                    },
                    {
                        "order": 4,
                        "title": "Redefinir senha",
                        "description": "Crie uma senha forte (mínimo 8 caracteres, maiúsculas, números e símbolos)"
                    }
                ],
                "tips": [
                    "Nunca compartilhe sua senha",
                    "Use autenticador de senhas",
                    "Ative verificação em duas etapas"
                ]
            },
            "activation-lock": {
                "title": "Bloqueio de Ativação",
                "official_url": "https://support.apple.com",
                "warning": "Sem comprovante de compra, a Apple NÃO remove o bloqueio",
                "steps": [
                    {
                        "order": 1,
                        "title": "Verificar comprovante",
                        "description": "Localize a nota fiscal original de compra do dispositivo"
                    },
                    {
                        "order": 2,
                        "title": "Preparar documentação",
                        "description": "Tenha em mãos: IMEI, número de série, nota fiscal"
                    },
                    {
                        "order": 3,
                        "title": "Contatar Apple",
                        "description": "Abra um chamado no suporte oficial da Apple",
                        "action": "external_link",
                        "url": "https://support.apple.com"
                    },
                    {
                        "order": 4,
                        "title": "Aguardar análise",
                        "description": "O processo pode levar 3-7 dias úteis"
                    }
                ],
                "warnings": [
                    "Não existe bypass legítimo",
                    "Serviços que prometem desbloqueio são golpes",
                    "Sem comprovante, o dispositivo permanece bloqueado"
                ]
            }
        }
        
        return guides.get(problem_type, {
            "error": "Guia não encontrado",
            "available_guides": list(guides.keys())
        })
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Retorna status atual da sessão"""
        session = self.session_manager.get_session(session_id)
        if not session:
            return {"error": "Sessão não encontrada"}
        
        return {
            "session_id": session.session_id,
            "email": session.email,
            "problem_type": session.problem_type,
            "consent_given": session.consent_given,
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "diagnosis": asdict(session.diagnosis) if session.diagnosis else None
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do sistema"""
        sessions = list(self.session_manager.sessions.values())
        
        return {
            "total_sessions": len(sessions),
            "active_sessions": len([s for s in sessions if s.status != "completed"]),
            "consent_given": len([s for s in sessions if s.consent_given]),
            "diagnoses_completed": len([s for s in sessions if s.diagnosis]),
            "problem_type_distribution": self._get_problem_distribution(sessions)
        }
    
    def check_device_status(self, imei: str) -> Dict[str, Any]:
        """
        Verifica status de um dispositivo pelo IMEI
        
        Args:
            imei: IMEI do dispositivo (15 dígitos)
            
        Returns:
            Dict com status do dispositivo
        """
        # Validar formato IMEI
        imei_clean = imei.replace(" ", "").replace("-", "")
        
        if not imei_clean.isdigit() or len(imei_clean) != 15:
            return {
                "valid": False,
                "error": "IMEI inválido. Deve conter 15 dígitos.",
                "imei": imei
            }
        
        # Calcular dígito verificador (algoritmo de Luhn)
        def luhn_checksum(card_number):
            digits = [int(d) for d in card_number]
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            total = sum(odd_digits)
            for d in even_digits:
                total += sum(divmod(d * 2, 10))
            return total % 10
        
        checksum_valid = luhn_checksum(imei_clean) == 0
        
        # Identificar operadora pelo TAC (primeiros 8 dígitos)
        tac = imei_clean[:8]
        
        # Mock de verificação de operadora (em produção, consultar base GSMA)
        carriers = {
            "35": "Apple Inc.",
            "01": "Apple Inc.",
            "99": "Apple Inc."
        }
        carrier = carriers.get(tac[:2], "Desconhecida")
        
        self.logger.info(f"Dispositivo verificado: IMEI {imei_clean}")
        
        return {
            "valid": checksum_valid,
            "imei": imei_clean,
            "tac": tac,
            "carrier": carrier,
            "checksum_valid": checksum_valid,
            "format_valid": True
        }
    
    def validate_reset_eligibility(self, has_password: bool,
                                   find_my_status: str = "unknown",
                                   has_proof_of_purchase: bool = False) -> Dict[str, Any]:
        """
        Determina se reset é possível e qual o melhor caminho
        
        Args:
            has_password: Se tem a senha do iCloud
            find_my_status: Status do Find My (on/off/unknown)
            has_proof_of_purchase: Se tem comprovante de compra
            
        Returns:
            Dict com elegibilidade e recomendações
        """
        result = {
            "eligible": False,
            "method": None,
            "estimated_time": "Indeterminado",
            "requires_password": True,
            "warnings": [],
            "steps": []
        }
        
        if has_password:
            result["eligible"] = True
            result["method"] = "reset-with-password"
            result["estimated_time"] = "5-10 minutos"
            result["requires_password"] = True
            result["steps"] = [
                "Acessar Ajustes > [nome] > Sair (Sign Out)",
                "Digitar a senha do iCloud",
                "Desativar Buscar iPhone",
                "Ir a Ajustes > Geral > Transferir ou Redefinir",
                "Tocar em Apagar Conteúdo e Ajustes",
                "Confirmar e aguardar reinicialização"
            ]
            result["notes"] = "Reset 100% legal. Dispositivo ficará como novo."
        
        elif find_my_status == "off" and not has_password:
            result["eligible"] = True
            result["method"] = "reset-without-password-no-find-my"
            result["estimated_time"] = "5-10 minutos"
            result["requires_password"] = False
            result["steps"] = [
                "Acessar Ajustes > Geral > Transferir ou Redefinir",
                "Tocar em Apagar Conteúdo e Ajustes",
                "Confirmar e aguardar reinicialização"
            ]
            result["notes"] = "Find My desativado. Reset possível sem senha."
        
        elif find_my_status == "on" and not has_password:
            result["eligible"] = False
            result["method"] = "needs-recovery"
            result["estimated_time"] = "Variável"
            result["requires_password"] = True
            result["warnings"].append("Find My ativo e sem senha — necessário recuperar senha primeiro")
            result["steps"] = [
                "Recuperar senha em iforgot.apple.com",
                "Depois seguir passos do reset com senha"
            ]
        
        elif find_my_status == "unknown":
            result["eligible"] = True
            result["method"] = "verify-first"
            result["estimated_time"] = "Verificar primeiro"
            result["requires_password"] = True
            result["warnings"].append("Status do Find My desconhecido — verificar antes de prosseguir")
            result["steps"] = [
                "Verificar se Find My está ativo no dispositivo",
                "Se ativo e sem senha: recuperar senha primeiro",
                "Se ativo e com senha: seguir reset com senha",
                "Se desativado: reset direto"
            ]
        
        self.logger.info(f"Elegibilidade verificada: método={result['method']}")
        return result
    
    def generate_service_report(self, client_data: Dict[str, Any],
                                device_data: Dict[str, Any],
                                service_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera estrutura de relatório de serviço
        
        Args:
            client_data: Dados do cliente (nome, telefone, documento)
            device_data: Dados do dispositivo (IMEI, modelo, serial)
            service_data: Dados do serviço (tipo, status, técnico, notas)
            
        Returns:
            Dict com relatório estruturado
        """
        report = {
            "report_id": str(uuid.uuid4()),
            "generated_at": datetime.now().isoformat(),
            "title": "Apple ID Assistant — Relatório de Serviço",
            "disclaimer": (
                "Este serviço foi realizado seguindo os processos oficiais da Apple. "
                "Não realizamos bypass ou desbloqueio ilegal de iCloud."
            ),
            "client": {
                "name": client_data.get("name", "Não informado"),
                "phone": client_data.get("phone", "Não informado"),
                "document": client_data.get("document", "Não informado"),
                "email": client_data.get("email", "Não informado")
            },
            "device": {
                "model": device_data.get("model", "Não informado"),
                "imei": device_data.get("imei", "Não informado"),
                "serial_number": device_data.get("serial_number", "Não informado"),
                "color": device_data.get("color", "Não informado"),
                "condition": device_data.get("condition_status", "Não informado")
            },
            "service": {
                "type": service_data.get("service_type", "Não informado"),
                "status": service_data.get("status", "pending"),
                "technician": service_data.get("technician_name", "Não informado"),
                "date": service_data.get("date", datetime.now().isoformat()),
                "steps_completed": service_data.get("steps_completed", []),
                "result": service_data.get("result", ""),
                "notes": service_data.get("notes", "")
            },
            "signatures": {
                "technician": "",
                "client": "",
                "date": datetime.now().strftime("%d/%m/%Y %H:%M")
            }
        }
        
        self.logger.info(f"Relatório gerado: {report['report_id']}")
        return report
    
    def _get_problem_distribution(self, sessions: List[UserSession]) -> Dict[str, int]:
        """Calcula distribuição de tipos de problema"""
        distribution = {}
        for session in sessions:
            if session.problem_type:
                distribution[session.problem_type] = distribution.get(session.problem_type, 0) + 1
        return distribution


# ==================== CLI / Standalone ====================

def main():
    """Função principal para execução standalone"""
    print("=" * 60)
    print("Apple ID Assistant - Core Engine")
    print("=" * 60)
    
    core = AppleAssistantCore()
    
    # Criar sessão de teste
    session = core.create_session("teste@exemplo.com")
    print(f"\n✓ Sessão criada: {session['session_id']}")
    
    # Testar diagnóstico
    diagnosis = core.diagnose_problem(
        session['session_id'],
        "forgot-password"
    )
    print(f"\n✓ Diagnóstico realizado:")
    print(f"  - Tipo: {diagnosis['diagnosis']['type']}")
    print(f"  - Severidade: {diagnosis['diagnosis']['severity']}")
    print(f"  - Recuperável: {diagnosis['diagnosis']['recoverable']}")
    print(f"  - Tempo estimado: {diagnosis['diagnosis']['estimated_time']}")
    
    # Testar consentimento
    consent = core.record_consent(
        session['session_id'],
        "teste@exemplo.com",
        True,
        "127.0.0.1"
    )
    print(f"\n✓ Consentimento registrado: {consent['consent_id']}")
    
    # Estatísticas
    stats = core.get_stats()
    print(f"\n✓ Estatísticas do sistema:")
    print(f"  - Total de sessões: {stats['total_sessions']}")
    print(f"  - Sessões ativas: {stats['active_sessions']}")
    
    print("\n" + "=" * 60)
    print("Core Engine executado com sucesso!")
    print("=" * 60)


if __name__ == "__main__":
    main()
