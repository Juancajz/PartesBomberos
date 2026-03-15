from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static

# Importamos las vistas de tus apps
from partes import views as partes_views
from carros import views as carros_views
from usuarios import views as usuarios_views  
from inventario.views import MaterialViewSet
from carros.views import obtener_ultimo_km

# Importamos las vistas de JWT (Solo las de la librería)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Configuración del router para ViewSets (CRUD automático)
router = routers.DefaultRouter()
router.register(r'tipos-emergencia', partes_views.TipoEmergenciaViewSet)
router.register(r'subtipos-emergencia', partes_views.SubTipoEmergenciaViewSet)
router.register(r'partes', partes_views.ParteViewSet)
router.register(r'asistencias-carros', partes_views.AsistenciaCarroViewSet)
router.register(r'asistencias-bomberos', partes_views.AsistenciaBomberoViewSet)
router.register(r'carros', carros_views.CarroViewSet)
router.register(r'bomberos', usuarios_views.BomberoViewSet)
router.register(r'materiales', MaterialViewSet)
router.register(r'guardias', usuarios_views.GuardiaNocturnaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # APIs base generadas por el Router
    path('api/', include(router.urls)),
    
    # Dashboard
    path('api/dashboard/', partes_views.dashboard_inicio, name='dashboard-inicio'),
    
    # Autenticación JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Kilometraje
    path('api/carros/<int:carro_id>/ultimo_km/', obtener_ultimo_km, name='ultimo_km'),
    
    # --- RUTAS DE LA CENTRAL DE ALARMAS Y DESPACHO ---
    path('api/despachar/', partes_views.despachar_emergencia, name='despachar-emergencia'),
    path('api/emergencias-activas/', partes_views.obtener_emergencias_activas, name='emergencias-activas'),
    path('api/partes/<int:parte_id>/asignar-responsable/', partes_views.asignar_responsable_parte, name='asignar-responsable'),
]

# Configuración para servir archivos multimedia en modo desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)