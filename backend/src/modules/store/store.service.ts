import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Product, Cart, CartItem, Order, OrderItem,
  ProductStatus, OrderStatus,
} from './entities/store.entity';
import {
  CreateProductDto, UpdateProductDto, AddToCartDto, UpdateCartItemDto, CreateOrderDto, UpdateOrderStatusDto,
} from './dto/store.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
  ) {}

  async createProduct(dto: CreateProductDto, userId: string): Promise<Product> {
    const product = this.productRepo.create({ ...dto, createdBy: userId });
    return this.productRepo.save(product);
  }

  async findAllProducts(filters?: { category?: string; productType?: string; grade?: number; search?: string; featured?: boolean }): Promise<Product[]> {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.creator', 'creator')
      .where('p.status = :status', { status: ProductStatus.PUBLISHED });

    if (filters?.category) qb.andWhere('p.category = :category', { category: filters.category });
    if (filters?.productType) qb.andWhere('p.productType = :productType', { productType: filters.productType });
    if (filters?.grade) qb.andWhere('p.grade = :grade', { grade: filters.grade });
    if (filters?.featured) qb.andWhere('p.isFeatured = true');
    if (filters?.search) {
      qb.andWhere('(p.title ILIKE :search OR p.description ILIKE :search OR p.tags::text ILIKE :search)', { search: `%${filters.search}%` });
    }

    qb.orderBy('p.isFeatured', 'DESC').addOrderBy('p.createdAt', 'DESC');
    return qb.getMany();
  }

  async findMyProducts(userId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { createdBy: userId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['creator'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto, userId: string, userRole: string): Promise<Product> {
    const product = await this.findProductById(id);
    if (product.createdBy !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('You can only edit your own products');
    }
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string, userId: string, userRole: string): Promise<void> {
    const product = await this.findProductById(id);
    if (product.createdBy !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only delete your own products');
    }
    await this.productRepo.remove(product);
  }

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, totalAmount: 0 });
      cart = await this.cartRepo.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const product = await this.findProductById(dto.productId);
    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Product is not available for purchase');
    }
    if (product.stock <= 0 && product.productType !== 'e_book' && product.productType !== 'course_access') {
      throw new BadRequestException('Product is out of stock');
    }

    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId, totalAmount: 0 });
      cart = await this.cartRepo.save(cart);
    }

    let existingItem = await this.cartItemRepo.findOne({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existingItem) {
      existingItem.quantity += dto.quantity || 1;
      await this.cartItemRepo.save(existingItem);
    } else {
      const newItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity || 1,
        unitPrice: Number(product.price),
      });
      await this.cartItemRepo.save(newItem);
    }

    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = await this.cartItemRepo.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = await this.cartItemRepo.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.cartItemRepo.remove(item);
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    await this.cartItemRepo.delete({ cartId: cart.id });
    cart.totalAmount = 0;
    await this.cartRepo.save(cart);
    return cart;
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const taxAmount = subtotal * 0.16;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const order = this.orderRepo.create({
      orderNumber,
      userId,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepo.save(order);

    for (const item of cart.items) {
      const orderItem = this.orderItemRepo.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.unitPrice) * item.quantity,
      });
      await this.orderItemRepo.save(orderItem);

      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (product && product.productType !== 'e_book' && product.productType !== 'course_access') {
        product.stock = Math.max(0, product.stock - item.quantity);
        await this.productRepo.save(product);
      }
    }

    await this.clearCart(userId);

    return this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'user'],
    });
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string, userId: string, userRole: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto, userRole: string): Promise<Order> {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only admins can update order status');
    }
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items', 'items.product', 'user'] });
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    if (dto.status === OrderStatus.COMPLETED) {
      order.paidAt = new Date();
      for (const item of order.items) {
        const product = await this.productRepo.findOne({ where: { id: item.productId } });
        if (product) {
          product.salesCount += item.quantity;
          await this.productRepo.save(product);
        }
      }
    }
    return this.orderRepo.save(order);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  private async recalculateCartTotal(cartId: string): Promise<void> {
    const items = await this.cartItemRepo.find({ where: { cartId } });
    const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    await this.cartRepo.update(cartId, { totalAmount: total });
  }
}
