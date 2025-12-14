from rest_framework import permissions

# --- 1. Definición de Grupos de Rango ---
class Roles:
    ALTO_MANDO = ['SUPERINTENDENTE', 'VICESUPERINTENDENTE']
    OFICIALES_MAYORES = ['DIRECTOR', 'CAPITAN', 'SECRETARIOGENERAL', 'TESOREROGENERAL']
    COMANDANCIA = ['COMANDANTE', 'SEGUNDOCOMANDANTE']
    OFICIALES_SUBALTERNOS = ['TENIENTEPRIMERO', 'TENIENTESECUNDO', 'TENIENTETERCERO', 'AYUDANTE', 'SECRETARIO', 'TESORERO']
    VOLUNTARIOS = ['VOLUNTARIO']
    TODOS_MANDO = ALTO_MANDO + OFICIALES_MAYORES + COMANDANCIA + OFICIALES_SUBALTERNOS

# --- 2. Clases de Permisos Personalizados ---

class EsAltoMandoOMayor(permissions.BasePermission):
    """Permite acceso total a Superintendencia/Vice. Los Superusuarios también pasan."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.rango in Roles.ALTO_MANDO

class EsOficialMayorOSubalterno(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.rango in Roles.TODOS_MANDO
        
class EsComandanciaSoloLectura(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.rango in Roles.ALTO_MANDO + Roles.OFICIALES_MAYORES:
             return True
        if request.user.rango in Roles.COMANDANCIA:
            return request.method in permissions.SAFE_METHODS
        return False

class PermisoGestionPersonal(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.rango in Roles.ALTO_MANDO:
            return True
        if request.user.rango in Roles.COMANDANCIA + Roles.OFICIALES_MAYORES:
            return request.method in permissions.SAFE_METHODS
        return False
    
class PermisoInventarioCRUD(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        crud_roles = Roles.ALTO_MANDO + Roles.OFICIALES_MAYORES + Roles.OFICIALES_SUBALTERNOS
        if request.user.is_staff or request.user.rango in crud_roles:
            return True
        if request.user.rango in Roles.COMANDANCIA:
            return request.method in permissions.SAFE_METHODS
        return False
    
class PermisoPartes(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            return True 
        roles_con_crud = Roles.TODOS_MANDO 
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_staff or request.user.rango in roles_con_crud
        return False

class PermisoMasterData(permissions.BasePermission):

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        crud_roles = Roles.ALTO_MANDO + Roles.OFICIALES_MAYORES
        read_only_roles = Roles.COMANDANCIA + Roles.OFICIALES_SUBALTERNOS + Roles.VOLUNTARIOS
        if request.user.is_staff or request.user.rango in crud_roles:
            return True
        if request.user.rango in read_only_roles:
            return request.method in permissions.SAFE_METHODS
        return False