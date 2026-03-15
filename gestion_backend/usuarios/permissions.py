from rest_framework import permissions

# ==============================================================================
# 1. DEFINICIÓN DE ROLES (Deben coincidir con models.py)
# ==============================================================================
class Roles:
    ALTO_MANDO = ['SUPERINTENDENTE', 'VICESUPERINTENDENTE']
    OFICIALES_MAYORES = ['DIRECTOR', 'CAPITAN', 'SECRETARIOGENERAL', 'TESOREROGENERAL']
    COMANDANCIA = ['COMANDANTE', 'SEGUNDOCOMANDANTE']
    OFICIALES_SUBALTERNOS = ['TENIENTEPRIMERO', 'TENIENTESEGUNDO', 'TENIENTETERCERO', 'AYUDANTE', 'SECRETARIO', 'TESORERO']
    VOLUNTARIOS = ['VOLUNTARIO']
    TODOS_MANDO = ALTO_MANDO + OFICIALES_MAYORES + COMANDANCIA + OFICIALES_SUBALTERNOS

# ==============================================================================
# 2. PERMISOS
# ==============================================================================

class PermisoGestionPersonal(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        jefes_con_poder = Roles.ALTO_MANDO + Roles.OFICIALES_MAYORES
        if request.user.is_staff or request.user.rango in jefes_con_poder:
            return True
        if request.method in permissions.SAFE_METHODS: 
            return True
        return False

class PermisoPartes(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # A. TODOS PUEDEN VER 
        if request.method in permissions.SAFE_METHODS:
            return True
        # B. TODOS PUEDEN CREAR 
        if request.method == 'POST':
            return True 
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_staff or request.user.rango in Roles.TODOS_MANDO
        return False

class PermisoInventarioCRUD(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        cargos_bloqueados = ['VOLUNTARIO', 'TESORERO','SECRETARIO']
        if request.user.rango in cargos_bloqueados:
            return False
        if request.user.is_staff or request.user.rango in Roles.TODOS_MANDO:
            return True
        return False

class PermisoMasterData(permissions.BasePermission):
    """
    Controla Tipos de Emergencia (Configuración).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Solo Jefes configuran el sistema
        jefes = Roles.ALTO_MANDO + Roles.OFICIALES_MAYORES
        if request.user.is_staff or request.user.rango in jefes:
            return True
            
        # Todos leen para que carguen los formularios
        return request.method in permissions.SAFE_METHODS

class EsAltoMandoOMayor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.rango in Roles.ALTO_MANDO)

class EsOficialMayorOSubalterno(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.rango in Roles.TODOS_MANDO)