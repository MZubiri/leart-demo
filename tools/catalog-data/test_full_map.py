import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

image_mapping = {
    # Grupo 1
    'MOC0049': '915f5476-74ff-468e-92fc-3f73cd75edc5.png',     # Altar enamorados
    'CN00133-A': '84feb517-4fe2-494f-b7ed-4f8c7910d36d.png',   # Arbol Sakura
    'MOC4034': '28fb4712-de07-4428-b711-ac1fdc81068a.png',     # Barbacoa
    'MOC4091': '55596977-1ab7-4b2b-9d96-282363e33081.png',     # Bateria
    'MOC4081-A': 'afd657cf-eae8-4c5d-88e3-09db8c3f61e8.png',   # Cancha Basquet
    'LEA-0001': '1a75b290-9657-4c33-915c-76bd83113eb9.png',    # Cancha Futbol
    '353682': 'e1fee930-56e5-4d80-94e0-7127321c2974.png',      # Escritorio Gamer
    'LEA-0002': 'c72527d6-26c5-403d-8365-5ad6e2bd4d80.png',    # Fogata de Recuerdos
    'MPA001': '0ea7c0ee-26b7-4829-a278-1f271e68a988.png',      # Mini Parque
    '62349712': '7bbb7996-777e-4368-8997-b600e6455116.png',    # Minibillar
    '316200': 'ea4a113e-31c7-458d-921a-786a06bb88a2.png',      # Modo Velocidad
    '886993675': '96e3c92c-8c15-4b7b-ada3-fdfc4b88c2cd.png',   # Navegando Juntos
    '214030': '3f210ffd-191a-43b4-90ae-3c160d917346.png',      # Parque Diversiones
    '91401': '1dd35a46-3c22-49ca-8b29-0b3598fc4ab9.png',       # Rayo Azul
    '91402': '46ad66c4-1926-4dbf-b79c-6577283e2596.png',       # Rayo Blanco
    '91404': '39883bba-ec0b-4a97-b51d-a867041ed255.png',       # Rayo Rojo
    'MOC0030-A': '3fa135ed-b2e9-47fa-a0c7-6fee7b38394d.png',   # Work Space
    'MOC0017-A': 'c80919b7-55ac-4e2f-a021-fe6ca35ec9b2.jpg',   # Cita bajo el Farol (Inactivo)

    # Grupo 2
    '163273': '520a314b-8ab9-418a-9550-1d013f1794fe.png',      # Amor Rodante
    '8974-4': '18f2f123-6c81-4c34-9c59-fb4d7074492d.png',      # Barbería
    'B10-74': '332c4438-e7e6-4894-bc15-9624ff417095.png',      # BBC
    'LEA-0004': '4158bd8a-a71e-4033-baaa-15fc1bccc947.png',    # Cita en el HotDog
    'MOC4145': '48f15862-6c36-493c-a0e7-b55d1fc54d8d.png',     # Columpio
    '52706390907': '48499fd1-79fc-4291-ad14-776a32ed285b.png', # Jardin Secreto
    '163257': '84e1b978-41e4-4775-a1cf-f098dbeacb7c.png',      # Modo Aventura
    'MOC0009': 'c0a1d640-6a3b-468d-8ac2-65b074e1e2aa.png',     # Piano
    'MOC0021-P': 'b9c3ab23-f237-4574-a4f7-5ef529361cb8.png',   # Salita familiar
    'T18741': 'f542f8e5-57a3-447a-8700-cb747558f0be.png',      # Semillas de Amor

    # Grupo 3
    '4901131696': 'b2e82c07-cb1f-4445-be15-74f524d98985.png',  # Cascada Tropical
    '401118404': '243775c4-7b83-46fe-9189-bcb9c7126e19.png',   # Cita en el Cafe
    '99P-ZZ': '0012f611-7622-45c5-bc55-fef41e6442dc.png',      # Cita en Otoño
    'CFLS002': 'fa4e6831-946a-475c-a866-f86409bf6ed2.png',     # Cita entre Flores
    '7788953028': 'a7673a75-6512-47dd-8dcd-0ec55ad872ed.png',  # Parque de los Novios
    '6704132905': '7ee002c8-dcd0-452b-afb3-c023d94cc4e6.png',  # Pisciencanto
    'MOC4085': 'cf62cf7f-4368-4195-a69d-ffbca41f12cd.png',     # Sala Juntas
    '1568056459': '9555fbdb-be08-4e14-a3f2-646b37d924fb.png',  # Sala Premium
    '89644': '6fdb0ac4-426f-4e27-bac0-6ddaf70a4bd2.png',       # Set Astronauta
    '89698': '8d92d88a-5ef5-4abd-aa8d-d466d3460ec0.png',       # Set Cocina
    '89695': '21c21329-083f-488c-8674-b193e95c1f2a.png',       # Set Consultorio
    'D610001': 'd61b635d-0599-4f0c-8050-bf935bf97428.png',     # Set Dentista
    '89691': '34cc4235-9592-40ff-8ef2-0b470504ca8e.png',       # Set Estudio Arte
    '89697': '003c24d6-8918-4aec-8583-c4f59a045131.png',       # Set Fotografía
    '89696': '28c7a5b5-6118-4db4-a29c-1fd288c86351.png',       # Set Laboratorio
    '89692': '10d4848f-a100-4327-8016-1524d33919d3.png',       # Set Mini Carreras
    '89693': '53a912a7-d25e-4281-b2e1-f95cadbccf38.png',       # Set Musico

    # Grupo 4
    '96697378638': '49b5d8bf-3c18-4785-adfa-77d4574d13f1.png', # Camping
    'MOC169562': '4af8d6ef-79eb-4bb0-8dce-915751a36f31.jpg',   # Corazón Latente
    'LEA-0006': 'c0015487-850f-4e69-ba49-f0f11976840e.jpg',    # Escapada Natural
    '5503286775': 'c0015487-850f-4e69-ba49-f0f11976840e.jpg',  # Rincon del Lago
    'MOC4098': '4af8d6ef-79eb-4bb0-8dce-915751a36f31.jpg',     # Vaiven del Amor

    # Especiales
    'DK7025': '4af8d6ef-79eb-4bb0-8dce-915751a36f31.jpg',      # Set Casita UP (686 piezas)

    # Mini Box
    'FRE-232806': 'df814d06-067e-4b15-b7b5-9731d683f9ff.png',  # Taller de papá
    '366726': '462fcdf5-8fe1-48a2-8887-faa841811c09.png',      # Mini Fitness
    'B21-44-2': 'f639f9d0-9aa9-4b9a-a278-594ce0a45ed2.png',    # Buena Vibra
}

with open('excel_dump.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

for r in excel_data.get('SETS ARMABLES', []):
    cells = r.get('cells', {})
    row_num = r.get('row')
    if int(row_num) >= 6:
        codigo = cells.get('C' + row_num, '').strip()
        nombre = cells.get('D' + row_num, '').strip()
        grupo = cells.get('A' + row_num, '').strip()
        if codigo in image_mapping:
            print(f"Matched {codigo} ({nombre}) -> {image_mapping[codigo]}")
        elif codigo:
            print(f"NOT matched: {codigo} ({nombre})")

