import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Category, Product

# Clear existing products and categories if any
Product.objects.all().delete()
Category.objects.all().delete()

menu = {
    "ESPETINHOS": [
        ("CARNE E QUEIJO", 12.00),
        ("FRANGO E QUEIJO", 11.00),
        ("FRANGO E BACON", 11.00),
        ("CARNE E BACON", 12.00),
        ("MISTÃO", 14.00),
        ("CARNE", 9.00),
        ("FRANGO", 8.00),
        ("BODE", 12.00),
        ("BANANINHA", 12.00),
        ("PICANHA", 15.00),
        ("CHARQUE", 12.00),
        ("SALSICHÃO", 8.00),
        ("QUEIJO COALHO", 9.00),
        ("CORAÇÃO", 10.00),
        ("CUPIM", 13.00),
    ],
    "PETISCOS": [
        ("PASTEZINHO", 12.00),
        ("DADINHO DE QUEIJO", 18.00),
        ("BOLINHO DE CHARQUE", 18.00),
        ("CALABRESA COM FRITAS", 25.00),
        ("CARNE DE SOL COM FRITAS", 38.00),
        ("FRANGO À PASSARINHA", 30.00),
    ],
    "CALDINHOS": [
        ("MACAXEIRA", 10.00),
        ("FEIJÃO", 10.00),
        ("PEIXE", 12.00),
        ("MARISCO", 14.00),
    ],
    "DRINKS": [
        ("COPÃO (SABORES DO DIA)", 20.00),
    ],
    "CERVEJAS": [
        ("HEINEKEN (LONG NECK)", 10.00),
        ("SPATEN (LONG NECK)", 9.00),
        ("BRAHMA LITRINHO", 8.00),
        ("BRAHMA LATÃO", 7.00),
        ("CORONA", 11.00),
    ]
}

for cat_name, items in menu.items():
    category = Category.objects.create(name=cat_name)
    for name, price in items:
        Product.objects.create(
            name=name,
            price=price,
            stock_quantity=100,  # default stock
            category=category
        )

print("Cardápio 'Espetinho Delas' criado com sucesso!")
