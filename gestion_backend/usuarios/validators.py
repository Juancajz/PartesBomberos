import re
from django.core.exceptions import ValidationError
from itertools import cycle

def validar_rut_chileno(value):
    if not value:
        return
    
    rut = value.upper().replace("-", "").replace(".", "")
    if not re.match(r"^\d{7,8}[0-9K]$", rut):
        raise ValidationError("Formato de RUT inválido.")
    
    cuerpo = rut[:-1]
    dv = rut[-1]
    
    reverso = map(int, reversed(cuerpo))
    factores = cycle(range(2, 8))
    suma = sum(d * f for d, f in zip(reverso, factores))
    res = 11 - (suma % 11)
    
    esperado = 'K' if res == 10 else '0' if res == 11 else str(res)
    
    if dv != esperado:
        raise ValidationError("El RUT ingresado no es válido.")

def validar_telefono_chileno(value):
    if not value:
        return
    
    # Valida formato +569XXXXXXXX
    reg = r"^\+569\d{8}$"
    if not re.match(reg, value):
        raise ValidationError("El teléfono debe tener el formato +56912345678")