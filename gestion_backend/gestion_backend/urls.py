from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from partes import views as partes_views
from carros import views as carros_views
from usuarios import views as usuarios_views  
from inventario.views import MaterialViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static

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
    path('api/', include(router.urls)),
    
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)