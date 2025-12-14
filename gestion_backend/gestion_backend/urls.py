from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from partes import views as partes_views
from carros import views as carros_views
from usuarios import views as usuarios_views
from inventario.views import MaterialViewSet #
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = routers.DefaultRouter()
router.register(r'tipos-emergencia', partes_views.TipoEmergenciaViewSet)
router.register(r'subtipos-emergencia', partes_views.SubTipoEmergenciaViewSet)
router.register(r'partes', partes_views.ParteViewSet)
router.register(r'asistencias-carros', partes_views.AsistenciaCarroViewSet)
router.register(r'asistencias-bomberos', partes_views.AsistenciaBomberoViewSet)
router.register(r'carros', carros_views.CarroViewSet)
router.register(r'bomberos', usuarios_views.BomberoViewSet)
router.register(r'materiales', MaterialViewSet)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # --- RUTAS DE LOGIN ---
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]