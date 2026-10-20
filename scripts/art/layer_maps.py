"""
Mapa de camadas de cada guia do Recraft (índice do <path> no SVG → camada).

Índices conferidos nas folhas de contato (cada path destacado). Campos de cada regra:
  layer    camada de destino            paths    índices dos <path> do guia
  outline  ganha contorno próprio       solid    fecha buracos (forma completa)
  fill     cor forçada (ex.: degradê)   role     papel da cor (fur, fur-light, spot, pink, ...)
  pick     filtra peças pelo centróide  extend_up  estende para cima (corpo sob a cabeça)
  merge    junta os paths numa forma só    opacity  transparência (lente)
  op="floppy_ears" corta orelhas caídas por polígono (ear_poly da esquerda, espelhado)
  op="head_ears"  separa cabeça/orelhas pontudas por elipse (ear_top, ears_layer)
`lines` roteia os traços recuperados da silhueta (bigodes, armação...) por caixa.
"""
from shapely.geometry import box

# Ordem de desenho padrão (cão: orelhas caídas NA FRENTE da cabeça — decisão do Pedro).
Z_ORDER = [
    "tail", "body", "body-spots", "belly", "neck-accessory",
    "head", "head-spots", "muzzle", "mouth", "nose", "eyes", "whiskers",
    "ears", "face-accessory",
]
# Gato: orelha pontuda ATRÁS da cabeça (na frente viraria "adesivo" atravessando a testa).
Z_CAT = [
    "tail", "body", "body-spots", "belly", "neck-accessory",
    "ears", "head", "head-spots", "muzzle", "mouth", "nose", "eyes", "whiskers",
    "face-accessory",
]

MODELS = {
    "gatto-europeo": {
        "species": "gatto",
        "breed": "europeo",
        "guide": "gatto-europeo-guia.svg",
        "silhouette": 1,
        "drop": [0, 2],
        "z": Z_CAT,
        "layers": [
            {"layer": "head", "paths": [3], "op": "head_ears", "ear_top": 260, "ears_layer": "ears", "outline": True},
            {"layer": "ears", "paths": [11, 12], "role": "pink"},
            {"layer": "muzzle", "paths": [4], "solid": True, "role": "fur-light"},
            {"layer": "nose", "paths": [5], "role": "pink"},
            {"layer": "mouth", "paths": [6], "role": "line"},
            {"layer": "whiskers", "paths": [7, 8, 9, 10], "role": "line"},
            {"layer": "eyes", "paths": [13, 14, 15, 16, 17, 18], "role": "eye"},
            {"layer": "body", "paths": [25, 26], "outline": True},
            {"layer": "body", "paths": [23, 24], "outline": True},
            {"layer": "body", "paths": [19], "outline": True, "extend_up": 60},
            {"layer": "belly", "paths": [20], "solid": True, "role": "fur-light"},
            {"layer": "tail", "paths": [21], "outline": True},
            {"layer": "neck-accessory", "paths": [22], "outline": True, "role": "bandana"},
        ],
    },
    "gatto-siamese": {
        "species": "gatto",
        "breed": "siamese",
        "guide": "gatto-siamese-guia.svg",
        "silhouette": 1,
        "drop": [0, 19],
        "z": Z_CAT,
        "layers": [
            {"layer": "head", "paths": [2], "outline": True},
            {"layer": "head-spots", "paths": [3], "role": "spot"},
            {"layer": "ears", "paths": [21, 23], "merge": True, "outline": True, "fill": "#7d4217", "role": "spot"},
            {"layer": "ears", "paths": [20, 24], "merge": True, "outline": True, "fill": "#7d4217", "role": "spot"},
            {"layer": "ears", "paths": [20, 21], "role": "pink"},
            {"layer": "mouth", "paths": [4, 5, 6], "role": "line"},
            {"layer": "nose", "paths": [7], "role": "pink"},
            {"layer": "eyes", "paths": [8, 9, 10, 11, 12, 13], "role": "eye"},
            {"layer": "body", "paths": [25, 26, 27, 28], "outline": True, "role": "spot"},
            {"layer": "body", "paths": [14], "outline": True, "extend_up": 60},
            {"layer": "body-spots", "paths": [15, 16], "role": "fur-shade"},
            {"layer": "neck-accessory", "paths": [17, 18], "role": "fur-shade"},  # sombra da coleira
            {"layer": "tail", "paths": [22], "outline": True, "role": "spot"},
            {"layer": "neck-accessory", "paths": [30, 31, 29], "outline": True, "role": "collar"},
        ],
        # Bigodes só existem na silhueta (saem para fora da cabeça).
        "lines": [{"box": box(150, 400, 400, 560), "layer": "whiskers"},
                  {"box": box(620, 400, 880, 560), "layer": "whiskers"}],
    },
    "cane-beagle": {
        "species": "cane",
        "breed": "beagle",
        "guide": "cane-beagle-guia.svg",
        "silhouette": 1,
        "drop": [0, 10, 27, 28],
        "layers": [
            {"layer": "head", "paths": [2], "op": "floppy_ears", "ears_layer": "ears", "outline": True,
             "ear_poly": [(200, 180), (420, 190), (400, 280), (424, 460), (440, 640), (200, 640)]},
            {"layer": "head", "paths": [25, 26], "outline": True},
            {"layer": "head-spots", "paths": [3], "role": "spot"},
            {"layer": "muzzle", "paths": [7], "solid": True, "role": "white"},
            {"layer": "mouth", "paths": [12, 8, 9], "role": "line"},
            {"layer": "nose", "paths": [11], "role": "line"},
            {"layer": "eyes", "paths": [14, 15, 16, 18, 19, 20], "role": "eye"},
            {"layer": "face-accessory", "paths": [13, 17], "role": "lens", "outline": True, "solid": False, "opacity": 0.35},
            {"layer": "body", "paths": [21, 23], "outline": True, "role": "white"},
            {"layer": "body", "paths": [4], "outline": True, "extend_up": 60, "role": "white"},
            {"layer": "body-spots", "paths": [5, 6, 22, 24], "role": "spot"},
        ],
        "lines": [{"box": box(320, 270, 705, 430), "layer": "face-accessory"},
                  {"box": box(0, 600, 1024, 1024), "layer": "body"}],
        "lines_default": "head-spots",
    },
    "cane-pug": {
        "species": "cane",
        "breed": "pug",
        "guide": "cane-pug-guia.svg",
        "silhouette": 1,
        "drop": [0, 27, 28],
        "layers": [
            {"layer": "head", "paths": [2], "outline": True},
            {"layer": "head-spots", "paths": [14, 15, 16], "role": "line"},
            {"layer": "muzzle", "paths": [3], "solid": True, "role": "spot"},
            {"layer": "nose", "paths": [4], "role": "line"},
            {"layer": "mouth", "paths": [5], "role": "line"},
            {"layer": "eyes", "paths": [6, 7, 8, 9, 10, 11, 12, 13], "role": "eye"},
            {"layer": "ears", "paths": [18, 19], "outline": True, "role": "spot"},
            {"layer": "body", "paths": [21, 22], "outline": True},
            {"layer": "body", "paths": [17], "outline": True, "extend_up": 60},
            {"layer": "body", "paths": [20], "outline": True},
            {"layer": "neck-accessory", "paths": [24, 25, 26, 23], "outline": True, "role": "collar"},
        ],
        "lines": [{"box": box(0, 600, 1024, 1024), "layer": "body"}],
        "lines_default": "head-spots",
    },
    "cane-labrador": {
        "species": "cane",
        "breed": "labrador",
        "guide": "cane-labrador-guia.svg",
        "silhouette": 1,
        "min_line_area": 250,  # sobras da textura do guia
        # destaques, pintinhas de textura e a mancha laranja da testa (22) saem: estilo chapado.
        "drop": [0, 3, 4, 8, 9, 10, 12, 15, 22, *range(23, 36), 42, 43, 44, 49, 50],
        "layers": [
            {"layer": "head", "paths": [2], "op": "floppy_ears", "ears_layer": "ears", "outline": True, "fill": "#f2b74f",
             "ear_poly": [(120, 80), (430, 120), (370, 240), (330, 400), (320, 560), (120, 560)]},
            {"layer": "ears", "paths": [5, 6, 7], "role": "fur-shade"},
            {"layer": "nose", "paths": [11, 13], "role": "line"},
            {"layer": "mouth", "paths": [21], "role": "line"},
            {"layer": "eyes", "paths": [14, 16, 17, 18, 19, 20], "role": "eye"},
            {"layer": "body", "paths": [36], "outline": True, "extend_up": 60},
            {"layer": "body-spots", "paths": [37, 40, 41, 45], "role": "fur-shade"},
            # 38/39 = sombra que a coleira projeta no peito: só existe com a coleira.
            {"layer": "neck-accessory", "paths": [38, 39], "role": "fur-shade"},
            {"layer": "neck-accessory", "paths": [47, 48, 46], "outline": True, "role": "collar"},
        ],
        "lines": [{"box": box(0, 600, 1024, 1024), "layer": "body"}],
        "lines_default": "head-spots",
    },
}
