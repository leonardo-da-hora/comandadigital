from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, SAFE_METHODS
from .models import Product, Table, OrderItem, Category
from .serializers import ProductSerializer, TableSerializer, OrderItemSerializer, CategorySerializer

from rest_framework.permissions import BasePermission, AllowAny, IsAuthenticated, IsAdminUser, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class RegisterView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'Preencha o usuário e a senha'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Este usuário já existe'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=username, password=password)
        return Response({'message': 'Conta criada com sucesso'}, status=status.HTTP_201_CREATED)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({
            'username': request.user.username,
            'is_admin': request.user.is_staff
        })

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('-created_at')
    serializer_class = TableSerializer

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        table = self.get_object()
        if table.status == 'closed':
            return Response({'error': 'Cannot add items to a closed table'}, status=status.HTTP_400_BAD_REQUEST)

        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock_quantity < quantity:
            return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Update stock
            product.stock_quantity -= quantity
            product.save()

            # Add or update item in table
            order_item, created = OrderItem.objects.get_or_create(
                table=table,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                order_item.quantity += quantity
                order_item.save()

        serializer = self.get_serializer(table)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def close_table(self, request, pk=None):
        table = self.get_object()
        if table.status == 'closed':
            return Response({'error': 'Table is already closed'}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('payment_method')
        table.status = 'closed'
        if payment_method:
            table.payment_method = payment_method
        table.save()
        serializer = self.get_serializer(table)
        return Response(serializer.data)
