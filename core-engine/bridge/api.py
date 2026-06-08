#!/usr/bin/env python3
"""
API Bridge - Core Engine
========================
Ponte de comunicação entre o Core Engine Python e as aplicações externas.
Expõe endpoints REST e WebSocket para integração.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Optional
from contextlib import asynccontextmanager

# FastAPI e dependências
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Importar Core Engine
import sys
sys.path.append('../python')
from main import AppleAssistantCore, ProblemType

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Modelos Pydantic

class CreateSessionRequest(BaseModel):
    email: Optional[str] = Field(None, description="E-mail do Apple ID (opcional)")


class CreateSessionResponse(BaseModel):
    session_id: str
    created_at: str
    status: str


class DiagnosisRequest(BaseModel):
    session_id: str
    problem_type: str = Field(..., description="Tipo do problema")
    has_proof_of_purchase: bool = Field(False, description="Possui comprovante de compra")
    has_device_access: bool = Field(False, description="Tem acesso ao dispositivo")


class ConsentRequest(BaseModel):
    session_id: str
    email: Optional[str] = None
    consent_given: bool
    user_agent: Optional[str] = None


class ConsentResponse(BaseModel):
    session_id: str
    consent_id: str
    timestamp: str
    recorded: bool


class DiagnosisResponse(BaseModel):
    session_id: str
    diagnosis: Dict
    timestamp: str


class SessionStatusResponse(BaseModel):
    session_id: str
    email: Optional[str]
    problem_type: Optional[str]
    consent_given: bool
    status: str
    created_at: str
    diagnosis: Optional[Dict]


class SystemStatsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    consent_given: int
    diagnoses_completed: int
    problem_type_distribution: Dict[str, int]


class RecoveryGuideResponse(BaseModel):
    problem_type: str
    guide: Dict


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class DeviceCheckRequest(BaseModel):
    imei: str = Field(..., description="IMEI do dispositivo (15 dígitos)")


class DeviceCheckResponse(BaseModel):
    valid: bool
    imei: str
    tac: Optional[str] = None
    carrier: Optional[str] = None
    checksum_valid: bool
    format_valid: bool


class ResetEligibilityRequest(BaseModel):
    has_password: bool = Field(False, description="Se tem a senha do iCloud")
    find_my_status: str = Field("unknown", description="Status do Find My")
    has_proof_of_purchase: bool = Field(False, description="Se tem comprovante")


class ResetEligibilityResponse(BaseModel):
    eligible: bool
    method: Optional[str]
    estimated_time: str
    requires_password: bool
    warnings: List[str]
    steps: List[str]


class ServiceReportRequest(BaseModel):
    client_data: Dict
    device_data: Dict
    service_data: Dict


class ServiceReportResponse(BaseModel):
    report_id: str
    generated_at: str
    title: str
    disclaimer: str
    client: Dict
    device: Dict
    service: Dict
    signatures: Dict


# Instância global do Core
app_core: Optional[AppleAssistantCore] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciador de ciclo de vida da aplicação"""
    # Startup
    global app_core
    app_core = AppleAssistantCore()
    logger.info("✓ Core Engine inicializado")
    
    yield
    
    # Shutdown
    logger.info("✓ Encerrando Core Engine")


# Criar aplicação FastAPI
app = FastAPI(
    title="Apple ID Assistant - Core Engine API",
    description="API para assistência de recuperação Apple ID",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens exatas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Endpoints REST ====================

@app.get("/", response_model=Dict)
async def root():
    """Endpoint raiz - informações da API"""
    return {
        "name": "Apple ID Assistant - Core Engine",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "sessions": "/api/sessions",
            "diagnosis": "/api/diagnosis",
            "consent": "/api/consent",
            "guides": "/api/guides",
            "stats": "/api/stats"
        },
        "documentation": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=Dict)
async def health_check():
    """Endpoint de verificação de saúde"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "core_initialized": app_core is not None
    }


@app.post("/api/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """
    Cria uma nova sessão de usuário
    
    - **email**: E-mail do Apple ID (opcional)
    - Retorna session_id único para rastreamento
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    try:
        result = app_core.create_session(request.email)
        logger.info(f"Nova sessão criada via API: {result['session_id']}")
        return CreateSessionResponse(**result)
    except Exception as e:
        logger.error(f"Erro ao criar sessão: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session(session_id: str):
    """
    Retorna status de uma sessão específica
    
    - **session_id**: ID da sessão
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    result = app_core.get_session_status(session_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return SessionStatusResponse(**result)


@app.post("/api/diagnosis", response_model=DiagnosisResponse)
async def perform_diagnosis(request: DiagnosisRequest):
    """
    Realiza diagnóstico do problema
    
    - **session_id**: ID da sessão
    - **problem_type**: Tipo do problema (forgot-password, two-factor, etc.)
    - **has_proof_of_purchase**: Se possui comprovante de compra
    - **has_device_access**: Se tem acesso físico ao dispositivo
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    try:
        result = app_core.diagnose_problem(
            request.session_id,
            request.problem_type,
            request.has_proof_of_purchase,
            request.has_device_access
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"Diagnóstico realizado: {request.session_id}")
        return DiagnosisResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro no diagnóstico: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/consent", response_model=ConsentResponse)
async def record_consent(request: ConsentRequest, req: Request):
    """
    Registra consentimento do usuário
    
    - **session_id**: ID da sessão
    - **email**: E-mail do usuário
    - **consent_given**: Se o consentimento foi dado
    - Registra IP e timestamp automaticamente
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    # Capturar IP do cliente
    client_ip = req.client.host if req.client else "unknown"
    
    try:
        result = app_core.record_consent(
            request.session_id,
            request.email,
            request.consent_given,
            client_ip
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"Consentimento registrado: {request.session_id} - IP: {client_ip}")
        return ConsentResponse(**result)
    
    except Exception as e:
        logger.error(f"Erro ao registrar consentimento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/guides/{problem_type}", response_model=RecoveryGuideResponse)
async def get_recovery_guide(problem_type: str):
    """
    Retorna guia de recuperação específico
    
    - **problem_type**: Tipo do problema
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    guide = app_core.get_recovery_guide(problem_type)
    
    if "error" in guide:
        raise HTTPException(status_code=404, detail=guide["error"])
    
    return RecoveryGuideResponse(
        problem_type=problem_type,
        guide=guide
    )


@app.get("/api/stats", response_model=SystemStatsResponse)
async def get_stats():
    """Retorna estatísticas do sistema"""
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    stats = app_core.get_stats()
    return SystemStatsResponse(**stats)


@app.post("/api/devices/check", response_model=DeviceCheckResponse)
async def check_device(request: DeviceCheckRequest):
    """
    Verifica status de um dispositivo pelo IMEI
    
    - **imei**: IMEI do dispositivo (15 dígitos)
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    try:
        result = app_core.check_device_status(request.imei)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"Dispositivo verificado: {result['imei']}")
        return DeviceCheckResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar dispositivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/devices/reset-eligibility", response_model=ResetEligibilityResponse)
async def check_reset_eligibility(request: ResetEligibilityRequest):
    """
    Verifica elegibilidade para reset do dispositivo
    
    - **has_password**: Se tem a senha do iCloud
    - **find_my_status**: Status do Find My (on/off/unknown)
    - **has_proof_of_purchase**: Se tem comprovante de compra
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    try:
        result = app_core.validate_reset_eligibility(
            request.has_password,
            request.find_my_status,
            request.has_proof_of_purchase
        )
        
        logger.info(f"Elegibilidade verificada: {result['method']}")
        return ResetEligibilityResponse(**result)
    
    except Exception as e:
        logger.error(f"Erro ao verificar elegibilidade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/service-report", response_model=ServiceReportResponse)
async def generate_report(request: ServiceReportRequest):
    """
    Gera relatório de serviço profissional
    
    - **client_data**: Dados do cliente
    - **device_data**: Dados do dispositivo
    - **service_data**: Dados do serviço
    """
    if not app_core:
        raise HTTPException(status_code=503, detail="Core Engine não inicializado")
    
    try:
        result = app_core.generate_service_report(
            request.client_data,
            request.device_data,
            request.service_data
        )
        
        logger.info(f"Relatório gerado: {result['report_id']}")
        return ServiceReportResponse(**result)
    
    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WebSocket ====================

class ConnectionManager:
    """Gerenciador de conexões WebSocket"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Cliente WebSocket conectado: {client_id}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Cliente WebSocket desconectado: {client_id}")
    
    async def send_message(self, client_id: str, message: Dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: Dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    Endpoint WebSocket para comunicação em tempo real
    
    Mensagens suportadas:
    - create_session: Criar nova sessão
    - diagnose: Realizar diagnóstico
    - get_status: Obter status da sessão
    """
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receber mensagem
            data = await websocket.receive_json()
            action = data.get("action")
            
            logger.info(f"Ação WebSocket recebida: {action} - Cliente: {client_id}")
            
            if action == "create_session":
                email = data.get("email")
                result = app_core.create_session(email)
                await manager.send_message(client_id, {
                    "type": "session_created",
                    "data": result
                })
            
            elif action == "diagnose":
                result = app_core.diagnose_problem(
                    data.get("session_id"),
                    data.get("problem_type"),
                    data.get("has_proof_of_purchase", False),
                    data.get("has_device_access", False)
                )
                await manager.send_message(client_id, {
                    "type": "diagnosis_complete",
                    "data": result
                })
            
            elif action == "get_status":
                result = app_core.get_session_status(data.get("session_id"))
                await manager.send_message(client_id, {
                    "type": "session_status",
                    "data": result
                })
            
            elif action == "ping":
                await manager.send_message(client_id, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            
            else:
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": f"Ação desconhecida: {action}"
                })
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Erro WebSocket: {e}")
        manager.disconnect(client_id)


# ==================== Tratamento de Erros ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global de exceções"""
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "detail": str(exc) if app.debug else "Contate o suporte técnico"
        }
    )


# ==================== Inicialização ====================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("Apple ID Assistant - Core Engine API")
    print("=" * 60)
    print("\nIniciando servidor...")
    print("Documentação: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("WebSocket: ws://localhost:8000/ws/{client_id}")
    print("\n" + "=" * 60)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
